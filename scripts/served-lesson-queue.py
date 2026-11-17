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

WHAT THIS ROAD MAY CARRY, AND WHAT IT MUST NEVER (2026-11-12, measured when
the four lesson-intake lanes were checked against it one by one). The anon key
is PUBLIC by nature -- it ships inside the bundle every browser downloads -- so
this road is a public endpoint, and it answers exactly one kind of question:
"does work wait?", in counts and ages. It does not generalise:

  inbox-lessons-waiting.yml  FITS. It asks only for the count (this script).
  lesson-inbox-bell.yml      DOES NOT. It runs a proof query, reads the NAS
                             bell state over ssh, and reads pg_extension /
                             pg_trigger; a counts-only receipt cannot stand in
                             for any of those. It needs the tailnet.
  inbox-lesson-body.yml      MUST NEVER. Its whole purpose is to carry a row's
                             BODY -- a person's own words. Putting a body, or
                             any field that could reconstruct one, behind a
                             public key would publish a teaching. This is a
                             bright line, not a preference (DR-0611, and the
                             never-a-body rule the lanes all carry).
  lessons-sync.yml           UNEXAMINED. It does not share the waiting query,
                             so it asks a different question; decide it on its
                             own evidence rather than by this pattern.

So the TS_AUTHKEY is still genuinely needed by three of the four. Anyone
reaching for this road for a new lane: check which question the lane asks
first. If the answer is anything but a count, this is the wrong road.
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
        return (
            11,
            "failed",
            "unknown",
            [
                "### Waiting lesson rows: UNKNOWN",
                f"The house could not be asked over the public road: {why}.",
                "This is not an empty queue -- it is an unread one.",
            ],
        )
    if not receipt.get("seen"):
        return (
            12,
            "failed",
            "unknown",
            [
                "### Waiting lesson rows: UNKNOWN",
                (
                    "The NAS has written no lesson-queue census yet "
                    "(lesson_queue_receipt: seen false), so nothing has counted the queue."
                ),
                "This is not an empty queue -- it is an uncounted one.",
            ],
        )
    total = receipt.get("total")
    at = receipt.get("at")
    age = age_min(at, now)
    if not isinstance(total, int):
        return (
            13,
            "failed",
            "unknown",
            [
                "### Waiting lesson rows: UNKNOWN",
                (
                    f"The census row exists (stamped {at or 'at an unreadable time'}) but carries "
                    "no usable total, so no number is reported for it."
                ),
                "This is not an empty queue -- it is an unread one.",
            ],
        )
    if age is None:
        return (
            13,
            "failed",
            "unknown",
            [
                "### Waiting lesson rows: UNKNOWN",
                (
                    f"The census says {total}, but its stamp could not be read, so there is no "
                    "way to know whether that number is current."
                ),
            ],
        )
    if age > SILENT_AFTER_MIN:
        hours = age // 60
        when = f"{hours} h" if hours >= 1 else f"{age} min"
        return (
            14,
            "failed",
            "unknown",
            [
                "### Waiting lesson rows: UNKNOWN",
                (
                    f"The last census was taken {when} ago and says {total}. The NAS clock is "
                    f"{CLOCK_MIN} min, so a census this old means the loop is not running -- the "
                    "number is reported as unknown rather than as today's queue."
                ),
                "This is not an empty queue -- it is a stale count.",
            ],
        )
    lines = [f"### Waiting lesson rows: {total}"]
    fresh = "fresh" if age <= FRESH_WITHIN_MIN else f"late by the {CLOCK_MIN} min clock"
    lines.append(
        f"Counted on the NAS itself {age} min ago ({fresh}), read over the public road."
    )
    oldest = receipt.get("oldest_waiting")
    if oldest:
        ow = age_min(oldest, now)
        if ow is not None:
            d, h = ow // 1440, (ow % 1440) // 60
            waited = f"{d} d {h} h" if d else (f"{h} h" if h else f"{ow} min")
            lines.append(f"The oldest has waited {waited} ({oldest}).")
    # WHY A FAILED BUILD FAILED, AS A CLASS (0322, measured 2026-11-12). On the
    # tick that prompted it this road could say only `build-failed: 3`, and a
    # count cannot be acted on: `rate-limited` and `transient` retry themselves,
    # anything else is stuck and wants a person. The class is printed; the
    # reason's text is never carried here (it can quote a person's words).
    for field, label in (("by_road", "By road"), ("by_shape", "By shape"), ("by_stall", "Failed because")):
        d = receipt.get(field)
        if isinstance(d, dict) and d:
            parts = ", ".join(f"{k}: {v}" for k, v in sorted(d.items()))
            lines.append(f"{label} -- {parts}.")
    # WHICH ROWS WAIT (0326, DR-1511). Until now this road could say five
    # teachings waited and never which five, so a session that could not join
    # the tailnet could describe the queue and not act on it -- not even run
    # the already-shipped sweep, which takes row ids. Counts and classes only:
    # the SQL rebuilds each row from a whitelist, so a tag (which can carry a
    # member's name) and a body cannot reach here even if the census held one.
    rows = receipt.get("waiting")
    if isinstance(rows, list) and rows:
        named = [r for r in rows if isinstance(r, dict) and r.get("id")]
        # THE COUNT AND THE NAMED LIST CAN HONESTLY DISAGREE, and the smaller
        # number must never read as the queue. The function drops a row whose
        # id is not uuid-shaped rather than publish it half-known, so fewer
        # named than counted means rows it REFUSED, not rows that left.
        if isinstance(total, int) and len(named) != total:
            lines.append(
                f"NAMED {len(named)} of {total}: the rest were refused by the receipt "
                "(an id it could not read), so they wait unnamed -- not gone."
            )
        for r in named:
            bits = [str(r.get("id"))]
            if r.get("created_at"):
                bits.append(str(r.get("created_at")))
            if r.get("source"):
                bits.append(str(r.get("source")))
            shape = str(r.get("shape") or "unclassified")
            bits.append(shape + (f"/{r.get('stall')}" if r.get("stall") else ""))
            # WHY IT WAITS (0328, DR-1515). Measured 2026-11-17: the builder was
            # active and building nothing while three teachings had waited five
            # days, because past its MAX_ATTEMPTS the builder leaves a row to the
            # hourly Routine ON PURPOSE -- and `plain` could not tell an
            # untouched row from a handed-over one. `why` says which, and
            # `attempts` is printed beside it so exhaustion stays the reader's
            # judgment: the threshold is the builder's and is not duplicated.
            why = r.get("why")
            if why:
                n = r.get("attempts")
                bits.append(str(why) + (f" after {n}" if isinstance(n, int) and n else ""))
            else:
                # A verdict the receipt refused reads as unknown, never as ready.
                bits.append("why unknown")
            lines.append("  " + " | ".join(bits))
    elif isinstance(total, int) and total > 0:
        lines.append(
            "The census named no rows, so this count cannot be acted on: a build needs "
            "the row id the already-shipped sweep takes."
        )
    # IS THE THING THAT BUILDS EVEN RUNNING (0327, DR-1514). `build-failed: 3`
    # means one thing under a live builder and another under a dead one, and
    # until now the builder's own state was reachable only over ssh behind the
    # refused key. An unreadable source prints as `unread`, never as 0.
    # WHICH CODE WROTE THIS CENSUS (0330, DR-1517). A verdict read without it is
    # ambiguous: `ready` means one thing before DR-1516's owner check and
    # another after. Unknown is SAID, never passed over in silence.
    cs = receipt.get("code_sha")
    if isinstance(cs, str) and cs:
        lines.append(f"Written by census code {cs[:12]}.")
    else:
        lines.append(
            "The census did not name its own code, so which version produced these "
            "verdicts is UNKNOWN -- read `ready` with that in mind."
        )
    bl = receipt.get("builder")
    if isinstance(bl, dict) and bl:
        read = bl.get("read") if isinstance(bl.get("read"), dict) else {}
        bits = [f"service: {bl.get('service') or 'unknown'}"]
        for key, label in (("building", "building now"), ("code_sha", "code")):
            if read.get(key) is False:
                bits.append(f"{label}: unread")
            elif bl.get(key) is not None:
                bits.append(f"{label}: {bl.get(key)}")
        st = bl.get("status")
        if read.get("status") is False:
            bits.append("its own record: unread")
        elif isinstance(st, dict) and st:
            # Booleans read as JSON writes them: `ok: false`, not Python's `False`.
            shown = {k: ("true" if v is True else "false" if v is False else v) for k, v in st.items()}
            bits.append(
                "its own record -- " + ", ".join(f"{k}: {v}" for k, v in sorted(shown.items()))
            )
        elif isinstance(st, dict):
            bits.append("its own record: present but empty")
        held = bl.get("status_withheld")
        if isinstance(held, int) and held > 0:
            # Said out loud so a short list never reads as a complete one.
            bits.append(f"{held} field(s) withheld by shape (free text never rides this road)")
        lines.append("The builder -- " + "; ".join(bits) + ".")
        # WHAT THE STATE MEANS, not only what it is (DR-1522). `state` is the
        # field that separates two causes with opposite fixes, so the reader
        # says which one it points at rather than leaving it sorted in beside
        # `attempts`. Measured 2026-11-17: an hourly heartbeat beside attempt
        # counts frozen since 2026-11-12 fits both, and nothing in the receipt
        # could tell them apart.
        state = st.get("state") if isinstance(st, dict) else None
        if state in ("waiting on a writer", "waiting on a push credential"):
            thing = "a writer it can reach" if state.endswith("writer") else "a push credential"
            lines.append(
                f"It is NOT working the queue: readiness() refuses for want of {thing}, so the "
                "builder returns before it ever reads a row -- which is why no attempt is "
                "recorded while its heartbeat keeps advancing. Every `ready` verdict above is "
                "real and is waiting on the box, not on the words."
            )
        elif state == "stopped":
            lines.append(
                "It is STOPPED by its own kill state, so no row will be built until that is "
                "cleared. The verdicts above are unaffected."
            )
        elif state == "ready":
            # SAY `words`, NEVER THE OTHER NOUN FOR THEM, anywhere in this span.
            # the-waiting-queue-has-a-witness.test.js slices from the verdict
            # loop to `excl =` and refuses that noun anywhere inside, comments
            # included -- a cheap, strong canary over the whole span, worth
            # keeping at full strength rather than narrowing its slice so one
            # sentence may use the word. This comment was itself rejected once
            # for naming the guard it was explaining.
            lines.append(
                "Readiness is NOT the cause: the builder has a writer and a push credential. "
                "So a `ready` row it still refuses is refused by eligibility() -- and the one "
                "branch this receipt cannot mirror is words that are only whitespace."
            )
        elif isinstance(st, dict) and read.get("status") is not False:
            lines.append(
                "Its readiness state did not ride this receipt, so WHY it is not building is "
                "UNKNOWN -- neither readiness nor eligibility is ruled out."
            )
    elif any(isinstance(d, dict) and d.get("build-failed") for d in [receipt.get("by_shape")]):
        lines.append(
            "A build has failed and this census carried no builder state, so whether the "
            "builder is running is UNKNOWN -- not idle."
        )
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
