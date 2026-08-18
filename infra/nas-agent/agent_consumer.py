#!/usr/bin/env python3
# =============================================================================
# agent_consumer.py -- the box agent: drain agent_tasks through local Ollama
# =============================================================================
# Darrell 2026-08-15: "you arm it dont make it not work to start..." then
# "build the consumer." DR-0247's amendment governs: agreed work STARTS ITSELF
# through the lane; deterministic class carries budget + lock (DR-0248).
#
# THE PATH (DR-0132 P1, measured tonight): the PWA's ChatPane INSERTs a row
# into agent_tasks (migration 0137); THIS consumer polls OUTBOUND and answers.
# Nothing inbound, no Funnel, no vendor call for @local.
#
# TWO MEASURED CONSTRAINTS THAT SHAPED IT:
#   * Supabase's REST/auth gateway is 402-restricted until the Aug 23 cycle
#     reset -- but the DIRECT Postgres pooler answered every query all day
#     while sign-ins failed. So this speaks POSTGRES, not REST, and the pane
#     works BEFORE the lockout lifts.
#   * DSM python is 3.8, stdlib-only for root (no pip; per-user site-packages
#     invisible to root -- measured, nas-health 31820238770). Postgres from
#     stdlib means vendoring pg8000 (pure python) into the repo, the exact
#     transcript-trickle pattern. The installer does that; this file only
#     imports it with the vendor dir on sys.path.
#   * Ollama is ALREADY UP on this NAS -- container 'ollama', Up 5 weeks,
#     127.0.0.1:11434, qwen models resident (measured). @local costs $0.
#
# HONESTY RULES (mirror the pane's): a vendor-target row with no key does not
# spin forever -- it FAILS with the why. An Ollama error writes status=failed
# + the error text. Unknown never reads as done (DR-0076).
#
# BRAKES (deterministic class, DR-0248): --max rows per run (budget), a
# single-flight lockfile, and statement timeouts. No kill-switch by law.
#
# Selftest: python3 agent_consumer.py --selftest   (no network, no db)
# Run:      AGENT_DB_URL=postgres://... python3 agent_consumer.py [--max 5]
# =============================================================================
import json
import os
import sys
import time
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, ".vendor"))

OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://127.0.0.1:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "qwen2.5:14b-instruct-q4_K_M")
LOCK_PATH = os.environ.get("AGENT_LOCK", "/tmp/poetech-agent-consumer.lock")

# DR-0210 shapes the voice: prefer the covenant name Yahweh over the generic
# "God" in the model's OWN words (many faiths claim "god"; the house is clear
# about Whom it means), while Scripture quotations stay EXACTLY as written --
# the first live answer (row 1f2da74a, 2026-08-15) said "God" in its own voice
# and rendered KJV's "the LORD" as "Lord", which this steering addresses.
SYSTEM_PROMPT = (
    "You are the PoeTech household's own local model, answering through the "
    "app's Ask-the-models pane. Be truthful, concise, and plain. If you do not "
    "know, say so -- never invent. In your own words, prefer the covenant name "
    "Yahweh over the generic 'God' when naming the Father; when you quote "
    "Scripture, reproduce the translation's text exactly as written (KJV "
    "renders the covenant name 'the LORD') -- never alter a quotation. "
    "Capitalize references to Yahweh and His pronouns per the house rule; "
    "never present guesses as facts.")


def ask_ollama(message, transport=None):
    """Call local Ollama; returns (ok, text). Import-light, injectable."""
    send = transport or _http_transport
    body = {
        "model": OLLAMA_MODEL,
        "prompt": message,
        "system": SYSTEM_PROMPT,
        "stream": False,
        "keep_alive": "0",  # DR-0012: never squat on shared hardware
        "options": {"num_predict": 1024, "temperature": 0.4},
    }
    try:
        raw = send(OLLAMA_URL + "/api/generate", body)
        text = (json.loads(raw).get("response") or "").strip()
        if not text:
            return False, "the local model returned an empty response"
        return True, text
    except Exception as e:  # noqa: BLE001 - the row must record ANY failure
        return False, "local model unreachable: {}".format(e)


def _http_transport(url, body):
    req = urllib.request.Request(
        url, data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=300) as res:
        return res.read().decode("utf-8")


