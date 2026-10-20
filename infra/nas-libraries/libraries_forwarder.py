#!/usr/bin/env python3
# =============================================================================
# libraries_forwarder -- the health door of the libraries road (DR-1121)
# =============================================================================
# Jellyfin (the video library) and Audiobookshelf (the audio shelf) are NOT on
# the public Funnel: their TV and phone apps cannot carry the family key, so
# they live on the tailnet with their own logins (see docker-compose.yml). What
# the Funnel gets is this door, which serves exactly one thing:
#   GET /health, /libraries/health -> 200 only when BOTH servers answer on
#        loopback AND the shelves are on the pool; 503 with each reason in
#        words otherwise. Open (it says nothing worth guarding). Everything
#        else is 404; nothing of either server is ever passed through here.
# The app reads it to say, per server, "live" or why not; the witness
# (libraries-health.yml) reads it the same way.
#
# Run:
#   python3 libraries_forwarder.py --port 8802
#   python3 libraries_forwarder.py --selftest
# =============================================================================
import argparse
import hashlib
import json
import os
import socket
import sys
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

JELLYFIN_DEFAULT = "http://127.0.0.1:8096"
ABS_DEFAULT = "http://127.0.0.1:13378"
SHELVES_DEFAULT = ("/volume1/PoeTech/library/video", "/volume1/PoeTech/library/audio", "/volume1/docker/ytzero/downloads", "/volume1/PoeTech/lesson-voice")
CORS_ALLOWED_ORIGINS = ("https://poetech.us",)
HEALTH_PATHS = {"/health", "/libraries/health"}
HEALTH_TIMEOUT = 6


def code_sha():
    try:
        with open(os.path.abspath(__file__), "rb") as fh:
            return hashlib.sha256(fh.read()).hexdigest()[:16]
    except OSError:
        return "unknown"


def _get_json(url, timeout=HEALTH_TIMEOUT):
    with urllib.request.urlopen(url, timeout=timeout) as r:
        return json.loads(r.read().decode("utf-8"))


def jellyfin_state(base):
    try:
        info = _get_json(base.rstrip("/") + "/System/Info/Public")
    except (urllib.error.URLError, socket.timeout, OSError, ValueError) as e:
        return {"ok": False, "reason": f"Jellyfin is not answering on loopback: {e}"}
    if not isinstance(info, dict) or not info.get("Version"):
        return {"ok": False, "reason": "Jellyfin answered without a version"}
    out = {"ok": True, "version": str(info.get("Version"))}
    if info.get("StartupWizardCompleted") is False:
        out["note"] = "first start: the NAS makes the admin and the family's logins on its next cycle"
    return out


def abs_state(base):
    try:
        st = _get_json(base.rstrip("/") + "/status")
    except (urllib.error.URLError, socket.timeout, OSError, ValueError) as e:
        return {"ok": False, "reason": f"Audiobookshelf is not answering on loopback: {e}"}
    if not isinstance(st, dict) or "isInit" not in st:
        return {"ok": False, "reason": "Audiobookshelf answered without its status"}
    out = {"ok": True, "version": str(st.get("serverVersion") or "?")}
    if not st.get("isInit"):
        out["note"] = "first start: the NAS makes the root and the family's logins on its next cycle"
    return out


def shelves_state(paths):
    missing = [p for p in paths if not os.path.isdir(p)]
    if missing:
        return {"ok": False, "reason": "shelf folders missing on the pool: " + ", ".join(missing)}
    return {"ok": True, "shelves": list(paths)}


def health(jellyfin, abs_base, shelves):
    j, a, s = jellyfin_state(jellyfin), abs_state(abs_base), shelves_state(shelves)
    ok = j["ok"] and a["ok"] and s["ok"]
    reasons = [x["reason"] for x in (j, a, s) if not x["ok"]]
    body = {"ok": ok, "jellyfin": j, "audiobookshelf": a, "shelves": s, "code": code_sha()}
    if reasons:
        body["reason"] = "; ".join(reasons)
    return (200 if ok else 503), body


def make_handler(jellyfin, abs_base, shelves):
    class Handler(BaseHTTPRequestHandler):
        server_version = "poetech-libraries"

        def log_message(self, fmt, *args):
            sys.stderr.write("libraries: %s %s\n" % (self.command, self.path.split("?")[0]))

        def end_headers(self):
            o = self.headers.get("Origin")
            if o in CORS_ALLOWED_ORIGINS:
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
            self.wfile.write(data)

        def do_GET(self):
            path = self.path.split("?", 1)[0].rstrip("/") or "/"
            if path in HEALTH_PATHS:
                code, obj = health(jellyfin, abs_base, shelves)
                return self._json(code, obj)
            return self._json(404, {"error": "not found"})

        def do_POST(self):
            return self._json(404, {"error": "not found"})

    return Handler


