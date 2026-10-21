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
#   POST /streams/<id>/road {road}     owner. "bridge" | "direct" | "auto" (DR-0809):
#        which road a Wyze camera takes into go2rtc. Auto: a camera on a network
#        the NAS cannot reach, or one whose firmware has no DTLS, rides the Wyze
#        bridge (docker-wyze-bridge beside go2rtc, relay mode, loopback only) as
#        rtsp://127.0.0.1:8555/<uri>; every other Wyze camera stays on go2rtc's
#        own wyze: road. Answers {ok, id, road, reason}.
#   GET  /streams/roads                owner. Every camera's road and why, never a URL.
#        /health carries `bridge`: configured, reachable, cameras it knows, how
#        many ride it, when it was last synced. /list carries `road` per camera.
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
import base64
import hashlib
import hmac
import json
import os
import re
import ipaddress
import secrets
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


WYZE_OFFLINE_ANSWER = {"error": "wyze-offline", "detail": "Wyze's own list says this camera is offline; no Kinesis offer was sent"}


def wyze_offline_streams(fetch=True, factory=None):
    """The stream ids Wyze's own list calls offline (DR-0807's word), or None
    when the list cannot be read. fetch=False never asks the cloud: it reads
    only the list already held, for paths that must not wait on Wyze."""
    try:
        client = (factory or wyze_client_default)()
        if client is None:
            return None
        devs = client.devices() if fetch else (client.cached_devices() if hasattr(client, "cached_devices") else None)
    except Exception:  # noqa: BLE001 -- no list is "unknown", never "all online"
        return None
    if not isinstance(devs, list):
        return None
    return {stream_name_for(d.get("nickname") or "", set()) for d in devs
            if isinstance(d, dict) and d.get("type") == "Camera" and not d.get("online")}


def wyze_error_response(e):
    """A WyzeError -> (status, json) the app can read; never a secret."""
    kind = getattr(e, "kind", "wyze-error")
    detail = scrub_text(getattr(e, "detail", "") or "", 200)
    status = {
        "no-credentials": 503, "sign-in-refused": 401, "unreachable": 502, "bad-json": 502,
        "too-soon": 429, "device-offline": 409, "unknown-action": 400, "unknown-device": 400,
        "no-garage-controller": 400, "parameter-error": 502, "rate-limited": 503,
    }.get(kind, 502)
    if kind.startswith("http-"):
        status = 502
    out = {"error": kind, "detail": detail}
    if kind == "rate-limited":  # Wyze's 429, obeyed (DR-1097 twelfth read): the seconds until the NAS asks again
        out["retry_in"] = int(getattr(e, "retry_after", None) or 0)
    if kind == "too-soon":
        m = re.match(r"^(\d+)", detail)
        out["retry_in"] = int(m.group(1)) if m else int(getattr(_wyze, "ACTION_MIN_SECONDS", 3))
    return status, out

TOKEN_FILE_DEFAULT = "/volume1/PoeTech/secrets/chat-bridge-token.txt"

# THE ONLY ORIGIN THE CAMERAS ANSWER CROSS-ORIGIN. Module level on purpose, so
# the selftest pins the value the running Handler actually uses rather than a
# copy of it. Never "*": these are the cameras on a family's house and the road
# carries a bearer. See the CORS block on Handler for why this exists at all.
CORS_ALLOWED_ORIGINS = ("https://poetech.us",)
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


# HOW EACH LIVE VIEW ENDED (DR-1097, sixteenth read; Darrell 2026-10-21:
# "Cameras constantly blinking... only stream for a few to 20 seconds"). A tile
# that blinks is a live view that ended and was opened again. Who ended it is the
# whole question: go2rtc ("source-ended"), a source silent past the read timeout
# ("source-silent"), the viewer's own tab ("viewer-left": the app hung up, e.g.
# its freeze or lag rule), or the optional clock. The last LIVE_ENDS_KEEP ends
# are kept in memory with the camera, seconds, bytes and why; nothing else.
# The last time a live viewer of each camera (its twins counted as the camera)
# was handed bytes, on the monotonic clock. A re-arm puts the camera's line
# again in go2rtc, which ends every consumer: it is never done to a camera a
# viewer is watching with video still arriving (DR-1097, sixteenth read: the
# hold re-armed 805_north at 20:02:08 with Darrell's window open on it).
LIVE_LAST_BYTES = {}
VIEWER_FRESH_SECONDS = 5.0


def viewer_flowing(sid, now=None):
    t = LIVE_LAST_BYTES.get(base_of(sid))
    return t is not None and (now if now is not None else time.monotonic()) - t <= VIEWER_FRESH_SECONDS


LIVE_ENDS_KEEP = 80
LIVE_ENDS = []
LIVE_ENDS_LOCK = threading.Lock()


# WHO OPENED IT AGAIN (DR-1097, twenty-first read). Every hang-up the tab makes
# reads "viewer-left", whether a person left or the app's own freeze or lag rule
# reconnected, so a blinking run on one camera could not say which. The app
# already counts its reconnects into the live URL (r=, Cameras.jsx liveUrl), and
# a tap that remounts a tile starts again at 0; each end now keeps that count.
LIVE_RECONNECT_MAX = 999


def live_reconnect_of(query):
    """The app's reconnect count from a live URL's query (r=), 0 when absent or not a count."""
    try:
        v = int(urllib.parse.parse_qs(query or "").get("r", ["0"])[0])
    except (TypeError, ValueError):
        return 0
    return max(0, min(LIVE_RECONNECT_MAX, v))


def live_end_note(cam, seconds, nbytes, why, now=None, reconnect=0):
    with LIVE_ENDS_LOCK:
        LIVE_ENDS.append({"camera": cam, "s": round(float(seconds), 1), "kb": int(nbytes) // 1024, "why": why,
                          "r": int(reconnect), "at": int(now if now is not None else time.time())})
        del LIVE_ENDS[:-LIVE_ENDS_KEEP]


# ONE CAMERA, A FEW VIEWS (DR-1097, nineteenth read). cams-diag 39547175167 read
# 32 live views end in one second when one phone's tab closed at 23:59:32:
# every slot MAX_LIVE has, five of 805_north_sd at once, each 90-404 s old and
# still carrying video. The tab had replaced each reconnecting <video> without
# hanging up the old one (fixed in the app, lib/camera-video.js), and nothing
# here stopped it: the orphans held every slot ("busy") and filled the phone's
# road, so the views really watched froze. A camera now holds at most
# LIVE_PER_CAMERA live views; one more tells the OLDEST to end ("superseded"),
# so a view nobody watches can never keep the slot from one somebody does.
# Brakes (deterministic class, DR-0248): the count is the budget, one lock,
# stop-path CAMS_LIVE_PER_CAMERA=0.
LIVE_PER_CAMERA = max(0, int(os.environ.get("CAMS_LIVE_PER_CAMERA", "3")))
LIVE_VIEWS = {}
LIVE_VIEWS_LOCK = threading.Lock()


def live_view_join(cam, sock=None, cap=None, views=None, clock=time.monotonic):
    """A live view of `cam` opened: register it and tell the oldest beyond `cap` to end.
    Answers the view's handle {started, stop, sock}."""
    cap = LIVE_PER_CAMERA if cap is None else int(cap)
    views = LIVE_VIEWS if views is None else views
    view = {"started": clock(), "stop": threading.Event(), "sock": sock}
    ended = []
    with LIVE_VIEWS_LOCK:
        rows = views.setdefault(cam, [])
        rows.append(view)
        if cap > 0:
            live = [v for v in rows if not v["stop"].is_set()]
            for old in live[:max(0, len(live) - cap)]:
                old["stop"].set()
                ended.append(old)
    for old in ended:
        # A view whose reader stopped reading is stuck in a write: the socket is
        # shut so the write fails now rather than when the tab finally closes.
        try:
            if old["sock"] is not None:
                old["sock"].shutdown(socket.SHUT_RDWR)
        except OSError:
            pass
    return view


def live_view_leave(cam, view, views=None):
    views = LIVE_VIEWS if views is None else views
    with LIVE_VIEWS_LOCK:
        rows = [v for v in views.get(cam, []) if v is not view]
        if rows:
            views[cam] = rows
        else:
            views.pop(cam, None)


def live_ends_summary(allow=None):
    """{ends: newest first, by_why: {why: count}} for the cameras `allow` admits."""
    with LIVE_ENDS_LOCK:
        rows = [dict(e) for e in LIVE_ENDS if allow is None or allow(e["camera"])]
    by = {}
    for e in rows:
        by[e["why"]] = by.get(e["why"], 0) + 1
    return {"ends": rows[::-1], "by_why": by}


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
    if scheme == "wyze" or is_bridge_source(url) or is_kvs_source(url):
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
        road = "direct"
        if isinstance(producers, list):
            for p in producers:
                if isinstance(p, dict) and is_bridge_source(p.get("url")):
                    road = "bridge"
                    break
                if isinstance(p, dict) and is_kvs_source(p.get("url")):
                    road = "kvs"
                    break
        out.append({"id": sid, "name": sid.replace("_", " ").replace("-", " "), "kind": kind, "road": road})
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
    """The same wyze:// source with subtype=sd (replacing subtype=hd when it is there);
    for a bridge road, the bridge's MAIN stream (DR-0979); None for any other kind.

    WHY NOT THE BRIDGE'S `-sub` (DR-0809 had it so). cams-diag 37980447085,
    2026-10-09: every `-sub` the bridge tried timed out at the camera
    ("[front-door-view-sub] [-13] IOTC_ER_TIMEOUT", basketball-cam-sub,
    outside-7-sub, garage-front-yard-sub), and the wall asks every tile for its
    `_sd` -- so a wall of bridged cameras asked only for the one feed that never
    connected, while the Wyze app showed all of them live (Darrell, 2026-10-12).
    A second substream is a second session to the camera; the main stream is the
    session the bridge already holds. The tile is small either way."""
    if is_kvs_source(url):
        return None  # the twin of a Kinesis camera is go2rtc's restream of it (DR-1097), set where the road is
    if is_bridge_source(url):
        base, _, frag = str(url).partition("#")
        if base.endswith(BRIDGE_SUB_SUFFIX):
            base = base[: -len(BRIDGE_SUB_SUFFIX)]
        return base + (("#" + frag) if frag else "")
    if kind_of(url) != "wyze":
        return None
    base, _, frag = str(url).partition("#")
    if re.search(r"(?i)[?&]subtype=", base):
        base = re.sub(r"(?i)([?&]subtype=)[^&]*", r"\1sd", base)
    else:
        base += ("&" if "?" in base else "?") + "subtype=sd"
    return base + (("#" + frag) if frag else "")


# =============================================================================
# THE WYZE BRIDGE ROAD (DR-0809; Darrell 2026-10-07: "805 we have no video...
# however the wyze cam app works... why?!!!" and "Build the bridge on the NAS
# so 805 works"). Measured that night (cams-diag 37702488586): go2rtc's own
# wyze: source speaks to a camera's LAN address, so the ten 805 cameras at
# 10.0.0.x -- a network the NAS has no route to -- timed out on discovery, and
# twelve more were refused with "only DTLS cameras are supported". The Wyze
# app showed them all, because it rides Wyze's own relay from anywhere.
#
# docker-wyze-bridge (mrlt8/wyze-bridge, pinned) runs beside go2rtc on the NAS
# in relay mode (NET_MODE=ANY: LAN, then P2P, then Wyze's relay), on demand,
# bound to loopback only: RTSP on 127.0.0.1:8555, its API on 127.0.0.1:8597,
# API key required. It signs in with the SAME four values the Cameras tab
# already keeps (wyze.env), copied into its own env file by bridge_env_sync.
#
# The road is chosen per camera from the source URL go2rtc already holds --
# no probing, no waiting on a timeout: a wyze:// host outside every network
# the NAS sits on, or a wyze:// line without dtls=true, rides the bridge as
# rtsp://127.0.0.1:8555/<uri>; the camera is matched to the bridge's own
# listing by MAC. Every other Wyze camera stays on go2rtc's direct road (lower
# latency, no relay). The owner can force either road per camera, or hand it
# back to auto. The SD twin of a bridged camera is the bridge's `-sub` stream.
# Direct URLs (they carry the enr secret) are kept root-only in
# bridge-roads.json so a camera can be handed back; they never leave the NAS.
# =============================================================================
BRIDGE_API = os.environ.get("CAMS_BRIDGE_API", "http://127.0.0.1:8597")
BRIDGE_RTSP = os.environ.get("CAMS_BRIDGE_RTSP", "rtsp://127.0.0.1:8555")
BRIDGE_ENV = os.environ.get("CAMS_BRIDGE_ENV", "/volume1/PoeTech/secrets/wyze-bridge.env")
BRIDGE_ROADS_FILE = os.environ.get("CAMS_BRIDGE_ROADS", os.path.join(os.path.dirname(GO2RTC_YAML_PATH), "bridge-roads.json"))
BRIDGE_SYNC_EVERY = max(1, int(os.environ.get("CAMS_BRIDGE_SYNC_EVERY", "4")))  # samples between road syncs (4 x 15 s)
BRIDGE_TIMEOUT = float(os.environ.get("CAMS_BRIDGE_TIMEOUT", "6"))
BRIDGE_SUB_SUFFIX = "-sub"
BRIDGE_ROADS = ("bridge", "direct", "kvs", "auto")
BRIDGE_LOCK = threading.Lock()
# One writer of the roads record at a time: the sampler's sync, the road judge
# (DR-1097) and the owner's road pick each load, change and save it.
ROADS_LOCK = threading.RLock()
BRIDGE_LAST = {}  # the last sync, for /health: {at, reachable, known, bridged, unknown, moved}
_LAN_CACHE = {"at": 0.0, "nets": None}
LAN_CACHE_SECONDS = 600.0


def read_env_pairs(path):
    """A sh-style env file -> {KEY: value}; {} when unreadable. Quotes stripped."""
    out = {}
    try:
        with open(path, "r", encoding="utf-8") as fh:
            for line in fh:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                k = k.strip().replace("export ", "")
                v = v.strip()
                if len(v) >= 2 and v[0] == v[-1] and v[0] in "\"'":
                    v = v[1:-1].replace('\\"', '"')
                out[k] = v
    except OSError:
        return {}
    return out


def _env_quote(v):
    return '"%s"' % str(v).replace("\\", "\\\\").replace('"', '\\"')


# The generation of the bridge's API key. Bumping this number in the repo mints
# a NEW WB_API on the next --bridge-env (install.sh, every services-sync), the
# compose project recreates the bridge with it, and the forwarder re-signs every
# bridge road (the record differs from the line the bridge accepts). Rotation
# by a committed number: deterministic, idempotent, no hand on the NAS.
#   gen 1 -> 2 (2026-10-08, DR-0809 fifth field read): the key had been carried
#   in the forwarder's query string, so the bridge's own access log recorded
#   it, and cams-diag printed that log into a public Actions run (logs deleted).
BRIDGE_KEY_GENERATION = 2


def bridge_env_sync(src=None, dst=None, creds=None):
    """Derive the bridge's env file from the kept Wyze sign-in. The bridge's names
    (WYZE_EMAIL, WYZE_PASSWORD, API_ID, API_KEY) differ from ours for two of the
    four. WB_API (its API key, which the forwarder presents) and WB_PASSWORD
    (its web UI) are minted once and kept across re-syncs, except that WB_API is
    minted afresh when the file's WB_API_GEN is behind BRIDGE_KEY_GENERATION.
    Root-only, atomic. Answers "written" | "unchanged" | "no-wyze-env" | "error"."""
    src = src or (_wyze.SECRETS_ENV if _wyze else "/volume1/PoeTech/secrets/wyze.env")
    dst = dst or BRIDGE_ENV
    if creds is None:
        pairs = read_env_pairs(src)
        creds = dict((k.replace("WYZE_", "").lower(), pairs.get(k, "")) for k in ("WYZE_EMAIL", "WYZE_PASSWORD", "WYZE_API_ID", "WYZE_API_KEY"))
        if not all(creds.values()) and _wyze is not None:
            try:
                creds = _wyze.load_credentials() or creds
            except Exception:  # noqa: BLE001
                pass
    if not creds or not all(creds.get(k) for k in ("email", "password", "api_id", "api_key")):
        return "no-wyze-env"
    old = read_env_pairs(dst)
    try:
        old_gen = int(old.get("WB_API_GEN") or 1)
    except ValueError:
        old_gen = 1
    wb_api = old.get("WB_API") if (old.get("WB_API") and old_gen >= BRIDGE_KEY_GENERATION) else secrets.token_hex(16)
    wb_pass = old.get("WB_PASSWORD") or secrets.token_urlsafe(12)
    body = (
        "# The Wyze bridge's sign-in (DR-0809), derived from wyze.env by cams_forwarder.py --bridge-env. Root-only. Edit wyze.env, not this.\n"
        "WYZE_EMAIL=%s\nWYZE_PASSWORD=%s\nAPI_ID=%s\nAPI_KEY=%s\nWB_API=%s\nWB_API_GEN=%d\nWB_PASSWORD=%s\nWB_USERNAME=poetech\n"
        % (_env_quote(creds["email"]), _env_quote(creds["password"]), _env_quote(creds["api_id"]), _env_quote(creds["api_key"]), _env_quote(wb_api), BRIDGE_KEY_GENERATION, _env_quote(wb_pass))
    )
    try:
        with open(dst, "r", encoding="utf-8") as fh:
            if fh.read() == body:
                return "unchanged"
    except OSError:
        pass
    try:
        os.makedirs(os.path.dirname(dst) or ".", exist_ok=True)
        tmp = dst + ".tmp"
        fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            fh.write(body)
        os.replace(tmp, dst)
        return "written"
    except OSError:
        return "error"


def bridge_configured(path=None):
    try:
        return os.path.getsize(path or BRIDGE_ENV) > 0
    except OSError:
        return False


def bridge_api_key(path=None):
    return read_env_pairs(path or BRIDGE_ENV).get("WB_API", "")


def norm_mac(mac):
    return re.sub(r"[^0-9A-Fa-f]", "", str(mac or "")).upper()


def bridge_cameras(api=None, key=None, timeout=None):
    """The bridge's own listing (GET /api, key in the `api` HEADER only; its
    web_ui.py accepts header or query, and a query string lands verbatim in the
    bridge's own access log, which is how the key reached a public Actions run
    on the fifth field read) -> [{uri, mac, nickname, connected, enabled, status}];
    None when it does not answer."""
    api = (api or BRIDGE_API).rstrip("/")
    key = bridge_api_key() if key is None else key
    url = api + "/api"
    req = urllib.request.Request(url, headers={"api": key} if key else {})
    try:
        with urllib.request.urlopen(req, timeout=timeout or BRIDGE_TIMEOUT) as r:
            doc = json.loads(r.read(4 * 1024 * 1024).decode("utf-8"))
    except (urllib.error.URLError, OSError, ValueError):
        return None
    cams = doc.get("cameras") if isinstance(doc, dict) else None
    if not isinstance(cams, dict):
        return None
    out = []
    for uri, c in cams.items():
        if not isinstance(c, dict) or not re.match(r"^[A-Za-z0-9_.+-]{1,96}$", str(uri)):
            continue
        out.append({"uri": str(c.get("name_uri") or uri), "mac": norm_mac(c.get("mac")), "nickname": str(c.get("nickname") or ""),
                    "connected": bool(c.get("connected")), "enabled": bool(c.get("enabled", True)), "status": str(c.get("status") or ""),
                    "ip": str(c.get("ip") or "")})  # where Wyze says the camera is today (DR-0835)
    return out


def _bridge_netloc():
    try:
        u = urllib.parse.urlsplit(BRIDGE_RTSP)
        return (u.hostname or "", u.port or 554)
    except ValueError:
        return ("", 0)


def is_bridge_source(url):
    """An rtsp(s) line whose host and port are the bridge's, with or without credentials in it."""
    if not isinstance(url, str) or not url.startswith(("rtsp://", "rtsps://")):
        return False
    try:
        u = urllib.parse.urlsplit(url)
        return (u.hostname or "", u.port or 554) == _bridge_netloc()
    except ValueError:
        return False


def bridge_stream_auth(path=None):
    """The bridge's STREAM credentials (DR-0809): user `wb`, password = WB_API.
    First field read (cams-diag 37714259877): with WB_AUTH on the bridge's RTSP
    answers "user/pass not provided" to a bare URL. Third field read (cams-diag
    37719787818): signed with WB_USERNAME:WB_PASSWORD it answers "wrong user/pass",
    because those are the WEB UI's credentials. The bridge's own source
    (app/wyzebridge/mtx_server.py, setup_auth) adds the stream reader as
    {"user": "wb", "pass": api} where api is WB_API, and its wiki (Authentication)
    says the same: "username: wb, password: <the API key>". So the line go2rtc is
    handed is rtsp://wb:<WB_API>@...; the web credentials are never put on a
    stream URL. They never leave the NAS: the config and the roads file are
    root-only, /list carries no URL, /why carries only kind and host, and
    scrub_text masks user:pass@ wherever a URL is quoted."""
    env = read_env_pairs(path or BRIDGE_ENV)
    api = env.get("WB_API", "")
    return ("wb", api) if api else ("", "")


# go2rtc's RTSP client gives a source a few seconds to answer DESCRIBE; the
# bridge's MediaMTX holds DESCRIBE until the on-demand camera is publishing,
# up to its runOnDemandStartTimeout of 30s (mtx_server.py), and an 805 camera
# reached through Wyze's relay takes longer than go2rtc's default. Fourth field
# read (cams-diag 37722068151): with the right credentials the error became
# "read tcp 127.0.0.1->127.0.0.1:8555: i/o timeout". go2rtc documents
# `#timeout=30` on an RTSP source (internal/rtsp/README.md); the road carries it.
BRIDGE_ROAD_OPTS = "#timeout=30"


def bridge_source(uri):
    base = BRIDGE_RTSP.rstrip("/")
    user, pw = bridge_stream_auth()
    if user and pw:
        u = urllib.parse.urlsplit(base)
        base = "%s://%s:%s@%s%s" % (u.scheme, urllib.parse.quote(user, safe=""), urllib.parse.quote(pw, safe=""), u.netloc, u.path.rstrip("/"))
    return "%s/%s%s" % (base, uri, BRIDGE_ROAD_OPTS)


def main_uri(uri):
    """The bridge's MAIN name for a camera: its `-sub` substream's name without the suffix.
    DR-1097 second read (cams-diag 39073414169): the bridge lists every camera twice under one
    MAC ("back-yard-north" and "back-yard-north-sub"); the MAC match kept the last, so 26 main
    streams rode a substream (every one IOTC_ER_TIMEOUT) and Wyze's signaling answered
    "cam not found" for a name that is not a camera."""
    u = str(uri or "")
    return u[: -len(BRIDGE_SUB_SUFFIX)] if u.endswith(BRIDGE_SUB_SUFFIX) and len(u) > len(BRIDGE_SUB_SUFFIX) else u


def by_mac_main(bridge_cams):
    """{MAC: the bridge's main name}, never a `-sub` while the main is listed."""
    out = {}
    for c in bridge_cams or []:
        mac, uri = c.get("mac"), c.get("uri")
        if not (mac and uri):
            continue
        if mac not in out or (out[mac].endswith(BRIDGE_SUB_SUFFIX) and not uri.endswith(BRIDGE_SUB_SUFFIX)):
            out[mac] = uri
    return out


# WYZE'S OWN WEBRTC ROAD (DR-1097; Darrell 2026-10-17: "Cameras never work!!!!!!!!!!!
# Fix it!!!!!"). camera-health 39068529374 with probe_all: 3 of 31 cameras gave a
# frame. cams-diag 39068531141: 60 of go2rtc's 62 streams ride the bridge, and the
# bridge's TUTK peer road answers IOTC_ER_DEVICE_OFFLINE or IOTC_ER_TIMEOUT for
# every camera but great-room and kitchen-2, while the Wyze app shows them live.
# That is not ours alone: mrlt8/docker-wyze-bridge issue #1544 (2026-07-07, the
# same 2.10.3 we pin) reads the same two errors on every stream with the cameras
# live in the Wyze app, and the IDisposable fork's README says Wyze disabled TUTK
# on newer firmware in 2025 and falls back to WebRTC. The Wyze app and its web
# view watch through Wyze's WebRTC (AWS Kinesis Video Streams), which needs no
# road to the camera's LAN and no TUTK. The bridge we already run serves that
# road's signaling (`/signaling/<cam>?kvs`, app/frontend.py -> get_kvs_signal ->
# wyzecam.api.get_cam_webrtc), and go2rtc consumes it as
# `webrtc:http://.../signaling/<cam>?kvs#format=wyze` (internal/webrtc/README.md).
# The route sits behind the bridge's WEB sign-in (HTTPBasicAuth, WB_USERNAME +
# WB_PASSWORD; the API key opens only its API paths), so the line go2rtc holds
# carries those two. They stay where the stream key and the Wyze account already
# are: root-only go2rtc.yaml and roads file, scrubbed wherever a URL is quoted,
# the bridge itself bound to loopback.
KVS_ON = os.environ.get("CAMS_KVS", "1") != "0"
GO2RTC_RTSP = os.environ.get("CAMS_GO2RTC_RTSP", "rtsp://127.0.0.1:8554")


def bridge_web_auth(path=None):
    """The bridge's WEB sign-in (user, password): WB_USERNAME (the bridge's default
    is wbadmin) and WB_PASSWORD from its env file; ("", "") when either is missing."""
    env = read_env_pairs(path or BRIDGE_ENV)
    user, pw = env.get("WB_USERNAME") or "wbadmin", env.get("WB_PASSWORD", "")
    return (user, pw) if pw else ("", "")


def _bridge_api_netloc():
    try:
        u = urllib.parse.urlsplit(BRIDGE_API)
        return (u.hostname or "", u.port or 80)
    except ValueError:
        return ("", 0)


def kvs_source(uri, path=None):
    """go2rtc's line for Wyze's WebRTC road through the bridge's signaling; None without the web sign-in."""
    user, pw = bridge_web_auth(path)
    host, port = _bridge_api_netloc()
    if not (user and pw and host and uri):
        return None
    return "webrtc:http://%s:%s@%s:%d/signaling/%s?kvs#format=wyze" % (
        urllib.parse.quote(user, safe=""), urllib.parse.quote(pw, safe=""), host, port, urllib.parse.quote(str(uri), safe=""))


def is_kvs_source(url):
    """A webrtc: line asking the bridge's signaling for Wyze's Kinesis road (credentials or none)."""
    if not isinstance(url, str) or not url.startswith("webrtc:"):
        return False
    try:
        u = urllib.parse.urlsplit(url[len("webrtc:"):].partition("#")[0])
    except ValueError:
        return False
    return (u.hostname or "", u.port or 80) == _bridge_api_netloc() and u.path.startswith("/signaling/") and "kvs" in urllib.parse.parse_qs(u.query, keep_blank_values=True)


def kvs_uri_of(url):
    try:
        return urllib.parse.unquote(urllib.parse.urlsplit(url[len("webrtc:"):].partition("#")[0]).path.rsplit("/", 1)[-1])
    except (ValueError, TypeError):
        return ""


def restream_source(stream_id):
    """go2rtc's own RTSP restream of a stream: an SD twin that shares the main stream's one session."""
    return "%s/%s" % (GO2RTC_RTSP.rstrip("/"), stream_id)


def bridge_kvs_signal(uri, api=None, auth=None, timeout=15.0):
    """Ask the bridge whether Wyze offers its WebRTC road for this camera -> {"result": str}.
    "ok" means Wyze answered with a signaling channel; anything else is Wyze's or the
    bridge's own word ("Camera does not support WebRTC", "cam not found", HTTP 401).
    Never returns the signaling URL or its credentials."""
    api = (api or BRIDGE_API).rstrip("/")
    user, pw = auth if auth is not None else bridge_web_auth()
    if not (user and pw):
        return {"result": "no-web-sign-in"}
    req = urllib.request.Request(api + "/signaling/%s?kvs" % urllib.parse.quote(str(uri), safe=""),
                                 headers={"Authorization": "Basic " + base64.b64encode(("%s:%s" % (user, pw)).encode("utf-8")).decode("ascii")})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            doc = json.loads(r.read(256 * 1024).decode("utf-8"))
    except urllib.error.HTTPError as e:
        return {"result": "bridge answered HTTP %d" % e.code}
    except (urllib.error.URLError, OSError, ValueError) as e:
        return {"result": "bridge-unreachable: %s" % scrub_text(getattr(e, "reason", e), 120)}
    if not isinstance(doc, dict):
        return {"result": "bridge answered no object"}
    return {"result": scrub_text(doc.get("result") or "no result", 160)}


