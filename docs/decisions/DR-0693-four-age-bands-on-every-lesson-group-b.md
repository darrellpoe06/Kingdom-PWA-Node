# DR-0693 — Four age bands on every lesson: World Issues, Made in Time, Datasystems, Healthy Living, Project Management (group B)

- **Status:** accepted
- **Tier:** B
- **Type:** word
- **Date:** 2026-09-30
- **Scope:** the lesson `levels` of five catalog courses (`app/src/lib/project-management-course.js`, `healthy-living-course.js`, `datasystems-course.js`, `made-in-time-course.js`, `world-issues-class.js`); `app/src/lib/course-band-coverage-baseline.json` (regenerated from a fresh scan in each commit); `app/src/__tests__/course-band-coverage.test.js` (allFour pinned as a floor); new gate `app/src/__tests__/course-four-bands-hold.test.js`.
- **Principles:** VERIFICATION-DOCTRINE, WORD-FIRST, DECISION-RECORDS, DR-NUMBER-ALLOCATION (and, by record: speak established fact, DR-0100; Yahweh in our voice, quoted KJV untouched, DR-0210)
- **Grounds:** CLAUDE.md (Typographic Theology; Verification Doctrine; Nothing Waits, DR-0236); DR-0418 (full levels); DR-0544 (band differentiation and the youth rung); DR-0417 (the new-lesson child ceiling); DR-0100 (World Issues keeps its tiers); DR-0677 (counts are derived).

## Context

Darrell, 2026-09-30, verbatim: "Do we have all the lessons for each lessons age groups yet? If not, why not when that has been requested and required?!"

The four-band requirement (child, youth, teen, senior) was held only inside the Living Lessons series. Measured on `origin/main` the same day (`course-band-coverage-baseline.json`): 398 catalog-course lessons across 43 courses, and only 22 carried all four authored bands. The work was split across five lanes; this record is group B, which owns five courses and 75 lessons: world-issues (19), made-in-time (18), datasystems (14), healthy-living (12), project-management (12).

## What was measured

Every lesson in the five courses was scanned with the house's own instruments (`scripts/full-levels.mjs`, `reading-level.mjs`, `band-differentiation.mjs`, `title-in-narrative.mjs`, `quoted-verse-is-the-verse.mjs`) before any band was written:

- **project-management:** 12 lessons, teen and senior only; no adult `lesson` text, so the share measure has nothing to divide by; 11 of 12 lessons had a teen or senior band that did not name its lesson in its opening.
- **healthy-living:** 12 lessons, teen and senior only (both full, 0.8 to 1.4 of the adult text); 10 unnamed.
- **datasystems:** 14 lessons, teen and senior only, both short (teen 0.32 to 0.44, senior 0.39 to 0.67 of the adult text).
- **made-in-time:** 18 lessons, child, teen and senior, every band under a third of the adult text; 11 child bands over the child ceiling or out of order.
- **world-issues:** 19 lessons, child, teen and senior (issue 10 had no senior), every band 0.03 to 0.17 of the adult text; 11 child bands over the ceiling.

## Impact

A child or youth reader opening any of these 75 lessons was served either a band written for someone else or the adult text through the fallback. Where bands existed they were too short to carry the lesson, so a reader at any age got a fragment of it.

## Decision

1. Every lesson in the five courses carries all four bands, each one a faithful retelling of THAT lesson for that age: no new doctrine, no new claims, the lesson's provenance kept, and World Issues keeps its claim tiers (a verdict stays a verdict, an allegation stays an allegation, DR-0100) in every band.
2. Every band passes every measure the Living Lessons are held to: present; at or over the full-levels floor share of the adult prose (child 0.5, others 0.6) where the lesson has an adult text; reading grades in order child, youth, teen, senior; child at or under grade 5.0; no two bands sharing half their 8-word shingles; the lesson named in each band's opening; every quotation followed by a reference verbatim from `app/public/bible/kjv`, and no name of the Godhead lowered in our voice.
3. Those measures are committed as a gate, `course-four-bands-hold.test.js`, with zero as the committed number of failures and no baseline. A course joins its `BANDED_COURSES` list in the same commit that bands it.
4. `course-band-coverage-baseline.json` is regenerated from a fresh scan of the real catalog in every commit, never hand-edited. The literal `allFour` pin in `course-band-coverage.test.js` becomes a floor, because five lanes land in parallel and the exact number is already pinned against the live scan in the same file.
5. One PR per course, each off a fresh `origin/main`; one line per course is added below as it lands.

## Verification

- **project-management (12 lessons):** child and youth authored for all 12; the teen and senior openings of 11 lessons now name their lesson. Measured: child grade 0.8 to 2.9, youth 3.2 to 6.4, every lesson ordered child < youth < teen < senior; worst band overlap 0.31; every quoted span verbatim. `course-band-coverage`: allFour 38 to 50 (on top of group D, DR-0696), adultOnly 37 unchanged. Gate `course-four-bands-hold` green with 6 proven-to-catch cases (missing band, child over the ceiling, a copied band, an unnamed band, a quotation that is not its verse, a lowered name).
