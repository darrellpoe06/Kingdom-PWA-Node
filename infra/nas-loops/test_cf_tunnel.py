"""cf_tunnel.py — the second road's NAS half (DR-1653). Fake docker, no network."""

import json
import os
import stat
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "loops"))
import cf_tunnel as t


class FakeDocker:
    def __init__(self, state="absent", label=None, run_code=0):
        self.state, self.label, self.run_code = state, label, run_code
        self.calls = []

    def __call__(self, args, budget):
        self.calls.append(args)
        if args[0] == "inspect":
            if self.state == "absent":
                return 1, "No such object"
            return 0, ("true" if self.state == "running" else "false") + " " + (
                self.label or ""
            )
        if args[0] == "run":
            return self.run_code, "abc123" if self.run_code == 0 else "pull denied"
        return 0, ""


class CfTunnelTest(unittest.TestCase):
    def setUp(self):
        self.d = tempfile.mkdtemp()

    def ledger(self):
        with open(os.path.join(self.d, "ledger.jsonl")) as f:
            return [json.loads(x) for x in f]

    def test_no_token_is_a_quiet_off_switch(self):
        dk = FakeDocker()
        r = t.run_pass(token="", docker=dk, state_dir=self.d)
        self.assertEqual(r, "no-token")
        self.assertEqual(dk.calls, [])  # nothing touched docker
        self.assertEqual(self.ledger()[-1]["result"], "no-token")

    def test_starts_once_when_absent_and_never_puts_the_token_on_argv(self):
        dk = FakeDocker("absent")
        r = t.run_pass(
            token="SECRET-TOKEN",
            docker=dk,
            state_dir=self.d,
            is_ready=lambda: True,
            sleep=lambda s: None,
        )
        self.assertEqual(r, "started")
        run = next(c for c in dk.calls if c[0] == "run")
        self.assertNotIn("SECRET-TOKEN", " ".join(run))
        self.assertIn("--env-file", run)
        self.assertIn("--network", run)
        self.assertIn(t.IMAGE, run)
        self.assertNotIn(":latest", t.IMAGE)
        env = os.path.join(self.d, "tunnel.env")
        self.assertEqual(stat.S_IMODE(os.stat(env).st_mode), 0o600)
        with open(env) as f:
            self.assertEqual(f.read(), "TUNNEL_TOKEN=SECRET-TOKEN\n")

    def test_running_with_the_same_token_is_left_alone(self):
        dk = FakeDocker("running", t.token_hash("TOK"))
        r = t.run_pass(token="TOK", docker=dk, state_dir=self.d, is_ready=lambda: True)
        self.assertEqual(r, "running")
        self.assertFalse(any(c[0] in ("run", "rm") for c in dk.calls))

    def test_a_new_token_replaces_the_container(self):
        dk = FakeDocker("running", t.token_hash("OLD"))
        r = t.run_pass(
            token="NEW",
            docker=dk,
            state_dir=self.d,
            is_ready=lambda: True,
            sleep=lambda s: None,
        )
        self.assertEqual(r, "started")
        self.assertTrue(any(c[:2] == ["rm", "-f"] for c in dk.calls))

    def test_a_stopped_container_is_restarted(self):
        dk = FakeDocker("stopped", t.token_hash("TOK"))
        r = t.run_pass(
            token="TOK",
            docker=dk,
            state_dir=self.d,
            is_ready=lambda: True,
            sleep=lambda s: None,
        )
        self.assertEqual(r, "started")

    def test_a_failed_start_is_reported_not_raised(self):
        dk = FakeDocker("absent", run_code=125)
        r = t.run_pass(token="TOK", docker=dk, state_dir=self.d, is_ready=lambda: True)
        self.assertEqual(r, "start-failed")
        self.assertIn("pull denied", self.ledger()[-1]["detail"])

    def test_not_ready_is_said_and_the_wait_is_bounded(self):
        dk = FakeDocker("absent")
        slept = []
        r = t.run_pass(
            token="TOK",
            docker=dk,
            state_dir=self.d,
            is_ready=lambda: False,
            sleep=lambda s: slept.append(s),
            budget=t.Budget(240),
        )
        self.assertEqual(r, "started-not-ready")
        self.assertLessEqual(sum(slept), 30)

    def test_the_budget_stops_every_call(self):
        clock = [0.0]
        b = t.Budget(10, clock=lambda: clock[0])
        calls = []

        def run(args, **kw):
            calls.append(kw["timeout"])

            class P:
                returncode = 0
                stdout = ""
                stderr = ""

            return P()

        docker = t.make_docker(run=run, docker_bin="/usr/bin/docker")
        clock[0] = 9.0
        docker(["ps"], b)
        self.assertLessEqual(calls[-1], 1.0 + 1e-9)
        clock[0] = 11.0
        self.assertEqual(docker(["ps"], b), (124, "budget spent"))

    def test_docker_is_found_on_the_dsm_paths(self):
        self.assertEqual(
            t.find_docker(
                which=lambda n: None, exists=lambda p: p == "/usr/local/bin/docker"
            ),
            "/usr/local/bin/docker",
        )
        self.assertIsNone(t.find_docker(which=lambda n: None, exists=lambda p: False))


if __name__ == "__main__":
    unittest.main()
