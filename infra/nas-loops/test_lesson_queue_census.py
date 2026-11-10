#!/usr/bin/env python3
# Proven-to-catch tests for lesson-queue-census.py (DR-1360 / DR-0725).
#
# THE ONE THAT MATTERS is DefinitionTest: it PARSES
# scripts/lesson-inbox-waiting.sql and fails if the loop's exclusion list drifts
# from the lane's. It exists because of a real error on 2026-11-10 -- a census
# taken with an abbreviated list from a routine prompt omitted `not-a-lesson`
# and `withdrawn`, so rows a person had marked not-a-lesson or TAKEN BACK
# (DR-1142) were counted as work waiting to be built. One definition of
# "waiting" is only one definition if something checks.
#
# No network: rest() is replaced by a recorder. Run from this dir:
#   python3 -m unittest test_lesson_queue_census
import importlib.util
import json
import os
import re
import tempfile
import unittest
from datetime import datetime, timezone

_HERE = os.path.dirname(os.path.abspath(__file__))
_ROOT = os.path.abspath(os.path.join(_HERE, "..", ".."))
spec = importlib.util.spec_from_file_location(
    "lesson_queue_census", os.path.join(_HERE, "lesson-queue-census.py")
)
qc = importlib.util.module_from_spec(spec)
spec.loader.exec_module(qc)

SQL_PATH = os.path.join(_ROOT, "scripts", "lesson-inbox-waiting.sql")


class DefinitionTest(unittest.TestCase):
    """The loop and the lane ask the SAME question, or this fails by name."""

    def _sql(self):
        with open(SQL_PATH, "r", encoding="utf-8") as fh:
            return fh.read()

    def test_the_excluded_tags_are_exactly_the_ones_the_lane_excludes(self):
        sql = self._sql()
        # Every `NOT (tags ? 'x')` in the shared query, in the order written.
        excluded = re.findall(r"NOT\s*\(\s*tags\s*\?\s*'([a-z-]+)'\s*\)", sql)
        self.assertTrue(excluded, "the shared SQL named no exclusions; has it moved?")
        self.assertEqual(
            sorted(excluded),
            sorted(qc.EXCLUDED_TAGS),
            "the census and scripts/lesson-inbox-waiting.sql disagree about what "
            "'waiting' means. One definition (DR-0725): change both, or neither.",
        )

    def test_the_required_tag_is_the_one_the_lane_requires(self):
        sql = self._sql()
        required = re.findall(r"WHERE\s+tags\s*\?\s*'([a-z-]+)'", sql)
        self.assertEqual(required, [qc.REQUIRED_TAG])

    def test_PROVEN_TO_CATCH_a_dropped_exclusion_fails_the_comparison(self):
        # The exact mistake of 2026-11-10: the two tags added later are dropped.
        shortened = tuple(
            t for t in qc.EXCLUDED_TAGS if t not in ("not-a-lesson", "withdrawn")
        )
        sql = self._sql()
        excluded = re.findall(r"NOT\s*\(\s*tags\s*\?\s*'([a-z-]+)'\s*\)", sql)
        self.assertNotEqual(
            sorted(excluded),
            sorted(shortened),
            "a dropped exclusion must not compare equal",
        )
        self.assertIn("not-a-lesson", excluded)
        self.assertIn("withdrawn", excluded)

    def test_every_exclusion_reaches_the_postgrest_query(self):
        q = qc.waiting_query()
        for tag in qc.EXCLUDED_TAGS:
            self.assertIn(
                "tags=not.cs.", q, "the query lost its negated filters entirely"
            )
            self.assertIn(tag, q, f"{tag} is excluded in the list but not in the query")
        self.assertIn("order=created_at.asc", q)


