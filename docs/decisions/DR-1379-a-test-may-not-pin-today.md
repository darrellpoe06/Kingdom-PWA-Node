# DR-1379 — A test may not pin today

**Date:** 2026-11-09
**Status:** Decided
**Narrative:** [2026-11-09 — the day the lane stopped](../99-session-notes/2026-11-09-the-day-the-lane-stopped.md)
**Relations:** same class as DR-1363 (a forward-safe case may not name the number) · serves DR-0103 (motion is the default) · DR-0076 §3

## Context

Every open pull request was blocked, none by its own change: four unrelated
branches all failed the identical leg, `app — vitest shard 4/4`, and nothing
landed on `main` for two days.

## What was measured

The failure is a date rollover, not a defect in any branch:

```
AssertionError: expected '$4,687.18 as of 2026-11-07 (available…'
                to match /\$4,687\.18 as of 2026-11-06 \(availa…/
```

`money-screenshot-review-render.test.jsx` pinned the literal `2026-11-06` in
**three** places. The screenshot carries no date, so `books-intake-questions.js`
offers "the day it was uploaded", `books-intake-pipeline.js` takes that from
`doc.receivedAt`, and that is `now()`. The test passed on the day it was written
and **failed every day after**, from 00:30 UTC on 2026-11-07. Every branch
carries the file, so one stale literal stopped the lane.

My own measurement erred first: reading checks for a hardcoded older SHA, I
reported both legs `success` and nearly declared CI to be lying. The heads had
moved — `keep-prs-current` caught the branches up on 2026-11-07 — and the
failures are real on the current heads.

## Impact

One test that pins the present day halts delivery for every branch, and the
cause looks like whichever PR is being examined. **What this obligates:** a test
may assert what the clock produces, never which day it is; where a value comes
from `now()`, the expectation is derived the same way.

## Decision

The three literals are derived from the same clock the component reads
(`new Date().toISOString().slice(0, 10)`), with the cause written beside them so
the next reader does not re-pin it. Nothing in the Money feature changed: this
is its test, corrected, and the behaviour asserted is unchanged.

**Limit stated:** a run crossing UTC midnight between the pipeline's `now()` and
the assertion could still differ by a day — seconds wide once a day, against
certain failure every day. The honest close is an injectable clock in
`books-intake-pipeline.js`, that feature owner's call. `re-review: 2026-12-07`.

## Verification

The fix passes; the literal restored fails **today** with
`expected '… as of 2026-11-09 …' to contain '… as of 2026-11-06 …'`, which is
the proof that the derivation is what repaired it rather than a coincidence.
Run locally after restoring `app/node_modules`, which a container rebuild had
removed entirely.
