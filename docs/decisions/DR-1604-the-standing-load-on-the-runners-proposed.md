# DR-1604: The standing load on the runners (proposed)

**Date:** 2026-11-19
**Status:** Proposed (Tier C: every item touches a heal or a watch; nothing here is changed until Darrell takes it)
**Tier:** C
**Type:** lane
**Area:** `deploy-freshness.yml`, `migrate-freshness.yml`, `auto-merge.yml`, `camera-health.yml`, `site-health.yml`
**Pairs with:** CLAUDE.md "Autonomous Automation Requires Three Brakes", DR-0107, DR-0125, DR-1601 / DR-1603 / DR-1605, session note `2026-11-19-the-lane-orchestration-measured.md`

## Context

Darrell, 2026-11-19: "fix our way of orchestrating the work." PR CI and the deploy share one pool of runners with workflows that fire on a clock or on every other run's completion. The brief asked for a list of the scheduled load and a proposal, not a silent change, for anything that is a brake, a watch or a heal.

## What was measured

39 workflows are scheduled, about 1,600 scheduled job starts a day; the top five (`site-health` 432, `lesson-mail-watch`, `migrate-freshness` and `deploy-freshness` 288 each, `push-outbox-drain` 96) are 1,392 of them. Fired by other runs, from each one's last 100: Deploy freshness 20 an hour (49 cancelled, about 3 minutes each), Migration freshness 11 an hour (38 cancelled), Auto-merge 12 an hour (94 cancelled), whose `heal-deploy` job polls every 30 seconds for up to 60 minutes whenever any PR is armed. The full table is in the session note.

## Decision

Proposed, each to ship as its own `hold`-labelled PR with its proof, and to go active only when Darrell lifts the hold:

1. **Deploy freshness** runs on `workflow_run` only when the finished run was on main. A branch's CI finishing cannot make main's deploy stale. Expected about 20 an hour down to about 3, with the five-minute cron and main's own CI still watching.
2. **Migration freshness**, the same rule: about 11 an hour down to about 3.
3. **Auto-merge `heal-deploy`**: drop the 60-minute poll and keep its single look. Item 1 already looks after every CI run on main. This frees a runner held for most of every hour.
4. **Auto-merge `check_suite: completed`**: drop it, or run only `enable-auto-merge` on it. 94 of the last 100 runs were cancelled before they did anything.
5. **Camera health** fires twice per deploy (`workflow_run` on the deploy plus the deploy's own dispatch): keep the dispatch.
6. **Site health**: fold its three jobs into one at the same 10-minute cadence (432 job starts a day down to 144). The witness stays exactly as often.

## Impact

Items 1 to 4 remove the heals' reaction to branch activity and leave their reaction to main untouched. The risk is a heal that no longer fires on some path that reaches main without a CI run on main. Each PR must show that path does not exist, or keep a trigger for it. Item 6 changes how the witness is laid out, not what it checks or how often.

Not proposed: lengthening any cadence of a watch on the live site. Uptime outranks runner minutes (DR-0107).

## Verification

None yet. Each item's PR carries the lane test that pins its trigger, proven to catch the old trigger. It is measured a week after it is taken, against the session note's rates.

re-review: 2026-11-26 (Darrell's call on items 1 to 6; until then nothing changes).
