---
id: DR-0057
title: Continuous fruit loop — discover → do → gate → governed-merge; deterministic discovery now, autonomous execution staged + Tier C
date: 2026-06-13
status: accepted
supersedes: []
superseded-by: null
tier: C
entities: [all]
grounds: [THREE-BRAKES, GOVERN-EXECUTE-ADVISE, EARN-AUTONOMY, CAGE, DATA-DRIVEN-LIVING]
source: 2026-06-13 — Darrell asked whether n8n + Claude can work the low-hanging fruit continuously; greenlit (1) speccing it and (2) building the cheap-safe discovery half.
---

## Context

The 2026-06-12 session worked the low-hanging fruit (untested pure functions)
by hand across three passes (suite 25 → 108). Darrell asked whether that can run
continuously without him prompting. Yes — it is the orchestrator (DR-0056) +
Self-Extending Layer (DR-0037) joined into a loop, with the auto-merge boundary
governed by the already-written `docs/governance/pre-authorized-policies.yaml`.
The 2026-06-06 runaway bounds every autonomous stage.

## Decision

Build the continuous loop along the staged ladder in
`docs/99-session-notes/2026-06-13-continuous-fruit-loop-spec.md`:

1. **Stage A — continuous DISCOVERY (authorized now).** `scripts/fruit-scout.mjs`
   — a deterministic, $0, read-only scan that keeps the fruit queue full
   (untested exported functions). Safe by construction. The LLM discovery layer
   (Synthesizer on a schedule) ships inactive with the three brakes.
2. **Stage B — continuous EXECUTION (separate greenlight, Tier C).** The
   orchestrator works the queue and **auto-merges ONLY the additive-test class**
   (CI-green, no source changes); everything else opens a PR for Darrell. Needs
   R4 + three brakes + the governance policy. Ships inactive; never first-runs
   unattended.
3. **Stage C — widen the auto-merge class** only by deliberate additions to
   `pre-authorized-policies.yaml`; each class is its own governance decision.

Binding: three brakes on anything timer-driven (even read-only LLM discovery);
the auto-merge allowlist is hard; the loop auto-ships only where "verifiable" is
genuinely true and queues the rest; Tier C; ships inactive; never unattended
first-run.

## Consequences

- `fruit-scout.mjs` is live and surfaces the current queue (~44 untested
  utility fns). It authorizes no autonomous merging.
- Stages B/C gated on R4 + Darrell's greenlight + the governance policy.
- Adds roadmap R20.

## Links

`2026-06-13-continuous-fruit-loop-spec.md`, `scripts/fruit-scout.mjs`,
`docs/governance/pre-authorized-policies.yaml`, [DR-0055] (Synthesizer),
[DR-0056] (orchestrator), [DR-0037] (Self-Extending Layer), [DR-0054]
(release lane / CI gate), three-brakes (`CLAUDE.md`), `RELEASE-TIERS.md`.
