#!/usr/bin/env python3
"""served-lesson-queue.py -- the house says which teachings wait (DR-1360 / DR-0725).

inbox-lessons-waiting.yml is the FIRST step of Darrell's hourly lesson intake.
It answers "what is waiting?" by joining the tailnet, ssh-ing into the NAS and
running psql there. That key expired on 2026-11-04 and again by 2026-11-10:
runs #500-#505 all died at the same step, six firings of the PRIORITY lane that
could not read a queue sitting on a machine that was up the whole time, with
nothing to do about it but wait for a value only Darrell can mint.

This is the second road, and it is not new: it is the one
served-heartbeat-receipt.py already walks (DR-1399), pointed at the lesson
queue. The NAS counts its own waiting rows every services-sync cycle
(infra/nas-loops/lesson-queue-census.py) and writes ONE row into agent_inbox;
migration 0320 turns that row outward as public.lesson_queue_receipt(), which
this script asks over the public road the app itself uses -- poetech.us/sb with
the anon key the site ships. No tailnet, no runner key, no GitHub between the
question and the answer.

IT NEVER TURNS AN UNREAD QUEUE INTO AN EMPTY ONE (DR-1186, DR-0076 section 8).
Every refusal is its own exit code and its own sentence, and `count` is the
string "unknown" in each of them -- never 0:
  exit 10  no anon key was given (the served site gave none); nothing was asked
  exit 11  the receipt could not be reached, or the database refused it
  exit 12  the census has never been written: the NAS loop has not yet run
  exit 13  the census row carries no usable total (a corrupt or partial body)
  exit 14  the census is too old to call current -- a stale number is not an
           answer, so it is reported as unknown WITH its age
Only exit 0 means a number anyone may act on. The key is read from the
environment and never printed.
"""

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone

UA = "poetech-lesson-queue-receipt/1 (DR-1360)"

# The NAS clock is 15 minutes (infra/nas-loops/install-clock.sh), the same
# clock nas-heartbeat rides and the same thresholds lib/nas-heartbeat.js judges
# by: two cycles of jitter is the clock's own, past four it is silent.
CLOCK_MIN = 15
FRESH_WITHIN_MIN = CLOCK_MIN * 2
SILENT_AFTER_MIN = CLOCK_MIN * 4


