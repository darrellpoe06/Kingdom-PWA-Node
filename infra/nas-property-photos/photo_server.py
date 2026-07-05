#!/usr/bin/env python3
# =============================================================================
# nas-property-photos / photo_server — sovereign property-photo image server
# =============================================================================
# Deterministic Python HTTP server on the family NAS that serves each rental
# property's Synology Chat photos to the PoeTech PWA. It REPLACES the fragile
# n8n -> SSH-forced-command -> resolver chain (wf-property-photos) with one
# self-contained process: no n8n, no vendor dependency, no LLM. Same DR-0083
# lane as nas-finance-ingest ("plain Python on the NAS that just runs").
#
# WHY THIS EXISTS (2026-07-01 regression):
#   Property photos stopped RENDERING on Real Estate while the photo COUNT
#   ("233 PHOTOS" on 1003 Koehn Dr) stayed correct. The count is fetched live
#   from the same bridge (psql COUNT), so the TRANSPORT was up -- what broke was
#   THUMBNAIL RESOLUTION: every `thumb` came back null. Root cause class: the
#   old resolver predicted ONE exact PhotoBackup @eaDir path per photo; when
#   that assumption drifts (a DSM / Synology Photos relocation, a homes/ perms
#   change, or an oversized base64 gallery response failing a hop the tiny count
#   response survives), the whole gallery blanks. This server fixes BOTH:
#     * drops the n8n hop (fewer things to break),
#     * hardens thumb resolution -- multiple candidate roots + an on-the-fly
#       downscale fallback when Synology's pre-made thumbnail is missing.
#
# CONTRACT (identical to the old bridge, so the PWA needs only a base-path swap):
#   GET /property-photos?channel=<name>&limit=<n>&offset=<n>
#   Authorization: Bearer <poetech-chat-bridge-token>
#   -> { count, total, photos: [{ id, date, name, text, thumb }] }
#      `thumb` is a data:image/jpeg;base64 URL or null (listed honestly).
#   GET /healthz -> { ok: true }   (no auth; liveness only)
#
# PHONE MEDIA BACKUP (2026-07-05, Darrell: "moving all my photos and videos to
# my server or nas ... so I can get a new phone and all my images and videos
# are safe"). Chunked, resumable, verified writes of a phone's photos AND
# videos to the NAS the family owns. Videos cannot ride the n8n JSON/base64
# photo-upload path (8 MB cap, image-only), so the raw-byte lane lives here on
# the same sovereign server. All three endpoints bearer-gated:
#   GET  /media-exists?device=<d>&name=<n>&size=<bytes>&date=YYYY-MM-DD
#        -> { ok, exists, bytes }          (dedup check before any bytes move)
#   GET  /media-upload-status?id=<upload-id>
#        -> { ok, bytes }                  (resume point for a partial upload)
#   POST /media-upload   (body = raw chunk bytes, application/octet-stream)
#        X-Upload-Id / X-Media-Device / X-Media-Name / X-Media-Total /
#        X-Media-Offset / X-Media-Date
#        -> { ok, bytes, complete } ; 409 + current bytes on offset mismatch
#        (idempotent append: the client adopts the server's offset and resumes)
#   Files land under MEDIA_BACKUP_ROOT (/volume1/PoeTech/phone-backup by
#   default): <device>/<YYYY>/<MM>/<name>. Magic-byte checked on completion;
#   originals never rewritten; a same-name-same-size file is a dedup hit, a
#   same-name-different-size file gets a uniquified name — nothing is clobbered.
#
# The path is matched by SUFFIX (".../property-photos"), so it works whether the
# fronting proxy (Tailscale serve / DSM reverse proxy) strips its mount prefix
# or not.
#
# SECURITY / SOVEREIGNTY:
#   * Bearer token expected value is read from a NAS-resident file (default
#     /volume1/PoeTech/secrets/photo-bridge-token) or PHOTO_BRIDGE_TOKEN env.
#     It stays on the NAS -- never printed, never logged, never in the repo.
#     Compared in constant time.
#   * `channel` is whitelist-validated (same regex as the old resolver); the SQL
#     interpolates only the sanitized channel. limit/offset are int-bounded.
#   * Reads ONLY Synology's small pre-made thumbnails (or a downscaled copy it
#     makes in memory) -- never moves or rewrites an original.
#   * Binds to 127.0.0.1 by default: reachable only via the local reverse proxy
#     that fronts the sovereign path. No public attack surface of its own.
#
# NOT timer-driven / not self-triggering: this is an on-demand request/response
# server, so the three-brakes autonomous-automation rule does not apply. It is
# bounded instead by per-request limit caps, localhost binding, and a hard
# response-size guard.
#
# MODES:
#   photo_server.py --serve [--host 127.0.0.1] [--port 8099]
#   photo_server.py --selftest            # offline logic checks (no NAS needed)
#   photo_server.py --probe <channel>     # MEASURE real resolution on the NAS:
#                                         # total, resolved, null, which root hit
# =============================================================================
import argparse
import base64
import glob
import hmac
import io
import json
import os
import re
import subprocess
import sys
import threading
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