def decide(row, vendor_keys=None):
    """Pure routing verdict for one row. Returns (action, note).
    action: 'answer' (run local) | 'fail' (write error) | 'skip'."""
    keys = vendor_keys or {}
    target = (row.get("target") or "local").lower()
    status = row.get("status")
    if status != "queued":
        return "skip", "not queued"
    if not (row.get("message") or "").strip():
        return "fail", "empty message"
    if target == "local":
        return "answer", None
    if keys.get(target) is True:
        # Vendor execution lands with the keys; until the runner carries them
        # this branch is unreachable in production -- and the tests pin that a
        # keyless vendor row FAILS with the why instead of spinning forever.
        return "answer", None
    return "fail", ("the @{} route is dark -- no API key is provisioned. "
                    "Resend without the prefix to use the local model.").format(target)


def process_once(fetch_queued, mark, answer=ask_ollama, max_rows=5, vendor_keys=None):
    """One braked pass. fetch_queued(limit) -> rows; mark(id, status, result, error)."""
    done = failed = 0
    for row in (fetch_queued(max_rows) or [])[:max_rows]:
        action, note = decide(row, vendor_keys)
        if action == "skip":
            continue
        if action == "fail":
            mark(row["id"], "failed", None, note)
            failed += 1
            continue
        mark(row["id"], "running", None, None)
        ok, text = answer(row["message"])
        if ok:
            mark(row["id"], "done", text, None)
            done += 1
        else:
            mark(row["id"], "failed", None, text)
            failed += 1
    return {"done": done, "failed": failed}


# ----------------------------------------------------------------- db plumbing
CA_PATH = os.path.join(HERE, "supabase-prod-ca-2021.crt")


def build_ssl_context():
    """A VERIFYING TLS context that works on a box with no usable CA store.

    Measured (services-sync cycle 2026-08-15T05:00Z): ssl_context=True made
    pg8000 build Python's default context, and the handshake with the Supabase
    pooler died CERTIFICATE_VERIFY_FAILED -- Supabase signs its database
    endpoints with its own CA ("Supabase Root 2021 CA", the cert the dashboard
    offers for download), which no OS bundle carries, and DSM root's store may
    be empty besides. The fix PINS that CA (committed beside this file,
    sha256 fingerprint 80:70:25:AD:...:CA:FA) and also loads the system store
    where one exists. Verification stays ON; disabling it is not a fix."""
    import ssl
    ctx = ssl.create_default_context()
    if os.path.exists(CA_PATH):
        ctx.load_verify_locations(cafile=CA_PATH)
    return ctx


def db_run(max_rows):
    import pg8000.native  # vendored by install.sh; fails loudly if absent
    url = os.environ.get("AGENT_DB_URL", "")
    if not url:
        print("agent-consumer: AGENT_DB_URL not set -- the installer writes it; nothing to do", file=sys.stderr)
        return 2
    from urllib.parse import urlparse
    u = urlparse(url)
    con = pg8000.native.Connection(
        user=u.username, password=u.password, host=u.hostname,
        port=u.port or 5432, database=(u.path or "/postgres").lstrip("/"),
        ssl_context=build_ssl_context(), timeout=30)
    try:
        con.run("SET statement_timeout = '20s'")

        def fetch_queued(limit):
            rows = con.run(
                "SELECT id::text, message, target, status FROM public.agent_tasks "
                "WHERE kind='chat' AND status='queued' "
                "ORDER BY created_at ASC LIMIT :n FOR UPDATE SKIP LOCKED", n=limit)
            return [{"id": r[0], "message": r[1], "target": r[2], "status": r[3]} for r in rows]

        def mark(task_id, status, result, error):
            con.run(
                "UPDATE public.agent_tasks SET status=:s, result=:r, error=:e "
                "WHERE id=:i::uuid", s=status, r=result, e=error, i=task_id)

        out = process_once(fetch_queued, mark, max_rows=max_rows)
        print("agent-consumer: {}".format(json.dumps(out)))
        return 0
    finally:
        con.close()


