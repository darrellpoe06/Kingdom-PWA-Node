#!/usr/bin/env python3
# Proven-to-catch tests for heartbeat.py (DR-1360). Pure parts only: the stamp
# the app parses, the services count read from disk, and the one-row rule
# (PATCH when a row exists, INSERT only when none). No network: rest() is
# replaced by a recorder. Run from this dir: python3 -m unittest test_heartbeat
import importlib.util
import json
import os
import tempfile
import unittest
from datetime import datetime, timezone

_HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location(
    "heartbeat", os.path.join(_HERE, "heartbeat.py")
)
hb = importlib.util.module_from_spec(spec)
spec.loader.exec_module(hb)


class StampTest(unittest.TestCase):
    def test_the_body_carries_the_four_fields_the_app_reads_with_a_utc_z_stamp(self):
        now = datetime(2026, 11, 6, 15, 0, 0, tzinfo=timezone.utc)  # noqa: UP017 -- the NAS runs Python 3.8
        body = json.loads(hb.body_of(now=now, host="poetech", services=29))
        self.assertEqual(
            body,
            {
                "at": "2026-11-06T15:00:00Z",
                "host": "poetech",
                "services": 29,
                "cycle": "services-sync",
            },
        )

    def test_services_count_reads_the_registry_and_says_minus_one_when_unreadable(self):
        with tempfile.TemporaryDirectory() as d:
            p = os.path.join(d, "services.json")
            with open(p, "w", encoding="utf-8") as fh:
                json.dump(
                    [
                        {"name": "a", "enabled": True},
                        {"name": "b", "enabled": False},
                        {"name": "c", "enabled": True},
                    ],
                    fh,
                )
            self.assertEqual(hb.services_enabled(p), 2)
            self.assertEqual(hb.services_enabled(os.path.join(d, "missing.json")), -1)
        real = hb.services_enabled(os.path.join(_HERE, "services.json"))
        self.assertGreater(real, 20)


class OneRowTest(unittest.TestCase):
    def _recorder(self, existing_id):
        calls = []

        def fake_rest(url, key, method, path, body=None, extra_headers=None):
            calls.append((method, path, body))
            if method == "GET" and path.startswith("agent_inbox?"):
                return [{"id": existing_id}] if existing_id else []
            return None

        hb.rest = fake_rest
        return calls

    def test_PROVEN_TO_CATCH_a_second_cycle_patches_the_same_row_and_never_inserts_a_second(
        self,
    ):
        calls = self._recorder("row-1")
        what = hb.beat(
            "https://x", "k", "inst", hb.body_of(host="poetech", services=1), "uid"
        )
        self.assertEqual(what, "patched")
        methods = [c[0] for c in calls]
        self.assertEqual(methods, ["GET", "PATCH"])
        self.assertIn("agent_inbox?id=eq.row-1", calls[1][1])
        self.assertIn("created_at", calls[1][2])

    def test_the_first_cycle_inserts_one_tagged_row_as_the_owning_account(self):
        calls = self._recorder(None)
        what = hb.beat(
            "https://x", "k", "inst", hb.body_of(host="poetech", services=1), "uid-1"
        )
        self.assertEqual(what, "inserted")
        self.assertEqual([c[0] for c in calls], ["GET", "POST"])
        row = calls[1][2][0]
        self.assertEqual(row["tags"], ["nas-heartbeat"])
        self.assertEqual(row["source"], "nas-loops")
        self.assertEqual(row["created_by"], "uid-1")
        self.assertEqual(row["instance_id"], "inst")

    def test_the_read_filters_by_the_json_tag_the_table_needs(self):
        calls = self._recorder(None)
        hb.existing_row("https://x", "k", "inst")
        self.assertIn("tags=cs.%5B%22nas-heartbeat%22%5D", calls[0][1])
        self.assertIn("instance_id=eq.inst", calls[0][1])


class LedgerTest(unittest.TestCase):
    def test_the_ledger_in_its_own_home_says_what_the_cycle_did(self):
        with tempfile.TemporaryDirectory() as d:
            home = os.path.join(d, "nas-heartbeat")
            body = hb.body_of(host="poetech", services=29)
            self.assertTrue(hb.write_ledger(home, "patched", body))
            with open(os.path.join(home, "last-run.json"), encoding="utf-8") as fh:
                led = json.load(fh)
            self.assertEqual(led["what"], "patched")
            self.assertEqual(led["host"], "poetech")
            self.assertEqual(led["services"], 29)
            self.assertIsNone(led["error"])
            self.assertTrue(led["at"].endswith("Z"))
            # A quiet no-op is still a cycle that RAN: the witness tells it from silence.
            self.assertTrue(hb.write_ledger(home, "no-credential", error="OSError"))
            with open(os.path.join(home, "last-run.json"), encoding="utf-8") as fh:
                led = json.load(fh)
            self.assertEqual((led["what"], led["error"]), ("no-credential", "OSError"))
            self.assertTrue(led["at"].endswith("Z"))

    def test_PROVEN_TO_CATCH_an_unwritable_home_never_raises(self):
        self.assertFalse(hb.write_ledger("/proc/no-such-home/x", "patched"))


