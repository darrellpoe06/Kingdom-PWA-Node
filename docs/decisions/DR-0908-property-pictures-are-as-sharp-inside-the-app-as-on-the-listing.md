# DR-0908 — Property pictures are as sharp inside the app as on the listing

**Date:** 2026-10-10
**Status:** accepted
**Area:** Poe Properties: the Pictures tab grid, the Doors board covers, the home's card
**Principle:** DR-0303 (the list never carries the bytes), DR-0076

## Context

Darrell, 2026-10-10, with a screenshot of the public listing for 805 N Prospect Apt 2:

> "Pictures inside PoeTech App for apartment 2 are worse image quality than the advertising Pictures without an account... why?!!!! Fix it!!!!"

**SHOULD.** A picture inside the app is at least as sharp as the same picture on the public listing.

## What was measured

- The public listing card (`Storefront.jsx` VacancyCard) draws `storage_path`, the full image.
- The app's grid (`DoorTabs.jsx` GalleryTab) and the board covers drew `listImage(p)`, the thumbnail. Since 0185, thumbnails were made at `THUMB_MAX_WIDTH = 320` and `THUMB_QUALITY = 0.6`.
- A grid tile on a phone at 3x density needs about 900 real pixels, so a 320-pixel, 60%-quality picture is stretched about three times. That is the blur.
- Pictures are data URLs fetched by id through `loadPhotoImages` (`cloud.js`). The list itself carries no bytes (DR-0303).

## Impact

The family saw their own unit look worse inside their own app than in the ad a stranger sees. That undercuts trust in the surface they work from every day.

## Decision

1. **`SharpPicture`** draws the thumbnail at once, so the list stays fast and carries no bytes.
   - Once the tile is on screen and drawn, it compares the tile's real pixel width (CSS width × device pixel ratio) with the picture's natural width.
   - When the screen needs more, it fetches the full image by id and swaps it in.
   - Full images are cached for the session and fetched at most three at a time, so the board, the Pictures tab and the viewer share one fetch.
   - An unmeasured tile is sharpened anyway: unknown never reads as "sharp enough".
2. **Sharper thumbnails from now on:** 640 pixels at 75%. Older 320-pixel thumbnails are covered by step 1.
3. **Wired** on the Pictures grid, the Doors board covers (grid and list), and the family's own home card. The viewer opens on the sharpest copy already known.

`re-review: 2026-10-24` — open 805 N Prospect Apt 2's Pictures on a phone. Tiles sharpen within a moment of scrolling into view and match the public listing.

## Verification

- `property-pictures-are-as-sharp-inside-as-outside.test.jsx` (6 tests) covers:
  - the arithmetic: a 320-pixel thumbnail on a 300 CSS px tile at 3x needs more (proven to catch);
  - a phone-width tile swaps in the full image;
  - a small tile already covered by its thumbnail fetches nothing;
  - one fetch per picture for the whole app, reused by the viewer;
  - never more than three full images in flight at once;
  - new thumbnails are 640 px at 75%.
- `property-photos-list-carries-no-bytes.test.js` now pins the new shape: the grid draws `SharpPicture`, which starts from `listImage` and fetches the full image by id. The list still carries no bytes.
- The properties, photo and gallery suites (673 tests) pass.
