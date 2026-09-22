#!/usr/bin/env python3
# =============================================================================
# voice_forwarder -- the NAS-side road home for the sovereign reading voice
# =============================================================================
# Darrell 2026-09-20, reading a lesson on a Fire TV: "No sounds yet for the
# tts... but it does click and do what it should." The device has no voice of
# its own, so the app routes the System voice to the church's OWN XTTS studio
# (DR-0382 / DR-0401) over the same-origin /voice transport. That transport
# ends at the Funnel on the NAS -- and the studio is a GPU container on the
# 4070 (tlcmediadpt), a different machine.
#
# WHY THIS PROCESS EXISTS, in two facts that were both verified rather than
# assumed (the first version of install.sh assumed the opposite of the first):
#   1. Tailscale will only proxy to localhost -- "only localhost or 127.0.0.1
#      proxies are currently supported" (tailscale/tailscale#8751, open since
#      2023-07-31). A Funnel path cannot point at the 4070. Something on the
#      NAS has to answer on 127.0.0.1 and carry the request across.
#   2. The studio has NO authentication of its own, and /voice sits on the
#      PUBLIC Funnel. Mounting it bare would put the family's GPU on the open
#      internet for any stranger to spend. The photo server and the tax server
#      met exactly this and both gate on the family bridge bearer; so does this.
#
# So: a stdlib reverse proxy on 127.0.0.1:8771, the same shape every other
# sovereign row in RECORDED-STATE already has (8099 photos, 8790 taxes, 8800
# supabase). Nothing here is clever. It is a door with a lock in front of a
# machine that has none.
#
# Contract (the mount point is STRIPPED by tailscale before forwarding, so the
# bare paths are what arrive; the prefixed spellings are served too, for a
# proxy that does not strip):
#   GET  /health, /voice/health   -> the STUDIO's own /health, passed through.
#                                    Open: the app probes it without a token,
#                                    and it says nothing worth guarding. It
#                                    answers 502 when the studio is dark, so a
#                                    green here means the whole road is green,
#                                    not just this process.
#   POST /speak,  /voice/speak    -> Authorization: Bearer <family bridge token>
#                                    required (401 otherwise, 503 when the
#                                    concurrency cap is full), body forwarded
#                                    verbatim, audio streamed back verbatim.
#
# Brakes (this is NOT the timer-driven class -- it does nothing until a browser
# asks -- but a public door still needs bounds):
#   * MAX_INFLIGHT concurrent syntheses; the (N+1)th gets 503 immediately
#     rather than queueing on the GPU.
#   * MAX_BODY bytes of request (a cloned voice carries a base64 sample;
#     2 MB is generous for a 10-second reference).
#   * UPSTREAM_TIMEOUT seconds per synthesis; a hung studio hangs nobody.
#
# Run:
#   VOICE_STUDIO_UPSTREAM=http://tlcmediadpt:8770 python3 voice_forwarder.py
#   python3 voice_forwarder.py --selftest     # offline, stdlib, no NAS needed
# Installed + kept running by infra/voice-studio/install.sh via services-sync.
# =============================================================================
import argparse
import hmac
import json
import os
import sys
import threading
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

TOKEN_FILE_DEFAULT = "/volume1/PoeTech/secrets/chat-bridge-token.txt"
UPSTREAM_DEFAULT = "http://tlcmediadpt:8770"
MAX_INFLIGHT = int(os.environ.get("VOICE_MAX_INFLIGHT", "2"))
MAX_BODY = int(os.environ.get("VOICE_MAX_BODY", str(2 * 1024 * 1024)))
UPSTREAM_TIMEOUT = float(os.environ.get("VOICE_UPSTREAM_TIMEOUT", "300"))
HEALTH_TIMEOUT = 5.0
CHUNK = 64 * 1024

# Paths accepted, and what they become upstream. The studio serves both
# spellings itself, but normalising here means the studio's aliases are a
# second net rather than the only one.
SPEAK_PATHS = {"/speak", "/voice/speak"}
HEALTH_PATHS = {"/health", "/voice/health"}


