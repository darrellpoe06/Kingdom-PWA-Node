# Universal CSI primitive — DEFERRED (re-arm after the conference ships)

**Status: PARKED by Darrell, 2026-06-17.** Meta-process generalization is deferred until after
the July conference. This file captures the design so a future session can build it cold; it is
**not** built yet. Do not start it before the conference ships.

## The idea (Darrell, 2026-06-17)

Generalize the conflict-evaluation loop ([[project_conflict_evaluation_loop]],
`docs/orchestration/CONFLICT-EVALUATION-LOOP.md`) from a one-off (orchestration conflicts) into a
**universal pattern-recognition / ITIL Continual-Service-Improvement (CSI) primitive** that is the
**default in every loop** across the PoeTech app (workflow, registration, course, conference, sync,
…). Same primitive everywhere → sustainability via compounding micro-fixes over time.

Each loop continuously:
1. **RECOGNIZES PATTERNS** in its own outcomes/events.
2. **SURFACES** candidate micro-fixes + improvements.
3. Runs a **LEVERAGE-PRIORITIZER**: `score = [impact on the current #1 GOAL × ease] − disruption`,
   and **fast-lanes** high-net-leverage items **ahead of normal feature work**.

**Key rule:** an improvement that *accelerates the current critical path* is **promoted to first** —
low-hanging fruit that speeds the goal goes before normal work. Pairs with the
low-hanging-fruit-auto-fast-lane feedback and is ITIL CSI made the default
([[project-poetech-enterprise-stack-vision]]).

## Why it's safe to defer

Building this now is itself a low-leverage, high-disruption move during the conference sweep (the
same logic as the monolith-slice evaluation next to this file). The leverage-prioritizer already
exists in concrete form as `decompositionPlan` + the leverage math in
`monolith-slice-leverage-evaluation.md`; generalizing it is process, not conference-critical output.

## Build sketch for the re-arm session (after conference)

Reuse, don't re-roll — the conflict loop is the reference implementation:

- **Shared engine** `scripts/csi/leverage.mjs` (pure): `score({impact, ease, disruption})`,
  `prioritize(candidates, {goal})` → fast-lane list. Lift the formula from the leverage doc.
- **Per-loop adapter contract**: each existing loop (the LOOP_REGISTRY in
  `scripts/quality-manifest.mjs` is the natural enrollment list) exposes
  `recognize(events) → candidates[]` where a candidate is `{title, impact, ease, disruption, evidence}`.
  Conflict-analytics' `hotFiles`/`decompositionPlan` is the first adapter (already built).
- **Surface**: extend the in-app board (beside `ConflictLoop` / `QualityProof` on the Build board,
  Governor-gated) with: per-loop improvement candidates, their leverage scores, what got
  fast-laned, and trend lines (conflict rate + fix throughput) — real data, baked from real event
  spines, nothing painted (DR-0076).
- **Brakes**: this is timer-ish/self-suggesting automation → it must NOT auto-APPLY fixes; it only
  RANKS and SURFACES for the Governor. Auto-apply would need the three brakes
  ([[feedback_autonomous_automation_three_brakes]]). Keep it advisory.

## Re-arm trigger

**The day after the conference ships**, pick this up: build `scripts/csi/leverage.mjs`, enroll the
existing loops as adapters, and surface the universal board. Until then it stays parked — silence
here is intentional, not a dropped thread.
