# DR-1112: Each app shares itself — the header's "Share our app" follows the app you are in, never the tab you are on

**Date:** 2026-10-19
**Status:** accepted
**Tier:** A (one header control, one shell flag, one constant moved to pure config)
**Type:** fix
**Area:**
- `app/src/components/AppDoorControls.jsx` (a share card for each of the five apps, chosen by `currentDoor`)
- `app/src/poe-financial-mvp-v28.jsx` (`church={churchBrand}`; the `|| view === 'church'` is gone)
- `app/src/modules/properties/config.js` and `app/src/components/PropertiesDoor.jsx` (`PROPERTIES_SHARE_URL` moved to pure config and re-exported)
- `app/src/__tests__/app-door-controls.test.jsx`

**Amends:** DR-1056 (the app-door controls in the header). Grounds: DR-0290 (the brand follows the door, not the tab), `app-doors.js` `currentDoor` ("a door is a page-load property, not a tab you are on").
**Declared by:** Darrell, 2026-10-19. He sent two screenshots: the PoeTech app at `poetech.us/poetech-app/?view=church`, then its "Share our app" card reading *THE LOVE CORNER APP* with `poetech.us/lovecorner`. His words: "These need to share their respective apps... make sense?!!!!"

---

## Context

DR-1056 put the share control in the header and passed it `church={churchBrand || view === 'church'}`. `churchBrand` already follows the door, by DR-0290's rule. `view === 'church'` follows the **tab**, so the PoeTech app's Church tab turned PoeTech's header into the church's door. A person inside the PoeTech app who taps "Share our app" was handed the Love Corner.

The card also printed its access promise twice. AppShareQR carries *"Showing this code doesn't grant access…"*, and AppDoorControls added a second copy beneath it. Darrell's screenshot shows both.

## Decision

- **The header shares the app the page booted as.** `doorKeyFor({ church, pathname, search })` returns the Love Corner when the page wears the church brand. Otherwise it returns `currentDoor(pathname, search).key`.
  - `doorFor(key)` gives that app its own card, using the URL and words its own door already uses:
    - PoeTech: the platform join URL;
    - The Love Corner: `SHARE_DOOR_URL`;
    - TLC Therapy Solutions: `TLC_SHARE_URL`;
    - Moore Divahs: `MOORE_SHARE_URL`;
    - Poe Properties: `PROPERTIES_SHARE_URL`.
  - An unknown key gets PoeTech's own card, never another app's.
- **`PROPERTIES_SHARE_URL` moves to `modules/properties/config.js`,** pure and free of imports, so the header can name it without importing the whole PropertiesDoor. PropertiesDoor re-exports it, so its callers are unchanged.
- **The duplicate access sentence is removed** from the header. AppShareQR's own copy remains, once.
- **The church's code still lives on ChurchHome's card,** where a steward shows it from inside the church. Nothing that was reachable is lost.

## Verification

- `app-door-controls.test.jsx`, 14 cases:
  - the exact bug: `/poetech-app/` with `?view=church` gives `poetech`;
  - each of the four other apps by its boot path;
  - the church brand gives the Love Corner;
  - every `DOORS` key has its own share card;
  - an unknown key gives PoeTech;
  - the access sentence appears exactly once;
  - the shell passes `churchBrand` alone.
- **Proven to catch:** with the shell's old `churchBrand || view === 'church'` restored, the shell case fails (1 of 14); restored, all pass.
- 474 tests across the 29 suites that touch the share card, the doors and the Properties door pass. Lint is clean, and the CI guard scripts pass. The shell's line count is unchanged, within the monolith budget.
- Live: after deploy, `poetech.us/poetech-app/?view=church` → "Share our app" shows the PoeTech card. `re-review: 2026-10-20`: read it on the live build.
