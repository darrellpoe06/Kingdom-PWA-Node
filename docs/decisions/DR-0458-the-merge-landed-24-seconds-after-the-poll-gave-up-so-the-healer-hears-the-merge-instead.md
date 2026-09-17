# DR-0458 — The merge landed 24 seconds after the poll gave up, so the healer hears the merge instead

- **Status:** accepted
- **Tier:** C (a change to the merge / CI / deploy lane — DR-0107 governs it, and it is not done until a real merge is observed producing a real deploy)
- **Date:** 2026-09-17
- **Type:** orchestration
- **Scope:** `.github/workflows/deploy-freshness.yml` (a `workflow_run` trigger on Auto-merge completing, plus a bounded multi-look watch on that fire only), `app/src/__tests__/deploy-freshness-lane.test.js` (new, 9 checks, 18/18 breaks caught)
- **Principles:** UPTIME-OUTRANKS-VELOCITY (DR-0107), PROVE-THE-SITE (DR-0125), VERIFICATION-DOCTRINE (DR-0076 — measure, do not claim; proven-to-catch), EVENT-DRIVEN-FIRST (DR-0255), THREE-BRAKES (CLAUDE.md 2026-06-08), PERPETUAL-IMPROVEMENT (DR-0075)
- **Grounds:** DR-0103 (the delivery lane), DR-0107 (the 2026-07-06 nine-hour stale site), DR-0109 / LESSONS P25-P26, the 2026-08-28 migration-dispatch finding (the same class, one job over)

## What was measured

Confirming the deploy after the merge of **PR #1648** (DR-0456's lesson), per DR-0107's standing requirement:

| | |
| --- | --- |
| PR #1648 merged | **18:21:12Z** |
| auto-merge's `heal-deploy` poll | ran **18:07:53 → 18:20:48** and gave up |
| the gap | **24 seconds** |
| `Deploy (Cloudflare Pages)` runs for main's tip `7d318655` | **none** |
| `deploy-freshness.yml` fires that day | **05:29, 10:19, 15:05** — three, for a workflow that requests `*/5 * * * *` |

So the prompt net missed by twenty-four seconds and the outer net was hours away. I dispatched the deploy by hand — **run #1155, success on `7d318655`** — so the site is current, and this record exists because the hand is not the fix.

**And the very next merge was caught.** PR #1649 merged at 18:58 and `Deploy (Cloudflare Pages)` run **#1156** fired for it on its own, dispatched by `github-actions[bot]`, green on `6bd5254b`. That matters for the shape of the fix: the existing mechanism is not broken, it is **racing** — it wins most of the time and loses by seconds when CI runs long. Which is exactly why nothing is removed here and only a second, event-timed net is added.

**This is the seventh miss of this class**, by the workflow's own comment history, and **every previous fix raised the timer: 2 → 6 → 12 minutes.** Each raise was correct at the time and each was overtaken by a slower CI. A number that has to be re-guessed whenever the suite grows is not a fix.

## The decision

**a. The healer hears the merge instead of guessing at it.** `deploy-freshness.yml` gains a `workflow_run` trigger on **Auto-merge completing**. That fires at exactly the moment the old poll stops watching — which is, by construction, the moment the merge either has just happened or is seconds away. No new number.

**b. Several looks on an event fire, exactly one on a timer fire.** A single look on the event fire would have missed #1648 by those same 24 seconds, because main had not moved yet when auto-merge's run ended. So the event fire looks up to **five** times, about **45 seconds** apart, and stops at the first dispatch. A scheduled or manual fire looks once, as before — main is settled by then.

**c. The change is ADDITIVE, on purpose.** The cron net, the manual dispatch and auto-merge's own `heal-deploy` job all stay exactly as they are. Whether a `workflow_run` on Auto-merge actually reaches this workflow is a claim about GitHub's behaviour (see below), and the cost of being wrong must be *today's behaviour and nothing worse* — never a regression on the uptime path. The gate breaks if any of the three older nets is removed.

