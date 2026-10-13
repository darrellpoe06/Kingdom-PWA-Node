"""Proofs for speaker_turns.py and the transcriber's speaker step (DR-0712).
Stdlib unittest; no model, no network. Each rule is proven-to-catch: the
format, known voices only by voiceprint, unknown voices S1/S2 in order, a
member named only as the teacher calls them, never a guessed name, and the
honest unmarked transcript when no diarizer is armed."""
import os
import tempfile
import unittest

import lesson_voice_transcribe as lv
import speaker_turns as st

# Two voiceprints and the diarizer's centroids (as vectors the real extractor
# would give: a voice matches its own print, and not the other).
BG_PRINT = [1.0, 0.1, 0.0, 0.2]
DP_PRINT = [0.0, 1.0, 0.3, 0.0]
CENTROIDS = {0: [0.95, 0.12, 0.05, 0.18], 1: [0.1, 0.2, 0.9, 0.9], 2: [0.02, 0.97, 0.28, 0.01]}
TURNS = [
    {"start": 0.0, "end": 5.0, "speaker": 0},   # BG teaching
    {"start": 5.2, "end": 6.0, "speaker": 0},   # BG: "Janelle."
    {"start": 6.2, "end": 12.0, "speaker": 1},  # an unknown member
    {"start": 12.3, "end": 20.0, "speaker": 2},  # DP
    {"start": 20.5, "end": 22.0, "speaker": 0},  # BG
]
SEGMENTS = [
    {"start": 0.1, "end": 2.4, "text": "Number four, God defines success."},
    {"start": 2.5, "end": 4.9, "text": "Joshua one, seven and eight."},
    {"start": 5.3, "end": 5.9, "text": "Janelle."},
    {"start": 6.3, "end": 11.8, "text": "I was going to say the new chancellor wanted to be a good ancestor."},
    {"start": 12.4, "end": 19.9, "text": "I'm actually in technology."},
    {"start": 20.6, "end": 21.9, "text": "That's a beautiful day."},
]
PRINTS = {"BG": BG_PRINT, "DP": DP_PRINT}