# THE DIRECT ROAD (DR-1097, fifteenth read; Darrell 2026-10-21: "Do we have to
# have the tellscale or nas way... why not another more permanent way"). The Wyze
# app shows these cameras by opening Wyze's own WebRTC (Amazon Kinesis) session
# from the phone: the video never crosses a NAS or a tunnel. The app can do the
# same. The NAS keeps the Wyze account (email, password, API key) and asks the
# bridge for ONE session's signaling, the same answer go2rtc's wyzeClient reads
# (internal/webrtc/kinesis.go: ClientId, servers, signalingUrl), and hands the
# signed-in viewer only that: a presigned wss:// URL to Amazon's signaling
# service and the session's TURN servers, both short-lived and good for that
# camera alone. The browser then does what kinesisClient does. The NAS road
# stays for every camera not on Wyze's WebRTC road, for recordings, and as the
# road a tile falls back to. Brakes: one offer per camera per DIRECT_MIN_SECONDS
# (each is a Wyze API call through the bridge); stop-path CAMS_DIRECT=0.
DIRECT_ON = os.environ.get("CAMS_DIRECT", "1") != "0"
DIRECT_MIN_SECONDS = float(os.environ.get("CAMS_DIRECT_MIN_SECONDS", "3"))
DIRECT_LAST = {}
DIRECT_LOCK = threading.Lock()
KVS_SIGNALING_HOST = re.compile(r"^[a-z0-9.-]+\.amazonaws\.com(\.cn)?$")


def kvs_direct_session(uri, api=None, auth=None, timeout=15.0, opener=None):
    """One Wyze WebRTC session's signaling for the browser -> (status, body).
    Only an Amazon wss:// signaling URL and stun:/turn: servers are ever handed on;
    the bridge's own sign-in and the Wyze account stay on the NAS."""
    api = (api or BRIDGE_API).rstrip("/")
    user, pw = auth if auth is not None else bridge_web_auth()
    if not (user and pw):
        return 503, {"error": "no-web-sign-in", "detail": "the bridge has no web sign-in kept"}
    req = urllib.request.Request(api + "/signaling/%s?kvs" % urllib.parse.quote(str(uri), safe=""),
                                 headers={"Authorization": "Basic " + base64.b64encode(("%s:%s" % (user, pw)).encode("utf-8")).decode("ascii")})
    try:
        with (opener or urllib.request.urlopen)(req, timeout=timeout) as r:
            doc = json.loads(r.read(256 * 1024).decode("utf-8"))
    except urllib.error.HTTPError as e:
        return 502, {"error": "bridge-refused", "detail": "the bridge answered HTTP %d" % e.code}
    except (urllib.error.URLError, OSError, ValueError) as e:
        return 502, {"error": "bridge-unreachable", "detail": scrub_text(getattr(e, "reason", e), 120)}
    if not isinstance(doc, dict) or doc.get("result") != "ok":
        word = scrub_text((doc.get("result") if isinstance(doc, dict) else None) or "no result", 160)
        return 502, {"error": "wyze-refused", "detail": "Wyze offered no WebRTC session: %s" % word}
    url = doc.get("signalingUrl")
    try:
        u = urllib.parse.urlsplit(url if isinstance(url, str) else "")
    except ValueError:
        u = None
    if not u or u.scheme != "wss" or not KVS_SIGNALING_HOST.match((u.hostname or "").lower()):
        return 502, {"error": "bad-signaling", "detail": "the session named no Amazon signaling address"}
    servers = []
    raw = doc.get("servers")
    if isinstance(raw, str):
        try:
            raw = json.loads(raw)
        except ValueError:
            raw = None
    for sv in raw if isinstance(raw, list) else []:
        if not isinstance(sv, dict):
            continue
        urls = sv.get("urls") if sv.get("urls") is not None else sv.get("url")
        urls = [urls] if isinstance(urls, str) else [x for x in (urls or []) if isinstance(x, str)]
        urls = [x for x in urls if re.match(r"^(stun|turns?):", x)]
        if not urls:
            continue
        one = {"urls": urls}
        if isinstance(sv.get("username"), str):
            one["username"] = sv["username"]
        if isinstance(sv.get("credential"), str):
            one["credential"] = sv["credential"]
        servers.append(one)
    client = doc.get("ClientId")
    return 200, {"signaling_url": url, "ice_servers": servers, "client_id": client if isinstance(client, str) else ""}


KVS_PROBE_SECONDS = float(os.environ.get("CAMS_KVS_PROBE_SECONDS", "30"))
KVS_PROBE_BYTES = int(os.environ.get("CAMS_KVS_PROBE_BYTES", "16384"))


def stream_bytes(upstream, stream_id, seconds=None, want=None, opener=None):
    """Read the camera's live MP4 from go2rtc (the stream the app's live view
    opens) until `want` bytes or `seconds` pass -> {ok, bytes, ms, error?}.
    ms is the time to `want` bytes when ok. Bounded: never longer than seconds."""
    seconds = KVS_PROBE_SECONDS if seconds is None else float(seconds)
    want = KVS_PROBE_BYTES if want is None else int(want)
    opener = opener or urllib.request.urlopen
    t0 = time.time()
    got = 0
    try:
        # go2rtc holds the answer until the producer has dialled the camera, and a
        # Kinesis connect (signaling, ICE, DTLS, the first key frame) can take most
        # of the window: the connect gets the whole probe, not a slice of it.
        r = opener(upstream.rstrip("/") + "/api/stream.mp4?src=" + urllib.parse.quote(stream_id), timeout=seconds)
    except urllib.error.HTTPError as e:
        return {"ok": False, "bytes": 0, "ms": int((time.time() - t0) * 1000), "error": scrub_text(e.read(1024).decode("utf-8", "replace").strip() or ("HTTP %d" % e.code), 200)}
    except (urllib.error.URLError, OSError, ValueError) as e:
        return {"ok": False, "bytes": 0, "ms": int((time.time() - t0) * 1000), "error": scrub_text(getattr(e, "reason", e), 200)}
    try:
        while got < want and time.time() - t0 < seconds:
            try:
                chunk = r.read(min(65536, want - got))
            except (socket.timeout, OSError):
                break
            if not chunk:
                break
            got += len(chunk)
    finally:
        try:
            r.close()
        except Exception:  # noqa: BLE001
            pass
    ms = int((time.time() - t0) * 1000)
    if got >= want:
        return {"ok": True, "bytes": got, "ms": ms}
    return {"ok": False, "bytes": got, "ms": ms, "error": "%d bytes in %d s" % (got, int(seconds)) if got else "no byte in %d s" % int(seconds)}


def _query_of(url):
    try:
        return urllib.parse.parse_qs(urllib.parse.urlsplit(str(url)).query)
    except ValueError:
        return {}


def mac_of(url):
    return norm_mac(_query_of(url).get("mac", [""])[0])


def host_of(url):
    try:
        return urllib.parse.urlsplit(str(url)).hostname or ""
    except ValueError:
        return ""


def dtls_of(url):
    return _query_of(url).get("dtls", [""])[0].strip().lower() in ("true", "1", "yes")


# A CAMERA THAT MOVED, AND A DIRECT ROAD THAT STAYS DARK (DR-0835; Darrell
# 2026-10-09: "its working in Wyze!!!!!!!!! Fix that!!!!!!!!!!!!! We should
# have video!!!!!!!!!!!"). cams-diag 37879231884 read go2rtc on basketball_cam:
# "wyze: connect failed: discovery timeout" -- the direct road dials the
# address written into its wyze:// line, and a camera that took a new DHCP
# lease is dialled at the old one for ever. Two answers, both from the NAS
# alone: (1) the bridge's own listing says where Wyze sees each camera today,
# so a direct line whose host differs is RE-ADDRESSED; (2) a direct-road camera
# that keeps failing to connect (the snapshot breaker tripped on a connect-class
# reason, or someone watching it with no byte arriving for DIRECT_DEAD_SECONDS
# over DIRECT_DRY_TRIES tries) rides the bridge as `direct-unreachable`, and
# the direct road is tried again after DIRECT_RETRY_SECONDS -- the bridge
# relays through Wyze when the LAN does not answer, which is what the Wyze app
# does. No road is assumed reachable from its address alone.
DIRECT_RETRY_SECONDS = float(os.environ.get("CAMS_DIRECT_RETRY_SECONDS", "3600"))
DIRECT_DEAD_SECONDS = float(os.environ.get("CAMS_DIRECT_DEAD_SECONDS", "300"))
DIRECT_DRY_TRIES = int(os.environ.get("CAMS_DIRECT_DRY_TRIES", "3"))
CONNECT_FAILURE = re.compile(r"(?i)discovery timeout|connect failed|i/o timeout|no route to host|connection refused|network is unreachable")


def readdress(url, ip):
    """The same wyze:// line at the address Wyze reports today. The line itself
    when the address is the same, missing or not an address, or the line is
    not a direct Wyze line. Pure."""
    if kind_of(url) != "wyze" or is_bridge_source(url) or is_kvs_source(url) or not ip:
        return url
    try:
        ipaddress.ip_address(str(ip))
    except ValueError:
        return url
    host = host_of(url)
    if not host or host == str(ip):
        return url
    try:
        u = urllib.parse.urlsplit(str(url))
    except ValueError:
        return url
    return urllib.parse.urlunsplit((u.scheme, u.netloc.replace(host, str(ip), 1), u.path, u.query, u.fragment))


def failing_cameras(breakers=None, now=None):
    """The cameras whose snapshot breaker is tripped on a connect-class reason -> {cam: reason}."""
    if breakers is None:
        with BREAKER_LOCK:
            src = dict((k, dict(v)) for k, v in BREAKERS.items())
    else:
        src = breakers
    out = {}
    for cam, b in src.items():
        if isinstance(b, dict) and int(b.get("fails", 0) or 0) >= BREAKER_FAILS and CONNECT_FAILURE.search(str(b.get("last") or "")):
            out[cam] = str(b.get("last") or "")
    return out


def lan_networks(now=None, runner=None, env=None):
    """The networks this NAS sits on (what go2rtc's direct road can reach):
    CAMS_LAN_CIDRS when set, else `ip -4 -o addr` minus loopback and link-local.
    Cached LAN_CACHE_SECONDS. A list of ipaddress networks; [] when unknown."""
    now = time.time() if now is None else now
    env = os.environ if env is None else env
    if _LAN_CACHE["nets"] is not None and now - _LAN_CACHE["at"] < LAN_CACHE_SECONDS and runner is None:
        return _LAN_CACHE["nets"]
    nets = []
    override = env.get("CAMS_LAN_CIDRS", "")
    if override.strip():
        for part in override.split(","):
            try:
                nets.append(ipaddress.ip_network(part.strip(), strict=False))
            except ValueError:
                pass
    else:
        try:
            out = (runner or (lambda: subprocess.run(["ip", "-4", "-o", "addr", "show"], capture_output=True, text=True, timeout=3).stdout))()
        except (OSError, subprocess.SubprocessError):
            out = ""
        for m in re.finditer(r"\binet\s+(\d+\.\d+\.\d+\.\d+/\d+)", out or ""):
            try:
                n = ipaddress.ip_network(m.group(1), strict=False)
            except ValueError:
                continue
            if n.is_loopback or n.is_link_local:
                continue
            nets.append(n)
    if runner is None:
        _LAN_CACHE["nets"] = nets
        _LAN_CACHE["at"] = now
    return nets


def bridge_road_wanted(url, lans):
    """Does this wyze:// source need the bridge? (wanted, reason). Pure."""
    if kind_of(url) != "wyze" or is_bridge_source(url) or is_kvs_source(url):
        return False, ""
    host = host_of(url)
    if host and lans:
        try:
            ip = ipaddress.ip_address(host)
            if not any(ip in n for n in lans):
                return True, "other-network"
        except ValueError:
            pass
    if not dtls_of(url):
        return True, "no-dtls"
    return False, ""


def roads_load(path=None):
    path = path or BRIDGE_ROADS_FILE
    try:
        with open(path, "r", encoding="utf-8") as fh:
            doc = json.load(fh)
    except (OSError, ValueError):
        return {}
    return doc if isinstance(doc, dict) else {}


def roads_save(doc, path=None):
    path = path or BRIDGE_ROADS_FILE
    try:
        os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
        tmp = path + ".tmp"
        fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            json.dump(doc, fh, indent=1)
        os.replace(tmp, path)
        return True
    except OSError:
        return False


def roads_public(doc):
    """The roads without a URL (direct URLs carry the enr secret)."""
    out = {}
    for sid, rec in (doc or {}).items():
        if isinstance(rec, dict):
            out[sid] = {"road": rec.get("road") or "direct", "uri": rec.get("uri"), "reason": rec.get("reason"),
                        "since": rec.get("since"), "forced": rec.get("forced"),
                        "readdressed": rec.get("readdressed"), "why": rec.get("why"),
                        "judged": rec.get("judged")}
    return out


def set_stream_source(upstream, name, src, config_path=None, log=print, timeout=None):
    """Make go2rtc's stream `name` read from `src` (PUT replaces the producer),
    and make the config say the same (go2rtc writes it on a PUT it accepts; when
    it refuses, DR-0789, the forwarder rewrites the line). Answers True when
    either the running go2rtc or the config now carries it."""
    config_path = config_path or GO2RTC_YAML_PATH
    q = urllib.parse.urlencode([("name", name), ("src", src)])
    registered = False
    try:
        req = urllib.request.Request(upstream.rstrip("/") + "/api/streams?" + q, method="PUT")
        with urllib.request.urlopen(req, timeout=timeout or HEALTH_TIMEOUT) as r:
            r.read(4096)
        registered = True
    except urllib.error.HTTPError as e:
        # go2rtc's own reason: streams.New refused the source, or the stream is
        # live and only app.PatchConfig failed to write the file (DR-1097, seventh read).
        try:
            why = scrub_text(e.read(300).decode("utf-8", "replace").strip(), 160)
        except Exception:  # noqa: BLE001
            why = ""
        log("bridge-road: go2rtc refused PUT %s (HTTP %d%s); the config line is rewritten directly (DR-0789)" % (name, e.code, ": " + why if why else ""))
    except (urllib.error.URLError, OSError):
        log("bridge-road: go2rtc unreachable while setting %s" % name)
        return False
    # The config must say what memory says (DR-0787): replace the line when it differs.
    try:
        with open(config_path, "r", encoding="utf-8") as fh:
            text = fh.read()
        cur = re.search(r"^\s{2}%s:\s*(.*)$" % re.escape(name), text, re.M)
        cur_val = cur.group(1).strip() if cur else None
        if cur_val is not None and cur_val.strip("'\"") != src:
            remove_stream_entry(config_path, name)
        if cur_val is None or cur_val.strip("'\"") != src:
            write_stream_entry(config_path, name, src)
    except OSError:
        pass
    return True


def stream_source_url(entry):
    """The first producer URL of a go2rtc /api/streams entry, or None."""
    if not isinstance(entry, dict):
        return None
    for p in entry.get("producers") or []:
        if isinstance(p, dict) and p.get("url"):
            return p.get("url")
    return None


def ensure_bridge_roads(upstream, streams, bridge_cams, lans=None, roads=None, log=print, config_path=None, roads_path=None, now=None, only=None, failing=None, unreachable=None):
    """Put every Wyze camera on the road that works (DR-0809) and keep the record.
    streams: go2rtc GET /api/streams. bridge_cams: bridge_cameras(). lans:
    lan_networks(). roads: the kept record (loaded when None). failing: the
    cameras whose snapshot breaker tripped on a connect-class reason {id: why};
    unreachable: the cameras watched with no byte arriving (StreamHealth).
    Answers {to_bridge, to_direct, resigned, readdressed, retried, unknown, kept, known},
    plus sd_main: the bridged cameras whose SD twin was moved off `-sub` (DR-0979)."""
    now = time.time() if now is None else now
    lans = lan_networks() if lans is None else lans
    roads = roads_load(roads_path) if roads is None else roads
    failing = failing or {}
    unreachable = unreachable or {}
    by_mac = by_mac_main(bridge_cams)
    by_mac_ip = dict((c["mac"], c["ip"]) for c in (bridge_cams or []) if c.get("mac") and c.get("ip"))
    out = {"to_bridge": [], "to_direct": [], "resigned": [], "readdressed": [], "retried": [], "unknown": [], "kept": 0, "known": len(by_mac)}
    if not isinstance(streams, dict):
        return out
    ids = set(streams.keys())
    judging = judging_now()
    for sid, entry in sorted(streams.items()):
        if only and sid != only:
            continue
        if not CAMERA_ID.match(str(sid)) or is_twin(sid) or not isinstance(entry, dict):
            continue
        url = None
        for p in entry.get("producers") or []:
            if isinstance(p, dict) and p.get("url"):
                url = p.get("url")
                break
        if not url:
            continue
        rec = roads.get(sid) if isinstance(roads.get(sid), dict) else {}
        if sid in judging:
            out["kept"] += 1
            continue
        forced = rec.get("forced") if rec.get("forced") in ("bridge", "direct", "kvs") else None
        # WYZE'S OWN WEBRTC ROAD (DR-1097). A camera on it belongs to the judge
        # (judge_pass); here it is only re-signed when the bridge's web sign-in
        # changed, moved off when the owner picks another road, and put on it
        # when the owner picks "kvs".
        if is_kvs_source(url) or forced == "kvs":
            if is_kvs_source(url):
                uri = rec.get("uri") or kvs_uri_of(url)
            elif is_bridge_source(url):
                uri = rec.get("uri") or urllib.parse.urlsplit(url.partition("#")[0]).path.rsplit("/", 1)[-1]
            else:
                uri = rec.get("uri") or by_mac.get(mac_of(url), "")
            uri = main_uri(uri)
            on_kvs = is_kvs_source(url)
            if on_kvs and forced == "bridge" and uri:
                target, road = bridge_source(uri), "bridge"
            elif on_kvs and forced == "direct" and rec.get("direct"):
                target, road = rec["direct"], "direct"
            else:
                target, road = (kvs_source(uri) if uri else None), "kvs"
            if not target or (road == "kvs" and on_kvs and rec.get("kvs") == target):
                out["kept"] += 1
                continue
            if not set_stream_source(upstream, sid, target, config_path, log):
                continue
            twin = restream_source(sid) if road == "kvs" else sd_source(target)
            if twin:
                set_stream_source(upstream, sd_of(sid), twin, config_path, log)
            if road == "kvs":
                roads[sid] = dict(rec, road="kvs", kvs=target, uri=uri, forced=forced,
                                  since=rec.get("since") if on_kvs else now, reason=rec.get("reason") if on_kvs else "forced",
                                  bridge=rec.get("bridge") or (url if is_bridge_source(url) else None),
                                  direct=rec.get("direct") or (url if not on_kvs and not is_bridge_source(url) else None))
                (out["resigned"] if on_kvs else out.setdefault("to_kvs", [])).append(sid)
                log("bridge-road: %s %s Wyze's own WebRTC road (Kinesis, through the bridge's signaling)" % (sid, "re-signed on" if on_kvs else "now rides"))
            elif road == "bridge":
                roads[sid] = dict(rec, road="bridge", bridge=target, uri=uri, since=now, forced=forced, reason="forced")
                out["to_bridge"].append(sid)
                log("bridge-road: %s now rides the Wyze bridge as %s (forced)" % (sid, uri))
            else:
                roads[sid] = dict(rec, road="direct", since=now, forced=forced, reason="forced")
                out["to_direct"].append(sid)
                log("bridge-road: %s is back on go2rtc's direct road (forced)" % sid)
            continue
        if kind_of(url) == "wyze" and not is_bridge_source(url):
            # THE ADDRESS WYZE REPORTS TODAY (DR-0835): a direct line dialling
            # an address the camera no longer holds is re-addressed first, twin
            # included, and the road is judged on the line as it now is.
            ip_now = by_mac_ip.get(mac_of(url))
            moved = readdress(url, ip_now)
            if moved != url:
                if not set_stream_source(upstream, sid, moved, config_path, log):
                    continue
                set_stream_source(upstream, sd_of(sid), sd_source(moved), config_path, log)
                roads[sid] = dict(rec, road="direct", direct=moved, readdressed={"from": host_of(url), "to": ip_now, "at": now})
                rec = roads[sid]
                out["readdressed"].append(sid)
                log("bridge-road: %s re-addressed from %s to %s, where Wyze says it is today" % (sid, host_of(url), ip_now))
                url = moved
            wanted, reason = bridge_road_wanted(url, lans)
            why = None
            if not wanted and forced is None and (sid in failing or sid in unreachable):
                wanted, reason = True, "direct-unreachable"
                why = failing.get(sid) or "watched with no byte arriving for %ds" % int(unreachable[sid].get("since_bytes", 0))
            if forced == "direct" or (not wanted and forced != "bridge"):
                out["kept"] += 1
                continue
            uri = by_mac.get(mac_of(url))
            if not uri:
                out["unknown"].append(sid)
                roads[sid] = dict(rec, road="direct", direct=url, reason=reason or "forced", forced=forced, unknown_to_bridge=True)
                continue
            new = bridge_source(uri)
            if not set_stream_source(upstream, sid, new, config_path, log):
                continue
            sd_name = sd_of(sid)
            set_stream_source(upstream, sd_name, sd_source(new), config_path, log)
            roads[sid] = {"road": "bridge", "direct": url, "bridge": new, "uri": uri, "reason": reason if wanted else "forced", "since": now, "forced": forced,
                          "readdressed": rec.get("readdressed"), "why": why}
            out["to_bridge"].append(sid)
            log("bridge-road: %s now rides the Wyze bridge as %s (%s%s)" % (sid, uri, roads[sid]["reason"], (": " + why) if why else ""))
        elif is_bridge_source(url):
            direct = rec.get("direct")
            # The kept direct line follows the camera's address too, so the
            # hand-back dials where the camera is, not where it was.
            ip_now = by_mac_ip.get(mac_of(direct)) if direct else None
            if direct and ip_now and readdress(direct, ip_now) != direct:
                rec = dict(rec, direct=readdress(direct, ip_now), readdressed={"from": host_of(direct), "to": ip_now, "at": now})
                direct = rec["direct"]
                roads[sid] = rec
            # A camera here for being UNREACHABLE is not handed back on its
            # address alone (the address is what failed): it waits the retry
            # window, then the direct road is tried again.
            parked = rec.get("reason") == "direct-unreachable" and forced is None
            retry_due = parked and (now - float(rec.get("since") or 0)) >= DIRECT_RETRY_SECONDS
            back = forced == "direct" or (forced != "bridge" and direct and not bridge_road_wanted(direct, lans)[0] and (not parked or retry_due))
            if not back or not direct:
                # Staying on the bridge. The line go2rtc holds must be the line the
                # bridge accepts TODAY: the second field read (cams-diag 37717592345)
                # found 805_north already on the bridge road with the line the first
                # install wrote, before the stream credentials existed, so every
                # sync "kept" it and go2rtc kept answering "user/pass not provided".
                # Compared against the RECORD, not the producer URL go2rtc echoes,
                # so a sync re-signs once and never loops.
                uri = main_uri(rec.get("uri") or urllib.parse.urlsplit(url.partition("#")[0]).path.rsplit("/", 1)[-1])
                want = bridge_source(uri) if uri else None
                if want and rec.get("bridge") != want:
                    if not set_stream_source(upstream, sid, want, config_path, log):
                        continue
                    set_stream_source(upstream, sd_of(sid), sd_source(want), config_path, log)
                    roads[sid] = dict(rec, road="bridge", bridge=want, uri=uri, since=rec.get("since") or now, forced=forced)
                    out["resigned"].append(sid)
                    log("bridge-road: %s re-signed with the bridge's current stream line" % sid)
                    continue
                # A twin still on the bridge's `-sub` (written before DR-0979)
                # is moved to the main stream once. Read from the URL go2rtc
                # echoes, by its path alone, so a credentialed line cannot loop.
                sd_url = stream_source_url(streams.get(sd_of(sid)))
                if sd_url and urllib.parse.urlsplit(sd_url.partition("#")[0]).path.endswith(BRIDGE_SUB_SUFFIX):
                    if set_stream_source(upstream, sd_of(sid), sd_source(rec.get("bridge") or want or sd_url), config_path, log):
                        out.setdefault("sd_main", []).append(sid)
                        log("bridge-road: %s's SD twin moved off the bridge's -sub stream to its main stream (DR-0979)" % sid)
                # The record follows the line go2rtc holds: a record that says
                # "kvs" over a bridge line would tell the app the wrong road.
                if rec.get("road") != "bridge":
                    roads[sid] = dict(roads.get(sid) or rec, road="bridge")
                    out.setdefault("healed", []).append(sid)
                    log("bridge-road: %s's record said %s while go2rtc holds the bridge line; the record now says bridge" % (sid, rec.get("road")))
                out["kept"] += 1
                continue
            if not set_stream_source(upstream, sid, direct, config_path, log):
                continue
            sd_name = sd_of(sid)
            if sd_name in ids or True:
                set_stream_source(upstream, sd_name, sd_source(direct), config_path, log)
            roads[sid] = dict(rec, road="direct", reason="forced" if forced == "direct" else ("retrying-direct" if retry_due else "reachable-again"), since=now, forced=forced)
            out["to_direct"].append(sid)
            if retry_due:
                out["retried"].append(sid)
            log("bridge-road: %s is back on go2rtc's direct road (%s)" % (sid, roads[sid]["reason"]))
    roads_save(roads, roads_path)
    with BRIDGE_LOCK:
        BRIDGE_LAST.clear()
        BRIDGE_LAST.update({"at": now, "reachable": bridge_cams is not None, "known": len(by_mac),
                            "bridged": sum(1 for r in roads.values() if isinstance(r, dict) and r.get("road") == "bridge"),
                            "kvs": sum(1 for r in roads.values() if isinstance(r, dict) and r.get("road") == "kvs"),
                            "unknown": list(out["unknown"]), "moved": len(out["to_bridge"]) + len(out["to_direct"])})
    return out


def bridge_snapshot():
    with BRIDGE_LOCK:
        last = dict(BRIDGE_LAST)
    return {"configured": bridge_configured(), "api": BRIDGE_API, "rtsp": BRIDGE_RTSP, "last": last,
            "kvs_on": KVS_ON, "judge": judge_snapshot(), "kvs_hold": KVS_HOLD.snapshot(),
            "go2rtc_release": dict(RELEASE_LAST, after=RELEASE_AFTER, min_s=int(RELEASE_MIN_SECONDS))}


def sync_bridge_roads(upstream, streams=None, log=print, config_path=None, roads_path=None, only=None):
    """One sync from live inputs: the bridge's listing, the NAS's networks, go2rtc's streams."""
    if streams is None:
        try:
            with urllib.request.urlopen(upstream.rstrip("/") + "/api/streams", timeout=HEALTH_TIMEOUT) as r:
                streams = json.loads(r.read(4 * 1024 * 1024).decode("utf-8"))
        except (urllib.error.URLError, OSError, ValueError):
            return None
    cams = bridge_cameras()
    if cams is None:
        with BRIDGE_LOCK:
            BRIDGE_LAST.update({"at": time.time(), "reachable": False})
        return None
    with ROADS_LOCK:
        return ensure_bridge_roads(upstream, streams, cams, log=log, config_path=config_path, roads_path=roads_path, only=only,
                                   failing=failing_cameras(), unreachable=STREAM_HEALTH.unreachable_cameras())


# THE ROAD JUDGE (DR-1097). A road is kept because it carried video, never
# because of its address or its name. A Wyze camera on the bridge or on Wyze's
# WebRTC road that gave no byte for KVS_DARK_SECONDS (or none the sampler
# remembers) is judged: its current road is read the way the app's live view
# reads it (stream_bytes); when that carries nothing, the other road is put on
# the same stream and read the same way; the road that carried video stays,
# and when neither did the camera is put back where it was and named dark on
# both. Every verdict is kept in the roads record (`judged`) and printed by
# cams-diag and /streams/roads, so "why is this tile blank" has a measured
# answer per camera.
# BRAKES (deterministic class, DR-0248): a budget (KVS_JUDGE_PER_PASS cameras,
# each probe bounded by KVS_PROBE_SECONDS, the pass by KVS_PASS_SECONDS), a
# lock (one pass at a time, in its own thread, so the sampler never waits on
# Wyze), and a camera judged is not judged again for KVS_REJUDGE_SECONDS.
# Stop-path: CAMS_KVS=0. A camera the owner pinned to a road is never judged.
KVS_JUDGE_PER_PASS = max(1, int(os.environ.get("CAMS_KVS_JUDGE_PER_PASS", "3")))
KVS_DARK_SECONDS = float(os.environ.get("CAMS_KVS_DARK_SECONDS", "900"))
KVS_REJUDGE_SECONDS = float(os.environ.get("CAMS_KVS_REJUDGE_SECONDS", "3600"))
KVS_PASS_SECONDS = float(os.environ.get("CAMS_KVS_PASS_SECONDS", "240"))
# A verdict taken by an older judge is not trusted for the hour: version 2 asks
# Wyze by the camera's main name (version 1 asked by its `-sub` and heard
# "cam not found"), so every version-1 verdict is judged again at once.
JUDGE_VERSION = 2
_JUDGE_LOCK = threading.Lock()
JUDGE_LAST = {}  # the last pass, for /health: {at, judged, moved, dark, kept}
# The camera the judge has put on its other road to read it. The road sync
# leaves it alone until the judge is done: the third field read found the sync
# writing "kvs" into the record of a camera the judge was only trying, and the
# judge putting the bridge line back under a record that still said "kvs".
JUDGING = set()


