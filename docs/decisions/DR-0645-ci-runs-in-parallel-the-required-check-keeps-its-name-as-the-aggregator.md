# DR-0645 — CI runs in parallel: the suite is split into shards, the probes run beside it, and the required check keeps its name as the aggregator

- **Status:** accepted
- **Tier:** B (a change to the merge lane; proven on real runs, including a deliberate red, before merge, and proven to deploy after merge per DR-0107)
- **Type:** process
- **Date:** 2026-09-24
- **Scope:** `.github/workflows/ci.yml` (the `app` job split into `guards`, `vitest` ×4 shards, `probes`, `layout`, and the `app` aggregator; a per-ref `concurrency` group); `scripts/chrome-layout-probe.mjs` (`CHROME_IDLE_CAP_MS`, the chrome-case idle wait)
- **Principles:** STREAMLINED-DELIVERY (DR-0103), VERIFICATION-DOCTRINE (DR-0076 §3, proven-to-catch), PROVE-THE-DEPLOY (DR-0107), SPEAK-ESTABLISHED-FACT (DR-0100), PERPETUAL-IMPROVEMENT (DR-0075)
- **Grounds:** Darrell, 2026-09-24: *"Our processes work way faster than this!!!!!!!!!!!!!!!"*

## Context

Every PR waited on one job, `app — lint + vitest`, which ran every gate one after another. Darrell said the processes should run far faster than they did.

## What was measured

- **Run 36066491340** (the "before"): the required check ran **22:16:29 → 22:36:28, 20.0 minutes**. Its steps: setup + lint 0:45; node guards 0:02; **vitest 11:34**; python selftests 0:05; build 0:35; SW-nav 0:13; **chrome-layout selftest 0:45; chrome-layout sweep 5:48**; read-highlight + scripture 0:04.
- A full vitest run logged 668.70 s: collect 585 s, environment 430 s. The suite is about 1,200 files and 20,100 tests.
- Inside the sweep, **`markets` took 45 s at each of its four widths**, 3 of the sweep's 5 minutes. Markets polls outside quote relays (`components/Markets.jsx:41-50`) that never go quiet from a runner, so `networkidle` ran out its full 45 s timeout every time. Every other view settled in 1.3–2.5 s.

## Decision

1. **The gates run as parallel legs.** No gate was removed; each one moved to a leg.
   - `guards` runs lint and every `node ../scripts/*-guard` step.
   - `vitest` is a matrix of **4 shards** (`npx vitest run --shard=i/4`). The shards are disjoint parts of the file list, and together they are the whole suite. `fail-fast: false`, so every failing test is reported.
   - `probes` runs the python selftests, the table-a11y, GPU and surface-audit guards, the real build, the asset-size guard, the SW-navigation gate, the chrome-layout **selftest**, read-highlight, the microphone probe (DR-0636, which landed on main during this work and merged into this leg) and scripture inference.
   - `layout` runs its own build and the chrome-layout **sweep**.
2. **The required check keeps its exact name.** The job `app`, named `app — lint + vitest`, is now the aggregator. It `needs: [guards, vitest, probes, layout]` and runs `if: always()`. It fails unless every leg's `result` is `success`.
   - Without `always()`, a failed leg would leave this job **skipped**, and a skipped required check counts as passing.
   - With it, a failed, cancelled or skipped leg turns the required check red.
3. **The npm cache** was already on (`actions/setup-node` `cache: npm`) and stays on in every leg. The logs show it hitting: "Cache hit occurred on the primary key node-cache-Linux-x64-npm-…".
4. **The chrome sweep stops waiting on nothing.** A chrome case now waits at most `CHROME_IDLE_CAP_MS` = 10 s for the network to go quiet, where it used to wait 45 s. After the cap it measures exactly as before: `waitForSelector('header h1')` still has to find the header, and every invariant still runs. The lesson, text-scale, hideaway and presenter passes keep their 45 s.
5. **A newer commit cancels its own older run.** `concurrency: ci-${{ github.ref }}` is set, with `cancel-in-progress` on every ref except `main`.
   - Push runs (`refs/heads/…`) and pull_request runs (`refs/pull/N/merge`) have different refs, so they never cancel each other.
   - `main` is never cancelled.

## Shard count: measured, then picked

| Shards | Shard durations (job start → end) | Run |
|---|---|---|
| 6 | 1.4, 2.2, 2.4, 2.4, 2.4, 2.4 min | 36073585592 |
| 4 | 2.5, 3.2, 3.4, 3.4 min | 36074351607 |

Six shards save under a minute per shard, because per-file collect and environment setup dominate. They cost two more runners per run on an account whose runners were already saturated (see Impact). The chrome-layout leg is the long pole either way. **Four shards were picked.**

