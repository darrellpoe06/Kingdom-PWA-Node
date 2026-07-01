#!/usr/bin/env python3
# =============================================================================
# loop.py -- the NAS-resident, always-on, DETERMINISTIC build heartbeat.
# =============================================================================
# WHY THIS EXISTS (Darrell's diagnosis, 2026-07-01, grounded and correct):
# build throughput tracks his WAKING activity because the merge/deploy chain
# only fires on events HE generates (pushes, PR events, Dispatch/desktop app
# sessions). The always-on NAS (DS1621xs, 192.168.1.26) must BE the listener
# and the driver -- independent of the desktop app and of Darrell being awake.
# Offline/overnight hours must be prime production time.
#
# WHAT IT DOES (and, as importantly, what it does NOT):
# The merge/migrate/deploy automation ALREADY EXISTS and is proven:
#   - .github/workflows/auto-merge.yml enables GitHub NATIVE auto-merge (squash)
#     on every eligible PR; GitHub then merges each the instant required checks
#     pass -- respecting branch protection, never bypassing it.
#   - .github/workflows/db-migrate.yml applies idempotent migrations using the
#     SUPABASE_DB_URL secret that already lives in GitHub Actions.
#   - Vercel auto-deploys on every push to main.
# The ONLY gap is that auto-merge.yml fires on Darrell's activity, not on a
# clock. So this loop is the HEARTBEAT that drives the existing, proven,
# protection-respecting automation 24/7. It is NOT a second merge engine.
#
# Each cycle, bounded and idempotent, it:
#   1. Passes the THREE BRAKES or exits inert (see below).
#   2. (best-effort) fetches the sovereign mirror of the repo on the NAS.
#   3. Lists open PRs targeting main; computes the eligible set with the SAME
#      filter auto-merge.yml uses (non-draft, head ~ ^(feat|fix|merge|docs)/,
#      not labeled `hold`).
#   4. If any eligible PR does not yet have auto-merge enabled -> DISPATCHES
#      auto-merge.yml (one dispatch enables all). This is the heartbeat.
#   5. For up to a capped number of trivially-BEHIND eligible PRs -> calls the
#      GitHub update-branch API (the API-safe equivalent of "rebase trivial
#      conflicts and push"; true DIRTY conflicts are NOT touched -- they are
#      flagged for the separate local-LLM judgment lane).
#   6. Writes an append-only JSONL reel line (observability) and releases lock.
# It never merges directly, never force-pushes, never creates/deletes branches,
# never moves money, never messages minors, never touches RLS, never handles
# the DB or Vercel keys. Its scope is these constants; it cannot widen them.
#
# THE THREE BRAKES (CLAUDE.md "Autonomous Automation Requires Three Brakes"):
#   1. BUDGET  -- per-day caps on the only two write actions (dispatches,
#                 update-branch calls) + a per-cycle wall-clock deadline +
#                 systemd TimeoutStartSec backstop. A cap reached = action
#                 skipped, never exceeded.
#   2. LOCK    -- single-flight lockdir (atomic mkdir). A fire that finds the
#                 lock held SKIPS; it never stacks. Stale locks (older than
#                 STALE_LOCK_SECONDS) are broken once, logged.
#   3. KILL    -- the STOP file forces immediate inert exit (one touch halts the
#                 loop). PLUS the ARMED file must be PRESENT to act: the loop
#                 SHIPS INERT and is armed once, deliberately, by hand, with
#                 someone watching.
#
# Python 3.8 stdlib only (the NAS has no node, no gh, no pip packages assumed).
# Run one cycle:      python3 loop.py
# Prove the brakes:   python3 loop.py --selftest
# =============================================================================

import json
import os
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone

# ---- fixed scope (this loop cannot widen these; that is the point) ----------
OWNER = "darrellpoe06"
REPO = "Kingdom-PWA-Node"
BASE_BRANCH = "main"
ELIGIBLE_PREFIXES = ("feat/", "fix/", "merge/", "docs/")
HOLD_LABEL = "hold"
AUTOMERGE_WORKFLOW = "auto-merge.yml"

