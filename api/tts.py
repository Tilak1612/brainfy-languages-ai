# Text-to-speech via NVIDIA Riva TTS (Magpie) on build.nvidia.com.
# Body: {"text": "...", "voice"?: "..."}. Returns a WAV (audio/wav).
#
# NOTE: helpers are inlined on purpose — Vercel's Python runtime imports the
# entrypoint with /var/task on sys.path (not /var/task/api), so a sibling
# module import (e.g. `from _riva import ...`) raises ModuleNotFoundError.
from http.server import BaseHTTPRequestHandler
import json
import os
import re
import struct
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone

NVCF_SERVER = "grpc.nvcf.nvidia.com:443"
FUNCTIONS_URL = "https://api.nvcf.nvidia.com/v2/nvcf/functions?visibility=public,authorized"
TTS_PATTERN = os.environ.get("NVIDIA_TTS_PATTERN", r"magpie|tts")
SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
SUPABASE_ANON = os.environ.get("VITE_SUPABASE_ANON_KEY") or os.environ.get("SUPABASE_ANON_KEY")
# Voice is billed per call. Pro gets 60/hr, free 20/day.
PRO_HOURLY_LIMIT = int(os.environ.get("VOICE_HOURLY_LIMIT", "60"))
FREE_DAILY_LIMIT = int(os.environ.get("VOICE_FREE_DAILY_LIMIT", "20"))
DEFAULT_VOICE = os.environ.get("NVIDIA_TTS_VOICE") or None
SAMPLE_RATE = 22050

_fid_cache = {}


def resolve_function_id(key, pattern):
    """Find an ACTIVE NVCF function whose name matches `pattern` (cached)."""
    if pattern in _fid_cache:
        return _fid_cache[pattern]
    req = urllib.request.Request(FUNCTIONS_URL, headers={"Authorization": "Bearer " + key})
    with urllib.request.urlopen(req, timeout=15) as r:
        data = json.load(r)
    rx = re.compile(pattern, re.I)
    for f in data.get("functions", []):
        if f.get("status") == "ACTIVE" and rx.search(f.get("name", "")):
            _fid_cache[pattern] = f["id"]
            return f["id"]
    raise RuntimeError("no ACTIVE NVCF function matched /%s/" % pattern)


def _sb(path, token, method="GET", body=None, extra_headers=None):
    """Call PostgREST as the user, so RLS scopes every row to them."""
    h = {
        "apikey": SUPABASE_ANON,
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json",
    }
    if extra_headers:
        h.update(extra_headers)
    req = urllib.request.Request(
        SUPABASE_URL.rstrip("/") + "/rest/v1/" + path,
        data=json.dumps(body).encode() if body is not None else None,
        headers=h,
        method=method,
    )
    return urllib.request.urlopen(req, timeout=10)


def check_quota(headers, endpoint):
    """
    Authenticate and meter. Returns (user_id, None) when the call may proceed,
    or (None, (status, message)) when it must not.

    These endpoints previously had auth but NO quota, so a single free account
    could loop TTS indefinitely and bill NVIDIA without limit — the unmetered
    flank next to a carefully capped /api/chat.
    """
    # FAIL CLOSED, matching /api/chat: the absence of config must not silently
    # open a paid endpoint to the internet.
    if not SUPABASE_URL or not SUPABASE_ANON:
        if os.environ.get("ALLOW_ANONYMOUS_AI") == "1":
            return "", None
        return None, (401, b"sign in to use voice")

    token = (headers.get("authorization") or "").replace("Bearer ", "", 1).strip()
    if not token:
        return None, (401, b"sign in to use voice")
    try:
        req = urllib.request.Request(
            SUPABASE_URL.rstrip("/") + "/auth/v1/user",
            headers={"apikey": SUPABASE_ANON, "Authorization": "Bearer " + token},
        )
        with urllib.request.urlopen(req, timeout=10) as r:
            uid = json.load(r).get("id")
    except Exception:  # noqa: BLE001
        return None, (401, b"sign in to use voice")
    if not uid:
        return None, (401, b"sign in to use voice")

    try:
        # Pro? Entitlement is the Stripe mirror, which only the webhook writes.
        with _sb("lang_subscriptions?select=status", token) as r:
            rows = json.load(r)
        status = rows[0]["status"] if rows else "none"
        is_pro = status in ("trialing", "active", "past_due")

        window_s = 3600 if is_pro else 86400
        limit = PRO_HOURLY_LIMIT if is_pro else FREE_DAILY_LIMIT
        since = datetime.now(timezone.utc) - timedelta(seconds=window_s)
        q = (
            "lang_api_usage?select=id&endpoint=eq.%s&created_at=gte.%s"
            % (endpoint, urllib.parse.quote(since.isoformat()))
        )
        with _sb(q, token, extra_headers={"Prefer": "count=exact", "Range": "0-0"}) as r:
            rng = r.headers.get("Content-Range", "*/0")
        used = int(rng.split("/")[-1] or 0)
        if used >= limit:
            msg = (
                b"hourly voice limit reached - try again shortly"
                if is_pro
                else b"daily free voice limit reached - upgrade for more"
            )
            return None, (429, msg)

        _sb("lang_api_usage", token, method="POST",
            body={"user_id": uid, "endpoint": endpoint}).close()
    except Exception:  # noqa: BLE001
        # A metering failure must not become free unlimited access.
        return None, (503, b"voice temporarily unavailable")

    return uid, None


def wav(pcm, rate):
    """Wrap raw 16-bit mono PCM in a minimal WAV container for the browser."""
    n = len(pcm)
    h = b"RIFF" + struct.pack("<I", 36 + n) + b"WAVE"
    h += b"fmt " + struct.pack("<IHHIIHH", 16, 1, 1, rate, rate * 2, 2, 16)
    h += b"data" + struct.pack("<I", n)
    return h + pcm


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        key = os.environ.get("NVIDIA_API_KEY")
        if not key:
            return self._send(503, "text/plain", b"voice not configured")
        _uid, deny = check_quota(self.headers, "tts")
        if deny:
            return self._send(deny[0], "text/plain", deny[1])
        try:
            n = int(self.headers.get("content-length") or 0)
            payload = json.loads(self.rfile.read(n) or b"{}")
            text = (payload.get("text") or "").strip()
            voice = payload.get("voice") or DEFAULT_VOICE
            if not text:
                return self._send(400, "text/plain", b"missing text")
            # A tutor reply is a sentence or two; synthesis is billed by length.
            if len(text) > 1000:
                return self._send(400, "text/plain", b"text too long")

            import riva.client as rc

            fid = resolve_function_id(key, TTS_PATTERN)
            auth = rc.Auth(
                use_ssl=True,
                uri=NVCF_SERVER,
                metadata_args=[["function-id", fid], ["authorization", "Bearer " + key]],
            )
            resp = rc.SpeechSynthesisService(auth).synthesize(
                text,
                voice_name=voice,
                language_code="en-US",
                encoding=getattr(rc.AudioEncoding, "LINEAR_PCM", 1),
                sample_rate_hz=SAMPLE_RATE,
            )
            self._send(200, "audio/wav", wav(resp.audio, SAMPLE_RATE))
        except Exception as e:  # noqa: BLE001
            self._send(500, "text/plain", ("error: " + str(e)[:400]).encode())

    def _send(self, code, ctype, body):
        self.send_response(code)
        self.send_header("content-type", ctype)
        self.send_header("cache-control", "no-store")
        self.end_headers()
        self.wfile.write(body)
