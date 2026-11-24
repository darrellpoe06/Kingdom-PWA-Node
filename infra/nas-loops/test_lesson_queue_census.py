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
import ast
import importlib.util
import json
import os
import re
import tempfile
import time
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
        # The third row's reason now lands on a NAMED site (0334): its opening
        # is lesson_gates.select_version()'s own refusal, so it reads `gates`
        # rather than the catch-all it read while only two classes existed.
        self.assertEqual(c["by_stall"], {"rate-limited": 1, "transient": 1, "gates": 1})
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
        self.assertEqual(qc.stall_of(row), "gates")
        self.assertNotEqual(qc.stall_of(row), "rate-limited")


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
            for spec in locks:
                # A plain name is a LIVE lock, written the way the builder
                # writes one: "<pid> <unix seconds>" (DR-1651). A tuple
                # (name, pid, age_seconds) builds a specific case, and a
                # (name, body) pair writes the body verbatim.
                if isinstance(spec, tuple) and len(spec) == 3:
                    name, pid, age = spec
                    body = f"{pid} {int(time.time()) - age}"
                elif isinstance(spec, tuple):
                    name, body = spec
                else:
                    name, body = spec, f"{os.getpid()} {int(time.time())}"
                with open(os.path.join(d, "locks", name + ".lock"), "w", encoding="utf-8") as fh:
                    fh.write(body)
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

    def test_building_now_counts_builds_that_RUN_not_files_left_behind(self):
        """DR-1651, measured 2026-11-24: the receipt read `building now: 24`
        while nine rows waited and not one attempt count moved in two hours.
        A build the budget kills never reaches release_row_lock, so its file
        stays; acquire_row_lock() breaks such a lock on its next pass, so the
        count was naming builds the builder itself had already written off.
        This asks the builder's own question of the builder's own two fields."""
        live = os.getpid()
        gone = 2 ** 22 - 1  # a pid high enough to be free on any Linux box
        d, run = self._home(locks=[
            "live-one",                      # this process, now
            ("live-two", live, 60),           # this process, a minute in
            ("dead-pid", gone, 10),           # its process is gone
            ("too-old", live, qc.LOCK_MAX_AGE_SECONDS + 1),  # past the budget
            ("empty", ""),                    # nothing written
            ("garbage", "not a pid at all"),  # unparseable
            ("zero-pid", 0, 10),              # never a real build
        ])
        self.assertEqual(qc.builder_state(d, run)["building"], 2)
        self.assertTrue(qc.builder_state(d, run)["read"]["building"])

        # A file that is not a lock at all is not a build either.
        d2, run2 = self._home(locks=["real"])
        open(os.path.join(d2, "locks", "README"), "w").close()
        self.assertEqual(qc.builder_state(d2, run2)["building"], 1)

        # The ceiling is the builder's own budget plus its grace, so the two
        # can never disagree about which locks are stale.
        self.assertEqual(qc.LOCK_MAX_AGE_SECONDS, 2700 + 120)

    def test_PROVEN_TO_CATCH_counting_every_file_is_the_old_lie(self):
        """Count files instead of live locks and the case above must fail."""
        live, gone = os.getpid(), 2 ** 22 - 1
        specs = ["a", ("dead", gone, 10), ("stale", live, qc.LOCK_MAX_AGE_SECONDS + 1)]
        d, run = self._home(locks=specs)
        self.assertEqual(qc.builder_state(d, run)["building"], 1)
        self.assertEqual(len(os.listdir(os.path.join(d, "locks"))), 3,
                         "three files on disk, one build: the number must not be 3")

    def test_an_unreadable_lock_directory_is_still_null_not_zero(self):
        """The liveness test must not turn DR-0076 section 8 into a zero: a
        directory nobody can list is `null` with read: false, as before."""
        d, run = self._home(locks=None)
        s = qc.builder_state(d, run)
        self.assertIsNone(s["building"])
        self.assertFalse(s["read"]["building"])
        # ... while a directory that lists but holds only dead locks is a real 0
        d2, run2 = self._home(locks=[("dead", 2 ** 22 - 1, 10)])
        s2 = qc.builder_state(d2, run2)
        self.assertEqual(s2["building"], 0)
        self.assertTrue(s2["read"]["building"])

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


class WhyARowStillWaits(unittest.TestCase):
    """DR-1515. The 06:08 read said the builder was active, building 0, its own
    record 14 minutes fresh -- while three teachings had waited five days.
    eligibility() explains it: past MAX_ATTEMPTS a row is left for the hourly
    Routine ON PURPOSE. Nothing on the public road said so, and `plain` could
    not tell an untouched row from a handed-over one."""

    # created_by is DARRELL'S on purpose: these cases are about how the builder
    # handles HIS rows. Without it every verdict is `waits-for-governor`, which
    # is the correct answer for an unknown author and is pinned in
    # AMembersRowWaitsForTheGovernor below.
    OWNER = "f13843f2-742b-4f8a-82af-7ecfbdc536ec"

    def row(self, *tags):
        return {"id": "r", "created_at": "2026-11-17T00:00:00Z", "source": "research-inbox",
                "created_by": self.OWNER, "tags": list(tags)}

    def test_an_untouched_row_is_ready_so_the_builder_should_take_it(self):
        self.assertEqual(qc.why_of(self.row("lesson")), "ready")
        self.assertEqual(qc.attempts_of(self.row("lesson")), 0)

    def test_a_deferred_row_says_so_rather_than_reading_as_untouched(self):
        # The exact confusion this record exists to remove: before it, this row
        # and the one above were both just `plain`.
        r = self.row("lesson", "build:deferred@2026-11-17T01:00:00Z")
        self.assertEqual(qc.why_of(r), "deferred")
        self.assertEqual(qc.shape_of(r), "plain", "shape still cannot tell them apart -- why is what does")

    def test_failures_are_counted_so_exhaustion_is_the_readers_to_judge(self):
        r = self.row("lesson", "build-failed", "build:failed@2026-11-12T12:00:00Z",
                     "build:failed@2026-11-12T13:00:00Z", "build-reason:other: a gate refused it")
        self.assertEqual(qc.why_of(r), "failed")
        self.assertEqual(qc.attempts_of(r), 2)

    def test_THE_THRESHOLD_IS_NOT_COPIED_so_the_two_files_cannot_drift(self):
        """The census must never decide exhaustion: the builder owns that number
        and its environment can change it, so two files computing it is drift.

        CODE ONLY, never the comments. The first draft of this case scanned the
        whole file and failed on the very comment that explains the threshold is
        NOT copied -- the same trap the keyless-eye guard fell into hours
        earlier. A check that fires on its own documentation teaches people to
        delete the documentation."""
        path = os.path.join(os.path.dirname(qc.__file__), "lesson-queue-census.py")
        with open(path, encoding="utf-8") as fh:
            code = "\n".join(ln for ln in fh.read().split("\n") if not ln.lstrip().startswith("#"))
        for forbidden in ("MAX_ATTEMPTS", "max_attempts"):
            self.assertNotIn(forbidden, code, f"{forbidden!r} would duplicate the builder's threshold")
        # And the builder really does own it, so the pin above is not vacuous.
        builder = os.path.join(os.path.dirname(qc.__file__), "..", "nas-lesson-builder", "lesson_builder.py")
        if os.path.exists(builder):
            with open(builder, encoding="utf-8") as fh:
                self.assertIn("MAX_ATTEMPTS", fh.read())

    def test_a_rate_limited_failure_is_told_apart_from_a_stuck_one(self):
        limited = self.row("lesson", "build-failed", "build:failed@2026-11-12T12:00:00Z",
                           "build-reason:rate-limited: HTTP 429 (success)")
        stuck = self.row("lesson", "build-failed", "build:failed@2026-11-12T12:00:00Z",
                         "build-reason:other: no version passed every gate")
        self.assertEqual(qc.why_of(limited), "rate-limited")
        self.assertEqual(qc.why_of(stuck), "failed")

    def test_declined_outranks_everything_else(self):
        r = self.row("lesson", "lesson-declined", "build:deferred@2026-11-17T01:00:00Z",
                     "build:failed@2026-11-17T01:00:00Z")
        self.assertEqual(qc.why_of(r), "declined")

    def test_every_verdict_is_in_the_closed_set(self):
        cases = [self.row("lesson"), self.row("lesson", "lesson-declined"),
                 self.row("lesson", "build:deferred@x"),
                 self.row("lesson", "build:failed@x", "build-reason:rate-limited: 429"),
                 self.row("lesson", "build:failed@x", "build-reason:other: x")]
        for r in cases:
            self.assertIn(qc.why_of(r), qc.WHYS)

    def test_PROVEN_TO_CATCH_a_reasons_text_cannot_ride_the_verdict(self):
        r = self.row("lesson", "build-failed", "build:failed@2026-11-12T12:00:00Z",
                     "build-reason:other: Bishop Gwin said the Lord told Mary Smith")
        c = qc.census_of([r])
        blob = json.dumps(c)
        for leak in ("Bishop Gwin", "Mary Smith", "build-reason", "said the Lord"):
            self.assertNotIn(leak, blob, f"{leak!r} reached the public receipt")
        self.assertEqual(c["waiting"][0]["why"], "failed")
        self.assertEqual(c["waiting"][0]["attempts"], 1)

    def test_a_malformed_tag_list_never_raises(self):
        # No author either, so the safe verdict is the Governor's queue rather
        # than `ready`: an unknown row is never asserted as the builder's.
        for bad in (None, "not a list", 7, {"a": 1}):
            self.assertEqual(qc.why_of({"tags": bad}), "waits-for-governor")
            self.assertEqual(qc.attempts_of({"tags": bad}), 0)
            self.assertEqual(qc.why_of({"tags": bad, "created_by": self.OWNER}), "ready")


