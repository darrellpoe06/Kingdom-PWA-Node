---
id: DR-0006
title: Continuous multi-site review + upgrade loop, per-entity objectives
date: 2026-06-09
status: accepted
supersedes: []
superseded-by: null
tier: C
entities: [church, tlc, poetech]
grounds: [CAGE, TLC-FIREWALL, WORD-FIRST, COMMUNITY-FIRST, SOVEREIGN-FIRST]
source: 2026-06-08 church-LLM research-review (item F)
---

## Context
Review scope is not just the PoeTech App code — it is all three live web properties, each combed continuously for changes and upgrade opportunities.

## Decision
The LLM teams continuously review thechurchofthelivinggod.com, tlctherapysolutions.com, and poetech.us, proposing upgrades **each optimized to its OWN success objective**: Church → reach/engagement/discipleship (Father's Business, accessibility for an elderly tech-novice congregation); TLC → ethical client acquisition on the **public/marketing surface ONLY, never PHI, no profiling**; PoeTech App → adoption + quality (free-tier conversion, $89 discoverability, code/UX quality). Read-only → draft recommendations behind the Cage; per-tier gate.

## Rationale
Because "best possible results from each" is a per-entity objective function, not one generic metric; and because each site's gate differs by sensitivity ([DR-0003]).

## Consequences
TLC review never leaves the public surface. Proposals are ledger events; they graduate along the autonomy gradient ([DR-0010]). Impact is measured via the funnel/analytics ([DR-0008]).

## Links
[DR-0003], [DR-0008], [DR-0010], research-review §6.1.
