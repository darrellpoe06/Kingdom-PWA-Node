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
#   POST /upload  Authorization: Bearer <token>  { dest, filename, dataUrl }
#   -> { ok, id, dest }   (the sovereign WRITE path; replaces n8n wf-photo-upload
#      so "+ Add photos" is Python end-to-end, off n8n. Magic-byte image check,
#      dest/filename sanitized + path-contained, 8 MB cap. Writes to
#      PHOTO_UPLOAD_ROOT/<dest>/<name>.)
#   GET /property-uploads?dest=<channel>&limit=<n>  Authorization: Bearer <token>
#   -> { count, total, photos:[...], hidden:[<chat post id>, ...] }
#      The OTHER half of an address's photo story: the photos the app ADDED into
#      <upload_root>/<dest>/, plus the ids hidden at this address.
#   POST /property-photo-remove  Authorization: Bearer <token>
#   { dest, id, kind:'added'|'archive' } -> { ok, kind, id, where }
#      RECOVERABLE removal (Christina 2026-10-06). 'added' MOVES the file into
#      <dest>/.trash/; 'archive' only records a chat post id in <dest>/.hidden.json
#      so it stops showing AT THIS ADDRESS. No byte is ever unlinked, and the
#      Synology Chat post and the phone-backup original are never touched.
#   GET /healthz -> { ok: true }   (no auth; liveness only)
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
import hashlib
import hmac
import io
import json
import os
import re
import subprocess
import sys
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

# --- Upload (sovereign write-path; REPLACES the n8n wf-photo-upload bridge) ----
# The PWA's "+ Add photos" POSTs {dest, filename, dataUrl} here so a photo leaves
# the phone and lands on the NAS, sharing the SAME bearer token as the reads.
# This is the Python-first sibling of the read path (Ways: sovereign Python, not
# n8n). Same guarantees the old n8n workflow gave: bearer-gated, dest/filename
# sanitized, path-containment asserted, size-capped, and a MAGIC-BYTE image check
# so the endpoint can only ever write a real JPEG/PNG/WebP -- never an arbitrary
# file. Written to PHOTO_UPLOAD_ROOT/<dest>/<name>; the family gallery reads it back.
UPLOAD_ROOT_DEFAULT = "/volume1/PoeTech/family-photos"
MAX_UPLOAD_BYTES = 8 * 1024 * 1024            # decoded image cap (matches old bridge)
UPLOAD_LIST_MAX = 200                          # hard cap on a family-gallery page
SAFE_DEST = re.compile(r"^[A-Za-z0-9._-]{1,64}$")
DATA_URL_RE = re.compile(r"^data:image/[A-Za-z0-9.+-]+;base64,(.+)$", re.DOTALL)

# --- Removal (RECOVERABLE, never an unlink) -----------------------------------
# Christina 2026-10-06, relayed by Darrell: "I would like to be able to delete and
# add photos to the different addresses in Real Estate." Two different stores sit
# behind one property's photo strip, so "remove from this address" means two
# different -- and both RECOVERABLE -- things:
#
#   kind="added"   a file THIS app wrote to <upload_root>/<dest>/. Removing it
#                  MOVES it to <upload_root>/<dest>/.trash/ with os.replace (same
#                  filesystem, atomic). The bytes are never unlinked; a steward
#                  puts it back from File Station.
#   kind="archive" a Synology Chat post in the property's channel, whose bytes are
#                  the family's PHONE BACKUP. Those are two systems of record this
#                  server must never destroy. Removing it records the post id in
#                  <upload_root>/<dest>/.hidden.json, so every family device stops
#                  showing it AT THIS ADDRESS while the post and the original are
#                  untouched. Reversible by dropping the id from that list.
#
# Guarded EXACTLY like /upload -- same bearer token, same SAFE_DEST, same
# safe_upload_path containment -- and it can only ever touch a name that already
# resolves inside this property's own folder. Nothing here loosens a write guard.
TRASH_DIR = ".trash"
HIDDEN_FILE = ".hidden.json"
MAX_HIDDEN_IDS = 5000                          # bound the per-property hidden list


def _dest_dir(root, dest):
    """Realpath of <root>/<dest>, contained under root, or None."""
    if not SAFE_DEST.match(dest or "") or ".." in (dest or ""):
        return None
    base = os.path.realpath(root)
    d = os.path.realpath(os.path.join(base, dest))
    if d != base and not d.startswith(base + os.sep):
        return None
    return d


