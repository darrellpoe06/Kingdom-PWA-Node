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
#   POST /setup/wyze/again             bearer, no body. Re-runs the sign-in and
#        the camera registration from the FOUR VALUES THE NAS KEPT (the
#        secrets file the first sign-in wrote; go2rtc.yaml's own wyze: block
#        before that). Nobody types anything twice (Darrell 2026-10-07: "I
#        better not need to resign in!"). 503 no-credentials when nothing was
#        ever kept. The forwarder also calls this ITSELF: SELF_HEAL_SECONDS
#        after start and every SELF_HEAL_SECONDS, if go2rtc lists ZERO streams
#        and credentials exist, the cameras are re-added with no hand (one
#        cloud call per cycle at most; the setup lock is the concurrency lock).
#   POST /restart                      bearer. {ok, restarting, running, on_disk}
#        then this process exits 3 and systemd (Restart=on-failure) starts it
#        again from the file on disk. 429 restart-too-soon inside 60 s of the
#        last one. The in-app "Restart the camera service" button (DR-0772).
#   GET  /why/<id>                     bearer. WHY a camera has no picture, from
#        go2rtc's own mouth: {id, probe:{status,error,ms}, producers:[{kind,
#        host,...no url}], log:[scrubbed recent lines naming this stream]}.
#        (DR-0774: a tile that says only "HTTP 502" gives no sight.)
#   GET  /recording                    bearer. {config, status}: which cameras
#        record, their retention, the disk budget, and the recorder's own
#        status file (clips, bytes, oldest/newest, disk free). DR-0775.
#   PUT  /recording {disk_budget_gb, cameras:{id:{enabled,retention_days}}}
#        bearer. Validated + normalized, written to recording.json; the
#        recorder service reconciles within its loop. Answers the saved config.
#   GET  /rec/<id>                     bearer. The camera's clips on disk
#        [{name, bytes, start}] oldest first, grouped by day by the app.
#   GET  /rec/<id>/<clip>.mp4?t=       ticket (the camera's). The clip itself,
#        with Range (206) so the player can seek. Never a path outside the
#        camera's folder; the clip name grammar is the only accepted shape.
#        &size=small|medium|large       the clip at that size (DR-0797): 480p /
#        720p / 1080p, never upscaled, made once by the container's ffmpeg and
#        kept under .derived; 202 {status: queued|making, position} until it is
#        ready, 500 transcode-failed with ffmpeg's words (&retry=1 tries once
#        more), 400 bad-size.
#        &sizes=1                        {original, seconds, tiers:{size:{label,
#        height, estimate, state, bytes?}}} -- the estimate is the tier's rate for
#        the clip's length, never more than the original.
#        &dl=1                           Content-Disposition: attachment, named
#        <camera>-<time>-<size>.mp4, so a phone saves it.
#   POST /streams {name, url[, replace]}  owner. Any camera go2rtc speaks (rtsp,
#        rtsps, rtmp, onvif, http, ring, nest, ...; never exec/ffmpeg#raw):
#        registered (PUT; the config when go2rtc refuses, DR-0789), then ONE
#        frame probed: {ok, id, kind, registered, persisted, probe:{status, ok,
#        ms, bytes, error?}}. 400 bad-camera-id | scheme-not-allowed; 409 name-taken.
#   GET  /streams/<id>/test            bearer or grant. The probe alone.
#   DELETE /streams/<id>               owner. Out of go2rtc and the config, with its twins.
#   POST /setup/ring {email,password[,code]}  owner. go2rtc's own /api/ring;
#        409 needs-2fa {prompt} until the code is given; then every Ring
#        camera registered: {ok, added, cameras:[{id,name,registered}]}.
#   GET  /streams/health               bearer or grant (its cameras). The stream
#        health log (DR-0798): per camera the last hour from go2rtc's own numbers
#        -- kbps now and average while watched, up%, drops (producer-gone,
#        bytes-frozen, producer-restarted while watched), codecs, hevc_only,
#        twin, sd -- and the last 50 drop events. Sampled every CAMS_STREAM_SAMPLE_SECONDS.
#        Every Wyze camera also gets `<id>_sd` (its own substream, DR-0799) for
#        tiles in a grid; /list hides both twins and marks the camera h264 / sd.
#   GET  /devices                      bearer. The Wyze ACCOUNT's devices over
#        Wyze's own cloud API (wyze_cloud.py), independent of any video:
#        [{mac, nickname, model, online, garage, stream}] -- `stream` is the
#        go2rtc id the nickname maps to, so the app can pair a tile with its
#        door. 503 no-credentials until the Cameras tab's Wyze sign-in has
#        landed; 401 wyze-sign-in-refused; 502 wyze-unreachable. DR-0777.
#   POST /action {mac, action}         bearer. ONE cloud action on ONE device
#        (garage = garage_door_trigger, the same call the Wyze app makes; also
#        siren_on/off, power_on/off). Never waits on video. 429 too-soon inside
#        ACTION_MIN_SECONDS (a double tap never cycles a door twice); 409
#        device-offline; 400 unknown-action / unknown-device /
#        no-garage-controller. DR-0777 (Darrell: "I want a button for garage
#        that is independent of the video streaming being available").
#   ACCESS GRANTS (DR-0778; Darrell: "My wife and family should also have
#   access to my cameras... unless I say no... One time setup for owners and
#   they can give access to who they want.... inside or out"; "we never give a
#   password just access and no access whenever the owner wants to"). The
#   owner (family bearer) mints a GRANT: a per-person token `g.<id>.<mac>`
#   bound to a name, a camera list or "*", an optional expiry (0 = until taken
#   back) and whether the doors are included. The grant holder's device sends
#   it as its bearer; the forwarder admits it to the READ roads for ITS cameras
#   only, never to setup, restart, recording, or grants. Revoking removes the
#   record; the token dies on the next request. Records live in GRANTS_FILE
#   (0600); the token itself is never stored, only its salt.
#   GET  /grants                       owner. [{id, name, cameras, actions,
#        created, expires, revoked, last_used}] -- never a token or salt.
#   POST /grants {name, cameras:"*"|[ids], days, actions}  owner. {id, token,
#        link_path} -- the only time the token is shown; the app makes the link.
#   POST /grants/<id>/revoke           owner. The holder is out on the next request.
#   POST /pair                         open, throttled. A SCREEN with no key asks
#        for a six-letter code: {code, watch, expires_in, link_path}. It shows
#        the code as a QR (link_path + code) and polls GET /pair/<code>?w=watch
#        ("waiting" | "approved" + the grant token, ONCE | 404 expired). The
#        owner's phone opens the QR or types the code and POST
#        /pair/<code>/approve {name, cameras, days, actions} (owner) mints the
#        grant the screen receives. GET /pair (owner) lists the codes waiting.
#        Nothing is typed on the TV (Darrell: "use a qrcode to type into the
#        Firestick"). Codes live PAIR_TTL_SECONDS in memory. DR-0778.
#   GET  /snap/<id>.jpg?w=&h=          bearer OR ticket. One JPEG frame. On a
#        miss the JSON names the cause: frame-timeout (504, after_s), no-frame
#        (go2rtc's status + its scrubbed detail), go2rtc-unreachable (502), or
#        resting (503, retry_in, detail: the last reason) once a camera has
#        missed BREAKER_FAILS times in a row -- it is left alone for
#        BREAKER_REST_SECONDS so go2rtc's effort goes to cameras that answer.
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
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

# The recorder's pure helpers (same folder, DR-0775): the config shape and the
# clips on disk. The forwarder is the recorder's only writer (PUT /recording)
# and its reader for the tab; the recorder service reconciles to the file.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
try:
    from cams_recorder import normalize_config as rec_normalize_config, load_config as rec_load_config, list_clips as rec_list_clips, CLIP_SUFFIX as REC_CLIP_SUFFIX, SEGMENT_SECONDS as REC_SEGMENT_SECONDS
except ImportError:  # the forwarder still serves cameras without the recorder beside it
    rec_normalize_config = rec_load_config = rec_list_clips = None
    REC_CLIP_SUFFIX = ".mp4"
    REC_SEGMENT_SECONDS = 600
# The Wyze account over Wyze's own cloud (DR-0777): the devices and their
# actions (the garage door) with no video in the path. Optional the same way.
try:
    import wyze_cloud as _wyze
except ImportError:
    _wyze = None

# One cloud session per process, made on first use from the credentials the
# Cameras tab's sign-in left (the secrets file first, go2rtc.yaml's wyze: block
# second). Reset when a new sign-in lands so the next call uses the new account.
WYZE_LOCK = threading.Lock()
WYZE_STATE = {"client": None}


def wyze_client_default():
    if _wyze is None:
        raise RuntimeError("wyze_cloud.py is not beside the forwarder")
    with WYZE_LOCK:
        if WYZE_STATE["client"] is None:
            creds = _wyze.load_credentials()
            if not creds:
                return None
            WYZE_STATE["client"] = _wyze.WyzeCloud(creds)
        return WYZE_STATE["client"]


def wyze_client_reset():
    with WYZE_LOCK:
        WYZE_STATE["client"] = None


def wyze_error_response(e):
    """A WyzeError -> (status, json) the app can read; never a secret."""
    kind = getattr(e, "kind", "wyze-error")
    detail = scrub_text(getattr(e, "detail", "") or "", 200)
    status = {
        "no-credentials": 503, "sign-in-refused": 401, "unreachable": 502, "bad-json": 502,
        "too-soon": 429, "device-offline": 409, "unknown-action": 400, "unknown-device": 400,
        "no-garage-controller": 400, "parameter-error": 502,
    }.get(kind, 502)
    if kind.startswith("http-"):
        status = 502
    out = {"error": kind, "detail": detail}
    if kind == "too-soon":
        m = re.match(r"^(\d+)", detail)
        out["retry_in"] = int(m.group(1)) if m else int(getattr(_wyze, "ACTION_MIN_SECONDS", 3))
    return status, out

TOKEN_FILE_DEFAULT = "/volume1/PoeTech/secrets/chat-bridge-token.txt"
RECORDING_CONFIG = os.environ.get("CAMS_RECORDING_CONFIG", os.path.join(os.environ.get("GO2RTC_DATA", "/volume1/docker/go2rtc"), "recording.json"))
RECORDING_STATUS = os.environ.get("CAMS_RECORDING_STATUS", os.path.join(os.environ.get("GO2RTC_DATA", "/volume1/docker/go2rtc"), "recording.status.json"))
RECORDINGS_ROOT = os.environ.get("CAMS_RECORDINGS", "/volume1/PoeTech/cameras/recordings")
CLIP_NAME = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.mp4$")
UPSTREAM_DEFAULT = "http://127.0.0.1:1984"

# THE CAPS ARE NOT THE PRODUCT (Darrell 2026-10-07: "Let's not build in
# undermining constraints... we want to build the best pipelines"). The live
# cap and the per-view clock stay as MECHANISMS, measured and reported in
# /health, but their defaults no longer cut a family member off: 12 live
# views (a 3x4 wall) and no clock (0 = a view runs until the viewer leaves).
# The home link's real bandwidth is measured by the app, not pre-empted here.
MAX_LIVE = int(os.environ.get("CAMS_MAX_LIVE", "32"))  # DR-0776: live in every tile; one per camera, and then some
LIVE_MAX_SECONDS = float(os.environ.get("CAMS_LIVE_MAX_SECONDS", "0"))  # 0 = no clock
MAX_SNAP_INFLIGHT = int(os.environ.get("CAMS_MAX_SNAP_INFLIGHT", "6"))
SNAP_TIMEOUT = float(os.environ.get("CAMS_SNAP_TIMEOUT", "12"))
SEGMENT_TIMEOUT = float(os.environ.get("CAMS_SEGMENT_TIMEOUT", "20"))
LIVE_CONNECT_TIMEOUT = float(os.environ.get("CAMS_LIVE_CONNECT_TIMEOUT", "20"))
TICKET_TTL_SECONDS = int(os.environ.get("CAMS_TICKET_TTL", "90"))
TICKET_TTL_MAX = int(os.environ.get("CAMS_TICKET_TTL_MAX", "3600"))  # a recorded clip's playback (DR-0775)
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

# THE LINK IS MEASURED, NOT PRE-EMPTED (DR-0776; Darrell: "Live views... all
# the time"). Every byte this process hands to a live viewer (MP4 bodies and
# HLS segments) is counted in a 10 s window, so /health can say how many live
# streams are open and how many bits per second are crossing the Funnel right
# now. The tab shows the number; a cap, if one is ever needed, is set from it.
# A CAMERA THAT KEEPS FAILING IS RESTED (DR-0776). Measured 2026-10-07: 20+
# cameras at the other house, each snapshot attempt a 10 s discovery timeout
# inside go2rtc, retried every sweep by every open tab; a local camera's frame
# took 242 s to arrive. go2rtc's effort must go to the cameras that answer.
# After BREAKER_FAILS consecutive misses a camera's snapshots answer at once
# with 503 "resting" (naming the last reason and the seconds left) for
# BREAKER_REST_SECONDS; one probe is allowed when the rest ends; a success
# clears it. Live views are never blocked by the breaker (a person asked).
BREAKER_FAILS = int(os.environ.get("CAMS_BREAKER_FAILS", "3"))
BREAKER_REST_SECONDS = float(os.environ.get("CAMS_BREAKER_REST_SECONDS", "300"))
BREAKER_LOCK = threading.Lock()
BREAKERS = {}  # cam -> {"fails": n, "until": monotonic, "last": reason, "probing": bool}


def breaker_check(cam, now=None):
    """-> None when the camera may be tried, else {"retry_in": s, "last": reason}."""
    now = now if now is not None else time.monotonic()
    with BREAKER_LOCK:
        b = BREAKERS.get(cam)
        if not b or b["fails"] < BREAKER_FAILS:
            return None
        if now >= b["until"]:
            if b.get("probing"):
                return {"retry_in": 5, "last": b["last"]}
            b["probing"] = True  # one probe goes through
            return None
        return {"retry_in": int(b["until"] - now) + 1, "last": b["last"]}


def breaker_note(cam, ok, reason="", now=None):
    now = now if now is not None else time.monotonic()
    with BREAKER_LOCK:
        if ok:
            BREAKERS.pop(cam, None)
            return
        b = BREAKERS.setdefault(cam, {"fails": 0, "until": 0.0, "last": "", "probing": False})
        b["fails"] += 1
        b["last"] = (reason or "")[:120]
        b["probing"] = False
        if b["fails"] >= BREAKER_FAILS:
            b["until"] = now + BREAKER_REST_SECONDS


def breaker_snapshot():
    with BREAKER_LOCK:
        return {"resting": sorted(c for c, b in BREAKERS.items() if b["fails"] >= BREAKER_FAILS)}


LIVE_STATS_LOCK = threading.Lock()
LIVE_STATS = {"open": 0, "samples": []}  # samples: (monotonic, bytes)
LIVE_WINDOW_SECONDS = 10.0


def live_note(nbytes, delta_open=0, now=None):
    now = now if now is not None else time.monotonic()
    with LIVE_STATS_LOCK:
        LIVE_STATS["open"] = max(0, LIVE_STATS["open"] + delta_open)
        if nbytes:
            LIVE_STATS["samples"].append((now, nbytes))
        cutoff = now - LIVE_WINDOW_SECONDS
        LIVE_STATS["samples"] = [(t, n) for (t, n) in LIVE_STATS["samples"] if t >= cutoff]


def live_snapshot(now=None):
    now = now if now is not None else time.monotonic()
    with LIVE_STATS_LOCK:
        cutoff = now - LIVE_WINDOW_SECONDS
        total = sum(n for (t, n) in LIVE_STATS["samples"] if t >= cutoff)
        return {"live_open": LIVE_STATS["open"], "live_bytes_per_s": int(total / LIVE_WINDOW_SECONDS)}

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
# go2rtc's own config file on the host (the container sees it as /config/go2rtc.yaml).
GO2RTC_YAML_PATH = os.environ.get("GO2RTC_YAML", os.path.join(os.environ.get("GO2RTC_DATA", "/volume1/docker/go2rtc"), "go2rtc.yaml"))
# What the last config-persist pass did (DR-0787 / DR-0789), for /health.
PERSIST_LAST = {}
WYZE_FIELDS = ("email", "password", "api_id", "api_key")
# Self-heal cadence (DR-0777): a restreamer that comes back with no streams
# (a recreated container, a lost config) gets its cameras re-added from the
# kept sign-in. Deterministic, bounded: one check per cycle, one cloud call at
# most when the check finds zero streams, the setup lock refuses a second.
SELF_HEAL_SECONDS = float(os.environ.get("CAMS_SELF_HEAL_SECONDS", "600"))
SELF_HEAL_FIRST_SECONDS = float(os.environ.get("CAMS_SELF_HEAL_FIRST_SECONDS", "20"))

# --- access grants (DR-0778) -------------------------------------------------
GRANTS_FILE = os.environ.get("CAMS_GRANTS", os.path.join(os.environ.get("GO2RTC_DATA", "/volume1/docker/go2rtc"), "camera-grants.json"))
GRANTS_LOCK = threading.Lock()
GRANT_ID = re.compile(r"^[a-f0-9]{12}$")
GRANT_TOKEN = re.compile(r"^g\.([a-f0-9]{12})\.([a-f0-9]{32})$")
GRANT_NAME_MAX = 64
GRANT_DAYS_MAX = 3650
GRANT_LINK_PATH = "/poetech-app/?view=cameras&cams-grant="
GRANT_TOUCH_SECONDS = 60.0  # last_used is written at most this often per grant


def grants_load(path=None):
    path = path or GRANTS_FILE
    try:
        with open(path, "r", encoding="utf-8") as fh:
            doc = json.load(fh)
    except (OSError, ValueError):
        return {"grants": {}}
    if not isinstance(doc, dict) or not isinstance(doc.get("grants"), dict):
        return {"grants": {}}
    return doc


def grants_save(doc, path=None):
    path = path or GRANTS_FILE
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    tmp = path + ".tmp"
    fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w", encoding="utf-8") as fh:
        json.dump(doc, fh, indent=1)  # insertion order kept: newest grant last on disk
    os.replace(tmp, path)


def grant_sign(secret, gid, salt):
    return hmac.new(secret.encode("utf-8"), ("grant|%s|%s" % (gid, salt)).encode("utf-8"), hashlib.sha256).hexdigest()[:32]


def grant_normalize(body):
    """The owner's request -> (fields, error). Pure."""
    name = body.get("name")
    if not isinstance(name, str) or not name.strip():
        return None, "missing-name"
    name = scrub_text(name.strip(), GRANT_NAME_MAX)
    cams = body.get("cameras", "*")
    if cams == "*" or cams is None:
        cams = "*"
    elif isinstance(cams, list) and cams and all(isinstance(c, str) and CAMERA_ID.match(c) for c in cams):
        cams = sorted(set(cams))
    else:
        return None, "bad-cameras"
    try:
        days = int(body.get("days", 0) or 0)
    except (TypeError, ValueError):
        return None, "bad-days"
    if days < 0 or days > GRANT_DAYS_MAX:
        return None, "bad-days"
    actions = body.get("actions") is True
    return {"name": name, "cameras": cams, "days": days, "actions": actions}, None


def grant_mint(secret, fields, now, path=None):
    gid = hashlib.sha256(os.urandom(16)).hexdigest()[:12]
    salt = hashlib.sha256(os.urandom(16)).hexdigest()[:16]
    rec = {
        "name": fields["name"], "cameras": fields["cameras"], "actions": bool(fields["actions"]),
        "created": int(now), "expires": int(now + fields["days"] * 86400) if fields["days"] else 0,
        "revoked": 0, "last_used": 0, "salt": salt,
    }
    with GRANTS_LOCK:
        doc = grants_load(path)
        doc["grants"][gid] = rec
        grants_save(doc, path)
    return gid, "g.%s.%s" % (gid, grant_sign(secret, gid, salt)), rec


def grant_check(secret, token, now, path=None):
    """A presented grant token -> (gid, record) when it is live, else None.
    Constant-time on the signature; a missing, revoked or expired record is
    refused the same way."""
    if not secret or not isinstance(token, str):
        return None
    m = GRANT_TOKEN.match(token)
    if not m:
        return None
    gid, sig = m.group(1), m.group(2)
    with GRANTS_LOCK:
        doc = grants_load(path)
        rec = doc["grants"].get(gid)
        if not isinstance(rec, dict) or not rec.get("salt"):
            return None
        if not hmac.compare_digest(sig, grant_sign(secret, gid, str(rec["salt"]))):
            return None
        if rec.get("revoked"):
            return None
        if rec.get("expires") and now >= rec["expires"]:
            return None
        if now - float(rec.get("last_used") or 0) >= GRANT_TOUCH_SECONDS:
            rec["last_used"] = int(now)
            try:
                grants_save(doc, path)
            except OSError:
                pass
        return gid, rec


def grant_revoke(gid, now, path=None):
    with GRANTS_LOCK:
        doc = grants_load(path)
        rec = doc["grants"].get(gid)
        if not isinstance(rec, dict):
            return None
        if not rec.get("revoked"):
            rec["revoked"] = int(now)
            grants_save(doc, path)
        return rec


def grant_allows(rec, camera):
    cams = rec.get("cameras", "*")
    return cams == "*" or (isinstance(cams, list) and camera in cams)


def grant_public(gid, rec):
    return {k: rec.get(k) for k in ("name", "cameras", "actions", "created", "expires", "revoked", "last_used")} | {"id": gid} if sys.version_info >= (3, 9) else dict({k: rec.get(k) for k in ("name", "cameras", "actions", "created", "expires", "revoked", "last_used")}, id=gid)


