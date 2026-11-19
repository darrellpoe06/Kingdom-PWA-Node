# DR-1561: Let there be search made (L327)

**Date:** 2026-11-18
**Status:** Accepted
**Tier:** A (one Living Lesson in its own file; no schema, no shared line touched)
**Type:** decision
**Area:** `app/src/lib/living-lessons/ll327-let-there-be-search-made.js`, its gate test
**Sent in by:** Darrell, 2026-11-18, a forwarded email under one word, Lesson (thread `1a1f08c4f3f6ef1f`)
**Pairs with:** DR-0076, DR-0098, DR-0100, DR-0210, DR-0331, DR-0610 (one teaching, one lesson), DR-1477 (the shared gate)

## Context

A workplace staff bulletin of federal updates from a large public university:
a final accreditation rule, a proposed fee on a work-training program for
international students, a regional federal archive set to close, proposed
changes to a historic-preservation review, and an FAQ on how a federal public
comment period works. Workplace mail: taught generically. No institution,
office, city, person, link, figure or date appears in the lesson.

## What was measured

- **Not already built (DR-0610):** `lesson-already-built.mjs --thread` returned
  terms-only matches. No lesson teaches public comment or Ezra 5-6. L277 (Look
  at the Record) cites Ezra 6:2 in passing; Advocacy names board public comment.
  New here: the comment period as a lawful voice, and the findable record.
- **Provenance, tiered:** the four policy items are *reported* by the bulletin,
  read only as the intake session generalized them; the comment-period outline
  is the bulletin's own FAQ. The rulemaking statute (5 U.S.C. 553) was not read
  back: www.law.cornell.edu did not resolve here. Both named in `UNCHECKED`.

## Decision

1. **Placement: Living Lessons.** The per-file pipeline (DR-1468) builds there;
   the teaching is a civic practice for any household, not a course module.
2. **Word first, one story.** Ezra 4:24-6:15: the governor's fair letter and
   one plain ask (Ezra 5:17; Proverbs 18:13, 17), the work not stopped while it
   waited (Ezra 5:5; Daniel 6:10), the roll found far from the builders (Ezra
   6:1-3; Habakkuk 2:2; Jeremiah 32:14), the decision after the search (Ezra
   6:7-14; Proverbs 25:2; 21:1).
3. **No sides staged (DR-0098).** The rules themselves are not argued; the
   lesson teaches the manner of a lawful voice (1 Timothy 2:1-2; Romans 13:7;
   Acts 22:25; 25:11; Titus 3:2; Luke 12:3) and a household's own records.

## Impact

L327 joins the catalog by auto-discovery: how a believer speaks before a rule
binds, and keeps the record that proves what was promised.

## Verification

- L327 gate **9/9**: five-span spine in all five texts, 124 quotations filled
  from the corpus and verbatim, Yahweh in our voice, talk-together in every
  place, band shares at or above the floor, a rising ladder, two parables,
  ten questions; title-in-narrative gate green.
- **Caught, not claimed:** the first run failed band shares in all four bands
  and the parents direction in child and teen; each fixed and re-measured.
- 118 suites that cite the lesson's verses, plus the catalog-wide verse,
  token and gate suites, 5,033 tests green; lint run before push.

`re-review: 2026-12-18`: read the gate on main; read 5 U.S.C. 553 when the host is reachable.
