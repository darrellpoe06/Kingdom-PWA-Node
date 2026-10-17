# DR-1095: Two of the three holes were never ours — 211 and 212 are build labels, and an excused number must say why

**Date:** 2026-10-17
**Status:** accepted
**Tier:** A (a gate comment and one new assertion; no surface, no data, no door)
**Type:** way
**Area:**
- `app/src/__tests__/living-lessons-numbers-are-unique.test.js` (the reason beside each excused number, and a case that fails without one)

**Grounds:** #2166's own `re-review: 2026-10-17` — *"confirm #1255 is closed now that its remainder is merged; and look at 211 and 212 the way 79 was looked at."* Run on its date.
**Principles:** DR-0075 (a non-improvement is a recorded decision with a date); DR-0076 §8 (provenance — the claim cites the record); DR-0621 (hold the hand of the process — a flag is where the work starts); DR-1025 (the 79 investigation this one is measured against)

## The ask, and the answer

Looked at the way 79 was looked at, **211 and 212 are the opposite case**, and the
answer was already in writing on main the day they were built:

| number | what it actually is | where the teaching went |
|---|---|---|
| 211 | DR-0760's orchestrator build label (`wt-l211`, `claude/lesson-l211`) | **sov34**, Sovereign A.I. |
| 212 | DR-0761's, identically (`wt-l212`, `claude/lesson-l212`) | **sov33**, Sovereign A.I. |

Both records surfaced the conflict at the time rather than resolving it
silently: the brief named the lesson `ll211`/`ll212` while naming the placement
*Sovereign A.I.*, and those cannot both be literal — `ll*` is the Living Lessons
scheme and that course requires `sov<week>`. The placement was the part that was
right. DR-0760 says it outright: **"No `ll211` exists."**

So 79 and these two were one list wearing one word. **79 was a hole in the
TEACHING** — a real lesson whose text sat stranded in an unmergeable PR for two
months, and it was paid (DR-1025). **211 and 212 are holes in a NUMBER
SEQUENCE** that never had teaching assigned to them, because the number came
from the orchestrator's build-label namespace and not from this catalog at all.
Nothing is missing from the app.

## Decision

**1. They stay unclaimed, permanently, and the catalog is NOT renumbered.** The
visible skip (L210 then L213) is cosmetic; closing it would move every lesson
above 212 and invalidate every number pinned anywhere in the suite, to hide two
labels that were never ours. **`re-review: 2027-04-17`** — and only if the
orchestrator's label namespace and this catalog's are ever actually unified.

**2. An excused number must say WHY, by record.** `GAP_REASONS` now sits beside
`KNOWN_GAPS`, each entry citing its DR, and a case fails if a number is excused
from the sequence without one. An allowance with no reason beside it is how
these two got investigated twice; the next reader gets the answer instead of the
investigation. **Proven to catch:** deleting 212's reason while leaving it
excused fails that case; restored byte-identical by `cmp`, green after restore.

## What this does not do

- **It does not close #1255.** Its remainder is merged (`ll242`, DR-1018, on
  main) and so are `ll77` and `ll78` — but **`ll79` is not on main**, measured
  today: it is in this PR, behind the `hold` Darrell put on it. Closing the
  ticket while a third of its content is unmerged would be a false close.
  **`re-review:` when #2166 merges.**
