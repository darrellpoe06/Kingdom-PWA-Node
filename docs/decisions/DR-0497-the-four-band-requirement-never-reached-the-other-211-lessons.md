# DR-0497 — The four-band requirement never reached the other 211 lessons

- **Status:** accepted
- **Tier:** B (a new measurement over content the whole school serves)
- **Date:** 2026-09-18
- **Type:** verification
- **Scope:** `scripts/course-band-coverage.mjs` (new), `app/src/lib/course-band-coverage-baseline.json` (new), `app/src/__tests__/course-band-coverage.test.js` (new, 13 checks)
- **Principles:** EVERY-BAND-IS-THE-WHOLE-MESSAGE (DR-0418), VERIFICATION-DOCTRINE (DR-0076 §2 §3 §4), TERMS-CHANGE-NOT-THE-NEED (DR-0496), PERPETUAL-IMPROVEMENT (DR-0075)
- **Grounds:** DR-0496 (L178, written the same day and the reason this was looked for), DR-0484 (the band-differentiation ratchet), DR-0418 (the floors)

## The finding

Darrell, 2026-09-18: *"Fill up the lessons and don't stop or not always do all of these lessons for each group asap."* **His words were about the lessons and the groups, not about one series.**

Three ratchets hold the four-band requirement — `full-levels` (share of the adult lesson), `reading-level` (the FK ladder) and `band-differentiation` (four versions rather than one repeated four times). **All three scan `LIVING_LESSONS_MODULES` and nothing else.**

Measured across the whole catalog:

| | count |
|---|---|
| lessons outside the Living Lessons series | **211** |
| carrying all four authored bands | **0** |
| carrying at least one band | 168 |
| carrying **adult text only** | **43** |

The 43 are whole courses at a time: `ai` 8 of 8, `mathematics` 8 of 8, `rent-to-own-business` 8 of 8, `development` 8 of 8, `little-learners` 6 of 6, `broadcast` 5 of 9. A child who opens one of those is handed the adult words by `resolveForAge`'s fallback, silently, and no gate in the house has ever said so.

## Why this is DR-0496's own subject, committed by the instruments

L178 was written earlier the same day: a renamed problem is not a fixed one, and a measure that has stopped measuring was renamed rather than retired. The three ratchets are green, and they are green **because of what they do not look at**. A defect no instrument reports reads as a defect that does not exist — which is *"Peace, peace; when there is no peace"* (Jeremiah 6:14) expressed as a test suite.

Finding this was not luck. It was the direct result of writing that lesson and then asking the question the lesson demands about our own instruments.

## What this ships, and what it deliberately does not

**It counts, honestly, and refuses to let the count get worse.** That is the smallest thing that turns an invisible need into a visible one.

**It does NOT impose the Living-Lessons floors on a paced course lesson.** That would be a *decision* rather than a measurement: a course lesson is a different artifact, authored to a stage arc rather than to four reading bands. Imposing the floors would also mean adding 211 entries to shrink-only baselines that may never be added to — the exact abuse those baselines exist to prevent. Whether course lessons should carry four authored bands, and in what order, is Darrell's call on content, and it is now a call he can make against a number instead of an impression.

**Shrink-only from the first commit.** The baseline records the debt as it actually is: `total 211, allFour 0, adultOnly 43`, per course. A course that adds a bare lesson fails. A course that **loses** an authored band fails — the direction nobody watches. A whole new course arriving **unrecorded** fails, which is how 211 lessons got here unnoticed in the first place. And a recorded course that has vanished from the catalog is reported rather than left to inflate the totals for ever (the stale-entry lesson from DR-0488).

## Proven to catch

13 checks, four of them deliberate breaks, all four caught: a course that adds a bare lesson, a course that loses a four-band lesson, a brand-new unrecorded course, and a recorded course deleted from the catalog. Three more guard the measure itself — both row shapes a course can hand back, a course whose builder throws (reported as zero rather than crashing every other course's measurement), and the Living-Lessons ids excluded so the two measures never double-count.

## The open content decision, named with its number

Authoring four bands for 211 lessons is a body of work on the scale of the entire Living Lessons band pass. The 43 adult-only lessons are the sharp end, and `little-learners` (6 of 6) is the sharpest of all — it is the course written **for the youngest readers in the house** and it currently serves them adult-register text. That is the one I would take first. **re-review: 2026-10-16.**
