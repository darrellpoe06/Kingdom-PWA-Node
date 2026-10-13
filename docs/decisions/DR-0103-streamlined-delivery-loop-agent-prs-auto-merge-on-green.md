---
id: DR-0103
title: The streamlined delivery loop — agent (claude/*) PRs ride the auto-merge lane and land on green gates without a manual merge; hold is the brake; pull the backlog, don't idle
date: 2026-07-05
status: accepted
supersedes: []
superseded-by: null
tier: B
entities: [all]
grounds: [VERIFICATION-DOCTRINE, APP-IS-PRIMARY, PERPETUAL-IMPROVEMENT, GOVERN-EXECUTE-ADVISE, EXECUTION-OUTCOME-OBSERVABILITY, THREE-BRAKES, DECISION-RECORDS]
source: 2026-07-05 — Darrell: "we are taking too long and we don't move when I'm not pushing, that is a constraint we need to remedy asap"; and "we can and should be more streamlined for progress to occur."
---

## Context

The hands-off delivery lane already existed (`auto-open-pr.yml` + `auto-merge.yml`
+ `ci.yml`) — its whole job is to land PRs on green with no human clicking merge.
But its eligibility filtered head branches to `^(feat|fix|merge|docs)/` and CI's
push trigger matched the same set. **Every remote/web session works on a
`claude/*` branch**, so every agent PR was invisible to the lane and could only
be landed by Darrell's hand. That structural gap WAS the "we don't move when I'm
not pushing" stall. A second, smaller cause: the agent parked idle turns on a
reflexive ~1-hour poll-timer that advanced nothing while a ~3-minute CI ran.

## Decision

1. **Bring `claude/*` into the sanctioned lane.** `claude/**` added to the CI
   push trigger, the auto-open-PR trigger, and the auto-merge eligibility regex.
   Agent PRs now ride the SAME default the repo already used: native auto-merge
   (squash) armed on open, **merging the instant the required gates pass** (lint
   + full Vitest + tenancy/contrast/isolation guards + real build). Merge =
   deploy (DR-0054). No human click.
2. **The gate is the brake; `hold` is the governor's hand.** A red PR never
   merges (DR-0076). The `hold` label parks a PR out of the lane for a soak or
   Governor review (Tier B/C — front-door, mission, COLG-facing, real money,
   schema; RELEASE-TIERS). Reverting the three workflow files is the off-switch.
   This is the integration gate deferring to verified truth — NOT the
   timer-driven, compute-spawning class THREE-BRAKES governs; nothing here runs
   on a clock or spawns compute.
3. **Cadence is matched to real change-rate — minutes, not a reflexive hour.**
   A poll-timer is only for a genuine external wait (CI in flight, a deploy),
   sized to it (~3 min for CI), never a stand-in for available work.
4. **Between prompts, pull the backlog forward.** Idle turns pull the next dated
   re-review / timeline / friction item and ship it through the verified lane.
   Silence is room to advance, not a stop signal.

## Consequences

- From the next agent PR onward, work lands on green by itself; Darrell's only
  touch-point is a `hold` label to keep something back.
- **Documented in the app (DR-0065):** the OpsBoard renders the live lane
  (auto-merge armed / `hold` parked / land order / merged SHAs, read live from
  the repo via `lib/github-ops.js`) beside a short statement of this model that
  cites this DR — the model and its live proof in one place. Locked in
  `CLAUDE.md` (Layer 0) and `ORCHESTRATION-AND-VERIFICATION-OPERATING-MODEL.md`
  §8, and in memory, so it survives context compaction.
- Higher-trust posture (agent-authored code auto-deploying on green) is bounded
  by the gates + `hold` + the one-line revert; the human still governs the
  bright lines by holding what should wait.

## Links

`.github/workflows/auto-open-pr.yml`, `.github/workflows/auto-merge.yml`,
`.github/workflows/ci.yml`, `app/src/components/OpsBoard.jsx`,
`app/src/lib/github-ops.js`,
`docs/00-foundations/_root/ORCHESTRATION-AND-VERIFICATION-OPERATING-MODEL.md` (§8),
`docs/99-session-notes/2026-07-05-orchestration-review.md`,
[DR-0077], [DR-0076], [DR-0102], [DR-0054], [DR-0065], [DR-0061].
