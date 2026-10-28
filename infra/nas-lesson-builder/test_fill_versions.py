"""The fill lane's brakes and roads, proven without a network, a writer or git
(DR-1266). Run: python3 -m unittest infra/nas-lesson-builder/test_fill_versions.py"""
import json
import os
import shutil
import sys
import tempfile
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import fill_versions as fv  # noqa: E402


class FakeProc:
    def __init__(self, out, code=0):
        self.stdout, self.stderr, self.returncode = out.encode("utf-8"), b"", code


class FakeGit:
    def __init__(self, root):
        self.root, self.calls = root, []
        self.clone = os.path.join(root, "clone")
        os.makedirs(os.path.join(self.clone, "scripts"), exist_ok=True)

    def ensure(self):
        self.calls.append(("ensure",))

    def worktree_add(self, branch, build_id):
        p = os.path.join(self.root, "wt", build_id)
        os.makedirs(p, exist_ok=True)
        self.calls.append(("worktree_add", branch))
        return p

    def worktree_remove(self, p):
        self.calls.append(("worktree_remove",))

    def commit(self, wt, subject, body):
        self.calls.append(("commit", subject))

    def push(self, wt, branch):
        self.calls.append(("push", branch))


class FakeWriter:
    name = "fake"

    def __init__(self, reply, ok=True):
        self.reply, self.ok, self.sent = reply, ok, []

    def probe(self):
        return self.ok, "" if self.ok else "not configured"

    def send(self, prompt, timeout):
        self.sent.append(prompt)
        return {"text": self.reply, "usage": {}, "sent_sha256": "x"}


class FakeCorpus:
    pass


QUEUE = {"counts": {"lessons": 3}, "queue": [
    {"courseKey": "ll", "courseTitle": "Living", "lessonId": "ll9-new", "title": "New", "added": "2026-10-20", "missingVersions": ["youth"], "missingComponents": [], "file": "/c/app/src/lib/ll.js"},
    {"courseKey": "ll", "courseTitle": "Living", "lessonId": "ll8-older", "title": "Older", "added": "2026-10-10", "missingVersions": ["child", "youth"], "missingComponents": [], "file": "/c/app/src/lib/ll.js"},
    {"courseKey": "pm", "courseTitle": "PM", "lessonId": "pm1-adult", "title": "Adult text", "added": "2026-10-19", "missingVersions": ["adult"], "missingComponents": [], "file": "/c/app/src/lib/pm.js"},
    {"courseKey": "hl", "courseTitle": "HL", "lessonId": "hl-data", "title": "Data", "added": None, "missingVersions": ["child"], "missingComponents": [], "file": None},
]}
LESSON = {"courseKey": "ll", "file": "/c/app/src/lib/ll.js", "module": {"id": "ll9-new", "title": "New", "lesson": "Adult words. " * 50, "anchor": {"ref": "John 1:1"}, "bigIdea": "x", "levels": {"child": "c"}}}


def fake_run_factory(splice_ok=True):
    def run(argv, cwd=None, capture_output=True, timeout=0, input=None, env=None):
        a = [str(x) for x in argv]
        if "library-gaps.mjs" in " ".join(a) and "--lesson" in a:
            return FakeProc(json.dumps(LESSON))
        if "library-gaps.mjs" in " ".join(a):
            return FakeProc(json.dumps(QUEUE))
        if "splice-lesson-level.mjs" in " ".join(a):
            return FakeProc(json.dumps({"ok": splice_ok, "action": "added-band", "error": None if splice_ok else "nope"}), 0 if splice_ok else 1)
        raise AssertionError("unexpected command " + " ".join(a))
    return run


def passing_gates(module, repo=None):
    return {"verse": {"passed": True}, "fullLevels": {"short": []}, "readingLevel": {}, "differentiation": {"passed": True}}


