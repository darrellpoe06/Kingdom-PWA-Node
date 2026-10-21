# DR-1148: The fleet census reaches the board — and "enabled with no run date" stays three answers, not one

**Date:** 2026-10-21
**Status:** accepted
**Tier:** B (a new in-app surface on an existing Governor-facing board; read-only over the fleet, and the workflow half writes nothing but one rolling report issue)
**Type:** way

**Area:** `app/src/lib/fleet-census-live.js` (new), `app/src/components/OpsBoard.jsx` (a strip), `.github/workflows/fleet-census.yml` (a report step), `app/src/__tests__/the-fleet-census-reaches-the-board.test.js` (new).

**Principles:** DR-0065 (the app is the primary artifact — a capability that CAN live in the app SHOULD); DR-1140 (the census, and the distinction it exists to keep); DR-0061 (reality-trace: name the real record before building the surface); DR-0076 (unknown is not a no; proven-to-catch); DR-0121 (live data, never painted); DR-0125 (unknown freshness never reads as fresh); DR-0075 (the dated re-review this closes early).

## Context

**Darrell asked for the report, and then it went where he does not look.** He brought back a job-migration census in this shape —

> Total jobs: 149 / Enabled jobs: 131 / Enabled jobs with a last run date: 78
> Do the disabled jobs need to be migrated? … Have the enabled jobs with no run dates never been run?

— and the honest finding was that we could not answer either question about our **own** automation. DR-1140 built the answer: `scripts/fleet-census.mjs` reads shape and enabled-state out of the repository, and `.github/workflows/fleet-census.yml` asks GitHub for the half the repository cannot know (last run), keeping **unknown** separate from **never**.

Then the answer landed in a **step summary**, an **artifact**, and an **incident issue filed only when something was broken**. Three places Darrell does not read. DR-1140 itself dated the fix `re-review: 2026-11-03` — "put the census on the OpsBoard". That date is closed here, early, because a report nobody can see is not a report, and the standing default is to build the capability **into the app** without being asked again (DR-0065).

## Reality-trace, before the surface (DR-0061)

**The real record this reads and writes, named:**

1. **The rolling `fleet-census-report` issue.** `fleet-census.yml` now rewrites its **body** on every run with exactly what `fleet-census.mjs --json` measured, in a fenced `json` block, plus a human table beside it. The app parses the **fence**, never the table: a number re-typed into prose is a number that can drift from the thing it measured.
2. **`fleet-census.yml`'s own run list**, so the board can say when the census last ran. A census is only as good as its freshness.

**Observed, not assumed:** the strip sits on the OpsBoard beside the Uptime, Harvest and OpenClaw strips — the surface Darrell already opens for lane state — and uses the same `KpiDot` palette and the same unauthenticated, ETag-conditional, TTL-shared read discipline as `site-health.js`, so it costs the 60/hr budget one extra pair of calls per five minutes at most.

**Label chosen deliberately:** `fleet-census-report`, **not** `incident`. The uptime strip reads `incident`; filing a routine census there would paint a false outage on the board that shows the real ones. A healthy census is not an outage, and the report issue stays open because it is a living report rather than a fault.

## Decision

**The census shows on the board, and the board keeps the distinction the question turns on.** "Enabled with no last run date" is rendered as **three** populations, never one number, because they carry three *opposite* decisions:

| population | what it means | the decision |
|---|---|---|
| **nothing fires it** | on-demand only — no clock, no event | correct and healthy; **5 of our own 118 jobs** are in this bucket (the on-demand-only population is 40; the other 35 have run) — *corrected 2026-10-21 on the first live run, DR-1149* |
| **on a clock, asked, empty** | something fires it on a schedule, the history was asked, there is no run | retire it, or fix what should have been firing it |
| **nobody asked** | the history was never queried | a gap in the **report**, not a fault in the job |

Merging them is exactly how a census becomes a confident wrong answer — which is the finding this whole thread began with, and the reason the migration report Darrell was handed could not be acted on as written.

**Five failure states, five different sentences, none of them green.** A failed read, a rate limit, a missing report issue, an unparseable block, and a stale census are distinct, each says which it is, and not one renders as a healthy fleet. **Unknown freshness is reported STALE**, never fresh (DR-0125's own rule, applied here).

**It computes nothing.** Every figure on the strip came out of the census JSON or is absent. A second computation in the client is a second answer that can disagree with the one that was measured.

## Impact

**Darrell can see the fleet without opening the repository**, and the two questions he asked have standing answers on a surface he already uses. The census keeps its workflow-side incident behaviour unchanged: a job nothing can fire, or a clock with nothing behind it, still fails the job and files on the `incident` ledger.

**The report step runs BEFORE the step that can fail the job** — pinned by test. Had it come after, the board would have gone dark exactly when there was something worth showing.

**What it does not do.** The strip shows the **GitHub** fleet's last-run data, because that is the only fleet whose history the census can currently ask. The NAS loops' ledgers and the scheduled-task store are counted in `total` (the shape is read from the files) but their last-run is `unknown`, so they land in the third population rather than the second. Folding those two histories in is data, not code, and remains DR-1140's dated item: **`re-review: 2026-11-20`**.

## Corrected on the first live run (DR-1149)

**Two figures in this record were wrong and are corrected above.** The first live census (issue #2325, read 2026-10-21T01:13:58Z) showed that the table's "40 of our own 117" measured the on-demand-only POPULATION, not the part of it sitting in the no-run bucket — 5 — and the fleet is now 118. The same run exposed two defects in the code this record shipped: the three columns never filtered the DISABLED out (so `openers` was reported as a gap in the report rather than as the answer to the first question), and the headline counted the raw unknowns while the columns counted the enabled ones, so the strip read "29 of 118" above columns adding to 28. Both are fixed in **DR-1149**, with the fix proven to catch by reverting it. Nothing here is rewritten to hide it: a wrong measurement left standing in the ledger is worse than no measurement, because the next reader takes it as fact (DR-0076).

## Verification

**23 cases**, and the three that matter are **proven by breaking the module and watching the suite go red**:

| what was broken | what went red |
| --- | --- |
| the three populations merged into one (`askedAndEmpty: noRun`) | **4** — *"expected [] to deeply equal [ 'android-package.yml' ]"*; *"expected '3 job(s) on a clock…' to match /1 job\(s\)…/"* |
| unknown freshness made to read as fresh | **1** — *"expected false to be true"* |
| a body with no census fence made to read as an empty fleet (`ok: true, total: 0`) | **1** — *"expected true to be false"* |

Restored each time: **23 passed**.

The writing half is pinned too, because **a reader aimed at something nothing writes reports "no data" for ever** — the exact mistake made with lesson-mail's witness the day before (DR-1132). The cases assert that the workflow writes the same label the module reads, writes the fence the parser looks for, puts the report before the failing step, and does not label its report an `incident`.

`npm run lint` exit **0** · `npm run verify:gates` exit **0**, read **without a pipe**.