def judging_now():
    with BRIDGE_LOCK:
        return set(JUDGING)


def go2rtc_said(upstream, stream_id, limit=3):
    """go2rtc's own last log lines naming this stream, scrubbed (why a road carried nothing); [] when none."""
    try:
        with urllib.request.urlopen(upstream.rstrip("/") + "/api/log", timeout=HEALTH_TIMEOUT) as r:
            text = r.read(2 * 1024 * 1024).decode("utf-8", "replace")
    except (urllib.error.URLError, OSError, ValueError):
        return []
    # Only lines that are about THIS stream or the WebRTC road: the bridge's
    # i/o-timeout wall names no stream and would bury the one line that says why.
    keep = [l for l in log_lines_for(text, stream_id, limit=400) if stream_id.lower() in l.lower() or "webrtc" in l.lower() or "kinesis" in l.lower()]
    return [l[:240] for l in keep[-limit:]]


def current_source(upstream, stream_id, timeout=None):
    """The source go2rtc holds for one stream right now; None when it has none or does not answer."""
    try:
        with urllib.request.urlopen(upstream.rstrip("/") + "/api/streams", timeout=timeout or HEALTH_TIMEOUT) as r:
            streams = json.loads(r.read(4 * 1024 * 1024).decode("utf-8"))
    except (urllib.error.URLError, OSError, ValueError):
        return None
    return stream_source_url(streams.get(stream_id)) if isinstance(streams, dict) else None


def judge_candidates(streams, roads, health=None, now=None, dark=None, rejudge=None, offline=None):
    """The Wyze cameras to judge, in order (never judged first, then the longest
    since judged): on the bridge or Wyze's WebRTC road, not pinned by the owner,
    not judged within `rejudge`, no byte for `dark` seconds, and not one Wyze's
    own list calls offline (`offline`, DR-1097 thirteenth read: every judgement
    of such a camera was a Kinesis offer nobody could answer, and go2rtc 1.9.14
    never closes the PeerConnection an unanswered offer leaves behind)."""
    health = health or STREAM_HEALTH
    offline = offline or set()
    now = time.time() if now is None else now
    dark = KVS_DARK_SECONDS if dark is None else float(dark)
    rejudge = KVS_REJUDGE_SECONDS if rejudge is None else float(rejudge)
    out = []
    for sid, entry in (streams or {}).items():
        if not CAMERA_ID.match(str(sid)) or is_twin(sid) or not isinstance(entry, dict):
            continue
        if sid in offline:
            continue
        url = stream_source_url(entry)
        if not url or not (is_bridge_source(url) or is_kvs_source(url)):
            continue
        rec = roads.get(sid) if isinstance(roads.get(sid), dict) else {}
        if rec.get("forced"):
            continue
        j = rec.get("judged") if isinstance(rec.get("judged"), dict) else {}
        if j.get("at") and now - float(j["at"]) < rejudge and int(j.get("v") or 1) >= JUDGE_VERSION:
            continue
        last = health.last_bytes_at(sid)
        if last is not None and now - last < dark:
            continue
        out.append((float(j.get("at") or 0), sid))
    return [sid for _, sid in sorted(out)]


def _uri_from(url, rec):
    if rec.get("uri"):
        return main_uri(rec["uri"])
    if is_kvs_source(url):
        return main_uri(kvs_uri_of(url))
    if is_bridge_source(url):
        return main_uri(urllib.parse.urlsplit(url.partition("#")[0]).path.rsplit("/", 1)[-1])
    return ""


def judge_camera(upstream, sid, log=print, now=None, probe=None, signal=None, config_path=None, roads_path=None):
    """Judge one camera's road by the video it carries (see THE ROAD JUDGE). Answers the verdict kept in the record."""
    now = time.time() if now is None else now
    probe = probe or (lambda up, s: stream_bytes(up, s))
    signal = signal or bridge_kvs_signal
    cur = current_source(upstream, sid)
    if not cur or not (is_bridge_source(cur) or is_kvs_source(cur)):
        return {"at": now, "skipped": "not on the bridge or Wyze's WebRTC road"}
    cur_road = "kvs" if is_kvs_source(cur) else "bridge"
    verdict = {"at": now, "v": JUDGE_VERSION, "current": cur_road, "current_probe": probe(upstream, sid)}

    def keep(rec_update=None, line=None):
        with ROADS_LOCK:
            roads = roads_load(roads_path)
            rec = roads.get(sid) if isinstance(roads.get(sid), dict) else {}
            rec = dict(rec, **(rec_update or {}))
            rec["judged"] = verdict
            roads[sid] = rec
            roads_save(roads, roads_path)
        if line:
            log(line)
        return verdict

    if verdict["current_probe"].get("ok"):
        verdict["kept"] = cur_road
        return keep()
    with ROADS_LOCK:
        rec = roads_load(roads_path).get(sid) or {}
    uri = _uri_from(cur, rec)
    if not uri:
        verdict["kept"] = cur_road
        verdict["why"] = "the bridge's name for this camera is unknown"
        return keep()
    if cur_road == "bridge":
        sig = signal(uri)
        verdict["kvs_signal"] = sig.get("result")
        if sig.get("result") != "ok":
            verdict["kept"] = cur_road
            verdict["dark"] = True
            return keep(line="judge: %s gives no video on the bridge (%s), and Wyze offers no WebRTC road for it: %s" % (sid, verdict["current_probe"].get("error"), sig.get("result")))
        alt, alt_road = kvs_source(uri), "kvs"
    else:
        alt, alt_road = bridge_source(uri), "bridge"
    if not alt:
        verdict["kept"] = cur_road
        verdict["why"] = "no line for the %s road (the bridge's sign-in is missing)" % alt_road
        return keep()
    with ROADS_LOCK:
        if current_source(upstream, sid) != cur:
            verdict["skipped"] = "the road changed while it was judged"
            return verdict
        with BRIDGE_LOCK:
            JUDGING.add(sid)
        if not set_stream_source(upstream, sid, alt, config_path, log):
            with BRIDGE_LOCK:
                JUDGING.discard(sid)
            verdict["kept"] = cur_road
            verdict["why"] = "go2rtc would not take the %s line" % alt_road
            return keep()
    try:
        return _judge_alt(upstream, sid, verdict, cur, cur_road, alt, alt_road, uri, rec, keep, log, probe, config_path)
    finally:
        with BRIDGE_LOCK:
            JUDGING.discard(sid)


def _judge_alt(upstream, sid, verdict, cur, cur_road, alt, alt_road, uri, rec, keep, log, probe, config_path):
    """The second half of judge_camera: the other road is on the stream; read it and keep what carried video."""
    now = verdict["at"]
    verdict["alt"] = alt_road
    verdict["alt_probe"] = probe(upstream, sid)
    if verdict["alt_probe"].get("ok"):
        twin = restream_source(sid) if alt_road == "kvs" else sd_source(alt)
        if twin:
            set_stream_source(upstream, sd_of(sid), twin, config_path, log)
        verdict["kept"] = alt_road
        upd = {"road": alt_road, "uri": uri, "since": now}
        if alt_road == "kvs":
            upd.update({"kvs": alt, "bridge": rec.get("bridge") or cur, "reason": "tutk-dark"})
        else:
            upd.update({"bridge": alt, "reason": "kvs-dark"})
        return keep(upd, "judge: %s now rides %s: %d bytes in %d ms (the %s road gave %s)" % (
            sid, "Wyze's own WebRTC road" if alt_road == "kvs" else "the Wyze bridge", verdict["alt_probe"].get("bytes", 0),
            verdict["alt_probe"].get("ms", 0), cur_road, verdict["current_probe"].get("error") or "nothing"))
    said = go2rtc_said(upstream, sid)
    if said:
        verdict["go2rtc_said"] = said
    back = (rec.get("bridge") if cur_road == "bridge" else rec.get("kvs")) or cur
    set_stream_source(upstream, sid, back, config_path, log)
    verdict["kept"] = cur_road
    verdict["dark"] = True
    # The record names the road go2rtc holds again, whatever was written meanwhile.
    return keep({"road": cur_road}, line="judge: %s is dark on both roads: the bridge gave %s; Wyze's WebRTC gave %s" % (
        sid, (verdict["current_probe"] if cur_road == "bridge" else verdict["alt_probe"]).get("error"),
        (verdict["alt_probe"] if cur_road == "bridge" else verdict["current_probe"]).get("error")))


# THE CAMERAS GO2RTC'S SIGN-IN DROPS (DR-1097, sixth read; Darrell 2026-10-18,
# the Wyze app showing "805 Porch - Floodlight Cam - East" and "805 Floodlight
# Cam - West" live). go2rtc 1.9.14 lists the Wyze account and skips every
# camera Wyze gives no IP (pkg/wyze/cloud.go: "skip cameras without IP (gwell
# protocol)"), so the Floodlight Pros never became streams and the app never
# showed them. The bridge still lists them, and Wyze's WebRTC road needs no IP.
# A camera the bridge lists that no go2rtc stream and no roads record carries is
# asked of Wyze's signaling; on "ok" it is added on that road, named by its Wyze
# nickname, with its restreamed twin. A camera the family later removes keeps
# its record, so it is never added back.
# BRAKES (deterministic class, DR-0248): KVS_ADD_PER_PASS a pass, a camera Wyze
# refused is asked again only after KVS_ADD_RETRY_SECONDS, inside the judge's
# own thread and lock; stop-paths CAMS_KVS=0 or CAMS_ADD_MISSING=0.
ADD_MISSING_ON = os.environ.get("CAMS_ADD_MISSING", "1") != "0"
KVS_ADD_PER_PASS = max(0, int(os.environ.get("CAMS_KVS_ADD_PER_PASS", "2")))
KVS_ADD_RETRY_SECONDS = float(os.environ.get("CAMS_KVS_ADD_RETRY_SECONDS", "3600"))
ADD_TRIED = {}  # bridge name -> (when, Wyze's word) for a camera not added yet


def missing_cameras(streams, bridge_cams, roads):
    """The bridge's cameras that no go2rtc stream and no roads record carries -> [{uri, mac, nickname}]."""
    by_mac = by_mac_main(bridge_cams)
    carried = set()
    for sid, entry in (streams or {}).items():
        url = stream_source_url(entry)
        if not url:
            continue
        if is_kvs_source(url):
            carried.add(main_uri(kvs_uri_of(url)))
        elif is_bridge_source(url):
            carried.add(main_uri(urllib.parse.urlsplit(url.partition("#")[0]).path.rsplit("/", 1)[-1]))
        elif mac_of(url) and by_mac.get(mac_of(url)):
            carried.add(by_mac[mac_of(url)])
    for rec in (roads or {}).values():
        if isinstance(rec, dict) and rec.get("uri"):
            carried.add(main_uri(rec["uri"]))
    out, seen = [], set()
    for c in bridge_cams or []:
        uri = c.get("uri") or ""
        if not uri or uri.endswith(BRIDGE_SUB_SUFFIX) or uri in carried or uri in seen:
            continue
        seen.add(uri)
        out.append({"uri": uri, "mac": c.get("mac") or "", "nickname": c.get("nickname") or uri})
    return out


def ensure_missing_cameras(upstream, streams, bridge_cams, log=print, config_path=None, roads_path=None, now=None, signal=None, budget=None):
    """Add the cameras go2rtc's sign-in dropped on Wyze's WebRTC road (see above). Answers {added, refused}."""
    now = time.time() if now is None else now
    signal = signal or bridge_kvs_signal
    budget = KVS_ADD_PER_PASS if budget is None else int(budget)
    out = {"added": [], "refused": {}}
    if not (KVS_ON and ADD_MISSING_ON) or budget <= 0 or not isinstance(streams, dict):
        return out
    with ROADS_LOCK:
        roads = roads_load(roads_path)
    asked = 0
    for cam in missing_cameras(streams, bridge_cams, roads):
        if asked >= budget:
            break
        uri = cam["uri"]
        tried = ADD_TRIED.get(uri)
        if tried and now - tried[0] < KVS_ADD_RETRY_SECONDS:
            out["refused"][uri] = tried[1]
            continue
        line = kvs_source(uri)
        if not line:
            break  # no web sign-in: nothing can be asked
        asked += 1
        word = signal(uri).get("result")
        if word != "ok":
            ADD_TRIED[uri] = (now, word)
            out["refused"][uri] = word
            log("bridge-road: %s is in the Wyze account but not in go2rtc, and Wyze's WebRTC road answered: %s" % (uri, word))
            continue
        with ROADS_LOCK:
            roads = roads_load(roads_path)
            sid = stream_name_for(cam["nickname"], set(streams.keys()) | set(roads.keys()))
            if not set_stream_source(upstream, sid, line, config_path, log):
                continue
            set_stream_source(upstream, sd_of(sid), restream_source(sid), config_path, log)
            roads[sid] = {"road": "kvs", "kvs": line, "uri": uri, "mac": cam["mac"], "reason": "not-in-go2rtc", "since": now, "added": now}
            roads_save(roads, roads_path)
        streams[sid] = {"producers": [{"url": line}]}
        ADD_TRIED.pop(uri, None)
        out["added"].append(sid)
        log("bridge-road: %s (%s) added on Wyze's own WebRTC road: go2rtc's Wyze sign-in skips a camera Wyze gives no address" % (sid, cam["nickname"]))
    return out


def judge_pass(upstream, log=print, config_path=None, roads_path=None, now=None, probe=None, signal=None, health=None, clock=None, offline=None):
    """One bounded pass of the road judge. Answers the summary kept for /health.
    `offline` is the set of stream ids Wyze calls offline; None asks Wyze's list."""
    clock = clock or time.time
    t0 = clock()
    now = t0 if now is None else now
    try:
        with urllib.request.urlopen(upstream.rstrip("/") + "/api/streams", timeout=HEALTH_TIMEOUT) as r:
            streams = json.loads(r.read(4 * 1024 * 1024).decode("utf-8"))
    except (urllib.error.URLError, OSError, ValueError):
        return None
    added = {"added": [], "refused": {}}
    if bridge_configured():
        bcams = bridge_cameras()
        if bcams:
            added = ensure_missing_cameras(upstream, streams, bcams, log=log, config_path=config_path, roads_path=roads_path, now=now, signal=signal)
    with ROADS_LOCK:
        roads = roads_load(roads_path)
    if offline is None:
        offline = wyze_offline_streams()
    todo = judge_candidates(streams, roads, health=health, now=now, offline=offline)
    summary = {"at": now, "waiting": len(todo), "judged": [], "moved": [], "dark": [], "kept": [],
               "added": added["added"], "add_refused": added["refused"],
               "wyze_offline": sorted(x for x in (offline or ()) if x in (streams or {})),
               "wyze_list": offline is not None}
    for sid in todo[:KVS_JUDGE_PER_PASS]:
        if clock() - t0 > KVS_PASS_SECONDS:
            break
        v = judge_camera(upstream, sid, log=log, now=clock(), probe=probe, signal=signal, config_path=config_path, roads_path=roads_path)
        summary["judged"].append(sid)
        if v.get("alt") and v.get("kept") == v.get("alt"):
            summary["moved"].append(sid)
        elif v.get("dark"):
            summary["dark"].append(sid)
        elif v.get("kept"):
            summary["kept"].append(sid)
    with BRIDGE_LOCK:
        JUDGE_LAST.clear()
        JUDGE_LAST.update(summary)
    return summary


def start_judge(upstream, log=print, config_path=None):
    """Start one judge pass in its own thread unless one is running. Answers whether it started."""
    if not KVS_ON or not bridge_configured():
        return False
    if not _JUDGE_LOCK.acquire(blocking=False):
        return False

    def run():
        try:
            judge_pass(upstream, log=log, config_path=config_path)
        except Exception as e:  # noqa: BLE001 -- one surprise never stops the next pass
            log("judge: %s" % scrub_text(e, 200))
        finally:
            _JUDGE_LOCK.release()

    threading.Thread(target=run, name="cams-road-judge", daemon=True).start()
    return True


def judge_snapshot():
    with BRIDGE_LOCK:
        return dict(JUDGE_LAST)


# THE HELD SESSION (DR-1097, third field read). go2rtc dials a camera when its
# first viewer arrives and hangs up when the last one leaves, so on Wyze's
# WebRTC road every tile frame (the app asks each camera every 5 s) was a fresh
# Kinesis offer. cams-diag 39077312135 measured what that costs: a camera
# answers an offer in 6-10 s and can leave the next one unanswered, and
# go2rtc's Kinesis dial keeps no clock of its own -- it waits until Amazon
# closes the idle signaling socket, ten minutes to the second ("websocket:
# close 1001 (going away)"), and every viewer of that camera waits behind it.
# So a Kinesis camera someone is looking at keeps ONE session: a holder reads
# its live MP4 (the bytes are dropped) until nobody has asked for it for
# KVS_HOLD_SECONDS, and every frame and live view joins that session. A dial
# with no byte in KVS_DIAL_SECONDS is abandoned: the camera's own line is put
# again (a PUT gives go2rtc a fresh stream, so the next dial is a fresh offer),
# at most once per KVS_REARM_GAP.
#
# A FRAME IS ASKED ONLY OF A SESSION CARRYING VIDEO (DR-1097, seventh read).
# camera-health 39193314318 read 9 of 33, down from 15 of 31, and cams-diag
# 39194598172 showed why: front_cam had 13 consumers, front_door_view 10 and
# 805_hallway_-_north_east 8, all "bytes-frozen" for 39 minutes with nobody
# watching. go2rtc 1.9.14's /api/frame.jpeg (internal/mjpeg/mjpeg.go,
# handlerKeyframe) waits for a key frame with no clock and never looks at the
# request's context, so a frame asked of a session that connected but carries
# no video is never let go, whoever gave up on it. While a stream has a
# consumer go2rtc redials its producer forever (internal/streams/producer.go,
# reconnect), and a PUT puts a NEW stream in the map (streams.New) and leaves
# the old one running with its consumers: each re-arm of a frozen camera left
# one more session dialling Wyze for good. So a frame of a held Kinesis camera
# waits for its holder to see KVS_HELD_MIN_BYTES of video, fresh within
# KVS_FLOWING_FRESH, and go2rtc is never asked otherwise (a 504 that says so).
# A dial that brings less than KVS_HELD_MIN_BYTES (the judge's own mark of
# video, 16 KB) is unanswered, whatever bytes it carried. The live MP4 the
# holder reads lets go when its reader does (internal/mp4/mp4.go reads the
# request context), so the holder itself never leaks.
# BRAKES (deterministic class, DR-0248): a budget (KVS_HOLD_MAX holders; each
# ends KVS_HOLD_SECONDS after the last ask and never outlives
# KVS_HOLD_LIFE_SECONDS; one dial per KVS_REDIAL_SECONDS), a lock (one holder
# per camera, under one table lock), and the stop-paths CAMS_KVS=0 or
# CAMS_KVS_HOLD_MAX=0.
KVS_HOLD_SECONDS = float(os.environ.get("CAMS_KVS_HOLD_SECONDS", "60"))
# 32: every camera the judge keeps on Kinesis is held while the tab is open (20 of
# the 33 on 2026-10-19). A camera past the budget is asked of go2rtc unheld, and
# a frame of an unheld frozen session is the request go2rtc never lets go of.
KVS_HOLD_MAX = max(0, int(os.environ.get("CAMS_KVS_HOLD_MAX", "32")))
KVS_HOLD_LIFE_SECONDS = float(os.environ.get("CAMS_KVS_HOLD_LIFE_SECONDS", "3600"))
KVS_DIAL_SECONDS = float(os.environ.get("CAMS_KVS_DIAL_SECONDS", "20"))
KVS_REARM_GAP = float(os.environ.get("CAMS_KVS_REARM_GAP", "30"))
KVS_REDIAL_SECONDS = float(os.environ.get("CAMS_KVS_REDIAL_SECONDS", "5"))
# A frame on the Kinesis road waits for the dial and a whole key frame: the
# judge measured 16 KB of video at 6.3-9.5 s, which the 12 s frame clock
# missed on 4 of 14 cameras the judge had just watched carry video.
KVS_SNAP_TIMEOUT = float(os.environ.get("CAMS_KVS_SNAP_TIMEOUT", "20"))
KVS_HELD_MIN_BYTES = max(1, int(os.environ.get("CAMS_KVS_HELD_MIN_BYTES", "16384")))
KVS_FLOWING_FRESH = float(os.environ.get("CAMS_KVS_FLOWING_FRESH", "3"))
KVS_FLOWING_POLL = 0.25

_KVS_IDS = {"path": None, "mtime": None, "ids": frozenset()}


def kvs_road_ids(roads_path=None):
    """The cameras the roads record keeps on Wyze's WebRTC road (re-read only when the file changes)."""
    path = roads_path or BRIDGE_ROADS_FILE
    try:
        mtime = os.stat(path).st_mtime_ns
    except OSError:
        return frozenset()
    if _KVS_IDS["path"] != path or _KVS_IDS["mtime"] != mtime:
        with ROADS_LOCK:
            roads = roads_load(path)
        _KVS_IDS.update(path=path, mtime=mtime, ids=frozenset(
            sid for sid, r in roads.items() if isinstance(r, dict) and r.get("road") == "kvs"))
    return _KVS_IDS["ids"]


def kvs_rearm(upstream, sid, config_path=None, log=print):
    """Put a Kinesis camera's own line again so go2rtc drops a dial Wyze never
    answered. Answers True when the line was put; never touches another road."""
    if sid in judging_now():
        return False  # the judge has this camera on a road it is reading; it is the judge's
    line = current_source(upstream, sid)
    if not is_kvs_source(line):
        return False
    return set_stream_source(upstream, sid, line, config_path, log=lambda *_a: None)


class KvsHold:
    """One Kinesis session per watched camera (see THE HELD SESSION). Pure on
    the inside: the clock, the opener, the re-arm and the thread start are
    injectable, so it is proven in plain Python."""

    def __init__(self, clock=time.time, opener=None, rearm=None, spawn=None, sleep=None, log=print,
                 max_holds=None, hold=None, life=None, dial=None, gap=None, redial=None, held_min=None, fresh=None,
                 watched=None):
        self.clock = clock
        self.watched = watched or viewer_flowing
        self.opener = opener or urllib.request.urlopen
        self.rearm = rearm or kvs_rearm
        self.spawn = spawn or (lambda fn, name: threading.Thread(target=fn, name=name, daemon=True).start())
        self.sleep = sleep or time.sleep
        self.log = log
        self.max_holds = KVS_HOLD_MAX if max_holds is None else int(max_holds)
        self.hold = KVS_HOLD_SECONDS if hold is None else float(hold)
        self.life = KVS_HOLD_LIFE_SECONDS if life is None else float(life)
        self.dial = KVS_DIAL_SECONDS if dial is None else float(dial)
        self.gap = KVS_REARM_GAP if gap is None else float(gap)
        self.redial = KVS_REDIAL_SECONDS if redial is None else float(redial)
        self.held_min = KVS_HELD_MIN_BYTES if held_min is None else int(held_min)
        self.fresh = KVS_FLOWING_FRESH if fresh is None else float(fresh)
        self.lock = threading.Lock()
        self.holds = {}
        self.last_rearm = {}
        self.counts = {"started": 0, "rearmed": 0, "full": 0}

    def touch(self, upstream, sid, config_path=None):
        """Someone looked at `sid`. Answers "held", "started", "full" or "off"."""
        if not KVS_ON or self.max_holds <= 0:
            return "off"
        now = self.clock()
        with self.lock:
            h = self.holds.get(sid)
            if h is not None:
                h["touched"] = now
                return "held"
            if len(self.holds) >= self.max_holds:
                self.counts["full"] += 1
                return "full"
            self.holds[sid] = {"touched": now, "started": now, "state": "dialing", "dials": 0, "bytes": 0, "dial_bytes": 0, "last_bytes": None}
            self.counts["started"] += 1
        self.spawn(lambda: self._run(upstream, sid, config_path), "cams-kvs-hold-%s" % sid)
        return "started"

    def _alive(self, sid):
        now = self.clock()
        with self.lock:
            h = self.holds.get(sid)
            return h is not None and now - h["touched"] < self.hold and now - h["started"] < self.life

    def _note(self, sid, **kw):
        with self.lock:
            h = self.holds.get(sid)
            if h is not None:
                h.update(kw)

    def _run(self, upstream, sid, config_path):
        try:
            while self._alive(sid):
                t0 = self.clock()
                with self.lock:
                    self.holds[sid]["dials"] += 1
                    self.holds[sid]["dial_bytes"] = 0
                got = self._read(upstream, sid)
                if got < self.held_min:
                    # Less than a key frame's worth on this dial: Wyze left the
                    # offer unanswered, go2rtc refused, or the session connected
                    # and carries no video (the frozen case, seventh read). The
                    # next viewer gets a fresh offer, never the hung one.
                    self._note(sid, state="unanswered")
                    now = self.clock()
                    if self.watched(sid):
                        # A viewer is getting video from this camera right now:
                        # the hold's own dial is what failed, not the camera.
                        with self.lock:
                            self.counts["spared"] = self.counts.get("spared", 0) + 1
                    elif now - self.last_rearm.get(sid, -1e18) >= self.gap:
                        self.last_rearm[sid] = now
                        if self.rearm(upstream, sid, config_path):
                            with self.lock:
                                self.counts["rearmed"] += 1
                            self.log("kvs-hold: %s gave %d bytes in %d s on Wyze's WebRTC road (video is %d); its line was put again for a fresh offer" % (sid, got, int(self.dial), self.held_min))
                # One dial per KVS_REDIAL_SECONDS, whatever the last one carried.
                wait = self.redial - (self.clock() - t0)
                if wait > 0 and self._alive(sid):
                    self.sleep(wait)
        finally:
            with self.lock:
                self.holds.pop(sid, None)

    def _read(self, upstream, sid):
        """One connection to the camera's live MP4; answers the bytes it carried."""
        got = 0
        try:
            r = self.opener(upstream.rstrip("/") + "/api/stream.mp4?src=" + urllib.parse.quote(sid), timeout=self.dial)
        except (urllib.error.URLError, OSError, ValueError):
            return 0
        try:
            read = getattr(r, "read1", None) or r.read
            while self._alive(sid):
                try:
                    chunk = read(65536)
                except (socket.timeout, OSError):
                    break
                if not chunk:
                    break
                got += len(chunk)
                with self.lock:
                    h = self.holds.get(sid)
                    if h is not None:
                        h["bytes"] += len(chunk)
                        h["dial_bytes"] += len(chunk)
                        h["last_bytes"] = self.clock()
                        if h["dial_bytes"] >= self.held_min:
                            h["state"] = "held"
        finally:
            try:
                r.close()
            except Exception:  # noqa: BLE001
                pass
        return got

    def holding(self, sid):
        with self.lock:
            return sid in self.holds

    def flowing(self, sid):
        """True while `sid`'s held session carries video: this dial brought
        held_min bytes and the last arrived within `fresh` seconds."""
        now = self.clock()
        with self.lock:
            h = self.holds.get(sid)
            return (h is not None and h["dial_bytes"] >= self.held_min and h["last_bytes"] is not None
                    and now - h["last_bytes"] <= self.fresh)

    def wait_flowing(self, sid, seconds):
        """Wait up to `seconds` for `sid` to carry video. Answers the seconds left
        (> 0) when it does, or 0.0 when it never did or its holder ended."""
        end = self.clock() + float(seconds)
        while True:
            if self.flowing(sid):
                return max(end - self.clock(), 0.001)
            if self.clock() >= end or not self.holding(sid):
                return 0.0
            self.sleep(KVS_FLOWING_POLL)

    def snapshot(self):
        now = self.clock()
        with self.lock:
            return {"max": self.max_holds, "hold_s": self.hold, "dial_s": self.dial, "held_min": self.held_min,
                    "holding": dict((sid, {"state": h["state"], "dials": h["dials"], "bytes": h["bytes"],
                                           "for_s": int(now - h["started"])}) for sid, h in sorted(self.holds.items())),
                    "counts": dict(self.counts)}


KVS_HOLD = KvsHold()


def kvs_viewed(upstream, cam, roads_path=None, hold=None, config_path=None):
    """A viewer asked for `cam` (or its twin): when the camera rides Wyze's
    WebRTC road its session is held. Answers True for a Kinesis camera."""
    base = base_of(cam)
    if base not in kvs_road_ids(roads_path):
        return False
    (hold or KVS_HOLD).touch(upstream, base, config_path)
    return True


