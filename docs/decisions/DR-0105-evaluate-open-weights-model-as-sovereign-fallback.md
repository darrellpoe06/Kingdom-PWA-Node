---
id: DR-0105
title: Evaluate a GLM-5.2-class open-weights model as the concrete Tier-0 sovereign fallback + workhorse — a fallback and drafting workhorse, NOT the theology engine; brakes required; measured before trusted
date: 2026-07-05
status: proposed
supersedes: []
superseded-by: null
tier: C
entities: [all]
grounds: [SOVEREIGN-FIRST, THREE-BRAKES, TIER-C, VERIFICATION-DOCTRINE, COMMUNITY-FIRST, GOVERN-EXECUTE-ADVISE, DATA-AS-EMPOWERMENT, PERPETUAL-IMPROVEMENT]
source: 2026-07-05 — AI-updates research (this session); the Fable 5 export-control ban (2026-06-13, lifted 07-01) + the Claude Max usage-limits lawsuit (filed 2026-06-14) as real-world proof of single-vendor dependency risk.
---

## Context

Two 2026 events made the single-hosted-vendor dependency concrete rather than
theoretical: the US government suspended all access to Claude Fable 5 / Mythos 5
under an export-control directive (2026-06-13; lifted 07-01), and Anthropic was
sued over allegedly overstated Claude Max usage limits (2026-06-14, N.D. Cal.,
seeking class cert). In the same window, Z.ai released GLM-5.2 — an MIT-licensed,
open-weights (753B/40B-active, 1M-context) model whose reported coding scores
rival paid frontier models — downloadable and self-hostable, i.e. un-bannable
and un-throttleable by any vendor. SOVEREIGN-FIRST already makes owned-hardware
Tier 0 the default and DR-0013 already commits to a swappable-router sovereignty
roadmap; what was missing was a concrete candidate model and a decision to
evaluate it. This DR supplies that — and fixes the bright line so the evaluation
cannot drift into letting an unverified model teach the Word.

## Decision

1. **Evaluate a GLM-5.2-class open-weights model as the concrete Tier-0 sovereign
   fallback + workhorse**, advancing DR-0013's swappable-router roadmap with a
   named candidate. The self-hosted weights (owned GPU box), NOT the vendor's
   China-hosted API, are what satisfies sovereignty — the hosted API carries the
   same data-sovereignty question as any vendor and does not count.
2. **Scope is bounded to fallback + drafting-workhorse roles**: keeping automations,
   workflows, marketing/dev drafts, and media generation running if the hosted
   model is banned, throttled, priced away, or down — work where a human-and-gate
   already reviews the output. It is explicitly NOT the theology engine.
3. **Bright line (WORD-FIRST × VERIFICATION-DOCTRINE):** the model does NOT fetch
   or author Scripture, teach the Word, or produce doctrinal output. Verse-fetch
   integrity and the Godhead Study path stay on the trusted, verified pipeline
   (`scripts/fetch-godhead-verses.mjs` + the study test harness; DR-0076). An
   un-independently-verified model — its "second best in the world" is a vendor
   claim, not a measured truth — earns NO doctrinal trust.
4. **Measured before trusted:** any candidate passes on OUR real artifacts (the
   Godhead verse-fetch harness, tenancy/isolation/contrast guards, a representative
   automation task) — not a leaderboard — before it carries any production load.
5. **Tier C, brakes required, ship inactive.** This is autonomous/compute-spawning
   infrastructure: it does not self-activate, and turns on only with someone
   watching, only with all THREE-BRAKES (budget ceiling per run, single-instance
   concurrency lock, kill-switch / auto-pause). "Sovereign location" and
   "additive" do NOT downgrade the tier (TIER-C).

## Rationale

Because sovereignty of the AI layer is already mission doctrine (SOVEREIGN-FIRST,
DATA-AS-EMPOWERMENT, COMMUNITY-FIRST — COLG must not lose its tools to a foreign
export order or a vendor's pricing change), and the Fable 5 ban + Max lawsuit are
the DR-0100-tier established facts that make the risk real, not hypothetical. And
NOT the theology engine — because trusting an unverified model with the Word would
trade the platform's whole reason for existing to save vendor cost; the fallback
de-risks operations without touching the one output that must stay verified.

## Consequences

- Obligates a scoped evaluation spike (not a purchase, not an activation): stand up
  a candidate on the owned GPU box, run it against the real harnesses, record
  measured results. Enables an un-bannable operational floor for the workflow fleet
  and the AI-media vision. Forecloses nothing on the hosted frontier path — this is
  a fallback beside it, not a replacement of it.
- Fully reversible: it is a proposed evaluation with no compute turned on. Ratifying,
  running, or activating each require Darrell (governs) + Quality Gatekeeper sign-off
  (Tier C).
- **re-review: 2026-10-05** (≈3 months) — revisit the candidate model landscape
  (open-weights moves fast) and the evaluation results before any activation
  decision; sooner if a hosted-vendor disruption forces the fallback early.

## Links

`docs/00-foundations/_root/AI-FOUNDATION-INTERNAL-OPERATIONS.md`,
`docs/00-foundations/_root/DATA-AS-EMPOWERMENT-NOT-EXTRACTION.md`,
`docs/00-foundations/_root/COMMUNITY-FIRST-MISSION.md`,
`docs/00-foundations/_root/AI-MEDIA-PRODUCTION-PLATFORM-VISION.md`,
`docs/99-session-notes/2026-07-05-ai-updates-research.md`,
[DR-0013] (sovereignty roadmap / swappable router — this names its candidate),
[DR-0076] (verification doctrine — measured before trusted),
[DR-0002] (LLM-authored content is future/staged/gated),
[DR-0010] (bounded autonomy reconciled with the brakes).
