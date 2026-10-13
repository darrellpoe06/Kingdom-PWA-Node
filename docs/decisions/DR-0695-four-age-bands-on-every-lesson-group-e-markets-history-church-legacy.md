# DR-0695 — Four age bands on every lesson: group E (markets, history, church, legacy)

- **Status:** accepted
- **Tier:** A
- **Type:** content
- **Date:** 2026-09-30
- **Scope:** the band fields (`levels.child`, `levels.youth`, and where the gates required it an opening line on `levels.teen` / `levels.senior`) of eleven catalog courses: `stocks`, `bonds`, `world-market`, `investing`, `history-truth`, `church-offices`, `legacy-provisions`, `ai-legal-blueprint`, `prophetic-voices`, `handed-forward`, `word-out`; `app/src/lib/course-band-coverage-baseline.json` (regenerated from a fresh scan of the real catalog in each PR); the `allFour` pin in `app/src/__tests__/course-band-coverage.test.js`.
- **Principles:** VERIFICATION-DOCTRINE, WORD-FIRST, PERPETUAL-IMPROVEMENT, DECISION-RECORDS
- **Grounds:** DR-0597 and DR-0675 (the four-band shape a catalog course carries: historical-research-1619, who-he-is); DR-0076 (every number measured, every quote verbatim); DR-0100 (claim-tiering kept as the lesson has it); DR-0210 (Yahweh in our voice, the KJV untouched inside quotes). One record for the group; a line per course as it lands.

## Context

Darrell, 2026-09-30:

> "Do we have all the lessons for each lessons age groups yet? If not, why not when that has been requested and required?!"

The answer was no. Four age bands (child, youth, teen, senior) were already required of Living Lessons and of the rebuilt courses, but most catalog courses carried only teen and senior. The work was split into five groups; this record is group E.

## What was measured

On `origin/main` at `a2ff2d66`, `app/src/lib/course-band-coverage-baseline.json` recorded 398 catalog-course lessons across 43 courses, with 22 carrying all four authored bands. Every one of group E's eleven courses carried zero four-band lessons: 76 lessons in all, most with teen and senior and no child or youth.

Each lesson is measured with the house's own band gates, the same functions `infra/nas-lesson-builder/band_gates.mjs` and the who-he-is tests run:

- **full-levels** (`scripts/full-levels.mjs`): each band's authored prose, quotes removed, as a share of the adult lesson: child at least 0.5, youth, teen and senior at least 0.6;
- **reading-level** (`scripts/reading-level.mjs`): Flesch-Kincaid grades rise child ≤ youth ≤ teen ≤ senior, and child reads at or under grade 5.0;
- **band-differentiation** (`scripts/band-differentiation.mjs`): no two bands share half their 8-word shingles;
- **title-in-narrative** (`scripts/title-in-narrative.mjs`): each band names its lesson in its first 200 characters;
- **quoted-verse-is-the-verse**: every quoted span is the KJV verse it names.

Before this work the existing teen and senior bands in these courses did not all pass: several teen bands sat under the 0.6 share, and most teen and senior bands did not name their lesson near the start.

## Impact

A child or youth reader opening one of these 76 lessons was served the teen text, or the adult lesson, with nothing written for their age. That is the gap Darrell named.

## Decision

Author a child and a youth band on every lesson in the eleven courses, as faithful retellings of that lesson for the age: no new doctrine, no invented figures, no investment advice beyond the lesson's own, historical voices and claim tiers kept as the lesson has them. Every Scripture quote in a new band is lifted verbatim from the lesson's own already-verified quotations and checked against `app/public/bible/kjv`. Where an existing teen or senior band failed a gate, the smallest fix was made: an opening sentence that names the lesson, which also lifts a short band over its share floor. Nothing else in teen or senior was rewritten. Course blurbs that said "two reading levels" now say four.

Per course, as it lands:

| Course | Lessons banded | PR | Merge SHA |
|---|---|---|---|
| stocks | 8 of 8 | (this PR) | (on merge) |
| bonds | 8 of 8 | (this PR) | (on merge) |

## Verification

- `infra/nas-lesson-builder/band_gates.mjs` `gateDraft` run on every lesson of each course: all gates pass (share, grade order, child ceiling, overlap, title, verse).
- stocks: grades child 1.0–2.0, youth 2.9–4.8, teen 4.9–6.2; shares child 0.52–0.59, youth 0.62–0.69, teen 0.60–0.73.
- bonds: grades child 0.5–2.6, youth 3.4–4.7, teen 4.9–6.5; shares child 0.51–0.58, youth 0.61–0.70, teen 0.60–0.73.
- `course-band-coverage-baseline.json` regenerated from a fresh scan of the real catalog in each PR: stocks and bonds add 16 to `allFour` (54 → 70 on the main they merged onto, after group D’s courses landed).
- Tests: `course-band-coverage`, `course-bands-reach-the-reader`, `band-differentiation-gate`, `stocks-course`, `bonds-course`, `the-plain-meaning-comes-first`, `quoted-verse-is-the-verse`, `adversary-is-never-capitalized`, `decision-chain`.

re-review: 2026-10-07 (every group E course banded and merged, the table above complete).