_BRIDGE_TICK = {"n": 0}


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

    def dry_tries(self, sid, now=None):
        """How the road has been going for one camera (DR-0835): tries without a
        byte since the last byte arrived, seconds since that byte (or the first
        sample), seconds since the last try. A try is a sample with a producer
        or a watcher. None when the camera was never sampled."""
        c = self.cams.get(sid)
        if not c or not c["samples"]:
            return None
        now = float(now if now is not None else self.now())
        last_bytes_at = None
        for x in c["samples"]:
            if x["present"] and x["kbps"] is not None and x["kbps"] > 0:
                last_bytes_at = x["t"]
        tries = 0
        last_try = None
        for x in c["samples"]:
            if last_bytes_at is not None and x["t"] <= last_bytes_at:
                continue
            if x["present"] or x["watchers"] > 0:
                tries += 1
                last_try = x["t"]
        return {"tries": tries, "since_bytes": now - (last_bytes_at if last_bytes_at is not None else c["first"]),
                "since_try": (now - last_try) if last_try is not None else None}

    def last_bytes_at(self, sid):
        """When this camera last carried bytes in the sampler's memory; None when never."""
        with self.lock:
            c = self.cams.get(sid)
            if not c:
                return None
            last = None
            for x in c["samples"]:
                if x["present"] and x["kbps"] is not None and x["kbps"] > 0:
                    last = x["t"]
            return last

    def unreachable_cameras(self, now=None, dead=None, dry=None):
        """The cameras somebody has been trying to watch that gave no byte for
        the dead window over at least `dry` tries, the last try recent."""
        dead = DIRECT_DEAD_SECONDS if dead is None else float(dead)
        dry = DIRECT_DRY_TRIES if dry is None else int(dry)
        out = {}
        with self.lock:
            for sid in list(self.cams):
                if is_twin(sid):
                    continue
                d = self.dry_tries(sid, now)
                if d and d["tries"] >= dry and d["since_bytes"] >= dead and d["since_try"] is not None and d["since_try"] <= dead:
                    out[sid] = d
        return out


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
        # The bridge road first (DR-0809), so a camera moved onto it gets its
        # `-sub` twin rather than a wyze: subtype=sd twin it cannot reach.
        _BRIDGE_TICK["n"] += 1
        if bridge_configured() and _BRIDGE_TICK["n"] % BRIDGE_SYNC_EVERY == 1 % BRIDGE_SYNC_EVERY:
            try:
                sync_bridge_roads(upstream, streams=streams, log=log, config_path=config_path)
            except Exception as e:  # noqa: BLE001 -- the sampler outlives any one surprise
                log("bridge-road: %s" % e)
            # The road judge (DR-1097) runs beside the sampler, never inside it.
            start_judge(upstream, log=log, config_path=config_path)
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
# ANY CAMERA, FROM THE APP, TESTED ON THE SPOT (DR-0805; Darrell 2026-10-07:
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

        # -- CORS, so the cameras survive a dead /cams Pages Function --------
        # MEASURED 2026-10-09, the day every Cloudflare Pages Function on
        # poetech.us stopped being invoked: Darrell, "Cameras tab is not
        # working?!!!!!" The /cams road IS a Pages Function, so the tab had no
        # transport. Sign-in was routed straight at the Funnel to get the
        # family back in, and the same move was measured for every other dark
        # road before being attempted -- it does NOT work for these:
        #     /cams -> preflight 501, GET 404, allow-origin: none
        # Only /sb carried CORS (kong sets it), so a browser pointed at the
        # Funnel for cameras would have every request refused by its own
        # same-origin policy, and the "fix" would have been a lie.
        #
        # So the forwarder answers CORS itself. It is injected at end_headers
        # because EVERY response path here funnels through it -- json, bytes,
        # ranged MP4, the live stream -- and a header added in one writer and
        # forgotten in another is the bug this avoids.
        #
        # NEVER "*". These are the cameras on a family's house and the road
        # carries a bearer, so exactly one origin is echoed and anything else
        # gets nothing. Vary: Origin keeps a cache from serving one origin's
        # answer to another.
        ALLOWED_ORIGINS = CORS_ALLOWED_ORIGINS

        def _cors_origin(self):
            o = self.headers.get("Origin")
            return o if o in self.ALLOWED_ORIGINS else None

        def end_headers(self):
            o = self._cors_origin()
            if o:
                self.send_header("Access-Control-Allow-Origin", o)
                self.send_header("Vary", "Origin")
                # Range/length matter to the player; without exposing them a
                # cross-origin <video> cannot seek.
                self.send_header("Access-Control-Expose-Headers",
                                 "Content-Range, Content-Length, Accept-Ranges, X-Live-Max-Seconds")
            BaseHTTPRequestHandler.end_headers(self)

        def do_OPTIONS(self):
            # The preflight the bearer requires. Unknown origins are refused
            # rather than silently allowed.
            if not self._cors_origin():
                self.send_response(403)
                self.send_header("Content-Length", "0")
                self.end_headers()
                return
            self.send_response(204)
            self.send_header("Access-Control-Allow-Methods", "GET, HEAD, POST, PUT, DELETE, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Authorization, Content-Type, Range")
            self.send_header("Access-Control-Max-Age", "600")
            self.send_header("Content-Length", "0")
            self.end_headers()

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
            if path == "/streams/roads":
                if not self._authed():
                    return self._json(401, {"error": "unauthorized"})
                return self._json(200, {"roads": roads_public(roads_load()), "bridge": bridge_snapshot()})

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
                return self._live_mp4(cam, reconnect=live_reconnect_of(query))

            m = re.match(r"^/live/([^/]+)/index\.m3u8$", path)
            if m:
                cam = m.group(1)
                if not CAMERA_ID.match(cam):
                    return self._json(400, {"error": "bad-camera-id"})
                if not self._ticketed(cam, query):
                    return self._json(401, {"error": "unauthorized"})
                if self._wyze_offline_kvs(cam):
                    return self._json(503, WYZE_OFFLINE_ANSWER)
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
            if path not in ("/ticket", "/direct", "/setup/wyze", "/setup/wyze/again", "/restart", "/action", "/grants", "/streams", "/setup/ring") and not re.match(r"^/streams/[^/]+/road$", path):
                return self._json(404, {"error": "not-found"})
            # The owner's roads (the family bearer) and the roads a grant may
            # also take (/ticket for its cameras, /action when it includes the
            # doors). Everything that changes the NAS stays the owner's.
            if path in ("/ticket", "/action", "/direct"):
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
            m = re.match(r"^/streams/([^/]+)/road$", path)
            if m:
                return self._stream_road(m.group(1), body if isinstance(body, dict) else {})
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
            if path == "/direct":
                return self._direct(cam)
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

        def _stream_road(self, cam, body):
            """The owner picks a Wyze camera's road (DR-0809): bridge, direct, or auto; applied at once."""
            if not CAMERA_ID.match(cam) or is_twin(cam):
                return self._json(400, {"error": "bad-camera-id"})
            road = str(body.get("road") or "").strip().lower()
            if road not in BRIDGE_ROADS:
                return self._json(400, {"error": "bad-road", "roads": list(BRIDGE_ROADS)})
            with ROADS_LOCK:
                roads = roads_load()
                rec = roads.get(cam) if isinstance(roads.get(cam), dict) else {}
                rec["forced"] = None if road == "auto" else road
                if road == "auto":
                    rec.pop("judged", None)  # "let the NAS choose" asks the judge again at once
                roads[cam] = rec
                roads_save(roads)
            if road in ("bridge", "kvs") and not bridge_configured():
                return self._json(409, {"error": "bridge-not-configured", "detail": "sign in to Wyze in the Cameras tab first; the bridge takes the same sign-in"})
            res = sync_bridge_roads(upstream, only=cam)
            if res is None:
                return self._json(502, {"error": "bridge-unreachable" if bridge_configured() else "bridge-not-configured", "id": cam, "forced": rec["forced"]})
            now_rec = roads_load().get(cam) or {}
            if cam in res["unknown"]:
                return self._json(409, {"error": "unknown-to-bridge", "id": cam, "detail": "the bridge's own listing has no camera with this one's MAC yet; it lists them after its sign-in"})
            return self._json(200, {"ok": True, "id": cam, "road": now_rec.get("road") or "direct", "reason": now_rec.get("reason"), "forced": now_rec.get("forced"), "moved": res["to_bridge"] + res["to_direct"]})

        def _existing_ids(self):
            try:
                _s, _c, streams = self._get_upstream("/api/streams", HEALTH_TIMEOUT, limit=4 * 1024 * 1024)
                parsed = json.loads(streams.decode("utf-8"))
                return set(parsed.keys()) if isinstance(parsed, dict) else set()
            except (urllib.error.URLError, OSError, ValueError):
                return set()

        def _stream_add(self, body):
            """A camera of any kind go2rtc speaks, from the app (DR-0805): registered, persisted, and probed once."""
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
                try:
                    bridge_env_sync(creds=fields)  # the bridge takes the same sign-in (DR-0809)
                except Exception:  # noqa: BLE001
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
            body = {"devices": out, "count": len(out), "garages": sum(1 for d in out if d["garage"])}
            age = client.devices_age() if hasattr(client, "devices_age") else None
            if age is not None:
                body["age_s"] = age  # how old Wyze's word is; past the cache TTL only while Wyze has us waiting
            wait = client.cooling() if hasattr(client, "cooling") else 0
            if wait:
                body["wyze_wait_s"] = wait
            return self._json(200, body)

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
                out["bridge"] = bridge_snapshot()
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
                # A camera on Wyze's WebRTC road keeps one held session while it
                # is looked at, and its first frame waits for the dial (DR-1097).
                # A Kinesis camera Wyze's own list calls offline gets no offer (DR-1097,
                # thirteenth read): nobody can answer it, and go2rtc 1.9.14 never
                # closes the PeerConnection an unanswered offer leaves behind. Only
                # the list already held is read; a frame never waits on Wyze's cloud.
                if self._wyze_offline_kvs(cam):
                    return self._json(503, WYZE_OFFLINE_ANSWER)
                kvs = kvs_viewed(upstream, cam)
                frame_timeout = max(snap_timeout, KVS_SNAP_TIMEOUT) if kvs else snap_timeout
                if kvs and KVS_HOLD.holding(base_of(cam)):
                    # go2rtc's frame.jpeg never lets go of a request on a session
                    # with no video (seventh read): it is asked only once the
                    # held session carries video, with the time that is left.
                    left = KVS_HOLD.wait_flowing(base_of(cam), frame_timeout)
                    if left <= 0:
                        breaker_note(cam, False, "no video on Wyze's WebRTC road in %d s" % int(frame_timeout))
                        return self._json(504, {"error": "frame-timeout", "after_s": int(frame_timeout),
                                                "detail": "no video on Wyze's WebRTC road yet; go2rtc was not asked"})
                    frame_timeout = max(left, 5.0)
                said = None  # go2rtc's words, once read for the resize check below
                try:
                    try:
                        status, ctype, body = self._get_upstream("/api/frame.jpeg?" + urllib.parse.urlencode(params), frame_timeout)
                    except urllib.error.HTTPError as e:
                        # THE FRAME AT ITS OWN SIZE (DR-1097, tenth read). 805 Floodlight
                        # Cam - West gave a full frame in 4.2 s and 4.8 MB of live video in
                        # 35 s, and every ?w=640 frame answered 500 "exit status 183": go2rtc
                        # hands a resize to ffmpeg, which refused that camera's key frame. A
                        # resize ffmpeg refuses is asked once more at the camera's own size.
                        if e.code != 500 or len(params) == 1:
                            raise
                        said = e.read(2048).decode("utf-8", "replace")
                        if "exit status" not in said:
                            raise
                        said = None
                        status, ctype, body = self._get_upstream("/api/frame.jpeg?" + urllib.parse.urlencode(params[:1]), frame_timeout)
                except urllib.error.HTTPError as e:
                    # go2rtc answered, and said why (its body is the error text).
                    detail = scrub_text((said if said is not None else e.read(2048).decode("utf-8", "replace")).strip(), 300)
                    breaker_note(cam, False, detail)
                    return self._json(e.code if 400 <= e.code < 600 else 502, {"error": "no-frame", "upstream_status": e.code, "detail": detail})
                except socket.timeout:
                    breaker_note(cam, False, "no answer in %d s" % int(frame_timeout))
                    return self._json(504, {"error": "frame-timeout", "after_s": int(frame_timeout)})
                except urllib.error.URLError as e:
                    if isinstance(getattr(e, "reason", None), socket.timeout):
                        breaker_note(cam, False, "no answer in %d s" % int(frame_timeout))
                        return self._json(504, {"error": "frame-timeout", "after_s": int(frame_timeout)})
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
            out["live_ends"] = live_ends_summary(None if who[0] != "grant" else (lambda c, g=who[1]: grant_allows(g, c)))
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
            # The road this camera takes and the judge's last measurement of it (DR-1097); never a line.
            rec = roads_load().get(cam)
            if isinstance(rec, dict):
                out["road"] = roads_public({cam: rec}).get(cam)
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

        def _wyze_offline_kvs(self, cam):
            """A camera on Wyze's WebRTC road that Wyze's own list (the one already
            held) calls offline: no frame, live view or playlist sends it an offer
            (DR-1097, thirteenth and fifteenth reads)."""
            return base_of(cam) in kvs_road_ids() and base_of(cam) in (wyze_offline_streams(fetch=False, factory=wyze_factory) or ())

        def _direct(self, cam):
            """POST /direct {camera}: one Wyze WebRTC session for this viewer's
            browser (THE DIRECT ROAD above). 404 no-direct for a camera that is
            not on Wyze's WebRTC road: the tile keeps the NAS road for it."""
            base = base_of(cam)
            if not DIRECT_ON:
                return self._json(404, {"error": "no-direct", "detail": "the direct road is switched off on the NAS"})
            if base not in kvs_road_ids():
                return self._json(404, {"error": "no-direct", "detail": "this camera is not on Wyze's WebRTC road"})
            if self._wyze_offline_kvs(base):
                return self._json(503, WYZE_OFFLINE_ANSWER)
            rec = roads_load().get(base)
            uri = main_uri(rec.get("uri")) if isinstance(rec, dict) and rec.get("uri") else ""
            if not uri:
                cur = current_source(upstream, base)
                uri = main_uri(kvs_uri_of(cur)) if cur and is_kvs_source(cur) else ""
            if not uri:
                return self._json(404, {"error": "no-direct", "detail": "the bridge's name for this camera is not known"})
            with DIRECT_LOCK:
                since = time.monotonic() - DIRECT_LAST.get(base, -1e9)
                if since < DIRECT_MIN_SECONDS:
                    return self._json(429, {"error": "too-soon", "retry_in": int(DIRECT_MIN_SECONDS - since) + 1})
                DIRECT_LAST[base] = time.monotonic()
            status, body = kvs_direct_session(uri)
            if status == 200:
                body["camera"] = base
            return self._json(status, body)

        def _live_mp4(self, cam, reconnect=0):
            if self._wyze_offline_kvs(cam):
                return self._json(503, WYZE_OFFLINE_ANSWER)
            if not live_gate.acquire(blocking=False):
                return self._json(503, {"error": "busy", "max_live": max_live})
            try:
                kvs = kvs_viewed(upstream, cam)
                # A TWIN WAITS FOR ITS CAMERA (DR-1097, fifteenth read). A grid tile
                # asks the SD twin, which go2rtc reads off its own RTSP restream of
                # the camera, and go2rtc's RTSP client gives a DESCRIBE answer 5 s
                # (pkg/rtsp/conn.go: the package Timeout, which #timeout= does not
                # reach). The answer waits on the Kinesis dial, 6-12 s, so the twin
                # of a camera not yet flowing always timed out ("read tcp
                # ->127.0.0.1:8554: i/o timeout", the wall in /why) while the
                # camera's own stream and frame worked. The twin is asked of go2rtc
                # only once the held session carries video, within the frame clock.
                if kvs and is_twin(cam) and KVS_HOLD.holding(base_of(cam)):
                    if KVS_HOLD.wait_flowing(base_of(cam), KVS_SNAP_TIMEOUT) <= 0:
                        return self._json(504, {"error": "frame-timeout", "after_s": int(KVS_SNAP_TIMEOUT),
                                                "detail": "no video on Wyze's WebRTC road yet; the twin was not asked"})
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
                    sent, why = 0, "viewer-left"
                    view = live_view_join(cam, sock=self.connection)
                    # read1(): hand on whatever bytes have ARRIVED instead of
                    # blocking until 64 KB fill -- a slow camera at 11 bytes per
                    # 10 ms would otherwise hold the brake check hostage until the
                    # source ended (the selftest caught exactly that: 4.1 s on a
                    # 1 s brake). The urlopen timeout bounds a silent source too.
                    read = getattr(r, "read1", None) or r.read
                    try:
                        while True:
                            if view["stop"].is_set():
                                why = "superseded"
                                break  # a newer view of this camera took the place (ONE CAMERA, A FEW VIEWS)
                            if live_max_seconds > 0 and time.monotonic() - started >= live_max_seconds:
                                why = "clock"
                                break  # the optional clock: a live view ends itself; the app re-opens
                            try:
                                chunk = read(CHUNK)
                            except (socket.timeout, OSError):
                                why = "source-silent"
                                break
                            if not chunk:
                                why = "source-ended"
                                break
                            self.wfile.write(chunk)
                            sent += len(chunk)
                            LIVE_LAST_BYTES[base_of(cam)] = time.monotonic()
                            live_note(len(chunk))
                    except (BrokenPipeError, ConnectionResetError, OSError):
                        # the write failed: the tab hung up, or its socket was shut for a newer view
                        why = "superseded" if view["stop"].is_set() else "viewer-left"
                    finally:
                        live_view_leave(cam, view)
                        live_note(0, delta_open=-1)
                        live_end_note(cam, time.monotonic() - started, sent, why, reconnect=reconnect)
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
                if q.get("src", [""])[0] == "scale_cam" and q.get("w"):
                    return self._send(500, "text/plain", b"exit status 183")
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
            raw_body = self.rfile.read(n).decode("utf-8")
            if path == "/api/config":
                # go2rtc 1.9.14: yaml.Unmarshal the body; 500 with the error, or write it.
                seen.setdefault("config_posts", []).append(raw_body)
                if seen.get("config_refuse"):
                    return self._send(500, "text/plain", b"yaml: line 3: could not find expected ':'")
                return self._send(200, "application/yaml", b"")
            form = urllib.parse.parse_qs(raw_body)
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
    cloud_rl = {"wait": 0, "age": 7}

    class FakeCloud:
        def __init__(self):
            self.last = {}

        def cooling(self, key=None):
            return cloud_rl["wait"]

        def devices_age(self):
            return cloud_rl["age"]

        def cached_devices(self):
            return [dict(d, online=False) if d["mac"] in cloud_rl.get("offline", ()) else d for d in self.devices()]

        def devices(self):
            if cloud_rl["wait"]:
                raise WyzeError("rate-limited", "Wyze answered 429 to login; the NAS waits %d s before asking again" % cloud_rl["wait"], retry_after=cloud_rl["wait"])
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

    def stream_one(k, r=""):
        c = HTTPConnection("127.0.0.1", port, timeout=10)
        c.request("GET", "/live/front_yard.mp4?t=" + tk + (("&r=" + r) if r else ""))
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

    # ONE CAMERA, A FEW VIEWS (DR-1097, nineteenth read): cams-diag 39547175167
    # read 32 views (every slot) held by one tab, five of one camera at once.
    class _Sock:
        def __init__(self):
            self.shut = 0

        def shutdown(self, how):
            self.shut += 1
    vv, socks = {}, [_Sock() for _ in range(4)]
    va = live_view_join("cam", sock=socks[0], cap=2, views=vv)
    vb = live_view_join("cam", sock=socks[1], cap=2, views=vv)
    vo = live_view_join("other", cap=2, views=vv)
    check(not va["stop"].is_set() and not vb["stop"].is_set() and not vo["stop"].is_set(), "views up to the cap all play, and another camera's view is its own count")
    vc = live_view_join("cam", sock=socks[2], cap=2, views=vv)
    check(va["stop"].is_set() and socks[0].shut == 1 and not vb["stop"].is_set() and not vc["stop"].is_set() and socks[1].shut == 0,
          "PROVEN TO CATCH: one view past the cap ends the OLDEST of that camera (its socket shut so a stuck write fails now), never the newest")
    live_view_leave("cam", va, views=vv)
    vd = live_view_join("cam", sock=socks[3], cap=2, views=vv)
    check(vb["stop"].is_set() and not vc["stop"].is_set() and not vd["stop"].is_set() and len(vv["cam"]) == 3, "the next view past the cap ends the next oldest; a view that left is not counted")
    for x in (vb, vc, vd):
        live_view_leave("cam", x, views=vv)
    live_view_leave("other", vo, views=vv)
    check(vv == {}, "every view that leaves is forgotten (%r)" % vv)
    v0 = [live_view_join("cam", cap=0, views=vv) for _ in range(5)]
    check(not any(v["stop"].is_set() for v in v0), "stop-path: CAMS_LIVE_PER_CAMERA=0 ends no view")
    check(LIVE_PER_CAMERA == 3, "the shipped cap is 3 views of one camera (two family members and a hand-over, never an orphan's fifth)")
    saved_cap, saved_ends6 = LIVE_PER_CAMERA, list(LIVE_ENDS)
    time.sleep(1.2)  # the unread view above ends at its own 1 s clock first
    globals()["LIVE_PER_CAMERA"] = 1
    try:
        results.clear()
        ta = threading.Thread(target=stream_one, args=("a",)); ta.start(); time.sleep(0.3)
        tb = threading.Thread(target=stream_one, args=("b", "2")); tb.start()
        ta.join(); tb.join()
    finally:
        globals()["LIVE_PER_CAMERA"] = saved_cap
    sa, ga, ela, _ha = results["a"]
    sb, gb, elb, _hb = results["b"]
    ends_fy = [e for e in LIVE_ENDS if e["camera"] == "front_yard"]
    check(sa == 200 and sb == 200 and ga.startswith(b"MP4CHUNK000") and ela < 0.75 and elb >= 0.8,
          "PROVEN TO CATCH end to end: a second view of the camera ends the first at once (%.2fs, before its 1 s clock) and the second plays on to its clock (%.2fs)" % (ela, elb))
    check(any(e["why"] == "superseded" for e in ends_fy[-2:]), "the first view's end is kept as superseded, so the diag says which side hung up (%r)" % ends_fy[-2:])
    check([e.get("r") for e in ends_fy[-2:]] == [0, 2],
          "PROVEN TO CATCH: each end keeps the app's reconnect count from its URL (a fresh open 0, the app's second reconnect 2), so a blinking run says whether the app or a person opened it again (%r)" % ends_fy[-2:])
    check(live_reconnect_of("t=x&r=7") == 7 and live_reconnect_of("t=x") == 0 and live_reconnect_of("r=-3") == 0 and live_reconnect_of("r=abc") == 0 and live_reconnect_of("r=100000") == LIVE_RECONNECT_MAX,
          "the reconnect count is a bounded count: absent, negative or not a number reads 0")
    check(LIVE_VIEWS == {}, "both views left the register (%r)" % LIVE_VIEWS)
    LIVE_ENDS[:] = saved_ends6  # the ends section below counts its own

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
    check(j.get("age_s") == 7 and "wyze_wait_s" not in j, "the list says how old Wyze's word is, and no wait is claimed when there is none (%r)" % {k: j.get(k) for k in ("age_s", "wyze_wait_s")})
    cloud_rl["wait"] = 240
    s, _h, d = call("GET", "/devices", auth=B)
    j = json.loads(d.decode("utf-8"))
    check(s == 503 and j.get("error") == "rate-limited" and j.get("retry_in") == 240 and "429" in j.get("detail", ""), "Wyze's 429 with no list to serve -> 503 rate-limited with the seconds until the NAS asks again (DR-1097 twelfth read) (%r)" % j)
    cloud_rl["wait"] = 0
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
    # A go2rtc that started without its config (DR-1097, eighth read): the file's own streams go back first.
    cfg8 = os.path.join(tempfile.mkdtemp(prefix="cams-unreadable-"), "go2rtc.yaml")
    with open(cfg8, "w") as fh:
        fh.write('api:\n  listen: "127.0.0.1:1984"\nstreams:\n  front: "webrtc:http://u:p@127.0.0.1:8597/signaling/front?kvs#format=wyze"\n  back:\n    - rtsp://a\n    - "ffmpeg:back#video=h264"\nwyze:\n  "me@x.y":\n    password: "p\n')
    mem8 = {}
    puts8 = []

    class R8:
        def __init__(self, b):
            self.b = b

        def read(self, _n=-1):
            return self.b

        def __enter__(self):
            return self

        def __exit__(self, *_a):
            return False

    def op8(req, timeout=None):
        if isinstance(req, urllib.request.Request) and req.get_method() == "PUT":
            q8 = urllib.parse.parse_qs(urllib.parse.urlsplit(req.full_url).query)
            puts8.append((q8["name"][0], q8["src"]))
            mem8[q8["name"][0]] = q8["src"]
            raise urllib.error.HTTPError(req.full_url, 400, "Bad Request", {}, None)
        return R8(json.dumps(mem8).encode("utf-8"))
    n8 = restore_streams_from_config("http://g", config_path=cfg8, log=lambda *_a: None, opener=op8)
    check(n8 == 2 and puts8 == [("back", ["rtsp://a", "ffmpeg:back#video=h264"]), ("front", ["webrtc:http://u:p@127.0.0.1:8597/signaling/front?kvs#format=wyze"])],
          "a go2rtc that came up empty gets every stream its file defines, with all its sources, even when each PUT answers 400 (the file go2rtc cannot write) (%d, %r)" % (n8, puts8))
    seen["puts"] = []
    seen["empty_streams"] = True
    seen["put_refuses"] = True
    r = self_heal_once("http://127.0.0.1:%d" % fp, port, token, log=lambda *_a: None, config_path=cfg8)
    seen["empty_streams"] = False
    seen["put_refuses"] = False
    check(("front", "webrtc:http://u:p@127.0.0.1:8597/signaling/front?kvs#format=wyze") in seen["puts"] and ("back", "rtsp://a") in seen["puts"],
          "PROVEN TO CATCH: the self-heal of an EMPTY go2rtc puts back the streams its own file defines before anything else (23:02 CDT: 0 streams, 66 in the file) (%s, %r)" % (r, seen["puts"][:3]))
    # The line go2rtc cannot read (DR-1097, ninth read): line 96, one character at column 0 after wyze:.
    live96 = 'api:\n  listen: "127.0.0.1:1984"\nstreams:\n  front: "rtsp://f"\n# kept\n"quoted top": 1\nwyze:\n  me@x.y:\n    api_id: a\n    password: b\nZ\n'
    check(config_stray_lines(live96) == [11], "the stray line is found by shape: one character at column 0, not a key (%r)" % config_stray_lines(live96))
    check(config_stray_lines('api:\n  listen: ":1984"\n---\nstreams:\n  a: "x:y"\n') == [], "keys, quoted keys, comments, document markers and indented lines are never strays")
    # The fifteenth read (2026-10-21): an older copy's tail after wyze:, fragments with indented keys between them.
    live100 = 'streams:\n  front: "rtsp://f"\nwyze:\n  me@x.y:\n    api_id: a\n    api_key: k1\n    password: b\nmple.co\nom"\n    api_key: old\n    password: old\n"x.y.z"\n'
    check(config_stray_lines(live100) == [8, 9, 10, 11, 12],
          "PROVEN TO CATCH: fragments at column 0 are strays, and so is every indented line after one (the duplicated api_key/password go2rtc named), up to the next real key (%r)" % config_stray_lines(live100))
    check(config_stray_lines('a:\n  x: 1\nZ\n  y: 2\nb:\n  z: 3\n') == [3, 4], "PROVEN TO CATCH: an indented line after a stray goes with it, and the next real top-level key ends the run (b: and its line stay)")
    cfg9 = os.path.join(tempfile.mkdtemp(prefix="cams-stray-"), "go2rtc.yaml")
    with open(cfg9, "w") as fh:
        fh.write(live96)
    seen["config_posts"] = []
    r9 = repair_config_strays("http://127.0.0.1:%d" % fp, config_path=cfg9, log=lambda *_a: None)
    posted = seen["config_posts"][-1] if seen["config_posts"] else ""
    check(r9 == "repaired-1" and "\nZ\n" not in posted and posted.endswith("    password: b\n") and '  front: "rtsp://f"' in posted and "# kept" in posted,
          "the file goes to go2rtc's own /api/config without the stray line, every other line kept, and go2rtc's parse decides (%s)" % r9)
    seen["config_refuse"] = True
    r9b = repair_config_strays("http://127.0.0.1:%d" % fp, config_path=cfg9, log=lambda *_a: None)
    seen["config_refuse"] = False
    check(r9b == "refused" and open(cfg9).read() == live96, "when go2rtc's own parse refuses, the file is left exactly as it was")
    check(repair_config_strays("http://127.0.0.1:%d" % fp, config_path=cfg8 + ".none", log=lambda *_a: None) == "unreadable", "no file, nothing done")
    cfg100 = os.path.join(tempfile.mkdtemp(prefix="cams-stray-"), "go2rtc.yaml")
    with open(cfg100, "w") as fh:
        fh.write(live100)
    seen["config_posts"] = []
    r100 = repair_config_strays("http://127.0.0.1:%d" % fp, config_path=cfg100, log=lambda *_a: None)
    posted = seen["config_posts"][-1] if seen["config_posts"] else ""
    check(r100 == "repaired-5" and "old" not in posted and posted.count("api_key") == 1 and posted.endswith("    password: b\n") and '  front: "rtsp://f"' in posted,
          "the 2026-10-21 tail goes to go2rtc without the fragments or the stale duplicate keys, the first api_key and password kept (%s)" % r100)
    seen["config_posts"] = []
    self_heal_once("http://127.0.0.1:%d" % fp, port, token, log=lambda *_a: None, config_path=cfg9)
    check(len(seen["config_posts"]) == 1 and "\nZ\n" not in seen["config_posts"][0],
          "PROVEN TO CATCH: every self-heal tick repairs a go2rtc.yaml go2rtc cannot read (the file behind every PUT 400 and the empty 23:02 start)")

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
    le = j.get("live_ends") or {}
    check(le.get("by_why", {}).get("clock") == 2 and all(e["why"] in ("clock", "source-ended", "source-silent", "viewer-left", "superseded") and e["camera"] for e in le.get("ends", [])),
          "PROVEN TO CATCH: every live view's end is kept with who ended it (the 1 s clock ended two of them here) -- a blinking tile says which side hung up (%r)" % (le.get("by_why"),))
    saved_ends = list(LIVE_ENDS)
    del LIVE_ENDS[:]
    for k in range(LIVE_ENDS_KEEP + 5):
        live_end_note("cam_%d" % k, 12.34, 4096, "source-ended", now=1000 + k)
    sm = live_ends_summary(allow=lambda c: c != "cam_84")
    check(len(LIVE_ENDS) == LIVE_ENDS_KEEP and sm["ends"][0]["camera"] == "cam_83" and sm["ends"][0]["s"] == 12.3 and sm["ends"][0]["kb"] == 4 and sm["by_why"] == {"source-ended": LIVE_ENDS_KEEP - 1},
          "only the last %d ends are kept, newest first, and a grant sees only its own cameras" % LIVE_ENDS_KEEP)
    LIVE_ENDS[:] = saved_ends
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


    print("=== 8n. the Wyze bridge road (DR-0809): a camera the NAS cannot reach, or without DTLS, rides the bridge; the owner can force a road ===")
    global BRIDGE_API, BRIDGE_ENV, BRIDGE_ROADS_FILE, ADD_MISSING_ON, KVS_HOLD, DIRECT_ON, kvs_direct_session
    br_tmp = tempfile.mkdtemp(prefix="cams-bridge-")
    br_wyze_env = os.path.join(br_tmp, "wyze.env")
    br_env = os.path.join(br_tmp, "wyze-bridge.env")
    with open(br_wyze_env, "w") as fh:
        fh.write('WYZE_EMAIL="d@example.com"\nWYZE_PASSWORD="pw-$ecret"\nWYZE_API_ID="id1"\nWYZE_API_KEY="key-secret"\n')
    check(bridge_env_sync(br_wyze_env, br_env) == "written" and (os.stat(br_env).st_mode & 0o777) == 0o600, "--bridge-env derives the bridge's file from wyze.env, root-only")
    be = read_env_pairs(br_env)
    check(be["WYZE_EMAIL"] == "d@example.com" and be["WYZE_PASSWORD"] == "pw-$ecret" and be["API_ID"] == "id1" and be["API_KEY"] == "key-secret" and len(be["WB_API"]) == 32 and be["WB_PASSWORD"], "the bridge's names (API_ID / API_KEY) carry our values; an API key and a web password are minted")
    first_key = be["WB_API"]
    check(bridge_env_sync(br_wyze_env, br_env) == "unchanged" and read_env_pairs(br_env)["WB_API"] == first_key and read_env_pairs(br_env)["WB_API_GEN"] == str(BRIDGE_KEY_GENERATION), "a re-sync changes nothing, keeps the minted key, and stamps the key generation")
    # Rotation by committed generation: a file behind BRIDGE_KEY_GENERATION (or without a stamp, as every file before 2026-10-08) gets a NEW key once; the web password stands.
    old_env = read_env_pairs(br_env)
    with open(br_env, "w") as fh:
        fh.write("WB_API=%s\nWB_PASSWORD=%s\nWB_USERNAME=poetech\n" % (first_key, old_env["WB_PASSWORD"]))
    check(bridge_env_sync(br_wyze_env, br_env) == "written" and read_env_pairs(br_env)["WB_API"] != first_key and len(read_env_pairs(br_env)["WB_API"]) == 32 and read_env_pairs(br_env)["WB_PASSWORD"] == old_env["WB_PASSWORD"] and read_env_pairs(br_env)["WB_API_GEN"] == str(BRIDGE_KEY_GENERATION), "a file without the current generation stamp gets a fresh API key once; the web password is kept")
    first_key = read_env_pairs(br_env)["WB_API"]
    check(bridge_env_sync(br_wyze_env, br_env) == "unchanged" and read_env_pairs(br_env)["WB_API"] == first_key, "at the current generation the key stands across re-syncs")
    with open(br_wyze_env, "w") as fh:
        fh.write('WYZE_EMAIL="d@example.com"\nWYZE_PASSWORD="new-pw"\nWYZE_API_ID="id1"\nWYZE_API_KEY="key-secret"\n')
    check(bridge_env_sync(br_wyze_env, br_env) == "written" and read_env_pairs(br_env)["WYZE_PASSWORD"] == "new-pw" and read_env_pairs(br_env)["WB_API"] == first_key, "a changed Wyze password is carried over; the minted key still stands")
    check(bridge_env_sync(os.path.join(br_tmp, "missing.env"), os.path.join(br_tmp, "x.env")) in ("no-wyze-env",) or _wyze is not None, "without a sign-in there is nothing to derive")

    lans = lan_networks(runner=lambda: "1: lo    inet 127.0.0.1/8 scope host lo\n2: eth0    inet 192.168.1.26/24 brd 192.168.1.255 scope global eth0\n3: eth1    inet 169.254.230.34/16 scope global eth1\n4: tun0    inet 10.8.0.1 peer 10.8.0.2/32 scope global tun0\n5: docker0    inet 172.17.0.1/16 scope global docker0\n")
    check([str(n) for n in lans] == ["192.168.1.0/24", "172.17.0.0/16"], "lan_networks reads the NAS's own addresses, minus loopback, link-local and a point-to-point tunnel (%r)" % [str(n) for n in lans])
    check(lan_networks(runner=lambda: "", env={"CAMS_LAN_CIDRS": "192.168.1.0/24, 10.0.0.0/24"}) == [ipaddress.ip_network("192.168.1.0/24"), ipaddress.ip_network("10.0.0.0/24")], "CAMS_LAN_CIDRS overrides the probe")
    check(bridge_road_wanted("wyze://10.0.0.5?uid=A&enr=S&mac=AA:BB:CC:DD:EE:01&model=HL_CAM4&dtls=true", lans) == (True, "other-network"), "a camera at 10.0.0.x, with the NAS on 192.168.1.x, wants the bridge: other-network")
    check(bridge_road_wanted("wyze://192.168.1.50?uid=A&enr=S&mac=AA:BB:CC:DD:EE:02&model=HL_CAM4&dtls=true", lans) == (False, ""), "a DTLS camera on the NAS's own LAN stays direct")
    check(bridge_road_wanted("wyze://192.168.1.60?uid=A&enr=S&mac=AA:BB:CC:DD:EE:03&model=WYZEC1-JZ", lans) == (True, "no-dtls"), "a LAN camera without dtls=true wants the bridge: no-dtls")
    check(bridge_road_wanted("rtsp://u:p@192.168.1.9/live", lans) == (False, "") and bridge_road_wanted(bridge_source("x"), lans) == (False, ""), "an rtsp camera and a bridged one are not asked")
    check(mac_of("wyze://10.0.0.5?uid=A&mac=aa:bb:cc:dd:ee:01") == "AABBCCDDEE01" and norm_mac("AA22334455bB") == "AA22334455BB" and norm_mac(None) == "", "MACs compare without colons or case")
    check(sd_source(bridge_source("805-north")) == bridge_source("805-north") and bridge_source("805-north").endswith("/805-north#timeout=30") and sd_source(bridge_source("805-north-sub")) == bridge_source("805-north") and kind_of(bridge_source("805-north")) == "wyze", "a bridged camera's SD twin is the bridge's MAIN stream (DR-0979: every -sub the bridge tried timed out), an old -sub line reads back to main, and it is still a Wyze camera")

    class FakeBridge(BaseHTTPRequestHandler):
        def log_message(self, *a):
            pass

        leaked = False
        garage_ip = None

        def do_GET(self):
            path, _, query = self.path.partition("?")
            if "api" in urllib.parse.parse_qs(query):
                FakeBridge.leaked = True
            key = urllib.parse.parse_qs(query).get("api", [""])[0] or self.headers.get("api", "")
            if key != "BRKEY":
                self.send_response(401); self.end_headers(); return
            if path != "/api":
                self.send_response(404); self.end_headers(); return
            body = json.dumps({"total": 3, "available": 3, "enabled": 3, "cameras": {
                "805-north": {"name_uri": "805-north", "nickname": "805 North", "mac": "AABBCCDDEE01", "connected": False, "enabled": True, "status": "stopped", "ip": "10.0.0.180"},
                "front-cam": {"name_uri": "front-cam", "nickname": "Front Cam", "mac": "AABBCCDDEE03", "connected": True, "enabled": True, "status": "connected", "ip": "192.168.1.60"},
                "garage-doors": dict({"name_uri": "garage-doors", "nickname": "Garage Doors", "mac": "AABBCCDDEE02", "connected": False, "enabled": True, "status": "stopped"}, **({"ip": FakeBridge.garage_ip} if FakeBridge.garage_ip else {})),
            }}).encode("utf-8")
            self.send_response(200); self.send_header("Content-Type", "application/json"); self.send_header("Content-Length", str(len(body))); self.end_headers(); self.wfile.write(body)

    fb = ThreadingHTTPServer(("127.0.0.1", 0), FakeBridge)
    fb.daemon_threads = True
    threading.Thread(target=fb.serve_forever, daemon=True).start()
    BRIDGE_API = "http://127.0.0.1:%d" % fb.server_address[1]
    check(bridge_cameras(key="wrong") is None, "the bridge's listing needs its key")
    bc = bridge_cameras(key="BRKEY")
    check(bc is not None and sorted(c["uri"] for c in bc) == ["805-north", "front-cam", "garage-doors"] and next(c for c in bc if c["uri"] == "805-north")["mac"] == "AABBCCDDEE01", "the listing is read by uri with its MAC, never a credential")
    check(FakeBridge.leaked is False, "the key travels in the api header only, never the query string (the bridge's access log records every query; fifth field read)")

    class FakeGo2rtcRoads(BaseHTTPRequestHandler):
        state = {"puts": [], "refuse": False}

        def log_message(self, *a):
            pass

        def do_PUT(self):
            path, _, query = self.path.partition("?")
            q = urllib.parse.parse_qs(query)
            self.state["puts"].append((q.get("name", [""])[0], q.get("src", [""])[0]))
            if self.state["refuse"]:
                self.send_response(400); self.end_headers(); return
            self.send_response(200); self.send_header("Content-Length", "2"); self.end_headers(); self.wfile.write(b"{}")

    fr = ThreadingHTTPServer(("127.0.0.1", 0), FakeGo2rtcRoads)
    fr.daemon_threads = True
    threading.Thread(target=fr.serve_forever, daemon=True).start()
    rup = "http://127.0.0.1:%d" % fr.server_address[1]
    br_cfg = os.path.join(br_tmp, "go2rtc.yaml")
    with open(br_cfg, "w") as fh:
        fh.write('api:\n  listen: "127.0.0.1:1984"\nstreams:\n  805_north: "wyze://10.0.0.180?uid=A&enr=S1&mac=AA:BB:CC:DD:EE:01&model=HL_CAM4&dtls=true"\n  805_north_sd: "wyze://10.0.0.180?uid=A&enr=S1&mac=AA:BB:CC:DD:EE:01&model=HL_CAM4&dtls=true&subtype=sd"\n  front_cam: "wyze://192.168.1.60?uid=A&enr=S3&mac=AA:BB:CC:DD:EE:03&model=WYZEC1-JZ"\n  garage_doors: "wyze://192.168.1.50?uid=A&enr=S2&mac=AA:BB:CC:DD:EE:02&model=HL_CAM4&dtls=true"\n  east_north: "wyze://10.0.0.2?uid=A&enr=S4&mac=AA:BB:CC:DD:EE:09&model=HL_CAM4&dtls=true"\n  back_yard: "rtsp://u:p@192.168.1.9/live"\nwyze:\n  email: x\n')
    br_roads = os.path.join(br_tmp, "bridge-roads.json")
    streams_now = {
        "805_north": {"producers": [{"url": "wyze://10.0.0.180?uid=A&enr=S1&mac=AA:BB:CC:DD:EE:01&model=HL_CAM4&dtls=true"}]},
        "805_north_sd": {"producers": [{"url": "wyze://10.0.0.180?uid=A&enr=S1&mac=AA:BB:CC:DD:EE:01&model=HL_CAM4&dtls=true&subtype=sd"}]},
        "front_cam": {"producers": [{"url": "wyze://192.168.1.60?uid=A&enr=S3&mac=AA:BB:CC:DD:EE:03&model=WYZEC1-JZ"}]},
        "garage_doors": {"producers": [{"url": "wyze://192.168.1.50?uid=A&enr=S2&mac=AA:BB:CC:DD:EE:02&model=HL_CAM4&dtls=true"}]},
        "east_north": {"producers": [{"url": "wyze://10.0.0.2?uid=A&enr=S4&mac=AA:BB:CC:DD:EE:09&model=HL_CAM4&dtls=true"}]},
        "back_yard": {"producers": [{"url": "rtsp://u:p@192.168.1.9/live"}]},
    }
    logs = []
    res = ensure_bridge_roads(rup, streams_now, bc, lans=lans, roads={}, log=logs.append, config_path=br_cfg, roads_path=br_roads, now=1234.0)
    check(res["to_bridge"] == ["805_north", "front_cam"] and res["unknown"] == ["east_north"] and res["kept"] == 1 and res["to_direct"] == [], "the 805 camera (other network) and the no-DTLS camera move to the bridge; the one the bridge does not list is named unknown; the LAN DTLS camera is kept (%r)" % res)
    puts = FakeGo2rtcRoads.state["puts"]
    check(("805_north", bridge_source("805-north")) in puts and ("805_north_sd", sd_source(bridge_source("805-north"))) in puts and ("front_cam", bridge_source("front-cam")) in puts and ("front_cam_sd", sd_source(bridge_source("front-cam"))) in puts, "each moved camera is PUT with the bridge's rtsp line, and its SD twin with the bridge's -sub stream")
    check(not any(n == "garage_doors" or n == "east_north" or n == "back_yard" for n, _u in puts), "nothing else is touched")
    cfg_now = open(br_cfg).read()
    check('  805_north: "%s"' % bridge_source("805-north") in cfg_now and '  805_north_sd: "%s"' % sd_source(bridge_source("805-north")) in cfg_now and "enr=S1" not in cfg_now.split("garage_doors")[0].split("805_north_sd")[0] and '  garage_doors: "wyze://192.168.1.50' in cfg_now and cfg_now.endswith("wyze:\n  email: x\n"), "the config says what memory says: the moved lines rewritten, every other byte kept")
    check(config_stream_names(cfg_now) == {"805_north", "805_north_sd", "front_cam", "front_cam_sd", "garage_doors", "east_north", "back_yard"}, "the twin that did not exist is added once, nothing is duplicated (%r)" % sorted(config_stream_names(cfg_now)))
    rd = roads_load(br_roads)
    check((os.stat(br_roads).st_mode & 0o777) == 0o600 and rd["805_north"]["road"] == "bridge" and rd["805_north"]["reason"] == "other-network" and rd["805_north"]["direct"].startswith("wyze://10.0.0.180") and rd["front_cam"]["reason"] == "no-dtls" and rd["east_north"]["unknown_to_bridge"] is True, "the record is root-only and keeps each camera's direct line, road and reason")
    pub = roads_public(rd)
    check("direct" not in json.dumps(pub) or all("enr=" not in json.dumps(v) for v in pub.values()), "the public view of the roads carries no URL")
    check(all(k in pub["805_north"] for k in ("road", "uri", "reason", "since", "forced")) and pub["805_north"]["uri"] == "805-north", "the public view names road, uri, reason, since, forced")
    # Second pass: nothing moves again.
    FakeGo2rtcRoads.state["puts"] = []
    streams_after = dict(streams_now)
    streams_after["805_north"] = {"producers": [{"url": bridge_source("805-north")}]}
    streams_after["805_north_sd"] = {"producers": [{"url": sd_source(bridge_source("805-north"))}]}
    streams_after["front_cam"] = {"producers": [{"url": bridge_source("front-cam")}]}
    streams_after["front_cam_sd"] = {"producers": [{"url": sd_source(bridge_source("front-cam"))}]}
    res2 = ensure_bridge_roads(rup, streams_after, bc, lans=lans, roads=roads_load(br_roads), log=logs.append, config_path=br_cfg, roads_path=br_roads, now=1300.0)
    check(res2["to_bridge"] == [] and res2["to_direct"] == [] and FakeGo2rtcRoads.state["puts"] == [], "a second sync moves nothing and makes no call")
    # DR-0979: a twin written before it, still on the bridge's -sub, moves to the main stream ONCE.
    streams_old_sd = dict(streams_after)
    streams_old_sd["805_north_sd"] = {"producers": [{"url": bridge_source("805-north").replace("/805-north#", "/805-north-sub#")}]}
    res2b = ensure_bridge_roads(rup, streams_old_sd, bc, lans=lans, roads=roads_load(br_roads), log=logs.append, config_path=br_cfg, roads_path=br_roads, now=1310.0)
    check(res2b.get("sd_main") == ["805_north"] and FakeGo2rtcRoads.state["puts"] == [("805_north_sd", bridge_source("805-north"))] and res2b["to_bridge"] == [] and res2b["to_direct"] == [], "an old -sub twin is moved to the bridge's main stream, one call, nothing else moves (%r)" % (FakeGo2rtcRoads.state["puts"],))
    FakeGo2rtcRoads.state["puts"] = []
    res2c = ensure_bridge_roads(rup, streams_after, bc, lans=lans, roads=roads_load(br_roads), log=logs.append, config_path=br_cfg, roads_path=br_roads, now=1320.0)
    check(not res2c.get("sd_main") and FakeGo2rtcRoads.state["puts"] == [], "once on the main stream, the twin is left alone: no loop")
    # The owner forces 805_north back to direct: it returns with its kept line, twin included.
    rd = roads_load(br_roads); rd["805_north"]["forced"] = "direct"; roads_save(rd, br_roads)
    res3 = ensure_bridge_roads(rup, streams_after, bc, lans=lans, roads=roads_load(br_roads), log=logs.append, config_path=br_cfg, roads_path=br_roads, now=1400.0)
    puts = FakeGo2rtcRoads.state["puts"]
    check(res3["to_direct"] == ["805_north"] and ("805_north", "wyze://10.0.0.180?uid=A&enr=S1&mac=AA:BB:CC:DD:EE:01&model=HL_CAM4&dtls=true") in puts and ("805_north_sd", "wyze://10.0.0.180?uid=A&enr=S1&mac=AA:BB:CC:DD:EE:01&model=HL_CAM4&dtls=true&subtype=sd") in puts, "forced direct: the camera and its SD twin get their direct lines back")
    check(roads_load(br_roads)["805_north"]["road"] == "direct" and roads_load(br_roads)["805_north"]["forced"] == "direct" and '  805_north: "wyze://10.0.0.180' in open(br_cfg).read(), "the record and the config follow")
    # The owner forces the LAN DTLS camera onto the bridge.
    rd = roads_load(br_roads); rd["garage_doors"] = {"forced": "bridge"}; roads_save(rd, br_roads)
    FakeGo2rtcRoads.state["puts"] = []
    res4 = ensure_bridge_roads(rup, streams_after, bc, lans=lans, roads=roads_load(br_roads), log=logs.append, config_path=br_cfg, roads_path=br_roads, now=1500.0, only="garage_doors")
    check(res4["to_bridge"] == ["garage_doors"] and roads_load(br_roads)["garage_doors"]["reason"] == "forced" and ("garage_doors", bridge_source("garage-doors")) in FakeGo2rtcRoads.state["puts"], "forced bridge: a reachable camera rides the bridge anyway, named forced")
    # go2rtc refusing the PUT (DR-0789): the config line is still rewritten.
    FakeGo2rtcRoads.state["refuse"] = True
    rd = roads_load(br_roads); rd["805_north"]["forced"] = None; roads_save(rd, br_roads)
    streams_back = dict(streams_after); streams_back["805_north"] = streams_now["805_north"]; streams_back["805_north_sd"] = streams_now["805_north_sd"]
    res5 = ensure_bridge_roads(rup, streams_back, bc, lans=lans, roads=roads_load(br_roads), log=logs.append, config_path=br_cfg, roads_path=br_roads, now=1600.0, only="805_north")
    check(res5["to_bridge"] == ["805_north"] and '  805_north: "%s"' % bridge_source("805-north") in open(br_cfg).read() and any("refused PUT 805_north" in l for l in logs), "when go2rtc refuses the PUT the config line is rewritten and the refusal is logged")
    FakeGo2rtcRoads.state["refuse"] = False
    check(set_stream_source("http://127.0.0.1:1", "x", "rtsp://y", br_cfg, logs.append) is False, "a dark go2rtc: nothing is written and False is answered")
    # Through the handler: /health carries the bridge; /list carries the road; POST road validates; GET roads is owner-only and URL-free.
    BRIDGE_ENV = br_env
    BRIDGE_ROADS_FILE = br_roads
    # The bridge's RTSP needs its stream credentials (the first field read answered "user/pass not provided").
    bsrc = bridge_source("805-north")
    check(bsrc.startswith("rtsp://wb:") and read_env_pairs(br_env)["WB_API"] in urllib.parse.unquote(bsrc) and read_env_pairs(br_env)["WB_PASSWORD"] not in bsrc and "poetech" not in bsrc and bsrc.endswith("@127.0.0.1:8555/805-north#timeout=30"), "with the env in place the bridge line carries wb:<WB_API> before the host, never the web UI's WB_USERNAME:WB_PASSWORD (third field read: those answer wrong user/pass) (%s)" % scrub_text(bsrc))
    check(is_bridge_source(bsrc) and kind_of(bsrc) == "wyze" and sd_source(bsrc) == bsrc and sd_source(bsrc.replace("/805-north#", "/805-north-sub#")) == bsrc and is_bridge_source("rtsp://127.0.0.1:8555/x") and not is_bridge_source("rtsp://u:p@192.168.1.9:8555/x") and not is_bridge_source("rtsp://127.0.0.1:8554/x"), "a credentialed bridge line is still the bridge road (host and port decide), another host or go2rtc's own port is not")
    check(read_env_pairs(br_env)["WB_API"] not in scrub_text(bsrc) and "***@127.0.0.1" in scrub_text(bsrc), "scrub_text masks the bridge credentials wherever a URL is quoted")
    rd_pub = roads_public({"805_north": {"road": "bridge", "bridge": bsrc, "direct": "wyze://10.0.0.180?enr=S", "uri": "805-north", "reason": "other-network"}})
    check("poetech" not in json.dumps(rd_pub) and "8555" not in json.dumps(rd_pub), "the public roads view carries neither URL")
    # The second field read (cams-diag 37717592345): a camera already on the bridge road with the
    # unsigned line the first install wrote is RE-SIGNED once, twin included, then left alone.
    FakeGo2rtcRoads.state["puts"] = []
    unsigned = "rtsp://127.0.0.1:8555/805-north"
    streams_unsigned = {"805_north": {"producers": [{"url": unsigned}]}, "805_north_sd": {"producers": [{"url": unsigned + "-sub"}]}}
    rd = roads_load(br_roads); rd["805_north"] = {"road": "bridge", "bridge": unsigned, "direct": "wyze://10.0.0.180?uid=A&enr=S1&mac=AA:BB:CC:DD:EE:01&model=HL_CAM4&dtls=true", "uri": "805-north", "reason": "other-network", "since": 1234.0, "forced": None}; roads_save(rd, br_roads)
    res6 = ensure_bridge_roads(rup, streams_unsigned, bc, lans=lans, roads=roads_load(br_roads), log=logs.append, config_path=br_cfg, roads_path=br_roads, now=1700.0)
    puts = FakeGo2rtcRoads.state["puts"]
    check(res6["resigned"] == ["805_north"] and res6["to_bridge"] == [] and ("805_north", bsrc) in puts and ("805_north_sd", sd_source(bsrc)) in puts, "a bridge road written before the credentials existed is re-signed with them, twin included (%r)" % scrub_text(json.dumps(puts)))
    rd = roads_load(br_roads)
    check(rd["805_north"]["bridge"] == bsrc and rd["805_north"]["road"] == "bridge" and rd["805_north"]["since"] == 1234.0 and rd["805_north"]["direct"].startswith("wyze://10.0.0.180") and '  805_north: "%s"' % bsrc in open(br_cfg).read(), "the record keeps its direct line and its since, carries the signed line, and the config follows")
    FakeGo2rtcRoads.state["puts"] = []
    res7 = ensure_bridge_roads(rup, {"805_north": {"producers": [{"url": bsrc}]}, "805_north_sd": {"producers": [{"url": sd_source(bsrc)}]}}, bc, lans=lans, roads=roads_load(br_roads), log=logs.append, config_path=br_cfg, roads_path=br_roads, now=1800.0)
    check(res7["resigned"] == [] and res7["kept"] >= 1 and FakeGo2rtcRoads.state["puts"] == [], "once signed, the next sync keeps it and makes no call")
    res8 = ensure_bridge_roads(rup, {"805_north": {"producers": [{"url": unsigned}]}}, bc, lans=lans, roads=roads_load(br_roads), log=logs.append, config_path=br_cfg, roads_path=br_roads, now=1900.0)
    check(res8["resigned"] == [] and FakeGo2rtcRoads.state["puts"] == [], "a producer URL go2rtc echoes without its credentials does not re-sign again: the record is the judge, so there is no loop")

    print("=== 8o. a camera that moved is re-addressed; a direct road that stays dark rides the bridge and tries again later (DR-0835) ===")
    same = "wyze://192.168.1.50?uid=A&enr=S2&mac=AA:BB:CC:DD:EE:02&model=HL_CAM4&dtls=true"
    check(readdress(same, "192.168.1.77") == same.replace("192.168.1.50", "192.168.1.77"), "readdress moves the host and nothing else")
    check(readdress(same, "192.168.1.50") == same and readdress(same, "") == same and readdress(same, None) == same and readdress(same, "not-an-ip") == same and readdress("rtsp://u:p@192.168.1.9/live", "192.168.1.10") == "rtsp://u:p@192.168.1.9/live" and readdress(bsrc, "192.168.1.10") == bsrc, "the same address, no address, a bad address, an rtsp line and a bridge line are left alone")
    check(failing_cameras({"a": {"fails": 3, "last": "wyze: connect failed: discovery timeout"}, "b": {"fails": 3, "last": "HTTP 401"}, "c": {"fails": 1, "last": "i/o timeout"}}) == {"a": "wyze: connect failed: discovery timeout"}, "a tripped breaker on a connect-class reason names the camera; an auth error or an untripped one does not")
    hs = StreamHealth(now=lambda: 0.0, history=3600, interval=15)
    for i in range(4):
        hs.observe({"dead": {"producers": [{"url": "wyze://x", "bytes_recv": 0}], "consumers": [{}]},
                    "alive": {"producers": [{"url": "wyze://y", "bytes_recv": 1000 * (i + 1)}], "consumers": [{}]},
                    "idle": {"producers": [], "consumers": []}}, t=float(i * 15))
    dt = hs.dry_tries("dead", now=400.0)
    check(dt["tries"] == 4 and dt["since_bytes"] == 400.0 and dt["since_try"] == 355.0, "dry tries: four tries and not one byte since the first sample (%r)" % dt)
    un = hs.unreachable_cameras(now=300.0, dead=300, dry=3)
    check(list(un.keys()) == ["dead"], "only the camera somebody tried to watch with no byte for the dead window is unreachable; a streaming one and an idle one are not (%r)" % list(un.keys()))
    check(hs.unreachable_cameras(now=2000.0, dead=300, dry=3) == {}, "a camera nobody has tried lately is not called unreachable")
    FakeBridge.garage_ip = "192.168.1.77"
    bc2 = bridge_cameras(key="BRKEY")
    # garage_doors was forced earlier in this section; the record starts clean here
    rd = roads_load(br_roads); rd.pop("garage_doors", None); roads_save(rd, br_roads)
    check(next(c for c in bc2 if c["uri"] == "garage-doors")["ip"] == "192.168.1.77", "the bridge's listing carries where Wyze sees the camera today")
    FakeGo2rtcRoads.state["puts"] = []
    res9 = ensure_bridge_roads(rup, {"garage_doors": {"producers": [{"url": same}]}}, bc2, lans=lans, roads=roads_load(br_roads), log=logs.append, config_path=br_cfg, roads_path=br_roads, now=2000.0)
    moved_line = same.replace("192.168.1.50", "192.168.1.77")
    check(res9["readdressed"] == ["garage_doors"] and res9["to_bridge"] == [] and ("garage_doors", moved_line) in FakeGo2rtcRoads.state["puts"] and ("garage_doors_sd", sd_source(moved_line)) in FakeGo2rtcRoads.state["puts"], "a camera the bridge lists at a new address is re-addressed on the direct road, twin included, and stays direct (%r)" % res9)
    rd = roads_load(br_roads)
    check(rd["garage_doors"]["road"] == "direct" and rd["garage_doors"]["readdressed"]["from"] == "192.168.1.50" and rd["garage_doors"]["readdressed"]["to"] == "192.168.1.77" and rd["garage_doors"]["direct"] == moved_line, "the record says where it was and where it is now")
    FakeGo2rtcRoads.state["puts"] = []
    res10 = ensure_bridge_roads(rup, {"garage_doors": {"producers": [{"url": moved_line}]}}, bc2, lans=lans, roads=roads_load(br_roads), log=logs.append, config_path=br_cfg, roads_path=br_roads, now=2100.0, failing={"garage_doors": "wyze: connect failed: discovery timeout"})
    check(res10["to_bridge"] == ["garage_doors"] and ("garage_doors", bridge_source("garage-doors")) in FakeGo2rtcRoads.state["puts"], "a LAN camera whose direct road keeps failing to connect rides the bridge (%r)" % res10)
    rd = roads_load(br_roads)
    check(rd["garage_doors"]["road"] == "bridge" and rd["garage_doors"]["reason"] == "direct-unreachable" and rd["garage_doors"]["direct"] == moved_line and rd["garage_doors"]["since"] == 2100.0 and "discovery timeout" in rd["garage_doors"]["why"], "the record keeps the direct line, the reason, the time and go2rtc's own words")
    FakeGo2rtcRoads.state["puts"] = []
    bridged_now = {"garage_doors": {"producers": [{"url": bridge_source("garage-doors")}]}}
    res11 = ensure_bridge_roads(rup, bridged_now, bc2, lans=lans, roads=roads_load(br_roads), log=logs.append, config_path=br_cfg, roads_path=br_roads, now=2100.0 + 600)
    check(res11["to_direct"] == [] and res11["retried"] == [] and FakeGo2rtcRoads.state["puts"] == [], "inside the retry window it stays on the bridge: reachable-again is never assumed from the address that failed")
    res11b = ensure_bridge_roads(rup, bridged_now, bc2, lans=lans, roads=roads_load(br_roads), log=logs.append, config_path=br_cfg, roads_path=br_roads, now=2100.0 + 600, unreachable={"garage_doors": {"since_bytes": 900}})
    check(res11b["to_direct"] == [] and FakeGo2rtcRoads.state["puts"] == [], "...and a camera still dark on the bridge is not bounced")
    res12 = ensure_bridge_roads(rup, bridged_now, bc2, lans=lans, roads=roads_load(br_roads), log=logs.append, config_path=br_cfg, roads_path=br_roads, now=2100.0 + DIRECT_RETRY_SECONDS + 1)
    check(res12["to_direct"] == ["garage_doors"] and res12["retried"] == ["garage_doors"] and ("garage_doors", moved_line) in FakeGo2rtcRoads.state["puts"] and roads_load(br_roads)["garage_doors"]["reason"] == "retrying-direct", "after the retry window the direct road is tried again, at the current address (%r)" % res12)
    pub = roads_public(roads_load(br_roads))
    check(pub["garage_doors"]["readdressed"]["to"] == "192.168.1.77" and "enr=" not in json.dumps(pub) and "wyze://" not in json.dumps(pub), "the public view says a camera was re-addressed and still carries no URL")
    FakeBridge.garage_ip = None
    s, _h, d = call("GET", "/health")
    jb = json.loads(d.decode("utf-8")).get("bridge")
    check(jb and jb["configured"] is True and jb["api"] == BRIDGE_API and jb["last"]["known"] == 3, "/health carries the bridge: configured, its address, the last sync's count")
    s, _h, d = call("GET", "/list", auth=B)
    check(all(c.get("road") in ("direct", "bridge") for c in json.loads(d.decode("utf-8"))["cameras"]), "/list names every camera's road")
    s, _h, d = call("POST", "/streams/front_yard/road", json.dumps({"road": "sideways"}).encode(), auth=B)
    check(s == 400 and b"bad-road" in d, "an unknown road is refused")
    s, _h, d = call("POST", "/streams/front_yard/road", json.dumps({"road": "bridge"}).encode())
    check(s == 401, "the road is the owner's to set")
    s, _h, d = call("POST", "/streams/front_yard_sd/road", json.dumps({"road": "bridge"}).encode(), auth=B)
    check(s == 400, "a twin has no road of its own")
    s, _h, d = call("GET", "/streams/roads", auth=B)
    jr = json.loads(d.decode("utf-8"))
    check(s == 200 and "roads" in jr and "enr=" not in d.decode("utf-8") and "wyze://" not in d.decode("utf-8"), "GET /streams/roads is owner-only and carries no URL")
    s, _h, d = call("GET", "/streams/roads")
    check(s == 401, "and refuses without the key")
    BRIDGE_ENV = os.path.join(br_tmp, "absent.env")
    s, _h, d = call("POST", "/streams/front_yard/road", json.dumps({"road": "bridge"}).encode(), auth=B)
    check(s == 409 and b"bridge-not-configured" in d, "forcing the bridge before the sign-in says what is missing")
    BRIDGE_ENV = br_env
    fb.shutdown(); fr.shutdown()

    print("=== 8p. Wyze's own WebRTC road: a road is kept because it carried video (DR-1097) ===")
    kv_env = os.path.join(br_tmp, "kvs-bridge.env")
    with open(kv_env, "w") as fh:
        fh.write('WB_API="BRKEY"\nWB_PASSWORD="web-pw"\nWB_USERNAME="poetech"\n')
    saved_env, saved_api = BRIDGE_ENV, BRIDGE_API
    BRIDGE_ENV = kv_env

    class FakeKvsBridge(BaseHTTPRequestHandler):
        answers = {"805-north": "ok", "garage-doors": "Camera does not support WebRTC"}

        def log_message(self, *a):
            pass

        def do_GET(self):
            path, _, query = self.path.partition("?")
            want = "Basic " + base64.b64encode(b"poetech:web-pw").decode("ascii")
            if self.headers.get("Authorization") != want:
                self.send_response(401); self.end_headers(); return
            m = re.match(r"^/signaling/([^/]+)$", path)
            if not m or "kvs" not in urllib.parse.parse_qs(query, keep_blank_values=True):
                self.send_response(404); self.end_headers(); return
            cam = urllib.parse.unquote(m.group(1))
            res = self.answers.get(cam, "cam not found")
            doc = {"result": res, "cam": cam}
            if res == "ok":
                doc.update({"signalingUrl": "wss://kinesis.example/?X-Amz-Signature=SECRET", "ClientId": "c1", "servers": [{"urls": "turn:x", "username": "u", "credential": "SECRET"}]})
            body = json.dumps(doc).encode("utf-8")
            self.send_response(200); self.send_header("Content-Type", "application/json"); self.send_header("Content-Length", str(len(body))); self.end_headers(); self.wfile.write(body)

    fkb = ThreadingHTTPServer(("127.0.0.1", 0), FakeKvsBridge)
    fkb.daemon_threads = True
    threading.Thread(target=fkb.serve_forever, daemon=True).start()
    BRIDGE_API = "http://127.0.0.1:%d" % fkb.server_address[1]
    ksrc = kvs_source("805-north")
    check(ksrc == "webrtc:http://poetech:web-pw@127.0.0.1:%d/signaling/805-north?kvs#format=wyze" % fkb.server_address[1], "the Kinesis line is go2rtc's documented webrtc:...?kvs#format=wyze, signed with the bridge's WEB sign-in (%r)" % ksrc)
    check(is_kvs_source(ksrc) and is_kvs_source(ksrc.replace("poetech:web-pw@", "")) and not is_kvs_source(bridge_source("805-north")) and not is_kvs_source("webrtc:http://192.168.1.9:%d/signaling/x?kvs#format=wyze" % fkb.server_address[1]) and not is_kvs_source("webrtc:http://127.0.0.1:%d/signaling/x#format=wyze" % fkb.server_address[1]), "only a ?kvs signaling line on the bridge's own address is the Kinesis road")
    check(kvs_uri_of(ksrc) == "805-north" and kind_of(ksrc) == "wyze" and sd_source(ksrc) is None and bridge_road_wanted(ksrc, lans) == (False, "") and readdress(ksrc, "192.168.1.10") == ksrc, "a Kinesis camera is still a Wyze camera; no twin is derived from it, no road wanted, never re-addressed")
    check(restream_source("805_north") == "rtsp://127.0.0.1:8554/805_north" and not is_bridge_source(restream_source("805_north")), "its SD twin is go2rtc's own restream of it: one Kinesis session, not two")
    BRIDGE_ENV = os.path.join(br_tmp, "absent.env")
    check(kvs_source("805-north") is None and bridge_kvs_signal("805-north") == {"result": "no-web-sign-in"}, "without the bridge's web sign-in there is no Kinesis line and nothing is asked")
    BRIDGE_ENV = kv_env
    sig = bridge_kvs_signal("805-north")
    check(sig == {"result": "ok"}, "Wyze's answer is read as its result alone: the signed signaling URL and TURN credential never leave the function (%r)" % sig)
    check(bridge_kvs_signal("garage-doors") == {"result": "Camera does not support WebRTC"} and bridge_kvs_signal("nope") == {"result": "cam not found"}, "a camera Wyze gives no WebRTC road is named in Wyze's own words")
    check(bridge_kvs_signal("805-north", auth=("poetech", "wrong")) == {"result": "bridge answered HTTP 401"}, "a wrong web sign-in is named, not hidden")

    class FakeGo2rtcKvs(BaseHTTPRequestHandler):
        state = {"src": {}, "puts": [], "live": set(), "hang": False}

        def log_message(self, *a):
            pass

        def do_PUT(self):
            path, _, query = self.path.partition("?")
            q = urllib.parse.parse_qs(query)
            name, src = q.get("name", [""])[0], q.get("src", [""])[0]
            self.state["puts"].append((name, src))
            self.state["src"][name] = src
            self.send_response(200); self.send_header("Content-Length", "2"); self.end_headers(); self.wfile.write(b"{}")

        def do_GET(self):
            path, _, query = self.path.partition("?")
            if path == "/api/streams":
                body = json.dumps(dict((k, {"producers": [{"url": v}]}) for k, v in self.state["src"].items())).encode("utf-8")
                self.send_response(200); self.send_header("Content-Length", str(len(body))); self.end_headers(); self.wfile.write(body); return
            if path == "/api/log":
                body = ("\n".join([
                    json.dumps({"level": "error", "error": "streams: read tcp 127.0.0.1:1->127.0.0.1:8555: i/o timeout", "time": 1}),
                    json.dumps({"level": "warn", "error": "webrtc/wyze: kinesis: ice connection failed", "stream": "805_north", "time": 2}),
                ])).encode("utf-8")
                self.send_response(200); self.send_header("Content-Length", str(len(body))); self.end_headers(); self.wfile.write(body); return
            if path == "/api/stream.mp4":
                name = urllib.parse.parse_qs(query).get("src", [""])[0]
                src = self.state["src"].get(name, "")
                road = "kvs" if is_kvs_source(src) else ("bridge" if is_bridge_source(src) else "other")
                if (name, road) not in self.state["live"]:
                    if self.state["hang"]:
                        self.send_response(200); self.end_headers(); time.sleep(2.5); return
                    self.send_response(500); self.end_headers(); self.wfile.write(b"streams: read tcp 127.0.0.1:1->127.0.0.1:8555: i/o timeout"); return
                self.send_response(200); self.end_headers()
                for _i in range(4):
                    self.wfile.write(b"\0" * 8192)
                return
            self.send_response(404); self.end_headers()

    fgk = ThreadingHTTPServer(("127.0.0.1", 0), FakeGo2rtcKvs)
    fgk.daemon_threads = True
    fgk.handle_error = lambda *_a: None  # a probe that hangs up after its bytes is the point, not an error
    threading.Thread(target=fgk.serve_forever, daemon=True).start()
    kup = "http://127.0.0.1:%d" % fgk.server_address[1]
    G = FakeGo2rtcKvs.state
    G["live"] = {("cam_a", "kvs")}
    G["src"] = {"cam_a": bridge_source("805-north")}
    sb = stream_bytes(kup, "cam_a", seconds=2)
    check(sb["ok"] is False and sb["bytes"] == 0 and "i/o timeout" in sb["error"], "the byte probe reads the stream the app opens and names go2rtc's own failure (%r)" % sb)
    G["src"]["cam_a"] = ksrc
    sb = stream_bytes(kup, "cam_a", seconds=2)
    check(sb["ok"] is True and sb["bytes"] >= KVS_PROBE_BYTES, "a road carrying video reads as ok with its byte count (%r)" % sb)
    G["hang"] = True
    G["src"]["cam_a"] = bridge_source("805-north")
    t_h = time.time()
    sb = stream_bytes(kup, "cam_a", seconds=1)
    check(sb["ok"] is False and time.time() - t_h < 5 and sb["error"].startswith("no byte in"), "a stream that answers and sends nothing is bounded by the probe's own clock (%r)" % sb)
    G["hang"] = False

    kv_roads = os.path.join(br_tmp, "kvs-roads.json")
    kv_cfg = os.path.join(br_tmp, "kvs-go2rtc.yaml")
    with open(kv_cfg, "w") as fh:
        fh.write('streams:\n  805_north: "%s"\n  805_north_sd: "%s"\n  garage_doors: "%s"\n' % (bridge_source("805-north"), bridge_source("805-north"), bridge_source("garage-doors")))
    roads_save({"805_north": {"road": "bridge", "bridge": bridge_source("805-north"), "uri": "805-north", "reason": "direct-unreachable", "direct": "wyze://10.0.0.180?uid=A&enr=S1&mac=AA:BB:CC:DD:EE:01"},
                "garage_doors": {"road": "bridge", "bridge": bridge_source("garage-doors"), "uri": "garage-doors", "reason": "no-dtls"}}, kv_roads)
    G["src"] = {"805_north": bridge_source("805-north"), "805_north_sd": bridge_source("805-north"), "garage_doors": bridge_source("garage-doors")}
    G["puts"] = []
    G["live"] = {("805_north", "kvs")}  # Wyze's WebRTC carries 805 North; the bridge's TUTK does not
    # PROVEN TO CATCH: the road sync alone (what ran before this record) leaves a camera dark on the bridge dark.
    kv_streams = dict((k, {"producers": [{"url": v}]}) for k, v in G["src"].items())
    before = ensure_bridge_roads(kup, kv_streams, [{"uri": "805-north", "mac": "AABBCCDDEE01", "ip": "10.0.0.180"}], lans=lans, roads=roads_load(kv_roads), log=lambda *_a: None, config_path=kv_cfg, roads_path=kv_roads, now=5000.0)
    check(not before.get("to_kvs") and is_bridge_source(G["src"]["805_north"]), "PROVEN TO CATCH: the road sync alone keeps 805_north on the dark bridge; nothing before this record ever tried Wyze's WebRTC road")
    kv_log = []
    fast = lambda up, s: stream_bytes(up, s, seconds=2)
    v = judge_camera(kup, "805_north", log=kv_log.append, now=6000.0, probe=fast, config_path=kv_cfg, roads_path=kv_roads)
    rec = roads_load(kv_roads)["805_north"]
    check(v["current"] == "bridge" and v["current_probe"]["ok"] is False and v["kvs_signal"] == "ok" and v["alt"] == "kvs" and v["kept"] == "kvs" and v["alt_probe"]["ok"] is True, "a camera dark on the bridge that Wyze offers WebRTC for is read on that road and kept there because it carried video (%r)" % v)
    check(G["src"]["805_north"] == ksrc and G["src"]["805_north_sd"] == restream_source("805_north"), "go2rtc now holds the Kinesis line, and the SD twin restreams it")
    check(rec["road"] == "kvs" and rec["reason"] == "tutk-dark" and rec["bridge"] == bridge_source("805-north") and rec["direct"].startswith("wyze://10.0.0.180") and rec["judged"]["kept"] == "kvs", "the record keeps the road, why, the bridge line to fall back to and the direct line, with the verdict")
    cfg_kv = open(kv_cfg).read()
    check('  805_north: "%s"' % ksrc in cfg_kv and '  805_north_sd: "%s"' % restream_source("805_north") in cfg_kv, "the config says what memory says")
    check(any("now rides Wyze's own WebRTC road" in l and "bytes in" in l for l in kv_log), "the forwarder's log says which road the camera now rides and what it carried")
    v2 = judge_camera(kup, "garage_doors", log=kv_log.append, now=6000.0, probe=fast, config_path=kv_cfg, roads_path=kv_roads)
    check(v2["kvs_signal"] == "Camera does not support WebRTC" and v2["kept"] == "bridge" and v2["dark"] is True and "alt" not in v2 and G["src"]["garage_doors"] == bridge_source("garage-doors"), "a camera Wyze gives no WebRTC road is left on the bridge, named dark, in Wyze's own words, and nothing is switched (%r)" % v2)
    # Dark on both roads: tried, then put back where it was.
    G["live"] = set()
    G["src"]["805_north"] = bridge_source("805-north")
    roads_save(dict(roads_load(kv_roads), **{"805_north": {"road": "bridge", "bridge": bridge_source("805-north"), "uri": "805-north", "reason": "direct-unreachable"}}), kv_roads)
    G["puts"] = []
    v3 = judge_camera(kup, "805_north", log=kv_log.append, now=7000.0, probe=fast, config_path=kv_cfg, roads_path=kv_roads)
    check(v3["kept"] == "bridge" and v3["dark"] is True and v3["alt_probe"]["ok"] is False and G["src"]["805_north"] == bridge_source("805-north") and ("805_north", ksrc) in G["puts"], "dark on both roads: the Kinesis road is tried, then the camera is put back on the bridge line it had (%r)" % v3)
    check(any("dark on both roads" in l for l in kv_log), "and the log says so, with both roads' own failure")
    # The bridge carries video: nothing is switched.
    G["live"] = {("805_north", "bridge")}
    G["puts"] = []
    v4 = judge_camera(kup, "805_north", log=kv_log.append, now=8000.0, probe=fast, config_path=kv_cfg, roads_path=kv_roads)
    check(v4["kept"] == "bridge" and v4["current_probe"]["ok"] is True and G["puts"] == [], "a camera the bridge carries is kept on the bridge and nothing is touched (a working peer road is never traded for the cloud)")
    # A Kinesis camera that goes dark goes back to the bridge when the bridge carries it.
    G["src"]["805_north"] = ksrc
    roads_save(dict(roads_load(kv_roads), **{"805_north": {"road": "kvs", "kvs": ksrc, "bridge": bridge_source("805-north"), "uri": "805-north", "reason": "tutk-dark"}}), kv_roads)
    v5 = judge_camera(kup, "805_north", log=kv_log.append, now=9000.0, probe=fast, config_path=kv_cfg, roads_path=kv_roads)
    check(v5["current"] == "kvs" and v5["alt"] == "bridge" and v5["kept"] == "bridge" and G["src"]["805_north"] == bridge_source("805-north") and roads_load(kv_roads)["805_north"]["road"] == "bridge", "a Kinesis camera gone dark is read on the bridge and moved back when the bridge carries it")
    pub_kv = json.dumps(roads_public(roads_load(kv_roads)))
    check("web-pw" not in pub_kv and "SECRET" not in pub_kv and "webrtc:" not in pub_kv and "rtsp://" not in pub_kv and "judged" in pub_kv, "the public roads carry each verdict and no line, password or Wyze credential")

    # Who is judged, and the brakes.
    class FakeHealth:
        def __init__(self, last):
            self.last = last

        def last_bytes_at(self, sid):
            return self.last.get(sid)

    js = {"a": {"producers": [{"url": bridge_source("a")}]}, "b": {"producers": [{"url": ksrc}]}, "c": {"producers": [{"url": bridge_source("c")}]},
          "d": {"producers": [{"url": bridge_source("d")}]}, "e": {"producers": [{"url": "wyze://192.168.1.15?uid=A&enr=S"}]}, "f": {"producers": [{"url": bridge_source("f")}]},
          "a_sd": {"producers": [{"url": bridge_source("a")}]}}
    jr = {"c": {"forced": "bridge"}, "d": {"judged": {"at": 9500.0, "v": JUDGE_VERSION}}, "f": {"judged": {"at": 1000.0, "v": JUDGE_VERSION}}}
    cands = judge_candidates(js, jr, health=FakeHealth({"b": 9990.0}), now=10000.0, dark=900, rejudge=3600)
    check(cands == ["a", "f"], "judged: dark cameras on the bridge or Kinesis road, never judged first; not the one carrying bytes, not the owner's pinned one, not one judged within the hour, not a direct or twin stream (%r)" % cands)
    G["live"] = {("805_north", "bridge")}
    G["src"] = dict(("cam%d" % i, bridge_source("cam%d" % i)) for i in range(5))
    tick = {"t": 20000.0}

    def clk():
        tick["t"] += 1.0
        return tick["t"]

    summ = judge_pass(kup, log=lambda *_a: None, roads_path=os.path.join(br_tmp, "kvs-roads-pass.json"), config_path=kv_cfg, probe=fast, signal=lambda u: {"result": "Camera does not support WebRTC"}, health=FakeHealth({}), clock=clk, offline=set())
    check(summ["waiting"] == 5 and len(summ["judged"]) == KVS_JUDGE_PER_PASS and summ["dark"] == summ["judged"], "a pass judges at most KVS_JUDGE_PER_PASS cameras of those waiting and names the dark ones (%r)" % summ)
    tick["t"] = 30000.0
    late = {"n": 0}

    def clk_late():
        late["n"] += 1
        return 30000.0 if late["n"] == 1 else 30000.0 + KVS_PASS_SECONDS + 1

    summ2 = judge_pass(kup, log=lambda *_a: None, roads_path=os.path.join(br_tmp, "kvs-roads-pass2.json"), config_path=kv_cfg, probe=fast, signal=lambda u: {"result": "x"}, health=FakeHealth({}), clock=clk_late, offline=set())
    check(summ2["judged"] == [], "a pass past its own clock stops before the next camera (the budget)")
    check(_JUDGE_LOCK.acquire(blocking=False), "the judge's lock is free between passes")
    check(start_judge(kup) is False, "while a pass holds the lock no second pass starts (the lock)")
    _JUDGE_LOCK.release()
    # The owner's hand: "kvs" puts a camera there; "bridge" takes it back.
    G["src"] = {"805_north": bridge_source("805-north")}
    G["puts"] = []
    roads_save({"805_north": {"road": "bridge", "bridge": bridge_source("805-north"), "uri": "805-north", "forced": "kvs"}}, kv_roads)
    fk = ensure_bridge_roads(kup, {"805_north": {"producers": [{"url": bridge_source("805-north")}]}}, [{"uri": "805-north", "mac": "AABBCCDDEE01"}], lans=lans, roads=roads_load(kv_roads), log=lambda *_a: None, config_path=kv_cfg, roads_path=kv_roads, now=11000.0)
    check(fk.get("to_kvs") == ["805_north"] and G["src"]["805_north"] == ksrc and G["src"].get("805_north_sd") == restream_source("805_north"), "the owner's 'kvs' puts the camera on Wyze's WebRTC road with its restreamed twin (%r)" % fk)
    fk2 = ensure_bridge_roads(kup, {"805_north": {"producers": [{"url": ksrc}]}}, [{"uri": "805-north", "mac": "AABBCCDDEE01"}], lans=lans, roads=roads_load(kv_roads), log=lambda *_a: None, config_path=kv_cfg, roads_path=kv_roads, now=11100.0)
    check(fk2["kept"] == 1 and not fk2.get("to_kvs") and not fk2["resigned"], "a second sync leaves it alone")
    with open(kv_env, "w") as fh:
        fh.write('WB_API="BRKEY"\nWB_PASSWORD="new-web-pw"\nWB_USERNAME="poetech"\n')
    fk3 = ensure_bridge_roads(kup, {"805_north": {"producers": [{"url": ksrc}]}}, [{"uri": "805-north", "mac": "AABBCCDDEE01"}], lans=lans, roads=roads_load(kv_roads), log=lambda *_a: None, config_path=kv_cfg, roads_path=kv_roads, now=11200.0)
    check(fk3["resigned"] == ["805_north"] and "new-web-pw" in G["src"]["805_north"], "a changed web sign-in re-signs the Kinesis line once")
    rk = roads_load(kv_roads); rk["805_north"]["forced"] = "bridge"; roads_save(rk, kv_roads)
    fk4 = ensure_bridge_roads(kup, {"805_north": {"producers": [{"url": G["src"]["805_north"]}]}}, [{"uri": "805-north", "mac": "AABBCCDDEE01"}], lans=lans, roads=roads_load(kv_roads), log=lambda *_a: None, config_path=kv_cfg, roads_path=kv_roads, now=11300.0)
    check(fk4["to_bridge"] == ["805_north"] and G["src"]["805_north"] == bridge_source("805-north") and roads_load(kv_roads)["805_north"]["road"] == "bridge", "the owner's 'bridge' takes it back off Wyze's WebRTC road")
    check(camera_list({"x": {"producers": [{"url": ksrc}]}})[0]["road"] == "kvs" and camera_list({"x": {"producers": [{"url": ksrc}]}})[0]["kind"] == "wyze", "/list names the Kinesis road and still calls it a Wyze camera")
    check("web-pw" not in scrub_text("go2rtc said: " + kvs_source("805-north") + " failed"), "a Kinesis line quoted in a diagnostic loses its web password")
    print("=== 8q. the bridge's MAIN name, never its -sub, and the judge asks Wyze by it (DR-1097, second read) ===")
    both = [{"uri": "back-yard-north", "mac": "AA01"}, {"uri": "back-yard-north-sub", "mac": "AA01"}, {"uri": "kitchen-cam", "mac": "AA02"}]
    check(by_mac_main(both) == {"AA01": "back-yard-north", "AA02": "kitchen-cam"} and by_mac_main(list(reversed(both))) == {"AA01": "back-yard-north", "AA02": "kitchen-cam"}, "a MAC listed as a camera and its -sub matches the camera, in either order")
    check(by_mac_main([{"uri": "lone-sub", "mac": "AA03"}]) == {"AA03": "lone-sub"} and main_uri("back-yard-north-sub") == "back-yard-north" and main_uri("kitchen-cam") == "kitchen-cam" and main_uri("-sub") == "-sub", "a -sub alone is still matched; main_uri strips only the suffix")
    G["src"] = {"back_yard_north": bridge_source("back-yard-north-sub"), "back_yard_north_sd": bridge_source("back-yard-north-sub")}
    G["puts"] = []
    roads_save({"back_yard_north": {"road": "bridge", "bridge": bridge_source("back-yard-north-sub"), "uri": "back-yard-north-sub", "reason": "direct-unreachable", "since": 1.0}}, kv_roads)
    s1 = ensure_bridge_roads(kup, {"back_yard_north": {"producers": [{"url": bridge_source("back-yard-north-sub")}]}}, both, lans=lans, roads=roads_load(kv_roads), log=lambda *_a: None, config_path=kv_cfg, roads_path=kv_roads, now=12000.0)
    check(s1["resigned"] == ["back_yard_north"] and G["src"]["back_yard_north"] == bridge_source("back-yard-north") and roads_load(kv_roads)["back_yard_north"]["uri"] == "back-yard-north", "PROVEN TO CATCH: a camera recorded on the bridge's -sub (26 of them, live) is moved to its main stream once (%r)" % s1)
    s2 = ensure_bridge_roads(kup, {"back_yard_north": {"producers": [{"url": G["src"]["back_yard_north"]}]}}, both, lans=lans, roads=roads_load(kv_roads), log=lambda *_a: None, config_path=kv_cfg, roads_path=kv_roads, now=12100.0)
    check(s2["resigned"] == [] and s2["kept"] == 1, "and a second sync leaves it alone")
    asked = []
    G["live"] = {("back_yard_north", "kvs")}
    G["src"]["back_yard_north"] = bridge_source("back-yard-north-sub")
    rk = roads_load(kv_roads); rk["back_yard_north"]["uri"] = "back-yard-north-sub"; roads_save(rk, kv_roads)
    vq = judge_camera(kup, "back_yard_north", log=lambda *_a: None, now=12200.0, probe=fast, signal=lambda u: (asked.append(u), {"result": "ok"})[1], config_path=kv_cfg, roads_path=kv_roads)
    check(asked == ["back-yard-north"] and vq["kept"] == "kvs" and G["src"]["back_yard_north"] == kvs_source("back-yard-north") and vq["v"] == JUDGE_VERSION, "the judge asks Wyze by the main name, never the -sub that answered 'cam not found', and the Kinesis line names it (%r)" % asked)
    cq = judge_candidates({"a": {"producers": [{"url": bridge_source("a")}]}, "b": {"producers": [{"url": bridge_source("b")}]}},
                          {"a": {"judged": {"at": 9900.0}}, "b": {"judged": {"at": 9900.0, "v": JUDGE_VERSION}}}, health=FakeHealth({}), now=10000.0, dark=900, rejudge=3600)
    check(cq == ["a"], "a verdict an older judge took within the hour is judged again; one this judge took is not (%r)" % cq)
    G["live"] = set()
    G["src"]["805_north"] = bridge_source("805-north")
    rk = roads_load(kv_roads); rk["805_north"] = {"road": "bridge", "bridge": bridge_source("805-north"), "uri": "805-north"}; roads_save(rk, kv_roads)
    vd = judge_camera(kup, "805_north", log=lambda *_a: None, now=12300.0, probe=fast, signal=lambda u: {"result": "ok"}, config_path=kv_cfg, roads_path=kv_roads)
    check(vd.get("dark") is True and vd.get("go2rtc_said") and all("805_north" in l or "webrtc" in l.lower() for l in vd["go2rtc_said"]) and not any("8555: i/o timeout" in l and "webrtc" not in l.lower() for l in vd["go2rtc_said"]), "a camera dark on both keeps go2rtc's own words about it, never the bridge's timeout wall (%r)" % vd.get("go2rtc_said"))

    saved_roads = BRIDGE_ROADS_FILE
    BRIDGE_ROADS_FILE = kv_roads
    rk = roads_load(kv_roads); rk["805_north"]["judged"] = {"current": "bridge", "current_probe": {"ok": False, "error": "no byte in 30 s"}, "kvs_signal": "Camera does not support WebRTC", "kept": "bridge", "dark": True}; roads_save(rk, kv_roads)
    s, _h, d = call("GET", "/why/805_north", auth=B)
    jw = json.loads(d.decode("utf-8"))
    check(s == 200 and jw.get("road", {}).get("road") == "bridge" and jw["road"]["judged"]["kvs_signal"] == "Camera does not support WebRTC" and jw["road"]["judged"]["dark"] is True, "/why carries the camera's road and the judge's last measurement, so the tile can say why (%r)" % jw.get("road"))
    check(b"rtsp://" not in d and b"webrtc:" not in d and b"web-pw" not in d and b"BRKEY" not in d, "and never a line, a key or a password")
    BRIDGE_ROADS_FILE = saved_roads

    print("=== 8r. one held Kinesis session per watched camera; an unanswered offer is abandoned (DR-1097, third read) ===")
    quiet = lambda *_a: None  # noqa: E731
    kc = [{"uri": "kitchen-cam", "mac": "AA21"}]
    G["src"] = {"kitchen_cam": kvs_source("kitchen-cam")}
    G["puts"] = []
    roads_save({"kitchen_cam": {"road": "bridge", "bridge": bridge_source("kitchen-cam"), "uri": "kitchen-cam", "reason": "other-network"}}, kv_roads)
    with BRIDGE_LOCK:
        JUDGING.add("kitchen_cam")
    s3 = ensure_bridge_roads(kup, {"kitchen_cam": {"producers": [{"url": kvs_source("kitchen-cam")}]}}, kc, lans=lans, roads=roads_load(kv_roads), log=quiet, config_path=kv_cfg, roads_path=kv_roads, now=13000.0)
    check(G["puts"] == [] and roads_load(kv_roads)["kitchen_cam"]["road"] == "bridge" and s3["kept"] == 1, "while the judge tries Wyze's WebRTC on a camera, the road sync neither re-signs it nor writes 'kvs' into its record (%r)" % s3)
    with BRIDGE_LOCK:
        JUDGING.discard("kitchen_cam")
    ensure_bridge_roads(kup, {"kitchen_cam": {"producers": [{"url": kvs_source("kitchen-cam")}]}}, kc, lans=lans, roads=roads_load(kv_roads), log=quiet, config_path=kv_cfg, roads_path=kv_roads, now=13001.0)
    check(roads_load(kv_roads)["kitchen_cam"]["road"] == "kvs", "PROVEN TO CATCH: without that guard the same sync writes 'kvs' over a camera the judge was only trying (the live record of back_yard_south, front_yard, north_east_cam)")

    def racing_probe(up, s_):
        if is_kvs_source(G["src"].get(s_, "")):
            rr = roads_load(kv_roads); rr[s_]["road"] = "kvs"; roads_save(rr, kv_roads)
        return {"ok": False, "bytes": 0, "ms": 1, "error": "timed out"}
    G["src"] = {"front_yard": bridge_source("front-yard")}
    roads_save({"front_yard": {"road": "bridge", "bridge": bridge_source("front-yard"), "uri": "front-yard"}}, kv_roads)
    vr = judge_camera(kup, "front_yard", log=quiet, now=13100.0, probe=racing_probe, signal=lambda u: {"result": "ok"}, config_path=kv_cfg, roads_path=kv_roads)
    check(vr.get("dark") is True and G["src"]["front_yard"] == bridge_source("front-yard") and roads_load(kv_roads)["front_yard"]["road"] == "bridge" and "front_yard" not in judging_now(),
          "a camera dark on both goes back to the bridge line AND its record says bridge, whatever was written while it was tried (%r)" % roads_load(kv_roads)["front_yard"].get("road"))
    G["src"] = {"back_yard_south": bridge_source("back-yard-south")}
    roads_save({"back_yard_south": {"road": "kvs", "bridge": bridge_source("back-yard-south"), "kvs": kvs_source("back-yard-south"), "uri": "back-yard-south", "reason": "direct-unreachable", "since": 1.0}}, kv_roads)
    s5 = ensure_bridge_roads(kup, {"back_yard_south": {"producers": [{"url": bridge_source("back-yard-south")}]}}, [{"uri": "back-yard-south", "mac": "AA22"}], lans=lans, roads=roads_load(kv_roads), log=quiet, config_path=kv_cfg, roads_path=kv_roads, now=13200.0)
    check(s5.get("healed") == ["back_yard_south"] and roads_load(kv_roads)["back_yard_south"]["road"] == "bridge", "a record that already says 'kvs' over a bridge line is healed by the next sync: the record follows the line (%r)" % s5)

    roads_save({"a_cam": {"road": "kvs"}, "b_cam": {"road": "bridge"}}, kv_roads)
    check(kvs_road_ids(kv_roads) == frozenset({"a_cam"}), "the Kinesis cameras are read from the roads record")
    roads_save({"a_cam": {"road": "bridge"}, "b_cam": {"road": "kvs"}}, kv_roads)
    st_ = os.stat(kv_roads)
    os.utime(kv_roads, ns=(st_.st_atime_ns, st_.st_mtime_ns + 1000000))
    check(kvs_road_ids(kv_roads) == frozenset({"b_cam"}), "and read again when the record changes")
    G["src"] = {"a_cam": kvs_source("a-cam"), "b_cam": bridge_source("b-cam")}
    G["puts"] = []
    check(kvs_rearm(kup, "a_cam", kv_cfg) is True and G["puts"] == [("a_cam", kvs_source("a-cam"))], "a re-arm puts the camera's own Kinesis line again (a PUT is a fresh go2rtc stream, so the next dial is a fresh offer)")
    check(kvs_rearm(kup, "b_cam", kv_cfg) is False and len(G["puts"]) == 1, "and never touches a camera on another road")
    with BRIDGE_LOCK:
        JUDGING.add("a_cam")
    check(kvs_rearm(kup, "a_cam", kv_cfg) is False and len(G["puts"]) == 1, "nor a camera the judge is reading")
    with BRIDGE_LOCK:
        JUDGING.discard("a_cam")

    clk = [1000.0]
    reads = {"n": 0}
    script = []
    pending = []
    rearmed = []
    slept = []
    retouch = {"on": None}

    class FakeHoldResp:
        def __init__(self, n, size=1000):
            self.n = n
            self.size = size

        def read1(self, _size):
            clk[0] += 10.0
            reads["n"] += 1
            if retouch["on"]:
                hold.touch(kup, retouch["on"])
            if self.n <= 0:
                return b""
            self.n -= 1
            return b"x" * self.size

        def close(self):
            pass

    def fopen(url, timeout=None):
        step = script.pop(0) if script else "refuse"
        if step == "hang":
            clk[0] += float(timeout)
            raise socket.timeout("timed out")
        if step == "refuse":
            raise urllib.error.URLError("refused")
        if isinstance(step, tuple):
            return FakeHoldResp(*step)
        return FakeHoldResp(step)

    hold = KvsHold(clock=lambda: clk[0], opener=fopen, rearm=lambda up, s_, cp: (rearmed.append(s_), True)[1],
                   spawn=lambda fn, name: pending.append(fn), sleep=lambda w: (slept.append(w), clk.__setitem__(0, clk[0] + w)),
                   log=quiet, max_holds=2, hold=60, life=600, dial=20, gap=30, redial=5)
    check(hold.touch(kup, "a_cam") == "started" and hold.touch(kup, "a_cam") == "held" and len(pending) == 1, "a watched Kinesis camera gets one holder; a second look joins it (the lock)")
    check(hold.touch(kup, "b_cam") == "started" and hold.touch(kup, "c_cam") == "full" and hold.snapshot()["counts"]["full"] == 1, "the budget: no more holders than KVS_HOLD_MAX")
    script[:] = ["hang", (3, 16384)]
    pending[0]()
    check(rearmed == ["a_cam"] and hold.counts["rearmed"] == 1 and "a_cam" not in hold.holds and not script,
          "PROVEN TO CATCH: an offer Wyze leaves unanswered is abandoned after the dial clock and the camera re-armed; the next dial carries video; the holder ends KVS_HOLD_SECONDS after the last look (%r)" % rearmed)
    hold.touch(kup, "b_cam")
    script[:] = ["hang", "hang", "hang"]
    pending[1]()
    check(rearmed == ["a_cam", "b_cam", "b_cam"] and not script, "three unanswered offers in 60 s re-arm twice, never closer than KVS_REARM_GAP (%r)" % rearmed)
    # DR-1097 sixteenth read: the hold re-armed 805_north at 20:02:08 while a window was watching it.
    pend_w = []
    spare = KvsHold(clock=lambda: clk[0], opener=fopen, rearm=lambda up, s_, cp: (rearmed.append(s_), True)[1],
                    spawn=lambda fn, name: pend_w.append(fn), sleep=lambda w: clk.__setitem__(0, clk[0] + w),
                    log=quiet, max_holds=2, hold=60, life=600, dial=20, gap=30, redial=5, watched=lambda sid: sid == "w_cam")
    n_re = len(rearmed)
    spare.touch(kup, "w_cam")
    script[:] = ["hang", "hang"]
    pend_w[0]()
    check(len(rearmed) == n_re and spare.counts.get("spared", 0) >= 2,
          "PROVEN TO CATCH: a camera a viewer is getting video from is never re-armed when the hold's own dial comes back empty (the re-arm ends every viewer) (%r)" % (spare.counts,))
    LIVE_LAST_BYTES["fresh_cam"] = time.monotonic()
    check(viewer_flowing("fresh_cam_sd") and not viewer_flowing("other_cam") and not viewer_flowing("fresh_cam", now=time.monotonic() + VIEWER_FRESH_SECONDS + 1),
          "a twin's viewer counts for its camera; a viewer silent past VIEWER_FRESH_SECONDS does not")
    LIVE_LAST_BYTES.pop("fresh_cam", None)
    slept[:] = []
    reads["n"] = 0
    pending[:] = []
    hold.touch(kup, "c_cam")
    script[:] = []
    n_before = len(rearmed)
    pending[0]()
    check(slept and all(abs(w - 5) < 1e-6 for w in slept) and len(slept) <= 12 and len(rearmed) - n_before <= 2, "a go2rtc that refuses at once is redialled once per KVS_REDIAL_SECONDS, never in a tight loop (%d dials)" % len(slept))
    big = KvsHold(clock=lambda: clk[0], opener=fopen, rearm=lambda *_a: True, spawn=lambda fn, name: pending.append(fn), sleep=lambda w: None,
                  log=quiet, max_holds=2, hold=60, life=100, dial=20, gap=30, redial=5)
    hold = big
    pending[:] = []
    reads["n"] = 0
    big.touch(kup, "d_cam")
    retouch["on"] = "d_cam"
    script[:] = [50]
    pending[0]()
    retouch["on"] = None
    check(10 <= reads["n"] <= 11 and "d_cam" not in big.holds, "a holder never outlives KVS_HOLD_LIFE_SECONDS, however often it is looked at (%d reads of 10 s)" % reads["n"])
    off = KvsHold(clock=lambda: clk[0], opener=fopen, spawn=lambda fn, name: pending.append(fn), max_holds=0)
    check(off.touch(kup, "a_cam") == "off", "the stop-path: CAMS_KVS_HOLD_MAX=0 holds nothing")
    pending[:] = []
    vh = KvsHold(clock=lambda: clk[0], opener=fopen, spawn=lambda fn, name: pending.append(fn), max_holds=4)
    roads_save({"a_cam": {"road": "kvs"}, "b_cam": {"road": "bridge"}}, kv_roads)
    st_ = os.stat(kv_roads)
    os.utime(kv_roads, ns=(st_.st_atime_ns, st_.st_mtime_ns + 2000000))
    check(kvs_viewed(kup, "a_cam_sd", roads_path=kv_roads, hold=vh) is True and list(vh.holds) == ["a_cam"], "a frame of a Kinesis camera's twin holds the camera's own session")
    check(kvs_viewed(kup, "b_cam", roads_path=kv_roads, hold=vh) is False and list(vh.holds) == ["a_cam"], "a camera on the bridge is never held")
    snap_ = vh.snapshot()
    check(set(snap_) == {"max", "hold_s", "dial_s", "held_min", "holding", "counts"} and "webrtc:" not in json.dumps(snap_) and "web-pw" not in json.dumps(snap_), "/health names the held cameras and their counts, never a line")
    print("=== 8s. the cameras go2rtc's Wyze sign-in drops are added on Wyze's WebRTC road (DR-1097, sixth read) ===")
    bl = [{"uri": "a-cam", "mac": norm_mac("AA:BB:CC:00:00:01"), "nickname": "A Cam"}, {"uri": "b-cam", "mac": norm_mac("AA:BB:CC:00:00:02"), "nickname": "B Cam"}, {"uri": "b-cam-sub", "mac": norm_mac("AA:BB:CC:00:00:02"), "nickname": "B Cam"},
          {"uri": "c-cam", "mac": norm_mac("AA:BB:CC:00:00:03"), "nickname": "C Cam"}, {"uri": "d-cam", "mac": norm_mac("AA:BB:CC:00:00:04"), "nickname": "D Cam"},
          {"uri": "805-floodlight-cam---west", "mac": norm_mac("AA:BB:CC:00:00:05"), "nickname": "805 Floodlight Cam - West"}, {"uri": "805-floodlight-cam---west-sub", "mac": norm_mac("AA:BB:CC:00:00:05"), "nickname": "805 Floodlight Cam - West"}]
    st_m = {"a_cam": {"producers": [{"url": kvs_source("a-cam")}]}, "b_cam": {"producers": [{"url": bridge_source("b-cam-sub")}]},
            "c_cam": {"producers": [{"url": "wyze://192.168.1.9?uid=U&enr=S&mac=AABBCC000003&model=X"}]}}
    rd_m = {"d_cam": {"road": "bridge", "uri": "d-cam"}}
    mc = missing_cameras(st_m, bl, rd_m)
    check([m["uri"] for m in mc] == ["805-floodlight-cam---west"], "a camera the bridge lists that no stream (Kinesis, bridge, direct by MAC) and no record carries is found missing, its -sub never (%r)" % mc)
    G["src"] = dict((k, v["producers"][0]["url"]) for k, v in st_m.items())
    G["puts"] = []
    roads_save(dict(rd_m), kv_roads)
    asked_m = []
    sig_m = lambda u: (asked_m.append(u), {"result": "ok" if u == "805-floodlight-cam---west" else "Camera does not support WebRTC"})[1]  # noqa: E731
    ADD_TRIED.clear()
    am = ensure_missing_cameras(kup, dict(st_m), bl, log=quiet, config_path=kv_cfg, roads_path=kv_roads, now=14000.0, signal=sig_m)
    rm = roads_load(kv_roads).get("805_floodlight_cam_-_west") or {}
    check(am["added"] == ["805_floodlight_cam_-_west"] and ("805_floodlight_cam_-_west", kvs_source("805-floodlight-cam---west")) in G["puts"] and ("805_floodlight_cam_-_west_sd", restream_source("805_floodlight_cam_-_west")) in G["puts"],
          "PROVEN TO CATCH: the Floodlight Pro go2rtc skipped is added on Wyze's WebRTC road under its Wyze nickname, with its restreamed twin (%r)" % am)
    check(rm.get("road") == "kvs" and rm.get("uri") == "805-floodlight-cam---west" and rm.get("reason") == "not-in-go2rtc" and asked_m == ["805-floodlight-cam---west"], "and its record names the road and why it was added")
    G["src"].pop("805_floodlight_cam_-_west", None)
    G["puts"] = []
    asked_m[:] = []
    am2 = ensure_missing_cameras(kup, dict(st_m), bl, log=quiet, config_path=kv_cfg, roads_path=kv_roads, now=14100.0, signal=sig_m)
    check(am2["added"] == [] and G["puts"] == [] and asked_m == [], "a camera the family removed keeps its record and is never added back")
    bl2 = bl + [{"uri": "x-cam", "mac": norm_mac("AA:BB:CC:00:00:06"), "nickname": "X"}, {"uri": "y-cam", "mac": norm_mac("AA:BB:CC:00:00:07"), "nickname": "Y"}, {"uri": "z-cam", "mac": norm_mac("AA:BB:CC:00:00:08"), "nickname": "Z"}]
    am3 = ensure_missing_cameras(kup, dict(st_m), bl2, log=quiet, config_path=kv_cfg, roads_path=kv_roads, now=14200.0, signal=sig_m)
    check(len(asked_m) == 2 and am3["added"] == [] and set(am3["refused"]) == {"x-cam", "y-cam"} and am3["refused"]["x-cam"] == "Camera does not support WebRTC", "the budget: two cameras a pass, and Wyze's refusal kept in its own words (%r)" % am3)
    asked_m[:] = []
    am4 = ensure_missing_cameras(kup, dict(st_m), bl2, log=quiet, config_path=kv_cfg, roads_path=kv_roads, now=14300.0, signal=sig_m)
    check(asked_m == ["z-cam"] and "x-cam" in am4["refused"], "a refused camera is not asked again within the hour; the next one is (%r)" % asked_m)
    saved_add = ADD_MISSING_ON
    ADD_MISSING_ON = False
    asked_m[:] = []
    check(ensure_missing_cameras(kup, dict(st_m), bl2, log=quiet, config_path=kv_cfg, roads_path=kv_roads, now=99999.0, signal=sig_m) == {"added": [], "refused": {}} and asked_m == [], "the stop-path: CAMS_ADD_MISSING=0 adds nothing and asks nothing")
    ADD_MISSING_ON = saved_add
    ADD_TRIED.clear()
    BRIDGE_ENV, BRIDGE_API = saved_env, saved_api
    fkb.shutdown(); fgk.shutdown()

    print("=== 8m. any camera from the app, tested on the spot (DR-0805): add, probe, remove; Ring signs in through go2rtc ===")
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

    print("=== 8t. a frame of a held Kinesis camera is asked of go2rtc only while its session carries video (DR-1097, seventh read) ===")
    c7 = [5000.0]
    s7 = []
    r7 = []
    p7 = []

    class VidResp:
        """A live MP4 from go2rtc: these chunks, then silence ("hang") or the end."""

        def __init__(self, chunks, then="end"):
            self.chunks = list(chunks)
            self.then = then

        def read1(self, _size):
            if self.chunks:
                c7[0] += 1.0
                return b"v" * self.chunks.pop(0)
            if self.then == "hang":
                c7[0] += 20.0
                raise socket.timeout("timed out")
            c7[0] += 1.0
            return b""

        def close(self):
            pass

    def vopen(url, timeout=None):
        if not s7:
            raise urllib.error.URLError("refused")
        return s7.pop(0)

    def hold7():
        return KvsHold(clock=lambda: c7[0], opener=vopen, rearm=lambda up, s_, cp: (r7.append(s_), True)[1],
                       spawn=lambda fn, name: p7.append(fn), sleep=lambda w: c7.__setitem__(0, c7[0] + w),
                       log=quiet, max_holds=4, hold=60, life=600, dial=20, gap=30, redial=5, held_min=16384, fresh=3)
    h7 = hold7()
    h7.touch(kup, "front_cam")
    s7[:] = [VidResp([900], then="hang"), VidResp([16384] * 70)]
    p7.pop(0)()
    check(r7 == ["front_cam"] and h7.counts["rearmed"] == 1 and not s7,
          "PROVEN TO CATCH: a session that connected and then carried 900 bytes and no video (front_cam, 13 frozen consumers live) is unanswered and re-armed, not counted as held (%r)" % r7)
    r7[:] = []
    h7.touch(kup, "front_door_view")
    s7[:] = [VidResp([16384] * 70)]
    p7.pop(0)()
    check(r7 == [], "a dial that carries a key frame's worth of video is held, never re-armed")
    h8 = hold7()
    h8.touch(kup, "cam_v")
    p7[:] = []
    with h8.lock:
        h8.holds["cam_v"].update(dial_bytes=900, last_bytes=c7[0])
    check(h8.flowing("cam_v") is False, "an MP4 header's worth of bytes is not video")
    with h8.lock:
        h8.holds["cam_v"].update(dial_bytes=20000, last_bytes=c7[0])
    check(h8.flowing("cam_v") is True, "16 KB of this dial, the last byte just now, is video")
    c7[0] += 4.0
    check(h8.flowing("cam_v") is False, "video that stopped 4 s ago is no longer flowing")
    t0_ = c7[0]
    check(h8.wait_flowing("cam_v", 2.0) == 0.0 and c7[0] >= t0_ + 2.0, "a frame waits at most its own clock for video, then gives up")
    t0_ = c7[0]
    check(h8.wait_flowing("nobody", 20.0) == 0.0 and c7[0] == t0_, "a camera nobody holds is not waited on")
    with h8.lock:
        h8.holds["cam_v"].update(dial_bytes=20000, last_bytes=c7[0])
    check(h8.wait_flowing("cam_v", 20.0) > 0, "a camera carrying video answers at once with the time that is left")

    class StubHold:
        def __init__(self, flow):
            self.flow = flow

        def touch(self, up, sid, config_path=None):
            return "held"

        def holding(self, sid):
            return True

        def wait_flowing(self, sid, seconds):
            return 15.0 if self.flow else 0.0
    saved_hold, saved_roads7 = KVS_HOLD, BRIDGE_ROADS_FILE
    roads7 = os.path.join(rec_tmp, "roads-8t.json")
    roads_save({"front_yard": {"road": "kvs"}}, roads7)
    BRIDGE_ROADS_FILE = roads7
    frames = lambda: sum(1 for q in seen["queries"] if q.startswith("/api/frame.jpeg?src=front_yard"))  # noqa: E731
    breaker_note("front_yard", True)
    try:
        KVS_HOLD = StubHold(False)
        n0 = frames()
        s, _h, d = call("GET", "/snap/front_yard.jpg", auth=B)
        check(s == 504 and b"go2rtc was not asked" in d and frames() == n0,
              "PROVEN TO CATCH: a frame of a Kinesis camera whose held session carries no video is a 504, and go2rtc's frame.jpeg (which never lets go of such a request) is not asked (%d %r)" % (s, d[:120]))
        KVS_HOLD = StubHold(True)
        s, _h, d = call("GET", "/snap/front_yard.jpg", auth=B)
        check(s == 200 and d.startswith(b"\xff\xd8JPEG-front_yard") and frames() == n0 + 1, "once it carries video the frame is asked of go2rtc and served (%d %r, %d asks)" % (s, d[:60], frames() - n0))
        # DR-1097 thirteenth read: a Kinesis camera Wyze calls offline is never offered.
        touched = []
        KVS_HOLD = StubHold(True)
        KVS_HOLD.touch = lambda up, sid, config_path=None: touched.append(sid) or "held"
        cloud_rl["offline"] = {"FY1"}
        n1 = frames()
        s, _h, d = call("GET", "/snap/front_yard.jpg", auth=B)
        check(s == 503 and b"wyze-offline" in d and frames() == n1 and touched == [],
              "PROVEN TO CATCH: a frame of a Kinesis camera Wyze's own list calls offline is 503 wyze-offline: no held session, no go2rtc ask, so no offer go2rtc would leave open (%d %r)" % (s, d[:100]))
        lives = lambda: sum(1 for q in seen["queries"] if q.startswith("/api/stream.mp4?src=front_yard"))  # noqa: E731
        l0 = lives()
        s, _h, tk = call("POST", "/ticket", b'{"camera":"front_yard"}', auth=B)
        tkv = json.loads(tk.decode("utf-8")).get("ticket", "") if s == 200 else ""
        s, _h, d = call("GET", "/live/front_yard.mp4?t=" + urllib.parse.quote(tkv))
        check(s == 503 and b"wyze-offline" in d and lives() == l0 and touched == [],
              "PROVEN TO CATCH: a LIVE view of a Kinesis camera Wyze calls offline is 503 wyze-offline too, no session held and go2rtc never asked to dial (19:35 CDT: the tab's live tiles kept offering 805 Apt 4) (%d %r)" % (s, d[:80]))
        s, _h, d = call("GET", "/live/front_yard/index.m3u8?t=" + urllib.parse.quote(tkv))
        check(s == 503 and b"wyze-offline" in d, "...and its HLS playlist the same (%d)" % s)
        cloud_rl["offline"] = set()
        s, _h, d = call("GET", "/snap/front_yard.jpg", auth=B)
        check(s == 200 and touched == ["front_yard"], "back online in Wyze's list, the same camera is held and served again (%d)" % s)
        cloud_rl["offline"] = set()
        s, _h, tk = call("POST", "/ticket", b'{"camera":"front_yard_sd"}', auth=B)
        tsd = json.loads(tk.decode("utf-8")).get("ticket", "") if s == 200 else ""
        sd_asks = lambda: sum(1 for q in seen["queries"] if q.startswith("/api/stream.mp4?src=front_yard_sd"))  # noqa: E731
        KVS_HOLD = StubHold(False)
        a0 = sd_asks()
        s, _h, d = call("GET", "/live/front_yard_sd.mp4?t=" + urllib.parse.quote(tsd))
        check(s == 504 and b"the twin was not asked" in d and sd_asks() == a0,
              "PROVEN TO CATCH: a grid tile's SD twin of a Kinesis camera not yet carrying video is a 504, and go2rtc (whose RTSP restream gives the dial 5 s) is not asked (%d %r)" % (s, d[:90]))
        KVS_HOLD = StubHold(True)
        s, _h, d = call("GET", "/live/front_yard_sd.mp4?t=" + urllib.parse.quote(tsd))
        check(s == 200 and sd_asks() == a0 + 1, "once the camera's held session carries video, the twin is asked and served (%d, %d asks)" % (s, sd_asks() - a0))
        # THE DIRECT ROAD (DR-1097, sixteenth read): the viewer's browser is handed one
        # Wyze WebRTC session's signaling; the Wyze account never leaves the NAS.
        saved_direct = kvs_direct_session
        asked_direct = []
        kvs_direct_session = lambda uri, **kw: (asked_direct.append(uri), (200, {"signaling_url": "wss://v-1.kinesisvideo.us-west-2.amazonaws.com/?X-Amz-Signature=s", "ice_servers": [], "client_id": "c1"}))[1]  # noqa: E731
        try:
            DIRECT_LAST.clear()
            s, _h, d = call("POST", "/direct", b'{"camera":"front_yard"}', auth=B)
            check(s == 404 and b"no-direct" in d and asked_direct == [], "a Kinesis camera whose bridge name the NAS does not know is 404 no-direct: the tile keeps the NAS road (%d %r)" % (s, d[:90]))
            roads_save({"front_yard": {"road": "kvs", "uri": "front-yard-sub"}}, roads7)
            s, _h, d = call("POST", "/direct", b'{"camera":"front_yard"}', auth=B)
            j = json.loads(d.decode("utf-8")) if s == 200 else {}
            check(s == 200 and asked_direct == ["front-yard"] and j.get("camera") == "front_yard" and j.get("signaling_url", "").startswith("wss://") and j.get("client_id") == "c1",
                  "PROVEN TO CATCH: POST /direct for a Kinesis camera hands the viewer one session's signaling, asked of the bridge by the camera's MAIN name (%d %r %r)" % (s, asked_direct, d[:80]))
            s, _h, d = call("POST", "/direct", b'{"camera":"front_yard"}', auth=B)
            check(s == 429 and b"too-soon" in d and asked_direct == ["front-yard"], "a second ask for the same camera inside DIRECT_MIN_SECONDS is 429 too-soon and costs Wyze nothing (%d)" % s)
            DIRECT_LAST.clear()
            s, _h, d = call("POST", "/direct", b'{"camera":"front_yard"}')
            check(s == 401 and len(asked_direct) == 1, "no key, no session (%d)" % s)
            s, _h, d = call("POST", "/direct", b'{"camera":"garage"}', auth=B)
            check(s == 404 and b"not on Wyze" in d and len(asked_direct) == 1, "a camera not on Wyze's WebRTC road is 404 no-direct (%d %r)" % (s, d[:80]))
            cloud_rl["offline"] = {"FY1"}
            s, _h, d = call("POST", "/direct", b'{"camera":"front_yard"}', auth=B)
            check(s == 503 and b"wyze-offline" in d and len(asked_direct) == 1, "PROVEN TO CATCH: a camera Wyze calls offline gets no session: no Wyze call is spent on it (%d)" % s)
            cloud_rl["offline"] = set()
            DIRECT_ON = False
            s, _h, d = call("POST", "/direct", b'{"camera":"front_yard"}', auth=B)
            check(s == 404 and b"switched off" in d and len(asked_direct) == 1, "CAMS_DIRECT=0 is the stop-path: every camera keeps the NAS road (%d)" % s)
        finally:
            DIRECT_ON = True
            kvs_direct_session = saved_direct
            DIRECT_LAST.clear()
    finally:
        cloud_rl["offline"] = set()
        KVS_HOLD, BRIDGE_ROADS_FILE = saved_hold, saved_roads7
        breaker_note("front_yard", True)
    n_sc = sum(1 for q in seen["queries"] if q.startswith("/api/frame.jpeg?src=scale_cam"))
    s, _h, d = call("GET", "/snap/scale_cam.jpg?w=640", auth=B)
    asks_sc = [q for q in seen["queries"] if q.startswith("/api/frame.jpeg?src=scale_cam")][n_sc:]
    check(s == 200 and d.startswith(b"\xff\xd8JPEG-scale_cam-w0") and len(asks_sc) == 2 and "w=640" in asks_sc[0] and "w=" not in asks_sc[1],
          "PROVEN TO CATCH: a resize ffmpeg refuses (500 exit status 183, 805 Floodlight Cam - West) is asked once more at the camera's own size and served (%d, %r)" % (s, asks_sc))
    s, _h, d = call("GET", "/snap/dark_cam.jpg?w=640", auth=B)
    check(s == 500 and b"source not ready" in d, "any other 500 is go2rtc's own answer, passed on in its words, never retried")
    breaker_note("dark_cam", True)

    print("=== 8u. the sessions go2rtc 1.9.14 never closes are released, and fewer are made (DR-1097, thirteenth read) ===")
    import io as _io8u
    import shutil as _sh8u
    log_lines = "\n".join([
        json.dumps({"level": "error", "error": "streams: websocket: close 1001 (going away): Going away", "caller": "mp4.go:107", "time": 1000}),
        json.dumps({"level": "error", "error": "streams: webrtc: failed", "caller": "mp4.go:107", "time": 2000}),
        json.dumps({"level": "error", "error": "streams: read tcp 127.0.0.1:1->127.0.0.1:8555: i/o timeout", "time": 3000}),
        json.dumps({"level": "error", "error": "streams: websocket: close 1001 (going away): Going away", "time": 4000}),
        "not json",
    ])
    check(kvs_failed_dials(log_lines) == 3, "every failed Kinesis dial is counted (going away, webrtc: failed); the bridge's i/o timeout is not one")
    check(kvs_failed_dials(log_lines, since_ms=2000) == 1, "only the ones after the last release count")

    class RelOpener:
        def __init__(self, text, config_code=200):
            self.text, self.config_code, self.calls = text, config_code, []

        def __call__(self, req, timeout=None):
            url = req if isinstance(req, str) else req.full_url
            method = "GET" if isinstance(req, str) else req.get_method()
            self.calls.append((method, url.rsplit("/api/", 1)[-1]))
            if url.endswith("/api/config") and self.config_code != 200:
                raise urllib.error.HTTPError(url, self.config_code, "yaml: line 96", {}, _io8u.BytesIO(b"yaml: line 96"))
            return _io8u.BytesIO(self.text.encode("utf-8") if url.endswith("/api/log") else b"")
    rel_tmp = tempfile.mkdtemp(prefix="cams-release-")
    rel_cfg = os.path.join(rel_tmp, "go2rtc.yaml")
    with open(rel_cfg, "w") as fh:
        fh.write("streams:\n  front_yard: rtsp://x\n")
    stamp = os.path.join(rel_tmp, ".go2rtc.leak-release.at")
    rel = lambda op, **kw: release_leaked_sessions("http://g", config_path=rel_cfg, log=lambda *_a: None, opener=op, stamp_path=stamp, min_seconds=3600, **kw)  # noqa: E731
    op = RelOpener(log_lines)
    check(rel(op, now=10000.0, after=0, watched=lambda: False) == "off" and op.calls == [], "CAMS_GO2RTC_RELEASE_AFTER=0 is the stop-path: nothing is asked")
    check(rel(op, now=10000.0, after=4, watched=lambda: False) == "under-3" and ("POST", "restart") not in op.calls, "3 failed dials under a threshold of 4 -> no restart")
    op = RelOpener(log_lines)
    check(rel(op, now=10000.0, after=3, watched=lambda: True) == "watched" and ("POST", "restart") not in op.calls, "PROVEN TO CATCH: someone watching -> no restart, whatever the count (a viewer is never cut off)")
    op = RelOpener(log_lines, config_code=500)
    check(rel(op, now=10000.0, after=3, watched=lambda: False) == "config-refused" and ("POST", "restart") not in op.calls and not os.path.exists(stamp),
          "PROVEN TO CATCH: go2rtc cannot parse go2rtc.yaml -> no restart (a restart into an unreadable file starts empty, the eighth read)")
    op = RelOpener(log_lines)
    r = rel(op, now=10000.0, after=3, watched=lambda: False)
    check(r == "released-3" and op.calls[-2:] == [("POST", "config"), ("POST", "restart")] and _release_stamp_read(stamp) == 10000.0,
          "PROVEN TO CATCH: 3 failed dials at a threshold of 3, nobody watching, config parsed -> go2rtc restarted once and the release stamped (%s, %r)" % (r, op.calls))
    op = RelOpener(log_lines)
    check(rel(op, now=10000.0 + 1800, after=3, watched=lambda: False) == "too-soon" and op.calls == [], "a second release inside the budget window asks go2rtc nothing")
    os.remove(stamp)

    class CutShort(RelOpener):
        def __call__(self, req, timeout=None):
            if not isinstance(req, str) and req.full_url.endswith("/api/restart"):
                self.calls.append(("POST", "restart"))
                raise urllib.error.URLError("connection reset")
            return RelOpener.__call__(self, req, timeout)
    op = CutShort(log_lines)
    check(rel(op, now=10000.0, after=3, watched=lambda: False) == "restart-unconfirmed" and _release_stamp_read(stamp) == 10000.0,
          "PROVEN TO CATCH: a restart whose answer go2rtc cut short still spends the budget (stamped before the ask)")
    op = RelOpener(log_lines)
    check(rel(op, now=10000.0 + 600, after=3, watched=lambda: False) == "too-soon" and ("POST", "restart") not in op.calls, "...so the next tick ten minutes later does not restart go2rtc again")
    op = RelOpener(log_lines)
    check(rel(op, now=10000.0 + 3601, after=1, watched=lambda: False) == "under-0", "after the window, dials from before the release are not counted again (they were released)")
    _sh8u.rmtree(rel_tmp, ignore_errors=True)
    jt_host, jt_port = _bridge_api_netloc()
    jt_streams = {n: {"producers": [{"url": "webrtc:http://%s:%d/signaling/%s?kvs#format=wyze" % (jt_host, jt_port, n.replace("_", "-"))}]}
                  for n in ("off_cam", "on_cam")}

    class NoHealth:
        def last_bytes_at(self, sid):
            return None
    check(judge_candidates(jt_streams, {}, health=NoHealth(), now=1e9, offline={"off_cam"}) == ["on_cam"],
          "PROVEN TO CATCH: the road judge never dials a camera Wyze's own list calls offline (each such dial was an offer nobody could answer)")
    check(sorted(judge_candidates(jt_streams, {}, health=NoHealth(), now=1e9, offline=None)) == ["off_cam", "on_cam"], "with no Wyze list, nothing is skipped (unknown is not offline)")

    print("=== 8v. the direct road hands the browser only a session's signaling (DR-1097, sixteenth read) ===")
    import io as _io8v

    class SigOpener:
        def __init__(self, doc=None, code=200):
            self.doc, self.code, self.reqs = doc, code, []

        def __call__(self, req, timeout=None):
            self.reqs.append(req)
            if self.code != 200:
                raise urllib.error.HTTPError(req.full_url, self.code, "no", {}, _io8v.BytesIO(b""))
            return _io8v.BytesIO(json.dumps(self.doc).encode("utf-8"))
    sig_ok = {"result": "ok", "cam": "porch-east", "ClientId": "viewer-7", "signalingUrl": "wss://v-1a2b.kinesisvideo.us-east-1.amazonaws.com/?X-Amz-ChannelARN=x&X-Amz-Signature=sig",
              "servers": [{"urls": ["turn:1.2.3.4:443?transport=udp", "javascript:alert(1)"], "username": "u1", "credential": "c1"}, {"urls": "stun:stun.kinesisvideo.us-east-1.amazonaws.com:443"}, {"urls": ["http://x"]}, "junk"]}
    op = SigOpener(sig_ok)
    st_, body = kvs_direct_session("porch-east", api="http://127.0.0.1:8597", auth=("poetech", "pw"), opener=op)
    check(st_ == 200 and body["signaling_url"] == sig_ok["signalingUrl"] and body["client_id"] == "viewer-7"
          and body["ice_servers"] == [{"urls": ["turn:1.2.3.4:443?transport=udp"], "username": "u1", "credential": "c1"}, {"urls": ["stun:stun.kinesisvideo.us-east-1.amazonaws.com:443"]}]
          and op.reqs[0].full_url == "http://127.0.0.1:8597/signaling/porch-east?kvs" and set(body) == {"signaling_url", "ice_servers", "client_id"},
          "PROVEN TO CATCH: one session's Amazon wss URL, its stun:/turn: servers and its client id, nothing else (no other scheme, no bridge field) (%r)" % (body,))
    check("pw" not in json.dumps(body) and "poetech" not in json.dumps(body), "the bridge's own sign-in never rides the answer")
    bad = dict(sig_ok, signalingUrl="wss://evil.example.com/?X-Amz-Signature=sig")
    check(kvs_direct_session("porch-east", api="http://b", auth=("u", "p"), opener=SigOpener(bad))[1].get("error") == "bad-signaling",
          "PROVEN TO CATCH: a signaling address not on amazonaws.com is never handed to a browser")
    check(kvs_direct_session("porch-east", api="http://b", auth=("u", "p"), opener=SigOpener(dict(sig_ok, signalingUrl="https://v.kinesisvideo.us-east-1.amazonaws.com/")))[1].get("error") == "bad-signaling", "...nor one that is not wss://")
    st_, body = kvs_direct_session("porch-east", api="http://b", auth=("u", "p"), opener=SigOpener({"result": "cam not found"}))
    check(st_ == 502 and body["error"] == "wyze-refused" and "cam not found" in body["detail"], "Wyze's own refusal is passed on in its words (%r)" % (body,))
    check(kvs_direct_session("porch-east", api="http://b", auth=("u", "p"), opener=SigOpener(code=401)) == (502, {"error": "bridge-refused", "detail": "the bridge answered HTTP 401"}), "a bridge that refuses its sign-in is 502 bridge-refused")
    check(kvs_direct_session("porch-east", api="http://b", auth=("", ""), opener=SigOpener(sig_ok))[0] == 503, "no kept web sign-in -> 503, nothing asked")
    st_, body = kvs_direct_session("porch-east", api="http://b", auth=("u", "p"), opener=SigOpener(dict(sig_ok, servers=json.dumps(sig_ok["servers"][:2]))))
    check(st_ == 200 and len(body["ice_servers"]) == 2, "servers the bridge hands as a JSON string are read the same")

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

    # === 11. CORS: the cameras survive a dead /cams Pages Function ==========
    # 2026-10-09. Every Pages Function on poetech.us stopped being invoked and
    # the Cameras tab lost its transport. Measured before writing this: /cams
    # on the Funnel answered preflight 501 with allow-origin: none, so pointing
    # the app at the Funnel would have been refused by the browser itself.
    # These checks pin the fix and the bright line it must not cross.
    print("=== 11. CORS is answered, and only for the one origin ===")

    class _H:
        """The Handler's CORS logic, exercised without standing up a socket."""
        ALLOWED_ORIGINS = ("https://poetech.us",)

        def __init__(self, origin):
            self._origin = origin
            self.sent = []

        @property
        def headers(self):
            return {"Origin": self._origin} if self._origin else {}

        def _cors_origin(self):
            o = self.headers.get("Origin")
            return o if o in self.ALLOWED_ORIGINS else None

    check(_H("https://poetech.us")._cors_origin() == "https://poetech.us",
          "the app's own origin is allowed")
    check(_H(None)._cors_origin() is None,
          "a request with no Origin gets no CORS header (same-origin path unchanged)")
    # PROVEN-TO-CATCH: the bright line. These are house cameras on a bearer.
    check(_H("https://evil.example")._cors_origin() is None,
          "CATCHES a stranger's origin: it is refused, not echoed")
    check(_H("*")._cors_origin() is None,
          "CATCHES a wildcard origin: never allowed for house cameras")
    check(_H("https://poetech.us.evil.example")._cors_origin() is None,
          "CATCHES a lookalike origin that merely starts with ours")
    check(_H("http://poetech.us")._cors_origin() is None,
          "CATCHES plain http: only the https origin is allowed")
    # The real Handler must carry the same allowlist this test pins, or the
    # test is checking a copy that has drifted from the code that runs.
    check("*" not in CORS_ALLOWED_ORIGINS,
          "the LIVE allowlist the Handler is built from contains no wildcard")
    check(tuple(CORS_ALLOWED_ORIGINS) == _H.ALLOWED_ORIGINS,
          "the LIVE allowlist is exactly what these checks pin")
    check(len(CORS_ALLOWED_ORIGINS) == 1 and CORS_ALLOWED_ORIGINS[0].startswith("https://"),
          "exactly one origin, and it is https")

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


