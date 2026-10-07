#!/usr/bin/env python3
# =============================================================================
# cams_forwarder -- the locked door in front of the family's camera restreamer
# =============================================================================
# Darrell 2026-10-06: "I want to be able to see my wyze cam feeds inside my
# PoeTech App... and any system I own..."
#
# The cameras are reached by go2rtc (infra/nas-cameras/docker-compose.yml),
# ONE restreamer that speaks Wyze natively (v1.9.14, native P2P, no Wyze SDK),
# Ring natively, ONVIF, and plain RTSP -- so "any system I own" is one more
# line in its config, never a new program. go2rtc listens on 127.0.0.1:1984
# only, and it has no lock of its own worth putting on the PUBLIC Funnel
# ("go2rtc passes requests from localhost ... without HTTP authorization").
#
# So this process is the lock, in the exact shape every other sovereign row in
# RECORDED-STATE already has (8771 voice, 8772 voice-lite, 8790 taxes, 8099
# photos): a stdlib reverse proxy on 127.0.0.1:8773 that admits ONLY the family
# bridge bearer, forwards ONLY an allowlist of read-only camera paths, and never
# lets a camera's source URL (which carries credentials) leave the box.
#
# WHY TICKETS. <img> and <video> elements cannot send an Authorization header.
# A snapshot can be fetched with the header and shown as a blob; a live stream
# cannot (iOS has no MSE). So the app trades its bearer for a short-lived
# PLAYBACK TICKET -- HMAC(bearer, camera|expiry), 90 s, bound to one camera --
# and the media URL carries the ticket. A ticket in a log is worthless a minute
# later, and never names any other camera.
#
# Contract (tailscale STRIPS the /cams mount point, so the bare paths arrive;
# the /cams-prefixed spellings are served too, for a proxy that does not strip):
#   GET  /health                       open. go2rtc's OWN /api answer passed
#                                      through (version + stream count); 502
#                                      when it is dark -- a green here means
#                                      the whole road is green.
#   GET  /list                         bearer. [{id, name, kind}] -- the streams
#                                      go2rtc actually has, kind inferred from
#                                      the source scheme; the URL itself NEVER
#                                      leaves (it carries credentials).
#   POST /ticket  {"camera": id}       bearer. {ticket, expires_in, camera}.
#   POST /setup/wyze {email,password,api_id,api_key}  bearer. Hands the sign-in
#        to go2rtc's own /api/wyze (which persists the account and lists the
#        cameras), registers each camera as a stream (PUT /api/streams,
#        persisted by go2rtc). {ok, added, cameras:[{id,name,model,dtls,
#        registered,existing}]} -- never a source url. 401 wyze-sign-in-refused
#        when Wyze says no; 409 while another setup runs; 502 go2rtc dark.
#   POST /restart                      bearer. {ok, restarting, running, on_disk}
#        then this process exits 3 and systemd (Restart=on-failure) starts it
#        again from the file on disk. 429 restart-too-soon inside 60 s of the
#        last one. The in-app "Restart the camera service" button (DR-0772).
#   GET  /why/<id>                     bearer. WHY a camera has no picture, from
#        go2rtc's own mouth: {id, probe:{status,error,ms}, producers:[{kind,
#        host,...no url}], log:[scrubbed recent lines naming this stream]}.
#        (DR-0774: a tile that says only "HTTP 502" gives no sight.)
#   GET  /snap/<id>.jpg?w=&h=          bearer OR ticket. One JPEG frame. On a
#        miss the JSON names the cause: frame-timeout (504, after_s), no-frame
#        (go2rtc's status + its scrubbed detail), go2rtc-unreachable (502).
#   GET  /live/<id>.mp4?t=             ticket. Progressive MP4 (Chrome, Edge,
#                                      Firefox, Android). Ends itself at
#                                      LIVE_MAX_SECONDS; the app may re-open.
#   GET  /live/<id>/index.m3u8?t=      ticket. HLS/fMP4 (Safari, iOS, Fire TV)
#                                      with the ticket carried onto every
#                                      segment line of the playlist.
#   GET  /live/<id>/hls/<file>?..&t=   ticket. playlist.m3u8 / init.mp4 /
#                                      segment.m4s / segment.ts only.
#
# Brakes (request-driven -- nothing happens until a browser asks -- but a public
# door still needs bounds, and the Funnel is "a funnel, not a hose"):
#   * MAX_LIVE concurrent live streams (default 12); the (N+1)th gets 503.
#   * LIVE_MAX_SECONDS per live stream, default 0 = no clock (DR-0774): a view
#     runs until the viewer leaves. Set it only if the home link measures short.
#   * MAX_SNAP_INFLIGHT concurrent snapshots; SNAP_TIMEOUT / SEGMENT_TIMEOUT.
#
# Run:
#   python3 cams_forwarder.py                       # on the NAS (systemd unit)
#   python3 cams_forwarder.py --selftest            # offline, stdlib, no NAS
# Installed + kept running by infra/nas-cameras/install.sh via services-sync.
# NAS python is 3.8: no 3.9+ syntax here.
# =============================================================================
import argparse
import hashlib
import hmac
import json
import os
import re
import socket
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

TOKEN_FILE_DEFAULT = "/volume1/PoeTech/secrets/chat-bridge-token.txt"
UPSTREAM_DEFAULT = "http://127.0.0.1:1984"

# THE CAPS ARE NOT THE PRODUCT (Darrell 2026-10-07: "Let's not build in
# undermining constraints... we want to build the best pipelines"). The live
# cap and the per-view clock stay as MECHANISMS, measured and reported in
# /health, but their defaults no longer cut a family member off: 12 live
# views (a 3x4 wall) and no clock (0 = a view runs until the viewer leaves).
# The home link's real bandwidth is measured by the app, not pre-empted here.
MAX_LIVE = int(os.environ.get("CAMS_MAX_LIVE", "12"))
LIVE_MAX_SECONDS = float(os.environ.get("CAMS_LIVE_MAX_SECONDS", "0"))  # 0 = no clock
MAX_SNAP_INFLIGHT = int(os.environ.get("CAMS_MAX_SNAP_INFLIGHT", "6"))
SNAP_TIMEOUT = float(os.environ.get("CAMS_SNAP_TIMEOUT", "12"))
SEGMENT_TIMEOUT = float(os.environ.get("CAMS_SEGMENT_TIMEOUT", "20"))
LIVE_CONNECT_TIMEOUT = float(os.environ.get("CAMS_LIVE_CONNECT_TIMEOUT", "20"))
TICKET_TTL_SECONDS = int(os.environ.get("CAMS_TICKET_TTL", "90"))
HEALTH_TIMEOUT = 5.0
CHUNK = 64 * 1024
MAX_BODY = 4096

CAMERA_ID = re.compile(r"^[A-Za-z0-9_.-]{1,64}$")

# THE RUNNING CODE NAMES ITSELF (2026-10-07; Darrell: "how can we say something
# is proven without explanation that fits the point"). A selftest proves what
# the code DOES; it cannot prove the NAS RUNS it -- and on 2026-10-07 the NAS
# served old code for an hour after a merge (the installer restarted only on a
# unit change). /health now carries the sha of the file that is actually
# serving, so the outside witness (site-health.yml) and the Cameras tab can
# compare the running code with main instead of inferring it.
def code_sha(path=None):
    try:
        with open(path or os.path.abspath(__file__), "rb") as fh:
            return hashlib.sha256(fh.read()).hexdigest()[:16]
    except OSError:
        return "unknown"


CODE_SHA = code_sha()

# RESTART FROM THE APP (2026-10-07; Darrell: "We also want all functions to be
# able to work inside the PoeTech App", "You do it!!!!!!!"). /health names the
# running sha AND the sha of the file on disk; when they differ the service is
# behind its own code (exactly the 2026-10-07 hour of 404s), and the Cameras
# tab says so and offers one button. POST /restart answers, then exits 3 so
# systemd's Restart=on-failure brings the process back from the file on disk.
# Bearer-locked; one restart per RESTART_MIN_SECONDS (a tapped-twice button
# never restarts twice); nothing is pulled or written by this route.
RESTART_MIN_SECONDS = float(os.environ.get("CAMS_RESTART_MIN_SECONDS", "60"))
RESTART_STATE = {"last": 0.0}
RESTART_LOCK = threading.Lock()

