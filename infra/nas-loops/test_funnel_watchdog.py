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
        self.assertIn("head", p)
        json.dumps(p)

    def test_uptime_reads_proc_and_never_raises(self):
        with tempfile.NamedTemporaryFile("w", delete=False) as f:
            f.write("4321.98 9999.00\n")
        try:
            self.assertEqual(fw.uptime_seconds(f.name), 4321)
        finally:
            os.unlink(f.name)
        self.assertEqual(fw.uptime_seconds("/nonexistent/uptime"), -1)

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


class ReportsFirstAndBoundsTheHeal(unittest.TestCase):
    def _run_main(self, bstate, hang_s=0):
        """Drive main() with every outside call replaced; returns the event order."""
        events = []
        saved = {
            k: getattr(fw, k)
            for k in (
                "probe",
                "tailscale_bin",
                "run",
                "send_report",
                "save_state",
                "load_state",
                "time",
            )
        }

        class T:
            t = 2_000_000_000.0

            @classmethod
            def time(cls):
                return cls.t

            @classmethod
            def sleep(cls, n):
                cls.t += n

        def run(cmd, timeout=30):
            if "status" in cmd and "--json" in cmd:
                return 0, json.dumps({"BackendState": bstate})
            if "--set-path" in cmd:
                events.append("mount")
                T.t += hang_s
                return 1, "hung"
            if cmd[-1] == "up" or any(str(c).startswith("--authkey") for c in cmd):
                events.append("up")
            return 0, ""

        fw.probe = lambda url: 502
        fw.tailscale_bin = lambda: "ts"
        fw.run = run
        fw.send_report = lambda payload, **k: (
            events.append("report:" + payload["actions"][0][:5]),
            (True, 204),
        )[1]
        fw.save_state = lambda *a, **k: None
        fw.load_state = lambda *a, **k: {"last_restart": 2_000_000_000.0 - 60}
        fw.time = T
        try:
            rc = fw.main()
        finally:
            for k, v in saved.items():
                setattr(fw, k, v)
        return rc, events

    def test_the_first_report_leaves_before_any_heal(self):
        rc, events = self._run_main("Running")
        self.assertEqual(rc, 1)
        self.assertEqual(events[0], "report:first")
        self.assertLess(events.index("report:first"), events.index("mount"))

    def test_a_logged_out_node_is_reported_and_no_mount_is_tried(self):
        _, events = self._run_main("NeedsLogin")
        self.assertEqual(events[0], "report:first")
        self.assertNotIn("mount", events)
        self.assertTrue(events[-1].startswith("report:"))

    def test_a_hung_cli_cannot_outlive_the_budget(self):
        _, events = self._run_main("Running", hang_s=10)
        # 12 rows at 10 s each would be 120 s; the 90 s budget stops the pass.
        self.assertLess(events.count("mount"), len(fw.SOVEREIGN_MOUNTS))

    def test_PROVEN_TO_CATCH_the_old_order_reported_last(self):
        old_order = ["up", "mount", "mount", "report"]
        self.assertGreater(old_order.index("report"), old_order.index("mount"))


class TheBoxCountsItsOwnDays(unittest.TestCase):
    NOW = 1795478400.0  # 2026-11-24T00:00:00Z

    def test_days_until_the_key_lapses(self):
        j = json.dumps({"Self": {"KeyExpiry": "2026-12-04T00:00:00Z"}})
        self.assertEqual(fw.expiry_days_of(j, self.NOW), 10)
        j = json.dumps({"Self": {"KeyExpiry": "2026-12-04T00:00:00.123456789Z"}})
        self.assertEqual(fw.expiry_days_of(j, self.NOW), 10)

    def test_a_lapsed_key_is_negative(self):
        j = json.dumps({"Self": {"KeyExpiry": "2026-11-23T21:40:00Z"}})
        self.assertLess(fw.expiry_days_of(j, self.NOW), 0)

    def test_no_expiry_set_or_unreadable_is_none(self):
        self.assertIsNone(fw.expiry_days_of(json.dumps({"Self": {}}), self.NOW))
        self.assertIsNone(fw.expiry_days_of("not json", self.NOW))

    def test_one_warning_a_day_inside_the_window_only(self):
        self.assertTrue(fw.expiry_warning_due({}, self.NOW, 10))
        self.assertFalse(
            fw.expiry_warning_due(
                {"last_expiry_warning": self.NOW - 3600}, self.NOW, 10
            )
        )
        self.assertTrue(
            fw.expiry_warning_due(
                {"last_expiry_warning": self.NOW - 90000}, self.NOW, 10
            )
        )
        self.assertFalse(fw.expiry_warning_due({}, self.NOW, fw.EXPIRY_WARN_DAYS + 1))
        self.assertFalse(fw.expiry_warning_due({}, self.NOW, None))


