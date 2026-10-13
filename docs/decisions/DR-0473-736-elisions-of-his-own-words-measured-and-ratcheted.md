# DR-0473 — 745 elisions of His own words, measured and ratcheted

- **Status:** accepted
- **Tier:** B (a series-wide integrity measure on quoted Scripture — the thing this house is least willing to get wrong — plus a new build gate)
- **Date:** 2026-09-18
- **Type:** app
- **Scope:** `scripts/quotation-integrity.mjs` (new), `app/src/lib/quotation-integrity-baseline.json` (new, shrink-only), `app/src/__tests__/quotation-integrity-gate.test.js` (new, 15 checks)
- **Principles:** VERIFICATION-DOCTRINE (DR-0076 §2 gates over claims, §3 proven-to-catch, §4 measure don't claim, §8 honest uncertainty), SPEAK-ESTABLISHED-FACT (DR-0100), PERPETUAL-IMPROVEMENT (DR-0075), the Word handled exactly (DR-0459, DR-0456)
- **Grounds:** DR-0459 (no ellipsis inside a quotation; the remedy is always a shorter genuinely-verbatim span), DR-0418 (the full-levels pass this was found inside), DR-0472 (L89, the first lesson drained), the title-in-narrative ratchet (the established shape for large authored debt)

## Why this exists

Two consecutive lessons in the full-levels pass turned out to be shipping the **same two defects**:

- **L89** (DR-0472) — its teen and senior bands each carried Hebrews 10:29 with an ellipsis standing in for the middle of His own sentence, and its senior band recited `(DR-0098: let the Word explain the Word)` at the reader.
- **L88** — two ellipses in the **adult** lesson (Luke 8:13, Ezekiel 36:26), and a senior band reciting **two** record ids.

Two in a row is not a coincidence, so rather than patch the pair, the series was measured.

## What the measurement says

Measured 2026-09-18 across all 172 lessons, in the fields a **reader** actually reads (`lesson`, `bigIdea`, `inApp`, the four bands, `anchor.theme`):

| | count |
|---|---|
| quoted spans carrying an ellipsis | **745** |
| …across lessons | **113 of 172** |
| genuine elisions of HIS WORDS (both sides verbatim in the corpus) | **704** |
| …of those, a CONTIGUOUS verbatim span covering the whole quotation exists | **679** |
| our own words wearing quotation marks (a different defect, same family) | **14** |
| fragments too short to judge — never asserted either way | **27** |
| lessons printing a `DR-nnnn` identifier at a reader | **44 of 172** |

**The 679 is the number that matters.** DR-0459's rule is that the remedy for a long quotation is always a shorter genuinely-verbatim span and **never** an elision. The measurement says that remedy is not merely desirable but *mechanically reachable* for 679 of the 704 real cases — and usually by quoting a little **more** of the verse rather than a little less, because the elided halves are very often contiguous in the text already.

**A correction to my own first number, recorded because a measurement is only as good as the scope stated with it.** An initial ad-hoc probe reported 736 spans / 696 real / 671 contiguous across 53 reciting lessons. It counted `benefits` and skipped `anchor.theme`. The module's scope is narrower and deliberate — the facilitator is a steward of the house, and a record id is not noise to him — so the gate's numbers above are the ones that govern. The two sets never disagreed about the *shape* of the problem, only its edges.

## The decision: a ratchet, not a sweep

**745 replacements are 745 judgement calls.** Each needs the right contiguous span chosen by reading the verse, and the sentence around it re-read so the prose still works. Doing that by script would satisfy a counter and damage the one thing this house is least willing to damage.

This is the identical reasoning `title-in-narrative.mjs` already gives for its 468 unnamed bands, and the reason this repo forbids a blind God→Yahweh sweep (DR-0210's bright line). So:

- today's counts **freeze as recorded debt**;
- a **new** offender fails the build;
- a field that **gains** elided spans counts as new too — otherwise a recorded field would be a licence to add more, and the debt could grow without the ratchet noticing;
- entries come **out** as the full-levels pass reaches each lesson, never in.

**L89 is the first lesson drained** and is deliberately absent from both baselines. Its teen and senior bands now quote Hebrews 10:29 **whole** — the fix was never to drop the verse, it was to give the reader all of it — and its senior band states the rule in plain words. A check holds all three facts, so a future edit that puts either defect back reports L89 as fresh.

## Why the DR-id leak is in the same record

It is the same question from the other side: **is the reader being given His words, with our bookkeeping kept out of his way?** A lesson that opens by citing its own internal decision record has stopped speaking to the person in front of it. The rule being cited was right every single time — that is what makes it a presentation defect rather than a doctrinal one, and why the remedy is to say the rule in plain words rather than to delete it.

## The evidence

- **The gate: 15 checks, green.** Five of them test the *measure itself* before anything is measured with it — that a real elision of Luke 8:13 is classified `scripture` **and** reports its contiguous span as available, that our own phrasing in quotes is classified `ours`, that a clean quotation is never reported however long, that a two-word fragment is `undecidable` and never asserted (DR-0076 §8), and that the facilitator field is out of scope on purpose.
- **The committed baseline is asserted to equal the live measurement**, so it cannot become a painted number.
- **The baseline is asserted to stay honest about itself:** `scripture` must exceed `ours`, and `contiguousAvailable` must exceed 90% of `scripture`. If that ever inverts, the note beside the data has become untrue and the gate says so.
- **Proven-to-catch, twice:** reintroducing the Hebrews 10:29 ellipsis into L89's senior band is reported fresh; reintroducing `(DR-0098: …)` is reported fresh; and **adding** an ellipsis to a field that already has recorded ones is reported fresh.
- `npm run verify` green with the gate in place.

## What is NOT claimed, and what is left

**No claim is made that any of the 745 elisions misrepresents the sense of its verse.** Most were plainly made to keep a long quotation readable, by authors quoting carefully. The defect is that an elision inside quotation marks presents His words as continuous when they are not, and DR-0459 already settled that this house does not do that. This record adds the measurement and the containment; it makes no accusation about intent.

**The 745 are not fixed here, and that is a deliberate deferral with a date.** The drain is the full-levels pass (task #21), which reaches these lessons one at a time and already carries the discipline. At the pass's current rate the recorded debt falls with each lesson; L89 took it from 114 lessons to 113.

**`re-review: 2026-11-18`** — by then the pass will have drained enough lessons to show whether lesson-by-lesson is fast enough, or whether the remaining elisions need their own dedicated pass with a human reading each replacement span. If the count has not moved materially, that is the finding and the answer is a dedicated pass, not a faster ratchet.
