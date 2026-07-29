# CONSISTENCY-STANDARD.md — Shared Primitives, Enforced

> Layer 3 foundation. Declared by Darrell 2026-06-25: **"we need consistency."**
> Recorded for the ledger as **DR-0079**. Pairs with DR-0076 (Verification
> Doctrine — a standard is a slogan until it is a check), DR-0078 (hybrid-modular
> architecture), and DR-0075 (perpetual improvement).

## Why this exists

Every bug Darrell hit on 2026-06-25 shared **one root cause**: there was no
*enforced* shared standard, so each surface drifted from every other.

| Symptom that day | The drift underneath it |
| --- | --- |
| Phone render ≠ laptop render | per-tab width caps instead of one container |
| Tofu box (□) where an icon should be | device-font **emoji** as a UI glyph |
| Contrast varied surface to surface | hardcoded colors instead of theme tokens |
| Text didn't grow on one surface | fixed-px font instead of the rem text-size system |
| The same number static here, live there | painted literals instead of derived data |
| One duplicate surface, two sources of truth | no single owner for a surface |
| One person showing up as nine names | free-text instead of a canonical entity |

The lesson is structural, not cosmetic: **drift is the default whenever a
standard lives only in someone's head.** A surface optimized against "whatever
data/style was nearest" diverges from its siblings the moment two people (or two
agent sessions) touch the app in parallel. As we add modules and contributors,
that divergence compounds — unless the standard is a primitive every surface is
*forced* to use and a check that *fails the build* when it isn't.

**This document does two things:**

1. Names the **one canonical primitive** for each consistency axis. A surface
   does not re-invent layout, icons, color, text-size, data access, identity, or
   persistence — it *consumes* the named primitive.