def yaml_unquote(v):
    """The value of one go2rtc.yaml scalar as yaml_quote (or go2rtc) wrote it."""
    v = str(v or "").strip()
    if len(v) >= 2 and v[0] == '"' and v[-1] == '"':
        return re.sub(r'\\(.)', lambda m: {"n": "\n", "t": "\t"}.get(m.group(1), m.group(1)), v[1:-1])
    if len(v) >= 2 and v[0] == "'" and v[-1] == "'":
        return v[1:-1].replace("''", "'")
    return re.sub(r"\s+#.*$", "", v)


def config_stream_sources(text):
    """{name: [source, ...]} for every stream go2rtc.yaml DEFINES, read by shape
    the way config_stream_names reads it (no yaml library on the box): a
    `  name: value` line, or a `  name:` line with `    - value` items under it."""
    out = {}
    inside = False
    cur = None
    for line in str(text or "").split("\n"):
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        if not line[0].isspace():
            inside = line.startswith("streams:")
            cur = None
            continue
        if not inside:
            continue
        m = re.match(r"^\s{1,3}(\"[^\"]+\"|'[^']+'|[^\s#\"'][^:]*?):(?:\s+(.*))?$", line)
        if m and not line.lstrip().startswith("- "):
            cur = m.group(1).strip("\"'")
            v = (m.group(2) or "").strip()
            out[cur] = [yaml_unquote(v)] if v and v != "{}" else []
            continue
        m = re.match(r"^\s+-\s+(.*)$", line)
        if m and cur is not None:
            out[cur].append(yaml_unquote(m.group(1)))
    return dict((k, [x for x in v if x]) for k, v in out.items() if any(v))