# WYZE SIGN-IN FROM THE APP (2026-10-07; Darrell: "Is that the easiest way to
# build it so I don't have to do much work for it to work right away?" -- no,
# it was not). The two PowerShell steps (place wyze.env; tunnel to the WebUI
# and click Add > Wyze) are replaced by ONE form in the Cameras tab. The
# forwarder hands the four values to go2rtc's OWN sign-in (POST /api/wyze,
# verified in go2rtc 1.9.14 source: it logs in, writes the account into
# go2rtc.yaml itself, and answers the account's cameras as sources), then
# registers each camera as a stream (PUT /api/streams, which go2rtc also
# persists). Nothing is written by this process; the password crosses it once
# and is never logged or stored. Bearer-locked like every other door; one
# setup at a time (a second is told 409, never stacked).
SETUP_MAX_BODY = 8192
SETUP_TIMEOUT = float(os.environ.get("CAMS_SETUP_TIMEOUT", "60"))
SETUP_LOCK = threading.Lock()
WYZE_FIELDS = ("email", "password", "api_id", "api_key")
HLS_FILES = ("playlist.m3u8", "init.mp4", "segment.m4s", "segment.ts")
PREFIX = "/cams"


# --- Auth (identical to photo_server.py / voice_forwarder.py) ----------------
def expected_token(token_file=None):
    if os.environ.get("CAMS_BRIDGE_TOKEN"):
        return os.environ["CAMS_BRIDGE_TOKEN"].strip()
    path = token_file or TOKEN_FILE_DEFAULT
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


# --- Tickets -----------------------------------------------------------------
def _sign(secret, camera, exp):
    msg = ("%s|%d" % (camera, exp)).encode("utf-8")
    return hmac.new(secret.encode("utf-8"), msg, hashlib.sha256).hexdigest()[:32]


def mint_ticket(secret, camera, now=None, ttl=TICKET_TTL_SECONDS):
    exp = int((now if now is not None else time.time())) + int(ttl)
    return "%d.%s" % (exp, _sign(secret, camera, exp))


def ticket_ok(secret, camera, ticket, now=None):
    if not secret or not camera or not ticket:
        return False
    try:
        exp_s, sig = ticket.split(".", 1)
        exp = int(exp_s)
    except (ValueError, AttributeError):
        return False
    if exp <= (now if now is not None else time.time()):
        return False
    return hmac.compare_digest(sig, _sign(secret, camera, exp))


# --- Pure helpers (selftested) -------------------------------------------------
def strip_prefix(path):
    """/cams/list -> /list ; /list -> /list ; /cams -> /"""
    if path == PREFIX:
        return "/"
    if path.startswith(PREFIX + "/"):
        return path[len(PREFIX):]
    return path


def kind_of(url):
    """A short, credential-free label for a go2rtc source URL."""
    if not isinstance(url, str) or not url:
        return "unknown"
    scheme = url.split(":", 1)[0].lower()
    scheme = scheme.split("#", 1)[0]
    if scheme == "wyze":
        return "wyze"
    if scheme == "ring":
        return "ring"
    if scheme == "onvif":
        return "onvif"
    if scheme in ("rtsp", "rtsps", "rtmp", "rtmps"):
        return "rtsp"
    if scheme in ("http", "https"):
        return "http"
    if scheme == "homekit":
        return "homekit"
    if scheme in ("tapo", "kasa", "nest", "dvrip", "isapi", "hass", "roborock"):
        return scheme
    return "other"


def camera_list(streams_json):
    """go2rtc GET /api/streams -> [{id, name, kind}], never a URL.
    A stream's producers carry the configured source URL; we keep only its
    scheme as `kind`. Ids that fail the camera-id grammar are dropped rather
    than smuggled into a path."""
    out = []
    if not isinstance(streams_json, dict):
        return out
    for sid in sorted(streams_json.keys(), key=lambda s: s.lower()):
        if not CAMERA_ID.match(sid):
            continue
        entry = streams_json.get(sid) or {}
        kind = "unknown"
        producers = entry.get("producers") if isinstance(entry, dict) else None
        if isinstance(producers, list):
            for p in producers:
                if isinstance(p, dict) and p.get("url"):
                    kind = kind_of(p.get("url"))
                    break
        out.append({"id": sid, "name": sid.replace("_", " ").replace("-", " "), "kind": kind})
    return out


# WHAT MAY LEAVE IN A DIAGNOSTIC (DR-0774). go2rtc's log and stream info carry
# the source url, which carries the camera's enr secret and, for other kinds,
# passwords and tokens. The scrubber removes every credential-shaped value and
# keeps what explains a failure: the scheme, the host the NAS tried, the error.
SECRET_PARAMS = ("enr", "password", "pass", "pwd", "token", "api_key", "key", "refresh_token", "access_token", "secret")


def scrub_text(text, limit=400):
    t = str(text or "")
    for k in SECRET_PARAMS:
        t = re.sub(r"(?i)([?&]%s=)[^&\s\"']*" % re.escape(k), r"\1***", t)
        t = re.sub(r"(?i)(\"%s\"\s*:\s*\")[^\"]*" % re.escape(k), r"\1***", t)
    t = re.sub(r"://([^/@\s]+)@", "://***@", t)  # user:pass@host
    return t[:limit]


def producer_summary(entry):
    """go2rtc stream info -> producers without their url: kind, host, and
    whatever state fields go2rtc reports (never the url itself)."""
    out = []
    producers = entry.get("producers") if isinstance(entry, dict) else None
    if not isinstance(producers, list):
        return out
    for p in producers:
        if not isinstance(p, dict):
            continue
        url = str(p.get("url") or "")
        host = ""
        try:
            host = urllib.parse.urlsplit(url).hostname or ""
        except ValueError:
            host = ""
        item = {"kind": kind_of(url), "host": host}
        for k in ("type", "state", "remote_addr", "medias", "receivers", "recv", "bytes_recv"):
            if k in p and k != "url":
                v = p[k]
                item[k] = v if isinstance(v, (int, float, str, bool)) or v is None else (len(v) if isinstance(v, (list, dict)) else str(v))
        out.append(item)
    return out


def log_lines_for(jsonl, stream_id, limit=20):
    """go2rtc GET /api/log (jsonlines) -> the last `limit` lines that name
    this stream or its source kind, scrubbed. A line is kept as text."""
    lines = []
    needle = stream_id.lower()
    for raw in (jsonl or "").splitlines():
        raw = raw.strip()
        if not raw:
            continue
        low = raw.lower()
        if needle in low or "wyze" in low or "error" in low:
            try:
                j = json.loads(raw)
                txt = " ".join(str(j.get(k)) for k in ("time", "level", "message") if j.get(k) is not None)
                for k, v in j.items():
                    if k not in ("time", "level", "message") and isinstance(v, (str, int, float)):
                        txt += " %s=%s" % (k, v)
            except ValueError:
                txt = raw
            lines.append(scrub_text(txt, 300))
    return lines[-limit:]


def rewrite_playlist(text, ticket, at_root):
    """Carry the ticket onto every media/playlist URL in an m3u8 body and make
    the URLs relative to where the CLIENT fetched this playlist from.
      at_root=True  : the client is at /live/<id>/index.m3u8 -> emit hls/<file>?..
      at_root=False : the client is at /live/<id>/hls/<x>.m3u8 -> emit <file>?..
    Shape-agnostic on purpose: go2rtc may write `playlist.m3u8?id=..`,
    `api/hls/segment.m4s?..` or `/api/hls/segment.m4s?..`; all three land on
    the same allowlisted basename. An unrecognised line is passed through
    untouched (never guessed into a route)."""
    base = "hls/" if at_root else ""

    def one(url):
        url = url.strip()
        if not url or "://" in url:
            return url
        path, _, query = url.partition("?")
        name = path.rsplit("/", 1)[-1]
        if name not in HLS_FILES:
            return url
        q = [kv for kv in query.split("&") if kv and not kv.startswith("t=")]
        q.append("t=" + urllib.parse.quote(ticket, safe=""))
        return base + name + "?" + "&".join(q)

    out = []
    for line in text.splitlines():
        if line.startswith("#"):
            m = re.search(r'URI="([^"]*)"', line)
            if m:
                line = line[:m.start(1)] + one(m.group(1)) + line[m.end(1):]
            out.append(line)
        elif line.strip():
            out.append(one(line))
        else:
            out.append(line)
    return "\n".join(out) + ("\n" if text.endswith("\n") else "")


