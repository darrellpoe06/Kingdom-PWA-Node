# DR-1665: Blessings That Overtake You is a full lesson: why they pursue, and Who sends them

**Date:** 2026-11-26
**Status:** Accepted
**Tier:** B (lesson content; every quotation verbatim from the corpus)
**Type:** content
**Area:** `app/src/lib/eternal-algorithms-teaching.js` (`gh-obedience-blessing`), `app/src/lib/learn-presentation/learn-integrity-baseline.json` (that lesson only)
**Sent in by:** Darrell, 2026-11-26 09:26 (phone), on "Why Would Blessings Hunt You Down Instead of the Other Way Around?": "This should and could have more lesson in the lesson before the parables... Fix it... actually answer the questions more rigorously... clarification on Why and Who He Is."
**Pairs with:** the full-lesson series (#2903, #2904; "no short one minute lessons"), DR-0098 (teach the Word), DR-0210 (Yahweh in our voice), DR-0076 (verbatim)

## Context

The lesson was assembled from its pattern card (`godhead-study.js`): Deuteronomy 28:1-2, the Key Teaching, one 3D line and one outcome line, then straight into the parable. It never answered the question its own title asks, and never named who sends the blessing.

## What was measured

- Before: the lesson rendered the anchor verses plus about 40 words of teaching before the parable; no age versions of its own (the card-built teen and senior only).
- The card's IF / THEN, 3D line, outcome, quiz and two stories are kept unchanged.

## Decision

An authored lesson (the established `eternal-algorithms-teaching.js` mechanism) that teaches, Word first, before the stories:

1. **The question in the Word's own terms:** blessings "overtake" the one who hearkens (Deuteronomy 28:1-2).
2. **The same word runs both ways:** curses "overtake" too (28:15); Galatians 6:7. Consequences pursue in both directions.
3. **Who He Is:** the Father of lights (James 1:17), the covenant-keeper who gives power to get wealth to establish His covenant (Deuteronomy 8:18; 7:9), whose eyes run to and fro to show Himself strong (2 Chronicles 16:9), whose goodness and mercy follow (Psalms 23:6; 84:11). Blessing pursues because the Father pursues His children.
4. **Why hearing is the condition, not payment:** 1 Samuel 15:22; John 14:21; grace first (Ephesians 2:8-10).
5. **Why chasing fails:** Haggai 1:6; Proverbs 10:22; Psalms 127:2; Matthew 6:33.
6. **Jesus, who hearkened:** obedient unto death (Philippians 2:8), made a curse for us (Galatians 3:13-14), every promise yea in Him (2 Corinthians 1:20).
7. **What blessing is and is not:** every part of life (Deuteronomy 28:3, 6); not a vending machine (James 1:12).
8. **Engineer the hearing:** Romans 10:17; James 1:22. Then talk about it together, all three ways.

Four age versions, each teaching the same points at its level. Measured word counts: adult, then bands: 1664 child:244 youth:788 teen:877 senior:931.

## Impact

- The lesson now answers its title before the parable, rigorously and from the Word. Every verse was filled from `app/public/bible/kjv` by `scripts/fill-verses.mjs` (77 tokens; none refused).
- The integrity baseline is re-measured for this lesson only (L342 stays set aside, as the baseline intends).

## Verification after merge

- `eternal-algorithms-teaching.test.js` + `eternal-algorithms-course.test.js`: 45 of 45: every quotation verbatim, 20+ references, Yahweh in our voice, no bare quotes, all three talk-together directions in every band, the reading ladder, the adult full length, the child window, every band a 60% share.
- 29 lesson-reading suites (quotation integrity, reading level, catalog snapshot, typography, no-repeat): 709 of 711 before the baseline re-measure, 8 of 8 baseline after.
- Not yet read by Darrell in the app.

`re-review: 2026-12-03`