# --- pairing a screen with the owner's phone (DR-0778; Darrell: "I also would
# like to use a qrcode to type into the Firestick"). The screen asks for a
# CODE (no key needed), shows it as a QR and as six letters, and polls with a
# private watch token. The owner's phone opens the QR (or types the code),
# approves it as a grant, and the next poll hands the screen its grant ONCE.
# Pending codes live in memory for PAIR_TTL_SECONDS; nothing is written until
# the owner approves, and then only the grant record (above).
PAIR_TTL_SECONDS = float(os.environ.get("CAMS_PAIR_TTL", "600"))
PAIR_MIN_INTERVAL = float(os.environ.get("CAMS_PAIR_MIN_INTERVAL", "2"))  # new codes per process, at most one per this many seconds
PAIR_MAX_PENDING = 50
PAIR_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # no 0/O/1/I: read off a TV across a room
PAIR_CODE = re.compile(r"^[A-Z2-9]{6}$")
PAIR_LINK_PATH = "/poetech-app/?view=cameras&cams-pair="
PAIR_LOCK = threading.Lock()
PAIRINGS = {}  # code -> {"watch", "created", "expires", "token", "grant"}
PAIR_STATE = {"last": 0.0}


def pair_sweep(now):
    for code in [c for c, p in PAIRINGS.items() if now >= p["expires"]]:
        PAIRINGS.pop(code, None)


def pair_start(now):
    """A new code for a screen -> (code, watch, expires_in) or None when throttled."""
    with PAIR_LOCK:
        pair_sweep(now)
        if now - PAIR_STATE["last"] < PAIR_MIN_INTERVAL or len(PAIRINGS) >= PAIR_MAX_PENDING:
            return None
        PAIR_STATE["last"] = now
        rnd = os.urandom(6)
        code = "".join(PAIR_ALPHABET[b % len(PAIR_ALPHABET)] for b in rnd)
        while code in PAIRINGS:
            code = "".join(PAIR_ALPHABET[b % len(PAIR_ALPHABET)] for b in os.urandom(6))
        watch = hashlib.sha256(os.urandom(16)).hexdigest()[:32]
        PAIRINGS[code] = {"watch": watch, "created": now, "expires": now + PAIR_TTL_SECONDS, "token": None, "grant": None}
        return code, watch, int(PAIR_TTL_SECONDS)


def pair_poll(code, watch, now):
    """The screen's poll -> ("waiting"|"approved"|"expired", token-or-None). An
    approved pairing is handed over ONCE and forgotten."""
    with PAIR_LOCK:
        pair_sweep(now)
        p = PAIRINGS.get(code)
        if not p or not hmac.compare_digest(str(watch or ""), p["watch"]):
            return "expired", None
        if p["token"]:
            PAIRINGS.pop(code, None)
            return "approved", p["token"]
        return "waiting", None


def pair_approve(code, token, grant_public_rec, now):
    """The owner's approval: the grant waits for the screen's next poll."""
    with PAIR_LOCK:
        pair_sweep(now)
        p = PAIRINGS.get(code)
        if not p:
            return False
        if p["token"]:
            return False  # already approved once
        p["token"] = token
        p["grant"] = grant_public_rec
        return True


def pair_pending(now):
    with PAIR_LOCK:
        pair_sweep(now)
        return sorted([{"code": c, "created": int(p["created"]), "expires": int(p["expires"]), "approved": bool(p["token"])} for c, p in PAIRINGS.items()], key=lambda x: x["created"])


def grants_list(path=None):
    doc = grants_load(path)
    out = [grant_public(gid, rec) for gid, rec in doc["grants"].items() if isinstance(rec, dict)]
    out.reverse()  # newest first; the stable sort below keeps that order for equal seconds
    out.sort(key=lambda g: -(g.get("created") or 0))
    return out
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


# =============================================================================
# CLIP DOWNLOADS BY SIZE (DR-0797; Darrell 2026-10-07: "Pushing record only
# records to the nas... not to the cellphone correct... options to download
# based on size and the ability to give smaller to large size files with their
# best resolutions"). Correct: the recorder writes to the NAS only (DR-0775);
# nothing reaches a phone until it asks for a clip. A clip can now be asked for
# in three sizes besides the original, each the BEST picture that fits its
# size: Small is 480p, Medium 720p, Large 1080p (never upscaled: a camera that
# records 1080p gives the same picture for Large and Original, smaller file),
# at a quality setting per tier. The derived file is made ONCE by the ffmpeg
# inside the go2rtc container (the recorder's own, DR-0775), kept under
# <recordings>/.derived/<camera>/, served with Range like the original, and
# pruned by its own budget (oldest first) and when its source clip is gone.
# One transcode at a time (the NAS has other work); a request for a file not
# yet made answers 202 with its place in the line, and the app asks again.
# =============================================================================
DERIVED_DIRNAME = ".derived"
DERIVED_BUDGET_BYTES = int(float(os.environ.get("CAMS_DERIVED_BUDGET_GB", "2")) * 1024 ** 3)
TRANSCODE_TIMEOUT = float(os.environ.get("CAMS_TRANSCODE_TIMEOUT", "900"))
GO2RTC_CONTAINER = os.environ.get("CAMS_GO2RTC_CONTAINER", "poetech-go2rtc")
CONTAINER_RECORDINGS_ROOT = "/recordings"  # the compose bind mount inside the container (DR-0775)
# (size, {height: the tallest picture this tier gives; crf: x264 quality, lower is finer; bps: the rate the estimate uses})
CLIP_SIZES = (
    ("small", {"height": 480, "crf": 30, "bps": 600000, "label": "Small (480p)"}),
    ("medium", {"height": 720, "crf": 26, "bps": 1500000, "label": "Medium (720p)"}),
    ("large", {"height": 1080, "crf": 23, "bps": 3000000, "label": "Large (1080p)"}),
    # Darrell 2026-10-07: "4k for those types if possible so 2k or 3k... larger size options too".
    # Never upscaled: these tiers give more only for a camera that records that large.
    ("xlarge", {"height": 1440, "crf": 21, "bps": 6000000, "label": "Extra large (1440p / 2.5K)"}),
    ("uhd", {"height": 2160, "crf": 20, "bps": 12000000, "label": "Ultra (2160p / 4K)"}),
)
CLIP_SIZE_MAP = dict(CLIP_SIZES)
CLIP_STEM = re.compile(r"^(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})\.mp4$")


def find_docker():
    """The docker binary on this box, else None (then ffmpeg must be on PATH)."""
    import shutil as _shutil
    for cand in ("docker", "/usr/local/bin/docker", "/var/packages/ContainerManager/target/usr/bin/docker"):
        found = _shutil.which(cand) if os.sep not in cand else (cand if os.path.isfile(cand) and os.access(cand, os.X_OK) else None)
        if found:
            return found
    return None


def derived_name(clip, size):
    m = CLIP_STEM.match(clip)
    if not m or size not in CLIP_SIZE_MAP:
        return None
    return "%s.%s.mp4" % (m.group(1), size)


def derived_path(root, cam, clip, size):
    """<root>/.derived/<cam>/<stem>.<size>.mp4 -- None when any part fails its grammar."""
    name = derived_name(clip, size)
    if not name or not CAMERA_ID.match(cam):
        return None
    return os.path.join(root, DERIVED_DIRNAME, cam, name)


def download_name(cam, clip, size=None):
    """The file name a phone saves: <camera>-<time>-<size>.mp4."""
    m = CLIP_STEM.match(clip)
    stem = m.group(1) if m else clip.replace(".mp4", "")
    return "%s-%s-%s.mp4" % (cam, stem, size if size in CLIP_SIZE_MAP else "original")


def estimate_sizes(clip_bytes, seconds):
    """About how big each tier will be: the tier's rate for the clip's length, never more than the original."""
    out = {}
    for size, spec in CLIP_SIZES:
        est = int(max(1.0, float(seconds or 0)) * spec["bps"] / 8)
        out[size] = min(int(clip_bytes or 0), est) if clip_bytes else est
    return out


def clip_seconds(clips, i, now=None, segment=None):
    """How long clip i runs: to the next clip's start, or (the newest) to now, within the segment length."""
    seg = int(segment or REC_SEGMENT_SECONDS or 600)
    try:
        start = int(clips[i]["start"])
    except (IndexError, KeyError, TypeError, ValueError):
        return seg
    if i + 1 < len(clips):
        end = int(clips[i + 1].get("start") or (start + seg))
    else:
        end = int(now if now is not None else time.time())
    return max(1, min(seg, end - start))


def transcode_argv(cam, clip, size, docker=None, container=GO2RTC_CONTAINER, container_root=CONTAINER_RECORDINGS_ROOT, host_root=None):
    """The one ffmpeg command for a tier: scale to the tier's height (never up),
    x264 at the tier's quality, AAC audio, faststart so a phone plays it as it
    arrives, written to a .part the worker renames into place when ffmpeg says 0."""
    spec = CLIP_SIZE_MAP[size]
    name = derived_name(clip, size)
    if docker:
        src = "%s/%s/%s" % (container_root, cam, clip)
        dst = "%s/%s/%s/%s.part" % (container_root, DERIVED_DIRNAME, cam, name)
        head = [docker, "exec", "-i", container, "ffmpeg"]
    else:
        root = host_root or RECORDINGS_ROOT
        src = os.path.join(root, cam, clip)
        dst = os.path.join(root, DERIVED_DIRNAME, cam, name + ".part")
        head = ["ffmpeg"]
    return head + ["-nostdin", "-hide_banner", "-loglevel", "error", "-y", "-i", src,
                   "-vf", "scale=-2:'min(%d,ih)'" % spec["height"],
                   "-c:v", "libx264", "-preset", "veryfast", "-crf", str(spec["crf"]), "-pix_fmt", "yuv420p",
                   "-c:a", "aac", "-b:a", "64k", "-movflags", "+faststart", "-f", "mp4", dst]


class DerivedStore:
    """The derived clips: one worker, a line, a budget. `runner(argv)` runs
    ffmpeg and answers (returncode, stderr_text); the selftest injects one."""

    def __init__(self, root, runner=None, budget=DERIVED_BUDGET_BYTES, docker=None, now=time.time, log=print):
        self.root = root
        self.runner = runner or self._run
        self.budget = int(budget)
        self.docker = docker
        self.now = now
        self.log = log
        self.lock = threading.Lock()
        self.queue = []       # [(cam, clip, size)] in order
        self.current = None   # the one being made
        self.failed = {}      # key -> error text
        self.worker = None

    @staticmethod
    def key(cam, clip, size):
        return "%s/%s/%s" % (cam, clip, size)

    def path(self, cam, clip, size):
        return derived_path(self.root, cam, clip, size)

    def status(self, cam, clip, size):
        """('ready', path) | ('making', None) | ('queued', position) | ('failed', error) | ('absent', None)."""
        path = self.path(cam, clip, size)
        if path and os.path.isfile(path):
            return ("ready", path)
        k = self.key(cam, clip, size)
        with self.lock:
            if self.current == k:
                return ("making", None)
            for i, item in enumerate(self.queue):
                if self.key(*item) == k:
                    return ("queued", i + 1)
            if k in self.failed:
                return ("failed", self.failed[k])
        return ("absent", None)

    def ask(self, cam, clip, size, retry=False):
        """Have the tier made if it is not; answers status() afterwards. A tier
        that failed stays failed (the app shows ffmpeg's words) until asked
        again with retry=True."""
        st = self.status(cam, clip, size)
        if st[0] in ("ready", "making", "queued") or (st[0] == "failed" and not retry):
            return st
        if not os.path.isfile(os.path.join(self.root, cam, clip)):
            return ("no-source", None)
        k = self.key(cam, clip, size)
        with self.lock:
            self.failed.pop(k, None)
            self.queue.append((cam, clip, size))
            pos = len(self.queue)
            # The worker gives itself up under this same lock when the line is
            # empty, so a job appended here is never stranded behind a worker
            # that was about to leave.
            if self.worker is None:
                self.worker = threading.Thread(target=self._work, name="cams-derive", daemon=True)
                self.worker.start()
        return ("queued", pos)

    def _run(self, argv):
        try:
            r = subprocess.run(argv, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, timeout=TRANSCODE_TIMEOUT)
            return r.returncode, (r.stderr or b"").decode("utf-8", "replace")
        except subprocess.TimeoutExpired:
            return 124, "ffmpeg took longer than %d s" % int(TRANSCODE_TIMEOUT)
        except OSError as e:
            return 127, str(e)

    def _work(self):
        while True:
            with self.lock:
                if not self.queue:
                    self.current = None
                    self.worker = None
                    return
                cam, clip, size = self.queue.pop(0)
                k = self.key(cam, clip, size)
                self.current = k
            final = self.path(cam, clip, size)
            part = final + ".part"
            try:
                os.makedirs(os.path.dirname(final), exist_ok=True)
                argv = transcode_argv(cam, clip, size, docker=self.docker, host_root=self.root)
                rc, err = self.runner(argv)
                ok = rc == 0 and os.path.isfile(part) and os.path.getsize(part) > 0
                if ok:
                    os.replace(part, final)
                else:
                    with self.lock:
                        self.failed[k] = scrub_text(err or ("ffmpeg exit %s" % rc), 300) or ("ffmpeg exit %s" % rc)
                    try:
                        os.remove(part)
                    except OSError:
                        pass
            except Exception as e:  # noqa: BLE001 -- one bad clip never stops the line
                with self.lock:
                    self.failed[k] = scrub_text(e, 300)
            try:
                self.prune()
            except Exception as e:  # noqa: BLE001
                self.log("derived prune: %s" % e)

    def files(self):
        """[(path, bytes, mtime, cam, source_clip)] of every derived file."""
        out = []
        base = os.path.join(self.root, DERIVED_DIRNAME)
        try:
            cams = os.listdir(base)
        except OSError:
            return out
        for cam in cams:
            d = os.path.join(base, cam)
            try:
                names = os.listdir(d)
            except OSError:
                continue
            for n in names:
                p = os.path.join(d, n)
                try:
                    st = os.stat(p)
                except OSError:
                    continue
                stem = n.split(".")[0]
                out.append((p, st.st_size, st.st_mtime, cam, stem + ".mp4"))
        return out

    def prune(self):
        """Orphans (their source clip is gone) and stale .part files go first; then the oldest until under budget."""
        removed = 0
        files = self.files()
        keep = []
        for p, size, mtime, cam, src in files:
            stale_part = p.endswith(".part") and self.now() - mtime > 2 * TRANSCODE_TIMEOUT
            orphan = not os.path.isfile(os.path.join(self.root, cam, src))
            if stale_part or (orphan and not p.endswith(".part")):
                try:
                    os.remove(p)
                    removed += 1
                except OSError:
                    pass
            else:
                keep.append((p, size, mtime))
        total = sum(k[1] for k in keep)
        for p, size, _m in sorted(keep, key=lambda k: k[2]):
            if total <= self.budget:
                break
            if p.endswith(".part"):
                continue
            try:
                os.remove(p)
                total -= size
                removed += 1
            except OSError:
                pass
        return removed

    def snapshot(self):
        files = [f for f in self.files() if not f[0].endswith(".part")]
        with self.lock:
            return {"budget_bytes": self.budget, "bytes": sum(f[1] for f in files), "files": len(files),
                    "queue": len(self.queue), "making": self.current, "failed": len(self.failed),
                    "sizes": [[k, v["label"], v["height"]] for k, v in CLIP_SIZES]}


# =============================================================================
# THE STREAM HEALTH LOG (DR-0798; Darrell 2026-10-07: "Are there some type of
# logs we can use to make the cameras stream more continuous? ... based on the
# information cameras provided can we make sure we optimize the videos
# streams"). go2rtc knows, for every stream, how many bytes each producer has
# received, whether a producer is connected, how many consumers watch, and
# which codecs the camera sends (its `medias`). Nobody wrote it down over
# time. This sampler reads GET /api/streams every STREAM_SAMPLE_SECONDS and
# keeps, per camera, the last hour: bits per second (byte deltas), whether the
# picture was flowing while someone watched, and every DROP -- a producer gone,
# bytes frozen, or a producer restarted (its counter back to 0) while it had a
# watcher. A camera nobody watches is let go by go2rtc on purpose; that is not
# a drop and is not counted. The codecs decide one optimization at once: a
# camera that sends ONLY H.265 gets an H.264 twin (`ffmpeg:<id>#video=h264`,
# transcoded by go2rtc's own ffmpeg only while watched), and the app plays the
# twin on a device whose <video> cannot decode H.265. GET /streams/health
# serves the log to the app; a summary rides /health and a file for cams-diag.
# =============================================================================
STREAM_SAMPLE_SECONDS = float(os.environ.get("CAMS_STREAM_SAMPLE_SECONDS", "15"))
STREAM_HISTORY_SECONDS = 3600.0
STREAM_HEALTH_FILE = os.environ.get("CAMS_STREAM_HEALTH_FILE", os.path.join(os.path.dirname(GO2RTC_YAML_PATH), "stream-health.json"))
H264_TWINS = os.environ.get("CAMS_H264_TWINS", "1") != "0"
TWIN_SUFFIX = "_h264"
# THE SD TWIN (DR-0799; Darrell 2026-10-07, the Firestick window: "Cameras in
# the window don't stay live... the seconds timers show they are not live").
# A Wyze camera has its own substream (go2rtc's wyze source: subtype=sd). Every
# Wyze camera gets `<id>_sd`, the same source URL with subtype=sd, and the app
# opens the SD twin for a tile in a grid and the HD stream for the one made
# largest -- so a Firestick carries several cameras instead of freezing on two.
SD_SUFFIX = "_sd"
SD_TWINS = os.environ.get("CAMS_SD_TWINS", "1") != "0"
TWIN_SUFFIXES = (TWIN_SUFFIX, SD_SUFFIX)
CODEC_RE = re.compile(r"\b(H264|H265|HEVC|AAC|PCMU|PCMA|PCML|PCM|OPUS|MJPEG|JPEG|AV1|VP8|VP9|FLAC|MP3)\b", re.I)


def is_twin(stream_id):
    return any(str(stream_id or "").endswith(sfx) for sfx in TWIN_SUFFIXES)


def base_of(stream_id):
    """The camera a twin belongs to (itself when it is not a twin)."""
    sid = str(stream_id or "")
    for sfx in TWIN_SUFFIXES:
        if sid.endswith(sfx) and len(sid) > len(sfx):
            return sid[:-len(sfx)]
    return sid


def twin_of(stream_id):
    return "%s%s" % (stream_id, TWIN_SUFFIX)


def sd_of(stream_id):
    return "%s%s" % (stream_id, SD_SUFFIX)


def sd_source(url):
    """The same wyze:// source with subtype=sd (replacing subtype=hd when it is there); None for any other kind."""
    if kind_of(url) != "wyze":
        return None
    base, _, frag = str(url).partition("#")
    if re.search(r"(?i)[?&]subtype=", base):
        base = re.sub(r"(?i)([?&]subtype=)[^&]*", r"\1sd", base)
    else:
        base += ("&" if "?" in base else "?") + "subtype=sd"
    return base + (("#" + frag) if frag else "")


def ensure_sd_twins(upstream, streams, log=print, config_path=None):
    """Every Wyze camera gets `<id>_sd` (its own substream) in go2rtc: PUT, or the config when go2rtc refuses. Answers the names added."""
    added = []
    if not isinstance(streams, dict):
        return added
    ids = set(streams.keys())
    for sid, entry in streams.items():
        if not CAMERA_ID.match(str(sid)) or is_twin(sid) or sd_of(sid) in ids or not isinstance(entry, dict):
            continue
        url = None
        for p in entry.get("producers") or []:
            if isinstance(p, dict) and p.get("url"):
                url = p.get("url")
                break
        src = sd_source(url) if url else None
        if not src:
            continue
        name = sd_of(sid)
        q = urllib.parse.urlencode({"name": name, "src": src})
        try:
            req = urllib.request.Request(upstream.rstrip("/") + "/api/streams?" + q, method="PUT")
            with urllib.request.urlopen(req, timeout=HEALTH_TIMEOUT) as r:
                r.read(4096)
            added.append(name)
            log("stream-health: added %s, the camera's own SD substream, for tiles in a grid" % name)
        except urllib.error.HTTPError as e:
            if write_stream_entry(config_path or GO2RTC_YAML_PATH, name, src):
                added.append(name)
                log("stream-health: go2rtc refused PUT %s (HTTP %d); wrote it to the config directly (DR-0789)" % (name, e.code))
            else:
                log("stream-health: could not add %s (HTTP %d)" % (name, e.code))
        except (urllib.error.URLError, OSError):
            log("stream-health: go2rtc unreachable while adding %s" % name)
    return added


def twin_source(stream_id):
    return "ffmpeg:%s#video=h264" % stream_id


def codecs_of(entry):
    """The codec names in a stream's producer medias ("video, recvonly, H264 ..."), HEVC read as H265."""
    out = set()
    producers = entry.get("producers") if isinstance(entry, dict) else None
    for p in producers or []:
        medias = p.get("medias") if isinstance(p, dict) else None
        for m in medias or []:
            for c in CODEC_RE.findall(str(m)):
                c = c.upper()
                out.add("H265" if c == "HEVC" else c)
    return sorted(out)


def producer_bytes(entry):
    n = 0
    producers = entry.get("producers") if isinstance(entry, dict) else None
    for p in producers or []:
        if isinstance(p, dict):
            try:
                n += int(p.get("bytes_recv") or p.get("recv") or 0)
            except (TypeError, ValueError):
                pass
    return n


