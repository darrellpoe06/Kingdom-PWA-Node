# DR-1491: L313 — Children Are a Heritage — When the School Closes, the House Still Teaches

**Date:** 2026-11-13
**Status:** Accepted
**Tier:** A (one Living Lesson; content only)
**Type:** lesson
**Area:** Living Lessons (`app/src/lib/living-lessons/ll313-children-are-a-heritage-when-the-school-closes-the-house.js`, its own file per DR-1468)
**Forwarded by:** Darrell, one newsletter, with one word above it: Lesson
**Pairs with:** DR-0610 (one teaching, one lesson), DR-1468 / DR-1477 (the parallel pipeline), DR-0098, DR-0100, DR-0076, DR-0331

## Context

Darrell forwarded the 1440 Daily Digest of 2026-11-10, Congress Resumes, Schools Close, and Elizabeth Holmes Clones (Gmail thread `1a1c5c715c76307d`), on 2026-11-10 at 14:04Z (8:04 AM Central), with one word above it, Lesson; it is rendered, never quoted. A digest carries many items, so one was chosen. The school-closures item is the only headline item whose facts are in the text we hold and whose teaching the Word speaks to directly: children as a heritage, the house as the first school, counting the cost, the little ones who fall behind. Left out on purpose: Congress (a lame-duck legislative calendar, politics without a single teaching), the Elizabeth Holmes item (a one-line clickbait teaser; its story is behind a link, nothing in hand), the Nvidia item (taught in L310, DR-1480), and the other briefs. L311 and L312 were already reserved by other sessions, so this lesson took L313.

## What was measured

| what | measured |
| --- | --- |
| verses | 23 anchor references; 104 quoted spans, every one filled by `fill-verses.mjs` from `app/public/bible/kjv`; 0 verse faults; 0 double-quoted spans without a reference |
| band shares | child 0.53, youth 0.62, teen 0.62, senior 0.64 (adult 1,379 prose words) |
| reading ladder | child 1.7, youth 3.7, teen 5.8, senior 7.7 (child ceiling 5.0) |
| band overlap | worst pair 0.04 (ceiling 0.5) |
| news, tiered | reported by 1440, citing an analysis it does not name in the text we read: 1,156 public schools closed last academic year; enrollment down ~1.4 million (2019-2024); under-18 population down ~2.1 million (2010-2025); a projected ~$11.5 billion a year in lost state funding by 2030-31; research that closures save less than expected and displaced students fall behind in reading and math. No side taken on funding, vouchers or immigration |
| applied to us | PoeTech is not a school and issues no diploma (`app/src/lib/study-guides.js:12-16`), so its homeschool guides are among the options the report names; every lesson has four bands (`app/src/__tests__/helpers/living-lesson-gate.js:26`) so a house learns one truth together |
| not read | the analysis and the research the newsletter cites (re-review 2026-11-27) |

## Impact

A family meets a hard statistic taught Word first: children are a heritage, not a line item (Psalms 127:3-5), never a word of shame to anyone waiting for a child (Psalms 113:9); the first school is the house, whatever school is used (Deuteronomy 6:6-7; Psalms 78:4-7; Proverbs 22:6); count the whole cost (Luke 14:28-30); not one of these little ones (Matthew 18:14; Mark 10:14-16), with a church response. Content only; no data or behavior changes. One new file and one new test; no shared catalog, dates, budget or order line was edited.

## Decision

`ll313-children-are-a-heritage-when-the-school-closes-the-house`, ORDER 313, ADDED 2026-11-13, Word first:

- **A heritage, not a line item** (Psalms 127:3-5; Genesis 1:28; Psalms 128:3; Zechariah 8:5), with **no shame on the ones who wait** (Psalms 113:9).
- **The first schoolhouse is the house**, and the elders have a seat in it (Deuteronomy 6:6-7; Psalms 78:4-7; Joel 1:3; 2 Timothy 1:5; 2 Timothy 3:15; Titus 2:3; Psalms 71:18; Proverbs 22:6).
- **Count the cost** (Luke 14:28-30; Proverbs 27:23): the savings counted, the costs not.
- **Not one of these little ones** (Matthew 18:5, 10, 14; Mark 10:14-16; Galatians 6:10): the church can reach the children who fall behind.
- **The Lamb who welcomed children**, the Eternal Son of Yahweh (Luke 2:52; John 1:29; Isaiah 54:13).

The child band carries no policy or money words. Two parables with invented people (Albuquerque; a Gangwon village); a ten-question quiz.

## Verification

`living-lessons-ll313-children-are-a-heritage-when-the-school-closes-the-house.test.js`: 15 cases, 9 from the shared gate (DR-1477) with 7 spine spans in every text, plus four dangers, each proven to catch with a planted defect: a newsletter figure without the word reported or 1440; a place teaching on fewer births without a no-shame line; policy or money words in the child band; another digest item drawn in. A fifth case pins the thread id and forward time in the file. `export const UNCHECKED` names what was not read. `re-review: 2026-11-27`: read the cited analysis and research if reachable, and correct any figure they overturn.
