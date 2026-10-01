"""Proofs for voice_enroll.py, "Add my voice" (DR-0720). Stdlib unittest; no
model, no network. Each rule is proven-to-catch: a voice is named only from a
print its owner consented to (BG and DP by attributed words are the only
exceptions); removing consent removes the print; a sample too short, or with
more than one voice, or matching someone else, is refused with a reason; the
sample audio is deleted unless the person chose to keep it; a failed read
never removes anyone."""
import json
import os
import tempfile
import unittest

import speaker_turns as st
import voice_enroll as ve

JANE = "11111111-1111-4111-8111-111111111111"
DARRELL = "22222222-2222-4222-8222-222222222222"
BG_PRINT = [1.0, 0.1, 0.0, 0.2]
DP_PRINT = [0.0, 1.0, 0.3, 0.0]
JM_PRINT = [0.1, 0.2, 0.9, 0.9]


def row(uid=JANE, label="JM", status="enrolled", enrolled=True, **kw):
    r = {"user_id": uid, "label": label, "display_name": "Jane Mercy", "status": status,
         "enrolled_at": "2026-10-01T12:00:00Z" if enrolled else None, "sample_path": None, "keep_sample": False}
    r.update(kw)
    return r


def one_voice(seconds=24.0, vec=JM_PRINT):
    return {"turns": [{"start": 0.0, "end": seconds / 2, "speaker": 0},
                      {"start": seconds / 2 + 0.3, "end": seconds + 0.3, "speaker": 0}],
            "centroids": {0: vec}}


class WhichPrintsMayName(unittest.TestCase):
    RECORDS = {
        "BG": {"vector": BG_PRINT, "name": "Bishop Gwin", "user_id": ""},
        "DP": {"vector": DP_PRINT, "name": "Darrell Poe", "user_id": ""},
        "JM": {"vector": JM_PRINT, "name": "Jane Mercy", "user_id": JANE},
    }

    def test_a_consented_voice_is_named_with_the_name_its_owner_chose(self):
        prints, names = ve.consented_prints(self.RECORDS, [row()])
        self.assertEqual(sorted(prints), ["BG", "DP", "JM"])
        self.assertEqual(names, {"JM": "Jane Mercy"})

    def test_PROVEN_TO_CATCH_no_consent_row_no_name(self):
        prints, _ = ve.consented_prints(self.RECORDS, [])
        self.assertNotIn("JM", prints)
        self.assertEqual(sorted(prints), ["BG", "DP"])  # the word-attributed exceptions only

    def test_PROVEN_TO_CATCH_a_row_not_yet_enrolled_or_under_another_label_names_no_one(self):
        prints, _ = ve.consented_prints(self.RECORDS, [row(enrolled=False, status="sample-sent")])
        self.assertNotIn("JM", prints)
        prints, _ = ve.consented_prints(self.RECORDS, [row(label="JQ")])
        self.assertNotIn("JM", prints)

    def test_PROVEN_TO_CATCH_a_print_with_no_owner_beyond_bg_and_dp_names_no_one(self):
        recs = dict(self.RECORDS, XY={"vector": [0.5, 0.5, 0.5, 0.5], "name": "", "user_id": ""})
        prints, _ = ve.consented_prints(recs, [row()])
        self.assertNotIn("XY", prints)

    def test_darrell_re_enrolled_himself_counts_only_while_his_row_stands(self):
        recs = dict(self.RECORDS, DP={"vector": DP_PRINT, "name": "Darrell Poe", "user_id": DARRELL})
        prints, _ = ve.consented_prints(recs, [row(uid=DARRELL, label="DP", display_name="Darrell Poe")])
        self.assertIn("DP", prints)
        prints, _ = ve.consented_prints(recs, [])
        self.assertNotIn("DP", prints)


