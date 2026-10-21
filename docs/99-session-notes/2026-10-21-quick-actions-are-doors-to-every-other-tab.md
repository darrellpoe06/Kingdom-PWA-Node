# 2026-10-21 — The Quick Actions are doors to every other tab, none of them twice

**Decision record:** DR-1196
**Source:** Darrell, with the Hub on his phone: "Add notes and create to the quick links", then "Have more options, none that overlap, so we have more options and advertise the other tabs."

## What changed

| piece | file | what it is |
|---|---|---|
| the doors | `app/src/lib/life-hub.js` | 24 actions: three records on this page (focus, goal, photo) and 21 doors, each to one tab, each naming its surface in `surfaces.js`; `destinationOf` and `overlappingActions` are the overlap gate; `actionsFor(density, { viewer, surfaces })` keeps only the doors this viewer may open, by the nav's own `surfaceAccess` |
| the counts | `app/src/lib/home-view-prefs.js` | 8 / 12 / 16 by density (airy / compact / photo), whole rows of four; her mockups' 4 / 6 / 8 doubled |
| the tiles | `app/src/components/LifeHub.jsx` | one fill and one glyph per action; the `viewer` and `surfaces` props, both from the shell (the registry is shell-only; the Hub never imports it) |
| the viewer | `BigPictureDashboard.jsx`, `poe-financial-mvp-v28.jsx` | the host's `surfaceViewer` and `surfaceById` ride one existing mount line through `Home` into the Hub |
| one fill | `app/src/lib/theme-css.js` | `#3A2A4A` (Notes, TV Time, Your Data) gets its midnight twin; every other fill is a token that already had one |

## What was measured

- Overlaps between actions and tiles: 4 before, 0 after, pinned.
- A visitor at photo density sees 14 doors (every one open to anyone); a signed-in family member sees 16, the Vault and the cameras among them; a reviewer loses the camera door (DR-0104).
- Gates: `life-hub`, `the-big-picture-is-the-familys-years`, `heritage-home`, `consistency-guard`, `feature-presence`, `contrast-guard`: 6 files, 129 cases green. Lint 0.

## What this does not do yet

- The family-only doors (Scribe, CRM, Inventory, Forecast, Academy) sit past the sixteenth, so no density draws them today. The order is everyday-first on purpose; a family-specific order is a next ask, not a gap in the rule.
- Nobody has seen it rendered: this sandbox has no route to poetech.us. The live pass is the stewards' after deploy (DR-0104).