def stream_name_for(nickname, taken):
    """A camera's Wyze nickname -> a stream id the app can address (CAMERA_ID),
    lower-cased, unique against the names already in go2rtc."""
    base = re.sub(r"[^A-Za-z0-9_.-]+", "_", str(nickname or "").strip()).strip("_.-").lower()[:48] or "camera"
    name, n = base, 2
    while name in taken:
        name = "%s_%d" % (base, n)
        n += 1
    return name


def wyze_cameras_from(doc):
    """go2rtc's /api/wyze answer ({"sources":[{name,info,url}]}) ->
    [{name, url, model, dtls}]. `info` is "MODEL | MAC | IP". Pure."""
    if isinstance(doc, (bytes, bytearray)):
        try:
            doc = json.loads(doc.decode("utf-8"))
        except (ValueError, UnicodeDecodeError):
            return []
    items = doc.get("sources") if isinstance(doc, dict) else None
    out = []
    for src in items or []:
        if not isinstance(src, dict) or not src.get("url"):
            continue
        url = str(src["url"])
        info = str(src.get("info") or "")
        q = urllib.parse.parse_qs(urllib.parse.urlsplit(url).query)
        out.append({
            "name": str(src.get("name") or "").strip() or "Camera",
            "url": url,
            "model": info.split("|")[0].strip() if info else "",
            "dtls": q.get("dtls", [""])[0] == "true",
        })
    return out


def upstream_query(query, drop=("t",)):
    pairs = urllib.parse.parse_qsl(query, keep_blank_values=True)
    kept = [(k, v) for (k, v) in pairs if k not in drop]
    return urllib.parse.urlencode(kept)


