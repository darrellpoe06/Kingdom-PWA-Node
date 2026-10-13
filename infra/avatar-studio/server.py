# =============================================================================
# avatar-studio -- the SOVEREIGN likeness endpoint (talking portrait, on our GPU)
# =============================================================================
# Darrell, 2026-09-15: "Can I create some sort of AI version of myself, my
# voice, my image and likeness to be the teacher of these lessons... in the
# app?" The voice half already has a home (infra/voice-studio, :8770). This is
# the likeness half: given the lesson AUDIO (already spoken in his cloned
# voice) and his ENROLLED PORTRAIT, render a talking portrait the app can play
# beside the lesson. Nothing leaves the network -- LAN / Tailscale only
# (DATA-AS-EMPOWERMENT). DR-0430.
#
# Contract (model-agnostic, so the lip-sync model can change with no app change):
#   GET  /health -> { ok: true, model, ready }     ready = the model can load NOW
#   POST /render { audio (base64 data URI), portrait (base64 image data URI), person_key }
#        -> video/mp4  with  X-AI-Generated: likeness   (every clip is labelled)
#        400 bad-audio / bad-portrait          413 audio-too-long (budget)
#        429 busy (single-flight lock)         503 model-not-ready (honest, never a fake clip)
#
# THE BRAKES ARE BUILT IN (CLAUDE.md three brakes; DR-0225): a per-request
# BUDGET (AVATAR_MAX_AUDIO_SECONDS, default 900 -- one lesson), a single-flight
# LOCK (a second render while one runs is refused, never queued), and honest
# failure (a missing model returns 503, never a placeholder video). No timer,
# no self-triggering: it renders only when a browser asks.
#
# CONSENT IS UPSTREAM AND ENFORCED HERE TOO: the app only sends a portrait the
# person enrolled themselves (VoiceStudio -> Likeness, recording IS consent);
# this server refuses a request with no person_key, so an anonymous likeness
# can never be rendered, and it stamps every clip AI-generated.
#
# BACKEND: AVATAR_MODEL names a module under backends/ exposing
#   render(audio_path, portrait_path, out_path) -> None
# The default backend (wav2lip) shells out to a Wav2Lip checkout named by
# WAV2LIP_DIR with its checkpoint at WAV2LIP_CHECKPOINT; absent either, /health
# reports ready:false and /render returns 503 with the reason. Swap the model
# by adding a backend file -- the app never changes.
#
# Deploy: driven by infra/church-gpu-node/docker-compose.yml (service
# avatar-studio, :8772). Set VITE_AVATAR_SERVICE_URL in the app to reach it.
import base64
import io
import os
import re
import subprocess
import tempfile
import threading
import wave

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, Response

app = FastAPI()

_lock = threading.Lock()
MAX_AUDIO_SECONDS = float(os.environ.get("AVATAR_MAX_AUDIO_SECONDS", "900"))
MODEL = os.environ.get("AVATAR_MODEL", "wav2lip").strip() or "wav2lip"


class NotReady(Exception):
    """The model cannot serve right now; the reason is the message."""


def _backend():
    """Import the configured backend lazily; NotReady names what is missing."""
    try:
        mod = __import__(f"backends.{MODEL}", fromlist=["render", "ready"])
    except Exception as e:  # noqa: BLE001
        raise NotReady(f"backend {MODEL!r} unavailable: {e}") from e
    if not callable(getattr(mod, "render", None)):
        raise NotReady(f"backend {MODEL!r} exposes no render()")
    return mod


def backend_ready():
    try:
        mod = _backend()
        check = getattr(mod, "ready", None)
        return (True, "") if not callable(check) else check()
    except NotReady as e:
        return (False, str(e))


def _decode_data_uri(data_uri: str, kind: str):
    """Return (bytes, subtype) for a data URI of the expected top-level type."""
    m = re.match(r"data:(%s/[^;]+);base64,(.*)" % re.escape(kind), data_uri or "", re.DOTALL)
    if not m:
        raise ValueError(f"expected a base64 {kind}/* data URI")
    raw = base64.b64decode(m.group(2))
    if not raw:
        raise ValueError("empty payload")
    return raw, m.group(1).split("/", 1)[1]


def _audio_seconds(raw: bytes, subtype: str):
    """Seconds of audio for the budget. WAV is read exactly; other containers
    are estimated from size at 16 kbit/s, which over-estimates and therefore
    refuses early rather than late (a budget that guesses low is no budget)."""
    if subtype in ("wav", "x-wav", "wave"):
        try:
            with wave.open(io.BytesIO(raw)) as w:
                frames, rate = w.getnframes(), w.getframerate()
                return frames / float(rate or 1)
        except Exception:  # noqa: BLE001
            pass
    return len(raw) / 2000.0


@app.get("/health")
def health():
    ready, why = backend_ready()
    return {"ok": True, "model": MODEL, "ready": bool(ready), "why": why if not ready else ""}


@app.post("/render")
async def render(req: Request):
    body = await req.json()
    person_key = (body.get("person_key") or "").strip()
    if not person_key:
        # An anonymous likeness is never rendered: the portrait must belong to
        # a named, self-enrolled person (consent is a row, not a guess).
        return JSONResponse({"error": "person-key-required"}, status_code=400)
    try:
        audio, audio_sub = _decode_data_uri(body.get("audio"), "audio")
    except Exception as e:  # noqa: BLE001
        return JSONResponse({"error": "bad-audio", "detail": str(e)}, status_code=400)
    try:
        portrait, portrait_sub = _decode_data_uri(body.get("portrait"), "image")
    except Exception as e:  # noqa: BLE001
        return JSONResponse({"error": "bad-portrait", "detail": str(e)}, status_code=400)
    seconds = _audio_seconds(audio, audio_sub)
    if seconds > MAX_AUDIO_SECONDS:
        return JSONResponse({"error": "audio-too-long", "seconds": round(seconds, 1), "max": MAX_AUDIO_SECONDS}, status_code=413)
    try:
        mod = _backend()
    except NotReady as e:
        return JSONResponse({"error": "model-not-ready", "detail": str(e)}, status_code=503)
    if not _lock.acquire(blocking=False):
        return JSONResponse({"error": "busy"}, status_code=429)
    paths = []
    try:
        fd, apath = tempfile.mkstemp(suffix="." + ("wav" if "wav" in audio_sub else audio_sub)); os.close(fd); paths.append(apath)
        fd, ppath = tempfile.mkstemp(suffix="." + ("jpg" if portrait_sub in ("jpeg", "jpg") else portrait_sub)); os.close(fd); paths.append(ppath)
        fd, opath = tempfile.mkstemp(suffix=".mp4"); os.close(fd); paths.append(opath)
        with open(apath, "wb") as f:
            f.write(audio)
        with open(ppath, "wb") as f:
            f.write(portrait)
        try:
            mod.render(apath, ppath, opath)
        except NotReady as e:
            return JSONResponse({"error": "model-not-ready", "detail": str(e)}, status_code=503)
        except Exception as e:  # noqa: BLE001
            return JSONResponse({"error": "render-failed", "detail": str(e)}, status_code=500)
        with open(opath, "rb") as f:
            video = f.read()
        if not video:
            return JSONResponse({"error": "render-empty"}, status_code=500)
        return Response(content=video, media_type="video/mp4",
                        headers={"Cache-Control": "no-store", "X-AI-Generated": "likeness", "X-Person-Key": person_key})
    finally:
        _lock.release()
        for p in paths:
            try:
                os.remove(p)
            except OSError:
                pass


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", "8772")))
