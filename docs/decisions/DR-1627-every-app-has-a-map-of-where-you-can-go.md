# DR-1627: Every app has a map of where you can go

**Date:** 2026-11-24
**Status:** Accepted
**Tier:** A (one menu button and one sheet in each door; reads the tab lists that already exist; no schema, no auth, no money)
**Type:** decision
**Area:** `app/src/components/shell/AppMapSheet.jsx`, `AppMapButton.jsx`, `DoorMapButton.jsx` (new), `app/src/lib/app-map.js` (new), `app/src/components/TopNavRow.jsx`, `MooreDoor.jsx`, `TlcPublicDoor.jsx`, `app/src/modules/properties/PropertiesApp.jsx`, `app/src/poe-financial-mvp-v28.jsx` (one prop on an existing line)
**Sent in by:** Darrell, 2026-11-24, with two screenshots of the Love Corner's menu: "I want this type of menu to be inside each app as a quick way to identify where the users can go... like the Love Corner App has currently... make sense?"
**Pairs with:** DR-1483 (the Love Corner's header and its All Features sheet, the model), DR-1424 (quick links), DR-1046 (the renovation keeps every room), DR-0640, DR-0258 (each door its own scope), DR-0076

## Context

The Love Corner has a menu button that opens every place in the app as grouped tiles with a search box. The other four apps had only their tab rows. On a phone the PoeTech tab row scrolls sideways through about 25 tabs, so a person cannot see at a glance where they can go.

## DRs reviewed

- **DR-1483** built the sheet for the church's own tab list and recorded a finding: the Modal is drawn outside the themed wrapper, so each sheet must carry its theme itself. Every sheet here is handed its theme.
- **`TopNavRow.jsx:96`** records that a grouped nav replaced the tab row in #381 and was reverted on 2026-06-26, because grouping the tabs read as "lost the tabs". This menu sits beside the tabs and replaces nothing.
- **DR-1424**: a quick link shows only when its section is in the reader's list. The map keeps that rule by reading `navGroups()` output and nothing else.

## What was measured

Built app, Chromium, before the change: PoeTech, Poe Properties, Moore Divahs and TLC had no menu of all places. After:

| door | viewport | places listed | current place marked | tap goes there, sheet closes | sideways scroll | page errors |
| --- | --- | --- | --- | --- | --- | --- |
| PoeTech (sample household) | 390x844, 900x950, and 44 px root text | 25 in Family, Soul, Create, Life, Business, System | Big Picture | yes; search "mon" finds Money and opens `?view=books` | 0 | 0 |
| Moore Divahs | 390x844 and 40 px root text | 4 (her door, The Practice, The Church, PoeTech) | Moore Divahs | yes | 0 | 0 |
| TLC, signed out | 390x844 and 40 px root text | 3 (Find your therapist, Mental skills, Join the team) | Find your therapist | yes | 0 | 0 |

Not measured in a browser: Poe Properties signed in (the sandbox holds no sign-in for it) and TLC signed in as staff. Both are covered by the component tests below and by the same button the measured doors use.

## Impact

In every app a person can open one sheet, see every place that app gives them, search it by word, and tap to go. Nothing is added to what anyone may reach.

## Decision

1. **One sheet, `AppMapSheet`, for every app.** It draws only the groups it is handed: a search box, the places as tiles with the current one marked, and a "This app" row. It uses the Love Corner sheet's own styles, so the five apps read as one family.
2. **The list is the app's own gated list, never a catalogue.** PoeTech hands it `navGroups(navTabs)`, the same pairs the tab row and sidebar draw (`poetechMapGroups`). A door hands it the tabs it already shows this reader (`doorMapGroup`); a locked tab is left off. So the menu cannot show a place the reader does not hold.
3. **Where the button sits.** PoeTech: first in the tab row, before Back and Forward. Poe Properties: first in the module's tab row, on the door only (inside PoeTech the shell's menu already lists Properties). Moore Divahs: top left of her header; the sibling list at the bottom stays. TLC: first in the header bar, signed in or out, from the same sections the dock reads.
4. **The tabs stay.** This is a map beside them (the 2026-06-26 revert).
5. **The Love Corner keeps its own sheet.** It also searches the course catalog, which the generic sheet does not. Folding the two into one frame is open below.
6. **Shell budgets.** The frozen shell stays at 5,171 lines. `PropertiesApp.jsx` pays one import and one line (2,693 to 2,695, recorded in `file-budgets.json`), because the tab state lives there.

## Verification

`every-app-has-a-map-of-where-you-can-go.test.jsx`, 20 cases:

- **Gating:** a reader with four tabs sees those four and their quick link, never Admin, Dev/Ops or the Vault. **Proven to catch:** a map built from a list that includes Admin shows Admin. A locked door tab is left off. **Proven to catch:** the same tab unlocked appears.
- **Search:** by the tile's words, the id and the group; an empty or unmatched search returns nothing and says so.
- **The button:** closed until pressed; the current place carries `aria-current`; a tap calls the door's own handler once, closes the sheet and scrolls to the top; Back to top works; no places draws no button.
- **Wiring:** each of the four doors mounts the button from its own list; the Love Corner's sheet is still present. Guards: lint, format, monolith budget (5,171), file budget.

## Open, dated

- **Poe Properties signed in and TLC staff, on the live build** (Reviewer mode, DR-0104). `re-review: 2026-11-26`
- **One frame for all five**: move the Love Corner's sheet onto `AppMapSheet` with its course search as an extra result source. `re-review: 2026-12-08`
- **Icons per Poe Properties tab**: every tile wears the house mark today. `re-review: 2026-12-08`
