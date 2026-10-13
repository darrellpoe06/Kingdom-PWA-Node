# =============================================================================
# test_speak_contract — the studio must SERVE the built-in voice, not refuse it
# =============================================================================
# 2026-09-14 (DR-0401). Darrell said "Yes" to the built-in voice reaching the
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

print("\n=== 2b. The asked PACE reaches the model; nonsense and out-of-range are clamped; 1.0 is not passed ===")
r, f = run({"text":"quickly", "speed": 2}, ["Claribel Dervla"])
assert r.status_code==200 and f.calls[0].get("speed")==2.0, "speed must reach tts_to_file"
r, f = run({"text":"too fast", "speed": 50}, ["Claribel Dervla"])
assert f.calls[0].get("speed")==vs.SPEED_MAX, "an out-of-range pace is clamped"
r, f = run({"text":"plain"}, ["Claribel Dervla"])
assert "speed" not in f.calls[0], "normal pace passes no speed (the model's own default)"
r, f = run({"text":"nonsense", "speed": "fast"}, ["Claribel Dervla"])
assert "speed" not in f.calls[0], "a pace that is not a number is normal pace"
print("  PASS - the voice speaks at the asked pace, within what it says clearly")

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
print("\n=== 6. HIS RECORDING (webm/opus from the browser) is turned into WAV before XTTS (DR-0721) ===")
converted = []
real_to_wav = vs._to_wav
def fake_to_wav(src):
    converted.append(src)
    out = src + ".ref.wav"
    open(out, "wb").write(b"RIFFconverted")
    return out
vs._to_wav = fake_to_wav
uri = "data:audio/webm;codecs=opus;base64," + base64.b64encode(b"webmbytes").decode()
r, f = run({"text":"In the beginning was the Word","reference_audio":uri,"person_key":"darrell","voice":"voice-dp"}, ["Claribel Dervla"])
wav = f.calls[0].get("speaker_wav") or ""
print("  status:", r.status_code, "| converted from:", [c[-5:] for c in converted], "| XTTS got:", wav[-8:])
assert r.status_code==200 and converted and converted[0].endswith(".webm") and wav.endswith(".wav") and f.calls[0].get("speaker") is None
print("  PASS - a webm recording reaches XTTS as WAV, as the clone reference")

print("\n=== 7. iOS records audio/mp4: no longer written to a .wav name ===")
converted.clear()
uri = "data:audio/mp4;base64," + base64.b64encode(b"mp4bytes").decode()
r, f = run({"text":"hi","reference_audio":uri}, ["A"])
assert r.status_code==200 and converted and converted[0].endswith(".m4a")
print("  PASS - mp4 is converted, not mislabelled")

print("\n=== 8. no ffmpeg: a named refusal, never a silent bad read ===")
vs._to_wav = real_to_wav
import shutil
saved_path = os.environ.get("PATH", "")
os.environ["PATH"] = "/nonexistent"
r, f = run({"text":"hi","reference_audio":"data:audio/webm;base64," + base64.b64encode(b"x").decode()}, ["A"])
os.environ["PATH"] = saved_path
print("  status:", r.status_code, "| body:", r.content)
assert r.status_code==400 and r.content["error"]=="bad-reference" and "ffmpeg" in r.content["detail"]
print("  PASS - the studio says it needs ffmpeg")

print("\n=== 9. /health says the studio clones ===")
h = vs.health()
assert h.get("ok") is True and h.get("clone") is True and "xtts" in h.get("model","")
print("  PASS - health:", h)

print("\nALL BEHAVIOURAL CHECKS PASSED against the real handler.")
