# DR-1012: The last look is a window, not a glance — and the healers hear CI, because a bot-opened PR's sweep never runs

**Date:** 2026-10-14
**Status:** accepted
**Tier:** C (a change to the merge / CI / deploy lane — DR-0107 governs; proven by real merges producing real deploys, below)
**Type:** orchestration
**Area:**
- `.github/workflows/auto-merge.yml` (`heal-deploy` and `heal-migrate`: the look after `still=0` is eight 15 s looks that end early on the first dispatch, in place of one look 20 s later)
- `.github/workflows/deploy-freshness.yml` (`workflow_run` now lists `"Auto-merge", "CI"`; the existing 5-look watch covers the seconds between CI green and the squash)
- `.github/workflows/migrate-freshness.yml` (gains `workflow_run` on `"CI"`; on that event the job settles 75 s before it reads main)
- `app/src/__tests__/migration-dispatch-lane.test.js`, `app/src/__tests__/deploy-freshness-lane.test.js` (the window pinned in both loops and the single glance refused; both healers must name CI exactly as `ci.yml` names itself; proven to catch)

**Amends:** DR-0458 (its hook hears Auto-merge's sweep END; the sweep a bot-opened PR starts never runs, so it never ends — the healers now also hear CI), DR-0567 (the armed-while loop keeps its shape; its exit gains the window)
**Grounds:** DR-0107 (a stale site is the worst outcome; prove the deploy), DR-0076 (measured, not assumed), DR-0458 §"what is still not proven" (it measured `action_required` on these sweeps and called half the lane dead)
**Declared by:** the lane, measured while proving the deploy for DR-1011 (#2161) per DR-0107

## Context

Every merge on this repository is a `GITHUB_TOKEN` squash, and GitHub suppresses the `push` event for it, so the deploy and the migrations are dispatched by watchers: auto-merge's own heal loops (polling while a PR is armed), and the two freshness healers (a cron GitHub delivers hours apart, plus DR-0458's `workflow_run` hook on Auto-merge completing). On #2161 the merge landed and nothing dispatched a deploy; the site served DR-1010's build while main carried DR-1011 until a hand dispatched it at 01:13. Two things were wrong, and the second was only visible by watching the next PR's sweep while it was still alive.

## What was measured

| | |
| --- | --- |
| #2161 merge commit (`68db35708`) | 2026-10-14 01:10:03Z |
| the sweep its PR-open started (38493589322, `pull_request`, actor `github-actions[bot]`) | 01:03:10 → **01:10:05**, conclusion `failure`, **0 jobs, logs 404** |
| Deploy runs for `68db35708` at 01:12:50 | none |
| `deploy-freshness` `workflow_run` fire after that sweep | none (the last fire, 38491367230 at 00:39:01, followed sweep 38478678751, which a person's push had started) |
| Deploy dispatched by hand | 38494518671 at 01:13:19, green with boot-check at 01:15:38 |
| **#2162's own sweep, read while alive** (38495287155, PR-open by the bot, 01:21:36) | **`completed` / `action_required` at the second it was created, 0 jobs** |
| the same sweeps for #2159 (38461203842) and #2160 (38478111721) | `failure`, 0 jobs, each "ending" at its PR's merge |
| what dispatched #2159's and #2160's deploys | an OLDER sweep, started by a person's push and still polling: 38461155144 (20:13:50 → 21:53:56) and 38478678751 (22:34:19 → 00:38:59) |
| sweeps alive at 01:10:03 | none |

What the numbers say:

- **A bot-opened PR's sweep never runs.** `auto-open-pr` opens the PR with `GITHUB_TOKEN`; the `pull_request` run GitHub creates for it is held for approval (`action_required`, 0 jobs) and turns `failure` when the PR closes. It emits no completion while the PR is open, so DR-0458's hook on Auto-merge completing never fires for it. DR-0458 measured this state on four runs and still hooked only the sweep's completion. Every single-push PR therefore has NO watcher of its own: it is deployed only if an older, person-started sweep happens to still be polling (luck on #2159 and #2160; nothing alive for #2161).
- **The person-started sweep's exit was one glance.** Since DR-0567 the loop leaves after one look 20 s after the armed count reads 0, and that count reads 0 the moment GitHub takes the PR off the open list to squash it. When the look lands before the new tip is readable, the loop leaves believing main is already deployed. That is the race the window closes; it is not what missed #2161 (no loop was running), but it is the next miss waiting in any multi-push PR.
- **CI's completion is the event that lands in the right seconds.** CI's run on the PR branch is started by a person's push, completes normally, and native auto-merge squashes within seconds of it going green. A `workflow_run` on `"CI"` fires then, and deploy-freshness's existing five looks 45 s apart cover the gap to the readable tip. Bounded: one queued run per CI completion, at most five read-pairs, no compute.
- The 5-minute freshness cron remains an hours-scale net (7.7 % of its requested fires, measured in the file).

## Impact

- Unresolved: every single-push PR deploys by luck, and every multi-push PR's last look can land a beat too early; each miss is a stale site until a hand dispatches, the tenth of this class.
- The call obligates: bounded cost (the window runs only after the last armed PR has left; the CI hook queues one run per CI completion), the armed-while shape DR-0567 pinned unchanged, both cron nets kept, and DR-0107's proof on real merges.

## Decision

1. **The last look is a window.** When the armed count reads 0, each heal loop looks up to eight times 15 s apart, calling the same sha-gated dispatch, and leaves early the moment a dispatch goes out (`dispatched_for` changed). Both loops, the same shape: a migration landing in that beat is the worst shape there is (DR-0567's ordering note).
2. **The healers hear CI.** `deploy-freshness` lists `"Auto-merge", "CI"`; `migrate-freshness` gains `workflow_run` on `"CI"` and settles 75 s on that event before reading main. A `workflow_run` trigger runs the file on the default branch, so these hooks are live from the moment this record merges.
3. **The pins are shapes.** The window in both loops and the single glance refused; each healer must name CI exactly as `ci.yml` names itself (the same rename hazard DR-0458 pinned for Auto-merge).

Not done, and said: why a bot-opened PR's sweep needs approval is a repository setting outside this file (DR-0458 named the likely one); `auto-open-pr` opening PRs with the optional `LANE_PUSH_TOKEN` (DR-0644) would make those sweeps run and is not changed here. `re-review: 2026-10-21` — read three single-push merges after this one: each must show a deploy-freshness run with `event: workflow_run` following its CI, and a Deploy run for the merge SHA dispatched by no hand; and decide whether `auto-open-pr` should open with the lane token.

## Verification

- **`migration-dispatch-lane` (29)** and **`deploy-freshness-lane` (+1):** both loops carry `last_dispatch="$dispatched_for"`, eight 15 s looks and the early exit; the single glance is refused (**proven to catch:** restoring `sleep 20;` in the migrate loop fails: "both heal loops keep looking … expected 1 to be 2"); deploy-freshness must list CI by `ci.yml`'s own name (**proven to catch:** `["Auto-merge"]` alone fails: `deploy-freshness must list "CI"`); migrate-freshness carries the CI hook and the 75 s settle.
- All three workflows parse (PyYAML); lint green on the tests; the 20 gates green.
- **DR-0107 proof, in two parts, stated plainly.** (a) The window: this record's PR carries two pushes, so a person-started sweep polls with the PR's own copy of the loop; its merge must produce a Deploy run for the merge SHA with no hand. (b) The CI hook runs from main's copy of the file and so is proven on the NEXT single-push merge, not this one. Run ids are added to the ledger row's closing note as each is observed.
