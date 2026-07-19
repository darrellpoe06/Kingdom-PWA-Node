# The Interpretable Context Methodology (ICM) — a one-page explainer

*Authored for external synthesis (e.g. NotebookLM). Non-sensitive design overview.
Source of truth remains the repository; this is a lens, not a substitute.*

## The idea in one sentence
**The filesystem itself is the orchestration architecture:** a single agent reads
the right *context layer* at the right time — instead of relying on an external
multi-agent orchestration framework to route work.

## Why it exists
Most "agentic" systems bolt an orchestration layer on top of the model (planners,
routers, tool-graphs). ICM inverts that: the *repository layout* carries the
orchestration. Identity, routing, contracts, reference material, and working
artifacts each live in a named layer, and the agent loads the layer appropriate to
the task. The structure is legible to a human reading the tree, and it survives
context compaction because it is re-loaded from disk, not held in the model's memory.

## The layers
- **Layer 0 — Identity.** `CLAUDE.md`: the global binding rules every agent loads
  first, before anything else. It is read *through* the worldview spine (see below).
- **Layer 1 — Routing.** A top-level `CONTEXT.md` router that points to the right
  stage/workspace. (Pending in this repo; referenced as pending until it lands.)
- **Layer 2 — Stage contract.** A per-workspace `CONTEXT.md` — the contract for a
  single stage of a single workflow.
- **Layer 3 — Reference.** `docs/00-foundations/_root/*` — the authoritative
  foundation documents the agent reads before generating substantive content.
- **Layer 4 — Working.** Dated session notes, audits, and consolidated extracts;
  plus the append-only **Decision Records** (`docs/decisions/`) and the **Reviews**
  ledger (`docs/reviews/REVIEWS.md`).

## The disciplines that ride on top of the layers
- **Decision Records (DRs):** append-only; one decision per file; a new directive is
  a new DR, never a rewrite. `INDEX.md` is the source of truth for what's decided;
  `PRINCIPLES.md` is the cite-once registry of binding-principle IDs.
- **Verification Doctrine:** claims ship with evidence; deterministic gates fail the
  build; "proven-to-catch" — a gate is trusted only after it's shown to catch the
  break; measure, don't claim.
- **Reality-Trace:** before building any user-facing surface, name the real data and
  the real screen, and verify against the running system — not an assumption.
- **The streamlined delivery loop:** work lands on green by itself (branch → gates →
  auto-merge → deploy); the human's touch-point is a `hold` label, not a merge click.
- **The worldview spine:** a biblical-scripture-derived worldview applied with
  algorithmic rigor is the declared source of answers for doctrine-touching content;
  Scripture is cited to a fixed translation rubric and never fabricated.

## The through-line
Everything orbits one primary artifact — the app. Repo artifacts (foundations, DRs,
reviews) are the spine and the memory; they exist *in service of* shipping capability
where the user actually lives. Surfaces are live views of, and controls for, real
system state; a painted number is worse than none on a surface whose value is trust.

## Why ICM is interesting to study
It is a working example of **context engineering as architecture**: reproducible,
inspectable, and resilient to memory loss, using nothing more exotic than a
well-named directory tree, an append-only decision log, and a set of gates that
convert judgment into machine checks. The open question it explores: how far can
"the filesystem is the framework" scale before an explicit router layer is required?
