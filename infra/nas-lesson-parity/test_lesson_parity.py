#!/usr/bin/env python3
"""
test_lesson_parity.py -- proofs for the tower parity loop (DR-0671).

Run: cd infra/nas-lesson-parity && python3 -m unittest test_lesson_parity -v

Every measure is shown deterministic; every gap class is shown to FIRE on a
planted defect (proven-to-catch); every brake is shown to STOP; the first
algorithmic fix is shown to close part of its gap on the stored example,
re-measured before and after.
"""
import copy
import json
import os
import re
import shutil
import subprocess
import tempfile
import time
import unittest

import parity_core as pc
import parity_loop as pl
import fixes
from fixes import verse_retrieval as vr

HERE = os.path.dirname(os.path.abspath(__file__))
REF = json.load(open(os.path.join(HERE, "fixtures", "reference-ll180.json"), encoding="utf-8"))


def V(vid, writer, body, tid="t1", created="2026-09-29T10:00:00Z", gates=None, prompt="p1", model=""):
    return {"id": vid, "teaching_row_id": tid, "lesson_id": "ll-x", "writer": writer, "model_label": model,
            "prompt_sha256": prompt, "body": body, "gate_results": gates if gates is not None else {"verse": True, "bands": True},
            "created_at": created}


def degrade(body, kind):
    b = copy.deepcopy(body)
    if kind == "drop-band":
        b["levels"]["teen"] = ""
    elif kind == "short-band":
        w = b["levels"]["youth"].split()
        b["levels"]["youth"] = " ".join(w[: len(w) // 3])
    elif kind == "misquote":
        b["lesson"] = b["lesson"].replace("power to get wealth, that he may", "power to get riches, that he may", 1)
    elif kind == "strip-verses":
        strip = lambda s: pc.REF_RE.sub("", re.sub(r'"[^"]*"\s*\([^)]*\d+:\d+[^)]*\)', "", s))
        for f in ("lesson", "bigIdea", "inApp"):
            b[f] = strip(b[f])
        for band in pc.BAND_ORDER:
            b["levels"][band] = strip(b["levels"][band])
        b["benefits"] = [strip(x) for x in b["benefits"]]
        b["facilitator"]["talkingPoints"] = [strip(x) for x in b["facilitator"]["talkingPoints"]]
        for q in b["quiz"]["questions"]:
            q["explain"] = strip(q["explain"])
            q["q"] = strip(q["q"])
        b["anchor"]["ref"] = ""
    elif kind == "quiz-half":
        b["quiz"]["questions"] = b["quiz"]["questions"][:2]
    elif kind == "quiz-bad-index":
        b["quiz"]["questions"][0]["answer"] = 9
    elif kind == "no-movements":
        b["lesson"] = b["lesson"].lower()
    elif kind == "hard-child":
        b["levels"]["child"] = " ".join(["Consequentially, the extraordinarily complicated administrative responsibilities accumulate continuously"] * 40)
    elif kind == "long":
        for band in pc.BAND_ORDER:
            b["levels"][band] = b["levels"][band] + " " + b["levels"][band]
    elif kind == "drop-fields":
        b.pop("facilitator")
        b.pop("benefits")
    return b


class Deterministic(unittest.TestCase):
    def test_reference_against_itself_is_perfect(self):
        r = pc.compare({"body": REF}, {"body": REF})
        self.assertEqual(r["score"], 1.0)
        self.assertTrue(r["passed"])
        self.assertEqual(r["gaps"], [])

    def test_same_inputs_same_report_byte_for_byte(self):
        t = V("b", "ollama", degrade(REF, "drop-band"))
        a = json.dumps(pc.compare({"body": REF}, t), sort_keys=True)
        b = json.dumps(pc.compare({"body": REF}, t), sort_keys=True)
        self.assertEqual(a, b)

    def test_measures_read_the_real_corpus(self):
        self.assertEqual(sorted(pc.cited_verses(REF)), ["Deuteronomy 8:17", "Deuteronomy 8:18", "Hebrews 11:8",
                                                         "Hosea 4:6", "James 4:15", "Luke 14:28", "Proverbs 4:7"])
        g = pc.verse_gate(REF)
        self.assertTrue(g["passed"])
        self.assertGreater(g["spans"], 20)
        self.assertEqual(pc.verse_text("Deuteronomy", 8, "18")[:32], "But thou shalt remember the LORD")
        self.assertEqual(pc.refs_in("Jeremiah 36:23, 28 and 1 Peter 1:23-24"),
                         ["Jeremiah 36:23", "Jeremiah 36:28", "1 Peter 1:23", "1 Peter 1:24"])
        self.assertEqual(pc.refs_in("Hezekiah 1:1 and Psalms 999:1"), [])

    def test_weights_sum_to_one(self):
        self.assertAlmostEqual(sum(pc.WEIGHTS.values()), 1.0)


class EveryGapClassFires(unittest.TestCase):
    """PROVEN-TO-CATCH: each planted defect is named by its class."""

    def gaps(self, kind, gates=None):
        r = pc.compare(V("r", "claude", REF), V("c", "ollama", degrade(REF, kind), gates=gates))
        return r, [g["class"] for g in r["gaps"]]

    def test_each_planted_defect_is_named(self):
        cases = {
            "drop-band": "missing-band",
            "short-band": "short-band",
            "misquote": "misquoted-verse",
            "strip-verses": "missing-verse-retrieval",
            "quiz-half": "quiz-count",
            "quiz-bad-index": "quiz-errors",
            "no-movements": "missing-movement",
            "hard-child": "reading-level",
            "long": "length-long",
            "drop-fields": "weak-structure",
        }
        for kind, cls in cases.items():
            r, got = self.gaps(kind)
            self.assertIn(cls, got, kind)
            self.assertLess(r["score"], 1.0, kind)

    def test_a_lost_gate_is_named_and_breaks_the_floor(self):
        r, got = self.gaps("drop-band", gates={"verse": True, "bands": False})
        self.assertIn("gate-failure", got)
        self.assertFalse(r["floors"]["noLostGate"])
        self.assertFalse(r["passed"])

    def test_single_measured_defects_stay_below_the_threshold_or_break_a_floor(self):
        # The threshold (0.95) and floors are set so that no single measured
        # defect class passes for parity on the stored example.
        for kind in ("drop-band", "quiz-half", "strip-verses", "misquote", "short-band", "quiz-bad-index",
                     "drop-fields", "long", "hard-child"):
            r, _ = self.gaps(kind)
            ok = r["passed"] and r["score"] >= pc.PROMOTION_THRESHOLD
            self.assertFalse(ok, "%s would count toward promotion (score %s, floors %s)" % (kind, r["score"], r["floors"]))

    def test_evidence_names_the_missing_verses(self):
        r, _ = self.gaps("strip-verses")
        miss = next(g for g in r["gaps"] if g["class"] == "missing-verse-retrieval")["evidence"]["missing"]
        self.assertIn("Hosea 4:6", miss)


class CrossReference(unittest.TestCase):
    def setUp(self):
        self.claude = V("c1", "claude", REF)
        other = copy.deepcopy(REF)
        other["lesson"] += ' THE NEW POINT. "Where there is no vision, the people perish" (Proverbs 29:18).'
        self.gemini = V("g1", "gemini-api", other)
        self.ollama_bad = V("o1", "ollama", degrade(REF, "misquote"))

    def test_all_pairs_and_consensus(self):
        x = pc.crossref([self.claude, self.gemini, self.ollama_bad])
        self.assertEqual(len(x["matrix"]), 3)  # every pair, not only against Claude
        self.assertEqual([e["writer"] for e in x["excluded"]], ["ollama"])  # the verse gate is absolute
        self.assertEqual(x["consensus"]["eligible"], 2)
        by_all = [v["verse"] for v in x["consensus"]["verses"]["all"]]
        self.assertIn("Deuteronomy 8:18", by_all)
        ins = [i for i in x["insights"] if i["kind"] == "verse"]
        self.assertEqual(ins, [{"kind": "verse", "item": "Proverbs 29:18", "writer": "gemini"}])
        self.assertIn("candidate insight", x["consensus"]["note"])
        self.assertEqual(x["referenceVsConsensus"]["consensusMissedByReference"], [])

    def test_a_stored_verse_gate_failure_also_excludes(self):
        v = V("g2", "gemini", REF, gates={"kjv-verbatim": False})
        x = pc.crossref([self.claude, v])
        self.assertEqual([e["writer"] for e in x["excluded"]], ["gemini"])

    def test_writer_families(self):
        for w, fam in [("claude-cli", "claude"), ("anthropic-api", "claude"), ("ollama:tower", "ollama"),
                       ("openclaw", "openclaw"), ("gemini-cli", "gemini"), ("chatgpt", "openai"),
                       ("openai-api", "openai"), ("my-endpoint", "compat")]:
            self.assertEqual(pc.writer_family({"writer": w}), fam, w)
        self.assertEqual(pc.writer_family({"writer": "x", "writer_family": "gemini"}), "gemini")


class Promotion(unittest.TestCase):
    def outs(self, n, ok=True):
        return [{"score": 0.97 if ok else 0.5, "passed": ok}] * n

    def test_streak_to_primary_and_the_hold(self):
        self.assertEqual(pc.promotion(self.outs(pc.PROMOTION_N - 1))["status"], "reference-only")
        self.assertEqual(pc.promotion(self.outs(pc.PROMOTION_N))["status"], "primary")
        self.assertEqual(pc.promotion(self.outs(pc.PROMOTION_N), held=True)["status"], "ready")

    def test_one_miss_resets_and_a_primary_writer_falls_back(self):
        o = self.outs(pc.PROMOTION_N) + self.outs(1, ok=False)
        p = pc.promotion(o)
        self.assertEqual((p["streak"], p["status"]), (0, "reference-only"))

    def test_a_high_score_with_a_broken_floor_does_not_count(self):
        p = pc.promotion([{"score": 0.99, "passed": False}] * 30)
        self.assertEqual(p["streak"], 0)

    def test_conservative_defaults(self):
        self.assertEqual(pc.PROMOTION_N, 14)
        self.assertEqual(pc.PROMOTION_THRESHOLD, 0.95)


class FakeIO:
    def __init__(self, versions):
        self.versions = versions
        self.parity, self.crossrefs, self.promos, self.fixes = [], {}, {}, []

    def list_versions(self):
        return list(self.versions)

    def get_version(self, vid):
        return next((v for v in self.versions if v["id"] == vid), None)

    def list_parity(self):
        return list(self.parity)

    def measured_keys(self):
        return set((r["version_id"], r["reference_version_id"], r["measure_version"]) for r in self.parity)

    def crossref_versions(self):
        return {k: v["version_ids"] for k, v in self.crossrefs.items()}

    def upsert_parity(self, row):
        self.parity.append(row)

    def upsert_crossref(self, row):
        self.crossrefs[row["teaching_row_id"]] = row

    def list_promotions(self):
        return list(self.promos.values())

    def upsert_promotion(self, row):
        prev = self.promos.get((row["writer_family"], row["model_label"]), {})
        self.promos[(row["writer_family"], row["model_label"])] = {**row, "held": prev.get("held", row.get("held"))}

    def list_fixes(self):
        return list(self.fixes)

    def insert_fix(self, row):
        self.fixes.append(row)

    def update_fix(self, fid, patch):
        for f in self.fixes:
            if f.get("id") == fid:
                f.update(patch)


def teachings(n, tower_body=None, start=0):
    vs = []
    for i in range(start, start + n):
        t = "t%03d" % i
        at = "2026-09-29T10:%02d:%02dZ" % (i // 60, i % 60)
        vs.append(V("c%03d" % i, "claude", REF, tid=t, created=at))
        vs.append(V("o%03d" % i, "ollama", tower_body if tower_body is not None else REF, tid=t, created=at, model="tower-a"))
    return vs


class MeasurePass(unittest.TestCase):
    def test_measures_every_teaching_no_count_cap_and_skips_what_is_measured(self):
        io = FakeIO(teachings(40))
        r = pl.measure_pass(io, budget=pl.Budget(600), now_iso="2026-09-29T12:00:00Z")
        self.assertEqual((r["teachings"], r["measured"], r["crossref"], r["stopped"]), (40, 40, 40, "all-measured"))
        self.assertEqual(r["primary"], ["ollama/tower-a"])  # 40 in a row at parity
        r2 = pl.measure_pass(io, budget=pl.Budget(600), now_iso="2026-09-29T12:15:00Z")
        self.assertEqual((r2["measured"], r2["skipped"], r2["crossref"]), (0, 40, 0))

    def test_time_budget_stops_cleanly_and_the_next_pass_continues(self):
        io = FakeIO(teachings(5))
        ticks = iter([0, 0, 0, 999, 999, 999, 999, 999, 999, 999, 999])
        r = pl.measure_pass(io, budget=pl.Budget(10, clock=lambda: next(ticks)))
        self.assertTrue(r["stopped"].startswith("time-budget"))
        self.assertLess(r["measured"], 5)
        r2 = pl.measure_pass(io, budget=pl.Budget(600))
        self.assertEqual(len(io.parity), 5)

    def test_a_teaching_with_no_reference_is_counted_not_guessed(self):
        io = FakeIO([V("o1", "ollama", REF, tid="lonely")])
        r = pl.measure_pass(io, budget=pl.Budget(60))
        self.assertEqual((r["noReference"], r["measured"]), (1, 0))

    def test_the_governor_hold_survives_the_loop(self):
        io = FakeIO(teachings(pc.PROMOTION_N))
        io.promos[("ollama", "tower-a")] = {"writer_family": "ollama", "model_label": "tower-a", "held": True, "status": "ready"}
        pl.measure_pass(io, budget=pl.Budget(600))
        self.assertEqual(io.promos[("ollama", "tower-a")]["status"], "ready")


class FakeLW:
    """Stands in for the builder's lesson_writer (DR-0669): the same three calls."""

    def __init__(self, configs=None, binary="/usr/local/bin/claude"):
        self.configs = configs if configs is not None else [
            {"name": "claude-nas", "kind": "cli-local", "primary": True, "model": "from-nas-config", "label": "house-claude"},
            {"name": "tower", "kind": "ollama", "family": "ollama"}]
        self.binary = binary

    def load_writer_configs(self, env):
        return self.configs

    def find_cli(self, cfg, env):
        return self.binary

    def _cli_prefix(self, cfg, env):
        return ["sudo", "-n", "-u", "dpoe", "-H", "--"], False


class FakeLane:
    def __init__(self, tmp, verify=(True, "")):
        self.tmp, self._verify, self.published, self.cleaned = tmp, verify, [], False

    def prepare(self, branch, key):
        wt = os.path.join(self.tmp, "wt-" + key)
        os.makedirs(wt, exist_ok=True)
        return wt

    def verify(self, wt, gap_class):
        return self._verify

    def publish(self, wt, branch, subject, body):
        self.published.append((branch, subject))

    def cleanup(self, wt):
        self.cleaned = True


def ok_runner(turns=5):
    def runner(cmd, **kw):
        return subprocess.CompletedProcess(cmd, 0, json.dumps({"num_turns": turns, "result": "done"}), "")
    return runner


class TheFixWriterIsTheBuildersClaude(unittest.TestCase):
    """No new step for Darrell: the fix runs on the same Claude Code CLI the builder writes with."""

    def test_argv_comes_from_the_builders_config(self):
        argv, label, why = pl.writer_argv({}, 40, loader=lambda: FakeLW())
        self.assertIsNone(why)
        self.assertEqual(argv[:7], ["sudo", "-n", "-u", "dpoe", "-H", "--", "/usr/local/bin/claude"])
        self.assertIn("--max-turns", argv)
        self.assertEqual(argv[argv.index("--max-turns") + 1], "40")
        self.assertEqual(argv[argv.index("--model") + 1], "from-nas-config")
        self.assertEqual(label, "house-claude")
        self.assertNotIn("git", argv[argv.index("--allowedTools") + 1])  # the loop owns git

    def test_no_model_in_config_means_no_model_flag(self):
        argv, _, _ = pl.writer_argv({}, 40, loader=lambda: FakeLW([{"name": "c", "kind": "cli-local"}]))
        self.assertNotIn("--model", argv)

    def test_an_ssh_only_or_missing_claude_is_reported_not_guessed(self):
        _, _, why = pl.writer_argv({}, 40, loader=lambda: FakeLW([{"name": "c", "kind": "cli-ssh", "target": "x"}]))
        self.assertIn("no local Claude Code CLI writer", why)
        _, _, why2 = pl.writer_argv({}, 40, loader=lambda: FakeLW(binary=""))
        self.assertIn("no claude binary", why2)

    def test_parity_fix_cmd_is_only_an_override(self):
        argv, label, _ = pl.writer_argv({"PARITY_FIX_CMD": "mycli --turns {max_turns}", "PARITY_FIX_MODEL_LABEL": "x"}, 9,
                                        loader=lambda: FakeLW())
        self.assertEqual((argv, label), (["mycli", "--turns", "9"], "x"))

    def test_the_real_builder_code_is_read(self):
        # Against #1837's own lesson_writer (DR-0669): with no writers file, its
        # default list starts with the local Claude CLI.
        env = {"LESSON_WRITERS_FILE": "/nonexistent/lesson-writers.json", "LESSON_CLI_BIN": "/bin/sh"}
        argv, label, why = pl.writer_argv(env, 12)
        self.assertIsNone(why, why)
        self.assertIn("/bin/sh", argv)
        self.assertEqual(argv[argv.index("--max-turns") + 1], "12")


class Brakes(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        self.repo = os.path.join(self.tmp, "repo")
        os.makedirs(os.path.join(self.repo, "infra", "nas-loops"))
        self.data = os.path.join(self.tmp, "data")
        os.makedirs(self.data)
        self.write_services({"name": "lesson-parity", "enabled": True, "fix_enabled": True})
        open(os.path.join(self.repo, "infra", "nas-loops", "ARMED-BY-RECORD"), "w").close()
        bad = degrade(REF, "strip-verses")
        self.io = FakeIO(teachings(4, tower_body=bad))
        pl.measure_pass(self.io, budget=pl.Budget(600))

    def tearDown(self):
        shutil.rmtree(self.tmp)

    def write_services(self, entry):
        with open(os.path.join(self.repo, "infra", "nas-loops", "services.json"), "w") as f:
            json.dump({"services": [entry]}, f)

    # --- KILL -----------------------------------------------------------
    def test_kill_by_deleting_armed_by_record(self):
        os.remove(os.path.join(self.repo, "infra", "nas-loops", "ARMED-BY-RECORD"))
        self.assertFalse(pl.kill_state(self.repo, "measure")[0])
        r = pl.fix_step(self.io, env={"PARITY_FIX_CMD": "x"}, data_dir=self.data, repo=self.repo)
        self.assertEqual((r["ran"], r["stopped"][:5]), (False, "kill:"))

    def test_kill_by_enabled_false(self):
        self.write_services({"name": "lesson-parity", "enabled": False})
        self.assertEqual(pl.kill_state(self.repo, "measure")[0], False)
        self.assertEqual(pl.kill_state(self.repo, "fix")[0], False)

    def test_fix_enabled_false_stops_only_the_claude_step(self):
        self.write_services({"name": "lesson-parity", "enabled": True, "fix_enabled": False})
        self.assertTrue(pl.kill_state(self.repo, "measure")[0])
        self.assertFalse(pl.kill_state(self.repo, "fix")[0])

    def test_the_real_repo_is_armed_and_the_entry_is_enabled(self):
        self.assertEqual(pl.kill_state(pc.REPO, "fix"), (True, "go"))

    # --- LOCK -----------------------------------------------------------
    def test_single_instance_lock(self):
        self.assertTrue(pl.acquire_lock(self.data, "fix"))
        self.assertFalse(pl.acquire_lock(self.data, "fix"))
        r = pl.fix_step(self.io, env={"PARITY_FIX_CMD": "x"}, data_dir=self.data, repo=self.repo)
        self.assertEqual(r["stopped"], "lock: a fix step is already running")
        pl.release_lock(self.data, "fix")
        self.assertTrue(pl.acquire_lock(self.data, "fix"))

    def test_a_stale_lock_is_broken(self):
        self.assertTrue(pl.acquire_lock(self.data, "fix"))
        old = time.time() - 10 ** 6
        os.utime(os.path.join(self.data, "fix.lock"), (old, old))
        self.assertTrue(pl.acquire_lock(self.data, "fix", max_age=60))

    # --- BUDGET ---------------------------------------------------------
    def test_wall_clock_budget_kills_the_writer(self):
        def runner(cmd, **kw):
            raise subprocess.TimeoutExpired(cmd, kw["timeout"])
        r = pl.run_writer("claude -p --max-turns {max_turns}", "x", self.tmp, 5, 3, runner)
        self.assertEqual(r["status"], "budget-stopped")

    def test_the_turn_budget_reaches_the_writer_and_is_checked(self):
        seen = {}

        def runner(cmd, **kw):
            seen["cmd"] = cmd
            return subprocess.CompletedProcess(cmd, 0, json.dumps({"num_turns": 9, "result": "BRANCH: b\nPR: none"}), "")
        r = pl.run_writer("claude -p --max-turns {max_turns}", "x", self.tmp, 5, 3, runner)
        self.assertIn("3", seen["cmd"])
        self.assertEqual(r["status"], "budget-stopped")

    def test_a_real_timeout_with_a_real_process(self):
        r = pl.run_writer("sleep 5", "x", self.tmp, 1, 3)
        self.assertEqual(r["status"], "budget-stopped")

    # --- the step end to end ---------------------------------------------
    def no_builder(self):
        raise ImportError("no lesson_writer")

    def test_no_writer_stores_the_ready_prompt_and_a_writer_then_runs_it(self):
        r = pl.fix_step(self.io, env={}, data_dir=self.data, repo=self.repo, loader=self.no_builder)
        self.assertEqual(r["gap"], "missing-verse-retrieval")
        self.assertEqual(self.io.fixes[0]["status"], "awaiting-writer")
        self.assertIn("missing-verse-retrieval", self.io.fixes[0]["prompt_text"])
        r2 = pl.fix_step(self.io, env={}, data_dir=self.data, repo=self.repo, loader=self.no_builder)
        self.assertNotEqual(r2.get("gap"), "missing-verse-retrieval")  # an open request blocks a second
        # once a writer exists, the waiting class is run for real
        lane = FakeLane(self.tmp)
        r3 = pl.fix_step(self.io, env={}, data_dir=self.data, repo=self.repo, runner=ok_runner(),
                         lane=lane, loader=lambda: FakeLW())
        self.assertEqual((r3["gap"], r3["status"]), ("missing-verse-retrieval", "pushed"))

    def test_a_pushed_fix_is_verified_by_the_loop_then_published(self):
        lane = FakeLane(self.tmp)
        r = pl.fix_step(self.io, env={}, data_dir=self.data, repo=self.repo, runner=ok_runner(7),
                        lane=lane, loader=lambda: FakeLW())
        self.assertEqual(r["status"], "pushed")
        self.assertTrue(r["branch"].startswith("claude/parity-fix-missing-verse-retrieval-"))
        self.assertEqual(lane.published[0][0], r["branch"])
        self.assertEqual(self.io.fixes[0]["turns"], 7)
        self.assertEqual(self.io.fixes[0]["writer_label"], "house-claude")
        self.assertTrue(lane.cleaned)
        self.assertFalse(os.path.exists(os.path.join(self.data, "fix.lock")))  # released

    def test_a_fix_whose_tests_fail_is_never_pushed(self):
        lane = FakeLane(self.tmp, verify=(False, "the parity tests fail"))
        r = pl.fix_step(self.io, env={}, data_dir=self.data, repo=self.repo, runner=ok_runner(),
                        lane=lane, loader=lambda: FakeLW())
        self.assertEqual(r["status"], "failed")
        self.assertEqual(lane.published, [])  # PROVEN-TO-CATCH: the model's word is not the proof

    def test_auto_pause_after_three_failures_and_it_decays(self):
        def runner(cmd, **kw):
            return subprocess.CompletedProcess(cmd, 1, "", "boom")
        now = time.time()
        kw = dict(env={}, data_dir=self.data, repo=self.repo, runner=runner, loader=lambda: FakeLW())
        for i in range(pl.FIX_MAX_FAILURES):
            self.io.fixes.clear()
            pl.fix_step(self.io, now=now, lane=FakeLane(self.tmp), **kw)
        r = pl.fix_step(self.io, now=now + 60, lane=FakeLane(self.tmp), **kw)
        self.assertTrue(r["stopped"].startswith("auto-paused"))
        self.io.fixes.clear()
        r2 = pl.fix_step(self.io, now=now + pl.FIX_PAUSE_HOURS * 3600 + 1, lane=FakeLane(self.tmp), **kw)
        self.assertTrue(r2["ran"])

    def test_the_reference_writer_is_never_given_a_fix(self):
        rows = [{"writer_family": "claude", "gap_classes": ["quiz-count"], "measured_at": str(i)} for i in range(10)]
        self.assertIsNone(pl.pick_gap(rows, []))


class FixesAreCarriedToTheirOutcome(unittest.TestCase):
    """Hold the hand (DR-0621): a pushed fix is followed until the data says it worked."""

    def rows(self, n, with_gap, start_hour):
        return [{"writer_family": "ollama", "gap_classes": ["quiz-count"] if with_gap else [],
                 "measured_at": "2026-10-%02dT%02d:00:00Z" % (1 + (start_hour + i) // 24, (start_hour + i) % 24)} for i in range(n)]

    def fix(self, status, created="2026-09-30T00:00:00Z"):
        return {"id": "f", "status": status, "gap_class": "quiz-count", "writer_family": "ollama",
                "created_at": created, "before": {"rate": 0.6}}

    def test_pushed_becomes_merged_when_its_module_is_on_main(self):
        self.assertEqual(pl.settle_fixes([self.fix("pushed")], [], {"quiz-count"})[0][1]["status"], "merged")

    def test_merged_is_verified_only_by_the_next_teachings(self):
        self.assertEqual(pl.settle_fixes([self.fix("merged")], self.rows(5, False, 0), set()), [])  # too few yet
        ok = pl.settle_fixes([self.fix("merged")], self.rows(10, False, 0), set())[0][1]
        self.assertEqual((ok["status"], ok["after"]["rate"]), ("closed-verified", 0.0))
        bad = pl.settle_fixes([self.fix("merged")], self.rows(10, True, 0), set())[0][1]
        self.assertEqual(bad["status"], "failed")  # PROVEN-TO-CATCH: a fix that did not close the gap is not called closed

    def test_a_pushed_fix_never_merged_is_released(self):
        old = self.fix("pushed", created="2026-08-01T00:00:00Z")
        self.assertEqual(pl.settle_fixes([old], [], set(), now=pl._epoch("2026-09-29T00:00:00Z"))[0][1]["status"], "failed")

    def test_the_measure_pass_settles_fixes(self):
        io = FakeIO(teachings(2))
        io.fixes.append({"id": "f9", "status": "pushed", "gap_class": "missing-verse-retrieval", "writer_family": "ollama",
                         "created_at": "2026-09-29T00:00:00Z"})
        r = pl.measure_pass(io, budget=pl.Budget(60))
        self.assertEqual((r["fixesSettled"], io.fixes[0]["status"]), (1, "merged"))


class FirstFixClosesItsGap(unittest.TestCase):
    """missing-verse-retrieval, re-measured on the stored example before and after."""

    def teaching(self, with_refs):
        t = REF["title"] + ". " + REF["bigIdea"]
        if not with_refs:
            t = re.sub(r'"[^"]*"', "", re.sub(r"\([^)]*\d+:\d+[^)]*\)", "", t))
        return t

    def coverage(self, cited):
        want = pc.cited_verses(REF)
        return len(want & set(cited)) / len(want)

    def test_the_prompt_carries_the_missing_verses(self):
        tower = V("o", "ollama", degrade(REF, "strip-verses"))
        before = pc.compare(V("r", "claude", REF), tower)
        self.assertIn("missing-verse-retrieval", [g["class"] for g in before["gaps"]])
        b_cov = before["sections"]["coverage"]["verses"]["coverage"]
        ctx = fixes.apply_stage("pre", {"teaching": self.teaching(False), "prompt": "WRITE THE LESSON"})
        after = self.coverage(set(pc.cited_verses(tower["body"])) | set(ctx["supplied"]))
        self.assertGreater(after, b_cov)          # the gap is smaller
        self.assertGreaterEqual(after, 3 / 7)     # measured: 3 of the 7 by keywords alone
        self.assertIn("VERSES FROM THE KJV CORPUS", ctx["prompt"])

    def test_a_teaching_that_names_its_verses_gets_every_one_and_its_neighbors(self):
        spoken = self.teaching(False) + " Teach it from Hosea 4:6, Luke 14:28 and James 4:15 too."
        ctx = vr.apply({"teaching": spoken, "prompt": ""})
        for v in ("Hosea 4:6", "Luke 14:28", "James 4:15"):
            self.assertIn(v, ctx["supplied"])
        self.assertTrue(any(x["reason"].startswith("xref:") for x in vr.retrieve(spoken)))
        # measured: 6 of the reference's 7 verses reach the prompt this way
        self.assertGreaterEqual(self.coverage(ctx["supplied"]), pc.VERSE_COVERAGE_MIN)

    def test_every_supplied_verse_is_the_corpus_text_verbatim(self):
        for x in vr.retrieve("power to get wealth"):
            book, cv = x["verse"].rsplit(" ", 1)
            ch, v = cv.split(":")
            self.assertEqual(x["text"], pc.verse_text(book, ch, v))

    def test_deterministic(self):
        self.assertEqual(vr.retrieve("faith moves first"), vr.retrieve("faith moves first"))

    def test_the_fix_is_registered_for_its_class(self):
        self.assertEqual(fixes.closes().get("missing-verse-retrieval"), "verse_retrieval")


if __name__ == "__main__":
    unittest.main()
