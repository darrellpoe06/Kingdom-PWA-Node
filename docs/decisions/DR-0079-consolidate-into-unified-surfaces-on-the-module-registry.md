---
id: DR-0079
title: Consolidate this session's spec'd capabilities into FIVE unified surfaces + FOUR shared core primitives — one cohesive page per area, built as clean modules on the surface-mount registry (reuse, not forks)
date: 2026-06-24
status: accepted
supersedes: []
superseded-by: null
tier: B (per-surface; Worship/COLG-facing + the engine cockpit are Tier C; the design doc itself is n/a)
entities: [all]
grounds: [APP-IS-PRIMARY, ONE-APP-EVERYTHING-COMES-TOGETHER, NEW-SURFACE-NEW-MODULE, VERIFICATION-DOCTRINE, PERPETUAL-IMPROVEMENT, GOVERN-EXECUTE-ADVISE, DECISION-RECORDS]
source: 2026-06-24 — Darrell's directive "all these inputs need to be considered and consolidated into one per page that does everything in one." Consolidation + IA design pass over this session's lanes (Study+4D finalizer+Eternal Algorithms, BG Sermon Stories, the unified content engine, the Worship/music section, the generalized Presenter, app-as-cockpit on CUDA).
---

## Context

This session spec'd many capabilities across parallel lanes: Study + the 4D
finalizer (deep source → plain distillation → benefits) + auto-populating
Eternal Algorithms (`local_bc755236`); BG's Sermon Stories library
(`local_c119ab7a`); the unified content engine (recordings + conversations →
lessons → curriculum → books → marketing); the Christian music / Worship
section (`local_9140a64c`); the generalized Presenter; the app-as-cockpit on
the CUDA boxes; and the shared engagement/reaction primitive (`local_ad147f53`).

Left as separate features they would ship as **scattered fragments** the user
bounces between — a capture box on one tab, a finalizer on another, a library
behind a toggle, reactions wired five different ways, the content engine with
no operator home at all. Darrell's directive is the opposite: **one cohesive
page per area that does everything in one.** This must be done as
consolidation-via-reuse on the hybrid-modular architecture (DR-0078), not as
five forked one-off surfaces.

## Decision

Consolidate the inputs into **five unified surfaces + four shared core
primitives.** Full design: `docs/00-foundations/CONSOLIDATION-IA-UNIFIED-SURFACES.md`.

**Five unified surfaces** (each a single cohesive page = one feature module on
the surface registry):

1. **The Study** (private circle) — capture (3 rooms + voice) → **finalize**
   (the 4D finalizer: deep source → plain distillation → benefits/outcome) →
   **Eternal Algorithms auto-populated** from finalized entries → opt-in
   hand-off to the content engine. **De-toggles** today's Workspace ⇄ Eternal
   Algorithms split into one flow. Stays device-local/sovereign.
