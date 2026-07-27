#!/usr/bin/env python3
"""
scribe_ingest_server.py -- the NAS-side receiver for PoeTech Scribe sessions
(screen-workflow recordings and whole-meeting audio, 30min-1hr+).

Darrell 2026-07-27: "record whole meetings ... 30min... 1hr..." + "record
workflows on a screen to get the required features and MVP." Research review:
docs/99-session-notes/2026-07-27-scribe-function-research-review.md.

This is the sovereign endpoint the app's workflow-scribe.js uploader posts to
(same-origin /scribe/*, routed by Caddy -- born-Python, NEVER a new n8n webhook,
per DR-0132 and the transport memory). Mirrors the tax_upload_server /
whisper-gpu FastAPI multipart precedent.

  POST /scribe/session   { sessionId, kind, consent }  -> { ok }
      REFUSES (400 consent-required) unless every named party consented --
      Illinois is an all-party-consent state (720 ILCS 5/14); the browser gate
      enforces this too, but the server does not trust the client (DR-0076).
  POST /scribe/chunk     (multipart: file, sessionId, index, track)
      Idempotent: re-uploading an index overwrites the same file, never dupes.
  POST /scribe/complete  { sessionId, manifest }
      Verifies every chunk the manifest claims is on disk, writes manifest.json,
      assembles the chunks into one recording file, and appends a queue line to
      whisper-queue.jsonl for the GPU transcription consumer.
  GET  /scribe/session/{id} -> { ok, state, chunks }
  GET  /health           -> { ok: true }

Security (PERPETUAL-PIPELINE-HEALTH): bearer auth (env SCRIBE_TOKEN);
path-guarded session ids and indexes (no traversal); per-chunk size cap; all
persistence on the bind mount (env SCRIBE_DATA). The NAS is Tailscale/LAN-only,
so this is defense in depth, not the only wall.

Three-brakes note (DR-0068/DR-0225): this server is request-driven -- it runs no
timers and spawns no work on a clock, so the brakes do not gate it. The FUTURE
queue CONSUMER (the loop that feeds whisper-gpu from whisper-queue.jsonl) is in
the timer-driven class and ships with budget + concurrency lock + kill-switch
proven-to-catch before it goes active.

Run on the NAS (his-hand deploy; ships inactive until then):
    SCRIBE_TOKEN=... SCRIBE_DATA=/data/poetech-scribe \
      uvicorn scribe_ingest_server:app --host 127.0.0.1 --port 8791
Caddy then routes  handle /scribe/*  ->  reverse_proxy 127.0.0.1:8791.
"""
import json
import os
import re
import time

from fastapi import FastAPI, File, Form, Request, UploadFile
from fastapi.responses import JSONResponse

MAX_CHUNK_BYTES = 64 * 1024 * 1024  # one minute of screen video fits easily
MAX_DURATION_SECONDS = 180 * 60     # aligned with ministry-meetings / workflow-scribe.js
KINDS = ("workflow", "meeting")
TOKEN = os.environ.get("SCRIBE_TOKEN", "")
DATA = os.environ.get("SCRIBE_DATA", "/data/poetech-scribe")

app = FastAPI()


def _authorized(request: Request) -> bool:
    if not TOKEN:
        return True
    return request.headers.get("authorization", "") == ("Bearer " + TOKEN)


def _safe_session_id(s) -> str:
    s = str(s or "").strip()
    return s if re.fullmatch(r"[A-Za-z0-9-]{8,64}", s) else ""


def _session_dir(session_id: str) -> str:
    return os.path.join(DATA, "sessions", session_id)


def _all_consented(consent) -> bool:
    parties = (consent or {}).get("parties") or []
    named = [p for p in parties if str((p or {}).get("name") or "").strip()]
    return bool(named) and all(bool(p.get("consented")) for p in named)


@app.get("/health")
def health():
    return {"ok": True, "data": DATA}


