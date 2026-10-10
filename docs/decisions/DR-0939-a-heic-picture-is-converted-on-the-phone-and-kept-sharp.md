# DR-0939 — A phone's HEIC picture is proven kept in a real browser under production's CSP, and property pictures are stored sharp enough for a big screen

**Date:** 2026-10-10
**Status:** accepted
**Area:** the door journeys (DR-0934, step F1); Poe Properties picture sizes (`DoorTabs.jsx` `FULL_MAX_WIDTH` / `FULL_QUALITY`)
**Principle:** DR-0076 (measure; prove to catch), DR-0905 (a HEIC photo is a photo, #2100)

## Context

Darrell, 2026-10-10, a screenshot of the PoeTech app (Properties → Pictures) on his Samsung Fold:

> "Skipped 14: 6660.heic (the image could not be decoded on this device (HEIC or an unsupported format?)), 6659.heic ..."

> "When is this fixed?!!!!!!!"

> "I want the best pictures in the PoeTech App too!!!!!!!!!"

**The decoder itself is DR-0905 (#2100), on main.** It lazily loads libheif (`libheif-js/wasm-bundle`) when the device's `<img>` cannot decode a HEIC. This branch had written a second decoder in parallel (`heic-to`) and dropped it at the merge, so the app carries one decoder.

**What was not yet proven:**
- that the decoder works inside the BUILT app, in a browser with no HEIC support, under the live site's Content-Security-Policy;
- that a picture is stored at a size that looks good on the screens the family uses. His Fold, unfolded, is about 1800 device pixels wide; full pictures were stored at 1280 px, quality 0.7.

## What was measured

- **The journey.** Step F1 of the door journeys: the family picks a real phone HEIC in the Pictures tab and adds it.
  - The sample is libheif's own example at v1.20.2: brand `mif1`, 718,114 bytes, sha256 `7f8b363e4936c0666a25f64f3a92fda10bd8e5453be4592530b65a55dd98f3f2`.
  - Chromium has no HEIC decoder, like Chrome on Android.
  - The harness serves `app/public/_headers`' own CSP on every page, leaving out only `upgrade-insecure-requests`, because the local gateway is plain http.
- **Before the fix.** With the pre-fix `image.js` built into the app, F1 fails with Darrell's exact words: `Skipped 1: 6660.heic (the image could not be decoded on this device (HEIC or an unsupported format?))`.
- **With DR-0905's decoder.** F1 passes:
  - the database holds a JPEG picture and a JPEG thumbnail on the door;
  - the stored full JPEG's own frame header reads 1280 px wide, 344 KB, which is the sample's full width (a picture is never enlarged);
  - so the decoder runs under the production CSP (wasm and its worker are allowed).

## Impact

The fix for Darrell's fourteen skipped photos is proven the way he hit the bug, on every push. New property pictures are stored sharp enough for the unfolded Fold.

## Decision

1. **F1 joins the door journeys in CI.** CI downloads the sample at libheif v1.20.2 (checksum verified) and passes it as `E2E_HEIC`. F1 requires the stored full JPEG to be at least 1280 px wide, read from its frame header, so a thumbnail or an undecoded file fails.
2. **The best picture.** Property pictures (the gallery, system pictures, work-order pictures) are stored full at **1920 px, quality 0.85** (`FULL_MAX_WIDTH`, `FULL_QUALITY`). The thumbnail stays 640 px at 0.75. The list read never carries the full bytes (0185), so a board stays light; the full picture loads when opened (`SharpPicture`, DR-0931). Pictures already stored keep their size until re-added.

## Verification

- **End to end:** 9 of 9 door journeys pass locally, F1 included.
- **Proven to catch:** with the pre-fix `image.js`, F1 fails with the skipped-HEIC message.
- **Unit tests:** `a-system-keeps-its-pictures` pins the sizes, `[1920, 0.85]` and `[640, 0.75]`. DR-0905's own gate (`a-heic-photo-is-a-photo.test.js`) decodes a real HEIC.
