---
id: DR-0013
title: Sovereignty roadmap — phased vendor-optional milestones (two milestones, swappable router)
date: 2026-06-09
status: accepted
supersedes: []
superseded-by: null
tier: C
entities: [all]
grounds: [SOVEREIGN-FIRST, COST-DISCIPLINE, DATA-DRIVEN-LIVING, GOVERN-EXECUTE-ADVISE]
source: 2026-06-09 conversation — Darrell: "when can we expect the local LLMs to be fully working without vendor LLMs unless we want to? Timelines for sovereignty."
---

## Context
"Fully working without vendor LLMs unless we want to" is not one date. The honest answer separates routine work (software-gated, sooner) from the hardest reasoning (hardware-gated, later). Do not overpromise; the eval has not run and the single-4070 ceiling is hardware-bound.

## Decision
Adopt a four-phase, dependency-anchored roadmap with **two distinct milestones**:
- **(a) Daily/routine work fully sovereign, vendor reserved-but-optional** — Phase 2, **~Q3 2026**.
- **(b) Zero dependence even for the hardest reasoning** — Phase 4, hardware-gated (a 12 GB 4070 cannot sustain a 70B-class model).

Phases: **1 Foundation** (now→~Jul 2026: Cage merged, eval, daily reasoner, read-only review) → **2 Daily-work sovereignty** (~Q3: router defaults local, vendor explicit-escalation only) → **3 Majority sovereignty + scoped autonomous execution** (~Q4: per-surface autonomy, vendor by choice for the hardest) → **4 Full vendor-optional incl. heavy reasoning** (hardware-gated).

**Binding architecture:** vendor LLMs ride a **swappable router lane** (`CLAUDE-TOOL-ROUTING.md` Tier 1/2). We are **never locked in**; from Phase 2 on, "no vendor unless we want to" is structurally true — the question is only when the sovereign side is good enough to choose not to escalate.

## Rationale
Because honesty requires distinguishing the ~90%-vendor-optional we reach by Q4 on current hardware from the last ~10% (heaviest reasoning) that needs more VRAM. The swappable lane guarantees no lock-in regardless of phase.

## Consequences
Phase 4's date is hardware-dependent and is **recompressed by [DR-0014]** (the 2026-06-09 budget directive) from 2027 to ~Jul–Aug 2026. First-pass/living per [DR-0004].

## Links
[DR-0014] (the procurement that recompresses Phase 4), [DR-0012] (single-4070 envelope), [DR-0010] (autonomy), [DR-0004] (living estimates), research-review §14.