class AMembersRowWaitsForTheGovernor(unittest.TestCase):
    """Corrected 2026-11-17, from the first read with verdicts live: four rows
    said `ready` while the builder sat active and idle, which READ AS the
    builder neglecting them. The branch was missing. A member's row is never
    built without `lesson-approved` (DR-0635), so `ready` was overclaiming on
    the one case where it matters most -- somebody else's teaching."""

    DARRELL = "f13843f2-742b-4f8a-82af-7ecfbdc536ec"
    PHONE = "c2a6c39a-ae99-4ff7-83c6-b927e2e7f1cc"
    MEMBER = "99999999-9999-9999-9999-999999999999"

    def row(self, who, *tags):
        return {"id": "r", "created_at": "2026-11-17T00:00:00Z", "source": "research-inbox",
                "created_by": who, "tags": ["lesson"] + list(tags)}

    def test_both_of_darrells_accounts_read_ready(self):
        for who in (self.DARRELL, self.PHONE):
            self.assertEqual(qc.why_of(self.row(who)), "ready")

    def test_a_members_row_waits_for_the_governor_not_ready(self):
        self.assertEqual(qc.why_of(self.row(self.MEMBER)), "waits-for-governor")

    def test_an_approved_members_row_becomes_ready(self):
        self.assertEqual(qc.why_of(self.row(self.MEMBER, "lesson-approved")), "ready")

    def test_a_declined_members_row_reads_declined_not_governor(self):
        self.assertEqual(qc.why_of(self.row(self.MEMBER, "lesson-declined")), "declined")

    def test_a_missing_created_by_is_treated_as_NOT_an_owner(self):
        # The safe direction: an unknown author waits for the Governor rather
        # than reading as the builder's to take.
        self.assertEqual(qc.why_of({"tags": ["lesson"]}), "waits-for-governor")
        self.assertEqual(qc.why_of({"tags": ["lesson"], "created_by": None}), "waits-for-governor")

    def test_PROVEN_TO_CATCH_no_account_id_rides_the_public_road(self):
        c = qc.census_of([self.row(self.MEMBER), self.row(self.DARRELL)])
        blob = json.dumps(c)
        for leak in (self.MEMBER, self.DARRELL, self.PHONE, "created_by"):
            self.assertNotIn(leak, blob, f"{leak!r} reached the public receipt")
        self.assertEqual([w["why"] for w in c["waiting"]], ["waits-for-governor", "ready"])

    def test_the_query_carries_created_by_so_the_check_can_happen_at_all(self):
        self.assertIn("created_by", qc.waiting_query())

    def test_the_OWNER_IDS_here_match_the_builders(self):
        builder = os.path.join(os.path.dirname(qc.__file__), "..", "nas-lesson-builder", "lesson_builder.py")
        if os.path.exists(builder):
            with open(builder, encoding="utf-8") as fh:
                src = fh.read()
            for who in qc.OWNER_IDS:
                self.assertIn(who, src, "the census and the builder disagree about whose rows these are")


class WhichCodeAnswered(unittest.TestCase):
    """DR-1517. 2026-11-17 09:11: DR-1516 taught the census to tell a member's
    row from Darrell's, and the next read came back with four rows reading
    `ready`. That was consistent with TWO worlds -- the new code running and
    those rows being his, or the old code still on the box -- and nothing in
    the payload told them apart. An answer whose code version is unknown cannot
    be acted on, so the census names the code that wrote it."""

    SHA = "9e9c90446c3e7769adb7d341fe0d9dedc26b5be8"

    def test_it_reports_the_mirror_head(self):
        self.assertEqual(qc.census_code_sha("/r", lambda a: self.SHA + "\n"), self.SHA)

    def test_a_short_sha_is_still_a_sha(self):
        self.assertEqual(qc.census_code_sha("/r", lambda a: "297a00d"), "297a00d")

    def test_PROSE_IS_NOT_A_SHA_so_it_reads_unknown(self):
        for junk in ("fatal: not a git repository", "", "   ", "HEAD -> main"):
            self.assertIsNone(qc.census_code_sha("/r", lambda a, j=junk: j))

    def test_a_crashed_git_reads_unknown_not_a_guess(self):
        def boom(argv):
            raise OSError("git is not here")

        self.assertIsNone(qc.census_code_sha("/r", boom))

    def test_it_asks_the_repo_it_was_told_about(self):
        seen = {}

        def spy(argv):
            seen["argv"] = argv
            return self.SHA

        qc.census_code_sha("/somewhere/else", spy)
        self.assertEqual(seen["argv"], ["git", "-C", "/somewhere/else", "rev-parse", "HEAD"])

    def test_the_census_omits_it_rather_than_faking_it(self):
        self.assertNotIn("code_sha", qc.census_of([]))
        self.assertEqual(qc.census_of([], code_sha=self.SHA)["code_sha"], self.SHA)

    def test_the_builders_sha_and_the_censuss_are_not_confused(self):
        # Two different code shas ride this receipt: the builder's own, and the
        # census's. They sit at different depths on purpose.
        c = qc.census_of([], builder={"code_sha": "297a00d80ade4aba"}, code_sha=self.SHA)
        self.assertEqual(c["builder"]["code_sha"], "297a00d80ade4aba")
        self.assertEqual(c["code_sha"], self.SHA)


class TheHeadIsReadWithoutGit(unittest.TestCase):
    """DR-1518, measured. DR-1517 shipped census_code_sha as `git rev-parse` and
    the field stayed ABSENT for 59 minutes across about four services-sync
    cycles -- while DR-1511's census change had reached the box in 16. So the
    shell-out was failing on the NAS, not waiting on a pull, and every likely
    cause is a property of calling git as the clock's user: git off that user's
    PATH, or git refusing a mirror it does not own. The files answer the same
    question with no PATH, no ownership check and no subprocess."""

    SHA = "e427b604119aa1b2c3d4e5f6a7b8c9d0e1f20304"

    def _repo(self, head=None, ref=None, packed=None):
        d = tempfile.mkdtemp()
        g = os.path.join(d, ".git")
        os.makedirs(g)
        if head is not None:
            with open(os.path.join(g, "HEAD"), "w", encoding="utf-8") as fh:
                fh.write(head)
        if ref is not None:
            os.makedirs(os.path.join(g, "refs", "heads"), exist_ok=True)
            with open(os.path.join(g, "refs", "heads", "main"), "w", encoding="utf-8") as fh:
                fh.write(ref)
        if packed is not None:
            with open(os.path.join(g, "packed-refs"), "w", encoding="utf-8") as fh:
                fh.write(packed)
        return d

    def _never(self, argv):
        raise AssertionError("git must not be called when the files answer")

    def test_a_symbolic_head_resolves_through_the_loose_ref(self):
        d = self._repo(head="ref: refs/heads/main\n", ref=self.SHA + "\n")
        self.assertEqual(qc.census_code_sha(d, self._never), self.SHA)

    def test_a_detached_head_holds_the_sha_itself(self):
        d = self._repo(head=self.SHA + "\n")
        self.assertEqual(qc.census_code_sha(d, self._never), self.SHA)

    def test_a_PACKED_ref_is_found_when_the_loose_one_is_gone(self):
        d = self._repo(head="ref: refs/heads/main\n",
                       packed="# pack-refs with: peeled fully-peeled sorted \n"
                              f"{self.SHA} refs/heads/main\n"
                              "^aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\n")
        self.assertEqual(qc.census_code_sha(d, self._never), self.SHA)

    def test_a_peeled_line_is_never_mistaken_for_the_ref(self):
        d = self._repo(head="ref: refs/heads/main\n",
                       packed=f"^{self.SHA}\n0123456789abcdef0123456789abcdef01234567 refs/heads/main\n")
        self.assertEqual(qc.census_code_sha(d, self._never),
                         "0123456789abcdef0123456789abcdef01234567")

    def test_GIT_IS_THE_FALLBACK_not_the_first_road(self):
        # No .git at all: the files cannot answer, so git is asked.
        d = tempfile.mkdtemp()
        self.assertEqual(qc.census_code_sha(d, lambda a: self.SHA), self.SHA)

    def test_PROVEN_TO_CATCH_gits_dubious_ownership_refusal(self):
        # The exact failure this record exists for: git answers prose, not a
        # sha, and the field must be absent rather than carry the sentence.
        d = tempfile.mkdtemp()
        msg = "fatal: detected dubious ownership in repository at '/volume1/PoeTech/repos'"
        self.assertIsNone(qc.census_code_sha(d, lambda a: msg))

    def test_an_unreadable_ref_falls_through_rather_than_raising(self):
        d = self._repo(head="ref: refs/heads/main\n")  # no ref file, no packed-refs
        self.assertIsNone(qc.census_code_sha(d, lambda a: ""))

    def test_a_head_that_is_neither_a_sha_nor_a_ref_reads_unknown(self):
        d = self._repo(head="gone fishing\n")
        self.assertIsNone(qc.census_code_sha(d, lambda a: ""))


