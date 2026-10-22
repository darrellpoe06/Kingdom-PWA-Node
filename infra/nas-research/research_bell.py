#!/usr/bin/env python3
"""research_bell -- the NAS's own clock rings the research lane (DR-1202).

WHY. research-inbox.yml asks GitHub for a run every 15 minutes, and GitHub
throttles scheduled workflows: MEASURED 2026-10-22, the lane had run THREE
times in the six hours since it was armed (runs 39649684705 18:06,
39679980650 21:35, 39697937798 00:09). Darrell's Instagram reel marked Lesson
sat "Waiting to be looked into" with nothing looking. The NAS's services-sync
clock is a real crontab line every 15 minutes (install-clock.sh) and is not
throttled, so the NAS rings: when work waits, it sends ONE repository_dispatch
`research-waiting`, the same way the lesson builder sends `lesson-waiting`.
Two clocks now start the lane -- GitHub's schedule and this bell -- and either
alone is enough.

WHAT COUNTS AS WORK (ids only ever leave this box, never a word):
  * a research item nobody has answered or claimed, or
  * an answered item nothing has been created for yet (research-created /
    research-create-none absent), so a lesson or a build request is still due.

BRAKES (deterministic class, DR-0248: budget + lock). Called once per
services-sync cycle by install.sh, under that runner's lock and timeout.
  * It rings only when the set of waiting ids CHANGED since its last ring, or
    REPEAT_SECONDS (an hour) passed with the same set still waiting -- a stuck
    item is re-rung hourly, never every cycle.
  * At most MAX_PER_DAY rings a day.
  * Every network call has a timeout; a failure is printed, never raised.

Run:  python3 research_bell.py            (on the NAS)
      python3 research_bell.py --selftest (offline, stdlib)
"""
import json
import os
import sys
import time
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
SECRETS = os.environ.get("RESEARCH_BELL_SECRETS", "/volume1/PoeTech/secrets/supabase.json")
TOKEN_FILE = os.environ.get("RESEARCH_BELL_TOKEN_FILE", "/volume1/PoeTech/secrets/github-token.txt")
STATE = os.environ.get("RESEARCH_BELL_STATE", "/volume1/PoeTech/research/bell-state.json")
REPO = os.environ.get("RESEARCH_BELL_REPO", "darrellpoe06/Kingdom-PWA-Node")
EVENT = "research-waiting"
REPEAT_SECONDS = int(os.environ.get("RESEARCH_BELL_REPEAT_SECONDS", "3600"))
MAX_PER_DAY = int(os.environ.get("RESEARCH_BELL_MAX_PER_DAY", "60"))
TIMEOUT = 20


def is_child(tags):
    return any(str(t).startswith("of:") for t in (tags or []))


def waiting_ids(rows):
    """The parent research rows the lane still owes work, sorted."""
    out = []
    for r in rows or []:
        tags = r.get("tags") or []
        if "research" not in tags or is_child(tags):
            continue
        answered = "research-answered" in tags
        if not answered and "research-claimed" not in tags:
            out.append(r.get("id"))
        elif answered and "research-created" not in tags and "research-create-none" not in tags:
            out.append(r.get("id"))
    return sorted(i for i in out if isinstance(i, str))


def should_ring(ids, state, now):
    """(ring, why). Pure."""
    if not ids:
        return False, "nothing waits"
    day = time.strftime("%Y-%m-%d", time.gmtime(now))
    rung_today = state.get("count", 0) if state.get("day") == day else 0
    if rung_today >= MAX_PER_DAY:
        return False, "the day's %d rings are spent" % MAX_PER_DAY
    if state.get("key") != ",".join(ids):
        return True, "new work waits"
    if now - float(state.get("at", 0)) >= REPEAT_SECONDS:
        return True, "the same work still waits after an hour"
    return False, "already rung for this work"


def after_ring(ids, state, now):
    day = time.strftime("%Y-%m-%d", time.gmtime(now))
    count = (state.get("count", 0) if state.get("day") == day else 0) + 1
    return {"key": ",".join(ids), "at": now, "day": day, "count": count}


def read_rows(url, key, opener=urllib.request.urlopen):
    q = urllib.parse.urlencode({"select": "id,tags", "tags": 'cs.["research"]', "order": "created_at.desc", "limit": "300"})
    req = urllib.request.Request(url.rstrip("/") + "/rest/v1/agent_inbox?" + q)
    req.add_header("apikey", key)
    req.add_header("Authorization", "Bearer " + key)
    with opener(req, timeout=TIMEOUT) as res:
        return json.loads(res.read().decode("utf-8") or "[]")


def dispatch(ids, token_file=TOKEN_FILE, repo=REPO, opener=urllib.request.urlopen):
    try:
        with open(token_file) as f:
            token = f.read().strip()
    except OSError:
        return False, "no push credential at " + token_file
    body = json.dumps({"event_type": EVENT, "client_payload": {"source": "nas-research-bell", "ids": ids[:50]}}).encode("utf-8")
    req = urllib.request.Request("https://api.github.com/repos/%s/dispatches" % repo, data=body, method="POST")
    req.add_header("Authorization", "Bearer " + token)
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("Content-Type", "application/json")
    try:
        with opener(req, timeout=TIMEOUT) as res:
            return 200 <= res.status < 300, res.status
    except Exception as e:  # noqa: BLE001 -- a bell that cannot ring says why
        return False, str(e)[:200]


