# DR-1552: Name the span, do not only count it

**Date:** 2026-11-18
**Status:** Accepted
**Tier:** A — one gate's message made actionable; what the gate ALLOWS is unchanged, and no lesson already built is touched
**Type:** orchestration
**Area:** `infra/nas-lesson-builder/lesson_gates.py`, `infra/nas-lesson-builder/test_lesson_builder.py`, `infra/nas-loops/test_lesson_queue_census.py`
**Pairs with:** DR-1551 (which problem), DR-1542 (the cause), DR-0621 (a flag is where the work starts), DR-0076 §3 and §5
**Session note:** `docs/99-session-notes/2026-11-17-the-keyless-roads-answered-and-three-gates-caught-me.md` §14

## Context

0336's first live read, 16:08Z, named the problem behind every gate refusal in
the stuck queue — and it was **the same one every time**: four of the seven
waiting teachings died on `span-without-reference`, and on no other branch of
the quotation gate. Three more died on `not-the-verse`, one on
`generic-God-not-Yahweh`. Not variance. One repeated behaviour.

## What was measured

- **What the writer was told:** `"levels.child: 7 quoted spans, 4 with a
  reference"`. A count. `previous_failures` (`lesson_builder.py:814`) feeds it
  into the next attempt, so attempt 2 was asked to fix what it could not
  locate — against a rule `lesson_writer.py:85-90` had already stated.
- **The verse gate already does this right**, and has from the start:
  `'(John 1:1) was quoted as "X" but the verse reads: Y'`. The quotation gate
  was the one withholding it.
- **A bug caught before it shipped:** `SPAN_WITH_REFERENCE` has four groups, so
  `findall` yields TUPLES, and a referenced set built from it makes every span
  look unreferenced — a clean draft told its own Scripture carries none.
- **A gap in DR-1551, found the same day:** `FAILURE_SITES` had a drift case and
  `PROBLEM_KINDS` did not, so re-wording a gate message would have silently
  stopped classifying it with nothing going red.

## Impact

The next attempt is told which spans to fix. Nothing about what the gate
accepts has changed, so no judgment about how a lesson may quote has been made
here — that question stays open and is Darrell's.

## Decision

1. **The quotation gate names the unreferenced spans**, at most five, each cut
   to 60 characters, after the unchanged opening — because the census
   classifies this line by matching `quoted spans,`.
2. **A drift case now pins every `PROBLEM_KINDS` literal** to prose the gates
   actually write, and every `VERSE_FAULT_KINDS` value to a kind the verse gate
   emits.

## Verification

- **Proven to catch:** the `findall` tuple bug (a clean draft must pass); a
  re-worded gate message; and the new span text reaching the public receipt —
  the census publishes `span-without-reference` and leaks neither span nor the
  `where`. 130 builder cases (6 new) and 142 census cases (4 new) green.
- **The drift case earned itself on its first run**, failing on
  `the generic "God" in our own voice`: the source escapes those quotes, so it
  compares with escapes removed. The matcher was right; the test was not.
- **Re-reviewed 2026-11-26, SATISFIED live**: `span-without-reference` rides on
  13 of 33 rows, leaking neither the span nor the `where`. Closed.