class StreamHealth:
    """The last hour of every stream, from go2rtc's own numbers. Pure on the
    inside (the clock is injectable) so it is proven in plain Python."""

    def __init__(self, now=time.time, history=STREAM_HISTORY_SECONDS, interval=STREAM_SAMPLE_SECONDS):
        self.now = now
        self.history = float(history)
        self.interval = float(interval)
        self.lock = threading.Lock()
        self.cams = {}
        self.events = []
        self.stream_ids = set()
        self.last_sample_at = None

    def observe(self, streams, t=None):
        t = float(t if t is not None else self.now())
        if not isinstance(streams, dict):
            return
        with self.lock:
            self.stream_ids = set(k for k in streams.keys() if CAMERA_ID.match(str(k)))
            for sid, entry in streams.items():
                if not CAMERA_ID.match(str(sid)) or not isinstance(entry, dict):
                    continue
                c = self.cams.setdefault(sid, {"samples": [], "codecs": set(), "drops": [], "restarts": 0, "first": t, "last_seen": None})
                producers = entry.get("producers") or []
                present = bool(producers)
                b = producer_bytes(entry)
                watchers = len(entry.get("consumers") or []) if isinstance(entry.get("consumers"), list) else 0
                c["codecs"].update(codecs_of(entry))
                last = c["samples"][-1] if c["samples"] else None
                kind = None
                if last is not None and last["watchers"] > 0:
                    if not present:
                        kind = "producer-gone"
                    elif b == last["bytes"]:
                        kind = "bytes-frozen"
                    elif b < last["bytes"]:
                        kind = "producer-restarted"
                        c["restarts"] += 1
                if kind:
                    c["drops"].append((t, kind))
                    self.events.append({"at": t, "camera": sid, "kind": kind})
                    del self.events[:-100]
                kbps = None
                if last is not None and present:
                    dt = t - last["t"]
                    delta = (b - last["bytes"]) if b >= last["bytes"] else b
                    if dt > 0 and delta >= 0:
                        kbps = int(round(delta * 8.0 / dt / 1000.0))
                healthy = present and (last is None or b != last["bytes"])
                c["samples"].append({"t": t, "bytes": b, "present": present, "watchers": watchers, "healthy": healthy, "kbps": kbps, "watched": bool(last is not None and last["watchers"] > 0)})
                if present:
                    c["last_seen"] = t
                cutoff = t - self.history
                c["samples"] = [x for x in c["samples"] if x["t"] >= cutoff]
                c["drops"] = [x for x in c["drops"] if x[0] >= cutoff]
            self.last_sample_at = t

    def camera(self, sid):
        c = self.cams.get(sid)
        if not c:
            return None
        samples = c["samples"]
        last = samples[-1] if samples else None
        # A sample counts as WATCHED when someone held the stream across the interval it closes.
        watched = [x for x in samples if x.get("watched")]
        healthy = [x for x in watched if x["healthy"]]
        rates = [x["kbps"] for x in healthy if x["kbps"] is not None]
        recent = rates[-1] if rates else None
        codecs = sorted(c["codecs"])
        return {
            "present": bool(last and last["present"]),
            "watchers": int(last["watchers"]) if last else 0,
            "kbps": recent,
            "kbps_avg": int(round(sum(rates) / float(len(rates)))) if rates else None,
            "watched_samples": len(watched),
            "up_pct": int(round(100.0 * len(healthy) / len(watched))) if watched else None,
            "drops_1h": len(c["drops"]),
            "drop_kinds": sorted(set(k for _t, k in c["drops"])),
            "restarts": int(c["restarts"]),
            "codecs": codecs,
            "hevc_only": ("H265" in codecs) and ("H264" not in codecs),
            "last_seen": c["last_seen"],
            "twin": twin_of(sid) if twin_of(sid) in self.stream_ids else None,
            "sd": sd_of(sid) if sd_of(sid) in self.stream_ids else None,
        }

    def summary(self):
        with self.lock:
            cams = dict((sid, self.camera(sid)) for sid in self.cams if not is_twin(sid))
            return {"sampled_at": self.last_sample_at, "interval_s": self.interval, "history_s": self.history,
                    "cameras": cams, "events": list(self.events[-50:]),
                    "drops_1h_total": sum((v or {}).get("drops_1h", 0) for v in cams.values())}

    def snapshot(self):
        with self.lock:
            drops = sum(len(c["drops"]) for c in self.cams.values())
            return {"interval_s": self.interval, "last_sample_at": self.last_sample_at, "cameras": len([k for k in self.cams if not is_twin(k)]), "drops_1h": drops}


STREAM_HEALTH = StreamHealth()


def write_stream_entry(config_path, name, url):
    """One stream line into go2rtc.yaml directly (the DR-0789 road for a PUT go2rtc refuses)."""
    try:
        with open(config_path, "r", encoding="utf-8") as fh:
            text = fh.read()
    except OSError:
        return False
    if name in config_stream_names(text):
        return True
    new = write_streams_block(text, [(name, url)])
    if new is None:
        return False
    write_config_atomically(config_path, new)
    return True


def ensure_h264_twins(upstream, stream_ids, summary, log=print, config_path=None):
    """Every camera that sends ONLY H.265 gets `<id>_h264: ffmpeg:<id>#video=h264`
    in go2rtc (PUT, or the config file when go2rtc refuses). Answers the names added."""
    added = []
    ids = set(stream_ids or [])
    for sid, c in (summary.get("cameras") or {}).items():
        if not c or not c.get("hevc_only") or is_twin(sid) or twin_of(sid) in ids:
            continue
        name, url = twin_of(sid), twin_source(sid)
        q = urllib.parse.urlencode({"name": name, "src": url})
        try:
            req = urllib.request.Request(upstream.rstrip("/") + "/api/streams?" + q, method="PUT")
            with urllib.request.urlopen(req, timeout=HEALTH_TIMEOUT) as r:
                r.read(4096)
            added.append(name)
            log("stream-health: %s sends only H.265; added %s so a device without an H.265 decoder can watch" % (sid, name))
        except urllib.error.HTTPError as e:
            if write_stream_entry(config_path or GO2RTC_YAML_PATH, name, url):
                added.append(name)
                log("stream-health: go2rtc refused PUT %s (HTTP %d); wrote it to the config directly (DR-0789)" % (name, e.code))
            else:
                log("stream-health: could not add %s (HTTP %d, and the config could not be written)" % (name, e.code))
        except (urllib.error.URLError, OSError):
            log("stream-health: go2rtc unreachable while adding %s" % name)
    return added


def write_health_file(path, summary):
    try:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        tmp = path + ".tmp"
        with open(tmp, "w", encoding="utf-8") as fh:
            json.dump(summary, fh)
        os.replace(tmp, path)
        return True
    except (OSError, TypeError, ValueError):
        return False


def sample_streams_once(upstream, health=None, log=print, health_file=None, twins=None, config_path=None):
    """One sample: read go2rtc's streams, remember them, write the file, add twins where the codecs say so."""
    health = health or STREAM_HEALTH
    twins = H264_TWINS if twins is None else twins
    try:
        with urllib.request.urlopen(upstream.rstrip("/") + "/api/streams", timeout=HEALTH_TIMEOUT) as r:
            streams = json.loads(r.read(4 * 1024 * 1024).decode("utf-8"))
    except (urllib.error.URLError, OSError, ValueError):
        return "unreachable"
    if not isinstance(streams, dict):
        return "bad-answer"
    health.observe(streams)
    summary = health.summary()
    if health_file:
        write_health_file(health_file, summary)
    if twins:
        ensure_h264_twins(upstream, streams.keys(), summary, log=log, config_path=config_path)
        if SD_TWINS:
            ensure_sd_twins(upstream, streams, log=log, config_path=config_path)
    return "sampled"


def start_stream_sampler(upstream, every=None, health=None, health_file=None):
    every = STREAM_SAMPLE_SECONDS if every is None else every
    health = health or STREAM_HEALTH
    health_file = STREAM_HEALTH_FILE if health_file is None else health_file

    def run():
        while True:
            try:
                sample_streams_once(upstream, health=health, health_file=health_file)
            except Exception as e:  # noqa: BLE001 -- the loop outlives any one surprise
                print("stream-health: %s" % e, file=sys.stderr)
            time.sleep(every)

    t = threading.Thread(target=run, name="cams-stream-health", daemon=True)
    t.start()
    return t


# =============================================================================
# ANY CAMERA, FROM THE APP, TESTED ON THE SPOT (DR-0803; Darrell 2026-10-07:
# "Build the other options... so I can set up rstp... and all other options
# so I can verify they work!!!!!!!!", "Ring... etc... all pathways for our
# home cameras... Even Google login options"). The Setup tab used to say
# "one line in go2rtc.yaml by hand" for every system but Wyze. Now the app
# builds the source line (RTSP/RTMP, ONVIF, HTTP/MJPEG, any URL go2rtc
# speaks), the NAS registers it in go2rtc and in the config (DR-0787/0789),
# probes ONE frame and answers with the result, so the person sees "works"
# or go2rtc's own reason before leaving the form. Ring signs in through
# go2rtc's own /api/ring (email, password, the 2FA code it asks for) and
# every camera it lists is registered. A GOOGLE SIGN-IN (Darrell: "Even
# Google login options so passwords work using Google") is not a road the
# camera makers' APIs offer: Wyze and Ring take their own email + password
# (+ a 2FA code); an account created through Google must have a password set
# once in that maker's own app, and then this sign-in works. Nest/Google Home
# cameras (go2rtc's nest: source) are not built here: nobody in the house has
# one to verify against (DR-0076). Credentials ride to go2rtc only; they are
# never logged and never answered back.
# =============================================================================
STREAM_SCHEMES = ("rtsp", "rtsps", "rtmp", "rtmps", "onvif", "http", "https", "ring", "nest", "wyze", "homekit", "hass", "dvrip", "tapo", "kasa", "isapi", "gopro", "roborock", "webrtc", "webtorrent", "ivideon", "bubble", "expr")
FORBIDDEN_SOURCE = re.compile(r"(?i)^(exec|ffmpeg|echo):|#raw=|#exec")


def source_check(url):
    """Is this a source line go2rtc may be handed from the app? Answers (ok, reason)."""
    u = str(url or "").strip()
    if not u or len(u) > 2048:
        return False, "empty-or-long"
    if FORBIDDEN_SOURCE.search(u):
        return False, "scheme-not-allowed"
    scheme = u.split(":", 1)[0].lower()
    if scheme not in STREAM_SCHEMES:
        return False, "scheme-not-allowed"
    if "\n" in u or "\r" in u:
        return False, "bad-characters"
    return True, ""


def remove_stream_entry(config_path, name):
    """Take one stream's line (and its indented continuation) out of go2rtc.yaml's streams block, every other byte kept."""
    try:
        with open(config_path, "r", encoding="utf-8") as fh:
            lines = fh.read().split("\n")
    except OSError:
        return False
    out = []
    i = 0
    removed = False
    in_streams = False
    while i < len(lines):
        line = lines[i]
        if re.match(r"^streams:", line):
            in_streams = True
            out.append(line)
            i += 1
            continue
        if in_streams and line and not line[0] in " \t" and not line.lstrip().startswith("#"):
            in_streams = False
        if in_streams and re.match(r"^\s{2}%s:" % re.escape(name), line):
            removed = True
            i += 1
            while i < len(lines) and (lines[i].startswith("    ") or lines[i].startswith("\t\t")):
                i += 1
            continue
        out.append(line)
        i += 1
    if removed:
        write_config_atomically(config_path, "\n".join(out))
    return removed


