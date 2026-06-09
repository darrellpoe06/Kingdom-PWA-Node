---
id: DR-0001
title: GPU scheduling — three layers of yield on a 24/6.5 cadence
date: 2026-06-09
status: accepted
supersedes: []
superseded-by: null
tier: C
entities: [all]
grounds: [THREE-BRAKES, CAGE, COMMUNITY-FIRST, EARN-AUTONOMY]
source: 2026-06-08 church-LLM research-review (item A)
---

## Context
The sovereign review fleet shares CUDA RTX 4070 GPUs with humans and with church A/V. It must never contend with either, and must not run unbounded on a clock.

## Decision
The fleet is always the lowest-priority GPU tenant, gated by `may_run()` with three layers of yield in strict priority order: **(a) human-presence preemption** — a human actively using the system instantly reclaims the GPU (~1 s; the job pauses + frees VRAM, resumes after ~5 min idle); **(b) service-window blackout** — no compute 1 h before → 1 h after each church service; **(c) 24/6.5 Sabbath** — a 12 h pause every Sunday 00:00–12:00 Central. Priority: human > service > Sabbath > job. Layer (a) is the **4th brake** (human-demand kill-switch) on top of budget + concurrency lock + kill-switch.

## Rationale
Because the brakes must bound human-contention and compute the same way they bound runaway. The Sabbath is observance **and** a forced weekly cooldown no run can skip; a failure to engage it trips the kill-switch.

## Consequences
Fleet runs ≤156 h/week minus blackouts minus human demand. Requires the blackout calendar (see [DR-0007]). Pairs with the four brakes in the shared substrate ([DR-0003]).

## Links
[DR-0003] (entities/substrate), [DR-0007] (calendar source), research-review: `docs/99-session-notes/2026-06-08-research-review-church-network-llm-eval-and-app-review.md` §4.