def config_stray_lines(text):
    """The line numbers of go2rtc.yaml lines no YAML block mapping can hold: a
    line at column 0 that is not a key, a comment, blank or a document marker,
    AND every indented line after one, up to the next top-level key.

    The second half is the fifteenth read (cams-diag 39522679592, 2026-10-21):
    the file's tail after the wyze: block held three column-0 fragments with
    two indented lines between them, and go2rtc named those two as "mapping
    key ... already defined" once the fragments were out. They are the end of
    an older, longer copy of the same block, left behind after it; an indented
    line after a stray belongs to no key a parser can reach, so it goes with
    the stray. go2rtc's own parse still decides before anything is written."""
    out = []
    after_stray = False
    for k, line in enumerate(str(text or "").split("\n"), 1):
        if not line.strip():
            continue
        if line[0].isspace():
            if after_stray:
                out.append(k)
            continue
        if re.match(r"^(#|---|\.\.\.)", line) or re.match(r"^(\"[^\"]*\"|'[^']*'|[^\s:#'\"-][^:]*):(\s|$)", line):
            after_stray = False
            continue
        out.append(k)
        after_stray = True
    return out


def repair_config_strays(upstream, config_path=None, log=print, opener=None):
    """GO2RTC.YAML IS MADE READABLE AGAIN, AND GO2RTC ITSELF PROVES IT (DR-1097,
    ninth read). cams-diag 39203389412: line 96, the file's last, was one
    character at column 0 after the wyze: block, the line go2rtc named ("could
    not find expected ':'"). A line at column 0 that is not a key can never sit
    in a block mapping, so taking it out loses nothing a parser could read. The
    result is handed to go2rtc's own POST /api/config, which parses it with
    go2rtc's yaml and writes it ONLY if it parses (internal/api/config.go); a
    refusal leaves the file exactly as it was and says why. Answers 'clean',
    'repaired-N', 'refused' or 'unreadable'."""
    opener = opener or urllib.request.urlopen
    path = config_path or GO2RTC_YAML_PATH
    try:
        with open(path, "r", encoding="utf-8") as fh:
            text = fh.read()
    except OSError:
        return "unreadable"
    stray = config_stray_lines(text)
    if not stray:
        return "clean"
    drop = set(stray)
    fixed = "\n".join(l for k, l in enumerate(text.split("\n"), 1) if k not in drop)
    req = urllib.request.Request(upstream.rstrip("/") + "/api/config", data=fixed.encode("utf-8"), method="POST",
                                 headers={"Content-Type": "application/yaml"})
    try:
        with opener(req, timeout=HEALTH_TIMEOUT) as r:
            r.read(4096)
    except urllib.error.HTTPError as e:
        try:
            why = scrub_text(e.read(300).decode("utf-8", "replace").strip(), 160)
        except Exception:  # noqa: BLE001
            why = ""
        log("config-repair: go2rtc would not take go2rtc.yaml without line(s) %s (HTTP %d%s); the file is left as it was" % (",".join(str(k) for k in stray), e.code, ": " + why if why else ""))
        return "refused"
    except (urllib.error.URLError, OSError):
        return "unreadable"
    log("config-repair: line(s) %s of go2rtc.yaml held nothing YAML can read; taken out, and go2rtc parsed the result before writing it (DR-1097, ninth read)" % ",".join(str(k) for k in stray))
    return "repaired-%d" % len(stray)


