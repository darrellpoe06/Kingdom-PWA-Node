# DR-0540 — Every course declares its shelves, because a hand-kept list silently stops being true

- **Status:** accepted
- **Date:** 2026-09-19
- **Type:** architecture
- **Relates to:** DR-0516 (a course has one home and many shelves), DR-0448 (cross-listing is a pointer, never a copy), DR-0108 (review our Ways), DR-0076 (proven-to-catch), DR-0075 (a justified non-improvement carries a re-review date)

## What Darrell found

Opening the Business course picker:

> *"We need to review the Ways we update our systems and don't when we have features added!!!!!!!!! Why isn't Banking in this list already?!!!!!"*

Banking was not there. Neither were four more Real Estate courses that shipped after the original eight were cross-listed.

## The cause, measured

`COURSE_CROSS_LISTINGS` is **hand-kept**. A course added after the list was written simply never appears in it, and nothing notices. Measured the day he asked: **22 of 36 mounted courses had no entry at all.** Banking was one symptom of a systemic gap, which is exactly the "Way" he named — the system does not update itself when a feature is added.

## The fix, in two halves

**1. The courses that belonged.** Five added to Business — `banking`, `appraisal`, `evictions`, `inspections`, `insurance-risk` — each with a `why` a reader can read.

**2. The structural half, so it cannot recur.** Every mounted course is now in exactly one of two places: it declares a **cross-listing**, or it declares in `HOME_ONLY` that no second shelf has been declared yet. A course in **neither** fails the build (`coursesWithNoShelfDeclaration`). That moves the decision to the moment a course is added, instead of leaving a silent gap for someone to find in a dropdown months later.

The gate is **proven to catch**: a fabricated key is reported by the helper, and the exclusivity check immediately caught four courses I had cross-listed while leaving them in `HOME_ONLY`.

## Then the wider instruction

> *"All courses need to be listed in their respective courses and also cross the other spaces it is discussed..."*

So the remaining shelves were found by **measuring**, not guessing: each course's own lesson text against every other department's distinctive vocabulary. Eight more cross-listings were authored from that measurement, each carrying its count — `sovereign-ai` into Development (126 terms) and Business (94), `ai-legal-blueprint` into Business (31), `datasystems` into Development (26), `world-issues` into Kingdom Life & Stewardship (62), `financing-debt` (37) and `evictions` (37) into Kingdom Life & Stewardship, `appraisal` into Mathematics (49).

**And the measurement's limit is recorded rather than hidden.** `living-lessons` scores high against every department — Mathematics 459, Business 350, Real Estate 222 — purely because it is 181 lessons. That is a volume artefact, not subject overlap, and it was **not** used to cross-list anything. Those courses need a read, not a keyword count.

## What HOME_ONLY actually means

Not "this belongs nowhere else." It means **no second shelf has been declared yet**. `re-review: 2026-10-19` — read the remaining courses and declare the shelves a reader would expect, rather than leaving them there by default.

## Still open

The same guarantee does not yet exist at **lesson** granularity. Darrell: *"Lessons that fit multiple Industries... etc..."* Lessons still use the older hand-kept `CROSS_LISTINGS` with nothing forcing a new lesson to declare its other shelves — the identical failure one level down. Tracked.
