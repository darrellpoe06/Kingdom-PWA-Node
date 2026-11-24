# DR-1625: The Love Corner's picture menu floats over the page, and its header names the person

**Date:** 2026-11-24
**Status:** Accepted
**Tier:** A (one header's menu placement and name fallback; no schema, no money)
**Type:** bug fix
**Area:** `app/src/components/shell/LoveCornerHeader.jsx`, `app/src/components/shell/LoveCornerMenus.jsx`, `app/src/index.css`, `app/src/poe-financial-mvp-v28.jsx` (one prop on an existing line)
**Sent in by:** Darrell, 2026-11-24, two screenshots of the Love Corner: "Big fonts block the picture drop down somehow... fix it... too... Inside the Love Corner App" and "Saying 6 instead of D for my name?!!!? Why?"
**Pairs with:** DR-1600 (the shared menu frame and its floating mode), DR-1617 (the name fallback, corrected here), DR-1624, DR-0145

## Context

At a large text size the Love Corner's picture menu showed two rows and was cut off under the header. At normal size its last rows ran under the bottom bar. His picture read "(6".

## What was measured

- **The cut-off menu.** The Love Corner drew `AccountMenu` in its in-place mode: `position:absolute` inside the header bar, `overflow:hidden`, no height limit, `z-index:30`. The page under the header covered it, and the bottom bar (z 60) hid its last rows. The PoeTech door has used the frame's `floating` mode since DR-1600; the Love Corner never did.
- **"(6".** DR-1617 gave the PoeTech door `personName`, so his phone sign-in read Darrell there. I did not hand the Love Corner header the same name. With no profile read (the NAS road is down, DR-1624), `headerName` fell back to the formatted number, "(563) 650-2416", and the avatar drew its first two characters.

## Impact

At the text sizes he reads at, a signed-in person could not reach My Profile, Appearance or Log Out from the Love Corner's picture, and the picture showed a bracket and a digit in place of an initial.

## Decision

1. **The Love Corner menu floats** (`floating`, with the theme carried to its layer). Fixed under the picture, pinned 8px from the right edge, as wide as its words need up to the screen, never taller than the screen (it scrolls), above the bottom bar.
2. **The header takes the account's own name** (`personName`, the same value the PoeTech door gets) before the phone number. The shell passes it on the existing line; the frozen shell stays at 5171 lines.

## Verification

- **Measured in Chromium with the app's own CSS**, root font 44px:
  - on 390×844, the menu spans 6 to 382 of 390, bottom 838 of 844, scrolls, and the last row ends at 826;
  - on 900×900, it spans 142 to 892, bottom 894, scrolls, and the last row ends at 882;
  - at 16px on 390×844 it does not need to scroll;
  - no sideways page scroll in any case.
- `the-love-corner-menu-floats-and-names-the-person.test.js`, 5 cases, with the old fallback proven to catch.
- 61 tests across the Love Corner header and menu suites pass; eslint is clean.

**Not verified:** signed in on his device. That is the live review after deploy (DR-0104). `re-review: 2026-11-26`
