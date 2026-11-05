# DR-1316: A lesson's gate may not claim to be the last lesson — pm13 held sov64's defect, and banking's look-alike is a contract rather than the same fault

**Date:** 2026-11-05
**Status:** Accepted
**Tier:** A (one test file; no product code, no schema, no money, no surface change — but it decides whether the next Project Management lesson can land without editing another lesson's gate)
**Type:** verification
**Area:** `app/src/__tests__/project-management-pm13-verses.test.js` (the position pin rewritten, two cases added)
**Found by:** the agent, reading sov65's build report. Its builder hit the identical fault in `sovereign-ai-sov64-verses.test.js`, fixed that one and its own, and recorded the class. This record asks the obvious next question — *where else?* — and measures the answer.
**Considered, not built:** none — this record builds no lesson and names no source thread.
**Pairs with:** DR-1314 (sov65, which found the class and fixed two instances), DR-1311 (sov64, whose gate carried it), DR-0610 / DR-1185 (the lesson-identity rules these gates serve), DR-0076 (§3 proven-to-catch, §4 measure don't claim, §8 honest uncertainty), DR-0975 / P46 (a gate that cries wolf is deleted within a day), DR-0621 (a flag is where the work starts), DR-0236 (nothing waits)

## Context

Building sov65, CI shard 4/4 went red on exactly one assertion in a file the build had not touched:

```
sovereign-ai-sov64-verses.test.js:215
expect(Math.max(...weeks)).toBe(64)
```

sov64's own gate asserted that **sov64 is the highest week in its course**. That was true of the tree it was written on and false the instant a week 65 existed. sov65's builder corrected it to what is durably true, fixed the identical over-claim in its own gate so sov66 never has to touch it, and named the class.

A class named once is worth a sweep. This record is the sweep.

## What was measured

Across every file in `app/src/__tests__/`, assertions that pin a maximum to a literal number: **six**.

| | |
|---|---|
| `the-cloud-highlight-keeps-moving.test.js` | `LENS.length - 1` — derived, not a literal. Not the fault. |
| `a-replay-must-not-re-create-a-dropped-constraint.test.js` | a 1000 ms constraint window, not a lesson position. Not the fault. |
| `living-lessons-ll257…` and `living-lessons-ll268…` | the assertion is **already gone**; what remains is a comment recording its removal. Previously fixed. |
| `banking-bank9-verses.test.js` | **looks like the fault and is not** — see below. |
| `project-management-pm13-verses.test.js` | **the one live instance.** |

**Why bank9 is NOT this defect, measured rather than assumed.** `banking-course.js` hardcodes `weeks: 9` and `format: 'Self-paced · 9 lessons · …'`. Banking **declares itself a nine-lesson course**, so the gate's `expect(numbers).toEqual([1..9])` and `Math.max === 9` are a *contract*: a tenth banking lesson is a deliberate course change that must update the stated count, and this gate correctly refuses an undeclared one. Changing it would have deleted a real check. It was nearly "fixed" on the strength of its shape before the declaration was read.

**Why pm13 IS the defect.** `project-management-course.js` derives its count — `get weeks() { return PROJECT_MANAGEMENT_MODULES.length; }`. The course is open, and it is a **live placement target for the Gmail lesson lane**: the Way routes project/organization material to Project Management. So a pm14 will arrive. Its gate asserted:

```js
it('the lessons run in numeric order and pm13 is the last of them', …)
  expect(Math.max(...nums)).toBe(13);
  expect(PROJECT_MANAGEMENT_MODULES[PROJECT_MANAGEMENT_MODULES.length - 1].id).toBe(PM13_ID);
```

Both claims are about **what does not exist yet**, which is not pm13's to assert.

**The cost shape, which is what makes this worth a record rather than a quiet edit.** A gate like this does not merely fail — it fails in *another lesson's file*, so the next builder's PR goes red on a test it never touched, and landing requires editing a neighbour's gate. That is how a build gets taught to edit other people's proofs to go green, which is the opposite of what a gate is for. sov65 paid one CI round for it; the next Project Management lesson would have paid the same.

## Impact

**One course is unblocked for its next lesson.** A pm14 can now land without touching pm13's gate.

**One look-alike was left alone, and that is the more useful half.** Four of the six matches were not the fault — two derived, two already fixed — and bank9 was a contract wearing the same shape. A sweep that had "fixed" all six on pattern would have deleted a real check and called it hygiene. The discriminator is not the assertion's shape; it is **whether the course declares its own length**.

**The rewrite is strictly stronger.** The old ascending-order check passed `[1, 2, 4]` — a gap in the course numbers. The replacement asserts contiguity from 1, which catches that, and still holds at any course length.

## Decision

**1. pm13's gate asserts its own position, never what follows it.** Contiguity from 1 with no gap; 13 present; pm13 at the thirteenth place; the header count still derived.

**2. The removed claim is recorded in the file, with the contrast.** The comment states what was asserted, why it was false, that Project Management is a lane placement target, and that banking's look-alike is a contract — so the next reader does not "fix" bank9.

**3. Two new cases carry the proof.** A proven-to-catch case showing the old check passed a gap and the new one does not, and a **forward-safe** case that simulates a pm14 landing, asserts every surviving claim still holds, and asserts the removed claim would now be false.

**4. bank9 is deliberately unchanged**, with the reason in this record rather than in a comment on a file this change does not touch.

## Verification

`project-management-pm13-verses.test.js` **39 cases** and `project-management-courses.test.js` **46** — 85 green together, run from inside `app/`, the only correct invocation since vitest from the repo root with `--root app` mis-resolves paths and manufactures failures.

**Proven to catch (DR-0076 §3), executable rather than asserted:** the gap case runs both checks against `[1, 2, 4]` and shows the old one passing and the new one throwing. The forward-safe case appends a 14 to the real course's numbers and shows contiguity, pm13's presence and pm13's place all still true while `Math.max === 13` is false — so the removal is justified by a measurement rather than by my reading.

**Honest limits.** This sweep covers assertions that pin a **maximum** to a literal. It does **not** cover every way a gate can claim to be last — an `at(-1)`, a hardcoded `length`, a "newest" fixture date, or a count asserted in prose would all escape it. I did not measure those classes and do not claim the suite is clean of them. `re-review: 2026-12-05`.

Nor does it check whether any *other* open course pins its length. Only the six maximum-pins were read; a course whose gate asserts a literal `MODULES.length` was not searched for.

## What this does not close

**The wider class.** Named above and dated. The honest version of this fix is a guard that knows which courses declare their length and refuses a position claim in the ones that do not — buildable, and larger than this change.

---
_Generated by [Claude Code](https://claude.ai/code)_