# --- Auth (identical to photo_server.py / tax_upload_server.py) --------------
def expected_token(token_file=None):
    if os.environ.get("VOICE_BRIDGE_TOKEN"):
        return os.environ["VOICE_BRIDGE_TOKEN"].strip()
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


# --- The handler -------------------------------------------------------------
def make_handler(upstream, token, max_inflight=MAX_INFLIGHT, timeout=UPSTREAM_TIMEOUT):
    upstream = upstream.rstrip("/")
    gate = threading.BoundedSemaphore(max_inflight)

    class Handler(BaseHTTPRequestHandler):
        server_version = "poetech-voice-forwarder/1"
        protocol_version = "HTTP/1.1"

        def log_message(self, *a):  # quiet on the NAS console; never log bodies or tokens
            pass

        def _json(self, code, obj):
            data = json.dumps(obj).encode("utf-8")
            self.send_response(code)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(data)

        def do_GET(self):
            path = self.path.split("?", 1)[0]
            if path not in HEALTH_PATHS:
                return self._json(404, {"error": "not-found"})
            # Pass the studio's answer through rather than answering for it.
            # A 200 from this process about ITSELF would let the app's probe
            # read "up" over a dark GPU -- the DR-0440 class exactly.
            try:
                with urllib.request.urlopen(upstream + "/health", timeout=HEALTH_TIMEOUT) as r:
                    body = r.read(4096)
                    self.send_response(r.status)
                    self.send_header("Content-Type", r.headers.get("Content-Type", "application/json"))
                    self.send_header("Content-Length", str(len(body)))
                    self.send_header("Cache-Control", "no-store")
                    self.end_headers()
                    self.wfile.write(body)
            except (urllib.error.URLError, OSError, ValueError):
                self._json(502, {"ok": False, "error": "studio-unreachable", "upstream": upstream})

        def do_POST(self):
            path = self.path.split("?", 1)[0]
            if path not in SPEAK_PATHS:
                return self._json(404, {"error": "not-found"})
            if not bearer_ok(self.headers.get("Authorization"), token):
                return self._json(401, {"error": "unauthorized"})
            try:
                length = int(self.headers.get("Content-Length") or 0)
            except ValueError:
                length = 0
            if length <= 0:
                return self._json(400, {"error": "body-required"})
            if length > MAX_BODY:
                return self._json(413, {"error": "body-too-large", "max": MAX_BODY})
            body = self.rfile.read(length)
            if not gate.acquire(blocking=False):
                return self._json(503, {"error": "busy", "max_inflight": max_inflight})
            try:
                req = urllib.request.Request(
                    upstream + "/speak", data=body, method="POST",
                    headers={"Content-Type": self.headers.get("Content-Type", "application/json")},
                )
                try:
                    with urllib.request.urlopen(req, timeout=timeout) as r:
                        self.send_response(r.status)
                        ctype = r.headers.get("Content-Type", "application/octet-stream")
                        self.send_header("Content-Type", ctype)
                        clen = r.headers.get("Content-Length")
                        if clen:
                            self.send_header("Content-Length", clen)
                        else:
                            self.send_header("Connection", "close")
                        self.send_header("Cache-Control", "no-store")
                        self.end_headers()
                        while True:
                            chunk = r.read(CHUNK)
                            if not chunk:
                                break
                            self.wfile.write(chunk)
                        if not clen:
                            self.close_connection = True
                except urllib.error.HTTPError as e:
                    # The studio's own refusal (400 reference-required, etc.)
                    # is passed through unchanged: the app's built-in-voice
                    # probe reads that status to learn what this deployment
                    # can do (DR-0401), and rewriting it would teach it wrong.
                    payload = e.read() or b""
                    self.send_response(e.code)
                    self.send_header("Content-Type", e.headers.get("Content-Type", "application/json"))
                    self.send_header("Content-Length", str(len(payload)))
                    self.end_headers()
                    self.wfile.write(payload)
                except (urllib.error.URLError, OSError, ValueError):
                    self._json(502, {"error": "studio-unreachable", "upstream": upstream})
            finally:
                gate.release()

    return Handler


