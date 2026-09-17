# DR-0460 — The hook worked, and billed us twice: an in-flight deploy is not a stale site

- **Status:** accepted
- **Tier:** C (a change to the merge / CI / deploy lane — DR-0107 governs it, and it is not done until a real merge is observed producing exactly one deploy)
- **Date:** 2026-09-17
- **Type:** orchestration
- **Scope:** `.github/workflows/deploy-freshness.yml` (an in-flight gate and a third return code), `app/src/__tests__/deploy-freshness-lane.test.js` (+4 checks, 24/24 breaks caught)
- **Principles:** UPTIME-OUTRANKS-VELOCITY (DR-0107), VERIFICATION-DOCTRINE (DR-0076 — measure, do not claim), PERPETUAL-IMPROVEMENT (DR-0075 — including improving what you shipped an hour ago), THREE-BRAKES (budget)
- **Grounds:** DR-0458 (the change this corrects, shipped the same day), DR-0103 (the delivery lane), auto-merge.yml's own heal, which already had this gate

## What was measured

The merge of **PR #1650** is the merge that **proved DR-0458's hook works** — and the same observation showed it dispatching a build that was not needed:

| run | what | when | head |
| --- | --- | --- | --- |
| deploy **#1157** | auto-merge's own heal dispatched it | 19:15:57 | `003aaf22` |
| deploy-freshness **#1313** | fired on `workflow_run`, read STALE | 19:16:59 | `003aaf22` |
| deploy **#1158** | the hook dispatched it | 19:17:06 | `003aaf22` |

Both deploys were green and the site was correct throughout. But **two Cloudflare Pages builds ran for one merge, and that would have happened on most merges from here.**

The cause is exact: `deploy-freshness` compares main's tip to the **last SUCCESSFUL** deploy. While #1157 was still running, the last success was still the previous tip, so the comparison honestly said STALE — and dispatched. The header of that very workflow says the sha gate exists "to protect the CF Pages free build budget", so a systematic doubling is a real cost regression, introduced by me, an hour after shipping the change that caused it.

**auto-merge's own heal already avoids this.** Its comment reads: *"a run already queued/running for this same tip is a no-op."* The gate simply had not been carried into the second net.

## The decision

**a. Any deploy run for main's exact tip suppresses the dispatch — whatever its status.** Queued, in progress, or failed. A *failed* deploy for this tip is the deploy workflow's business to report; it is never a reason for a healer to stack another build on top of it. So the in-flight query carries **no** status filter, while the freshness comparison above it still uses `status=success`, because those two questions are genuinely different: *has this tip been served?* versus *has anyone already been asked to serve it?*

**b. Three outcomes get three return codes, because they are not the same thing.** `0` dispatched, `2` already in flight, `1` fresh-or-unresolved. Only `1` keeps looking, since only `1` can still change inside the watch window; `2` exits immediately rather than sleeping out four more looks over something already handled. And because the step runs under `set -euo pipefail`, the code is captured around a `set +e` — calling the function bare and letting it return non-zero would abort the job, which would have turned a correct no-op into a red run.

## Verification (DR-0076)

- **13 checks (4 new); 24 breaks applied for real, 24 caught, 0 missed, 0 no-ops.**
- New breaks caught: the in-flight gate deleted; the in-flight query narrowed to successes only (which is the exact bug this record exists for, re-introduced); already-handled turned back into something to keep waiting on; the already-handled exit removed; the return code no longer captured around `set +e`; and the freshness comparison losing its `status=success`.
- YAML re-parsed; the three triggers are unchanged.
- All eighteen earlier breaks from DR-0458 still caught, so nothing in this fix weakened the hook it corrects.

## What is still NOT proven

**That exactly one deploy now runs per merge.** The fix is verified against the workflow file, not against GitHub. It rides the same PR as L167 (#1651), pushed while that PR's CI was still in flight so the two commits merge together rather than leaving this one unpushed — which also means the merge that lands it is not a clean test of it, since a `workflow_run` reads the default branch at event time and whether that is the pre- or post-merge file is not something to predict. **So observe, do not forecast:** whichever merge first shows a `workflow_run` fire under the new file is the test. The proof is the same either way: **one** `Deploy (Cloudflare Pages)` run for main's new tip, and a `deploy-freshness` run on `workflow_run` that reports `ALREADY IN FLIGHT` or `FRESH` rather than dispatching. **`re-review: 2026-09-18`** — one merge away. If a second build still appears, the next thing to read is whether `runs?head_sha=` returns the auto-merge-dispatched run promptly enough, and the fallback is to have auto-merge's heal record the tip it dispatched somewhere this workflow can see.

## Files

- `.github/workflows/deploy-freshness.yml` — the in-flight gate and the third return code
- `app/src/__tests__/deploy-freshness-lane.test.js` — +4 checks
- `docs/decisions/DR-0458-*.md` — its "not proven" section closed by measurement
- `docs/decisions/INDEX.md` — row + pointer
