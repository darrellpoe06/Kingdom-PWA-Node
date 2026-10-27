# DR-1256: Every lesson's numbers are checked, not just the newest one's — five shipped lessons skip a point in front of a reader

**Date:** 2026-10-27
**Status:** Accepted
**Tier:** A (one check widened from a single subject to the whole catalog; a pinned, shrink-only debt list; no lesson prose altered)
**Pairs with:** DR-0281 (not one word may change — the formatter chooses break points, never words), DR-0712 (the author's own number is the number), DR-1025 (a check whose evidence can expire stops meaning something while still printing green), DR-0076 (§1 no claim without evidence, §3 proven to catch, §4 measure don't claim), DR-0075 (improve, or a why with a re-review date)

## Context

`the-points-are-numbered-once-per-lesson.test.js` checks that a reader never sees a point number repeat or jump. For the lesson's main text it had one subject, chosen like this:

```js
const m = [...LIVING_LESSONS_MODULES].reverse()
  .find((x) => typeof x.lesson === 'string' && formatLessonText(x.lesson).sectionCount > 3);
```

The newest qualifying lesson inherits the seat, and every earlier one goes unexamined. The check's own comment already names this hazard — it was rewritten *away* from `MODULES[length - 1]` precisely because "whatever landed last silently became its subject" — but the replacement still hands the role to the newest lesson rather than sweeping them all.

It surfaced when ll267 landed and took the seat: the check went red, and ll267 did have a real fault. Fixing ll267 made the check green again and the question stayed open — **what about the 157 lessons it has never looked at?**

## What was measured

**158 lessons carry more than three sections. Five of them skip a point number, and all five are live.**

| lesson | the numbers a reader sees | first fault |
| --- | --- | --- |
| `ll135` | 1,2,3,**5**,6,**8**,**10**,11 | `3 -> 5` |
| `ll136` | 1,2,3,4,**7**,8,**10**,11,12 | `4 -> 7` |
| `ll165` | 1,**3**,4,5,**8** | `1 -> 3` |
| `ll166` | 1,2,**5**,6,7 | `2 -> 5` |
| `ll167` | 1,2,3,4,**6**,7,8 | `4 -> 6` |

**It is the text, not the formatter — verified rather than assumed.** `ll135` contains no `FOUR`, `SEVEN` or `NINE` anywhere in its lesson text; `ll165` contains no `SECOND`, `SIXTH` or `SEVENTH`. The markers are absent, not merely undetected. The formatter is doing exactly what DR-0712 says it should: *"The author's number is the number."* The authors numbered their own points with gaps, so a reader meets a teaching that appears to be missing sections.

**And the rule is NOT "contiguous 1..N", which is the part that took three attempts to get right.** Three further lessons read as non-contiguous and are **correct**:

| lesson | numbers | why it is legitimate |
| --- | --- | --- |
| `ll46` | 1,2,3,4 **then** 1,2 | `FIRST…FOURTH` about the father, then `FIRST…SECOND` about everyone who is not one |
| `ll123` | 1 **then** 1,2,3,4 | a single framing point, then the enumerated answer |
| `ll128` | 1,2 **then** 1,2,3 | two separate enumerated lists |

A second list restarting at "first" is ordinary English. **Demanding contiguity across the catalog would have forced prose rewrites on those three for no reader benefit** — a gate dictating style instead of catching a defect, and a worse outcome than the gap it closed. The first draft of this check did exactly that, and the measurement is what stopped it shipping.

So the rule is: **a number must be the previous one plus one, or 1 (a new list); and the first must be 1.** That separates the two classes exactly — 5 faults, 3 legitimate — and it is derived from reading the corpus, not from taste.

## Impact — what this obligates, and the limits named rather than left

- **The five are NOT fixed here, and that is a decision with a date.** Renumbering an ordinal rewrites prose that each lesson's own spec pins by literal string, and the ordinals are cross-referenced from the age bands. This is not hypothetical: on this same day, rewording three sentences of ll267 to stop its numbers restarting turned **ll267's own gate red**, because that gate asserted the literal `FIRST, what is real in it is kept`. Each of the five needs its own pass with its spec in hand. `re-review: 2026-11-17`.
- **The debt is shrink-only in both directions.** A lesson that starts skipping fails even though the count is unchanged, because the pin is a **list of ids**, not a number. And a pinned lesson that no longer skips also fails, so the list cannot be padded to make room — a fixed lesson must be struck from it.
- **Nothing about the formatter changes**, and no lesson's words change. DR-0281's constraint is untouched: this record adds a check and a list.
- **Honest limit:** the old single-subject check is **kept**, not replaced. It asserts a stronger property (strict contiguity) on one lesson, and the new sweep asserts a weaker one (no skips) on all 158. Keeping both means a future lesson that restarts legitimately could redden the old check while passing the new one — exactly what ll267 hit. When that next happens the old check is the one to reconsider, and this paragraph is the note that says so.
- **Honest limit:** the sweep reads only the `lesson` field. The age bands already have their own catalog-wide checks in the same file ("no band of any lesson ever renders the same point number twice", "the numbers a reader sees are the lesson plan, in order, with nothing skipped"). That asymmetry — every band swept, one lesson text sampled — is the whole reason the five went unseen, and it is now closed.
- **Not claimed:** that these five are the only numbering faults in the catalog. They are the only ones this rule finds among lessons with more than three sections. A lesson with three or fewer sections is not examined by either check.

## Decision

Two exported pure helpers and four cases in `the-points-are-numbered-once-per-lesson.test.js`:

- `headingNumbers(lessonText)` — every number a reader would see, in order.
- `skipFault(ns)` — `''` when legal, else the fault in a reader's terms (`3 -> 5`, or `starts at 2, not 1`).
- The sweep runs over **all** 158 subjects, reports any offender not in `SKIPPED_NUMBERS_ON_DISK` by id and fault, and asserts the pinned list is neither grown nor stale.
- A case pins that a second enumerated list is legitimate, naming the three live lessons that rely on it, and asserts none of them is in the pinned list.

## Verification

- `the-points-are-numbered-once-per-lesson.test.js` — **14 cases green** (9 existing, 5 added).
- **Proven to catch, on a live lesson rather than a fixture:** changing `TWO.` to `FOUR.` in `ll79`'s lesson text reddens the sweep with the offender and the fault named — `"ll79-justice-and-righteousness-travel-together: 1 -> 4"` — and reddens the shrink-only case too. Restored, 14 green.
- **Proven to catch the other direction:** adding a non-offending lesson to the pinned list reddens with *"pinned as skipping but no longer does — strike it from the list"*. So the list cannot be padded.
- **The first two attempts at this proof were themselves wrong, and that is worth recording.** The first injected into `ll135`, which is pinned, so the gate correctly ignored it. The second used `replace(target, …, 1)` and hit the **first** of five occurrences of that string in the file — a band, not the `lesson` field — so the lesson text was never altered and the green result meant nothing. Measured: 5 occurrences, `lesson` field unchanged, heading numbers identical. A proof that does not change what the gate reads proves nothing, and it looks exactly like a passing gate (DR-0076 §3).
- The five faults and the three legitimate shapes are each pinned as pure-function cases, so the rule is readable without running the catalog.
- `lint` exit 0.
