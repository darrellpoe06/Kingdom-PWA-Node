#!/usr/bin/env python3
# =============================================================================
# immich_forwarder -- the locked door in front of Immich (DR-1120)
# =============================================================================
# Darrell 2026-10-19, with the home-server video: "Fix our processes and create
# a way." and then "Bring Immich home by the Way now." Immich does the one job
# in that video the household actually pays for: the phones back up every new
# photo and video, in the background, to a server. Google One (2 TB) does that
# today; Immich does it onto our own pool, and the files stay ours as plain
# folders if Immich is ever removed. This is its door.
#
# WHAT PASSES, AND WHAT DOES NOT. Immich has its own login, so unlike Vane it
# may be reached -- but only its API, only with the family key, and only on
# the one path the phones and the app use. Immich itself listens on loopback
# (127.0.0.1:2283). This forwarder serves:
#   GET  /health, /photo-backup/health  -> 200 only when Immich answers on
#        loopback AND the library folder is on the pool AND the pool has room;
#        503 with the reason in words otherwise. Open (says nothing to guard).
#   ANY  /api/..., /photo-backup/api/... -> X-Family-Key: <family token>.
#        Passed to Immich byte for byte, body streamed both ways, the key
#        header stripped. Immich's own login still stands behind it.
#   everything else (Immich's web pages, /_app, /photos, ...) -> 404.
# (The Funnel mount /photo-backup is STRIPPED by tailscale, so the bare paths
# arrive; the prefixed spellings are served too, for a proxy that does not.)
#
# WHY A HEADER AND NOT A BEARER. Immich uses Authorization itself for its own
# sessions, so the family key cannot ride there. The Immich app carries custom
# proxy headers (Settings > Advanced > Custom proxy headers, read in the source
# at mobile/lib/domain/models/config/network_config.dart), which is exactly a
# header the forwarder can check and remove.
#
# Brakes (request-driven, not the timer class; a public door still has bounds):
#   * MAX_INFLIGHT requests at once; the next gets 503, never a queue.
#   * MAX_BODY_BYTES per request; a body with no length (chunked) is 411.
#   * UPSTREAM_TIMEOUT seconds per request; a hung Immich hangs nobody.
#   * POOL_FLOOR_GB: uploads are refused while the pool has less free than
#     this, so a phone can never fill the disk the NAS's other services need.
#
# Run:
#   python3 immich_forwarder.py --port 8801
#   python3 immich_forwarder.py --selftest    # offline, stdlib, no Immich needed
# Installed + kept running by infra/nas-immich/install.sh via services-sync.
# =============================================================================
import argparse
import hashlib
import hmac
import http.client
import json
import os
import shutil
import socket
import sys
import threading
import urllib.error
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

TOKEN_FILE_DEFAULT = "/volume1/PoeTech/secrets/chat-bridge-token.txt"
UPSTREAM_DEFAULT = "http://127.0.0.1:2283"
LIBRARY_DEFAULT = "/volume1/PoeTech/immich"
# NEVER "*": this road carries a key. One origin is echoed, anything else
# gets nothing (the voice-lite rule, measured on the Funnel 2026-10-09).
CORS_ALLOWED_ORIGINS = ("https://poetech.us",)

KEY_HEADER = "X-Family-Key"
MAX_INFLIGHT = 6
MAX_BODY_BYTES = 4 * 1024 * 1024 * 1024  # the media-backup lane's own cap (photo_server.py)
UPSTREAM_TIMEOUT = 600
HEALTH_TIMEOUT = 6
POOL_FLOOR_GB = 50

HEALTH_PATHS = {"/health", "/photo-backup/health"}
API_PREFIXES = ("/api/", "/photo-backup/api/")
STRIP_PREFIX = "/photo-backup"

# Hop-by-hop headers never cross a proxy (RFC 7230 6.1), plus the key itself.
HOP_BY_HOP = {"connection", "keep-alive", "proxy-authenticate", "proxy-authorization", "te",
              "trailer", "transfer-encoding", "upgrade", "host", KEY_HEADER.lower()}


