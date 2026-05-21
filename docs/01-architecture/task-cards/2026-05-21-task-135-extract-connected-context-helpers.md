# Task card — #135 · Extract CONNECTED-CONTEXT helpers to leaf util module (eliminate monolith→component circular dep)

**Date:** 2026-05-21 · **Issued by:** Cowork (via Claude Code surfacing risk during task #88 wire-up) · **Status:** open · **Priority:** soon · **Not blocking #88** but worth doing before more components hit the same import.

---

**Foundation rules that apply:**

- `/docs/00-foundations/_root/CONNECTED-CONTEXT.md` — the helpers being moved (`ensureLinks`, `findRelatedAuto`, `ensureExternalProfile`) implement Rules 1 and 2.
- `/docs/00-foundations/_root/MODULAR-EXTENSIBILITY.md` — leaf utility modules (`app/src/lib/`) are the canonical home for pure functions reused across components.

---

**The risk (surfaced 2026-05-21 during task #88):**

`app/src/poe-financial-mvp-v28.jsx` currently exports `ensureLinks`, `findRelatedAuto`, and `ensureExternalProfile` as named exports (r41). Those exports were the path forward at the time because the helpers were already there and no leaf module existed yet.

In task #88 (r42), `app/src/components/Practice.jsx` started importing `findRelatedAuto` *back* from the monolith. The monolith imports `Practice` (and 12 other components); `Practice` now imports a function from the monolith.

That's a **circular dependency**:

```
poe-financial-mvp-v28.jsx  ──imports──▶  Practice.jsx
       ▲                                       │
       └──────────imports findRelatedAuto──────┘
```

ES module hoisting masks the cycle today: by the time `Practice` actually calls `findRelatedAuto` (at render time), the export has been initialized. But the cycle is real and brittle:

- Bundlers (Vite/Rollup) sometimes reorder the initialization order between dev and prod; what works in `npm run dev` can break in `npm run build` and vice versa.
- Adding new top-level code to the monolith that touches the helpers at module load (not at render) would throw `ReferenceError: Cannot access 'findRelatedAuto' before initialization`.
- Tree-shaking is degraded; everything in the import chain gets included even when only one helper is used.
- HMR reloads can re-evaluate the monolith mid-edit and surface inconsistent state in the component.

Task #88 wires inquiry first; Inbound is next; #89/#90 will bring Rentals, Books, Projects into the same shape. Each new component importing from the monolith deepens the cycle.

---

**What to do:**

Move all three helpers + `makeLink` to a fresh leaf utility module: `app/src/lib/connectedContext.js`.

**Module contents (target):**

```js
// app/src/lib/connectedContext.js
// CONNECTED-CONTEXT helpers — pure functions per
// /docs/00-foundations/_root/CONNECTED-CONTEXT.md. Leaf module by design:
// imports nothing from the rest of the app, so any component can import
// without creating a cycle through poe-financial-mvp-v28.jsx.

export function makeLink({ toEntityType, toEntityId, kind = 'related', source = 'auto', by = 'system', note = '' }) { … }
export function ensureLinks(item) { … }
export function findRelatedAuto(newItem, entityType, allData, maxResults = 10) { … }
export function ensureExternalProfile(item, type) { … }
```

Then:

1. **Delete the four definitions from the monolith** (`poe-financial-mvp-v28.jsx` lines ~527–607-ish at time of writing).
2. **In the monolith**, replace with:
   ```js
   import { makeLink, ensureLinks, findRelatedAuto, ensureExternalProfile } from './lib/connectedContext.js';
   ```
   (only if the monolith itself uses them — currently it doesn't; if not, no import needed at all.)
3. **In every component that currently imports from the monolith**, change the import path from `'../poe-financial-mvp-v28.jsx'` to `'../lib/connectedContext.js'`. As of task #88 that's just `Practice.jsx`; this card lands before more accumulate.
4. Verify `npm run lint && npm run build` are green.
5. Smoke-test the Practice tab's "Possibly related" chip group still appears with seed inquiries on the same source.

---

**Files involved:**

- **New:** `app/src/lib/connectedContext.js` (also create `app/src/lib/` if it doesn't exist).
- **Changed:** `app/src/poe-financial-mvp-v28.jsx` — delete the four function definitions; remove the comment headers that introduce them.
- **Changed:** `app/src/components/Practice.jsx` — switch import path.
- **Changed (likely soon):** `app/src/components/Inbound.jsx` once #88 lands its incident wire-up using the same matcher path.

---

**Success criteria:**

- No component file imports anything from `'../poe-financial-mvp-v28.jsx'` for CONNECTED-CONTEXT helpers.
- The dependency graph from any component → `lib/connectedContext.js` is acyclic (one-way).
- `npm run lint` green (`--max-warnings 0`).
- `npm run build` green.
- Practice tab "Possibly related" chip group still functions on the same source inquiries.
- `git diff --stat` shows a small, focused diff (likely ~150 lines moved, no semantic changes).

---

**Verification commands:**

1. `cd app && npm run lint` — must be green.
2. `cd app && npx vite build` — must complete without errors.
3. `git diff --stat` — net line count should be ~0 (move, not new code) plus the small new-file boilerplate.

---

**Out of scope (do NOT touch in this card):**

- Don't change the helper bodies. This is a pure relocation.
- Don't extract any other helpers (frequencyToMonthly, monthLabel, fmt) in the same card; one concern at a time.
- Don't introduce a class, a namespace, or a default export. Named exports only, matching the existing API.

---

**Estimated effort:** ~30 minutes. Small, mechanical.

---

**When done, report back:**

1. `git diff --stat`
2. Build output (last 5 lines)
3. Lint output (must be clean)
4. Manual smoke-test note: did the Practice "Possibly related" chip group still show with seed inquiries? (Static analysis acceptable in lieu of browser test, matching the standing direction.)
5. Any deviation from the plan + one-line reason.

---

**Notes from Cowork:**

This is preventive maintenance, not a feature. The cost of the cycle is low today (only one consumer); the cost of waiting until 4–5 consumers import from the monolith is several rounds of refactor noise. Land #135 before #88-completion is the cleanest sequence, but #88 itself can land first if needed — both orderings are correct.