class Rules(unittest.TestCase):
    def test_the_labelled_transcript(self):
        out = st.speaker_transcript(SEGMENTS, {"turns": TURNS, "centroids": CENTROIDS}, PRINTS)
        self.assertEqual(out["text"].splitlines(), [
            "BG: Number four, God defines success. Joshua one, seven and eight. Janelle.",
            "S1: I was going to say the new chancellor wanted to be a good ancestor.",
            "DP: I'm actually in technology.",
            "BG: That's a beautiful day.",
        ])
        self.assertIn("BG = Bishop Gwin; DP = Darrell Poe.", out["header"])
        self.assertIn("S1 = a voice not yet named.", out["header"])
        self.assertEqual(out["known"], ["BG", "DP"])

    def test_every_line_parses_and_a_bad_line_is_refused(self):
        out = st.speaker_transcript(SEGMENTS, {"turns": TURNS, "centroids": CENTROIDS}, PRINTS)
        self.assertEqual([w for w, _ in st.parse_turns(out["text"])], ["BG", "S1", "DP", "BG"])
        with self.assertRaises(ValueError):
            st.parse_turns("Bishop said: hello")

    def test_a_known_voice_needs_its_voiceprint(self):
        # PROVEN-TO-CATCH: with no prints, nobody is BG or DP; all are S-labels.
        out = st.speaker_transcript(SEGMENTS, {"turns": TURNS, "centroids": CENTROIDS}, {})
        self.assertEqual([w for w, _ in st.parse_turns(out["text"])], ["S1", "S2", "S3", "S1"])
        self.assertNotIn("Bishop Gwin", out["header"])

    def test_a_weak_match_stays_unknown_and_one_print_names_one_voice(self):
        self.assertEqual(st.match_voices({0: [0.0, 0.0, 1.0, 0.0]}, {"BG": BG_PRINT}), {})
        both = st.match_voices({0: BG_PRINT, 1: BG_PRINT}, {"BG": BG_PRINT})
        self.assertEqual(list(both.values()), ["BG"])

    def test_unknown_voices_are_numbered_in_order_of_first_appearance(self):
        turns = [{"start": 0, "end": 1, "speaker": 7}, {"start": 1, "end": 2, "speaker": 3}, {"start": 2, "end": 3, "speaker": 7}]
        segs = [{"start": 0.1, "end": 0.9, "text": "a"}, {"start": 1.1, "end": 1.9, "text": "b"}, {"start": 2.1, "end": 2.9, "text": "c"}]
        out = st.speaker_transcript(segs, {"turns": turns, "centroids": {}}, {})
        self.assertEqual(out["text"], "S1: a\nS2: b\nS1: c")

    def test_a_member_is_named_only_as_the_teacher_calls_them(self):
        turns = [("BG", "Janelle."), ("S1", "I was going to say the chancellor.")]
        self.assertEqual(st.called_on(turns), {"S1": "Janelle"})
        self.assertEqual(st.called_on([("BG", "Elder Mosley."), ("S2", "Amen.")]), {"S2": "Elder Mosley"})
        # PROVEN-TO-CATCH: a name said by someone who is not the teacher names no one;
        self.assertEqual(st.called_on([("S3", "Janelle."), ("S1", "Yes.")]), {})
        # a teacher's sentence is not a name;
        self.assertEqual(st.called_on([("BG", "Now get this, everybody."), ("S1", "Amen.")]), {})
        # a known voice is never renamed;
        self.assertEqual(st.called_on([("BG", "Darrell."), ("DP", "Yes sir.")]), {})
        # and two names for one voice name it neither.
        self.assertEqual(st.called_on([("BG", "Janelle."), ("S1", "a"), ("BG", "Christina."), ("S1", "b")]), {})

    def test_the_name_goes_in_the_header_and_the_lines_keep_the_label(self):
        turns = [{"start": 0, "end": 1, "speaker": 0}, {"start": 1.2, "end": 3, "speaker": 1}]
        segs = [{"start": 0.1, "end": 0.9, "text": "Janelle."}, {"start": 1.3, "end": 2.9, "text": "The chancellor."}]
        out = st.speaker_transcript(segs, {"turns": turns, "centroids": {0: BG_PRINT}}, {"BG": BG_PRINT})
        self.assertEqual(out["text"], "BG: Janelle.\nS1: The chancellor.")
        self.assertIn("S1 = Janelle (Bishop Gwin called them by name just before they spoke).", out["header"])

    def test_words_no_voice_covers_are_marked_with_a_question_not_guessed(self):
        segs = [{"start": 50, "end": 52, "text": "far away"}]
        out = st.speaker_transcript(segs, {"turns": TURNS, "centroids": {}}, {})
        self.assertEqual(out["text"], "?: far away")
        self.assertIn("? = words no voice could be placed on.", out["header"])

    def test_voiceprints_round_trip_on_disk(self):
        with tempfile.TemporaryDirectory() as d:
            st.save_voiceprint(d, "BG", BG_PRINT, source="l202.webm")
            self.assertEqual(st.load_voiceprints(d), {"BG": BG_PRINT})
            with self.assertRaises(ValueError):
                st.save_voiceprint(d, "Bishop", BG_PRINT)


class NamingVoices(unittest.TestCase):
    def test_the_list_shows_each_voice_with_its_words_most_talk_first(self):
        import name_voice as nv
        out = nv.summarize({"turns": TURNS}, SEGMENTS)
        self.assertEqual([v["voice"] for v in out], [2, 0, 1])
        self.assertIn("I'm actually in technology.", out[0]["lines"][0])
        self.assertEqual(out[1]["first"][0], "0:00")

    def test_a_name_is_voice_equals_initials_and_nothing_else(self):
        import name_voice as nv
        self.assertEqual(nv.parse_names(["0=bg", "3=DP"]), {0: "BG", 3: "DP"})
        with self.assertRaises(ValueError):
            nv.parse_names(["Bishop Gwin"])


