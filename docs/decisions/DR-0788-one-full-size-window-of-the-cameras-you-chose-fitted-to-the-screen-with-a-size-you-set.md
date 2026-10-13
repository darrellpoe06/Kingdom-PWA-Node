# DR-0788 — One full-size window of the cameras you chose, fitted to the screen, with a size you set

- **Status:** accepted
- **Tier:** A (a new shape for an existing view; the same tickets, the same live roads, the same grants; no new route)
- **Type:** feature
- **Date:** 2026-10-07
- **Scope:** `app/src/lib/cameras.js` (`fitGrid`, `clampScale`, `setViewScale`, `VIEW_SCALE_MIN/MAX/STEP`; a view carries `scale`), `app/src/components/Cameras.jsx` (`ViewWindow`; `LiveVideo` `bare`; the ⤢ Window button on a view; the in-page grid steps aside while the window is open), tests in `cameras.test.js` and `cameras-render.test.jsx`, help copy
- **Principles:** DR-0783 (views you order while they stream), DR-0776 (a tile that is live), DR-0785 (full screen on a TV: the html attribute hides the chrome; Back / Esc return), DR-0061 (a surface is a live view of real state), DR-0076
- **Grounds:** Darrell 2026-10-07, watching two cameras stream on the Firestick under the header and the nav (screenshot: basketball cam and front door view, the Up / Down chips in the bar): *"Intuitively... I should also be able to put my chosen cameras into one full-size window that has all of the ones I chose and fit automatically based on the size of the screen and an adjuster that lets me up or down size so it fits whatever perfectly... make sense?"*

## Context

SHOULD: the cameras a person chose (a view, DR-0783) fill the screen they are watching on, with nothing else in the way. ARE: a view is a grid inside the Cameras tab under the shell header and the tab rows, with 1–4 columns chosen by hand or by count; on the TV two cameras used the lower two thirds of the screen. GAPS: no full-size shape; no fit to the screen's own size; no way to pull the picture in from the edges a TV cuts off (overscan). CLOSE: below.

## What was measured

| what | measured | basis |
| --- | --- | --- |
| the view's data | camera ids, order, layout, kept on the device under `poetech.cameras.views.v1` | `lib/cameras.js` `loadViews` / `saveViews` |
| the live tile | `LiveVideo`: a ticket per camera, the chosen road, reconnects, first-picture time | `Cameras.jsx` |
| the screen on the wall | 960×540 CSS px on the Firestick's Silk; 1920×1080 on a laptop | DR-0785's probe cases; the screenshot |
| the fit | 6 cameras at 1920×1080 → 3×2 of 640×360; 4 → 2×2 of 960×540; 5 at 960×540 → 3×2 of 320×180; 7 on an upright phone → 2 across | `fitGrid`, pinned in `cameras.test.js` |

## Decision

1. **⤢ Window on a view with cameras** opens `ViewWindow`: a fixed, black, full-viewport layer (above the shell) holding every camera of the view as a bare live tile (the picture and the camera's name, Resume when a stream has given up; no header, no Remove). Real full screen is asked of the browser where it allows it (the same `enterFullScreen` as the reader, so the dock, header and docked bar hide); Back on a remote, Esc, the browser's own exit, or Close leave it.
2. **Fitted automatically.** `fitGrid({ count, width, height, aspect 16:9, gap })` tries every column count and keeps the one that gives each tile the most area (equal area → more columns, since a wall reads wider). The window re-fits on every resize. The bar says `N cameras · C across · P%`.
3. **A size you set.** − Smaller / + Bigger step the scale by 5% between 50% and 100% (100% is the fit); Fit returns to 100%; the + and − keys do the same. The scale is kept WITH THE VIEW (`view.scale`, clamped on load; a view saved before this reads as 100%), so a TV that cuts its edges is set once.
4. **One slot per camera.** While the window is open the in-page grid is not rendered, so each camera holds one live ticket, not two; closing the window brings the grid back.

Proven to catch: the fit on real screens and the gap; the clamp and the kept scale, including a saved view without one; the render test opens the window from a two-camera view at 1024×768 and sees the fitted column count, both bare tiles with `<video>`, the in-page grid gone and exactly two new tickets, Smaller → 95% saved with the view and the grid's column width changed, Fit → 100%, Esc → the grid back; UI standards (focus rings) hold.

## Verification after merge

- On the Firestick: Cameras → Live → a view with cameras → ⤢ Window: the cameras fill the TV in the fitted grid; − Smaller twice pulls them in from any cut edge and the setting is still there after Back and ⤢ Window again.
- `cameras.test.js` 74, `cameras-render.test.jsx` 29, `ui-standards-set.test.js` 29 green on the merged head.
- re-review 2026-10-21: whether the window should also take the "Big" single-camera road (one camera, full screen) and whether a per-TV overscan setting should live on the device rather than the view.

## Impact

Unresolved: the chosen cameras shared the screen with the header, the nav and the tab rows, at a size nobody chose. Resolved: one window, every chosen camera, fitted to the screen it is on, at a size set once and kept.
