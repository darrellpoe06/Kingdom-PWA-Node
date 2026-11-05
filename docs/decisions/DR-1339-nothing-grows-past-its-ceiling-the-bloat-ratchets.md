# DR-1339: Nothing grows past its ceiling — the bloat ratchets on records and files, and the one move that waits for its own PR

**Date:** 2026-11-05
**Status:** accepted
**Tier:** A (two guards and a baseline; no runtime change)
**Type:** gate (PERPETUAL-IMPROVEMENT, VERIFICATION-DOCTRINE) · DR-1330 D9
**Area:** `scripts/record-length-guard.mjs`; `scripts/file-budget-guard.mjs`; `scripts/file-budgets.json`; `app/src/__tests__/bloat-ratchets.test.js`; `.github/workflows/ci.yml` (guards leg)
**Grounds:** DR-0075 (a ratchet only goes down; a deferral carries a date), DR-0011 (the ledger is append-only, so the past stays), DR-0078 (the monolith brake this generalises), DR-1330 (the measurement)

## Context

Darrell, 2026-11-05: *"I also don't like bloated code!!!!!!!!! DRs.... review..."* Measured: 894 of 1,224 records over the README's own 45 lines, one INDEX row of 63,818 characters, 16 tracked source files over 1,500 lines (the largest 29,435), only the shell under a brake.

## What was measured

- **Records, from this one on:** at most 60 lines and a 700-character INDEX row. This record is the first judged. The past is not rewritten (DR-0011); the narrative belongs in the session note a record cites.
- **Files:** the 16 files over 1,500 lines are the baseline in `file-budgets.json`, each ceiling its measured size, re-frozen down only by `--generate`; any other source file over 1,500 lines fails. A raise is a hand edit with a reason, as `monolith-budget.json` records its own.
- **Lesson content out of JavaScript (the report's D9c) is NOT done here, and the reason is measured:** the module is pure data (216 lesson literals, two arrows), but 209 of the 254 lesson gates read the module's SOURCE as text to pin quotations. Moving the content to data files without first moving those 209 gates onto the data would turn the curriculum's whole proof red in one push. It is its own migration with its own record: `re-review: 2026-11-19`, the gates first, then the content.
- Proven to catch: an over-long record, an over-long row, a file that grew, a file born big — 10 cases; both guards OK on the live tree.

## Impact

A record or a file that grows past its ceiling is red from the push that grows it. The three class files (45,212 lines between them) cannot grow; the shell's brake now has fifteen siblings.

## Decision

Both guards in the guards leg; the baseline shrinks and never grows silently; D9c waits for its own PR with the gates moved first.

## Verification

`record-length-guard` and `file-budget-guard` OK; `bloat-ratchets.test.js` 10 cases green; lint clean; `ci.yml` parses.
