# DR-1151: The census asks the loops — 28 blank columns were a missing argument, not a missing road

**Date:** 2026-10-21
**Status:** accepted
**Tier:** B (one additive, failure-isolated step on an existing witness; one read-only fold on the census; no change to either workflow's judgement)
**Type:** way

**Area:** `scripts/fleet-census.mjs` (`readServices` now takes `runs`), `.github/workflows/loops-health.yml` (publishes its witness), `.github/workflows/fleet-census.yml` (folds it in), `app/src/__tests__/the-fleet-census-answers-both-questions.test.js`.

**Principles:** DR-0076 (unknown is not a no; provenance travels with the number); DR-1140 (the census and the three populations); DR-1148 (the report-issue road this reuses); DR-1149 (the live run is part of shipping); DR-0236 (nothing buildable waits); DR-0621 (one definition, held by its owner); DR-0108 (account for the whole team's reach, never only your own).

## Context

**The report Darrell asked for had 28 of 118 rows blank, and I had dated the fix a month out with a reason that was wrong.**

DR-1148 shipped the census to the board and stated its limitation honestly — the NAS loops are counted in `total` but their last-run is unknown — then dated it `re-review: 2026-11-20` on the grounds that folding those histories in is *"data, not code."* Reading the code says otherwise:

```js
lastRun: null,
// The loop ledgers hold this and loops-health.yml reads them; it is not in
// the repo, so from here it is unknown, never "never".
lastRunClass: 'unknown',
```

That comment is true of the **repository** and false of the **fleet**. `loops-health.yml` already measures every one of those 29 loops on the tailnet — a per-loop verdict (`ok` / `failed` / `degraded` / `unknown`), the services-sync clock's last fire, and each loop's own ledger age — **fifteen minutes apart, on the existing road**. And `readServices()` did not accept the `runs` argument at all. So the blank column was **a parameter never passed**, not a measurement nobody could take.

Both halves of my deferral were wrong: it is code, and the data was already being collected by a sibling. This is the DR-0108 failure exactly — reasoning from my own reach (the sandbox cannot touch the NAS) instead of the team's (a runner does it every quarter hour).

## What was measured

Against the live fleet on 2026-10-21:

| | before | after |
|---|---|---|
| jobs | 118 | 118 |
| with a last run | **84** | 84 + however many loops the witness can timestamp |
| no last-run answer | **29** (28 enabled + 1 off) | the loops the witness could not timestamp |
| NAS loops asked | **0 of 29** | 29 of 29 |

The exact after-figure is deliberately not asserted here: it is whatever the witness measures on its next pass, and writing a number I have not seen is the thing DR-1149 was written about.

## Decision

**One road to one truth.** `loops-health.yml` publishes the witness it already builds onto the same rolling report-issue road DR-1148 established (`loops-report`, deliberately **not** `incident`), and the census reads it **GitHub-side with no tailnet of its own**. The census was not given a second NAS reader: two roads to one truth drift, and the loop witness is the owner of what a loop's last run means (DR-0621).

**Publishing cannot change the witness's verdict.** The step runs *after* the verdict is written and carries `continue-on-error: true`. A healthy loops witness must never go red because an issue write failed, and a dark one must never go green. The gate is that workflow's judgement; reporting is not part of it.

**Which witness said so travels with the timestamp.** A loop's *own* ledger age is the better evidence — that is the loop's own file — so it wins; the services-sync clock is the fallback, and only for a loop whose last run that cycle was `ok`. Anything else stays `null`. Each entry carries `from` in words, so a reader never has to guess.

**A NAS loop can never be reported "never" — a deliberate asymmetry.** "Never" means the system holding the history was asked and had no run. Nothing we can ask holds a NAS loop's run **count**, only its most recent evidence. So a `runs_counted` arriving in the services map is **dropped rather than believed**, and a NAS row either has a timestamp (`ran`) or stays `unknown`. A GitHub workflow with the identical input *is* `never`, and that difference is the point.

## Impact

**Darrell's second question gets a real answer for the NAS half instead of a blank.** The three-way split on the board stops carrying 28 rows whose only content is "we never asked."

**The deferral is closed a month early**, and the reason it was wrong is recorded rather than quietly dropped: a stated "can't / needs data" is an unverified premise to challenge, not a place to stop (DR-0108).

**Every way the fold can fail leaves the NAS half UNKNOWN, loudly** — an unreadable report, no report yet, a body with no block, a block that will not parse, a block naming no services. Five paths, five printed reasons, and not one of them reads as "no loops ran" (DR-0076).

**Not proven live yet.** The witness has not published a pass with this step in it, so the after-figures above are unmeasured. The first live `loops-health` run with this merged is part of shipping it, not a lap afterward — DR-1149's lesson, applied the same night it was learned. **`re-review: 2026-10-22`** — read the first published witness and the census that follows it, and record the real after-numbers.

## Verification

**31 cases** (was 24), and the two that matter are **proven to catch by reverting the change**:

| what was broken | what went red |
| --- | --- |
| `readServices` back to ignoring the runs file (what shipped in DR-1148) | **2** — *"expected 'unknown' to be 'ran'"*, and the `withALastRun` ratchet |
| a handed-in run COUNT allowed to make a NAS loop read `never` | **1** — *"expected 'never' to be 'unknown'"* |

Restored: **31 passed**. The totals case also pins `withALastRun + neverRun + unknownLastRun === total` on both sides of the fold, so nothing can be moved into one column without leaving another.

Both workflows' YAML parses, the published step's `github-script` body passes `node --check`, the fold's embedded Python compiles, and the step order is asserted (publish after judge; fold before the census reads).

`npm run lint` exit **0** · `npm run verify:gates` exit **0**, read without a pipe.
