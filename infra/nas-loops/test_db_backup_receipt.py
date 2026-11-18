"""db-backup-receipt: the receipt carries whitelisted facts only (DR-1360 / DR-1113)."""

import importlib.util
import json
import os
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location(
    "dbr", os.path.join(HERE, "db-backup-receipt.py")
)
dbr = importlib.util.module_from_spec(spec)
spec.loader.exec_module(dbr)

GOOD = {
    "ok": True,
    "at": "2026-11-17T08:00:00Z",
    "file": "poetech-2026-11-17.dump",
    "bytes": 123,
    "toc_entries": 45,
    "kept": 14,
    "drill": "passed: auth.users 7 of 7, public tables 210 of 210",
    "error": "",
}


class Receipt(unittest.TestCase):
    def test_a_good_night_reads_ok_with_the_drill_counts(self):
        r = dbr.receipt_of(GOOD, drill_mtime=1763280000)
        self.assertEqual(r["ok"], True)
        self.assertEqual(
            r["drill"],
            {
                "verdict": "passed",
                "users": 7,
                "users_live": 7,
                "tables": 210,
                "tables_live": 210,
            },
        )
        self.assertEqual((r["bytes"], r["toc_entries"], r["kept"]), (123, 45, 14))
        self.assertTrue(r["at"].startswith("2026-11-17T08:00:00"))
        self.assertIn("last_drill_at", r)

    def test_never_a_file_name_a_path_or_the_error_words(self):
        bad = dict(
            GOOD,
            ok=False,
            error="pg_dump: could not connect to 192.168.1.26 as supabase_admin",
            host="poetech",
        )
        text = json.dumps(dbr.receipt_of(bad))
        for leak in ("dump", "192.168", "supabase_admin", "poetech", "file"):
            self.assertNotIn(leak, text)
        self.assertIs(dbr.receipt_of(bad)["error"], True)

    def test_a_failed_or_odd_drill_never_reads_passed(self):
        f = dbr.receipt_of(
            dict(GOOD, drill="FAILED: auth.users ? of 7, public tables 12 of 210")
        )
        self.assertEqual(f["drill"]["verdict"], "failed")
        self.assertIsNone(f["drill"]["users"])
        self.assertEqual(
            dbr.receipt_of(dict(GOOD, drill="skipped"))["drill"], {"verdict": "skipped"}
        )
        self.assertEqual(
            dbr.receipt_of(dict(GOOD, drill="passed, trust me (Jane Doe)"))["drill"],
            {"verdict": "unknown"},
        )

    def test_an_unreadable_status_is_said_so_never_ok(self):
        self.assertEqual(dbr.receipt_of(None), {"seen": True, "readable": False})
        self.assertNotIn("ok", dbr.receipt_of({"ok": "yes"}))

    def test_it_runs_on_the_nas_python_3_8(self):
        # The DSM runs Python 3.8. `ruff --fix` (UP017) rewrites timezone.utc to
        # datetime.UTC, which 3.8 cannot import: the rider would die every cycle.
        with open(os.path.join(HERE, "db-backup-receipt.py"), encoding="utf-8") as f:
            src = f.read()
        self.assertNotRegex(src, r"from datetime import[^\n]*\bUTC\b")
        self.assertNotIn("datetime.UTC", src)
        # fromisoformat reads a trailing Z only from 3.11; db_backup.sh writes one.
        self.assertTrue(
            dbr.receipt_of({"at": "2026-11-17T08:00:00Z"})["at"].startswith(
                "2026-11-17T08:00:00"
            )
        )

    def test_a_missing_status_file_is_a_quiet_no_op(self):
        os.environ["BACKUP_STATUS"] = "/nonexistent/status.json"
        try:
            self.assertEqual(dbr.main(), 0)
        finally:
            del os.environ["BACKUP_STATUS"]


if __name__ == "__main__":
    unittest.main()
