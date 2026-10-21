# DR-1149: A job that is turned off is not a job nobody asked about — and the headline must agree with the columns under it

**Date:** 2026-10-21
**Status:** accepted
**Tier:** B (a correction to a Governor-facing strip shipped hours earlier; read-only, no new surface)
**Type:** way

**Area:** `app/src/lib/fleet-census-live.js`, `app/src/components/OpsBoard.jsx`, `app/src/__tests__/the-fleet-census-reaches-the-board.test.js`. Corrects two figures in **DR-1148**.

**Principles:** DR-0076 (a number that measures the wrong thing is a lie, and unknown is not a no); DR-0061 (reality-trace — observe the running system, do not assume); DR-1148 (the surface this corrects); DR-0621 (a flag is where the work starts: hold the hand of the process until it works).

## Context

**DR-1148 put the fleet census on the OpsBoard, and merged, and its tests were green. Then the first live run showed two things no test could.**

After `#2323` merged at `155555c66`, `fleet-census.yml` was dispatched, reported into issue **#2325**, and the **app's own parser was run against that live body** rather than a fixture. It read clean — 118 jobs, 117 enabled, 84 with a last run — and the three-way split it produced was wrong in two places:

1. **`openers` appeared in `nobodyAsked`.** `openers` is our one disabled job (`state: disabled_manually`). The bucket is defined as *"**enabled** with no last run date"* and **the first word is a filter the code never applied**: `theThreeWayAnswer` partitioned every job with no run, whatever its state. So a job that is deliberately turned off was reported as a gap in the report — answering Darrell's SECOND question with the population belonging to his FIRST one (*"do the disabled jobs need to be migrated? Are these maybe jobs that are only used at certain times?"*).

2. **The headline disagreed with the columns under it.** `censusVerdict` used the census's raw `unknownLastRun`, which counts disabled jobs, so the strip read **"29 of 118"** above three columns that added to **28**. Two numbers that disagree on one screen is how a surface stops being believed — which is the whole thing this board exists to earn.

**Why no test caught either.** Every fixture row was `active`; not one carried a disabled job, so there was nothing for the filter's absence to fail on. **23 green cases, and the defect walked straight past all of them.** This is the anti-theatre rule's own lesson arriving in my own work on the same night I wrote it: a green suite proves what its fixtures contain, and a population absent from the fixtures is a population the suite says nothing about.

## What was measured

Against the **live** report issue #2325 (read at 2026-10-21T01:13:58Z), through `parseCensusBody` — the same function the app runs:

| | shipped in DR-1148 | corrected here |
|---|---|---|
| nothing fires it | 5 | 5 |
| on a clock, asked, empty | 0 | 0 |
| history never asked | **29** — including `openers` | **28** |
| turned off | *(not a bucket)* | **1** — `openers`, named on the strip |
| headline | **"29 of 118 job(s)"** | **"28 of 117 enabled job(s)"** |

The 28 are all NAS services (`transcript-trickle`, `church-mail`, `lesson-mail`, `cameras`, `immich`, …) whose last-run lives in ledgers this census cannot yet ask — the limitation DR-1148 stated and dated, and that part held.

## Decision

**`theThreeWayAnswer` filters the disabled out of the three columns and returns them as their own bucket**, so the two questions never share a number, and the strip names the turned-off jobs in words: *"on or off is a decision, not a gap."*

**The headline is derived from the ENABLED fleet**, the same arithmetic as the columns.

**With no job rows it falls back to the census's raw unknown count, deliberately.** Deriving the gap from an empty `jobs` array computes 0 and would let a census that reports unknowns read **GOOD** — trading an inconsistency for a **false green**, which is the worse of the two failures. I walked into that on the first attempt: the change turned the existing "an unanswered census is never a clean bill of health" case red, and that case was right. It now pins both bodies.

## Impact

**DR-1148's record carried the same error in prose and is corrected, not left standing.** It claimed "40 of our own 117 jobs" are the nothing-fires-it population. Live: the on-demand-only population *is* 40, but only **5** of them are in the no-run bucket — the other 35 have run. The figure measured one thing and was cited for another. Corrected in that record and its INDEX row, marked as corrected here, because a wrong measurement in the ledger is worse than no measurement (DR-0076): the next reader would have taken it as fact.

**The habit this earns, stated plainly:** a surface is not proven by its tests. The first live run is part of shipping it, not a victory lap after. Both defects were found in the ten minutes after the merge, by reading the real report instead of trusting the green — and both would have sat on Darrell's board indefinitely otherwise, since neither throws an error and both render perfectly.

**What is still not done.** The 28 NAS last-runs remain unasked; that is DR-1148's dated item, unchanged: **`re-review: 2026-11-20`**.

## Verification

**27 cases** (was 23), and the fix is **proven to catch by reverting it**:

| what was broken | what went red |
| --- | --- |
| the enabled filter reverted to the version that shipped (`enabledNoRun = noRun`) | **3** — *"expected [ 'nobody-asked.yml', 'openers' ] to not include 'openers'"*, and the partition case |
| (found while fixing) the headline derived from an empty `jobs` array | **1** — *"expected 'good' to be 'unknown'"*, the false green |

Restored: **27 passed**. Re-run against the live #2325 body after the fix: `nobodyAsked` **28**, `disabled` **1**, headline **"28 of 117 enabled job(s) have no last-run answer yet"** — headline and columns now the same arithmetic.

`npm run lint` exit **0** · `npm run verify:gates` exit **0**, read without a pipe.
