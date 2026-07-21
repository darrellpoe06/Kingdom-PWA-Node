#!/usr/bin/env python3
# =============================================================================
# nas-ways / ways_ingest — the sovereign "Ways brain" parser
# =============================================================================
# Darrell 2026-07-21: the Ways (CLAUDE.md, docs/decisions, PRINCIPLES.md) reach
# the running app only via a build-time snapshot, and nothing reads/acts on their
# CONTENT continuously when the Claude Code agent isn't in session. This is the
# sovereign fix's DATA half: a deterministic, stdlib-only parser that turns the
# repo's Ways documents into ONE queryable JSON brain (`ways-brain.json`) — the
# binding principles, the decision ledger (with `re-review:` dates), and the open
# re-review backlog — so the app can serve them LIVE (updated whenever this runs
# on the NAS, not only at build) and the NAS loops can ground themselves against
# the CURRENT Ways. Same DR-0083 sovereign-Python lane as review_server /
# photo_server / ollama_health.
#
# RUNS BY DEFAULT (DR-0186): this is the bounded, single-shot, idempotent,
# spawns-no-compute-and-no-LLM class — one run parses the docs and writes one JSON
# file, then exits; it cannot loop (the scheduler is the clock) and never writes
# into the repo. DR-0186 is explicit that this class RUNS and writes to production
# the moment it is fired — "the over-braking WAS the failure… you did nothing
# today." So it ships ENABLED (see the README's systemd units), NOT behind an
# arming ceremony. It is NOT the 2026-06-06 runaway class (which LOOPED and
# SPAWNED compute/LLM unattended).
#
# The three brakes STAY (DR-0083, unchanged) — they prevent MALFUNCTION, and none
# of them gates a normal run:
#   * Budget       — a wall-clock ceiling (WAYS_TIMEOUT_SEC, default 120s) kills
#                    an overrun via SIGALRM.
#   * Concurrency  — a single-flight mkdir lock; a fire that finds a run live SKIPS.
#   * Kill-switch  — `touch <state>/KILL_SWITCH` halts it instantly; it ships
#                    ABSENT, so the resting state is RUNNING, not inert.
#
# MODES:
#   ways_ingest.py --run --repo <repo-root> --out <path/to/ways-brain.json>
#   ways_ingest.py --selftest       # offline logic checks (tempdir; no repo)
# =============================================================================
import argparse
import json
import os
import re
import signal
import sys
from datetime import datetime, timezone

PRINCIPLE_RE = re.compile(r"^\|\s*\*\*([A-Z0-9][A-Z0-9-]*)\*\*\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*$")
DR_FILE_RE = re.compile(r"^DR-(\d{4})-.+\.md$")
RE_REVIEW_RE = re.compile(r"re-review(?:ed|s)?\s*(?:by|on|:)?\s*(\d{4})-(\d{2})-(\d{2})", re.IGNORECASE)
FRONT_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)
MAX_DOC_BYTES = 512 * 1024  # a single Ways doc is never legitimately larger


def _read(path):
    try:
        with open(path, "r", encoding="utf-8") as fh:
            return fh.read(MAX_DOC_BYTES + 1)
    except OSError:
        return ""


def parse_principles(text):
    """PRINCIPLES.md registry rows -> [{id, summary, source}] (header/--- skipped
    because the first cell must be **BOLD-ID**). Faithful to vite's readPrinciples."""
    out = []
    for line in (text or "").split("\n"):
        m = PRINCIPLE_RE.match(line)
        if not m:
            continue
        out.append({
            "id": m.group(1).strip(),
            "summary": m.group(2).strip(),
            "source": m.group(3).replace("`", "").strip(),
        })
    return out


def _front_field(front, key):
    m = re.search(r"^%s:\s*(.+)$" % re.escape(key), front, re.MULTILINE)
    return m.group(1).strip().strip('"') if m else ""


def parse_decision(fname, text):
    """One DR file -> {id, num, title, status, tier, date, re_reviews:[...]}. Uses
    the front-matter for the metadata and scans the whole body for re-review dates."""
    fm = DR_FILE_RE.match(fname)
    num = int(fm.group(1)) if fm else None
    front = ""
    fmatch = FRONT_RE.match(text or "")
    if fmatch:
        front = fmatch.group(1)
    re_reviews = sorted({"%s-%s-%s" % (m.group(1), m.group(2), m.group(3)) for m in RE_REVIEW_RE.finditer(text or "")})
    return {
        "id": _front_field(front, "id") or ("DR-%04d" % num if num is not None else ""),
        "num": num,
        "title": _front_field(front, "title"),
        "status": _front_field(front, "status").lower(),
        "tier": _front_field(front, "tier"),
        "date": _front_field(front, "date"),
        "re_reviews": re_reviews,
    }