# --- The handler -------------------------------------------------------------
def make_handler(upstream, token, max_live=MAX_LIVE, live_max_seconds=LIVE_MAX_SECONDS,
                 max_snap=MAX_SNAP_INFLIGHT, snap_timeout=SNAP_TIMEOUT, segment_timeout=SEGMENT_TIMEOUT,
                 exit_fn=None, now_fn=time.time):
    upstream = upstream.rstrip("/")
    exit_fn = exit_fn or (lambda code: os._exit(code))
    live_gate = threading.BoundedSemaphore(max_live)
    snap_gate = threading.BoundedSemaphore(max_snap)

    class Handler(BaseHTTPRequestHandler):
        server_version = "poetech-cams-forwarder/1"
        protocol_version = "HTTP/1.1"

        def log_message(self, *a):  # quiet; never log paths (they carry tickets) or tokens
            pass

        # -- small writers --------------------------------------------------
        def _json(self, code, obj):
            data = json.dumps(obj).encode("utf-8")
            self.send_response(code)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(data)

        def _bytes(self, code, ctype, data):
            self.send_response(code)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(data)

        def _get_upstream(self, path_and_query, timeout, limit=None):
            """GET upstream; returns (status, ctype, bytes) or raises."""
            with urllib.request.urlopen(upstream + path_and_query, timeout=timeout) as r:
                body = r.read(limit) if limit else r.read()
                return r.status, r.headers.get("Content-Type", "application/octet-stream"), body

        def _authed(self):
            return bearer_ok(self.headers.get("Authorization"), token)

        def _ticketed(self, camera, query):
            t = urllib.parse.parse_qs(query).get("t", [""])[0]
            return ticket_ok(token, camera, t)

        # -- routes ---------------------------------------------------------
        def do_GET(self):
            raw_path, _, query = self.path.partition("?")
            path = strip_prefix(raw_path)

            if path == "/health":
                return self._health()
            if path == "/list":
                if not self._authed():
                    return self._json(401, {"error": "unauthorized"})
                return self._list()

            m = re.match(r"^/why/([^/]+)$", path)
            if m:
                cam = m.group(1)
                if not CAMERA_ID.match(cam):
                    return self._json(400, {"error": "bad-camera-id"})
                if not self._authed():
                    return self._json(401, {"error": "unauthorized"})
                return self._why(cam)

            m = re.match(r"^/snap/([^/]+)\.jpg$", path)
            if m:
                cam = m.group(1)
                if not CAMERA_ID.match(cam):
                    return self._json(400, {"error": "bad-camera-id"})
                if not (self._authed() or self._ticketed(cam, query)):
                    return self._json(401, {"error": "unauthorized"})
                return self._snap(cam, query)

            m = re.match(r"^/live/([^/]+)\.mp4$", path)
            if m:
                cam = m.group(1)
                if not CAMERA_ID.match(cam):
                    return self._json(400, {"error": "bad-camera-id"})
                if not self._ticketed(cam, query):
                    return self._json(401, {"error": "unauthorized"})
                return self._live_mp4(cam)

            m = re.match(r"^/live/([^/]+)/index\.m3u8$", path)
            if m:
                cam = m.group(1)
                if not CAMERA_ID.match(cam):
                    return self._json(400, {"error": "bad-camera-id"})
                if not self._ticketed(cam, query):
                    return self._json(401, {"error": "unauthorized"})
                return self._playlist(cam, query, "/api/stream.m3u8?src=%s&mp4" % urllib.parse.quote(cam), at_root=True)

            m = re.match(r"^/live/([^/]+)/hls/([^/]+)$", path)
            if m:
                cam, name = m.group(1), m.group(2)
                if not CAMERA_ID.match(cam):
                    return self._json(400, {"error": "bad-camera-id"})
                if name not in HLS_FILES:
                    return self._json(404, {"error": "not-found"})
                if not self._ticketed(cam, query):
                    return self._json(401, {"error": "unauthorized"})
                up = "/api/hls/%s?%s" % (name, upstream_query(query))
                if name.endswith(".m3u8"):
                    return self._playlist(cam, query, up, at_root=False)
                return self._segment(up)

            return self._json(404, {"error": "not-found"})

        def do_POST(self):
            raw_path, _, _query = self.path.partition("?")
            path = strip_prefix(raw_path)
            if path not in ("/ticket", "/setup/wyze", "/restart"):
                return self._json(404, {"error": "not-found"})
            if not self._authed():
                return self._json(401, {"error": "unauthorized"})
            if path == "/restart":
                return self._restart()
            try:
                length = int(self.headers.get("Content-Length") or 0)
            except ValueError:
                length = 0
            if length <= 0 or length > (SETUP_MAX_BODY if path == "/setup/wyze" else MAX_BODY):
                return self._json(400, {"error": "body-required"})
            try:
                body = json.loads(self.rfile.read(length).decode("utf-8"))
            except (ValueError, UnicodeDecodeError):
                return self._json(400, {"error": "bad-json"})
            if path == "/setup/wyze":
                return self._setup_wyze(body if isinstance(body, dict) else {})
            cam = body.get("camera") if isinstance(body, dict) else None
            if not isinstance(cam, str) or not CAMERA_ID.match(cam):
                return self._json(400, {"error": "bad-camera-id"})
            return self._json(200, {"ticket": mint_ticket(token, cam), "expires_in": TICKET_TTL_SECONDS, "camera": cam})

        # -- handlers -------------------------------------------------------
        def _restart(self):
            now = now_fn()
            with RESTART_LOCK:
                since = now - RESTART_STATE["last"]
                if RESTART_STATE["last"] and since < RESTART_MIN_SECONDS:
                    return self._json(429, {"error": "restart-too-soon", "retry_in": int(RESTART_MIN_SECONDS - since) + 1})
                RESTART_STATE["last"] = now
            on_disk = code_sha()
            self._json(200, {"ok": True, "restarting": True, "running": CODE_SHA, "on_disk": on_disk,
                             "changed": on_disk != CODE_SHA})
            try:
                self.wfile.flush()
            except OSError:
                pass
            # Leave after the answer is on the wire; exit 3 is a failure to
            # systemd, so Restart=on-failure brings the process back from disk.
            threading.Timer(0.5, exit_fn, args=(3,)).start()

        def _setup_wyze(self, body):
            fields = {}
            for k in WYZE_FIELDS:
                v = body.get(k)
                if not isinstance(v, str) or not v.strip() or len(v) > 256:
                    return self._json(400, {"error": "missing-field", "field": k})
                fields[k] = v.strip()
            if "@" not in fields["email"]:
                return self._json(400, {"error": "bad-email"})
            if not SETUP_LOCK.acquire(blocking=False):
                return self._json(409, {"error": "setup-in-progress"})
            try:
                secret = fields["password"]

                def scrub(text):
                    return (text or "").replace(secret, "***").replace(fields["api_key"], "***")[:300]

                data = urllib.parse.urlencode(fields).encode("utf-8")
                req = urllib.request.Request(upstream + "/api/wyze", data=data, method="POST",
                                             headers={"Content-Type": "application/x-www-form-urlencoded"})
                try:
                    with urllib.request.urlopen(req, timeout=SETUP_TIMEOUT) as r:
                        raw = r.read(4 * 1024 * 1024)
                except urllib.error.HTTPError as e:
                    detail = scrub(e.read(2048).decode("utf-8", "replace").strip())
                    if e.code == 401:
                        return self._json(401, {"error": "wyze-sign-in-refused", "detail": detail})
                    if e.code == 404:
                        # go2rtc answers "no sources" when the sign-in worked but the account lists no camera.
                        return self._json(200, {"ok": True, "added": 0, "cameras": [], "note": "signed in; this Wyze account lists no cameras"})
                    return self._json(502, {"error": "wyze-error", "upstream_status": e.code, "detail": detail})
                except (urllib.error.URLError, OSError):
                    return self._json(502, {"error": "go2rtc-unreachable"})
                cams = wyze_cameras_from(raw)
                existing = set()
                try:
                    _s, _c, streams = self._get_upstream("/api/streams", HEALTH_TIMEOUT, limit=4 * 1024 * 1024)
                    parsed = json.loads(streams.decode("utf-8"))
                    if isinstance(parsed, dict):
                        existing = set(parsed.keys())
                except (urllib.error.URLError, OSError, ValueError):
                    existing = set()
                out = []
                added = 0
                for cam in cams:
                    slug = stream_name_for(cam["name"], set())
                    if slug in existing:
                        # Already registered (a re-run): left exactly as it is.
                        out.append({"id": slug, "name": cam["name"], "model": cam["model"], "dtls": cam["dtls"], "registered": True, "existing": True})
                        continue
                    name = stream_name_for(cam["name"], existing)
                    q = urllib.parse.urlencode([("name", name), ("src", cam["url"])])
                    put = urllib.request.Request(upstream + "/api/streams?" + q, method="PUT")
                    ok = True
                    try:
                        with urllib.request.urlopen(put, timeout=HEALTH_TIMEOUT) as r:
                            r.read(4096)
                    except (urllib.error.HTTPError, urllib.error.URLError, OSError):
                        ok = False
                    if ok:
                        existing.add(name)
                        added += 1
                    out.append({"id": name, "name": cam["name"], "model": cam["model"], "dtls": cam["dtls"], "registered": ok, "existing": False})
                # The source URLs (they carry the camera's enr secret) never leave this process.
                return self._json(200, {"ok": True, "added": added, "cameras": out})
            finally:
                SETUP_LOCK.release()

        def _health(self):
            # Pass go2rtc's OWN answer through; a 200 from this process about
            # ITSELF would read "up" over a dark restreamer (the DR-0440 class).
            try:
                _s, _c, info = self._get_upstream("/api", HEALTH_TIMEOUT, limit=65536)
                _s2, _c2, streams = self._get_upstream("/api/streams", HEALTH_TIMEOUT, limit=1024 * 1024)
                version = ""
                try:
                    version = str((json.loads(info.decode("utf-8")) or {}).get("version", ""))
                except ValueError:
                    version = ""
                count = 0
                try:
                    parsed = json.loads(streams.decode("utf-8"))
                    count = len(parsed) if isinstance(parsed, dict) else 0
                except ValueError:
                    count = 0
                return self._json(200, {"ok": True, "go2rtc": version, "streams": count, "forwarder": CODE_SHA,
                                        "on_disk": code_sha(),
                                        "max_live": max_live, "live_max_seconds": int(live_max_seconds)})
            except (urllib.error.URLError, OSError, ValueError):
                return self._json(502, {"ok": False, "error": "go2rtc-unreachable", "upstream": upstream})

        def _list(self):
            try:
                _s, _c, streams = self._get_upstream("/api/streams", HEALTH_TIMEOUT, limit=4 * 1024 * 1024)
                parsed = json.loads(streams.decode("utf-8"))
            except (urllib.error.URLError, OSError, ValueError):
                return self._json(502, {"error": "go2rtc-unreachable"})
            cams = camera_list(parsed)
            return self._json(200, {"cameras": cams, "count": len(cams)})

        def _snap(self, cam, query):
            if not snap_gate.acquire(blocking=False):
                return self._json(503, {"error": "busy", "max_inflight": max_snap})
            try:
                q = urllib.parse.parse_qs(query)
                params = [("src", cam)]
                for key in ("w", "h"):
                    v = q.get(key, [""])[0]
                    if v.isdigit() and 16 <= int(v) <= 1920:
                        params.append((key, v))
                try:
                    status, ctype, body = self._get_upstream("/api/frame.jpeg?" + urllib.parse.urlencode(params), snap_timeout)
                except urllib.error.HTTPError as e:
                    # go2rtc answered, and said why (its body is the error text).
                    detail = scrub_text(e.read(2048).decode("utf-8", "replace").strip(), 300)
                    return self._json(e.code if 400 <= e.code < 600 else 502, {"error": "no-frame", "upstream_status": e.code, "detail": detail})
                except socket.timeout:
                    return self._json(504, {"error": "frame-timeout", "after_s": int(snap_timeout)})
                except urllib.error.URLError as e:
                    if isinstance(getattr(e, "reason", None), socket.timeout):
                        return self._json(504, {"error": "frame-timeout", "after_s": int(snap_timeout)})
                    return self._json(502, {"error": "go2rtc-unreachable", "detail": scrub_text(getattr(e, "reason", e), 200)})
                except (OSError, ValueError) as e:
                    return self._json(502, {"error": "go2rtc-unreachable", "detail": scrub_text(e, 200)})
                if not body:
                    return self._json(502, {"error": "no-frame", "detail": "go2rtc answered an empty frame"})
                return self._bytes(status, ctype or "image/jpeg", body)
            finally:
                snap_gate.release()

        def _why(self, cam):
            """Why does this camera give no picture? Ask go2rtc three ways and
            pass its answers through, scrubbed: the stream's producers (kind,
            host, state), its recent log lines naming the stream, and one short
            frame probe whose error text is go2rtc's own."""
            out = {"id": cam, "producers": [], "log": [], "probe": {}}
            try:
                _s, _c, info = self._get_upstream("/api/streams?src=" + urllib.parse.quote(cam), HEALTH_TIMEOUT, limit=1024 * 1024)
                parsed = json.loads(info.decode("utf-8"))
                entry = parsed.get(cam) if isinstance(parsed, dict) and cam in parsed else parsed
                out["producers"] = producer_summary(entry if isinstance(entry, dict) else {})
            except urllib.error.HTTPError as e:
                out["stream_error"] = "go2rtc HTTP %d: %s" % (e.code, scrub_text(e.read(1024).decode("utf-8", "replace"), 200))
            except (urllib.error.URLError, OSError, ValueError):
                return self._json(502, {"error": "go2rtc-unreachable"})
            try:
                _s, _c, logs = self._get_upstream("/api/log", HEALTH_TIMEOUT, limit=2 * 1024 * 1024)
                out["log"] = log_lines_for(logs.decode("utf-8", "replace"), cam)
            except (urllib.error.HTTPError, urllib.error.URLError, OSError):
                out["log"] = []
            t0 = time.time()
            try:
                status, _c, body = self._get_upstream("/api/frame.jpeg?src=" + urllib.parse.quote(cam), min(snap_timeout, 15.0), limit=65536)
                out["probe"] = {"status": status, "ok": bool(body), "ms": int((time.time() - t0) * 1000)}
            except urllib.error.HTTPError as e:
                out["probe"] = {"status": e.code, "ok": False, "error": scrub_text(e.read(2048).decode("utf-8", "replace").strip(), 300), "ms": int((time.time() - t0) * 1000)}
            except socket.timeout:
                out["probe"] = {"status": 0, "ok": False, "error": "no answer in %d s" % int(min(snap_timeout, 15.0)), "timeout": True, "ms": int((time.time() - t0) * 1000)}
            except urllib.error.URLError as e:
                if isinstance(getattr(e, "reason", None), socket.timeout):
                    out["probe"] = {"status": 0, "ok": False, "error": "no answer in %d s" % int(min(snap_timeout, 15.0)), "timeout": True, "ms": int((time.time() - t0) * 1000)}
                else:
                    out["probe"] = {"status": 0, "ok": False, "error": scrub_text(getattr(e, "reason", e), 200), "ms": int((time.time() - t0) * 1000)}
            except (OSError, ValueError) as e:
                out["probe"] = {"status": 0, "ok": False, "error": scrub_text(e, 200), "ms": int((time.time() - t0) * 1000)}
            return self._json(200, out)

        def _playlist(self, cam, query, up, at_root):
            t = urllib.parse.parse_qs(query).get("t", [""])[0]
            try:
                status, _ctype, body = self._get_upstream(up, segment_timeout, limit=2 * 1024 * 1024)
            except urllib.error.HTTPError as e:
                return self._json(e.code if 400 <= e.code < 600 else 502, {"error": "no-playlist", "upstream_status": e.code})
            except (urllib.error.URLError, OSError, ValueError):
                return self._json(502, {"error": "go2rtc-unreachable"})
            text = body.decode("utf-8", "replace")
            out = rewrite_playlist(text, t, at_root).encode("utf-8")
            return self._bytes(status, "application/vnd.apple.mpegurl", out)

        def _segment(self, up):
            try:
                status, ctype, body = self._get_upstream(up, segment_timeout)
            except urllib.error.HTTPError as e:
                return self._json(e.code if 400 <= e.code < 600 else 502, {"error": "no-segment", "upstream_status": e.code})
            except (urllib.error.URLError, OSError, ValueError):
                return self._json(502, {"error": "go2rtc-unreachable"})
            return self._bytes(status, ctype, body)

        def _live_mp4(self, cam):
            if not live_gate.acquire(blocking=False):
                return self._json(503, {"error": "busy", "max_live": max_live})
            try:
                req = urllib.request.Request(upstream + "/api/stream.mp4?src=" + urllib.parse.quote(cam))
                try:
                    r = urllib.request.urlopen(req, timeout=LIVE_CONNECT_TIMEOUT)
                except urllib.error.HTTPError as e:
                    return self._json(e.code if 400 <= e.code < 600 else 502, {"error": "no-stream", "upstream_status": e.code})
                except (urllib.error.URLError, OSError, ValueError):
                    return self._json(502, {"error": "go2rtc-unreachable"})
                with r:
                    self.send_response(r.status)
                    self.send_header("Content-Type", r.headers.get("Content-Type", "video/mp4"))
                    self.send_header("Cache-Control", "no-store")
                    self.send_header("X-Live-Max-Seconds", str(int(live_max_seconds)))
                    self.send_header("Connection", "close")
                    self.end_headers()
                    self.close_connection = True
                    started = time.monotonic()
                    # read1(): hand on whatever bytes have ARRIVED instead of
                    # blocking until 64 KB fill -- a slow camera at 11 bytes per
                    # 10 ms would otherwise hold the brake check hostage until the
                    # source ended (the selftest caught exactly that: 4.1 s on a
                    # 1 s brake). The urlopen timeout bounds a silent source too.
                    read = getattr(r, "read1", None) or r.read
                    try:
                        while True:
                            if live_max_seconds > 0 and time.monotonic() - started >= live_max_seconds:
                                break  # the optional clock: a live view ends itself; the app re-opens
                            chunk = read(CHUNK)
                            if not chunk:
                                break
                            self.wfile.write(chunk)
                    except (BrokenPipeError, ConnectionResetError, OSError):
                        pass  # the viewer left, or the source went silent past the timeout
            finally:
                live_gate.release()

    return Handler