def _selftest():
    import tempfile
    import threading

    failures = []

    def check(ok, what):
        print(("  ok   " if ok else "  FAIL ") + what)
        if not ok:
            failures.append(what)

    state = {"jf_wizard": True, "abs_init": True}

    class Fake(BaseHTTPRequestHandler):
        def log_message(self, *a):
            pass

        def _send(self, code, obj):
            data = json.dumps(obj).encode("utf-8")
            self.send_response(code)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)

        def do_GET(self):
            if self.path == "/System/Info/Public":
                return self._send(200, {"Version": "12.2.0", "StartupWizardCompleted": state["jf_wizard"]})
            if self.path == "/status":
                return self._send(200, {"isInit": state["abs_init"], "serverVersion": "2.37.1"})
            return self._send(200, {"page": "a server page"})

    up = ThreadingHTTPServer(("127.0.0.1", 0), Fake)
    threading.Thread(target=up.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{up.server_port}"
    tmp = tempfile.mkdtemp(prefix="libraries-selftest-")
    shelves = [os.path.join(tmp, "video"), os.path.join(tmp, "audio")]
    for p in shelves:
        os.mkdir(p)
    srv = ThreadingHTTPServer(("127.0.0.1", 0), make_handler(base, base, shelves))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    door = f"http://127.0.0.1:{srv.server_port}"

    def req(path, origin=None):
        r = urllib.request.Request(door + path)
        if origin:
            r.add_header("Origin", origin)
        try:
            with urllib.request.urlopen(r, timeout=10) as res:
                return res.status, json.loads(res.read().decode("utf-8")), dict(res.headers)
        except urllib.error.HTTPError as e:
            return e.code, json.loads(e.read().decode("utf-8") or "{}"), dict(e.headers)

    s, b, _ = req("/health")
    check(s == 200 and b["ok"] and b["jellyfin"]["version"] == "12.2.0" and b["audiobookshelf"]["version"] == "2.37.1",
          "health is 200 with both servers' own versions")
    check(len(b.get("code", "")) == 16, "health carries the door's code sha")
    s, _, _ = req("/libraries/health")
    check(s == 200, "the prefixed /libraries/health is served too")
    state["jf_wizard"] = False
    state["abs_init"] = False
    s, b, _ = req("/health")
    check(s == 200 and "first start" in b["jellyfin"].get("note", "") and "first start" in b["audiobookshelf"].get("note", ""),
          "a fresh server is live and says the NAS makes the logins next")
    os.rmdir(shelves[1])
    s, b, _ = req("/health")
    check(s == 503 and "shelf folders missing" in b.get("reason", "") and shelves[1] in b["reason"], "CATCHES a missing shelf folder: 503 naming it")
    os.mkdir(shelves[1])
    for p in ("/", "/web/index.html", "/System/Info/Public", "/api/users", "/libraries", "/libraries/web"):
        s, _, _ = req(p)
        check(s == 404, f"CATCHES a reach for {p}: 404, nothing passed through")
    _, _, h = req("/health", origin="https://poetech.us")
    check(h.get("Access-Control-Allow-Origin") == "https://poetech.us", "the app's own origin is allowed")
    _, _, h = req("/health", origin="https://evil.example")
    check("Access-Control-Allow-Origin" not in h, "CATCHES a foreign origin: not echoed")
    up.shutdown()
    up.server_close()
    s, b, _ = req("/health")
    check(s == 503 and "Jellyfin is not answering" in b["reason"] and "Audiobookshelf is not answering" in b["reason"],
          "health is 503 with BOTH reasons when both are down")
    srv.shutdown()
    print("libraries selftest: " + ("OK" if not failures else f"{len(failures)} FAILURE(S)"))
    return 1 if failures else 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=int(os.environ.get("PORT", "8802")))
    ap.add_argument("--jellyfin", default=os.environ.get("JELLYFIN_UPSTREAM", JELLYFIN_DEFAULT))
    ap.add_argument("--audiobookshelf", default=os.environ.get("ABS_UPSTREAM", ABS_DEFAULT))
    ap.add_argument("--selftest", action="store_true")
    a = ap.parse_args()
    if a.selftest:
        sys.exit(_selftest())
    shelves = tuple(filter(None, os.environ.get("LIBRARY_SHELVES", ":".join(SHELVES_DEFAULT)).split(":")))
    srv = ThreadingHTTPServer(("127.0.0.1", a.port), make_handler(a.jellyfin, a.audiobookshelf, shelves))
    print(f"libraries on 127.0.0.1:{a.port} (code {code_sha()})")
    srv.serve_forever()


if __name__ == "__main__":
    main()
