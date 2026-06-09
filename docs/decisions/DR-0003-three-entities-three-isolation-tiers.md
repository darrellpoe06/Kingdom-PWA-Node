---
id: DR-0003
title: Three entities, three sensitivity tiers (ISO-1/2/3); TLC is senior
date: 2026-06-09
status: accepted
supersedes: []
superseded-by: null
tier: C
entities: [church, tlc, poetech]
grounds: [TLC-FIREWALL, WORD-FIRST, COMMUNITY-FIRST, CAGE, SOVEREIGN-FIRST]
source: 2026-06-08 church-LLM research-review (item C)
---

## Context
The LLM team(s) support the business systems of three entities; each carries a different sensitivity and therefore a different guardrail. Everything below (DR-0006..DR-0010) is governed by these tiers.

## Decision
Three tiers, with a shared Cage substrate (allowlist + append-only ledger + health-gate + the four brakes) as the floor:
- **ISO-1 — TLC** (tlctherapysolutions.com): HIGHEST ISOLATION. HIPAA/PHI. Sovereign-only, no vendor/cloud LLM on any TLC data path ever, fail-closed. **Senior to every other objective, principle, and loop in the system.** LLMs touch the public/marketing surface only; zero PHI in any analytics, identity, or decision dataset.
- **ISO-2 — Church** (COLG / thechurchofthelivinggod.com): doctrine-gated. Human/doctrine approval before any publish; Word-first.
- **ISO-3 — PoeTech App** (poetech.us): Cage-gated; code/product (review-then-merge) + marketing copy (lightest sub-tier).

## Rationale
Because PHI + a vendor LLM is an unrecoverable breach, and doctrinal copy carries the church's authority. Sensitivity sets the gate; the Cage + four brakes are the floor under all three.

## Consequences
TLC ISO-1 constrains DR-0006 (review), DR-0007 (calendar), DR-0008 (funnel), DR-0009 (identity/data), DR-0010 (autonomy) — public-surface-only, zero PHI, no exceptions.

## Links
[DR-0006]..[DR-0010], research-review §2.
