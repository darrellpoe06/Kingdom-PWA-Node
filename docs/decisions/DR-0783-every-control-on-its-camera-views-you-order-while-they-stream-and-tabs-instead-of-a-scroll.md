# DR-0783 — Every control on its camera, views you order while they stream, and tabs instead of a scroll

- **Status:** accepted
- **Tier:** A (app behaviour only; per-device state; no NAS change)
- **Type:** feature
- **Date:** 2026-10-07
- **Scope:** `app/src/lib/cameras.js` (views: `loadViews` with the wall carried over, `saveViews`, `activeView`, `addToView`, `removeFromView`, `moveInView`, `setViewLayout`, `renameView`, `addView`, `deleteView`, `viewCols`, `viewGridClass`, `indexAtPoint`), `app/src/components/Cameras.jsx` (`useRecording`, `TileRecord`, the views section with drag and arrows, the four tabs Live / Recordings / Who can see / Setup, `CAMS_TAB_KEY`), `app/src/lib/help-content.js`, tests
- **Principles:** UX-PATTERNS (the content comes to the finger; progressive disclosure), DR-0075 (perpetual improvement: the first build's shape is not the last), DR-0774 / DR-0776 (sight), DR-0065 (the app is the artefact)
- **Grounds:** Darrell 2026-10-07: *"Better functions more intuitive... why does a user need to scroll down there when each control for each camera should be with it.... also the Wall sucks!!!! My views should be able to have and reorder the view live while it is still actively streaming... review other wyze and camera brands for functions that make sense... not rigid"*; *"Record should be with the camera you want to do that with"*; *"Views should be able to drag whichever cameras they want to use... or see 4 with each other or 6... liberation of options.... optimized for the users"*; *"We also work with tabs... the recordings should be on the recordings tab or something like that.... not below all cameras... scrolling down to see something that could be in the next tab is a real issue with these first builds... we should know better"*

## Context

The first camera builds stacked everything on one page: the wall, then every camera, then a recorder panel listing all 31 cameras with their Record switches, then access, then setup. Record for a camera was a scroll away from the camera. The wall was one fixed list with no order, no layout, no second wall. What the mature camera apps do (Wyze's groups and the tinyCam grid among them): a per-camera control strip on the tile, named groups you arrange, a grid you size, and sections rather than one long page.

## What was measured

| what | measured | basis |
| --- | --- | --- |
| the page | wall, 31 tiles, a recorder list of 31 rows, access, setup, in one scroll | screenshots 8:32 CDT |
| Record's distance from its camera | below every tile | the same |
| the wall | one list, append-only, one grid shape | `Cameras.jsx` before this record |

## Impact

Unresolved: a control is found by scrolling, not by looking at the camera; the wall cannot be ordered or sized or doubled. Resolved: every camera carries Big, + View, Record with keep, its clip count, Garage and Why?; views are named, ordered by drag or arrows while the streams keep running (the players keep their keys, so no stream restarts on a move), laid out 1 to 4 across or Auto, and there can be several; the tab has four sections and nothing waits below the cameras.

## Decision

1. **Every control on its camera.** `TileRecord` puts Record, keep and the clip count on the tile; the recorder's state is lifted into one `useRecording` read shared by the tiles and the Recordings section. Big replaces Live on the tile; + View replaces Wall +.
2. **Views, plural, ordered, sized.** A view is a name, an ordered camera list and a layout (Auto, 1, 2, 3, 4 across). The old wall becomes "My view" on first load so nothing is lost. Drag the handle (pointer events, so a finger works) or press the arrows; the move writes the order while the players stream. Rename, Clear, Delete, + New view. Auto fits the count: 1 alone, 2 across up to four, 3 up to nine, 4 beyond.
3. **Tabs inside the tab.** Live (views, doors, every camera), Recordings (the budget, the disk line, the clips; the per-camera list shows only cameras switched on or holding clips), Who can see (access links, screen codes), Setup (the service, the live-tile switch, another system, a different Wyze account). The last tab is remembered per device; a grant holder sees Live only.

## Verification

- `cameras.test.js`: the wall becomes My view; add, move (live reorder), remove, layout, rename, new view, delete, saved and read back, junk dropped; Auto fits the count, a chosen layout is itself, the pointer finds the tile it is over.
- `cameras-render.test.jsx`: Record and keep on the tile (the PUT carries the camera), the budget and the clips on the Recordings tab, the tile's clip count opens that tab; + View adds, the view streams both, the arrow reorders while the same `<video>` elements stay (no new ticket), the layout select changes the columns, a second view is its own, Remove and Clear; the live-tile switch on Setup; access on Who can see; a typed screen code lands back on Live. 28 cases.

## Follow-ups

- A view carried to every device by the database (today it is per device, like the wall was). `re-review: 2026-10-21`.
- Pinch to make a tile large, and a full-screen view for a TV, measured against how the Firestick renders it once it has its grant. `re-review: 2026-10-21`.
- Darrell 2026-10-07: *"the scrolling function should be added to all lessons areas as an option... scrolling is only good when we read lessons"*: the lesson reader's step-by-step or scroll-it-all switch (DR-0749) is checked on every lesson surface, the TLC door first (Christina's report). Handled in its own record the same day.
