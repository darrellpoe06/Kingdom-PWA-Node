# Decision Records (DRs) — the documentation + sourcing framework

**Status:** Convention (binding for how decisions are recorded going forward). Created 2026-06-09.
**Why this exists:** to stop re-deriving and re-rewriting decisions. One decision = one small, append-only file with a stable ID, sourced **once** by principle-ID. New direction = a **new** DR, never a rewrite of an old one.

This is **ICM Layer 4 discipline** (per `CLAUDE.md`) — the dated working layer — given structure. **It is NOT a new parallel framework** (the repo's no-parallel-frameworks rule holds). Research-reviews and session notes stay where they are; DRs are the *durable decisions* those narratives point at by ID.

---

## The problem this fixes

| Old friction | DR fix |
|---|---|
| One monolithic doc rewritten end-to-end on every new directive | One decision per file; a new directive is a new file, not a rewrite |
| Cross-references by section number (`§7 feeds §9`) drift when sections move | Stable IDs (`DR-0007`) that never renumber |
| Every doc re-lists ~15 source files; "is it in there?" verification loops | Cite principles **once** by ID from `PRINCIPLES.md`; check `INDEX.md`, not a 13-section file |
| Decisions and evolving narrative churn together | Decisions are append-only + immutable; narrative regenerates freely and links by ID |

## Rules

1. **One decision per file.** `docs/decisions/DR-NNNN-short-slug.md`. Keep it ~25–45 lines.
2. **Append-only / immutable.** Never rewrite a DR's substance. When a decision changes, write a **new** DR, set its `supersedes:`, and flip the old one's `status: superseded` + `superseded-by:`. History stays intact (this mirrors the append-only audit ledger in the Cage).
3. **Stable IDs are the reference.** Cite `DR-0007`, never "the section about TLC." IDs are assigned in order; gaps are fine.
   - **Allocate against LIVE `main`, not the branch point ([DR-0052]).** Read `Next ID` from `git show origin/main:docs/decisions/INDEX.md` when you create a DR; the number is **provisional until merge**. Re-check `main`'s `Next ID` right before merging — if another session landed first, **renumber** (`git mv` the file, fix `id:` + every `[DR-NNNN]` reference) before merging. This keeps the single sequential numbering safe under concurrent sessions.
4. **Source once, by principle-ID.** Bind to principles in `PRINCIPLES.md` (e.g. `TLC-FIREWALL`, `THREE-BRAKES`) via the `grounds:` field. Do not re-enumerate the underlying files in every DR.
5. **The INDEX is the single source of truth** for "what is decided." `INDEX.md` lists every DR with id, title, status, tier, entities. Verification = read the index.
6. **Narratives point at DRs.** Research-reviews / specs reference decisions by DR-ID and do not restate the rationale.

## File template

```markdown
---
id: DR-NNNN
title: <imperative, specific>
date: YYYY-MM-DD
status: proposed | accepted | superseded
supersedes: []            # [DR-XXXX]
superseded-by: null       # DR-XXXX
tier: A | B | C | n/a      # RELEASE-TIERS tier of the subject, if any
entities: [church, tlc, poetech, all, none]
grounds: [PRINCIPLE-ID, ...]   # from PRINCIPLES.md
source: <session / research-review that produced it>
---

## Context
What forced the decision (1–3 sentences).

## Decision
What we decided — and explicitly what we did NOT decide.

## Rationale
Because … (the "what and not-what, because" pattern).

## Consequences
What this obligates, enables, or forecloses. Dependencies. Reversibility.

## Links
DR-XXXX (related), research-review / spec by path.
```

## Statuses

- **proposed** — written, not yet ratified by Darrell (governs) / Quality Gatekeeper where Tier C.
- **accepted** — in force.
- **superseded** — replaced by a later DR (named in `superseded-by`). Kept, never deleted.

---

*Decisions are append-only, sourced once, referenced by stable ID. The index is the truth. We stop rewriting the past to record the present.*
