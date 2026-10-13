#!/usr/bin/env python3
"""
parity_loop.py -- the tower parity loop on the NAS (DR-0671).

Darrell, 2026-09-29: "The final goal is to not need any no local model... we
need to make more workflows that produce the same outcome from claude based on
the process being used... claude needs to create the specific algorithmic fixes
for our workflows to work on the towers etc..."

MEASURE -> GAP -> FIX -> PROMOTE, over public.lesson_versions (written by the
NAS lesson builder, DR-0669: one identical prompt to every writer, the same
deterministic gates on every version).

  measure_pass  For each teaching with a Claude version (the reference) and one
                or more other versions: a parity report per version
                (parity_core.compare) -> public.lesson_parity; the all-pairs
                cross-reference and consensus (parity_core.crossref) ->
                public.lesson_crossref; the promotion state per writer
                (parity_core.promotion) -> public.lesson_parity_promotion.
                Deterministic. No model. Time budget only, no count cap on
                lessons: what one pass does not reach, the next pass does.

  fix_step      For the most frequent RECURRING gap class of a tower writer,
                one headless Claude Code run (the builder's writer path,
                configured on the NAS) writes a SPECIFIC ALGORITHMIC fix as a
                normal PR through the lane, with a test that re-measures the
                stored example before and after. Recorded in
                public.lesson_parity_fixes.

THE BRAKES on the fix step (proven-to-catch in test_lesson_parity.py):
  BUDGET  wall-clock (PARITY_FIX_MAX_SECONDS, default 1800; the subprocess is
          killed at the ceiling) and turns (PARITY_FIX_MAX_TURNS, default 40;
          passed to the writer and checked on its report). One fix per run.
  LOCK    a single-instance lockfile per stage (measure.lock, fix.lock). A
          second fire that finds a live lock SKIPS; a stale lock is broken.
  KILL    the lane's own stop-paths: delete infra/nas-loops/ARMED-BY-RECORD,
          or set the `lesson-parity` entry in infra/nas-loops/services.json to
          enabled:false (stops everything), or fix_enabled:false (stops only
          the Claude step). Plus, because this step calls a vendor model, an
          auto-pause after PARITY_FIX_MAX_FAILURES (3) failures in a row, which
          decays after PARITY_FIX_PAUSE_HOURS (24) -- the DR-0248 shape: it can
          never stop the lane permanently and silently.

Secrets: env SUPABASE_URL + SUPABASE_SERVICE_KEY, else the sovereign stack
when REPOINT-ARMED is merged, else /volume1/PoeTech/secrets/supabase.json
(infra/nas-supabase/sovereign_target.py). The writer command and the model
label come from NAS config (PARITY_FIX_CMD, PARITY_FIX_MODEL_LABEL in
/volume1/PoeTech/secrets/lesson-parity.env); no model identifier is written in
this repository.

Run:  python3 parity_loop.py              # one measure pass, JSON report
      python3 parity_loop.py --fix-step   # one braked fix step, JSON report
"""
import hashlib
import json
import os
import shlex
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, "..", "nas-supabase"))
import parity_core as pc  # noqa: E402
import fixes  # noqa: E402

REPO = os.environ.get("POETECH_REPO", pc.REPO)
DATA = os.environ.get("PARITY_DATA", "/volume1/PoeTech/lesson-parity")
SECRETS = os.environ.get("PARITY_SECRETS", "/volume1/PoeTech/secrets/supabase.json")
REFERENCE_FAMILY = os.environ.get("PARITY_REFERENCE_FAMILY", "claude")
SERVICE_NAME = "lesson-parity"

MEASURE_MAX_SECONDS = int(os.environ.get("PARITY_MEASURE_MAX_SECONDS", "90"))
FIX_MAX_SECONDS = int(os.environ.get("PARITY_FIX_MAX_SECONDS", "1800"))
FIX_MAX_TURNS = int(os.environ.get("PARITY_FIX_MAX_TURNS", "40"))
FIX_MAX_FAILURES = int(os.environ.get("PARITY_FIX_MAX_FAILURES", "3"))
FIX_PAUSE_HOURS = float(os.environ.get("PARITY_FIX_PAUSE_HOURS", "24"))
LOCK_MAX_AGE = int(os.environ.get("PARITY_LOCK_MAX_AGE", str(FIX_MAX_SECONDS + 600)))
RECURRING_MIN = int(os.environ.get("PARITY_RECURRING_MIN", "3"))
RECURRING_WINDOW = int(os.environ.get("PARITY_RECURRING_WINDOW", "10"))
FIX_COOLDOWN_DAYS = float(os.environ.get("PARITY_FIX_COOLDOWN_DAYS", "7"))
OPEN_FIX_STATUSES = ("proposed", "running", "pushed", "awaiting-writer")


