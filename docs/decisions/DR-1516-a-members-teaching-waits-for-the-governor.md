# DR-1516: A member's teaching waits for the Governor, not for the builder

**Date:** 2026-11-17
**Status:** Accepted
**Tier:** A (one verdict branch, one migration; no new road, no new secret)
**Type:** decision
**Area:** `infra/nas-loops/lesson-queue-census.py`, `infra/supabase/migrations-auto/0329-a-members-teaching-waits-for-the-governor.sql`
**Measurement:** `docs/99-session-notes/2026-11-17-the-keyless-roads-answered-and-three-gates-caught-me.md`
**Pairs with:** DR-1515 (the verdict this corrects), DR-0635 (a member's lesson is the Governor's to release), DR-0639 (a tag can carry a name), DR-0076 §8 · corrects DR-1515 within the hour, from its own first live answer

## Context

DR-1515's first live read (08:14, run 44044623417) said **four rows were
`ready`** while the builder was `active` and `building now: 0`. Read plainly,
that accuses the builder of neglecting four teachings.

## What was measured

- **It was a missing branch, not a neglectful builder.**
  `lesson_builder.eligibility()` refuses a row whose `created_by` is not one of
  Darrell's two accounts unless it carries `lesson-approved`, because a
  **member's** teaching is the Governor's to release. `why_of` did not mirror it.
- **`ready` was overclaiming on the case that matters most** — somebody else's
  words, which would have read as the lane's fault instead of as awaiting review.
- **The verdicts also corrected my own account of the failures.** `MAX_ATTEMPTS`
  is 2, and the counts read `failed after 1`, `failed after 1`, `failed after 2`
  — so only **one** of the three was handed to the hourly Routine. An hour
  earlier I had said all three were.

## Impact

A reader can tell *awaiting the Governor* from *the builder should take this*.
No account id travels: the ids are compared on the box and one word is published.

## Decision

1. **`waits-for-governor` is a sixth verdict**, placed where
   `eligibility()` places it — after `declined`, before `deferred`.
2. **An unknown author reads `waits-for-governor`, never `ready`.** A missing
   `created_by` resolves toward review, not toward the builder.
3. **`ready` states its own limit.** It means nothing in the tags or the owner
   check blocks it. One branch stays deliberately unmirrored — `eligibility()`
   refuses a row with no words, and testing that would mean reading the body
   this receipt must never read. Said in the census, not hidden.
4. **The ids are compared locally and never published.**

## Verification

- 49 Python cases (8 new). Six earlier cases failed on the new branch because
  their fixtures carried no author — the new behaviour was right and the
  fixtures were incomplete; both are now explicit about whose row they test.
- **Proven to catch:** removing `waits-for-governor` from 0329's `k_whys` fails
  *verdict waits-for-governor is missing from k_whys in 0329…* — the guard
  fixed hours earlier, catching a word that did not exist when it was written.
- **Applied to a real PostgreSQL 16** with a member's row and a planted
  `created_by`: the verdicts published as `waits-for-governor` and `ready`, the
  account id was dropped, and `anon` stayed refused the table.
- **Not claimed:** nothing is exercised on the NAS yet, and whether the four
  rows are members' or Darrell's own is **still unknown** — that is what this
  read will answer. `re-review: 2026-11-24`.
