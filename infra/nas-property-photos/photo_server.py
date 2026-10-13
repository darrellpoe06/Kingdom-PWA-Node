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
import hashlib
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

# --- The other door, and the Funnel road (DR-0999) ----------------------------
# Darrell, 2026-10-13: "Most of the properties have pictures already on the
# nas... why don't they show up [in Poe Properties]... they all should be in
# sync... End to end processes!!!" and "Drop down with addresses... instead of
# letting someone else mistyped". Three additions, all read-only against the
# archive, all behind the same bearer:
#   GET /channels            -> which archives exist, with their picture counts,
#                               so a door's archive is PICKED, never typed.
#   GET /property-photo      -> ONE picture at listing size (<= PHOTO_MAX_EDGE px
#                               on its long edge, JPEG), so a NAS picture can be
#                               filed on a listing exactly as a phone upload is.
#                               Every other route serves a ~20KB thumbnail only.
#   OPTIONS + CORS headers   -> while every Cloudflare Pages Function is dark
#                               (#2057), the app reaches this server straight
#                               over the Tailscale Funnel, cross-origin, the
#                               way /cams and /sb already do; a browser refuses
#                               that without these answers (measured 2026-10-09
#                               on /cams: preflight 501, no allow-origin).
# PHOTO_CHAT_FIXTURE=<json> replaces the Synology Chat reads with a file, so
# the SAME server, over real HTTP, is what the Chrome journeys and the selftest
# talk to -- never a stand-in (LESSONS P59: a mocked service proves only that
# the client is self-consistent).
CORS_ORIGINS_DEFAULT = "https://poetech.us"
PHOTO_MAX_EDGE = 1920          # a listing picture's long edge (DR-0939's 1920)
PHOTO_MAX_EDGE_CEILING = 2560  # the most a caller may ask for
PHOTO_QUALITY = 85
MAX_PHOTO_BYTES = 6 * 1024 * 1024


def cors_origins():
    env = os.environ.get("PHOTO_CORS_ORIGINS", "").strip()
    return [o.strip() for o in (env or CORS_ORIGINS_DEFAULT).split(",") if o.strip()]


def cors_headers(origin):
    """The headers a browser needs to accept an answer from another origin,
    only for an origin on the list; anything else gets none (same as before)."""
    if origin and origin in cors_origins():
        return [
            ("Access-Control-Allow-Origin", origin),
            ("Vary", "Origin"),
            ("Access-Control-Allow-Headers", "authorization, content-type"),
            ("Access-Control-Allow-Methods", "GET, POST, OPTIONS"),
            ("Access-Control-Max-Age", "600"),
        ]
    return []


def chat_fixture():
    """{"channels":[{"name", "posts":[{"id","create_at","name","text"}]}]} or None."""
    path = os.environ.get("PHOTO_CHAT_FIXTURE", "").strip()
    if not path:
        return None
    try:
        with open(path, "r", encoding="utf-8") as fh:
            data = json.load(fh)
    except (OSError, ValueError):
        return {"channels": []}
    return data if isinstance(data, dict) else {"channels": []}


def _fixture_posts(fx, channel):
    for c in fx.get("channels", []):
        if c.get("name") == channel:
            posts = [p for p in c.get("posts", []) if isinstance(p, dict)]
            return sorted(posts, key=lambda p: -int(p.get("create_at", 0) or 0))
    return []

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
# AN ABANDONED PART IS SWEPT, A RESUMABLE ONE IS NOT (2026-10-13, DR-0996).
# A .part is removed on completion, on a magic-byte rejection and on a bad
# destination -- but NOT when an upload is simply abandoned: the tab closes,
# the phone sleeps, the network goes for good, or the file is deleted off the
# phone before the backup is re-run. Those parts are up to MAX_MEDIA_BYTES
# each and nothing ever swept them, so the lane that exists to protect the
# family's media would slowly fill the volume holding it. Eager deletion is
# NOT the fix -- resume across sessions is the whole design, and that is what
# makes "safe to switch phones" cheap to re-run. So parts are kept for a
# generous window and swept only once they are far past any real resume.
PART_TTL_SECONDS = 14 * 24 * 60 * 60        # 14 days; a resume long dead
PART_SUFFIX = ".part"
# One lock per in-flight upload id so ThreadingHTTPServer appends never interleave.
_MEDIA_LOCKS = {}
_MEDIA_LOCKS_GUARD = threading.Lock()