def trash_path(root, dest, filename):
    """Where a removed photo goes: <root>/<dest>/.trash/<name>. Containment is
    asserted the same way the upload path asserts it -- the name must already be
    a legal upload name inside this property's folder before a trash path exists."""
    if safe_upload_path(root, dest, filename) is None:
        return None
    d = _dest_dir(root, dest)
    if d is None:
        return None
    tdir = os.path.join(d, TRASH_DIR)
    target = os.path.normpath(os.path.join(tdir, filename))
    if not target.startswith(tdir + os.sep):
        return None
    return target


def read_hidden(root, dest):
    """The ids hidden at this address -- a list of strings. Honest-empty on a bad
    dest, a missing file, or anything unreadable; never raises, never invents."""
    d = _dest_dir(root, dest)
    if d is None:
        return []
    try:
        with open(os.path.join(d, HIDDEN_FILE), "r", encoding="utf-8") as fh:
            data = json.load(fh)
    except (OSError, ValueError):
        return []
    if not isinstance(data, list):
        return []
    return [str(x) for x in data if isinstance(x, (str, int)) and str(x)][:MAX_HIDDEN_IDS]


def hide_id(root, dest, photo_id):
    """Add one chat-archive post id to this address's hidden list. Returns True
    when the list now holds it (already-hidden counts as held). The post and the
    phone-backup original are NOT touched."""
    d = _dest_dir(root, dest)
    pid = str(photo_id or "").strip()
    if d is None or not pid or len(pid) > 255 or "/" in pid or "\\" in pid:
        return False
    current = read_hidden(root, dest)
    if pid in current:
        return True
    current.append(pid)
    current = current[-MAX_HIDDEN_IDS:]
    try:
        os.makedirs(d, exist_ok=True)
        tmp = os.path.join(d, HIDDEN_FILE + ".tmp")
        with open(tmp, "w", encoding="utf-8") as fh:
            json.dump(current, fh)
        os.replace(tmp, os.path.join(d, HIDDEN_FILE))
    except OSError:
        return False
    return True


def trash_uploaded(root, dest, filename):
    """MOVE an uploaded photo into this address's .trash/. Returns 'moved',
    'not-found', or None when the path is refused. Never unlinks."""
    target = safe_upload_path(root, dest, filename)
    tpath = trash_path(root, dest, filename)
    if target is None or tpath is None:
        return None
    if not os.path.isfile(target):
        return "not-found"
    try:
        os.makedirs(os.path.dirname(tpath), exist_ok=True)
        os.replace(target, tpath)
    except OSError:
        return None
    return "moved"


def upload_root():
    return os.environ.get("PHOTO_UPLOAD_ROOT", UPLOAD_ROOT_DEFAULT).rstrip("/") or UPLOAD_ROOT_DEFAULT


def sniff_image(data):
    """Return 'jpg' | 'png' | 'webp' from the bytes' MAGIC NUMBER, else None. The
    bytes decide the type, not the caller's claimed name -- so the write path can
    never be used to drop a script/arbitrary file."""
    if not data or len(data) < 12:
        return None
    if data[:3] == b"\xff\xd8\xff":
        return "jpg"
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return "png"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "webp"
    return None


def upload_filename(filename, ext, blob):
    """A safe, collision-resistant name: sanitized stem + a short content hash +
    the sniffed extension. Content-hash => the SAME image re-uploaded overwrites
    itself (idempotent, no duplicate) while different images never collide."""
    stem = re.sub(r"[^A-Za-z0-9._-]", "_", filename or "").lstrip(".")
    stem = re.sub(r"\.(jpe?g|png|webp)$", "", stem, flags=re.IGNORECASE)[:60] or "photo"
    digest = hashlib.sha256(blob).hexdigest()[:12]
    return "%s-%s.%s" % (stem, digest, ext)