class ReadsArisRoadAndNeverHealsIt(unittest.TestCase):
    """DR-1645: /llm is read and reported; nothing is mounted or restarted."""

    T0 = 1764000000.0  # a real clock reading: the spacing is measured against it

    SS = (
        "State  Recv-Q Send-Q Local Address:Port Peer Address:Port\n"
        "LISTEN 0 128 127.0.0.1:8791 0.0.0.0:*\n"
        "LISTEN 0 128 0.0.0.0:22 0.0.0.0:*\n"
        "LISTEN 0 128 127.0.0.1:8772 0.0.0.0:*\n"
        "LISTEN 0 128 *:11434 *:*\n"
        "LISTEN 0 128 127.0.0.1:5432 0.0.0.0:*\n"
    )

    def setUp(self):
        self.ran = []

    def run_fn(self, cmd, timeout=30):
        self.ran.append(cmd)
        return (0, self.SS) if cmd[0] == "ss" else (0, "")

    def test_listening_ports_keeps_the_house_range_and_ollama_only(self):
        self.assertEqual(fw.listening_ports(self.run_fn), [8772, 8791, 11434])

    def test_netstat_is_asked_when_ss_says_nothing(self):
        def run_fn(cmd, timeout=30):
            return (
                (0, "tcp 0 0 127.0.0.1:8804 0.0.0.0:* LISTEN\n")
                if cmd[0] == "netstat"
                else (1, "")
            )

        self.assertEqual(fw.listening_ports(run_fn), [8804])

    def test_the_readout_asks_only_ports_that_listen_and_keeps_both_answers(self):
        asked = []

        def probe_fn(url, timeout=None):
            asked.append((url, timeout))
            return 200 if url == "http://127.0.0.1:8772/llm/health" else 404

        r = fw.llm_readout(502, probe_fn, self.run_fn)
        self.assertEqual(r["public"], 502)
        self.assertEqual(r["listening"], [8772, 8791, 11434])
        self.assertEqual(
            r["answers"], {"8772": [200, 404], "8791": [404, 404], "11434": [404, 404]}
        )
        self.assertTrue(all(t == fw.LLM_LOOPBACK_TIMEOUT for _, t in asked))
        self.assertTrue(all(u.startswith("http://127.0.0.1:") for u, _ in asked))

    def test_the_budget_caps_the_ports_asked(self):
        many = "".join(
            "LISTEN 0 128 127.0.0.1:%d 0.0.0.0:*\n" % p for p in range(8700, 8740)
        )
        r = fw.llm_readout(502, lambda u, t=None: 0, lambda c, timeout=30: (0, many))
        self.assertEqual(len(r["answers"]), fw.LLM_PORT_CAP)

    def test_dark_reports_then_holds_its_spacing_then_says_healed_once(self):
        s = {}
        self.assertEqual(fw.llm_report_due(s, self.T0, 502), "llm-dark")
        s["llm_last_report"] = self.T0
        self.assertIsNone(
            fw.llm_report_due(s, self.T0 + fw.LLM_REPORT_SPACING - 1, 502)
        )
        self.assertEqual(
            fw.llm_report_due(s, self.T0 + fw.LLM_REPORT_SPACING, 0), "llm-dark"
        )
        s["llm_dark_since"] = self.T0
        self.assertEqual(fw.llm_report_due(s, self.T0 + 9, 200), "llm-healed")
        self.assertIsNone(
            fw.llm_report_due({}, self.T0, 200)
        )  # up and never dark: silence

    def test_the_step_sends_one_readout_and_touches_nothing(self):
        sent = []

        def probe_fn(url, timeout=None):
            return (
                502
                if url == fw.LLM_PUBLIC
                else (200 if ":8772/llm/health" in url else 0)
            )

        def send_fn(payload):
            sent.append(payload)
            return True, "sent"

        state = {}
        word = fw.llm_step(
            state,
            self.T0,
            probe_fn,
            self.run_fn,
            send_fn,
            lambda: "/sb proxy http://127.0.0.1:8800",
        )
        self.assertEqual(word, "llm-dark")
        self.assertEqual(len(sent), 1)
        self.assertEqual(sent[0]["result"], "llm-dark")
        self.assertEqual(sent[0]["public"], {fw.LLM_PUBLIC: 502})
        self.assertIn('"8772": [200, 0]', sent[0]["actions"][0])
        self.assertEqual(state["llm_last_report"], self.T0)
        self.assertEqual(state["llm_dark_since"], self.T0)
        # PROVEN-TO-CATCH (read-only): only ss or netstat was run; no funnel --set-path, no synopkg.
        self.assertTrue(all(c[0] in ("ss", "netstat") for c in self.ran), self.ran)
        # a second pass inside the spacing says nothing
        self.assertIsNone(
            fw.llm_step(
                state, self.T0 + 600, probe_fn, self.run_fn, send_fn, lambda: ""
            )
        )
        self.assertEqual(len(sent), 1)

    def test_a_report_that_was_not_sent_is_tried_again_next_pass(self):
        state = {}
        fw.llm_step(
            state,
            self.T0,
            lambda u, t=None: 502,
            self.run_fn,
            lambda p: (False, "no token"),
            lambda: "",
        )
        self.assertNotIn("llm_last_report", state)

    def test_healed_is_said_once_and_the_dark_mark_is_cleared(self):
        sent = []
        state = {"llm_dark_since": self.T0, "llm_last_report": self.T0}
        word = fw.llm_step(
            state,
            self.T0 + 9,
            lambda u, t=None: 200,
            self.run_fn,
            lambda p: (sent.append(p) or True, "sent"),
            lambda: "",
        )
        self.assertEqual(word, "llm-healed")
        self.assertNotIn("llm_dark_since", state)
        self.assertIsNone(
            fw.llm_step(
                state,
                self.T0 + 10,
                lambda u, t=None: 200,
                self.run_fn,
                lambda p: (True, "x"),
                lambda: "",
            )
        )
        self.assertEqual(len(sent), 1)

    def test_llm_is_still_not_a_row_this_watchdog_mounts(self):
        self.assertNotIn("/llm", [path for path, _ in fw.SOVEREIGN_MOUNTS])


class AsksAsTheAppDoes(unittest.TestCase):
    """DR-1647: Cloudflare answers "Python-urllib" with its own 403, and a 403
    reads as up. The probe must never carry urllib's default name."""

    def _ask(self):
        seen = {}

        class Resp:
            status = 200

            def __enter__(self):
                return self

            def __exit__(self, *a):
                return False

        def opener(req, timeout=None):
            seen["ua"] = req.get_header("User-agent")
            seen["timeout"] = timeout
            return Resp()

        code = fw.probe("https://poetech.us/llm/health", 3, opener=opener)
        return code, seen

    def test_the_probe_names_itself_as_a_browser(self):
        code, seen = self._ask()
        self.assertEqual(code, 200)
        self.assertTrue(seen["ua"].startswith("Mozilla/5.0"))
        self.assertNotIn("Python-urllib", seen["ua"])
        self.assertEqual(seen["timeout"], 3)

    def test_urllibs_own_name_is_the_one_cloudflare_refuses(self):
        import urllib.request

        default = dict(urllib.request.build_opener().addheaders)["User-agent"]
        self.assertIn("Python-urllib", default)
        self.assertNotEqual(fw.PROBE_UA, default)


if __name__ == "__main__":
    unittest.main()
