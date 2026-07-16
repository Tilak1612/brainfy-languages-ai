# Shared helpers for the NVIDIA Riva (Nemotron Speech) cloud NIMs on
# build.nvidia.com / NVCF. Follows the nemotron-speech skill: resolve function
# IDs at runtime (never hardcode), authenticate over gRPC with the API key in
# metadata. The key is read from the server environment only.
import json
import os
import re
import urllib.request

NVCF_SERVER = "grpc.nvcf.nvidia.com:443"
FUNCTIONS_URL = "https://api.nvcf.nvidia.com/v2/nvcf/functions?visibility=public,authorized"

_cache: dict[str, str] = {}


def api_key() -> str | None:
    return os.environ.get("NVIDIA_API_KEY")


def resolve_function_id(key: str, pattern: str) -> str:
    """Find an ACTIVE NVCF function whose name matches `pattern` (cached)."""
    if pattern in _cache:
        return _cache[pattern]
    req = urllib.request.Request(FUNCTIONS_URL, headers={"Authorization": "Bearer " + key})
    with urllib.request.urlopen(req, timeout=15) as r:
        data = json.load(r)
    rx = re.compile(pattern, re.I)
    for f in data.get("functions", []):
        if f.get("status") == "ACTIVE" and rx.search(f.get("name", "")):
            _cache[pattern] = f["id"]
            return f["id"]
    raise RuntimeError(f"no ACTIVE NVCF function matched /{pattern}/")


def make_auth(key: str, function_id: str):
    import riva.client as rc

    return rc.Auth(
        use_ssl=True,
        uri=NVCF_SERVER,
        metadata_args=[["function-id", function_id], ["authorization", "Bearer " + key]],
    )