def build_brain(repo_root, now):
    """Parse the Ways docs under repo_root into the brain dict. Best-effort: a
    missing file contributes nothing; the run never raises on doc problems."""
    dec_dir = os.path.join(repo_root, "docs", "decisions")

    principles = parse_principles(_read(os.path.join(dec_dir, "PRINCIPLES.md")))

    decisions = []
    try:
        names = sorted(os.listdir(dec_dir))
    except OSError:
        names = []
    for f in names:
        if not DR_FILE_RE.match(f):
            continue
        decisions.append(parse_decision(f, _read(os.path.join(dec_dir, f))))
    decisions.sort(key=lambda d: (d["num"] if d["num"] is not None else -1), reverse=True)

    # The open re-review backlog: every dated commitment across the DR files,
    # de-duplicated by (id, date), sorted by date (soonest first).
    backlog = {}
    for d in decisions:
        for date in d["re_reviews"]:
            backlog[(d["id"], date)] = {"id": d["id"], "date": date, "title": d["title"]}
    open_re_reviews = sorted(backlog.values(), key=lambda x: x["date"])

    return {
        "ok": True,
        "generated_at": now.isoformat().replace("+00:00", "Z"),
        "principles": principles,
        "decisions": decisions,
        "open_re_reviews": open_re_reviews,
        "counts": {
            "principles": len(principles),
            "decisions": len(decisions),
            "open_re_reviews": len(open_re_reviews),
        },
    }


DEFAULT_TIMEOUT_SEC = 120


def state_dir(args):
    return args.state or os.path.join(os.path.dirname(os.path.realpath(args.out)) or ".", ".ways-state")


def kill_present(state):
    """Kill-switch check (DR-0186). Ships ABSENT -> resting state is RUNNING."""
    return os.path.exists(os.path.join(state, "KILL_SWITCH"))


def acquire_lock(state):
    """Single-flight mkdir lock. True if acquired; False if a run is already live
    (a stacked fire SKIPS). mkdir is atomic on POSIX, so this can't race."""
    try:
        os.mkdir(os.path.join(state, "run.lock"))
        return True
    except FileExistsError:
        return False


def release_lock(state):
    try:
        os.rmdir(os.path.join(state, "run.lock"))
    except OSError:
        pass


def run(args):
    repo = os.path.realpath(args.repo)
    if not os.path.isdir(os.path.join(repo, "docs", "decisions")):
        print("REFUSING: %s is not a repo root (no docs/decisions)" % repo, file=sys.stderr)
        sys.exit(2)

    state = state_dir(args)
    os.makedirs(state, exist_ok=True)

    # Brake 3 — KILL-SWITCH (ships absent; a touch halts). Resting state = running.
    if kill_present(state):
        print("ways-brain: KILL_SWITCH present -> halting (remove %s/KILL_SWITCH to resume)" % state)
        sys.exit(0)

    # Brake 2 — CONCURRENCY: a fire that finds a run live SKIPS (never stacks).
    if not acquire_lock(state):
        print("ways-brain: a run is already in progress -> skipping this fire")
        sys.exit(0)

    # Brake 1 — BUDGET: a wall-clock ceiling kills an overrun.
    timeout = int(os.environ.get("WAYS_TIMEOUT_SEC", str(DEFAULT_TIMEOUT_SEC)))
    if hasattr(signal, "SIGALRM"):
        signal.signal(signal.SIGALRM, lambda *_: (_ for _ in ()).throw(TimeoutError("ways-brain exceeded %ds budget" % timeout)))
        signal.alarm(max(1, timeout))
    try:
        brain = build_brain(repo, datetime.now(timezone.utc))
        out = os.path.realpath(args.out)
        os.makedirs(os.path.dirname(out) or ".", exist_ok=True)
        tmp = out + ".tmp"
        # Atomic write so a reader never sees a half-written brain (idempotent:
        # same docs -> same bytes, modulo generated_at).
        with open(tmp, "w", encoding="utf-8") as fh:
            json.dump(brain, fh, ensure_ascii=False, separators=(",", ":"))
        os.replace(tmp, out)
        print("ways-brain: %d principles, %d decisions, %d open re-reviews -> %s"
              % (brain["counts"]["principles"], brain["counts"]["decisions"],
                 brain["counts"]["open_re_reviews"], out))
    finally:
        if hasattr(signal, "SIGALRM"):
            signal.alarm(0)
        release_lock(state)


