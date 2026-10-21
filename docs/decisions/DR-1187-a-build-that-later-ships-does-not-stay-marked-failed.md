# DR-1187: A build that later ships does not stay marked failed — and a shipped row names the lesson it became

**Date:** 2026-10-21
**Status:** accepted
**Tier:** A (one tag removed on success; one id added to an operator print; no schema, no surface, no user-facing change)
**Type:** orchestration
**Area:**
- `infra/nas-lesson-builder/lesson_builder.py` (`build-failed` comes off the row when the push succeeds)
- `scripts/lesson-inbox-bell.mjs` (`lesson-id:<id>` rides the recent-rows line)
- `infra/nas-lesson-builder/test_lesson_builder.py` (1 case, proven to catch)
- `app/src/__tests__/lesson-inbox-bell.test.js` (2 cases, proven to catch)

**Grounds:** found while reading the hourly intake queue for the first time today, through DR-1186's road. The queue was clear — and the one row in the last day said two things that cannot both be true.
**Principles:** DR-0076 §8 (unknown is not nothing — and a contradiction is not a status); DR-1161 (a brake must make the failure visible, which means it must also stop claiming one that is over); DR-0725 (one definition of "waiting"); DR-0621 (a flag is where the work starts); DR-0075 (the friction that recurs becomes a fix)

## What was measured

The hourly lesson-intake routine was read end to end for the first time on 2026-10-21 at 15:56 (run 39630148116). **The queue was genuinely clear: `waiting lesson rows: 0`, `rows in flight: 0`, the NAS builder `ready` with its primary writer signed in.** One row existed from the last day, and it printed this:

```
a6f86a58-…  made 2026-10-21 03:07:27+00  shipped · ALARM rang 1× (last 07:14:44Z)
   [mirrored, build-failed, lesson-captured, lesson-published]  last stage failed@03:39:34Z
```

**`shipped` and `build-failed` on one line, with a failed last stage.** Read plainly, that says a teaching Darrell spoke at 03:07 this morning was published and also failed to build — and the first reading a reader reaches for is the bad one: *a spoken word was lost.* Under the covenant in CLAUDE.md's "Spoken Teachings Are Build Input" rule, that is the most serious thing the line could mean.

**It was not true. Nothing was lost.** Six lookups established the real sequence:

| 03:07:27Z | the teaching arrives |
| 03:39:34Z | a build stage fails |
| 07:14:44Z | the stale alarm rings, because nothing had shipped |
| 08:08:16Z | it ships — commit `dc2b1e754`, **ll257 "Ten Christmases Left: a street interview becomes a lesson"** |