def restore_streams_from_config(upstream, config_path=None, log=print, opener=None):
    """A GO2RTC THAT STARTED WITHOUT ITS CONFIG GETS ITS STREAMS BACK FROM IT
    (DR-1097, eighth read). 2026-10-19 23:02 CDT: the one go2rtc release came back
    with zero streams because go2rtc.yaml would not parse ("yaml: line 96: could
    not find expected ':'"), so go2rtc ran on its defaults; the same file is why
    every PUT had answered 400 for hours (streams.New took the stream, then
    app.PatchConfig failed). PUT puts a stream in memory before it writes the
    file, so each stream the file defines is PUT with its own sources; a 400 is
    expected and the stream is still live. Answers how many go2rtc lists after."""
    opener = opener or urllib.request.urlopen
    base = upstream.rstrip("/")
    try:
        with open(config_path or GO2RTC_YAML_PATH, "r", encoding="utf-8") as fh:
            sources = config_stream_sources(fh.read())
    except OSError:
        return 0
    for name, srcs in sorted(sources.items()):
        q = urllib.parse.urlencode([("name", name)] + [("src", x) for x in srcs])
        try:
            with opener(urllib.request.Request(base + "/api/streams?" + q, method="PUT"), timeout=HEALTH_TIMEOUT) as r:
                r.read(4096)
        except urllib.error.HTTPError:
            pass  # app.PatchConfig refused the file; the stream is in memory all the same
        except (urllib.error.URLError, OSError):
            return 0
    try:
        with opener(base + "/api/streams", timeout=HEALTH_TIMEOUT) as r:
            parsed = json.loads(r.read(4 * 1024 * 1024).decode("utf-8"))
    except (urllib.error.URLError, OSError, ValueError):
        return 0
    n = len(parsed) if isinstance(parsed, dict) else 0
    log("self-heal: go2rtc listed no streams while go2rtc.yaml defines %d; put them back from the file, go2rtc lists %d now (DR-1097, eighth read)" % (len(sources), n))
    return n


