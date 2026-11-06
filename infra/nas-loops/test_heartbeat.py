#!/usr/bin/env python3
# Proven-to-catch tests for heartbeat.py (DR-1354). Pure parts only: the stamp
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
spec = importlib.util.spec_from_file_location("heartbeat", os.path.join(_HERE, "heartbeat.py"))
hb = importlib.util.module_from_spec(spec)
spec.loader.exec_module(hb)


class StampTest(unittest.TestCase):
    def test_the_body_carries_the_four_fields_the_app_reads_with_a_utc_z_stamp(self):
        now = datetime(2026, 11, 6, 15, 0, 0, tzinfo=timezone.utc)
        body = json.loads(hb.body_of(now=now, host="poetech", services=29))
        self.assertEqual(body, {"at": "2026-11-06T15:00:00Z", "host": "poetech", "services": 29, "cycle": "services-sync"})

    def test_services_count_reads_the_registry_and_says_minus_one_when_unreadable(self):
        with tempfile.TemporaryDirectory() as d:
            p = os.path.join(d, "services.json")
            with open(p, "w", encoding="utf-8") as fh:
                json.dump([{"name": "a", "enabled": True}, {"name": "b", "enabled": False}, {"name": "c", "enabled": True}], fh)
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

    def test_PROVEN_TO_CATCH_a_second_cycle_patches_the_same_row_and_never_inserts_a_second(self):
        calls = self._recorder("row-1")
        what = hb.beat("https://x", "k", "inst", hb.body_of(host="poetech", services=1), "uid")
        self.assertEqual(what, "patched")
        methods = [c[0] for c in calls]
        self.assertEqual(methods, ["GET", "PATCH"])
        self.assertIn("agent_inbox?id=eq.row-1", calls[1][1])
        self.assertIn("created_at", calls[1][2])

    def test_the_first_cycle_inserts_one_tagged_row_as_the_owning_account(self):
        calls = self._recorder(None)
        what = hb.beat("https://x", "k", "inst", hb.body_of(host="poetech", services=1), "uid-1")
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


if __name__ == "__main__":
    unittest.main()