def safe_upload_path(root, dest, filename):
    """Resolve root/dest/filename and ASSERT the result stays inside root/dest --
    no traversal out of the photo folder. Returns the absolute path or None."""
    if not SAFE_DEST.match(dest or "") or ".." in (dest or ""):
        return None
    if not filename or "/" in filename or "\\" in filename or filename in (".", ".."):
        return None
    base = os.path.realpath(root)
    destdir = os.path.realpath(os.path.join(base, dest))
    if destdir != base and not destdir.startswith(base + os.sep):
        return None
    target = os.path.realpath(os.path.join(destdir, filename))
    if not target.startswith(destdir + os.sep):
        return None
    return target


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


# --- Family gallery read-back (sovereign; REPLACES the n8n wf-family-photos) ---
# The upload path (do_POST /upload) writes shared photos to
# PHOTO_UPLOAD_ROOT/<dest>/. This lists them straight back, newest first, so the
# family gallery is Python end-to-end (upload -> NAS -> read) with NO n8n hop --
# the R15 goal ("photos stop living on one device") completed sovereignly. dest
# is whitelist-validated and the directory is path-contained under upload_root().
def _thumb_from_path(path):
    """data:image/jpeg;base64 thumbnail for an uploaded file, or None. Uploaded
    images are already client-compressed, so if the downscale path is unavailable
    (no Pillow/convert) we serve the file as-is when it fits the thumb budget."""
    data = _downscale(path)
    if not data:
        try:
            with open(path, "rb") as fh:
                raw = fh.read(MAX_THUMB_BYTES * 3 + 1)
            if 0 < len(raw) <= MAX_THUMB_BYTES * 3 and sniff_image(raw):
                data = raw
        except OSError:
            data = None
    if not data:
        return None
    return "data:image/jpeg;base64," + base64.b64encode(data).decode("ascii")