# ---- budgets (the BUDGET brake) ---------------------------------------------
MAX_DISPATCHES_PER_DAY = 48      # one dispatch enables auto-merge on ALL eligible PRs
MAX_UPDATES_PER_DAY = 20         # trivially-behind PR branch updates
MAX_UPDATES_PER_CYCLE = 3        # never storm CI in a single cycle
CYCLE_DEADLINE_SECONDS = 240     # soft wall-clock ceiling; systemd is the hard backstop
STALE_LOCK_SECONDS = 1800        # break a lock older than 30 min (a dead prior run)
HTTP_TIMEOUT = 30

# ---- paths (NAS-resident; token used in place, never printed) ----------------
HOME = "/volume1/homes/dpoe/poetech-build"
STATE = os.path.join(HOME, "state")
LOCKDIR = os.path.join(STATE, "lock")
COUNTER_FILE = os.path.join(STATE, "counter.json")
REEL_FILE = os.path.join(STATE, "reel.jsonl")
LASTCYCLE_FILE = os.path.join(STATE, "last-cycle.json")
LOG_FILE = os.path.join(STATE, "cycle.log")
STOP_FILE = os.path.join(HOME, "STOP")        # kill-switch: present => inert
ARMED_FILE = os.path.join(HOME, "ARMED")      # must be present to act; ships absent
TOKEN_FILE = "/volume1/PoeTech/secrets/github-token.txt"
MIRROR_DIR = os.path.join(HOME, "repo")       # best-effort sovereign clone
# optional Dispatch Status mirror. NOTE: this dir is owned by the n8n container
# (uid 1000); dpoe (uid 1026) cannot write it, so this mirror currently no-ops
# and the sovereign reel at state/reel.jsonl is the record. Wiring these runs
# into Dispatch Status needs a permission bridge -- tracked follow-up (see DR-0080).
BRIEFING_REEL = "/volume1/PoeTech/poetech-briefing/_reel.jsonl"


def now_iso():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def today_str():
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def log(msg):
    line = "%s %s" % (now_iso(), msg)
    print(line, flush=True)
    try:
        os.makedirs(STATE, exist_ok=True)
        with open(LOG_FILE, "a") as f:
            f.write(line + "\n")
    except Exception:
        pass


# =============================================================================
# THE THREE BRAKES -- kept as pure, testable predicates (proven-to-catch,
# DR-0076). brake_decision() is a deterministic function of its inputs.
# =============================================================================
def brake_decision(stop_present, armed_present, lock_held,
                   dispatches_today, updates_today):
    """Return (go: bool, reason: str). GO only when every brake is satisfied."""
    if stop_present:
        return (False, "inert: kill-switch engaged (STOP file present)")
    if not armed_present:
        return (False, "inert: not armed (ARMED file absent; ships inert)")
    if lock_held:
        return (False, "skip: single-flight lock held (a prior cycle is running)")
    if dispatches_today >= MAX_DISPATCHES_PER_DAY and updates_today >= MAX_UPDATES_PER_DAY:
        return (False, "skip: daily budget exhausted (dispatches and updates both capped)")
    return (True, "go")


# ---- lock (atomic mkdir single-flight) --------------------------------------
def acquire_lock():
    """Return True if we hold the lock. Break a stale lock once."""
    try:
        os.makedirs(STATE, exist_ok=True)
        os.mkdir(LOCKDIR)
        with open(os.path.join(LOCKDIR, "pid"), "w") as f:
            f.write("%d %s" % (os.getpid(), now_iso()))
        return True
    except FileExistsError:
        try:
            age = time.time() - os.path.getmtime(LOCKDIR)
        except OSError:
            age = 0
        if age > STALE_LOCK_SECONDS:
            log("lock: breaking stale lock (age %ds > %ds)" % (int(age), STALE_LOCK_SECONDS))
            try:
                shutil.rmtree(LOCKDIR)
                os.mkdir(LOCKDIR)
                with open(os.path.join(LOCKDIR, "pid"), "w") as f:
                    f.write("%d %s" % (os.getpid(), now_iso()))
                return True
            except Exception as e:
                log("lock: could not break stale lock: %s" % e)
                return False
        return False


def release_lock():
    try:
        shutil.rmtree(LOCKDIR)
    except Exception:
        pass


