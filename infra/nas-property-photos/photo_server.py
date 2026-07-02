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
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

# --- Constants shared with the old resolver (kept identical where proven) -----
SAFE_CHANNEL = re.compile(r"^[A-Za-z0-9._-]{1,64}$")
# [^/\\] (not .+) so a crafted file name cannot climb out of the backup root.
STD_NAME = re.compile(r"^(\d{4})(\d{2})\d{2}_[^/\\]+\.(jpg|jpeg|png)$", re.IGNORECASE)
THUMB_PATTERNS = (
    "SYNOFILE_THUMB_M*.jpg", "SYNOFILE_THUMB_SM*.jpg",
    "SYNOFILE_THUMB_S*.jpg", "SYNOFILE_THUMB_*.jpg",
)
# Candidate {y}/{m} roots for a photo, tried in order. The FIRST was the only
# path the old resolver knew; the rest catch the drift cases (Synology Photos
# library relocation, alternate Drive mount) that blank the gallery. Override
# with PHOTO_ROOTS (newline- or ';'-separated glob templates using {y} {m}).
DEFAULT_ROOTS = [
    "/volume1/homes/*/Drive/PhotoBackup/*/DCIM/Camera/{y}/{m}",
    "/volume1/homes/*/Photos/PhotoLibrary/{y}/{m}",
    "/volume1/photo/*/DCIM/Camera/{y}/{m}",
    "/volume1/homes/*/Drive/PhotoBackup/*/{y}/{m}",
]
MAX_THUMB_BYTES = 400000      # Synology thumbs are ~20KB; guard against surprises
MAX_ORIGINAL_BYTES = 40 * 1024 * 1024  # cap the original we will downscale
DOWNSCALE_MAX = 480           # px longest edge for the on-the-fly fallback
# The family bridge token ALREADY lives on the NAS (seeded for the old n8n
# bridge). Reuse it -- no second copy of the secret, no re-seeding. The PWA
# stores the same value in localStorage["poetech-chat-bridge-token"].
TOKEN_FILE_DEFAULT = "/volume1/PoeTech/secrets/chat-bridge-token.txt"


def roots():
    env = os.environ.get("PHOTO_ROOTS", "").strip()
    if env:
        return [r.strip() for r in re.split(r"[\n;]+", env) if r.strip()]
    return DEFAULT_ROOTS


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
    """Synology's own ~20KB thumbnail, across all candidate roots. Returns
    (bytes, root_template) or (None, None)."""
    m = STD_NAME.match(name or "")
    if not m:
        return None, None
    y, mo = m.group(1), m.group(2)
    esc = glob.escape(name)
    for tmpl in roots():
        base = tmpl.format(y=y, m=mo)
        for pat in THUMB_PATTERNS:
            hits = glob.glob(base + "/@eaDir/" + esc + "/" + pat)
            if hits:
                try:
                    with open(hits[0], "rb") as fh:
                        data = fh.read()
                    if 0 < len(data) <= MAX_THUMB_BYTES:
                        return data, tmpl
                except OSError:
                    pass
    return None, None


def _find_original(name):
    m = STD_NAME.match(name or "")
    if not m:
        return None
    y, mo = m.group(1), m.group(2)
    esc = glob.escape(name)
    for tmpl in roots():
        hits = glob.glob(tmpl.format(y=y, m=mo) + "/" + esc)
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
    root_hits = {}
    unresolved = []
    for _cid, _ca, name, _t in rows:
        data, root = _premade_thumb(name)
        if data is not None:
            premade += 1
            resolved += 1
            root_hits[root] = root_hits.get(root, 0) + 1
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
        "root_hits": root_hits,
        "roots_searched": roots(),
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
    ok("stdname parses 20241206_x.jpg", bool(STD_NAME.match("20241206_081632.jpg")))
    ok("stdname year/month", STD_NAME.match("20241206_1.jpg").group(1) == "2024"
       and STD_NAME.match("20241206_1.jpg").group(2) == "12")
    ok("stdname rejects traversal name", not STD_NAME.match("20241206_../../x.jpg"))
    ok("stdname rejects screenshot", not STD_NAME.match("Screenshot_2024.png"))
    ok("bearer rejects empty expected", not bearer_ok("Bearer abc", ""))
    ok("bearer rejects missing header", not bearer_ok(None, "secret"))
    ok("bearer rejects wrong token", not bearer_ok("Bearer nope", "secret"))
    ok("bearer accepts right token", bearer_ok("Bearer secret", "secret"))
    ok("bearer is scheme-insensitive", bearer_ok("bearer secret", "secret"))
    ok("roots default non-empty", len(roots()) >= 1)
    os.environ["PHOTO_ROOTS"] = "/a/{y}/{m};/b/{y}/{m}"
    ok("roots honors env override", roots() == ["/a/{y}/{m}", "/b/{y}/{m}"])
    del os.environ["PHOTO_ROOTS"]

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
