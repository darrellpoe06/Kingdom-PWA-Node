---
id: DR-0056
title: Tiered-LLM orchestrator ("the perpetual fix") — local↔vendor escalation ladder, staged + braked + sovereignty-gated
date: 2026-06-13
status: accepted
supersedes: []
superseded-by: null
tier: C
entities: [all]
grounds: [THREE-BRAKES, GOVERN-EXECUTE-ADVISE, SOVEREIGN-FIRST, EARN-AUTONOMY, DATA-DRIVEN-LIVING, CAGE]
source: 2026-06-13 — Darrell described the NAS waking Claude + Gemini for more power/better outcomes and falling back to local when vendors can't create (a perpetual fix), scheduled around vendor-hours; greenlit speccing it.
---

## Context

The Sovereign Orchestrator was already ratified in pieces (DR-0001 GPU yield,
DR-0029 escalate tier, DR-0037 Self-Extending Layer, DR-0040 auto-tagging, the
2026-06-09 architecture, DR-0053 the 4070 runner). Darrell's 2026-06-13
description sharpened it into a concrete escalation ladder with a resilience
posture and a scheduling model. It is the engine of the 90/10 he wants — and the
highest-risk capability on the roadmap (autonomous, self-triggering, spawns
compute, spends real vendor money), bounded by the 2026-06-06 runaway lesson.

## Decision

Build the tiered-LLM orchestrator along the staged ladder specified in
`docs/99-session-notes/2026-06-13-tiered-llm-orchestrator-spec.md`:
local (Tier 0) → escalate to vendor (Tier 1) → fall back to local (Tier 2),
routed by a confidence + sensitivity classifier, bounded by an outcome-judge
that gives every run a terminal condition.

Binding rails (every stage):
- **Sovereignty hard gate** — PHI / TLC / family-private tasks are local-only and
  can NEVER escalate to a vendor (tag decides, egress guard enforces, mis-tag
  defaults to local).
- **Three brakes** — budget (the prepaid vendor pool is the hard ceiling, per
  Darrell; per-run + per-day sub-budgets bound the rate so a loop can't burn the
  pool), concurrency lock, kill-switch.
- **Terminal condition on every run** — perpetual across tasks over time, NEVER
  an infinite loop on one task.
- **Staged autonomy** — v0 advisory (propose-only, zero unattended spend); v0.5
  bounded auto on one task type; v1 scheduled vendor-hours, **Tier C, ships
  inactive, never self-activates unattended, never while traveling.**

## Consequences

- Recording authorizes nothing built/run (DR-0041); v0/v0.5/v1 are separate
  greenlights. v1 is Tier C.
- Gated on R4 (the local runner), which is gated on Darrell's infra values.
- R19 on the roadmap now references this spec.
- Reuses `ANTHROPIC_API_KEY` (Synthesizer); adds a Gemini key when built.

## Links

`2026-06-13-tiered-llm-orchestrator-spec.md`, `2026-06-09-sovereign-ai-orchestrator-architecture.md`,
[DR-0001], [DR-0029], [DR-0037], [DR-0040], [DR-0053], [DR-0055] (the PM-AI, a
consumer of this engine), the three-brakes rule in `CLAUDE.md`,
`RELEASE-TIERS.md` (Tier C).
