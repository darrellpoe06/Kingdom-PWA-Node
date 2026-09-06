#!/usr/bin/env python3
"""
tax_upload_server.py -- the NAS-side receiver for in-app tax uploads.

Darrell 2026-07-21: "give a place to upload it inside PoeTech App for Christina
instead of synology." This is the sovereign endpoint the app's tax-upload.js
posts to (same-origin /taxes/upload, routed by Caddy). It writes the PDF onto
the tax-documents bind mount, re-runs the deterministic ingest, and returns the
fresh archive so the Books -> Taxes screen updates immediately. Mirrors the
whisper-gpu FastAPI multipart precedent (church-gpu-node/whisper-gpu/server.py).

  POST /taxes/upload           (multipart: file=<pdf>, entityId, year, kind)
    headers: Authorization: Bearer <TAX_UPLOAD_TOKEN>
    -> { ok, record, archive }
  GET  /taxes/archive.json     -> the published snapshot the Books -> Taxes screen reads
  GET  /taxes/files/<entity>/<year>/<name>.pdf  -> the original return, printable

WHY THIS SERVER ALSO SERVES THE READS (2026-09-06, the "I am also unable to
upload my taxes" defect). The whole /taxes hop was missing in production, three
ways at once: this service had NO installer and appears in no manifest, the
Funnel had NO /taxes path mount (infra/nas-transport/RECORDED-STATE.md listed
only /, /mcp and /nas-photos), and the Caddy route named in this docstring lived
only in this docstring. So the upload POST reached a backend that does not
exist -- "Could not reach the NAS upload service" -- and the archive GET fell
through the Funnel root to n8n, which is why the same screen read "NO RETURNS
INDEXED YET" while returns were sitting in the drop directory.

The upload could have been fixed with a Caddyfile route. The READS could not be,
not verifiably: nothing in this repo can confirm what the NAS Caddyfile contains
or that it has an import directory, and DR-0076 forbids editing a config we
cannot verify. Serving all three paths from ONE process makes the fix
self-contained and provable: a single Funnel mount (/taxes -> 127.0.0.1:8790)
carries every call the app makes, and install.sh probes it before claiming
success. The reads are pure static passthrough of what tax_ingest already
published into tax_ingest.SITE -- this adds no second source of truth, and if
Caddy is ever configured to serve those paths directly, nothing here breaks.

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
from fastapi.responses import FileResponse, JSONResponse

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
@app.get("/taxes/health")
def health():
    """Liveness + the two facts a diagnosis actually needs: is anything indexed,
    and does the published snapshot exist. install.sh probes this."""
    return {
        "ok": True,
        "src": tax_ingest.SRC,
        "site": tax_ingest.SITE,
        "archive_published": os.path.isfile(tax_ingest.OUT),
    }


def _published_path(*parts):
    """Resolve a path under the PUBLISHED site dir, refusing any traversal.

    Returns None rather than raising, so a probing request gets a flat 404 and
    learns nothing about the filesystem.
    """
    base = os.path.abspath(tax_ingest.SITE)
    target = os.path.abspath(os.path.join(base, *parts))
    if target != base and not target.startswith(base + os.sep):
        return None
    return target


@app.get("/taxes/archive.json")
@app.get("/archive.json")
def archive():
    """The snapshot tax_ingest published. An ABSENT archive is reported as an
    EMPTY archive, never as an error and never as a fabricated year: the app's
    "no returns indexed yet" state is the honest reading of an empty drop
    directory (DR-0076 -- absent is not zero, and it is not a failure either)."""
    out = _published_path("archive.json")
    if not out or not os.path.isfile(out):
        return JSONResponse(
            {"generatedAt": None, "documents": [], "published": False},
            headers={"cache-control": "no-store"},
        )
    return FileResponse(
        out,
        media_type="application/json",
        headers={"cache-control": "no-store"},
    )


@app.get("/taxes/files/{entity}/{year}/{name}")
@app.get("/files/{entity}/{year}/{name}")
def served_file(entity: str, year: str, name: str):
    """The original PDF, so a return stays printable from the phone.

    Every segment is validated against the SAME patterns the upload path uses --
    a read route is an equally good traversal target as a write route.
    """
    ent = _safe_segment(entity, r"[A-Za-z0-9_-]{1,64}")
    yr = _safe_segment(year, r"\d{4}")
    if not ent or not yr:
        return JSONResponse({"error": "not-found"}, status_code=404)
    fname = _safe_filename(name)
    path = _published_path("files", ent, yr, fname)
    if not path or not os.path.isfile(path):
        return JSONResponse({"error": "not-found"}, status_code=404)
    return FileResponse(path, media_type="application/pdf", filename=fname)


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