class ARowWithNoWordsSaysSo(unittest.TestCase):
    """DR-1519. eligibility()'s last unmirrored branch refuses a row with no
    words, and DR-1516 left it out because testing it LOOKED like it needed the
    body. It does not: PostgREST answers it as a filter returning only ids. The
    first design on the table was a generated body_length column -- a schema
    change on the table holding people's teachings -- for an answer a `where`
    gives for free."""

    OWNER = "f13843f2-742b-4f8a-82af-7ecfbdc536ec"
    EMPTY = "825019ca-969e-4f55-87a0-21bbcd15da2c"
    FULL = "c671009b-04ee-4482-b5ef-921cb7f50d67"

    def row(self, rid, *tags):
        return {"id": rid, "created_at": "2026-11-17T00:00:00Z", "source": "research-inbox",
                "created_by": self.OWNER, "tags": ["lesson"] + list(tags)}

    def test_an_empty_row_reads_no_words_and_a_full_one_reads_ready(self):
        self.assertEqual(qc.why_of(self.row(self.EMPTY), (self.EMPTY,)), "no-words")
        self.assertEqual(qc.why_of(self.row(self.FULL), (self.EMPTY,)), "ready")

    def test_the_FILTER_asks_for_ids_only_and_never_the_body(self):
        q = qc.empty_body_query()
        self.assertIn("select=id", q)
        self.assertNotIn("body.", q.split("or=(")[0], "no body in the select or the tag filters")
        self.assertIn("or=(body.is.null,body.eq.)", q)
        # The same five exclusions as the waiting query: one definition of waiting.
        for tag in qc.EXCLUDED_TAGS:
            self.assertIn(urllib_quote(tag), q)

    def test_it_shares_the_waiting_definition_exactly(self):
        w, e = qc.waiting_query(), qc.empty_body_query()
        for tag in qc.EXCLUDED_TAGS:
            self.assertEqual(w.count(urllib_quote(tag)), e.count(urllib_quote(tag)))

    def test_an_unanswered_filter_leaves_a_row_READY_not_no_words(self):
        # Narrower than the truth, never wider: a refusal must not invent an
        # empty row, and must not kill the census either.
        self.assertEqual(qc.why_of(self.row(self.EMPTY), ()), "ready")
        self.assertEqual(qc.why_of(self.row(self.EMPTY), None), "ready")

    def test_no_words_outranks_deferred_and_the_failure_classes(self):
        r = self.row(self.EMPTY, "build:deferred@x", "build:failed@x")
        self.assertEqual(qc.why_of(r, (self.EMPTY,)), "no-words")

    def test_the_governor_still_outranks_no_words(self):
        r = {"id": self.EMPTY, "created_by": "99999999-9999-9999-9999-999999999999",
             "tags": ["lesson"], "created_at": "2026-11-17T00:00:00Z"}
        self.assertEqual(qc.why_of(r, (self.EMPTY,)), "waits-for-governor")

    def test_PROVEN_TO_CATCH_the_census_never_SELECTS_a_body(self):
        """The property is about PROJECTION, not the word.

        A blunter first draft asserted the file never contains `"body"` at all
        and failed on the census WRITING ITS OWN row -- `publish()` sets
        {"body": <the census json>}, which is this loop's own payload and not
        anybody's teaching. The precise rule: `body` may appear in a PREDICATE
        (the empty filter) and never in a `select`."""
        for q in (qc.waiting_query(), qc.empty_body_query()):
            select = [p for p in q.split("&") if "select=" in p]
            self.assertTrue(select, q)
            self.assertNotIn("body", select[0], "a body must never be PROJECTED")
        # And the one predicate that may name it is exactly the empty test.
        named = [p for p in qc.empty_body_query().split("&") if "body" in p]
        self.assertEqual(named, ["or=(body.is.null,body.eq.)"])
        self.assertEqual([p for p in qc.waiting_query().split("&") if "body" in p], [])

    def test_the_census_threads_the_ids_through(self):
        c = qc.census_of([self.row(self.EMPTY), self.row(self.FULL)], empty_ids=(self.EMPTY,))
        self.assertEqual([w["why"] for w in c["waiting"]], ["no-words", "ready"])


def urllib_quote(tag):
    import json as _j
    import urllib.parse as _u

    return _u.quote(_j.dumps([tag]))


class TheBuilderSaysWhyItIsNotReady(unittest.TestCase):
    """DR-1522. Measured 2026-11-17 22:11: the builder's heartbeat advanced
    hourly (20:51:29 -> 21:51:31) while three rows' attempt counts stayed frozen
    at 1, 1 and 2 since 2026-11-12 and `building now` stayed 0. That signature
    fits TWO causes with opposite fixes -- readiness() refusing, so consider()
    returns at lesson_builder.py:2545 before `db.pending()` is ever called and
    no attempt is recorded; or readiness passing and eligibility() refusing on
    its one unmirrorable branch, a whitespace-only body. `state` separates them
    and was one of the four fields the receipt withheld."""

    def fields(self, value):
        return qc._status_fields({"at": "2026-11-17T21:51:31Z", "state": value})

    def test_each_of_the_four_real_states_rides(self):
        # Every value readiness() and consider() can produce.
        for s in ("ready", "waiting on a writer", "waiting on a push credential", "stopped"):
            f, dropped = self.fields(s)
            self.assertEqual(f.get("state"), s)
            self.assertEqual(dropped, 0, s)

    def test_PROVEN_TO_CATCH_a_name_that_a_SHAPE_would_have_let_through(self):
        """The allowlist is the whole reason this field may ride at all.

        Last night's refused design published withheld KEY NAMES against the
        shape ^[a-z][a-z0-9_]{0,23}$ -- which `error_from_mary_smith` satisfies.
        DR-1514's gate was right to refuse it. These are the values that a
        shape test would pass and an identity match cannot."""
        for hostile in ("waiting on a writer for Mary Smith",
                        "ready",  # control: the only one of these that may ride
                        "stopped: Bishop Gwin's notes are missing",
                        "waiting on a push credential at /volume1/PoeTech/.token",
                        "WAITING ON A WRITER",
                        "waiting  on a writer",
                        "waiting on a writer\n",
                        " ready "):
            f, dropped = self.fields(hostile)
            if hostile == "ready":
                self.assertEqual(f.get("state"), "ready")
                continue
            self.assertNotIn("state", f, hostile)
            self.assertEqual(dropped, 1, hostile)
            # And no fragment of it is anywhere in what would be published.
            self.assertNotIn("Mary", json.dumps(f))
            self.assertNotIn("Gwin", json.dumps(f))
            self.assertNotIn("volume1", json.dumps(f))

    def test_what_is_published_is_the_censuss_OWN_constant_not_the_builders_bytes(self):
        """Identity match, then publish our own object. A caller cannot hand us
        a str subclass carrying extra payload and see it echoed back."""

        class Sneaky(str):
            secret = "Mary Smith"

        f, _ = self.fields(Sneaky("ready"))
        self.assertEqual(f["state"], "ready")
        self.assertNotIsInstance(f["state"], Sneaky)
        self.assertIs(f["state"], qc.BUILDER_STATES[0])

    def test_a_non_string_state_is_withheld_and_counted(self):
        for junk in (None, 7, True, [], {}, ["ready"]):
            f, dropped = self.fields(junk)
            self.assertNotIn("state", f, repr(junk))
            self.assertEqual(dropped, 1, repr(junk))

    def test_the_allowlist_matches_the_builder_EXACTLY(self):
        """The two files must not drift: a state the builder gains and this list
        lacks reads as withheld, which is safe but blind, and the drift should
        fail here rather than be discovered on a quiet receipt."""
        src = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                           "nas-lesson-builder", "lesson_builder.py")
        with open(src, encoding="utf-8") as fh:
            tree = ast.parse(fh.read())
        # PARSED, not grepped. Two regex drafts both cried wolf: the first swept
        # every quoted string in the file and "found" ten states that do not
        # exist (`merge`, `lesson`, `wait`) because `else "..."` matches any
        # ternary; the second picked up `": "` and `", "` out of the dict
        # literals beside the field. A drift test that cries wolf gets deleted,
        # so this asks the syntax tree the exact question: which string literals
        # can actually reach a `state` binding?
        found = set()

        def strs(node):
            if isinstance(node, ast.Constant) and isinstance(node.value, str):
                return {node.value}
            if isinstance(node, ast.IfExp):  # the readiness() ternary chain
                return strs(node.body) | strs(node.orelse)
            return set()

        for node in ast.walk(tree):
            if isinstance(node, ast.Assign):
                for t in node.targets:
                    if isinstance(t, ast.Name) and t.id == "state":
                        found |= strs(node.value)
            if isinstance(node, ast.Dict):
                for k, v in zip(node.keys, node.values):
                    if isinstance(k, ast.Constant) and k.value == "state":
                        found |= strs(v)
        self.assertTrue(found, "no state literal found -- did the builder move?")
        missing = {s for s in found if s not in qc.BUILDER_STATES}
        self.assertEqual(missing, set(),
                         "lesson_builder.py can produce a state BUILDER_STATES does not list")
        # And the allowlist is not padded with states the builder cannot produce.
        self.assertEqual(set(qc.BUILDER_STATES), found,
                         "BUILDER_STATES and lesson_builder.py disagree")

    def test_a_withheld_state_still_leaves_the_rest_of_the_record_readable(self):
        # A refusal costs that one field, never the stamp beside it.
        f, dropped = qc._status_fields(
            {"at": "2026-11-17T21:51:31Z", "attempts": 4, "state": "waiting on a writer, /srv/x"})
        self.assertEqual(f["at"], "2026-11-17T21:51:31Z")
        self.assertEqual(f["attempts"], 4)
        self.assertNotIn("state", f)
        self.assertEqual(dropped, 1)


