# DR-1457 — Prove all things: sov77, built from one word over a daily A.I. digest

**Date:** 2026-11-12 · **Status:** accepted · **Tier:** A (additive lesson)
**Area:** Sovereign A.I., the lesson lane, verification doctrine
**Principles:** WORD-FIRST, VERIFICATION-DOCTRINE, PERPETUAL-IMPROVEMENT, SPOKEN-TEACHINGS-ARE-BUILD-INPUT
**Narrative + full measurements:** `docs/99-session-notes/2026-11-12-sov77-prove-all-things.md`

## Context

Darrell forwarded The Neuron's daily issue on 2026-10-27 at 19:34 UTC with ONE WORD above the forwarded header: **Lesson**. That word is the ask; the article is the occasion, not the foundation. Thread `1a17edb181a9c1f6`. **Sixteen days** stood between his word and this build, and the record keeps the gap. Both witnesses ran first (DR-1414 / DR-0610): no `Lesson-Captured` label on the thread, and `lesson-already-built.mjs` found nothing. The issue's own closing question was *how do you check the work?*

## What was measured

Band gate `fourBandFaults` returned `[]`. Shares of adult prose (3,018 words): child 0.506, youth 0.606, teen 0.644, senior 0.950. FK 1.68 / 3.82 / 5.39 / 9.83 — monotone, under every ceiling. Worst pairwise overlap 0.224 of a 0.25 ceiling. Three faults were measured and closed BY HAND (DR-1306): child 0.385 and youth 0.473 under floor, teen 6.66 over its ceiling. 51 refs on `anchor.ref`, all quoted and resolving in `app/public/bible/kjv`; 231 spans swept, each contiguous in its chapter; every verse FILLED by `scripts/sov77-fill.mjs` and none typed.

**Trust but verify (DR-0190 / DR-0100).** No primary host was read — `openai.com`, `arxiv.org` and `sec.gov` were unreachable at this session's egress boundary — so no figure rests on a primary-source read, said in every reader place with `re-review: 2026-11-26`. Checking CHANGED four things: the $80.75B loss is almost all a non-cash revaluation (~$72.39B fair-value change; **operating** loss near $693M); the digest UNDER-stated the revenue rise, about fourteen-fold rather than ~1,200 percent (DR-0100 §5); "Lean verified the result" is narrower than it sounds, the published scope note not covering the sharper running-time estimate; and a second laboratory's parallel result the same day was dropped. Two held and are stated plainly: 60,000 of ~223,000 full-time employees is 26.9 percent, and $1 / $5 tokens at half the larger model's rate.

## Impact

Sovereign A.I. gains week 77, `sov77-prove-all-things`, in all four bands from the first commit (P60), opening on 1 Thessalonians 5:21 and running eight movements, each from the Word. Two bright lines hold in every band: no stopwatch weighs a man, because Yahweh alone searches the heart; and the one Word proved all the way down is a Person, Jesus the Lamb of Yahweh. The Word is the ruler we measure other things by, never the thing on the scale (DR-0098).

## Decision

Build it once, Word first, verses generator-filled and never typed; place it in Sovereign A.I. because the occasion is a technology digest; name every blocked road in every reader place with a dated re-review; and state plainly the figures that survived checking, because under-claiming a verified truth fails truth too.

## Verification

- `app/src/__tests__/sovereign-ai-sov77-verses.test.js` — 46 tests passing, with proven-to-catch on the verse sweep (altered word, ASCII apostrophe, reordered span), on one band's friend line stripped alone (DR-0795), and on a stripped teaching thread. It closes the known gate gap for this file by checking our own prose for British spellings with quotations removed, leaving the KJV's *honour* and *neighbour* inside a quote untouched.
- Guards by name: `record-length-guard`, `business-systems-guard`, `re-review-ratchet-guard`, `format-guard`, `npm run lint`.
- `re-review: 2026-11-26` — return to the three blocked hosts and either read the primary sources or record the refusal again.
