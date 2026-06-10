---
id: DR-0052
title: DR-number allocation under concurrency — allocate against live main, renumber on collision
date: 2026-06-10
status: accepted
supersedes: []
superseded-by: null
tier: n/a
entities: [all]
grounds: [DECISION-RECORDS, SESSION-ISOLATION, DR-NUMBER-ALLOCATION]
source: 2026-06-09/10 — two sessions independently allocated DR-0017 (COLG storage vs the PMO "Workforce Layer" chain), forcing a manual renumber to DR-0050. Closes the gap DR-0011 left open.
---

## Context
[DR-0011] made concurrent work **git-safe** (branch + worktree per session) but did not govern **logical DR-number allocation.** Two sessions branching off the same `main` both read the same branch-point `Next ID` and grabbed the same number. It happened: a COLG-storage DR and a PMO chain both took **DR-0017**; the collision surfaced only at merge, and the COLG DR was hand-renumbered to **DR-0050**. Without a rule it recurs whenever two sessions author DRs in parallel.

## Decision — the allocation rule (the `DR-NUMBER-ALLOCATION` principle)
1. **The live `main` INDEX `Next ID` is the ONLY allocation authority.** Read it from `origin/main` (`git show origin/main:docs/decisions/INDEX.md`) at the moment you create a DR — **never** from the stale branch-point copy.
2. **The number is PROVISIONAL until your PR merges.** It is a claim, not a reservation; another session may land first.
3. **Pre-merge collision check (mandatory).** Immediately before merging, re-read `origin/main`'s `Next ID`. If it has advanced past your number (someone landed first), **renumber to the new next-free ID before merging**: `git mv` the DR file, fix its `id:`, fix every `[DR-NNNN]` reference (INDEX row, superseded-by, narrative docs), then merge. (This is exactly the DR-0017→DR-0050 recovery, now a standard step, not an incident.)
4. **One DR row per merge bumps `Next ID` by one.** Multi-DR PRs bump it by the count landed.
5. **Optional — block reservation for high-parallelism bursts.** A session expecting to author many DRs MAY first land a tiny INDEX-only commit that bumps `Next ID` by N, reserving a contiguous block (e.g. DR-0060–0069) before doing the work. Use only when parallelism is high enough that step-3 renumbering churn outweighs the extra round-trip.

## Rationale
Allocating against live `main` (not the branch point) eliminates almost all collisions; the pre-merge re-check + renumber catches the rare race that slips through. This keeps the lightweight branch-per-session model (DR-0011) intact — no central lock, no serialization — while guaranteeing the ledger's single sequential numbering holds. Block reservation is the escape hatch for bursty parallel authoring, not the default (it trades a round-trip for zero renumber risk).

## Consequences
- Standard DR workflow gains two cheap steps: read live-`main` Next ID at create time; re-check + renumber-if-needed at merge time.
- Renumbering is now a documented routine, not an error.
- Pairs with [DR-0011] (session isolation) — that rule keeps the *files* from colliding; this rule keeps the *numbers* from colliding.

## Links
[DR-0011] (operating model / session isolation), `docs/decisions/README.md`, `docs/decisions/PRINCIPLES.md` (`DR-NUMBER-ALLOCATION`). Precedent: DR-0017→DR-0050 renumber (INDEX note).
