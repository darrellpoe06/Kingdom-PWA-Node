#!/usr/bin/env python3
# =============================================================================
# nas-review-feed / review_server — sovereign governance-review-queue server
# =============================================================================
# Deterministic stdlib Python server on the family NAS that serves the Governor
# "Review" tab's freshness proposals and applies keep/dismiss actions to them. It
# REPLACES the n8n Code nodes wf-review-feed + wf-review-action (DR-0218 zero-n8n;
# same DR-0083 lane as photo_server / nas-finance-ingest — "plain Python on the
# NAS that just runs"). The logic is a byte-faithful port of those workflows:
#
#   GET  /review-feed    X-Review-Token: <token>
#        -> { ok, generated_at, freshness: [ <proposal>, ... ] }   (<=25, newest
#           first, 'dismissed' filtered out)
#   POST /review-action  X-Review-Token: <token>  { id, action }
#        action in {dismiss->dismissed, keep->kept}; id matched to the fr- shape
#        (no traversal); writes ONLY the status of an EXISTING proposal, never
#        applies anything to the system itself -- bright lines stay manual (DR-0061).
#   GET  /healthz -> { ok: true }   (no auth; liveness only)
#
# The path is matched by SUFFIX so it works whether the fronting proxy (Caddy /
# Tailscale serve) strips its mount prefix or not. Binds 127.0.0.1 by default:
# reachable only via the local reverse proxy that fronts the same-origin route.
#
# SECURITY / SOVEREIGNTY (fail-closed):
#   * Token is read from FRESH_DIR/.review-token (the SAME file the workflows
#     used -- no second copy) or the REVIEW_TOKEN env. Constant-time compare.
#   * This endpoint carries ONLY low-sensitivity PUBLIC-web summaries; family-
#     private feedback lives in Supabase (RLS), never here (N8N-WEBHOOK-AUTH).
#   * The id is regex-validated and the target path is asserted to stay inside
#     FRESH_DIR -- no traversal. Only .status + .reviewed_at are written.
#   * On-demand request/response only -> the three-brakes autonomous rule N/A.
#
# MODES:
#   review_server.py --serve [--host 127.0.0.1] [--port 8790]
#   review_server.py --selftest            # offline logic checks (tempdir; no NAS)
# =============================================================================
import argparse
import hmac
import json
import os
import re
import sys
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

FRESH_DIR_DEFAULT = "/data/finance-events/_freshness"
FEED_LIMIT = 25          # matches wf-review-feed LIMIT
FEED_SCAN = 100          # newest-N files parsed before filtering (matches wf)
VALID_ID = re.compile(r"^fr-[0-9A-Za-z-]+$")
ALLOWED_ACTIONS = {"dismiss": "dismissed", "keep": "kept"}


def fresh_dir():
    return os.environ.get("FRESH_DIR", FRESH_DIR_DEFAULT).rstrip("/") or FRESH_DIR_DEFAULT


def token_file(d=None):
    return os.path.join(d or fresh_dir(), ".review-token")


def expected_token(d=None):
    if os.environ.get("REVIEW_TOKEN"):
        return os.environ["REVIEW_TOKEN"].strip()
    try:
        with open(token_file(d), "r", encoding="utf-8") as fh:
            return fh.read().strip()
    except OSError:
        return ""


def token_ok(got, expected):
    if not expected or not got:
        return False
    return hmac.compare_digest(str(got), str(expected))


def read_recent(d, n):
    """Newest-first parse of up to n proposal files. Skips _- and .-prefixed
    files (control/token files) and anything that won't parse. Never raises."""
    try:
        names = [f for f in os.listdir(d)
                 if f.endswith(".json") and not f.startswith("_") and not f.startswith(".")]
    except OSError:
        return []
    names.sort(reverse=True)  # ids are timestamp-prefixed -> newest first
    out = []
    for f in names[:n]:
        try:
            with open(os.path.join(d, f), "r", encoding="utf-8") as fh:
                out.append(json.load(fh))
        except (OSError, ValueError):
            pass
    return out