# --- Selftest ----------------------------------------------------------------
def _selftest():
    """Offline behavioural checks against a fake studio. Exit 1 on any miss."""
    import time
    from http.client import HTTPConnection

    failures = []

    def check(cond, msg):
        print(("  PASS " if cond else "  FAIL ") + msg)
        if not cond:
            failures.append(msg)

    # A fake studio: /health -> 200, /speak -> echoes the body back as "audio",
    # slowly enough that two overlapping requests are really overlapping.
    class Studio(BaseHTTPRequestHandler):
        protocol_version = "HTTP/1.1"

        def log_message(self, *a):
            pass

        def do_GET(self):
            if self.path == "/health":
                b = b'{"ok":true}'
                self.send_response(200); self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b)
            else:
                self.send_response(404); self.send_header("Content-Length", "0"); self.end_headers()

        def do_POST(self):
            n = int(self.headers.get("Content-Length") or 0)
            body = self.rfile.read(n)
            if b'"refuse"' in body:
                b = b'{"error":"reference-required"}'
                self.send_response(400); self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b); return
            time.sleep(0.4)
            audio = b"RIFF" + body * 3
            self.send_response(200); self.send_header("Content-Type", "audio/wav")
            self.send_header("Content-Length", str(len(audio))); self.end_headers(); self.wfile.write(audio)

    studio = ThreadingHTTPServer(("127.0.0.1", 0), Studio)
    sp = studio.server_address[1]
    threading.Thread(target=studio.serve_forever, daemon=True).start()

    token = "test-token-" + str(os.getpid())
    fwd = ThreadingHTTPServer(("127.0.0.1", 0), make_handler(f"http://127.0.0.1:{sp}", token, max_inflight=1, timeout=5))
    fp = fwd.server_address[1]
    threading.Thread(target=fwd.serve_forever, daemon=True).start()

    def call(method, path, body=None, auth=None):
        c = HTTPConnection("127.0.0.1", fp, timeout=5)
        headers = {"Content-Type": "application/json"}
        if auth is not None:
            headers["Authorization"] = auth
        c.request(method, path, body=body, headers=headers)
        r = c.getresponse()
        data = r.read()
        c.close()
        return r.status, r.getheader("Content-Type", ""), data

    print("=== 1. /health passes the STUDIO's answer through, unauthenticated ===")
    s, _, d = call("GET", "/health")
    check(s == 200 and b'"ok":true' in d, "GET /health -> 200 from the studio, no token needed")
    s, _, _ = call("GET", "/voice/health")
    check(s == 200, "GET /voice/health (un-stripped spelling) -> 200 too")

    print("=== 2. /speak is LOCKED: no token / wrong token -> 401, never forwarded ===")
    s, _, _ = call("POST", "/speak", b'{"text":"hi"}')
    check(s == 401, "no Authorization -> 401")
    s, _, _ = call("POST", "/speak", b'{"text":"hi"}', auth="Bearer wrong")
    check(s == 401, "wrong bearer -> 401")
    s, _, _ = call("POST", "/speak", b'{"text":"hi"}', auth="Basic " + token)
    check(s == 401, "non-bearer scheme -> 401")

    print("=== 3. the right token forwards, and the audio comes back BYTE-FOR-BYTE ===")
    body = b'{"text":"The Word of Yahweh endures forever."}'
    s, ct, d = call("POST", "/speak", body, auth="Bearer " + token)
    check(s == 200, "right bearer -> 200")
    check(ct.startswith("audio/wav"), "content-type is the studio's (audio/wav)")
    check(d == b"RIFF" + body * 3, "response body is exactly what the studio produced")
    s, _, d = call("POST", "/voice/speak", body, auth="Bearer " + token)
    check(s == 200 and d.startswith(b"RIFF"), "POST /voice/speak (un-stripped spelling) forwards too")

    print("=== 4. the studio's OWN refusal passes through unchanged (DR-0401 probe) ===")
    s, _, d = call("POST", "/speak", b'{"text":"refuse"}', auth="Bearer " + token)
    check(s == 400 and b"reference-required" in d, "studio 400 reference-required arrives as 400 reference-required")

    print("=== 5. PROVEN-TO-CATCH: the concurrency cap refuses the (N+1)th, immediately ===")
    results = {}
    def one(k):
        results[k] = call("POST", "/speak", b'{"text":"slow"}', auth="Bearer " + token)[0]
    t1 = threading.Thread(target=one, args=("a",)); t1.start()
    time.sleep(0.1)
    t0 = time.time(); one("b"); dt = time.time() - t0
    t1.join()
    check(results["a"] == 200, "first in-flight synthesis completes 200")
    check(results["b"] == 503, "second, over the cap of 1, is refused 503")
    check(dt < 0.3, f"and refused IMMEDIATELY ({dt:.2f}s), not after queueing on the GPU")

    print("=== 6. bounds: empty body 400, oversize 413, unknown path 404 ===")
    s, _, _ = call("POST", "/speak", b"", auth="Bearer " + token)
    check(s == 400, "empty body -> 400")
    global MAX_BODY
    saved = MAX_BODY; MAX_BODY = 16
    s, _, _ = call("POST", "/speak", b'{"text":"this is longer than sixteen bytes"}', auth="Bearer " + token)
    MAX_BODY = saved
    check(s == 413, "over MAX_BODY -> 413, body never read into memory")
    s, _, _ = call("POST", "/elsewhere", b"{}", auth="Bearer " + token)
    check(s == 404, "unknown POST path -> 404")
    s, _, _ = call("GET", "/speak")
    check(s == 404, "GET /speak -> 404 (health is the only GET)")

    print("=== 7. a DARK studio reads as 502 on /health, not as this process's own 200 ===")
    # shutdown() only stops the accept loop; the listening socket stays open and
    # a new connection would queue on it until the client timeout. server_close()
    # actually closes it, so the forwarder sees a refused connection at once --
    # which is also what a stopped container looks like from the NAS.
    studio.shutdown(); studio.server_close()
    s, _, d = call("GET", "/health")
    check(s == 502 and b"studio-unreachable" in d, "studio down -> /health 502 studio-unreachable")
    s, _, d = call("POST", "/speak", body, auth="Bearer " + token)
    check(s == 502, "studio down -> /speak 502 (the app's tagged-error path)")

    print("=== 8. bearer_ok never accepts an empty expected token ===")
    check(not bearer_ok("Bearer ", ""), "empty expected token matches nothing, not even an empty bearer")
    check(not bearer_ok("Bearer x", ""), "an unconfigured forwarder accepts nobody")

    fwd.shutdown()
    if failures:
        print(f"\nSELFTEST FAILED: {len(failures)} check(s)")
        for f in failures:
            print("  - " + f)
        sys.exit(1)
    print("\nALL FORWARDER CHECKS PASSED.")


