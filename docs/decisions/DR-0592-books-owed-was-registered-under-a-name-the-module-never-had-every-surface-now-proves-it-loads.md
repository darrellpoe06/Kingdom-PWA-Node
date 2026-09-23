# DR-0592 — Books → Owed was registered under a name the module never had; every registered surface now proves it loads

- **Status:** accepted
- **Tier:** A (one registry entry; one new gate)
- **Type:** fix
- **Date:** 2026-09-23
- **Scope:** `app/src/surfaces.js` (the `owed` entry loads the module's default); `app/src/__tests__/every-registered-surface-loads.test.js` (new — walks the registry, 58 surfaces + proven-to-catch)
- **Principles:** REALITY-TRACE (DR-0061 — the surface the user meets), VERIFICATION-DOCTRINE (DR-0076 §2 gate-the-class, §3 proven-to-catch), LESSONS P16
- **Grounds:** Darrell 2026-09-23, Fold screenshot 18:05: Books → Owed shows "OWED HIT AN ERROR … The error was recorded so it can be fixed." — *"Fix it after"*; and *"Modules built so understanding that's important"* (the module registry is the architecture; the fix lives in it, not around it).

## Context

`surfaces.js` is the module registry: one entry per lazy-loaded surface, `load` the single chunk boundary, `component` derived from it. The `owed` entry was written as `pick(() => import('./components/Obligations.jsx'), 'Obligations')` — a NAMED export — while Obligations.jsx exports only a default. `pick` resolves `{ default: m.Obligations }` = undefined, and React refuses the lazy element (#306). The section boundary caught it, so every other tab kept working, and the error went to the device-local journal that nobody but the phone can read.

## What was measured

| what | measured |
| --- | --- |
| reproduction | local preview, `?view=books&sub=owed`, signed out: "OWED HIT AN ERROR"; console: `Minified React error #306 … args[]=undefined`, "Surface error caught (Owed)" |
| since when | the entry shipped with the surface on 2026-09-11 (#1526, ffa937a): 12 days broken for every reader who opened Owed |
| why no gate caught it | obligations.test.js mounts `Obligations` directly (105 tests green); nothing opened the surface THROUGH the registry — LESSONS P16 exactly |
| the class | 17 registry entries use a named `pick`; a static scan found exactly one whose module lacks the name (this one) |
| after the fix | the walk loads all 58 registered surfaces to a function (60 tests); the local preview renders Owed ("Reading the ledger…", no boundary); lint clean; build clean |

## Impact

Before: the family's ledger surface (what is owed, aging, each door, the day's post) was unreachable on the live build since it shipped, and the app's own words ("the error was recorded") pointed at a journal only the phone holds. After: the entry loads the default export, and a registry-wide gate makes a mis-named pick fail in CI with the surface's id and the words "React #306 on the phone" before a build reaches anyone.

## Decision

1. The `owed` entry loads the module directly (`() => import(...)`), the registry's own convention for default-export surfaces.
2. `every-registered-surface-loads.test.js` walks `surfaceById` and asserts each `load()` resolves to a function; the proven-to-catch case re-creates the shipped shape and shows it resolves to undefined. This is the gate for the class (DR-0076 §2): a registered surface that cannot load cannot ship.
3. No change to Obligations.jsx: the module was right; the registry named it wrong.

## Verification

- `npx vitest run every-registered-surface-loads` — 60/60 (58 surfaces + registry non-empty + proven-to-catch); obligations.test.js 105/105 and surface-access untouched.
- Local preview rebuilt with the fix: `?view=books&sub=owed` renders the ledger's loading line, no boundary, no console error (Playwright, Chromium).
- After merge and deploy: Darrell opens Books → Owed on the Fold; the live review (DR-0104) confirms the five sections (What is owed · Aging · Each door · The day's post · The words) render signed in.
- re-review: 2026-10-07 — whether any other lazy boundary (church/books sub-views outside `surfaceById`) needs the same walk.
