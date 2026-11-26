# DR-1704: Learn and the Institute, one click inside PoeTech

**Date:** 2026-11-26
**Status:** Accepted
**Tier:** A, navigation only; no data, no schema, no money
**Type:** ux
**Area:** `app/src/lib/nav-items.jsx`, `app/src/components/ChromeDock.jsx`, `app/src/components/TopNavRow.jsx`, `app/src/index.css`
**Pairs with:** DR-1046 (one list, three places), DR-1424 (quick links), DR-1484 (the church bar), DR-0640 (church-only door)

## Context

Darrell, 2026-11-26: "Inside PoeTech make sure we can get to the learn and
theology space with one click... make sense?"

## What was measured

On a built dist (Playwright, the stub build CI uses):
- Phone, 360px: Learn was two taps (More, then the Soul quick link); the TLC
  Theological Institute was three (More, Church, then its tab).
- Tablet, 800px: neither was on the strip; the strip holds ~35 tabs.
- Laptop, 1400px: Learn was a sidebar quick link; the Institute was not.

## Decision

1. The Institute is a quick link beside Learn (Soul group), gated exactly
   as Church is; the sidebar and More draw it with no other change.
2. The phone bar carries Learn and Institute as tabs, each opening Church on
   its own tab (`churchView`). The bar takes the church bar's compact buttons
   (`.poe-dock-compact`, same rules as `.poe-dock-church`) so it stays one row.
3. Tablet: the two doors are pinned beside the tab strip, not inside it. Placed
   at the end of the scrolling strip they sat off-screen (measured at 800px);
   a door you scroll to find is not one click. The strip's order is unchanged.
4. A door without Church shows neither door anywhere.

## Verification

- `one-tap-learn-institute.test.jsx`: each place, press it, it opens Church on
  that tab; the proven-to-catch case removes Church and both doors vanish.
- Browser walk on the built app: 360px bar one row, no overflow, Learn opens
  "Lessons" and Institute opens "TLC Theological Institute", each lit as the
  current tab; 800px and 1400px both doors in view, one click each lands.
- The Love Corner menu: all 14 tiles a visitor sees open their own screen, no
  crash, no console error. My Record, Access and Members need a signed-in
  member and were walked in code (each has its own render branch), not live.
- `re-review: 2026-12-10` (Darrell's phone, after deploy).