# --- The handler -------------------------------------------------------------
def make_handler(upstream, token, max_live=MAX_LIVE, live_max_seconds=LIVE_MAX_SECONDS,
                 max_snap=MAX_SNAP_INFLIGHT, snap_timeout=SNAP_TIMEOUT, segment_timeout=SEGMENT_TIMEOUT,
                 exit_fn=None, now_fn=time.time, recording_config=None, recording_status=None, recordings_root=None,
                 wyze_factory=None, wyze_persist=None, wyze_creds=None, grants_path=None,
                 derived_store=None, stream_health=None):
    upstream = upstream.rstrip("/")
    grants_path = grants_path or GRANTS_FILE
    stream_health = stream_health or STREAM_HEALTH
    wyze_factory = wyze_factory or wyze_client_default
    # The kept sign-in, for /setup/wyze/again and the self-heal.
    wyze_creds = wyze_creds or (lambda: (_wyze.load_credentials() if _wyze else None))
    # After a sign-in go2rtc accepts, the four values are written root-only so
    # the cloud client (and a future adapter) has them without a second typing.
    wyze_persist = wyze_persist or (lambda fields: (_wyze.write_env_file(fields) if _wyze else False))
    recording_config = recording_config or RECORDING_CONFIG
    recording_status = recording_status or RECORDING_STATUS
    recordings_root = recordings_root or RECORDINGS_ROOT
    # The derived clips (DR-0797): made by the container's ffmpeg when docker is here, else a PATH ffmpeg.
    derived_store = derived_store or DerivedStore(recordings_root, docker=find_docker())
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

        # -- who is asking (DR-0778) --------------------------------------
        def _grant(self):
            """The live grant record behind a `Bearer g.<id>.<mac>` header, or None."""
            if hasattr(self, "_grant_cache"):
                return self._grant_cache
            hv = self.headers.get("Authorization") or ""
            parts = hv.split(None, 1)
            tok = parts[1].strip() if len(parts) == 2 and parts[0].lower() == "bearer" else ""
            self._grant_cache = grant_check(token, tok, now_fn(), grants_path) if tok.startswith("g.") else None
            return self._grant_cache

        def _viewer(self):
            """('owner', None) for the family bearer; ('grant', record) for a live grant; None."""
            if self._authed():
                return ("owner", None)
            g = self._grant()
            if g:
                return ("grant", g[1])
            return None

        def _may_see(self, camera):
            """Owner: every camera. Grant: its cameras. None: nobody."""
            v = self._viewer()
            if not v:
                return False
            return v[0] == "owner" or grant_allows(v[1], camera)

        def _may_act(self):
            v = self._viewer()
            return bool(v) and (v[0] == "owner" or v[1].get("actions") is True)

        # -- routes ---------------------------------------------------------
        def do_GET(self):
            raw_path, _, query = self.path.partition("?")
            path = strip_prefix(raw_path)

            if path == "/health":
                return self._health()
            if path == "/list":
                v = self._viewer()
                if not v:
                    return self._json(401, {"error": "unauthorized"})
                return self._list(v[1])

            if path == "/devices":
                if not self._viewer():
                    return self._json(401, {"error": "unauthorized"})
                if not self._may_act():
                    return self._json(403, {"error": "no-actions", "detail": "this access does not include the doors"})
                return self._devices(self._viewer()[1])

            if path == "/grants":
                if not self._authed():
                    return self._json(401, {"error": "unauthorized"})
                return self._json(200, {"grants": grants_list(grants_path), "link_path": GRANT_LINK_PATH})

            if path == "/pair":
                if not self._authed():
                    return self._json(401, {"error": "unauthorized"})
                return self._json(200, {"pending": pair_pending(now_fn()), "link_path": PAIR_LINK_PATH})

            pm = re.match(r"^/pair/([A-Z2-9]{6})$", path)
            if pm:
                w = urllib.parse.parse_qs(query).get("w", [""])[0]
                status, tok = pair_poll(pm.group(1), w, now_fn())
                out = {"status": status}
                if tok:
                    out["token"] = tok
                return self._json(200 if status != "expired" else 404, out)

            if path == "/recording":
                if not self._authed():
                    return self._json(401, {"error": "unauthorized"})
                return self._recording_get()
            if path == "/streams/health":
                return self._streams_health()

            m = re.match(r"^/rec/([^/]+)$", path)
            if m:
                cam = m.group(1)
                if not CAMERA_ID.match(cam):
                    return self._json(400, {"error": "bad-camera-id"})
                if not self._authed():
                    return self._json(401, {"error": "unauthorized"})
                return self._rec_list(cam)

            m = re.match(r"^/rec/([^/]+)/([^/]+)$", path)
            if m:
                cam, clip = m.group(1), m.group(2)
                if not CAMERA_ID.match(cam):
                    return self._json(400, {"error": "bad-camera-id"})
                if not CLIP_NAME.match(clip):
                    return self._json(404, {"error": "not-found"})
                if not (self._authed() or self._ticketed(cam, query)):
                    return self._json(401, {"error": "unauthorized"})
                return self._rec_clip(cam, clip, query)

            m = re.match(r"^/streams/([^/]+)/test$", path)
            if m:
                cam = m.group(1)
                if not CAMERA_ID.match(cam):
                    return self._json(400, {"error": "bad-camera-id"})
                if not self._viewer():
                    return self._json(401, {"error": "unauthorized"})
                return self._json(200, {"id": cam, "probe": self._probe(cam)})
            m = re.match(r"^/why/([^/]+)$", path)
            if m:
                cam = m.group(1)
                if not CAMERA_ID.match(cam):
                    return self._json(400, {"error": "bad-camera-id"})
                if not self._viewer():
                    return self._json(401, {"error": "unauthorized"})
                if not self._may_see(cam):
                    return self._json(403, {"error": "not-your-camera"})
                return self._why(cam)

            m = re.match(r"^/snap/([^/]+)\.jpg$", path)
            if m:
                cam = m.group(1)
                if not CAMERA_ID.match(cam):
                    return self._json(400, {"error": "bad-camera-id"})
                if not (self._may_see(cam) or self._ticketed(cam, query)):
                    return self._json(401 if not self._viewer() else 403, {"error": "unauthorized" if not self._viewer() else "not-your-camera"})
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

        def do_PUT(self):
            raw_path, _, _query = self.path.partition("?")
            path = strip_prefix(raw_path)
            if path != "/recording":
                return self._json(404, {"error": "not-found"})
            if not self._authed():
                return self._json(401, {"error": "unauthorized"})
            try:
                length = int(self.headers.get("Content-Length") or 0)
            except ValueError:
                length = 0
            if length <= 0 or length > 64 * 1024:
                return self._json(400, {"error": "body-required"})
            try:
                body = json.loads(self.rfile.read(length).decode("utf-8"))
            except (ValueError, UnicodeDecodeError):
                return self._json(400, {"error": "bad-json"})
            return self._recording_put(body if isinstance(body, dict) else {})

        def do_POST(self):
            raw_path, _, _query = self.path.partition("?")
            path = strip_prefix(raw_path)
            if path == "/pair":
                # The screen asks for a code. No key needed: the code opens nothing
                # until the owner approves it, and it dies in PAIR_TTL_SECONDS.
                started = pair_start(now_fn())
                if not started:
                    return self._json(429, {"error": "pair-too-soon", "retry_in": int(PAIR_MIN_INTERVAL) + 1})
                code, watch, ttl = started
                return self._json(200, {"code": code, "watch": watch, "expires_in": ttl, "link_path": PAIR_LINK_PATH})
            pam = re.match(r"^/pair/([A-Z2-9]{6})/approve$", path)
            if pam:
                if not self._authed():
                    return self._json(401, {"error": "unauthorized"})
                try:
                    length = int(self.headers.get("Content-Length") or 0)
                except ValueError:
                    length = 0
                body = {}
                if 0 < length <= MAX_BODY:
                    try:
                        body = json.loads(self.rfile.read(length).decode("utf-8"))
                    except (ValueError, UnicodeDecodeError):
                        return self._json(400, {"error": "bad-json"})
                if not isinstance(body, dict):
                    body = {}
                body.setdefault("name", "A screen (%s)" % pam.group(1))
                fields, err = grant_normalize(body)
                if err:
                    return self._json(400, {"error": err})
                with PAIR_LOCK:
                    pending = pam.group(1) in PAIRINGS and not PAIRINGS[pam.group(1)]["token"] and now_fn() < PAIRINGS[pam.group(1)]["expires"]
                if not pending:
                    return self._json(404, {"error": "no-such-code", "detail": "the code expired, was already used, or was never shown; ask the screen for a new one"})
                gid, tok, rec = grant_mint(token, fields, now_fn(), grants_path)
                if not pair_approve(pam.group(1), tok, grant_public(gid, rec), now_fn()):
                    grant_revoke(gid, now_fn(), grants_path)
                    return self._json(404, {"error": "no-such-code"})
                return self._json(200, {"ok": True, "grant": grant_public(gid, rec)})
            gm = re.match(r"^/grants/([a-f0-9]{12})/revoke$", path)
            if gm:
                if not self._authed():
                    return self._json(401, {"error": "unauthorized"})
                rec = grant_revoke(gm.group(1), now_fn(), grants_path)
                if rec is None:
                    return self._json(404, {"error": "not-found"})
                return self._json(200, {"ok": True, "grant": grant_public(gm.group(1), rec)})
            if path not in ("/ticket", "/setup/wyze", "/setup/wyze/again", "/restart", "/action", "/grants", "/streams", "/setup/ring"):
                return self._json(404, {"error": "not-found"})
            # The owner's roads (the family bearer) and the roads a grant may
            # also take (/ticket for its cameras, /action when it includes the
            # doors). Everything that changes the NAS stays the owner's.
            if path in ("/ticket", "/action"):
                if not self._viewer():
                    return self._json(401, {"error": "unauthorized"})
            elif not self._authed():
                return self._json(401, {"error": "unauthorized"})
            if path == "/restart":
                return self._restart()
            if path == "/setup/wyze/again":
                return self._setup_wyze_again()
            try:
                length = int(self.headers.get("Content-Length") or 0)
            except ValueError:
                length = 0
            if length <= 0 or length > (SETUP_MAX_BODY if path in ("/setup/wyze", "/setup/ring", "/streams") else MAX_BODY):
                return self._json(400, {"error": "body-required"})
            try:
                body = json.loads(self.rfile.read(length).decode("utf-8"))
            except (ValueError, UnicodeDecodeError):
                return self._json(400, {"error": "bad-json"})
            if path == "/setup/wyze":
                return self._setup_wyze(body if isinstance(body, dict) else {})
            if path == "/streams":
                return self._stream_add(body if isinstance(body, dict) else {})
            if path == "/setup/ring":
                return self._setup_ring(body if isinstance(body, dict) else {})
            if path == "/grants":
                return self._grant_make(body if isinstance(body, dict) else {})
            if path == "/action":
                if not self._may_act():
                    return self._json(403, {"error": "no-actions", "detail": "this access does not include the doors"})
                return self._action(body if isinstance(body, dict) else {}, self._viewer()[1])
            cam = body.get("camera") if isinstance(body, dict) else None
            if not isinstance(cam, str) or not CAMERA_ID.match(cam):
                return self._json(400, {"error": "bad-camera-id"})
            if not self._may_see(cam):
                return self._json(403, {"error": "not-your-camera"})
            # A recorded clip plays for minutes and the player fetches it in
            # Range pieces, each checked against the ticket: a 90 s ticket
            # would cut playback off. `ttl` may ask for up to TICKET_TTL_MAX.
            ttl = TICKET_TTL_SECONDS
            try:
                asked = int(body.get("ttl", TICKET_TTL_SECONDS))
                ttl = max(TICKET_TTL_SECONDS, min(TICKET_TTL_MAX, asked))
            except (TypeError, ValueError):
                ttl = TICKET_TTL_SECONDS
            return self._json(200, {"ticket": mint_ticket(token, cam, ttl=ttl), "expires_in": ttl, "camera": cam})

        # -- handlers -------------------------------------------------------
        def do_DELETE(self):
            raw_path, _, _query = self.path.partition("?")
            path = strip_prefix(raw_path)
            m = re.match(r"^/streams/([^/]+)$", path)
            if not m:
                return self._json(404, {"error": "not-found"})
            if not self._authed():
                return self._json(401, {"error": "unauthorized"})
            cam = m.group(1)
            if not CAMERA_ID.match(cam):
                return self._json(400, {"error": "bad-camera-id"})
            return self._stream_remove(cam)

        def _probe(self, cam, timeout=None):
            """One frame from go2rtc, timed: {status, ok, ms, bytes, error?}. go2rtc's own words on a miss."""
            t0 = time.time()
            limit = min(timeout or snap_timeout, 15.0)
            try:
                status, _c, body = self._get_upstream("/api/frame.jpeg?src=" + urllib.parse.quote(cam), limit, limit=4 * 1024 * 1024)
                return {"status": status, "ok": bool(body), "ms": int((time.time() - t0) * 1000), "bytes": len(body or b"")}
            except urllib.error.HTTPError as e:
                return {"status": e.code, "ok": False, "error": scrub_text(e.read(2048).decode("utf-8", "replace").strip(), 300), "ms": int((time.time() - t0) * 1000), "bytes": 0}
            except socket.timeout:
                return {"status": 0, "ok": False, "error": "no frame in %d s" % int(limit), "timeout": True, "ms": int((time.time() - t0) * 1000), "bytes": 0}
            except urllib.error.URLError as e:
                if isinstance(getattr(e, "reason", None), socket.timeout):
                    return {"status": 0, "ok": False, "error": "no frame in %d s" % int(limit), "timeout": True, "ms": int((time.time() - t0) * 1000), "bytes": 0}
                return {"status": 0, "ok": False, "error": scrub_text(getattr(e, "reason", e), 200), "ms": int((time.time() - t0) * 1000), "bytes": 0}
            except (OSError, ValueError) as e:
                return {"status": 0, "ok": False, "error": scrub_text(e, 200), "ms": int((time.time() - t0) * 1000), "bytes": 0}

        def _register(self, name, url):
            """PUT one stream into go2rtc; when it refuses (DR-0789), write the config line directly. Answers (registered, persisted, detail)."""
            q = urllib.parse.urlencode([("name", name), ("src", url)])
            put = urllib.request.Request(upstream + "/api/streams?" + q, method="PUT")
            try:
                with urllib.request.urlopen(put, timeout=SETUP_TIMEOUT) as r:
                    r.read(4096)
                return True, True, ""
            except urllib.error.HTTPError as e:
                detail = scrub_text(e.read(1024).decode("utf-8", "replace").strip(), 200)
                if write_stream_entry(GO2RTC_YAML_PATH, name, url):
                    return False, True, "go2rtc refused the PUT (HTTP %d: %s); written to the config; it loads on the next restart" % (e.code, detail)
                return False, False, "go2rtc refused the PUT (HTTP %d: %s)" % (e.code, detail)
            except (urllib.error.URLError, OSError):
                return False, False, "go2rtc-unreachable"

        def _existing_ids(self):
            try:
                _s, _c, streams = self._get_upstream("/api/streams", HEALTH_TIMEOUT, limit=4 * 1024 * 1024)
                parsed = json.loads(streams.decode("utf-8"))
                return set(parsed.keys()) if isinstance(parsed, dict) else set()
            except (urllib.error.URLError, OSError, ValueError):
                return set()

        def _stream_add(self, body):
            """A camera of any kind go2rtc speaks, from the app (DR-0803): registered, persisted, and probed once."""
            name = str(body.get("name") or "").strip()
            url = str(body.get("url") or "").strip()
            if not name or not CAMERA_ID.match(name):
                return self._json(400, {"error": "bad-camera-id"})
            if is_twin(name):
                return self._json(400, {"error": "reserved-name"})
            ok, why = source_check(url)
            if not ok:
                return self._json(400, {"error": why})
            existing = self._existing_ids()
            if name in existing and not body.get("replace"):
                return self._json(409, {"error": "name-taken", "id": name})
            registered, persisted, detail = self._register(name, url)
            if not registered and not persisted:
                return self._json(502, {"error": detail or "go2rtc-unreachable", "id": name})
            probe = self._probe(name) if registered else {"status": 0, "ok": False, "error": "not loaded yet (config written; restart the camera service)", "ms": 0, "bytes": 0}
            return self._json(200, {"ok": True, "id": name, "kind": kind_of(url), "registered": registered, "persisted": persisted, "detail": detail, "probe": probe})

        def _stream_remove(self, cam):
            """Take a stream out of go2rtc and the config, with its twins."""
            removed = []
            for name in (cam, twin_of(cam), sd_of(cam)):
                gone = False
                req = urllib.request.Request(upstream + "/api/streams?" + urllib.parse.urlencode([("src", name)]), method="DELETE")
                try:
                    with urllib.request.urlopen(req, timeout=HEALTH_TIMEOUT) as r:
                        r.read(1024)
                    gone = True
                except urllib.error.HTTPError:
                    gone = False
                except (urllib.error.URLError, OSError):
                    return self._json(502, {"error": "go2rtc-unreachable"})
                if remove_stream_entry(GO2RTC_YAML_PATH, name):
                    gone = True
                if gone:
                    removed.append(name)
            return self._json(200, {"ok": True, "removed": removed})

        def _setup_ring(self, body):
            """Ring signs in through go2rtc's own /api/ring (email, password, the 2FA code it asks for); every camera it lists is registered."""
            email = str(body.get("email") or "").strip()
            password = str(body.get("password") or "")
            code = str(body.get("code") or "").strip()
            if not email or "@" not in email or not password:
                return self._json(400, {"error": "missing-field", "field": "email" if not email or "@" not in email else "password"})
            if not SETUP_LOCK.acquire(blocking=False):
                return self._json(409, {"error": "setup-in-progress"})
            try:
                params = [("email", email), ("password", password)]
                if code:
                    params.append(("code", code))
                try:
                    with urllib.request.urlopen(upstream + "/api/ring?" + urllib.parse.urlencode(params), timeout=SETUP_TIMEOUT) as r:
                        raw = r.read(4 * 1024 * 1024)
                except urllib.error.HTTPError as e:
                    detail = scrub_text(e.read(2048).decode("utf-8", "replace").strip().replace(password, "***"), 300)
                    if e.code in (401, 403):
                        return self._json(401, {"error": "ring-sign-in-refused", "detail": detail})
                    return self._json(502, {"error": "ring-error", "upstream_status": e.code, "detail": detail})
                except (urllib.error.URLError, OSError):
                    return self._json(502, {"error": "go2rtc-unreachable"})
                try:
                    doc = json.loads(raw.decode("utf-8"))
                except ValueError:
                    return self._json(502, {"error": "ring-error", "detail": "go2rtc answered no JSON"})
                if isinstance(doc, dict) and doc.get("needs_2fa"):
                    return self._json(409, {"error": "needs-2fa", "prompt": scrub_text(doc.get("prompt") or "Enter the code Ring sent you", 200)})
                sources = doc.get("sources") if isinstance(doc, dict) else None
                existing = self._existing_ids()
                out = []
                added = 0
                for src in sources or []:
                    if not isinstance(src, dict) or not src.get("url"):
                        continue
                    label = str(src.get("name") or "ring")
                    is_snap = label.lower().endswith(" snapshot") or "&snapshot" in str(src.get("url"))
                    if is_snap:
                        continue  # the frame road serves snapshots; one stream per camera
                    name = stream_name_for(label, existing)
                    registered, persisted, detail = self._register(name, str(src.get("url")))
                    existing.add(name)
                    if registered or persisted:
                        added += 1
                    out.append({"id": name, "name": label, "registered": registered, "persisted": persisted, "detail": detail})
                return self._json(200, {"ok": True, "added": added, "cameras": out})
            finally:
                SETUP_LOCK.release()

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

        def _setup_wyze_again(self):
            """The sign-in from what the NAS kept: no body, nothing typed."""
            try:
                creds = wyze_creds()
            except Exception:  # noqa: BLE001
                creds = None
            if not creds:
                return self._json(503, {"error": "no-credentials", "detail": "no Wyze sign-in is kept on the NAS yet; type it once in the Cameras tab"})
            body = {k: str(creds.get(k) or "") for k in WYZE_FIELDS}
            return self._setup_wyze(body, persist=False, again=True)

        def _setup_wyze(self, body, persist=True, again=False):
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
                        self._wyze_accepted(fields, persist)
                        return self._json(200, {"ok": True, "added": 0, "cameras": [], "note": "signed in; this Wyze account lists no cameras"})
                    return self._json(502, {"error": "wyze-error", "upstream_status": e.code, "detail": detail})
                except (urllib.error.URLError, OSError):
                    return self._json(502, {"error": "go2rtc-unreachable"})
                self._wyze_accepted(fields, persist)
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
                persisted = 0
                for cam in cams:
                    slug = stream_name_for(cam["name"], set())
                    was_there = slug in existing
                    # ALWAYS PUT, even for a camera go2rtc already lists (DR-0779).
                    # Measured 2026-10-07 (cams-diag run 37625766143): go2rtc's own
                    # /api/wyze registers the cameras IN MEMORY as it lists them, so
                    # every one read as "existing" here, this PUT was skipped, and
                    # go2rtc.yaml kept `streams: {}` -- the 07:31 CDT container
                    # recreate came back with zero cameras. PUT /api/streams is the
                    # call that writes the config (app.PatchConfig); it is idempotent.
                    name = slug if was_there else stream_name_for(cam["name"], existing)
                    q = urllib.parse.urlencode([("name", name), ("src", cam["url"])])
                    put = urllib.request.Request(upstream + "/api/streams?" + q, method="PUT")
                    ok = True
                    try:
                        with urllib.request.urlopen(put, timeout=HEALTH_TIMEOUT) as r:
                            r.read(4096)
                    except (urllib.error.HTTPError, urllib.error.URLError, OSError):
                        ok = False
                    if ok:
                        persisted += 1
                        if not was_there:
                            existing.add(name)
                            added += 1
                    out.append({"id": name, "name": cam["name"], "model": cam["model"], "dtls": cam["dtls"], "registered": ok or was_there, "existing": was_there, "persisted": ok})
                # The source URLs (they carry the camera's enr secret) never leave this process.
                return self._json(200, {"ok": True, "added": added, "persisted": persisted, "cameras": out, "again": again})
            finally:
                SETUP_LOCK.release()

        def _wyze_accepted(self, fields, persist=True):
            """go2rtc took the sign-in: keep the four values for the cloud client
            and the re-add (root-only file) and start the next cloud call from
            this account. A re-run from the kept values writes nothing."""
            if persist:
                try:
                    wyze_persist(fields)
                except Exception:  # noqa: BLE001 -- never let a disk hiccup fail the sign-in that already worked
                    pass
            wyze_client_reset()

        def _wyze(self):
            """The cloud client, or (status, json) when there is none."""
            try:
                client = wyze_factory()
            except Exception as e:  # noqa: BLE001
                return None, (503, {"error": "wyze-unavailable", "detail": scrub_text(str(e), 200)})
            if client is None:
                return None, (503, {"error": "no-credentials", "detail": "sign in to Wyze in the Cameras tab first"})
            return client, None

        def _grant_make(self, body):
            fields, err = grant_normalize(body)
            if err:
                return self._json(400, {"error": err})
            gid, tok, rec = grant_mint(token, fields, now_fn(), grants_path)
            # The token is shown ONCE, here, to the owner who made it; the NAS
            # keeps only the salt it is checked against.
            return self._json(200, {"ok": True, "id": gid, "token": tok, "link_path": GRANT_LINK_PATH, "grant": grant_public(gid, rec)})

        def _devices(self, grant=None):
            client, err = self._wyze()
            if err:
                return self._json(*err)
            try:
                devs = client.devices()
            except Exception as e:  # noqa: BLE001 -- WyzeError or anything the cloud threw
                return self._json(*wyze_error_response(e))
            out = []
            for d in devs:
                if d.get("type") != "Camera":
                    continue  # scales, plugs, bulbs: not this tab's business
                if grant is not None and not grant_allows(grant, stream_name_for(d["nickname"], set())):
                    continue  # a grant sees only its cameras' doors
                out.append({
                    "mac": d["mac"], "nickname": d["nickname"], "model": d["model"], "online": bool(d["online"]),
                    "garage": bool(d["garage"]), "firmware": d.get("firmware", ""),
                    "stream": stream_name_for(d["nickname"], set()),
                    "actions": (["garage"] if d["garage"] else []) + ["siren_on", "siren_off"],
                })
            return self._json(200, {"devices": out, "count": len(out), "garages": sum(1 for d in out if d["garage"])})

        def _action(self, body, grant=None):
            mac = body.get("mac")
            action = body.get("action")
            if not isinstance(mac, str) or not re.match(r"^[A-Za-z0-9_:.-]{1,32}$", mac):
                return self._json(400, {"error": "bad-mac"})
            if not isinstance(action, str) or not re.match(r"^[a-z_]{1,32}$", action):
                return self._json(400, {"error": "bad-action"})
            client, err = self._wyze()
            if err:
                return self._json(*err)
            if grant is not None:
                try:
                    d = client.device(mac)
                except Exception as e:  # noqa: BLE001
                    return self._json(*wyze_error_response(e))
                if not d or not grant_allows(grant, stream_name_for(d["nickname"], set())):
                    return self._json(403, {"error": "not-your-camera"})
            try:
                r = client.run_action(mac, action)
            except Exception as e:  # noqa: BLE001
                return self._json(*wyze_error_response(e))
            return self._json(200, r)

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
                out = {"ok": True, "go2rtc": version, "streams": count, "forwarder": CODE_SHA,
                       "on_disk": code_sha(),
                       "max_live": max_live, "live_max_seconds": int(live_max_seconds)}
                out.update(live_snapshot())
                out.update(breaker_snapshot())
                out["stream_health"] = stream_health.snapshot()
                out["derived"] = derived_store.snapshot()
                try:
                    out["wyze_cloud"] = "ready" if wyze_factory() is not None else "no-credentials"
                    if PERSIST_LAST:
                        out["config_persist"] = dict(PERSIST_LAST)
                except Exception:  # noqa: BLE001
                    out["wyze_cloud"] = "unavailable"
                return self._json(200, out)
            except (urllib.error.URLError, OSError, ValueError):
                return self._json(502, {"ok": False, "error": "go2rtc-unreachable", "upstream": upstream})

        def _list(self, grant=None):
            try:
                _s, _c, streams = self._get_upstream("/api/streams", HEALTH_TIMEOUT, limit=4 * 1024 * 1024)
                parsed = json.loads(streams.decode("utf-8"))
            except (urllib.error.URLError, OSError, ValueError):
                return self._json(502, {"error": "go2rtc-unreachable"})
            cams = camera_list(parsed)
            # An H.264 twin (DR-0798) is not a second camera: it is hidden from
            # the list and its base camera says it has one.
            ids = set(c["id"] for c in cams)
            cams = [dict(c, h264=(twin_of(c["id"]) in ids), sd=(sd_of(c["id"]) in ids)) for c in cams
                    if not (is_twin(c["id"]) and base_of(c["id"]) in ids)]
            if grant is not None:
                cams = [c for c in cams if grant_allows(grant, c["id"])]
                return self._json(200, {"cameras": cams, "count": len(cams),
                                        "access": {"name": grant.get("name"), "expires": grant.get("expires") or 0, "actions": grant.get("actions") is True}})
            return self._json(200, {"cameras": cams, "count": len(cams)})

        def _snap(self, cam, query):
            rest = breaker_check(cam)
            if rest:
                return self._json(503, {"error": "resting", "retry_in": rest["retry_in"], "detail": rest["last"]})
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
                    breaker_note(cam, False, detail)
                    return self._json(e.code if 400 <= e.code < 600 else 502, {"error": "no-frame", "upstream_status": e.code, "detail": detail})
                except socket.timeout:
                    breaker_note(cam, False, "no answer in %d s" % int(snap_timeout))
                    return self._json(504, {"error": "frame-timeout", "after_s": int(snap_timeout)})
                except urllib.error.URLError as e:
                    if isinstance(getattr(e, "reason", None), socket.timeout):
                        breaker_note(cam, False, "no answer in %d s" % int(snap_timeout))
                        return self._json(504, {"error": "frame-timeout", "after_s": int(snap_timeout)})
                    return self._json(502, {"error": "go2rtc-unreachable", "detail": scrub_text(getattr(e, "reason", e), 200)})
                except (OSError, ValueError) as e:
                    return self._json(502, {"error": "go2rtc-unreachable", "detail": scrub_text(e, 200)})
                if not body:
                    breaker_note(cam, False, "empty frame")
                    return self._json(502, {"error": "no-frame", "detail": "go2rtc answered an empty frame"})
                breaker_note(cam, True)
                return self._bytes(status, ctype or "image/jpeg", body)
            finally:
                snap_gate.release()

        # -- recording (DR-0775) -----------------------------------------------
        def _recording_get(self):
            if rec_load_config is None:
                return self._json(501, {"error": "recorder-absent"})
            cfg, err = rec_load_config(recording_config)
            status = None
            try:
                with open(recording_status, "r", encoding="utf-8") as fh:
                    status = json.load(fh)
            except (OSError, ValueError):
                status = None
            return self._json(200, {"config": cfg, "config_error": err, "status": status, "root": recordings_root,
                                    "derived": derived_store.snapshot(), "segment_seconds": int(REC_SEGMENT_SECONDS)})

        def _recording_put(self, body):
            if rec_normalize_config is None:
                return self._json(501, {"error": "recorder-absent"})
            cfg = rec_normalize_config(body)
            # Only cameras go2rtc actually has may be enabled: a typo never spawns an ffmpeg.
            try:
                _s, _c, streams = self._get_upstream("/api/streams", HEALTH_TIMEOUT, limit=4 * 1024 * 1024)
                have = set((json.loads(streams.decode("utf-8")) or {}).keys())
            except (urllib.error.URLError, OSError, ValueError):
                return self._json(502, {"error": "go2rtc-unreachable"})
            unknown = sorted(c for c, v in cfg["cameras"].items() if v.get("enabled") and c not in have)
            if unknown:
                return self._json(400, {"error": "unknown-camera", "cameras": unknown})
            tmp = recording_config + ".tmp"
            try:
                os.makedirs(os.path.dirname(recording_config) or ".", exist_ok=True)
                with open(tmp, "w", encoding="utf-8") as fh:
                    json.dump(cfg, fh, indent=2, sort_keys=True)
                os.replace(tmp, recording_config)
            except OSError as e:
                return self._json(500, {"error": "config-unwritable", "detail": scrub_text(e, 200)})
            return self._json(200, {"ok": True, "config": cfg})

        def _rec_list(self, cam):
            if rec_list_clips is None:
                return self._json(501, {"error": "recorder-absent"})
            clips = rec_list_clips(recordings_root, cam)
            now = now_fn()
            for i, c in enumerate(clips):
                c["seconds"] = clip_seconds(clips, i, now=now)
                c["sizes"] = estimate_sizes(c["bytes"], c["seconds"])
            return self._json(200, {"camera": cam, "clips": clips, "count": len(clips), "bytes": sum(c["bytes"] for c in clips),
                                    "size_tiers": [[k, v["label"], v["height"]] for k, v in CLIP_SIZES]})

        def _streams_health(self):
            # The stream health log (DR-0798): the owner sees every camera, a grant its own.
            who = self._viewer()
            if not who:
                return self._json(401, {"error": "unauthorized"})
            out = stream_health.summary()
            if who[0] == "grant":
                g = who[1]
                out["cameras"] = dict((k, v) for k, v in out["cameras"].items() if grant_allows(g, k))
                out["events"] = [e for e in out["events"] if grant_allows(g, e.get("camera"))]
            return self._json(200, out)

        def _rec_clip(self, cam, clip, query=""):
            q = urllib.parse.parse_qs(query or "")
            size = q.get("size", [""])[0]
            want_download = q.get("dl", [""])[0] == "1"
            # Containment by construction: the camera id and the clip name each
            # pass a strict grammar, and the path is joined under the root.
            path = os.path.join(recordings_root, cam, clip)
            if os.path.commonpath([os.path.abspath(path), os.path.abspath(recordings_root)]) != os.path.abspath(recordings_root):
                return self._json(404, {"error": "not-found"})
            if q.get("sizes", [""])[0] == "1":
                # What each tier would be, and which are already made (DR-0797).
                try:
                    original = os.path.getsize(path)
                except OSError:
                    return self._json(404, {"error": "not-found"})
                clips = rec_list_clips(recordings_root, cam) if rec_list_clips else []
                idx = next((i for i, c in enumerate(clips) if c["name"] == clip), -1)
                seconds = clip_seconds(clips, idx, now=now_fn()) if idx >= 0 else int(REC_SEGMENT_SECONDS)
                est = estimate_sizes(original, seconds)
                tiers = {}
                for k, spec in CLIP_SIZES:
                    st, detail = derived_store.status(cam, clip, k)
                    row = {"label": spec["label"], "height": spec["height"], "estimate": est[k], "state": st}
                    if st == "ready":
                        try:
                            row["bytes"] = os.path.getsize(detail)
                        except OSError:
                            row["state"] = "absent"
                    elif st == "queued":
                        row["position"] = detail
                    elif st == "failed":
                        row["error"] = detail
                    tiers[k] = row
                return self._json(200, {"camera": cam, "clip": clip, "original": original, "seconds": seconds, "tiers": tiers,
                                        "download_name": download_name(cam, clip, None)})
            if size and size != "original":
                if size not in CLIP_SIZE_MAP:
                    return self._json(400, {"error": "bad-size", "sizes": [k for k, _v in CLIP_SIZES]})
                st, detail = derived_store.ask(cam, clip, size, retry=q.get("retry", [""])[0] == "1")
                if st == "ready":
                    return self._serve_mp4(detail, download_name(cam, clip, size) if want_download else None)
                if st == "no-source":
                    return self._json(404, {"error": "not-found"})
                if st == "failed":
                    return self._json(500, {"error": "transcode-failed", "detail": detail, "size": size})
                return self._json(202, {"status": st, "size": size, "position": detail if st == "queued" else 0, "retry_in": 3})
            return self._serve_mp4(path, download_name(cam, clip, None) if want_download else None)

        def _serve_mp4(self, path, attachment_name=None):
            try:
                size = os.path.getsize(path)
                fh = open(path, "rb")
            except OSError:
                return self._json(404, {"error": "not-found"})
            with fh:
                start, end = 0, size - 1
                rng = self.headers.get("Range", "")
                m = re.match(r"^bytes=(\d*)-(\d*)$", rng)
                partial = False
                if m and size > 0:
                    a, b = m.group(1), m.group(2)
                    if a:
                        start = int(a); end = int(b) if b else size - 1
                    elif b:
                        start = max(0, size - int(b))
                    end = min(end, size - 1)
                    if start > end or start >= size:
                        self.send_response(416)
                        self.send_header("Content-Range", "bytes */%d" % size)
                        self.send_header("Content-Length", "0")
                        self.end_headers()
                        return None
                    partial = True
                length = end - start + 1
                self.send_response(206 if partial else 200)
                self.send_header("Content-Type", "video/mp4")
                self.send_header("Accept-Ranges", "bytes")
                self.send_header("Content-Length", str(length))
                self.send_header("Cache-Control", "private, max-age=3600")
                if attachment_name:
                    self.send_header("Content-Disposition", 'attachment; filename="%s"' % attachment_name.replace('"', ""))
                if partial:
                    self.send_header("Content-Range", "bytes %d-%d/%d" % (start, end, size))
                self.end_headers()
                fh.seek(start)
                left = length
                try:
                    while left > 0:
                        chunk = fh.read(min(CHUNK, left))
                        if not chunk:
                            break
                        self.wfile.write(chunk)
                        left -= len(chunk)
                except (BrokenPipeError, ConnectionResetError, OSError):
                    pass
            return None

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
            live_note(len(body))
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
                live_note(0, delta_open=+1)
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
                            live_note(len(chunk))
                    except (BrokenPipeError, ConnectionResetError, OSError):
                        pass  # the viewer left, or the source went silent past the timeout
                    finally:
                        live_note(0, delta_open=-1)
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
            if path == "/api/config":
                if "config_streams" not in seen:
                    return self._send(404, "text/plain", b"no config api")
                names = seen["config_streams"]
                body = "api:\n  listen: \":1984\"\nstreams:" + (" {}\n" if not names else "\n" + "".join("  %s: wyze://x?enr=S\n" % n for n in names)) + "wyze:\n  email: x\n"
                return self._send(200, "text/plain", body.encode("utf-8"))
            if path == "/api/streams" and seen.get("empty_streams"):
                return self._send(200, "application/json", b"{}")
            if path == "/api/streams" and seen.get("with_twin"):
                return self._send(200, "application/json", json.dumps({
                    "front_yard": {"producers": [{"url": "wyze://192.168.1.50?uid=ABC&enr=SECRET&mac=AA&model=HL_CAM4&dtls=true", "medias": ["video, recvonly, H265 Main"], "bytes_recv": 4096}], "consumers": [{"type": "mp4"}]},
                    "front_yard_h264": {"producers": [{"url": "ffmpeg:front_yard#video=h264"}], "consumers": []},
                    "front_yard_sd": {"producers": [{"url": "wyze://192.168.1.50?uid=ABC&enr=SECRET&mac=AA&model=HL_CAM4&dtls=true&subtype=sd"}], "consumers": []},
                    "garage": {"producers": [{"url": "rtsp://admin:SECRET@192.168.1.60/live", "medias": ["video, recvonly, H264 High 4.1"], "bytes_recv": 100}], "consumers": []},
                }).encode("utf-8"))
            if path == "/api/streams":
                return self._send(200, "application/json", json.dumps({
                    "front_yard": {"producers": [{"url": "wyze://192.168.1.50?uid=ABC&enr=SECRET&mac=AA&model=HL_CAM4&dtls=true"}], "consumers": []},
                    "doorbell": {"producers": [{"url": "ring://x@y.z?device_id=1&refresh_token=SECRET"}], "consumers": []},
                    "garage": {"producers": [{"url": "rtsp://admin:SECRET@192.168.1.60/live"}], "consumers": []},
                    "bad id/with slash": {"producers": [], "consumers": []},
                }).encode("utf-8"))
            if path == "/api/ring":
                q = urllib.parse.parse_qs(query)
                seen["ring_query"] = {k: v[0] for k, v in q.items()}
                if q.get("password", [""])[0] == "wrong":
                    return self._send(401, "text/plain", b"ring: authentication failed")
                if not q.get("code", [""])[0]:
                    return self._send(200, "application/json", b'{"needs_2fa": true, "prompt": "Please enter the code sent to +1 (***) ***-1234"}')
                return self._send(200, "application/json", json.dumps({"sources": [
                    {"name": "Front Door", "url": "ring:?camera_id=11&device_id=22&refresh_token=RINGSECRET"},
                    {"name": "Front Door Snapshot", "url": "ring:?camera_id=11&device_id=22&refresh_token=RINGSECRET&snapshot"},
                    {"name": "Driveway", "url": "ring:?camera_id=33&device_id=44&refresh_token=RINGSECRET"},
                ]}).encode("utf-8"))
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

        def do_DELETE(self):
            path, _, query = self.path.partition("?")
            if path != "/api/streams":
                return self._send(404, "text/plain", b"nope")
            seen.setdefault("deletes", []).append(urllib.parse.parse_qs(query).get("src", [""])[0])
            return self._send(200, "application/json", b"{}")

        def do_PUT(self):
            path, _, query = self.path.partition("?")
            if path != "/api/streams":
                return self._send(404, "text/plain", b"nope")
            q = urllib.parse.parse_qs(query)
            seen.setdefault("puts", []).append((q.get("name", [""])[0], q.get("src", [""])[0]))
            if seen.get("put_refuses"):
                # The real go2rtc 1.9.14 under `streams: {}`: yaml.Patch inserts under a flow mapping and the result fails validation.
                return self._send(400, "text/plain", b"yaml: line 8: did not find expected key\n")
            return self._send(200, "application/json", b"{}")

    fake = ThreadingHTTPServer(("127.0.0.1", 0), FakeGo2rtc)
    fake.daemon_threads = True
    fake.handle_error = lambda request, client_address: None  # a viewer hanging up mid-stream is normal, not a traceback
    fp = fake.server_address[1]
    threading.Thread(target=fake.serve_forever, daemon=True).start()

    token = "test-token-" + str(os.getpid())
    exits = []
    clock = {"now": 1_000_000.0}
    import tempfile
    rec_tmp = tempfile.mkdtemp(prefix="cams-fwd-rec-")
    rec_cfg = os.path.join(rec_tmp, "recording.json")
    rec_status = os.path.join(rec_tmp, "recording.status.json")
    rec_root = os.path.join(rec_tmp, "recordings")
    os.makedirs(os.path.join(rec_root, "front_yard"))
    with open(os.path.join(rec_root, "front_yard", "2026-10-07T06-40-00.mp4"), "wb") as fh:
        fh.write(bytes(range(256)) * 40)  # 10240 bytes, byte i == i % 256
    with open(os.path.join(rec_root, "front_yard", "notes.txt"), "w") as fh:
        fh.write("not a clip")
    with open(rec_status, "w") as fh:
        json.dump({"ok": True, "total_bytes": 10240, "cameras": {"front_yard": {"recording": True, "clips": 1}}}, fh)
    # A stand-in for the Wyze cloud client (wyze_cloud.WyzeCloud): the same
    # methods, the same WyzeError kinds, no network. `heal` holds what the
    # NAS "kept" so the re-add and the no-credentials paths can both be driven.
    from wyze_cloud import WyzeError
    persisted = []
    heal = {"creds": None, "client": "fake"}
    actions = []

    class FakeCloud:
        def __init__(self):
            self.last = {}

        def devices(self):
            return [
                {"mac": "GD1", "nickname": "Garage Doors", "model": "WYZE_CAKP2JFUS", "type": "Camera", "online": True, "garage": True, "dongle": "HL_CGDC", "firmware": "4.36.17.21"},
                {"mac": "FY1", "nickname": "Front Yard", "model": "HL_CAM4", "type": "Camera", "online": True, "garage": False, "dongle": "", "firmware": ""},
                {"mac": "OFF1", "nickname": "Shed", "model": "HL_CAM4", "type": "Camera", "online": False, "garage": False, "dongle": "", "firmware": ""},
                {"mac": "SC1", "nickname": "Wyze Scale", "model": "JA.SC", "type": "WyzeScale", "online": True, "garage": False, "dongle": "", "firmware": ""},
            ]

        def device(self, mac):
            return {x["mac"]: x for x in self.devices()}.get(mac)

        def run_action(self, mac, action):
            if action not in ("garage", "siren_on", "siren_off", "power_on", "power_off"):
                raise WyzeError("unknown-action", action)
            d = {x["mac"]: x for x in self.devices()}.get(mac)
            if not d:
                raise WyzeError("unknown-device", mac)
            if action == "garage" and not d["garage"]:
                raise WyzeError("no-garage-controller", d["nickname"])
            if time.monotonic() - self.last.get(mac, 0.0) < 3:
                raise WyzeError("too-soon", "3 s")
            self.last[mac] = time.monotonic()
            if mac == "OFF1":
                raise WyzeError("device-offline", "device offline")
            actions.append((mac, action))
            return {"ok": True, "mac": mac, "nickname": d["nickname"], "action": action, "action_key": "garage_door_trigger" if action == "garage" else action}

    fake_cloud = FakeCloud()
    # The derived-clip worker with a stand-in ffmpeg (DR-0797): it writes the
    # .part the real one would, or fails with a line that carries a secret.
    fake_ffmpeg = {"fail": False, "argv": []}

    def fake_runner(argv):
        fake_ffmpeg["argv"].append(list(argv))
        if fake_ffmpeg["fail"]:
            return 1, "ffmpeg: Invalid data found when processing input rtsp://admin:SECRET@cam/live"
        with open(argv[-1], "wb") as fh:
            fh.write(b"DERIVED-" + os.path.basename(argv[-1]).split(".")[-3].encode() + b"-" * 2000)
        return 0, ""
    derived = DerivedStore(rec_root, runner=fake_runner, budget=10 * 1024 * 1024, docker=None, now=lambda: clock["now"], log=lambda *a: None)
    health_log = StreamHealth(now=lambda: clock["now"], interval=15)
    fwd = ThreadingHTTPServer(("127.0.0.1", 0), make_handler(
        "http://127.0.0.1:%d" % fp, token, max_live=2, live_max_seconds=1.0, max_snap=1, snap_timeout=5, segment_timeout=5,
        exit_fn=lambda code: exits.append(code), now_fn=lambda: clock["now"],
        recording_config=rec_cfg, recording_status=rec_status, recordings_root=rec_root,
        wyze_factory=lambda: (fake_cloud if heal["client"] else None),
        wyze_persist=lambda fields: (persisted.append(dict(fields)), heal.__setitem__("creds", dict(fields))),
        wyze_creds=lambda: heal["creds"], grants_path=os.path.join(rec_tmp, "camera-grants.json"),
        derived_store=derived, stream_health=health_log))
    fwd.daemon_threads = True
    fwd.handle_error = lambda request, client_address: None
    port = fwd.server_address[1]
    threading.Thread(target=fwd.serve_forever, daemon=True).start()

    def call(method, path, body=None, auth=None, read=True, extra=None):
        c = HTTPConnection("127.0.0.1", port, timeout=8)
        headers = {"Content-Type": "application/json"}
        if auth is not None:
            headers["Authorization"] = auth
        if extra:
            headers.update(extra)
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
    check(("garage_cam", "wyze://192.168.1.51?uid=DEF&enr=ENRSECRET2&mac=CC:DD&model=WYZEC1-JZ") in seen["puts"] and ("front_yard", "wyze://192.168.1.50?uid=ABC&enr=ENRSECRET&mac=AA:BB&model=HL_CAM4&dtls=true") in seen["puts"] and len(seen["puts"]) == 2, "every camera is PUT to go2rtc with its exact source url -- the new one AND the one already in memory, so the config on disk carries both (DR-0779)")
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
    check(MAX_LIVE == 32 and LIVE_MAX_SECONDS == 0, "the shipped defaults do not cut a viewer off: 32 live (one per camera and then some), no clock")
    live_note(0, now=0.0)
    LIVE_STATS["samples"] = []
    live_note(5000, now=100.0); live_note(5000, now=104.0); live_note(99999, now=80.0)
    snap = live_snapshot(now=105.0)
    check(snap["live_bytes_per_s"] == 1000 and snap["live_open"] == 0, "live traffic is a 10 s window: 10,000 bytes in the window -> 1000 B/s, the old sample dropped (%r)" % snap)
    live_note(0, delta_open=+1, now=105.0)
    check(live_snapshot(now=105.0)["live_open"] == 1, "an open live stream is counted")
    live_note(0, delta_open=-1, now=105.0)
    s, _h, d = call("GET", "/health")
    j = json.loads(d.decode("utf-8"))
    check("live_open" in j and "live_bytes_per_s" in j, "/health carries the live count and the measured bytes per second")

    print("=== 8e. recorded loops (DR-0775): settings, the clips on disk, ticketed playback with Range ===")
    s, _h, d = call("GET", "/recording")
    check(s == 401, "no bearer -> /recording 401")
    s, _h, d = call("GET", "/recording", auth=B)
    j = json.loads(d.decode("utf-8"))
    check(s == 200 and j["config"]["cameras"] == {} and j["status"]["total_bytes"] == 10240 and j["root"] == rec_root, "GET /recording: the default config (nothing records) and the recorder's status file")
    s, _h, d = call("PUT", "/recording", json.dumps({"disk_budget_gb": 50, "cameras": {"front_yard": {"enabled": True, "retention_days": 7}, "ghost_cam": {"enabled": True}}}).encode(), auth=B)
    check(s == 400 and b"unknown-camera" in d and b"ghost_cam" in d, "enabling a camera go2rtc does not have is refused by name (a typo never spawns an ffmpeg)")
    s, _h, d = call("PUT", "/recording", json.dumps({"disk_budget_gb": 50, "cameras": {"front_yard": {"enabled": True, "retention_days": 9999}, "garage": {"enabled": False, "retention_days": 3}}}).encode(), auth=B)
    j = json.loads(d.decode("utf-8"))
    check(s == 200 and j["config"]["cameras"]["front_yard"] == {"enabled": True, "retention_days": 365} and j["config"]["cameras"]["garage"]["enabled"] is False, "PUT /recording normalizes (retention clamped) and answers the saved config")
    with open(rec_cfg) as fh:
        on_disk = json.load(fh)
    check(on_disk["disk_budget_gb"] == 50 and on_disk["cameras"]["front_yard"]["enabled"] is True, "the config is on disk for the recorder service to reconcile to")
    s, _h, d = call("PUT", "/recording", b"{bad", auth=B)
    check(s == 400, "bad JSON -> 400")
    s, _h, d = call("PUT", "/recording", b"{}")
    check(s == 401, "no bearer -> PUT 401")
    s, _h, d = call("GET", "/rec/front_yard", auth=B)
    j = json.loads(d.decode("utf-8"))
    check(s == 200 and j["count"] == 1 and j["clips"][0]["name"] == "2026-10-07T06-40-00.mp4" and j["clips"][0]["bytes"] == 10240 and isinstance(j["clips"][0]["start"], int), "GET /rec/<id> lists the clips (name, bytes, start); the stray notes.txt is not a clip")
    s, _h, d = call("GET", "/rec/front_yard")
    check(s == 401, "the list needs the bearer")
    t = mint_ticket(token, "front_yard")
    s, h, d = call("GET", "/rec/front_yard/2026-10-07T06-40-00.mp4?t=" + t)
    check(s == 200 and len(d) == 10240 and h.get("accept-ranges") == "bytes" and h.get("content-type") == "video/mp4", "a camera ticket plays the whole clip (200, Accept-Ranges)")
    s, h, d = call("GET", "/rec/front_yard/2026-10-07T06-40-00.mp4?t=" + t, extra={"Range": "bytes=256-511"})
    check(s == 206 and len(d) == 256 and d == bytes(range(256)) and h.get("content-range") == "bytes 256-511/10240", "Range -> 206 with exactly those bytes (the player can seek)")
    s, h, d = call("GET", "/rec/front_yard/2026-10-07T06-40-00.mp4?t=" + t, extra={"Range": "bytes=-16"})
    check(s == 206 and len(d) == 16 and h.get("content-range") == "bytes 10224-10239/10240", "a suffix Range works")
    s, h, d = call("GET", "/rec/front_yard/2026-10-07T06-40-00.mp4?t=" + t, extra={"Range": "bytes=99999-"})
    check(s == 416, "a Range past the end -> 416")
    s, _h, d = call("GET", "/rec/front_yard/2026-10-07T06-40-00.mp4?t=" + mint_ticket(token, "garage"))
    check(s == 401, "another camera's ticket never opens this camera's clips")
    s, _h, d = call("GET", "/rec/front_yard/notes.txt?t=" + t)
    check(s == 404, "only the clip-name grammar is served (notes.txt -> 404)")
    s, _h, d = call("GET", "/rec/front_yard/..%2F..%2Fetc%2Fpasswd?t=" + t)
    check(s in (400, 404), "a path escape is refused by grammar before any file is touched")
    s, _h, d = call("GET", "/rec/front_yard/2026-10-07T07-00-00.mp4?t=" + t)
    check(s == 404, "a clip that is not on disk -> 404")
    s, _h, d = call("POST", "/ticket", json.dumps({"camera": "front_yard", "ttl": 3600}).encode(), auth=B)
    j = json.loads(d.decode("utf-8"))
    check(s == 200 and j["expires_in"] == 3600 and ticket_ok(token, "front_yard", j["ticket"], now=time.time() + 3000), "a playback ticket may ask for up to an hour (a clip plays for minutes in Range pieces)")
    s, _h, d = call("POST", "/ticket", json.dumps({"camera": "front_yard", "ttl": 999999}).encode(), auth=B)
    check(s == 200 and json.loads(d.decode("utf-8"))["expires_in"] == TICKET_TTL_MAX, "...and never more than the ceiling")
    s, _h, d = call("POST", "/ticket", json.dumps({"camera": "front_yard", "ttl": 1}).encode(), auth=B)
    check(s == 200 and json.loads(d.decode("utf-8"))["expires_in"] == TICKET_TTL_SECONDS, "...and never less than the default")
    import shutil as _sh
    _sh.rmtree(rec_tmp, ignore_errors=True)

    print("=== 8f. a camera that keeps failing is rested (the breaker), live never blocked ===")
    BREAKERS.clear()
    codes = []
    for _ in range(BREAKER_FAILS):
        s, _h, d = call("GET", "/snap/err_cam.jpg", auth=B); codes.append(s)
    check(codes == [500] * BREAKER_FAILS, "the first %d misses reach go2rtc (%r)" % (BREAKER_FAILS, codes))
    s, _h, d = call("GET", "/snap/err_cam.jpg", auth=B)
    j = json.loads(d.decode("utf-8"))
    check(s == 503 and j.get("error") == "resting" and j.get("retry_in", 0) > 0 and "i/o timeout" in j.get("detail", ""), "the next miss is answered at once: resting, seconds left, the last reason (%r)" % j)
    seen_before = len([q for q in seen["queries"] if "err_cam" in q])
    call("GET", "/snap/err_cam.jpg", auth=B)
    check(len([q for q in seen["queries"] if "err_cam" in q]) == seen_before, "while resting, nothing reaches go2rtc for that camera")
    s, _h, d = call("GET", "/health")
    check("err_cam" in json.loads(d.decode("utf-8")).get("resting", []), "/health lists the cameras at rest")
    with BREAKER_LOCK:
        BREAKERS["err_cam"]["until"] = time.monotonic() - 1
    s, _h, d = call("GET", "/snap/err_cam.jpg", auth=B)
    check(s == 500, "when the rest ends, ONE probe goes through to go2rtc")
    s, _h, d = call("GET", "/snap/err_cam.jpg", auth=B)
    check(s == 503 and json.loads(d.decode("utf-8")).get("error") == "resting", "...and a failed probe rests it again")
    s, _h, d = call("POST", "/ticket", json.dumps({"camera": "err_cam"}).encode(), auth=B)
    check(s == 200, "a live ticket is never blocked by the breaker (a person asked)")
    BREAKERS.clear()
    s, _h, d = call("GET", "/snap/front_yard.jpg", auth=B)
    check(s == 200 and "front_yard" not in breaker_snapshot()["resting"], "a camera that answers is never rested")

    print("=== 8g. the garage opens with no video in the way (DR-0777): /devices, /action, the kept sign-in, the re-add ===")
    check(persisted and persisted[-1]["email"] == "d@example.com" and persisted[-1]["password"] == "pw-secret" and all(p["password"] != "wrong" for p in persisted), "every sign-in go2rtc ACCEPTED (8b) was kept for the cloud client; the refused one never (%d kept)" % len(persisted))
    kept_n = len(persisted)
    s, _h, d = call("GET", "/devices")
    check(s == 401, "GET /devices needs the bearer")
    s, _h, d = call("GET", "/devices", auth=B)
    j = json.loads(d.decode("utf-8"))
    macs = [x["mac"] for x in j.get("devices", [])]
    check(s == 200 and macs == ["GD1", "FY1", "OFF1"] and j["garages"] == 1, "GET /devices -> the account's CAMERAS (the scale is not this tab's business), garages counted (%r)" % macs)
    gd = j["devices"][0]
    check(gd["garage"] is True and gd["stream"] == "garage_doors" and "garage" in gd["actions"] and gd["online"] is True, "the garage camera is marked, paired with its go2rtc stream id by the same nickname rule the sign-in used")
    check(j["devices"][1]["garage"] is False and "garage" not in j["devices"][1]["actions"], "a camera without the controller offers no garage action")
    check(b"pw-secret" not in d and b"key-secret" not in d and b"access_token" not in d, "no credential or token leaves with the device list")
    s, _h, d = call("POST", "/action", json.dumps({"mac": "GD1", "action": "garage"}).encode())
    check(s == 401 and actions == [], "POST /action needs the bearer; nothing was triggered")
    s, _h, d = call("POST", "/action", json.dumps({"mac": "../x", "action": "garage"}).encode(), auth=B)
    check(s == 400 and b"bad-mac" in d, "a mac outside the grammar -> 400")
    s, _h, d = call("POST", "/action", json.dumps({"mac": "GD1", "action": "Garage!"}).encode(), auth=B)
    check(s == 400 and b"bad-action" in d, "an action outside the grammar -> 400")
    s, _h, d = call("POST", "/action", json.dumps({"mac": "GD1", "action": "garage"}).encode(), auth=B)
    j = json.loads(d.decode("utf-8"))
    check(s == 200 and j["ok"] and j["action_key"] == "garage_door_trigger" and actions == [("GD1", "garage")], "the garage: ONE cloud action, garage_door_trigger, no ticket, no stream, no video (%r)" % j)
    s, _h, d = call("POST", "/action", json.dumps({"mac": "GD1", "action": "garage"}).encode(), auth=B)
    j = json.loads(d.decode("utf-8"))
    check(s == 429 and j["error"] == "too-soon" and j["retry_in"] == 3 and len(actions) == 1, "a second tap inside the window -> 429 too-soon with the seconds; the door never cycles twice")
    s, _h, d = call("POST", "/action", json.dumps({"mac": "FY1", "action": "garage"}).encode(), auth=B)
    check(s == 400 and b"no-garage-controller" in d, "a camera with no controller cannot be told to open a door")
    s, _h, d = call("POST", "/action", json.dumps({"mac": "OFF1", "action": "siren_on"}).encode(), auth=B)
    check(s == 409 and b"device-offline" in d, "an offline device is said as 409 device-offline, not swallowed")
    s, _h, d = call("POST", "/action", json.dumps({"mac": "ZZZ", "action": "siren_on"}).encode(), auth=B)
    check(s == 400 and b"unknown-device" in d, "an unknown device -> 400")
    s, _h, d = call("POST", "/action", json.dumps({"mac": "FY1", "action": "power_off"}).encode(), auth=B)
    check(s == 200 and actions[-1] == ("FY1", "power_off"), "siren/power actions go through the same door")
    s, _h, d = call("GET", "/health")
    check(json.loads(d.decode("utf-8")).get("wyze_cloud") == "ready", "/health says the cloud road is ready")
    # the re-add from what the NAS kept: nobody types anything twice
    s, _h, d = call("POST", "/setup/wyze/again")
    check(s == 401, "POST /setup/wyze/again needs the bearer")
    forms_before = dict(seen.get("wyze_form") or {})
    s, _h, d = call("POST", "/setup/wyze/again", auth=B)
    j = json.loads(d.decode("utf-8"))
    check(s == 200 and j["ok"] and j.get("again") is True and len(j["cameras"]) == 2 and all(c["existing"] or c["registered"] for c in j["cameras"]), "the re-add signs in with the KEPT values: a camera still in go2rtc is kept, a missing one is registered again (nothing lost, nothing typed) (%r)" % [(c["id"], c["existing"]) for c in j["cameras"]])
    check(j["persisted"] == 2 and ("front_yard", "wyze://192.168.1.50?uid=ABC&enr=ENRSECRET&mac=AA:BB&model=HL_CAM4&dtls=true") in seen["puts"], "a camera go2rtc already lists is PUT anyway, so the config on disk carries it (DR-0779: the 07:31 loss)")
    check(seen["wyze_form"]["email"] == "d@example.com" and seen["wyze_form"]["password"] == "pw-secret" and forms_before != {} , "go2rtc received the kept sign-in, not an empty form")
    check(len(persisted) == kept_n, "a re-add from the kept values writes the secrets file again: never (still %d)" % len(persisted))
    heal["creds"] = None
    heal["client"] = None
    s, _h, d = call("POST", "/setup/wyze/again", auth=B)
    check(s == 503 and b"no-credentials" in d, "with nothing kept, the re-add says so (503 no-credentials) and sends nothing")
    s, _h, d = call("GET", "/devices", auth=B)
    check(s == 503 and b"no-credentials" in d, "with nothing kept, /devices says no-credentials, never an empty list painted")
    s, _h, d = call("GET", "/health")
    check(json.loads(d.decode("utf-8")).get("wyze_cloud") == "no-credentials", "/health says the cloud road waits on the sign-in")
    # the self-heal: zero streams + kept sign-in -> the cameras come back by themselves
    heal["creds"] = dict(persisted[0]); heal["client"] = "fake"
    seen["empty_streams"] = True
    r = self_heal_once("http://127.0.0.1:%d" % fp, port, token, log=lambda *_a: None)
    seen["empty_streams"] = False
    check(r == "re-added" or r == "no-credentials", "self-heal on an EMPTY restreamer re-adds from the kept sign-in (here: %s; 'no-credentials' only because the real loader reads the box's own file, which this sandbox lacks)" % r)
    r = self_heal_once("http://127.0.0.1:%d" % fp, port, token, log=lambda *_a: None)
    check(r == "has-streams", "self-heal on a restreamer WITH streams touches nothing (%s)" % r)

    print("=== 8h. access is given and taken back, never a password (DR-0778): grants ===")
    fake_cloud.last = {}
    gp = os.path.join(rec_tmp, "camera-grants.json")
    s, _h, d = call("POST", "/grants", json.dumps({"name": "Christina"}).encode())
    check(s == 401, "making a grant needs the owner's bearer")
    s, _h, d = call("POST", "/grants", json.dumps({"name": "   "}).encode(), auth=B)
    check(s == 400 and b"missing-name" in d, "a grant needs a name (whose it is)")
    s, _h, d = call("POST", "/grants", json.dumps({"name": "x", "cameras": ["../etc"]}).encode(), auth=B)
    check(s == 400 and b"bad-cameras" in d, "a camera outside the grammar is refused")
    s, _h, d = call("POST", "/grants", json.dumps({"name": "x", "days": 99999}).encode(), auth=B)
    check(s == 400 and b"bad-days" in d, "an absurd expiry is refused")
    s, _h, d = call("POST", "/grants", json.dumps({"name": "Christina", "cameras": "*", "days": 0, "actions": True}).encode(), auth=B)
    ga = json.loads(d.decode("utf-8"))
    check(s == 200 and GRANT_TOKEN.match(ga.get("token", "")) and ga["grant"]["expires"] == 0 and ga["grant"]["actions"] is True and ga["link_path"] == GRANT_LINK_PATH, "the owner makes a grant: every camera, until taken back, doors too; the token is shown once with the link path")
    check((os.stat(gp).st_mode & 0o777) == 0o600 and ga["token"] not in open(gp).read(), "the grants file is 0600 and never holds the token itself (only its salt)")
    s, _h, d = call("POST", "/grants", json.dumps({"name": "Neighbor", "cameras": ["front_yard"], "days": 7, "actions": False}).encode(), auth=B)
    gb = json.loads(d.decode("utf-8"))
    check(s == 200 and gb["grant"]["cameras"] == ["front_yard"] and gb["grant"]["expires"] == int(clock["now"] + 7 * 86400), "a second grant: one camera, seven days, no doors")
    s, _h, d = call("GET", "/grants", auth=B)
    gl = json.loads(d.decode("utf-8"))
    check(s == 200 and [g["name"] for g in gl["grants"]] == ["Neighbor", "Christina"] and all("token" not in g and "salt" not in g for g in gl["grants"]), "the owner lists who has access, newest first, never a token or salt (%r)" % [g["name"] for g in gl["grants"]])
    s, _h, d = call("GET", "/grants", auth="Bearer " + ga["token"])
    check(s == 401, "a grant holder cannot list grants")
    s, _h, d = call("POST", "/grants", json.dumps({"name": "sneak"}).encode(), auth="Bearer " + ga["token"])
    check(s == 401, "a grant holder cannot make grants")
    A = "Bearer " + ga["token"]; Bn = "Bearer " + gb["token"]
    s, _h, d = call("GET", "/list", auth=A)
    j = json.loads(d.decode("utf-8"))
    check(s == 200 and [c["id"] for c in j["cameras"]] == ["doorbell", "front_yard", "garage"] and j["access"]["name"] == "Christina" and j["access"]["actions"] is True, "an every-camera grant lists every camera and names itself")
    s, _h, d = call("GET", "/list", auth=Bn)
    j = json.loads(d.decode("utf-8"))
    check(s == 200 and [c["id"] for c in j["cameras"]] == ["front_yard"] and j["access"]["expires"] > 0 and j["access"]["actions"] is False, "a one-camera grant lists only its camera")
    s, _h, d = call("POST", "/ticket", json.dumps({"camera": "front_yard"}).encode(), auth=Bn)
    check(s == 200 and ticket_ok(token, "front_yard", json.loads(d.decode("utf-8"))["ticket"]), "a grant mints a live ticket for its camera")
    s, _h, d = call("POST", "/ticket", json.dumps({"camera": "garage"}).encode(), auth=Bn)
    check(s == 403 and b"not-your-camera" in d, "...and never for another camera (403 not-your-camera)")
    s, _h, d = call("GET", "/snap/front_yard.jpg", auth=Bn)
    check(s == 200, "a grant fetches its camera's frame")
    s, _h, d = call("GET", "/snap/garage.jpg", auth=Bn)
    check(s == 403, "...and not another's")
    s, _h, d = call("GET", "/why/front_yard", auth=Bn)
    check(s == 200, "a grant may ask why its camera is blank")
    s, _h, d = call("GET", "/why/garage", auth=Bn)
    check(s == 403, "...not another's")
    exits_before = len(exits)
    for pth, meth, body in (("/recording", "GET", None), ("/rec/front_yard", "GET", None), ("/grants", "GET", None), ("/setup/wyze/again", "POST", None), ("/restart", "POST", None), ("/recording", "PUT", b"{}")):
        s, _h, d = call(meth, pth, body, auth=A)
        check(s == 401, "a grant is refused at %s %s (owner only)" % (meth, pth))
    time.sleep(0.7)
    check(len(exits) == exits_before, "the grant's /restart attempt did not restart anything")
    s, _h, d = call("GET", "/devices", auth=Bn)
    check(s == 403 and b"no-actions" in d, "a grant without the doors gets no device list")
    s, _h, d = call("POST", "/action", json.dumps({"mac": "GD1", "action": "garage"}).encode(), auth=Bn)
    check(s == 403 and actions.count(("GD1", "garage")) == 1, "...and cannot tell a door to move")
    s, _h, d = call("GET", "/devices", auth=A)
    j = json.loads(d.decode("utf-8"))
    check(s == 200 and j["garages"] == 1, "a grant with the doors lists them")
    s, _h, d = call("POST", "/action", json.dumps({"mac": "GD1", "action": "garage"}).encode(), auth=A)
    check(s == 200 and actions.count(("GD1", "garage")) == 2, "...and opens the door, no password ever shared")
    s, _h, d = call("POST", "/grants", json.dumps({"name": "Front only, doors", "cameras": ["front_yard"], "actions": True}).encode(), auth=B)
    gc = json.loads(d.decode("utf-8"))
    s, _h, d = call("POST", "/action", json.dumps({"mac": "GD1", "action": "garage"}).encode(), auth="Bearer " + gc["token"])
    check(s == 403 and b"not-your-camera" in d, "a doors grant for ONE camera cannot move another camera's door")
    s, _h, d = call("GET", "/devices", auth="Bearer " + gc["token"])
    check(s == 200 and json.loads(d.decode("utf-8"))["count"] == 1, "...and sees only its camera's device")
    # revoke: out on the next request
    s, _h, d = call("POST", "/grants/%s/revoke" % gb["id"], auth=Bn)
    check(s == 401, "a holder cannot revoke")
    s, _h, d = call("POST", "/grants/%s/revoke" % gb["id"], auth=B)
    check(s == 200 and json.loads(d.decode("utf-8"))["grant"]["revoked"] > 0, "the owner takes access back")
    s, _h, d = call("GET", "/list", auth=Bn)
    check(s == 401, "the revoked link opens nothing on its next request")
    s, _h, d = call("POST", "/grants/aaaaaaaaaaaa/revoke", auth=B)
    check(s == 404, "revoking an unknown id -> 404")
    # expiry on the clock; tampering
    s, _h, d = call("POST", "/grants", json.dumps({"name": "Day pass", "days": 1}).encode(), auth=B)
    gd_ = json.loads(d.decode("utf-8"))
    s, _h, d = call("GET", "/list", auth="Bearer " + gd_["token"])
    check(s == 200, "a day pass works today")
    clock["now"] += 2 * 86400
    s, _h, d = call("GET", "/list", auth="Bearer " + gd_["token"])
    check(s == 401, "...and is refused after its day")
    clock["now"] -= 2 * 86400
    bad = ga["token"][:-1] + ("0" if ga["token"][-1] != "0" else "1")
    s, _h, d = call("GET", "/list", auth="Bearer " + bad)
    check(s == 401, "a tampered token is refused")
    s, _h, d = call("GET", "/list", auth="Bearer g.aaaaaaaaaaaa." + "0" * 32)
    check(s == 401, "an unknown grant id is refused")
    check(grant_check("", ga["token"], clock["now"], gp) is None, "an empty secret admits nobody")
    s, _h, d = call("GET", "/grants", auth=B)
    check(any(g["last_used"] > 0 for g in json.loads(d.decode("utf-8"))["grants"]), "the owner sees when a grant was last used")

    print("=== 8i. a screen pairs with the owner's phone by a code (DR-0778): no key typed on the TV ===")
    PAIR_STATE["last"] = 0.0
    s, _h, d = call("POST", "/pair")
    pj = json.loads(d.decode("utf-8"))
    check(s == 200 and PAIR_CODE.match(pj.get("code", "")) and len(pj.get("watch", "")) == 32 and pj["expires_in"] == int(PAIR_TTL_SECONDS) and pj["link_path"] == PAIR_LINK_PATH, "a screen with no key asks for a code and gets six readable letters, a private watch token, and the link path for the QR (%r)" % pj.get("code"))
    s, _h, d = call("POST", "/pair")
    check(s == 429 and b"pair-too-soon" in d, "a second code inside the throttle is refused (nobody floods the table)")
    code, watch = pj["code"], pj["watch"]
    s, _h, d = call("GET", "/pair/%s?w=%s" % (code, watch))
    check(s == 200 and json.loads(d.decode("utf-8")) == {"status": "waiting"}, "the screen polls: waiting")
    s, _h, d = call("GET", "/pair/%s?w=%s" % (code, "0" * 32))
    check(s == 404, "a poll without the screen's own watch token learns nothing")
    s, _h, d = call("GET", "/pair/ZZZZZZ?w=" + watch)
    check(s == 404, "an unknown code is expired")
    s, _h, d = call("GET", "/pair")
    check(s == 401, "the pending list needs the owner")
    s, _h, d = call("GET", "/pair", auth=B)
    check(s == 200 and [p["code"] for p in json.loads(d.decode("utf-8"))["pending"]] == [code], "the owner sees the code that is waiting")
    s, _h, d = call("POST", "/pair/%s/approve" % code, json.dumps({"name": "Living room TV"}).encode())
    check(s == 401, "approving needs the owner's bearer")
    s, _h, d = call("POST", "/pair/%s/approve" % code, json.dumps({"name": "Living room TV"}).encode(), auth="Bearer " + ga["token"])
    check(s == 401, "a grant holder cannot approve a screen")
    s, _h, d = call("POST", "/pair/ABCDEF/approve", json.dumps({"name": "x"}).encode(), auth=B)
    check(s == 404 and b"no-such-code" in d, "approving a code that was never shown -> 404")
    gl_before = len(grants_list(gp))
    s, _h, d = call("POST", "/pair/%s/approve" % code, json.dumps({"name": "Living room TV", "cameras": "*", "days": 0, "actions": False}).encode(), auth=B)
    aj = json.loads(d.decode("utf-8"))
    check(s == 200 and aj["ok"] and aj["grant"]["name"] == "Living room TV" and "token" not in aj and len(grants_list(gp)) == gl_before + 1, "the owner approves: a grant is made and listed; the phone never sees the token (the screen gets it)")
    s, _h, d = call("POST", "/pair/%s/approve" % code, json.dumps({"name": "again"}).encode(), auth=B)
    check(s == 404, "a code is approved once")
    s, _h, d = call("GET", "/pair/%s?w=%s" % (code, watch))
    hj = json.loads(d.decode("utf-8"))
    check(s == 200 and hj["status"] == "approved" and GRANT_TOKEN.match(hj.get("token", "")), "the screen's next poll hands it the grant")
    s, _h, d = call("GET", "/list", auth="Bearer " + hj["token"])
    check(s == 200 and json.loads(d.decode("utf-8"))["access"]["name"] == "Living room TV", "...and the screen opens the cameras with it, nothing typed on the TV")
    s, _h, d = call("GET", "/pair/%s?w=%s" % (code, watch))
    check(s == 404, "the token is handed over ONCE; the code is gone")
    PAIR_STATE["last"] = 0.0
    s, _h, d = call("POST", "/pair")
    pj2 = json.loads(d.decode("utf-8"))
    clock["now"] += PAIR_TTL_SECONDS + 1
    s, _h, d = call("GET", "/pair/%s?w=%s" % (pj2["code"], pj2["watch"]))
    check(s == 404, "a code nobody approved dies on the clock")
    clock["now"] -= PAIR_TTL_SECONDS + 1

    print("=== 8j. what memory holds, the config must hold (DR-0787): the self-heal writes the streams the file lacks ===")
    check(config_stream_names("api:\n  listen: :1984\nstreams: {}\nwyze:\n  email: x\n") == set(), "`streams: {}` defines no stream")
    check(config_stream_names("streams:\n  front_yard: wyze://a\n  \"back door\": rtsp://b\n  # note\nwyze:\n  email: x\n") == {"front_yard", "back door"}, "the defined ids are the keys under streams:, quoted or not, comments skipped")
    seen.pop("puts", None); seen["config_streams"] = []
    r = self_heal_once("http://127.0.0.1:%d" % fp, port, token, log=lambda *_a: None)
    put_names = sorted(n for n, _u in seen.get("puts", []))
    check(r == "wrote-3" and put_names == ["doorbell", "front_yard", "garage"], "memory holds 4, the config 0: the three with a source url are PUT with go2rtc's own url, the one without is skipped (%s, %s)" % (r, put_names))
    check(("front_yard", "wyze://192.168.1.50?uid=ABC&enr=SECRET&mac=AA&model=HL_CAM4&dtls=true") in seen.get("puts", []), "the PUT carries the exact source url go2rtc reported, so the config matches memory")
    seen.pop("puts", None); seen["config_streams"] = ["front_yard", "doorbell", "garage", "bad id/with slash"]
    r = self_heal_once("http://127.0.0.1:%d" % fp, port, token, log=lambda *_a: None)
    check(r == "has-streams" and not seen.get("puts"), "when the config already defines every stream, nothing is written (%s)" % r)
    seen.pop("puts", None); del seen["config_streams"]
    r = self_heal_once("http://127.0.0.1:%d" % fp, port, token, log=lambda *_a: None)
    check(r == "has-streams" and not seen.get("puts"), "a go2rtc without /api/config is left alone, never guessed at (%s)" % r)
    # DR-0789: go2rtc refuses (the seed's `streams: {}`), so the file is written directly, byte-for-byte otherwise.
    seed = "api:\n  listen: \"127.0.0.1:1984\"\nrtsp:\n  listen: \"127.0.0.1:8554\"\nwebrtc:\n  listen: \"\"\nlog:\n  level: info\nstreams: {}\nwyze:\n  email: x@y.z\n  api_key: SECRET\n"
    check(write_streams_block(seed, []) == seed, "nothing to add leaves the file byte for byte")
    check(write_streams_block("api:\n  listen: x\n", [("a", "rtsp://x")]) is None, "a file with no streams key is never guessed at")
    out_txt = write_streams_block(seed, [("front_yard", "wyze://192.168.1.50?uid=ABC&enr=SECRET&dtls=true"), ("bad id/with slash", "rtsp://x"), ("garage", "rtsp://admin:S@192.168.1.60/live")])
    check(out_txt.count("streams:\n  front_yard: \"wyze://192.168.1.50?uid=ABC&enr=SECRET&dtls=true\"\n  garage: \"rtsp://admin:S@192.168.1.60/live\"\nwyze:") == 1 and "{}" not in out_txt, "`streams: {}` becomes the block form with each url double-quoted; an unsafe id is skipped; the wyze: block follows untouched")
    check(config_stream_names(out_txt) == {"front_yard", "garage"}, "the written block reads back as defined")
    check(write_streams_block(out_txt, [("front_yard", "wyze://again"), ("doorbell", "ring://x")]).count("front_yard") == 1, "a stream already defined is not written twice")
    import tempfile
    with tempfile.TemporaryDirectory() as tmpd:
        cfgp = os.path.join(tmpd, "go2rtc.yaml")
        with open(cfgp, "w", encoding="utf-8") as f:
            f.write(seed)
        seen.pop("puts", None); seen["config_streams"] = []; seen["put_refuses"] = True
        r = persist_missing_streams("http://127.0.0.1:%d" % fp, {
            "front_yard": {"producers": [{"url": "wyze://192.168.1.50?uid=ABC&enr=SECRET&mac=AA&model=HL_CAM4&dtls=true"}]},
            "doorbell": {"producers": [{"url": "ring://x@y.z?device_id=1&refresh_token=SECRET"}]},
            "garage": {"producers": [{"url": "rtsp://admin:SECRET@192.168.1.60/live"}]},
            "bad id/with slash": {"producers": []},
        }, log=lambda *_a: None, config_path=cfgp)
        with open(cfgp, encoding="utf-8") as f:
            after = f.read()
        check(r == "wrote-3" and len(seen.get("puts", [])) == 3, "go2rtc refused all three PUTs and the three were written into go2rtc.yaml directly (%s)" % r)
        check(config_stream_names(after) == {"front_yard", "doorbell", "garage"} and after.startswith("api:\n  listen: \"127.0.0.1:1984\"") and after.endswith("wyze:\n  email: x@y.z\n  api_key: SECRET\n"), "the file holds the three under streams: and every other byte is as it was")
        check(PERSIST_LAST.get("refused", "").startswith("HTTP 400") and PERSIST_LAST.get("direct") == 3 and PERSIST_LAST.get("wrote") == 0, "/health carries what happened: the refusal's status and text, and how many were written directly (%r)" % (PERSIST_LAST,))
        check(not os.path.exists(cfgp + ".tmp"), "the temp file is renamed into place, not left behind")
        seen["put_refuses"] = False; seen.pop("puts", None); seen["config_streams"] = []
        r = persist_missing_streams("http://127.0.0.1:%d" % fp, {"front_yard": {"producers": [{"url": "wyze://x?enr=S"}]}}, log=lambda *_a: None, config_path=cfgp)
        check(r == "wrote-1" and PERSIST_LAST.get("direct") == 0 and PERSIST_LAST.get("refused") == "", "when go2rtc accepts the PUT nothing is written directly")
    seen.pop("config_streams", None); seen["put_refuses"] = False

    print("=== 8k. clip downloads by size (DR-0797): tiers, estimates, made once, served with Range, pruned ===")
    os.makedirs(os.path.join(rec_root, "front_yard"), exist_ok=True)
    with open(os.path.join(rec_root, "front_yard", "2026-10-07T06-40-00.mp4"), "wb") as fh:
        fh.write(bytes(range(256)) * 40)
    with open(os.path.join(rec_root, "front_yard", "2026-10-07T06-50-00.mp4"), "wb") as fh:
        fh.write(b"\x01" * 20480)
    est = estimate_sizes(100 * 1000 * 1000, 600)
    check(est["small"] == 45000000 and est["medium"] == 100000000 and est["large"] == 100000000, "an estimate is the tier's rate for the length, never more than the original (600 s: small 45 MB; medium/large capped at the 100 MB original)")
    check(estimate_sizes(0, 60) == {"small": 4500000, "medium": 11250000, "large": 22500000, "xlarge": 45000000, "uhd": 90000000}, "with no original size known, the estimate is the rate alone; 2.5K and 4K tiers are there for cameras that record that large")
    argv4k = transcode_argv("front_yard", "2026-10-07T06-40-00.mp4", "uhd", docker=None, host_root=rec_root)
    check(argv4k[argv4k.index("-vf") + 1] == "scale=-2:'min(2160,ih)'" and argv4k[argv4k.index("-crf") + 1] == "20", "uhd = 2160p tall at most (a 1080p camera gives its full picture, never stretched), CRF 20")
    argv = transcode_argv("front_yard", "2026-10-07T06-40-00.mp4", "small", docker="/usr/local/bin/docker")
    check(argv[:5] == ["/usr/local/bin/docker", "exec", "-i", GO2RTC_CONTAINER, "ffmpeg"] and argv[len(argv) - argv[::-1].index("-i")] == "/recordings/front_yard/2026-10-07T06-40-00.mp4", "with docker: the container's ffmpeg reads the clip at its container path")
    check(argv[argv.index("-vf") + 1] == "scale=-2:'min(480,ih)'" and argv[argv.index("-crf") + 1] == "30" and argv[-1] == "/recordings/.derived/front_yard/2026-10-07T06-40-00.small.mp4.part", "small = 480p tall at most (never upscaled), CRF 30, written to a .part under .derived")
    argv2 = transcode_argv("front_yard", "2026-10-07T06-40-00.mp4", "large", docker=None, host_root=rec_root)
    check(argv2[0] == "ffmpeg" and argv2[argv2.index("-vf") + 1] == "scale=-2:'min(1080,ih)'" and argv2[argv2.index("-crf") + 1] == "23" and argv2[-1] == os.path.join(rec_root, ".derived", "front_yard", "2026-10-07T06-40-00.large.mp4.part"), "without docker: PATH ffmpeg on host paths; large = 1080p, CRF 23")
    check("+faststart" in argv and "libx264" in argv and "aac" in argv, "faststart so a phone plays it as it arrives; x264 video, AAC audio")
    check(derived_path(rec_root, "front_yard", "notes.txt", "small") is None and derived_path(rec_root, "front_yard", "2026-10-07T06-40-00.mp4", "tiny") is None and derived_path(rec_root, "../x", "2026-10-07T06-40-00.mp4", "small") is None, "a derived path exists only for a clip name, a known size and a camera id that pass their grammar")
    check(download_name("front_yard", "2026-10-07T06-40-00.mp4", "small") == "front_yard-2026-10-07T06-40-00-small.mp4" and download_name("front_yard", "2026-10-07T06-40-00.mp4") == "front_yard-2026-10-07T06-40-00-original.mp4", "the saved file is named camera-time-size")
    s, _h, d = call("GET", "/rec/front_yard", auth=B)
    j = json.loads(d.decode("utf-8"))
    clock["now"] = j["clips"][1]["start"] + 120
    s, _h, d = call("GET", "/rec/front_yard", auth=B)
    j = json.loads(d.decode("utf-8"))
    check(s == 200 and j["clips"][0]["seconds"] == 600 and j["clips"][1]["seconds"] == 120 and j["clips"][0]["sizes"]["small"] == 10240 and j["size_tiers"][0][0] == "small", "the list carries each clip's seconds (to the next clip; the newest to now) and its tier estimates")
    t = mint_ticket(token, "front_yard")
    s, _h, d = call("GET", "/rec/front_yard/2026-10-07T06-40-00.mp4?sizes=1&t=" + t)
    j = json.loads(d.decode("utf-8"))
    check(s == 200 and j["original"] == 10240 and j["seconds"] == 600 and set(j["tiers"]) == {"small", "medium", "large", "xlarge", "uhd"} and all(v["state"] == "absent" for v in j["tiers"].values()) and j["tiers"]["medium"]["label"] == "Medium (720p)" and j["download_name"].endswith("-original.mp4"), "?sizes=1 names the original, the seconds, and every tier with its estimate and state")
    s, _h, d = call("GET", "/rec/front_yard/2026-10-07T06-40-00.mp4?size=tiny&t=" + t)
    check(s == 400 and b"bad-size" in d, "an unknown size -> 400 bad-size")
    s, _h, d = call("GET", "/rec/front_yard/2026-10-07T06-40-00.mp4?size=small&t=" + t)
    j = json.loads(d.decode("utf-8"))
    check(s == 202 and j["status"] in ("queued", "making") and j["size"] == "small" and j["retry_in"] == 3, "the first ask for a size answers 202 with its place in the line")
    deadline = time.time() + 5
    while time.time() < deadline:
        s, h, d = call("GET", "/rec/front_yard/2026-10-07T06-40-00.mp4?size=small&dl=1&t=" + t)
        if s == 200:
            break
        time.sleep(0.05)
    check(s == 200 and h.get("content-type") == "video/mp4" and d.startswith(b"DERIVED-small") and h.get("content-disposition") == 'attachment; filename="front_yard-2026-10-07T06-40-00-small.mp4"', "once made it is served as video/mp4; dl=1 names the file for the phone")
    check(os.path.isfile(derived_path(rec_root, "front_yard", "2026-10-07T06-40-00.mp4", "small")) and not os.path.exists(derived_path(rec_root, "front_yard", "2026-10-07T06-40-00.mp4", "small") + ".part"), "the derived file is under .derived and the .part was renamed away")
    n_runs = len(fake_ffmpeg["argv"])
    s, h, d = call("GET", "/rec/front_yard/2026-10-07T06-40-00.mp4?size=small&t=" + t, extra={"Range": "bytes=0-7"})
    check(s == 206 and d == b"DERIVED-" and len(fake_ffmpeg["argv"]) == n_runs, "a second ask serves the kept file (Range works; ffmpeg is not run again)")
    s, _h, d = call("GET", "/rec/front_yard/2026-10-07T06-40-00.mp4?sizes=1&t=" + t)
    j = json.loads(d.decode("utf-8"))
    check(j["tiers"]["small"]["state"] == "ready" and j["tiers"]["small"]["bytes"] == 2000 + len("DERIVED-small") and j["tiers"]["medium"]["state"] == "absent", "?sizes=1 now says small is ready with its real bytes")
    s, _h, d = call("GET", "/rec/front_yard/2026-10-07T06-40-00.mp4?size=small&t=" + mint_ticket(token, "garage"))
    check(s == 401, "another camera's ticket never opens a derived clip either")
    s, _h, d = call("GET", "/rec/front_yard/2026-10-07T07-00-00.mp4?size=small&t=" + t)
    check(s == 404, "a size of a clip that is not on disk -> 404, nothing queued")
    fake_ffmpeg["fail"] = True
    call("GET", "/rec/front_yard/2026-10-07T06-40-00.mp4?size=medium&t=" + t)
    deadline = time.time() + 5
    while time.time() < deadline:
        s, h, d = call("GET", "/rec/front_yard/2026-10-07T06-40-00.mp4?size=medium&t=" + t)
        if s != 202:
            break
        time.sleep(0.05)
    j = json.loads(d.decode("utf-8"))
    check(s == 500 and j.get("error") == "transcode-failed" and "Invalid data" in j.get("detail", "") and "SECRET" not in j.get("detail", ""), "ffmpeg's failure reaches the app in its own words, scrubbed of credentials (%s %r)" % (s, d[:160]))
    fake_ffmpeg["fail"] = False
    s, _h, d = call("GET", "/rec/front_yard/2026-10-07T06-40-00.mp4?size=medium&t=" + t)
    check(s == 500, "a failed tier stays failed on a plain ask (the app shows why); it is not re-run behind the viewer's back")
    call("GET", "/rec/front_yard/2026-10-07T06-40-00.mp4?size=medium&retry=1&t=" + t)
    deadline = time.time() + 5
    while time.time() < deadline:
        s, h, d = call("GET", "/rec/front_yard/2026-10-07T06-40-00.mp4?size=medium&t=" + t)
        if s == 200:
            break
        time.sleep(0.05)
    check(s == 200 and d.startswith(b"DERIVED-medium"), "a failed tier is tried again on the next ask, and succeeds when ffmpeg does (%s %r)" % (s, d[:60]))
    s, _h, d = call("GET", "/recording", auth=B)
    j = json.loads(d.decode("utf-8"))
    check(j["derived"]["files"] == 2 and j["derived"]["budget_bytes"] == 10 * 1024 * 1024 and j["derived"]["sizes"][2][0] == "large" and j["segment_seconds"] == int(REC_SEGMENT_SECONDS), "GET /recording carries the derived store: files, budget, the tiers, the segment length")
    derived.budget = 2100
    removed = derived.prune()
    check(removed == 1 and len([f for f in derived.files() if not f[0].endswith(".part")]) == 1 and derived.status("front_yard", "2026-10-07T06-40-00.mp4", "medium")[0] == "ready", "over budget, the OLDEST derived file goes first (small, made first); the newest stays")
    derived.budget = 10 * 1024 * 1024
    os.remove(os.path.join(rec_root, "front_yard", "2026-10-07T06-40-00.mp4"))
    removed = derived.prune()
    check(removed == 1 and derived.status("front_yard", "2026-10-07T06-40-00.mp4", "medium")[0] == "absent", "a derived file whose source clip is gone is an orphan and is removed")
    s, _h, d = call("GET", "/health")
    j = json.loads(d.decode("utf-8"))
    check("derived" in j and "stream_health" in j and j["derived"]["files"] == 0, "/health carries the derived store and the stream health summary")

    print("=== 8l. the stream health log (DR-0798): go2rtc's numbers over time, drops only while watched, codecs, the H.264 twin ===")
    hl = StreamHealth(now=lambda: 0, interval=15)
    cam = lambda b, watchers, present=True, medias=("video, recvonly, H265 Main",): {"producers": ([{"url": "wyze://x?enr=S", "bytes_recv": b, "medias": list(medias)}] if present else []), "consumers": [{"type": "mp4"}] * watchers}  # noqa: E731
    hl.observe({"front_yard": cam(1000, 1)}, t=0)
    hl.observe({"front_yard": cam(3000, 1)}, t=15)
    c = hl.camera("front_yard")
    check(c["kbps"] == 1 and c["up_pct"] == 100 and c["drops_1h"] == 0 and c["codecs"] == ["H265"] and c["hevc_only"] is True and c["present"] is True and c["watchers"] == 1, "two samples: 2000 bytes in 15 s is 1 kbit/s, up 100%, codec H265 only")
    hl.observe({"front_yard": cam(3000, 1)}, t=30)
    c = hl.camera("front_yard")
    check(c["drops_1h"] == 1 and c["drop_kinds"] == ["bytes-frozen"] and c["up_pct"] == 50, "bytes that do not move while someone watches is a drop (bytes-frozen); up falls to 50%")
    hl.observe({"front_yard": cam(0, 1, present=False)}, t=45)
    hl.observe({"front_yard": cam(2000, 1)}, t=60)
    c = hl.camera("front_yard")
    check(c["drops_1h"] == 2 and c["drop_kinds"] == ["bytes-frozen", "producer-gone"] and c["kbps"] == 1, "a producer gone while watched is a drop (producer-gone); a fresh producer counting from 0 is not one more")
    hl.observe({"front_yard": cam(1500, 0)}, t=75)
    c = hl.camera("front_yard")
    check(c["drops_1h"] == 3 and c["drop_kinds"] == ["bytes-frozen", "producer-gone", "producer-restarted"] and c["restarts"] == 1 and c["present"] is True and c["watchers"] == 0 and c["up_pct"] == 60, "a producer whose count fell back while watched restarted (producer-restarted); up is 3 of 5 watched samples")
    sm = hl.summary()
    check(sm["drops_1h_total"] == 3 and len(sm["events"]) == 3 and sm["events"][0]["camera"] == "front_yard" and sm["events"][0]["kind"] == "bytes-frozen" and sm["events"][-1]["kind"] == "producer-restarted" and sm["sampled_at"] == 75 and sm["interval_s"] == 15, "the summary counts the drops and keeps the events in order")
    hl.observe({"front_yard": cam(1900, 0)}, t=90)
    c = hl.camera("front_yard")
    check(c["drops_1h"] == 3 and c["kbps"] == 1 and c["watched_samples"] == 5, "with nobody watching, moving bytes add no drop and the last watched rate stands")
    hl.observe({"front_yard": cam(0, 0, present=False)}, t=105)
    check(hl.camera("front_yard")["drops_1h"] == 3 and hl.camera("front_yard")["present"] is False, "a producer let go while NOBODY watches is go2rtc's idle, not a drop")
    hl.observe({"front_yard": cam(0, 0, present=False)}, t=3700)
    check(hl.camera("front_yard")["drops_1h"] == 0 and hl.camera("front_yard")["watched_samples"] == 0, "an hour on, the old drops and samples have aged out of the log")
    check(codecs_of({"producers": [{"medias": ["video, recvonly, H264 High 4.1, H265", "audio, recvonly, PCMU"]}]}) == ["H264", "H265", "PCMU"] and codecs_of({"producers": [{"medias": ["video, recvonly, HEVC"]}]}) == ["H265"] and codecs_of({}) == [], "codecs are read from go2rtc's medias strings; HEVC reads as H265")
    hl2 = StreamHealth(now=lambda: 0)
    hl2.observe({"garage": cam(10, 1, medias=("video, recvonly, H264 High 4.1",))}, t=0)
    hl2.observe({"garage": cam(20, 1, medias=("video, recvonly, H264 High 4.1",))}, t=15)
    check(hl2.camera("garage")["hevc_only"] is False and hl2.summary()["cameras"]["garage"]["codecs"] == ["H264"], "a camera that sends H264 needs no twin")
    seen.pop("puts", None); seen["put_refuses"] = False
    added = ensure_h264_twins("http://127.0.0.1:%d" % fp, ["front_yard", "garage"], hl.summary(), log=lambda *a: None)
    check(added == ["front_yard_h264"] and seen.get("puts") == [("front_yard_h264", "ffmpeg:front_yard#video=h264")], "a camera that sends ONLY H.265 gets its H.264 twin PUT into go2rtc: ffmpeg:<id>#video=h264")
    seen.pop("puts", None)
    added = ensure_h264_twins("http://127.0.0.1:%d" % fp, ["front_yard", "front_yard_h264"], hl.summary(), log=lambda *a: None)
    check(added == [] and not seen.get("puts"), "a twin that exists is not added twice")
    twin_cfg = os.path.join(rec_tmp, "go2rtc-twin.yaml")
    os.makedirs(rec_tmp, exist_ok=True)
    with open(twin_cfg, "w") as fh:
        fh.write("api:\n  listen: \"127.0.0.1:1984\"\nstreams: {}\nwyze:\n  email: x\n")
    seen["put_refuses"] = True
    added = ensure_h264_twins("http://127.0.0.1:%d" % fp, ["front_yard"], hl.summary(), log=lambda *a: None, config_path=twin_cfg)
    seen["put_refuses"] = False
    with open(twin_cfg) as fh:
        twin_text = fh.read()
    check(added == ["front_yard_h264"] and "  front_yard_h264: " in twin_text and "ffmpeg:front_yard#video=h264" in twin_text and "streams: {}" not in twin_text and "wyze:" in twin_text, "when go2rtc refuses the PUT (the streams: {} case, DR-0789) the twin is written into the config directly, every other line kept")
    s, _h, d = call("GET", "/streams/health")
    check(s == 401, "the stream health log needs the bearer (or a grant)")
    health_log.observe({"front_yard": cam(1000, 1), "garage": cam(10, 0, medias=("video, recvonly, H264",))}, t=clock["now"])
    health_log.observe({"front_yard": cam(1000, 1), "garage": cam(10, 0, medias=("video, recvonly, H264",))}, t=clock["now"] + 15)
    s, _h, d = call("GET", "/streams/health", auth=B)
    j = json.loads(d.decode("utf-8"))
    check(s == 200 and j["cameras"]["front_yard"]["drops_1h"] == 1 and j["cameras"]["front_yard"]["hevc_only"] is True and j["cameras"]["garage"]["drops_1h"] == 0 and j["events"][0]["camera"] == "front_yard" and j["interval_s"] == 15, "GET /streams/health: every camera's log and the drop events, from the sampler the handler holds")
    seen["with_twin"] = True
    s, _h, d = call("GET", "/list", auth=B)
    j = json.loads(d.decode("utf-8"))
    ids = [c["id"] for c in j["cameras"]]
    check("front_yard_h264" not in ids and "front_yard" in ids and next(c for c in j["cameras"] if c["id"] == "front_yard")["h264"] is True and next(c for c in j["cameras"] if c["id"] == "garage")["h264"] is False, "/list hides the twin and marks its base camera h264: true")
    hl3 = StreamHealth(now=lambda: 5, interval=15)
    hf = os.path.join(rec_tmp, "stream-health.json")
    r = sample_streams_once("http://127.0.0.1:%d" % fp, health=hl3, health_file=hf, twins=False, log=lambda *a: None)
    with open(hf) as fh:
        hj = json.load(fh)
    check(r == "sampled" and "front_yard" in hj["cameras"] and "front_yard_h264" not in hj["cameras"] and hj["cameras"]["front_yard"]["codecs"] == ["H265"] and hj["cameras"]["front_yard"]["twin"] == "front_yard_h264", "one sample reads go2rtc, writes the file for cams-diag, and names a camera's twin")
    # THE SD TWIN (DR-0799): every Wyze camera's own substream, registered beside it
    check(sd_source("wyze://192.168.1.50?uid=ABC&enr=S&mac=AA&model=HL_CAM4&dtls=true") == "wyze://192.168.1.50?uid=ABC&enr=S&mac=AA&model=HL_CAM4&dtls=true&subtype=sd", "a wyze source gains subtype=sd")
    check(sd_source("wyze://192.168.1.50?uid=ABC&subtype=hd&enr=S") == "wyze://192.168.1.50?uid=ABC&subtype=sd&enr=S" and sd_source("wyze://192.168.1.50?uid=ABC#video=h264") == "wyze://192.168.1.50?uid=ABC&subtype=sd#video=h264", "subtype=hd becomes sd; a #fragment is kept after the query")
    check(sd_source("rtsp://admin:S@192.168.1.60/live") is None and sd_source("ring://x") is None, "only a Wyze source has a substream to ask for")
    check(base_of("front_yard_sd") == "front_yard" and base_of("front_yard_h264") == "front_yard" and base_of("front_yard") == "front_yard" and is_twin("front_yard_sd") and not is_twin("front_yard"), "a twin knows its camera")
    seen.pop("puts", None); seen["put_refuses"] = False
    added = ensure_sd_twins("http://127.0.0.1:%d" % fp, {
        "front_yard": {"producers": [{"url": "wyze://192.168.1.50?uid=ABC&enr=SECRET&mac=AA&model=HL_CAM4&dtls=true"}], "consumers": []},
        "front_yard_h264": {"producers": [{"url": "ffmpeg:front_yard#video=h264"}], "consumers": []},
        "garage": {"producers": [{"url": "rtsp://admin:SECRET@192.168.1.60/live"}], "consumers": []},
        "porch": {"producers": [{"url": "wyze://192.168.1.52?uid=P&enr=S2"}], "consumers": []},
        "porch_sd": {"producers": [{"url": "wyze://192.168.1.52?uid=P&enr=S2&subtype=sd"}], "consumers": []},
    }, log=lambda *a: None)
    check(added == ["front_yard_sd"] and seen.get("puts") == [("front_yard_sd", "wyze://192.168.1.50?uid=ABC&enr=SECRET&mac=AA&model=HL_CAM4&dtls=true&subtype=sd")], "a Wyze camera without its SD twin gets one PUT (its own URL with subtype=sd); a twin, an rtsp camera, and a camera that has one are left alone")
    seen["with_twin"] = True
    s, _h, d = call("GET", "/list", auth=B)
    j = json.loads(d.decode("utf-8"))
    fy = next(c for c in j["cameras"] if c["id"] == "front_yard")
    check("front_yard_sd" not in [c["id"] for c in j["cameras"]] and fy["sd"] is True and fy["h264"] is True and next(c for c in j["cameras"] if c["id"] == "garage")["sd"] is False, "/list hides the SD twin too and marks its camera sd: true")
    seen["with_twin"] = False
    s, _h, d = call("GET", "/health")
    j = json.loads(d.decode("utf-8"))
    check(j["stream_health"]["cameras"] == 2 and j["stream_health"]["interval_s"] == 15 and j["stream_health"]["drops_1h"] == 1, "/health's stream_health summary: cameras seen, the interval, drops in the hour")
    check(sample_streams_once("http://127.0.0.1:1", health=StreamHealth(), twins=False) == "unreachable", "a dark go2rtc is 'unreachable', never a sample")

    print("=== 8m. any camera from the app, tested on the spot (DR-0803): add, probe, remove; Ring signs in through go2rtc ===")
    check(source_check("rtsp://admin:pw@192.168.1.60/live") == (True, "") and source_check("onvif://u:p@192.168.1.5") == (True, "") and source_check("http://192.168.1.9/snap.jpg") == (True, ""), "rtsp, onvif and http sources pass the check")
    check(source_check("exec:rm -rf /")[1] == "scheme-not-allowed" and source_check("ffmpeg:cam#raw=-i x")[1] == "scheme-not-allowed" and source_check("file:///etc/passwd")[1] == "scheme-not-allowed" and source_check("")[1] == "empty-or-long", "exec, ffmpeg#raw, file and empty are refused before they reach go2rtc")
    s, _h, d = call("POST", "/streams", json.dumps({"name": "garage_rtsp", "url": "rtsp://admin:SECRET@192.168.1.60/live"}).encode())
    check(s == 401, "adding a camera needs the owner's bearer")
    seen.pop("puts", None); seen["put_refuses"] = False
    s, _h, d = call("POST", "/streams", json.dumps({"name": "bad id!", "url": "rtsp://x"}).encode(), auth=B)
    check(s == 400 and b"bad-camera-id" in d, "a name outside the grammar is refused")
    s, _h, d = call("POST", "/streams", json.dumps({"name": "front_yard_sd", "url": "rtsp://x"}).encode(), auth=B)
    check(s == 400 and b"reserved-name" in d, "a twin's name is reserved")
    s, _h, d = call("POST", "/streams", json.dumps({"name": "evil", "url": "exec:touch /tmp/x"}).encode(), auth=B)
    check(s == 400 and b"scheme-not-allowed" in d and not seen.get("puts"), "a forbidden source never reaches go2rtc")
    s, _h, d = call("POST", "/streams", json.dumps({"name": "front_yard", "url": "rtsp://admin:S@192.168.1.60/live"}).encode(), auth=B)
    check(s == 409 and b"name-taken" in d, "a name go2rtc already has is refused unless replace is asked")
    s, _h, d = call("POST", "/streams", json.dumps({"name": "garage_rtsp", "url": "rtsp://admin:SECRET@192.168.1.60/live"}).encode(), auth=B)
    j = json.loads(d.decode("utf-8"))
    check(s == 200 and j["ok"] is True and j["id"] == "garage_rtsp" and j["kind"] == "rtsp" and j["registered"] is True and j["persisted"] is True and seen.get("puts") == [("garage_rtsp", "rtsp://admin:SECRET@192.168.1.60/live")], "an rtsp camera is PUT into go2rtc (name + source) and answered as registered and persisted")
    check(j["probe"]["ok"] is True and j["probe"]["status"] == 200 and j["probe"]["bytes"] > 0 and isinstance(j["probe"]["ms"], int) and "SECRET" not in d.decode("utf-8"), "one frame is probed and its size and time answered; the password never comes back")
    s, _h, d = call("POST", "/streams", json.dumps({"name": "err_cam", "url": "rtsp://admin:SECRET@192.168.1.77/live", "replace": True}).encode(), auth=B)
    j = json.loads(d.decode("utf-8"))
    check(s == 200 and j["probe"]["ok"] is False and j["probe"]["status"] == 500 and "connect failed" in j["probe"]["error"] and "SECRET" not in j["probe"]["error"], "a camera go2rtc cannot reach is registered and its probe carries go2rtc's own reason, scrubbed")
    s, _h, d = call("GET", "/streams/garage_rtsp/test")
    check(s == 401, "the test needs a viewer")
    s, _h, d = call("GET", "/streams/garage_rtsp/test", auth=B)
    j = json.loads(d.decode("utf-8"))
    check(s == 200 and j["id"] == "garage_rtsp" and j["probe"]["ok"] is True, "GET /streams/<id>/test probes again")
    twin_cfg2 = os.path.join(rec_tmp, "go2rtc-remove.yaml")
    with open(twin_cfg2, "w") as fh:
        fh.write("api:\n  listen: \"127.0.0.1:1984\"\nstreams:\n  front_yard: wyze://x?enr=S\n  garage_rtsp: rtsp://admin:S@192.168.1.60/live\n  garage_rtsp_sd:\n    - rtsp://a\n    - rtsp://b\n  porch: rtsp://p\nwyze:\n  email: x\n")
    check(remove_stream_entry(twin_cfg2, "garage_rtsp_sd") is True and remove_stream_entry(twin_cfg2, "garage_rtsp") is True and remove_stream_entry(twin_cfg2, "nope") is False, "a stream line (and its indented list) is taken out of the config; a missing name is False")
    with open(twin_cfg2) as fh:
        left = fh.read()
    check("garage_rtsp" not in left and "  front_yard: wyze://x?enr=S\n" in left and "  porch: rtsp://p\n" in left and "wyze:\n  email: x\n" in left, "every other line is kept exactly")
    seen.pop("deletes", None)
    s, _h, d = call("DELETE", "/streams/garage_rtsp")
    check(s == 401, "removing needs the owner")
    s, _h, d = call("DELETE", "/streams/garage_rtsp", auth=B)
    j = json.loads(d.decode("utf-8"))
    check(s == 200 and j["ok"] is True and "garage_rtsp" in j["removed"] and seen.get("deletes", [])[:3] == ["garage_rtsp", "garage_rtsp_h264", "garage_rtsp_sd"], "DELETE takes the stream and its twins out of go2rtc")
    seen.pop("puts", None)
    s, _h, d = call("POST", "/setup/ring", json.dumps({"email": "me@example.com", "password": "pw"}).encode())
    check(s == 401, "the Ring sign-in needs the owner")
    s, _h, d = call("POST", "/setup/ring", json.dumps({"email": "me@example.com", "password": "pw"}).encode(), auth=B)
    j = json.loads(d.decode("utf-8"))
    check(s == 409 and j["error"] == "needs-2fa" and "code" in j["prompt"].lower() and seen["ring_query"] == {"email": "me@example.com", "password": "pw"}, "without a code Ring asks for its 2FA code: 409 needs-2fa with Ring's own prompt")
    s, _h, d = call("POST", "/setup/ring", json.dumps({"email": "me@example.com", "password": "wrong", "code": "123456"}).encode(), auth=B)
    check(s == 401 and b"ring-sign-in-refused" in d, "a refused Ring sign-in is 401 in Ring's words")
    s, _h, d = call("POST", "/setup/ring", json.dumps({"email": "me@example.com", "password": "pw", "code": "123456"}).encode(), auth=B)
    j = json.loads(d.decode("utf-8"))
    check(s == 200 and j["ok"] is True and j["added"] == 2 and [c["id"] for c in j["cameras"]] == ["front_door", "driveway"] and seen["ring_query"].get("code") == "123456", "with the code every Ring camera is registered (one stream per camera; the snapshot source is the frame road)")
    check(seen.get("puts") == [("front_door", "ring:?camera_id=11&device_id=22&refresh_token=RINGSECRET"), ("driveway", "ring:?camera_id=33&device_id=44&refresh_token=RINGSECRET")] and "RINGSECRET" not in d.decode("utf-8"), "the ring: sources go to go2rtc with their refresh token, and the token never comes back to the app")
    s, _h, d = call("POST", "/setup/ring", json.dumps({"email": "nope", "password": "pw"}).encode(), auth=B)
    check(s == 400 and b"missing-field" in d, "a bad email is refused before any call")

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