def build_feed(d, now, limit=FEED_LIMIT, scan=FEED_SCAN):
    """{ ok, generated_at, freshness } — the wf-review-feed response, dismissed
    proposals filtered out, capped at `limit`."""
    fresh = [r for r in read_recent(d, scan)
             if isinstance(r, dict) and r.get("status") != "dismissed"][:limit]
    return {"ok": True, "generated_at": now.isoformat().replace("+00:00", "Z"), "freshness": fresh}


def apply_action(d, ident, action, now):
    """Port of wf-review-action: validate, load, set ONLY status+reviewed_at,
    write back. Returns the response dict. Never raises."""
    new_status = ALLOWED_ACTIONS.get(str(action or "").lower())
    if not new_status:
        return {"ok": False, "error": "invalid action (expected dismiss or keep)"}
    ident = str(ident or "")
    if not VALID_ID.match(ident):
        return {"ok": False, "error": "invalid id"}
    base = os.path.realpath(d)
    target = os.path.realpath(os.path.join(base, ident + ".json"))
    if os.path.dirname(target) != base:
        return {"ok": False, "error": "invalid id (path)"}
    try:
        with open(target, "r", encoding="utf-8") as fh:
            record = json.load(fh)
    except (OSError, ValueError):
        return {"ok": False, "error": "not found"}
    if not isinstance(record, dict):
        return {"ok": False, "error": "not found"}
    record["status"] = new_status
    record["reviewed_at"] = now.isoformat().replace("+00:00", "Z")
    try:
        with open(target, "w", encoding="utf-8") as fh:
            json.dump(record, fh, indent=2)
    except OSError as e:
        return {"ok": False, "error": "write failed: %s" % type(e).__name__}
    return {"ok": True, "id": ident, "status": new_status}


def health(d=None):
    """The door says WHY it cannot serve, instead of a 200 that means nothing.

    DR-1000 named the defect and asked, on its re-review, whether the same shape
    sat on any OTHER sovereign surface. MEASURED 2026-10-20: of the thirteen
    sovereign servers and forwarders under infra/, this was the last one whose
    health route answered an unconditional `200 {"ok": true}` -- it checked
    nothing at all. (llm_server also names no 503, but it is honest: its header
    documents ok:false when Ollama is unreachable, so the reason rides the body.)

    This server can answer only when two things hold, and it is up and useless
    without either. The freshness folder is what it reads, and a token is what
    lets anyone in: with none configured, expected_token() is "" and token_ok()
    refuses EVERY call. Neither reason prints the folder path or the token,
    which is photo_server's and announce's rule for a reason.

    The audit of the services born before the Way could not reach this file:
    that list is drawn from infra/nas-loops/services.json, and nas-review-feed
    is absent from the manifest because it has no installer -- its README starts
    it by hand. So the gate's green never spoke for this door.
    """
    dirpath = d or fresh_dir()
    if not os.path.isdir(dirpath):
        return 503, {"ok": False, "error": "the review queue folder is not there"}
    if not os.access(dirpath, os.R_OK):
        return 503, {"ok": False, "error": "the review queue folder cannot be read"}
    if not expected_token(dirpath):
        return 503, {"ok": False, "error": "no review token is configured, so every call is refused"}
    return 200, {"ok": True}


