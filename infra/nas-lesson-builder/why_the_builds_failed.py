#!/usr/bin/env python3
"""why_the_builds_failed.py -- what the builder's own records say, on the box.

MEASURED 2026-11-18 07:09 (run 44256161123), with 0334 live and the census
written by main's own code: `Failed because -- other: 6, transient: 1`, the
oldest of the six waiting 5 d 18 h. 0334 names seven failure SITES by matching
lesson_builder's own authored openings, and six rows match NONE of them -- so
the reader says, correctly, "the builder's log on the box is the next read".

THIS IS THAT READ, and it is deliberately NOT another public receipt. DR-1526
recorded the mistake of building a receipt to infer what a direct read states
outright; the roads in order (DR-1159) are a runner over the tailnet, then
Darrell's own ssh, then his hand. The tailnet key has been dead since
2026-11-04, so road 2 is the road -- and this gives road 2 one short,
quote-safe command instead of a hand-written one-liner:

    ssh dpoe@192.168.1.26 "python3 /volume1/PoeTech/repos/Kingdom-PWA-Node/infra/nas-lesson-builder/why_the_builds_failed.py"

NEVER A BODY, AND NEVER A PROMPT. Each record in versions/<build_id>.json
holds `body` (the drafted lesson) and `prompt_text` (which quotes the
teaching). Those are a person's words. This prints only:

  * build_id, the teaching row id, the writer and the elapsed time
  * `error`, the writer's own failure string, to a stated cut
  * the NAMES of the gates that did not pass, and the COUNT of faults each

A fault's text is not printed: the verse gate's faults quote both the draft and
the verse. The names and counts are what say which gate refused, which is the
question. Run with --faults when the names are not enough and you are reading
your own box on purpose; the help says plainly that it then prints draft text.

It reads only the local data directory. No key, no network, no database.
Python 3.8 (what the NAS runs).
"""

import argparse
import json
import os
import sys

DATA = os.environ.get("LESSON_BUILDER_DATA", "/volume1/PoeTech/lesson-builder")
ERROR_CUT = 400
GATE_KEYS = (
    "verse",
    "quotation",
    "voice",
    "depth",
    "structure",
    "band",
    "bands",
    "curriculum",
    "placement",
    "shape",
)


def records(path):
    """Every record in a versions file, or [] -- an unreadable file is said and
    never silently counted as 'no failures' (DR-0076 section 8)."""
    try:
        with open(path, "r", encoding="utf-8") as fh:
            got = json.load(fh)
    except Exception as e:  # noqa: BLE001 -- a bad file is reported, not fatal
        print(f"  ! {os.path.basename(path)}: unreadable ({type(e).__name__})")
        return []
    return got if isinstance(got, list) else []


def failed_gates(gates):
    """(names, counts) of the gates that did not pass. Never a fault's text."""
    out = []
    if not isinstance(gates, dict):
        return out
    for k in GATE_KEYS:
        g = gates.get(k)
        if not isinstance(g, dict):
            continue
        ok = g.get("passed")
        faults = g.get("faults") if isinstance(g.get("faults"), list) else []
        probs = g.get("problems") if isinstance(g.get("problems"), list) else []
        n = len(faults) + len(probs)
        if ok is False or n:
            out.append("{}{}".format(k, f"({n})" if n else ""))
    # The two top-level verdicts, which are not per-gate dicts.
    for k in ("verse_passed", "passed"):
        if gates.get(k) is False:
            out.append("!" + k)
    return out


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--data", default=DATA, help="the builder's data directory")
    ap.add_argument(
        "--newest", type=int, default=12, help="how many build files to read"
    )
    ap.add_argument(
        "--faults",
        action="store_true",
        help="ALSO print each fault's own text. It quotes the DRAFT and "
        "the verse -- a person's words. Your own box, on purpose, only.",
    )
    a = ap.parse_args(argv)

    d = os.path.join(a.data, "versions")
    if not os.path.isdir(d):
        print(
            f"no versions directory at {d} -- nothing stored, which is not 'no failures'"
        )
        return 1
    files = sorted(
        (os.path.join(d, f) for f in os.listdir(d) if f.endswith(".json")),
        key=lambda p: os.path.getmtime(p),
        reverse=True,
    )[: a.newest]
    if not files:
        print(f"no build records in {d} -- nothing stored, which is not 'no failures'")
        return 1

    print(
        f"the builder's own records, newest first ({len(files)} of {len(os.listdir(d))} file(s)); never a body"
    )
    for p in files:
        print(f"\n{os.path.basename(p)}")
        for r in records(p):
            if not isinstance(r, dict):
                continue
            err = (r.get("error") or "").strip().replace("\n", " ")
            cut = f" ...[cut at {ERROR_CUT}]" if len(err) > ERROR_CUT else ""
            gates = failed_gates(r.get("gate_results"))
            print(
                "  row {} | writer {} | {} ms".format(
                    r.get("teaching_row_id"), r.get("writer"), r.get("elapsed_ms")
                )
            )
            print("    error: {}{}".format(err[:ERROR_CUT] or "(none)", cut))
            print(
                "    gates not passed: {}".format(", ".join(gates) or "(none recorded)")
            )
            if a.faults:
                g = (
                    r.get("gate_results")
                    if isinstance(r.get("gate_results"), dict)
                    else {}
                )
                for k in GATE_KEYS:
                    sub = g.get(k)
                    if not isinstance(sub, dict):
                        continue
                    for f in (sub.get("faults") or [])[:6]:
                        print(f"      {k}: {json.dumps(f)[:300]}")
                    for f in (sub.get("problems") or [])[:6]:
                        print(f"      {k}: {str(f)[:300]}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