def config_stream_names(text):
    """The stream ids a go2rtc.yaml DEFINES: the keys indented under the
    top-level `streams:` block. `streams: {}` defines none. No yaml library on
    the box, so this reads the shape the way cams-diag does."""
    names = set()
    inside = False
    for line in str(text or "").splitlines():
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        if not line[0].isspace():
            inside = line.startswith("streams:")
            continue
        if inside:
            m = re.match(r"^\s+([^\s#][^:]*?):", line)
            if m:
                names.add(m.group(1).strip().strip("\"'"))
    return names


def yaml_quote(s):
    """A YAML double-quoted scalar: a camera source url carries ? & = and may carry anything."""
    return '"' + str(s).replace("\\", "\\\\").replace('"', '\\"') + '"'


def write_streams_block(text, entries):
    """go2rtc.yaml with `entries` ([(name, url)]) added under its top-level
    `streams:` block, every other byte untouched. A `streams: {}` line (the seed's
    flow mapping) becomes the block form, because that is the one shape go2rtc's
    own patcher cannot add a child to (DR-0789). None when the file has no
    top-level streams key (then nothing is guessed at)."""
    lines = str(text or "").split("\n")
    idx = None
    for k, l in enumerate(lines):
        if re.match(r"^streams:\s*(\{\s*\})?\s*(#.*)?$", l):
            idx = k
            break
    if idx is None:
        return None
    existing = config_stream_names(text)
    add = [(n, u) for n, u in entries if n not in existing and re.match(r"^[A-Za-z0-9_][A-Za-z0-9_.-]*$", str(n)) and u]
    if not add:
        return text
    m = re.match(r"^streams:\s*(\{\s*\})?\s*(#.*)?$", lines[idx])
    head = "streams:" + ("  " + m.group(2) if m.group(2) else "")
    j = idx + 1
    while j < len(lines) and (not lines[j].strip() or lines[j][0] in " \t" or lines[j].lstrip().startswith("#")):
        j += 1
    block = lines[idx + 1:j]
    insert = ["  %s: %s" % (n, yaml_quote(u)) for n, u in add]
    return "\n".join(lines[:idx] + [head] + block + insert + lines[j:])


