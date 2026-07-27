"""test_scribe_consumer -- proven-to-catch coverage for the three brakes
(DR-0068 / DR-0225 / DR-0236). Each test FIRES the failure class the brake
exists to stop: stacking runs, runaway budgets, silent auto-continue after
failure, and active-by-accident. No GPU, no network -- transcribe/summarize
are injected."""
import json
import os
import shutil
import tempfile
import unittest

import scribe_queue_consumer as c


def write_queue(data_dir, entries):
    with open(os.path.join(data_dir, "whisper-queue.jsonl"), "w", encoding="utf-8") as f:
        for e in entries:
            f.write(json.dumps(e) + "\n")


def entry(i):
    return {"sessionId": f"s{i}", "kind": "meeting", "path": f"/tmp/none-{i}.webm", "seconds": 60}


class ScribeConsumerBrakes(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.mkdtemp(prefix="scribe-test-")
        self.active = {"SCRIBE_CONSUMER_ACTIVE": "1"}

    def tearDown(self):
        shutil.rmtree(self.dir, ignore_errors=True)

    # --- brake 0: inactive by default (DR-0225 -- shipping is not activating) ---
    def test_inactive_by_default_processes_nothing(self):
        write_queue(self.dir, [entry(1)])
        report = c.run_once(self.dir, transcribe=lambda e: {"text": "hi"}, env={})
        self.assertFalse(report["ran"])
        self.assertEqual(report["stopped"], "inactive")
        self.assertEqual(report["processed"], [])

    # --- brake 1: BUDGET -----------------------------------------------------
    def test_item_budget_stops_the_run(self):
        write_queue(self.dir, [entry(i) for i in range(10)])
        report = c.run_once(self.dir, transcribe=lambda e: {"text": "ok"}, env=self.active)
        self.assertEqual(len(report["processed"]), c.MAX_ITEMS_PER_RUN)
        self.assertEqual(report["stopped"], "item-budget")

    def test_time_budget_stops_the_run(self):
        write_queue(self.dir, [entry(i) for i in range(3)])
        ticks = {"t": 0.0}

        def clock():
            ticks["t"] += c.MAX_RUN_SECONDS  # every check crosses the ceiling
            return ticks["t"]

        report = c.run_once(self.dir, transcribe=lambda e: {"text": "ok"}, env=self.active, clock=clock)
        self.assertEqual(report["stopped"], "time-budget")
        self.assertLess(len(report["processed"]), 3)

    # --- brake 2: CONCURRENCY LOCK -------------------------------------------
    def test_second_instance_skips_never_stacks(self):
        self.assertTrue(c.acquire_lock(self.dir))
        write_queue(self.dir, [entry(1)])
        report = c.run_once(self.dir, transcribe=lambda e: {"text": "ok"}, env=self.active)
        self.assertEqual(report["stopped"], "locked-skip")
        self.assertFalse(report["ran"])
        c.release_lock(self.dir)

    def test_stale_lock_is_broken_not_wedged(self):
        p = c.lock_path(self.dir)
        with open(p, "w", encoding="utf-8") as f:
            f.write("dead")
        old = 10_000_000.0
        os.utime(p, (old, old))
        self.assertTrue(c.acquire_lock(self.dir))
        c.release_lock(self.dir)

    # --- brake 3: KILL-SWITCH ------------------------------------------------
    def test_paused_file_halts_everything(self):
        c.pause(self.dir, "manual")
        write_queue(self.dir, [entry(1)])
        report = c.run_once(self.dir, transcribe=lambda e: {"text": "ok"}, env=self.active)
        self.assertEqual(report["stopped"], "paused")
        self.assertFalse(report["ran"])

    def test_consecutive_failures_auto_pause_and_never_auto_continue(self):
        write_queue(self.dir, [entry(i) for i in range(5)])

        def boom(e):
            raise RuntimeError("gpu-offline")

        report = c.run_once(self.dir, transcribe=boom, env=self.active)
        self.assertEqual(report["stopped"], "auto-paused")
        self.assertEqual(len(report["failed"]), c.MAX_CONSECUTIVE_FAILURES)
        self.assertTrue(c.is_paused(self.dir))
        # the next fire finds the pause and does NOT continue
        again = c.run_once(self.dir, transcribe=lambda e: {"text": "ok"}, env=self.active)
        self.assertEqual(again["stopped"], "paused")

    def test_one_failure_then_success_does_not_pause(self):
        write_queue(self.dir, [entry(1), entry(2)])
        calls = {"n": 0}

        def flaky(e):
            calls["n"] += 1
            if calls["n"] == 1:
                raise RuntimeError("blip")
            return {"text": "ok"}

        report = c.run_once(self.dir, transcribe=flaky, env=self.active)
        self.assertFalse(c.is_paused(self.dir))
        self.assertEqual(report["processed"], ["s2"])
        self.assertEqual(len(report["failed"]), 1)

    # --- idempotence: a processed session never runs twice --------------------
    def test_processed_sessions_are_skipped_on_rerun(self):
        write_queue(self.dir, [entry(1), entry(2)])
        first = c.run_once(self.dir, transcribe=lambda e: {"text": "ok"}, env=self.active)
        self.assertEqual(sorted(first["processed"]), ["s1", "s2"])
        rerun = c.run_once(self.dir, transcribe=lambda e: {"text": "ok"}, env=self.active)
        self.assertEqual(rerun["processed"], [])
        self.assertEqual(rerun["stopped"], "queue-drained")

    def test_duplicate_queue_lines_dedupe(self):
        write_queue(self.dir, [entry(1), entry(1), entry(1)])
        report = c.run_once(self.dir, transcribe=lambda e: {"text": "ok"}, env=self.active)
        self.assertEqual(report["processed"], ["s1"])

    def test_bad_queue_lines_are_skipped_never_fatal(self):
        with open(os.path.join(self.dir, "whisper-queue.jsonl"), "w", encoding="utf-8") as f:
            f.write("not-json\n\n" + json.dumps(entry(1)) + "\n")
        report = c.run_once(self.dir, transcribe=lambda e: {"text": "ok"}, env=self.active)
        self.assertEqual(report["processed"], ["s1"])

    # --- the lock always releases, even on a crash inside the run -------------
    def test_lock_released_after_run(self):
        write_queue(self.dir, [entry(1)])
        c.run_once(self.dir, transcribe=lambda e: {"text": "ok"}, env=self.active)
        self.assertFalse(os.path.isfile(c.lock_path(self.dir)))


if __name__ == "__main__":
    unittest.main()