class CensusTest(unittest.TestCase):
    def test_counts_by_road_and_shape_and_never_carries_a_body(self):
        now = datetime(2026, 11, 10, 23, 0, 0, tzinfo=timezone.utc)  # noqa: UP017
        rows = [
            {
                "id": "a",
                "created_at": "2026-09-29T17:59:56Z",
                "source": "thinking-space",
                "tags": ["lesson"],
                "body": "SECRET WORDS",
            },
            {
                "id": "b",
                "created_at": "2026-09-30T19:31:23Z",
                "source": "lesson-voice-transcribe",
                "tags": ["lesson", "voice-transcript"],
            },
            {
                "id": "c",
                "created_at": "2026-10-22T01:23:59Z",
                "source": "research-inbox",
                "tags": ["lesson", "build-failed"],
            },
            {
                "id": "d",
                "created_at": "2026-11-06T20:36:08Z",
                "source": "chat-split",
                "tags": ["lesson", "newsletter-item"],
            },
            {
                "id": "e",
                "created_at": "2026-11-09T22:28:33Z",
                "source": "somewhere-else",
                "tags": ["lesson"],
            },
        ]
        c = qc.census_of(rows, now=now)
        self.assertEqual(c["total"], 5)
        self.assertEqual(c["by_road"]["thinking-space"], 1)
        self.assertEqual(c["by_road"]["research-inbox"], 1)
        self.assertEqual(c["by_road"]["other"], 1)
        self.assertEqual(c["by_shape"]["voice-transcript"], 1)
        self.assertEqual(c["by_shape"]["build-failed"], 1)
        self.assertEqual(c["by_shape"]["newsletter-item"], 1)
        self.assertEqual(c["by_shape"]["plain"], 2)
        self.assertEqual(c["oldest_waiting"], "2026-09-29T17:59:56Z")
        self.assertEqual(c["at"], "2026-11-10T23:00:00Z")
        self.assertEqual(c["excludes"], list(qc.EXCLUDED_TAGS))
        # NEVER A BODY: a person's words appear nowhere in what gets written.
        self.assertNotIn("SECRET WORDS", json.dumps(c))
        self.assertNotIn("body", json.dumps(c))

    def test_an_empty_queue_is_zero_and_says_so_rather_than_going_silent(self):
        c = qc.census_of([])
        self.assertEqual(c["total"], 0)
        self.assertEqual(c["by_road"], {})
        self.assertIsNone(c["oldest_waiting"])

    def test_a_voice_row_waiting_for_its_words_is_counted_as_that_not_as_buildable(
        self,
    ):
        c = qc.census_of(
            [
                {
                    "id": "v",
                    "created_at": "2026-11-01T00:00:00Z",
                    "source": "x",
                    "tags": ["lesson", "voice"],
                }
            ]
        )
        self.assertEqual(c["by_shape"], {"voice-waiting-for-words": 1})


class OneRowTest(unittest.TestCase):
    """One row, patched in place: the lock that keeps a cycle from accumulating."""

    def setUp(self):
        self.calls = []

        def recorder(url, key, method, path, body=None, extra_headers=None):
            self.calls.append({"method": method, "path": path, "body": body})
            if method == "GET" and path.startswith("agent_inbox?select=id&instance_id"):
                return self.existing
            return None

        self.real = qc.rest
        qc.rest = recorder

    def tearDown(self):
        qc.rest = self.real

    def test_patches_when_a_census_row_exists(self):
        self.existing = [{"id": "row-1"}]
        body = json.dumps(qc.census_of([]))
        what = qc.publish("u", "k", "inst", body, "who")
        self.assertEqual(what, "patched")
        writes = [c for c in self.calls if c["method"] in ("PATCH", "POST")]
        self.assertEqual(len(writes), 1)
        self.assertEqual(writes[0]["method"], "PATCH")

    def test_inserts_only_when_none_exists_and_marks_itself_captured(self):
        self.existing = []
        body = json.dumps(qc.census_of([]))
        what = qc.publish("u", "k", "inst", body, "who")
        self.assertEqual(what, "inserted")
        post = next(c for c in self.calls if c["method"] == "POST")
        tags = post["body"][0]["tags"]
        self.assertIn(qc.TAG, tags)
        # The census row must never read as a waiting lesson and be built.
        self.assertIn("lesson-captured", tags)

    def test_PROVEN_TO_CATCH_the_census_row_is_excluded_by_its_own_definition(self):
        # Its tags include lesson-captured, which the shared definition excludes,
        # so the census can never count itself and grow by one each cycle.
        self.assertIn("lesson-captured", qc.EXCLUDED_TAGS)


class LedgerTest(unittest.TestCase):
    def test_a_cycle_that_could_not_write_leaves_a_named_reason(self):
        with tempfile.TemporaryDirectory() as home:
            self.assertTrue(qc.write_ledger(home, "no-credential", error="OSError"))
            with open(os.path.join(home, "last-run.json"), "r", encoding="utf-8") as fh:
                entry = json.load(fh)
        self.assertEqual(entry["what"], "no-credential")
        self.assertEqual(entry["error"], "OSError")
        self.assertIn("at", entry)

    def test_the_ledger_never_raises_on_an_unwritable_home(self):
        self.assertFalse(qc.write_ledger("/proc/cannot/write/here", "error"))


if __name__ == "__main__":
    unittest.main()