class EnrollByWords(unittest.TestCase):
    """DR-0712: BG and DP are enrolled from words a person who was there
    attributed, never from a guess."""
    D = {"turns": TURNS, "centroids": CENTROIDS}
    BG = {"label": "BG", "words": "Number four, God defines success"}
    DP = {"label": "DP", "words": "I'm actually in technology"}

    def test_the_voice_that_carries_the_words_gets_the_label(self):
        import name_voice as nv
        found, why = nv.enroll_by_words(self.D, SEGMENTS, [self.BG, self.DP])
        self.assertEqual(found, {"BG": 0, "DP": 2})
        self.assertEqual(why, [])

    def test_matched_by_words_not_characters_and_a_miss_is_refused(self):
        import name_voice as nv
        segs = [dict(s) for s in SEGMENTS]
        segs[4]["text"] = "Um, I'm actually in the technology."
        found, _ = nv.enroll_by_words(self.D, segs, [self.DP])
        self.assertEqual(found, {"DP": 2})  # the extra words do not matter
        segs[4]["text"] = "I'm actually in technologies."
        found, why = nv.enroll_by_words(self.D, segs, [self.DP])
        self.assertEqual(found, {})  # 2 of 3 words is under 0.8: refused, not guessed
        self.assertIn("not found", why[0])

    def test_PROVEN_TO_CATCH_words_not_said_name_no_one(self):
        import name_voice as nv
        found, why = nv.enroll_by_words(self.D, SEGMENTS, [{"label": "BG", "words": "the Lord is my shepherd"}])
        self.assertEqual(found, {})
        self.assertIn("not found", why[0])

    def test_PROVEN_TO_CATCH_two_labels_on_one_voice_enroll_nobody(self):
        import name_voice as nv
        found, why = nv.enroll_by_words(self.D, SEGMENTS, [self.BG, {"label": "DP", "words": "Joshua one, seven and eight"}])
        self.assertEqual(found, {})
        self.assertIn("nobody is enrolled", why[-1])

    def test_PROVEN_TO_CATCH_words_across_two_voices_name_no_one(self):
        import name_voice as nv
        turns = [{"start": 12.3, "end": 15.0, "speaker": 2}, {"start": 15.0, "end": 20.0, "speaker": 1}]
        found, why = nv.enroll_by_words({"turns": turns, "centroids": CENTROIDS}, SEGMENTS, [self.DP])
        self.assertEqual(found, {})
        self.assertIn("across voices", why[0])

    def test_the_committed_spec_names_bg_and_dp_from_l202(self):
        import json as _json
        here = os.path.dirname(os.path.abspath(__file__))
        with open(os.path.join(here, "enroll.json"), encoding="utf-8") as f:
            spec = _json.load(f)
        labels = [e["label"] for e in spec["entries"]]
        self.assertEqual(sorted(labels), ["BG", "DP"])
        for e in spec["entries"]:
            self.assertTrue(e["audio"].endswith(".webm") and ".." not in e["audio"])
            self.assertGreaterEqual(len(e["words"].split()), 6)


class Armed(unittest.TestCase):
    def test_armed_by_record_and_off_only_by_zero(self):
        import diarize_local as dl
        with tempfile.TemporaryDirectory() as d:
            os.makedirs(os.path.join(d, "models", "speakers"))
            for n in ("segmentation.onnx", "embedding.onnx"):
                open(os.path.join(d, "models", "speakers", n), "w").close()
            import importlib.util
            has = importlib.util.find_spec("sherpa_onnx") is not None
            self.assertEqual(dl.speakers_enabled(d, {}), has)
            self.assertFalse(dl.speakers_enabled(d, {"LESSON_VOICE_SPEAKERS": "0"}))
        with tempfile.TemporaryDirectory() as d:
            self.assertFalse(dl.speakers_enabled(d, {}))  # no models, not armed


