#!/usr/bin/env python3
# =============================================================================
# workflows-parse -- every workflow file is YAML GitHub can read (DR-1409)
# =============================================================================
# On 2026-11-10 one step in ci.yml was written as a one-line `run:` whose
# command held "SMOKE: PASS". A colon and a space inside a plain YAML value is
# a mapping, so the file no longer parsed. GitHub then runs NO job of that
# workflow: the run appears under the file's path with zero jobs, the required
# checks never report, and nothing looks red where anyone was watching. Every
# guard read the workflows as text, so none of them saw it, and CI did not run
# on four pushes.
#
# A check inside the broken file can never run, so this one lives outside it:
# in verify:gates, and in its own small workflow. It parses every file under
# .github/workflows and names the file, line and column of each failure.
#
#   python3 scripts/workflows-parse.py              exit 1 on any failure
#   python3 scripts/workflows-parse.py --selftest   proves it catches the break
# =============================================================================
import glob
import os
import sys

import yaml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BROKEN = "jobs:\n  a:\n    steps:\n      - run: psql -f x.sql | grep -q 'SMOKE: PASS'\n"
FIXED = "jobs:\n  a:\n    steps:\n      - run: |\n          psql -f x.sql | grep -q 'SMOKE: PASS'\n"


def problem(text):
    """None when the text is YAML a workflow can be read from, else why not."""
    try:
        doc = yaml.safe_load(text)
    except yaml.YAMLError as e:
        mark = getattr(e, "problem_mark", None)
        where = f"line {mark.line + 1}, column {mark.column + 1}: " if mark else ""
        return f"{where}{getattr(e, 'problem', None) or e}"
    if not isinstance(doc, dict) or "jobs" not in doc:
        return "parses, but is not a workflow (no jobs)"
    return None


def main(argv):
    if "--selftest" in argv:
        caught = problem(BROKEN)
        clean = problem(FIXED)
        ok = caught is not None and "mapping values" in caught and clean is None
        print(
            f"{'ok  ' if ok else 'FAIL'}  the one-line run holding 'SMOKE: PASS' is refused, the block form is not ({caught})"
        )
        return 0 if ok else 1
    files = sorted(glob.glob(os.path.join(ROOT, ".github", "workflows", "*.yml")))
    bad = 0
    for f in files:
        with open(f, encoding="utf-8") as fh:
            why = problem(fh.read())
        if why:
            bad += 1
            print(f"workflows-parse: {os.path.relpath(f, ROOT)}: {why}")
    if not files:
        print("workflows-parse: no workflow files found; that is not a pass")
        return 1
    if bad:
        print(
            f"workflows-parse: {bad} of {len(files)} workflow file(s) GitHub cannot read; none of their jobs would run"
        )
        return 1
    print(f"workflows-parse: OK, {len(files)} workflow file(s) parse")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
