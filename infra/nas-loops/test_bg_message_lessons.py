#!/usr/bin/env python3
# Proven-to-catch tests for bg-message-lessons.py (DR-1433).
#
# The two that matter: a message whose archive row names no speaker is NEVER
# sent as Bishop Gwin's (DR-0719: never assume who taught), and a message is
# sent ONCE (its own row is the record). No network: rest() is never called.
# Run from this dir:  python3 -m unittest test_bg_message_lessons
import importlib.util
import json
import os
import unittest

_HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location(
    "bg_message_lessons", os.path.join(_HERE, "bg-message-lessons.py")
)
bg = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bg)

CFG = {
    "since": "2026-08-01",
    "speaker_match": ["Gwin", "Llyod"],
    "per_cycle": 4,
    "done": {"WQIcLeynG0w": "L124"},
}


def msg(vid, date, kind="wednesday", speaker="Bishop Lloyd E. Gwin", title="A message"):
    return {
        "video_id": vid,
        "service_date": date,
        "service_type": kind,
        "speaker": speaker,
        "title": title,
    }


def tx(vid, words=900, text="the words", error=None):
    return {"video_id": vid, "words": words, "text": text, "error": error}


class PlanTest(unittest.TestCase):
    def test_wednesdays_first_then_newest(self):
        ms = [
            msg("sun11", "2026-11-08", "sunday"),
            msg("wed04", "2026-11-04"),
            msg("wed10", "2026-10-28"),
            msg("sun02", "2026-11-01", "sunday"),
        ]
        send, waiting, skipped = bg.plan(
            ms, [tx(m["video_id"]) for m in ms], set(), CFG
        )
        self.assertEqual(
            [m["video_id"] for m, _ in send], ["wed04", "wed10", "sun11", "sun02"]
        )
        self.assertEqual((waiting, skipped), ([], []))

    def test_PROVEN_TO_CATCH_a_message_with_no_named_speaker_is_never_sent_as_his(self):
        ms = [
            msg(
                "anon",
                "2026-10-14",
                "sunday",
                speaker=None,
                title="Help Me, Help the Man Get to Jesus",
            ),
            msg("other", "2026-08-30", "sunday", speaker="Pastor Ken McCray"),
        ]
        send, waiting, skipped = bg.plan(ms, [tx("anon"), tx("other")], set(), CFG)
        self.assertEqual((send, waiting, skipped), ([], [], []))
        # The same row WITH his name is sent, so the check above is not vacuous.
        send, _, _ = bg.plan(
            [msg("anon", "2026-10-14", "sunday")], [tx("anon")], set(), CFG
        )
        self.assertEqual(len(send), 1)

    def test_the_archive_misspelling_of_his_name_still_counts(self):
        send, _, _ = bg.plan(
            [msg("lc", "2026-08-23", "sunday", speaker="Bishop Llyod E. Gwin")],
            [tx("lc")],
            set(),
            CFG,
        )
        self.assertEqual(len(send), 1)

    def test_PROVEN_TO_CATCH_a_message_is_sent_once_and_a_done_one_never(self):
        ms = [msg("wed04", "2026-11-04"), msg("WQIcLeynG0w", "2026-09-02")]
        sent = bg.sent_ids([{"tags": ["lesson", "bg-message", "bg-message:wed04"]}])
        self.assertEqual(sent, {"wed04"})
        send, _waiting, skipped = bg.plan(
            ms, [tx("wed04"), tx("WQIcLeynG0w")], sent, CFG
        )
        self.assertEqual(send, [])
        self.assertEqual(sorted(skipped), ["WQIcLeynG0w", "wed04"])

    def test_no_words_yet_waits_and_an_empty_or_failed_transcript_is_not_words(self):
        ms = [msg("a", "2026-11-04"), msg("b", "2026-10-28"), msg("c", "2026-10-21")]
        send, waiting, _ = bg.plan(
            ms, [tx("b", words=0, text=""), tx("c", error="IpBlocked")], set(), CFG
        )
        self.assertEqual(send, [])
        self.assertEqual([m["video_id"] for m in waiting], ["a", "b", "c"])

    def test_older_than_since_is_left_alone_and_the_budget_paces_a_backfill(self):
        ms = [msg(f"v{i}", f"2026-10-{10 + i:02d}") for i in range(7)] + [
            msg("old", "2026-07-15")
        ]
        send, waiting, _ = bg.plan(ms, [tx(m["video_id"]) for m in ms], set(), CFG)
        self.assertEqual(len(send), 4)
        self.assertNotIn(
            "old", [m["video_id"] for m, _ in send] + [m["video_id"] for m in waiting]
        )


class RowTest(unittest.TestCase):
    def test_the_row_rings_the_builder_and_names_him_and_the_day(self):
        r = bg.row_for(
            msg("7aCAdw5W-Nc", "2026-11-04", title="I AM SOMEBODY!"),
            tx("7aCAdw5W-Nc", text="He said..."),
            "inst",
            "me",
        )
        for t in [
            "lesson",
            "bg-message",
            "bg-message:7aCAdw5W-Nc",
            "voice:BG",
            "church-session-public",
            "service-date:2026-11-04",
            "service-type:wednesday",
        ]:
            self.assertIn(t, r["tags"])
        self.assertTrue(
            r["body"].startswith(
                "Bishop Lloyd E. Gwin -- I AM SOMEBODY! -- Wednesday Bible Study, 2026-11-04"
            )
        )
        self.assertIn("https://www.youtube.com/watch?v=7aCAdw5W-Nc", r["body"])
        self.assertTrue(r["body"].endswith("He said..."))
        self.assertNotIn("lesson-captured", r["tags"])


class ConfigTest(unittest.TestCase):
    def test_the_committed_config_loads_and_names_the_lessons_already_made(self):
        cfg = bg.load_config()
        self.assertEqual(cfg["since"], "2026-08-01")
        self.assertIn("WQIcLeynG0w", cfg["done"])
        self.assertIn("J9U77lAIyjo", cfg["done"])
        self.assertGreaterEqual(cfg["per_cycle"], 1)

    def test_the_ledger_writes_what_the_cycle_did(self):
        import tempfile

        with tempfile.TemporaryDirectory() as d:
            self.assertTrue(bg.write_ledger(d, {"what": "nothing-new", "sent": []}))
            with open(os.path.join(d, "last-run.json"), encoding="utf-8") as fh:
                got = json.load(fh)
            self.assertEqual(got["what"], "nothing-new")
            self.assertIn("at", got)


if __name__ == "__main__":
    unittest.main()