class TheReaderSaysWhichCauseTheStatePointsAt(unittest.TestCase):
    """DR-1522. `state` is only worth publishing if the reader says what it
    MEANS. Sorted in beside `attempts` it is a curiosity; lifted out it is the
    difference between "fix the box" and "those teachings have no words"."""

    @classmethod
    def setUpClass(cls):
        s = importlib.util.spec_from_file_location(
            "served_lesson_queue", os.path.join(_ROOT, "scripts", "served-lesson-queue.py")
        )
        cls.rd = importlib.util.module_from_spec(s)
        s.loader.exec_module(cls.rd)

    def receipt(self, state=None, **status):
        # RELATIVE TO NOW, never a fixed stamp. A first draft hardcoded the real
        # 22:11 census time; it passed when written and went red an hour later,
        # because the reader correctly calls a census older than the NAS's
        # 15-minute clock STALE and stops before the builder lines. A test whose
        # result depends on the wall clock is a test that fails in someone
        # else's morning.
        now = datetime.now(timezone.utc)  # noqa: UP017 -- the NAS runs Python 3.8
        fresh = now.strftime("%Y-%m-%dT%H:%M:%SZ")
        st = {"at": fresh, "attempts": 4}
        st.update(status)
        if state is not None:
            st["state"] = state
        return {"seen": True, "at": fresh, "total": 7,
                "waiting": [{"id": "c671009b-04ee-4482-b5ef-921cb7f50d67",
                             "created_at": "2026-11-17T03:32:12Z", "road": "research-inbox",
                             "shape": "plain", "why": "ready"}],
                "builder": {"service": "active", "building": 0, "code_sha": "297a00d80ade",
                            "read": {"code_sha": True, "building": True, "status": True},
                            "status": st}}

    # The receipt is stamped 22:11:08Z; judged by the wall clock it went stale
    # fifteen minutes after it was written and every verdict below collapsed
    # into "UNKNOWN, a stale count". The reader takes `now`, so the clock is
    # frozen a minute after the stamp and the verdicts are about the STATE.
    NOW = datetime(2026, 11, 17, 22, 12, 8, tzinfo=timezone.utc)  # noqa: UP017 -- the NAS runs Python 3.8

    def said(self, state=None, **kw):
        # judge() returns (code, read, count, lines); the lines are the surface.
        return "\n".join(self.rd.judge(self.receipt(state, **kw), "ok", now=self.NOW)[3])

    def test_waiting_on_a_writer_says_the_box_is_the_problem_not_the_words(self):
        out = self.said("waiting on a writer")
        self.assertIn("NOT working the queue", out)
        self.assertIn("a writer it can reach", out)
        self.assertIn("waiting on the box, not on the words", out)

    def test_waiting_on_a_push_credential_names_THAT_and_not_the_writer(self):
        out = self.said("waiting on a push credential")
        self.assertIn("a push credential", out)
        self.assertNotIn("a writer it can reach", out)

    def test_ready_rules_readiness_OUT_and_points_at_eligibility(self):
        out = self.said("ready")
        self.assertIn("Readiness is NOT the cause", out)
        self.assertIn("eligibility()", out)
        self.assertIn("whitespace", out)
        # The `never a body` guard refuses that word across this whole span of
        # the reader, comments included; the sentence says `words` instead.
        self.assertNotIn("body", out)
        self.assertNotIn("NOT working the queue", out)

    def test_stopped_says_the_kill_state_holds_it(self):
        out = self.said("stopped")
        self.assertIn("STOPPED by its own kill state", out)

    def test_an_ABSENT_state_reads_UNKNOWN_and_rules_NOTHING_out(self):
        # DR-0076 section 8 again: a cause nobody could read is not a cause
        # eliminated. Before 0332 this was every read, and it is why four
        # `ready` rows sat beside an active builder for five days unexplained.
        out = self.said(None)
        self.assertIn("UNKNOWN", out)
        self.assertIn("neither readiness nor eligibility is ruled out", out)
        for wrong in ("NOT working the queue", "Readiness is NOT the cause",
                      "STOPPED by its own kill state"):
            self.assertNotIn(wrong, out)

    def test_an_UNREAD_record_does_not_get_the_unknown_line_twice(self):
        # `its own record: unread` already says it; a second sentence saying the
        # same thing is noise on the surface that matters most.
        r = self.receipt(None)
        r["builder"]["read"]["status"] = False
        out = "\n".join(self.rd.judge(r, "ok", now=self.NOW)[3])
        self.assertIn("its own record: unread", out)
        self.assertNotIn("neither readiness nor eligibility is ruled out", out)

    def test_no_state_the_allowlist_refused_can_reach_the_reader_as_prose(self):
        """End to end: the census withholds it, so the reader never sees it.

        This is the pair of checks that matter together -- the field is only
        safe because the refusal happens BEFORE the row is written, not because
        the reader is careful with it."""
        fields, dropped = qc._status_fields(
            {"at": "2026-11-17T21:51:31Z", "state": "waiting on a writer for Mary Smith"})
        self.assertNotIn("state", fields)
        self.assertEqual(dropped, 1)
        out = "\n".join(self.rd.judge(self.receipt(), "ok", now=self.NOW)[3])  # no state at all
        self.assertNotIn("Mary", out)
        self.assertIn("UNKNOWN", out)


class WhichWriterIsMissing(unittest.TestCase):
    """DR-1524. 2026-11-17T23:25:22Z the census answered `state: waiting on a
    writer` -- the teachings were fine and the box was the problem. But `state`
    cannot say whether NO writer is configured (nothing was ever set up) or one
    is configured and FAILING (a lapsed sign-in), and those are different jobs.
    readiness() answers it per writer; the entry just carries two fields that
    must never ride -- `why` is a probe's own words, `writer` is a name out of
    lesson-writers.json that a person could have set to anything."""

    def real(self):
        """The live readiness payload, shape for shape -- a method, not a class
        attribute, so no case can mutate the list another case reads."""
        return [
            {"writer": "claude on the NAS", "kind": "cli-local", "family": "claude", "primary": True,
             "ok": False, "why": "claude at /usr/local/bin/claude but NOT signed in: run `claude` once",
             "configured": True},
            {"writer": "Mary Smith's laptop", "kind": "cli-ssh", "family": "claude", "primary": False,
             "ok": False, "why": "not configured: no target (user@host where claude is signed in)",
             "configured": False},
            {"writer": "anthropic", "kind": "api", "family": "claude", "primary": False,
             "ok": False, "why": "not configured: no Anthropic API key on the NAS (optional writer)",
             "configured": False},
        ]

    def test_it_publishes_kind_ok_and_configured_AND_NOTHING_ELSE(self):
        kept, lost = qc._writer_entries(self.real())
        self.assertEqual(lost, 0)
        self.assertEqual(kept, [
            {"kind": "cli-local", "ok": False, "configured": True},
            {"kind": "cli-ssh", "ok": False, "configured": False},
            {"kind": "api", "ok": False, "configured": False},
        ])
        # Exactly the three keys, per entry, on every entry.
        for e in kept:
            self.assertEqual(set(e), {"kind", "ok", "configured"})

    def test_PROVEN_TO_CATCH_no_name_and_no_probe_words_survive(self):
        """The two fields this record exists to keep OFF the road.

        `why` carried a filesystem path and an instruction; `writer` carried a
        person's name. Neither may appear anywhere in what is published."""
        kept, _ = qc._writer_entries(self.real())
        blob = json.dumps(kept)
        for secret in ("Mary", "Smith", "laptop", "signed in", "/usr/local/bin",
                       "Anthropic", "API key", "not configured", "user@host", "anthropic"):
            self.assertNotIn(secret, blob, secret)

    def test_the_answer_a_reader_needs_is_actually_readable(self):
        # This is the whole point: configured-but-failing vs never-configured.
        kept, _ = qc._writer_entries(self.real())
        failing = [e["kind"] for e in kept if e.get("configured") and not e.get("ok")]
        absent = [e["kind"] for e in kept if not e.get("configured")]
        self.assertEqual(failing, ["cli-local"], "a configured writer that is failing")
        self.assertEqual(absent, ["cli-ssh", "api"], "writers nobody set up")

    def test_an_unknown_kind_is_counted_never_named(self):
        kept, lost = qc._writer_entries([{"kind": "a-new-adapter", "ok": True, "configured": True}])
        self.assertEqual(kept, [])
        self.assertEqual(lost, 1)

    def test_a_kind_that_merely_LOOKS_right_cannot_ride(self):
        for hostile in ("cli-local ", "CLI-LOCAL", "cli_local", "cli-local; Mary Smith",
                        "api\n", None, 7, True, ["api"]):
            kept, lost = qc._writer_entries([{"kind": hostile, "ok": True, "configured": True}])
            self.assertEqual(kept, [], repr(hostile))
            self.assertEqual(lost, 1, repr(hostile))

    def test_what_is_published_is_the_censuss_OWN_constant(self):
        class Sneaky(str):
            secret = "Mary Smith"

        kept, _ = qc._writer_entries([{"kind": Sneaky("api"), "ok": True, "configured": True}])
        self.assertIs(kept[0]["kind"], qc.WRITER_KINDS[0])
        self.assertNotIsInstance(kept[0]["kind"], Sneaky)

    def test_a_non_boolean_flag_is_dropped_not_coerced(self):
        # "ok": "yes" must not become True -- a truthy string is not a probe result.
        kept, lost = qc._writer_entries([{"kind": "api", "ok": "yes", "configured": 1}])
        self.assertEqual(kept, [{"kind": "api"}])
        self.assertEqual(lost, 0, "the entry still said which kind, so nothing was lost")

    def test_a_non_list_writers_value_is_withheld_and_counted(self):
        for junk in (None, {}, "cli-local", 7):
            kept, lost = qc._writer_entries(junk)
            self.assertEqual(kept, [], repr(junk))
            self.assertEqual(lost, 1, repr(junk))

    def test_it_rides_through_status_fields_beside_state(self):
        f, dropped = qc._status_fields(
            {"at": "2026-11-17T23:06:34Z", "state": "waiting on a writer", "writers": self.real(),
             "reachable": ["something"], "push_credential": "present at /volume1/x"})
        self.assertEqual(f["state"], "waiting on a writer")
        self.assertEqual([e["kind"] for e in f["writers"]], ["cli-local", "cli-ssh", "api"])
        self.assertEqual(dropped, 2, "reachable and push_credential are still withheld")
        self.assertNotIn("volume1", json.dumps(f))

    def test_the_kinds_match_lesson_writer_py_EXACTLY(self):
        """Parsed, not grepped -- the same lesson as BUILDER_STATES' drift test."""
        src = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                           "nas-lesson-builder", "lesson_writer.py")
        with open(src, encoding="utf-8") as fh:
            tree = ast.parse(fh.read())
        found = set()
        for node in ast.walk(tree):
            if not isinstance(node, ast.ClassDef):
                continue
            for stmt in node.body:
                if not isinstance(stmt, ast.Assign):
                    continue
                for t in stmt.targets:
                    if (isinstance(t, ast.Name) and t.id == "kind"
                            and isinstance(stmt.value, ast.Constant)
                            and isinstance(stmt.value.value, str)):
                        found.add(stmt.value.value)
        self.assertTrue(found, "no writer kind found -- did lesson_writer.py move?")
        self.assertEqual(found - set(qc.WRITER_KINDS), set(),
                         "lesson_writer.py has an adapter kind WRITER_KINDS does not list")
        self.assertEqual(set(qc.WRITER_KINDS) - found, set(),
                         "WRITER_KINDS lists a kind lesson_writer.py cannot produce")