class TheTranscriptNamesAnEnrolledVoice(unittest.TestCase):
    def test_an_enrolled_voice_is_named_and_the_others_stay_s_labels(self):
        diarized = {"turns": [{"start": 0, "end": 5, "speaker": 0}, {"start": 5.2, "end": 9, "speaker": 1},
                              {"start": 9.2, "end": 14, "speaker": 2}],
                    "centroids": {0: [0.12, 0.18, 0.88, 0.92], 1: [0.7, -0.7, 0.1, 0.0], 2: [0.95, 0.12, 0.05, 0.18]}}
        segs = [{"start": 0.1, "end": 4.9, "text": "The Lord is my shepherd."},
                {"start": 5.3, "end": 8.9, "text": "Amen."},
                {"start": 9.3, "end": 13.9, "text": "Turn with me to Joshua."}]
        recs = {"BG": {"vector": BG_PRINT, "name": "Bishop Gwin", "user_id": ""},
                "JM": {"vector": JM_PRINT, "name": "Jane Mercy", "user_id": JANE}}
        prints, names = ve.consented_prints(recs, [row()])
        out = st.speaker_transcript(segs, diarized, prints, names)
        self.assertEqual([l.split(":")[0] for l in out["text"].splitlines()], ["JM", "S1", "BG"])
        self.assertIn("BG = Bishop Gwin; JM = Jane Mercy.", out["header"])
        self.assertIn("S1 = a voice not yet named.", out["header"])
        self.assertEqual(out["known"], ["BG", "JM"])
        for line in out["text"].splitlines():
            st.parse_turns(line)  # the app and the builder read every line
        # PROVEN TO CATCH: with her consent removed, the same voice is S1.
        prints, names = ve.consented_prints(recs, [])
        out = st.speaker_transcript(segs, diarized, prints, names)
        self.assertEqual([l.split(":")[0] for l in out["text"].splitlines()], ["S1", "S2", "BG"])
        self.assertNotIn("Jane", out["header"])


class TheSample(unittest.TestCase):
    def test_one_voice_long_enough_gives_its_vector(self):
        vec, why = ve.check_sample(one_voice())
        self.assertEqual((vec, why), (JM_PRINT, ""))

    def test_PROVEN_TO_CATCH_too_short_is_refused_with_the_seconds(self):
        vec, why = ve.check_sample(one_voice(seconds=8))
        self.assertIsNone(vec)
        self.assertIn("too short", why)
        self.assertIn("8 seconds", why)

    def test_PROVEN_TO_CATCH_a_second_voice_is_refused(self):
        d = one_voice()
        d["turns"].append({"start": 25.0, "end": 30.0, "speaker": 1})
        d["centroids"][1] = BG_PRINT
        vec, why = ve.check_sample(d)
        self.assertIsNone(vec)
        self.assertIn("More than one voice", why)

    def test_a_second_voice_with_no_vector_is_refused_too(self):
        d = one_voice()
        d["turns"].append({"start": 25.0, "end": 26.0, "speaker": 1})
        d["turns"].append({"start": 27.0, "end": 28.2, "speaker": 1})
        d["turns"].append({"start": 29.0, "end": 30.2, "speaker": 1})
        vec, why = ve.check_sample(d)
        self.assertIsNone(vec)

    def test_one_voice_split_in_two_by_the_clustering_is_still_one_voice(self):
        d = one_voice()
        d["turns"].append({"start": 25.0, "end": 30.0, "speaker": 1})
        d["centroids"][1] = [0.12, 0.18, 0.88, 0.92]  # the same voice, cosine ~0.99
        vec, _ = ve.check_sample(d)
        self.assertEqual(vec, JM_PRINT)

    def test_a_cough_from_the_room_does_not_refuse(self):
        d = one_voice()
        d["turns"].append({"start": 25.0, "end": 26.0, "speaker": 1})
        vec, _ = ve.check_sample(d)
        self.assertEqual(vec, JM_PRINT)

    def test_PROVEN_TO_CATCH_a_voice_that_is_already_someone_elses(self):
        vec, why = ve.check_sample(one_voice(vec=[0.95, 0.12, 0.05, 0.18]), {"BG": BG_PRINT})
        self.assertIsNone(vec)
        self.assertIn("already matches the voice added as BG", why)

    def test_no_voice_at_all(self):
        vec, why = ve.check_sample({"turns": [], "centroids": {}})
        self.assertIsNone(vec)
        self.assertIn("No voice", why)


class FakeIO:
    def __init__(self, rows, data, armed=True, diarized=None, read_fails=False, boom=False):
        self.rows, self.data, self._armed = rows, data, armed
        self._diarized = diarized or one_voice()
        self.read_fails, self.boom = read_fails, boom
        self.updates, self.deleted, self.downloaded = [], [], []

    def list_rows(self):
        if self.read_fails:
            raise RuntimeError("HTTP 503")
        return self.rows

    def update_row(self, uid, patch):
        self.updates.append((uid, patch))

    def download(self, path):
        self.downloaded.append(path)
        local = os.path.join(self.data, "enroll-incoming", os.path.basename(path))
        os.makedirs(os.path.dirname(local), exist_ok=True)
        with open(local, "wb") as f:
            f.write(b"audio")
        return local

    def delete_audio(self, path):
        self.deleted.append(path)

    def armed(self):
        return self._armed

    def diarize(self, local):
        if self.boom:
            raise RuntimeError("decoder failed")
        return self._diarized