# --- HTTP server -------------------------------------------------------------
def make_handler():
    class Handler(BaseHTTPRequestHandler):
        server_version = "poetech-review/1.0"

        def _send(self, code, payload):
            body = json.dumps(payload).encode("utf-8")
            self.send_response(code)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(body)

        def log_message(self, *a):  # keep the NAS console quiet; never log tokens
            pass

        def _token_header(self):
            return self.headers.get("X-Review-Token") or self.headers.get("x-review-token") or ""

        def do_GET(self):
            path = urlparse(self.path).path.rstrip("/")
            if path.endswith("/healthz") or path in ("/healthz", "/health"):
                code, payload = health()
                self._send(code, payload)
                return
            if not (path.endswith("/review-feed") or path == "/review-feed"):
                self._send(404, {"ok": False, "error": "not found"})
                return
            if not token_ok(self._token_header(), expected_token()):
                self._send(401, {"ok": False, "error": "unauthorized"})
                return
            self._send(200, build_feed(fresh_dir(), datetime.now(timezone.utc)))

        def do_POST(self):
            path = urlparse(self.path).path.rstrip("/")
            if not (path.endswith("/review-action") or path == "/review-action"):
                self._send(404, {"ok": False, "error": "not found"})
                return
            try:
                length = int(self.headers.get("Content-Length", "0"))
            except ValueError:
                length = 0
            if length <= 0 or length > 64 * 1024:
                self._send(400, {"ok": False, "error": "bad body"})
                return
            try:
                body = json.loads(self.rfile.read(length).decode("utf-8", "replace"))
            except (ValueError, OSError):
                self._send(400, {"ok": False, "error": "bad json"})
                return
            if not isinstance(body, dict):
                body = {}
            got = self._token_header() or body.get("token") or ""
            if not token_ok(got, expected_token()):
                self._send(401, {"ok": False, "error": "unauthorized"})
                return
            res = apply_action(fresh_dir(), body.get("id"), body.get("action"), datetime.now(timezone.utc))
            self._send(200 if res.get("ok") else 400, res)

    return Handler


def serve(args):
    if not expected_token():
        print("REFUSING TO START: no review token. Set REVIEW_TOKEN or populate %s"
              % token_file(), file=sys.stderr)
        sys.exit(2)
    httpd = ThreadingHTTPServer((args.host, args.port), make_handler())
    print("review_server listening on http://%s:%d  (GET /review-feed, POST /review-action)"
          % (args.host, args.port))
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        httpd.shutdown()


