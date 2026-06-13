---
id: DR-0068
title: Autonomy trajectory — local validated against the latest vendor, then work runs 90% workflows / 10% governance, trending toward 1%
date: 2026-06-13
status: accepted
supersedes: []
superseded-by: null
refines: [DR-0056, DR-0063, DR-0064]
tier: C
entities: [all]
grounds: [GOVERN-EXECUTE-ADVISE, EARN-AUTONOMY, THREE-BRAKES, DATA-DRIVEN-LIVING, SOVEREIGN-FIRST]
source: 2026-06-13 — Darrell — "local AI validated against the latest vendor AI and work begins using our 90% workflows and my 10% governance so most work will be done within PoeTech without me doing 90% but 10% and eventually 1%."
---

## Context

The point of the whole AI stack is to move Darrell off the work and onto
governance — and then to shrink even the governance share over time as the
system earns trust. This names the trajectory and its precondition so the
build aims at it deliberately.

## Decision

**Precondition, then trajectory:**

1. **Precondition — validate before trust.** Work runs autonomously only after
   the local AI is validated against the *latest* vendor AI (DR-0063/0066: the
   head-to-head and the retained record establish where local is trustworthy).
   Validation is continuous, not one-time — "latest vendor" means the bar moves
   and local is re-checked against it.
2. **Start state — 90 / 10.** Once validated, work runs **90% through PoeTech
   workflows** and **10% Darrell governance**. Most work happens inside PoeTech
   without him doing it — he governs, he doesn't execute.
3. **Trajectory — toward 1%.** As the competence record (DR-0063) accumulates and
   autonomy is earned class by class (DR-0064, EARN-AUTONOMY), the governance
   share shrinks: 10% -> eventually **1%**. The system does more over time; Darrell
   does less.

**The floor is not zero.** Governance trends toward 1%, never to 0: the bright
lines (`pre-authorized-policies.yaml` — money, credentials, clinical data, the
family's voice, irreversible actions) ALWAYS require the governor regardless of
how much trust is earned. "1%" is the routine share, not the abolition of
governance. And the three brakes (CLAUDE.md) bound every autonomous step at every
stage of the trajectory.

Refines DR-0056 (staged autonomy), DR-0063 (the competence record that justifies
each step down), and DR-0064 (act-without-asking — the per-class mechanism by
which the share shrinks).

## Consequences

- Autonomy expands by EARNING it on evidence (the retained record), never by
  declaration — each step from 10% toward 1% is a class of work the record shows
  local handles reliably.
- The trajectory is a ratchet with a hard floor: bright lines never auto-promote
  (the policy file is senior to any approval history), so "1%" is durable, not a
  slide toward unsafe.
- Gives the roadmap a measurable aim: the governance share is itself a metric to
  watch fall as the system matures.
- Ships nothing by itself — the orchestrator stays Tier C, inactive until the
  staged greenlights (DR-0056); this sets the destination the staging climbs
  toward.

## Links

[DR-0056] (staged autonomy ladder), [DR-0063] (competence record that justifies
each step), [DR-0064] (act-without-asking), `_root/GOVERNANCE-EXECUTION-ADVISORY.md`
(the 90/10 three-role model), `docs/governance/pre-authorized-policies.yaml`
(the bright-line floor), the three-brakes rule in `CLAUDE.md`.
