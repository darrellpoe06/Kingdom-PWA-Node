#!/usr/bin/env python3
# =============================================================================
# whisper-gpu -- faster-whisper transcription endpoint on the church RTX 4070
# =============================================================================
# The HARVEST no-caption FALLBACK: most service videos already carry captions, so
# the harvest pipeline reads those for free. This endpoint is for the RARE video
# with NO usable captions -- it transcribes the audio locally on the GPU so no
# media and no text ever leaves the church network (sovereign; DATA-AS-EMPOWERMENT).
#
# Same engine as the existing CPU pipeline (infra/nas-sme-pipeline/transcribe.py);
# this is the GPU-served, on-demand HTTP form. faster-whisper large-v3-turbo on a
# 4070 finishes a 13-min clip in well under a minute (vs >10 min CPU).
#
# Contract (model-agnostic, mirrors the rest of the GPU node):
#   GET  /health                      -> { ok: true, device, model }
#   POST /transcribe  (multipart)     file=<audio/video>            -> { text, language, segments }
#   POST /transcribe  (application/json) { "path": "/work/<file>" } -> { text, language, segments }
#                                       (path is a file on a MOUNTED volume only)
#
# BRAKES NOTE: this endpoint is PASSIVE (it transcribes exactly what it is asked
# to, then returns). It is NOT a timer/loop and does NOT pull work on its own. The
# AUTONOMOUS harvest queue that *calls* it keeps the three brakes (budget / single-
# flight lock / kill-switch) -- the brakes live on the caller, never relaxed here.

import os
import tempfile

from fastapi import FastAPI, File, Request, UploadFile
from fastapi.responses import JSONResponse

from faster_whisper import WhisperModel

MODEL_SIZE = os.environ.get("WHISPER_MODEL", "large-v3-turbo")
DEVICE = os.environ.get("WHISPER_DEVICE", "cuda")
COMPUTE = os.environ.get("WHISPER_COMPUTE", "float16" if DEVICE == "cuda" else "int8")
# Only paths under this root may be transcribed by reference (defense in depth:
# the endpoint is LAN/Tailscale-only AND it will not read arbitrary host paths).
WORK_ROOT = os.path.abspath(os.environ.get("WHISPER_WORK_ROOT", "/work"))

app = FastAPI()
_model = None  # lazy so /health answers before the model is warm


def get_model():
    global _model
    if _model is None:
        _model = WhisperModel(MODEL_SIZE, device=DEVICE, compute_type=COMPUTE)
    return _model


def _run(media_path):
    model = get_model()
    segments, info = model.transcribe(media_path, beam_size=5, vad_filter=True)
    seg_list = []
    lines = []
    for seg in segments:  # generator -> realizes transcription as we iterate
        line = (seg.text or "").strip()
        if line:
            lines.append(line)
        seg_list.append({"start": round(seg.start, 2), "end": round(seg.end, 2), "text": line})
    return {
        "text": "\n".join(lines),
        "language": info.language,
        "language_probability": round(info.language_probability, 3),
        "duration_sec": round(info.duration, 2),
        "model": MODEL_SIZE,
        "compute_type": COMPUTE,
        "segment_count": len(seg_list),
        "segments": seg_list,
    }


@app.get("/health")
def health():
    return {"ok": True, "device": DEVICE, "model": MODEL_SIZE, "compute_type": COMPUTE}


@app.post("/transcribe")
async def transcribe(request: Request, file: UploadFile = File(default=None)):
    # JSON { path } -> transcribe a file already on a mounted volume (no upload).
    ctype = request.headers.get("content-type", "")
    if "application/json" in ctype:
        body = await request.json()
        rel = (body or {}).get("path") or ""
        target = os.path.abspath(rel)
        if not target.startswith(WORK_ROOT + os.sep) and target != WORK_ROOT:
            return JSONResponse({"error": "path-outside-work-root"}, status_code=400)
        if not os.path.exists(target):
            return JSONResponse({"error": "not-found", "path": target}, status_code=404)
        try:
            return _run(target)
        except Exception as e:  # noqa: BLE001
            return JSONResponse({"error": "transcribe-failed", "detail": str(e)}, status_code=500)

    # multipart upload -> transcribe a streamed file.
    if file is None:
        return JSONResponse({"error": "file-or-path-required"}, status_code=400)
    suffix = os.path.splitext(file.filename or "")[1] or ".bin"
    fd, tmp = tempfile.mkstemp(suffix=suffix)
    try:
        with os.fdopen(fd, "wb") as f:
            f.write(await file.read())
        return _run(tmp)
    except Exception as e:  # noqa: BLE001
        return JSONResponse({"error": "transcribe-failed", "detail": str(e)}, status_code=500)
    finally:
        try:
            os.remove(tmp)
        except OSError:
            pass


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", "8771")))