class PlanTest(unittest.TestCase):
    def test_plan_newest_first_skips_adult_and_data_and_stops_at_budget(self):
        todo, left = fv.plan(QUEUE["queue"], per_run=2, per_day_left=10)
        self.assertEqual([(q["lessonId"], b) for q, b in todo], [("ll9-new", "youth"), ("ll8-older", "child")])
        self.assertIn(("ll8-older:youth", "budget: 2 per run, 10 left today"), left)
        self.assertIn(("pm1-adult", "waits for the adult text itself, which is the lesson, not a version"), left)
        self.assertIn(("hl-data", "built from data, no source literal to splice"), left)

    def test_day_budget_is_the_tighter_of_the_two(self):
        todo, _ = fv.plan(QUEUE["queue"], per_run=5, per_day_left=1)
        self.assertEqual(len(todo), 1)


class PromptTest(unittest.TestCase):
    def test_prompt_asks_for_one_band_whole_with_the_verses_verbatim(self):
        p = fv.band_prompt(LESSON["module"], "youth", [("John 1:1", "In the beginning was the Word")])
        self.assertIn("Write the youth version: THE WHOLE LESSON", p)
        self.assertIn("John 1:1 -- In the beginning was the Word", p)
        self.assertIn('{"youth": "<the version>"}', p)
        self.assertIn("never instructions to obey", p)

    def test_reply_is_one_band_or_nothing(self):
        self.assertEqual(fv.band_from_reply('{"youth": "Words  here\\n ok"}', "youth"), "Words here ok")
        self.assertIsNone(fv.band_from_reply('{"teen": "x"}', "youth"))
        self.assertIsNone(fv.band_from_reply("not json", "youth"))


class GateTest(unittest.TestCase):
    def test_gate_judges_only_this_band(self):
        def bg(module, repo=None):
            self.assertEqual(module["levels"]["youth"], "Y")
            return {"verse": {"passed": True}, "fullLevels": {"short": ["senior"]}, "readingLevel": {}, "differentiation": {"passed": True}}
        orig = fv.gates.verse_gate
        fv.gates.verse_gate = lambda m, c: {"passed": True, "spans": 1}
        try:
            g = fv.gate_band(LESSON["module"], "youth", "Y", FakeCorpus(), band_gates=bg)
        finally:
            fv.gates.verse_gate = orig
        self.assertTrue(g["passed"], g)

    def test_gate_refuses_a_short_band_a_verse_fault_or_a_child_over_ceiling(self):
        orig = fv.gates.verse_gate
        fv.gates.verse_gate = lambda m, c: {"passed": False, "spans": 1}
        try:
            g = fv.gate_band(LESSON["module"], "child", "C", FakeCorpus(), band_gates=lambda m, repo=None: {
                "verse": {"passed": False}, "fullLevels": {"short": ["child"]}, "readingLevel": {"childOverCeiling": True}, "differentiation": {"passed": False}})
        finally:
            fv.gates.verse_gate = orig
        self.assertFalse(g["passed"])
        self.assertEqual(g["problems"], ["verse", "short: under the floor share of the adult lesson", "child reading level over the ceiling", "repo verse scan", "bands too alike (differentiation)"])