def waiting(uid=JANE, label="JM", keep=False):
    return row(uid=uid, label=label, status="sample-sent", enrolled=False,
               sample_path=f"{uid}/20261001T120000Z-abc.webm", keep_sample=keep)


class OnePass(unittest.TestCase):
    def test_the_road_a_sample_becomes_one_print_and_the_audio_is_gone(self):
        with tempfile.TemporaryDirectory() as d:
            io = FakeIO([waiting()], d)
            out = ve.run_once(io, d, env={})
            self.assertEqual(out["enrolled"], ["JM"])
            recs = st.load_voiceprint_records(d)
            self.assertEqual(recs["JM"]["user_id"], JANE)
            self.assertEqual(recs["JM"]["name"], "Jane Mercy")
            self.assertEqual(io.deleted, [f"{JANE}/20261001T120000Z-abc.webm"])  # the waiting copy
            self.assertFalse(os.listdir(os.path.join(d, "enroll-incoming")))       # the NAS copy
            uid, patch = io.updates[-1]
            self.assertEqual((uid, patch["status"], patch["sample_path"], patch["reason"]), (JANE, "enrolled", None, None))
            self.assertTrue(patch["enrolled_at"])
            # Only numbers are kept: no audio, no words, in the print.
            with open(os.path.join(d, "voiceprints", "JM.json"), encoding="utf-8") as f:
                self.assertEqual(sorted(json.load(f)), ["initials", "name", "source", "user_id", "vector"])

    def test_a_person_who_chose_to_keep_the_sample_keeps_it_on_the_nas(self):
        with tempfile.TemporaryDirectory() as d:
            ve.run_once(FakeIO([waiting(keep=True)], d), d, env={})
            self.assertEqual(os.listdir(os.path.join(d, "enroll-samples", JANE)), ["20261001T120000Z-abc.webm"])

    def test_a_refusal_says_why_and_keeps_nothing(self):
        with tempfile.TemporaryDirectory() as d:
            io = FakeIO([waiting(keep=True)], d, diarized=one_voice(seconds=6))
            out = ve.run_once(io, d, env={})
            self.assertEqual(out["refused"], [JANE])
            self.assertEqual(io.updates[-1][1]["status"], "refused")
            self.assertIn("too short", io.updates[-1][1]["reason"])
            self.assertEqual(st.load_voiceprint_records(d), {})
            self.assertFalse(os.path.isdir(os.path.join(d, "enroll-samples")))
            self.assertFalse(os.listdir(os.path.join(d, "enroll-incoming")))

    def test_a_failure_to_measure_is_said_not_hidden(self):
        with tempfile.TemporaryDirectory() as d:
            io = FakeIO([waiting()], d, boom=True)
            out = ve.run_once(io, d, env={})
            self.assertEqual(io.updates[-1][1]["status"], "refused")
            self.assertIn("could not measure", io.updates[-1][1]["reason"])
            self.assertTrue(out["failed"])

    def test_PROVEN_TO_CATCH_a_sample_outside_its_owners_folder_is_never_used(self):
        with tempfile.TemporaryDirectory() as d:
            r = waiting()
            r["sample_path"] = f"{DARRELL}/x.webm"
            io = FakeIO([r], d)
            ve.run_once(io, d, env={})
            self.assertEqual(io.downloaded, [])
            self.assertEqual(io.updates[-1][1]["status"], "refused")

    def test_not_armed_or_stopped_the_sample_waits_and_says_so(self):
        for armed, env in ((False, {}), (True, {"LESSON_VOICE_SELF_ENROLL": "0"}), (True, {"LESSON_VOICE_SPEAKERS": "0"})):
            with tempfile.TemporaryDirectory() as d:
                io = FakeIO([waiting()], d, armed=armed)
                out = ve.run_once(io, d, env=env)
                self.assertEqual(out["waiting"], [JANE])
                self.assertEqual(io.downloaded, [])
                self.assertIn("Waiting", io.updates[-1][1]["reason"])

    def test_the_lock_skips_a_second_pass(self):
        with tempfile.TemporaryDirectory() as d:
            self.assertTrue(ve.acquire_lock(d))
            out = ve.run_once(FakeIO([waiting()], d), d, env={})
            self.assertIn("lock", out["skipped"])
            ve.release_lock(d)

    def test_darrell_re_enrolls_as_dp_over_the_l202_print(self):
        with tempfile.TemporaryDirectory() as d:
            st.save_voiceprint(d, "DP", DP_PRINT, source="l202.webm")
            ve.write_withdrawn(d, ["DP"])
            io = FakeIO([waiting(uid=DARRELL, label="DP")], d, diarized=one_voice(vec=[0.02, 0.97, 0.28, 0.01]))
            out = ve.run_once(io, d, env={})
            self.assertEqual(out["enrolled"], ["DP"])  # his own old print is not "someone else"
            rec = st.load_voiceprint_records(d)["DP"]
            self.assertEqual(rec["user_id"], DARRELL)
            self.assertTrue(rec["source"].startswith("self:"))
            self.assertEqual(ve.read_withdrawn(d), [])


