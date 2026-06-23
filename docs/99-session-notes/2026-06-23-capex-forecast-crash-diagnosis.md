# CapEx / Capital Forecast crash — root-cause diagnosis (READ-ONLY)

**Date:** 2026-06-23
**Scope:** Diagnosis only. No code changed, no fix applied. (This note is the only commit.)
**Trigger:** Darrell hit the error boundary on the inventory **Capital Forecast** screen
("This page hit an error — but your data is safe"). Feedback triage already flagged
"CapEx tab broken." The boundary worked; the underlying surface crashes on render.

---

## 1. The surfaces involved (file:symbol)

- **Crashing surface:** `ProjectInventory` — [`app/src/components/Projects.jsx:1028`](../../app/src/components/Projects.jsx).
  It is the **Projects > "Inventory · Capital Forecast"** sub-tab
  (`subView === 'inventory'` renders it standalone — [Projects.jsx:172](../../app/src/components/Projects.jsx); it also renders `compact` at the bottom of the "list" sub-tab — [Projects.jsx:165](../../app/src/components/Projects.jsx)).
- **Error boundary that caught it:** `ErrorBoundary` — [`app/src/components/ErrorBoundary.jsx`](../../app/src/components/ErrorBoundary.jsx). The user-facing copy at line 32 ("This page hit an error — but your data is safe.") is the exact card Darrell saw. The boundary **functioned correctly** — it degraded to a recoverable card instead of white-screening the tree.

---

## 2. The exact throw (grounded, not guessed)

**Error:** `TypeError: Cannot read properties of null (reading 'slice')`
(or `...of undefined (reading 'slice')` when the title is `undefined` rather than `null`).

Reproduced in isolation (node):

```
projects.map(p => p.title.slice(0,24))   // p.title === null
// -> TypeError: Cannot read properties of null (reading 'slice')
```

**Where it throws** — the only two unguarded throwing expressions in the entire render
(a repo-wide grep for `.title.(slice|...)` in `Projects.jsx` returns exactly these two):

- **Primary — [Projects.jsx:1248](../../app/src/components/Projects.jsx):**
  ```jsx
  {projects.map(p => (
    <button key={p.id} ...>{p.title.slice(0, 24)}</button>   // <-- throws
  ))}
  ```
  This is the **project-filter button row**. It maps over **every** project and calls
  `.slice` on each `title`. One project with a `null`/`undefined` title throws during render.
  It is gated behind `!compact`, so it renders **only on the dedicated inventory sub-tab** —
  which is exactly the screen Darrell was on.

- **Secondary (same bug, latent) — [Projects.jsx:1160](../../app/src/components/Projects.jsx):**
  ```jsx
  {it.projectId && projectLookup[it.projectId] &&
    <span>· {projectLookup[it.projectId].title.slice(0, 20)}</span>}   // <-- same flaw
  ```
  The existence of the project is guarded, but the title being a string is **not**. Fires only
  when a capex item links a null-title project (seed capex items have `projectId: ''`, so this
  one stays dormant today — but it is the identical defect and should be fixed in the same pass).

**Why the list tab works but CapEx crashes:** the list sub-tab renders the forecast `compact`
(line 1160 path), and seed/real capex items with empty `projectId` never reach that `.slice`.
The killer (line 1248) is `!compact`-only, so it surfaces solely on the Inventory · Capital
Forecast sub-tab. This matches the observed symptom precisely.

`MetricCell` ([shared.jsx:212](../../app/src/components/shared.jsx)) and `fmt`
([Projects.jsx:19](../../app/src/components/Projects.jsx)) were checked and are **not** at fault —
both handle null/non-finite input safely. The `forecast` `useMemo` and `savingsPrompts`
date math are also safe (every `new Date(...)` is `isNaN`-guarded; every cost goes through
`parseFloat(...) || 0`).

---

## 3. Root cause + minimal sound fix

