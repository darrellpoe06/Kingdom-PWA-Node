# DR-1402: econ9 — The engine and the reserve: what the labor built, what cannot be counted, and a storehouse the community owns

**Date:** 2026-11-10
**Status:** Accepted
**Tier:** A (one course session; content only)
**Type:** lesson
**Area:** Kingdom Economics (`app/src/lib/economics-class.js`, `lesson-stories.json`)
**Sent in by:** Darrell, a spoken teaching, 2026-11-10
**Pairs with:** DR-0100 (state measured fact plainly; flag only the narrow dispute), DR-0076 (every verse fetched; every figure sourced), DR-0098 (teach the Word), DR-0331 (his words rendered for meaning), the course's own governor's correction (no muting of measured barriers)

## Context

He asked three things in one breath: how profitable the African American community has been for America since its inception; what the arithmetic would say had that engine of human work never existed; and what we can learn so that we become an engine for our own situations while still fueling other things. He said plainly he is not saying stop everything, and asked why a reserve cannot be set aside for our own community, outside government or anybody, what it would look like, and what it would need. Kingdom Economics already teaches ownership, circulation, group economics and the measured barriers, so this is its ninth session. He also said overlap brings clarity and repetition must not be boring, so the three shorter bands each carry a short "say it again" recap of the core.

## What was measured

- Band shares of the adult lesson's 1,245 words: child 0.53, youth 0.62, teen 0.62, senior 0.63. Reading grades rise child 4.4, youth 7.6, teen 8.2, senior 10.0 (adult 7.9). Worst band overlap 0.12. 40 quoted spans, 0 verse faults.
- Nine sources, each with claim, publisher, link and as-of date: the 1860 asset value, the export share, Craemer's unpaid-wage estimate, the Freedman's Savings Bank, Greenwood 1921, the 2022 wealth figures, the Free African Society, Maggie Lena Walker's bank, and the Olmstead and Rhode dispute.
- The figures were confirmed through web search results that name their sources. Two source hosts (the UConn magazine and the Fed partnership site) could not be opened from the build sandbox, and the lesson says so.

## Impact

The course now answers his question with measured history stated plainly. It names the one genuine dispute narrowly: the share of national growth that ran through cotton. It refuses to let that dispute erase the measured facts. It ends in a practical, Word-shaped design for a community reserve that a household or church can begin this week.

## Decision

`econ9-the-engine-and-the-reserve`, taught in this order:

- His question, then what is measured.
- The Word on wages (Jeremiah 22:13; Leviticus 19:13).
- What cannot be computed.
- Where the yield went: sent away empty, against Deuteronomy 15:13-14.
- The engine is still running.
- What a reserve needs: a weekly rhythm, governance by the contributors, no usury, a legal form the members own, more than one place to keep it, and teaching.
- What outside government means: owned and governed by the community, never hidden from the law (Romans 13:7).
- Still fueling everything else (Galatians 6:10; Jeremiah 29:7).
- The arithmetic, labeled as arithmetic, and what we did not check.

Two parables follow: The Shilling Box and Not Empty. The course moves to nine sessions.

## Verification

`economics-econ9-engine-and-reserve.test.js` runs 27 cases:

- the core measured facts in every band, and every source carrying publisher, link and date;
- the dispute named narrowly, hedge words refused, and the honest limit stated;
- outside government defined, and the reserve arithmetic recomputed.

It is proven to catch a dropped depositor count (the band is named), a wrong yearly total, an altered verse word and a straight apostrophe. `economics-class.test.js` now pins nine sessions, and the band baseline was re-derived (total 466, allFour 292, adultOnly 0).