def main():
    ap = argparse.ArgumentParser(description="NAS-side forwarder for the sovereign voice studio")
    ap.add_argument("--host", default="127.0.0.1")
    ap.add_argument("--port", type=int, default=int(os.environ.get("PORT", "8771")))
    ap.add_argument("--upstream", default=os.environ.get("VOICE_STUDIO_UPSTREAM", UPSTREAM_DEFAULT))
    ap.add_argument("--token-file", default=None)
    ap.add_argument("--selftest", action="store_true")
    args = ap.parse_args()
    if args.selftest:
        return _selftest()
    token = expected_token(args.token_file)
    if not token:
        print("REFUSING TO START: no bearer token. Set VOICE_BRIDGE_TOKEN or populate %s"
              % (args.token_file or TOKEN_FILE_DEFAULT), file=sys.stderr)
        sys.exit(2)
    if args.host not in ("127.0.0.1", "localhost"):
        # Bound to loopback by design: the Funnel is the only intended caller,
        # and it can only proxy to loopback anyway. Anything wider is a mistake.
        print("REFUSING TO START: --host must be loopback (got %s)" % args.host, file=sys.stderr)
        sys.exit(2)
    httpd = ThreadingHTTPServer((args.host, args.port), make_handler(args.upstream, token))
    print(f"voice-forwarder on http://{args.host}:{args.port} -> {args.upstream} (cap {MAX_INFLIGHT}, timeout {UPSTREAM_TIMEOUT:.0f}s)")
    httpd.serve_forever()


if __name__ == "__main__":
    main()
