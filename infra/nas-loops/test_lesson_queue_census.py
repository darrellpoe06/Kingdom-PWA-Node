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


class WhyABuildFailed(unittest.TestCase):
    """by_stall: the failure CLASS, never the reason's text (0322).

    MEASURED 2026-11-12 on the lane this census exists for. The tailnet key was
    shut, the public road answered as designed, and all it could say was
    `build-failed: 3`, oldest 1 h. That cannot be acted on: `rate-limited` and
    `transient` HEAL THEMSELVES -- lesson_builder.eligibility() reads the class
    back off the front of the build-reason tag and retries -- while anything
    else is stuck and wants a person. For an hour the honest answer was "three
    failed and I cannot tell you which kind", which is the blindness this
    census was written to end, one field short.
    """

    def _rows(self):
        return [
            {"source": "research-inbox", "created_at": "2026-11-12T12:17:12Z",
             "tags": ["lesson", "build-failed",
                      "build-reason:rate-limited: HTTP 429 Too Many Requests"]},
            {"source": "research-inbox", "created_at": "2026-11-12T12:20:00Z",
             "tags": ["lesson", "build-failed",
                      "build-reason:transient: Failed to refresh OAuth token"]},
            {"source": "research-inbox", "created_at": "2026-11-12T12:25:00Z",
             "tags": ["lesson", "build-failed",
                      "build-reason:no version passed every gate: SECRET WORDS"]},
            {"source": "research-inbox", "created_at": "2026-11-12T12:30:00Z",
             "tags": ["lesson"]},
        ]

    def test_each_failure_class_is_counted_and_sums_to_the_build_failed_shape(self):
        c = qc.census_of(self._rows())
        self.assertEqual(c["by_stall"], {"rate-limited": 1, "transient": 1, "other": 1})
        self.assertEqual(sum(c["by_stall"].values()), c["by_shape"]["build-failed"])

    def test_the_reasons_TEXT_never_leaves_the_house(self):
        # reason_tag() keeps the class first so it survives the 200-character
        # cut; the remainder can quote a gate error carrying a person's words,
        # so the remainder is not read here at all.
        blob = json.dumps(qc.census_of(self._rows()))
        for leak in ("SECRET WORDS", "HTTP 429", "OAuth", "build-reason"):
            self.assertNotIn(leak, blob)

    def test_only_a_failed_row_is_classified_so_a_quiet_queue_says_nothing(self):
        plain = [{"source": "research-inbox", "created_at": "2026-11-12T12:30:00Z",
                  "tags": ["lesson"]}]
        self.assertEqual(qc.census_of(plain)["by_stall"], {})
        self.assertEqual(qc.census_of([])["by_stall"], {})

    def test_a_failed_row_with_no_reason_tag_is_other_rather_than_missing(self):
        # A build killed by the wall-clock budget can land without a reason.
        # Counting it as nothing would make by_stall disagree with by_shape and
        # quietly lose a stuck teaching.
        rows = [{"source": "research-inbox", "created_at": "2026-11-12T12:00:00Z",
                 "tags": ["lesson", "build-failed"]}]
        c = qc.census_of(rows)
        self.assertEqual(c["by_stall"], {"other": 1})
        self.assertEqual(sum(c["by_stall"].values()), c["by_shape"]["build-failed"])

    def test_PROVEN_TO_CATCH_a_classifier_that_matches_anywhere_not_only_the_front(self):
        # reason_tag() puts the class FIRST on purpose. A substring match would
        # call this row rate-limited because the words appear in a quoted gate
        # error, and a stuck teaching would be left for a retry that never fixes
        # it -- the same class of miss DR-1232 recorded when a cut tag hid a 429.
        row = {"source": "research-inbox", "created_at": "2026-11-12T12:00:00Z",
               "tags": ["lesson", "build-failed",
                        "build-reason:no version passed every gate: the writer said rate-limited"]}
        self.assertEqual(qc.stall_of(row), "other")


