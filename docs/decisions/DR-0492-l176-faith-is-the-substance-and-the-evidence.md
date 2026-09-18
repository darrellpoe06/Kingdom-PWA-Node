# DR-0492 — L176: faith is the substance and the evidence, and He made me then died for me

- **Status:** accepted
- **Tier:** B (lesson content plus a new gate)
- **Date:** 2026-09-18
- **Type:** content
- **Scope:** `app/src/lib/living-lessons-class.js` (L176 added; `LIVING_LESSONS_META.weeks` 174 -> 175), `app/src/__tests__/living-lessons-l176-verses.test.js` (new, 73 checks), `app/src/__tests__/learn-crosslist.test.js` (catalog pin 534 -> 535)
- **Principles:** SPOKEN-TEACHINGS-ARE-BUILD-INPUT (2026-07-03), EVERY-BAND-IS-THE-WHOLE-MESSAGE (DR-0418), VERIFICATION-DOCTRINE (DR-0076 §3 §4), TEACH-THE-WORD-DO-NOT-DEBATE-IT (DR-0098), YAHWEH-IN-OUR-VOICE-NEVER-IN-A-QUOTATION (DR-0210 / DR-0076)
- **Grounds:** DR-0484 (band differentiation), DR-0459 (no ellipsis inside a quotation), DR-0483 (the whole-module walk)

## What he said

Darrell spoke this in three pieces and marked it a lesson:

> "Faith is the substance of things hoped for, evidence of things not seen, and Yahweh loves it."
> "Without faith it is impossible to please Yahweh."
> "He made me and then died for me, so I want to please Him — why not — and I'm sure it'll be the best."

Every clause carries a verse under it, quoted whole. Forty-two references are cited across the five texts; thirty-six of them appear in **every** band.

## The five things this lesson could most easily have got wrong

1. **Faith taught as a feeling.** Hebrews 11:1 gives two NOUNS, both from building and from law. Every band now says what the sentence does NOT contain.
2. **The objection dodged.** "Faith is belief without evidence" is what the reader will actually be handed; it is answered by the definition itself, which puts faith in the evidential seat.
3. **Gullibility taught by accident** — the easiest failure of a faith lesson. 1 John 4:1 and 1 Thessalonians 5:21 are in every band, named as coming from the same hand to the same reader.
4. **Faith as a quantity to accumulate.** The apostles asked for MORE and He answered with a grain of mustard seed. Every band carries the size teaching and the connection reading.
5. **A technique for getting things.** Hebrews 11 closes on people whose promise never arrived and calls it a good report. Every band carries that half — **the child band included**, because it is the half the grieving reader came for.

## Measured before it was gated

| band | prose words | share of adult | Flesch-Kincaid | rendered movements |
|---|---|---|---|---|
| child | 1,389 | 0.83 | 1.69 | 16 |
| youth | 1,739 | 1.04 | 4.27 | 17 |
| teen | 1,782 | 1.07 | 6.88 | 17 |
| senior | 2,600 | 1.56 | 7.39 | 22 |
| adult | 1,666 | — | — | 17 |

Floors are child 0.5 and 0.6 for the rest; the ladder child < teen < senior holds (1.69 / 6.88 / 7.39) and the child band is under the 5.0 ceiling a NEW lesson is held to. Band differentiation worst pair **0.07** against a 0.50 ceiling — the four bands are four lessons, not one wearing four labels.

## Two real catches, both from this session's own instruments

**A quotation that was not His, in ten places.** The first draft wrote Luke 17:6 as *"a grain of **a** mustard seed"*. The KJV carries "a grain of mustard seed". The error had spread to Matthew 17:20 in three bands, to a benefit, and to a quiz explanation — and **four of the ten sat outside the five reader texts**, where a gate that reads only `lesson` and `levels` would never have looked (the DR-0483 blind spot). The whole-module walk found all ten.

**Seven movements a reader would never have seen.** The renderer promotes a standalone caps clause of 2-9 words that heads real prose (`lesson-format.js`). Seven of the adult band's headings ran to 10-13 words, carried an em dash, or sat glued behind a reference parenthesis — so they rendered as body text and their movements vanished from the page while every other gate stayed green. Three of the senior band's did the same. All were repaired and the per-band movement count is now pinned exactly, not as "at least N".

## The gate, proven to catch

`living-lessons-l176-verses.test.js` — 73 checks. Every claim check reads OUR prose with quotations **and** their reference parentheses stripped, so no check can be answered by the verse standing beside it; no alternation branch is a title keyword (faith, substance, evidence, made, died are all title keywords here).

Six deliberate breaks, six caught:

| break | caught |
|---|---|
| a corrupted quotation of Hebrews 11:1 | yes |
| a band that stops saying the definition holds no feeling | yes |
| a heading widened past the renderer window | yes |
| "Yahweh" swept into a KJV quotation | yes |
| a quoted span stripped of its reference | yes |
| the painted week count left behind at 174 | yes |

The bright line of DR-0076 / DR-0210 is asserted in both directions in the same file: our prose says Yahweh in every reader field, and the KJV's own "Lamb of God" is required to survive untouched inside its quotation.
