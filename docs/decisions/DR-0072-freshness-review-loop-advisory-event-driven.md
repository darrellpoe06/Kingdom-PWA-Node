---
id: DR-0072
title: Freshness-review loop — saved links diffed against our practice into the governance queue; advisory, event-driven, three brakes
date: 2026-06-13
status: accepted
supersedes: []
superseded-by: null
tier: C
entities: [all]
grounds: [THREE-BRAKES, GOVERN-EXECUTE-ADVISE, CAGE, SOVEREIGN-FIRST, DATA-DRIVEN-LIVING, RESEARCH-FIRST, SURFACE-PREMISE, TIER-C]
source: 2026-06-13 — Darrell: "something on the local NAS n8n to make sure we are doing things based on the latest best practices and constantly review and suggest updates and fixes based on the latest information; sources are the same ones we use when uploading links."
---

## Context

Darrell wants the system to keep itself current: continuously check our
practices / code / workflows against the latest best practices and propose
updates — sourced from the **same links the family already curates** (wf22
Link-title resolver / Notes), which trend toward latest-info discussions people
ask about. "Constantly review" is timer/event-class automation, so the
2026-06-06 runaway rule governs; fetched web content is untrusted, so the
instruction-source boundary governs.

## Decision

Build a NAS-resident **freshness-review loop** that is **event-driven and
advisory-only**:

- **Trigger = a real event** (a new link saved / tagged for review), NOT a clock
  (DR-0042). No high-frequency polling, no self-requeue.
- **Pipeline:** fetch the link (extend wf22) → local Ollama summarizes "what
  current practice does this assert?" → auto-tag (DR-0040) → diff against our
  repo / workflows / foundation docs → if it diverges, draft a proposal
  {what's new · where we diverge · suggested fix · **source citation**} → wf36
  Quality Gatekeeper screens it → append **one** OPEN item to
  `docs/governance/decision-queue.md`.
- **It PROPOSES; it never mutates.** No code / workflow / content is changed by
  the loop — accepted proposals become normal build tasks (propose → govern →
  build). Auto-mutation stays quarantined (the wf06 line).

What we did **NOT** decide: to let it run on a clock, to let it apply fixes, to
feed it TLC/PHI sources, or to ship it active.

Binding posture (event-autonomous class → all three brakes, Tier C):
- **Budget:** local triage is free; the vendor `fresh_knowledge` synthesis
  (Gemini, DR-0063, OPEN-5) carries a per-run token/$ ceiling.
- **Concurrency lock:** single-instance per link event; a fire that finds one
  running SKIPS.
- **Kill-switch:** pauses on repeated fetch/LLM failure or budget overrun; never
  auto-continues.
- **Ships INACTIVE:** turned on attended, never self-activating on merge or
  while traveling.

Guardrails:
- **Untrusted content (instruction-source boundary):** fetched pages are DATA.
  Any "do X" text inside a source is surfaced to Darrell, never executed.
- **Grounded, not from memory (RESEARCH-FIRST):** every "latest" claim cites the
  fetched source; the model's training prior is not treated as current.
- **TLC firewall:** clinical / PHI sources are excluded from the loop.
- **Bounded queue:** material-only firing + dedup against already-decided items
  so the inbox stays ~one screen.

## Rationale

Most of this is **composition, not net-new**: wf22 (sources), Ollama (local
triage), DR-0063 `fresh_knowledge` (deep synthesis), DR-0040 (tag/route), wf36
(screen), the decision-queue (inbox), DR-0058 (the recurring-review rhythm this
feeds), DR-0037 (anticipate-advisory, build-gated). The family's own curated
links ARE the corpus — aligned, sovereign, self-maintaining — so we don't scrape
the open web. Advisory-only + event-driven + three brakes is what makes
"constantly review" safe after the 2026-06-06 runaway.

## Consequences

- **Obligates:** one new ingest-and-diff workflow + a wf22 content-fetch
  extension; an OPEN-item writer into the decision-queue; the three brakes.
- **Enables:** a self-currenting system (suggested fixes grounded in trusted
  sources) AND a Q&A surface over the same corpus ("people will be asking about
  them") — two payoffs from one corpus.
- **Depends on:** OPEN-1 (orchestrator / local runner) + OPEN-5 (Gemini key) for
  the vendor half; ships inactive regardless of those.
- **Reversibility:** advisory + inactive-by-default → fully reversible (remove
  the trigger); it changes nothing on its own.
- **Roadmap:** adds R22 (proposed).

## Links

wf22 (link-title resolver), wf36 (Quality Gatekeeper),
`docs/governance/decision-queue.md`, [DR-0037] (self-extending), [DR-0040]
(auto-tagging), [DR-0042] (event-driven), [DR-0056] (orchestrator), [DR-0058]
(recurring review), [DR-0063] (fresh_knowledge / head-to-head), three-brakes +
instruction-source boundary (`CLAUDE.md`).