class RemoveMyVoice(unittest.TestCase):
    def test_PROVEN_TO_CATCH_removing_consent_deletes_the_print(self):
        with tempfile.TemporaryDirectory() as d:
            st.save_voiceprint(d, "BG", BG_PRINT, source="l202.webm")
            st.save_voiceprint(d, "JM", JM_PRINT, source="self:x", name="Jane Mercy", user_id=JANE)
            out = ve.run_once(FakeIO([], d), d, env={})
            self.assertEqual(out["removed"], ["JM"])
            self.assertEqual(sorted(st.load_voiceprint_records(d)), ["BG"])  # BG by words is untouched

    def test_removal_works_even_with_the_stop_path_set(self):
        with tempfile.TemporaryDirectory() as d:
            st.save_voiceprint(d, "JM", JM_PRINT, user_id=JANE)
            ve.run_once(FakeIO([], d, armed=False), d, env={"LESSON_VOICE_SELF_ENROLL": "0", "LESSON_VOICE_SPEAKERS": "0"})
            self.assertEqual(st.load_voiceprint_records(d), {})

    def test_a_kept_sample_goes_with_the_consent(self):
        with tempfile.TemporaryDirectory() as d:
            os.makedirs(os.path.join(d, "enroll-samples", JANE))
            open(os.path.join(d, "enroll-samples", JANE, "a.webm"), "w").close()
            ve.reconcile(d, [])
            self.assertEqual(os.listdir(os.path.join(d, "enroll-samples")), [])

    def test_a_consented_print_stays(self):
        with tempfile.TemporaryDirectory() as d:
            st.save_voiceprint(d, "JM", JM_PRINT, user_id=JANE)
            self.assertEqual(ve.reconcile(d, [row()]), [])
            self.assertIn("JM", st.load_voiceprint_records(d))

    def test_PROVEN_TO_CATCH_a_failed_read_removes_no_one(self):
        with tempfile.TemporaryDirectory() as d:
            st.save_voiceprint(d, "JM", JM_PRINT, user_id=JANE)
            out = ve.run_once(FakeIO([row()], d, read_fails=True), d, env={})
            self.assertTrue(out["failed"])
            self.assertIn("JM", st.load_voiceprint_records(d))

    def test_darrell_removing_dp_is_never_re_created_from_l202(self):
        with tempfile.TemporaryDirectory() as d:
            st.save_voiceprint(d, "DP", DP_PRINT, user_id=DARRELL)
            ve.reconcile(d, [])
            self.assertEqual(ve.read_withdrawn(d), ["DP"])
            import name_voice as nv
            spec = os.path.join(d, "enroll.json")
            with open(spec, "w", encoding="utf-8") as f:
                json.dump({"entries": [{"label": "DP", "audio": "u/a.webm", "words": "I'm actually in technology"}]}, f)
            self.assertEqual(nv.enroll(spec, d, "base"), 0)
            with open(os.path.join(d, "enroll-result.json"), encoding="utf-8") as f:
                self.assertEqual(json.load(f)["withdrawn"], ["DP"])
            self.assertNotIn("DP", st.load_voiceprint_records(d))


class ByHand(unittest.TestCase):
    def test_PROVEN_TO_CATCH_naming_anyone_but_bg_or_dp_by_hand_is_refused(self):
        import name_voice as nv
        with tempfile.TemporaryDirectory() as d:
            self.assertEqual(nv.main(["--name", "0=JM", "--data", d]), 2)
            self.assertEqual(st.load_voiceprint_records(d), {})


if __name__ == "__main__":
    unittest.main()
