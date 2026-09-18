# DR-0488 — Two reference-dense lessons, and the difference between editing a band and writing one

- **Status:** accepted
- **Tier:** B (lesson content on the corpus reader path)
- **Date:** 2026-09-18
- **Type:** content
- **Scope:** `app/src/lib/living-lessons-class.js` (ll149 youth + senior, ll99 youth + senior), `app/src/lib/band-differentiation-baseline.json` (14 -> 12), `app/src/lib/quotation-integrity-baseline.json` (700 -> 698 elided spans)
- **Principles:** EVERY-BAND-IS-THE-WHOLE-MESSAGE (DR-0418), VERIFICATION-DOCTRINE (DR-0076 §4 measure don't claim), NO-ELISION-IN-A-QUOTATION (DR-0459)
- **Grounds:** DR-0484, DR-0485, DR-0486, DR-0487

## The measurement that made the point

`ll99` wanted two bands. I wrote the senior band, believed it was fresh, and measured it: **teen~senior 0.65 before, 0.66 after.** It had gone *up*.

What I had actually done was take the teen band and insert senior-specific asides into it — the exact defect this whole pass exists to remove, committed by the person removing it, one lesson after writing a decision record about it. It survived my own reading because reading it back felt like reading something new; every sentence had a clause I had put there.

The rewrite that followed re-conceived every sentence rather than editing it. Same seven movements, same sixteen required quotations, same doctrine, same order. **0.66 -> 0.10.**

That contrast is the useful artifact here, because it isolates the variable. The content was held constant. The only thing that changed was whether the sentences were *written* or *adjusted*, and the measure separates those two by a factor of six. **"I rewrote it" is a claim; the overlap number is the evidence, and they disagreed.**

## Measured

| lesson | worst before | worst after | bands written |
|---|---|---|---|
| ll149 cultural-competency | 0.78 (youth~teen), 0.53 (teen~senior) | **0.46** | youth, senior |
| ll99 watch-and-be-ready | 0.75 (youth~teen), 0.65 (teen~senior) | **0.20** | youth, senior |

Recorded debt **14 -> 12 lessons**. Gates green: ll149's two gates 90 checks, ll99's 42. Ladders rise in both (ll149 child 1.6 < teen 5.8 < senior 6.6; ll99 child 3.1 < teen 4.7 < senior 6.2).

**ll149 is the weakest repair of this pass and is recorded as such.** Its remaining pairs sit at **0.45 and 0.46** — under the 0.50 ceiling, but close to it. The honest reason: that lesson carries roughly fifty required quotations per band in a near-fixed order, and its own gate pins about thirty claim phrases per band on top of that. The spine is genuinely shared, so the authored prose between the references tracks more closely than it does in a looser lesson. It passes, and it is better than it was, but it is re-registered more than it is re-conceived. **re-review: 2026-10-16** — revisit ll149's youth and senior bands once the lessons below 0.75 are cleared, and see whether different worked examples can be introduced without breaking its reference spine.

## A second finding: an un-elided quotation is not automatically a verbatim one

ll99's bands carried `"That ye be not soon shaken in mind, or be troubled... Let no man deceive you by any means" (2 Thessalonians 2:2-3)` — an elision, which DR-0459 forbids. Removing the ellipsis produced a span that was **not verbatim**, because 2:2 and 2:3 are not contiguous: real words sit between them and the join silently deleted them.

The gate caught it. The fix is the one DR-0459 actually asks for and the one that is easy to skip: **two separate spans, each verbatim, each carrying its own reference** — `"That ye be not soon shaken in mind, or be troubled" (2 Thessalonians 2:2)`, then `"Let no man deceive you by any means" (2 Thessalonians 2:3)`. Deleting an ellipsis is not the remedy; finding the honest span is.

That repair shrank the quotation-integrity baseline from **700 to 698** elided spans — the second time in this pass that work aimed at one baseline moved another (DR-0487).

## What remains

Twelve lessons, all now under 0.75. The two-pair lessons are cleared; what is left is mostly single-pair `youth~teen`, which is one band each.