# --- Constants ----------------------------------------------------------------
SAFE_CHANNEL = re.compile(r"^[A-Za-z0-9._-]{1,64}$")
# A safe photo filename: no path separators (the name comes from chat
# file_props and is NEVER trusted as a path). glob.escape() also neutralizes
# any wildcard chars before it reaches the filesystem.
SAFE_NAME = re.compile(r"^[^/\\]{1,255}$")
# Pull the first plausible YYYYMMDD found ANYWHERE in the name. Covers every
# real camera/screenshot convention seen in the archive:
#   20240123_144917.jpg / Screenshot_20240109_063559_Chrome.jpg / PXL_20240109_*.
# Names with no date (iPhone IMG_3832.jpg) fall through to the undated search.
DATE_ANYWHERE = re.compile(r"(20\d{2})(0[1-9]|1[0-2])([0-3]\d)")
THUMB_PATTERNS = (
    "SYNOFILE_THUMB_M*.jpg", "SYNOFILE_THUMB_SM*.jpg",
    "SYNOFILE_THUMB_S*.jpg", "SYNOFILE_THUMB_*.jpg",
)
# DATED roots pin the {y}/{m} folder (fast path when the name carries a date).
# `DCIM/*` (was `DCIM/Camera`) so Screenshots/, and any other DCIM subfolder,
# resolve too. `Drive/*/*` matches ANY device-backup folder name (PhotoBackup/
# <device>, Backup/<device>, "Christina's Note20 Ultra", ...). Override with
# PHOTO_ROOTS (newline/';'-separated templates using {y} {m}).
DEFAULT_ROOTS = [
    "/volume1/homes/*/Drive/*/*/DCIM/*/{y}/{m}",
    "/volume1/homes/*/Drive/*/DCIM/*/{y}/{m}",
    "/volume1/homes/*/Photos/PhotoLibrary/{y}/{m}",
    "/volume1/photo/*/DCIM/*/{y}/{m}",
]
# UNDATED roots wildcard the year/month IN the template, for names with no date
# (iPhone IMG_####.jpg). Bounded (no recursive **): glob walks
# device/subdir/year/month explicitly. Override with PHOTO_UNDATED_ROOTS.
DEFAULT_UNDATED_ROOTS = [
    "/volume1/homes/*/Drive/*/*/DCIM/*/*/*",
    "/volume1/homes/*/Drive/*/DCIM/*/*/*",
    "/volume1/photo/*/DCIM/*/*/*",
]
MAX_THUMB_BYTES = 400000      # Synology thumbs are ~20KB; guard against surprises
MAX_ORIGINAL_BYTES = 40 * 1024 * 1024  # cap the original we will downscale
DOWNSCALE_MAX = 480           # px longest edge for the on-the-fly fallback
# The family bridge token ALREADY lives on the NAS (seeded for the old n8n
# bridge). Reuse it -- no second copy of the secret, no re-seeding. The PWA
# stores the same value in localStorage["poetech-chat-bridge-token"].
TOKEN_FILE_DEFAULT = "/volume1/PoeTech/secrets/chat-bridge-token.txt"

# --- Phone media backup (photos + videos) --------------------------------------
# Where backed-up phone media lands: <root>/<device>/<YYYY>/<MM>/<name>.
# In-flight chunks accumulate under <root>/.parts/<upload-id>.part.
MEDIA_ROOT_DEFAULT = "/volume1/PoeTech/phone-backup"
MEDIA_EXTS = {
    "jpg", "jpeg", "png", "webp", "heic", "heif", "gif",   # photos
    "mp4", "mov", "m4v", "webm", "mkv", "avi", "3gp",       # videos
}
MAX_MEDIA_BYTES = 4 * 1024 * 1024 * 1024   # 4 GB per file (covers long phone videos)
MAX_CHUNK_BYTES = 16 * 1024 * 1024          # per-request cap; client sends ~6 MB
SAFE_UPLOAD_ID = re.compile(r"^[A-Za-z0-9._-]{8,120}$")
SAFE_MEDIA_DATE = re.compile(r"^(20\d{2})-(0[1-9]|1[0-2])-([0-3]\d)$")
# One lock per in-flight upload id so ThreadingHTTPServer appends never interleave.
_MEDIA_LOCKS = {}
_MEDIA_LOCKS_GUARD = threading.Lock()