So the row is correctly `shipped`. `lesson-published` is written **only after the push succeeds** (`lesson_builder.py`, and the file's own tag list says so), and the lesson is in the catalog. What is wrong is narrower than it looked, and still real.

## The two defects

**1. `build-failed` is a live status flag that is never taken off.** On publish the builder cleared `lesson-building` and `awaiting-review` and left `build-failed` where it was, so any row whose first attempt failed reads `shipped … [build-failed]` for ever. This file's own documentation groups `build-failed` with `lesson-building` as a live flag — the stage history lives separately in `build:<stage>@<time>` — and the brakes section already promises the sibling of this: a killed build is *"never left looking busy."* **A build that later shipped must not be left looking failed.** That is the same promise, unkept in the other direction.

**2. The line hid the one fact that answers the doubt it raises.** The recent-rows print filters marks with `/^(lesson-[a-z-]+|…)$/`, and `lesson-id:ll257-…` cannot match it: the id sits behind a colon, past the `$`. The builder writes that tag on the same call that writes `lesson-published`, so the answer to *"did it land, and as what?"* was on the row the whole time and was filtered out of the one place a reader asks the question.

## Decision

**`build-failed` comes off the row when the push succeeds, and the lesson's id rides the line that reports the row.**

- `finish(add, remove=("lesson-building", "awaiting-review", "build-failed"), …)` on the publish path. **Nothing is erased:** `build:failed@<time>` and `build-reason:<why>` stay, so the earlier attempt is still auditable. The difference between clearing a stale flag and hiding a failure is exactly that the history is untouched, and a case asserts it.
- `lesson-id:[A-Za-z0-9._-]+` joins the mark whitelist. It stays a **whitelist** — a malformed id with a space in it is still not printed, and a case asserts that too.

## What this does NOT change, verified rather than assumed

- **No user ever saw a wrong thing, and the app needs no fix.** `app/src/lib/lesson-pipeline.js:197` tests `captured || pushedAt` **before** `:203` tests `build-failed`, so in the app a pushed row already reads "Built and pushed" and the stale tag is already subordinate. This was an operator-facing defect only. Checked before claiming it.
- **The milestone rule is untouched, on both sides.** `milestone()` and `bell_milestone()` are one rule tested on two sides, and `shipped` was the *correct* answer for this row — `lesson-published` means the push succeeded. Flipping the milestone to "failed" would have been the wrong fix and would have broken that parity. A case pins `bell_milestone` still returning `shipped`.
- **Never a body, unchanged.** A case asserts the reason text does not reach the print either.

## Verification

- **105 Python tests green** (`test_lesson_builder.py`), **28 JS tests green** (`lesson-inbox-bell.test.js`).
- **Proven to catch, both sides, by breaking the fix** (DR-0076 §3): with `build-failed` back out of the `remove` tuple the Python case failed, printing the live row's exact tag set — `lesson-published` sitting beside `build-failed`; with the `lesson-id:` alternative dropped, 2 JS cases failed, printing the exact line that caused the chase. Restored to green each time.

## The same principle one layer earlier: `npm run verify:catalog`

The two reds the fold PR (#2365) took today were both edits to catalog prose that no local check covered, so each cost a full CI round-trip to learn:

1. the DR-1131 voice-clarity fixture stopped regenerating (the catalog legitimately shrank from 39,526 pieces to 39,396), caught by shard 2/4;
2. a doubled word — `"has has"`, legal English where *"what he has"* meets *"has already"* — caught by shard 4/4.

**Measured:** exactly **one** of the repository's guard-shaped tests reads the lesson catalog (`doubled-word-guard.test.js`), and 243 test files touch `living-lessons-class.js` in all — so "run the catalog tests" is "run the whole suite", which is not a local option. But the narrow set that a *prose* edit can break is two files, and they run in **10.1 s**:

```
npm run verify:catalog   # from app/
```

Both of today's reds would have been caught by it before the push. This is the same move as the rest of this record — make the truth cheap to reach, so nobody spends eight minutes of CI, or six lookups, learning something a ten-second check already knows. It is a convenience script, added alongside the existing `verify` / `verify:gates` / `lesson-dates:check`; it replaces no gate and CI is unchanged.

## What this does not do

- **The hosted mirror's copy of the tag is add-only.** `HostedRows.merge_tags` can add tags and not remove them, so a mirrored row may keep a stale `build-failed` in the cloud table. It is harmless where it lands — the app subordinates it, as measured above — so this ships without a mirror-side removal rather than growing a new write path for a cosmetic tag. **`re-review: 2026-11-04`**: if any surface is built that reads the mirror's tags without the app's ordering, the removal path comes with it.
- **It does not explain why the 03:39 build failed.** The reason is on the row as `build-reason:<why>`, which this deliberately does not print (it can carry a person's words). The lesson shipped, so the failure cost four and a half hours and no content. **`re-review: 2026-10-28`** — if the intake log shows more first-attempt failures that a retry rescues, the cause of the first failure is the next piece of work, not the label.
- **One row is one row.** This is the first day the queue was read end to end; whether sticky `build-failed` is common or was one occurrence is not yet known, and the fix is cheap enough not to need the answer first.
