# DR-0497 — The four-band requirement never reached the other 211 lessons

- **Status:** accepted
- **Tier:** B (a new measurement over content the whole school serves)
- **Date:** 2026-09-18
- **Type:** verification
- **Scope:** `scripts/course-band-coverage.mjs` (new), `app/src/lib/course-band-coverage-baseline.json` (new), `app/src/__tests__/course-band-coverage.test.js` (new, 17 checks)
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
| carrying **no authored band at all** | **43** |
| of those 43, reading **above grade 9** in the text actually served | **5** |

The 43 are whole courses at a time: `ai` 8 of 8, `mathematics` 8 of 8, `rent-to-own-business` 8 of 8, `development` 8 of 8, `little-learners` 6 of 6, `broadcast` 5 of 9. Whoever opens one of those gets the single `lesson` field through `resolveForAge`'s fallback, and no gate in the house has ever said so.

## The correction the count itself needed

**The first version of this record claimed more than the measurement supports, and this section is the correction.** It said *"a child who opens one of those is handed the adult words"* of all 43, and named `little-learners` the sharpest end because it serves the youngest readers. Then the text was measured (Flesch-Kincaid on our prose, quoted Scripture stripped exactly as the reading-level ratchet strips it):

| course | bandless lessons | median grade of the served text | above grade 9 |
|---|---|---|---|
| `little-learners` | 6 | **0.3** | 0 |
| `mathematics` | 8 | **1.5** | 0 |
| `development` | 8 | 6.3 | 0 |
| `ai` | 8 | 7.1 | 1 (`wk3-the-test` 10.3) |
| `rent-to-own-business` | 8 | 7.1 | 0 |
| `broadcast` | 5 | **12.4** | 4 (up to 16.3) |

So the honest reading is a split, not one debt. `little-learners` opens *"Hello! Let us learn three letters. And we will learn them from the Bible."* — that is pre-K register already; its missing bands are a **label** gap, not a register gap, and it is not the sharpest end of anything. `broadcast` at 12.4, rising to 16.3 on `bc6-bandwidth-network`, is the real defect: **5 of 43**, not 43 of 43.

This matters beyond the wording. "43 lessons hand adult words to children" would have sent the first authoring pass at `little-learners`, which needs it least, and left `broadcast` — where a young reader genuinely cannot reach the text — untouched. An over-claim does not merely overstate; it misdirects the work. DR-0076 §1 (no claim without evidence) and §4 (measure, don't claim) are the rules broken, and the same day's L178 is the lesson: a count that has stopped distinguishing was renamed, not retired.

**The distinction is now instrumented, not remembered.** `servedGrade` measures the text a bandless lesson actually serves, `ADULT_REGISTER_CEILING = 9.0` is the line past which the fallback stops being survivable, and `adultRegister` is ratcheted per course beside `adultOnly`. A baseline row carrying no register number is reported as unrecorded rather than waved through, so the dimension cannot quietly stop being watched.

## Why this is DR-0496's own subject, committed by the instruments

L178 was written earlier the same day: a renamed problem is not a fixed one, and a measure that has stopped measuring was renamed rather than retired. The three ratchets are green, and they are green **because of what they do not look at**. A defect no instrument reports reads as a defect that does not exist — which is *"Peace, peace; when there is no peace"* (Jeremiah 6:14) expressed as a test suite.

Finding this was not luck. It was the direct result of writing that lesson and then asking the question the lesson demands about our own instruments.

## What this ships, and what it deliberately does not

**It counts, honestly, and refuses to let the count get worse.** That is the smallest thing that turns an invisible need into a visible one.

**It does NOT impose the Living-Lessons floors on a paced course lesson.** That would be a *decision* rather than a measurement: a course lesson is a different artifact, authored to a stage arc rather than to four reading bands. Imposing the floors would also mean adding 211 entries to shrink-only baselines that may never be added to — the exact abuse those baselines exist to prevent. Whether course lessons should carry four authored bands, and in what order, is Darrell's call on content, and it is now a call he can make against a number instead of an impression.

**Shrink-only from the first commit.** The baseline records the debt as it actually is: `total 211, allFour 0, adultOnly 43, adultRegister 5`, per course, with each course's median bandless grade beside it. A course that adds a bare lesson fails. A course that **loses** an authored band fails — the direction nobody watches. A whole new course arriving **unrecorded** fails, which is how 211 lessons got here unnoticed in the first place. And a recorded course that has vanished from the catalog is reported rather than left to inflate the totals for ever (the stale-entry lesson from DR-0488).

## Proven to catch

17 checks, six of them deliberate breaks, all six caught: a course that adds a bare lesson, a course that loses a four-band lesson, a brand-new unrecorded course, a recorded course deleted from the catalog, a bandless lesson whose text climbs above the adult-register ceiling, and a baseline row carrying no register number at all. Two more pin the register measure itself — quoted Scripture is stripped before scoring, and no prose returns null rather than a zero that would read as a perfectly easy lesson. Three more guard the band measure — both row shapes a course can hand back, a course whose builder throws (reported as zero rather than crashing every other course's measurement), and the Living-Lessons ids excluded so the two measures never double-count.

## The open content decision, named with its number

Authoring four bands for 211 lessons is a body of work on the scale of the entire Living Lessons band pass. The sharp end is **not** the 43 bandless lessons as a block — it is the **5 that read above grade 9**: `broadcast` `bc2` 12.4, `bc3` 14.0, `bc4` 11.5, `bc6` 16.3, and `ai` `wk3-the-test` 10.3. Those are the ones a young reader genuinely cannot reach, so `broadcast` is first and `ai wk3` is next. `little-learners` and `mathematics` keep their label gap and lose their priority, because the measurement says their text already meets the reader. **re-review: 2026-10-16.**