# ---------------------------------------------------------------------------
# BRAKE: the kill (the lane's stop-paths) -- pure, reads two committed files.
# ---------------------------------------------------------------------------

def kill_state(repo=REPO, stage="measure"):
    """-> (go, reason). Stops when ARMED-BY-RECORD is gone, when the
    services.json entry is not enabled, or (fix stage) when fix_enabled is false."""
    if not os.path.isfile(os.path.join(repo, "infra", "nas-loops", "ARMED-BY-RECORD")):
        return False, "ARMED-BY-RECORD is absent (the fleet's stop-path)"
    try:
        with open(os.path.join(repo, "infra", "nas-loops", "services.json"), encoding="utf-8") as f:
            services = json.load(f).get("services") or []
    except (OSError, ValueError) as e:
        return False, "services.json unreadable: %s" % e
    entry = next((s for s in services if s.get("name") == SERVICE_NAME), None)
    if entry is None:
        return False, "no %s entry in services.json" % SERVICE_NAME
    if entry.get("enabled") is not True:
        return False, "%s is enabled:false in services.json" % SERVICE_NAME
    if stage == "fix" and entry.get("fix_enabled") is False:
        return False, "%s fix_enabled:false in services.json (the Claude step alone is stopped)" % SERVICE_NAME
    return True, "go"


# ---------------------------------------------------------------------------
# BRAKE: the single-instance lock.
# ---------------------------------------------------------------------------

