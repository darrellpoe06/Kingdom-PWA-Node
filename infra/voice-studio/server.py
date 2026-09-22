# =============================================================================
# voice-studio — the SOVEREIGN voice endpoint (XTTS-v2 few-shot, on our GPU)
# =============================================================================
# The destination of the bridge-to-sovereign path. Same HTTP contract the app's
# bridge (app/api/voice-speak.js) honors, so the UI/voice slot is UNCHANGED when we
# migrate off the cloud bridge: just point VITE_VOICE_SERVICE_URL at this server.
#
# Runs XTTS-v2 locally on the church 2x RTX 4070 (~3-4GB VRAM at inference, fits
# 12GB easily). Few-shot: conditions on the person's RECORDED sample at inference,
# no per-user training. Nothing leaves the network (DATA-AS-EMPOWERMENT) — reachable
# on the LAN / Tailscale only.
#
# Contract:
#   POST /speak  { text, reference_audio (base64 data URI), language }  -> audio/wav
#   GET  /health -> { ok: true }
#
# Deploy — NOT by hand (DR-0236 / DR-0108). Two channels drive this and neither
# is a person at a keyboard:
#   · the container:  infra/church-gpu-node/docker-compose.yml `voice-studio`,
#     brought up on the 4070 box by .github/workflows/arm-voice-studio.yml,
#     which joins the tailnet with TS_AUTHKEY and verifies by SYNTHESIZING
#     rather than by reading /health.
#   · the road home:  infra/voice-studio/install.sh, run every cycle by the
#     services-sync loop, which finds whichever host is answering and mounts
#     `/voice` on the Funnel so poetech.us can reach it same-origin.
# The commands below remain only as the description of what those two automate.
#   pip install fastapi uvicorn TTS torch   # CUDA build of torch for the 4070
#   python server.py    # serves on :8770; exposed via Tailscale, never the public net
#
# License note: XTTS-v2 weights are CPML (non-commercial). Fine for family/church
# sovereign use. The contract is model-agnostic — swap to F5-TTS / OpenVoice v2
# (MIT) here without any app change if commercial productization needs it.

import base64
import io
import os
import re
import tempfile

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, Response

app = FastAPI()

_tts = None  # lazy-loaded so /health works before the model is warm


def get_tts():
    global _tts
    if _tts is None:
        from TTS.api import TTS  # Coqui TTS
        model = os.environ.get("VOICE_MODEL", "tts_models/multilingual/multi-dataset/xtts_v2")
        device = "cuda" if os.environ.get("VOICE_DEVICE", "cuda") == "cuda" else "cpu"
        _tts = TTS(model).to(device)
    return _tts


def _decode_reference(data_uri: str) -> str:
    """Write the base64 reference sample to a temp wav/webm file; return its path."""
    m = re.match(r"data:(audio/[^;]+);base64,(.*)", data_uri or "", re.DOTALL)
    if not m:
        raise ValueError("reference_audio must be a base64 audio data URI")
    raw = base64.b64decode(m.group(2))
    suffix = ".webm" if "webm" in m.group(1) else (".ogg" if "ogg" in m.group(1) else ".wav")
    fd, path = tempfile.mkstemp(suffix=suffix)
    with os.fdopen(fd, "wb") as f:
        f.write(raw)
    return path


# THE PREFIX IS SERVED BOTH WAYS, AND THE PLAIN ONE IS THE REAL PATH.
#
# The app reaches this studio at same-origin `/voice/speak`, which the Pages
# Function forwards to the Funnel as `/voice/speak`, which a Tailscale path
# mount hands on here. This comment first said that whether the mount STRIPS
# `/voice` was unknowable from this repository. It is not -- it is documented:
# tailscale trims the mount point before proxying, so a mount at `/voice`
# delivers `/speak` and `/health`, as if the service were running at the root.
# "Nothing here can measure it" was a guess wearing DR-0076's clothes; the
# actual discipline is to go and check.
#
# The prefixed aliases stay anyway, and not out of timidity. They cost one
# decorator each, they make the server correct under a proxy that does NOT trim
# (a Caddy handle, a forwarder that passes the path through), and the tax
# server carries exactly the same pair for exactly that reason.
@app.get("/voice/health")
@app.get("/health")
def health():
    return {"ok": True}


@app.post("/voice/speak")
@app.post("/speak")
async def speak(req: Request):
    body = await req.json()
    text = (body.get("text") or "").strip()
    reference = body.get("reference_audio")
    language = body.get("language") or "en"
    if not text:
        return JSONResponse({"error": "text-required"}, status_code=400)
    # THE BUILT-IN VOICE IS SERVED, NOT REFUSED (2026-09-14, DR-0401).
    #
    # Until now this returned 400 the moment no reference sample arrived, which
    # made the studio CLONE-ONLY by construction. DR-0382 had taught the client
    # to ask for the service's own voice -- `allowBuiltIn`, with a runtime probe
    # that remembers the answer -- and shipped it as the DEFAULT read path for
    # the System voice. But no server was ever taught to answer: this endpoint
    # and the vendor bridge BOTH refused, so the probe's first result was
    # guaranteed to be 'no' and every lesson fell to the device robot forever.
    # The client asked a question nothing could say yes to.
    #
    # A reference is required only for a CLONE. A multi-speaker model (XTTS-v2
    # ships a speaker bank) can synthesize from a built-in speaker with no
    # sample at all, which is exactly what the System voice wants.
    #
    # HONEST FAILURE IS PRESERVED. If the loaded model exposes no speaker bank,
    # this still returns the same 400 -- so the probe's 'no' stays TRUE for a
    # deployment that genuinely cannot do it, rather than being papered over.
    # We do not claim a capability we have not asked the model for (DR-0076).
    speaker_wav = None
    builtin_speaker = None
    if not reference:
        try:
            tts = get_tts()
        except Exception as e:  # noqa: BLE001
            return JSONResponse({"error": "synthesis-failed", "detail": str(e)}, status_code=500)
        speakers = getattr(tts, "speakers", None) or []
        if not speakers:
            return JSONResponse({"error": "reference-required"}, status_code=400)
        want = os.environ.get("VOICE_BUILTIN_SPEAKER", "").strip()
        builtin_speaker = want if want in speakers else speakers[0]
    else:
        try:
            speaker_wav = _decode_reference(reference)
        except Exception as e:  # noqa: BLE001
            return JSONResponse({"error": "bad-reference", "detail": str(e)}, status_code=400)

    try:
        tts = get_tts()
        out_fd, out_path = tempfile.mkstemp(suffix=".wav")
        os.close(out_fd)
        # Few-shot: XTTS conditions on speaker_wav at inference, no training.
        # With no sample, the model's own speaker carries it instead.
        if builtin_speaker is not None:
            tts.tts_to_file(text=text, speaker=builtin_speaker, language=language, file_path=out_path)
        else:
            tts.tts_to_file(text=text, speaker_wav=speaker_wav, language=language, file_path=out_path)
        with open(out_path, "rb") as f:
            audio = f.read()
        for p in (speaker_wav, out_path):
            if not p:
                continue
            try:
                os.remove(p)
            except OSError:
                pass
        return Response(content=audio, media_type="audio/wav", headers={"Cache-Control": "no-store"})
    except Exception as e:  # noqa: BLE001
        return JSONResponse({"error": "synthesis-failed", "detail": str(e)}, status_code=500)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", "8770")))
