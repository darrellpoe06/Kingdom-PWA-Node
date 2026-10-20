# DR-1140: A census that cannot tell "never ran" from "nobody asked" gives wrong answers

**Date:** 2026-10-20
**Status:** accepted
**Tier:** A (a script, a witness workflow, a test. It reads the Actions API and the repo and writes nothing but its own rolling ledger issue; no schema, no money, nothing on a new clock but a weekly read)
**Type:** way

**Area:** `scripts/fleet-census.mjs` (new), `.github/workflows/fleet-census.yml` (new, read-only), `app/src/__tests__/the-fleet-census-answers-both-questions.test.js` (new).

**Grounds:** Darrell, 2026-10-20, bringing back a job-migration census and asking for reports like it:

> Total jobs: 149 · Enabled jobs: 131 · Enabled jobs with a last run date: 78
>
> *"Do the disabled jobs need to be migrated? Are these maybe jobs that are only used at certain times?"*
> *"Have the enabled jobs with no run dates never been run? Do they need to move?"*

**Principles:** DR-0076 (unknown never reads as an answer; measure, don't claim); DR-0125 (a thing gets its own witness); DR-1119 / DR-0621 (a job joins the flow at birth and something must be able to say whether it ran); P62 (decide by exact identity, never by position in a list); DR-0065 (the app is where this ends up).

## Context

Those two questions are the right questions, and **we could not answer either one about our own automation.** We had no single place that counted our jobs, because we have three fleets with three different notions of "enabled" and three different places the run history lives:

| fleet | where "enabled" lives | where "last run" lives |
|---|---|---|
| GitHub workflows | the trigger block in the file — plus a state only GitHub knows | GitHub's run history |
| NAS services and loops | an `enabled` flag in `infra/nas-loops/services.json` | each loop's own ledger on the NAS |
| scheduled tasks | the account's routine store | the routine store |

**The deeper problem is in the headline itself.** "Enabled jobs with a last run date: 78" of 131 reads as *53 jobs are suspect*. It is not one population. It is at least three, with **opposite** decisions:

1. **Nothing can fire it on a clock.** A job that only runs when something asks has a blank last-run *correctly*. Not a finding.
2. **The history was asked and is empty.** A real candidate to retire.
3. **Nobody asked the history.** Not a finding about the job at all — a gap in the report.

A census that merges those three invites exactly the wrong action: retiring a job because an HTTP call failed, or migrating a dead one because its name looked busy. This is DR-0076's rule applied to a census.

## What was measured

Measured 2026-10-20 at `origin/main` `3d345746c`, by the instrument itself (`node scripts/fleet-census.mjs`):

| | |
|---|---|
| **Total jobs** | **116** |
| Enabled | 115 |
| Disabled | **1** (`openers`, a NAS service) |
| GitHub workflow files | 87 |
| NAS services + loops | 29 |
| **Scheduled** (something fires them on a clock) | **65** |
| **On-demand only** (nothing fires them on a clock) | **40** |
| Event-driven (fire when the repository moves) | 11 |
| Inert (nothing can fire them at all) | **0** |
| Jobs with a last run date | **not measurable from the repository** |

**That last row is the finding, not a failure.** Last-run is not in the repository, so from a checkout every job is **UNKNOWN** — and the script says so in those words rather than printing a zero that would read as "none of them have ever run". The GitHub half is now askable (`fleet-census.yml`); the NAS loop ledgers are read by `loops-health.yml`; the routine store is read through its own API.

**The 40 on-demand-only workflows are the concrete form of Darrell's second question in our own fleet.** `inbox-lesson-body.yml`, `rls-isolation.yml`, `nas-bootstrap.yml`, `cams-diag.yml` and 36 others have no schedule by design — they are tools something calls. In a report shaped like the one he was handed, all 40 would appear as "enabled, no last run date" and all 40 would be fine.

## Decision

**Build the census as an instrument, and make it keep the three classes apart.** `lastRunClass()` returns exactly one of `ran` / `never` / `unknown`, and `never` is returned **only** when the history was asked and answered zero. A missing entry, or an entry whose lookup failed, is `unknown`. Pinned five ways, including that the three are disjoint over every input shape.

**Trigger shape is read from the file, exactly.** `triggersOf()` matches only top-level `on:` keys, so a `cron` in a comment or under a job is not a schedule — a false "scheduled" would hide the one genuinely alarming class, a job nothing fires.

**GitHub's own state wins over the file's existence.** A workflow file can be present and switched off at GitHub (`disabled_manually`, `disabled_inactivity`), and only the API knows. The census takes the API's word where it has it and reports `unknown` where it does not.

**The asking half says its own caveat.** `fleet-census.yml` holds `contents: read` / `actions: read` and `issues: write` for its own ledger alone — it mutates no file, no run and no other job — paginates the whole workflow list rather than reading the first page, and uses each workflow's `total_count` — an exact count — rather than inferring "never" from an empty page. It prints the retention caveat **with the verdict**: GitHub keeps run history for a limited window, so "never" means *no run in retained history*, which for an old workflow is not the same claim as "never once fired". Brakes: one pass, a 10-minute ceiling, one run at a time, weekly off the hour.

**The census got a real consumer because a gate refused it twice.** `interconnect-guard` (DR-0621) rejected the workflow first for having no place in the flow graph, then for reading a resource nobody writes. Both refusals were right. The answer to the first is that a census whose output lands only in a step summary is the hollow kind, so it now files the **two genuinely broken classes** on the rolling ledger the OpsBoard already reads — a job **nothing can fire at all**, and a job something fires **on a clock** that has no run in retained history. It files neither “on-demand with no runs” (nothing is meant to fire it) nor “unknown” (a gap in the report, not a fault in the job), and a case pins that the filter contains neither. The answer to the second is that **GitHub writes `gh:actions-fleet`, not us** — the API is the only place a workflow’s disabled state and retained run count exist, which is the whole reason this half has to ask — so it is declared an outside source with that reason.

**Disabled is reported with the job's own stated purpose, never as a verdict.** Our one disabled service is `openers` — the garage-door control, shipped switched off on purpose. "Disabled" alone cannot distinguish *seasonal*, *staged*, and *dead*; the description can, so the report hands it over and a person decides.

## Impact

**We can now answer both questions about our own fleet**, and the numbers are generated rather than counted by hand — so the report is repeatable and a later one is comparable.

**What this does not do, with a why and a date.** There is no in-app surface yet, and DR-0065 says that is where it belongs. The data file is the prerequisite and lands with this change; the OpsBoard strip is the next step. **`re-review: 2026-11-03`** — put the census on the OpsBoard beside the lane state, or say why not.

The NAS and routine fleets' last-run is read today by `loops-health.yml` and the routine API but is not yet folded into this one census; the script already takes it as input, so folding it in is data, not code. Same date.

## Verification

`node scripts/fleet-census.mjs` runs against the real fleet and prints the table above — the figures in **What was measured** are its output, not an estimate.

**`the-fleet-census-answers-both-questions.test.js`: 20 cases.** `fleet-census.yml` parses as YAML, both shell steps pass `bash -n`, its embedded Python compiles, and the `github-script` body passes `node --check`. `npm run lint` exit 0 and `npm run verify:gates` exit 0, both read without a pipe.

**Proven to catch**, on the two defects that would actually matter:

| what was done | what went red |
| --- | --- |
| `unknown` allowed to fall through to `never` | **3** — *"expected 'never' to be 'unknown'"*, *"expected 88 to be +0"*, and the class-assignment case |
| the trigger match widened so a commented-out cron counts | **1** — *"a cron line in a comment or under a job is not a trigger"* |

Both restored to green afterwards, confirmed by re-running.

**An error of mine inside this verification, worth recording because it is the same shape as the rest of today.** My first break-and-restore pass ran the test through a shell function that `cd`-ed into `app/`, so the restoring `cp` landed on a relative path that no longer existed. The "restored" run printed the *same three failures* as the break, and the second break's run printed them too — so one break was never actually tested and the restore never happened. The giveaway was three identical outputs in a row. Re-done with absolute paths: break 1 red on 3, break 2 red on 1, restored 18 passed. **A verification harness can fail in a way that makes every reading identical, and identical readings are the tell.**