def media_root():
    return os.environ.get("MEDIA_BACKUP_ROOT", "").strip() or MEDIA_ROOT_DEFAULT


def _upload_lock(upload_id):
    with _MEDIA_LOCKS_GUARD:
        return _MEDIA_LOCKS.setdefault(upload_id, threading.Lock())


def sanitize_media_name(name):
    """A phone media filename made filesystem-safe, or None. The name is NEVER
    trusted as a path: basename only, safe chars only, extension whitelisted."""
    base = os.path.basename((name or "").replace("\\", "/"))
    cleaned = re.sub(r"[^A-Za-z0-9._-]", "_", base).strip("._")
    if not cleaned or len(cleaned) > 120 or ".." in cleaned:
        return None
    if "." not in cleaned:
        return None
    ext = cleaned.rsplit(".", 1)[-1].lower()
    if ext not in MEDIA_EXTS:
        return None
    return cleaned


def sanitize_device_label(label):
    """The phone's own label for itself ("darrell-z-fold7"), made path-safe."""
    cleaned = re.sub(r"[^A-Za-z0-9._-]", "-", (label or "").strip())
    cleaned = re.sub(r"-{2,}", "-", cleaned).strip(".-_")
    if not cleaned or len(cleaned) > 48 or ".." in cleaned:
        return None
    return cleaned


def media_kind(head):
    """Identify a completed upload by magic bytes (first 16). Covers every
    whitelisted extension; anything unrecognized is rejected, never stored."""
    if head[:3] == b"\xff\xd8\xff":
        return "jpeg"
    if head[:8] == b"\x89PNG\r\n\x1a\n":
        return "png"
    if head[:4] == b"RIFF" and head[8:12] == b"WEBP":
        return "webp"
    if head[:4] == b"RIFF" and head[8:12] == b"AVI ":
        return "avi"
    if head[:4] == b"GIF8":
        return "gif"
    if head[4:8] == b"ftyp":
        return "isobmff"   # mp4 / mov / m4v / 3gp / heic / heif
    if head[:4] == b"\x1a\x45\xdf\xa3":
        return "ebml"      # webm / mkv
    return None


def final_media_path(device, date_str, name):
    """Absolute destination for a completed upload, or None if it would escape
    the backup root (belt on top of the sanitizers)."""
    y, m = date_str[:4], date_str[5:7]
    root = os.path.realpath(media_root())
    path = os.path.realpath(os.path.join(root, device, y, m, name))
    if path != root and not path.startswith(root + os.sep):
        return None
    return path


def uniquify_media_path(path):
    """A same-name-DIFFERENT-size file already exists: never clobber it. Insert
    -1, -2, ... before the extension until the name is free."""
    if not os.path.exists(path):
        return path
    stem, ext = os.path.splitext(path)
    for i in range(1, 100):
        candidate = "%s-%d%s" % (stem, i, ext)
        if not os.path.exists(candidate):
            return candidate
    return None


def roots():
    env = os.environ.get("PHOTO_ROOTS", "").strip()
    if env:
        return [r.strip() for r in re.split(r"[\n;]+", env) if r.strip()]
    return DEFAULT_ROOTS


def undated_roots():
    env = os.environ.get("PHOTO_UNDATED_ROOTS", "").strip()
    if env:
        return [r.strip() for r in re.split(r"[\n;]+", env) if r.strip()]
    return DEFAULT_UNDATED_ROOTS


def _search_bases(name):
    """Directory globs to look in for a photo. If the name carries a date, pin
    the {y}/{m} folder (fast, specific); otherwise wildcard year/month so
    date-less names (iPhone IMG_####.jpg) still resolve. Returns (bases, tag)
    where tag names the strategy for the probe."""
    m = DATE_ANYWHERE.search(name or "")
    if m:
        y, mo = m.group(1), m.group(2)
        return [t.format(y=y, m=mo) for t in roots()], "dated"
    return list(undated_roots()), "undated"


# --- Data layer (psql over Synology Chat) ------------------------------------
def _psql(sql):
    out = subprocess.run(
        ["sudo", "-n", "-u", "postgres", "psql", "synochat", "-At",
         "-R", "\x1e", "-F", "\x1f", "-c", sql],
        stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
    )
    return out.stdout.decode("utf-8", "replace")