def write_config_atomically(path, text):
    """Write go2rtc.yaml the way a config must be written: whole, then renamed into place."""
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        f.write(text)
    try:
        os.chmod(tmp, os.stat(path).st_mode & 0o777)
    except OSError:
        pass
    os.replace(tmp, path)


def persist_missing_streams(upstream, streams, log=print, config_path=None):
    """WHAT MEMORY HOLDS, THE CONFIG MUST HOLD (DR-0787). Measured 2026-10-07
    (cams-diag run 37639442649, after the DR-0779 fix shipped): /health said
    31 streams, and go2rtc.yaml said `streams defined: 0`. The 31 lived in
    go2rtc's memory from a /api/wyze listing made BEFORE the fix; nothing
    ever wrote them, and the self-heal re-adds only when memory is EMPTY --
    so the next container recreate would have come back with zero cameras,
    the exact 07:31 loss, again. Now every self-heal tick reads go2rtc's
    own config (/api/config) and PUTs each stream memory holds that the
    file does not, with the source url go2rtc itself reports; PUT writes
    the config (app.PatchConfig) and is idempotent. The urls never leave
    this process. Returns 'written', 'config-unreadable' or 'wrote-N'."""
    base = upstream.rstrip("/")
    try:
        with urllib.request.urlopen(base + "/api/config", timeout=HEALTH_TIMEOUT) as r:
            text = r.read(2 * 1024 * 1024).decode("utf-8", "replace")
    except (urllib.error.URLError, OSError, ValueError):
        return "config-unreadable"
    defined = config_stream_names(text)
    missing = [sid for sid in streams if sid not in defined]
    if not missing:
        PERSIST_LAST.update({"at": int(time.time()), "missing": 0, "wrote": 0, "direct": 0, "refused": ""})
        return "written"
    wrote = 0
    refused = ""
    failed = []
    for sid in missing:
        info = streams.get(sid) if isinstance(streams, dict) else None
        prods = (info or {}).get("producers") or []
        url = prods[0].get("url") if prods and isinstance(prods[0], dict) else None
        if not url:
            continue
        q = urllib.parse.urlencode([("name", sid), ("src", url)])
        put = urllib.request.Request(base + "/api/streams?" + q, method="PUT")
        try:
            with urllib.request.urlopen(put, timeout=HEALTH_TIMEOUT) as r:
                r.read(4096)
            wrote += 1
        except urllib.error.HTTPError as e:
            # THE REFUSAL IS KEPT, NOT SWALLOWED (DR-0789; cams-diag run 37643024375
            # said "wrote 0 of them" and nothing said why). Scrubbed: never a url.
            body = ""
            try:
                body = e.read(300).decode("utf-8", "replace")
            except Exception:  # noqa: BLE001
                body = ""
            if not refused:
                refused = "HTTP %d %s" % (e.code, scrub_text(body, 160).strip())
            failed.append((sid, url))
        except (urllib.error.URLError, OSError) as e:
            if not refused:
                refused = scrub_text(str(e), 160)
            failed.append((sid, url))
    # WHEN GO2RTC WILL NOT WRITE ITS OWN FILE, THIS PROCESS DOES (DR-0789). The
    # seed's `streams: {}` is a flow mapping; go2rtc's text patcher inserts the
    # new child on the line after the key, which under `{}` is not valid yaml,
    # so every PUT /api/streams answers 400 and the config never gains a
    # stream. The forwarder runs on the host beside the file: it adds the
    # block itself, byte-for-byte otherwise, atomically. go2rtc already holds
    # the streams in memory; the file is for the next start.
    direct = 0
    cfg = config_path or GO2RTC_YAML_PATH
    if failed and os.path.isfile(cfg):
        try:
            with open(cfg, "r", encoding="utf-8") as f:
                on_disk = f.read()
            new_text = write_streams_block(on_disk, failed)
            if new_text is not None and new_text != on_disk:
                write_config_atomically(cfg, new_text)
                direct = len([1 for sid, _u in failed if sid in config_stream_names(new_text)])
        except OSError as e:
            log("self-heal: could not write go2rtc.yaml directly: %s" % scrub_text(str(e), 160))
    PERSIST_LAST.update({"at": int(time.time()), "missing": len(missing), "wrote": wrote, "direct": direct, "refused": refused})
    log("self-heal: %d stream(s) lived in go2rtc's memory only; go2rtc wrote %d of them to its config%s; this process wrote %d into go2rtc.yaml directly (DR-0787, DR-0789)"
        % (len(missing), wrote, (" (it refused: %s)" % refused) if refused else "", direct))
    return "wrote-%d" % (wrote + direct)