def ask(origin, key, timeout):
    """One read of the receipt: (dict, '') or (None, why)."""
    req = urllib.request.Request(
        origin.rstrip("/") + "/sb/rest/v1/rpc/lesson_queue_receipt",
        data=b"{}",
        method="POST",
        headers={
            "apikey": key,
            "Authorization": "Bearer " + key,
            "Content-Type": "application/json",
            "User-Agent": UA,
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            data = json.loads(r.read().decode("utf-8", "replace") or "null")
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return (
                None,
                "the lesson-queue receipt (migration 0320) is not on the live database yet",
            )
        return None, f"the live database answered HTTP {e.code}"
    except (urllib.error.URLError, OSError, ValueError) as e:
        return None, f"the live database could not be reached ({e.__class__.__name__})"
    if not isinstance(data, dict) or "seen" not in data:
        return None, "the answer was not a lesson-queue receipt"
    return data, ""


def age_min(stamp, now=None):
    """Whole minutes between the census stamp and now; None when unparseable."""
    if not isinstance(stamp, str) or not stamp:
        return None
    try:
        # The replace is deliberate (ruff FURB162): a runner on Python < 3.11
        # cannot parse a trailing Z, and a stamp this script could not read
        # would be reported as a census with no usable time -- a false alarm.
        at = datetime.fromisoformat(stamp.replace("Z", "+00:00"))  # noqa: FURB162
    except ValueError:
        return None
    if at.tzinfo is None:
        at = at.replace(tzinfo=timezone.utc)  # noqa: UP017
    ref = now or datetime.now(timezone.utc)  # noqa: UP017
    return max(0, int((ref - at).total_seconds() // 60))


def judge(receipt, why, now=None):
    """What the receipt entitles a reader to say.

    Returns (code, read, count, lines) where `read` is 'ok' or 'failed' and
    `count` is an int only when code is 0; otherwise the string 'unknown'.
    """
    if receipt is None:
        return 11, "failed", "unknown", [
            "### Waiting lesson rows: UNKNOWN",
            f"The house could not be asked over the public road: {why}.",
            "This is not an empty queue -- it is an unread one.",
        ]
    if not receipt.get("seen"):
        return 12, "failed", "unknown", [
            "### Waiting lesson rows: UNKNOWN",
            (
                "The NAS has written no lesson-queue census yet "
                "(lesson_queue_receipt: seen false), so nothing has counted the queue."
            ),
            "This is not an empty queue -- it is an uncounted one.",
        ]
    total = receipt.get("total")
    at = receipt.get("at")
    age = age_min(at, now)
    if not isinstance(total, int):
        return 13, "failed", "unknown", [
            "### Waiting lesson rows: UNKNOWN",
            (
                f"The census row exists (stamped {at or 'at an unreadable time'}) but carries "
                "no usable total, so no number is reported for it."
            ),
            "This is not an empty queue -- it is an unread one.",
        ]
    if age is None:
        return 13, "failed", "unknown", [
            "### Waiting lesson rows: UNKNOWN",
            (
                f"The census says {total}, but its stamp could not be read, so there is no "
                "way to know whether that number is current."
            ),
        ]
    if age > SILENT_AFTER_MIN:
        hours = age // 60
        when = f"{hours} h" if hours >= 1 else f"{age} min"
        return 14, "failed", "unknown", [
            "### Waiting lesson rows: UNKNOWN",
            (
                f"The last census was taken {when} ago and says {total}. The NAS clock is "
                f"{CLOCK_MIN} min, so a census this old means the loop is not running -- the "
                "number is reported as unknown rather than as today's queue."
            ),
            "This is not an empty queue -- it is a stale count.",
        ]
    lines = [f"### Waiting lesson rows: {total}"]
    fresh = "fresh" if age <= FRESH_WITHIN_MIN else f"late by the {CLOCK_MIN} min clock"
    lines.append(f"Counted on the NAS itself {age} min ago ({fresh}), read over the public road.")
    oldest = receipt.get("oldest_waiting")
    if oldest:
        ow = age_min(oldest, now)
        if ow is not None:
            d, h = ow // 1440, (ow % 1440) // 60
            waited = f"{d} d {h} h" if d else (f"{h} h" if h else f"{ow} min")
            lines.append(f"The oldest has waited {waited} ({oldest}).")
    for field, label in (("by_road", "By road"), ("by_shape", "By shape")):
        d = receipt.get(field)
        if isinstance(d, dict) and d:
            parts = ", ".join(f"{k}: {v}" for k, v in sorted(d.items()))
            lines.append(f"{label} -- {parts}.")
    excl = receipt.get("excludes")
    if isinstance(excl, list) and excl:
        lines.append(
            "Not counted as waiting: " + ", ".join(sorted(str(e) for e in excl)) + "."
        )
    else:
        lines.append(
            "The census did not say which tags it excluded, so which question it answered "
            "cannot be confirmed from this row."
        )
    return 0, "ok", total, lines


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--origin", default="https://poetech.us")
    ap.add_argument("--timeout", type=int, default=30)
    ap.add_argument(
        "--github-output",
        metavar="FILE",
        help="append read= / count= / road= / age_min= for the workflow to read",
    )
    a = ap.parse_args(argv)

    key = (os.environ.get("SOVEREIGN_ANON_KEY") or "").strip()
    if not key:
        code, read, count, lines = (
            10,
            "failed",
            "unknown",
            [
                "### Waiting lesson rows: UNKNOWN",
                (
                    "No anon key was given, so the house was never asked. "
                    "This is not an empty queue -- it is an unasked one."
                ),
            ],
        )
        receipt = None
    else:
        receipt, why = ask(a.origin, key, a.timeout)
        code, read, count, lines = judge(receipt, why)

    print("\n".join(lines))
    if a.github_output:
        age = age_min((receipt or {}).get("at")) if receipt else None
        with open(a.github_output, "a", encoding="utf-8") as fh:
            fh.write(f"read={read}\n")
            fh.write(f"count={count}\n")
            fh.write("road=served\n")
            fh.write(f"age_min={age if age is not None else 'unknown'}\n")
    return code


if __name__ == "__main__":
    sys.exit(main())