def query_rows(channel, limit, offset):
    sql = (
        "SELECT p.id, p.create_at, p.file_props->>'name', COALESCE(p.message,'') "
        "FROM posts p JOIN channels c ON c.id = p.channel_id "
        "WHERE c.name = '%s' AND (p.file_props->>'is_image') = 'true' "
        "AND COALESCE(p.delete_at,0) = 0 "
        "ORDER BY p.create_at DESC LIMIT %d OFFSET %d" % (channel, limit, offset)
    )
    raw = _psql(sql).strip("\x1e\n")
    if not raw:
        return []
    rows = []
    for rec in raw.split("\x1e"):
        cols = rec.split("\x1f")
        if len(cols) >= 4:
            rows.append(cols)
    return rows


def total_count(channel):
    sql = (
        "SELECT COUNT(*) FROM posts p JOIN channels c ON c.id = p.channel_id "
        "WHERE c.name = '%s' AND (p.file_props->>'is_image') = 'true' "
        "AND COALESCE(p.delete_at,0) = 0" % channel
    )
    try:
        return int((_psql(sql).strip() or "0").split("\x1e")[0].strip() or "0")
    except ValueError:
        return 0


# --- Thumbnail resolution (hardened) -----------------------------------------
def _premade_thumb(name):
    """Synology's own ~20KB thumbnail, across all candidate bases. Returns
    (bytes, strategy_tag) or (None, None)."""
    if not SAFE_NAME.match(name or ""):
        return None, None
    esc = glob.escape(name)
    bases, tag = _search_bases(name)
    for base in bases:
        for pat in THUMB_PATTERNS:
            hits = glob.glob(base + "/@eaDir/" + esc + "/" + pat)
            if hits:
                try:
                    with open(hits[0], "rb") as fh:
                        data = fh.read()
                    if 0 < len(data) <= MAX_THUMB_BYTES:
                        return data, tag
                except OSError:
                    pass
    return None, None


def _find_original(name):
    if not SAFE_NAME.match(name or ""):
        return None
    esc = glob.escape(name)
    bases, _tag = _search_bases(name)
    for base in bases:
        hits = glob.glob(base + "/" + esc)
        if hits:
            return hits[0]
    return None


def _downscale(path):
    """Fallback when the pre-made thumbnail is gone: make one in memory from the
    original. Uses Pillow if present, else the system `convert` (ImageMagick),
    else gives up. Never rewrites the original on disk."""
    try:
        if os.path.getsize(path) > MAX_ORIGINAL_BYTES:
            return None
    except OSError:
        return None
    # Pillow path (preferred; no subprocess).
    try:
        from PIL import Image  # noqa: PLC0415 -- optional, lazy by design
        with Image.open(path) as im:
            im = im.convert("RGB")
            im.thumbnail((DOWNSCALE_MAX, DOWNSCALE_MAX))
            buf = io.BytesIO()
            im.save(buf, format="JPEG", quality=72)
            data = buf.getvalue()
            return data if 0 < len(data) <= MAX_THUMB_BYTES * 3 else None
    except Exception:
        pass
    # ImageMagick fallback.
    try:
        out = subprocess.run(
            ["convert", path + "[0]", "-auto-orient",
             "-resize", "%dx%d>" % (DOWNSCALE_MAX, DOWNSCALE_MAX),
             "-quality", "72", "jpg:-"],
            stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, timeout=15,
        )
        data = out.stdout
        return data if 0 < len(data) <= MAX_THUMB_BYTES * 3 else None
    except (OSError, subprocess.SubprocessError):
        return None


def thumb_for(name, allow_downscale=True):
    """data:image/jpeg;base64 URL for a photo, or None. Fast path is Synology's
    pre-made thumbnail; falls back to an on-the-fly downscale of the original."""
    data, _root = _premade_thumb(name)
    if data is None and allow_downscale:
        orig = _find_original(name)
        if orig:
            data = _downscale(orig)
    if not data:
        return None
    return "data:image/jpeg;base64," + base64.b64encode(data).decode("ascii")


def build_photos(channel, limit, offset, allow_downscale=True):
    photos = []
    for cid, create_at, name, text in query_rows(channel, limit, offset):
        try:
            date = datetime.fromtimestamp(int(create_at) / 1000, timezone.utc).strftime("%Y-%m-%d")
        except (ValueError, OverflowError):
            date = ""
        photos.append({
            "id": cid,
            "date": date,
            "name": name or "",
            "text": (text or "")[:280],
            "thumb": thumb_for(name, allow_downscale),
        })
    return photos


