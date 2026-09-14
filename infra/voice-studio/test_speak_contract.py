# =============================================================================
# test_speak_contract — the studio must SERVE the built-in voice, not refuse it
# =============================================================================
# 2026-09-14 (DR-0394). Darrell said "Yes" to the built-in voice reaching the
# church's own studio -- and the honest answer was that it never could.
#
# DR-0382 taught the CLIENT to ask: `allowBuiltIn`, a runtime probe that
# remembers the answer, and the System voice (the default nobody changes) routed
# to the studio at use-read-aloud.js:281. But NO SERVER WAS EVER TAUGHT TO
# ANSWER. This endpoint returned 400 "reference-required" the moment no sample
# arrived, and the vendor bridge did the same. So the probe's first result was
# guaranteed 'no', it was remembered, and every lesson fell to the device robot
# permanently. A question nothing could say yes to.
#
# The repo is the deployment, so this was answerable from source the whole time
# -- it never needed "a real read on a real device", which is what the record
# claimed for two months.
#
# There is no Python test runner in this repo; the JS suite is the harness, and
# it shells out to this file (voice-studio-serves-the-built-in-voice.test.js).
# The fastapi stub below lets the REAL handler run, so this is a behavioural
# test of shipped code rather than a source scan.
# =============================================================================
import sys, types, asyncio, json

# --- minimal fastapi stub so the REAL server.py handler can be exercised ---
fa = types.ModuleType("fastapi")
class FastAPI:
    def get(self, p): return lambda f: f
    def post(self, p): return lambda f: f
class Request: pass
fa.FastAPI = FastAPI; fa.Request = Request
resp = types.ModuleType("fastapi.responses")
class JSONResponse:
    def __init__(self, content, status_code=200): self.content=content; self.status_code=status_code
class Response:
    def __init__(self, content=None, media_type=None, headers=None):
        self.content=content; self.media_type=media_type; self.status_code=200
resp.JSONResponse=JSONResponse; resp.Response=Response
fa.responses = resp
sys.modules["fastapi"]=fa; sys.modules["fastapi.responses"]=resp

import importlib.util
spec = importlib.util.spec_from_file_location("vs", "infra/voice-studio/server.py")
vs = importlib.util.module_from_spec(spec); spec.loader.exec_module(vs)

class Req:
    def __init__(self, body): self._b=body
    async def json(self): return self._b

class FakeTTS:
    def __init__(self, speakers): self.speakers=speakers; self.calls=[]
    def tts_to_file(self, **kw):
        self.calls.append(kw)
        open(kw["file_path"],"wb").write(b"RIFFfake")

def run(body, speakers):
    fake = FakeTTS(speakers)
    vs.get_tts = lambda: fake
    r = asyncio.get_event_loop().run_until_complete(vs.speak(Req(body)))
    return r, fake

print("=== 1. System voice (NO reference), model HAS a speaker bank ===")
r, f = run({"text":"For God so loved the world"}, ["Claribel Dervla","Ana Florence"])
print("  status:", r.status_code, "| media:", getattr(r,'media_type',None))
print("  called with speaker=", f.calls[0].get("speaker"), "| speaker_wav=", f.calls[0].get("speaker_wav"))
assert r.status_code==200 and f.calls[0].get("speaker")=="Claribel Dervla", "built-in voice must be SERVED"
print("  PASS - the built-in voice is served")

print("\n=== 2. Honest 'no': model has NO speaker bank ===")
r, f = run({"text":"hello"}, [])
print("  status:", r.status_code, "| body:", r.content)
assert r.status_code==400 and r.content["error"]=="reference-required"
print("  PASS - still refuses honestly, so the probe's 'no' stays TRUE")

print("\n=== 3. A CLONE still requires its sample (unchanged) ===")
import base64
uri = "data:audio/wav;base64," + base64.b64encode(b"fakewav").decode()
r, f = run({"text":"hi","reference_audio":uri}, ["Claribel Dervla"])
print("  status:", r.status_code, "| speaker_wav passed:", bool(f.calls[0].get("speaker_wav")), "| speaker:", f.calls[0].get("speaker"))
assert r.status_code==200 and f.calls[0].get("speaker_wav") and f.calls[0].get("speaker") is None
print("  PASS - clone path untouched")

print("\n=== 4. VOICE_BUILTIN_SPEAKER override honored ===")
import os; os.environ["VOICE_BUILTIN_SPEAKER"]="Ana Florence"
r, f = run({"text":"hi"}, ["Claribel Dervla","Ana Florence"])
print("  chose:", f.calls[0].get("speaker"))
assert f.calls[0].get("speaker")=="Ana Florence"
os.environ.pop("VOICE_BUILTIN_SPEAKER")
print("  PASS")

print("\n=== 5. empty text still 400 ===")
r, f = run({"text":"  "}, ["A"])
assert r.status_code==400 and r.content["error"]=="text-required"
print("  PASS")
print("\nALL BEHAVIOURAL CHECKS PASSED against the real handler.")
