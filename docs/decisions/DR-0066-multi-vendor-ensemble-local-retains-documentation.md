---
id: DR-0066
title: Multi-vendor ensemble — all vendor LLMs connect to the local AI, all are compared, the final is synthesized from all, and the local AI retains the documentation
date: 2026-06-13
status: accepted
supersedes: []
superseded-by: null
refines: [DR-0062, DR-0063]
tier: C
entities: [all]
grounds: [SOVEREIGN-FIRST, DATA-AS-EMPOWERMENT, GOVERN-EXECUTE-ADVISE, DATA-DRIVEN-LIVING, THREE-BRAKES, CAGE]
source: 2026-06-13 — Darrell — "For rigorously using AI I would like to have any of the vendor LLMs connect to my local AI and we compare them and use the final from all and our local AI retains the documentation."
---

## Context

DR-0062 set local as the source of truth; DR-0063 added local-authors-then-
head-to-head-vs-vendor plus a bounded decision-history framework. Darrell now
sharpens the vendor side from a single comparison into an **ensemble** and names
the local AI as the **system of record**.

## Decision

For rigorous use, the AI layer runs as a local-anchored ensemble:

1. **All vendors connect to the local AI.** Any vendor LLM (Claude, Gemini, and
   any added later) connects *to* the local AI — the local model is the hub and
   the anchor, never a peer that a vendor coordinates.
2. **Compare all of them.** The local model authors its own answer (DR-0063) and
   gathers the vendors' answers, then compares across the whole set — not one
   challenger, the field.
3. **The final is synthesized from all.** The accepted result is drawn *from all*
   sources — the best of the field, reconciled by the local model against our
   truth and context — not a raw pick of one vendor's output. The local model is
   the synthesizer and the arbiter (DR-0062 holds).
4. **The local AI retains the documentation.** The record of each round — inputs,
   every source's answer, the synthesis, the verdict, the outcome — is kept BY
   the local AI, on hardware the family owns. This is where DR-0063's historical
   decision framework physically lives: sovereign, exportable, never surrendered
   to a vendor. The documentation is an asset the family keeps.

Refines DR-0062 / DR-0063; does not supersede. The sovereignty egress gate
(PHI/TLC/family-private never reaches a vendor), three brakes, terminal
conditions, and Tier-C/ships-inactive staging all still hold. The bounded-
collection caveat (DR-0063) still holds: retain the documentation that earns its
keep, not everything.

## Consequences

- The orchestrator (DR-0056) gains a synthesis step (reconcile-the-field) and a
  local-retained record store; both are part of its spec, not the app runtime.
- Vendor-independence deepens: the family keeps the accumulated reasoning record
  even if every vendor is dropped — the documentation is local and sovereign.
- Spend stays data-justified (DR-0063): the retained record shows where the
  ensemble's vendors actually improved the final, and where local alone sufficed.
- Ships nothing by itself — Tier C, inactive until the local runner is up and the
  staged greenlights are given (DR-0056).

## Links

[DR-0062], [DR-0063] (the head-to-head + decision-history this generalizes),
[DR-0056] (the orchestrator), `_root/AI-FOUNDATION-INTERNAL-OPERATIONS.md`,
`_root/DATA-AS-EMPOWERMENT-NOT-EXTRACTION.md` (the record is a family-owned asset),
the three-brakes rule in `CLAUDE.md`, `RELEASE-TIERS.md` (Tier C).