# THE SESSIONS GO2RTC 1.9.14 NEVER CLOSES (DR-1097, thirteenth read). Read in
# go2rtc's own source (internal/webrtc/kinesis.go, v1.9.14 and master alike):
# kinesisClient makes a PeerConnection, sends the offer, and on any error --
# Amazon closing the unanswered signaling socket ("close 1001 (going away)"),
# or "webrtc: failed" -- returns without pc.Close(). go2rtcClient beside it
# closes its pc on error; this one does not. Each such dial leaves a pion
# PeerConnection whose TURN clients refresh with Amazon until the process ends:
# cams-diag 39445926381 counted 524 TURN refresh failures in 10 minutes across
# 264 permission ids. Only a new go2rtc process lets go of them.
# So the forwarder RELEASES go2rtc (POST /api/restart, which re-executes it in
# place and reloads go2rtc.yaml) once enough failed Kinesis dials have piled up
# since the last release, and only when that is safe:
#   - nobody is watching live and no Kinesis session is held (a viewer is never cut off);
#   - go2rtc itself parses go2rtc.yaml first (POST /api/config answers 200), the
#     eighth read's lesson: a restart into an unreadable file starts empty;
#   - at most once per RELEASE_MIN_SECONDS (budget), inside the self-heal
#     thread and RELEASE_LOCK (one at a time).
# A recording drops a few seconds; the recorder reconnects with its own backoff.
# Stop-path: CAMS_GO2RTC_RELEASE_AFTER=0. The count is a reading of go2rtc's own
# in-memory log (1 MB, so it can undercount, never overcount past what it holds).
RELEASE_AFTER = max(0, int(os.environ.get("CAMS_GO2RTC_RELEASE_AFTER", "200")))
RELEASE_MIN_SECONDS = float(os.environ.get("CAMS_GO2RTC_RELEASE_MIN_SECONDS", str(6 * 3600)))
RELEASE_STAMP = os.path.join(os.environ.get("GO2RTC_DATA", "/volume1/docker/go2rtc"), ".go2rtc.leak-release.at")
RELEASE_MARKS = ("close 1001 (going away)", "webrtc: failed")
RELEASE_LOCK = threading.Lock()
RELEASE_LAST = {}


def kvs_failed_dials(log_text, since_ms=0):
    """go2rtc's /api/log (jsonlines) -> how many Kinesis dials failed after `since_ms`.
    Each one left a PeerConnection go2rtc 1.9.14 never closes."""
    n = 0
    for line in (log_text or "").splitlines():
        try:
            j = json.loads(line)
        except ValueError:
            continue
        if not isinstance(j, dict):
            continue
        err = str(j.get("error") or "")
        if not any(m in err for m in RELEASE_MARKS):
            continue
        t = j.get("time")
        if isinstance(t, (int, float)) and t <= since_ms:
            continue
        n += 1
    return n


def _release_stamp_read(path):
    try:
        with open(path, "r", encoding="utf-8") as fh:
            return float(fh.read().strip() or 0)
    except (OSError, ValueError):
        return 0.0


def release_leaked_sessions(upstream, config_path=None, log=print, opener=None, now=None, stamp_path=None,
                            after=None, min_seconds=None, watched=None):
    """Release go2rtc when failed Kinesis dials have piled up (see above). Answers
    'off', 'busy', 'too-soon', 'unreadable', 'under-N', 'watched',
    'config-refused', 'no-stamp', 'restart-unconfirmed' or 'released-N'."""
    opener = opener or urllib.request.urlopen
    now = time.time() if now is None else now
    after = RELEASE_AFTER if after is None else int(after)
    min_seconds = RELEASE_MIN_SECONDS if min_seconds is None else float(min_seconds)
    stamp_path = stamp_path or RELEASE_STAMP
    watched = watched or (lambda: live_snapshot()["live_open"] > 0 or bool(KVS_HOLD.snapshot().get("holding")))
    if after <= 0:
        return "off"
    if not RELEASE_LOCK.acquire(blocking=False):
        return "busy"
    try:
        last = _release_stamp_read(stamp_path)
        RELEASE_LAST.update({"checked_at": now, "last_release": last or None})
        if last and now - last < min_seconds:
            return "too-soon"
        try:
            with opener(upstream.rstrip("/") + "/api/log", timeout=HEALTH_TIMEOUT) as r:
                text = r.read(2 * 1024 * 1024).decode("utf-8", "replace")
        except (urllib.error.URLError, OSError, ValueError):
            return "unreadable"
        failed = kvs_failed_dials(text, since_ms=last * 1000.0)
        RELEASE_LAST["failed_dials"] = failed
        if failed < after:
            return "under-%d" % failed
        if watched():
            return "watched"
        path = config_path or GO2RTC_YAML_PATH
        try:
            with open(path, "rb") as fh:
                body = fh.read()
            req = urllib.request.Request(upstream.rstrip("/") + "/api/config", data=body, method="POST",
                                         headers={"Content-Type": "application/yaml"})
            with opener(req, timeout=HEALTH_TIMEOUT) as r:
                r.read(4096)
        except (urllib.error.URLError, OSError, ValueError):
            log("go2rtc-release: %d failed Kinesis dials are held, but go2rtc would not parse go2rtc.yaml; no restart" % failed)
            return "config-refused"
        # Stamped BEFORE the ask: go2rtc re-executes itself from a goroutine and can
        # cut its own reply short, which must still count against the budget.
        try:
            with open(stamp_path, "w", encoding="utf-8") as fh:
                fh.write("%d\n" % int(now))
        except OSError:
            return "no-stamp"  # no budget can be kept, so no restart is made
        RELEASE_LAST.update({"last_release": now, "released_dials": failed})
        try:
            req = urllib.request.Request(upstream.rstrip("/") + "/api/restart", data=b"", method="POST")
            with opener(req, timeout=HEALTH_TIMEOUT) as r:
                r.read(4096)
        except (urllib.error.URLError, OSError, ValueError):
            log("go2rtc-release: %d failed Kinesis dials; the restart was asked and its answer cut short (go2rtc re-executes itself); the next try waits out the budget" % failed)
            return "restart-unconfirmed"
        log("go2rtc-release: %d failed Kinesis dials since the last release each left a PeerConnection go2rtc 1.9.14 never closes; go2rtc restarted to let them go (its streams come back from go2rtc.yaml)" % failed)
        return "released-%d" % failed
    finally:
        RELEASE_LOCK.release()


def self_heal_once(upstream, port, token, log=print, config_path=None):
    """If go2rtc lists ZERO streams and a Wyze sign-in is kept, re-add the
    cameras through this process's own /setup/wyze/again. If it lists streams
    its config does not define, write them (DR-0787). Returns what it did."""
    # A file go2rtc cannot read refuses every PUT's write and empties the next start.
    repair_config_strays(upstream, config_path=config_path, log=log)
    try:
        with urllib.request.urlopen(upstream.rstrip("/") + "/api/streams", timeout=HEALTH_TIMEOUT) as r:
            parsed = json.loads(r.read(4 * 1024 * 1024).decode("utf-8"))
    except (urllib.error.URLError, OSError, ValueError):
        return "go2rtc-unreachable"
    if isinstance(parsed, dict) and len(parsed) > 0:
        wrote = persist_missing_streams(upstream, parsed, log=log)
        return wrote if wrote.startswith("wrote-") else "has-streams"
    # The file first: it holds every road the judge chose, which a fresh Wyze listing does not.
    if restore_streams_from_config(upstream, config_path=config_path, log=log) > 0:
        return "restored-from-config"
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
            try:
                release_leaked_sessions(upstream)
            except Exception as e:  # noqa: BLE001
                print("go2rtc-release: %s" % e, file=sys.stderr)
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
    ap.add_argument("--bridge-env", action="store_true", help="derive the Wyze bridge's env file from the kept sign-in (DR-0809); prints written|unchanged|no-wyze-env|error")
    ap.add_argument("--bridge-probe", action="store_true", help="ask the running bridge for its camera listing (never a credential); prints a count or the failure")
    args = ap.parse_args()
    if args.selftest:
        return _selftest()
    if args.bridge_env:
        print("bridge-env: %s (%s)" % (bridge_env_sync(), BRIDGE_ENV))
        return 0
    if args.bridge_probe:
        cams = bridge_cameras()
        if cams is None:
            print("bridge: no answer from %s (not up yet, or its API key differs from %s)" % (BRIDGE_API, BRIDGE_ENV))
            return 1
        print("bridge: %d cameras known, %d connected now; roads: %s" % (len(cams), sum(1 for c in cams if c["connected"]), json.dumps(roads_public(roads_load()))))
        return 0
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
