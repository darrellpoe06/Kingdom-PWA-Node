# 2026-10-12 — Living Lesson 240: He said it and did not do it

**Module id:** `ll240-he-said-it-and-did-not-do-it-the-offer-moses-refused-the-breach-he-stood-in-and-the-nation-made-of-the-children-they-gave-up-on`

**Record:** DR-0981 · **Course:** Living Lessons (devotional, self-paced) · **Added:** 2026-10-12

## Where it came from

Darrell sent a photograph of his own open Bible into this lane — Numbers 14:8-12
in the English Standard Version, every verse of that span marked in his own hand
— with one line over it:

> *"Lesson... He said! 'I will make of you a nation greater and mightier than they.'"*

and then, while it was being built, the question that set its structure:

> *"Did that happen or is it happening according to the Word?"*

The sentence he isolated is the last line inside his own highlight, and it is
Yahweh's sentence, not Moses'.

## What the lesson answers

Both halves, because the chapter requires both:

| his question | the Word's answer |
|---|---|
| did it happen? | **Not to Moses** — he refused the offer twice (Exodus 32:10; Numbers 14:12) and stood in the breach instead (Psalm 106:23); *"I have pardoned according to thy word"* (14:20) |
| did it happen? | **Yes, to that generation, slowly** — 14:22-23, 14:29, forty years |
| was a greater nation made? | **Yes — out of the excuse.** Their reason for turning back was their children (14:3); *"But your little ones, which ye said should be a prey, them will I bring in"* (14:31) |
| is it happening? | **Yes, and the Word says so itself** — 1 Corinthians 10:11-12; Hebrews 3:19 names the cause as unbelief, not giants |
| and now? | **An Intercessor who never steps out of the gap** — Moses died outside the land (Deuteronomy 34:4-5), but *"he ever liveth to make intercession for them"* (Hebrews 7:25) |

## Shape

Twelve numbered movements in the adult lesson, all four age bands, two
parables, thirteen benefits, a twelve-question quiz, fourteen facilitator
points, and TALK ABOUT IT TOGETHER in the lesson and in every band — all three
directions, each with the skill and the rhythm, with Deuteronomy 6:7's four
places named rather than cited.

33 distinct verses, each fetched from `app/public/bible/kjv` and compared before
the lesson was generated.

## Three things worth keeping from the build

1. **The verse check earned its keep before the lesson existed.** 1 Peter 2:9
   was typed as *"an holy priesthood"*; the corpus says *"an holy nation"* — the
   one word the lesson turns on. Caught by comparing the table against the
   corpus, and now the pinned test's proven-to-catch case.
2. **A green on a missing module is worth nothing.** The first insert landed in
   `LIVING_LESSONS_SESSION_FLOW` rather than `LIVING_LESSONS_MODULES`. The file
   parsed, and the talk-direction check reported every band whole while the
   lesson was not in the catalog. The test now asserts the module exists before
   asserting anything about it.
3. **The band floors are measured on authored prose, not raw words.** Raw counts
   cleared the floors; `scripts/full-levels.mjs` strips quoted spans, by which
   the youth band was 43 words short. Fixed by authoring a movement it genuinely
   lacked (Caleb's *"another spirit"*, and Hebrews 3:13's daily remedy), not by
   padding.

Also: regenerating `full-levels-baseline.json` would have deleted its historical
note for no gain, so it was reverted and left untouched.

## Open

- Whether it reads well aloud to a child in his house. That is his reading, not
  a test. `re-review: 2026-10-19`.
