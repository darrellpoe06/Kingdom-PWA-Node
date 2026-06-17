# Module Architecture — Architecture Decision Record

**Status:** Accepted (planning only; no refactor in this change)
**Date:** 2026-06-17
**Ledger entry:** [`DR-0078`](../decisions/DR-0078-hybrid-modular-shell-plus-feature-modules.md)
**Tier:** INFRA lane — **behind the July conference.** No code/refactor ships from this ADR before the conference. This is the decision and the conference-safe migration path only.
**Author lane:** infra / architecture
**Grounds:** new-surface=new-module ([[project_new_surface_new_module]]), DR-0061 (everything comes together in one app), DR-0077 (orchestrated lanes + one orchestrator), DR-0076 (verification doctrine), DR-0075 (perpetual improvement), the conflict-evaluation loop ([[project_conflict_evaluation_loop]]).

---

## 1. Context — what the repo actually is today

This ADR is grounded in a direct read of the repository on 2026-06-17, not from memory.

**The monolith is real but no longer "everything."** `app/src/poe-financial-mvp-v28.jsx` is **9,481 lines / ~687 KB**. But the codebase is already *substantially* modularized around it:

- **69 component files** in `app/src/components/` (e.g. `ConferenceModule.jsx`, `Choir.jsx`, `Pulpit.jsx`, `ChurchVideoWall.jsx`, `EventCenterModule.jsx`, `BuildBoard.jsx`, `QualityProof.jsx`, `GovernanceQueue.jsx`).
- **67 lib modules** in `app/src/lib/` (sync engines, calc engines, access-gate, multi-point-auth, conflict-loop, kpi-status, etc.) — the contract/logic layer.
- The monolith **imports 64 of these** (`import … from './components/…'` / `'./lib/…'`). It is already mostly a **composition root**, not a content blob.
- **~90 test files** in `app/src/__tests__/` — a deep, deterministic safety net (`npm run verify`).
- **`main.jsx` already behaves like a shell**: it boots *standalone* surfaces by URL param — `?join=1`, `?invites=1`, `?register=1`, `?audience=1`, `?teach=1`, `?login=1` — each mounting a single component **without loading the heavy app or its auth/Supabase init**. This is a working proof that surfaces can be independently mountable.

**So the question is not "monolith vs. modules."** It is: *we are 80% of the way to hybrid modular by accretion — do we formalize that target, name the one structural seam still missing, and stop the recurring collisions, or do we drift?*

**The recurring pain is measured, not felt.** The conflict-evaluation loop (`scripts/orchestration/conflict-analytics.mjs` over `docs/orchestration/conflict-events.jsonl`) ranks the hot files. As of 2026-06-17 the report reads:

```
HOT FILES (most-contended first):
  3x  app/src/poe-financial-mvp-v28.jsx  <-- monolith
  3x  infra/supabase/migrations-auto
  1x  app/src/main.jsx
Trend: UP (latest 6 vs prior mean 2.0) · TARGET: DOWN
```

