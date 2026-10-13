---
id: DR-0256
title: Ari runs a team of agents (+ subs) — a brakes-gated planner first, real dispatch armed on proof
status: accepted
date: 2026-07-30
tier: C
declared_by: Darrell
supersedes: none
builds_on: [DR-0141 (Ari persona), DR-0062 (sovereign-local first), DR-0185 (ari-loop MAPE-K), DR-0255 (lane-watch fabric), DR-0254 (ship active), DR-0225/0247/0248 (three brakes), DR-0076 (proven-to-catch)]
principles: [THREE-BRAKES (P10/P11/P12), SHIP-ACTIVE-FAIL-VISIBLE (DR-0254), SOVEREIGN-LOCAL-FIRST (DR-0062), MACHINERY-OVER-MEMORY (DR-0250)]
---

## Context

Darrell, 2026-07-30:

> "Ari should be able to use a team of agents and even more subs if and when
> necessary to support our users and systems... what is the gaps?"

The reality-trace (this session) found the gap: Ari is a persona over local
qwen2.5 with a rich MAPE-K loop (`ari-loop.js`, `CURRENT_AUTONOMY_STAGE =
'gated-auto'`), but the DISPATCH is inert — `llm-router.js:27` "This file NEVER
dispatches"; `planRun` is observability without dispatch. There is no runtime by
which Ari fans work out to a team of agents, let alone sub-agents. The three
brakes exist as proven importable primitives (`agent-brakes.js`:
`createBudget` / `acquireLock` / `killSwitch`) but nothing composes them into a
team dispatcher.

A team-of-agents dispatcher SPAWNS compute on Ari's initiative — it is squarely
the timer-driven / compute-spawning class the three-brakes law governs (the
2026-06-06 runaway). So it cannot simply "ship active and dispatch"; it must
carry budget + single-instance lock + kill-switch, proven-to-catch, before it
fires (DR-0225 / DR-0247 / DR-0248).

## Decision

**Build Ari's team capability the way `llm-router` shipped — plan-first, then
arm dispatch on proof — not dark, but brakes-gated.**

1. **Increment 1 (this DR): the brakes-gated PLANNER** — `app/src/lib/ari-team.js`.
   `planTeam(tasks, providers, brakes)` allocates each task to an agent (via
   `routeSpec`, sovereign-local first — DR-0062) and fans sub-tasks out to
   sub-agents ("even more subs when necessary"), then gates the plan: it is
   `dispatchable` ONLY when all three brakes are clear AND every task routed.
   `composeTeamBrakes` reads the live kill-switch + budget from `agent-brakes`.
   It DISPATCHES NOTHING — it produces the plan + the brake verdict, shipped
   ACTIVE as the observable "what Ari's team would run" (DR-0254: active,
   instrumented, fail-visible). Proven-to-catch: `ari-team.test.js` blocks the
   plan on each tripped brake and on an unroutable task (8 tests).

2. **Increment 2 (next): the in-app surface** — an "Ari's team" panel on the
   Admin → Systems console (built this session) rendering the live plan + which
   brake would hold it, so the team is observable before it can act.

3. **Increment 3 (arms dispatch): real fan-out** — the dispatcher acquires the
   lock, spends the budget per agent, beats the kill-switch heartbeat, and routes
   each agent to its provider over the existing server-side bus. It arms by merge
   once its brakes are proven-to-catch live (DR-0247/0248) — never before.

## Constraints (plainly — DR-0100)

- Compute-spawning on Ari's initiative = three-brakes class; dispatch never
  ships without budget + lock + kill proven-to-catch (P10/P11/P12).
- Sovereign-local first (DR-0062): a private task needs a sovereign local
  provider or it does not route.
- "Ship active" (DR-0254) applies to the PLANNER + its observability now; the
  dispatch half is active-on-proof, which is the brakes discipline, not a
  self-invented ship-inactive (DR-0250 fake-boundary line).

## Consequences

- `ari-team.js` + `ari-team.test.js` land this session (Increment 1).
- Increments 2–3 routed; re-review 2026-08-06 with the lane-watch fabric
  (DR-0255) — the same "team of bots/LLMs watching + supporting the systems."