# --- Auth --------------------------------------------------------------------
def expected_token(args):
    if os.environ.get("PHOTO_BRIDGE_TOKEN"):
        return os.environ["PHOTO_BRIDGE_TOKEN"].strip()
    path = args.token_file if args else TOKEN_FILE_DEFAULT
    try:
        with open(path, "r", encoding="utf-8") as fh:
            return fh.read().strip()
    except OSError:
        return ""


def bearer_ok(header_value, expected):
    if not expected:
        return False
    if not header_value or not header_value.lower().startswith("bearer "):
        return False
    return hmac.compare_digest(header_value[7:].strip(), expected)


# --- HTTP server -------------------------------------------------------------
def make_handler(args):
    token = expected_token(args)

    class Handler(BaseHTTPRequestHandler):
        server_version = "poetech-photos/1.1"

        def _send(self, code, payload, cache="private, max-age=60"):
            body = json.dumps(payload).encode("utf-8")
            self.send_response(code)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", cache)
            self.end_headers()
            self.wfile.write(body)

        def log_message(self, *a):  # keep the NAS console quiet; never log tokens
            pass

        # --- Phone media backup: dedup + resume reads -------------------------
        def _media_exists(self, query):
            q = parse_qs(query)
            device = sanitize_device_label((q.get("device", [""])[0] or ""))
            name = sanitize_media_name((q.get("name", [""])[0] or ""))
            date = (q.get("date", [""])[0] or "").strip()
            try:
                size = int(q.get("size", ["0"])[0])
            except ValueError:
                size = -1
            if not device or not name or size <= 0 or not SAFE_MEDIA_DATE.match(date):
                self._send(400, {"ok": False, "error": "bad params"}, cache="no-store")
                return
            dest = final_media_path(device, date, name)
            exists = False
            have = 0
            if dest and os.path.isfile(dest):
                try:
                    have = os.path.getsize(dest)
                except OSError:
                    have = 0
                exists = have == size
            self._send(200, {"ok": True, "exists": exists, "bytes": have}, cache="no-store")

        def _media_upload_status(self, query):
            q = parse_qs(query)
            upload_id = (q.get("id", [""])[0] or "").strip()
            if not SAFE_UPLOAD_ID.match(upload_id):
                self._send(400, {"ok": False, "error": "bad id"}, cache="no-store")
                return
            part = os.path.join(media_root(), ".parts", upload_id + ".part")
            have = 0
            try:
                if os.path.isfile(part):
                    have = os.path.getsize(part)
            except OSError:
                have = 0
            self._send(200, {"ok": True, "bytes": have}, cache="no-store")

        # --- Phone media backup: the chunked, resumable write ------------------
        def do_POST(self):
            parsed = urlparse(self.path)
            path = parsed.path.rstrip("/")
            if not (path.endswith("/media-upload") or path == "/media-upload"):
                self._send(404, {"ok": False, "error": "not found"}, cache="no-store")
                return
            if not bearer_ok(self.headers.get("Authorization"), token):
                self._send(401, {"ok": False, "error": "unauthorized"}, cache="no-store")
                return
            upload_id = (self.headers.get("X-Upload-Id") or "").strip()
            device = sanitize_device_label(self.headers.get("X-Media-Device") or "")
            name = sanitize_media_name(self.headers.get("X-Media-Name") or "")
            date = (self.headers.get("X-Media-Date") or "").strip()
            try:
                total = int(self.headers.get("X-Media-Total") or "0")
                offset = int(self.headers.get("X-Media-Offset") or "-1")
                clen = int(self.headers.get("Content-Length") or "0")
            except ValueError:
                total, offset, clen = 0, -1, 0
            if (not SAFE_UPLOAD_ID.match(upload_id) or not device or not name
                    or not SAFE_MEDIA_DATE.match(date)
                    or total <= 0 or total > MAX_MEDIA_BYTES
                    or offset < 0 or clen <= 0 or clen > MAX_CHUNK_BYTES
                    or offset + clen > total):
                self._send(400, {"ok": False, "error": "bad upload params"}, cache="no-store")
                return
            parts_dir = os.path.join(media_root(), ".parts")
            part = os.path.join(parts_dir, upload_id + ".part")
            with _upload_lock(upload_id):
                try:
                    os.makedirs(parts_dir, exist_ok=True)
                    have = os.path.getsize(part) if os.path.isfile(part) else 0
                    if offset != have:
                        # Idempotent resume: tell the client where the part really
                        # is; it adopts this offset and continues. A fully-replayed
                        # chunk is a no-op, never a corruption.
                        self._send(409, {"ok": False, "bytes": have}, cache="no-store")
                        return
                    remaining = clen
                    with open(part, "ab") as fh:
                        while remaining > 0:
                            data = self.rfile.read(min(remaining, 1024 * 1024))
                            if not data:
                                raise OSError("client stream ended early")
                            fh.write(data)
                            remaining -= len(data)
                    have += clen
                    if have < total:
                        self._send(200, {"ok": True, "bytes": have, "complete": False}, cache="no-store")
                        return
                    # Complete: magic-byte check, then move into place — verified
                    # bytes or nothing (DR-0076: no claim without evidence).
                    with open(part, "rb") as fh:
                        head = fh.read(16)
                    if media_kind(head) is None:
                        os.remove(part)
                        self._send(415, {"ok": False, "error": "unrecognized file type"}, cache="no-store")
                        return
                    dest = final_media_path(device, date, name)
                    if not dest:
                        os.remove(part)
                        self._send(400, {"ok": False, "error": "bad destination"}, cache="no-store")
                        return
                    dedup = False
                    if os.path.exists(dest):
                        if os.path.getsize(dest) == total:
                            os.remove(part)   # same name, same bytes: already safe
                            dedup = True
                        else:
                            dest = uniquify_media_path(dest)
                            if not dest:
                                os.remove(part)
                                self._send(409, {"ok": False, "error": "name exhausted"}, cache="no-store")
                                return
                    if not dedup:
                        os.makedirs(os.path.dirname(dest), exist_ok=True)
                        os.replace(part, dest)
                    self._send(200, {"ok": True, "bytes": total, "complete": True, "dedup": dedup}, cache="no-store")
                except Exception as err:  # never leak internals; stay honest + quiet
                    self._send(500, {"ok": False, "error": "upload failed: %s" % type(err).__name__}, cache="no-store")

        def do_GET(self):
            parsed = urlparse(self.path)
            path = parsed.path.rstrip("/")
            if path.endswith("/healthz") or path == "/healthz" or path == "/health":
                self._send(200, {"ok": True})
                return
            if path.endswith("/media-exists") or path == "/media-exists":
                if not bearer_ok(self.headers.get("Authorization"), token):
                    self._send(401, {"ok": False, "error": "unauthorized"}, cache="no-store")
                    return
                self._media_exists(parsed.query)
                return
            if path.endswith("/media-upload-status") or path == "/media-upload-status":
                if not bearer_ok(self.headers.get("Authorization"), token):
                    self._send(401, {"ok": False, "error": "unauthorized"}, cache="no-store")
                    return
                self._media_upload_status(parsed.query)
                return
            if not (path.endswith("/property-photos") or path == "/property-photos"):
                self._send(404, {"error": "not found", "photos": [], "count": 0})
                return
            if not bearer_ok(self.headers.get("Authorization"), token):
                self._send(401, {"error": "unauthorized", "photos": [], "count": 0})
                return
            q = parse_qs(parsed.query)
            channel = (q.get("channel", [""])[0] or "").strip()
            if not SAFE_CHANNEL.match(channel):
                self._send(400, {"error": "bad channel", "photos": [], "count": 0})
                return
            try:
                limit = max(1, min(48, int(q.get("limit", ["24"])[0])))
                offset = max(0, int(q.get("offset", ["0"])[0]))
            except ValueError:
                self._send(400, {"error": "bad limit/offset", "photos": [], "count": 0})
                return
            try:
                photos = build_photos(channel, limit, offset)
                self._send(200, {
                    "count": len(photos),
                    "total": total_count(channel),
                    "photos": photos,
                })
            except Exception as err:  # never leak internals; stay honest + quiet
                self._send(500, {"error": "resolve failed: %s" % type(err).__name__,
                                 "photos": [], "count": 0})

    return Handler


