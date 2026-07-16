# Speech-to-text via NVIDIA Riva ASR (Parakeet/Canary) on build.nvidia.com.
# Body: raw 16 kHz mono 16-bit PCM (audio/octet-stream). Returns {"text": "..."}.
from http.server import BaseHTTPRequestHandler
import json
import os

from _riva import api_key, resolve_function_id, make_auth

ASR_PATTERN = os.environ.get("NVIDIA_ASR_PATTERN", r"parakeet|canary|nemotron-asr")


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        key = api_key()
        if not key:
            return self._send(503, "text/plain", b"voice not configured")
        try:
            n = int(self.headers.get("content-length") or 0)
            audio = self.rfile.read(n)
            import riva.client as rc

            fid = resolve_function_id(key, ASR_PATTERN)
            auth = make_auth(key, fid)
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
            self._send(500, "text/plain", ("error: " + str(e)).encode())

    def _send(self, code: int, ctype: str, body: bytes):
        self.send_response(code)
        self.send_header("content-type", ctype)
        self.send_header("cache-control", "no-store")
        self.end_headers()
        self.wfile.write(body)
