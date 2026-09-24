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
    def __init__(self, rows, text="In the beginning was the Word.", fail=None, has=None, available=False, results=None):
        self.rows = rows
        self.text = text
        self.fail = fail or set()
        self.has = has or set()
        self.available = available
        self.results = list(results or [])  # scripted ladder answers, in order
        self.inserted, self.tagged, self.deleted, self.downloaded, self.texts, self.ladder_calls = [], [], [], [], [], []

    def list_rows(self):
        return self.rows

    def has_transcript(self, rid):
        return rid in self.has

    def download(self, path):
        self.downloaded.append(path)
        return "/tmp/" + path.replace("/", "_")

    def transcribe_ladder(self, local, resume_at=0.0, deadline=None):
        self.ladder_calls.append(resume_at)
        if self.results:
            return self.results.pop(0)
        if any(f in local for f in self.fail):
            raise RuntimeError("tower dark and no CPU whisper")
        return {"text": self.text, "rung": "the 4070 tower", "rung_key": "tlcmediadpt", "model": "large-v3-turbo", "duration_sec": 75, "done": True}

    def rung_available(self):
        return self.available

    def put_text(self, path, text):
        self.texts.append((path, text))

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
        # Measured 2026-09-24: the bare name did not resolve on the NAS. The
        # default is the tower's tailnet name, then its tailnet address.
        self.assertEqual(lv.whisper_urls({}), ["http://tlcmediadpt.tail5a2f35.ts.net:8771", "http://100.69.19.13:8771"])
        self.assertNotIn("http://tlcmediadpt:8771", lv.whisper_urls({}))
        self.assertNotIn("127.0.0.1:8771", lv.WHISPER_URLS_DEFAULT)  # the NAS's :8771 is the reading voice
        for u in lv.whisper_urls({}) + ["http://tlcmediadpt:8771"]:
            self.assertEqual(lv.rung_name(u), "the 4070 tower")
            self.assertEqual(lv.rung_key(u), "tlcmediadpt")

    def test_a_dark_rung_is_skipped_on_health_never_waited_on(self):
        posted = []

        def post(url, local):
            posted.append(url)
            return {"text": "words", "model": "large-v3-turbo"}

        out = lv.transcribe_ladder("/x.webm", env={}, post=post, local_fn=lambda *a, **k: {"text": "cpu"},
                                   health=lambda u: "100.69.19.13" in u)
        self.assertEqual(posted, ["http://100.69.19.13:8771"])
        self.assertEqual(out["rung_key"], "tlcmediadpt")

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


class TheMirror(unittest.TestCase):
    """DR-0614: the app writes to the NAS's own database; the cloud reader sees
    only the hosted one, so lesson rows are copied across under the same id."""

    def rows(self):
        return [
            {"id": "a", "tags": ["lesson"], "instance_id": INST, "created_by": UID, "body": "Lesson. typed", "source": "notes", "created_at": "t"},
            {"id": "b", "tags": ["lesson", "voice", "audio:x"], "instance_id": INST, "created_by": UID, "body": "Lesson. spoken", "source": "notes", "created_at": "t"},
            {"id": "c", "tags": ["lesson", "voice-transcript", "of:b"], "instance_id": INST, "created_by": UID, "body": "Lesson. words", "source": "lesson-voice-transcribe", "created_at": "t"},
            {"id": "d", "tags": ["lesson", "mirrored"], "instance_id": INST, "created_by": UID, "body": "done", "source": "notes", "created_at": "t"},
            {"id": "e", "tags": ["private"], "instance_id": INST, "created_by": UID, "body": "not a lesson", "source": "notes", "created_at": "t"},
        ]

    def test_copies_typed_lessons_and_transcripts_not_raw_audio_rows(self):
        self.assertEqual([r["id"] for r in lv.rows_to_mirror(self.rows())], ["a", "c"])

    def test_copies_under_the_same_id_then_tags_the_original(self):
        sent, tagged = [], []
        rep = lv.mirror_once(lambda: self.rows(), sent.append, lambda r, t: tagged.append((r["id"], t)))
        self.assertEqual(rep["mirrored"], ["a", "c"])
        self.assertEqual([r["id"] for r in sent], ["a", "c"])
        self.assertEqual(sent[0]["created_by"], UID)
        self.assertEqual(tagged, [("a", ["mirrored"]), ("c", ["mirrored"])])

    def test_a_failed_copy_is_not_tagged_and_is_retried_next_run(self):
        def boom(row):
            raise OSError("hosted refused")
        tagged = []
        rep = lv.mirror_once(lambda: self.rows(), boom, lambda r, t: tagged.append(r["id"]))
        self.assertEqual(tagged, [])
        self.assertEqual(len(rep["failed"]), 2)

    def test_a_failed_list_never_raises(self):
        def boom():
            raise OSError("down")
        self.assertEqual(lv.mirror_once(boom, None, None)["failed"][0]["error"], "list: down")

    def test_the_job_follows_the_database_the_app_reads(self):
        src = open(lv.__file__, encoding="utf-8").read()
        self.assertIn("from sovereign_target import resolve_target", src)
        self.assertIn('if source == "sovereign":', src)
        self.assertEqual(lv.load_live(resolver=lambda p: ("sovereign", "http://127.0.0.1:8800", "k"))[0], "sovereign")