def _event(ts, event, summary):
    head = "loop=services-sync kind=deploy cap=200/day usedToday=4 timeout=600s decision=GO(armed)"
    return json.dumps(
        {
            "ts": ts,
            "node": "nas-loops",
            "agent": "nas-loops",
            "event": event,
            "armed": True,
            "detail": f"{head} -> exit=0 in 9000ms | {summary} calls_today=4",
        }
    )


class LastCycleTest(unittest.TestCase):
    """DR-1399: the heartbeat carries the previous cycle's failed / degraded NAMES."""

    NAMES = [
        "lesson-voice",
        "db-backup",
        "choir-dates",
        "sovereign-replay",
        "nas-heartbeat",
    ]

    def _run(self, lines, names=None):
        with tempfile.TemporaryDirectory() as d:
            p = os.path.join(d, "events.jsonl")
            with open(p, "w", encoding="utf-8") as fh:
                fh.write("\n".join(lines) + "\n")
            return hb.last_cycle(p, names or self.NAMES)

    def test_a_clean_cycle_names_nothing(self):
        got = self._run(
            [
                _event(
                    "2026-11-10T12:00:00Z",
                    "loop_run_done",
                    "services-sync: all services synced",
                )
            ]
        )
        self.assertEqual(
            got,
            {"at": "2026-11-10T12:00:00Z", "ok": True, "failed": [], "degraded": []},
        )

    def test_degraded_names_come_from_the_registry_never_from_the_free_text(self):
        summary = "services-sync: all services synced; DEGRADED: choir-dates (youtube: 429; lesson-voice said nothing | ok)"
        got = self._run([_event("2026-11-10T12:15:00Z", "loop_run_done", summary)])
        self.assertTrue(got["ok"])
        self.assertEqual(got["degraded"], ["choir-dates"])
        self.assertEqual(got["failed"], [])

    def test_failed_names_and_the_newest_cycle_wins(self):
        older = _event(
            "2026-11-10T11:45:00Z",
            "loop_run_done",
            "services-sync: all services synced",
        )
        newer = _event(
            "2026-11-10T12:00:00Z",
            "loop_run_fail",
            "services-sync: FAILED: db-backup (exit 1: pg_dump: error); sovereign-replay (timeout 480s)",
        )
        other = json.dumps(
            {
                "ts": "2026-11-10T12:05:00Z",
                "event": "loop_run_done",
                "detail": "loop=funnel-watchdog -> exit=0",
            }
        )
        got = self._run([older, newer, other, "not json"])
        self.assertEqual(got["at"], "2026-11-10T12:00:00Z")
        self.assertFalse(got["ok"])
        self.assertEqual(got["failed"], ["db-backup", "sovereign-replay"])

    def test_PROVEN_TO_CATCH_a_name_inside_another_name_or_a_reason_is_not_counted(
        self,
    ):
        # "lesson-voice" appears only INSIDE a reason, after "; " but followed by
        # a space and a word, not " (" / ";" / end: it must not be named.
        summary = "services-sync: FAILED: db-backup (exit 1: then lesson-voice said x)"
        got = self._run(
            [_event("2026-11-10T12:00:00Z", "loop_run_fail", summary)],
            names=self.NAMES + ["db"],
        )
        self.assertEqual(got["failed"], ["db-backup"])

    def test_no_log_and_no_cycle_say_none(self):
        self.assertIsNone(hb.last_cycle("/proc/no-such/events.jsonl", self.NAMES))
        self.assertIsNone(
            self._run(
                ["not json", json.dumps({"event": "loop_run_done", "detail": "loop=x"})]
            )
        )

    def test_the_body_carries_the_cycle_only_when_known(self):
        last = {
            "at": "2026-11-10T12:00:00Z",
            "ok": True,
            "failed": [],
            "degraded": ["choir-dates"],
        }
        self.assertEqual(
            json.loads(hb.body_of(host="h", services=3, last=last))["last_cycle"], last
        )
        self.assertNotIn("last_cycle", json.loads(hb.body_of(host="h", services=3)))
        real = hb.service_names(os.path.join(_HERE, "services.json"))
        self.assertIn("sovereign-replay", real)
        self.assertIn("nas-heartbeat", real)


if __name__ == "__main__":
    unittest.main()