@app.post("/scribe/session")
@app.post("/session")
async def create_session(request: Request):
    if not _authorized(request):
        return JSONResponse({"error": "unauthorized"}, status_code=401)
    try:
        body = await request.json()
    except Exception:
        return JSONResponse({"error": "bad-json"}, status_code=400)
    session_id = _safe_session_id(body.get("sessionId"))
    kind = body.get("kind")
    consent = body.get("consent")
    if not session_id:
        return JSONResponse({"error": "bad-session-id"}, status_code=400)
    if kind not in KINDS:
        return JSONResponse({"error": "unknown-kind"}, status_code=400)
    # The server does not trust the client's gate: no all-party consent, no session.
    if not _all_consented(consent):
        return JSONResponse({"error": "consent-required"}, status_code=400)
    sdir = _session_dir(session_id)
    os.makedirs(os.path.join(sdir, "chunks"), exist_ok=True)
    record = {"sessionId": session_id, "kind": kind, "consent": consent,
              "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "state": "recording"}
    with open(os.path.join(sdir, "session.json"), "w", encoding="utf-8") as f:
        json.dump(record, f, indent=2)
    return {"ok": True, "sessionId": session_id}


@app.post("/scribe/chunk")
@app.post("/chunk")
async def upload_chunk(
    request: Request,
    file: UploadFile = File(...),
    sessionId: str = Form(...),
    index: str = Form(...),
    track: str = Form("main"),
):
    if not _authorized(request):
        return JSONResponse({"error": "unauthorized"}, status_code=401)
    session_id = _safe_session_id(sessionId)
    if not session_id or not os.path.isfile(os.path.join(_session_dir(session_id), "session.json")):
        return JSONResponse({"error": "unknown-session"}, status_code=404)
    if not re.fullmatch(r"\d{1,5}", str(index or "")):
        return JSONResponse({"error": "bad-index"}, status_code=400)
    if not re.fullmatch(r"[a-z]{1,16}", str(track or "")):
        return JSONResponse({"error": "bad-track"}, status_code=400)
    raw = await file.read()
    if len(raw) > MAX_CHUNK_BYTES:
        return JSONResponse({"error": "chunk-too-large"}, status_code=413)
    if not raw:
        return JSONResponse({"error": "empty-chunk"}, status_code=400)
    # Idempotent by (track, index): a retried upload overwrites, never duplicates.
    name = f"{track}.{int(index):05d}.webm"
    path = os.path.join(_session_dir(session_id), "chunks", name)
    with open(path, "wb") as f:
        f.write(raw)
    return {"ok": True, "chunk": name, "bytes": len(raw)}


@app.post("/scribe/complete")
@app.post("/complete")
async def complete(request: Request):
    if not _authorized(request):
        return JSONResponse({"error": "unauthorized"}, status_code=401)
    try:
        body = await request.json()
    except Exception:
        return JSONResponse({"error": "bad-json"}, status_code=400)
    session_id = _safe_session_id(body.get("sessionId"))
    manifest = body.get("manifest") or {}
    sdir = _session_dir(session_id)
    if not session_id or not os.path.isfile(os.path.join(sdir, "session.json")):
        return JSONResponse({"error": "unknown-session"}, status_code=404)
    # Server-side manifest integrity -- same rules as validateManifest() in the app.
    problems = []
    if manifest.get("kind") not in KINDS:
        problems.append("unknown-kind")
    if not _all_consented(manifest.get("consent")):
        problems.append("consent-missing")
    if int(manifest.get("seconds") or 0) > MAX_DURATION_SECONDS:
        problems.append("over-duration-cap")
    claimed = int(manifest.get("chunkCount") or 0)
    chunk_dir = os.path.join(sdir, "chunks")
    on_disk = sorted(n for n in os.listdir(chunk_dir) if n.startswith("main.")) if os.path.isdir(chunk_dir) else []
    if claimed < 1:
        problems.append("no-chunks")
    elif len(on_disk) < claimed:
        problems.append(f"chunks-missing:{claimed - len(on_disk)}")
    if problems:
        return JSONResponse({"error": "manifest-invalid", "problems": problems}, status_code=400)
    # Assemble the main track into one recording file (webm chunks from one
    # MediaRecorder concatenate; ffmpeg remux happens in the transcription stage).
    recording = os.path.join(sdir, "recording.webm")
    with open(recording, "wb") as out:
        for name in on_disk:
            with open(os.path.join(chunk_dir, name), "rb") as c:
                out.write(c.read())
    with open(os.path.join(sdir, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
    # Queue for the whisper-gpu consumer (same queue-file pattern as youtube_index).
    queue_line = {"sessionId": session_id, "kind": manifest.get("kind"), "path": recording,
                  "seconds": int(manifest.get("seconds") or 0),
                  "queuedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
    with open(os.path.join(DATA, "whisper-queue.jsonl"), "a", encoding="utf-8") as q:
        q.write(json.dumps(queue_line) + "\n")
    return {"ok": True, "queued": True, "chunks": len(on_disk)}


@app.get("/scribe/session/{session_id}")
@app.get("/session/{session_id}")
def session_state(session_id: str, request: Request):
    if not _authorized(request):
        return JSONResponse({"error": "unauthorized"}, status_code=401)
    sid = _safe_session_id(session_id)
    sdir = _session_dir(sid)
    if not sid or not os.path.isfile(os.path.join(sdir, "session.json")):
        return JSONResponse({"error": "unknown-session"}, status_code=404)
    with open(os.path.join(sdir, "session.json"), encoding="utf-8") as f:
        record = json.load(f)
    chunk_dir = os.path.join(sdir, "chunks")
    chunks = sorted(os.listdir(chunk_dir)) if os.path.isdir(chunk_dir) else []
    record["chunks"] = chunks
    record["complete"] = os.path.isfile(os.path.join(sdir, "manifest.json"))
    return {"ok": True, "session": record}
