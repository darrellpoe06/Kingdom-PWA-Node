# DR-0691 — The Capacity tab says what it sees, and the over-capacity Cancel keeps a project out

- **Status:** accepted
- **Tier:** A
- **Type:** surface
- **Date:** 2026-09-30
- **Scope:** `app/src/components/CapacityPanel.jsx` (new); `app/src/components/BigPictureDashboard.jsx` (Now → Capacity renders the panel; the Action Queue alert carries the not-enforced note); `app/src/components/DevOps.jsx` ("Wrap me" alert carries the note); `app/src/lib/opportunity-capacity.js` (`capacitySnapshot` states + contributing rows, `CAPACITY_CHECKED_FLOWS`, `capacityDecisionForNewProject` outcomes); `app/src/__tests__/big-picture-render.test.jsx`; `app/src/__tests__/capacity-decision.test.js` (new); `app/src/lib/legibility-health.json` (regenerated: one new page).
- **Principles:** VERIFICATION-DOCTRINE, REALITY-TRACE, SPEC-CONFORMANCE, PERPETUAL-IMPROVEMENT, DECISION-RECORDS
- **Grounds:** DR-0061 (a surface is a live view of real state; no painted numbers); DR-0076 (proven-to-catch); DR-0219 (SHOULD / ARE / GAPS / CLOSE); DR-0075 (a parked gap carries a why and a re-review date). The number DR-0690 is held by the open lesson PR #1873 (`claude/lesson-bishop-gwin`).

## Context

On 2026-09-30 Darrell sent a phone screenshot of Big Picture → Now → Capacity, dark theme, with nothing at all under the "What needs you / Capacity" sub-tabs, and asked:

> "Capacity workflows work?"

The screen could not answer him. A blank panel reads as broken, whether or not anything behind it is.

## What was measured

**SHOULD (documented intent).** `app/src/lib/opportunity-capacity.js` (the Round 11 capacity guard comment): family-wide hours per week committed by active projects (`planning`, `active`, `ending-soon`) against hours per week available from skill profiles; 80% warns, over 100% blocks, and the reader picks "Add as TBD", "Add anyway" or "Cancel". The function comment lists three outcomes: `add-active`, `add-tbd`, `cancel`. The meter copy in `BigPictureDashboard.jsx` said new projects from Dev/Ops "Wrap me" or "Tenant-as-Project" prompt before adding.

**ARE (traced end to end).**

- *Supply side, skill profiles.* Created and edited in Dev/Ops (`view === 'opportunities'`, nav label "Dev/Ops", Foundation tier, so every account reaches it) → My options → My skills → "+ Add a profile", field "Hours/week available" (`DevOps.jsx`, `sp-hours`). Saved through `railCrud(skillProfilesSync, 'skillProfiles', ...)` in the shell to the `skill_profiles` table (`infra/supabase/migrations-auto/0077-live-data-rails.sql`), mirrored into `data.skillProfiles`. That is the only editor.
- *Demand side, projects.* `data.projects` (the projects table sync); `hoursPerWeek` per project; only the three active statuses count; `tbd` is parked and does not.
- *The meter.* `BigPictureDashboard.jsx` computed `capacitySnapshot(projects, skillProfiles)` and rendered the meter only when `hasProfiles && available > 0`. Otherwise it rendered **nothing**: the blank tab in the screenshot. With no profiles (the demo seeds and a fresh account both carry `skillProfiles: []`), the tab is always empty.
- *The check.* `capacityDecisionForNewProject` is called by exactly two flows: the Action Queue's manual add with urgency "Project" (fixed 4 hrs/wk) and Dev/Ops "Wrap me with the tech". No "Tenant-as-Project" flow exists anywhere in `app/src`. Projects added on the Projects tab, and the Feedback promote panel's `addProject`, run no check.

**GAPS.**

