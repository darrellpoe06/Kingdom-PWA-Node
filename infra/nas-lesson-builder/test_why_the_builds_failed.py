"""why_the_builds_failed.py: it says which gate refused, and never a body.

0334 named seven failure SITES on the keyless road and six waiting rows matched
none of them, so the reader says the builder's log on the box is the next read.
This diagnostic IS that read, and the one thing it must never do is print the
teaching: each stored record carries `body` (the drafted lesson) and
`prompt_text` (which quotes the row's own words).
"""

import io
import json
import os
import tempfile
import unittest
from contextlib import redirect_stdout

import why_the_builds_failed as w

# Every field that must never be printed, with a distinctive marker.
RECORD = {
    "build_id": "b-1",
    "teaching_row_id": "29d2c703-6692-44aa-88d2-c347bea1ae3c",
    "writer": "cli-local",
    "elapsed_ms": 41234,
    "prompt_text": "MARKER_PROMPT the row's own spoken words",
    "body": {"title": "MARKER_DRAFT a lesson nobody should see", "slug": "x"},
    "usage": {"in": 1, "out": 2},
    "error": "cli-local exit 1: Failed to refresh OAuth token",
    "gate_results": {
        "verse_passed": False,
        "passed": False,
        "verse": {
            "passed": False,
            "faults": [
                {"ref": "John 1:1", "kind": "not-the-verse", "quoted": "MARKER_FAULT"}
            ],
        },
        "quotation": {"passed": False, "problems": ["only 41 of 120 quoted spans"]},
        "depth": {"passed": True},
    },
}


def run(data, *argv):
    buf = io.StringIO()
    with redirect_stdout(buf):
        code = w.main(["--data", data] + list(argv))
    return code, buf.getvalue()


class WhyTheBuildsFailed(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        os.makedirs(os.path.join(self.tmp, "versions"))

    def write(self, name, payload):
        p = os.path.join(self.tmp, "versions", name)
        with open(p, "w", encoding="utf-8") as fh:
            fh.write(payload if isinstance(payload, str) else json.dumps(payload))
        return p

    def test_it_names_the_row_the_writer_and_the_gates_that_did_not_pass(self):
        self.write("b-1.json", [RECORD])
        code, out = run(self.tmp)
        self.assertEqual(code, 0)
        self.assertIn("29d2c703-6692-44aa-88d2-c347bea1ae3c", out)
        self.assertIn("cli-local", out)
        self.assertIn("Failed to refresh OAuth token", out)
        # The gate NAMES with their fault COUNTS, and both top-level verdicts.
        self.assertIn("verse(1)", out)
        self.assertIn("quotation(1)", out)
        self.assertIn("!verse_passed", out)
        self.assertIn("!passed", out)

    def test_PROVEN_TO_CATCH_a_body_a_prompt_or_a_faults_text_printed(self):
        self.write("b-1.json", [RECORD])
        _, out = run(self.tmp)
        for marker in (
            "MARKER_PROMPT",
            "MARKER_DRAFT",
            "MARKER_FAULT",
            "prompt_text",
            "nobody should see",
        ):
            self.assertNotIn(
                marker, out, "the diagnostic printed something it must never print"
            )

    def test_a_gate_that_PASSED_is_not_listed_as_a_cause(self):
        self.write("b-1.json", [RECORD])
        _, out = run(self.tmp)
        self.assertNotIn("depth", out)

    def test_the_error_is_cut_at_a_STATED_length_rather_than_silently(self):
        rec = dict(RECORD, error="x" * (w.ERROR_CUT + 50))
        self.write("b-1.json", [rec])
        _, out = run(self.tmp)
        self.assertIn(f"...[cut at {w.ERROR_CUT}]", out)
        self.assertNotIn("x" * (w.ERROR_CUT + 1), out)

    def test_no_error_and_no_gates_reads_as_NONE_RECORDED_never_as_passing(self):
        self.write("b-1.json", [{"teaching_row_id": "r", "writer": "api"}])
        _, out = run(self.tmp)
        self.assertIn("error: (none)", out)
        self.assertIn("gates not passed: (none recorded)", out)

    def test_an_UNREADABLE_file_is_said_and_never_counted_as_no_failures(self):
        self.write("b-2.json", "{not json")
        code, out = run(self.tmp)
        self.assertEqual(code, 0)
        self.assertIn("unreadable", out)
        self.assertIn("b-2.json", out)

    def test_an_EMPTY_store_is_an_unread_box_and_exits_nonzero(self):
        code, out = run(self.tmp)
        self.assertEqual(code, 1, "an empty store must not read as success")
        self.assertIn("which is not 'no failures'", out)

    def test_a_MISSING_store_is_an_unread_box_and_exits_nonzero(self):
        code, out = run(os.path.join(self.tmp, "nowhere"))
        self.assertEqual(code, 1)
        self.assertIn("which is not 'no failures'", out)

    def test_faults_are_printed_only_when_ASKED_for_explicitly(self):
        # The flag exists for a person reading their own box on purpose, and
        # its help says plainly that it prints draft text. Without it, never.
        self.write("b-1.json", [RECORD])
        _, plain = run(self.tmp)
        self.assertNotIn("MARKER_FAULT", plain)
        _, asked = run(self.tmp, "--faults")
        self.assertIn("MARKER_FAULT", asked)

    def test_the_newest_builds_come_first_and_the_count_is_capped(self):
        import time

        for i in range(4):
            self.write(f"b-{i}.json", [dict(RECORD, teaching_row_id=f"row-{i}")])
            time.sleep(0.01)
        _, out = run(self.tmp, "--newest", "2")
        self.assertIn("row-3", out)
        self.assertIn("row-2", out)
        self.assertNotIn("row-0", out)
        self.assertIn("2 of 4 file(s)", out)


if __name__ == "__main__":
    unittest.main()