class WhichRowsWait(unittest.TestCase):
    """The receipt names WHICH rows wait, and never a tag (DR-1511).

    The counts alone could say five teachings waited and never which five, so a
    session that cannot join the tailnet could describe the queue and not act on
    it -- it could not even run the already-shipped sweep, which takes row ids.
    These rows ride the PUBLIC road, so the safety assertion is the point: a
    tag can carry `lesson-name:<a member's name>` (DR-0639) and must not travel.
    """

    def _rows(self):
        return [
            {
                "id": "aaa",
                "created_at": "2026-11-12T12:17:12Z",
                "source": "research-inbox",
                # A person's name planted BOTH in a reason tag and a name tag.
                "tags": ["lesson", "build-failed", "reason:reset by Mary Smith"],
            },
            {
                "id": "bbb",
                "created_at": "2026-11-14T01:00:00Z",
                "source": "research-inbox",
                "tags": ["lesson"],
            },
            {
                "id": "ccc",
                "created_at": "2026-11-15T01:00:00Z",
                "source": "lesson-voice-transcribe",
                "tags": ["lesson", "voice", "lesson-name:Jane Doe"],
            },
        ]

    def test_every_waiting_row_is_named_with_its_class(self):
        c = qc.census_of(self._rows())
        self.assertEqual(len(c["waiting"]), 3)
        self.assertEqual([w["id"] for w in c["waiting"]], ["aaa", "bbb", "ccc"])
        by_id = {w["id"]: w for w in c["waiting"]}
        self.assertEqual(by_id["aaa"]["shape"], "build-failed")
        self.assertEqual(by_id["aaa"]["stall"], "other")
        self.assertEqual(by_id["bbb"]["shape"], "plain")
        self.assertEqual(by_id["ccc"]["shape"], "voice-waiting-for-words")

    def test_the_count_and_the_named_rows_can_never_disagree(self):
        c = qc.census_of(self._rows())
        self.assertEqual(c["total"], len(c["waiting"]))

    def test_only_a_failed_row_carries_a_stall_class(self):
        c = qc.census_of(self._rows())
        carried = [w["id"] for w in c["waiting"] if "stall" in w]
        self.assertEqual(carried, ["aaa"])

    def test_PROVEN_TO_CATCH_no_tag_and_no_person_rides_the_public_road(self):
        blob = json.dumps(qc.census_of(self._rows()))
        for leak in ("tags", "lesson-name", "Jane Doe", "Mary Smith", "reason:"):
            self.assertNotIn(leak, blob, f"{leak!r} reached the public receipt")

    def test_a_quiet_queue_names_no_row_rather_than_omitting_the_key(self):
        c = qc.census_of([])
        self.assertEqual(c["waiting"], [])
        self.assertEqual(c["total"], 0)


