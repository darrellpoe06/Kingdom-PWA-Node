# DR-0795 — Every band sends you to someone, not only the module: the three directions are counted where the reader meets them

- **Status:** accepted
- **Tier:** A (a gate widened and tightened; two lessons gain one sentence each, nothing is removed)
- **Type:** fix
- **Date:** 2026-10-07
- **Scope:** `app/src/lib/talk-together.js` (the two elder-side patterns widened; `missingDirections`, `placesMissingDirections`, `hasAllThreeEverywhere`, `everyBandCoverage`, `TALK_PLACES`), `app/src/lib/talk-together-baseline.json` (ratcheted, with a new `everyBand` number), `app/src/__tests__/talk-together.test.js` (the per-band gate and six proven-to-catch cases), `infra/nas-lesson-builder/band_gates.mjs` and `infra/nas-lesson-builder/lesson_gates.py` (the draft gate refuses a short band on both layers), `app/src/lib/sovereign-ai-class.js` (sov34's lesson prose), `app/src/lib/living-lessons-class.js` (ll207's senior band), `docs/templates/builder-brief.md`
- **Principles:** DR-0733 (every lesson sends you to someone), DR-0076 (measure, don't claim; proven-to-catch), DR-0075 (perpetual improvement), DR-0669 (the draft is gated with the very functions CI runs)
- **Grounds:** DR-0733 is Darrell's own rule, 2026-10-01: *"Always prompt the parents to have the kids discuss this and vice versa... Friends to each other just relationships to relationships so we can all get healthy together."* The gate that enforces it pooled the whole module, so a reader who only ever reads one band could be sent nowhere and the lesson still read whole.

## Context

SHOULD: every lesson carries three prompts — parents to children, children to parents, friend to friend (DR-0733, `app/src/lib/talk-together.js:22`). ARE: `hasAllThree` calls `ownPrompts`, which pools the module — the parents direction is searched in the adult prose and the senior band, the children direction in the young bands, the friend direction anywhere (`talk-together.js:97-99`). A reader reads ONE band. So one band could carry the friend line, another the parent line, and the module read whole while a teen who only ever opens the teen band is sent to no one. GAPS: three, below — two in the lessons, one in the instrument itself. CLOSE: the directions are now counted in each place a reader actually reads, and the elder-side patterns recognise how the senior band really speaks.

## What was measured

Measured 2026-10-07 on the real catalog (608 lessons, 13 bound by the rule — added on or after 2026-10-01), per place rather than pooled:

| what | measured | basis |
| --- | --- | --- |
| bound lessons whole in every band, before | 10 of 13 | `placesMissingDirections` over `buildCatalogCourseDescriptors()` |
| ll207, senior band | short of parents **and** children | the band speaks to the elder in the second person: "Ask your children and grandchildren…" |
| ll208, senior band | short of parents **and** children | same, plus "Ask your **own** parents" — the pattern required "your parents" adjacent |
| sov34, lesson prose | short of children | its talk block had Parents and Friends; nothing sent a child upward |
| ll207 and ll208 after widening the patterns alone | ll208 whole; ll207 still short of children | the instrument was the thing that was short for ll208 |
| bound lessons whole in every band, after | 13 of 13, and 14 of 14 once sov36 landed mid-flight | the same measurement on the merged head |
| the catalog's pooled count | `all` 14 of 609 (the baseline said 0) | `talkTogetherCoverage`; the ratchet was never set to the truth |

**Honest uncertainty.** `all` is 14 of 609 because the rule binds only lessons added on or after 2026-10-01; the 595 older lessons are served the standing prompts built from their titles, which is by design (DR-0733) and is not measured as a gap here. Whether those older lessons should be backfilled is not decided by this record.

## Impact

Unresolved: a lesson could ship with a band that sends its reader nowhere, and the gate would call it whole. Two senior bands and one lesson prose were in exactly that state, and the senior band's own way of speaking — addressing the grandparent directly — was being counted as an absence. Resolved: every place a reader reads is counted by name, on the catalog gate in CI and on the NAS builder's draft gate in both layers, so a short band is refused before it is written rather than after; and the elder named as a grandparent, or addressed as one, now counts.

## Decision

1. **The directions are counted per place, not pooled.** `missingDirections(text)` names which of the three one piece of text does not send a reader in. `placesMissingDirections(module)` returns every place that is short — the lesson prose and each band the lesson actually ships — and `hasAllThreeEverywhere` is empty-means-whole. A band a lesson does not ship is not a gap.
2. **The elder side may be named or addressed.** The parents pattern now recognises the grandparent by name ("Grandparents, sit with the children and read it with them") and the second person, where the reader IS the elder ("Ask your grandchildren what this shows them"). The children pattern allows "your **own** parents" and an elder you trust. This is a widening: it can only add matches, never remove one.
3. **Two sentences were added, nothing was cut.** sov34's talk block gains a children-to-parents sentence; ll207's senior band gains the upward ask in the form ll208 already used. Both are in our voice and quote no Scripture, so no verse text changed.
4. **Both gates refuse a short band.** `hasAllThree` stays as the module gate; the per-band check runs beside it in `talk-together.test.js`, in `band_gates.mjs`, and in `lesson_gates.py` (the layer a NAS without node still runs). The baseline is ratcheted to the measured truth, with `everyBand` added, and may only rise.
5. **The brief says so.** `docs/templates/builder-brief.md` now tells a lesson builder to assert the three directions by their literal text on the lesson AND each band, names the proof that it catches, names the two generated files that must be regenerated rather than hand-edited, and names the `**Module id:**` line a lesson session note must carry.

Proven to catch (DR-0076), six cases on the JS side and two on the Python side: stripping ONE band's friend line leaves `hasAllThree(module)` green while the per-band check names the teen band; a band carrying nothing is named with all three directions missing; an absent band is not reported; the senior band's second-person form counts; a grandparent named counts; a sentence that merely mentions a family counts for nothing. On the real catalog, removing the one sentence added to ll207 fails the gate with `ll207…: senior is short of children` and fails the ratchet — both confirmed, then restored.

## Verification

- `talk-together.test.js` 16 green; `living-lessons-l207-verses.test.js` 12 and `sovereign-ai-sov34-verses.test.js` 21 green on the changed content; `builder-brief-template.test.js` 3 green; the NAS builder's Python suite 103 green including the new per-band case.
- On the live build after deploy: open L207 at Senior and sov34 at Adult, and read the close — the senior is sent to the children, to an elder, and to a friend; the adult is sent all three ways.
- re-review 2026-10-21: whether the lessons added before 2026-10-01 should carry their own three in every band, or keep the standing prompts. Not decided here, and the ratchet does not force it.
