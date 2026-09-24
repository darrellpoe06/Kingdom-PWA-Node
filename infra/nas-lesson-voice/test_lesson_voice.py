"""Proofs for lesson_voice_transcribe.py (DR-0611). Stdlib unittest; no network.
Each behavior is proven-to-catch: the road, the ladder order, the fallback,
idempotency, the budget, the lock, and the honest failure after MAX_ATTEMPTS."""
import os
import tempfile
import unittest

import lesson_voice_transcribe as lv

UID = "f13843f2-742b-4f8a-82af-7ecfbdc536ec"
INST = "11111111-1111-1111-1111-111111111111"


def voice_row(i, extra=None):
    return {"id": f"row-{i}", "instance_id": INST, "created_by": UID,
            "tags": ["lesson", "voice", f"audio:{UID}/2026-{i}.webm"] + (extra or [])}


class FakeIO:
    def __init__(self, rows, text="In the beginning was the Word.", fail=None, has=None):
        self.rows = rows
        self.text = text
        self.fail = fail or set()
        self.has = has or set()
        self.inserted, self.tagged, self.deleted, self.downloaded = [], [], [], []

    def list_rows(self):
        return self.rows

    def has_transcript(self, rid):
        return rid in self.has

    def download(self, path):
        self.downloaded.append(path)
        return "/tmp/" + path.replace("/", "_")

    def transcribe_ladder(self, local):
        if any(f in local for f in self.fail):
            raise RuntimeError("tower dark and no CPU whisper")
        return {"text": self.text, "rung": "the 4070 tower", "rung_key": "tlcmediadpt", "model": "large-v3-turbo", "duration_sec": 75}

    def insert_row(self, row):
        self.inserted.append(row)

    def add_tags(self, row, extra):
        row["tags"] = list(row["tags"]) + [t for t in extra if t not in row["tags"]]
        self.tagged.append((row["id"], extra))

    def delete_audio(self, path):
        self.deleted.append(path)