def list_uploaded(dest, limit=12):
    """{ photos:[{id,date,name,text,thumb}], total } for PHOTO_UPLOAD_ROOT/<dest>/,
    newest-first. Honest-empty ({photos:[], total:0}) on a bad dest, a contained-
    path failure, or a missing/empty folder -- never raises, never invents."""
    d = _dest_dir(upload_root(), dest)
    if d is None:
        return {"photos": [], "total": 0}
    entries = []
    try:
        with os.scandir(d) as it:
            for e in it:
                try:
                    # Dotfiles are this folder's own bookkeeping (.hidden.json),
                    # never a photo; .trash/ is a directory and already excluded.
                    if e.name.startswith("."):
                        continue
                    if e.is_file() and SAFE_NAME.match(e.name):
                        entries.append((e.stat().st_mtime, e.name, e.path))
                except OSError:
                    pass
    except OSError:
        return {"photos": [], "total": 0}
    entries.sort(reverse=True)
    n = max(1, min(UPLOAD_LIST_MAX, int(limit) if str(limit).lstrip("-").isdigit() else 12))
    photos = []
    for mtime, name, path in entries[:n]:
        try:
            date = datetime.fromtimestamp(mtime, timezone.utc).strftime("%Y-%m-%d")
        except (ValueError, OverflowError):
            date = ""
        photos.append({"id": name, "date": date, "name": name, "text": "", "thumb": _thumb_from_path(path)})
    return {"photos": photos, "total": len(entries)}


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
        server_version = "poetech-photos/1.0"

        def _send(self, code, payload):
            body = json.dumps(payload).encode("utf-8")
            self.send_response(code)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "private, max-age=60")
            self.end_headers()
            self.wfile.write(body)

        def log_message(self, *a):  # keep the NAS console quiet; never log tokens
            pass

        def do_GET(self):
            parsed = urlparse(self.path)
            path = parsed.path.rstrip("/")
            if path.endswith("/healthz") or path == "/healthz" or path == "/health":
                self._send(200, {"ok": True})
                return
            # Family gallery read-back (sovereign; replaces n8n wf-family-photos).
            if path.endswith("/family-photos") or path == "/family-photos":
                if not bearer_ok(self.headers.get("Authorization"), token):
                    self._send(401, {"error": "unauthorized", "photos": [], "count": 0})
                    return
                q = parse_qs(parsed.query)
                try:
                    limit = max(1, min(UPLOAD_LIST_MAX, int(q.get("limit", ["12"])[0])))
                except ValueError:
                    limit = 12
                try:
                    res = list_uploaded("family", limit)
                    self._send(200, {"count": len(res["photos"]), "total": res["total"], "photos": res["photos"]})
                except Exception as err:
                    self._send(500, {"error": "list failed: %s" % type(err).__name__, "photos": [], "count": 0})
                return
            # A PROPERTY'S OWN added photos + what has been hidden at this address
            # (Christina 2026-10-06). The chat archive is read by /property-photos;
            # this is the other half of the same address's story -- the photos the
            # app added into <upload_root>/<dest>/ -- plus the hidden-id list the
            # client uses to drop a removed archive photo from THIS address's grid.
            if path.endswith("/property-uploads") or path == "/property-uploads":
                if not bearer_ok(self.headers.get("Authorization"), token):
                    self._send(401, {"error": "unauthorized", "photos": [], "count": 0, "hidden": []})
                    return
                q = parse_qs(parsed.query)
                dest = (q.get("dest", [""])[0] or "").strip()
                if not SAFE_DEST.match(dest):
                    self._send(400, {"error": "bad dest", "photos": [], "count": 0, "hidden": []})
                    return
                try:
                    limit = max(1, min(UPLOAD_LIST_MAX, int(q.get("limit", ["200"])[0])))
                except ValueError:
                    limit = 200
                try:
                    res = list_uploaded(dest, limit)
                    self._send(200, {"count": len(res["photos"]), "total": res["total"],
                                     "photos": res["photos"], "hidden": read_hidden(upload_root(), dest)})
                except Exception as err:
                    self._send(500, {"error": "list failed: %s" % type(err).__name__,
                                     "photos": [], "count": 0, "hidden": []})
                return
            # Curated Big-Picture album (Synology Photos). The read-only service-
            # account integration is a separate, still-pending NAS lane; until it
            # ships, answer HONESTLY-EMPTY so the client renders nothing (never a
            # fabricated gallery, DR-0076) and NEVER falls back to n8n.
            if path.endswith("/album-photos") or path == "/album-photos":
                if not bearer_ok(self.headers.get("Authorization"), token):
                    self._send(401, {"error": "unauthorized", "photos": [], "count": 0})
                    return
                self._send(200, {"count": 0, "total": 0, "photos": [], "pending": "album-integration"})
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

        def do_POST(self):
            # Sovereign photo UPLOAD (replaces the n8n wf-photo-upload bridge).
            # POST .../upload  Authorization: Bearer <token>
            #   { dest, filename, dataUrl } -> { ok, id, dest }
            parsed = urlparse(self.path)
            path = parsed.path.rstrip("/")
            if path.endswith("/property-photo-remove") or path == "/property-photo-remove":
                self._remove_property_photo()
                return
            if not (path.endswith("/upload") or path == "/upload"):
                self._send(404, {"ok": False, "error": "not found"})
                return
            if not bearer_ok(self.headers.get("Authorization"), token):
                self._send(401, {"ok": False, "error": "unauthorized"})
                return
            try:
                length = int(self.headers.get("Content-Length", "0"))
            except ValueError:
                length = 0
            # base64 is ~4/3 of the raw bytes; cap the request accordingly.
            if length <= 0 or length > MAX_UPLOAD_BYTES * 2:
                self._send(413, {"ok": False, "error": "too large"})
                return
            try:
                body = json.loads(self.rfile.read(length).decode("utf-8", "replace"))
            except (ValueError, OSError):
                self._send(400, {"ok": False, "error": "bad json"})
                return
            dest = (str(body.get("dest", "family")).strip() or "family")
            m = DATA_URL_RE.match(str(body.get("dataUrl", "")))
            if not m:
                self._send(400, {"ok": False, "error": "bad dataUrl"})
                return
            try:
                blob = base64.b64decode(m.group(1), validate=True)
            except (ValueError, TypeError):  # binascii.Error subclasses ValueError
                self._send(400, {"ok": False, "error": "bad base64"})
                return
            if not blob or len(blob) > MAX_UPLOAD_BYTES:
                self._send(413, {"ok": False, "error": "too large"})
                return
            ext = sniff_image(blob)
            if not ext:
                self._send(415, {"ok": False, "error": "not an image"})
                return
            name = upload_filename(str(body.get("filename", "")), ext, blob)
            target = safe_upload_path(upload_root(), dest, name)
            if not target:
                self._send(400, {"ok": False, "error": "bad path"})
                return
            try:
                os.makedirs(os.path.dirname(target), exist_ok=True)
                with open(target, "wb") as fh:
                    fh.write(blob)
            except OSError as err:
                self._send(500, {"ok": False, "error": "write failed: %s" % type(err).__name__})
                return
            self._send(200, {"ok": True, "id": name, "dest": dest})

        def _remove_property_photo(self):
            # POST .../property-photo-remove  Authorization: Bearer <token>
            #   { dest, id, kind:'added'|'archive' } -> { ok, kind, id, where }
            # RECOVERABLE BY CONSTRUCTION: 'added' MOVES the file to the address's
            # .trash/, 'archive' only records the chat post id in .hidden.json.
            # Nothing here deletes bytes; same bearer + same path containment as
            # /upload, and it can only reach this property's own folder.
            if not bearer_ok(self.headers.get("Authorization"), token):
                self._send(401, {"ok": False, "error": "unauthorized"})
                return
            try:
                length = int(self.headers.get("Content-Length", "0"))
            except ValueError:
                length = 0
            if length <= 0 or length > 64 * 1024:
                self._send(413, {"ok": False, "error": "too large"})
                return
            try:
                body = json.loads(self.rfile.read(length).decode("utf-8", "replace"))
            except (ValueError, OSError):
                self._send(400, {"ok": False, "error": "bad json"})
                return
            dest = str(body.get("dest", "")).strip()
            photo_id = str(body.get("id", "")).strip()
            kind = str(body.get("kind", "")).strip()
            if not SAFE_DEST.match(dest):
                self._send(400, {"ok": False, "error": "bad dest"})
                return
            if not photo_id:
                self._send(400, {"ok": False, "error": "bad id"})
                return
            if kind not in ("added", "archive"):
                self._send(400, {"ok": False, "error": "bad kind"})
                return
            if kind == "archive":
                if not hide_id(upload_root(), dest, photo_id):
                    self._send(500, {"ok": False, "error": "hide failed"})
                    return
                self._send(200, {"ok": True, "kind": "archive", "id": photo_id,
                                 "dest": dest, "where": "hidden-at-this-address"})
                return
            outcome = trash_uploaded(upload_root(), dest, photo_id)
            if outcome is None:
                self._send(400, {"ok": False, "error": "bad path"})
                return
            if outcome == "not-found":
                self._send(404, {"ok": False, "error": "not-found"})
                return
            self._send(200, {"ok": True, "kind": "added", "id": photo_id,
                             "dest": dest, "where": "%s/%s" % (dest, TRASH_DIR)})

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
    # --- Upload write-path (sovereign, replaces n8n) -------------------------
    ok("sniff detects JPEG", sniff_image(b"\xff\xd8\xff\xe0" + b"\x00" * 12) == "jpg")
    ok("sniff detects PNG", sniff_image(b"\x89PNG\r\n\x1a\n" + b"\x00" * 12) == "png")
    ok("sniff detects WebP", sniff_image(b"RIFF\x00\x00\x00\x00WEBP" + b"\x00" * 4) == "webp")
    ok("sniff rejects a text/script blob", sniff_image(b"#!/bin/sh\necho hi\n" + b"\x00" * 8) is None)
    ok("sniff rejects too-short", sniff_image(b"\xff\xd8") is None)
    ok("upload name carries a content hash + sniffed ext",
       upload_filename("My Photo.png", "jpg", b"abc").endswith(".jpg")
       and upload_filename("My Photo.png", "jpg", b"abc") == upload_filename("x.png", "jpg", b"abc").replace("x", "My_Photo"))
    ok("same bytes -> same upload name (idempotent)",
       upload_filename("a.jpg", "jpg", b"same") == upload_filename("a.jpg", "jpg", b"same"))
    ok("different bytes -> different upload name",
       upload_filename("a.jpg", "jpg", b"one") != upload_filename("a.jpg", "jpg", b"two"))
    _r = "/volume1/PoeTech/family-photos"
    ok("upload path accepts a clean dest+name",
       safe_upload_path(_r, "family", "photo-abc123.jpg") == os.path.realpath(_r + "/family/photo-abc123.jpg"))
    ok("upload path rejects dest traversal", safe_upload_path(_r, "../secrets", "x.jpg") is None)
    ok("upload path rejects slash in name", safe_upload_path(_r, "family", "a/b.jpg") is None)
    ok("upload path rejects backslash in name", safe_upload_path(_r, "family", "a\\b.jpg") is None)
    ok("upload path rejects dotdot name", safe_upload_path(_r, "family", "..") is None)
    ok("upload root honors env override",
       (os.environ.__setitem__("PHOTO_UPLOAD_ROOT", "/tmp/pu"), upload_root() == "/tmp/pu",
        os.environ.pop("PHOTO_UPLOAD_ROOT"))[1])
    os.environ["PHOTO_ROOTS"] = "/a/{y}/{m};/b/{y}/{m}"
    ok("roots honors env override", roots() == ["/a/{y}/{m}", "/b/{y}/{m}"])
    del os.environ["PHOTO_ROOTS"]
    # --- Family gallery read-back (list_uploaded) ----------------------------
    ok("list_uploaded rejects a bad dest (honest-empty)", list_uploaded("../secrets") == {"photos": [], "total": 0})
    ok("list_uploaded rejects a slashy dest", list_uploaded("a/b") == {"photos": [], "total": 0})
    ok("list_uploaded on a missing folder is honest-empty",
       list_uploaded("familyXYZ_does_not_exist")["total"] == 0)
    import tempfile as _tf
    _d = _tf.mkdtemp()
    try:
        os.makedirs(os.path.join(_d, "family"), exist_ok=True)
        # a real tiny JPEG (magic bytes) so the read-back + thumb path exercise
        with open(os.path.join(_d, "family", "shot-abc.jpg"), "wb") as _fh:
            _fh.write(b"\xff\xd8\xff\xe0" + b"\x00" * 64)
        os.environ["PHOTO_UPLOAD_ROOT"] = _d
        _res = list_uploaded("family", 12)
        ok("list_uploaded reads a written family photo back",
           _res["total"] == 1 and _res["photos"][0]["id"] == "shot-abc.jpg")
        ok("list_uploaded contains the file under upload_root only",
           safe_upload_path(upload_root(), "family", "shot-abc.jpg") is not None)
        # --- Removal is RECOVERABLE (Christina 2026-10-06) --------------------
        ok("trash path refuses dest traversal", trash_path(_d, "../secrets", "a.jpg") is None)
        ok("trash path refuses a slashy name", trash_path(_d, "family", "a/b.jpg") is None)
        ok("trash path stays inside the address's own folder",
           trash_path(_d, "family", "shot-abc.jpg").startswith(os.path.realpath(os.path.join(_d, "family", TRASH_DIR)) + os.sep)
           or trash_path(_d, "family", "shot-abc.jpg").startswith(os.path.join(_d, "family", TRASH_DIR) + os.sep))
        ok("removing an added photo MOVES it (bytes still on the NAS)",
           trash_uploaded(_d, "family", "shot-abc.jpg") == "moved"
           and os.path.isfile(os.path.join(_d, "family", TRASH_DIR, "shot-abc.jpg"))
           and not os.path.exists(os.path.join(_d, "family", "shot-abc.jpg")))
        ok("the removed photo is gone from the address's list",
           list_uploaded("family", 12)["total"] == 0)
        ok("removing a photo that is not there says not-found",
           trash_uploaded(_d, "family", "never-here.jpg") == "not-found")
        ok("hidden list starts empty", read_hidden(_d, "family") == [])
        ok("hiding a chat-archive id records it", hide_id(_d, "family", "post-9001") is True
           and read_hidden(_d, "family") == ["post-9001"])
        ok("hiding the same id twice is idempotent", hide_id(_d, "family", "post-9001") is True
           and read_hidden(_d, "family") == ["post-9001"])
        ok("hiding refuses a slashy id", hide_id(_d, "family", "../x") is False)
        ok("hiding refuses a bad dest", hide_id(_d, "../secrets", "post-1") is False)
        ok("the hidden bookkeeping file is never listed as a photo",
           all(not p["id"].startswith(".") for p in list_uploaded("family", 12)["photos"]))
        ok("read_hidden on a bad dest is honest-empty", read_hidden(_d, "../secrets") == [])
    finally:
        os.environ.pop("PHOTO_UPLOAD_ROOT", None)
        import shutil as _sh
        _sh.rmtree(_d, ignore_errors=True)

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
