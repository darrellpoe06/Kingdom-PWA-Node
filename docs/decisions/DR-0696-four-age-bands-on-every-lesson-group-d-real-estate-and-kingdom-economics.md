# DR-0696 — Four age bands on every lesson, group D: the Real Estate courses, Kingdom Economics and the Sound Board

- **Status:** accepted
- **Tier:** A
- **Type:** content
- **Date:** 2026-09-30
- **Scope:** the lesson `levels` of ten catalog courses, one line per course below as each lands; `app/src/__tests__/fixtures/four-band-ladder.js` (new, the shared ladder); `app/src/__tests__/four-band-ladder.test.js` (new, proven-to-catch); each banded course's own test file (a four-band block); `app/src/lib/course-band-coverage-baseline.json` (regenerated from a fresh scan in the same commit); `app/src/__tests__/course-band-coverage.test.js` (the allFour pin).
- **Principles:** VERIFICATION-DOCTRINE, WORD-FIRST, PERPETUAL-IMPROVEMENT, DECISION-RECORDS
- **Grounds:** DR-0497 (the four-band requirement never reached the course lessons); DR-0544 (the youth band on the ladder); DR-0597 and DR-0675 (the two courses already carrying all four bands, the pattern followed here); DR-0076 (no claim without a measurement; proven-to-catch); DR-0100 (bands are retellings, never new claims); DR-0210 (Yahweh in our voice, the KJV untouched inside every quotation). Group D of five parallel band passes; DR-0693 to DR-0695 are left for the other groups' records.

## Context

Darrell, 2026-09-30:

> "Do we have all the lessons for each lessons age groups yet? If not, why not when that has been requested and required?!"

The answer was no. The ten courses in this group (kingdom-economics, leasing-tenants, maintenance-trades, management-stewardship, partnerships, property-principle, sound-board, taxes-records, evictions, appraisal) shipped with two bands: teen and senior on nine of them, child and senior on Kingdom Economics. A child or youth reader who opened any of their 80 lessons was handed a band written for someone else.

## What was measured

Measured on `origin/main` before any change, with the repo's own gate functions (`infra/nas-lesson-builder/band_gates.mjs`: full-levels share, the reading ladder, the new-lesson child ceiling, band differentiation, title-in-narrative):

- 398 catalog-course lessons across 43 courses; 22 carried all four bands.
- In this group: 0 of 80 lessons carried all four bands, and 0 of 80 passed the band gates.
- The existing bands also carried faults the new ladder would not let through: teen and senior bands that never named their lesson in their opening (most of the 72 Real Estate and Sound Board lessons), and a handful of quotations that did not match the KJV letter for letter (a capital letter where the verse has a lower-case one, in property-principle and management-stewardship teen bands).
- The teen bands in the Real Estate courses read at grade 1.7 to 6.0, so a child band under them has to read lower still. The ladder is strict (child < youth < teen < senior), so every child band here is written at roughly grade 0 to 2 and every youth band at roughly 1 to 3.

## Impact

Children and youth who open these courses now get the lesson told for their age rather than a teen or adult band. The families who teach these courses at home get four versions of every lesson rather than two.

## Decision

Every lesson in the ten courses carries all four bands. The new child and youth bands retell the same lesson at that age: the same Scripture, the same story, the same principle, no new doctrine and no new figures. Every quotation is copied from `app/public/bible/kjv` and checked against it. Where an existing teen or senior band did not name its lesson, one opening sentence naming it was added and nothing else in the band changed. The KJV-mismatch quotations were corrected to the verse's own letters.

One shared ladder (`fixtures/four-band-ladder.js`) holds all ten courses to the same measure, pinned in each course's own test: child at least half of the adult lesson's prose, youth, teen and senior at least 0.6 of it; child < youth < teen < senior; child at or under grade 5, teen at or under 6, senior at or under 10; no band a near copy (8-word shingle overlap over 0.25) of another band or of the adult lesson; every band naming its lesson in its first 200 characters; every band rendering without losing a word.

Courses, as each lands:

- **property-principle** — 8 lessons: child and youth written; teen and senior given a naming opening where they lacked one; three teen quotations corrected to the KJV's lower-case first letter.
- **management-stewardship** — 8 lessons: child and youth written; teen and senior given a naming opening where they lacked one; one teen quotation corrected (Nehemiah 5:15).
- **leasing-tenants** — 8 lessons: child and youth written; teen and senior given a naming opening where they lacked one.
- **maintenance-trades** — 8 lessons: child and youth written; teen and senior given a naming opening where they lacked one.

## Verification after merge

- `four-band-ladder.test.js` proves the ladder catches a missing band, a summary band, an inverted ladder, a band repeated under two names, and a band that never names its lesson, on a lesson that otherwise passes.
- Each course's test runs the ladder on every lesson; `course-band-coverage.test.js` matches the regenerated baseline exactly.
- After each merge, a Deploy (Cloudflare Pages) run whose `head_sha` equals the merge commit confirms the bands are live.

re-review: 2026-10-14 (any course in this group whose PR has not merged by then is re-measured and finished).