def code_sha():
    try:
        with open(os.path.abspath(__file__), "rb") as fh:
            return hashlib.sha256(fh.read()).hexdigest()[:16]
    except OSError:
        return "unknown"


def expected_token(token_file=None):
    if os.environ.get("PHOTO_BACKUP_TOKEN"):
        return os.environ["PHOTO_BACKUP_TOKEN"].strip()
    try:
        with open(token_file or TOKEN_FILE_DEFAULT, "r", encoding="utf-8") as fh:
            return fh.read().strip()
    except OSError:
        return ""


def key_ok(header_value, expected):
    if not expected or not header_value:
        return False
    return hmac.compare_digest(header_value.strip(), expected)


def api_path(path):
    """The path to hand Immich for an API request, or None when it is not one."""
    for p in API_PREFIXES:
        if path.startswith(p):
            return path[len(STRIP_PREFIX):] if path.startswith(STRIP_PREFIX + "/") else path
    return None


class Immich:
    """The upstream, on loopback. Every call has a ceiling."""

    def __init__(self, base):
        self.base = base.rstrip("/")
        u = urllib.parse.urlparse(self.base)
        self.host = u.hostname or "127.0.0.1"
        self.port = u.port or 80

    def _get(self, path, timeout):
        with urllib.request.urlopen(self.base + path, timeout=timeout) as r:
            return json.loads(r.read().decode("utf-8"))

    def ping(self):
        return self._get("/api/server/ping", HEALTH_TIMEOUT)

    def version(self):
        return self._get("/api/server/version", HEALTH_TIMEOUT)


class Library:
    """The folder the photos land in, and whether the pool has room for more."""

    def __init__(self, path=None, floor_gb=POOL_FLOOR_GB, usage=None):
        self.path = path or os.environ.get("PHOTO_BACKUP_LIBRARY", LIBRARY_DEFAULT)
        self.floor_gb = floor_gb
        self.usage = usage or shutil.disk_usage  # the selftest injects a small pool

    def free_gb(self):
        return round(self.usage(self.path).free / (1024 ** 3), 1)

    def state(self):
        """(True, free_gb) when uploads may land, else (False, the reason in plain words)."""
        if not os.path.isdir(self.path):
            return False, f"The photo library folder is missing on the NAS pool ({self.path}); the installer makes it on its next cycle."
        try:
            free = self.free_gb()
        except OSError as e:
            return False, f"The pool under the photo library cannot be measured: {e}"
        if free < self.floor_gb:
            return False, f"The pool has {free:g} GB free; backups pause under {self.floor_gb} GB so the NAS's other services are never starved."
        return True, free


def health(immich, library):
    ok, why = library.state()
    if not ok:
        return 503, {"ok": False, "reason": why, "code": code_sha()}
    try:
        pong = immich.ping()
        ver = immich.version()
    except (urllib.error.URLError, socket.timeout, OSError, ValueError) as e:
        return 503, {"ok": False, "reason": f"Immich is not answering on loopback: {e}", "code": code_sha()}
    if (pong or {}).get("res") != "pong":
        return 503, {"ok": False, "reason": "Immich answered its ping with something other than pong", "code": code_sha()}
    version = ".".join(str((ver or {}).get(k, "?")) for k in ("major", "minor", "patch"))
    return 200, {"ok": True, "version": version, "free_gb": why, "library": library.path, "code": code_sha()}


class _Limited:
    """A file-like over the request body that stops at Content-Length."""

    def __init__(self, raw, length):
        self.raw, self.left = raw, length

    def read(self, n=65536):
        if self.left <= 0:
            return b""
        chunk = self.raw.read(min(n, self.left))
        self.left -= len(chunk)
        return chunk