class TheReaderNamesTheWriterToFix(unittest.TestCase):
    """DR-1524. The field is only worth publishing if the reader turns it into
    the one sentence a person can act on: a lapsed login is ONE login; nothing
    configured is a setup. Those are different jobs."""

    @classmethod
    def setUpClass(cls):
        s = importlib.util.spec_from_file_location(
            "served_lesson_queue2", os.path.join(_ROOT, "scripts", "served-lesson-queue.py"))
        cls.rd = importlib.util.module_from_spec(s)
        s.loader.exec_module(cls.rd)

    def said(self, writers, state="waiting on a writer"):
        now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")  # noqa: UP017
        r = {"seen": True, "at": now, "total": 7, "waiting": [],
             "builder": {"service": "active", "building": 0,
                         "read": {"code_sha": True, "building": True, "status": True},
                         "status": {"at": now, "state": state}}}
        if writers is not None:
            r["builder"]["writers"] = writers
        return "\n".join(self.rd.judge(r, "ok")[3])

    def test_a_configured_but_failing_writer_is_named_as_ONE_LOGIN(self):
        out = self.said([{"kind": "cli-local", "ok": False, "configured": True},
                         {"kind": "api", "ok": False, "configured": False}])
        self.assertIn("CONFIGURED AND FAILING: cli-local", out)
        self.assertIn("one login on the box, not a setup", out)
        self.assertIn("Also never configured (optional, not the fix): api", out)

    def test_nothing_configured_reads_as_a_SETUP_not_a_login(self):
        out = self.said([{"kind": "cli-local", "ok": False, "configured": False},
                         {"kind": "api", "ok": False, "configured": False}])
        self.assertIn("NO writer is configured", out)
        self.assertIn("this is a setup and not a lapsed login", out)
        self.assertNotIn("CONFIGURED AND FAILING", out)

    def test_an_ABSENT_writers_list_says_UNKNOWN_and_guesses_nothing(self):
        out = self.said(None)
        self.assertIn("WHICH writer is unknown", out)
        for wrong in ("CONFIGURED AND FAILING", "NO writer is configured"):
            self.assertNotIn(wrong, out)

    def test_it_says_nothing_about_writers_when_the_state_is_not_about_one(self):
        out = self.said([{"kind": "cli-local", "ok": True, "configured": True}], state="ready")
        self.assertIn("Readiness is NOT the cause", out)
        for wrong in ("CONFIGURED AND FAILING", "WHICH writer is unknown",
                      "NO writer is configured"):
            self.assertNotIn(wrong, out)

    def test_a_push_credential_state_still_names_the_writers(self):
        # Both not-ready states benefit: a reader fixing the credential should
        # still see whether a writer is also missing.
        out = self.said([{"kind": "cli-local", "ok": False, "configured": True}],
                        state="waiting on a push credential")
        self.assertIn("a push credential", out)
        self.assertIn("CONFIGURED AND FAILING: cli-local", out)


class WhichFailureSiteRefusedTheBuild(unittest.TestCase):
    """0334. MEASURED on run 44242079320: `Failed because -- other: 6,
    transient: 1`, the oldest of the six waiting 5 d 16 h. `other` says only
    "not one of the two classes that retry themselves" -- so a reader learns a
    person is wanted and never what for, though a missing writer, a refused
    draft, a red test and a missing push token are four different jobs."""

    def failed(self, reason, **kw):
        row = {"source": "research-inbox", "created_at": "2026-11-12T12:00:00Z",
               "tags": ["lesson", "build-failed"] + (["build-reason:" + reason] if reason else [])}
        row.update(kw)
        return row

    def test_each_site_of_the_builder_is_named_by_its_own_class(self):
        for reason, want in (
            ("no writer reachable: cli-local (not signed in)", "no-writer"),
            ("no version passed every gate (1 written): cli-local exit 1", "gates"),
            ("the gates failed on the committed object: verse", "gates"),
            ("local tests failed: 1 failed", "tests"),
            ("no GitHub token at /volume1/PoeTech/secrets/gh to push with", "no-push-token"),
            ("bible-study-session.js has no BIBLE_STUDY_SESSION_LESSONS list to add to", "catalog"),
            ("budget: the build passed its wall-clock budget of 2700 s and was ended", "budget"),
            ("the build process crashed (exit 137): Killed", "crashed"),
        ):
            self.assertEqual(qc.stall_of(self.failed(reason)), want, reason)

    def test_the_two_self_healing_classes_are_unchanged_and_still_come_first(self):
        self.assertEqual(qc.stall_of(self.failed("rate-limited: HTTP 429")), "rate-limited")
        self.assertEqual(
            qc.stall_of(self.failed("transient: Failed to refresh OAuth token")), "transient")

    def test_an_UNKNOWN_site_is_still_other_and_is_never_guessed_at(self):
        # SUPERSEDED IN PART, 2026-11-23, and the supersession is the point.
        # 0334 published a deliberate limit here: a row whose reason opens with
        # an exception class name rather than a fixed literal read `other`,
        # "narrower than the builder, never wider". That limit was written
        # BEFORE 0335 gave this file an identity-safe way to read the class
        # (exception_of returns EXCEPTION_NAMES' own string), so it is now
        # obsolete rather than violated: `CalledProcessError: ...` IS
        # lesson_builder.py:1029's unhandled-crash shape, and `crashed` is the
        # true site, not a guess.
        self.assertEqual(
            qc.stall_of(self.failed("CalledProcessError: git returned 128")), "crashed")
        # What has NOT changed: a reason that names no site and no exception,
        # and a row with no reason at all, are still `other`.
        self.assertEqual(qc.stall_of(self.failed("something nobody has seen before")), "other")
        self.assertEqual(qc.stall_of(self.failed("")), "other")

    def test_PROVEN_TO_CATCH_a_class_published_from_the_ROWS_OWN_string(self):
        # The whole safety of a prefix match is that what rides is THIS file's
        # constant. A reason whose opening matches a site and whose tail quotes
        # a person must publish the class and nothing of the tail.
        rows = [self.failed("no writer reachable: SECRET WORDS from Mary Smith")]
        c = qc.census_of(rows)
        self.assertEqual(c["by_stall"], {"no-writer": 1})
        blob = json.dumps(c)
        for leak in ("SECRET WORDS", "Mary", "Smith", "build-reason", "reachable"):
            self.assertNotIn(leak, blob)

    def test_PROVEN_TO_CATCH_a_shape_in_place_of_identity(self):
        # A shape such as ^[a-z- ]+$ is satisfied by a sentence about a person.
        # Identity against FAILURE_SITES is not, so a hostile opening that only
        # LOOKS like a class word must not become one.
        for hostile in ("no words from mary smith", "gates-for-mary-smith",
                        "no-writer: mary smith", "crashed, says mary smith"):
            self.assertEqual(qc.stall_of(self.failed(hostile)), "other", hostile)

    def test_every_class_sums_to_the_build_failed_shape(self):
        rows = [self.failed("no writer reachable: x"),
                self.failed("local tests failed: y"),
                self.failed("rate-limited: HTTP 429"),
                self.failed(None)]
        c = qc.census_of(rows)
        self.assertEqual(c["by_stall"],
                         {"no-writer": 1, "tests": 1, "rate-limited": 1, "other": 1})
        self.assertEqual(sum(c["by_stall"].values()), c["by_shape"]["build-failed"])

    def test_NO_DRIFT_every_literal_is_prose_the_builder_actually_writes(self):
        # The one way a prefix match rots: the builder re-words a message and
        # the class silently becomes `other` again. Each literal is matched
        # against the builder's and the gates' own source, case-insensitively.
        src = ""
        for p in ("lesson_builder.py", "lesson_gates.py"):
            with open(os.path.join(_ROOT, "infra", "nas-lesson-builder", p),
                      "r", encoding="utf-8") as fh:
                src += fh.read().lower()
        for opening, cls in qc.FAILURE_SITES:
            # assertTrue, not assertIn: assertIn prints the whole CONTAINER on
            # failure, which here is two source files -- 165 KB of noise around
            # the one word that matters.
            self.assertTrue(opening in src,
                            f"no builder message opens with {opening!r}, so the class "
                            f"{cls!r} can never be assigned; was the message re-worded?")

    def test_the_SQL_allowlist_publishes_exactly_these_classes(self):
        import glob

        def read(path):
            with open(path, "r", encoding="utf-8") as fh:
                return fh.read()

        auto = os.path.join(_ROOT, "infra", "supabase", "migrations-auto")
        # The definition IN FORCE is the newest file that replaces the function,
        # found rather than named: this test must not have to be edited every
        # time the receipt is replaced again.
        newest = max(p for p in glob.glob(os.path.join(auto, "*.sql"))
                     if "lesson_queue_receipt" in read(p))
        sql = read(newest)
        m = re.search(r"k_stalls\s+text\[\]\s*:=\s*ARRAY\[(.*?)\];", sql, re.DOTALL)
        self.assertTrue(m, "the newest receipt migration declares no k_stalls")
        published = sorted(re.findall(r"'([a-z-]+)'", m.group(1)))
        self.assertEqual(
            published,
            sorted(set(qc.STALLS) | set(qc.SITE_CLASSES) | {"other"}),
            f"the census and {os.path.basename(newest)} disagree about the failure "
            "classes; a class the SQL does not list is dropped on the public road "
            "and reads as nothing at all",
        )


