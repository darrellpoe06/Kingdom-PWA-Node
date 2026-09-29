# DR-0679: Create is a second row of subs, like Church's, and the Workspace is first and the default

- **Status:** accepted
- **Tier:** B (an app surface re-laid out; no schema, no transport, no money; every gate unchanged)
- **Type:** feature fix (amends DR-0678)
- **Date:** 2026-09-29
- **Amends:** DR-0678 (the Create station's layout; its roles, classes and panels stand)
- **Scope:**
  - `app/src/surfaces.js`: Create's subs are registered as `nav: 'create'`, `view: 'create'`: Workspace (`sub: 'workspace'`, first), Lesson entry, Your lessons, Lessons to decide, Governor's queue, Towers, Read and listen, Hand off. Each has `requires` and `whenDenied`. The Governor's two queues are `family`, and the lesson lists and Towers are `signed-in`. All are `lock`.
  - `app/src/components/CreateSubNav.jsx` (new): Create's level-2 row. It uses the band, the `<TabScroll chrome>` primitive (Show all / Less included) and the button classes of the Church row, and it is derived from the registry. A locked sub stays in the row, marked with the lock.
  - `app/src/lib/create-sub.js` (new): the open sub, shared by the row in the header and the page in `<main>`. The open sub is the handoff link's if there is one, then the device's remembered choice (localStorage, wrapped), then the Workspace.
  - `app/src/components/CreatingStation.jsx`: shows one sub at a time. The Workspace canvas stays mounted (hidden) while another sub is open. Alt+1 opens the Workspace, Alt+2..8 open the panels, and Alt+0 goes back to the Workspace.
  - `app/src/components/CreationWorkspace.jsx`: the canvas, exactly as it was, is handed to the station as the Workspace. It is no longer a block below the station or above it. On a screen under 600px tall (the Fire TV's 960x540) the intro's eyebrow and sentence and the type blurb fold away and the mat's padding tightens, so the canvas starts above the fold; the heading and every control stay.
  - `app/src/poe-financial-mvp-v28.jsx`: **no new lines**. The import and the one header mount (`{view === 'create' && <CreateSubNav …/>}`, beside the Church row) ride existing lines. The file stays 5,312 lines, within its budget.
  - `app/src/lib/app-doors.js`: `?view=create&sub=` is honoured as well as the handoff's `&panel=`.
  - `infra/device-availability/device-roles.json`: each panel gets its short `tab` name (the same names the registry uses, pinned by a test). The prose now says the roles order the subs after the Workspace and never pick the default.
  - `scripts/chrome-layout-probe.mjs`: the DEVICE pass measures the row and the open page, not a grid of panels. It chooses a profile in "Who's using this device?" before clicking a sub, and a click that cannot land is reported with its reason instead of swallowed.
  - Tests: `creating-station.test.jsx` (rewritten), `thinking-space-untouched.test.jsx` (new), `surface-mount-integrity.test.js` (knows `nav: 'create'`).
- **Principles:** DR-0061 / DR-0065 (the app is the primary artifact); DR-0076 §1/§3 (measured, proven-to-catch); DR-0111 (do the work); DR-0239 dimension 4 (form factor measured); DR-0657 (the TV).
- **Grounds:** Darrell, 2026-09-29, verbatim, in order:
  - *"Why take away my type texting place?!!!!!!!!!!!! Where is it?!!!!!!!!!!!!!!"*
  - *"Obviously give us a actual tabs like so we can know!!!!!!!!!!!!!!!!"*
  - *"Subtabs"*
  - *"Review how our tab structure works!!!"*

## Context

DR-0678 (PR #1847, merge 15cffb0d) put the Create station, seven stacked panels, ABOVE the Creation Workspace canvas. On a phone this pushed his writing place out of sight. The quick fix, PR #1851 (merge 78942bec), moved the station below the canvas, so the canvas came back first. The station was still a long stack, though, with no way to see what was there or to jump to it.

### Reality-trace (what was true before this change)

- The app has three levels of tabs. The first is the main nav. The second is a row directly under the main nav for a section's subs. Church's row (Church · Ministries · The Word · Scripture · …) is `<div className="border-t border-[#E8E4DC] bg-white"><TabScroll chrome …>`, with ink-underlined buttons, in the shell's header. Books and TLC use the same mechanism. The third level is `SectionTabs` inside a page (Worship · Speak · Prayer · …).
- Church's row is a hand-written id list in the shell, not generated from `surfaces.js`. The registry does carry Church's subs (`nav: 'church'`, with `requires` and `whenDenied`), and gated tabs are read through `lib/surface-access.js`. Create's row is **derived** from the registry instead, so the shell carries only one mount.
- Thinking Space (`notes`) holds its own typing box (`OneVoiceInput`) and "Your prompts" (`PromptHistory`). DR-0678 did not touch it, and neither does this DR. A new test renders it to prove the box and Your prompts are still there.

## Impact

- **Darrell's writing place is back first, everywhere.** Create opens on the Workspace canvas on every device, with its canvas measured above the fold: 519px of 900 on a 1440 laptop, 479px of 1080 on a 1920 laptop, 661px of 844 on a phone, and 479px of 540 on the Fire TV. Before this record the TV put it at 578px, below its 540px fold.
- **Every Create tool is one tap away, and he can see them all.** The eight subs sit in a named row under the main nav, the same row he knows from Church, instead of a long stack to scroll through.
- **Nothing he types is lost by looking away.** The Workspace stays mounted while another sub is open.
- **The shell does not grow.** The monolith stays at 5,312 lines; the row is derived from the registry.
- **A click on a sub is proven to switch the page in a real browser.** The first CI run reported "the subtab did not open" on every device. The cause was the shell's "Who's using this device?" profile picker, a full-screen modal on a fresh device, sitting over the row: every click landed on the modal, and the probe swallowed the click error. The switch itself (the row and the page share `lib/create-sub.js`) was sound. The probe now chooses a profile the way a person does, proves the modal is gone, and reports any click that cannot land with what intercepted it.

## Decision

1. **Create has a level-2 row, the same as Church's.** It uses the same band, the same `TabScroll chrome` and the same button classes, sits in the header under the main nav, and is not `SectionTabs`. No new tab component is invented.
2. **The Workspace is first and the default on every device** (phone, tablet, laptop, TV). The device roles (DR-0678) order only the subs after it. A roles file cannot move it, and a test pins that.
3. **Only the open sub shows.** The Workspace canvas stays mounted while another sub is open, so a trip to another sub never loses what he typed.
4. **The choice is remembered per device** (localStorage, never trusted to exist). The handoff link `?view=create&panel=<sub>` opens that sub, and so does `?view=create&sub=<sub>`.
5. **Alt+digit on a laptop:** Alt+1 opens the Workspace, Alt+2..8 open the panels in the device's order, and Alt+0 goes back to the Workspace. Plain keys stay free for typing.
6. **The Firestick D-pad is never caged.** The row's buttons own no arrow keys. A test runs the real remote-navigation scorer and shows that Down from the row lands in the page. A proven-to-catch case shows the check fails on a strip that swallows its arrows.
7. **Gates are unchanged.** The Governor's two queues are family-only, as on Projects → Decisions, and are locked rather than hidden. The station's own "these are the Governor's to decide" message still shows inside them. RLS is the wall.

## Verification

- `creating-station.test.jsx` covers these cases: Workspace is the first tab and the open one on every class; every sub is reachable; only one page shows; the canvas keeps its text; the remembered choice survives a reload; bad storage falls back to the Workspace; every panel's deep link opens its sub; Alt+digit works; the D-pad is not caged, including with the real scorer; Create uses the same band, primitive and classes as the Church row, and its registry entries are gated. Proven-to-catch: a page that opens on a panel, DR-0678's stack, and a strip that swallows its arrows are each flagged.
- `thinking-space-untouched.test.jsx`: the note input and `PromptHistory` render.
- The layout probe's DEVICE pass measures the row (every sub present, on screen, not past the right edge) and checks that the Workspace is open with its canvas above the fold. It then opens the role's first sub and measures it alone. `--selftest-break` hides the row and must trip. Measured locally on the built dist: `device ok` for laptop@1440x900, laptop@1920x1080, phone@390x844 and tv@960x540, each opening the role's first sub and seeing it alone; the selftest tripped 4 device checks.
- The monolith line count is unchanged (5,312).

## Re-review

- `re-review: 2026-10-13`. The Create sub is not written to the URL by nav-history (Church's `churchView` is). A reload keeps the sub through the device's remembered choice, but the browser Back button does not step between Create subs. Adding `create` to nav-history needs state in the frozen shell, or nav-history reading `lib/create-sub.js`. That is to be decided with the next shell extraction.
