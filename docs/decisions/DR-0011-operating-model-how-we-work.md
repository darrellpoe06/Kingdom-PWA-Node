---
id: DR-0011
title: Operating model — how we work (append-only decisions, session isolation, narrative vs decision)
date: 2026-06-09
status: accepted
supersedes: []
superseded-by: null
tier: n/a
entities: [all]
grounds: [DECISION-RECORDS, SESSION-ISOLATION, GOVERN-EXECUTE-ADVISE, RESEARCH-FIRST, EARN-AUTONOMY]
source: 2026-06-09 conversation (Darrell: "best outcomes based on best working framework based on our situations")
---

## Context
Our situation: one principal governing, LLMs executing (often in parallel), multiple concurrent sessions on one sovereign repo, directives arriving incrementally, hard guardrails (PHI / doctrine / runaway), limited human bandwidth. Two failure modes showed up directly: (1) monolithic docs rewritten end-to-end on every new directive, with drifting cross-references and "did it land?" verification loops; (2) on 2026-06-09 a second active session switched the shared working tree out from under this one (the Two-Session Git Race in `CLAUDE.md`), briefly hiding committed work.

## Decision
Adopt this operating model:
1. **One decision = one append-only Decision Record.** Decisions are never rewritten; a change is a new DR that `supersedes` the old (per `docs/decisions/README.md`). The INDEX is the source of truth.
2. **New directive → new DR, not a fold-in.** Item K becomes DR-0012, linked — never another full rewrite of a growing document.
3. **Narrative synthesizes; DRs decide.** Research-reviews/specs are regenerable prose that reference DRs by stable ID; the decisions live in the DRs.
4. **Session isolation is mandatory for concurrent work.** **No two sessions write to the same working tree or the same branch at once.** Each session works on its own branch in its own git worktree (or clone); integration is via PR to main. The default checkout is not an active multi-writer surface.
5. **LLMs do the work behind the Cage; humans for judgment, not toil** (carries DR-0010).

## Rationale (incl. the concurrency advice Darrell asked for)
Because parallelism is the point of "LLMs do the work" — the fix for the race is **not** fewer sessions (that throws away throughput) and **not** an uncontrolled free-for-all (that corrupts the shared tree). It is **isolation**: branch + worktree per session makes concurrent git work conflict-free (each worktree has its own index/HEAD), and the append-only DR model makes even concurrent *decisions* additive rather than overwriting. The one inviolable rule is **no shared-tree / shared-branch concurrent writes** — that single rule eliminates the observed failure mode while preserving parallel execution. This framework is therefore not just less churn; it is race-robust by construction.

## Consequences
- Worktree-per-session becomes the default for any session that writes (demonstrated landing DR-0001..DR-0011 without disturbing the concurrent conference-ingestion session).
- Verification collapses to reading `INDEX.md`, not re-reading a large document.
- Mild cost: worktrees use extra disk; git ops route through PowerShell (bash sandbox lacks the tailnet/credentials per `CLAUDE.md`). Acceptable.
- Recommendation to Darrell: **keep parallel sessions, enforce isolation; do not serialize to a single owner.**

## Links
`docs/decisions/README.md`, `docs/decisions/PRINCIPLES.md` (DECISION-RECORDS, SESSION-ISOLATION), `CLAUDE.md` Two-Session Git Race rule, [DR-0010].