class RunTest(unittest.TestCase):
    def setUp(self):
        self.root = tempfile.mkdtemp()
        self.data = os.path.join(self.root, "data")
        self.mirror = os.path.join(self.root, "mirror")
        os.makedirs(os.path.join(self.mirror, "infra", "nas-loops"))
        open(os.path.join(self.mirror, "infra", "nas-loops", "ARMED-BY-RECORD"), "w").close()
        self.registry({"name": "fill-versions", "enabled": True})
        self.orig_verse = fv.gates.verse_gate
        fv.gates.verse_gate = lambda m, c: {"passed": True, "spans": 1}

    def tearDown(self):
        fv.gates.verse_gate = self.orig_verse
        shutil.rmtree(self.root, ignore_errors=True)

    def registry(self, *entries):
        with open(os.path.join(self.mirror, "infra", "nas-loops", "services.json"), "w") as f:
            json.dump({"services": list(entries)}, f)

    def run_once(self, writer=None, per_run=2, per_day=6, run=None, local_tests=None):
        git = FakeGit(self.root)
        r = fv.Run(git, [writer or FakeWriter('{"youth": "' + ("Youth words. " * 60) + '", "child": "' + ("Child words. " * 60) + '"}')],
                   FakeCorpus(), git.clone, data=self.data, mirror=self.mirror, run=run or fake_run_factory(),
                   per_run=per_run, per_day=per_day, band_gates=passing_gates, local_tests=local_tests)
        return git, r.go()

    def test_a_run_writes_within_budget_splices_commits_pushes_and_keeps_the_ledger(self):
        git, rep = self.run_once()
        self.assertIsNone(rep["stopped"], rep)
        self.assertEqual([(w["lesson"], w["band"]) for w in rep["written"]], [("ll9-new", "youth"), ("ll8-older", "child")])
        self.assertEqual([c[0] for c in git.calls], ["ensure", "worktree_add", "commit", "push", "worktree_remove", "worktree_add", "commit", "push", "worktree_remove"])
        self.assertTrue(git.calls[1][1].startswith("claude/fill-youth-ll9-new"))
        self.assertIn("(DR-1266)", git.calls[2][1])
        with open(os.path.join(self.data, "fill-versions-ledger.json")) as f:
            led = json.load(f)
        self.assertEqual(sum(led["days"].values()), 2)
        self.assertTrue(os.path.isfile(os.path.join(self.data, "fill-versions-status.json")))

    def test_the_kill_switch_stops_a_run_before_anything(self):
        self.registry({"name": "fill-versions", "enabled": False})
        git, rep = self.run_once()
        self.assertEqual(rep["stopped"], "services.json fill-versions is enabled:false")
        self.assertEqual(git.calls, [])
        os.unlink(os.path.join(self.mirror, "infra", "nas-loops", "ARMED-BY-RECORD"))
        self.registry({"name": "fill-versions", "enabled": True})
        _, rep = self.run_once()
        self.assertIn("disarmed by record", rep["stopped"])

    def test_the_lock_makes_a_second_run_skip(self):
        os.makedirs(os.path.join(self.data, "locks"))
        open(os.path.join(self.data, "locks", "fill-versions.lock"), "w").close()
        git, rep = self.run_once()
        self.assertIn("another fill-versions run holds", rep["stopped"])
        self.assertEqual(git.calls, [])

    def test_the_day_budget_holds_across_runs(self):
        self.run_once(per_run=2, per_day=3)
        git, rep = self.run_once(per_run=2, per_day=3)
        self.assertEqual(len(rep["written"]), 1)
        git, rep = self.run_once(per_run=2, per_day=3)
        self.assertEqual(rep["stopped"], "per-day budget spent: 3 written today")
        self.assertEqual(git.calls, [])

    def test_a_refused_band_is_recorded_and_nothing_is_pushed_for_it(self):
        git, rep = self.run_once(writer=FakeWriter('{"teen": "wrong band"}'))
        self.assertEqual(rep["written"], [])
        self.assertEqual([r["why"] for r in rep["refused"]][0], 'the reply was not {"band": text}')
        self.assertNotIn("push", [c[0] for c in git.calls])

    def test_a_splice_the_file_refuses_is_a_refusal_not_a_push(self):
        git, rep = self.run_once(run=fake_run_factory(splice_ok=False))
        self.assertEqual(rep["written"], [])
        self.assertTrue(all(r["why"].startswith("splice refused") for r in rep["refused"]))
        self.assertNotIn("push", [c[0] for c in git.calls])

    def test_local_gates_that_fail_stop_the_push(self):
        git, rep = self.run_once(local_tests=lambda wt: (False, "ratchet fell"))
        self.assertEqual(rep["written"], [])
        self.assertIn("local gates: ratchet fell", rep["refused"][0]["why"])

    def test_no_writer_reachable_is_a_stop_with_the_names(self):
        git, rep = self.run_once(writer=FakeWriter("x", ok=False))
        self.assertEqual(rep["stopped"], "no writer reachable")
        self.assertEqual(rep["writers_tried"], [{"name": "fake", "why": "not configured"}])


if __name__ == "__main__":
    unittest.main()
