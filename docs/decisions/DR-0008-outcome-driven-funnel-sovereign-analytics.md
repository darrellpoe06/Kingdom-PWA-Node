---
id: DR-0008
title: Outcome-driven marketing funnel + sovereign, privacy-respecting analytics
date: 2026-06-09
status: accepted
supersedes: []
superseded-by: null
tier: C
entities: [church, tlc, poetech]
grounds: [NO-DATA-SALE, ALIGNED-FUNDING, SOVEREIGN-FIRST, TLC-FIREWALL, DATA-DRIVEN-LIVING]
source: 2026-06-08 church-LLM research-review (item H)
---

## Context
We need best-in-class tracking + an automated marketing funnel, tuned by outcomes — without adopting extractive analytics.

## Decision
Use **self-hosted, privacy-respecting analytics (NOT Google Analytics)** — e.g. self-hosted Plausible / Umami / Matomo / GoatCounter, cookieless, data on the NAS — per entity, with an automated funnel and an **outcome-driven loop where the LLMs tune the funnel on measured results.** Per-entity objective: Church (visitor → attendance → discipleship); **TLC (public visitor → appointment request; ethical; ZERO PHI; no client-level tracking or profiling)**; PoeTech (visitor → free-tier → $89 where appropriate).

## Rationale
Because sovereign analytics fit cost-discipline + NO-DATA-SALE + aligned-brand funding, and the analytics ARE the telemetry the loop re-bases on ([DR-0004]) and optimizes against. The structural refusal to extract is the moat.

## Consequences
TLC analytics carry no PHI, ever. Funnel changes graduate through the staged/autonomy path ([DR-0010], [DR-0002]). Feeds [DR-0005] and [DR-0004].

## Links
[DR-0003], [DR-0004], [DR-0005], [DR-0009], [DR-0010], research-review §6.3.