class TheClassIsTheCauseThisReceiptAlreadyRead(unittest.TestCase):
    """MEASURED on the live queue 2026-11-23, run 45266493452: `Failed because
    -- other: 6, rate-limited: 1, transient: 1`, the oldest waiting 11 d 8 h --
    while the SAME receipt published `gates refused: quotation` and `because:
    span-without-reference` for five of those six rows, one line below. So the
    summary sent a reader to the builder's log on the box for a cause the
    receipt had already read, stored and printed. A surface may not contradict
    itself (DR-0239), and `other` must mean unread, not un-looked-at."""

    def failed(self, reason, **kw):
        row = {"source": "research-inbox", "created_at": "2026-11-12T12:00:00Z",
               "tags": ["lesson", "build-failed"] + (["build-reason:" + reason] if reason else [])}
        row.update(kw)
        return row

    def test_a_stored_gate_refusal_is_the_site_when_the_prose_names_none(self):
        row = self.failed("a reason this file has never seen")
        self.assertEqual(qc.stall_of(row), "other")
        self.assertEqual(qc.stall_of(row, {"gates": ["quotation"]}), "gates")

    def test_a_stored_exception_outranks_stored_gates_as_the_LATER_word(self):
        # The live shape of 825019ca: gates refused quotation on one attempt and
        # the build crashed on another. exception_of reads the row's CURRENT
        # reason, so the crash is the later word.
        row = self.failed("RuntimeError: the writer went away")
        self.assertEqual(qc.stall_of(row, {"gates": ["quotation"]}), "crashed")

    def test_without_the_builders_records_the_answer_stays_other(self):
        # DR-0076 section 8: absent is not "no gate failed". A caller that could
        # not read the records gets the prose answer, never a filled-in one.
        row = self.failed("a reason this file has never seen")
        for absent in (None, {}, {"gates": []}, "not a dict", 7):
            self.assertEqual(qc.stall_of(row, absent), "other", repr(absent))

    def test_PROVEN_TO_CATCH_by_stall_disagreeing_with_the_rows_own_stall(self):
        # THE DEFECT ITSELF. by_stall read the prose and the row's `stall` was
        # asked for separately, so the summary could say `other` about a row
        # whose own entry named a cause. They must be one answer.
        rows = [self.failed("a reason this file has never seen", id="r1")]
        c = qc.census_of(rows, gates={"r1": {"gates": ["quotation"], "kinds": ["span-without-reference"]}})
        self.assertEqual(c["by_stall"], {"gates": 1})
        self.assertEqual(c["waiting"][0]["stall"], "gates")
        self.assertEqual(c["waiting"][0]["gates"], ["quotation"])
        self.assertNotIn("other", c["by_stall"])

    def test_the_live_eight_are_each_named_and_none_reads_other(self):
        # The 2026-11-23 queue, by the shapes that receipt published. Three
        # crashed, three refused by gates, two heal themselves -- and `other`,
        # which stood at 6 for eleven days, is gone.
        rows, gates = [], {}
        for rid, reason, found in (
            ("a", "transient: the CLI refreshed its sign-in", {"gates": ["quotation"]}),
            ("b", "RuntimeError: x", {}),
            ("c", "RuntimeError: x", {}),
            ("d", "RuntimeError: x", {"gates": ["quotation"]}),
            ("e", "unmatched prose", {"gates": ["verse"]}),
            ("f", "unmatched prose", {"gates": ["quotation", "verse", "voice"]}),
            ("g", "unmatched prose", {"gates": ["quotation", "verse"]}),
            ("h", "rate-limited: HTTP 429", {}),
        ):
            rows.append(self.failed(reason, id=rid))
            gates[rid] = found
        c = qc.census_of(rows, gates=gates)
        self.assertEqual(c["by_stall"],
                         {"crashed": 3, "gates": 3, "rate-limited": 1, "transient": 1})
        self.assertEqual(sum(c["by_stall"].values()), c["by_shape"]["build-failed"])

    def test_PROVEN_TO_CATCH_the_fallback_reaching_why_of(self):
        # why_of asks only whether the class HEALS ITSELF. The fallback can only
        # answer crashed/gates/other, so it must never turn a `failed` row into
        # a `rate-limited` one -- which would tell a reader the builder will
        # retry a row it has already given up on.
        # The row is built the way the builder really leaves one: an owner's
        # created_by (or why_of answers `waits-for-governor` first) AND a
        # build:failed@ stamp (or attempts is 0 and it answers `ready` first).
        # Both short-circuit ahead of the branch under test.
        for reason, found in (("unmatched prose", {"gates": ["quotation"]}),
                              ("RuntimeError: x", {"gates": ["verse"]})):
            row = self.failed(reason, id="r", created_by=qc.OWNER_IDS[0])
            row["tags"].append("build:failed@2026-11-12T12:00:00Z")
            self.assertEqual(qc.why_of(row), "failed", reason)
            self.assertEqual(qc.attempts_of(row), 1, reason)
            self.assertNotIn(qc.stall_of(row, found), qc.SELF_HEALING)

    def test_PROVEN_TO_CATCH_a_leak_through_the_fallback(self):
        # The fallback must publish this file's own words and nothing of the
        # row's prose or the gate record's contents beyond gate NAMES.
        rows = [self.failed("SECRET WORDS from Mary Smith", id="r1")]
        c = qc.census_of(rows, gates={"r1": {"gates": ["quotation"]}})
        self.assertEqual(c["by_stall"], {"gates": 1})
        blob = json.dumps(c)
        for leak in ("SECRET WORDS", "Mary", "Smith", "build-reason"):
            self.assertNotIn(leak, blob)

    def test_the_fallback_publishes_only_classes_the_public_road_allows(self):
        allowed = set(qc.STALLS) | set(qc.SITE_CLASSES) | {"other"}
        for found in (None, {}, {"gates": ["quotation"]}):
            for reason in ("unmatched prose", "RuntimeError: x", ""):
                self.assertIn(qc.stall_of(self.failed(reason), found), allowed)


