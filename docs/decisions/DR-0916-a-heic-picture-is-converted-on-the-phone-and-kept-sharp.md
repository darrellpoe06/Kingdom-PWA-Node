# DR-0916 — A HEIC picture is converted on the phone and kept, and the full picture is sharp on a big screen

**Date:** 2026-10-10
**Status:** accepted
**Area:** `app/src/lib/image.js` (every picture upload in the app), Poe Properties picture sizes, the door journeys (DR-0911)
**Principle:** DR-0076 (measure, prove to catch), DR-0219

## Context

Darrell, 2026-10-10, a screenshot of the PoeTech app (Properties → Pictures) on his Samsung Fold:

> "Skipped 14: 6660.heic (the image could not be decoded on this device (HEIC or an unsupported format?)), 6659.heic ..."

> "When is this fixed?!!!!!!!"

> "I want the best pictures in the PoeTech App too!!!!!!!!!"

**SHOULD.** Any picture a phone takes is kept, and it looks as good in the app as the screen it is viewed on allows.

**ARE (before this record).**
- **How pictures were decoded.** Every upload in the app (17 callers) goes through `compressImageFile`. It decodes with the browser's own `<img>`.
- **HEIC.** iPhones and many Samsungs shoot HEIC. Safari decodes it; Chrome on Android does not. So every HEIC picked on Darrell's phone was refused, one error per photo.
- **Size.** The full picture was stored at 1280 px wide, quality 0.7. Darrell's Fold, unfolded, is about 1800 device pixels wide, so every picture was stretched.

## What was measured

- **The bug, reproduced in a real browser.** The door journeys (DR-0911) gained step F1: the family picks a real phone HEIC in the Pictures tab.
  - The sample is libheif's own example, brand `mif1`, 718,114 bytes, sha256 `7f8b363e…f3f2`.
  - Chromium, like Chrome on Android, has no HEIC decoder.
  - With the old `image.js` rebuilt into the app, F1 fails with Darrell's exact words: `Skipped 1: 6660.heic (the image could not be decoded on this device (HEIC or an unsupported format?))`.
- **The fix, in the same browser, under production's CSP.** The harness now serves `app/public/_headers`' own Content-Security-Policy on every page; `upgrade-insecure-requests` is left out because the local gateway is plain http.
  - F1 passes, and the database holds a JPEG picture and a JPEG thumbnail on the door.
  - The stored JPEG's frame header reads **1280 × 854, 374 KB**. That is the sample's own size, kept whole; a picture is never enlarged.
- **The decoder's weight.** `heic-to` (libheif, LGPL-3.0, the CSP build: wasm in a `blob:` worker, both allowed by our CSP) builds to its own chunk, `heic-to-*.js`, 3,189,251 bytes.
  - It is loaded only when a HEIC actually fails to decode. The service worker caches only the shell, so no phone downloads it otherwise.

## Impact

Every picture-taking surface in the app now keeps HEIC photos instead of refusing them. That covers Properties pictures, system pictures, work-order pictures, the church, the vault and every other caller of `compressImageFile`. New property pictures are kept sharp on the largest phone screen in the family.

## Decision

1. **The device first, the converter second** (`image.js`).
   - `compressImageFile` tries the device's own decoder, which is free and correct on an iPhone.
   - Only when that fails AND the file's bytes say HEIC (`ftyp` + `heic|heix|hevc|hevx|heim|heis|mif1|msf1`, then the MIME type, then the name) is it converted. The conversion runs on the device with libheif, to a JPEG at 0.92, then takes the ordinary road: shrunk, stamped, stored.
   - A renamed HEIC is caught by its bytes, and a PDF is never sent to the converter.
2. **Bounded.**
   - The decoder's load and the conversion together have a 60-second ceiling, and the error says what happened in plain words.
   - One conversion serves the full picture and its thumbnail; a failed try is not remembered.
   - `readHead` falls back to FileReader where `Blob.arrayBuffer` is missing (older WebViews).
3. **The best picture.**
   - Property pictures (the gallery, system pictures, work-order pictures) are stored full at **1920 px, quality 0.85** (`FULL_MAX_WIDTH`, `FULL_QUALITY` in `DoorTabs.jsx`). The thumbnail stays 640 px at 0.75.
   - The list read never carries the full bytes (0185), so a board stays light. The full picture is fetched when a picture is opened (`SharpPicture`, DR-0908).
4. **Proven end to end on every push.**
   - CI downloads the sample at libheif v1.20.2 (checksum verified) and walks F1.
   - F1 requires the stored full JPEG to be at least 1280 px wide, measured from its frame header, so a thumbnail or an undecoded file fails it.

## Verification

- **vitest** `a-heic-picture-is-converted-on-the-phone.test.js`, 10 tests:
  - bytes beat names;
  - the bug reproduced without the converter;
  - a JPEG never loads the converter;
  - a PDF still says it cannot be decoded;
  - one conversion for both sizes;
  - the bucket road gets a `.jpg`;
  - the converter is asked for a JPEG;
  - a hanging conversion gives up with a reason;
  - a failed load says so.
- `a-system-keeps-its-pictures` pins the sizes, `[1920, 0.85]` and `[640, 0.75]`.
- **End to end:** 9 of 9 journeys pass locally with F1 (output above).
- **Proven to catch:** with the pre-fix `image.js`, F1 fails with the skipped-HEIC message, as shown above.