2. **The Word — Migdal** (church staff) — sermon library + corpus prep +
   **Sermon Stories** (BUILD #1, BG's reusable illustration library) + present.
   Extend `Pulpit.jsx`'s `theWordTabs`, not a new top-level surface.
3. **The Content Engine** (Governor cockpit, app-as-cockpit on CUDA) — the one
   operator surface: Sources → Reconcile/Retain → Build (transcribe+structure
   on the GPU) → **Review** (faithfulness + consent gate, one queue) → Publish
   (fan-out: lessons → Learn, books → Library, stories → The Word, trivia →
   Engagement) → Monitor (three brakes, ships inert). **Composed into Command,
   Control & Serve (C2S)** — the steward seat that already composes the other
   operator surfaces.
4. **Learn & Library** (church/all) — courses + lessons + the downloadable
   **Books shelf** (PDF/EPUB, owned content only, zero-dep export), all via the
   Presenter. The publishing shelf homes HERE, **not** on the financial `books`
   tab (premise conflict resolved).
5. **Worship** (church/all) — multi-type Christ-centered music library +
   "Your Music" favorites + radio stations + the shared reaction control +
   lyrics-as-curriculum (Prov 22:6 child-formation) + artist promotion. New
   `worship` Church sub-tab, designed unified from day one.

**Four shared core primitives** (one each, consumed by all — never forked):
the **Presenter** (present mode), the **Engagement primitive**, the
**Voice dictation** hook, and the **4D Finalizer** shape (shared by Study
distillation and the engine's lesson structuring).

The **Engagement primitive** is the music section's pattern generalized into a
**single layered primitive — reactions → community ratings → most-loved
ranking → optional continuous-play station** (the `local_ad147f53`
implementation, reuse don't fork). Each surface composes only the layers that
fit. **It applies to BG's sermons and every community-visible content
collection, not music-only:** full primitive (all four layers) on Worship, The
Word public sermon library ("Most-Loved Sermons" station), and church public
videos/stream/clips; reactions→ratings→most-loved (station conditional/none) on
Learn lessons/courses, Choir songs (choir-scoped), and Books/Library; a
**support-reaction-only** carve-out (🙏, no ranking) for pastoral content
(prayer requests) — ranking pastoral content by popularity is inappropriate.
**Excluded** (private/non-content): the Study + Eternal Algorithms, private
Sermon Stories, private Creation documents, and all financial/ops/admin
surfaces. Boundary rule: attaches to community-visible content collections only;
private → publish-first, pastoral → support-react-only, operational → none.
Constraints baked in: positive child-safe set only; clean/Christ-centered/
profanity-free pool where content policy applies; PIN-optional-community-default
scoping; promote-the-creator on most-loved/now-playing; most-loved orders
discovery, never doctrine. Surface matrix + component design (identity contract,
the four layered components, `media_reactions` 0042) in the design doc.

**Migration is zero-loss + conference-safe** (Part 4 of the design doc):
registry foundation (DR-0078 step 1) → extract the shared primitives to core →
build the unified surfaces one at a time, BUILD #1 (Sermon Stories) first, each
behind a feature-parity checklist verified against the live surface →
registry-migrate + decompose. Additive-first: new behavior lands alongside the
old until parity is green, then the old fragment is removed in the same PR.

## Why (rationale)

- **WE CHOSE five unified surfaces + four shared primitives, NOT five separate
  feature tabs,** BECAUSE the directive is "one per page that does everything"
  and the pieces of each area are beats of a single flow (capture→finalize→
  library; library→prep→stories→present; sources→build→review→publish;
  courses→lessons→books; play→react→learn→promote). Splitting them across tabs
  hides that they are one motion.
- **WE CHOSE reuse-on-the-registry, NOT forked surfaces,** BECAUSE DR-0078 makes
  a surface a data entry and the shared primitives (Presenter, reaction, voice,
  4D finalizer) live in core — consolidation is composition, not duplication.
- **WE CHOSE to compose the Content Engine cockpit into C2S, NOT a peer
  top-level surface,** BECAUSE app-as-cockpit and C2S are the same idea (the
  steward operating the system from inside the app); the sibling
  `PROJECTS-TAB-COHERENCE-REVIEW.md` already relocates the other operator
  surfaces there. One steward seat operates everything.
- **WE CHOSE to home the Books/Library shelf in Learn, NOT the financial Books
  tab,** BECAUSE "books" means two different things in the app; bolting a
  publishing shelf onto the accounting ledger collides the meanings.
- **WE CHOSE auto-populating Eternal Algorithms from finalized reflections, NOT
  a hand-authored toggle,** BECAUSE the deep→plain→benefits finalizer's output
  IS a 4D→3D→OUTCOME algorithm — the library is the natural crystallization of
  finishing an entry, one flow.
- **WE CHOSE zero-loss additive migration with parity checklists, NOT a big-bang
  refactor,** BECAUSE Verification Doctrine (DR-0076) requires characterizing
  what each surface actually does before changing it, and conference-safety
  (DR-0078) forbids risky pre-July moves.

## Rejected alternatives

- **Ship each lane as its own surface/tab.** Rejected — that is the fragmentation
  the directive forbids; the user would bounce between a capture box, a
  finalizer, a library, and five reaction wirings.
- **Mass-refactor the monolith now to land all five at once.** Rejected —
  violates conference-safety (DR-0078) and zero-loss discipline; collisions on
  the monolith are the measured pain (DR-0078).
- **Content Engine as a standalone top-level surface.** Rejected (weaker, not
  wrong) — app-as-cockpit belongs in the steward seat (C2S) for coherence with
  the sibling IA cleanup; a peer surface would split the operator experience.

## Consequences

- The design doc is the contract; per-surface builds follow the Part 4 priority
  (Sermon Stories first). Each build is its own PR with a parity checklist.
- Coordinate with in-flight siblings: `local_ad147f53` (the reaction primitive —
  reuse it), `local_3e189506` (IA cleanup — complementary system mountain),
  and the content-engine/finalizer/music lanes (reflect their specs).
- An in-app documentation entry materializes this decision as institutional
  memory (seed: `infra/seed-data/2026-06-24-consolidation-unified-surfaces-docs.json`),
  rendering under a "Unified Surfaces (IA Consolidation)" project.
- Refines DR-0061 (surfaces are live views), DR-0065 (app is primary), DR-0078
  (hybrid-modular registry), and formalizes the content/teaching counterpart to
  `PROJECTS-TAB-COHERENCE-REVIEW.md`.