1. The Capacity tab was blank whenever no profile carried hours: no reading, no reason, no path to fix it.
2. With no profiles, the check returned `add-active` with a `note`, but neither caller showed the note: every project went in unchecked, silently.
3. With profiles that all read 0 hrs/wk, the check computed 0% and waved every project through with no note at all.
4. Over 100%, the prompt said "Click Cancel to keep it out entirely", but Cancel returned `add-active`: the project was added ACTIVE, the opposite of what the reader chose. `cancel` was documented and handled by both callers but never returned.
5. The meter copy named a "Tenant-as-Project" flow that does not exist.
6. The committed number had no trace to the rows it came from.

## Impact

The one screen meant to answer "do we have time?" gave Darrell nothing, and the one guard behind it could add a project he had just declined. Nothing he could see told him capacity was not being checked at all.

## Decision

1. **The tab is never blank.** `CapacityPanel` renders one of three states from `capacitySnapshot().state`:
   - `no-profiles`: "Family Capacity · not being checked yet"; what it measures; "What's missing: No one's weekly hours are set yet, so capacity isn't being checked. New projects are added without a capacity check."; the hours per week it CAN measure (committed from active projects); a button "Set weekly hours · Dev/Ops → My skills" that opens the existing editor (`setView('opportunities')` lands on My options → My skills by default).
   - `no-hours`: the same, naming how many profiles exist with none carrying hours. No painted 0%.
   - `measured`: the meter as before, plus how many profiles carry hours, and a "Change weekly hours" link.
   In every state it lists the top five active projects carrying hours (largest first, "+ N more"), and says how many active projects have no hrs/wk set, so the number traces to real rows (DR-0061).
2. **It names the flows that really check**, from one exported list (`CAPACITY_CHECKED_FLOWS`): Action Queue add-as-Project and Dev/Ops "Wrap me"; and says plainly that projects added on the Projects tab are not checked. "Tenant-as-Project" is gone.
3. **The check does what its prompt says.** Over 100%: OK = TBD, Cancel = `cancel` (kept out). 80–100%: OK = TBD, Cancel = add active (unchanged, as its prompt says). Profiles with no hours now return `add-active` with a note, like no profiles. Both callers now show the note in their confirmation alert.
4. The existing editor is reused; no second editor is added. It is one tap from the tab.

**Parked, with a why.** The Projects tab's own "new project" and the Feedback promote panel still add without a capacity check. Adding `confirm()` prompts there changes a daily-use form's flow and deserves its own trace against how Darrell adds projects; the tab now states the gap instead of hiding it. **re-review: 2026-10-14.**

## Verification

- `app/src/__tests__/big-picture-render.test.jsx`: three new render tests open Now → Capacity and assert the `no-profiles` state (text, 16 hrs/wk committed from the active + planning rows only, complete and TBD rows excluded, the unhoured count, the button calling `setView('opportunities')`), the `no-hours` state (no 0%, no progressbar), and the `measured` state (meter at 80%, "16 / 20 hrs/wk", contributor rows in order, no "Tenant-as-Project").
- `app/src/__tests__/capacity-decision.test.js`: the documented outcomes, with `window.confirm` stubbed: no profiles, no hours, fits, tight OK/Cancel, over OK/Cancel = `cancel`; the snapshot states and contributors.
- **Proven-to-catch:** with `BigPictureDashboard.jsx` and `opportunity-capacity.js` reverted to `origin/main` and the tests kept, 7 of 17 fail (the three render states, the no-hours and over-Cancel outcomes, the snapshot states, the flows list). Restored: 17 of 17 pass.
- Also run green: `decision-chain.test.js`, `contrast-guard`, `form-control-contrast`, `consistency-guard`, `legibility-guard` (health regenerated, 273/286 pages pass, no new violations), `library-theme-classes`, `interconnect-manifest`, `interconnect-flow`; eslint on every touched file. The monolith is not touched.
- After merge: the Deploy (Cloudflare Pages) run whose `head_sha` equals the merge commit is the proof the tab is live.
