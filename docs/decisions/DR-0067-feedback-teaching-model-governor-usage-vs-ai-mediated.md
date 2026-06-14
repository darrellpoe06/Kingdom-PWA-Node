---
id: DR-0067
title: Feedback teaching model — Darrell's own app usage is the fastest teaching signal; other users' feedback is AI-mediated and escalates to him only for governance
date: 2026-06-13
status: accepted
supersedes: []
superseded-by: null
refines: [DR-0044]
tier: B
entities: [all]
grounds: [GOVERN-EXECUTE-ADVISE, QUALITY-OF-LIFE, ANXIETY-CLARITY, DATA-DRIVEN-LIVING, COMMUNITY-FIRST]
source: 2026-06-13 — Darrell — "the ways I work within the PoeTech App will be what teaches us what to change as fast as possible however the feedback from other users will be accompanied by a local AI or vendor and only come to me for guidance and governance and clarification."
---

## Context

Two feedback streams drive what PoeTech changes, and they are not equal in
latency or in how they reach Darrell. This sets how each is handled so the
build-loop runs fast without making Darrell the funnel for all user input.

## Decision

**Two streams, two handling rules:**

1. **Darrell's own usage is the fastest teaching signal.** How Darrell actually
   works inside the app — what he reaches for, where he stalls, what he
   reorders, what he ignores — is the primary, highest-priority driver of what
   to change, and it changes things *as fast as possible*. His lived use is
   direct instruction to the system; it does not wait in a queue behind other
   input. (This is why the in-app surfaces must be live and real — DR-0061/0065:
   his real use is only legible if the surfaces reflect real state.)

2. **Other users' feedback is AI-mediated, escalate-to-governor-only.** Feedback
   from every other user is received and worked by a local AI (or a vendor under
   DR-0062/0066) FIRST — triaged, clustered, answered, and resolved where it can
   be — and reaches Darrell ONLY for **guidance, governance, and clarification**:
   the genuine decisions, the bright lines, the ambiguities a model shouldn't
   settle alone. Darrell is not the inbox for all user feedback; the AI absorbs
   the volume and surfaces only the governor-grade calls.

This refines DR-0044 (interface-as-collaborative-partner) and operationalizes
the 90/10 (GOVERNANCE-EXECUTION-ADVISORY): the AI does the feedback labor, the
human governs the exceptions.

## Consequences

- The in-app feedback system (FeedbackModal -> feedback table) becomes the intake
  for the AI-mediation layer; resolved feedback never needs Darrell, escalations
  land in the governance decision queue (`docs/governance/decision-queue.md`).
- Darrell's usage telemetry is a first-class change-driver — but per
  DATA-AS-EMPOWERMENT it is HIS data serving HIM, never extraction, and other
  users' usage is treated under the same consent rules (aggregate, opt-in).
- The AI-mediation itself needs the local brain (DR-0056) and stays design-only
  until that's up; the intake (feedback capture) and the escalation target (the
  queue) already exist, so the human-governance half is live now.
- PHI/TLC feedback never routes to a vendor (sovereignty gate, DR-0062/0066).

## Links

[DR-0044] (collaborative-partner interface), [DR-0062]/[DR-0066] (who mediates),
[DR-0056] (the brain that does the mediating), `docs/governance/decision-queue.md`
(where escalations land), `_root/GOVERNANCE-EXECUTION-ADVISORY.md` (the 90/10),
`_root/ANXIETY-CLARITY-PRINCIPLE.md`, `_root/DATA-AS-EMPOWERMENT-NOT-EXTRACTION.md`.