def make_handler(immich, token, library, upstream_timeout=UPSTREAM_TIMEOUT, max_body=MAX_BODY_BYTES):
    inflight = threading.BoundedSemaphore(MAX_INFLIGHT)

    class Handler(BaseHTTPRequestHandler):
        server_version = "poetech-photo-backup"
        ALLOWED_ORIGINS = CORS_ALLOWED_ORIGINS

        def log_message(self, fmt, *args):  # a phone's photos are the family's business
            sys.stderr.write("photo-backup: %s %s\n" % (self.command, self.path.split("?")[0]))

        def _cors_origin(self):
            o = self.headers.get("Origin")
            return o if o in self.ALLOWED_ORIGINS else None

        def end_headers(self):
            o = self._cors_origin()
            if o:
                self.send_header("Access-Control-Allow-Origin", o)
                self.send_header("Vary", "Origin")
            BaseHTTPRequestHandler.end_headers(self)

        def _json(self, code, obj):
            data = json.dumps(obj).encode("utf-8")
            self.send_response(code)
            self.send_header("Content-Type", "application/json")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            if self.command != "HEAD":
                self.wfile.write(data)

        def _path(self):
            return self.path.split("?", 1)[0].rstrip("/") or "/"

        def _query(self):
            return ("?" + self.path.split("?", 1)[1]) if "?" in self.path else ""

        def do_OPTIONS(self):
            if not self._cors_origin():
                self.send_response(403)
                self.send_header("Content-Length", "0")
                self.end_headers()
                return
            self.send_response(204)
            self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", f"{KEY_HEADER}, Authorization, Content-Type")
            self.send_header("Access-Control-Max-Age", "600")
            self.send_header("Content-Length", "0")
            self.end_headers()

        def _handle(self):
            path = self._path()
            if path in HEALTH_PATHS:
                code, obj = health(immich, library)
                return self._json(code, obj)
            target = api_path(path)
            if target is None:
                return self._json(404, {"error": "not found"})
            if not key_ok(self.headers.get(KEY_HEADER), token):
                return self._json(401, {"error": "the family key is missing or wrong"})
            has_body = self.command in ("POST", "PUT", "PATCH")
            length = 0
            if has_body:
                if "chunked" in (self.headers.get("Transfer-Encoding") or "").lower():
                    return self._json(411, {"error": "a body needs a Content-Length; chunked uploads are not accepted"})
                try:
                    length = int(self.headers.get("Content-Length") or 0)
                except ValueError:
                    length = -1
                if length < 0 or length > max_body:
                    return self._json(413, {"error": f"the body is larger than {max_body} bytes"})
                if length > 0:
                    ok, why = library.state()
                    if not ok:
                        return self._json(503, {"error": why})
            if not inflight.acquire(blocking=False):
                return self._json(503, {"error": f"{MAX_INFLIGHT} requests are already in flight; try again in a moment"})
            try:
                return self._forward(target + self._query(), length if has_body else None)
            finally:
                inflight.release()

        def _forward(self, target, length):
            headers = {k: v for k, v in self.headers.items() if k.lower() not in HOP_BY_HOP}
            headers["Host"] = f"{immich.host}:{immich.port}"
            headers["Connection"] = "close"
            if length is not None:
                headers["Content-Length"] = str(length)
            body = _Limited(self.rfile, length) if length else None
            conn = http.client.HTTPConnection(immich.host, immich.port, timeout=upstream_timeout)
            try:
                conn.request(self.command, target, body=body, headers=headers)
                res = conn.getresponse()
            except socket.timeout:
                conn.close()
                return self._json(504, {"error": f"Immich did not answer within {upstream_timeout}s"})
            except (http.client.HTTPException, OSError) as e:
                conn.close()
                return self._json(502, {"error": f"Immich is not answering: {e}"})
            try:
                self.send_response(res.status, res.reason)
                for k, v in res.getheaders():
                    if k.lower() in HOP_BY_HOP:
                        continue
                    self.send_header(k, v)
                self.end_headers()
                if self.command != "HEAD":
                    while True:
                        chunk = res.read(65536)
                        if not chunk:
                            break
                        self.wfile.write(chunk)
            finally:
                conn.close()

        do_GET = do_POST = do_PUT = do_DELETE = do_PATCH = do_HEAD = _handle

    return Handler


