# DR-1533: The picture on screen is sharp

**Date:** 2026-11-18
**Status:** Accepted (built, gated, shipped through the lane)
**Tier:** A (which size of an existing public picture a surface asks for; no schema, no auth, no money)
**Type:** decision
**Area:** `app/src/components/HeroCarousel.jsx`; `app/src/modules/properties/Storefront.jsx` (`VacancyCard`); `app/src/__tests__/the-hero-picture-is-sharp.test.jsx`; `app/src/__tests__/a-listing-loads-one-picture-at-a-time.test.jsx`
**Sent in by:** Darrell, 2026-11-18, from the tablet: *"Pictures on the main page is not clear... they are pixelated... Poe Properties"*
**Pairs with:** DR-1016 (one picture at a time), DR-1236 (the hero carousel), DR-0955 (thumbnail first, then sharp: `SharpPicture` on the owner side)

## Context (SHOULD / ARE)

- **SHOULD:** a picture shown large on the Poe Properties front page is sharp on the device it is shown on.
- **ARE (before):** the hero carousel (`HeroCarousel.jsx:37`) and each listing card's main picture (`Storefront.jsx`, `srcOf(shot)`) asked `public_vacancy_picture` for `thumb` only. A thumbnail is 640 px wide at 75% JPEG (`cloud.js:625`). The full image was asked for only when a person opened the lightbox. A full-width 4:3 frame on his tablet is about 1,700 device pixels, so the 640 px thumbnail was stretched about 2.5x: pixelated. The owner side already solved this in DR-0955 (`SharpPicture`: thumbnail first, full swapped in); the public side never got it.

## Decision

1. **Thumbnail first, then the one on screen sharp.** The hero and the card still draw the thumbnail at once, so nothing waits. Then the ONE picture on screen asks for its full image and swaps in when it lands.
2. **DR-1016's budget holds.** The next picture and the strip stay thumbnails; a full image is asked for only for the picture being shown, once.

## Verification

- `the-hero-picture-is-sharp.test.jsx` (new, 2): the slide on screen ends on its full image; asks are `a:thumb, b:thumb, a:full`. Both fail against the previous `HeroCarousel.jsx` and pass on the fix.
- `a-listing-loads-one-picture-at-a-time.test.jsx`: expectations moved knowingly (two thumbnails and one full image for the picture on screen) plus a proven-to-catch case; three cases fail against the previous `Storefront.jsx` and pass on the fix.
- Not yet observed on his tablet against the live build. `re-review: 2026-11-25`: the front page's hero and cards sharp on the deployed build, or a why.
