---
id: DR-0055
title: PM-AI v0 — a read-only portfolio Synthesizer; the staged, gated first step toward the PMO Method Engine
date: 2026-06-13
status: accepted
supersedes: []
superseded-by: null
tier: n/a
entities: [all]
grounds: [GOVERN-EXECUTE-ADVISE, THREE-BRAKES, DATA-DRIVEN-LIVING, DECISION-RECORDS]
source: 2026-06-13 — Darrell asked whether PoeTech needs PM-AI/roadmaps and greenlit speccing the smallest safe v0.
---

## Context

PoeTech already ratified the PM-AI as a top-level capability: DR-0045 (Universal
Work Management anchor), DR-0027 (PMO module), DR-0047 (PMO Method Engine),
DR-0029 (PM-as-automation). What was missing was a standing-up path small enough
to start safely. The 2026-06-12 conversation surfaced the real question — can the
system advance the work without being prompted — bounded by the 2026-06-06
runaway lesson (nothing autonomous unattended without three brakes).

## Decision

Build the PM-AI along a staged, gated ladder, recorded in
`docs/99-session-notes/2026-06-13-pm-ai-v0-synthesizer-spec.md`:

1. **v0.0 (authorized now):** a read-only portfolio Synthesizer — Claude reads
   the DR ledger + BUILD-ROADMAP + GitHub and emits `PORTFOLIO-BRIEF.md`. The
   shipped sample (`2026-06-13-portfolio-brief-sample.md`) is its first run.
   No infra, no secret, read-only, advisory. **System proposes; Darrell governs.**
2. **v0.1 (separate greenlight):** the same, as a manual-trigger GitHub Action
   calling the Claude API (`ANTHROPIC_API_KEY` secret). Still human-triggered and
   read-only → no three-brakes required.
3. **v1 (Tier C, future):** a daily cadence = the Self-Extending Layer
   anticipation loop (DR-0037); **requires all three brakes** + ideally the R4
   sovereign runner (DR-0053). Explicitly out of scope here.

Binding rails for every stage: read-only (writes only its brief); advisory
(never executes a build); own-portfolio-only (method-not-data, DR-0047); a view
over durable sources, never the sole record; no clock without the three brakes.

## Consequences

- Recording this authorizes v0.0 (read-only, harmless) only; v0.1 and v1 are
  separate greenlights. Plan/record authorizes nothing else (DR-0041).
- Adds a roadmap item (R18) for v0.1.
- Gives the propose→govern→build cadence a concrete first instance, dogfooding
  the PMO module on PoeTech's own portfolio before it ships to any other entity.

## Links

`2026-06-13-pm-ai-v0-synthesizer-spec.md`, `2026-06-13-portfolio-brief-sample.md`,
[DR-0045], [DR-0027], [DR-0047], [DR-0029], [DR-0037], [DR-0053],
`RELEASE-LANE.md`, the three-brakes rule in `CLAUDE.md`.
