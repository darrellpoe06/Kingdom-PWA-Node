# DR-1452: Thirty-three pictures arrive in one ask, and a tap leaves no frame

**Date:** 2026-11-12
**Status:** Accepted (built and proven)
**Tier:** A (feel, flow and smoothness on a surface that already works; DR-0075's steady state)
**Type:** decision
**Area:** `modules/properties/SharpPicture.jsx` (`warmThumbs`), `components/WorkOrderPictures.jsx` (`PictureStrip` warms its strip), `components/WorkOrderTriage.jsx` (`PHOTO_OPS.thumbs`, the row toggle's ring)
**Sent in by:** Darrell, 2026-11-12, from the Teams tab on work order #13 (33 pictures): "The color keeps changing to another color without me doing anything... I'm populating slowly... information..."
**Pairs with:** DR-0955 (a list carries no pictures; one tile asks for one thumbnail), DR-0931 (sharp inside), DR-1235 (pictures on a work order), DR-0075

## Context
DR-0955 made every tile ask for its own thumbnail when it comes on screen, three at a time, so a board of 67 pictures no longer froze at boot. On one work order with 33 pictures that same rule became 33 round trips, and a phone watched the grid fill one square at a time.

## What was measured
- **Screenshot 2:** eleven pale squares drawn, none filled, under a note with 33 pictures; `PHOTO_OPS.thumb` calls `loadPhotoThumbs([id])` for ONE id, and `SharpPicture` runs at most three such asks at once. The store already answers twelve ids in one call (`PHOTO_THUMB_BATCH = 12`).
- **Screenshot 2, the orange frame around #13:** the row's toggle carries `focus:outline` (`FOCUS_RING`). On a touch screen a tap focuses the button and the 2 px orange frame stays around the whole card until the next tap lands elsewhere. Nothing in the data changed colour; the frame appeared and left with the reader's taps.

## Impact
An opened work order's pictures arrive in three asks instead of thirty-three, and the grid fills together. The card no longer takes an orange frame from a tap; a keyboard still sees the ring.

## Decision
- **`warmThumbs(ids, loadMany, batch)`** in `SharpPicture.jsx`: the ids not yet known are asked in chunks of the batch size on the same small queue, each id registered as pending so a tile that comes on screen meanwhile waits for the batch instead of asking again; the answers seed the cache every tile reads; an unanswered id is recorded as "no thumbnail" so the tile falls through to its full image as before.
- **`PictureStrip` warms its strip** when given `loadThumbs`; `PHOTO_OPS.thumbs` is `loadPhotoThumbs(ids)`. Without the batch loader the older per-tile road is unchanged.
- **The row toggle's ring is `focus-visible`** (`TAP_RING`): painted for the keyboard, never left behind by a tap. `FOCUS_RING` on the buttons inside the card is unchanged.

## Verification
- **`thirty-three-pictures-arrive-in-one-ask.test.jsx`, 6 green.** Proven to catch: without the strip's warm-up the per-tile loader is called and "one ask" fails; without the pending registration a tile in flight asks a second time; with `focus:outline` back on the toggle the ring case fails.
- DR-0955's and DR-0931's suites still green (74 across the five picture suites); lint clean; `ui-standards-guard` 0 regressions.
- NOT measured from here: the fill on a phone over the real road. `re-review: 2026-11-19` from Darrell's own screen.