def media_root():
    return os.environ.get("MEDIA_BACKUP_ROOT", "").strip() or MEDIA_ROOT_DEFAULT


def _upload_lock(upload_id):
    with _MEDIA_LOCKS_GUARD:
        return _MEDIA_LOCKS.setdefault(upload_id, threading.Lock())


def parts_dir():
    return os.path.join(media_root(), ".parts")


def sweep_stale_parts(now=None, ttl=PART_TTL_SECONDS):
    """Delete abandoned chunk files older than ttl. Returns (count, bytes).

    Deliberately narrow: only regular files, only directly inside .parts/,
    only names ending .part, and only ones whose mtime is past the window. A
    symlink, a directory, or anything else in there is left alone -- this
    sweeps its own scratch space and nothing else. Never raises; a sweep that
    cannot run must not take the upload path down with it."""
    d = parts_dir()
    cutoff = (now if now is not None else datetime.now(timezone.utc).timestamp()) - ttl
    freed, count = 0, 0
    try:
        names = os.listdir(d)
    except OSError:
        return (0, 0)
    for name in names:
        if not name.endswith(PART_SUFFIX):
            continue
        p = os.path.join(d, name)
        try:
            if os.path.islink(p) or not os.path.isfile(p):
                continue
            st = os.stat(p)
            if st.st_mtime >= cutoff:
                continue
            os.remove(p)
        except OSError:
            continue
        count += 1
        freed += st.st_size
    return (count, freed)


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
    fx = chat_fixture()
    if fx is not None:
        return [[str(p.get("id", "")), str(p.get("create_at", 0)), str(p.get("name", "")), str(p.get("text", ""))]
                for p in _fixture_posts(fx, channel)[offset:offset + limit]]
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
    fx = chat_fixture()
    if fx is not None:
        return len(_fixture_posts(fx, channel))
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


def channel_list():
    """Every archive the NAS holds, with how many pictures each has:
    [{name, total}], names that pass SAFE_CHANNEL only, by name."""
    fx = chat_fixture()
    if fx is not None:
        rows = [(str(c.get("name", "")), len(_fixture_posts(fx, str(c.get("name", ""))))) for c in fx.get("channels", [])]
    else:
        sql = (
            "SELECT c.name, COUNT(p.id) FROM channels c "
            "LEFT JOIN posts p ON p.channel_id = c.id "
            "AND (p.file_props->>'is_image') = 'true' AND COALESCE(p.delete_at,0) = 0 "
            "GROUP BY c.name ORDER BY c.name"
        )
        raw = _psql(sql).strip("\x1e\n")
        rows = []
        for rec in (raw.split("\x1e") if raw else []):
            cols = rec.split("\x1f")
            if len(cols) >= 2:
                try:
                    rows.append((cols[0], int(cols[1])))
                except ValueError:
                    rows.append((cols[0], 0))
    out = [{"name": n, "total": t} for n, t in rows if SAFE_CHANNEL.match(n or "")]
    out.sort(key=lambda c: c["name"].lower())
    return out


def post_by_id(channel, photo_id):
    """(create_at, name, text) of one post in a channel, or None."""
    fx = chat_fixture()
    if fx is not None:
        for p in _fixture_posts(fx, channel):
            if str(p.get("id", "")) == str(photo_id):
                return (str(p.get("create_at", 0)), str(p.get("name", "")), str(p.get("text", "")))
        return None
    if not re.match(r"^\d{1,20}$", str(photo_id)):
        return None
    sql = (
        "SELECT p.create_at, p.file_props->>'name', COALESCE(p.message,'') "
        "FROM posts p JOIN channels c ON c.id = p.channel_id "
        "WHERE c.name = '%s' AND p.id = %s AND (p.file_props->>'is_image') = 'true' "
        "AND COALESCE(p.delete_at,0) = 0 LIMIT 1" % (channel, photo_id)
    )
    raw = _psql(sql).strip("\x1e\n")
    if not raw:
        return None
    cols = raw.split("\x1e")[0].split("\x1f")
    return (cols[0], cols[1], cols[2]) if len(cols) >= 3 else None