def note_row(i, extra=None):
    return {"id": f"note-{i}", "instance_id": INST, "created_by": UID,
            "tags": ["note", "voice", f"audio:{UID}/2026-n{i}.webm", f"note:nt-{i}", "consent:all-agreed"] + (extra or [])}


class TheRecordedNote(unittest.TestCase):
    """DR-0624: a conversation recorded on the Notes box comes back as words
    in the person's own note. One rider serves lessons and notes."""

    def setUp(self):
        self.dir = tempfile.mkdtemp()

    def test_a_note_recording_is_owed_like_a_lesson(self):
        self.assertTrue(lv.needs_transcript(note_row(1)))
        self.assertEqual(lv.kind_of(note_row(1)["tags"]), "note")
        self.assertEqual(lv.note_id_of(note_row(1)["tags"]), "nt-1")

    def test_the_words_go_to_the_owners_folder_and_never_into_the_shared_inbox(self):
        io = FakeIO([note_row(2)], text="We agreed to meet Tuesday about the roof.")
        r = lv.run_once(io, data_dir=self.dir)
        self.assertEqual(r["transcribed"][0]["kind"], "note")
        self.assertEqual(io.texts, [(f"{UID}/2026-n2.webm.txt", "We agreed to meet Tuesday about the roof.")])
        row = io.inserted[0]
        self.assertIn("voice-transcript", row["tags"])
        self.assertIn("note", row["tags"])
        self.assertIn("of:note-2", row["tags"])
        self.assertIn("note:nt-2", row["tags"])
        self.assertNotIn("lesson", row["tags"])  # never reaches the lesson reader or the mirror
        self.assertNotIn("roof", row["body"])    # the proof, never the words
        self.assertIn("8 words", row["body"])
        self.assertIn("voice-transcribed", io.rows[0]["tags"])
        self.assertEqual(io.deleted, [f"{UID}/2026-n2.webm"])

    def test_a_note_transcript_is_never_mirrored_to_the_hosted_reader(self):
        rows = [{"id": "c", "tags": ["note", "voice-transcript", "of:b"], "body": "x"},
                {"id": "f", "tags": ["note", "voice-failed", "of:b"], "body": "x"}]
        self.assertEqual(lv.rows_to_mirror(rows), [])

    def test_a_failed_note_says_so_in_note_words(self):
        rows = [note_row(3)]
        io = FakeIO(rows, fail={"2026-n3"})
        for _ in range(lv.MAX_ATTEMPTS):
            lv.run_once(io, data_dir=self.dir)
        self.assertEqual(len(io.inserted), 1)
        self.assertEqual(io.inserted[0]["tags"], ["note", "voice-failed", "of:note-3"])
        self.assertIn("recorded note", io.inserted[0]["body"])


class TheFailedRecordingIsWorkedOnAgain(unittest.TestCase):
    """HOLD-THE-HAND: the spoken lesson of 2026-09-24 failed while every rung
    was dark. It is not left for dead: when a rung is back, it is tried again,
    and a retry that fails again is never re-announced."""

    def setUp(self):
        self.dir = tempfile.mkdtemp()

    def test_a_failed_row_waits_while_every_rung_is_dark(self):
        io = FakeIO([voice_row(50, ["voice-failed"])], available=False)
        r = lv.run_once(io, data_dir=self.dir)
        self.assertFalse(r["retry_failed"])
        self.assertEqual(io.ladder_calls, [])

    def test_a_failed_row_is_transcribed_once_a_rung_is_back(self):
        rows = [voice_row(51, ["voice-failed"])]
        io = FakeIO(rows, available=True)
        r = lv.run_once(io, data_dir=self.dir)
        self.assertTrue(r["retry_failed"])
        self.assertEqual(len(r["transcribed"]), 1)
        self.assertIn("voice-transcribed", rows[0]["tags"])
        self.assertIn("voice-transcript", io.inserted[0]["tags"])

    def test_a_retry_that_fails_again_is_not_announced_twice(self):
        rows = [voice_row(52, ["voice-failed"])]
        io = FakeIO(rows, available=True, fail={"2026-52"})
        for _ in range(lv.MAX_ATTEMPTS + 1):
            lv.run_once(io, data_dir=self.dir)
        self.assertEqual(io.inserted, [])

    def test_the_gate_asks_the_rungs(self):
        self.assertTrue(lv.rung_available(env={}, health=lambda u: True, cpu=lambda: False))
        self.assertTrue(lv.rung_available(env={}, health=lambda u: False, cpu=lambda: True))
        self.assertFalse(lv.rung_available(env={}, health=lambda u: False, cpu=lambda: False))
        self.assertFalse(lv.rung_available(env={"WHISPER_LOCAL": "0"}, health=lambda u: False, cpu=lambda: True))


