# Proven-to-catch for tax_auth.bearer_ok and for every route using it (DR-1086).
import os
import re
import unittest

from tax_auth import bearer_ok

HERE = os.path.dirname(os.path.abspath(__file__))


class BearerOk(unittest.TestCase):
    def test_the_right_bearer_passes(self):
        self.assertTrue(bearer_ok("Bearer s3cret", "s3cret"))

    def test_no_configured_token_lets_nobody_in(self):
        # The old upload check skipped itself when no token was set.
        self.assertFalse(bearer_ok("Bearer anything", ""))
        self.assertFalse(bearer_ok("", ""))
        # The empty bearer must not match the empty token: the case that would
        # have opened the archive to anyone on a box with no token set.
        self.assertFalse(bearer_ok("Bearer ", ""))

    def test_wrong_missing_or_malformed_headers_are_refused(self):
        for header in [None, "", "s3cret", "Bearer", "Bearer ", "bearer s3cret", "Bearer s3cret ", "Basic s3cret"]:
            self.assertFalse(bearer_ok(header, "s3cret"), header)


class EveryRouteAsks(unittest.TestCase):
    def test_each_route_handler_checks_the_bearer_first(self):
        src = open(os.path.join(HERE, "tax_upload_server.py"), encoding="utf-8").read()
        handlers = re.findall(r"@app\.(?:get|post)\(\"[^\"]+\"\)\n(?:@app\.(?:get|post)\(\"[^\"]+\"\)\n)*(?:async )?def (\w+)\(", src)
        self.assertEqual(sorted(set(handlers)), ["archive", "health", "served_file", "upload"])
        for name in [h for h in handlers if h != "health"]:
            body = src.split(f"def {name}(", 1)[1].split("\n@app.", 1)[0]
            self.assertIn("_refuse_without_bearer(request)", body, name)
        self.assertNotIn("if TOKEN:", src)

    def test_the_open_health_route_says_nothing_about_the_family(self):
        src = open(os.path.join(HERE, "tax_upload_server.py"), encoding="utf-8").read()
        body = src.split("def health(", 1)[1].split("\ndef ", 1)[0]
        for leak in ["tax_ingest.SRC", "tax_ingest.SITE", "documents", "filename"]:
            self.assertNotIn(leak, body.split('"""')[-1], leak)


if __name__ == "__main__":
    unittest.main()
