# Project closure lifecycle check (READ-ONLY findings)

**Date:** 2026-06-23
**Question (Darrell):** Are finished projects being CLOSED/COMPLETED, or do they linger as active and inflate the dynamic numbers (MINE counts, 12-month Workload Forecast, Ending soon)?
**Scope:** read-only audit, no behavior change. Grounded in `file:symbol`.
**Verdict (short):** There IS a terminal status (`complete`) and the forecast/active-load math *does* correctly exclude it. But **closing is 100% manual with no nudge**, so a finished project whose end date has passed **lingers as `active (overdue)` and keeps inflating the Active metric + the 12-month forecast** until a human remembers to mark it complete. Two display surfaces (the "Mine/Everyone" headline counts and the default list) also still include completed + archived projects.

---

## 1. Does the project model have a TERMINAL status? — YES

**Statuses are defined in one place:** `app/src/components/Projects.jsx:112`

```js
const PROJECT_STATUSES = ['planning', 'active', 'ending-soon', 'complete', 'on-hold', 'tbd'];
```

| status | meaning | terminal? |
|---|---|---|
| `tbd` | parked-until-capacity (not yet committed) | no |
| `planning` | research / plan, pre-execution | no |
| `active` | in flight, work running | no |
| `ending-soon` | active, <30 days (a **manual** flavor of active) | no |
| **`complete`** | **finished — the real terminal "done" state** | **YES** |
| `on-hold` | parked; also doubles as the **archived** rest | terminal-ish (set down) |

**The eternal-sequence lens** (`app/src/lib/project-management.js:21-32`) maps these to stages and explicitly flags the two terminal rests:

```js
{ key: 'done',   label: 'Done',   status: 'complete', terminal: true, ... }
{ key: 'parked', label: 'Parked', status: 'on-hold',  terminal: true, ... }
```

So the terminal states are **`complete`** (finished) and **`on-hold`** (parked / archived). Archiving is non-destructive: `archivePatch()` (`project-management.js:122`) writes `status:'on-hold'` plus an "archived" lifecycle note, and `isArchived()` (`:128`) reads that note back.

---

## 2. When a project finishes, does it move to terminal — auto / manual / not at all? — MANUAL ONLY, no nudge

**There is NO automatic transition anywhere.** Grep across `app/src/lib/*.js` finds zero date-driven status logic — `ending-soon` and `complete` are only ever set by explicit UI actions (`Projects.jsx`, `project-management.test.js`, `venue-rental.test.js` are the only hits, and none auto-flip status).

When an end date passes with no action (`Projects.jsx:832`):

```js
const isOverdue = end && end < now && p.status !== 'complete';
```

`isOverdue` is **only a red label** ("(overdue)", `:873`). It never changes the status. **A finished/past-due `active` project stays `active`** — it lingers.

**Ways to actually close a project (all manual):**

- **"▶ Advance to Done"** — in the per-row **Manage** panel (`Projects.jsx:361-366` → `moveToStage` `:316-319` → `statusForStage('done')` = `complete`). This is the only in-panel path to `complete`, and it only appears when the project is at the **execute** stage. Note: the eternal-stage buttons themselves *filter out* terminal stages (`:351`, `!s.terminal`), so you can't click "Done" directly — only "Advance to".
- **Edit form status dropdown** (`:725-727`) — manually pick `complete`.
- **"⏸ Archive"** — Manage panel (`:417`) → `on-hold` + archived note.

There is **no one-tap "Mark complete" on the project row itself**. Closing requires opening Manage → Advance, or opening Edit and changing the dropdown.

---

## 3. Do completed projects drop out of the active counts / forecast / ending-soon? — MOSTLY YES, with two leaks

**Correctly EXCLUDE `complete` (good):**

- **Active metric** — `scoped.filter(p => p.status === 'active')` (`:621`)
- **Ending soon metric** — `status === 'ending-soon'` (`:622`)
- **Total weekly hours** — `active' || 'ending-soon'` (`:624`)
- **12-Month Workload Forecast hours** — `scoped.filter(p => p.status === 'active' || p.status === 'ending-soon')` (`:554`)
- **Timeline range** — `visibleProjects = filtered.filter(p => p.status !== 'complete')` (`:530`)

So the forecast and active-load numbers are **mathematically correct** for *truly-completed* projects.

**Two leaks where finished work still inflates the picture:**

1. **"Mine (X)" / "Everyone (X)" headline counts** (`:599`, backed by `mineCount` `:499` and `projects.length`) have **NO status filter** — they count completed AND archived projects. The headline counts read high.
2. **The main project list** (`filtered`, `:504-508`) filters only by domain + status — **completed and archived projects are shown by default**, mixed in. `isArchived()` exists but is **not** applied to the list filter; it's only used to show a badge inside Manage (`:314`).

**The bigger, behavioral leak (the real answer to the worry):** because completion is manual and nothing prompts it (#2), an `active` project that is actually finished/past its end date **stays `active`** and therefore **keeps counting in the Active metric, the Total weekly hours, AND the 12-month Workload Forecast**. The forecast is only trustworthy if the human diligently marks every finished project complete. In practice, finished-but-not-marked projects **do** inflate those numbers.

---

## 4. Is there a filter/view for completed/closed? — PARTIAL

- **Yes, findable:** the status filter dropdown (`:676-679`) renders every `PROJECT_STATUSES` value, so you can filter to `complete` (or `on-hold`) to see closed/archived projects.
- **No default hygiene:** there is no "hide completed/archived" default and no dedicated Archive view/tab. Closed and archived projects sit in the list by default; you must actively filter to `complete`/`on-hold` to isolate them, or to anything-else to hide them.

---

## Recommendation — minimal sound fix (NO migration needed)

The data model is already sufficient: `status` persists via `updateProject`, and `complete` / `on-hold` are already valid, already-written values. **This is DB-backed today — no schema change, no migration.** The gaps are display + a missing closing nudge.

In rough priority:

1. **Close the lingering-active leak (highest value).** On any row where `isOverdue` is true (`:832`), surface a one-tap **"✓ Mark complete"** (and/or "Reschedule end date") right next to the "(overdue)" label (`:873`). This is what stops finished work from silently inflating the Active metric + the 12-month forecast. Optionally show a small "N overdue — still counted as active" line above the forecast so the inflation is visible until closed.

2. **Add a one-tap "✓ Complete" on the row** (next to Edit/Delete, `:851-865`), so closing doesn't require opening Manage → Advance or the edit dropdown. `updateProject(p.id, { status: 'complete' })` — same path the Promote button already uses (`:858`).

3. **Fix the headline counts** (`:499` / `:599`): either exclude `complete` + archived from "Mine/Everyone", or label them "(N active · M done)" so the count reflects active load rather than all-time totals.

4. **Default list hygiene:** hide `complete` + archived (`isArchived`, already implemented) from the list by default, behind a "Show completed / archived" toggle. Reuse the existing `isArchived()` helper — wire it into the `filtered` predicate (`:504-508`).

Items 1-2 are the substantive fix (finished projects get closed and stop inflating the live numbers); 3-4 are cleanup so completed work is archived-but-findable rather than clutter. All four are app-side only.

---

### Unverified / not checked

- I did **not** run the app to observe live counts — findings are from source (`Projects.jsx`, `project-management.js`) and a grep confirming no auto-transition logic. The math above is read from the filter predicates, not measured against live data.
- I did not audit `ProjectMgmtPulse.jsx` or `BuildBoard.jsx` for whether *they* re-include completed projects in any roll-up; this check was scoped to the Projects · Timeline surface Darrell named.