class Seg:
    def __init__(self, text, end):
        self.text, self.end = text, end


class Info:
    duration = 3600.0


class TheLongRecordingResumes(unittest.TestCase):
    """An hour-long conversation on the NAS CPU cannot finish in one 400 s
    pass. The pass stops at its deadline, keeps the words so far, and the next
    pass resumes from the second it reached."""

    def setUp(self):
        self.dir = tempfile.mkdtemp()

    def test_the_cpu_rung_stops_at_the_deadline_and_says_where(self):
        ticks = iter([0, 1, 999])
        out = lv.consume_segments(iter([Seg("one", 10.0), Seg("two", 20.0), Seg("three", 30.0)]), Info(), "small",
                                  deadline=5, now=lambda: next(ticks))
        self.assertFalse(out["done"])
        self.assertEqual(out["text"], "one\ntwo\nthree")
        self.assertEqual(out["resume_at"], 30.0)

    def test_without_a_deadline_it_finishes(self):
        out = lv.consume_segments(iter([Seg("a", 1.0), Seg(" ", 2.0)]), Info(), "small")
        self.assertTrue(out["done"])
        self.assertEqual(out["text"], "a")

    def test_two_passes_make_one_transcript(self):
        rows = [note_row(60)]
        first = {"text": "the first half", "done": False, "resume_at": 380.0, "resumed_from": 0.0,
                 "rung": "the NAS CPU", "rung_key": "nas-cpu", "model": "small"}
        second = {"text": "the second half", "done": True, "resume_at": 700.0, "resumed_from": 380.0,
                  "rung": "the NAS CPU", "rung_key": "nas-cpu", "model": "small", "duration_sec": 700}
        io = FakeIO(rows, results=[first, second])
        r1 = lv.run_once(io, data_dir=self.dir)
        self.assertEqual(r1["in_progress"][0]["resume_at"], 380.0)
        self.assertEqual(io.inserted, [])
        self.assertNotIn("voice-transcribed", rows[0]["tags"])
        r2 = lv.run_once(io, data_dir=self.dir)
        self.assertEqual(io.ladder_calls, [0.0, 380.0])
        self.assertEqual(len(r2["transcribed"]), 1)
        self.assertEqual(io.texts[0][1], "the first half\nthe second half")
        self.assertIn("whisper:nas-cpu", io.inserted[0]["tags"])
        self.assertIsNone(lv.read_partial(self.dir, "note-60"))

    def test_the_ladder_passes_resume_and_deadline_to_the_cpu_rung(self):
        seen = {}

        def cpu(local, model, resume_at=0.0, deadline=None):
            seen.update(resume_at=resume_at, deadline=deadline)
            return {"text": "", "done": False, "resume_at": resume_at + 100}

        def post(url, local):
            raise OSError("dark")

        out = lv.transcribe_ladder("/x.webm", env={}, post=post, local_fn=cpu, resume_at=50.0, deadline=9)
        self.assertEqual(seen, {"resume_at": 50.0, "deadline": 9})
        self.assertEqual(out["rung"], "the NAS CPU")
        self.assertFalse(out["done"])


class TheInstallerFixesTheCpuRung(unittest.TestCase):
    """Measured 2026-09-24: faster-whisper was not importable on the NAS
    (Python 3.8) and the reason was hidden. The installer now upgrades pip,
    pins the 3.8-compatible line, logs the attempt, and retries on a recipe change."""

    def test_install_recipe(self):
        src = open(os.path.join(os.path.dirname(lv.__file__), "install.sh"), encoding="utf-8").read()
        self.assertIn("-m pip install --upgrade --quiet pip", src)
        self.assertIn('"faster-whisper<1.1"', src)
        self.assertIn('> "$LOG" 2>&1', src)
        self.assertIn('[ "$recipe" != "$PIP_RECIPE" ]', src)
        self.assertIn('export HF_HOME="$DATA/hf"', src)
        self.assertIn("LEFT=$((440 -", src)


if __name__ == "__main__":
    unittest.main()