class TheBuilderSaysWhetherItIsRunning(unittest.TestCase):
    """DR-1514. Three of six rows waiting on 2026-11-17 had failed ON the
    builder, and its state was reachable only over ssh behind a key dead since
    2026-11-04 -- so "3 build-failed" could not be read against whether the
    thing that builds was even running. The census runs on the box, so it reads
    the state locally. These cases hold the line on WHAT may leave the box."""

    def _home(self, service="active", sha="a1b2c3d4e5f6", locks=None, status="{}"):
        d = tempfile.mkdtemp()
        if sha is not None:
            with open(os.path.join(d, ".code.sha"), "w", encoding="utf-8") as fh:
                fh.write(sha + "\n")
        if locks is not None:
            os.mkdir(os.path.join(d, "locks"))
            for name in locks:
                open(os.path.join(d, "locks", name), "w").close()
        if status is not None:
            with open(os.path.join(d, "status.json"), "w", encoding="utf-8") as fh:
                fh.write(status)
        return d, (lambda argv: service)

    def test_it_reads_the_service_word_the_sha_and_the_build_count(self):
        d, run = self._home(locks=["a", "b"])
        s = qc.builder_state(d, run)
        self.assertEqual(s["service"], "active")
        self.assertEqual(s["code_sha"], "a1b2c3d4e5f6")
        self.assertEqual(s["building"], 2)
        self.assertTrue(all(s["read"].values()))

    def test_a_word_systemd_never_says_reads_unknown_not_stopped(self):
        d, _ = self._home()
        s = qc.builder_state(d, lambda argv: "Unit could not be found.")
        self.assertEqual(s["service"], "unknown")

    def test_a_crashed_systemctl_reads_unknown_not_stopped(self):
        d, _ = self._home()

        def boom(argv):
            raise OSError("systemctl is not here")

        self.assertEqual(qc.builder_state(d, boom)["service"], "unknown")

    def test_an_UNREADABLE_source_is_null_and_flagged_never_zero(self):
        # The whole point of DR-0076 section 8: a builder nobody could read is
        # not an idle builder. `building: 0` would be a lie here.
        d, run = self._home(sha=None, locks=None, status=None)
        s = qc.builder_state(d, run)
        self.assertIsNone(s["code_sha"])
        self.assertIsNone(s["building"])
        self.assertIsNone(s["status"])
        self.assertEqual(s["read"], {"code_sha": False, "building": False, "status": False})

    def test_it_keeps_the_booleans_counts_and_the_stamp(self):
        d, run = self._home(
            status=json.dumps({"ok": True, "attempts": 4, "at": "2026-11-17T03:02:12Z"})
        )
        s = qc.builder_state(d, run)
        self.assertEqual(s["status"], {"ok": True, "attempts": 4, "at": "2026-11-17T03:02:12Z"})
        self.assertEqual(s["status_withheld"], 0)

    def test_PROVEN_TO_CATCH_an_error_string_cannot_leave_the_box(self):
        # A builder's error text can QUOTE the teaching it failed on, which is
        # a person's own words, and this receipt rides the PUBLIC road.
        d, run = self._home(
            status=json.dumps(
                {
                    "ok": False,
                    "error": "could not parse: Bishop Gwin said the Lord told Mary Smith",
                    "last_row_body": "a member's teaching, verbatim",
                    "at": "2026-11-17T03:02:12Z",
                }
            )
        )
        s = qc.builder_state(d, run)
        blob = json.dumps(s)
        for leak in ("error", "Bishop Gwin", "Mary Smith", "last_row_body", "verbatim"):
            self.assertNotIn(leak, blob, f"{leak!r} reached the public receipt")
        self.assertEqual(s["status_withheld"], 2, "a withheld field must be COUNTED, not hidden")
        self.assertEqual(s["status"], {"ok": False, "at": "2026-11-17T03:02:12Z"})

    def test_PROVEN_TO_CATCH_a_lock_name_is_counted_never_published(self):
        # A lock is named for the row it holds; a row the census did not count
        # as waiting must not reach the public road by this side path.
        d, run = self._home(locks=["7a79db92-f370-4a7a-830b-24e77caa4ace"])
        blob = json.dumps(qc.builder_state(d, run))
        self.assertNotIn("7a79db92", blob)
        self.assertIn('"building": 1', blob)

    def test_a_sha_shaped_like_prose_is_dropped(self):
        d, run = self._home(sha="FAILED while reading Mary Smith's lesson")
        self.assertIsNone(qc.builder_state(d, run)["code_sha"])
        self.assertTrue(qc.builder_state(d, run)["read"]["code_sha"])

    def test_a_stamp_shaped_like_prose_is_dropped(self):
        d, run = self._home(status=json.dumps({"at": "right after Mary Smith's row"}))
        s = qc.builder_state(d, run)
        self.assertEqual(s["status"], {})
        self.assertEqual(s["status_withheld"], 1)

    def test_the_census_omits_the_builder_rather_than_faking_it(self):
        self.assertNotIn("builder", qc.census_of([]))
        self.assertIn("builder", qc.census_of([], builder={"service": "active"}))