def selftest():
    """Offline logic checks — tempdir fixture, no real repo needed."""
    import tempfile
    import shutil
    checks = []

    def ok(label, cond):
        checks.append((label, bool(cond)))

    now = datetime(2026, 7, 21, 12, 0, 0, tzinfo=timezone.utc)

    # parse_principles
    prin = parse_principles(
        "| ID | Principle (one line) | Authoritative source |\n"
        "|---|---|---|\n"
        "| **THREE-BRAKES** | No timer automation without budget + lock + kill-switch. | `CLAUDE.md` |\n"
        "| **TLC-FIREWALL** | PHI never routes to a vendor; fail-closed. | `CLAUDE-TOOL-ROUTING.md` |\n"
    )
    ok("principles: parses 2 rows, skips header/separator", len(prin) == 2)
    ok("principles: id + summary + source captured", prin[0]["id"] == "THREE-BRAKES" and "kill-switch" in prin[0]["summary"] and prin[0]["source"] == "CLAUDE.md")

    # parse_decision + re-review scan
    dr = parse_decision(
        "DR-0219-spec-conformance.md",
        "---\nid: DR-0219\ntitle: Spec-Conformance Review\nstatus: accepted\ntier: A\ndate: 2026-07-21\n---\n\nBody... re-review: 2026-08-04 and again re-review: 2026-08-04 (dup) plus re-review 2026-09-01.\n",
    )
    ok("decision: front-matter id/title/status/tier/date", dr["id"] == "DR-0219" and dr["status"] == "accepted" and dr["tier"] == "A" and dr["num"] == 219)
    ok("decision: re-reviews de-duped + sorted", dr["re_reviews"] == ["2026-08-04", "2026-09-01"])

    # build_brain over a tempdir
    d = tempfile.mkdtemp()
    try:
        dec = os.path.join(d, "docs", "decisions")
        os.makedirs(dec)
        with open(os.path.join(dec, "PRINCIPLES.md"), "w", encoding="utf-8") as fh:
            fh.write("| **VERIFICATION-DOCTRINE** | Evidence not claims. | `CLAUDE.md` |\n")
        with open(os.path.join(dec, "DR-0100-a.md"), "w", encoding="utf-8") as fh:
            fh.write("---\nid: DR-0100\ntitle: A\nstatus: accepted\n---\nre-review: 2026-08-01\n")
        with open(os.path.join(dec, "DR-0101-b.md"), "w", encoding="utf-8") as fh:
            fh.write("---\nid: DR-0101\ntitle: B\nstatus: accepted\n---\nno dates here\n")
        with open(os.path.join(dec, "INDEX.md"), "w", encoding="utf-8") as fh:
            fh.write("not a DR file\n")  # must be ignored (no DR- prefix match)
        brain = build_brain(d, now)
        ok("brain: ok + generated_at", brain["ok"] and brain["generated_at"] == "2026-07-21T12:00:00Z")
        ok("brain: 1 principle, 2 decisions (INDEX.md ignored)", brain["counts"]["principles"] == 1 and brain["counts"]["decisions"] == 2)
        ok("brain: decisions newest-first", [x["num"] for x in brain["decisions"]] == [101, 100])
        ok("brain: 1 open re-review, from DR-0100", brain["counts"]["open_re_reviews"] == 1 and brain["open_re_reviews"][0]["id"] == "DR-0100")
        ok("brain: honest-empty on a non-repo dir", build_brain("/nonexistent-xyz", now)["counts"]["decisions"] == 0)

        # The three brakes (DR-0186): kill-switch ships ABSENT (resting = running),
        # the lock is single-flight, and a stacked fire is skipped.
        st = os.path.join(d, ".ways-state")
        os.makedirs(st)
        ok("brake: kill-switch absent by default (resting state is running)", not kill_present(st))
        open(os.path.join(st, "KILL_SWITCH"), "w").close()
        ok("brake: kill-switch present halts", kill_present(st))
        os.remove(os.path.join(st, "KILL_SWITCH"))
        ok("brake: lock acquires when free", acquire_lock(st) is True)
        ok("brake: a stacked fire finds the lock held and SKIPS", acquire_lock(st) is False)
        release_lock(st)
        ok("brake: lock re-acquirable after release", acquire_lock(st) is True)
        release_lock(st)
    finally:
        shutil.rmtree(d, ignore_errors=True)

    passed = sum(1 for _, c in checks if c)
    for label, c in checks:
        print(("PASS " if c else "FAIL ") + label)
    print("\n%d/%d checks passed" % (passed, len(checks)))
    sys.exit(0 if passed == len(checks) else 1)


def main():
    ap = argparse.ArgumentParser(description="Sovereign Ways-brain parser (bounded, single-shot, no LLM).")
    ap.add_argument("--run", action="store_true", help="parse the repo's Ways docs and write the brain JSON")
    ap.add_argument("--selftest", action="store_true", help="offline logic checks")
    ap.add_argument("--repo", default=os.environ.get("WAYS_REPO", "."), help="repo root (contains docs/decisions)")
    ap.add_argument("--out", default=os.environ.get("WAYS_OUT", "./ways-brain.json"), help="output JSON path")
    ap.add_argument("--state", default=os.environ.get("WAYS_STATE", ""), help="lock/kill-switch dir (default: <out-dir>/.ways-state)")
    args = ap.parse_args()
    if args.selftest:
        selftest()
    elif args.run:
        run(args)
    else:
        ap.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