def selftest():
    """Offline logic checks — tempdir, no NAS/psql needed."""
    import tempfile
    import shutil
    checks = []

    def ok(label, cond):
        checks.append((label, bool(cond)))

    now = datetime(2026, 7, 21, 12, 0, 0, tzinfo=timezone.utc)
    d = tempfile.mkdtemp()
    try:
        # three proposals: two live (newer/older) + one already dismissed
        for name, status in (("fr-20260721a", "new"), ("fr-20260720b", "kept"), ("fr-20260719c", "dismissed")):
            with open(os.path.join(d, name + ".json"), "w", encoding="utf-8") as fh:
                json.dump({"id": name, "status": status, "text": name}, fh)
        # a control/hidden file that must be ignored
        with open(os.path.join(d, "_index.json"), "w", encoding="utf-8") as fh:
            fh.write("{}")

        feed = build_feed(d, now)
        ids = [r.get("id") for r in feed["freshness"]]
        ok("feed is ok + carries generated_at", feed["ok"] and feed["generated_at"] == "2026-07-21T12:00:00Z")
        ok("feed hides dismissed proposals", "fr-20260719c" not in ids)
        ok("feed keeps live proposals", ids == ["fr-20260721a", "fr-20260720b"])
        ok("feed skips _-prefixed control files", all(not (i or "").startswith("_") for i in ids))

        # action: dismiss a live one -> it leaves the feed
        r1 = apply_action(d, "fr-20260721a", "dismiss", now)
        ok("dismiss returns ok+status", r1 == {"ok": True, "id": "fr-20260721a", "status": "dismissed"})
        ok("dismissed proposal leaves the feed",
           "fr-20260721a" not in [x.get("id") for x in build_feed(d, now)["freshness"]])
        with open(os.path.join(d, "fr-20260721a.json"), "r", encoding="utf-8") as fh:
            saved = json.load(fh)
        ok("only status+reviewed_at written; text preserved",
           saved["status"] == "dismissed" and saved.get("reviewed_at") == "2026-07-21T12:00:00Z" and saved["text"] == "fr-20260721a")

        ok("keep maps to 'kept'", apply_action(d, "fr-20260720b", "keep", now)["status"] == "kept")
        ok("invalid action rejected", apply_action(d, "fr-20260720b", "nuke", now)["error"].startswith("invalid action"))
        ok("bad id rejected", apply_action(d, "../secrets", "keep", now)["error"] == "invalid id")
        ok("traversal-shaped id rejected", apply_action(d, "fr-..", "keep", now)["error"] == "invalid id")
        ok("missing proposal -> not found", apply_action(d, "fr-doesnotexist", "keep", now)["error"] == "not found")

        # auth
        ok("token_ok accepts a match", token_ok("secret", "secret"))
        ok("token_ok rejects a mismatch", not token_ok("nope", "secret"))
        ok("token_ok rejects empty expected", not token_ok("x", ""))
        ok("token_ok rejects empty got", not token_ok("", "secret"))
        ok("id regex accepts fr- shape", bool(VALID_ID.match("fr-20260721-abc")))
        ok("id regex rejects dotted", not VALID_ID.match("fr-a.b"))

        # The door says why (DR-1000). REVIEW_TOKEN is cleared around these, so
        # a token in the runner's environment cannot make the no-token case pass.
        saved_tok = os.environ.pop("REVIEW_TOKEN", None)
        try:
            with open(token_file(d), "w", encoding="utf-8") as fh:
                fh.write("a-token")
            ok("health is 200 when the folder is there and a token is set", health(d) == (200, {"ok": True}))

            # A folder with NO token file: the one place the env path can be
            # told apart from the file path.
            bare = tempfile.mkdtemp()
            try:
                code, payload = health(bare)
                ok("health is 503 when no token is configured", code == 503 and payload["ok"] is False)
                ok("the no-token reason says every call is refused", "refused" in payload["error"])
                ok("the no-token reason never prints the folder", bare not in json.dumps(payload))

                # The env token alone is enough: the door must not demand a file.
                os.environ["REVIEW_TOKEN"] = "from-the-env"
                ok("health is 200 on the env token alone, with no token file", health(bare) == (200, {"ok": True}))
                os.environ.pop("REVIEW_TOKEN", None)
                ok("and 503 again once the env token is gone", health(bare)[0] == 503)
            finally:
                shutil.rmtree(bare, ignore_errors=True)

            gone = os.path.join(d, "not-a-real-folder")
            code, payload = health(gone)
            ok("health is 503 when the folder is not there", code == 503 and payload["ok"] is False)
            ok("the missing-folder reason never prints the path", gone not in json.dumps(payload))

            # PROVEN TO CATCH: the shape this replaces. A handler that answers a
            # bare 200 passes every check above vacuously, so the source itself
            # is held -- the old line must be gone and the branch must delegate.
            src = open(__file__, "r", encoding="utf-8").read() if os.path.exists(__file__) else ""
            # BOTH needles are built from halves ON PURPOSE. Written whole, each
            # line would contain the very string it searches for, and the check
            # would answer against its own text instead of the handler. The
            # bare-200 one FAILED that way on the first run, and its twin below
            # PASSED vacuously -- the only occurrence of its needle was the
            # assertion itself, so it could never have gone red. Do not join
            # these strings back together.
            delegates = "code, payload = " + "health()"
            ok("the healthz branch delegates to health()", delegates in src)
            bare_200 = 'self._send(200, {"ok": ' + 'True})'
            ok("the bare 200 is gone from the healthz branch", bare_200 not in src)
        finally:
            if saved_tok is not None:
                os.environ["REVIEW_TOKEN"] = saved_tok
            else:
                os.environ.pop("REVIEW_TOKEN", None)
    finally:
        shutil.rmtree(d, ignore_errors=True)

    passed = sum(1 for _, c in checks if c)
    for label, c in checks:
        print(("PASS " if c else "FAIL ") + label)
    print("\n%d/%d checks passed" % (passed, len(checks)))
    sys.exit(0 if passed == len(checks) else 1)


def main():
    ap = argparse.ArgumentParser(description="Sovereign governance review-queue server (no n8n).")
    ap.add_argument("--serve", action="store_true", help="run the HTTP server")
    ap.add_argument("--selftest", action="store_true", help="offline logic checks")
    ap.add_argument("--host", default=os.environ.get("REVIEW_HOST", "127.0.0.1"))
    ap.add_argument("--port", type=int, default=int(os.environ.get("REVIEW_PORT", "8790")))
    args = ap.parse_args()
    if args.selftest:
        selftest()
    elif args.serve:
        serve(args)
    else:
        ap.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