def serve(args):
    if not expected_token(args):
        print("REFUSING TO START: no bearer token. Set PHOTO_BRIDGE_TOKEN or "
              "populate %s" % (args.token_file or TOKEN_FILE_DEFAULT), file=sys.stderr)
        sys.exit(2)
    httpd = ThreadingHTTPServer((args.host, args.port), make_handler(args))
    print("photo_server listening on http://%s:%d  (GET /property-photos)" % (args.host, args.port))
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        httpd.shutdown()


# --- Diagnostics -------------------------------------------------------------
def probe(channel):
    """MEASURE the real thumbnail resolution on the NAS -- this is the root-cause
    instrument. Reports how many photos resolve, via which root, and the first
    few unresolved names so the real path drift is visible (Verification
    Doctrine: measure, don't claim)."""
    if not SAFE_CHANNEL.match(channel or ""):
        print(json.dumps({"error": "bad channel"}))
        return
    total = total_count(channel)
    rows = query_rows(channel, 48, 0)
    resolved = premade = downscaled = 0
    strategy_hits = {}
    unresolved = []
    for _cid, _ca, name, _t in rows:
        data, tag = _premade_thumb(name)
        if data is not None:
            premade += 1
            resolved += 1
            strategy_hits[tag] = strategy_hits.get(tag, 0) + 1
            continue
        orig = _find_original(name)
        if orig and _downscale(orig):
            downscaled += 1
            resolved += 1
            continue
        if len(unresolved) < 8:
            unresolved.append(name)
    print(json.dumps({
        "channel": channel,
        "total_in_channel": total,
        "sampled": len(rows),
        "resolved": resolved,
        "via_premade_thumb": premade,
        "via_downscale_fallback": downscaled,
        "unresolved": len(rows) - resolved,
        "strategy_hits": strategy_hits,
        "roots_searched": roots(),
        "undated_roots_searched": undated_roots(),
        "unresolved_sample": unresolved,
        "have_pillow": _have_pillow(),
    }, indent=2))


