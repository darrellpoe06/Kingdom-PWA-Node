# DR-1529: The Teens skin repaints every light card, and a replaced file is a new URL

**Date:** 2026-11-18
**Status:** Accepted (built, gated, shipped through the lane)
**Tier:** A (a legibility defect and a cache defect on a live child-facing surface; a reading option; no schema, no auth, no money)
**Type:** decision
**Area:** `app/src/components/kids/kids-zone.css` (`.tz` overrides); `app/src/__tests__/kids-night-skin-legibility.test.js`; `app/src/lib/kids/guides.js` (`assetUrl` versioned by `__BUILD_SHA__`); `scripts/live-kids-zone-walk.mjs` (`assets-are-current`); `app/src/components/kids/KidsAdventure.jsx` (step by step or scroll)
**Sent in by:** Darrell, 2026-11-18, two tablet screenshots of the Teens lesson: *"Review the accessibility issues... fix them... we should never have this issue we have workflows that should be taken care of this... what's what?"* and *"Can we also have a scroll version as an option? Notice the accessibility issue again..."*
**Pairs with:** DR-0076 (verification; a gate per "looked fine but wasn't"), DR-1508 (the Kids Zone), DR-1523 (Jonah J1), DR-0075 (perpetual improvement)

## Context

The Teens Zone wears the house by night through a hand-written `.tz` cascade in the kids stylesheet. The lesson's opening card (`.kz-bubble-big`) and the plain action buttons (`.kz-act.plain`) paint white and inherit their text color, and the night cascade never repainted them: white words on white cards. In the same frames the children were the EARLIER pair: `guides-pair.png` and `guide-girl-face.png` were replaced under the same names in #2716, and a cached copy kept serving.

## What was measured

- The legibility guard scans theme tokens and inline colors per `[data-theme]`; it does not evaluate `.tz`, a component-level skin, so it reported green on an unreadable card. The same blind-spot shape as 2026-10-10 (a root it could not see).
- `.kz-bubble-big` and `.kz-act.plain` had no `.tz` rule; `.kz .kz-act svg` sized icons only under the Kids skin, so the Teens Read to me icon filled its button.
- `guides-pair.png` went 1,598,168 → 1,788,935 bytes under one name; kids asset URLs carried no version; the live walk counted images loaded but never compared the served bytes with the checkout.

## Impact

A child in the Teens door could not read the lesson's opening or its buttons, and saw children the family never approved, while every gate read green. With this record both failures are measured by a gate that is shown to catch, and a replaced file cannot be served stale after the next deploy.

## Decision

1. **Every light card the kids stylesheet paints has a `.tz` override**, and `kids-night-skin-legibility.test.js` reads the stylesheet and refuses any light-background rule without one (decorative fills named, never guessed; proven to catch by stripping an override).
2. **A kids asset URL carries the build** (`?v=<sha>` from `__BUILD_SHA__`): a replaced file is a new URL on the next deploy, whatever cached the old one.
3. **The live walk proves the served bytes**: every kids image on the production home is fetched again and compared byte for byte with the checkout (`assets-are-current`); a stale copy anywhere is a failed stop.
4. **The lesson reads two ways**: step by step (as before) or the whole lesson scrolled, chosen with two chips, remembered on the device, in both the Kids and Teens doors; Read to me reads what is shown.

## Verification

- `kids-night-skin-legibility.test.js`: the audit finds 10+ light rules, none missing an override; stripping `.tz .kz-bubble-big` is named. `kids-lesson-scroll-mode.test.jsx`: the choice renders every segment, is remembered, survives a device with no storage. `kids-guides-assets.test.js`: two builds, two URLs for one file.
- Measured in Chromium on the fix: the Teens opening card and plain buttons above 7:1; the Read to me icon 22 px; no overflow at 390 and 800 px.
- `re-review: 2026-11-25` — the live walk's `assets-are-current` stop green on the deployed build, or a why.