**d. It keeps its three brakes, which the class requires.** BUDGET — one SHA comparison plus at most one dispatch per fire, with a hard ceiling of about three minutes of sleeping (no compute) on the event path, and the gate fails if `tries × gap` exceeds five minutes. LOCK — the existing single-instance `deploy-freshness` group, `cancel-in-progress: false`, so a watch is never killed mid-loop. KILL — the existing `DEPLOY_FRESHNESS_ENABLED='false'` repo variable.

## Verification (DR-0076)

- **9 checks; 18 breaks applied for real, 18 caught, 0 missed, 0 no-ops.** Each break edits the real workflow file and asserts the edit landed before the gate runs.
- **The check that earns its keep is the cross-file one.** A `workflow_run` trigger matches the upstream workflow's `name:`, not its filename — so renaming `Auto-merge` is a one-word edit in a *different file* that silently unhooks this healer, and the only symptom is a stale site hours later. The gate reads both files and compares. Its break (`name: Auto-merge (squash on green)`) is caught.
- Breaks also caught: the hook deleted; the hook listening for the wrong name or the wrong type; the cron removed; the manual dispatch removed; the event fire reduced to one look; the timer fire made to sleep; the ceiling removed; the gap grown past the bound; the loop no longer stopping at the first dispatch; the comparison no longer against the last *successful* deploy; a dispatch on the wrong ref; the kill-switch removed; the lock renamed or made cancelling; and auto-merge's own dispatch or `heal-deploy` job removed as "redundant".
- YAML re-parsed after the edit; the three triggers are `schedule`, `workflow_run`, `workflow_dispatch`.

## What is still NOT proven

**That a `workflow_run` on Auto-merge reaches this workflow at all.** `deploy-freshness.yml`'s own header states that GitHub fires no push-, CI- or workflow_run-triggered workflow *for a GITHUB_TOKEN push*. My reading is that the suppression applies to events **emitted by a GITHUB_TOKEN action**, whereas a workflow run's completion is emitted by GitHub about its own run, and Auto-merge's `check_suite`-triggered run completes normally — but that is a reading, not a measurement, and this house does not ship readings as facts. **It is proven on the next real merge**: a `deploy-freshness` run whose event is `workflow_run`, followed by a `Deploy (Cloudflare Pages)` run whose `head_sha` matches the new `main`. If it does not fire, the negative gets recorded here and the fallback is the honest one — raise nothing, and instead make the *cron* effective or move the watch into auto-merge's own job where the event is not in question. **`re-review: 2026-09-18`** — one merge away, not a date away.

## A SECOND FINDING, separate from this change and not fixed here

**Every `pull_request`-triggered run of `auto-merge.yml` is producing zero jobs and ending in `failure` or `action_required`.** Measured on four consecutive runs:

| run | event | conclusion | jobs |
| --- | --- | --- | --- |
| 4378 | `pull_request` | `action_required` | 0 |
| 4376 | `check_suite` | success | ran |
| 4375 | `pull_request` | failure | **0** |
| 4373 | `pull_request` | cancelled | 0 |
| 4371 | `pull_request` | failure | **0** |

`action_required` means the run is **waiting for approval and never executes**. The PRs are opened by `github-actions[bot]`, and a repository setting that requires approval for workflow runs on pull requests would produce exactly this. The consequence: **half the lane is dead** — only the `check_suite` path arms auto-merge and runs `heal-deploy`; the `pull_request` path (which is also what the DR-0103 `hold`-label brake rides, via `types: [labeled, unlabeled]`) never runs. That means **the Governor's `hold` label may not disarm an armed PR**, which is the exact brake PR #1339 already had to have fixed once.

I have not changed a repository setting and will not: it is Darrell's, and it is under **GitHub → Settings → Actions → General → "Fork pull request workflows" / approval for workflow runs**. Tracked as its own work; it needs its own measurement (watch one `pull_request` run actually execute) before anything is called fixed. Naming it here rather than folding it in, because a Tier-C lane change must be one change at a time.

## Files

- `.github/workflows/deploy-freshness.yml` — the `workflow_run` hook and the bounded watch
- `app/src/__tests__/deploy-freshness-lane.test.js` — new, 9 checks
- `docs/decisions/INDEX.md` — row + pointer
