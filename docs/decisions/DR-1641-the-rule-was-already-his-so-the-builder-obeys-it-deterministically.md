# DR-1641: the rule was already his, so the builder obeys it deterministically

**Date:** 2026-11-24
**Status:** Accepted
**Tier:** B — the NAS lesson builder's pre-gate pass and its retry budget; no road, no secret, no schema
**Type:** orchestration
**Area:** `infra/nas-lesson-builder/lesson_gates.py`, `lesson_builder.py`, `test_lesson_builder.py`
**Pairs with:** DR-1552 (name the span), DR-1202 (a bounded retry keeps the brakes whole), DR-0621 (hold the hand of the process), DR-0111, DR-0076 §3 and §8
**Session note:** `docs/99-session-notes/2026-11-24-both-roads-shut-then-the-queue-named-its-rows.md`

## Context

Five of the ten teachings waiting on 2026-11-24 were refused on
`span-without-reference`, one on its FIRST pass. It had been reported three
times that day as a question for Darrell — *may a lesson double-quote Bishop
Gwin without a Scripture reference?* That was wrong; the correction is this
record.

## What was measured

- **The rule was already his, written to the writer twice.**
  `lesson_writer.py:85-87`: *"Use straight double quotes (\") ONLY for
  Scripture. Never put anyone else's words in double quotes."* And `:118-119`:
  *"never put Darrell's (or anyone's) words in quotation marks."* Asking was a
  DR-0111 violation.
- **The feedback already reaches the retry** — `previous_failures()`
  (`lesson_builder.py:814`) feeds the gates' named spans forward (DR-1552), so
  instruction is not the missing piece.
- **The budget was the live constraint.** `MAX_ATTEMPTS` was 2 — one blind
  attempt, one informed retry, then abandonment. Six rows read `failed after 2`.

## Impact

The unambiguous half of the fault stops costing a retry, and a teaching needing
more than one informed pass gets it instead of being left.

## Decision

1. **A span the corpus does not hold loses its quotes**, before any gate, and
   reads as our attributed prose — which is what the instruction asked for.
2. **A span the corpus DOES hold keeps them** and is left to fail the gate:
   mending it means choosing which verse it is, and a reference is never guessed
   (DR-0076 §8). Nothing referenced is touched, and every ambiguity answers
   "leave it" — the two mistakes are not equal: quotes left on a speaker's words
   change nothing, quotes taken off a verse would print the Word as ours.
3. **`MAX_ATTEMPTS` 2 → 4.** A bounded count raised leaves every brake whole, by
   the reasoning DR-1202 recorded for `RATE_LIMIT_RETRIES`: `BUILD_MAX_SECONDS`,
   the per-row lock and the stop-paths are unchanged.

## Verification

- **132 cases green.** Proven to catch three ways: the mend neutered → 2 fail by
  name; `contains_phrase` blinded to False → the demoted verse is caught;
  `LESSON_BUILD_MAX_ATTEMPTS=2` → 3 fail. The budget cases keep literal numbers,
  since a case reading the constants could not catch a loop.
- **No net-new lint:** ruff 0.17.3 at 159 findings for these three files, the
  same count as `origin/main`; format-guard OK.
- **Not claimed:** nothing is measured live — the NAS takes this on its next
  services-sync pull, so the next hourly receipt is the proof.
  `re-review: 2026-12-01`.