class TheReaderNamesTheJobEachClassAsksFor(unittest.TestCase):
    """A class name alone still does not send anybody anywhere (0334). The
    class is printed WITH the job it names, in fix order rather than
    alphabetically: a writer that answered nothing comes first, because every
    later class presupposes a draft that got written."""

    @classmethod
    def setUpClass(cls):
        s = importlib.util.spec_from_file_location(
            "served_lesson_queue3", os.path.join(_ROOT, "scripts", "served-lesson-queue.py"))
        cls.rd = importlib.util.module_from_spec(s)
        s.loader.exec_module(cls.rd)

    def said(self, by_stall):
        now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")  # noqa: UP017
        r = {"seen": True, "at": now, "total": sum(by_stall.values()), "waiting": [],
             "by_shape": {"build-failed": sum(by_stall.values())}, "by_stall": by_stall}
        return "\n".join(self.rd.judge(r, "ok")[3])

    def test_the_job_is_printed_beside_the_class(self):
        out = self.said({"no-writer": 6, "transient": 1})
        self.assertIn("6 x no-writer", out)
        self.assertIn("one sign-in or one setup", out)
        self.assertIn("1 x transient", out)
        self.assertIn("nothing for a person", out)

    def test_the_writer_class_is_named_BEFORE_the_classes_that_presuppose_a_draft(self):
        out = self.said({"gates": 1, "no-writer": 1, "tests": 1})
        self.assertLess(out.index("x no-writer"), out.index("x gates"))
        self.assertLess(out.index("x gates"), out.index("x tests"))

    def test_a_class_that_is_not_present_says_nothing(self):
        out = self.said({"no-writer": 1})
        for absent in ("x gates", "x tests", "x budget", "x other"):
            self.assertNotIn(absent, out)

    def test_every_class_the_census_can_assign_has_a_job(self):
        have = {cls for cls, _ in self.rd.SITE_JOBS}
        want = set(qc.STALLS) | set(qc.SITE_CLASSES) | {"other"}
        self.assertEqual(want - have, set(),
                         "a class the census can publish has no job printed, so a "
                         "reader would see the word and not what to do")

    def test_PROVEN_TO_CATCH_a_count_of_zero_printed_as_a_job(self):
        out = self.said({"no-writer": 0, "gates": 2})
        self.assertNotIn("0 x no-writer", out)
        self.assertIn("2 x gates", out)


class TheBoxNamesTheCauseItself(unittest.TestCase):
    """0335. 0334 said WHICH SITE refused and answered `other: 6` for six rows
    over six consecutive reads, the oldest waiting 6 d. DR-1537 built the direct
    read and left it on Darrell's ssh; his answer that afternoon was that a step
    waiting on his hand IS the defect. So the box writes the cause on the
    receipt it already publishes: gate NAMES from its own stored records, and
    the exception CLASS NAME of an unhandled crash. Vocabulary, never prose."""

    def failed(self, reason, rid="r1"):
        return {"id": rid, "source": "research-inbox", "created_at": "2026-11-12T12:17:12Z",
                "tags": ["lesson", "build-failed", "build-reason:" + reason]}

    def store(self, recs):
        d = tempfile.mkdtemp()
        os.makedirs(os.path.join(d, "versions"))
        for i, r in enumerate(recs):
            with open(os.path.join(d, "versions", f"b-{i}.json"), "w", encoding="utf-8") as fh:
                json.dump(r, fh)
        return d

    # -- the exception name ------------------------------------------------
    def test_an_unhandled_crash_is_named_by_its_exception_class(self):
        for name in ("CalledProcessError", "ValueError", "TimeoutExpired", "OSError"):
            row = self.failed(f"{name}: something went wrong in a draft")
            self.assertEqual(qc.exception_of(row), name, name)

    def test_the_allowlist_is_the_INTERPRETERS_own_and_not_a_list_this_file_keeps(self):
        # Every BaseException subclass builtins names must be in it, so it
        # cannot drift from Python itself.
        import builtins
        for n in dir(builtins):
            obj = getattr(builtins, n, None)
            if isinstance(obj, type) and issubclass(obj, BaseException):
                self.assertIn(n, qc.EXCEPTION_NAMES, n)

    def test_PROVEN_TO_CATCH_a_name_that_is_not_an_exception_class(self):
        # The whole safety of this field: a shape such as ^[A-Za-z_]\w*$ is
        # satisfied by a person's name. Identity against the interpreter is not.
        for hostile in ("Mary", "MarySmith", "Smith", "mary_smith", "Darrell",
                        "no", "the"):
            self.assertIsNone(qc.exception_of(self.failed(f"{hostile}: a teaching")), hostile)

    def test_a_KNOWN_SITE_reason_yields_no_exception_name(self):
        # Builder prose opens with spaces before its colon; nothing to name.
        self.assertIsNone(qc.exception_of(self.failed("no writer reachable: cli-local")))
        self.assertIsNone(qc.exception_of(self.failed("local tests failed: 1 failed")))

    def test_the_published_name_is_the_ALLOWLISTS_OWN_string(self):
        row = self.failed("ValueError: x")
        got = qc.exception_of(row)
        self.assertIs(got, qc.EXCEPTION_NAMES["ValueError"],
                      "the row's own bytes must never be what rides")

    # -- the gate names ---------------------------------------------------
    def test_the_gates_that_did_not_pass_are_read_from_the_boxs_own_records(self):
        d = self.store([[{"teaching_row_id": "r1", "gate_results": {
            "verse": {"passed": False, "faults": [{"quoted": "MARKER_DRAFT"}]},
            "quotation": {"passed": True, "problems": ["41 of 120"]},
            "depth": {"passed": True}}}]])
        got = qc.stored_gates(d)
        self.assertEqual(sorted(got["r1"]["gates"]), ["quotation", "verse"])

    def test_a_gate_that_PASSED_with_no_faults_is_not_named(self):
        d = self.store([[{"teaching_row_id": "r1", "gate_results": {
            "verse": {"passed": True}, "depth": {"passed": True}}}]])
        self.assertEqual(qc.stored_gates(d), {})

    def test_PROVEN_TO_CATCH_a_faults_text_or_a_body_reaching_the_census(self):
        d = self.store([[{"teaching_row_id": "r1",
                          "body": {"title": "MARKER_DRAFT"},
                          "prompt_text": "MARKER_PROMPT the teaching",
                          "gate_results": {"verse": {"passed": False,
                                                     "faults": [{"quoted": "MARKER_FAULT"}]}}}]])
        c = qc.census_of([self.failed("ValueError: MARKER_MESSAGE")],
                         gates=qc.stored_gates(d))
        blob = json.dumps(c)
        for leak in ("MARKER_DRAFT", "MARKER_PROMPT", "MARKER_FAULT",
                     "MARKER_MESSAGE", "build-reason"):
            self.assertNotIn(leak, blob, leak)
        self.assertEqual(c["waiting"][0]["gates"], ["verse"])
        self.assertEqual(c["waiting"][0]["exception"], "ValueError")

    def test_an_UNKNOWN_gate_name_is_dropped_rather_than_relayed(self):
        d = self.store([[{"teaching_row_id": "r1", "gate_results": {
            "a_gate_named_for_mary_smith": {"passed": False}}}]])
        self.assertEqual(qc.stored_gates(d), {})

    def test_an_unreadable_or_missing_store_is_EMPTY_and_never_no_failures(self):
        self.assertEqual(qc.stored_gates(os.path.join(tempfile.mkdtemp(), "nowhere")), {})
        d = tempfile.mkdtemp()
        os.makedirs(os.path.join(d, "versions"))
        with open(os.path.join(d, "versions", "bad.json"), "w", encoding="utf-8") as fh:
            fh.write("{not json")
        self.assertEqual(qc.stored_gates(d), {})

    def test_a_row_the_caller_did_not_look_up_carries_NO_cause_key(self):
        # Absent is unread, never "no gate failed" (DR-0076 section 8).
        c = qc.census_of([self.failed("no writer reachable: x")])
        self.assertNotIn("gates", c["waiting"][0])
        self.assertNotIn("exception", c["waiting"][0])

    def test_the_cause_rides_only_on_a_BUILD_FAILED_row(self):
        plain = {"id": "r1", "source": "research-inbox",
                 "created_at": "2026-11-12T12:17:12Z", "tags": ["lesson"]}
        c = qc.census_of([plain], gates={"r1": ["verse"]})
        self.assertNotIn("gates", c["waiting"][0])

    def test_the_SQL_refuses_the_same_two_vocabularies_independently(self):
        import glob

        def read(path):
            with open(path, "r", encoding="utf-8") as fh:
                return fh.read()

        auto = os.path.join(_ROOT, "infra", "supabase", "migrations-auto")
        newest = max(p for p in glob.glob(os.path.join(auto, "*.sql"))
                     if "lesson_queue_receipt" in read(p))
        sql = read(newest)
        for decl, want, label in (
            ("k_gates", set(qc.GATE_NAMES), "gate name"),
            ("k_excs", set(qc.EXCEPTION_NAMES), "exception name"),
        ):
            m = re.search(decl + r"\s+text\[\]\s*:=\s*ARRAY\[(.*?)\];", sql, re.DOTALL)
            self.assertTrue(m, f"{decl} is not declared in {os.path.basename(newest)}")
            have = set(re.findall(r"'([A-Za-z_][A-Za-z0-9_]*)'", m.group(1)))
            missing = want - have
            self.assertEqual(
                missing, set(),
                f"{label}(s) the census can publish and {os.path.basename(newest)} "
                f"would drop on the public road: {sorted(missing)}")


