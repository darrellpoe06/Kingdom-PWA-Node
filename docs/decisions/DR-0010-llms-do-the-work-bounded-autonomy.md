---
id: DR-0010
title: LLMs do the work — bounded autonomy, reconciled with the brakes
date: 2026-06-09
status: accepted
supersedes: []
superseded-by: null
tier: C
entities: [all]
grounds: [GOVERN-EXECUTE-ADVISE, CAGE, THREE-BRAKES, TIER-C, EARN-AUTONOMY, TLC-FIREWALL, WORD-FIRST]
source: 2026-06-08 church-LLM research-review (item J)
---

## Context
Darrell: "the LLMs should create solutions AND do the work it's requesting from staff — unless staff MUST be involved; we want staff working as little as possible." This pushes toward more execution autonomy; the 2026-06 runaway + the three brakes push toward restraint. Must synthesize, not contradict.

## Decision
LLMs **execute end-to-end wherever work does not STRUCTURALLY require a human** — not draft-and-hand-off. Autonomy is **bounded by the Cage (four brakes + allowlist + append-only ledger + health-gate/auto-rollback), NOT by routing toil through a human.** The human gate is reserved for **irreducible JUDGMENT, never labor**, in exactly five classes: (1) doctrinal/church-content publish, (2) TLC clinical/PHI decisions, (3) money movement/transactions, (4) destructive/irreversible actions, (5) final green-lights. Everything else → the LLM does it. Staged: read-only → draft → **scoped autonomous EXECUTION behind the Cage** (low-sensitivity, reversible) → human gate only where structurally required. **Autonomy is earned per surface as the Cage proves safe on it.**

## Rationale
Because the 2026-06 runaway happened from automation running **without** the Cage primitives — not from executing. The lesson is **"no autonomy without the Cage," not "no autonomy."** Brakes bound blast-radius and compute; they do not require a human to push the button on reversible low-sensitivity work.

## Consequences
Staff toil drives toward zero. The five classes never go autonomous; sensitive surfaces never leave stage 1–2 ([DR-0002]). Graduation readiness is judged from per-surface ledger outcomes ([DR-0004]), echoing the quarantine bright line.

## Links
[DR-0002], [DR-0003], [DR-0005], [DR-0007] (green-light example), research-review §8.