The 2026-06-17 pileup was three branches — `feat/church-video-wall` (#206), `feat/pulpit-bg-study` (#208), `feat/simple-login` (#189) — **all contending the same monolith file**, forced into a serialized lane. The loop's own root-cause finding is decisive:

> **Every recorded monolith collision was mount-wiring** (the import block + a render branch). The surfaces themselves (`ChurchVideoWall`, `Pulpit`, `PasswordAuth`) are already separate component files.

That single sentence is the spine of this ADR. We are not colliding on *features*. We are colliding on **two textual choke-points inside one file**: the import block at the top and the section/tab render switch. And we have a **second, independent** choke-point — the strictly-ordered migration sequence (`migrations-auto`, duplicate-number grandfathering at 0019 and 0022).

---

## 2. Decision drivers

1. **Parallelism without collision.** Multiple lanes (DR-0077) must build and ship surfaces concurrently without serializing behind one shared file.
2. **Conference safety (hard constraint).** The July conference is live-facing. Nothing in the migration path may risk the conference surfaces. No refactor before the conference.
3. **Continuous integration against stable contracts** — modules integrate continuously, never via big-bang merges.
4. **One app (DR-0061).** Whatever the internal seams, the family/community experience is one composed PWA. Pure silos that "integrate later" violate this.
5. **Verification (DR-0076).** The boundary must be machine-checkable: a gate proves a module didn't reach into another module's internals, proves the shell didn't grow a hidden dependency on a feature.
6. **MVP pragmatism + cost.** We do not stop the world to refactor. The cheapest correct step that removes the #1 collision wins; the rest is incremental and earns its way.
7. **It must serve the wider system** — the workflow-module-library tiers, multi-business CRM as separate instances, per-industry teams, and sovereign-mesh nodes (Section 6).

---

## 3. Options considered

### Option 1 — MONOLITH (current default for mounting)

Everything composes inside `poe-financial-mvp-v28.jsx`; new surfaces add an import + a render branch there.

| | |
|---|---|
| **Pros** | Dead-simple deploy (one bundle). Shared state is trivially in-scope (props drilled from one `PoeFinancialSystem()` root). No contract ceremony — call anything directly. Easy to reason about for a solo session. |
| **Cons** | The collision engine. One shared file ⇒ a **serialized lane** ⇒ the 2026-06-16/17 pileups (3 branches, one file). Every new surface, however independent, must touch the import block and render switch. Conflict trend is **UP**. Worst-case blast radius is the whole app (one bad edit white-screens everything not behind a `SectionBoundary`). Does not scale to parallel lanes or to multiple teams. |
| **Verdict** | **Reject as the target.** It is the measured source of the pain. (But note: most of the *content* already left the monolith — what remains is mostly the mount-wiring and a few large in-file sections.) |

### Option 2 — PURE SILOED → integrate later

Each feature built in full isolation (own app/repo/state), integrated in a later big-bang.

| | |
|---|---|
| **Pros** | Maximum build-time isolation — zero collision during the build. Fast to start a brand-new surface with no shared constraints. |
| **Cons** | **The integration trap.** Contracts drift while siloed (each silo invents its own auth, role model, theme, event names). Integration becomes a multi-week big-bang merge with contract mismatches discovered late — the opposite of continuous integration. Violates **DR-0061** (one app): silos are not *one* composed experience; the family would feel the seams. State/identity/role-gating get re-implemented N times and disagree. This is exactly the failure mode the orchestration memory already warns against ([[feedback_confirm_need_land_verify_live]] — "don't spread inputs across branches and call branch-work done"). |
| **Verdict** | **Reject.** Fast at the start, expensive and risky at the seam; structurally at odds with the one-app principle and continuous integration. |

### Option 3 — HYBRID MODULAR  ✅ **RECOMMENDED (and largely already true)**

A **small, stable shared CORE/SHELL** + **independent FEATURE MODULES** that plug in through **clean contracts** and a shared **Events spine**. Modules are built and shipped separately (parallel, no shared-file collision) and **composed at the shell** via a registry. Interdependence flows through the core and events — **never by editing each other's files.**

| | |
|---|---|
| **Pros** | Parallel lanes don't collide (each module is its own file; mounting is data, not a code edit). Continuous integration against **stable contracts** — a module integrates the moment it conforms, no big-bang. One composed app (DR-0061 honored). Independent test + ship per module. Blast radius bounded (`SectionBoundary` per surface — already shipped). Scales to teams and to the wider system (Section 6). It is the **natural extension of what the repo already is** — 69 components, 67 libs, standalone URL-boot surfaces. |
| **Cons** | Requires discipline: a real contract, an enforced boundary gate, and an Events spine that doesn't become a god-object. Slightly more ceremony to add a surface than "just edit the switch." A poorly-drawn core/shell boundary is its own trap (too big ⇒ the core becomes the new monolith; too small ⇒ modules duplicate). Mitigated by Section 4's concrete, minimal boundary. |
| **Verdict** | **Accept.** It is the lowest-risk, highest-leverage target *because the repo is already most of the way there.* The work is not a rewrite — it is **naming the boundary and closing one seam.** |

---

## 4. The decision — Hybrid Modular, defined concretely

### 4.1 The SHELL / CORE boundary (small and stable on purpose)

The **core/shell** is the *only* part every module may depend on. It is deliberately small. It is the part that changes rarely and that everything composes against. It comprises exactly:

1. **App shell + surface registry** — the composition root (today `main.jsx` + `PoeFinancialSystem()`), plus a **surface-mount registry** (Section 4.3). Owns: which surfaces exist, their order, their gating, their lazy-load. Owns *no* feature logic.
2. **Auth + session** — `lib/supabase.js`, `lib/multi-point-auth.js`, `lib/auth-session-guard.js`, `lib/access-gate.js`, `lib/device-trust.js`, `lib/pin.js`. The single source of "who is signed in."
3. **Role-gating** — the King → Family → Servant-king (Governor/staff) → sheep (member) ladder ([[project_role_model_king_governor_admin]]): `isFamilyEmail`, `isChurchStaffEmail`, tier helpers (`TIER_ORDER`/`VIEW_TIER_REQUIREMENTS`), the tenancy boundary (DR-0074, DR-0060). A module **declares** the role it requires; it never re-implements the check.
4. **Operations / Events spine** — the cross-module nervous system: the orchestration event reel, the conflict-loop, the governance queue, KPI/freshness, loop-health, dispatch. The **typed event contract** modules emit to and read from (Section 4.4).
5. **Design system + shared primitives** — `index.css` (themes; default = midnight), the contrast/overlap gates, and `components/shared.jsx` + the shared dots/legends (`KpiDot`, `FreshnessDot`, `TraceableNumber`, `SectionBoundary`, `ErrorBoundary`).
6. **Sync substrate** — `lib/table-sync.js` + `lib/sync-identity.js` (instance-scoped, RLS-aware). The generic read/write/subscribe contract every feature's `*-sync.js` is built on.

Everything else — Conference, Choir, Pulpit, Video Wall, Learn, Engagement, Rentals, Books, Quality, Build board, Council Chamber, every future industry surface — is a **feature module**, not core.

**Boundary test (machine-checkable, DR-0076):** *a feature module may import from the core; the core may NOT import from any feature module; feature modules may NOT import each other's internals* (they talk via core + events). This is the gate to be added (Section 5, step 4). The day a green check enforces this, the boundary is real and not aspirational.

### 4.2 What a FEATURE MODULE is

A feature module is a self-contained unit owning its own files:

```
app/src/components/<Feature>.jsx          # the surface(s) — UI
app/src/lib/<feature>-sync.js             # its data contract (built on table-sync)
app/src/lib/<feature>.js                  # its pure logic/calcs (optional)
app/src/__tests__/<feature>*.test.js      # its own tests — ships green or doesn't ship
infra/supabase/migrations-auto/NNNN-*.sql # its schema (see 4.5 for numbering)
```

This is **already the de-facto pattern** ([[project_new_surface_new_module]]). Conference, Choir, Pulpit, Video Wall each look exactly like this today. The ADR's job is to make it the *named, enforced* pattern and to remove the one place it still leaks: the mount.

### 4.3 The MODULE CONTRACT — the surface-mount registry (the one missing seam)

This is the heart of the migration. Today, mounting a surface means **editing two choke-points inside the monolith**: the import block and the render switch. Both are textual collision points; both showed up in every recorded monolith conflict.

**The contract:** a surface registers itself as **data**, not as a code edit to a shared switch. A registry entry is:

```js
// app/src/surfaces.js  (the new core file — the registry)
{
  id: 'church-video-wall',
  label: 'Video Wall',
  nav: 'church',                     // where it appears (top-level | church | projects | …)
  requires: { role: 'governor', tier: null, flag: 'church-video-wall' }, // declarative gate
  boundary: true,                    // wrap in <SectionBoundary> (default true)
  load: () => import('./components/ChurchVideoWall.jsx'),  // lazy — own bundle chunk
}
```

The shell reads the registry, applies the role/tier gate from core (4.1.3), lazy-loads the chunk, and wraps it in a `SectionBoundary`. **Adding a surface = appending one entry to a list** (or, end-state, dropping a `<feature>.surface.js` file the registry globs). Mounting a surface **no longer edits the import block or the render switch** — the #1 and #2 collision points disappear.

**Why this is the whole fix:** the conflict-analytics tool independently recommended exactly this ([P1] "Extract a surface-mount registry"). The surfaces are already separate files; only the *wiring* collides. Convert the wiring from shared code into per-module data and the collision is gone — without touching a single feature.

### 4.4 SHARED STATE & the EVENTS spine — how interdependence flows

- **Independent modules** keep their own state via their own `*-sync.js` (instance-scoped Supabase rows). No shared mutable globals. This is most modules.
- **Shell-owned shared state** (current user, role, active instance, theme) is read-only to modules, provided by the shell via context/props. A module *reads* identity; it never *sets* it.
- **Interdependent modules** communicate through the **Events spine**, never by importing each other:
  - **Data dependency** → through the **core sync substrate** (a module reads the rows another module wrote, scoped by the same instance contract). Example: the Quality surface reads gate/loop results; it does not import the Build module.
  - **Behavioral/notification dependency** → through a **typed event** on the Operations/Events spine (the reel / conflict-loop / governance queue / dispatch). A module emits `event(kind, payload)`; interested modules subscribe. Example: a surface emits a freshness/KPI event; the Governor's Loops and KPI surfaces consume it. The event names + payload shapes are the **contract**, owned by core.
- **The rule:** if module A needs something from module B, the answer is *core sync* or *an event* — **never** `import B`. This is what keeps modules independently shippable and is exactly the boundary the gate enforces.

### 4.5 The SECOND collision surface — migrations

The data shows `migrations-auto` is tied with the monolith as the #1 hot spot (3× each), via **strictly-ordered numbering** (duplicate 0019, duplicate 0022, grandfathered). A monolith fix that ignores migrations leaves half the collision in place.

**Decision:** keep strict ordering for *apply* determinism, but **decouple number-claiming from authoring.** Two acceptable mechanisms (pick at implementation, post-conference):
- **(a) Timestamped names** — `YYYYMMDDHHMM-<slug>.sql` — collision-free by construction; apply order = lexical = chronological. Simplest; recommended.
- **(b) A claim step** — a one-line "reserve next number" the orchestrator runs before a lane writes a migration, recorded centrally.

Either removes the duplicate-number class. The migration-order check (`scripts/orchestration/migration-order-check.mjs`) stays as the proven-to-catch gate (DR-0076). **Not before conference** — migration mechanics touch the live schema path; this is post-conference work.

---

## 5. Migration path — incremental, conference-safe

**Hard rule:** **nothing in steps 1–4 ships before the July conference.** The conference rides the *current* composition. The ADR is the decision; the steps below are sequenced for *after* the conference soak, except step 0 which is already true.

| Step | What | When | Collision removed | Risk |
|---|---|---|---|---|
| **0** | **new-surface=new-module already in force.** New surfaces are already built as their own files; only safety gates hold, never a person. | **Done** ([[project_new_surface_new_module]]) | (prevents *new* monolith growth) | none |
| **1** | **Introduce the surface registry (`surfaces.js`) as a NEW file.** The monolith iterates it once to mount registered surfaces. This is *one* serialized monolith edit, done while **no other monolith branch is in flight**, then the import-block/render-switch is **frozen**. | **After conference**, first infra step | The #1 + #2 monolith choke-points | Low — additive; behind `SectionBoundary`; full `npm run verify`. The single edit is the *last* time the mount-wiring is touched. |
| **2** | **Migrate existing surfaces onto the registry**, a few per PR, each independently. No two PRs touch `surfaces.js`'s *same* region if we append; conflicts here are trivial list-append merges, not logic. | After step 1 | Residual mount edits | Low — each surface already isolated; tests per surface. |
| **3** | **Peel the largest remaining in-file sections** (`BigPictureDashboard`, `Admin`, the feedback/TTS/install banners) into `components/*.jsx`, mounted via the registry. Use the conflict-loop's **ranked hot-file output as the work queue** — extract highest-contention first. | After step 2, incremental | Shrinks the monolith toward a thin shell | Medium — large sections; do one per PR, characterize-before-change (DR-0076 §5), keep behavior pinned by existing tests. |
| **4** | **Add the boundary gate** (core-imports-no-feature; features-don't-import-each-other) + the **migration-numbering fix** (4.5). | After step 1, can parallel step 2–3 | Enforces the contract; kills the migration class | Low — gates are additive and proven-to-catch before merge. |
| **5** | **Full decomposition** — the monolith is now a thin composition root over `surfaces.js` + core. | After conference, after the in-flight queue drains | — | — |

**Why this is conference-safe:** step 0 already prevents new monolith growth, so the conference surfaces (Register, Variance, EventCenter, Setup checklist) are already isolated modules and unaffected by any of this. Steps 1–5 are explicitly post-conference. The first real change (step 1) is purely additive and reversible, gated by the full deterministic verify suite and per-surface `SectionBoundary`. **No conference surface is touched by the migration.**

**Cost/effort, honest:** step 1 is ~½ day (one careful edit + registry + tests). Steps 2–3 are incremental and ride normal feature work — they cost *less* than the collisions they prevent (the 2026-06-17 pileup alone serialized three lanes). Step 4 gates are a few hours each and pay for themselves on first catch. This is not a stop-the-world refactor; it is paid down in the normal flow (DR-0075, perpetual improvement).

---

## 6. How this serves the wider system

The same shell/core + module-contract pattern is the substrate the larger PoeTech vision needs:

- **Workflow-module-library tiers** — each library module is a feature module conforming to the contract; tiers are a `requires.tier` field on the registry entry. Adding a tiered capability = a registry entry + a gate, not a monolith edit.
- **Multi-business CRM as separate instances** — the core's instance-scoped sync substrate (4.1.6) + tenancy boundary already isolates instances. A new business is a new instance, not new code; modules are instance-agnostic by contract.
- **Per-industry teams** — a team owns a set of feature modules end-to-end (their `components/`, `lib/`, `migrations`, tests) and ships them in parallel without colliding with other teams, because mounting is data and modules never import each other. The boundary gate is what lets teams move independently *and* stay one app.
- **Sovereign-mesh nodes** — a node runs the same core + a subset of modules selected by registry/flags. Because modules are independently loadable (proven today by the URL-param standalone boots in `main.jsx`) and depend only on core + events, a node can compose a different surface set from the same codebase. The Events spine is the natural seam for inter-node messaging later.

**Standing screen — sovereign-mesh tier:** the registry's `load: () => import(...)` (per-module chunks) is what makes a mesh node able to ship only the surfaces it needs. We do **not** build mesh distribution now; we ensure the boundary doesn't preclude it. It doesn't — it enables it.

**Standing screen — MVP pragmatism:** the only thing this ADR asks us to build *soon* (post-conference) is **one new file and one careful edit** (step 1). Everything else rides normal work. We are formalizing what the repo already is, not inventing a framework.

---

## 7. Consequences

- **The collision engine is removed at its root** — mounting becomes data; the two textual choke-points and the migration-number class go away. Conflict trend target: DOWN (the loop will measure it).
- **Parallel lanes (DR-0077) finally don't collide** — the orchestrator integrates modules continuously against stable contracts, no serialized monolith lane.
- **One app is preserved (DR-0061)** — composition still happens at one shell; the family sees one PWA.
- **The boundary is verifiable (DR-0076)** — the import-direction gate makes "modules are independent" a green check, not a claim. Each new "looked-fine-but-wasn't" coupling becomes a new gate.
- **The monolith shrinks toward a thin shell** — `poe-financial-mvp-v28.jsx` ends as a composition root, eventually renamed to reflect that.
- **No conference risk** — nothing ships from this ADR before July; the conference rides the current, isolated-module composition.
- **Re-review:** revisit after the conference soak completes and step 1 lands — confirm the conflict-rate trend turned DOWN before committing to steps 3–5. (DR-0075 re-review discipline.)

---

*This document is the full architecture spec; [`DR-0078`](../decisions/DR-0078-hybrid-modular-shell-plus-feature-modules.md) is its ledger entry. Per the repo's decision-record discipline, the DR is the durable pointer and this foundation doc is the authoritative detail.*