# --- Selftest ----------------------------------------------------------------
def _selftest():
    """Offline behavioural checks against a fake go2rtc. Exit 1 on any miss."""
    from http.client import HTTPConnection

    failures = []

    def check(cond, msg):
        print(("  PASS " if cond else "  FAIL ") + msg)
        if not cond:
            failures.append(msg)

    seen = {"queries": []}

    class FakeGo2rtc(BaseHTTPRequestHandler):
        protocol_version = "HTTP/1.1"

        def log_message(self, *a):
            pass

        def _send(self, code, ctype, body):
            self.send_response(code); self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(len(body))); self.end_headers(); self.wfile.write(body)

        def do_GET(self):
            path, _, query = self.path.partition("?")
            seen["queries"].append(self.path)
            if path == "/api":
                return self._send(200, "application/json", b'{"version":"1.9.14-test","host":"nas"}')
            if path == "/api/log":
                return self._send(200, "application/jsonlines", (
                    '{"time":"2026-10-07T06:40:00Z","level":"warn","message":"[wyze] connect failed: dial udp 192.168.1.77:0: i/o timeout","url":"wyze://192.168.1.77?uid=ABC&enr=LOGSECRET&dtls=true","stream":"err_cam"}\n'
                    '{"time":"2026-10-07T06:40:01Z","level":"debug","message":"[hls] new session","stream":"front_yard"}\n'
                    '{"time":"2026-10-07T06:40:02Z","level":"info","message":"[api] listen addr=:1984"}\n').encode("utf-8"))
            if path == "/api/streams" and urllib.parse.parse_qs(query).get("src", [""])[0]:
                sid = urllib.parse.parse_qs(query)["src"][0]
                return self._send(200, "application/json", json.dumps({
                    "producers": [{"url": "wyze://192.168.1.77?uid=ABC&enr=SRCSECRET&dtls=true", "type": "wyze", "state": "connecting"}] if sid == "err_cam" else [{"url": "wyze://192.168.1.50?uid=ABC&enr=SECRET&mac=AA&model=HL_CAM4&dtls=true", "type": "wyze", "state": "playing", "medias": ["video"]}],
                    "consumers": []}).encode("utf-8"))
            if path == "/api/streams":
                return self._send(200, "application/json", json.dumps({
                    "front_yard": {"producers": [{"url": "wyze://192.168.1.50?uid=ABC&enr=SECRET&mac=AA&model=HL_CAM4&dtls=true"}], "consumers": []},
                    "doorbell": {"producers": [{"url": "ring://x@y.z?device_id=1&refresh_token=SECRET"}], "consumers": []},
                    "garage": {"producers": [{"url": "rtsp://admin:SECRET@192.168.1.60/live"}], "consumers": []},
                    "bad id/with slash": {"producers": [], "consumers": []},
                }).encode("utf-8"))
            if path == "/api/frame.jpeg":
                q = urllib.parse.parse_qs(query)
                if q.get("src", [""])[0] == "err_cam":
                    return self._send(500, "text/plain", b"wyze: connect failed: dial udp 192.168.1.77:0: i/o timeout wyze://192.168.1.77?uid=ABC&enr=BODYSECRET")
                if q.get("src", [""])[0] == "slow_cam":
                    time.sleep(1.6)
                    return self._send(200, "image/jpeg", b"\xff\xd8late\xff\xd9")
                if q.get("src", [""])[0] == "dark_cam":
                    return self._send(500, "text/plain", b"source not ready")
                return self._send(200, "image/jpeg", b"\xff\xd8JPEG-" + q.get("src", [""])[0].encode() + b"-w" + q.get("w", ["0"])[0].encode())
            if path == "/api/stream.mp4":
                self.send_response(200); self.send_header("Content-Type", "video/mp4")
                self.send_header("Connection", "close"); self.end_headers()
                try:
                    for i in range(400):
                        self.wfile.write(b"MP4CHUNK%03d" % i); self.wfile.flush(); time.sleep(0.01)
                except (BrokenPipeError, ConnectionResetError, OSError):
                    pass
                self.close_connection = True
                return None
            if path == "/api/stream.m3u8":
                body = ("#EXTM3U\n#EXT-X-VERSION:7\n#EXT-X-STREAM-INF:BANDWIDTH=1000000\n"
                        "playlist.m3u8?id=SESS1\n").encode("utf-8")
                return self._send(200, "application/vnd.apple.mpegurl", body)
            if path == "/api/hls/playlist.m3u8":
                body = ('#EXTM3U\n#EXT-X-TARGETDURATION:2\n#EXT-X-MAP:URI="init.mp4?id=SESS1"\n'
                        "#EXTINF:2.0,\n/api/hls/segment.m4s?id=SESS1&n=1\n#EXTINF:2.0,\napi/hls/segment.m4s?id=SESS1&n=2\n"
                        "#EXTINF:2.0,\nsegment.m4s?id=SESS1&n=3\n").encode("utf-8")
                return self._send(200, "application/vnd.apple.mpegurl", body)
            if path == "/api/hls/segment.m4s":
                return self._send(200, "video/iso.segment", b"M4S-" + query.encode())
            if path == "/api/hls/init.mp4":
                return self._send(200, "video/mp4", b"INIT")
            return self._send(404, "text/plain", b"nope")

        def do_POST(self):
            path, _, _q = self.path.partition("?")
            n = int(self.headers.get("Content-Length") or 0)
            form = urllib.parse.parse_qs(self.rfile.read(n).decode("utf-8"))
            if path != "/api/wyze":
                return self._send(404, "text/plain", b"nope")
            seen["wyze_form"] = {k: v[0] for k, v in form.items()}
            if form.get("password", [""])[0] == "wrong":
                return self._send(401, "application/json", b'{"error":"auth","message":"bad credentials"}')
            if form.get("email", [""])[0] == "empty@example.com":
                return self._send(404, "text/plain", b"no sources")
            return self._send(200, "application/json", json.dumps({"sources": [
                {"name": "Front Yard", "info": "HL_CAM4 | AA:BB | 192.168.1.50", "url": "wyze://192.168.1.50?uid=ABC&enr=ENRSECRET&mac=AA:BB&model=HL_CAM4&dtls=true"},
                {"name": "Garage Cam!", "info": "WYZEC1-JZ | CC:DD | 192.168.1.51", "url": "wyze://192.168.1.51?uid=DEF&enr=ENRSECRET2&mac=CC:DD&model=WYZEC1-JZ"},
            ]}).encode("utf-8"))

        def do_PUT(self):
            path, _, query = self.path.partition("?")
            if path != "/api/streams":
                return self._send(404, "text/plain", b"nope")
            q = urllib.parse.parse_qs(query)
            seen.setdefault("puts", []).append((q.get("name", [""])[0], q.get("src", [""])[0]))
            return self._send(200, "application/json", b"{}")

    fake = ThreadingHTTPServer(("127.0.0.1", 0), FakeGo2rtc)
    fake.daemon_threads = True
    fake.handle_error = lambda request, client_address: None  # a viewer hanging up mid-stream is normal, not a traceback
    fp = fake.server_address[1]
    threading.Thread(target=fake.serve_forever, daemon=True).start()

    token = "test-token-" + str(os.getpid())
    exits = []
    clock = {"now": 1_000_000.0}
    fwd = ThreadingHTTPServer(("127.0.0.1", 0), make_handler(
        "http://127.0.0.1:%d" % fp, token, max_live=2, live_max_seconds=1.0, max_snap=1, snap_timeout=5, segment_timeout=5,
        exit_fn=lambda code: exits.append(code), now_fn=lambda: clock["now"]))
    fwd.daemon_threads = True
    fwd.handle_error = lambda request, client_address: None
    port = fwd.server_address[1]
    threading.Thread(target=fwd.serve_forever, daemon=True).start()

    def call(method, path, body=None, auth=None, read=True):
        c = HTTPConnection("127.0.0.1", port, timeout=8)
        headers = {"Content-Type": "application/json"}
        if auth is not None:
            headers["Authorization"] = auth
        c.request(method, path, body=body, headers=headers)
        r = c.getresponse()
        data = r.read() if read else b""
        hdrs = {k.lower(): v for k, v in r.getheaders()}
        c.close()
        return r.status, hdrs, data

    B = "Bearer " + token

    print("=== 1. pure helpers ===")
    check(strip_prefix("/cams/list") == "/list" and strip_prefix("/list") == "/list" and strip_prefix("/cams") == "/", "strip_prefix handles both spellings")
    check(kind_of("wyze://1.2.3.4?uid=x") == "wyze" and kind_of("ring://a") == "ring" and kind_of("rtsp://u:p@h/x") == "rtsp" and kind_of("onvif://h") == "onvif" and kind_of("") == "unknown", "kind_of maps schemes, never content")
    check(ticket_ok(token, "cam", mint_ticket(token, "cam")), "a minted ticket verifies for its camera")
    check(not ticket_ok(token, "other", mint_ticket(token, "cam")), "a ticket for one camera never opens another")
    check(not ticket_ok(token, "cam", mint_ticket(token, "cam", now=time.time() - 1000)), "an expired ticket is refused")
    check(not ticket_ok(token, "cam", "garbage") and not ticket_ok(token, "cam", "123.") and not ticket_ok("", "cam", mint_ticket("x", "cam")), "malformed tickets and an empty secret match nothing")
    check(not ticket_ok("other-secret", "cam", mint_ticket(token, "cam")), "a ticket from a different secret is refused")

    print("=== 2. /health passes go2rtc's OWN answer through, unauthenticated ===")
    s, _h, d = call("GET", "/health")
    j = json.loads(d)
    check(s == 200 and j.get("ok") is True and j.get("go2rtc") == "1.9.14-test" and j.get("streams") == 4, "GET /health -> 200 with go2rtc version + stream count")
    check(re.match(r"^[0-9a-f]{16}$", str(j.get("forwarder", ""))) is not None and j.get("forwarder") == code_sha(), "GET /health names the sha of the code that is actually serving (the outside witness compares it with main)")
    check(j.get("on_disk") == code_sha() and j.get("on_disk") == j.get("forwarder"), "GET /health names the sha of the file on disk too (equal here: this process IS its file)")
    check(code_sha("/nonexistent/path") == "unknown", "a file that cannot be read names itself unknown, never a guess")
    s, _h, _d = call("GET", "/cams/health")
    check(s == 200, "GET /cams/health (un-stripped spelling) -> 200 too")

    print("=== 3. /list is LOCKED and never leaks a source URL ===")
    s, _h, _d = call("GET", "/list")
    check(s == 401, "no Authorization -> 401")
    s, _h, _d = call("GET", "/list", auth="Bearer wrong")
    check(s == 401, "wrong bearer -> 401")
    s, _h, d = call("GET", "/list", auth=B)
    j = json.loads(d)
    ids = [c["id"] for c in j.get("cameras", [])]
    check(s == 200 and ids == ["doorbell", "front_yard", "garage"], "right bearer -> the three well-formed streams, sorted; the bad id is dropped, not smuggled")
    check(b"SECRET" not in d and b"://" not in d and b"refresh_token" not in d, "no source URL, credential or key leaves the box")
    kinds = {c["id"]: c["kind"] for c in j["cameras"]}
    check(kinds == {"front_yard": "wyze", "doorbell": "ring", "garage": "rtsp"}, "kind is inferred from the scheme only")
    check(j["cameras"][1]["name"] == "front yard", "name is a readable form of the id")

    print("=== 4. /ticket mints only for the bearer, only for a well-formed camera ===")
    s, _h, _d = call("POST", "/ticket", b'{"camera":"front_yard"}')
    check(s == 401, "no bearer -> 401")
    s, _h, _d = call("POST", "/ticket", b'{"camera":"../etc"}', auth=B)
    check(s == 400, "a camera id outside the grammar -> 400")
    s, _h, _d = call("POST", "/ticket", b'not json', auth=B)
    check(s == 400, "bad JSON -> 400")
    s, _h, d = call("POST", "/ticket", b'{"camera":"front_yard"}', auth=B)
    tj = json.loads(d)
    tk = tj.get("ticket", "")
    check(s == 200 and ticket_ok(token, "front_yard", tk) and tj.get("expires_in") == TICKET_TTL_SECONDS, "right bearer -> a verifying ticket with its ttl")

    print("=== 5. /snap: bearer OR ticket; the frame comes back byte-for-byte; a dark camera is an honest error ===")
    s, _h, _d = call("GET", "/snap/front_yard.jpg")
    check(s == 401, "no credential -> 401")
    s, h, d = call("GET", "/snap/front_yard.jpg?w=640", auth=B)
    check(s == 200 and h.get("content-type", "").startswith("image/jpeg") and d == b"\xff\xd8JPEG-front_yard-w640", "bearer -> go2rtc's JPEG, with w passed through")
    s, _h, d = call("GET", "/snap/front_yard.jpg?t=" + tk)
    check(s == 200 and d.startswith(b"\xff\xd8"), "a ticket for this camera opens its snapshot too")
    s, _h, _d = call("GET", "/snap/garage.jpg?t=" + tk)
    check(s == 401, "the same ticket does NOT open another camera's snapshot")
    s, _h, d = call("GET", "/snap/dark_cam.jpg", auth=B)
    check(s == 500 and b"no-frame" in d, "a camera go2rtc cannot reach -> its status + no-frame, never a painted image")
    s, _h, _d = call("GET", "/snap/..%2F..%2Fetc.jpg", auth=B)
    check(s in (400, 404), "a path-shaped camera id is refused")

    print("=== 6. /live mp4: ticket only; bytes stream; the cap refuses the 3rd AT ONCE; the time brake ends it ===")
    s, _h, _d = call("GET", "/live/front_yard.mp4")
    check(s == 401, "no ticket -> 401")
    s, _h, _d = call("GET", "/live/garage.mp4?t=" + tk)
    check(s == 401, "another camera's ticket -> 401")
    results = {}

    def stream_one(k):
        c = HTTPConnection("127.0.0.1", port, timeout=10)
        c.request("GET", "/live/front_yard.mp4?t=" + tk)
        r = c.getresponse()
        t0 = time.monotonic()
        got = b""
        while True:
            chunk = r.read(1024)
            if not chunk:
                break
            got += chunk
        results[k] = (r.status, got, time.monotonic() - t0, {kk.lower(): vv for kk, vv in r.getheaders()})
        c.close()

    ta = threading.Thread(target=stream_one, args=("a",)); tb = threading.Thread(target=stream_one, args=("b",))
    ta.start(); tb.start(); time.sleep(0.25)
    t0 = time.monotonic(); s, _h, d = call("GET", "/live/front_yard.mp4?t=" + tk); dt = time.monotonic() - t0
    check(s == 503 and b"busy" in d and dt < 0.5, "third concurrent live view -> 503 busy immediately (%.2fs)" % dt)
    ta.join(); tb.join()
    sa, ga, ela, ha = results["a"]
    check(sa == 200 and ga.startswith(b"MP4CHUNK000") and len(ga) > 11 * 10, "first live view streams real bytes from go2rtc (%d bytes)" % len(ga))
    check(ha.get("x-live-max-seconds") == "1", "the stream announces its own time brake in a header")
    check(0.8 <= ela < 3.0, "the live view ended itself at the brake (~1s), not at go2rtc's end (%.2fs)" % ela)
    time.sleep(0.1)
    s, _h, _d = call("GET", "/live/front_yard.mp4?t=" + tk, read=False)
    check(s == 200, "after the brake fired the slot is free again")

    print("=== 7. HLS: the ticket rides every line; paths stay relative to where the client is ===")
    s, h, d = call("GET", "/live/front_yard/index.m3u8?t=" + tk)
    txt = d.decode()
    check(s == 200 and "mpegurl" in h.get("content-type", ""), "index playlist served as m3u8")
    check(("hls/playlist.m3u8?id=SESS1&t=" + urllib.parse.quote(tk, safe="")) in txt, "the master line points at hls/playlist.m3u8 with the ticket appended")
    s, _h, d = call("GET", "/live/front_yard/hls/playlist.m3u8?id=SESS1&t=" + tk)
    txt = d.decode()
    qt = urllib.parse.quote(tk, safe="")
    check(('URI="init.mp4?id=SESS1&t=' + qt + '"') in txt, "EXT-X-MAP URI carries the ticket")
    check(txt.count("segment.m4s?id=SESS1&n=") == 3 and txt.count("&t=" + qt) == 4, "all three segment spellings (absolute, api-relative, bare) collapse to one relative form with the ticket")
    check("/api/hls/" not in txt and "api/hls/" not in txt, "no go2rtc-internal path leaks to the client")
    s, _h, d = call("GET", "/live/front_yard/hls/segment.m4s?id=SESS1&n=2&t=" + tk)
    check(s == 200 and d == b"M4S-id=SESS1&n=2", "a segment is fetched with the ticket STRIPPED before go2rtc sees the query")
    check(not any("t=" in q for q in seen["queries"] if "/api/hls/" in q), "the ticket never reaches go2rtc on any hls call")
    s, _h, _d = call("GET", "/live/front_yard/hls/evil.sh?t=" + tk)
    check(s == 404, "an hls file outside the allowlist -> 404")
    s, _h, _d = call("GET", "/live/front_yard/hls/segment.m4s?id=SESS1&n=2")
    check(s == 401, "an hls segment without a ticket -> 401")
    check(rewrite_playlist("#EXTM3U\nhttps://elsewhere.example/x.m4s\nunknown.bin?x=1\n", "T", True) == "#EXTM3U\nhttps://elsewhere.example/x.m4s\nunknown.bin?x=1\n", "unrecognised lines pass through untouched, never guessed into a route")

    print("=== 8. bounds and the unknown ===")
    s, _h, _d = call("GET", "/elsewhere", auth=B)
    check(s == 404, "unknown GET path -> 404")
    s, _h, _d = call("POST", "/list", b"{}", auth=B)
    check(s == 404, "POST to a GET route -> 404")
    s, _h, _d = call("POST", "/ticket", b"", auth=B)
    check(s == 400, "empty ticket body -> 400")

    print("=== 8b. /setup/wyze: the sign-in from the app, locked, scrubbed, idempotent ===")
    check(stream_name_for("Front Yard", set()) == "front_yard" and stream_name_for("Garage Cam!", {"garage_cam"}) == "garage_cam_2" and stream_name_for("", set()) == "camera", "a nickname becomes an addressable, unique, lower-case stream id")
    cams = wyze_cameras_from(json.dumps({"sources": [{"name": "A", "info": "HL_CAM4 | M | 1.2.3.4", "url": "wyze://1.2.3.4?uid=x&dtls=true"}, {"name": "B", "url": "wyze://1.2.3.5?uid=y"}, {"bogus": 1}]}).encode())
    check([c["model"] for c in cams] == ["HL_CAM4", ""] and [c["dtls"] for c in cams] == [True, False], "sources are read: model from info, dtls from the url, junk skipped")
    good = json.dumps({"email": "d@example.com", "password": "pw-secret", "api_id": "id1", "api_key": "key-secret"}).encode()
    s, _h, _d = call("POST", "/setup/wyze", good)
    check(s == 401, "no bearer -> 401 (the sign-in never reaches go2rtc)")
    check("wyze_form" not in seen, "an unauthenticated setup sent nothing upstream")
    s, _h, d = call("POST", "/setup/wyze", json.dumps({"email": "d@example.com", "password": "x", "api_id": "id1"}).encode(), auth=B)
    check(s == 400 and b"api_key" in d, "a missing field is named, 400")
    s, _h, d = call("POST", "/setup/wyze", json.dumps({"email": "nope", "password": "x", "api_id": "a", "api_key": "b"}).encode(), auth=B)
    check(s == 400 and b"bad-email" in d, "a non-email is refused before anything is sent")
    s, _h, d = call("POST", "/setup/wyze", json.dumps({"email": "d@example.com", "password": "wrong", "api_id": "id1", "api_key": "k"}).encode(), auth=B)
    check(s == 401 and b"wyze-sign-in-refused" in d, "Wyze refusing the sign-in is said plainly (401), not swallowed")
    s, _h, d = call("POST", "/setup/wyze", json.dumps({"email": "empty@example.com", "password": "p", "api_id": "id1", "api_key": "k"}).encode(), auth=B)
    j = json.loads(d.decode("utf-8"))
    check(s == 200 and j.get("ok") is True and j.get("added") == 0 and "no cameras" in j.get("note", ""), "an account with no cameras is a signed-in 200 with zero added, honestly noted")
    seen.pop("puts", None)
    s, _h, d = call("POST", "/setup/wyze", good, auth=B)
    j = json.loads(d.decode("utf-8"))
    check(s == 200 and j.get("ok") is True, "a good sign-in -> 200 ok")
    check(seen.get("wyze_form", {}).get("password") == "pw-secret" and seen["wyze_form"].get("api_key") == "key-secret" and seen["wyze_form"].get("api_id") == "id1", "the four values reach go2rtc's own sign-in as a form")
    ids = [c["id"] for c in j.get("cameras", [])]
    check(ids == ["front_yard", "garage_cam"], "cameras are answered by their stream ids (%r)" % ids)
    check(j.get("added") == 1 and j["cameras"][0].get("existing") is True and j["cameras"][1].get("registered") is True, "a camera already registered is left as it is; the new one is added (idempotent re-run)")
    check(seen.get("puts") == [("garage_cam", "wyze://192.168.1.51?uid=DEF&enr=ENRSECRET2&mac=CC:DD&model=WYZEC1-JZ")], "exactly the new camera is PUT to go2rtc with its exact source url")
    check(b"ENRSECRET" not in d and b"wyze://" not in d and b"pw-secret" not in d and b"key-secret" not in d, "no source url, enr, password or api key leaves in the answer")
    check(j["cameras"][0].get("dtls") is True and j["cameras"][1].get("dtls") is False and j["cameras"][1].get("model") == "WYZEC1-JZ", "dtls and model are reported so the app can say which units the restreamer supports")
    SETUP_LOCK.acquire()
    try:
        s, _h, d = call("POST", "/setup/wyze", good, auth=B)
        check(s == 409 and b"setup-in-progress" in d, "a second setup while one is in flight is told 409, never stacked")
    finally:
        SETUP_LOCK.release()
    s, _h, _d = call("POST", "/setup/wyze", b"x" * (SETUP_MAX_BODY + 1), auth=B)
    check(s == 400, "an oversized setup body -> 400")

    print("=== 8c. /restart: the one button in the app, locked, spaced, and it really leaves ===")
    s, _h, d = call("POST", "/restart")
    check(s == 401 and exits == [], "no bearer -> 401 and the process does NOT leave")
    s, _h, d = call("POST", "/restart", auth=B)
    j = json.loads(d.decode("utf-8"))
    check(s == 200 and j.get("ok") is True and j.get("restarting") is True and j.get("running") == CODE_SHA and j.get("on_disk") == code_sha() and j.get("changed") is False, "a bearer restart answers 200 first, naming running + on-disk sha")
    deadline = time.time() + 3
    while not exits and time.time() < deadline:
        time.sleep(0.05)
    check(exits == [3], "then the process leaves with exit 3 (systemd Restart=on-failure brings it back from disk), got %r" % (exits,))
    s, _h, d = call("POST", "/restart", auth=B)
    check(s == 429 and b"restart-too-soon" in d and exits == [3], "a second tap inside %ds -> 429, no second exit" % RESTART_MIN_SECONDS)
    clock["now"] += RESTART_MIN_SECONDS + 1
    s, _h, _d = call("POST", "/restart", auth=B)
    deadline = time.time() + 3
    while len(exits) < 2 and time.time() < deadline:
        time.sleep(0.05)
    check(s == 200 and exits == [3, 3], "after the window a restart is allowed again")
    s, _h, d = call("POST", "/restart", json.dumps({"x": 1}).encode(), auth=B)
    check(s == 429, "a body changes nothing: the route takes none")

    print("=== 8d. a blank tile can say WHY (DR-0774): honest snap causes and GET /why ===")
    s, _h, d = call("GET", "/snap/err_cam.jpg", auth=B)
    j = json.loads(d.decode("utf-8"))
    check(s == 500 and j.get("error") == "no-frame" and "i/o timeout" in j.get("detail", ""), "go2rtc's own error text reaches the app on a failed frame (%r)" % j.get("detail"))
    check(b"BODYSECRET" not in d and b"enr=" not in d or b"enr=***" in d, "the enr secret in go2rtc's error text is scrubbed")
    fwd2 = ThreadingHTTPServer(("127.0.0.1", 0), make_handler(
        "http://127.0.0.1:%d" % fp, token, max_live=2, live_max_seconds=1.0, max_snap=1, snap_timeout=1.0, segment_timeout=5))
    fwd2.daemon_threads = True
    fwd2.handle_error = lambda request, client_address: None
    port2 = fwd2.server_address[1]
    threading.Thread(target=fwd2.serve_forever, daemon=True).start()
    c2 = HTTPConnection("127.0.0.1", port2, timeout=8)
    c2.request("GET", "/snap/slow_cam.jpg", headers={"Authorization": B})
    r2 = c2.getresponse(); d2 = r2.read(); c2.close()
    j2 = json.loads(d2.decode("utf-8"))
    check(r2.status == 504 and j2.get("error") == "frame-timeout" and j2.get("after_s") == 1, "a camera that does not answer in time is a 504 frame-timeout naming the seconds, never 'go2rtc unreachable' (%r)" % j2)
    fwd2.shutdown()
    s, _h, d = call("GET", "/why/err_cam")
    check(s == 401, "no bearer -> /why 401")
    s, _h, d = call("GET", "/why/bad%20id", auth=B)
    check(s in (400, 404), "a malformed id never reaches go2rtc")
    s, _h, d = call("GET", "/why/err_cam", auth=B)
    j = json.loads(d.decode("utf-8"))
    check(s == 200 and j.get("id") == "err_cam", "GET /why/<id> -> 200 for the stream")
    check(j.get("producers") and j["producers"][0].get("kind") == "wyze" and j["producers"][0].get("host") == "192.168.1.77" and j["producers"][0].get("state") == "connecting" and "url" not in j["producers"][0], "producers are summarized: kind, host, state, never the url")
    check(any("i/o timeout" in line for line in j.get("log", [])) and not any("front_yard" in line and "hls" in line for line in j.get("log", [])), "the log lines naming this stream (and wyze/error lines) come through; another stream's chatter does not")
    check(j.get("probe", {}).get("status") == 500 and "i/o timeout" in j["probe"].get("error", ""), "the probe carries go2rtc's own error text")
    check(b"LOGSECRET" not in d and b"SRCSECRET" not in d and b"BODYSECRET" not in d, "no enr secret leaves in any part of /why")
    s, _h, d = call("GET", "/why/front_yard", auth=B)
    j = json.loads(d.decode("utf-8"))
    check(s == 200 and j.get("probe", {}).get("ok") is True and j["producers"][0].get("state") == "playing", "a healthy camera's /why says so: probe ok, producer playing")
    s, _h, d = call("GET", "/health")
    j = json.loads(d.decode("utf-8"))
    check(j.get("max_live") == 2 and j.get("live_max_seconds") == 1, "/health reports the caps this instance runs with (the defaults are 12 and 0 = no clock)")
    check(MAX_LIVE == 12 and LIVE_MAX_SECONDS == 0, "the shipped defaults do not cut a viewer off: 12 live, no clock")

    print("=== 9. a DARK go2rtc reads as 502 everywhere, never as this process's own 200 ===")
    fake.shutdown(); fake.server_close()
    s, _h, d = call("GET", "/health")
    check(s == 502 and b"go2rtc-unreachable" in d, "go2rtc down -> /health 502 go2rtc-unreachable")
    s, _h, d = call("GET", "/list", auth=B)
    check(s == 502, "go2rtc down -> /list 502")
    s, _h, d = call("GET", "/snap/front_yard.jpg", auth=B)
    check(s == 502, "go2rtc down -> /snap 502")
    s, _h, d = call("POST", "/setup/wyze", good, auth=B)
    check(s == 502 and b"go2rtc-unreachable" in d, "go2rtc down -> /setup/wyze 502")

    print("=== 10. bearer_ok never accepts an empty expected token ===")
    check(not bearer_ok("Bearer ", ""), "empty expected token matches nothing")
    check(not bearer_ok("Bearer x", ""), "an unconfigured forwarder accepts nobody")

    fwd.shutdown()
    if failures:
        print("\nSELFTEST FAILED: %d check(s)" % len(failures))
        for f in failures:
            print("  - " + f)
        sys.exit(1)
    print("\nALL CAMS FORWARDER CHECKS PASSED.")


