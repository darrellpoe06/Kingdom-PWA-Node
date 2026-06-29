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
# Deploy (his-hand, on the church 4070 box):
#   python -m venv .venv && . .venv/bin/activate
#   pip install fastapi uvicorn TTS torch   # CUDA build of torch for the 4070
#   python server.py    # serves on :8770; expose via Tailscale, not the public net
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


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/speak")
async def speak(req: Request):
    body = await req.json()
    text = (body.get("text") or "").strip()
    reference = body.get("reference_audio")
    language = body.get("language") or "en"
    if not text:
        return JSONResponse({"error": "text-required"}, status_code=400)
    if not reference:
        return JSONResponse({"error": "reference-required"}, status_code=400)

    try:
        speaker_wav = _decode_reference(reference)
    except Exception as e:  # noqa: BLE001
        return JSONResponse({"error": "bad-reference", "detail": str(e)}, status_code=400)

    try:
        tts = get_tts()
        out_fd, out_path = tempfile.mkstemp(suffix=".wav")
        os.close(out_fd)
        # Few-shot: XTTS conditions on speaker_wav at inference, no training.
        tts.tts_to_file(text=text, speaker_wav=speaker_wav, language=language, file_path=out_path)
        with open(out_path, "rb") as f:
            audio = f.read()
        for p in (speaker_wav, out_path):
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