2. Points at the **machine checks** that enforce the named primitives, so a PR
   that drifts cannot merge. (See [Enforcement](#enforcement-which-guard-fails-the-build).)

The senior rule, from Darrell's reinforcement the same day:

> Make the architecture **resilient to scale and more contributors** — so adding
> people or modules **cannot undermine the build**. The build gets *stronger*,
> not more fragile, as modules and people are added: integration is
> contract-based, persistence is shared, and CI guards catch violations before
> merge.

---

## Part I — The shared UI primitives (every surface MUST use these)

### 1. LAYOUT — one full-width container

- **Rule:** every tab renders full-width and identically. No per-surface
  `max-w-*` cap that makes one tab narrower than its neighbor (the phone≠laptop
  drift). Reading-width constraints belong to the shared container's options, not
  to a one-off cap re-declared in each surface.
- **Canonical primitive:** the app-shell content container in
  `app/src/poe-financial-mvp-v28.jsx` (the `<main>` wrapper) + `TabScroll`
  (`app/src/components/shared.jsx`) for horizontal sub-tab strips.
- **Status:** **ESTABLISHED 2026-07-29 (DR-0246).** The full-width sweep
  converted every app-tab container (17 components in one pass — Study, TV Time,
  Library, Projects, Inventory, Kitchen, Bus, Cohorts, Voice Studio, Scripture
  Library, Moore Divahs, Events, Eternal Algorithms, Creation, Church Projects,
  Forecast, Relationships; ThinkingSpace led 2026-07-24), and the guard
  **graduated width-cap from WARN to HARD**: a new `max-w-*` over the frozen
  baseline fails the build. What remains grandfathered is interior measure —
  prose paragraphs, modals, centered empty-state cards — which lives INSIDE the
  full-width tab, never as its wrapper. The TLC public door follows its own
  front-door (Tier C) pass, recorded with this date: `re-review: 2026-08-12`.

### 2. ICONS — bundled inline SVG only

- **Rule:** UI chrome icons are **bundled inline SVG**. A device-font **emoji**
  (📓 🕊 🎛 🔒 📺 …) renders only if the *viewer's* OS ships that glyph — on
  Darrell's phone several fell back to a tofu box (□) while rendering fine on his
  laptop. A "nice app" cannot depend on the viewer's emoji font for its chrome.
- **Canonical primitive:** `app/src/components/UiIcon.jsx` —
  `<UiIcon name="book" />`. The glyph ships in the bundle (identical on every
  device); `currentColor` makes it contrast-correct in every theme for free;
  `1em` sizing makes it scale with the text-size primitive (#4). Add a path to
  the registry and reference it by name; never reach back to an emoji for
  load-bearing chrome.
- **Enforced:** NEW emoji over the frozen baseline **fails the build**
  (`scripts/consistency-guard.mjs`).
- **Kingdom-first (DR-0198, Darrell 2026-07-20):** iconography is welcome where it
  serves the work, and the palette must carry **Kingdom glyphs — not only secular
  ones** (`cross`, `dove`, `flame`, `crown`, `bookOpen` = the Word, …). Because the
  very Kingdom glyphs we want (🕊 ✝ ⛪ 📖) are the ones that box out as **tofu** on
  COLG's older phones, the reliable, COMMUNITY-FIRST way to "have Kingdom emoji" is
  to add the glyph to `UiIcon` as SVG (renders on every device) — that is *how* we
  grow the Kingdom palette. The guard is a **ratchet, not a ban:** a raw emoji that
  genuinely serves a *decorative/inline* spot ships by an **intentional, recorded
  baseline bump** (the same ratchet, e.g. ThinkingSpace 20→23) — intentional-and-
  recorded is the bar; silent drift is what fails. Load-bearing chrome still must be
  `UiIcon`. The test for any glyph: *does it serve the meaning of the work?*

### 3. COLOR / CONTRAST — one themeable token set

- **Rule:** color comes from the shared token set as **Tailwind utility classes**
  (`text-[#1A1815]`, `bg-[#FAF8F4]`, the green/rust/blue accents), never a
  hardcoded inline color. The per-`[data-theme]` remap in the monolith's
  `<style>` block re-points each token per theme (light / midnight / …), so a
  class is automatically correct in every theme; an inline color bypasses the
  remap and renders dark-on-dark in midnight. Every token meets **WCAG 2.1 AA**
  in both directions (text-on-bg and bg-on-text) in every theme.
- **Canonical primitive:** the token palette + per-theme remap defined in
  `poe-financial-mvp-v28.jsx`; status/accent class sets are reused (e.g.
  `concerns.js` `CONCERN_STATUS`, BuildBoard's roadmap colors) rather than
  re-picked.
- **Enforced:** `scripts/contrast-guard.mjs` already owns color — it fails the
  build on a sub-AA token in any theme, an un-themeable inline color in a guarded
  file, or a used color class with no/insufficient midnight remap (both
  directions). **The consistency guard does not re-check color** (clean
  separation, no double-counting).

### 4. TEXT-SIZE — one global rem-based control

- **Rule:** one global control governs all text by scaling the document **root
  font-size**; every size is authored in **rem/em** so it inherits that scale.
  No per-module text-size adjuster. No fixed-px font (`text-[10px]`) on reading
  text — px is absolute and stays tiny at A+++ (the WCAG 1.4.4 resize-to-200%
  miss). Author at the 16px baseline as rem instead (`text-[10px]` →
  `text-[0.625rem]`): pixel-identical at Normal, now scaling with the control.
- **Canonical primitive:** `app/src/lib/text-size.js` (the `useTextSize` hook +
  `applyTextSize`/`initTextSize`) and the single `TextSizeControl` in the app
  header.
- **Enforced:** NEW fixed-px font over the frozen baseline **fails the build**
  (`scripts/consistency-guard.mjs`).

### 5. DATA — every value derived/live from a real source

- **Rule:** every value a surface displays traces to a **real record / feed /
  run / timestamp** (Reality-Trace, P15/DR-0061). A painted literal masquerading
  as live ("60% complete", a hardcoded count) does not ship on a surface whose
  value is trust. Name the source (path + purpose) before coding.
- **Canonical pattern:** derive from the synced source-of-truth helpers — e.g.
  `lib/account-balances.js` (ledger → balances), `*-sync.js` modules, the Events
  spine — never a literal. One source of truth per value.
- **Standing exception to resolve:** the **cloud-Supabase ↔ NAS-Postgres split**.
  Today the PWA's live backend is cloud Supabase (`mjjlevhdufpaplypnqrv`); the
  sovereignty phase (~Jul–Aug 2026) moves the primary to home hardware with a
  sealed NAS backup. Until a single primary is ratified, this is the one
  documented place where "one source of truth" is not yet true. Tracked as the
  `seed-cloud-nas-split` concern; see [Part II §2](#2-persistence-is-a-shared-primitive).
- **Enforced:** Reality-Trace is a review discipline (DR-0061); data-layer
  conventions are owned by the data-layer-standard lane. Not a consistency-guard
  check (the guard is style/primitive drift), but named here as the standard.

### 6. ENTITIES — canonical records, not free text

- **Rule:** a name / person / account resolves to **one canonical record**, not
  re-typed free text. Free text is how one preacher became nine spellings (131
  messages under "Bishop Gwin" / "Bishop Gwinn" / …). A surface references an
  entity by id; a DB trigger canonicalizes on write.
- **Canonical primitive:** the entity tables + sync (`lib/entities-sync.js`,
  `church_speakers` + `speaker_id` with the DB canonicalize trigger). New
  people/place/account fields reference an entity, not a string column.
- **Enforced:** DB-level (canonicalize trigger + FK). A review discipline at the
  surface layer; named here as the standard.

### 7. NEW-SURFACE CONTRACT — inherit, don't re-invent

A new module is **not** a fresh canvas. It inherits all of the above by
*consuming the named primitives*:

- mounts through the **registry** (`surfaces.js`), never by editing the
  monolith's import block (Part II §1);
- icons via `UiIcon`, color via theme tokens, text via rem + the text-size hook,
  layout via the shared container;
- data via the synced source-of-truth helpers (real records only);
- identity via canonical entities;
- persistence via the shared client (Part II §2), never its own storage.

If a primitive is genuinely missing, the work is to **build the minimal shared
primitive** and name it here — not to hand-roll a one-off that fragments as the
next module copies it.

### 8. INFORMATION ARCHITECTURE — nest by default, don't spawn a top-level tab

Declared by Darrell 2026-06-26: *"we have a lot of places in the app, why?"* The
cause was structural — over four weeks **every feature became its own top-level
tab**, so the nav grew to ~21 places with overlap and thin duplicates. The fix
is the same as every other drift here: make the right thing the default and the
wrong thing need a reason.

**The rule (a standing design principle):**

- **A new surface NESTS into the most coherent existing home by default** — a
  sub-tab of a related surface, or a panel inside one — *not* a new top-level
  entry. Ask "whose home is this?" before "what do I call the tab?"
- **A new top-level place needs a real IA reason** — a genuinely new domain no
  existing surface covers — not just "it's a new feature." New top-level places
  are rare and deliberate; adding one is a decision, recorded like any other.
- **Thin surfaces are sections, not tabs.** If a surface renders little, it
  belongs *inside* a related surface, never as its own top-level place.
- **Preserve, don't delete, when consolidating.** Re-home a surface by moving
  where it is *reached*; keep its `view` id and deep-links so muscle memory and
  links survive (DR-0061: a surface is a live view of real state — moving where
  it's reached never removes the surface).

**Implementation note (2026-06-26):** a clustered top-level nav (six AREAS over a
`NAV_CLUSTERS` structure) was shipped (#381) and **reverted the same day** —
grouping the familiar tabs behind areas read as "lost the tabs" on the live app.
The principle above stands; the *regrouping must be visually obvious that nothing
was lost* (clear nesting, fully reachable scroll, verified at real widths) before
it ships again. Until then the top level stays one flat, fully-scrollable row.
`feedback-area-guard` enforces that **every** top-level surface still has a
feedback area, whatever the nav shape.

---

## Part II — Scale-resilience: why more people/modules can't break the build

Darrell, 2026-06-25: *"more people don't undermine the build because of our
building automation, technology stack, and ways of integration of modules."*
Four pillars make the architecture stronger as it grows.

### 1. Module integration is contract-based

Clean module boundaries with an explicit interface, per DR-0078 /
`MODULE-ARCHITECTURE-ADR.md`. A feature module **plugs into a contract**; it
cannot reach into the monolith or into a sibling and break it.

- **The contract:** `app/src/surfaces.js` — the surface-mount **registry**. A
  surface declares *how it loads* (a lazy `() => import(...)` thunk) and *where
  it mounts* (nav group, view/sub id, gate). Adding/owning a surface is a new
  registry entry, **not** a churned edit to the shell's import block (choke-point
  C1).
- **The boundary law (machine-checked):** core may not import a feature
  statically; a feature may not import the registry; a feature may not import the
  shell; features talk to each other only via **core sync + the Events spine**,
  never by importing each other. Enforced by
  `scripts/module-boundary-guard.mjs`.

### 2. Persistence is a shared primitive

Modules **do not roll their own storage.** They consume the one shared backend
data layer:

- **Canonical primitive:** `app/src/lib/supabase.js` (the single shared client;
  RLS on every table is the real access gate) + the per-domain `*-sync.js`
  modules that read/write through it.
- A module persisting through its own ad-hoc store is drift — it fragments the
  source of truth and bypasses RLS/tenancy. Coordinate with the
  **data-layer-standard lane** for the cloud↔NAS primary (the standing exception
  in Part I §5).

### 3. Building-automation guards are the safety net

The automation protects `main` from any one contributor. A module/PR that
violates a contract, ships local-only/static data where live is required, or
breaks a shared primitive **fails CI and cannot merge**:

- CI (`.github/workflows/ci.yml`) runs `lint + vitest` (which includes every
  guard below) + the wf36 gatekeeper on every PR and every push to a release
  lane. **Nothing merges with a red suite, regardless of tier.**
- Auto-merge fires **only on green CI** (`auto-merge.yml`) — green *is* the gate.
  So more people can contribute and the automation keeps main safe automatically.

### 4. Tech-stack consistency

One stack, shared primitives, enforced — no divergent one-off patterns that
fragment as the team grows. React 18 + Vite + Tailwind (utility classes, no
ad-hoc CSS) + Supabase. New surfaces are their own module files (parallel-safe),
never new patterns bolted into the monolith (`project_new_surface_new_module`).

---

## Enforcement — which guard fails the build

Every guard is a pure module in `scripts/` (importable + a CLI), gated by a
vitest in `app/src/__tests__/` that runs inside the required `app — lint +
vitest` check. Each is **proven-to-catch** (it has a test that injects the exact
break and confirms the guard flags it — an always-green check is itself a lie,
DR-0076).

| Axis | Guard | Hard-fails the build when… |
| --- | --- | --- |
| **Icons** | `consistency-guard.mjs` | a file has **more emoji** than its frozen baseline, or a **new file** introduces any emoji-as-icon |
| **Text-size** | `consistency-guard.mjs` | a file has **more fixed-px fonts** than its baseline, or a new file introduces any `text-[Npx]` |
| **Layout** | `consistency-guard.mjs` | *(WARN-only)* a file exceeds its `max-w` baseline — tracked, awaiting the full-width container |
| **Color** | `contrast-guard.mjs` | any token is sub-AA in any theme, an inline color sits in a guarded file, or a used color class lacks a sound midnight remap (both directions) |
| **Module boundary** | `module-boundary-guard.mjs` | core imports a feature, a feature imports the registry, or a feature imports the shell |
| **Tabs / overflow** | `tab-overflow-guard.mjs` | a sub-tab strip isn't wrapped in `TabScroll` / the shell loses its overflow guard |
| **Tenancy / data isolation** | `tenancy-guard.mjs` | a query crosses the instance boundary |

### The ratchet (how the consistency guard ships against a legacy surface)

A full sweep is impossible in one PR — `main` carries hundreds of emoji and
fixed-px uses mid-conversion across many sibling sessions. So the guard
**freezes a per-file baseline** (`scripts/consistency-baseline.json`): existing
offenders are grandfathered and a file's count may only go **down**; any count
that **exceeds** its baseline — or any **new file** (baseline 0) that introduces
drift — fails. New drift fails fast; the standard is enforced going forward
without boiling the ocean.

As sibling lanes (icons, full-width, text-size) convert surfaces, the live count
falls below the baseline (still green). Re-freeze the baseline lower so it can
never silently regrow:

```
node scripts/consistency-guard.mjs --generate   # re-freeze after a conversion lands
node scripts/consistency-guard.mjs              # report + gate
```

The baseline is a **DR-0075 ratchet**, not a permanent exemption: the documented
debt only shrinks, and the direction is always toward zero.

---

## The standing test for any new surface

Before writing a surface, name — out loud, in the response — the primitive it
consumes for each axis: **layout, icon, color, text-size, data source, entity,
persistence, and how it mounts (registry).** If any answer is "a new one I'm
inventing here," stop: either reuse the named primitive, or build the minimal
shared primitive and add it to this document. That is how the build gets
*stronger* as it grows.