def main():
    ap = argparse.ArgumentParser(description="NAS-side locked door for the family camera restreamer (go2rtc)")
    ap.add_argument("--host", default="127.0.0.1")
    ap.add_argument("--port", type=int, default=int(os.environ.get("PORT", "8773")))
    ap.add_argument("--upstream", default=os.environ.get("CAMS_UPSTREAM", UPSTREAM_DEFAULT))
    ap.add_argument("--token-file", default=None)
    ap.add_argument("--selftest", action="store_true")
    args = ap.parse_args()
    if args.selftest:
        return _selftest()
    token = expected_token(args.token_file)
    if not token:
        print("REFUSING TO START: no bearer token. Set CAMS_BRIDGE_TOKEN or populate %s"
              % (args.token_file or TOKEN_FILE_DEFAULT), file=sys.stderr)
        sys.exit(2)
    if args.host not in ("127.0.0.1", "localhost"):
        print("REFUSING TO START: --host must be loopback (got %s)" % args.host, file=sys.stderr)
        sys.exit(2)
    httpd = ThreadingHTTPServer((args.host, args.port), make_handler(args.upstream, token))
    httpd.daemon_threads = True
    print("cams-forwarder on http://%s:%d -> %s (live cap %d x %.0fs, snap cap %d)"
          % (args.host, args.port, args.upstream, MAX_LIVE, LIVE_MAX_SECONDS, MAX_SNAP_INFLIGHT))
    httpd.serve_forever()


if __name__ == "__main__":
    main()