class TheTranscriber(unittest.TestCase):
    def row(self):
        return {"id": "r1", "instance_id": "i", "created_by": "u", "tags": ["lesson", "voice", "audio:u/a.webm"]}

    def io(self, armed, speakers=None, boom=False):
        class IO:
            def __init__(s):
                s.inserted, s.calls = [], []
            def list_rows(s): return [self.row()]
            def has_transcript(s, rid): return False
            def download(s, p): return "/tmp/a.webm"
            def transcribe_ladder(s, local, resume_at=0.0, deadline=None):
                return {"text": "Number four.\nAmen.", "rung": "the NAS CPU", "rung_key": "nas-cpu", "model": "small",
                        "duration_sec": 60, "done": True, "segments": SEGMENTS}
            def rung_available(s): return True
            def insert_row(s, r): s.inserted.append(r)
            def add_tags(s, r, extra): r["tags"] = list(r["tags"]) + extra
            def delete_audio(s, p): pass
            def speakers_armed(s): return armed
            def speaker_turns(s, local, segments, rid):
                s.calls.append((local, len(segments), rid))
                if boom:
                    raise RuntimeError("model missing")
                return speakers
        return IO()

    def run_with(self, io):
        with tempfile.TemporaryDirectory() as d:
            return lv.run_once(io, data_dir=d), io

    def test_armed_writes_the_labelled_transcript_and_says_so_in_the_tags(self):
        sp = st.speaker_transcript(SEGMENTS, {"turns": TURNS, "centroids": CENTROIDS}, PRINTS)
        report, io = self.run_with(self.io(True, sp))
        body, tags = io.inserted[0]["body"], io.inserted[0]["tags"]
        self.assertIn("These are the words as Whisper heard them.", body)
        self.assertIn("Speakers: marked by voice on our own machine.", body)
        self.assertIn("\nBG: Number four, God defines success.", body)
        self.assertIn("speakers:marked", tags)
        self.assertIn("voice:BG", tags)
        self.assertEqual(io.calls[0][2], "r1")

    def test_not_armed_is_the_old_transcript_with_an_honest_header(self):
        report, io = self.run_with(self.io(False))
        body, tags = io.inserted[0]["body"], io.inserted[0]["tags"]
        self.assertIn(st.UNMARKED_HEADER, body)
        self.assertTrue(body.endswith("Number four.\nAmen."))
        self.assertIn("speakers:unmarked", tags)
        self.assertEqual(io.calls, [])
        self.assertNotIn("his words", body)

    def test_a_diarizer_failure_keeps_the_words_and_says_unmarked(self):
        report, io = self.run_with(self.io(True, boom=True))
        self.assertIn("speakers:unmarked", io.inserted[0]["tags"])
        self.assertTrue(any("speakers-not-marked" in s["why"] for s in report["skipped"]))

    def test_a_pass_short_of_time_keeps_the_words_and_marks_speakers_next_pass(self):
        sp = st.speaker_transcript(SEGMENTS, {"turns": TURNS, "centroids": CENTROIDS}, PRINTS)
        with tempfile.TemporaryDirectory() as d:
            ticks = iter([0, 0] + [lv.MAX_RUN_SECONDS] * 20)
            io1 = self.io(True, sp)
            r1 = lv.run_once(io1, data_dir=d, clock=lambda: next(ticks))
            self.assertEqual(io1.inserted, [])
            self.assertEqual(r1["in_progress"][0]["awaiting"], "speakers")
            io2 = self.io(True, sp)
            io2.transcribe_ladder = lambda *a, **k: self.fail("the words were already done")
            lv.run_once(io2, data_dir=d)
            self.assertIn("speakers:marked", io2.inserted[0]["tags"])

    def test_the_cpu_rung_keeps_timed_segments(self):
        class Seg:
            def __init__(s, a, b, t): s.start, s.end, s.text = a, b, t
        class Info: duration = 10
        out = lv.consume_segments([Seg(0, 1.234, " Amen. "), Seg(1.3, 2, "")], Info(), "small")
        self.assertEqual(out["segments"], [{"start": 0, "end": 1.23, "text": "Amen."}])
        merged = lv.merge_partial({"text": "a", "segments": [{"start": 0, "end": 1, "text": "a"}]},
                                  {"text": "b", "segments": [{"start": 1, "end": 2, "text": "b"}]})
        self.assertEqual(len(merged["segments"]), 2)


if __name__ == "__main__":
    unittest.main()
