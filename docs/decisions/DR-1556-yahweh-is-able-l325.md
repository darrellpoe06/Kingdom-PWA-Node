# DR-1556: L325 — Yahweh Is Able

**Date:** 2026-11-18
**Status:** Accepted
**Tier:** A (one Living Lesson; content only)
**Type:** lesson
**Area:** Living Lessons (`app/src/lib/living-lessons/ll325-god-is-able.js`, its own file per DR-1468)
**Forwarded by:** Darrell, Bishop Gwin's written daily proclamation, with one word above it: Lesson
**Pairs with:** DR-0610 (one teaching, one lesson), DR-1468 / DR-1477, DR-0210, DR-0331, DR-0098, DR-0076

## Context

Bishop Gwin (Senior Bishop, The Church Of The Living God) wrote a daily proclamation for Wednesday 2026-11-18, GOD IS ABLE, on 2 Corinthians 9:8. Darrell forwarded it into the app on 2026-11-18 at 18:18 UTC (Gmail thread `1a1efe1aa13c9c5c`) with one word above it, Lesson. The outline is his: the anchor verse, Genesis 1:1, and four points, each with its passages: not having enough (2 Kings 4:1-7; Proverbs 11:14), life redirected (Genesis 50:15-21), weakness (2 Corinthians 12:3-9), more than we think can be done (Ephesians 3:20; Daniel 3:16-18, 24-30). He closed with a Trivia of the Day from Isaiah 40:31.

One teaching, one lesson: `lesson-already-built.mjs --thread 1a1efe1aa13c9c5c` found no record of this thread; no lesson file, record or open `claude/lesson-*` branch is built on this proclamation. His sermon-transcript lessons (L124, L202, L203) are separate teachings and are not merged here.

Darrell asked in the forward whether the system can read an attached Word document. The intake read this one: the outline in the lesson came from the attachment, and it matches what he pasted into the body.

## What was measured

| what | measured |
| --- | --- |
| verses | 117 tokens filled by `fill-verses.mjs` from `app/public/bible/kjv`; 0 verse faults; 0 double-quoted spans without a reference |
| length | adult 721 prose words |
| band shares | child 0.55, youth 0.65, teen 0.63, senior 0.68 |
| reading ladder | child 1.6, youth 4.6, teen 5.2, senior 7.1 |
| band overlap | worst pair 0.00 (ceiling 0.5) |
| source, tiered | documented: the thread's subject and date (read from Gmail this session). Reported: the outline text, read by the intake from the Word attachment. Not compared: his NKJV wording, because every quotation here is the KJV |

## Impact

A learner walks Bishop Gwin's four points in his order, each taught from the passage he chose, read whole in the KJV. His headings say God; in our voice they are rendered with His name, Yahweh (DR-0210), never in quotes (DR-0331). The KJV text inside every quotation is untouched. His Trivia of the Day is one quiz item; the contest's address and prizes are not in the lesson. Nothing beyond his four points is taught as his. Content only.

## Decision

`ll325-god-is-able`, ORDER 325, ADDED 2026-11-18, titled Yahweh Is Able — Bishop Gwin's Four Places of Sufficiency. Word first: the anchor and Genesis 1:1; the widow's oil and the counsel she sought; Joseph's answer to his brothers; Paul's thorn and the grace that is sufficient; the doxology of Ephesians and the furnace, with the three young men's but if not. It closes on the anchor, as he did. Two parables with invented people (a light one on borrowed jars, a solemn one on a weaver sent away); a ten-question quiz.

## Verification

`living-lessons-ll325-god-is-able.test.js`: the shared gate (DR-1477) with 6 spine spans (the anchor and one for each point) in the adult lesson and every band, plus two lesson cases: the four points appear in his order, and the trivia item answers from Isaiah 40:31 with no contest details. The second case caught a stray word in the first draft before it shipped. `export const UNCHECKED` names what was not read back. `re-review: 2026-12-02`.
