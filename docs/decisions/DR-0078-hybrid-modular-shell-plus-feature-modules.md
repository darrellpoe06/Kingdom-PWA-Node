---
id: DR-0078
title: Hybrid modular architecture — a small stable shell/core + independent feature modules plugging in via a surface-mount registry and the Events spine, never editing each other's files
date: 2026-06-17
status: accepted
supersedes: []
superseded-by: null
tier: infra (behind July conference; planning only, no refactor)
entities: [all]
grounds: [NEW-SURFACE-NEW-MODULE, ONE-APP-EVERYTHING-COMES-TOGETHER, ORCHESTRATED-LANES, VERIFICATION-DOCTRINE, PERPETUAL-IMPROVEMENT, DECISION-RECORDS]
source: 2026-06-17 — architecture decision record requested for the build/module architecture; ground in the real repo, compare monolith vs pure-siloed vs hybrid-modular, deliver a conference-safe migration path. No code/refactor now.
---

## Context

`app/src/poe-financial-mvp-v28.jsx` is 9,481 lines, but the repo is already
~80% hybrid: 69 components, 67 lib modules, 64 imported by the monolith, ~90
test files, and a `main.jsx` that already boots standalone surfaces by URL
param. The conflict-evaluation loop measures the pain: the monolith and
`migrations-auto` are tied as the #1 hot files (3x each, trend UP). The loop's
own root cause: **every recorded monolith collision was mount-wiring** (the
import block + the render switch) — the surfaces themselves are already
separate component files.

## Decision

Adopt **Hybrid Modular** as the named, enforced target (it is largely already
true):

1. A **small, stable shell/core** — app shell + a new **surface-mount
   registry**, auth/session, role-gating (King > Family > Servant-king/Governor
   > sheep), the Operations/Events spine, the design system + shared primitives,
   and the instance-scoped sync substrate. Nothing else is core.
2. **Independent feature modules** — each owns its `components/*.jsx`,
   `lib/*-sync.js`, `lib/*.js`, tests, and migration. This is the existing
   new-surface=new-module pattern, now formalized.
3. **The module contract = a surface registry.** Mounting a surface becomes a
   **data entry** (`{id, label, nav, requires, load: () => import(...)}`), not a
   code edit to a shared switch. This removes the #1 and #2 textual collision
   points the loop identified, without touching any feature.
4. **Interdependence flows through core + the Events spine** — a module reads
   another's rows via the core sync substrate or subscribes to a typed event;
   **it never imports another module's internals.** Enforced by a boundary gate
   (core imports no feature; features don't import each other) — verifiable, not
   claimed (DR-0076).
5. **Migrations** (the co-#1 hot file) move to timestamped names (or a claim
   step) to kill the duplicate-number class; the order-check gate stays.

Rejected: **monolith** (the measured collision engine) and **pure-siloed**
(the integration trap; violates one-app DR-0061).

## Migration path (conference-safe)

Nothing ships before the July conference. Step 0 (new-surface=new-module) is
already in force, so the conference surfaces are already isolated and
unaffected. After the conference: (1) introduce `surfaces.js` as a new file +
one final serialized monolith edit to iterate it; (2) migrate existing surfaces
onto it; (3) peel the largest in-file sections, using the conflict-loop's ranked
hot-file output as the work queue; (4) add the boundary gate + migration fix;
(5) full decomposition to a thin shell. Re-review after the soak confirms the
conflict-rate trend turned DOWN.

## Consequences

- Full spec: `docs/00-foundations/MODULE-ARCHITECTURE-ADR.md` (this DR is the
  ledger pointer).
- Parallel lanes (DR-0077) stop colliding; continuous integration against stable
  contracts replaces big-bang merges.
- One app preserved (DR-0061); blast radius bounded per surface
  (`SectionBoundary`).
- Cost is one new file + one careful edit soon; the rest rides normal feature
  work and costs less than the collisions it prevents (DR-0075).
