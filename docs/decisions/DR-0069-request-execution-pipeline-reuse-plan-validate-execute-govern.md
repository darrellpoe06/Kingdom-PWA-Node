---
id: DR-0069
title: Request-execution pipeline — reuse the 90%-done work, local authors a plan, vendors validate, execute what's doable, govern only if/when needed
date: 2026-06-13
status: accepted
supersedes: []
superseded-by: null
refines: [DR-0063, DR-0066, DR-0068, DR-0047]
tier: C
entities: [all]
grounds: [GOVERN-EXECUTE-ADVISE, EARN-AUTONOMY, DATA-DRIVEN-LIVING, SOVEREIGN-FIRST, THREE-BRAKES]
source: 2026-06-13 — Darrell — "local uses our 90% done work to start users requested work then creates a plan then validation from vendor LLMs then begins the work that can be done and the governance from me if needed when needed."
---

## Context

DR-0062/0063/0066 set the trust model (local source of truth, vendors evaluated
against / ensembled, local retains the record). DR-0068 set the destination
(90/10 trending to 1%). This names the **operational pipeline** a single user
request runs through end to end — the sequence that produces the 90/10 in
practice.

## Decision

When a user requests work, the system runs this pipeline:

1. **Start from the 90%-done work — reuse, don't rebuild.** The local AI begins
   from what is ALREADY built — the existing workflows, modules, prior decisions,
   the composable spine (DR-0045) — not from scratch. Most of what any request
   needs already exists; the job is compose + fill the delta. **This reuse is
   what makes the 90/10 possible:** the system isn't doing 90% of the work fresh,
   it's assembling ~90% that's done and producing the small remainder.
2. **Local authors a plan.** The local AI drafts the plan for the request — the
   assembly + the delta — grounded in the existing work (DR-0063: local authors).
3. **Vendors validate the plan.** The plan is validated by the vendor LLMs
   (DR-0066 ensemble / DR-0063 head-to-head): local stays arbiter, vendors
   validate and improve, the final is reconciled by local, and the local AI
   retains the documentation.
4. **Begin the work that can be done.** Execution starts on the portion that is
   doable now — the workflows do the work (the 90%). What isn't doable (blocked,
   bright-line, ambiguous) is held, not forced.
5. **Governance from Darrell — if needed, when needed.** The governor is brought
   in only for the genuine decisions, bright lines, and clarifications (the 10%,
   trending to 1% — DR-0068), and only at the moment it's needed — not as a gate
   on every step. Just-in-time governance, not a standing checkpoint.

Refines DR-0063/0066 (the AI trust loop this sequences), DR-0068 (the trajectory
this realizes), and DR-0047 (the PMO method engine — this is its run-loop for an
incoming request). Every stage is bounded by the three brakes and the sovereignty
egress gate; the pipeline is Tier C and ships inactive until the local runner is
up (DR-0056).

## Consequences

- The orchestrator's per-request loop has a defined shape: reuse -> plan ->
  validate -> execute-doable -> escalate-if-needed. The spec
  (`2026-06-13-tiered-llm-orchestrator-spec.md`) gains this run-loop.
- **Reuse is a first-class requirement, not an optimization:** a request handler
  that rebuilds what exists instead of composing the 90%-done work is doing it
  wrong — it breaks the economics of 90/10. Pairs with DR-0045 (one engine,
  instantiated, never re-built per domain).
- Governance is just-in-time and exception-only, which is what lets the share
  fall toward 1% without removing the floor (DR-0068 bright lines).
- In-app: the request INTAKE already exists (feedback / Dev-Ops "wrap me" /
  Council Chamber); the plan/validate/execute/govern PROGRESS view lands with the
  local brain (design-only now — no painted pipeline over a brain that isn't up).

## Links

[DR-0063], [DR-0066] (the trust/ensemble loop), [DR-0068] (90/10 -> 1%),
[DR-0047] (PMO method engine — the run-loop), [DR-0045] (one composable engine —
the reuse substrate), [DR-0056] (the orchestrator), the three-brakes rule in
`CLAUDE.md`, `RELEASE-TIERS.md` (Tier C).
