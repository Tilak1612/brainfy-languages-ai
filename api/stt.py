# Speech-to-text via NVIDIA Riva ASR (Parakeet/Canary) on build.nvidia.com.
# Body: raw 16 kHz mono 16-bit PCM (application/octet-stream). Returns {"text": "..."}.
#
# NOTE: helpers are inlined on purpose — Vercel's Python runtime imports the
# entrypoint with /var/task on sys.path (not /var/task/api), so a sibling
# module import (e.g. `from _riva import ...`) raises ModuleNotFoundError.
from http.server import BaseHTTPRequestHandler
import json
import os
import re
import urllib.request

NVCF_SERVER = "grpc.nvcf.nvidia.com:443"
FUNCTIONS_URL = "https://api.nvcf.nvidia.com/v2/nvcf/functions?visibility=public,authorized"
# Pin an English CTC model by default. A bare /parakeet|canary/ matches
# streaming-only and non-English NIMs (es/vi/zh), which reject offline en
# requests. Override with NVIDIA_ASR_PATTERN.
ASR_PATTERN = os.environ.get("NVIDIA_ASR_PATTERN", r"^ai-parakeet-ctc-1_1b-asr$")
ASR_LANG = os.environ.get("NVIDIA_ASR_LANG", "en-US")
SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
SUPABASE_ANON = os.environ.get("VITE_SUPABASE_ANON_KEY") or os.environ.get("SUPABASE_ANON_KEY")

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


def authenticated_user(headers):
    """Return the caller's user id, "" if no project is configured (demo mode),
    or None if the bearer token is missing/invalid. Voice calls cost money, so
    an unauthenticated caller must not reach NVIDIA."""
    if not SUPABASE_URL or not SUPABASE_ANON:
        return ""  # open demo mode
    token = (headers.get("authorization") or "").replace("Bearer ", "", 1).strip()
    if not token:
        return None
    try:
        req = urllib.request.Request(
            SUPABASE_URL.rstrip("/") + "/auth/v1/user",
            headers={"apikey": SUPABASE_ANON, "Authorization": "Bearer " + token},
        )
        with urllib.request.urlopen(req, timeout=10) as r:
            return json.load(r).get("id") or None
    except Exception:  # noqa: BLE001
        return None


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        key = os.environ.get("NVIDIA_API_KEY")
        if not key:
            return self._send(503, "text/plain", b"voice not configured")
        if authenticated_user(self.headers) is None:
            return self._send(401, "text/plain", b"sign in to use voice")
        try:
            n = int(self.headers.get("content-length") or 0)
            audio = self.rfile.read(n)

            import riva.client as rc

            fid = resolve_function_id(key, ASR_PATTERN)
            auth = rc.Auth(
                use_ssl=True,
                uri=NVCF_SERVER,
                metadata_args=[["function-id", fid], ["authorization", "Bearer " + key]],
            )
            cfg = rc.RecognitionConfig(
                encoding=getattr(rc.AudioEncoding, "LINEAR_PCM", 1),
                sample_rate_hertz=16000,
                language_code=ASR_LANG,
                max_alternatives=1,
                audio_channel_count=1,
                enable_automatic_punctuation=True,
            )
            svc = rc.ASRService(auth)
            try:
                # Offline (whole-file) recognition — preferred when served.
                resp = svc.offline_recognize(audio, cfg)
                text = "".join(
                    r.alternatives[0].transcript for r in resp.results if r.alternatives
                ).strip()
                mode = "offline"
            except Exception:
                # Some NIMs are streaming-only ("Unavailable model ... type=offline").
                # Fall back to a single-shot streaming request.
                chunks = [audio[i : i + 32000] for i in range(0, len(audio), 32000)] or [b""]
                scfg = rc.StreamingRecognitionConfig(config=cfg, interim_results=False)
                text = ""
                for r in svc.streaming_response_generator(audio_chunks=chunks, streaming_config=scfg):
                    for res in r.results:
                        if res.is_final and res.alternatives:
                            text += res.alternatives[0].transcript
                text = text.strip()
                mode = "streaming"
            self._send(200, "application/json", json.dumps({"text": text, "mode": mode}).encode())
        except Exception as e:  # noqa: BLE001
            self._send(500, "text/plain", ("error: " + str(e)[:400]).encode())

    def _send(self, code, ctype, body):
        self.send_response(code)
        self.send_header("content-type", ctype)
        self.send_header("cache-control", "no-store")
        self.end_headers()
        self.wfile.write(body)
