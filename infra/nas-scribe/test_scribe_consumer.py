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

    # --- DR-0611: the upload is the shape whisper-gpu reads ---------------------
    def test_upload_is_multipart_not_octet_stream(self):
        body, ctype = c.multipart_body("recording.webm", b"AUDIO")
        self.assertTrue(ctype.startswith("multipart/form-data; boundary="))
        self.assertIn(b'name="file"; filename="recording.webm"', body)
        self.assertIn(b"AUDIO", body)

    def test_default_whisper_is_the_tower_not_the_voice_forwarder_port(self):
        src = open(c.__file__, encoding="utf-8").read()
        self.assertIn('"WHISPER_URL", "http://tlcmediadpt:8771"', src)
        self.assertNotIn('"WHISPER_URL", "http://127.0.0.1:8771"', src)


class ScribeResultsComeBack(unittest.TestCase):
    """DR-0622: what a recording BECAME is read back, and the family key opens
    the door the app's devices already carry."""

    def setUp(self):
        import scribe_results as r
        self.r = r
        self.dir = tempfile.mkdtemp(prefix="scribe-results-")
        self.sdir = os.path.join(self.dir, "sessions", "scribe-abc12345")
        os.makedirs(self.sdir)
        with open(os.path.join(self.sdir, "session.json"), "w", encoding="utf-8") as f:
            json.dump({"sessionId": "scribe-abc12345", "kind": "meeting", "createdAt": "2026-09-24T10:00:00Z"}, f)

    def tearDown(self):
        shutil.rmtree(self.dir, ignore_errors=True)

    def test_each_state_is_read_from_a_file_that_exists(self):
        self.assertEqual(self.r.session_summary(self.sdir)["state"], "recording")
        open(os.path.join(self.sdir, "manifest.json"), "w").write("{}")
        self.assertEqual(self.r.session_summary(self.sdir)["state"], "queued")
        with open(os.path.join(self.sdir, "transcript.json"), "w", encoding="utf-8") as f:
            json.dump({"segments": [{"text": "Welcome."}, {"text": "Let us begin."}]}, f)
        s = self.r.session_summary(self.sdir, with_words=True)
        self.assertEqual(s["state"], "transcribed")
        self.assertEqual(s["transcript"], "Welcome. Let us begin.")
        with open(os.path.join(self.sdir, "minutes.md"), "w", encoding="utf-8") as f:
            f.write("Decided: meet weekly.")
        s = self.r.session_summary(self.sdir, with_words=True)
        self.assertEqual(s["state"], "minuted")
        self.assertEqual(s["minutes"], "Decided: meet weekly.")

    def test_the_list_carries_states_not_words(self):
        rows = self.r.list_sessions(self.dir)
        self.assertEqual([x["sessionId"] for x in rows], ["scribe-abc12345"])
        self.assertNotIn("transcript", rows[0])
        self.assertEqual(self.r.list_sessions(os.path.join(self.dir, "none")), [])

    def test_the_lock_takes_either_key_and_never_opens_with_none(self):
        self.assertTrue(self.r.bearer_ok("Bearer fam", ["scribe", "fam"]))
        self.assertTrue(self.r.bearer_ok("Bearer scribe", ["scribe", ""]))
        self.assertFalse(self.r.bearer_ok("Bearer wrong", ["scribe", "fam"]))
        self.assertFalse(self.r.bearer_ok("", ["", ""]))  # no key configured = closed, never open
        self.assertFalse(self.r.bearer_ok("Bearer ", ["", ""]))

    def test_the_server_serves_the_words_and_uses_the_shared_lock(self):
        src = open(os.path.join(os.path.dirname(c.__file__), "scribe_ingest_server.py"), encoding="utf-8").read()
        self.assertIn('@app.get("/scribe/sessions")', src)
        self.assertIn("session_summary(sdir, with_words=True)", src)
        self.assertIn("bearer_ok(request.headers.get(\"authorization\", \"\"), [TOKEN, family])", src)


if __name__ == "__main__":
    unittest.main()
