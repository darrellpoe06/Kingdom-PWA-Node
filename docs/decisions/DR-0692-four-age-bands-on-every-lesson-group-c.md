# DR-0692 — Four Age Bands on Every Lesson, Group C: Nine Courses, Child, Youth, Teen and Senior on Every Lesson

- **Status:** accepted
- **Tier:** A
- **Type:** curriculum
- **Date:** 2026-09-30
- **Scope:** the `levels` of every lesson in nine catalog courses: `software-project-management`, `infrastructure`, `broadcast`, `business-research-wars`, `banking`, `buying-terms`, `financing-debt`, `inspections`, `insurance-risk` (78 lessons). `app/src/lib/course-band-coverage-baseline.json` and the `allFour` pin in `app/src/__tests__/course-band-coverage.test.js` are regenerated from a fresh scan of the real catalog in the same commit as each course.
- **Principles:** VERIFICATION-DOCTRINE, WORD-FIRST, PERPETUAL-IMPROVEMENT, DR-NUMBER-ALLOCATION, DECISION-RECORDS
- **Grounds:** CLAUDE.md, Nothing Waits (DR-0236); DR-0076 (measure, don't claim); DR-0100 (claim tiers kept as the lesson states them); DR-0210 (Yahweh in our voice, quoted KJV untouched); DR-0417 (the child band is ages 6 to 10, grade 5.0 ceiling); DR-0544 (youth sits between child and teen in the reading-grade order).

## Context

Darrell, 2026-09-30, verbatim: "Do we have all the lessons for each lessons age groups yet? If not, why not when that has been requested and required?!"

The answer, measured on `origin/main` from `app/src/lib/course-band-coverage-baseline.json`, was no: 398 catalog-course lessons across 43 courses, and only 22 carried all four authored bands (child, youth, teen, senior). The Living Lessons already carried all four. The work was split across five groups; this record is group C's share. One record covers the group, with a line per course as it lands.

## What was measured

Each band is measured by the house's own band gates (`infra/nas-lesson-builder/band_gates.mjs` `gateDraft`, the same measures the Living Lessons and Who He Is are held to):

- **full-levels share** of the adult lesson's own prose (quoted Scripture excluded): child at least 0.5, youth, teen and senior at least 0.6 (`scripts/full-levels.mjs`);
- **reading grades rise** child <= youth <= teen <= senior (Flesch-Kincaid on our prose, quotes excluded), and the **child band at or under grade 5.0** (`scripts/reading-level.mjs`);
- **overlap** between bands under 0.5 on 8-word shingles (`scripts/band-differentiation.mjs`);
- **each band names its lesson** in its first 200 characters (`scripts/title-in-narrative.mjs`);
- **every quoted span is the verse it names**, checked against `app/public/bible/kjv` (`scripts/quoted-verse-is-the-verse.mjs`).

Before this pass, the nine courses carried teen and senior (infrastructure carried child and senior) and **0 of 78** lessons carried all four. Many existing teen and senior bands also failed a gate the catalog had never applied to them: the share floor (teen under 0.6 in 26 lessons: 6 in banking, 8 in inspections, 8 in insurance-risk, 4 in broadcast), the title gate (most bands), one inverted teen and senior pair (bc5), and three infrastructure child bands above grade 5.0. Those were brought up in the same pass, because a band that fails its gate is not yet a band for that age.

Per course, as each landed (grades are child / youth / teen / senior ranges across the course's lessons):

| course | lessons | all four before | all four after | child grade | notes |
|---|---|---|---|---|---|
| software-project-management | 10 | 0 | 10 | 0.8 to 2.3 | no adult `lesson` field, so the share gate has no denominator here; the other gates all pass |
| infrastructure | 10 | 0 | 10 | 0.7 to 3.5 | child bands rewritten (share was 0.33 to 0.42, three above grade 5.0); senior bands extended to the 0.6 floor |

## Impact

A child, a youth, a teen and a senior opening any lesson in these courses get words written for their age, instead of the fallback. The bands are faithful retellings of each lesson: no new doctrine, no new figures, no new claims; where the lesson tiers a claim, the band keeps its tier. Money and property facts in child bands are the lesson's own, stated simply.

## Decision

Author all four bands on every lesson of the nine courses, measured by the house band gates, one PR per course (or two small courses together), each regenerating the coverage baseline from a fresh scan in the same commit.

What remains outside this record's reach, said plainly:

- **Pre-existing quotation debt outside the bands.** Some adult `lesson` fields quote Scripture in a wording that is not the KJV (for example infrastructure `inf6` "test everything, hold fast what is good", `inf9` "Who then is the faithful and wise manager?", `inf10` "to faithful people who will be able to teach others also"), and some lessons print `DR-nnnn` identifiers in reader text (recorded debt in `course-quotation-integrity-baseline.json`). The bands added here quote only verbatim KJV and add no record identifiers; the adult-field debt is not band work. **re-review: 2026-10-14.**
- **software-project-management has no adult `lesson` field,** so the full-levels share cannot be computed for it; the bands pass every other gate. **re-review: 2026-10-14.**

## Verification

- `gateDraft`-based measurement over each course's lessons: every band present, share floors met (where an adult lesson exists), grades rising with the child at or under 5.0, overlap under 0.5, every band naming its lesson, every band quote verbatim.
- `app/src/__tests__/course-band-coverage.test.js` against the regenerated baseline; `course-quotation-integrity.test.js`; `every-stage-reaches-the-reader.test.js`; each course's own suite; `decision-chain.test.js`; `npm run legibility`; `eslint`.
- After each merge, a Deploy (Cloudflare Pages) run whose `head_sha` equals the merge commit.