# ---- budget counter (per-day) -----------------------------------------------
def load_counter():
    try:
        with open(COUNTER_FILE) as f:
            c = json.load(f)
        if c.get("date") != today_str():
            return {"date": today_str(), "dispatches": 0, "updates": 0}
        return {"date": c["date"], "dispatches": int(c.get("dispatches", 0)),
                "updates": int(c.get("updates", 0))}
    except Exception:
        return {"date": today_str(), "dispatches": 0, "updates": 0}


def save_counter(c):
    try:
        with open(COUNTER_FILE, "w") as f:
            json.dump(c, f)
    except Exception as e:
        log("counter: save failed: %s" % e)


# ---- reel (append-only JSONL; same shape as the Dispatch Status reel) --------
def reel(rec):
    rec = dict(rec)
    rec.setdefault("ts", now_iso())
    rec.setdefault("node", "nas-DS1621xs")
    rec.setdefault("agent", "nas-build-loop")
    line = json.dumps(rec)
    for path in (REEL_FILE, BRIEFING_REEL):
        try:
            d = os.path.dirname(path)
            if path == BRIEFING_REEL and not os.path.isdir(d):
                continue  # only mirror to briefing dir if it already exists
            os.makedirs(d, exist_ok=True)
            with open(path, "a") as f:
                f.write(line + "\n")
        except Exception:
            pass


# =============================================================================
# GitHub REST API (stdlib urllib; token read from the NAS-resident secret in
# place -- never logged, never written elsewhere).
# =============================================================================
def read_token():
    with open(TOKEN_FILE) as f:
        return f.read().strip()


def gh_api(token, method, path, body=None):
    """Return (status_int, parsed_json_or_None). Never raises; caller checks status."""
    url = "https://api.github.com" + path
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("Authorization", "Bearer " + token)
    req.add_header("X-GitHub-Api-Version", "2022-11-28")
    req.add_header("User-Agent", "poetech-nas-build-loop")
    if data is not None:
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=HTTP_TIMEOUT) as resp:
            raw = resp.read().decode()
            return (resp.status, json.loads(raw) if raw.strip() else None)
    except urllib.error.HTTPError as e:
        try:
            payload = json.loads(e.read().decode())
        except Exception:
            payload = None
        return (e.code, payload)
    except Exception as e:
        log("gh_api %s %s failed: %s" % (method, path, e))
        return (0, None)


def list_open_prs(token):
    prs = []
    page = 1
    while page <= 5:  # bounded: at most 500 open PRs considered
        status, data = gh_api(
            token, "GET",
            "/repos/%s/%s/pulls?state=open&base=%s&per_page=100&page=%d"
            % (OWNER, REPO, BASE_BRANCH, page))
        if status != 200 or not data:
            break
        prs.extend(data)
        if len(data) < 100:
            break
        page += 1
    return prs


def is_eligible(pr):
    if pr.get("draft"):
        return False
    head = (pr.get("head") or {}).get("ref", "")
    if not head.startswith(ELIGIBLE_PREFIXES):
        return False
    for lbl in pr.get("labels", []):
        if lbl.get("name") == HOLD_LABEL:
            return False
    return True


# =============================================================================
# sovereign mirror (best-effort; the core loop does NOT depend on it) --------
# Keeps a current clone of the repo on the NAS -- sovereignty + a base for
# future local deterministic checks. Token supplied via a 0600 config file
# (GIT_CONFIG_GLOBAL) so it never lands in the remote URL or the process args.
# =============================================================================
def git_env():
    """Auth via GIT_ASKPASS reading the secret in place: the token never lands
    in the remote URL, in the process args, or in a config file."""
    askpass = os.path.join(STATE, "askpass.sh")
    try:
        with open(askpass, "w") as f:
            f.write("#!/bin/sh\ncat %s\n" % TOKEN_FILE)
        os.chmod(askpass, 0o700)
    except Exception as e:
        log("mirror: could not write askpass helper: %s" % e)
        return None
    env = dict(os.environ)
    env["GIT_ASKPASS"] = askpass
    env["GIT_TERMINAL_PROMPT"] = "0"
    env["HOME"] = "/var/services/homes/dpoe"
    return env