def load_state(path=STATE):
    try:
        with open(path) as f:
            s = json.load(f)
        return s if isinstance(s, dict) else {}
    except (OSError, ValueError):
        return {}


def save_state(state, path=STATE):
    try:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w") as f:
            json.dump(state, f)
    except OSError as e:
        print("research-bell: could not keep its state (%s)" % e)


def run_once(now=None):
    now = time.time() if now is None else now
    sys.path.insert(0, os.path.join(HERE, "..", "nas-supabase"))
    try:
        from sovereign_target import resolve_target  # noqa: PLC0415
        _source, url, key = resolve_target(SECRETS)
    except Exception as e:  # noqa: BLE001
        return {"rang": False, "why": "no database credential (%s)" % str(e)[:120]}
    if not (url and key):
        return {"rang": False, "why": "no database credential on this NAS"}
    try:
        ids = waiting_ids(read_rows(url, key))
    except Exception as e:  # noqa: BLE001
        return {"rang": False, "why": "could not read the research rows (%s)" % str(e)[:160]}
    state = load_state()
    ring, why = should_ring(ids, state, now)
    if not ring:
        return {"rang": False, "why": why, "waiting": len(ids)}
    ok, status = dispatch(ids)
    if ok:
        save_state(after_ring(ids, state, now))
    return {"rang": bool(ok), "why": why if ok else "the ring failed: %s" % status, "waiting": len(ids)}


def selftest():
    checks = []

    def check(name, cond):
        checks.append((name, bool(cond)))

    rows = [
        {"id": "a", "tags": ["research"]},                                   # waiting
        {"id": "b", "tags": ["research", "research-claimed"]},               # being looked into
        {"id": "c", "tags": ["research", "research-answered"]},              # create still due
        {"id": "d", "tags": ["research", "research-answered", "research-created"]},
        {"id": "e", "tags": ["research", "research-answered", "research-create-none"]},
        {"id": "f", "tags": ["research-answer", "of:a"]},                    # a child, never work
        {"id": "g", "tags": ["lesson"]},                                     # not research
    ]
    check("waiting and create-due rows are work; the rest are not", waiting_ids(rows) == ["a", "c"])
    now = 1_800_000_000.0
    check("nothing waits -> no ring", should_ring([], {}, now) == (False, "nothing waits"))
    check("new work rings", should_ring(["a"], {}, now)[0] is True)
    st = after_ring(["a"], {}, now)
    check("the same work is not re-rung inside the hour", should_ring(["a"], st, now + 900)[0] is False)
    check("the same work is re-rung after an hour", should_ring(["a"], st, now + REPEAT_SECONDS)[0] is True)
    check("different work rings at once", should_ring(["a", "c"], st, now + 60)[0] is True)
    spent = {"key": "x", "at": now, "day": time.strftime("%Y-%m-%d", time.gmtime(now)), "count": MAX_PER_DAY}
    check("the day's cap holds", should_ring(["a"], spent, now + 10)[0] is False)

    class Res:
        def __init__(self, status, body=b"[]"):
            self.status, self.body = status, body

        def read(self):
            return self.body

        def __enter__(self):
            return self

        def __exit__(self, *a):
            return False

    sent = {}

    def opener(req, timeout):
        sent["url"], sent["data"], sent["auth"] = req.full_url, req.data, req.get_header("Authorization")
        return Res(204)

    import tempfile
    tok = tempfile.NamedTemporaryFile("w", delete=False)
    tok.write("t0ken")
    tok.close()
    ok, status = dispatch(["a", "c"], token_file=tok.name, opener=opener)
    payload = json.loads(sent["data"].decode())
    check("the ring is a repository_dispatch research-waiting", ok and sent["url"].endswith("/dispatches") and payload["event_type"] == "research-waiting")
    check("the ring carries ids only, never a word", payload["client_payload"] == {"source": "nas-research-bell", "ids": ["a", "c"]})
    check("the ring is authorised by the token file", sent["auth"] == "Bearer t0ken")
    os.unlink(tok.name)
    check("no token file says so", dispatch(["a"], token_file="/nonexistent/token")[0] is False)

    got = {}

    def reader(req, timeout):
        got["url"] = req.full_url
        return Res(200, b'[{"id":"a","tags":["research"]}]')
    check("the read asks for ids and tags only", read_rows("https://db.example", "k", opener=reader) == [{"id": "a", "tags": ["research"]}]
          and "select=id%2Ctags" in got["url"] and "body" not in got["url"])

    bad = [n for n, ok in checks if not ok]
    for n, ok in checks:
        print(("ok   " if ok else "FAIL ") + n)
    if bad:
        print("RESEARCH BELL SELFTEST: FAIL (%d)" % len(bad))
        return 1
    print("RESEARCH BELL SELFTEST: OK (%d checks)" % len(checks))
    return 0


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        sys.exit(selftest())
    print(json.dumps(run_once()))