def acquire_lock(data_dir, name, now=None, max_age=None):
    now = time.time() if now is None else now
    max_age = LOCK_MAX_AGE if max_age is None else max_age
    p = os.path.join(data_dir, name + ".lock")
    if os.path.isfile(p):
        try:
            age = now - os.path.getmtime(p)
        except OSError:
            age = 0
        if age <= max_age:
            return False
        os.remove(p)
    try:
        fd = os.open(p, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
    except FileExistsError:
        return False
    with os.fdopen(fd, "w") as f:
        f.write(str(os.getpid()))
    return True


def release_lock(data_dir, name):
    try:
        os.remove(os.path.join(data_dir, name + ".lock"))
    except OSError:
        pass


# ---------------------------------------------------------------------------
# BRAKE: the auto-pause for the vendor step (time-decayed, DR-0248).
# ---------------------------------------------------------------------------

def _state_path(data_dir):
    return os.path.join(data_dir, "fix-state.json")


def read_state(data_dir):
    try:
        with open(_state_path(data_dir), encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return {"failures": 0, "pausedUntil": 0}


def write_state(data_dir, st):
    with open(_state_path(data_dir), "w", encoding="utf-8") as f:
        json.dump(st, f)


def paused(data_dir, now=None):
    now = time.time() if now is None else now
    st = read_state(data_dir)
    return float(st.get("pausedUntil") or 0) > now, st


def note_outcome(data_dir, ok, now=None):
    now = time.time() if now is None else now
    st = read_state(data_dir)
    if ok:
        st = {"failures": 0, "pausedUntil": 0}
    else:
        st["failures"] = int(st.get("failures") or 0) + 1
        if st["failures"] >= FIX_MAX_FAILURES:
            st["pausedUntil"] = now + FIX_PAUSE_HOURS * 3600
            st["failures"] = 0
    write_state(data_dir, st)
    return st


class Budget:
    """Wall-clock budget. exceeded() stays true once hit."""

    def __init__(self, max_seconds, clock=time.monotonic):
        self.max_seconds, self._clock, self._t0 = max_seconds, clock, clock()

    def left(self):
        return self.max_seconds - (self._clock() - self._t0)

    def exceeded(self):
        return self.left() <= 0


# ---------------------------------------------------------------------------
# MEASURE: pure planning over rows (the I/O object is passed in).
# ---------------------------------------------------------------------------

def group_teachings(versions):
    """{teaching_row_id: [versions oldest first]}"""
    out = {}
    for v in sorted(versions, key=lambda v: (str(v.get("created_at") or ""), str(v.get("id")))):
        out.setdefault(v.get("teaching_row_id") or v.get("lesson_id"), []).append(v)
    return out


def reference_of(vs, family=REFERENCE_FAMILY):
    refs = [v for v in vs if pc.writer_family(v) == family]
    return refs[-1] if refs else None


def parity_row(ref, cand, report):
    fam = pc.writer_family(cand)
    return {
        "teaching_row_id": cand.get("teaching_row_id"),
        "lesson_id": cand.get("lesson_id"),
        "version_id": cand.get("id"),
        "reference_version_id": ref.get("id"),
        "writer": cand.get("writer"),
        "writer_family": fam,
        "model_label": cand.get("model_label") or "",
        "prompt_sha256": cand.get("prompt_sha256"),
        "same_prompt": bool(cand.get("prompt_sha256")) and cand.get("prompt_sha256") == ref.get("prompt_sha256"),
        "parity_score": report["score"],
        "passed": report["passed"],
        "floors": report["floors"],
        "sections": report["sections"],
        "gaps": report["gaps"],
        "gap_classes": [g["class"] for g in report["gaps"]],
        "measure_version": pc.MEASURE_VERSION,
        "version_created_at": cand.get("created_at"),
    }


def promotion_rows(parity_rows, existing_promos, now_iso):
    """One row per non-reference (family, model_label): its streak and status.
    Each teaching counts once (its newest measured version)."""
    held = {(p.get("writer_family"), p.get("model_label") or ""): p for p in existing_promos or []}
    by = {}
    for r in sorted(parity_rows, key=lambda r: (str(r.get("version_created_at") or ""), str(r.get("version_id")))):
        k = (r.get("writer_family"), r.get("model_label") or "")
        by.setdefault(k, {})[r.get("teaching_row_id")] = r  # later version of a teaching replaces the earlier
    out = []
    for k, per_teaching in sorted(by.items()):
        rows = sorted(per_teaching.values(), key=lambda r: (str(r.get("version_created_at") or ""), str(r.get("version_id"))))
        prev = held.get(k) or {}
        st = pc.promotion([{"score": r["parity_score"], "passed": r["passed"]} for r in rows], held=bool(prev.get("held")))
        row = {
            "writer_family": k[0], "model_label": k[1], "tower": pc.is_tower(k[0]),
            "streak": st["streak"], "required_n": st["required"], "threshold": st["threshold"],
            "teachings": st["teachings"], "ready": st["ready"], "status": st["status"], "held": st["held"],
            "last_score": rows[-1]["parity_score"] if rows else None,
            "history": [{"t": r.get("teaching_row_id"), "s": r["parity_score"], "p": r["passed"],
                         "at": r.get("version_created_at")} for r in rows[-30:]],
            "updated_at": now_iso,
        }
        if st["status"] != prev.get("status"):
            row["status_changed_at"] = now_iso
        out.append(row)
    return out


def _epoch(iso):
    try:
        return time.mktime(time.strptime(str(iso)[:19], "%Y-%m-%dT%H:%M:%S"))
    except (TypeError, ValueError):
        return None


def settle_fixes(fix_rows, parity_rows, enabled_classes, now=None):
    """Carry each fix to its outcome (DR-0621, hold the hand): pushed -> merged
    when its module is enabled on this checkout of main; merged ->
    closed-verified when the class shows in fewer of the writer's next
    RECURRING_WINDOW teachings than before, else failed ("the gap persists"),
    which frees the class for a new fix; pushed for twice the cooldown without
    merging -> failed. Returns [(id, patch)]."""
    now = time.time() if now is None else now
    out = []
    for f in fix_rows or []:
        st, cls, fam = f.get("status"), f.get("gap_class"), f.get("writer_family")
        created = _epoch(f.get("created_at")) or now
        if st == "pushed":
            if cls in enabled_classes:
                out.append((f.get("id"), {"status": "merged", "detail": "the fix module is enabled on main"}))
            elif now - created > 2 * FIX_COOLDOWN_DAYS * 86400:
                out.append((f.get("id"), {"status": "failed", "detail": "not merged within %d days" % int(2 * FIX_COOLDOWN_DAYS)}))
        elif st == "merged":
            after = [r for r in parity_rows if r.get("writer_family") == fam and (_epoch(r.get("measured_at")) or 0) > created]
            after = sorted(after, key=lambda r: str(r.get("measured_at")))[:RECURRING_WINDOW]
            if len(after) < RECURRING_WINDOW:
                continue
            rate = sum(1 for r in after if cls in (r.get("gap_classes") or [])) / len(after)
            before = float(((f.get("before") or {}).get("rate")) or 1.0)
            patch = {"after": {"rate": round(rate, 4), "teachings": len(after)}}
            if rate < before:
                patch.update({"status": "closed-verified", "detail": "the gap fell from %.0f%% to %.0f%% of teachings" % (before * 100, rate * 100)})
            else:
                patch.update({"status": "failed", "detail": "the gap persists after the merge; the class is open for a new fix"})
            out.append((f.get("id"), patch))
    return out


def measure_pass(io, budget=None, now_iso=None):
    """One deterministic pass. Returns a JSON-able report."""
    budget = budget or Budget(MEASURE_MAX_SECONDS)
    now_iso = now_iso or time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    report = {"teachings": 0, "measured": 0, "skipped": 0, "crossref": 0, "promotions": 0,
              "noReference": 0, "stopped": None}
    versions = io.list_versions()
    done = io.measured_keys()
    xref_done = io.crossref_versions()
    for tid, vs in group_teachings(versions).items():
        if budget.exceeded():
            report["stopped"] = "time-budget (the next pass continues; no count cap)"
            break
        report["teachings"] += 1
        ref = reference_of(vs)
        if len(vs) >= 2:
            ids = sorted(str(v.get("id")) for v in vs)
            if xref_done.get(tid) != ids:
                x = pc.crossref(vs, REFERENCE_FAMILY)
                io.upsert_crossref({"teaching_row_id": tid, "lesson_id": vs[-1].get("lesson_id"),
                                    "version_ids": ids, "versions": x["versions"], "matrix": x["matrix"],
                                    "consensus": x["consensus"], "insights": x["insights"],
                                    "excluded": x["excluded"], "reference_vs_consensus": x["referenceVsConsensus"],
                                    "measure_version": pc.MEASURE_VERSION, "measured_at": now_iso})
                report["crossref"] += 1
        if ref is None:
            report["noReference"] += 1
            continue
        for v in vs:
            if v is ref or pc.writer_family(v) == REFERENCE_FAMILY:
                continue
            key = (str(v.get("id")), str(ref.get("id")), pc.MEASURE_VERSION)
            if key in done:
                report["skipped"] += 1
                continue
            row = parity_row(ref, v, pc.compare(ref, v))
            row["measured_at"] = now_iso
            io.upsert_parity(row)
            done.add(key)
            report["measured"] += 1
    all_parity = io.list_parity()
    settled = settle_fixes(io.list_fixes(), all_parity, set(fixes.closes()))
    for fid, patch in settled:
        io.update_fix(fid, patch)
    report["fixesSettled"] = len(settled)
    promos = promotion_rows(all_parity, io.list_promotions(), now_iso)
    for p in promos:
        io.upsert_promotion(p)
    report["promotions"] = len(promos)
    report["primary"] = [p["writer_family"] + "/" + p["model_label"] for p in promos if p["status"] == "primary"]
    if not report["stopped"]:
        report["stopped"] = "all-measured"
    return report


# ---------------------------------------------------------------------------
# FIX: Claude writes the algorithmic fix, braked.
# ---------------------------------------------------------------------------

def pick_gap(parity_rows, open_fixes, now=None, writer_ready=False):
    """The recurring tower gap that most needs a fix: most occurrences first,
    then class name. Skips a (family, class) with an open fix, or one closed
    inside the cooldown, and never picks the reference writer. Once a writer
    is configured, a prompt left 'awaiting-writer' no longer blocks its class:
    that class is picked and actually run."""
    now = time.time() if now is None else now
    recurring = pc.recurring_gaps([r for r in parity_rows if pc.is_tower(r.get("writer_family"))],
                                  RECURRING_MIN, RECURRING_WINDOW)
    blocked = set()
    for f in open_fixes or []:
        k = (f.get("writer_family"), f.get("gap_class"))
        if writer_ready and f.get("status") == "awaiting-writer":
            continue
        if f.get("status") in OPEN_FIX_STATUSES:
            blocked.add(k)
        elif f.get("created_epoch") and now - float(f["created_epoch"]) < FIX_COOLDOWN_DAYS * 86400:
            blocked.add(k)
    cands = sorted(((v["count"], k) for k, v in recurring.items() if k not in blocked), key=lambda x: (-x[0], x[1]))
    if not cands:
        return None
    count, k = cands[0]
    return {"writer_family": k[0], "gap_class": k[1], "count": count, "example": recurring[k]["example"]}


def fix_prompt(gap, example_path):
    cls = gap["gap_class"]
    ex = gap["example"]
    evidence = next((g.get("evidence") for g in ex.get("gaps") or [] if g.get("class") == cls), {})
    return "\n".join([
        "You are the teacher of the process for the PoeTech tower lesson workflow (DR-0671).",
        "Darrell, 2026-09-29: \"claude needs to create the specific algorithmic fixes for our workflows to work on the towers\".",
        "",
        "GAP CLASS: %s (writer family: %s; seen in %d of the last %d teachings)" % (cls, gap["writer_family"], gap["count"], RECURRING_WINDOW),
        "KIND OF FIX: %s" % pc.GAP_CLASSES.get(cls, "a deterministic pre- or post-pass"),
        "MEASURED EVIDENCE: %s" % json.dumps(evidence)[:4000],
        "STORED EXAMPLE (reference + tower version bodies, the parity row): %s" % example_path,
        "",
        "Write ONE deterministic algorithmic fix (no model call inside it) in",
        "infra/nas-lesson-parity/fixes/<name>.py following the interface in fixes/__init__.py",
        "(GAP_CLASS, STAGE, apply(ctx)), add it to fixes.ENABLED, and add a test in",
        "infra/nas-lesson-parity/test_lesson_parity.py that copies the stored example into",
        "infra/nas-lesson-parity/fixtures/ and re-measures it with parity_core BEFORE and AFTER",
        "the fix: the gap must be present before and smaller or gone after (proven-to-catch).",
        "Verses are quoted only from app/public/bible/kjv, verbatim. No model identifier in any file.",
        "",
        "Work in a fresh worktree off origin/main on branch claude/parity-fix-%s-%s." % (cls, time.strftime("%Y%m%d")),
        "Run: cd infra/nas-lesson-parity && python3 -m unittest test_lesson_parity -v. Commit with a plain subject.",
        "Push with git push -u origin <branch>; the lane opens the PR.",
        "End your reply with two lines: BRANCH: <branch> and PR: <url or none>.",
    ])


def parse_writer_output(stdout):
    """The writer's JSON report (claude -p --output-format json) or plain text."""
    turns, text = None, stdout or ""
    try:
        d = json.loads(stdout)
        if isinstance(d, dict):
            turns = d.get("num_turns")
            text = str(d.get("result") or "")
    except (ValueError, TypeError):
        pass
    branch = pr = None
    for line in text.splitlines():
        s = line.strip()
        if s.startswith("BRANCH:"):
            branch = s.split(":", 1)[1].strip() or None
        elif s.startswith("PR:"):
            v = s.split(":", 1)[1].strip()
            pr = None if v.lower() in ("", "none") else v
    return {"turns": turns, "branch": branch, "pr": pr, "text": text[-2000:]}


def run_writer(cmd_template, prompt, cwd, max_seconds, max_turns, runner=subprocess.run):
    """Run the configured writer once. The wall-clock ceiling kills it."""
    cmd = shlex.split(cmd_template.replace("{max_turns}", str(max_turns)))
    try:
        res = runner(cmd, input=prompt, capture_output=True, text=True, timeout=max_seconds, cwd=cwd)
    except subprocess.TimeoutExpired:
        return {"status": "budget-stopped", "why": "wall-clock ceiling %ds reached; the run was killed" % max_seconds}
    except OSError as e:
        return {"status": "failed", "why": "writer did not start: %s" % e}
    out = parse_writer_output(res.stdout)
    if out["turns"] is not None and out["turns"] > max_turns:
        return {"status": "budget-stopped", "why": "turn budget exceeded (%s > %d)" % (out["turns"], max_turns), **out}
    if res.returncode != 0:
        return {"status": "failed", "why": "writer exited %d: %s" % (res.returncode, (res.stderr or "")[-500:]), **out}
    if not out["branch"]:
        return {"status": "failed", "why": "no BRANCH line: nothing was pushed", **out}
    return {"status": "pushed", "why": "", **out}


def fix_step(io, env=None, data_dir=DATA, repo=REPO, now=None, runner=subprocess.run):
    env = os.environ if env is None else env
    now = time.time() if now is None else now
    go, why = kill_state(repo, "fix")
    if not go:
        return {"ran": False, "stopped": "kill: " + why}
    os.makedirs(data_dir, exist_ok=True)
    is_paused, st = paused(data_dir, now)
    if is_paused:
        return {"ran": False, "stopped": "auto-paused until %s after %d failures in a row" % (
            time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(st["pausedUntil"])), FIX_MAX_FAILURES)}
    if not acquire_lock(data_dir, "fix", now):
        return {"ran": False, "stopped": "lock: a fix step is already running"}
    try:
        cmd = env.get("PARITY_FIX_CMD", "").strip()
        gap = pick_gap(io.list_parity(), io.list_fixes(), now, writer_ready=bool(cmd))
        if gap is None:
            return {"ran": False, "stopped": "no recurring tower gap without an open fix"}
        ex = gap["example"]
        example = {"parity": ex, "reference": io.get_version(ex.get("reference_version_id")),
                   "tower": io.get_version(ex.get("version_id"))}
        ex_path = os.path.join(data_dir, "examples", "%s-%s.json" % (gap["gap_class"], ex.get("version_id")))
        os.makedirs(os.path.dirname(ex_path), exist_ok=True)
        with open(ex_path, "w", encoding="utf-8") as f:
            json.dump(example, f, indent=1)
        prompt = fix_prompt(gap, ex_path)
        row = {"gap_class": gap["gap_class"], "writer_family": gap["writer_family"], "occurrences": gap["count"],
               "example_parity_id": ex.get("id"), "example_version_id": ex.get("version_id"),
               "before": {"score": ex.get("parity_score"), "rate": round(gap["count"] / RECURRING_WINDOW, 4),
                          "evidence": next((g.get("evidence") for g in ex.get("gaps") or [] if g.get("class") == gap["gap_class"]), {})},
               "prompt_sha256": hashlib.sha256(prompt.encode("utf-8")).hexdigest(), "prompt_text": prompt,
               "budget": {"maxSeconds": FIX_MAX_SECONDS, "maxTurns": FIX_MAX_TURNS},
               "writer_label": env.get("PARITY_FIX_MODEL_LABEL", "")}
        if not cmd:
            row.update({"status": "awaiting-writer",
                        "detail": "PARITY_FIX_CMD is not set on this machine: the prompt is stored here, ready for the writer"})
            io.insert_fix(row)
            return {"ran": False, "stopped": "no writer configured (PARITY_FIX_CMD)", "gap": gap["gap_class"]}
        t0 = time.monotonic()
        res = run_writer(cmd, prompt, env.get("PARITY_FIX_WORKDIR") or repo, FIX_MAX_SECONDS, FIX_MAX_TURNS, runner)
        row.update({"status": res["status"], "detail": res.get("why") or "", "branch": res.get("branch"),
                    "pr_url": res.get("pr"), "turns": res.get("turns"),
                    "elapsed_ms": int((time.monotonic() - t0) * 1000)})
        io.insert_fix(row)
        note_outcome(data_dir, res["status"] == "pushed", now)
        return {"ran": True, "status": res["status"], "gap": gap["gap_class"], "branch": res.get("branch")}
    finally:
        release_lock(data_dir, "fix")


# ---------------------------------------------------------------------------
# The real I/O (stdlib only; PostgREST with the service role).
# ---------------------------------------------------------------------------

class SupabaseIO:
    PAGE = 50

    def __init__(self, url, key):
        self.url, self.key = url.rstrip("/"), key

    def _req(self, method, path, body=None, prefer=None, timeout=60):
        h = {"apikey": self.key, "Authorization": "Bearer " + self.key, "Content-Type": "application/json"}
        if prefer:
            h["Prefer"] = prefer
        data = json.dumps(body).encode("utf-8") if body is not None else None
        req = urllib.request.Request(self.url + path, data=data, method=method, headers=h)
        with urllib.request.urlopen(req, timeout=timeout) as res:
            raw = res.read()
        return json.loads(raw) if raw else None

    def _all(self, table, query):
        out, offset = [], 0
        while True:
            rows = self._req("GET", "/rest/v1/%s?%s&limit=%d&offset=%d" % (table, query, self.PAGE, offset)) or []
            out.extend(rows)
            if len(rows) < self.PAGE:
                return out
            offset += self.PAGE

    def list_versions(self):
        return self._all("lesson_versions", "select=*&order=created_at.asc")

    def get_version(self, vid):
        if not vid:
            return None
        rows = self._req("GET", "/rest/v1/lesson_versions?select=*&id=eq." + urllib.parse.quote(str(vid))) or []
        return rows[0] if rows else None

    def list_parity(self):
        return self._all("lesson_parity", "select=id,teaching_row_id,lesson_id,version_id,reference_version_id,"
                         "writer,writer_family,model_label,parity_score,passed,gaps,gap_classes,measure_version,"
                         "version_created_at,measured_at&measure_version=eq." + pc.MEASURE_VERSION + "&order=measured_at.asc")

    def measured_keys(self):
        return set((str(r["version_id"]), str(r["reference_version_id"]), r["measure_version"]) for r in self.list_parity())

    def crossref_versions(self):
        rows = self._all("lesson_crossref", "select=teaching_row_id,version_ids,measure_version")
        return {r["teaching_row_id"]: sorted(r.get("version_ids") or []) for r in rows
                if r.get("measure_version") == pc.MEASURE_VERSION}

    def upsert_parity(self, row):
        self._req("POST", "/rest/v1/lesson_parity?on_conflict=version_id,reference_version_id,measure_version",
                  row, prefer="resolution=merge-duplicates,return=minimal")

    def upsert_crossref(self, row):
        self._req("POST", "/rest/v1/lesson_crossref?on_conflict=teaching_row_id", row,
                  prefer="resolution=merge-duplicates,return=minimal")

    def list_promotions(self):
        return self._all("lesson_parity_promotion", "select=writer_family,model_label,status,held")

    def upsert_promotion(self, row):
        # `held` is the Governor's own column (set_lesson_parity_hold); the loop never writes it.
        body = {k: v for k, v in row.items() if k != "held"}
        self._req("POST", "/rest/v1/lesson_parity_promotion?on_conflict=writer_family,model_label", body,
                  prefer="resolution=merge-duplicates,return=minimal")

    def list_fixes(self):
        rows = self._all("lesson_parity_fixes", "select=id,gap_class,writer_family,status,before,created_at&order=created_at.desc")
        for r in rows:
            r["created_epoch"] = _epoch(r.get("created_at"))
        return rows

    def update_fix(self, fid, patch):
        self._req("PATCH", "/rest/v1/lesson_parity_fixes?id=eq." + urllib.parse.quote(str(fid)), patch,
                  prefer="return=minimal")

    def insert_fix(self, row):
        self._req("POST", "/rest/v1/lesson_parity_fixes", row, prefer="return=minimal")


def main(argv):
    from sovereign_target import resolve_target
    source, url, key = resolve_target(SECRETS)
    if not url or not key:
        print(json.dumps({"ran": False, "stopped": "no credential (no env key, no sovereign stack, no secrets file)"}))
        return 0
    io = SupabaseIO(url, key)
    os.makedirs(DATA, exist_ok=True)
    if "--fix-step" in argv:
        print(json.dumps(fix_step(io)))
        return 0
    go, why = kill_state(REPO, "measure")
    if not go:
        print(json.dumps({"ran": False, "stopped": "kill: " + why}))
        return 0
    if not acquire_lock(DATA, "measure"):
        print(json.dumps({"ran": False, "stopped": "lock: a measure pass is already running"}))
        return 0
    try:
        try:
            rep = measure_pass(io)
        except urllib.error.HTTPError as e:
            if e.code == 404:  # the builder's table is not on this database yet
                print(json.dumps({"ran": False, "stopped": "lesson_versions or the parity tables are not on %s yet" % source}))
                return 0
            raise
        rep["source"] = source
        print(json.dumps(rep))
        return 0
    finally:
        release_lock(DATA, "measure")


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
