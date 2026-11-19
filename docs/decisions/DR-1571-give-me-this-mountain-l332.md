# DR-1571: L332 — Give Me This Mountain

**Date:** 2026-11-19
**Status:** Accepted
**Tier:** A (one Living Lesson; content only)
**Type:** lesson
**Area:** Living Lessons (`app/src/lib/living-lessons/ll332-give-me-this-mountain.js`, its own file per DR-1468)
**Source:** one forwarded public radio newsletter with one word above it: Lesson. Gmail thread 1a1f0906b4bfc2c4.
**Pairs with:** DR-1426 (L301, dreams), DR-1275 (legacy8, Psalm 92:14 for provision), DR-1468 / DR-1477, DR-0610, DR-0098, DR-0100, DR-0076, DR-0210, DR-0331

## Context

The newsletter's lead story was a health reporter's own turn at midlife: she noticed she felt stuck and toured people aged 45 to 105 who had turned in the middle of life. Three of its points are held up to the Word: strengths set aside in the busy years, a reported arts study (a correlation, as the newsletter itself says), and the flat gray of the steady caregiver who misses her own burnout. The newsletter's other news items are separate stories and are not taught here. Its dream material, including planting a question before sleep, is reported and not taught as a practice. Placed in Living Lessons (devotional). One teaching, one lesson (DR-0610): `lesson-already-built --thread` found no lesson on this thread; L301 owns dreams, legacy8 owns Psalm 92:14 for provision, and L246 cites Caleb only in passing. L332 names L301 and legacy8 in its text and builds what is new: Caleb in Joshua 14 as the Word's answer to the middle of life.

## What was measured

| what | measured |
| --- | --- |
| verses | 148 quoted spans filled by `fill-verses.mjs` from `app/public/bible/kjv`; 0 verse faults; 0 double-quoted spans without a reference |
| length | adult 1,609 words with quotations (reader-length band 1,500 to 3,500; a first draft at 1,365 failed `new-lessons-keep-a-reader-length` and was taught longer, not padded), 1,005 prose; band shares child 0.60, youth 0.66, teen 0.68, senior 0.73 |
| reading ladder | child 1.4, youth 3.2, teen 4.3, senior 6.6 |
| band overlap | worst pair 0.02 |
| provenance | the arts study, strengths survey, pleasure self-check and dream research are REPORTED only (no study opened); a lasting loss of pleasure as a warning sign for a doctor is stated as ESTABLISHED |

## Impact

The middle of life is taught as obedience, not reinvention: the promise at forty (Joshua 14:7; Numbers 13:30; 14:24), the forty-five years called kept (Joshua 14:10), the same strength at eighty-five from Yahweh (Joshua 14:11; Isaiah 40:31; 46:4), the ask for the hardest ground already promised (Joshua 14:12; 15:14), the set-aside gift used for others (1 Peter 4:10; Matthew 25:25), the inheritance named for the children (Joshua 14:9; Deuteronomy 1:36; Joshua 15:17-19; Proverbs 13:22), and the worn-out servant fed and rested before he is sent (1 Kings 19:4-7; Mark 6:31). Every band carries the three talk-together directions.

## Decision

1. `ll332-give-me-this-mountain` is dated 2026-11-19 at order 332 in Living Lessons.
2. The newsletter's claims stay reported; no person from it is named; dream incubation is never taught as a practice.
3. `re-review: 2026-12-19` — open the arts study the newsletter reports, or record that it still is not read.

## Verification

`app/src/__tests__/living-lessons-ll332-give-me-this-mountain.test.js` (11 cases): the shared Living Lesson gate on a six-span spine (Joshua 14:12, 14:11, 14:10, 14:7; Numbers 14:24; 1 Kings 19:5), plus two particular cases (the arts finding named a correlation in every adult-facing band; no incubation and no newsletter name). Suites run and results in the commit body.

Found in CI (vitest shard 3/4): `the-lesson-count-is-derived` capped the catalog's unused numbers at 6 and read 12, because L324-L331 were reserved on origin by branches still in flight when L332 landed. Re-pinned with a dated comment to count only numbers no `reserve/ll-*` holds, the rule `living-lessons-numbers-are-unique` already applies (DR-1477), plus a proven-to-catch case (too many unreserved gaps fail; the same reserved pass). Offline it fails closed.
