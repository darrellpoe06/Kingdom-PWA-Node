# DR-0485 — L173 gets four real bands, and a proven-to-catch that went stale the moment it worked

- **Status:** accepted
- **Tier:** B (lesson content across the whole corpus reader path, plus a gate change)
- **Date:** 2026-09-18
- **Type:** content
- **Scope:** `app/src/lib/living-lessons-class.js` (ll173 youth + senior bands re-authored, eight alignment edits), `app/src/lib/band-differentiation-baseline.json` (20 -> 19 entries), `scripts/band-differentiation.mjs` (`ratchetDifferentiation` now reports `stale`), `app/src/__tests__/band-differentiation-gate.test.js` (13 -> 17 checks)
- **Principles:** EVERY-BAND-IS-THE-WHOLE-MESSAGE (DR-0418), VERIFICATION-DOCTRINE (DR-0076 §3 proven-to-catch, §4 measure don't claim), PERPETUAL-IMPROVEMENT (DR-0075)
- **Grounds:** DR-0484 (the measure that found this), DR-0470 (L173 itself)

## What he said

Darrell, 2026-09-18: *"Last lessons don't have diversity of lessons for all reading levels... why not? Fill up the lessons and don't stop or not always do all of these lessons for each group asap."*

DR-0484 turned that into a measure and a number: **20 of 94 four-band lessons share half or more of their authored 8-word phrases between two bands.** L173 was the worst of them — youth and teen at **0.99**, teen and senior at **0.98**. Four labels, one lesson.

## What was done

The **youth** and **senior** bands of `ll173-humility-is-the-strength-no-shame-and-feelings-that-arrive-late` were written from scratch rather than edited. Youth enters through school, a team, a group chat and a first job; senior enters through the longer view, mentoring, and the passages that are harder at sixty than at sixteen — what Daniel 1 does and does not establish, the counted descent of Philippians 2, the six itemised movements of 2 Corinthians 7:11 read as things the Corinthians **did**, and the obligation to hand the lane on.

All **67 quoted spans survived verbatim in each band**, each with its own reference. Nothing was elided to make room (DR-0459).

## Measured, before and after

| | before | after |
|---|---|---|
| worst pair | **0.99** (youth~teen) | **0.16** (youth~teen) |
| child~youth | 0.12 | 0.09 |
| teen~senior | 0.98 | 0.10 |
| child~senior | 0.12 | 0.03 |
| word-count share (child/youth/teen/senior) | 0.97 / 1.00 / 1.08 / 1.26 | 0.97 / 0.99 / 1.08 / 1.07 |
| FK ladder (child / teen / senior) | 3.2 / 7.1 / 7.2 | 2.1 / 6.4 / 6.7 |
| short bands | none | none |
| elided quotations | 0 | 0 |
| recorded duplication debt | 20 lessons | **19 lessons** |

L173's own gate — 181 checks, break-harness proven — ran **39 failed, then 18, then 8, then 0**. Where a check and the new prose disagreed, **the prose moved.** Those checks encode what the lesson must say and were proven against deliberate breaks; widening thirty-five regexes to fit new wording would have quietly lowered the bar the checks exist to hold. Two of the failures were not wording at all: both new bands had dropped the week's-work exercise entirely, which the checks caught as missing content.

## The finding: a proven-to-catch anchored to a defect we intend to fix

The differentiation gate's live check read:

> `expect(l173.pairs['youth~teen']).toBeGreaterThanOrEqual(0.9)`

It was written the same day, with a comment predicting exactly this: *"either the lesson was genuinely re-authored — in which case it leaves the baseline and this check is updated deliberately — or the measure has gone blind."* **Fixing the lesson broke the gate.** That is the correct behaviour and it is worth naming, because the tempting move is to delete the check and ship.

Three things were done instead:

1. **Re-anchored** to the worst row the corpus still carries, computed rather than hard-coded, with a failure message naming it. When the last duplicate is repaired this check fails, a person reads it, and retires it deliberately — a silent green never stands in for a cleared debt.
2. **Recorded the repair** as its own check: L173 is under the ceiling, may not drift back, and is no longer in the baseline.
3. **Closed the hole the re-anchoring exposed.** The ratchet reported `healed` by walking the rows it **measured**, so a baseline entry for a lesson that was renamed or removed could never heal and would have sat in the file for ever, inflating `lessonsDuplicated`. `ratchetDifferentiation` now also reports `stale`, and two new checks assert it: one proven-to-catch on a fabricated id, one on the real baseline. A healed lesson must now leave the baseline **in the same commit** — the same discipline the anchor gate applies to its owed list, where an allowance nobody lowers becomes an exemption.

This is the fourth check-that-never-looks in two days, and the same question found all four: **what does this check NOT read?** Here it was: `healed` never read the ids it was not already measuring.

## What remains

Nineteen lessons still carry the debt. `ll172-the-spirit-of-your-mind` is next at 0.99 (teen~senior), then ll82 and ll91 at 0.86, ll81 at 0.83, ll149 at 0.78, ll100 at 0.76, ll99 at 0.75. The pattern is unchanged from DR-0484: **youth~teen is the dominant failing pair** because the youth band was added later (DR-0418) and cloned from teen rather than written, so most of the remaining repair is a youth-band job.

Differentiation is not abbreviation. The full-levels floor and the reading ladder stay in force at the same time, and L173 clears all three.
