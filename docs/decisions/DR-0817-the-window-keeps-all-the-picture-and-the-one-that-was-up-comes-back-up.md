# DR-0817 — The window keeps all the picture, and the one that was up comes back up

**Date:** 2026-10-08
**Status:** accepted
**Area:** the camera wall's full-size window
**Principle:** DR-0788 (the full-size window), DR-0076 (measure, do not claim; proven-to-catch), DR-0239 (form factor MEASURED), DR-0438 (the controls never get bigger), DR-0621 (hold the hand of the process)

## Context

Darrell, with a photograph of the wall on the television — four cameras, two
across, black bands down both sides and under the control row:

> "The window for bigger images makes big black sections around the bottom and
> sides... for the controls... can we move the controls so we keep all video
> capacity also... when reset happens inside the app... bring it back up to the
> live window that was already up... make sense?"

Two separate things, and the first is arithmetic rather than taste.

## What was measured

**1. The bar was costing the picture, sideways as well as down.** The window
laid out as a column — the grid, then a 56px control bar — so `fitGrid` was
handed `height - 56`. Every tile is 16:9, so height taken costs **width** too.
On a 1920x1080 television, with the 6px gap the window uses:

| cameras | tiles before | side band before | tiles after | side band after | picture |
|---|---|---|---|---|---|
| 4 (his screen) | 894 x 503 | **63px each side** | 944 x 531 | 13px | **+11.5% area** |
| 1 | 1799 x 1012 | 61px | 1898 x 1068 | 11px | +11.3% |
| 2 | 951 x 534 | 6px | unchanged | 6px | — |
| 6 | 632 x 355 | 6px | unchanged | 6px | — |

So the bands he is pointing at are real and the bar is what caused them — on
the four-camera wall he was looking at, 126px of width and 56px of height.

**2. A reset lost the window.** Whether the window was up lived in React state
only (`const [windowOpen, setWindowOpen] = useState(false)`). A service-worker
update, a crash, or any reload dropped him back to the page with the cameras
still streaming behind it, and he had to find the view and press Window again.

**3. A measurement that changed the shape of the fix.** Capping the sticky
title row for DR-0816 raised the same question about the fold handle, which
carried `.ts-chrome-region`. `zoom` caps a box as well as a font: measured in
Chromium at 390x844, that 44px handle rendered **24 x 20** at Big Print 44 — a
tap target shrunk to less than half, for exactly the reader who needs it
biggest, which is the one thing `index.css` says a region must never do. Capped
by its glyph instead, it measures **52 x 44** and the row holds at 57px.

## Impact

- **The four-camera wall on his television gets 11.5% more picture** and the
  side bands fall from 63px to 13px. The window is the whole screen again.
- **The controls did not go away; they moved.** The bar floats over the
  picture, shows on open and on any key, tap or pointer move, and fades after
  four quiet seconds. It never fades while a remote's focus is standing inside
  it — hiding the thing a D-pad is on would strand the viewer — and a hidden
  bar takes no clicks, so a tap goes to the camera under it.
- **A reset brings the window back up, on the view it was showing.** Close is
  the signal: closing forgets it, so a window he shut stays shut, and only one
  that was still up when the app went away comes back.
- **The fold handle is a real 44px target again at every text size.**
- **Said plainly rather than smoothed over:** two cameras, or six, keep their
  bands. A 2-across row is 32:9 and a 3x2 grid is 8:3, both wider than a 16:9
  screen, so they are width-bound and the bar was never what cost them.
  `fitGrid` already picks the arrangement with the most area; nothing in this
  change makes those two shapes better, and "+ Bigger" is the control for the
  rest. **re-review: 2026-11-08** — whether a mixed layout (one large tile with
  smaller ones beside it) is worth building for those counts.

## Decision

- `ViewWindow` hands `fitGrid` the **whole** viewport height; `WINDOW_BAR_PX`
  is gone. The bar is `absolute inset-x-0 bottom-0` over the grid, with a
  translucent backdrop so the words stay readable over a bright driveway.
- `barShowing({ lastInputAt, now, focusInBar })` decides whether it is up —
  pure, in `lib/cameras.js`, so the rule is testable without a browser. Shown
  for `WINDOW_BAR_QUIET_MS` (4s) after any input, and always while focus is
  inside it. Hidden, it is `pointer-events-none`.
- The open window is remembered: `saveOpenWindow(viewId)` on open,
  `saveOpenWindow('')` on close, and `windowToResume(views, saved)` decides on
  load — the remembered view must still exist and the memory must be younger
  than `WINDOW_RESUME_MS` (12 hours). It comes back on the view it was showing,
  not on whichever happens to be active.
- The sticky title's fold handle drops `.ts-chrome-region` and caps its glyph
  instead, so the 44px target stays 44px.

Full screen is still asked of the browser on open; a restored window cannot ask
for it without a gesture, so it comes back as the full-screen overlay and the
browser's own full screen returns on the next key. That is stated, not hidden.

## Verification

- `app/src/__tests__/camera-window-keeps-the-picture.test.js` **11/11 green** —
  every number in the table above computed from the real `fitGrid`; the bands
  before and after; the two-and-six case named as geometry; the bar's show/hide
  rule including the D-pad case; the window remembered, forgotten on close,
  resumed on its own view, and refused when the view is gone, when the memory
  is stale, or when storage throws; and the window component pinned to all of
  it (no bar height subtracted, the bar absolutely positioned, open and close
  wired to the memory).
- **Proven to catch (DR-0076 §3), three breaks, each restored after:**
  - the bar put back in the column → *"the grid is laid out against the WHOLE
    screen"* and *"the bar floats over the picture"* fail;
  - the memory removed from open/close → *"opening remembers the window and
    closing forgets it"* fails;
  - `barShowing` made always-true and the staleness check dropped → *"the bar
    shows on input, hides after a quiet spell"* and *"nothing comes back when
    there is nothing to come back to"* fail.
- `cameras.test.js`, `cameras-render.test.jsx`,
  `the-wall-says-why-in-one-line.test.js` and this file: **165/165 green**
  together. `the-title-stays-in-view.test.jsx` **19/19** after its fold-handle
  assertion was updated to the measured behaviour.
- The 24x20 and 52x44 handle sizes and every tile number above are
  measurements from Chromium on the built `dist`, not estimates.
- Not verified from here: the window on Darrell's own television. The sandbox
  has no route to the cameras or to poetech.us (DR-0125), so the live look is
  his, and the four-camera wall in his photograph is the case to look at first.
