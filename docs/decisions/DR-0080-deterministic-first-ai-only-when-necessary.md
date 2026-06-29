---
id: DR-0080
title: Deterministic-first, AI-only-when-necessary — repetitive/predictable workflows are built as plain deterministic code/scheduled jobs (no LLM); the AI is reserved for novel reasoning, generation, judgment, and hard cases, for load reduction so AI capacity scales with new-system demand
date: 2026-06-29
status: accepted
supersedes: []
superseded-by: null
tier: infra (standing architectural requirement + design-review check; applies to every workflow/loop in every phase)
entities: [all]
grounds: [DETERMINISTIC-FIRST, COST-DISCIPLINE, SOVEREIGN-FIRST, THREE-BRAKES, VERIFICATION-DOCTRINE, GOVERN-EXECUTE-ADVISE, DATA-DRIVEN-LIVING, DECISION-RECORDS]
source: 2026-06-29 — Darrell's directive while reviewing the completion roadmap. "Only want the AI to run for necessary items; build the repetitive workflows in for load reduction so the AI can keep up with the demand of new systems." Recorded as the binding requirement in `COMPLETION-ROADMAP.md` §0.5 (this DR is its ledger entry).
---

## Context

As the platform adds systems, demand on the AI grows. If the AI is invoked for
work that is repetitive and predictable — scheduled pulls, syncs, format
conversions, rule-based transforms, threshold/health checks, known mappings,
routine loops — that demand drowns the AI in toil and competes with the novel
reasoning only it can do. It also burns cost and, on the sovereign tiers, GPU
capacity that creative/sanctuary workloads have absolute priority on (DR-0012).
The existing CI gates are already the proof that the repetitive mass belongs in
deterministic code: lint, vitest, build, the guard ratchets, and wf36 are all
rule/threshold checks that run with no LLM and never miss on a clock.

## Decision

**Deterministic-first, AI-only-when-necessary.** This is a binding architectural
requirement and a standing design-review check, not a preference.

- **Repetitive/predictable work is built as plain deterministic code or
  scheduled jobs — NO LLM call.** Includes: scheduled pulls/syncs · format
  conversions · rule-based transforms · threshold/health/status checks · known
  field mappings · routine loops · schema validation · idempotent reconciliation
  · anything whose output is a pure function of its input.
- **The AI/LLM is reserved for** novel reasoning over unseen input · open-ended
  generation (drafts, teaching, non-templated summaries) · judgment and
  disambiguation · explaining the unfamiliar · classification where rules
  genuinely don't generalize · the hard tail a deterministic path can't cover.
- **The default is deterministic; an LLM is invoked only when no deterministic
  path works.** The burden of proof is on invoking the AI, not on avoiding it.

**Standing design-review check** — every new workflow/loop must answer, in its
PR or DR:
1. Is the output a pure function of its input, or rule-expressible? → build
   deterministic, no LLM.
2. If it calls an LLM: *what specifically can't a deterministic path do here?*
   ("It's easier" is not an answer.)
3. Is there a deterministic pre-filter that handles the common case so the LLM
   only sees the hard tail?
4. If sovereign/scheduled: does the deterministic core run without the LLM being
   reachable at all (honest-offline)?

A workflow that calls an LLM without answering #2 does not pass review. A
**classification pass** (every loop/workflow labeled DETERMINISTIC vs AI-NEEDED)
is maintained in `COMPLETION-ROADMAP.md` §0.5.1 and re-run as new workflows are
designed; the default verdict for a new row is DETERMINISTIC until #2 is
answered.

## Why (rationale)

- **WE CHOSE deterministic-by-default with the AI reserved, NOT AI-by-default,
  BECAUSE** the stated goal is **load reduction so the AI can keep up with the
  demand of new systems.** Every deterministic path that does not call an LLM is
  freed AI capacity; pushing the repetitive mass onto plain code is what lets the
  platform scale system count without the AI drowning in routine.
- **WE CHOSE to put deterministic *below* the cheapest model on the tier ladder,
  NOT as just another tier,** BECAUSE the SOVEREIGN-FIRST escalation ladder
  (DR-0056) already starts at the cheapest capable model; deterministic code is
  cheaper and more reliable than any model and belongs beneath it. This pairs
  with COST-DISCIPLINE and frees GPU for priority creative workloads (DR-0012).
- **WE CHOSE a burden-of-proof-on-the-AI review gate, NOT a soft guideline,
  BECAUSE** Verification Doctrine (DR-0076) applies to *compute allocation* the
  same way it applies to correctness: an LLM call where a deterministic path
  exists is unverified waste, caught cheaply at review.
- **WE NOTE this lightens the brakes,** BECAUSE deterministic work never enters
  the autonomy loop (THREE-BRAKES, P10–P12) — it needs no budget/lock/kill-switch
  — so moving work off the LLM also shrinks the attended-autonomy surface.

## Rejected alternatives

- **AI-first / LLM-for-everything (let the model handle routine too).** Rejected
  — it is the exact load problem the directive names; it burns cost + GPU, adds
  nondeterminism and failure modes to work that has a pure-function answer, and
  competes with the novel reasoning only the AI can do.
- **Leave it as an informal preference.** Rejected — without a review gate it
  erodes under deadline pressure ("it's easier to just call the model"); the
  binding check makes deterministic-first the path of least resistance.
- **A hard ban on LLMs in workflows.** Rejected (overcorrection) — the AI-needed
  tail (novel reasoning, generation, judgment) is real and valuable; the rule
  reserves the AI for it, it does not forbid it.

## Consequences

- The design-review check (4 questions) is added to the PR/DR template; the
  classification pass in `COMPLETION-ROADMAP.md` §0.5.1 is the living inventory.
- Deterministic-first is a completion criterion (`COMPLETION-ROADMAP.md` §0 #6):
  a surface that calls an LLM where a deterministic path exists is not "done."
- It is cross-cutting across the roadmap phases, not a phase — the flagship
  vertical (Phase 1, Kitchen) establishes the compute-allocation pattern, and the
  freed capacity is load-bearing for the autonomy layer (Phases 5–6).
- Pairs with DR-0056 (tiered LLM orchestrator — deterministic sits below the
  cheapest tier), DR-0012 (GPU preemption priority), DR-0076 (verification
  doctrine), and the THREE-BRAKES law (P10–P12).
