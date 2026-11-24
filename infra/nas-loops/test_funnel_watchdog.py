# Proven-to-catch tests for funnel_watchdog.py (DR-1619). Pure parts only, no
# network, no tailscale: run from this dir: python3 -m unittest test_funnel_watchdog
import importlib.util
import json
import os
import tempfile
import unittest

_HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location(
    "funnel_watchdog", os.path.join(_HERE, "loops", "funnel_watchdog.py")
)
fw = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fw)


class JudgesThePublicRoad(unittest.TestCase):
    def test_a_502_from_cloudflare_is_dark(self):
        # The 2026-11-24 reading: every runner got 502 from poetech.us/sb.
        self.assertFalse(fw.is_up(502))
        self.assertFalse(fw.public_up({"https://poetech.us/sb/auth/v1/health": 502}))

    def test_no_answer_is_dark(self):
        self.assertFalse(fw.is_up(0))

    def test_kongs_keyless_401_is_up(self):
        self.assertTrue(fw.is_up(401))
        self.assertTrue(fw.public_up({"a": 401, "b": 200}))

    def test_one_dark_probe_makes_the_road_dark(self):
        self.assertFalse(fw.public_up({"a": 200, "b": 503}))

    def test_no_probes_is_not_up(self):
        self.assertFalse(fw.public_up({}))

    def test_PROVEN_TO_CATCH_the_old_rule_called_a_502_up(self):
        def old_up(code):
            return bool(code)  # main(): `if code:` -> any HTTP answer, 502 included

        self.assertTrue(old_up(502))
        self.assertFalse(fw.is_up(502))

    def test_the_public_probe_is_the_family_road_not_the_boxs_own_name(self):
        self.assertTrue(
            all(u.startswith("https://poetech.us/") for u in fw.PUBLIC_PROBES)
        )
        self.assertNotIn(fw.FUNNEL_HOST, ",".join(fw.PUBLIC_PROBES))


class RestoresTheRecordedRows(unittest.TestCase):
    def test_every_row_in_RECORDED_STATE_except_the_n8n_root_is_restored(self):
        with open(
            os.path.join(_HERE, "..", "nas-transport", "RECORDED-STATE.md")
        ) as fh:
            rec = fh.read()
        recorded = set()
        for line in rec.splitlines():
            if line.startswith("| `/") and "127.0.0.1:" in line:
                path = line.split("`")[1]
                port = (
                    line.split("127.0.0.1:")[1]
                    .split("`")[0]
                    .split(")")[0]
                    .split(" ")[0]
                )
                if path != "/":
                    recorded.add((path, "http://127.0.0.1:" + port))
        self.assertTrue(("/sb", "http://127.0.0.1:8800") in recorded)
        self.assertTrue(
            recorded.issubset(set(fw.SOVEREIGN_MOUNTS)),
            sorted(recorded - set(fw.SOVEREIGN_MOUNTS)),
        )
        self.assertNotIn("/", [p for p, _ in fw.SOVEREIGN_MOUNTS])


class Brakes(unittest.TestCase):
    def test_one_package_restart_an_hour(self):
        self.assertTrue(fw.restart_allowed({}, 10000))
        self.assertFalse(fw.restart_allowed({"last_restart": 10000}, 10000 + 60))
        self.assertTrue(
            fw.restart_allowed({"last_restart": 10000}, 10000 + fw.RESTART_SPACING)
        )

    def test_a_dark_report_is_spaced_and_a_heal_always_reports(self):
        self.assertTrue(fw.report_due({}, 5000, "dark"))
        self.assertFalse(fw.report_due({"last_report": 5000}, 5000 + 60, "dark"))
        self.assertTrue(fw.report_due({"last_report": 5000}, 5000 + 60, "healed"))
        self.assertFalse(fw.report_due({}, 5000, "ok"))

    def test_state_survives_a_round_trip_and_a_bad_path_never_raises(self):
        with tempfile.TemporaryDirectory() as d:
            p = os.path.join(d, "s", "w.json")
            fw.save_state({"last_restart": 1}, p)
            self.assertEqual(fw.load_state(p), {"last_restart": 1})
        self.assertEqual(fw.load_state("/nonexistent/x.json"), {})


class BringUpAndReport(unittest.TestCase):
    def test_needs_login_without_a_key_file_says_so_and_runs_nothing(self):
        calls = []
        orig = fw.run
        fw.run = lambda cmd, timeout=30: (calls.append(cmd), (0, ""))[1]
        try:
            word = fw.bring_up("ts", "NeedsLogin", key_file="/nonexistent/key")
        finally:
            fw.run = orig
        self.assertIn("no key file", word)
        self.assertEqual(calls, [])

    def test_a_key_is_used_but_never_reported(self):
        calls = []
        orig = fw.run
        fw.run = lambda cmd, timeout=30: (calls.append(cmd), (0, ""))[1]
        try:
            with tempfile.NamedTemporaryFile("w", delete=False) as f:
                f.write("tskey-secret-value\n")
            word = fw.bring_up("ts", "NeedsLogin", key_file=f.name)
        finally:
            fw.run = orig
            os.unlink(f.name)
        self.assertEqual(calls, [["ts", "up", "--authkey=tskey-secret-value"]])
        self.assertNotIn("tskey", word)

    def test_the_report_carries_the_state_and_is_bounded(self):
        p = fw.report_payload(
            "dark", "NeedsLogin", {"u": 502}, 200, ["a"] * 20, "x" * 5000
        )
        self.assertEqual(p["result"], "dark")
        self.assertEqual(p["backend_state"], "NeedsLogin")
        self.assertEqual(p["public"], {"u": 502})
        self.assertEqual(len(p["actions"]), 12)
        self.assertEqual(len(p["funnel_status"]), 1500)
        self.assertIn("uptime_s", p)

    def test_uptime_reads_proc_and_never_raises(self):
        with tempfile.NamedTemporaryFile("w", delete=False) as f:
            f.write("4321.98 9999.00\n")
        try:
            self.assertEqual(fw.uptime_seconds(f.name), 4321)
        finally:
            os.unlink(f.name)
        self.assertEqual(fw.uptime_seconds("/nonexistent/uptime"), -1)
        json.dumps(p)

    def test_send_report_posts_one_dispatch_and_no_token_means_not_sent(self):
        seen = {}

        class R:
            status = 204

            def __enter__(self):
                return self

            def __exit__(self, *a):
                return False

        def opener(req, timeout=15):
            seen["url"] = req.full_url
            seen["body"] = json.loads(req.data)
            seen["auth"] = req.get_header("Authorization")
            return R()

        with tempfile.NamedTemporaryFile("w", delete=False) as f:
            f.write("ghp_x\n")
        try:
            ok, _ = fw.send_report(
                {"result": "dark"}, token_file=f.name, repo="o/r", opener=opener
            )
        finally:
            os.unlink(f.name)
        self.assertTrue(ok)
        self.assertEqual(seen["url"], "https://api.github.com/repos/o/r/dispatches")
        self.assertEqual(seen["body"]["event_type"], "nas-funnel-report")
        self.assertEqual(seen["auth"], "Bearer ghp_x")
        self.assertEqual(
            fw.send_report({}, token_file="/nonexistent/t"),
            (False, "no push credential"),
        )


if __name__ == "__main__":
    unittest.main()
