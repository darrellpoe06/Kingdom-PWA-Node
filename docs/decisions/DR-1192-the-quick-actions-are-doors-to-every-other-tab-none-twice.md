# DR-1192: The Quick Actions are doors to every other tab, none of them twice

**Date:** 2026-10-21
**Status:** accepted
**Tier:** A (the Life Hub's Quick Actions block; routes the host already renders; the access rule the nav already applies; no new door, no data)
**Type:** surface
**Area:**
- `app/src/lib/life-hub.js` (`HUB_ACTIONS` as doors with a `surface` each, `destinationOf`, `overlappingActions`, `actionsFor(density, { viewer, surfaces })`, `HOST_VIEWS`)
- `app/src/lib/home-view-prefs.js` (`DENSITY_ACTIONS` 8 / 16 / 12)
- `app/src/components/LifeHub.jsx` (one fill and one glyph per action; the `viewer` and `surfaces` props, both handed in by the shell: the registry is shell-only, so the Hub never imports it)
- `app/src/components/BigPictureDashboard.jsx` (`Home` passes the viewer through)
- `app/src/poe-financial-mvp-v28.jsx` (one existing mount line gains `viewer={surfaceViewer} surfaces={surfaceById}`)
- `app/src/lib/theme-css.js` (the midnight twin of the one new fill)
- `app/src/__tests__/life-hub.test.jsx` (the overlap gate, proven to catch; the viewer cases; the counts)

**Amends:** DR-0464 on the Quick Actions: her mockups' eight actions and their 4 / 8 / 6 counts. Grounds: DR-0330 (a door that reaches nothing is a lie), DR-0061 (the surface a reader meets), DR-0104 (reviewer mode is not a key), DR-0076 §3 (a gate ships proven to catch), UX-PATTERNS 2g (a glyph carries its name; the 36px floor).
**Declared by:** Darrell, 2026-10-21, with the Hub on his phone. First: "Add notes and create to the quick links." Then, as it was being built: "Have more options, none that overlap, so we have more options and advertise the other tabs."

## Context

**SHOULD.** The Quick Actions on the Life Hub are the family's shortest way to what the app can do. Darrell's rule makes them doors: more of them, none opening a place another door or a tile beside them already opens, so the block advertises the tabs a reader would otherwise never scroll to.

**ARE, on the screenshot and in `life-hub.js` as it stood.** Eight actions in her mockup's order, sliced to 4 / 8 / 6 by density. Four of the eight opened what a tile in the row above already opened: Send a message (the Messages tile), Start a project (Projects), Check a property (Real Estate), Open Money (Money). Notes and Create, the two he asked for, were not there. Nothing filtered the actions by who was looking, because every one of them was open to anyone.

**GAPS.** Four of eight actions duplicated a tile. Notes and Create absent. No way to add a gated tab (Vault, Library, the cameras, the family's CRM) without drawing a dead door for the people it is shut to. **CLOSE.** Below.

## What was measured

| what | before | after |
|---|---|---|
| actions in the list | 8 | 24 (3 records on this page + 21 doors) |
| actions that opened what a tile already opened | 4 | 0, pinned by `overlappingActions` |
| shown by density (airy / compact / photo) | 4 / 6 / 8 | 8 / 12 / 16 — whole rows of four |
| what a visitor sees at photo density | 8 | 14: every door open to anyone; the signed-in and family doors are not drawn |
| what a signed-in family member sees at photo density | 8 | 16, the cameras among them |
| the rule that decides a door | none | the nav's own `surfaceAccess`, by the door's named surface |
| fills with a midnight twin | 8 of 8 | 8 of 8 (one new token, `#3A2A4A`, given its twin; the rest reused) |

## Decision

1. **Every Quick Action is a door to one tab, and no two doors open the same place; no door opens what a tile opens.** The three record actions (Add today's focus, Set a goal, Add a photo) stay: they act on the Hub's own records, not on a tab, and DR-1153 placed the photo one. `overlappingActions(HUB_ACTIONS, HUB_TILES)` is empty, and the test proves it catches both a door to the Money tile and a second door to Notes.
2. **Every door names its surface in `surfaces.js`, and the Hub draws only the doors this viewer may open,** by the same `surfaceAccess` the nav uses. A shut door is never drawn (DR-0330). Reviewer mode is not a key (DR-0104): the family's camera door leaves with it. The test pins that a door's `view` and `sub` equal its surface's, so the access rule is always the rule for the tab it opens.
3. **The order is everyday first,** and the density is the cut, never the key: 8 / 12 / 16, whole rows of four. The family-only doors (Scribe, CRM, Inventory, Forecast, Academy) sit past the sixteenth today; they are open to the family and will show the moment the family's own order or a wider density wants them.
4. **Notes opens the Thinking Space; Create opens the Creation Workspace,** as asked, fourth and fifth in the order after the lesson.

## Impact

A reader on the Hub sees eight, twelve or sixteen different places to go, none of them a repeat of the tile row above, each one a real route open to them. Darrell gets Notes and Create where he asked for them. The people a tab is shut to never see a door that would not open.

## Verification

- `life-hub.test.jsx`: counts 8 / 16 / 12 pinned; a visitor renders 8 / 14 / 12; a family member renders 16 with the Vault and the cameras among them; the overlap gate is empty and proven to catch; every door matches its surface; the viewer filter is pinned for a visitor, a signed-in reader, the family, and a reviewer; Notes and Create open their views through `setView`. With `the-big-picture-is-the-familys-years`, `heritage-home` (every fill has a midnight twin), `consistency-guard`, `feature-presence` and `contrast-guard`: 6 files, 129 cases green. Lint 0.
- Not seen rendered: this sandbox has no route to poetech.us; the live pass on his phone is his, after deploy (DR-0104).
