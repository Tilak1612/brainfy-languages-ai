# Text-to-speech via NVIDIA Riva TTS (Magpie) on build.nvidia.com.
# Body: {"text": "...", "voice"?: "..."}. Returns a WAV (audio/wav).
from http.server import BaseHTTPRequestHandler
import json
import os
import struct

from _riva import api_key, resolve_function_id, make_auth

TTS_PATTERN = os.environ.get("NVIDIA_TTS_PATTERN", r"magpie|tts")
DEFAULT_VOICE = os.environ.get("NVIDIA_TTS_VOICE") or None
SAMPLE_RATE = 22050


def _wav(pcm: bytes, rate: int) -> bytes:
    # Wrap raw 16-bit mono PCM in a minimal WAV container for browser playback.
    n = len(pcm)
    header = b"RIFF" + struct.pack("<I", 36 + n) + b"WAVE"
    header += b"fmt " + struct.pack("<IHHIIHH", 16, 1, 1, rate, rate * 2, 2, 16)
    header += b"data" + struct.pack("<I", n)
    return header + pcm


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        key = api_key()
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
            auth = make_auth(key, fid)
            resp = rc.SpeechSynthesisService(auth).synthesize(
                text,
                voice_name=voice,
                language_code="en-US",
                encoding=getattr(rc.AudioEncoding, "LINEAR_PCM", 1),
                sample_rate_hz=SAMPLE_RATE,
            )
            self._send(200, "audio/wav", _wav(resp.audio, SAMPLE_RATE))
        except Exception as e:  # noqa: BLE001
            self._send(500, "text/plain", ("error: " + str(e)).encode())

    def _send(self, code: int, ctype: str, body: bytes):
        self.send_response(code)
        self.send_header("content-type", ctype)
        self.send_header("cache-control", "no-store")
        self.end_headers()
        self.wfile.write(body)