**Root cause — DB-data-shape, surfaced by a pure-render unguarded access.**
A project record reaches the component with `title === null` (or `undefined`). The render
assumes `title` is always a string and calls `.slice` on it. Two upstream seams allow a
null/undefined title through:

- **Sync-in, no default:** [`app/src/lib/projects-sync.js:58`](../../app/src/lib/projects-sync.js)
  `fromRow` does `title: row.title` with **no fallback** — while the outbound
  `toRow` ([line 29](../../app/src/lib/projects-sync.js)) *does* default to `''`. So a cloud
  `projects` row with a `NULL` title (an older row, a migration seed, or a hand-inserted row)
  comes back into the app as `title: null`.
- **Local create, no default:** `addProject` ([monolith line 3066](../../app/src/poe-financial-mvp-v28.jsx))
  spreads `...item` and never defaults `title`, so any caller that omits it mints a
  `title: undefined` project.

**This is NOT the seed-data / dynamic-finance interaction.** Seed projects (lines 305–310)
and seed capex (lines 439–442) all carry clean string titles and empty `projectId`, so the
demo path does not crash — which is why this only bites on real/synced data. `netCashFlow`
(dynamic finance) flows through `fmt()` and is not involved.

**Minimal sound fix — do both halves (render guard + seam default):**

1. **Render guard (the actual crash fix, proven-to-catch):** make both `.slice` calls
   null-safe, with a usable fallback so the filter button still reads sensibly:
   - [Projects.jsx:1248](../../app/src/components/Projects.jsx):
     `{(p.title || 'Untitled').slice(0, 24)}`
   - [Projects.jsx:1160](../../app/src/components/Projects.jsx):
     `· {(projectLookup[it.projectId].title || 'Untitled').slice(0, 20)}`

2. **Fix the shape at the seam (prevents recurrence in every other consumer):**
   [projects-sync.js:58](../../app/src/lib/projects-sync.js) → `title: row.title ?? ''`
   (mirrors `toRow`). Optionally also default `title` in `addProject`.

The render guard alone stops the crash; the seam default keeps a null title from tripping any
*other* surface that assumes a string. A small vitest that renders `ProjectInventory` with a
`[{ id, title: null }]` project would lock it in (currently no test covers this component).

---

## 4. Does the error boundary auto-report? — NO (confirmed)

`ErrorBoundary.componentDidCatch` ([ErrorBoundary.jsx:18](../../app/src/components/ErrorBoundary.jsx))
does **only** `console.error(...)`. There is **no** network call, no Supabase write, no feedback/
concerns insert, no reel append — nothing that would make a caught crash visible to the QC loop.
A crash is invisible unless (a) someone has the console open, or (b) the user manually files
feedback (which is how this one was caught — via triage, after the fact).

**For the QC-loop discussion:** the boundary should also emit a structured signal when it
catches — e.g. append to the feedback/concerns table or the dispatch reel
(`screen`, `error.message`, `componentStack`, timestamp) — so render crashes self-surface
instead of relying on a human noticing. That closes the "broken-and-invisible" gap that
LESSONS-LEARNED / EXECUTION-OUTCOME-OBSERVABILITY is meant to prevent. (Out of scope for the
fix itself; noted for the loop.)

---

## Verification statement

- **Read-only:** confirmed. No app code was modified; no fix applied. This note is the sole change.
- **Grounded:** the throw type/message was reproduced in node; the crash site was located by
  repo-wide grep (only two `.title.slice` call sites, both in `ProjectInventory`); the
  null-title data path was traced to `projects-sync.js:58` (no inbound default) and
  `addProject` (no default). The list-vs-CapEx symptom split is explained by the `!compact`
  gate on line 1248.
- **Unverified:** I did **not** query Darrell's live cloud `projects` table to confirm which
  specific row carries the `NULL` title — that requires LAN/cloud DB access. The render-level
  root cause and fix stand regardless of which row it is; the seam default makes the row's
  contents moot.
