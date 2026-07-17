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
ASR_PATTERN = os.environ.get("NVIDIA_ASR_PATTERN", r"parakeet|canary|nemotron-asr")

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


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        key = os.environ.get("NVIDIA_API_KEY")
        if not key:
            return self._send(503, "text/plain", b"voice not configured")
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
                language_code="en-US",
                max_alternatives=1,
                audio_channel_count=1,
                enable_automatic_punctuation=True,
            )
            resp = rc.ASRService(auth).offline_recognize(audio, cfg)
            text = "".join(
                r.alternatives[0].transcript for r in resp.results if r.alternatives
            ).strip()
            self._send(200, "application/json", json.dumps({"text": text}).encode())
        except Exception as e:  # noqa: BLE001
            self._send(500, "text/plain", ("error: " + str(e)[:400]).encode())

    def _send(self, code, ctype, body):
        self.send_response(code)
        self.send_header("content-type", ctype)
        self.send_header("cache-control", "no-store")
        self.end_headers()
        self.wfile.write(body)
