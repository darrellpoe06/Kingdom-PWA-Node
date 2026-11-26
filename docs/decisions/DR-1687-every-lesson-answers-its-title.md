# DR-1687: every lesson answers the question its title asks

**Date:** 2026-11-26
**Status:** Accepted
**Tier:** A — additive reading layer; the author's rows stay byte-identical
**Type:** product
**Area:** `app/src/lib/lesson-title-answers.js`, `app/src/lib/lesson-title-answers/*.json`, `ChurchLearn.jsx` (mount), `lesson-title-answers.test.js`, `scripts/lesson-title-answers-audit.mjs`
**Pairs with:** DR-0127 (the Word first), DR-0076 (verify, never estimate), DR-0098, DR-0210, DR-0111
**Session note:** `docs/99-session-notes/2026-11-26-lessons-answer-their-titles-audit.md`

## Context

Darrell, 2026-11-26, from the new-look reader: *"This lesson is not clear... it
has a great title... it doesn't answer really."* Then *"Fix the lessons!!!!!!!"*,
and, correcting the brief: *"The titles pull people into the lessons!!!!!! That
worked.... I just needed to feel full after reading the lesson"*; *"Make sure
the lessons are still kept however make sure the also addresses the questions."*

The 976 display titles (mostly questions) were written after the lessons. A
lesson opened on its old framing and often never stated the answer the title
promised, or stated it mid-way and ended elsewhere.

## Decision

1. **Every presented lesson was read in full against its display title** and
   given a verdict and a one-line reason: ANSWERS-CLEARLY, ANSWERS-LATE-OR-
   BURIED, DOES-NOT-ANSWER, ANSWERS-BUT-ENDS-OPEN. The table is derived from
   the data by `scripts/lesson-title-answers-audit.mjs`; counts are measured.
2. **The titles stay.** No display title changed; the lesson is what gets fixed.
3. **The lesson is kept word for word, and wrapped**: `THE QUESTION IN THE
   TITLE.` answers the title plainly first; the author's text follows unchanged
   (a paragraph break before each of its own ALL-CAPS leads, no word changed);
   an optional short worked example in the lesson's own terms; the lesson's
   stories, untouched; then `BACK TO THE QUESTION.` lands the answer as the
   last thing read and heard (both readers and Read Aloud), so the reader
   finishes full. Teen and senior get their own opening and closing sentence.
   The Word still reads first (DR-0127): the anchor verses precede the answer.
4. **A layer, not a rewrite.** The additions live per course in
   `lesson-title-answers/<course>.json`, mounted in ChurchLearn beside
   `withWordQuotes`/`withSideStories`, so every reader (classic and new look)
   gets them and the author's rows stay byte-identical: the integrity baseline
   needs no re-measure. A lesson answered in its own source (buy2, PR #2942)
   is recognised and never doubled.
5. **Bright lines, checked by the gate:** additions hold no teaching the lesson
   does not; any quotation in them must be found character for character in
   that lesson's own text; our voice says Yahweh; adversary names lowercase.
6. **The gate** (`lesson-title-answers.test.js`, proven to catch): every
   presented lesson has an audited entry or the answer in its own source; each
   entry is sound against the author's text; as read, the lesson opens on the
   answer, keeps every author word, and ends on the answer. `PENDING_COURSES`
   is a shrink-only ratchet, empty now that all 976 are answered.

## Impact

A new display title can never again ship over a lesson that does not answer it.

## Follow-through

- Child and youth bands carry no title answer yet (teen, senior and adult do).
  re-review: 2026-12-10, once the adult/teen/senior wrap is read live.
