# DR-1605: The lane's rules, where agents read them

**Date:** 2026-11-19
**Status:** Accepted
**Tier:** A (documentation)
**Type:** lane
**Area:** `docs/CONTEXT.md` (new section "The delivery lane — how work lands")
**Pairs with:** DR-1601 / DR-1602 / DR-1603 / DR-1604, DR-0103 (motion is the default), DR-1297 (one CI run per commit), DR-0644 (keep PRs current)

## Context

Darrell, 2026-11-19, after a night in which eight lessons took minutes to write and hours to land: "fix our way of orchestrating the work then we should have better success." Part of the cost was how agents used the lane: pushes that restarted CI for nothing.

## What was measured

#2788 was re-synced with main five times, and each sync restarted its CI at the back of the queue. The ruleset does not require a branch to be up to date, so a clean merge of main bought nothing. 57 of the last 100 CI runs were cancelled, most by a newer push to the same branch. This session pushed DR-1601 to DR-1603 with a decision-record test failing that it could have run first; that cost one more full CI round each.

## Decision

The rules go in one short section of `docs/CONTEXT.md` (Layer 1, one hop from CLAUDE.md; CLAUDE.md is not grown). In brief: be green locally before the first push; keep a lesson PR lesson-only; reserve the number, then place the row and the usage line with their tools; merge main only when `git merge --no-commit --no-ff` shows a real conflict; copy a landed fix only when your CI failed on it; one re-run per failed job, then read the log; at most two PRs per session with CI running.

## Impact

These are rules for agents, not gates. Rules 3 and 4 are backed by machinery (the DR-1602 guards, and the conflict a merge reports). The others depend on the agent reading Layer 1. A gate for "pushed with a failing local test" is not attempted.

On the two things that wait on Darrell. `LANE_PUSH_TOKEN` would let keep-prs-current push the merges it resolves, so a resolved conflict would land without an agent. After DR-1601 and DR-1602 those conflicts should be rare, so it is not needed now; take it if conflicts are still measured after a week. The Vercel previews hit the 100-a-day cap and report red on every PR, but they are not required checks and Cloudflare Pages is the production road. Turn branch previews off in the Vercel project, or disconnect it.

## Verification

The section exists, and the decision-chain and record-length tests pass on this record. Measured again at the re-review: syncs per PR and cancelled runs per 100.

re-review: 2026-12-03
