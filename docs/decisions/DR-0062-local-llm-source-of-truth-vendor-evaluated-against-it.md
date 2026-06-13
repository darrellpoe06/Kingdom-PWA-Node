---
id: DR-0062
title: Local LLM is the source of truth; vendor LLMs are attached for capability but evaluated against local before use; the app stays vendor-independent
date: 2026-06-13
status: accepted
supersedes: []
superseded-by: null
refines: [DR-0056]
tier: C
entities: [all]
grounds: [SOVEREIGN-FIRST, DATA-AS-EMPOWERMENT, GOVERN-EXECUTE-ADVISE, DATA-DRIVEN-LIVING, THREE-BRAKES, CAGE]
source: 2026-06-13 — Darrell, clarifying the AI layer for the Projects/Build priority work — "The app should be independent of the vendor LLMs however we attach to them for their opportunities however the local LLMs are to be the source of the truth then source the vendor LLMs the evaluate against our local LLMs enough to use it."
---

## Context

DR-0056 specified the tiered-LLM orchestrator as a local↔vendor escalation
ladder (local first → escalate to vendor → fall back to local), bounded by an
outcome-judge. Darrell's 2026-06-13 clarification sharpens the TRUST DIRECTION
inside that ladder, which the naive reading ("the vendor model is bigger, so
trust its answer") gets backwards. It also makes vendor-independence a hard
property of the APP, not merely a fallback behavior of the orchestrator.

This was prompted by the Projects/Build priority work — where "AI pushes back on
order" must mean OUR AI on OUR data, not a vendor's judgment riding in
unevaluated.

## Decision

Three binding statements, in Darrell's words:

1. **The app is vendor-LLM-independent.** Every feature must fully function on
   the LOCAL LLMs alone. No surface, no decision, no flow may DEPEND on a vendor
   LLM being reachable, paid, or up. A vendor outage degrades quality at most —
   it never breaks function. Vendor LLMs are an attached *opportunity*, never a
   dependency.

2. **The local LLM is the source of truth.** It is the authority and the
   arbiter. When answers must be grounded, they are grounded against the local
   model and the family's own data — not against a vendor's training-data
   answer (this is the LLM-layer expression of "all answers come from our
   source," CLAUDE.md / the Worldview).

3. **Vendor LLMs are sourced for their opportunities, then EVALUATED AGAINST the
   local LLM before use.** We attach to vendor models for the extra capability
   they offer, but their output is not trusted on arrival. It is checked against
   the local model — the source of truth — and accepted only when it passes that
   evaluation ("evaluate against our local LLMs enough to use it"). The local
   model judges the vendor output, not the reverse.

This REFINES DR-0056 (does not supersede it): DR-0056's staging, three brakes,
sovereignty egress gate, and terminal-condition rails all still hold. This adds
the trust direction (local = truth + gate over vendor output) and the
app-independence property to that engine. The "outcome-judge" of DR-0056 is the
local model.

## Consequences

- The orchestrator's vendor calls sit BEHIND an evaluation layer keyed on the
  local model; a raw vendor response is never piped straight to the user or used
  to mutate state.
- The in-app AI-priority surface (the Projects/Build "AI pushes back on order"
  work) renders the LOCAL model's reasoning as the source of truth; vendor
  capability, when used, is shown as evaluated-and-accepted, not as the
  authority.
- The sovereignty hard gate from DR-0056 is unchanged: PHI / TLC / family-private
  tasks are local-only and never reach a vendor at all.
- Vendor-independence is now a testable property, not an aspiration: the
  acceptance bar is "turn every vendor key off — does the app still work?"
- Ships nothing by itself. The orchestrator remains Tier C, staged, inactive
  until greenlit (DR-0056). This DR sets the direction the build must follow.

## Links

[DR-0056] (the orchestrator this refines), [DR-0013] (sovereignty roadmap —
vendor-optional milestones), [DR-0055] (PM-AI, a consumer), `CLAUDE.md` (the
source-of-answers principle; the three-brakes rule), `RELEASE-TIERS.md` (Tier C),
`_root/AI-FOUNDATION-INTERNAL-OPERATIONS.md`.
