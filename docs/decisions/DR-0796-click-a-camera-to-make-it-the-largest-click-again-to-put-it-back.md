# DR-0796 — Click a camera to make it the largest; click it again to put it back

- **Status:** accepted
- **Tier:** A (a view-state toggle on the live tiles; no new road, no NAS change, every stream and slot unchanged)
- **Type:** feature
- **Date:** 2026-10-07
- **Scope:** `app/src/lib/cameras.js` (`toggleFocus`, `focusIn`, `shownCount`), `app/src/components/Cameras.jsx` (`LiveVideo` takes `onPick` / `picked` and makes the picture a button for a click, Enter or Space; `ViewWindow` and the in-page view grid keep one focused camera, lay out one tile for it and hide the rest without unmounting them), `app/src/lib/help-content.js`, tests in `cameras.test.js` and `cameras-render.test.jsx`.
- **Principles:** DR-0783 (views you order while they stream), DR-0788 (the full-size window, fitted), DR-0776 (live in every tile; a slot per camera), DR-0075, DR-0076
- **Grounds:** Darrell 2026-10-07, from the Firestick with a view of live cameras open: *"Clicking inside the image of one camera makes it largest size... click again it goes to the previous position."*

## Context

SHOULD: in a view, or in the full-size window, one camera can be brought to the whole area with a click on its picture and sent back to its place with a second click — without stopping any stream and without losing the order the viewer set (DR-0783). ARE, measured against `Cameras.jsx` as it was: a tile's picture took no click at all; the only way to see one camera large was to open it alone or change the view's layout to one across, which re-laid every tile and, on the way back, had to be undone by hand.

## What was measured

| what | measured | basis |
| --- | --- | --- |
| a click on a picture (before) | nothing | `LiveVideo` had no handler on the picture |
| one camera large (before) | layout → 1 across re-lays every tile; undoing it is a second setting | `viewCols(view.layout, …)` |
| after a click (after) | the view grid is one column with the clicked camera marked; the other tile has `hidden` and keeps the same `<video>` element; no new ticket | `cameras-render.test.jsx` (DR-0796 case) |
| the second click (after) | two across again, nothing hidden, the order unchanged, no new ticket | the same case |
| in the window (after) | `fitGrid` lays out ONE tile (a larger `gridAutoRows`), the bar reads "front yard · largest · click it again to put it back", the hidden tile keeps its `<video>`; the second click restores the rows and the "2 cameras · 1 across · 100%" line | the same case |
| a remote (after) | Enter on the picture toggles the same way | the same case |
| a removed camera (after) | a focus naming no camera in the view is nothing (`focusIn`), so the view never sticks on a tile that left | `cameras.test.js` |
| suites | `cameras.test.js` 77, `cameras-render.test.jsx` 30: 107 green | `vitest run` |

## Decision

1. **The picture is the button.** In a view and in the window the live picture takes a click, Enter or Space (`role="button"`, `aria-pressed`, a title that says what the click does). Resume inside a tile stops the click from reaching the picture.
2. **One focused camera per view or window.** The clicked camera's tile is laid out alone — the view grid at one column, the window with `fitGrid` for one tile at the viewer's scale — and the bar says which camera is largest and how to go back.
3. **The others stay mounted, hidden.** Their streams keep running and their `<video>` elements are the same, so the second click puts every tile back where it was at once, with no ticket asked and no reconnect.
4. **A focus that names no camera is nothing.** Removing the focused camera from the view, or switching views, clears it (`focusIn`).

## Verification after merge

- The DR-0796 cases run in CI (107 camera tests green).
- Deploy proof per DR-0107: a real deploy run on the merge SHA.
- `re-review: 2026-10-21` on the Firestick: a click on a window tile from the remote (Select = Enter) makes it the largest; a second press puts it back.

## Impact

- **Viewer:** one gesture to look at one camera and one to go back, in the view and in the window; nothing to set and unset.
- **Cost:** none on the NAS; hidden tiles keep their live slots (a view's cameras already held them).