## Before and after (the required check, same PR lane)

- **Before:** run 36066491340, **20.0 min** wall clock. It is one serial job, so queueing does not show in it.
- **After, critical path:** the longest leg in run 36074351607 was `layout` at **4.3 min** (build 0:34, sweep 3:25; the sweep was 5:48 before). The shards took **2.5–3.4 min**, `probes` 1.9 min, `guards` 0.7 min, and the aggregator about 5 s. With runners free, the required check finishes in **about 4.5 minutes**, roughly a 4× cut.
- **After, measured wall clock under load:** run 36074351607 spent **28.7 minutes** from creation to the green aggregator (23:45:59 → 00:14:41). **24 minutes of that was waiting in the runner queue.** 17–18 CI runs were queued and 17 in progress across the repository at that moment, and most still ran the old single 20-minute job. The first 6-shard run, 36073585592, was less contended: **7.1 min** wall clock (23:36:34 → 23:43:41), with the old 45 s markets wait still in it.
- The final PR run's times are in the PR thread (#1805).

## Proven to catch (DR-0076 §3): a red shard turns the required check red

- **Scratch branch:** `claude/scratch-red-shard-proof`, PR #1806, closed unmerged.
- **What it did:** one deliberately failing test (`expect(1).toBe(2)`) was pushed there. Run **36073643722**: `app — vitest shard 2/6` → **failure**, and the aggregator `app — lint + vitest` → **failure** (job 107882477688). The log reads: `guards: success / vitest: failure / probes: success / layout: success`, then `##[error]required legs did not pass: vitest`.
- **A second, unplanned proof on this PR's own lane:** run **36076894850** (head 1b94758). `app — vitest shard 3/4` caught a real defect. `decision-chain.test.js` found that this record was missing its evidence and impact headings. The aggregator went red, and native auto-merge did not merge PR #1805. The same run shows the superseded-run cancel working: the older run for 9e64efd, 36076811323, ended **cancelled** when 1b94758 was pushed. The run took **6.4 min** from creation to the red aggregator (00:18:03 → 00:24:27).
- **Cleanup:**
  - The branch was then force-reset to `main`'s tip (88f445c6), so the failing test exists on no branch.
  - The session's git proxy refused the ref **deletion** itself ("Write access to this GitHub API path is not permitted through this proxy"). The empty branch name remains for a one-click delete.

## Checked: the auto-merge and auto-open-pr interaction

- **Native auto-merge waits on branch protection's required checks by name.** `auto-merge.yml` enables it with `gh pr merge --auto --squash` and never names a check itself. The name `app — lint + vitest` still exists and is still produced for every PR head SHA, by the aggregator. The shard, probe and layout legs are not required checks, so they cannot block or bypass anything alone. They reach the merge only through the aggregator, and it is red unless all of them passed.
- **`auto-merge.yml` also sweeps on `check_suite: completed`.** The CI suite now completes when its last job, the aggregator, completes, which is the same moment the required check resolves.
- **`auto-open-pr.yml`** is unchanged. The push-triggered CI run still attaches its checks, including the aggregator, to the SHA of the token-opened PR.
- **The deploy wait loop in `auto-merge.yml`** was sized to span a full CI run. A shorter run only shortens the wait; nothing depends on CI taking long.
- **`verify-covers-ci-guards.test.js`** reads the guard list between `npm run lint` and `npx vitest run`. The `guards` job is written first in the file so that list is unchanged. `npx vitest run --shard=…` still matches, and so does `system-flow-registry.mjs`'s `npx vitest run` token.
- **After merge:** the deploy run (`deploy-cloudflare-pages.yml`) whose `head_sha` equals `main` is recorded in the PR thread (DR-0107).

## Impact: what remains open, with dates

- **The runner pool, not the suite, is now the ceiling.**
  - Each commit pushed to a branch with an open PR runs CI **twice**, once for `push` and once for `pull_request`, on the same SHA. That doubles runner use.
  - Deduplicating it safely is not a one-line change. Skipping the pull_request run would leave a **skipped** `app — lint + vitest` on the same SHA, which could read as passing.
  - The superseded-run cancellation (item 5) is the safe part and shipped here.
  - Total runner-minutes per run are about the same as before: roughly 19 now against 20 before. So throughput holds, and per-run latency falls once the other branches take this `ci.yml` from main.
  - `re-review: 2026-10-08`. By then, measure queue time on runs made after the fleet has merged main. If queueing still dominates, bring the push/pull_request dedup, or a larger runner plan, as its own DR with its own proof.
- **The chrome sweep is still the long pole, at about 3.4 minutes.**
  - The next cut is to split it into two legs by view, while keeping its counted-coverage assertion (DR-0323) whole across the parts.
  - `re-review: 2026-10-08`.
