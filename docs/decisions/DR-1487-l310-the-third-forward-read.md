# DR-1487: L310 — the third forward, read and folded in

**Date:** 2026-11-13
**Status:** Accepted
**Tier:** A (one Living Lesson; content only)
**Type:** lesson
**Area:** Living Lessons (`app/src/lib/living-lessons/ll310-the-hidden-life-and-the-empty-chair.js`)
**Forwarded by:** Darrell, one newsletter with one word above it: Lesson
**Pairs with:** DR-1480 (L310, which recorded this forward as not read, `re-review: 2026-11-27`), DR-0610, DR-0098, DR-0100, DR-0076, DR-0331

## Context

DR-1480 built L310 from two 2026-11-13 newsletters and named a third forward of the same story as belonging to the lesson but not read: Morning Brew, Everyone's problem, 2026-11-10 (Gmail thread `1a1c5c35c2357a0f`, forwarded 2026-11-10 14:01Z, 08:01 Central). It has now been read, ahead of its re-review date. His only word above it is Lesson; it is rendered, never quoted. The newsletter's political aside about elections and data-center construction, and its sponsor block, are left out as irrelevant to the teaching.

## What was measured

| what | measured |
| --- | --- |
| reported by Morning Brew, 2026-11-10 | he admitted the affair himself on Sunday, 2026-11-08 (the Sunday L310 already names for the board's investigation); shares fell 4.3% on the Monday, nearly $230 billion of value; "no clear succession plan" (a second outlet and date for L310's empty chair); an analyst told a business television network the idea of replacing him was comedy; he resigned on 2026-11-12, two days after that issue ran |
| verses added | Proverbs 16:18 and Proverbs 27:1, 7 spans, every one filled by `fill-verses.mjs` from `app/public/bible/kjv`; anchor references 37 → 39 |
| length | adult 2,409 words; child 1,052; youth 1,281; teen 1,424; senior 1,496 |
| band shares | child 0.50, youth 0.60, teen 0.63, senior 0.62 |
| reading ladder | child 1.2, youth 4.5, teen 6.2, senior 8.6 |
| band overlap | worst pair 0.05 (ceiling 0.5) |

## Impact

L310 now teaches from all three forwards. The admission is set in its order, made on the day the thing was coming out, taught as a lesson about coming to the light first and never as a judgment of his heart (Proverbs 28:13, already in L310). A short new section, Too big to replace, teaches the presumption the Word warns against (Proverbs 16:18; Proverbs 27:1) and joins it to the empty chair: certainty that no one can replace a leader is why no one is ready to. The child band tells it simply, with no adult words. Only the public man is named; the analyst, his firm and the network are not. Content only; no data or behavior changes.

## Decision

Fold the 2026-11-10 forward into L310 in place, not as a new lesson (DR-0610: one story, one lesson). The provenance now names three forwards, all read; `UNCHECKED` drops the not-read caveat and keeps its 2026-12-13 items (the cited newspaper reports, the market figures, the spying suspicion, the Brooklyn cause), and adds that the analyst was read only as Morning Brew reported him. All the 2026-11-10 material is tiered as reported by Morning Brew (DR-0100, DR-0076).

## Verification

`living-lessons-ll310-the-hidden-life-and-the-empty-chair.test.js`: 16 cases, green. The provenance case now reads `provenanceFaults(src)`: every thread present AND no line still calling the 2026-11-10 forward unread. Proven to catch: on planted text (a missing thread; "not read in this build"; "nothing is drawn from it"; "the 2026-11-10 forward was not read") each is named, a cited newspaper "not read from here" is not, and the origin/main copy of the file is flagged. The gossip check now also bars the analyst's name, his firm and the network, with a planted case. `re-review: 2026-12-13` stands, from DR-1480.
