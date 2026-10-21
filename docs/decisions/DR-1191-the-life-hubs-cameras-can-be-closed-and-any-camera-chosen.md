# DR-1191: The Life Hub's cameras can be closed on the front page, and any camera chosen

**Date:** 2026-10-21
**Status:** accepted
**Tier:** A (one block on the Life Hub; a per-device preference and a picker; no new door, no data, nothing opened that the credential did not already open)
**Type:** surface
**Area:**
- `app/src/lib/hub-camera.js` (`HUB_CAMERA_HIDDEN_KEY`, `loadHubCameraHidden`, `saveHubCameraHidden`, the words)
- `app/src/components/HubCamera.jsx` (the × that closes, the closed row with the way back, every other camera small, the picker by name)
- `app/src/__tests__/hub-camera.test.jsx` (three cases added, two pins moved from four to every-other-camera)

**Amends:** DR-1184 on two points: the small frames were "at most four"; they are now every other camera, with a picker that names them all. And the block had no way to close. Grounds: DR-0061 (the surface a reader meets), DR-0076 §8, UX-PATTERNS 2f.2 (a control never leaves a person with nowhere to go) and 2g (a glyph-only button carries its name; the 36px floor; focus shows), P15 / DR-0381 (a surface never goes blank: closed says it is closed and offers the way back).
**Declared by:** Darrell, 2026-10-21, with a screenshot of the Life Hub on his phone: "I need to be able to close the cameras on the front page... also choose any camera."

## Context

**SHOULD.** The Life Hub's camera block (DR-1184, this morning) is his to keep or to put away, and the camera it plays is his to choose from every camera his key opens, not from whichever four happened to come first.

**ARE, on the screenshot and in `HubCamera.jsx` as it stood.** The block always rendered for a device with a key: the chosen camera large, then `hubThumbs(cameras, chosen)` with its default `HUB_THUMBS_MAX = 4`, so on a key that opens more than five cameras the rest were unreachable from the Hub ("805 apt 4 · 805 back door · 805 basement · 805 front office v…" and no more). There was no control to close it; the only exit was the Cameras tab.

**GAPS.** No close. A choice limited to four. **CLOSE.** Below.

## What was measured

| what | before | after |
|---|---|---|
| ways to close the cameras on the front page | 0 | 1 (×, named "Close the cameras on the Life Hub", 36px, focus ring), remembered per device |
| what the closed state shows | — | one row: "Cameras closed on this device. The Cameras tab still has every camera." with Show cameras and Cameras beside it; no stream, no small frame asked |
| cameras a reader can choose from the Hub, on a key opening six | 5 (the chosen plus four small) | 6: every other camera small in a wrapping grid, and a picker that names all six |
| the kept choice when closed and reopened | — | untouched (`kitchen` survives a close and a show) |

## Decision

1. **A × closes the cameras on the Life Hub,** kept per device under `poetech.hub.camera.hidden.v1`. Closed is never blank: the row says it is closed on this device, that the Cameras tab still has every camera, and offers **Show cameras** and **Cameras** where the block stood. While closed nothing plays and nothing is asked of the NAS (the stream is given back, DR-1097).
2. **Every other camera is small beneath the chosen one,** in a grid that wraps, and **a picker names every camera** the key opens; choosing by name keeps the choice the same way a tap does.
3. Everything else of DR-1184 stands: only a device with a key sees a camera; a device without one sees the painted home and the words.

## Impact

Darrell can put the cameras away on the front page with one tap and bring them back with one, and he can choose any of his cameras to stay there, by picture or by name. A device that never closes them sees exactly what it saw this morning, with more cameras to pick from.

## Verification

- `hub-camera.test.jsx`: the existing live case now pins every other camera (five of six) and five still frames; three cases added: any camera chosen by name and kept; closed on the front page with the way back where the cameras were, the choice surviving, no stream and no frame asked while closed, and shown again; closed stays closed next time on this device, proven to reopen when the flag is cleared. 47 cases green with the Life Hub suite; lint 0.
- Not seen rendered: this sandbox has no route to poetech.us; the live pass on his phone is his, after deploy (DR-0104).