def _have_pillow():
    try:
        import PIL  # noqa: F401
        return True
    except Exception:
        return False


def selftest():
    """Offline logic checks -- no NAS, no psql, no filesystem needed."""
    checks = []

    def ok(label, cond):
        checks.append((label, bool(cond)))

    ok("channel accepts 1003Koehn", bool(SAFE_CHANNEL.match("1003Koehn")))
    ok("channel rejects traversal", not SAFE_CHANNEL.match("../etc"))
    ok("channel rejects space", not SAFE_CHANNEL.match("bad name"))
    # date-anywhere extraction across every real naming convention in the archive
    ok("date from 20240123_144917.jpg", DATE_ANYWHERE.search("20240123_144917.jpg").group(1, 2) == ("2024", "01"))
    ok("date from Screenshot_20240109_063559_Chrome.jpg",
       DATE_ANYWHERE.search("Screenshot_20240109_063559_Chrome.jpg").group(1, 2) == ("2024", "01"))
    ok("date from PXL_20231225_x.jpg", DATE_ANYWHERE.search("PXL_20231225_x.jpg").group(2) == "12")
    ok("no date from iPhone IMG_3832.jpg", DATE_ANYWHERE.search("IMG_3832.jpg") is None)
    ok("no bogus date (month 13)", DATE_ANYWHERE.search("20241332_x.jpg") is None)
    # _search_bases picks the right strategy
    ok("dated name -> dated strategy", _search_bases("20240123_1.jpg")[1] == "dated")
    ok("dateless name -> undated strategy", _search_bases("IMG_3832.jpg")[1] == "undated")
    ok("dated bases pin {y}/{m}", any("2024/01" in b for b in _search_bases("20240123_1.jpg")[0]))
    # filename is never trusted as a path
    ok("name rejects slash (path sep)", not SAFE_NAME.match("a/b.jpg"))
    ok("name rejects backslash", not SAFE_NAME.match("a\\b.jpg"))
    ok("name accepts spaces + apostrophe", bool(SAFE_NAME.match("Christina's photo.jpg")))
    ok("bearer rejects empty expected", not bearer_ok("Bearer abc", ""))
    ok("bearer rejects missing header", not bearer_ok(None, "secret"))
    ok("bearer rejects wrong token", not bearer_ok("Bearer nope", "secret"))
    ok("bearer accepts right token", bearer_ok("Bearer secret", "secret"))
    ok("bearer is scheme-insensitive", bearer_ok("bearer secret", "secret"))
    ok("roots default non-empty", len(roots()) >= 1)
    ok("undated roots default non-empty", len(undated_roots()) >= 1)
    os.environ["PHOTO_ROOTS"] = "/a/{y}/{m};/b/{y}/{m}"
    ok("roots honors env override", roots() == ["/a/{y}/{m}", "/b/{y}/{m}"])
    del os.environ["PHOTO_ROOTS"]

    # --- phone media backup: names are never trusted as paths ------------------
    ok("media name accepts camera jpg", sanitize_media_name("20260705_082412.jpg") == "20260705_082412.jpg")
    ok("media name accepts phone video", sanitize_media_name("PXL_20260101_120000.mp4") == "PXL_20260101_120000.mp4")
    ok("media name strips directories", sanitize_media_name("../../etc/passwd.jpg") == "passwd.jpg")
    ok("media name strips windows path", sanitize_media_name("C:\\Users\\x\\a.mp4") == "a.mp4")
    ok("media name rejects no extension", sanitize_media_name("noext") is None)
    ok("media name rejects unknown ext", sanitize_media_name("evil.exe") is None)
    ok("media name rejects empty", sanitize_media_name("") is None)
    ok("media name sanitizes unicode/spaces", sanitize_media_name("Christina's video (1).mov") == "Christina_s_video__1_.mov")
    ok("device label accepts clean", sanitize_device_label("darrell-z-fold7") == "darrell-z-fold7")
    ok("device label sanitizes spaces", sanitize_device_label("DP Note 20") == "DP-Note-20")
    ok("device label rejects traversal", sanitize_device_label("../..") is None)
    ok("device label rejects empty", sanitize_device_label("   ") is None)
    ok("upload id accepts client shape", bool(SAFE_UPLOAD_ID.match("dev-4200-1751700000000-IMG_0001.jpg")))
    ok("upload id rejects short", not SAFE_UPLOAD_ID.match("abc"))
    ok("upload id rejects slash", not SAFE_UPLOAD_ID.match("a/b-12345678"))
    ok("media date accepts real date", bool(SAFE_MEDIA_DATE.match("2026-07-05")))
    ok("media date rejects month 13", not SAFE_MEDIA_DATE.match("2026-13-05"))
    ok("media date rejects junk", not SAFE_MEDIA_DATE.match("../2026"))
    # magic bytes: every whitelisted family recognized, junk rejected
    ok("magic jpeg", media_kind(b"\xff\xd8\xff\xe0" + b"\x00" * 12) == "jpeg")
    ok("magic png", media_kind(b"\x89PNG\r\n\x1a\n" + b"\x00" * 8) == "png")
    ok("magic webp", media_kind(b"RIFF\x00\x00\x00\x00WEBPVP8 ") == "webp")
    ok("magic avi", media_kind(b"RIFF\x00\x00\x00\x00AVI LIST") == "avi")
    ok("magic gif", media_kind(b"GIF89a" + b"\x00" * 10) == "gif")
    ok("magic mp4/mov/heic (ftyp)", media_kind(b"\x00\x00\x00\x18ftypmp42\x00\x00\x00\x00") == "isobmff")
    ok("magic webm/mkv (ebml)", media_kind(b"\x1a\x45\xdf\xa3" + b"\x00" * 12) == "ebml")
    ok("magic rejects junk", media_kind(b"MZ\x90\x00" + b"\x00" * 12) is None)
    ok("magic rejects empty", media_kind(b"") is None)
    # destination containment: the resolved path can never escape the root
    os.environ["MEDIA_BACKUP_ROOT"] = "/tmp/poetech-selftest-media"
    dest = final_media_path("dev", "2026-07-05", "a.jpg")
    ok("media dest lands under root + device + y/m",
       dest == "/tmp/poetech-selftest-media/dev/2026/07/a.jpg")
    ok("media root honors env override", media_root() == "/tmp/poetech-selftest-media")
    del os.environ["MEDIA_BACKUP_ROOT"]
    ok("media root has a default", media_root() == MEDIA_ROOT_DEFAULT)
    ok("upload lock is per-id and stable", _upload_lock("id-12345678") is _upload_lock("id-12345678"))

    passed = sum(1 for _, c in checks if c)
    for label, c in checks:
        print(("PASS " if c else "FAIL ") + label)
    print("\n%d/%d checks passed" % (passed, len(checks)))
    sys.exit(0 if passed == len(checks) else 1)


def main():
    ap = argparse.ArgumentParser(description="Sovereign property-photo image server (no n8n).")
    ap.add_argument("--serve", action="store_true", help="run the HTTP server")
    ap.add_argument("--selftest", action="store_true", help="offline logic checks")
    ap.add_argument("--probe", metavar="CHANNEL", help="measure real thumbnail resolution on the NAS")
    ap.add_argument("--host", default=os.environ.get("PHOTO_HOST", "127.0.0.1"))
    ap.add_argument("--port", type=int, default=int(os.environ.get("PHOTO_PORT", "8099")))
    ap.add_argument("--token-file", default=os.environ.get("PHOTO_TOKEN_FILE", TOKEN_FILE_DEFAULT))
    args = ap.parse_args()
    if args.selftest:
        selftest()
    elif args.probe:
        probe(args.probe)
    elif args.serve:
        serve(args)
    else:
        ap.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