def sovereign_mirror(token):
    env = git_env()
    if env is None:
        return "mirror: skipped (no git env)"
    # username in the URL, password (the token) supplied by GIT_ASKPASS.
    url = "https://x-access-token@github.com/%s/%s.git" % (OWNER, REPO)
    try:
        if not os.path.isdir(os.path.join(MIRROR_DIR, ".git")):
            r = subprocess.run(["git", "clone", "--depth", "50", url, MIRROR_DIR],
                               env=env, capture_output=True, timeout=180)
            if r.returncode != 0:
                return "mirror: clone failed (rc=%d)" % r.returncode
            return "mirror: cloned"
        r = subprocess.run(["git", "-C", MIRROR_DIR, "fetch", "--prune", "origin"],
                           env=env, capture_output=True, timeout=120)
        if r.returncode != 0:
            return "mirror: fetch failed (rc=%d)" % r.returncode
        subprocess.run(["git", "-C", MIRROR_DIR, "reset", "--hard", "origin/" + BASE_BRANCH],
                       env=env, capture_output=True, timeout=60)
        return "mirror: fetched"
    except subprocess.TimeoutExpired:
        return "mirror: timeout"
    except Exception as e:
        return "mirror: error %s" % e


# =============================================================================
# one cycle
# =============================================================================
def run_cycle():
    start = time.time()

    stop_present = os.path.exists(STOP_FILE)
    armed_present = os.path.exists(ARMED_FILE)

    # LOCK first among the write-guarding brakes so we never stack cycles.
    have_lock = False
    lock_held = False
    if not stop_present and armed_present:
        have_lock = acquire_lock()
        lock_held = not have_lock

    counter = load_counter()
    go, reason = brake_decision(stop_present, armed_present, lock_held,
                                counter["dispatches"], counter["updates"])
    if not go:
        log("brake: %s" % reason)
        reel({"event": "brake", "ok": True, "detail": reason})
        if have_lock:
            release_lock()
        return

    try:
        token = read_token()
    except Exception as e:
        log("token: cannot read %s (%s)" % (TOKEN_FILE, e))
        reel({"event": "error", "ok": False,
              "detail": "no github token at %s" % TOKEN_FILE})
        release_lock()
        return

    summary = {
        "event": "cycle", "ok": True,
        "eligible": 0, "clean": 0, "behind": 0, "dirty": 0,
        "blocked": 0, "unknown": 0, "needs_enable": 0,
        "dispatched": 0, "updated": 0, "mirror": "", "detail": "",
    }

    # 2. sovereign mirror (best-effort)
    summary["mirror"] = sovereign_mirror(token)

    # 3. list + classify eligible PRs
    prs = list_open_prs(token)
    eligible = [p for p in prs if is_eligible(p)]
    summary["eligible"] = len(eligible)

    behind_prs = []
    needs_enable = 0
    dirty_numbers = []
    for p in eligible:
        if time.time() - start > CYCLE_DEADLINE_SECONDS:
            summary["detail"] = "cycle deadline hit during classification"
            break
        n = p["number"]
        status, detail = gh_api(token, "GET",
                                "/repos/%s/%s/pulls/%d" % (OWNER, REPO, n))
        if status != 200 or not detail:
            summary["unknown"] += 1
            continue
        state = detail.get("mergeable_state")   # clean|behind|dirty|blocked|unstable|unknown
        auto_merge = detail.get("auto_merge")
        if auto_merge is None:
            needs_enable += 1
        if state == "clean":
            summary["clean"] += 1
        elif state == "behind":
            summary["behind"] += 1
            behind_prs.append(n)
        elif state == "dirty":
            summary["dirty"] += 1
            dirty_numbers.append(n)
        elif state == "blocked":
            summary["blocked"] += 1
        else:
            summary["unknown"] += 1
    summary["needs_enable"] = needs_enable

    # 4. HEARTBEAT: dispatch the proven auto-merge sweep if any eligible PR is
    #    not yet enabled and we are under the daily dispatch cap.
    if needs_enable > 0 and counter["dispatches"] < MAX_DISPATCHES_PER_DAY:
        st, _ = gh_api(token, "POST",
                       "/repos/%s/%s/actions/workflows/%s/dispatches"
                       % (OWNER, REPO, AUTOMERGE_WORKFLOW),
                       {"ref": BASE_BRANCH})
        if st in (201, 204):
            counter["dispatches"] += 1
            summary["dispatched"] = 1
            log("dispatched %s (%d eligible PRs needed enable)" % (AUTOMERGE_WORKFLOW, needs_enable))
        else:
            log("dispatch %s returned HTTP %s" % (AUTOMERGE_WORKFLOW, st))

    # 5. update-branch on trivially-behind PRs (bounded). Never touches DIRTY.
    for n in behind_prs[:MAX_UPDATES_PER_CYCLE]:
        if counter["updates"] >= MAX_UPDATES_PER_DAY:
            log("update-branch: daily cap reached, skipping remaining")
            break
        if time.time() - start > CYCLE_DEADLINE_SECONDS:
            break
        st, _ = gh_api(token, "PUT",
                       "/repos/%s/%s/pulls/%d/update-branch" % (OWNER, REPO, n))
        if st in (202,):
            counter["updates"] += 1
            summary["updated"] += 1
            log("update-branch #%d (behind -> updating; CI will re-run)" % n)
        else:
            log("update-branch #%d returned HTTP %s" % (n, st))

    save_counter(counter)

    dur = int((time.time() - start) * 1000)
    summary["duration_ms"] = dur
    if dirty_numbers:
        summary["dirty_prs"] = dirty_numbers  # flagged for the local-LLM judgment lane
    if not summary["detail"]:
        summary["detail"] = (
            "eligible=%d clean=%d behind=%d dirty=%d blocked=%d | "
            "dispatched=%d updated=%d | budget d=%d/%d u=%d/%d"
            % (summary["eligible"], summary["clean"], summary["behind"],
               summary["dirty"], summary["blocked"], summary["dispatched"],
               summary["updated"], counter["dispatches"], MAX_DISPATCHES_PER_DAY,
               counter["updates"], MAX_UPDATES_PER_DAY))

    log("cycle: %s (%dms)" % (summary["detail"], dur))
    reel(summary)
    try:
        with open(LASTCYCLE_FILE, "w") as f:
            json.dump(summary, f, indent=2)
    except Exception:
        pass
    release_lock()