# --- THE WHOLE LIBRARY BY MONTH (DR-1002) -------------------------------------
# Darrell, 2026-10-13: "The nas has all pictures period!!! All my photos are
# uploaded in the Synology photos app... why not just pull from there?
# However I'm locked out while being logged in". So the app reads the
# library the way the file system holds it -- the dated photo roots and the
# phone backup (<device>/<y>/<m>) -- with no Synology Photos sign-in at all.
# Read-only: lists a month, serves one picture at listing size; writes nothing.
LIBRARY_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"}
SAFE_MONTH = re.compile(r"^(20\d{2})-(0[1-9]|1[0-2])$")
LIBRARY_PAGE_MAX = 24


def library_dirs(y, mo):
    """Every folder that may hold that month's pictures: the dated roots with
    {y}/{m} filled in, and the phone backup's <device>/<y>/<m> folders."""
    dirs = [t.format(y=y, m=mo) for t in roots()]
    try:
        dirs += sorted(glob.glob(os.path.join(media_root(), "*", y, mo)))
    except Exception:
        pass
    return dirs


def library_month(month, limit, offset):
    """{photos:[{id,name,date,text,thumb}], total, month} for one month of the
    library, newest name first (camera names carry the date and time). None
    when the month is not a month. Honest-empty on a missing folder."""
    m = SAFE_MONTH.match(month or "")
    if not m:
        return None
    y, mo = m.group(1), m.group(2)
    entries = []
    seen = set()
    for d in library_dirs(y, mo):
        try:
            with os.scandir(d) as it:
                for e in it:
                    try:
                        if e.name.startswith(".") or not e.is_file():
                            continue
                        if os.path.splitext(e.name)[1].lower() not in LIBRARY_EXTS:
                            continue
                        if not SAFE_NAME.match(e.name) or e.name in seen:
                            continue
                        seen.add(e.name)
                        entries.append((e.name, e.stat().st_mtime, e.path))
                    except OSError:
                        pass
        except OSError:
            continue
    entries.sort(key=lambda t: t[0], reverse=True)
    photos = []
    for name, mtime, path in entries[offset:offset + limit]:
        dm = DATE_ANYWHERE.search(name)
        if dm:
            date = "%s-%s-%s" % (dm.group(1), dm.group(2), dm.group(3))
        else:
            date = datetime.fromtimestamp(mtime, timezone.utc).strftime("%Y-%m-%d")
        photos.append({"id": name, "name": name, "date": date, "text": "", "thumb": _thumb_from_path(path)})
    return {"photos": photos, "total": len(entries), "month": month}


def find_library_original(name):
    """The file for a library name: the dated roots first (_find_original),
    then the phone backup's <device>/<y>/<m> folders. None when absent."""
    if not SAFE_NAME.match(name or "") or "/" in name or "\\" in name or name.startswith("."):
        return None
    hit = _find_original(name)
    if hit:
        return hit
    dm = DATE_ANYWHERE.search(name)
    pattern = os.path.join(media_root(), "*", dm.group(1), dm.group(2), glob.escape(name)) if dm \
        else os.path.join(media_root(), "*", "*", "*", glob.escape(name))
    try:
        hits = sorted(glob.glob(pattern))
    except Exception:
        hits = []
    return hits[0] if hits else None