# -------------------------------------------------------------------- selftest
def selftest():
    passed = failed = 0

    def check(label, cond):
        nonlocal passed, failed
        if cond:
            passed += 1
            print("PASS " + label)
        else:
            failed += 1
            print("FAIL " + label)

    # decide(): the honesty matrix
    check("queued @local answers", decide({"status": "queued", "target": "local", "message": "hi", "id": "1"})[0] == "answer")
    a, n = decide({"status": "queued", "target": "claude", "message": "hi", "id": "1"})
    check("CATCHES keyless vendor -> FAILS with the why (never spins forever)",
          a == "fail" and "no API key" in n)
    check("a provisioned key opens the vendor branch",
          decide({"status": "queued", "target": "gemini", "message": "hi", "id": "1"}, {"gemini": True})[0] == "answer")
    check("non-queued rows are skipped (idempotent re-runs)",
          decide({"status": "done", "target": "local", "message": "hi", "id": "1"})[0] == "skip")
    check("empty message fails honestly",
          decide({"status": "queued", "target": "local", "message": "  ", "id": "1"})[0] == "fail")

    # process_once(): the braked pass with a fake transport
    marks = []
    rows = [
        {"id": "a", "message": "hello", "target": "local", "status": "queued"},
        {"id": "b", "message": "x", "target": "claude", "status": "queued"},
        {"id": "c", "message": "boom", "target": "local", "status": "queued"},
    ]

    def fake_answer(msg):
        return (False, "local model unreachable: refused") if msg == "boom" else (True, "answer: " + msg)

    out = process_once(lambda n: rows, lambda i, s, r, e: marks.append((i, s, r, e)),
                       answer=fake_answer, max_rows=10)
    check("local row: running then done with the text",
          ("a", "running", None, None) in marks and ("a", "done", "answer: hello", None) in marks)
    check("keyless vendor row failed with the why",
          any(m[0] == "b" and m[1] == "failed" and "no API key" in (m[3] or "") for m in marks))
    check("ollama failure writes failed + the error verbatim",
          any(m[0] == "c" and m[1] == "failed" and "unreachable" in (m[3] or "") for m in marks))
    check("counts are honest", out == {"done": 1, "failed": 2})

    # the budget brake
    many = [{"id": str(i), "message": "m", "target": "local", "status": "queued"} for i in range(50)]
    marks2 = []
    process_once(lambda n: many, lambda i, s, r, e: marks2.append(i), answer=lambda m: (True, "ok"), max_rows=3)
    check("BUDGET: --max caps the pass (3 rows -> 6 marks, never 50)", len(marks2) == 6)

    # ollama call shape: keep_alive 0 rides every request (DR-0012)
    sent = {}

    def spy(url, body):
        sent.update(body)
        return json.dumps({"response": "ok"})
    ask_ollama("test", transport=spy)
    check("every Ollama call carries keep_alive '0' (DR-0012, never squat)", sent.get("keep_alive") == "0")
    check("empty model response reads as FAILURE, not silence",
          ask_ollama("t", transport=lambda u, b: json.dumps({"response": ""}))[0] is False)

    # TLS: the pinned Supabase CA is present, loads, and verification stays ON.
    # Proven-to-catch: get_ca_certs() only lists CAs that actually parsed and
    # loaded, so a missing/corrupt pin fails here BEFORE a cycle burns on the
    # box; and anyone "fixing" TLS by turning verification off trips the last
    # two checks.
    import ssl as _ssl
    check("pinned Supabase CA file is committed beside the consumer",
          os.path.exists(CA_PATH))
    try:
        _ctx = build_ssl_context()
        _loaded = _ctx.get_ca_certs()
        check("pinned CA parses and loads into the context",
              any("Supabase Root 2021 CA" in str(ca.get("subject", "")) for ca in _loaded))
        check("TLS verification is ON (CERT_REQUIRED)", _ctx.verify_mode == _ssl.CERT_REQUIRED)
        check("hostname checking is ON", _ctx.check_hostname is True)
    except Exception as e:  # noqa: BLE001 - a context that cannot build is a FAIL, not a crash
        check("ssl context builds without error ({})".format(e), False)

    print("\n{}/{} passed".format(passed, passed + failed))
    return 1 if failed else 0


def main(argv):
    if "--selftest" in argv:
        return selftest()
    max_rows = int(argv[argv.index("--max") + 1]) if "--max" in argv else 5
    # single-flight lock (brake 2)
    try:
        fd = os.open(LOCK_PATH, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
        os.write(fd, str(os.getpid()).encode())
        os.close(fd)
    except FileExistsError:
        try:  # a lock older than 15 min is a crashed run; break it
            if time.time() - os.path.getmtime(LOCK_PATH) > 900:
                os.unlink(LOCK_PATH)
            print("agent-consumer: SKIP (single-flight lock held)")
            return 0
        except OSError:
            return 0
    try:
        return db_run(max_rows)
    finally:
        try:
            os.unlink(LOCK_PATH)
        except OSError:
            pass


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
