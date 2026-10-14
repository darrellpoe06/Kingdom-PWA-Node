# DR-1012: The last look is a window, not a glance — the heal loops keep looking after the last armed PR leaves

**Date:** 2026-10-14
**Status:** accepted
**Tier:** C (a change to the merge / CI / deploy lane — DR-0107 governs; proven by this record's own merge producing a real deploy, below)
**Type:** orchestration
**Area:**
- `.github/workflows/auto-merge.yml` (`heal-deploy` and `heal-migrate`: the look after `still=0` is eight 15 s looks that end early on the first dispatch, in place of one look 20 s later)
- `app/src/__tests__/migration-dispatch-lane.test.js` (the shape pinned in both loops; the single 20 s glance refused; proven to catch)

**Amends:** DR-0567 (the armed-while loop keeps its shape; its exit gains the window), DR-0458 (the event hook still fires after a sweep by a person's push; it does not fire after a sweep the bot's PR-open started, measured below)
**Grounds:** DR-0107 (a down or stale site is the worst outcome; prove the deploy), DR-0076 (measured, not assumed), the workflow's own comment history (misses one to nine)
**Declared by:** the lane, measured while proving the deploy for DR-1011 (#2161) per DR-0107

## Context

Every merge on this repository is a `GITHUB_TOKEN` squash, and GitHub suppresses the `push` event for it, so the deploy and the migrations are dispatched by auto-merge's own heal loops. Since DR-0567 each loop polls while any PR is armed, re-asks every two minutes whether anything is still armed, and when nothing is, takes one last look 20 s later and leaves. That one look is the whole protection for the merge that just landed, and on #2161 it was not enough: the merge landed, the loop left two seconds after it, and no deploy was dispatched. The site served DR-1010's build while main carried DR-1011 until the deploy was dispatched by hand at 01:13.

## What was measured

| | |
| --- | --- |
| #2161 merge commit (`68db35708`) | 2026-10-14 01:10:03Z |
| the sweep that armed it (run 38493589322, `pull_request`, started by the bot's PR-open) | 01:03:10 → **01:10:05**, conclusion `failure`, **no jobs listed, logs 404** |
| Deploy runs for `68db35708` at 01:12:50 | none |
| `deploy-freshness` `workflow_run` fire after that sweep | none (the last fire, 38491367230 at 00:39:01, followed sweep 38478678751, which a person's push had started) |
| Deploy dispatched by hand | 38494518671 at 01:13:19, green with boot-check at 01:15:38 |
| the same shape on #2160 (38478111721) and #2159 (38461203842) | both `failure`, no jobs listed, each ending at its PR's merge; their deploys were dispatched 8 s and 11 s after the run's end |

What the numbers say, and what they do not:

- The sweep ended at the merge, not before it: 01:10:05 against 01:10:03. The armed count reads 0 the moment GitHub takes the PR off the open list to perform the squash, so the loop's `still=0` branch ran, slept 20 s, read main, and the new tip was not yet readable at that read. The loop left believing main was already deployed. This is consistent with #2159 and #2160, where the same last look happened to land a beat later and dispatched.
- The three bot-started sweeps report `failure` with no jobs and no logs. That is not explained here and is not claimed to be; the fix below does not depend on it, and the next such run is to be read while it is still in progress (`re-review`, below).
- DR-0458's `workflow_run` hook did not fire after the bot-started sweep, which is GitHub's own suppression of events caused by `GITHUB_TOKEN` (the PR was opened by `auto-open-pr` with it). The hook stays; it is not the net for this case.
- The 5-minute freshness cron is an hours-scale net (measured in `deploy-freshness.yml`: 7.7 % of its requested fires), not a prompt one.

## Impact

- Unresolved: every single-push PR (one sweep, started by the bot's PR-open) depends on one 20 s glance to deploy, and the glance can land before the merge's tip is readable. The tenth miss of this class; each one is a stale site until a hand dispatches.
- The call obligates: a bounded cost (two reads per look, only after the last armed PR has left), no change to the armed-while shape DR-0567 pinned, and DR-0107's proof — this record's own merge must produce a deploy with no hand.

## Decision

1. **The last look is a window.** When the armed count reads 0, each heal loop looks up to eight times, 15 s apart (two minutes), calling the same sha-gated dispatch function, and leaves early the moment a dispatch goes out (`dispatched_for` changed). The window is long enough for the merge's tip to become readable and short enough to cost at most 16 reads.
2. **Both loops, the same shape.** `heal-migrate` gains the identical window, because a migration that lands in that beat is the worst shape there is (DR-0567's ordering note: code live against a schema it never got).
3. **The pin is a shape.** The lane test requires the window in both loops and refuses the single 20 s glance.

Not done, and said: why a bot-started sweep reports `failure` with no jobs is unmeasured (its logs are gone by the time it ends). `re-review: 2026-10-21` — read the next bot-started sweep while it runs (its job list and log), and confirm from three more single-push merges that each produced a deploy from the loop and none from a hand.

## Verification

- **`migration-dispatch-lane` (28):** both loops carry `last_dispatch="$dispatched_for"`, eight 15 s looks and the early exit; the single glance is refused (**proven to catch:** restoring `sleep 20;` in the migrate loop fails the suite: "both heal loops keep looking for the merge after the last armed PR leaves: expected 1 to be 2").
- The workflow parses (PyYAML); lint green on the test.
- **DR-0107 proof:** this record's PR is a single-push PR, so its own sweep is bot-started and runs this file's loop; its merge must produce a Deploy run for the merge SHA with no hand. The run id is recorded in the ledger row's closing note once observed.
