# DR-0491 — The last four, the debt at zero, and a check that asked to be retired

- **Status:** accepted
- **Tier:** B (lesson content plus a gate change)
- **Date:** 2026-09-18
- **Type:** content
- **Scope:** `app/src/lib/living-lessons-class.js` (ll167 senior, ll94 senior, ll168 youth + senior, ll171 youth + senior), `app/src/lib/band-differentiation-baseline.json` (4 -> **0**), `app/src/__tests__/band-differentiation-gate.test.js` (live pin retired, replaced), `app/src/lib/quotation-integrity-baseline.json` (690 -> 685)
- **Principles:** EVERY-BAND-IS-THE-WHOLE-MESSAGE (DR-0418), VERIFICATION-DOCTRINE (DR-0076 §3 §4), SPOKEN-TEACHINGS-ARE-BUILD-INPUT (2026-07-03)
- **Grounds:** DR-0484 through DR-0490

## The debt is zero

Darrell, 2026-09-18: *"Last lessons don't have diversity of lessons for all reading levels... why not? Fill up the lessons and don't stop."*

DR-0484 measured twenty lessons at or above the 0.50 ceiling, two of them at 0.99. **All twenty are repaired.** Across the whole 94-lesson four-band corpus:

| | at DR-0484 | now |
|---|---|---|
| lessons at or above 0.50 | **20** | **0** |
| worst in the corpus | 0.99 | **0.48** |
| median worst-pair | 0.15 | **0.15** |

The median did not move, which is the right result: the corpus was never broadly duplicated. It had twenty specific lessons carrying a specific defect, and the defect is gone. Thirty-one bands were written in total.

This last group: ll167 senior (0.58 -> 0.47), ll94 senior (0.54 -> 0.46), ll168 youth + senior (0.54 -> 0.43), ll171 youth + senior (0.59 -> 0.43).

## The finding: I made the same mistake three times, and stopped trusting myself

Writing a band by *simplifying or expanding the neighbouring band sentence by sentence*, believing it fresh, and measuring it worse than before:

- **ll99 senior** — 0.65 before, **0.66 after** (DR-0488)
- **ll94 senior** — 0.54 before, **0.71 after**
- **ll168 youth** — 0.54 before, **0.62 after**

Three times. Each time it read as new work, because every sentence had a clause I had put in it. **Intention cannot detect this and neither can re-reading.** After the second occurrence I stopped relying on either and built `overlap.mjs` and `shared-sentences.mjs`: the first reports how many words of a band sit inside a run shared with its neighbour, the second prints the **original, un-normalised sentences** so they can actually be edited.

With the diff in hand the repairs became mechanical and reliable: ll94 0.71 -> 0.40, ll168 youth 0.62 -> 0.17, ll171 youth 0.59 -> 0.34 with two passes. **The lesson generalises past this task: when a claim is about something measurable and I have already been wrong about it twice, the next step is an instrument, not more care.**

## An honest floor, named

ll171 carries roughly **420 words of Darrell's own spoken directive**, rendered in our prose, and every band must carry it. That is not duplication to be edited away — it is his word, and DR-0331 governs it. Several of the largest shared runs in that lesson are exactly those sentences and were deliberately left alone. Lessons built on a long spoken directive have a floor the measure will always see, and the honest response is to name it rather than paraphrase his words to move a number.

## The check that asked to be retired

DR-0485's live pin was written to **fail when the debt reached zero**, so that a person would read it and retire it rather than a silent green standing in for a cleared debt. Today it did exactly that, with the message *"the debt is cleared — retire this check deliberately"*.

It is retired, and the retirement is kept in the file with its whole history, because deleting it would erase why this gate is trusted. In its place:

1. **A self-renewing proof.** A corpus at zero has no live offender to point at, so one is manufactured on every run: a real lesson is taken, its teen band cloned into its youth band, and the scan must report it at 0.9 or above and the ratchet must list it as fresh. This keeps the guarantee the pin gave — the measure is wired to the real corpus, not only to fixtures — and it cannot go stale.
2. **A witness naming all twenty.** Every repaired lesson must stay under the ceiling and stay out of the baseline. It is what fails first if any of them regresses.

## What is left, and it is not debt

Seven lessons sit between 0.45 and 0.48 — under the ceiling, and closer to it than the corpus median of 0.15. Three are repairs from this pass (ll167 0.47, ll94 0.46, ll149 0.46) and the rest were always there (ll83 0.48, ll101 0.48). They are reference-dense lessons where a shared spine of quotations and pinned claim phrases leaves less room between the verses. **re-review: 2026-10-16**, with ll149 (already dated in DR-0488) — look at whether different worked examples can be introduced without breaking their reference spines. Lowering the ceiling below 0.50 is not proposed and should not be, until that question is answered with prose rather than with a number.
