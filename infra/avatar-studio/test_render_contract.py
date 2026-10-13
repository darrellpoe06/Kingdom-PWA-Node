# =============================================================================
# test_render_contract -- the likeness studio fails HONESTLY and labels every clip
# =============================================================================
# Proven-to-catch for DR-0430's brakes, run by the JS suite (no Python runner
# in this repo): a fastapi stub lets the REAL handler run.
#   1. no model -> /health ready:false and /render 503 model-not-ready (never a fake clip)
#   2. no person_key -> 400 (an anonymous likeness is never rendered)
#   3. bad inputs -> 400
#   4. over budget -> 413
#   5. a fake backend -> video/mp4 bytes with X-AI-Generated: likeness
#   6. a render in flight -> 429 busy
import sys, types, asyncio, base64, io, wave, threading

fa = types.ModuleType("fastapi")
class FastAPI:
    def get(self, p): return lambda f: f
    def post(self, p): return lambda f: f
class Request: pass
fa.FastAPI = FastAPI; fa.Request = Request
resp = types.ModuleType("fastapi.responses")
class JSONResponse:
    def __init__(self, content, status_code=200): self.content = content; self.status_code = status_code
class Response:
    def __init__(self, content=None, media_type=None, headers=None):
        self.content = content; self.media_type = media_type; self.headers = headers or {}; self.status_code = 200
resp.JSONResponse = JSONResponse; resp.Response = Response
fa.responses = resp
sys.modules["fastapi"] = fa; sys.modules["fastapi.responses"] = resp

import importlib.util, os
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
spec = importlib.util.spec_from_file_location("server", os.path.join(HERE, "server.py"))
srv = importlib.util.module_from_spec(spec); sys.modules["server"] = srv; spec.loader.exec_module(srv)

class Req:
    def __init__(self, body): self._b = body
    async def json(self): return self._b

def wav_uri(seconds, rate=8000):
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(rate); w.writeframes(b"\x00\x00" * int(seconds * rate))
    return "data:audio/wav;base64," + base64.b64encode(buf.getvalue()).decode()

PORTRAIT = "data:image/png;base64," + base64.b64encode(b"\x89PNG fake portrait bytes").decode()

def call(body):
    return asyncio.get_event_loop().run_until_complete(srv.render(Req(body)))

failed = []
def check(name, ok, detail=""):
    print(("PASS  " if ok else "FAIL  ") + name + (f" -- {detail}" if detail else ""))
    if not ok: failed.append(name)

# 1. no model configured (the default state on a box without Wav2Lip)
os.environ.pop("WAV2LIP_DIR", None); os.environ.pop("WAV2LIP_CHECKPOINT", None)
h = srv.health()
check("without a model /health reports ready:false", h["ok"] is True and h["ready"] is False and h["why"], str(h))
r = call({"person_key": "darrell", "audio": wav_uri(1), "portrait": PORTRAIT})
check("without a model /render is 503 model-not-ready, never a fake clip", r.status_code == 503 and r.content.get("error") == "model-not-ready", str(getattr(r, "content", "")))

# 2-4. refusals
r = call({"audio": wav_uri(1), "portrait": PORTRAIT})
check("no person_key -> 400 (an anonymous likeness is never rendered)", r.status_code == 400 and r.content.get("error") == "person-key-required")
r = call({"person_key": "darrell", "audio": "nope", "portrait": PORTRAIT})
check("bad audio -> 400", r.status_code == 400 and r.content.get("error") == "bad-audio")
r = call({"person_key": "darrell", "audio": wav_uri(1), "portrait": "data:text/plain;base64,aGk="})
check("bad portrait -> 400", r.status_code == 400 and r.content.get("error") == "bad-portrait")
srv.MAX_AUDIO_SECONDS = 2.0
r = call({"person_key": "darrell", "audio": wav_uri(5), "portrait": PORTRAIT})
check("over the audio budget -> 413", r.status_code == 413 and r.content.get("error") == "audio-too-long", str(getattr(r, "content", "")))
srv.MAX_AUDIO_SECONDS = 900.0

# 5. a fake backend renders and the clip is labelled
fake = types.ModuleType("backends.fakeback")
def fake_render(a, p, o):
    with open(o, "wb") as f: f.write(b"\x00\x00\x00\x18ftypmp42 fake mp4 bytes")
fake.render = fake_render; fake.ready = lambda: (True, "")
sys.modules["backends.fakeback"] = fake
pkg = types.ModuleType("backends"); pkg.fakeback = fake; sys.modules["backends"] = pkg
srv.MODEL = "fakeback"
h = srv.health()
check("with a backend /health reports ready:true", h["ready"] is True)
r = call({"person_key": "darrell", "audio": wav_uri(1), "portrait": PORTRAIT})
check("a render returns video/mp4 bytes", r.status_code == 200 and r.media_type == "video/mp4" and r.content.startswith(b"\x00\x00\x00\x18ftyp"))
check("every clip is labelled AI-generated", r.headers.get("X-AI-Generated") == "likeness" and r.headers.get("X-Person-Key") == "darrell", str(r.headers))

# 6. single-flight lock
srv._lock.acquire()
r = call({"person_key": "darrell", "audio": wav_uri(1), "portrait": PORTRAIT})
srv._lock.release()
check("a second render while one runs -> 429 busy (never queued)", r.status_code == 429 and r.content.get("error") == "busy")

if failed:
    print(f"\n{len(failed)} CHECK(S) FAILED"); sys.exit(1)
print("\nALL BEHAVIOURAL CHECKS PASSED")
