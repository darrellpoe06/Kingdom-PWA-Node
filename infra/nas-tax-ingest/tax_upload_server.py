#!/usr/bin/env python3
"""
tax_upload_server.py -- the NAS-side receiver for in-app tax uploads.

Darrell 2026-07-21: "give a place to upload it inside PoeTech App for Christina
instead of synology." This is the sovereign endpoint the app's tax-upload.js
posts to (same-origin /taxes/upload, routed by Caddy). It writes the PDF onto
the tax-documents bind mount, re-runs the deterministic ingest, and returns the
fresh archive so the Books -> Taxes screen updates immediately. Mirrors the
whisper-gpu FastAPI multipart precedent (church-gpu-node/whisper-gpu/server.py).

  POST /taxes/upload   (multipart: file=<pdf>, entityId, year, kind)
    headers: Authorization: Bearer <TAX_UPLOAD_TOKEN>
    -> { ok, record, archive }

Security (PERPETUAL-PIPELINE-HEALTH): bearer auth (env TAX_UPLOAD_TOKEN);
PDF-only; path-guarded entity/year/filename (no traversal); size cap. The NAS is
already Tailscale/LAN-only, so this is defense in depth, not the only wall.

Run on the NAS:
    TAX_UPLOAD_TOKEN=... uvicorn tax_upload_server:app --host 127.0.0.1 --port 8790
Caddy then routes  handle /taxes/upload  ->  reverse_proxy 127.0.0.1:8790.
"""
import os
import re
import shutil

from fastapi import FastAPI, File, Form, UploadFile, Request
from fastapi.responses import JSONResponse

import tax_ingest  # the deterministic ingest (same directory)

MAX_BYTES = 25 * 1024 * 1024
TOKEN = os.environ.get("TAX_UPLOAD_TOKEN", "")

app = FastAPI()


def _safe_segment(s, pattern):
    s = str(s or "").strip()
    return s if re.fullmatch(pattern, s) else None


def _safe_filename(name):
    base = re.sub(r"^.*[\\/]", "", str(name or "document.pdf"))
    cleaned = re.sub(r"-+", "-", re.sub(r"[^A-Za-z0-9._-]", "-", base))
    return cleaned if cleaned.lower().endswith(".pdf") else cleaned + ".pdf"


@app.get("/health")
def health():
    return {"ok": True, "src": tax_ingest.SRC}


@app.post("/taxes/upload")
@app.post("/upload")
async def upload(
    request: Request,
    file: UploadFile = File(...),
    entityId: str = Form(...),
    year: str = Form(...),
    kind: str = Form("return"),
):
    if TOKEN:
        auth = request.headers.get("authorization", "")
        if auth != ("Bearer " + TOKEN):
            return JSONResponse({"error": "unauthorized"}, status_code=401)

    entity = _safe_segment(entityId, r"[A-Za-z0-9_-]{1,64}")
    yr = _safe_segment(year, r"\d{4}")
    if not entity or not yr:
        return JSONResponse({"error": "bad-entity-or-year"}, status_code=400)
    fname = _safe_filename(file.filename)
    if not fname.lower().endswith(".pdf"):
        return JSONResponse({"error": "pdf-only"}, status_code=400)

    dest_dir = os.path.join(tax_ingest.SRC, entity, yr)
    os.makedirs(dest_dir, exist_ok=True)
    dest = os.path.join(dest_dir, fname)
    # Guard: the resolved path must stay under SRC (no traversal).
    if not os.path.abspath(dest).startswith(os.path.abspath(tax_ingest.SRC) + os.sep):
        return JSONResponse({"error": "path-escape"}, status_code=400)

    size = 0
    try:
        with open(dest, "wb") as out:
            while True:
                chunk = await file.read(1024 * 1024)
                if not chunk:
                    break
                size += len(chunk)
                if size > MAX_BYTES:
                    out.close()
                    os.remove(dest)
                    return JSONResponse({"error": "too-large"}, status_code=413)
                out.write(chunk)
    except Exception as e:  # noqa: BLE001
        return JSONResponse({"error": "write-failed", "detail": str(e)}, status_code=500)

    # Re-run the deterministic ingest so archive.json + the served copy refresh.
    snap = tax_ingest.build()
    os.makedirs(os.path.dirname(tax_ingest.OUT), exist_ok=True)
    tmp = tax_ingest.OUT + ".tmp"
    import json
    with open(tmp, "w", encoding="utf-8") as fh:
        json.dump(snap, fh, ensure_ascii=False, indent=2, sort_keys=True)
    os.replace(tmp, tax_ingest.OUT)

    record = next((d for d in snap["documents"] if d.get("entityId") == entity and str(d.get("year")) == yr and d.get("filename") == fname), None)
    return {"ok": True, "record": record, "archive": snap}