# =============================================================================
# selftest -- prove the brakes CATCH (anti-theater, DR-0076). No network.
# =============================================================================
def selftest():
    ok = True

    def check(name, cond):
        nonlocal ok
        print(("PASS " if cond else "FAIL ") + name)
        if not cond:
            ok = False

    # kill-switch beats everything
    go, r = brake_decision(True, True, False, 0, 0)
    check("STOP file forces inert", (not go) and "kill-switch" in r)
    # not armed => inert
    go, r = brake_decision(False, False, False, 0, 0)
    check("absent ARMED forces inert", (not go) and "not armed" in r)
    # lock held => skip
    go, r = brake_decision(False, True, True, 0, 0)
    check("held lock forces skip", (not go) and "lock held" in r)
    # both budgets exhausted => skip
    go, r = brake_decision(False, True, False, MAX_DISPATCHES_PER_DAY, MAX_UPDATES_PER_DAY)
    check("exhausted budget forces skip", (not go) and "budget" in r)
    # all brakes clear => go
    go, r = brake_decision(False, True, False, 0, 0)
    check("all brakes clear => go", go)
    # STOP wins even when armed and lock free
    go, r = brake_decision(True, True, False, 0, 0)
    check("STOP wins over armed+free", not go)

    # eligibility filter
    def pr(ref, draft=False, labels=None):
        return {"draft": draft, "head": {"ref": ref},
                "labels": [{"name": x} for x in (labels or [])]}
    check("feat/ eligible", is_eligible(pr("feat/x")))
    check("fix/ eligible", is_eligible(pr("fix/x")))
    check("docs/ eligible", is_eligible(pr("docs/x")))
    check("chore/ NOT eligible", not is_eligible(pr("chore/x")))
    check("draft NOT eligible", not is_eligible(pr("feat/x", draft=True)))
    check("hold label NOT eligible", not is_eligible(pr("feat/x", labels=["hold"])))

    print("\nSELFTEST " + ("PASSED" if ok else "FAILED"))
    return 0 if ok else 1


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        sys.exit(selftest())
    run_cycle()