class TheRoad(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.mkdtemp()

    def test_a_voice_row_becomes_a_transcript_row_and_the_cloud_copy_goes(self):
        io = FakeIO([voice_row(1)])
        r = lv.run_once(io, data_dir=self.dir)
        self.assertEqual(len(r["transcribed"]), 1)
        row = io.inserted[0]
        self.assertEqual(row["created_by"], UID)
        self.assertEqual(row["instance_id"], INST)
        self.assertIn("voice-transcript", row["tags"])
        self.assertIn("of:row-1", row["tags"])
        self.assertIn("whisper:tlcmediadpt", row["tags"])
        self.assertIn("In the beginning was the Word.", row["body"])
        self.assertIn("large-v3-turbo", row["body"])
        self.assertIn("the 4070 tower", row["body"])
        self.assertEqual(io.deleted, [f"{UID}/2026-1.webm"])
        self.assertIn("voice-transcribed", io.rows[0]["tags"])

    def test_quiet_rows_are_left_alone(self):
        rows = [
            {"id": "t", "instance_id": INST, "created_by": UID, "tags": ["lesson"]},
            voice_row(2, ["voice-transcribed"]),
            voice_row(3, ["voice-failed"]),
            {"id": "x", "instance_id": INST, "created_by": UID, "tags": ["lesson", "voice", "audio:../etc/passwd"]},
        ]
        io = FakeIO(rows)
        r = lv.run_once(io, data_dir=self.dir)
        self.assertEqual(io.inserted, [])
        self.assertEqual(r["transcribed"], [])

    def test_idempotent_a_filed_transcript_is_never_filed_twice(self):
        io = FakeIO([voice_row(4)], has={"row-4"})
        r = lv.run_once(io, data_dir=self.dir)
        self.assertEqual(io.inserted, [])
        self.assertEqual(r["skipped"][0]["why"], "transcript-already-filed")
        self.assertIn("voice-transcribed", io.rows[0]["tags"])

    def test_empty_words_are_a_failure_not_a_blank_lesson(self):
        io = FakeIO([voice_row(5)], text="   ")
        r = lv.run_once(io, data_dir=self.dir)
        self.assertEqual(io.inserted, [])
        self.assertIn("empty-transcript", r["failed"][0]["error"])

    def test_after_max_attempts_the_failure_is_said_not_looped(self):
        rows = [voice_row(6)]
        io = FakeIO(rows, fail={"2026-6"})
        for _ in range(lv.MAX_ATTEMPTS - 1):
            lv.run_once(io, data_dir=self.dir)
            self.assertEqual(io.inserted, [])
        lv.run_once(io, data_dir=self.dir)
        self.assertEqual(len(io.inserted), 1)
        self.assertIn("voice-failed", io.inserted[0]["tags"])
        self.assertIn("could not be transcribed", io.inserted[0]["body"])
        self.assertIn("voice-failed", rows[0]["tags"])
        # and it stops: the next run does nothing more
        lv.run_once(io, data_dir=self.dir)
        self.assertEqual(len(io.inserted), 1)


class TheBrakes(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.mkdtemp()

    def test_budget_stops_after_max_items(self):
        io = FakeIO([voice_row(i) for i in range(10, 20)])
        r = lv.run_once(io, data_dir=self.dir)
        self.assertEqual(len(r["transcribed"]), lv.MAX_ITEMS_PER_RUN)
        self.assertEqual(r["stopped"], "item-budget")

    def test_time_budget_stops_the_run(self):
        ticks = iter([0, lv.MAX_RUN_SECONDS + 1, lv.MAX_RUN_SECONDS + 2])
        io = FakeIO([voice_row(30), voice_row(31)])
        r = lv.run_once(io, data_dir=self.dir, clock=lambda: next(ticks))
        self.assertEqual(r["stopped"], "time-budget")
        self.assertEqual(r["transcribed"], [])

    def test_a_live_lock_skips_and_never_stacks(self):
        self.assertTrue(lv.acquire_lock(self.dir))
        io = FakeIO([voice_row(40)])
        r = lv.run_once(io, data_dir=self.dir)
        self.assertEqual(r["stopped"], "locked-skip")
        self.assertEqual(io.inserted, [])
        lv.release_lock(self.dir)

    def test_a_stale_lock_is_broken(self):
        self.assertTrue(lv.acquire_lock(self.dir))
        p = os.path.join(self.dir, "lesson-voice.lock")
        old = os.path.getmtime(p) - lv.LOCK_MAX_AGE_SECONDS - 10
        os.utime(p, (old, old))
        self.assertTrue(lv.acquire_lock(self.dir))
        lv.release_lock(self.dir)


class TheLadder(unittest.TestCase):
    def test_default_rung_is_the_4070_tower(self):
        self.assertEqual(lv.whisper_urls({}), ["http://tlcmediadpt:8771"])
        self.assertEqual(lv.rung_name("http://tlcmediadpt:8771"), "the 4070 tower")

    def test_more_places_are_one_env_line(self):
        env = {"WHISPER_URLS": "http://tlcmediadpt:8771, http://tower2:8771/ ,"}
        self.assertEqual(lv.whisper_urls(env), ["http://tlcmediadpt:8771", "http://tower2:8771"])

    def test_first_rung_that_returns_words_wins_in_order(self):
        calls = []

        def post(url, local):
            calls.append(url)
            if "tlcmediadpt" in url:
                raise OSError("tower dark")
            return {"text": "words", "model": "large-v3-turbo"}

        out = lv.transcribe_ladder("/x.webm", env={"WHISPER_URLS": "http://tlcmediadpt:8771,http://tower2:8771"},
                                   post=post, local_fn=lambda *_: {"text": "cpu"})
        self.assertEqual(calls, ["http://tlcmediadpt:8771", "http://tower2:8771"])
        self.assertEqual(out["rung_key"], "tower2")

    def test_the_nas_cpu_is_the_last_rung(self):
        def post(url, local):
            raise OSError("dark")

        out = lv.transcribe_ladder("/x.webm", env={}, post=post,
                                   local_fn=lambda local, m: {"text": "cpu words", "model": m})
        self.assertEqual(out["rung"], "the NAS CPU")
        self.assertEqual(out["model"], "small")

    def test_no_rung_says_every_reason(self):
        def post(url, local):
            raise OSError("dark")

        def cpu(local, m):
            raise ImportError("faster_whisper not installed")

        with self.assertRaises(RuntimeError) as ctx:
            lv.transcribe_ladder("/x.webm", env={}, post=post, local_fn=cpu)
        self.assertIn("tlcmediadpt", str(ctx.exception))
        self.assertIn("faster_whisper", str(ctx.exception))

    def test_the_upload_is_multipart_the_shape_whisper_gpu_reads(self):
        body, ctype = lv.multipart("file", "a.webm", b"AUDIO", "audio/webm")
        self.assertTrue(ctype.startswith("multipart/form-data; boundary="))
        self.assertIn(b'name="file"; filename="a.webm"', body)
        self.assertIn(b"AUDIO", body)

    def test_audio_path_refuses_traversal(self):
        self.assertEqual(lv.audio_path_of(["audio:../x"]), "")
        self.assertEqual(lv.audio_path_of(["audio:/etc/x"]), "")
        self.assertEqual(lv.audio_path_of([f"audio:{UID}/a.webm"]), f"{UID}/a.webm")


if __name__ == "__main__":
    unittest.main()