# ---------------------------------------------------------------------------
# selftest: a fake Immich on loopback, the real Handler in front of it. Every
# refusal the door exists for is shown to fire (proven-to-catch, DR-0076).
# ---------------------------------------------------------------------------
def _selftest():
    import tempfile
    import time as _time

    failures = []

    def check(ok, what):
        print(("  ok   " if ok else "  FAIL ") + what)
        if not ok:
            failures.append(what)

    state = {"last": None, "hold": None, "ping": {"res": "pong"}}

    class FakeImmich(BaseHTTPRequestHandler):
        def log_message(self, *a):
            pass

        def _send(self, code, obj):
            data = json.dumps(obj).encode("utf-8")
            self.send_response(code)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)

        def _record(self, body=b""):
            state["last"] = {"method": self.command, "path": self.path,
                             "headers": {k.lower(): v for k, v in self.headers.items()},
                             "sha": hashlib.sha256(body).hexdigest(), "len": len(body)}

        def do_GET(self):
            self._record()
            if self.path == "/api/server/ping":
                return self._send(200, state["ping"])
            if self.path == "/api/server/version":
                return self._send(200, {"major": 3, "minor": 3, "patch": 3})
            if self.path.startswith("/api/"):
                return self._send(200, {"api": self.path})
            return self._send(200, {"page": "immich web ui"})

        def do_POST(self):
            n = int(self.headers.get("Content-Length") or 0)
            body = self.rfile.read(n)
            self._record(body)
            if state["hold"] is not None:
                state["hold"].wait(5)
            return self._send(201, {"stored": n, "sha": hashlib.sha256(body).hexdigest()})

        do_PUT = do_POST

    up = ThreadingHTTPServer(("127.0.0.1", 0), FakeImmich)
    threading.Thread(target=up.serve_forever, daemon=True).start()
    token = "selftest-family-key"
    tmp = tempfile.mkdtemp(prefix="photo-backup-selftest-")
    lib_dir = os.path.join(tmp, "immich")
    os.mkdir(lib_dir)
    pool = {"free_gb": 500}

    class Usage:
        def __init__(self, free):
            self.free = free

    library = Library(path=lib_dir, floor_gb=50, usage=lambda p: Usage(pool["free_gb"] * 1024 ** 3))
    immich = Immich(f"http://127.0.0.1:{up.server_port}")
    srv = ThreadingHTTPServer(("127.0.0.1", 0), make_handler(immich, token, library, upstream_timeout=10, max_body=2 * 1024 * 1024))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{srv.server_port}"

    def req(method, path, body=None, key=token, origin=None, headers=None):
        data = json.dumps(body).encode("utf-8") if isinstance(body, (dict, list)) else body
        r = urllib.request.Request(base + path, data=data, method=method)
        if key:
            r.add_header(KEY_HEADER, key)
        if data is not None:
            r.add_header("Content-Type", "application/octet-stream")
        if origin:
            r.add_header("Origin", origin)
        for k, v in (headers or {}).items():
            r.add_header(k, v)
        try:
            with urllib.request.urlopen(r, timeout=15) as res:
                raw = res.read()
                try:
                    obj = json.loads(raw.decode("utf-8") or "{}")
                except ValueError:
                    obj = {"raw": raw[:80]}
                return res.status, obj, dict(res.headers)
        except urllib.error.HTTPError as e:
            raw = e.read().decode("utf-8", "replace") or "{}"
            try:
                obj = json.loads(raw)
            except ValueError:
                obj = {}
            return e.code, obj, dict(e.headers)

    # --- health ----------------------------------------------------------
    s, b, _ = req("GET", "/health", key=None)
    check(s == 200 and b.get("ok") is True and b.get("version") == "3.3.3", "health is 200 with Immich's own version")
    check(b.get("free_gb") == 500 and b.get("library") == lib_dir, "health names the library folder and the pool's free space")
    check(len(b.get("code", "")) == 16, "health carries the forwarder's code sha (the running process follows the code)")
    s, _, _ = req("GET", "/photo-backup/health", key=None)
    check(s == 200, "the prefixed /photo-backup/health is served too (a proxy that does not strip)")
    pool["free_gb"] = 12
    s, b, _ = req("GET", "/health", key=None)
    check(s == 503 and "12 GB free" in b.get("reason", "") and "50 GB" in b.get("reason", ""),
          "CATCHES a pool under the floor: health 503 with the numbers in words")
    s, b, _ = req("POST", "/api/assets", body=b"x" * 10)
    check(s == 503 and "pause" in b.get("error", "") and (state["last"] or {}).get("path") != "/api/assets",
          "CATCHES an upload while the pool is under the floor: refused, Immich never asked")
    s, b, _ = req("GET", "/api/albums")
    check(s == 200 and b.get("api") == "/api/albums", "a read still passes while the pool is low (only uploads pause)")
    pool["free_gb"] = 500
    os.rmdir(lib_dir)
    s, b, _ = req("GET", "/health", key=None)
    check(s == 503 and "library folder is missing" in b.get("reason", ""), "CATCHES a missing library folder: health says so")
    os.mkdir(lib_dir)
    state["ping"] = {"res": "nope"}
    s, b, _ = req("GET", "/health", key=None)
    check(s == 503 and "pong" in b.get("reason", ""), "CATCHES an Immich that answers its ping wrongly")
    state["ping"] = {"res": "pong"}

    # --- the door: only the API passes -----------------------------------
    for p in ("/", "/photos", "/_app/immutable/x.js", "/auth/login", "/photo-backup", "/photo-backup/photos", "/apix"):
        s, _, _ = req("GET", p)
        check(s == 404, f"CATCHES a reach for Immich's own {p}: 404, never proxied")
    check(api_path("/api/server/ping") == "/api/server/ping" and api_path("/photo-backup/api/albums") == "/api/albums"
          and api_path("/apix") is None and api_path("/photos") is None, "api_path keeps /api/..., strips the mount, refuses the rest")

    # --- the key -------------------------------------------------------------
    s, _, _ = req("GET", "/api/albums", key=None)
    check(s == 401, "CATCHES a request with no family key: 401")
    s, _, _ = req("GET", "/api/albums", key="wrong-key")
    check(s == 401, "CATCHES the wrong key: 401")
    check(not key_ok("x", ""), "CATCHES an empty expected token: nothing matches an unset key")
    s, _, _ = req("GET", "/api/albums", key=None, headers={"Authorization": f"Bearer {token}"})
    check(s == 401, "CATCHES the key offered as a bearer: Immich owns Authorization, the key rides its own header")

    # --- what Immich sees ---------------------------------------------------
    s, b, _ = req("GET", "/photo-backup/api/albums?shared=true", headers={"Authorization": "Bearer immich-session", "X-Custom": "kept"})
    last = state["last"] or {}
    check(s == 200 and last.get("path") == "/api/albums?shared=true", "the mount is stripped and the query kept on the way to Immich")
    check(KEY_HEADER.lower() not in last.get("headers", {}), "the family key is STRIPPED before Immich sees the request")
    check(last["headers"].get("authorization") == "Bearer immich-session" and last["headers"].get("x-custom") == "kept",
          "Immich's own session header and other headers pass through")
    check(last["headers"].get("host", "").startswith("127.0.0.1"), "Host is rewritten to the loopback upstream")

    # --- the body, byte for byte --------------------------------------------
    blob = os.urandom(1024 * 1024 + 7)
    s, b, _ = req("PUT", "/api/assets/abc", body=blob)
    check(s == 201 and b.get("stored") == len(blob) and b.get("sha") == hashlib.sha256(blob).hexdigest(),
          "a 1 MB upload reaches Immich byte for byte, with Immich's status and body returned")
    def raw(method, path, extra, body):
        """Headers first, then the body as far as the door lets it go; the
        status line is read whether or not the body was taken (a refused
        upload is answered and closed, never drained)."""
        sk = socket.create_connection(("127.0.0.1", srv.server_port), timeout=10)
        head = f"{method} {path} HTTP/1.1\r\nHost: x\r\n{KEY_HEADER}: {token}\r\n{extra}\r\n".encode()
        sk.sendall(head)
        try:
            sk.sendall(body)
        except OSError:
            pass
        try:
            sk.shutdown(socket.SHUT_WR)
        except OSError:
            pass  # the door already answered and closed (a refused upload); the status line is still read below
        data = b""
        try:
            while len(data) < 4096:
                chunk = sk.recv(4096)
                if not chunk:
                    break
                data += chunk
        except OSError:
            pass
        sk.close()
        return int(data.split(b" ", 2)[1]) if data.startswith(b"HTTP/") else 0

    before = state["last"]
    code = raw("POST", "/api/assets", f"Content-Length: {2 * 1024 * 1024 + 1}\r\n", b"y" * 4096)
    check(code == 413 and state["last"] is before, "CATCHES a body over the cap: 413 from the headers alone, never read, Immich never asked")
    code = raw("POST", "/api/assets", "Transfer-Encoding: chunked\r\n", b"4\r\nzzzz\r\n0\r\n\r\n")
    check(code == 411 and state["last"] is before, "CATCHES a chunked body with no length: 411, Immich never asked")

    # --- in flight ----------------------------------------------------------
    hold = threading.Event()
    state["hold"] = hold
    results = []
    threads = [threading.Thread(target=lambda: results.append(req("POST", "/api/assets", body=b"slow")[0])) for _ in range(MAX_INFLIGHT)]
    for t in threads:
        t.start()
    for _ in range(100):
        if (state["last"] or {}).get("len") == 4:
            break
        _time.sleep(0.02)
    _time.sleep(0.2)
    s, b, _ = req("GET", "/api/albums")
    check(s == 503 and "in flight" in b.get("error", ""), f"CATCHES a {MAX_INFLIGHT + 1}th request while {MAX_INFLIGHT} are in flight: 503, never a queue")
    hold.set()
    for t in threads:
        t.join(10)
    state["hold"] = None
    check(results.count(201) == MAX_INFLIGHT, "the requests in flight all finish")

    # --- CORS -------------------------------------------------------------
    _, _, h = req("GET", "/health", key=None, origin="https://poetech.us")
    check(h.get("Access-Control-Allow-Origin") == "https://poetech.us", "the app's own origin is allowed")
    for o in ("https://evil.example", "https://poetech.us.evil.example", "http://poetech.us", "*"):
        _, _, h = req("GET", "/health", key=None, origin=o)
        check("Access-Control-Allow-Origin" not in h, f"CATCHES the origin {o}: refused, not echoed")
    check("*" not in CORS_ALLOWED_ORIGINS, "the LIVE allowlist holds no wildcard")

    # --- Immich down ------------------------------------------------------
    up.shutdown()
    up.server_close()
    s, b, _ = req("GET", "/health", key=None)
    check(s == 503 and "not answering" in b.get("reason", ""), "health is 503 when Immich is down, and says so")
    s, b, _ = req("GET", "/api/albums")
    check(s == 502 and "not answering" in b.get("error", ""), "a request while Immich is down: 502 in words, not a hang")

    srv.shutdown()
    shutil.rmtree(tmp, ignore_errors=True)
    print("photo-backup selftest: " + ("OK" if not failures else f"{len(failures)} FAILURE(S)"))
    return 1 if failures else 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=int(os.environ.get("PORT", "8801")))
    ap.add_argument("--upstream", default=os.environ.get("IMMICH_UPSTREAM", UPSTREAM_DEFAULT))
    ap.add_argument("--selftest", action="store_true")
    a = ap.parse_args()
    if a.selftest:
        sys.exit(_selftest())
    token = expected_token()
    if not token:
        print("photo-backup: no family bearer token -- refusing to start an unlocked door", file=sys.stderr)
        sys.exit(2)
    srv = ThreadingHTTPServer(("127.0.0.1", a.port), make_handler(Immich(a.upstream), token, Library()))
    print(f"photo-backup on 127.0.0.1:{a.port} -> {a.upstream} (code {code_sha()})")
    srv.serve_forever()


if __name__ == "__main__":
    main()
