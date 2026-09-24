"""Proofs for publish_family_key.py (DR-0613). Stdlib unittest; no network."""
import os
import tempfile
import unittest

import publish_family_key as p


class Publish(unittest.TestCase):
    def test_publishes_the_key_to_the_named_owners(self):
        calls = []
        out = p.publish(token="k1", owners=["a@x"], secrets=("https://s", "svc"),
                        rpc=lambda u, k, t, o: calls.append((u, k, t, o)) or 1)
        self.assertEqual(out, {"ok": True, "wrote": 1, "reason": "published"})
        self.assertEqual(calls, [("https://s", "svc", "k1", ["a@x"])])

    def test_steady_state_writes_nothing_and_says_so(self):
        out = p.publish(token="k1", owners=["a@x"], secrets=("https://s", "svc"), rpc=lambda *a: 0)
        self.assertEqual(out["reason"], "already current")

    def test_missing_pieces_are_named_quiet_no_ops(self):
        rpc = lambda *a: self.fail("must not call without every piece")
        self.assertIn("no key", p.publish(token="", owners=["a@x"], secrets=("u", "k"), rpc=rpc)["reason"])
        self.assertIn("no family owners", p.publish(token="k", owners=[], secrets=("u", "k"), rpc=rpc)["reason"])
        self.assertIn("credential", p.publish(token="k", owners=["a@x"], secrets=("", ""), rpc=rpc)["reason"])

    def test_a_failed_call_never_raises(self):
        def boom(*a):
            raise OSError("network down")
        out = p.publish(token="k", owners=["a@x"], secrets=("u", "k"), rpc=boom)
        self.assertFalse(out["ok"])
        self.assertIn("network down", out["reason"])

    def test_owner_list_reads_emails_and_ignores_comments(self):
        d = tempfile.mkdtemp()
        f = os.path.join(d, "o.txt")
        with open(f, "w", encoding="utf-8") as h:
            h.write("# note\n\nA@X.com\n  b@y.com \n")
        self.assertEqual(p.read_owners(f), ["a@x.com", "b@y.com"])
        self.assertEqual(p.read_owners(os.path.join(d, "missing")), [])

    def test_the_committed_owner_list_names_only_family_accounts(self):
        owners = p.read_owners()
        self.assertIn("darrellpoe06@gmail.com", owners)
        self.assertTrue(all("@" in o for o in owners))
        self.assertLessEqual(len(owners), 8)

    def test_the_key_is_never_printed(self):
        src = open(p.__file__, encoding="utf-8").read()
        self.assertNotIn("print(token", src)
        self.assertNotIn("print(t)", src)


if __name__ == "__main__":
    unittest.main()