def self_heal_once(upstream, port, token, log=print):
    """If go2rtc lists ZERO streams and a Wyze sign-in is kept, re-add the
    cameras through this process's own /setup/wyze/again. If it lists streams
    its config does not define, write them (DR-0787). Returns what it did."""
    try:
        with urllib.request.urlopen(upstream.rstrip("/") + "/api/streams", timeout=HEALTH_TIMEOUT) as r:
            parsed = json.loads(r.read(4 * 1024 * 1024).decode("utf-8"))
    except (urllib.error.URLError, OSError, ValueError):
        return "go2rtc-unreachable"
    if isinstance(parsed, dict) and len(parsed) > 0:
        wrote = persist_missing_streams(upstream, parsed, log=log)
        return wrote if wrote.startswith("wrote-") else "has-streams"
    if _wyze is None or not _wyze.load_credentials():
        return "no-credentials"
    req = urllib.request.Request("http://127.0.0.1:%d/setup/wyze/again" % port, data=b"", method="POST",
                                 headers={"Authorization": "Bearer " + token})
    try:
        with urllib.request.urlopen(req, timeout=SETUP_TIMEOUT + 10) as r:
            j = json.loads(r.read(1024 * 1024).decode("utf-8"))
        log("self-heal: go2rtc had no streams; re-added %s camera(s) from the kept Wyze sign-in" % j.get("added"))
        return "re-added"
    except urllib.error.HTTPError as e:
        log("self-heal: re-add refused HTTP %d" % e.code)
        return "refused-%d" % e.code
    except (urllib.error.URLError, OSError, ValueError):
        return "failed"


def start_self_heal(upstream, port, token, first=None, every=None):
    first = SELF_HEAL_FIRST_SECONDS if first is None else first
    every = SELF_HEAL_SECONDS if every is None else every

    def run():
        time.sleep(first)
        while True:
            try:
                self_heal_once(upstream, port, token)
            except Exception as e:  # noqa: BLE001 -- the loop outlives any one surprise
                print("self-heal: %s" % e, file=sys.stderr)
            time.sleep(every)

    t = threading.Thread(target=run, name="cams-self-heal", daemon=True)
    t.start()
    return t


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
    if SELF_HEAL_SECONDS > 0:
        start_self_heal(args.upstream, args.port, token)
    if STREAM_SAMPLE_SECONDS > 0:
        start_stream_sampler(args.upstream)
    print("cams-forwarder on http://%s:%d -> %s (live cap %d x %.0fs, snap cap %d)"
          % (args.host, args.port, args.upstream, MAX_LIVE, LIVE_MAX_SECONDS, MAX_SNAP_INFLIGHT))
    httpd.serve_forever()


if __name__ == "__main__":
    main()