class TheReaderPrintsTheCause(unittest.TestCase):
    """0335. The field is only worth publishing if the reader turns it into the
    sentence a person acts on -- and says plainly when nothing was stored."""

    @classmethod
    def setUpClass(cls):
        s = importlib.util.spec_from_file_location(
            "served_lesson_queue4", os.path.join(_ROOT, "scripts", "served-lesson-queue.py"))
        cls.rd = importlib.util.module_from_spec(s)
        s.loader.exec_module(cls.rd)

    def said(self, **row):
        now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")  # noqa: UP017 -- the NAS runs Python 3.8
        r = {"seen": True, "at": now, "total": 1,
             "waiting": [dict({"id": "29d2c703-6692-44aa-88d2-c347bea1ae3c",
                               "created_at": "2026-11-12T12:17:12Z",
                               "source": "research-inbox", "shape": "build-failed",
                               "stall": "other", "why": "failed", "attempts": 2}, **row)]}
        return "\n".join(self.rd.judge(r, "ok")[3])

    def test_the_gates_that_refused_are_printed(self):
        out = self.said(gates=["verse", "quotation"])
        self.assertIn("gates refused: verse+quotation", out)

    def test_a_crash_is_printed_by_its_exception_class(self):
        self.assertIn("crashed: CalledProcessError", self.said(exception="CalledProcessError"))

    def test_NOTHING_STORED_is_said_plainly_rather_than_read_as_a_clean_build(self):
        out = self.said()
        self.assertIn("cause not stored", out)

    def test_a_row_with_a_cause_does_not_also_say_nothing_was_stored(self):
        self.assertNotIn("cause not stored", self.said(gates=["verse"]))
        self.assertNotIn("cause not stored", self.said(exception="ValueError"))

    def test_a_row_that_did_not_FAIL_is_never_asked_for_a_cause(self):
        out = self.said(shape="plain", stall=None, why="ready")
        self.assertNotIn("cause not stored", out)


class WhichProblemNotOnlyWhichGate(unittest.TestCase):
    """0336. 0335's first live read named the gate -- `quotation` on four of
    seven waiting teachings -- and still did not decide the fix, because that
    gate refuses five different things that call for opposite work."""

    def store(self, gate_results, rid="r1"):
        d = tempfile.mkdtemp()
        os.makedirs(os.path.join(d, "versions"))
        with open(os.path.join(d, "versions", "b-1.json"), "w", encoding="utf-8") as fh:
            json.dump([{"teaching_row_id": rid, "gate_results": gate_results}], fh)
        return d

    def kinds(self, gate_results, rid="r1"):
        return qc.stored_gates(self.store(gate_results, rid)).get(rid, {}).get("kinds", [])

    def test_each_of_the_quotation_gates_five_refusals_has_its_own_kind(self):
        for problem, want in (
            ("adult: 7 quoted spans, 4 with a reference", "span-without-reference"),
            ("teen: an ellipsis inside a quotation", "ellipsis"),
            ("child: curly double quotation marks (straight quotes only)", "curly-quotes"),
            ("adult: recites a record id at the reader", "record-id"),
            ("senior: states a percentage", "percentage"),
        ):
            self.assertEqual(
                self.kinds({"quotation": {"passed": False, "problems": [problem]}}),
                [want], problem)

    def test_the_voice_gates_three_refusals_each_have_their_own_kind(self):
        for problem, want in (
            ('adult: the generic "God" in our own voice (say Yahweh)', "generic-God-not-Yahweh"),
            ("adult: capitalises Satan", "capitalises-the-adversary"),
            ("senior: writes yahweh in lower case", "lowercases-His-Name"),
        ):
            self.assertEqual(
                self.kinds({"voice": {"passed": False, "problems": [problem]}}),
                [want], problem)

    def test_the_verse_gates_own_vocabulary_rides_by_identity(self):
        for kind in qc.VERSE_FAULT_KINDS:
            self.assertEqual(
                self.kinds({"verse": {"passed": False,
                                      "faults": [{"kind": kind, "ref": "John 1:1"}]}}),
                [kind], kind)

    def test_PROVEN_TO_CATCH_a_NAME_inside_a_problem_string_reaching_the_receipt(self):
        # lesson_gates.py:279 and :282 interpolate a name into their problem
        # strings. The kind must ride and the name must not -- which is the
        # whole reason the prose is matched rather than published.
        d = self.store({"voice": {"passed": False, "problems": [
            "adult: capitalises Satan", "senior: writes yahweh in lower case"]},
            "quotation": {"passed": False, "problems": ["adult: 7 quoted spans, 4 with a reference"]}})
        c = qc.census_of([{"id": "r1", "source": "research-inbox",
                           "created_at": "2026-11-12T12:17:12Z",
                           "tags": ["lesson", "build-failed"]}],
                         gates=qc.stored_gates(d))
        blob = json.dumps(c)
        self.assertIn("capitalises-the-adversary", blob)
        self.assertIn("lowercases-His-Name", blob)
        for leak in ("Satan", "satan", "yahweh", "quoted spans", "lower case", "adult:"):
            self.assertNotIn(leak, blob, leak)

    def test_an_unrecognised_problem_string_yields_NO_kind_rather_than_a_guess(self):
        self.assertEqual(
            self.kinds({"depth": {"passed": False, "problems": [
                "adult: something nobody has written a kind for yet"]}}),
            [])

    def test_a_row_with_no_record_carries_no_kinds_key_at_all(self):
        c = qc.census_of([{"id": "r1", "source": "research-inbox",
                           "created_at": "2026-11-12T12:17:12Z",
                           "tags": ["lesson", "build-failed"]}])
        self.assertNotIn("kinds", c["waiting"][0])

    def test_the_SQL_publishes_every_kind_the_census_can_assign(self):
        import glob

        def read(path):
            with open(path, "r", encoding="utf-8") as fh:
                return fh.read()

        auto = os.path.join(_ROOT, "infra", "supabase", "migrations-auto")
        newest = max(p for p in glob.glob(os.path.join(auto, "*.sql"))
                     if "lesson_queue_receipt" in read(p))
        m = re.search(r"k_faults\s+text\[\]\s*:=\s*ARRAY\[(.*?)\];", read(newest), re.DOTALL)
        self.assertTrue(m, f"k_faults is not declared in {os.path.basename(newest)}")
        have = set(re.findall(r"'([A-Za-z-]+)'", m.group(1)))
        self.assertEqual(
            set(qc.PROBLEM_CLASSES) - have, set(),
            f"a kind the census can publish and {os.path.basename(newest)} would drop")


class TheProblemKindsDoNotDriftFromTheGates(unittest.TestCase):
    """The gap 0336 shipped with (found 2026-11-18, same day): FAILURE_SITES has
    a drift case and PROBLEM_KINDS did not, so re-wording a gate's message would
    silently stop classifying it and the receipt would read the gate name with
    no kind -- back to where 0335 left it, without anything going red."""

    def gate_source(self):
        """The gates' source, lowercased, with backslash escapes removed.

        The escaping matters and this test found it on its first run: the voice
        gate writes `"{}: the generic \\"God\\" in our own voice (say Yahweh)"`,
        so the SOURCE contains `\\"god\\"` while the string the gate actually
        produces at runtime contains `"god"` -- which is what PROBLEM_KINDS
        matches, correctly. Comparing against the raw source would fail a
        matcher that works, so the escapes come out first.
        """
        with open(os.path.join(_ROOT, "infra", "nas-lesson-builder",
                               "lesson_gates.py"), encoding="utf-8") as fh:
            return fh.read().lower().replace("\\", "")

    def test_every_opening_is_prose_a_gate_actually_writes(self):
        src = self.gate_source()
        for opening, kind in qc.PROBLEM_KINDS:
            self.assertTrue(opening in src,
                            f"no gate message contains {opening!r}, so the kind "
                            f"{kind!r} can never be assigned; was it re-worded?")

    def test_every_verse_fault_kind_is_one_the_verse_gate_emits(self):
        src = self.gate_source()
        for kind in qc.VERSE_FAULT_KINDS:
            self.assertTrue(f'"kind": "{kind}"' in src,
                            f"the verse gate does not emit {kind!r}")

    def test_PROVEN_TO_CATCH_a_reworded_gate_message(self):
        src = self.gate_source()
        self.assertNotIn("the number of quoted spans does not match", src,
                         "this is the re-wording the case above would catch")

    def test_the_SPAN_TEXT_the_gate_now_names_never_reaches_the_receipt(self):
        # The quotation gate names the unreferenced spans so the next attempt
        # can fix them (DR-1552). That text is the DRAFT. The census matches the
        # line and publishes its own kind; the span must not ride.
        d = tempfile.mkdtemp()
        os.makedirs(os.path.join(d, "versions"))
        with open(os.path.join(d, "versions", "b-1.json"), "w", encoding="utf-8") as fh:
            json.dump([{"teaching_row_id": "r1", "gate_results": {"quotation": {
                "passed": False,
                "problems": [('levels.child: 3 quoted spans, 1 with a reference '
                              '-- no reference after: "MARKER_SPAN"; "MARKER_TWO"')]}}}], fh)
        c = qc.census_of([{"id": "r1", "source": "research-inbox",
                           "created_at": "2026-11-12T12:17:12Z",
                           "tags": ["lesson", "build-failed"]}],
                         gates=qc.stored_gates(d))
        blob = json.dumps(c)
        self.assertIn("span-without-reference", blob)
        for leak in ("MARKER_SPAN", "MARKER_TWO", "no reference after", "levels.child"):
            self.assertNotIn(leak, blob, leak)