def listing_size(path, max_edge):
    """The original, downscaled so its LONG edge is at most max_edge, as JPEG
    bytes plus (width, height). Pillow first, ImageMagick second, else None.
    Never rewrites the original on disk."""
    try:
        if os.path.getsize(path) > MAX_ORIGINAL_BYTES:
            return None
    except OSError:
        return None
    try:
        from PIL import Image, ImageOps  # noqa: PLC0415 -- optional, lazy by design
        with Image.open(path) as im:
            im = ImageOps.exif_transpose(im).convert("RGB")
            im.thumbnail((max_edge, max_edge))
            buf = io.BytesIO()
            im.save(buf, format="JPEG", quality=PHOTO_QUALITY, optimize=True)
            data = buf.getvalue()
            return (data, im.size) if 0 < len(data) <= MAX_PHOTO_BYTES else None
    except Exception:
        pass
    try:
        out = subprocess.run(
            ["convert", path + "[0]", "-auto-orient", "-resize", "%dx%d>" % (max_edge, max_edge),
             "-quality", str(PHOTO_QUALITY), "jpg:-"],
            stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, timeout=30,
        )
        data = out.stdout
        return (data, None) if 0 < len(data) <= MAX_PHOTO_BYTES else None
    except (OSError, subprocess.SubprocessError):
        return None


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
        server_version = "poetech-photos/1.1"

        def _send(self, code, payload, cache="private, max-age=60"):
            body = json.dumps(payload).encode("utf-8")
            self.send_response(code)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", cache)
            for k, v in cors_headers(self.headers.get("Origin")):
                self.send_header(k, v)
            self.end_headers()
            self.wfile.write(body)

        def do_OPTIONS(self):
            # The browser's preflight for the cross-origin Funnel road (DR-0999).
            # An origin not on the list gets a bare 204 and the browser refuses
            # the real request, which is the point.
            self.send_response(204)
            for k, v in cors_headers(self.headers.get("Origin")):
                self.send_header(k, v)
            self.send_header("Content-Length", "0")
            self.end_headers()

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
            part = os.path.join(parts_dir(), upload_id + PART_SUFFIX)
            have = 0
            try:
                if os.path.isfile(part):
                    have = os.path.getsize(part)
            except OSError:
                have = 0
            self._send(200, {"ok": True, "bytes": have}, cache="no-store")

        # --- Phone media backup: the chunked, resumable write ------------------
        # A helper, not a second do_POST: this class already HAS one (/upload +
        # /property-photo-remove), and two defs of the same name do not conflict
        # in git -- the later simply shadows the earlier, which would have left
        # whichever lost silently 404ing on a live NAS. Dispatched from do_POST
        # below, the way do_GET dispatches _media_exists / _media_upload_status.
        def _media_upload(self):
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
            part = os.path.join(parts_dir(), upload_id + PART_SUFFIX)
            with _upload_lock(upload_id):
                try:
                    os.makedirs(parts_dir(), exist_ok=True)
                    have = os.path.getsize(part) if os.path.isfile(part) else 0
                    if offset == 0 and have == 0:
                        # A brand-new file: once per upload, not per chunk, so
                        # a long-lived service still sweeps what it abandons.
                        sweep_stale_parts()
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
            # WHICH ARCHIVES EXIST (DR-0999): a door's archive is picked from this
            # list in the app, never typed. Names and counts only.
            if path.endswith("/channels") or path == "/channels":
                if not bearer_ok(self.headers.get("Authorization"), token):
                    self._send(401, {"error": "unauthorized", "channels": [], "count": 0})
                    return
                try:
                    chans = channel_list()
                    self._send(200, {"count": len(chans), "channels": chans})
                except Exception as err:
                    self._send(500, {"error": "list failed: %s" % type(err).__name__, "channels": [], "count": 0})
                return
            # ONE PICTURE AT LISTING SIZE (DR-0999): so a NAS picture can be filed
            # on a door's listing exactly as a phone upload is. The original is
            # read and downscaled in memory; nothing on the NAS is written.
            if path.endswith("/property-photo") or path == "/property-photo":
                if not bearer_ok(self.headers.get("Authorization"), token):
                    self._send(401, {"ok": False, "error": "unauthorized"})
                    return
                q = parse_qs(parsed.query)
                channel = (q.get("channel", [""])[0] or "").strip()
                photo_id = (q.get("id", [""])[0] or "").strip()
                if not SAFE_CHANNEL.match(channel) or not photo_id:
                    self._send(400, {"ok": False, "error": "bad channel or id"})
                    return
                try:
                    max_edge = max(320, min(PHOTO_MAX_EDGE_CEILING, int(q.get("max", [str(PHOTO_MAX_EDGE)])[0])))
                except ValueError:
                    max_edge = PHOTO_MAX_EDGE
                try:
                    post = post_by_id(channel, photo_id)
                except Exception as err:
                    self._send(500, {"ok": False, "error": "lookup failed: %s" % type(err).__name__})
                    return
                if not post:
                    self._send(404, {"ok": False, "error": "no such picture in this archive"})
                    return
                create_at, name, text = post
                orig = _find_original(name)
                if not orig:
                    self._send(404, {"ok": False, "error": "the original is not on this NAS", "name": name})
                    return
                sized = listing_size(orig, max_edge)
                if not sized:
                    self._send(422, {"ok": False, "error": "could not size the picture", "name": name})
                    return
                data, size = sized
                try:
                    date = datetime.fromtimestamp(int(create_at) / 1000, timezone.utc).strftime("%Y-%m-%d")
                except (ValueError, OverflowError):
                    date = ""
                self._send(200, {
                    "ok": True, "id": photo_id, "name": name, "date": date, "text": (text or "")[:280],
                    "width": size[0] if size else None, "height": size[1] if size else None,
                    "bytes": len(data), "image": "data:image/jpeg;base64," + base64.b64encode(data).decode("ascii"),
                })
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
            # THE WHOLE LIBRARY BY MONTH (DR-1002): the dated photo roots and the
            # phone backup, read as folders -- no Synology Photos sign-in.
            if path.endswith("/library") or path == "/library":
                if not bearer_ok(self.headers.get("Authorization"), token):
                    self._send(401, {"error": "unauthorized", "photos": [], "count": 0})
                    return
                q = parse_qs(parsed.query)
                month = (q.get("month", [""])[0] or "").strip()
                try:
                    limit = max(1, min(LIBRARY_PAGE_MAX, int(q.get("limit", [str(LIBRARY_PAGE_MAX)])[0])))
                    offset = max(0, int(q.get("offset", ["0"])[0]))
                except ValueError:
                    self._send(400, {"error": "bad limit/offset", "photos": [], "count": 0})
                    return
                try:
                    lib = library_month(month, limit, offset)
                except Exception as err:
                    self._send(500, {"error": "library failed: %s" % type(err).__name__, "photos": [], "count": 0})
                    return
                if lib is None:
                    self._send(400, {"error": "bad month (YYYY-MM)", "photos": [], "count": 0})
                    return
                self._send(200, {"count": len(lib["photos"]), "total": lib["total"], "month": lib["month"], "photos": lib["photos"]})
                return
            # ONE LIBRARY PICTURE AT LISTING SIZE (DR-1002), by its file name.
            if path.endswith("/library-photo") or path == "/library-photo":
                if not bearer_ok(self.headers.get("Authorization"), token):
                    self._send(401, {"ok": False, "error": "unauthorized"})
                    return
                q = parse_qs(parsed.query)
                name = (q.get("name", [""])[0] or "").strip()
                if not SAFE_NAME.match(name) or "/" in name or "\\" in name or name.startswith("."):
                    self._send(400, {"ok": False, "error": "bad name"})
                    return
                try:
                    max_edge = max(320, min(PHOTO_MAX_EDGE_CEILING, int(q.get("max", [str(PHOTO_MAX_EDGE)])[0])))
                except ValueError:
                    max_edge = PHOTO_MAX_EDGE
                orig = find_library_original(name)
                if not orig:
                    self._send(404, {"ok": False, "error": "no such picture in the library", "name": name})
                    return
                sized = listing_size(orig, max_edge)
                if not sized:
                    self._send(422, {"ok": False, "error": "could not size the picture", "name": name})
                    return
                data, size = sized
                dm = DATE_ANYWHERE.search(name)
                date = "%s-%s-%s" % (dm.group(1), dm.group(2), dm.group(3)) if dm else ""
                self._send(200, {
                    "ok": True, "id": name, "name": name, "date": date, "text": "",
                    "width": size[0] if size else None, "height": size[1] if size else None,
                    "bytes": len(data), "image": "data:image/jpeg;base64," + base64.b64encode(data).decode("ascii"),
                })
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
            # Phone -> NAS media backup: raw chunked bodies, not the JSON
            # dataUrl shape /upload below speaks (Darrell 2026-07-05).
            if path.endswith("/media-upload") or path == "/media-upload":
                if not bearer_ok(self.headers.get("Authorization"), token):
                    self._send(401, {"ok": False, "error": "unauthorized"}, cache="no-store")
                    return
                self._media_upload()
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
    # Sweep abandoned backup chunks once at start, so a restart is also the
    # thing that reclaims the volume (DR-0996). Says what it did, or nothing.
    swept, freed = sweep_stale_parts()
    if swept:
        print("swept %d abandoned upload part(s), %.1f MB reclaimed from %s"
              % (swept, freed / (1024.0 * 1024.0), parts_dir()))
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

    # THE SWEEP TAKES THE ABANDONED AND LEAVES THE RESUMABLE (DR-0996).
    # Exercised on a real temp tree, not a mock: the whole point is what it
    # does to files on disk, and a mocked os.remove would prove nothing.
    import shutil as _shutil
    import tempfile as _tempfile
    _tmp = _tempfile.mkdtemp(prefix="poetech-selftest-parts-")
    try:
        os.environ["MEDIA_BACKUP_ROOT"] = _tmp
        os.makedirs(parts_dir())
        _now = datetime.now(timezone.utc).timestamp()
        def _mk(name, age_days, size=32):
            q = os.path.join(parts_dir(), name)
            with io.open(q, "wb") as _fh:
                _fh.write(b"\x00" * size)
            t = _now - age_days * 24 * 60 * 60
            os.utime(q, (t, t))
            return q
        _old = _mk("abandoned-00000001.part", 30, 1024)
        _new = _mk("resuming-00000002.part", 1, 64)
        _keep = _mk("notes.txt", 400)                     # not a .part
        os.makedirs(os.path.join(parts_dir(), "a-dir.part"))   # not a file
        _swept, _freed = sweep_stale_parts(now=_now)
        ok("sweep takes the abandoned part", not os.path.exists(_old))
        ok("sweep LEAVES a part still inside the resume window", os.path.isfile(_new))
        ok("sweep leaves a non-.part file alone", os.path.isfile(_keep))
        ok("sweep leaves a directory alone", os.path.isdir(os.path.join(parts_dir(), "a-dir.part")))
        ok("sweep reports what it reclaimed", (_swept, _freed) == (1, 1024))
        _shutil.rmtree(parts_dir())
        ok("sweep on a missing .parts dir is a quiet no-op", sweep_stale_parts(now=_now) == (0, 0))
    finally:
        os.environ.pop("MEDIA_BACKUP_ROOT", None)
        _shutil.rmtree(_tmp, ignore_errors=True)

    # NO HANDLER METHOD IS DEFINED TWICE (2026-10-13, proven-to-catch).
    # The phone-media lane was authored on 2026-07-05 as a SECOND do_POST on
    # this handler. Main grew its own do_POST (/upload, /property-photo-remove)
    # in the meantime, and git merged the two WITHOUT a conflict -- two defs of
    # one name are not overlapping text. Python then keeps only the later def,
    # so one entire half of the write path would have answered 404 on a live
    # NAS while every offline check here, and every app test, stayed green.
    # A shadowed method is invisible at review and silent at runtime, so it is
    # now a failed check: routes get folded into ONE dispatcher, never a
    # second def. Reads this file's own source; no NAS, no network.
    import ast as _ast
    _dupes = []
    with io.open(os.path.realpath(__file__), encoding="utf-8") as _fh:
        _tree = _ast.parse(_fh.read())
    for _node in _ast.walk(_tree):
        if not isinstance(_node, (_ast.ClassDef, _ast.Module, _ast.FunctionDef)):
            continue
        _seen = set()
        for _child in _node.body:
            if isinstance(_child, (_ast.FunctionDef, _ast.AsyncFunctionDef)):
                if _child.name in _seen:
                    _dupes.append("%s.%s" % (getattr(_node, "name", "module"), _child.name))
                _seen.add(_child.name)
    ok("no method or function is defined twice in one scope%s"
       % ("" if not _dupes else " (shadowed: " + ", ".join(_dupes) + ")"), not _dupes)

    # --- THE REAL SERVER, OVER REAL HTTP (DR-0999; LESSONS P59) ---------------
    # A fixture stands in for Synology Chat and a generated JPEG for the phone
    # backup; everything else -- the routes, the bearer, the thumbnail and
    # listing-size roads, CORS -- is the code that runs on the NAS.
    ok("cors: a listed origin is answered", dict(cors_headers("https://poetech.us")).get("Access-Control-Allow-Origin") == "https://poetech.us")
    ok("cors: an unlisted origin gets nothing", cors_headers("https://evil.example") == [])
    ok("cors: no origin gets nothing", cors_headers(None) == [])
    import tempfile as _tf2, threading as _th, types as _types, urllib.request as _ur, urllib.error as _ue
    _d2 = _tf2.mkdtemp(prefix="poetech-photos-http-")
    _saved = {k: os.environ.get(k) for k in ("PHOTO_CHAT_FIXTURE", "PHOTO_ROOTS", "PHOTO_UNDATED_ROOTS", "PHOTO_BRIDGE_TOKEN", "PHOTO_UPLOAD_ROOT")}
    _httpd = None
    try:
        _pdir = os.path.join(_d2, "photos", "2024", "01")
        os.makedirs(_pdir)
        _jpg = os.path.join(_pdir, "20240123_144917.jpg")
        _road = "none"
        try:
            from PIL import Image as _Im  # noqa: PLC0415
            _Im.new("RGB", (2400, 1600), (47, 93, 80)).save(_jpg, format="JPEG", quality=80)
            _road = "pillow"
        except Exception:
            try:
                subprocess.run(["convert", "-size", "2400x1600", "xc:#2F5D50", _jpg], check=True, timeout=30,
                               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                _road = "convert"
            except Exception:
                with open(_jpg, "wb") as _fh:
                    _fh.write(b"\xff\xd8\xff\xe0" + b"\x00" * 64)
        _fx = os.path.join(_d2, "chat.json")
        with open(_fx, "w", encoding="utf-8") as _fh:
            json.dump({"channels": [
                {"name": "805NProspect", "posts": [{"id": "9001", "create_at": 1705891200000, "name": "20240123_144917.jpg", "text": "the porch"}]},
                {"name": "709CommercialSt", "posts": []},
                {"name": "bad name", "posts": []},
            ]}, _fh)
        os.environ["PHOTO_CHAT_FIXTURE"] = _fx
        os.environ["PHOTO_ROOTS"] = os.path.join(_d2, "photos", "{y}", "{m}")
        os.environ["PHOTO_UNDATED_ROOTS"] = os.path.join(_d2, "photos", "*", "*")
        os.environ["PHOTO_BRIDGE_TOKEN"] = "selftest-token"
        os.environ["PHOTO_UPLOAD_ROOT"] = os.path.join(_d2, "uploads")
        _args = _types.SimpleNamespace(token_file=None)
        _httpd = ThreadingHTTPServer(("127.0.0.1", 0), make_handler(_args))
        _port = _httpd.server_address[1]
        _th.Thread(target=_httpd.serve_forever, daemon=True).start()
        _base = "http://127.0.0.1:%d" % _port

        def _get(path, bearer=True, origin=None, method="GET"):
            req = _ur.Request(_base + path, method=method)
            if bearer:
                req.add_header("Authorization", "Bearer selftest-token")
            if origin:
                req.add_header("Origin", origin)
            try:
                with _ur.urlopen(req, timeout=10) as r:
                    raw = r.read()
                    return r.status, dict(r.headers), (json.loads(raw) if raw else None)
            except _ue.HTTPError as e:
                raw = e.read()
                try:
                    body = json.loads(raw) if raw else None
                except ValueError:
                    body = None
                return e.code, dict(e.headers), body

        st, _h, body = _get("/healthz", bearer=False)
        ok("http: /healthz answers", st == 200 and body == {"ok": True})
        st, _h, body = _get("/channels", bearer=False)
        ok("http: /channels without the bearer is 401", st == 401)
        st, _h, body = _get("/channels")
        ok("http: /channels lists the archives with their counts, unsafe names dropped",
           st == 200 and [c["name"] for c in body["channels"]] == ["709CommercialSt", "805NProspect"]
           and [c["total"] for c in body["channels"]] == [0, 1])
        st, _h, body = _get("/property-photos?channel=805NProspect&limit=12")
        ok("http: the archive lists the fixture's picture", st == 200 and body["total"] == 1 and body["photos"][0]["id"] == "9001"
           and body["photos"][0]["date"] == "2024-01-22" and body["photos"][0]["text"] == "the porch")
        if _road != "none":
            ok("http: the thumbnail is served (road: %s)" % _road, bool(body["photos"][0]["thumb"]) and body["photos"][0]["thumb"].startswith("data:image/jpeg;base64,"))
        st, _h, body = _get("/property-photo?channel=805NProspect&id=9001&max=1920")
        if _road != "none":
            ok("http: one picture at listing size, long edge <= 1920 (road: %s)" % _road,
               st == 200 and body["ok"] is True and body["image"].startswith("data:image/jpeg;base64,")
               and body["name"] == "20240123_144917.jpg" and (body["width"] is None or body["width"] <= 1920)
               and 0 < body["bytes"] <= MAX_PHOTO_BYTES)
        else:
            ok("http: with no image road the picture route says so honestly (422)", st == 422 and body["ok"] is False)
        st, _h, body = _get("/property-photo?channel=805NProspect&id=nope")
        ok("http: an unknown picture id is 404", st == 404 and body["ok"] is False)
        # THE WHOLE LIBRARY BY MONTH (DR-1002): the same fixture folder, read
        # as the file system holds it, with no chat and no Synology sign-in.
        st, _h, body = _get("/library?month=2024-01", bearer=False)
        ok("http: /library without the bearer is 401", st == 401)
        st, _h, body = _get("/library?month=2024-01")
        ok("http: /library lists the month's pictures from the folders, newest first",
           st == 200 and body["total"] == 1 and body["month"] == "2024-01"
           and body["photos"][0]["name"] == "20240123_144917.jpg" and body["photos"][0]["date"] == "2024-01-23")
        st, _h, body = _get("/library?month=2024-02")
        ok("http: an empty month is honest-empty, never an error", st == 200 and body["total"] == 0 and body["photos"] == [])
        st, _h, body = _get("/library?month=2024-13")
        ok("http: a month that is not a month is 400", st == 400)
        st, _h, body = _get("/library-photo?name=20240123_144917.jpg&max=1920")
        if _road != "none":
            ok("http: one library picture at listing size by its name (road: %s)" % _road,
               st == 200 and body["ok"] is True and body["name"] == "20240123_144917.jpg"
               and body["date"] == "2024-01-23" and (body["width"] is None or body["width"] <= 1920))
        else:
            ok("http: with no image road the library picture route says so honestly (422)", st == 422)
        st, _h, body = _get("/library-photo?name=..%2F..%2Fetc%2Fpasswd")
        ok("http: a library name that walks the tree is refused (400)", st == 400)
        st, _h, body = _get("/library-photo?name=nope.jpg")
        ok("http: an unknown library picture is 404", st == 404)
        st, _h, body = _get("/property-photo?channel=805NProspect&id=9001", bearer=False)
        ok("http: the picture route needs the bearer", st == 401)
        st, hdr, _b = _get("/channels", method="OPTIONS", bearer=False, origin="https://poetech.us")
        ok("http: preflight from poetech.us is 204 with the origin echoed",
           st == 204 and hdr.get("Access-Control-Allow-Origin") == "https://poetech.us"
           and "authorization" in (hdr.get("Access-Control-Allow-Headers") or ""))
        st, hdr, _b = _get("/channels", method="OPTIONS", bearer=False, origin="https://evil.example")
        ok("http: preflight from elsewhere carries no allow-origin", st == 204 and not hdr.get("Access-Control-Allow-Origin"))
        st, hdr, body = _get("/channels", origin="https://poetech.us")
        ok("http: a cross-origin GET from poetech.us is answered with allow-origin", st == 200 and hdr.get("Access-Control-Allow-Origin") == "https://poetech.us")
    finally:
        if _httpd is not None:
            _httpd.shutdown()
            _httpd.server_close()
        for k, v in _saved.items():
            if v is None:
                os.environ.pop(k, None)
            else:
                os.environ[k] = v
        import shutil as _sh2
        _sh2.rmtree(_d2, ignore_errors=True)

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
