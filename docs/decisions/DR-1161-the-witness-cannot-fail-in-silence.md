# DR-1161: The witness cannot fail in silence — a brake that turns a failure into a green is a disarmed check

**Date:** 2026-10-21
**Status:** accepted
**Tier:** B (restores a witness that had silently stopped publishing; adds a checkout and a loud failure path, changes no verdict)
**Type:** way

**Area:** `.github/workflows/loops-health.yml` (a checkout; the publish step loses `continue-on-error` and catches instead), `.github/workflows/fleet-census.yml` (the fold says how old the witness it read is), `app/src/__tests__/a-missing-ledger-is-not-a-fresh-one.test.js`.

**Principles:** DR-0076 (unknown is not a no; a gate that cannot fail is a lie); DR-1152 (the change this repairs); DR-0621 (a flag is where the work starts — detect, fix, re-measure on live data); DR-0107 (prove the thing still runs; green ≠ working); DR-0108 (reason from the whole system's reach, not one step's).

## Context

**DR-1152 fixed a fabricated timestamp and, in the same commit, stopped the witness publishing at all. For two hours nothing said so.**

DR-1152 moved the per-loop last-run rule out of `loops-health.yml`'s inline `github-script` body into `scripts/loops-witness-services.mjs`, so a test could **run** it instead of grepping a workflow's source text. Its first real run threw:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module
  '/home/runner/work/Kingdom-PWA-Node/Kingdom-PWA-Node/scripts/loops-witness-services.mjs'
```

**`loops-health.yml` has never had an `actions/checkout`.** It is a tailnet-and-API job: it SSHes to the box, reads each loop's ledger, and talks to the GitHub API. It never needed a file from the repository — so the file I told it to import was not in its workspace. I reasoned from what the repository contains instead of from what that job can see, which is the DR-0108 failure in miniature, the second time in one night.

**And the second defect is the one worth the record.** That step carried `continue-on-error: true`, which I had added deliberately so a publishing fault could never turn a healthy loops witness red or a dark one green. `continue-on-error` makes a **failed** step report its conclusion as **success**. So:

- the step list read eight green steps,
- the run concluded `success`,
- `get_job_logs --failed_only` reported *"No failed jobs found"*,
- the report issue silently kept its old body, and
- the census went on folding a two-hour-old witness **with full confidence**.

I only found it because I went to look at the published numbers and the `readAt` had not moved. **A brake that turns a failure into a green is the disarmed-check shape, whatever it was protecting.**

## What was measured

| | before | after |
|---|---|---|
| `loops-health` runs that published | 1 of 2 (the second threw and reported success) | the checkout is present; re-run below |
| what the run reported | `success`, 8/8 steps green, 0 failed jobs | a **warning annotation** and a step-summary line naming the fault |
| what the census said about a 2-hour-old witness | nothing | *"it has stopped publishing… the NAS half below is STALE, not wrong"* |

The witness's own ledger figures from the live body are unchanged by this and were correct: 10 loops measured, `services-sync` last fired 03:16:50Z.

## Decision

**The job checks out the repository**, before the step that imports from it. Two seconds against a witness that cannot read its own repository.

**The publish step loses `continue-on-error` and catches its own errors instead.** On a fault it calls `core.warning` and writes a line into the step summary saying the witness did not publish, that the census therefore reads a **stale** body, and that *nothing about the loops themselves is implied*. It still never calls `setFailed`: a failed issue write is not a verdict about whether a loop ran, and that separation was the right instinct — it was the *mechanism* that was wrong.

**The census says how old the witness it just read is.** From the reader's side a witness that stopped publishing looks exactly like a healthy one, which is how two hours passed unnoticed. The fold now computes the age of `readAt` and warns past two hours (the witness runs every 15 minutes, so that is many missed passes, not a slow night). **An unreadable or absent `readAt` is warned about too**, never passed over as fresh.

## Impact

**Three defects in a row in this one road, all mine, and all the same shape:** a thing that did not look wrong. The fabricated timestamp rendered perfectly (DR-1152). The stopped publisher reported success. Both were found by reading what the system actually published, not by any test — and the test suite was green through all of it.

**The rule that earns its place here:** when a brake exists so that X cannot fail the build, the brake must still make X's failure *visible*. Silence is not safety. The pattern to copy is this one — catch, warn, annotate, and let the thing it protects stay unaffected.

**Not proven live yet at the time of writing.** The checkout has never run. Re-running `loops-health` is part of this change, not a follow-up, and the `readAt` moving is its proof. **`re-review: 2026-10-22`** together with DR-1152's, so one read covers both.

## Verification

**16 cases** in the file (4 new), and the three new ones are **proven to catch by breaking the workflow**:

| what was broken | what went red |
| --- | --- |
| the checkout removed — the live `ERR_MODULE_NOT_FOUND` | **1** — *"loops-health must check out the repo it imports from: expected -1 to be greater than 0"* |
| `continue-on-error: true` put back — the mask | **1** — *"expected 'Report: publish…' not to match /continue-on-error/"* |
| the catch made to call `setFailed`, turning a write fault into a verdict | **2** — the warning case and *"not to match /setFailed/"* |

Restored each time: **16 passed**. The ordering case matches the **import statement**, not any prose mention of the file — its first draft matched the new checkout comment and so proved nothing about step order, which it caught on itself.

Both workflows' YAML parses, the publish step's `github-script` body passes `node --check`, and the census fold's embedded Python compiles. `npm run lint` exit **0** · `npm run verify:gates` exit **0**, read without a pipe.
