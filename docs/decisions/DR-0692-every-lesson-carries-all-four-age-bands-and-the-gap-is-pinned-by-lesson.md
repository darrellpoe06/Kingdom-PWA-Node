---
id: DR-0692
title: Every lesson carries all four age bands, and the gap is pinned by lesson until it is closed
status: accepted
date: 2026-09-30
tier: B
type: curriculum
declared_by: Darrell
scope:
  - scripts/course-band-coverage.mjs (the scan records which lessons lack a band; ratchetFourBands, shrinkFourBandAllowlist, serializeFourBandAllowlist, fourBandGateFaults)
  - scripts/course-band-baseline-write.mjs (new; regenerates the baseline and shrinks the allowlist from the real catalog, never by hand)
  - scripts/curriculum-gates.mjs (the NAS publish and snapshot gate refuses a new course lesson missing a band)
  - app/src/lib/course-band-four-allowlist.json (new; the 378 lessons missing a band on 2026-09-30, shrink-only)
  - app/src/lib/course-band-coverage-baseline.json (regenerated from a fresh scan; sorted)
  - app/src/__tests__/course-band-coverage.test.js, app/src/__tests__/curriculum-gates.test.js
principles: [VERIFICATION-DOCTRINE (DR-0076), PERPETUAL-IMPROVEMENT (DR-0075), NOTHING-WAITS (DR-0236)]
grounds:
  - DR-0497 — the course-band coverage ratchet (count, never worse)
  - DR-0509 — the teen+senior contract new courses were built to
  - DR-0597, DR-0675 — the first catalog courses carrying all four bands
---

## Context

Darrell, 2026-09-30, verbatim:

> "Do we have all the lessons for each lessons age groups yet? If not, why not when that has been requested and required?!"

The honest answer is **no**. And the why, said plainly, is three things, all ours:

1. **The gate only ever said "no worse."** `course-band-coverage.test.js` (DR-0497) counted the gap and refused to let it grow, but a course-level count that may not rise is not a rule that it must close. Nothing ever failed because a lesson lacked a band.
2. **New courses were built to a two-band contract.** From DR-0509 on, every new course landed carrying teen and senior only, and the ratchet recorded that as healthy ("adultOnly 0"). A hundred and more lessons arrived after the four-band requirement was stated, each one adding to the gap the requirement named.
3. **The backfill pass was never scheduled.** The baseline note called it "the standing band-authoring pass," but it had no owner, no date and no list, so it never ran.

## What was measured

From `origin/main` on 2026-09-30, through the real catalog (`LEARN_CATALOG`, Living Lessons excluded because their own ratchets hold them to four bands):

- **400** catalog-course lessons across 43 courses (398 in the morning's baseline; two lessons landed since).
- **22** carry all four authored bands: Who He Is 14, historical-research-1619 8.
- **37** carry none: ai 7 (wk3 has teen and senior), development 8, mathematics 8, rent-to-own-business 8, little-learners 6.
- **378** are missing at least one band. Per course: ai 8, ai-legal-blueprint 6, appraisal 8, banking 8, bonds 8, broadcast 9, business-research-wars 9, buying-terms 8, church-offices 7, datasystems 14, development 8, evictions 8, financing-debt 8, handed-forward 5, healthy-living 12, history-truth 8, infrastructure 10, inspections 8, insurance-risk 8, investing 8, kingdom-economics 8, leasing-tenants 8, legacy-provisions 7, little-learners 6, made-in-time 18, maintenance-trades 8, management-stewardship 8, mathematics 8, partnerships 8, project-management 12, property-principle 8, prophetic-voices 6, rent-to-own-business 8, software-project-management 10, sound-board 8, sovereign-ai 31, stocks 8, taxes-records 8, word-out 5, world-issues 19, world-market 8.
- **The band gates on the 22.** Measured with the house gates (full-levels share floor, reading ladder, child ceiling 5.0, eight-word shingle differentiation, title-in-narrative): all 14 Who He Is lessons pass. **All 8 historical-research-1619 lessons fail**: 7 have an inverted ladder (teen reads easier than youth, e.g. hr1-write-it-in-order-for-our-children youth 7.4, teen 1.9) and every band on 7 of them does not name its lesson near its start.

## Impact

A child, a youth or a senior opening 378 of the catalog's lessons got a fallback, not a lesson written for them. And the instrument that should have said so said "healthy." The number was visible; the rule that would have closed it did not exist.

## Decision

1. **Per lesson, from this commit.** The 378 lessons missing a band are pinned by id in `course-band-four-allowlist.json`. Any lesson not on that list that lacks child, youth, teen or senior **fails the build, by name, naming the missing bands**. A new lesson, a new course, or a banded lesson that loses a band all fail.
2. **The list only shrinks.** A pinned lesson that now carries all four must leave the list (the test fails until it does), its count may never exceed 378, and it may name no course that did not exist today. `scripts/course-band-baseline-write.mjs` regenerates the baseline and shrinks the list from the real catalog; it never adds, and it exits 1 on a fresh gap rather than excusing it. The list is written one id per line, one block per course, so five sessions shrinking five courses merge without a hand.
3. **A band is only a band if it passes the house band gates.** Every four-band catalog lesson must clear: share of the adult teaching (child 0.5, youth/teen/senior 0.6); the ladder child < youth < teen <= senior; child at or under grade 5.0; worst pairwise overlap under 0.5; every band naming its lesson in its first 200 characters. The 8 historical-research-1619 lessons are recorded as exempt, shrink-only, each required to still fail (or leave). **re-review: 2026-10-14.**
4. **The totals are floors, not exact pins.** `allFour` may only rise from 22 and `adultOnly` only fall from 37; the exact numbers live in the regenerated baseline, held to the live catalog.
5. **The NAS publish gate carries the same rule** (`curriculum-gates.mjs`, `four-bands ::`), so a lesson written by the NAS builder is held to it before the row is written.
6. **The backfill, scheduled across five groups working in parallel, each course its own PR:** Group A (this record): ai, development, mathematics, rent-to-own-business, little-learners (the 37 with no band at all), then sovereign-ai (31, youth on every lesson and child on 17). Groups B to E: the remaining 33 courses on the list above, split across four sessions. Each PR authors all four bands, removes its lessons from the list, and regenerates the baseline in the same commit. Progress lines are added below as each course lands.

**Beside DR-0697.** A parallel session landed DR-0697 the same afternoon, a course-level gap gate (`FOUR_BAND_GAP_CEILING`, frozen per-course ceilings). The two are complementary, not duplicates: DR-0697 holds each course's count of lessons without all four; this record holds each LESSON by id, names the missing bands in the failure, carries the rule to the NAS publish gate, and requires every four-band lesson to pass the house band gates. Both run.

## Verification

- `course-band-coverage.test.js`: 30 tests pass on the real catalog.
- **Proven-to-catch:** removing `wk2-good-questions` from the pinned list fails the build with *"ai/wk2-good-questions: missing child, youth, teen, senior"*; a synthetic new Who He Is lesson with youth blanked fails naming `missing youth`; a Who He Is lesson with child stripped fails naming `missing child`; a pinned lesson that has healed is reported; the regenerator does not add a fresh gap; a youth band cut to one sentence fails `youth share`; swapping youth and senior fails the ladder.
- `curriculum-gates.test.js`: a new course lesson published without youth is refused with `four-bands :: who-he-is/...: missing youth`.

## Progress

- 2026-09-30: the gate lands. Group D (DR-0696) landed first, banding property-principle and management-stewardship, so the gate lands at 38 of 400 carrying all four and 362 pinned; the allFour floor is 38.
