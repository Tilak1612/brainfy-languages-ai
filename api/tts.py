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
import urllib.request

NVCF_SERVER = "grpc.nvcf.nvidia.com:443"
FUNCTIONS_URL = "https://api.nvcf.nvidia.com/v2/nvcf/functions?visibility=public,authorized"
TTS_PATTERN = os.environ.get("NVIDIA_TTS_PATTERN", r"magpie|tts")
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
        try:
            n = int(self.headers.get("content-length") or 0)
            payload = json.loads(self.rfile.read(n) or b"{}")
            text = (payload.get("text") or "").strip()
            voice = payload.get("voice") or DEFAULT_VOICE
            if not text:
                return self._send(400, "text/plain", b"missing text")

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
