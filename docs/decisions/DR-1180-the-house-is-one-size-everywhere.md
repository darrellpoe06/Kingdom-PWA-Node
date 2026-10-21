# DR-1180: The house is one size everywhere — a fact repeated eleven times, checked nowhere

**Date:** 2026-10-21
**Status:** accepted
**Tier:** B (a stated fact about COLG's building in teaching content and in a rental rate blurb; words only, no behaviour)
**Type:** fix

**Area:** `app/src/lib/infrastructure-class.js`, `app/src/lib/economics-class.js`, `app/src/lib/venue-rental.js`, `app/src/__tests__/the-house-is-one-size-everywhere.test.js` (new).

**Principles:** DR-0076 (a figure on a trust surface is measured, not remembered); DR-0061 (a surface is a live view of real state); COMMUNITY-FIRST-MISSION (COLG is the named first community, and what we say about it is said accurately).

## Context

**Darrell, 2026-10-21**, reading his own Economics lesson on his phone and selecting the words on screen:

> *"Sorry it is 33,000 square feet... not 44,000 fix it..."*

## What was measured

COLG's building size was wrong in **eleven places**:

| file | places | what a reader meets |
|---|---|---|
| `infrastructure-class.js` | **8** | the big idea, all four reading bands (child, youth, teen, senior), the takeaway, the lesson body, the study note |
| `economics-class.js` | **2** | the in-app practice and the takeaway — the one he was reading |
| `venue-rental.js` | **1** | the rate blurb telling a renter how big the main church is |

**Nothing was checking it, and nothing could have been.** The figure is prose in every one of those eleven places — a sentence a reader meets, not a value a surface reads. There is no constant to import, nothing ever compared them to each other, and a lesson body cannot interpolate one.

**It also reaches further than teaching.** `venue-rental.js` is a commercial fact: a renter is told the size of the space they are pricing.

## Decision

**The figure is 33,000, and a gate holds it there.** Every square-footage figure applied to the house must be the **same** figure, and the superseded **44,000** may never come back — naming the old number is what stops a copy-paste from an older lesson quietly restoring it.

**A third case keeps the gate honest.** It asserts that the check still matches the three files that actually carried the wrong figure, so a refactor that moves those sentences elsewhere fails rather than leaving a green check over an empty room (DR-0076 §3).

**Not a constant, deliberately.** The honest fix would be one exported figure every surface reads, and these are static lesson bodies — sentences, not slots. The gate is the next best thing and it is exact: whatever size the house is given, it is given the same size everywhere.

## Impact

**A reader meets one number.** So does a renter.

**What this does NOT change, and it needs his eye:** the dated session notes still say ~44,000 sqft, and one of them matters — `2026-06-09-research-review-colg-9k-church-build.md` **sized a 22-camera layout to that figure**. At 33,000 that estimate is about a third high. Those notes are records of what was believed when they were written, so they stay as records; **the camera count was derived from the wrong number and should be re-derived before anything is bought.** `re-review: 2026-10-28`.

## Verification

**3 cases**, and **one proven to catch by breaking the content**: restoring 44,000 in one of the eleven places turns **2 red**, and the failure names the file by the wrong figure — *"44,000 in lib/economics-class.js"*. Restored: **3 passed**.

**64 tests green** across the three affected suites, unchanged. `npm run lint` exit **0** · `npm run verify:gates` exit **0** (24 gates), read without a pipe.

**A hole this found in another gate, worth naming:** `decision-citation-guard` reported OK while this record's number was cited in a test file and no record existed. It does not reach `app/src/__tests__`, so a citation made only from a suite is an unkept promise it cannot see. Not fixed here — named, with **`re-review: 2026-10-28`**.
