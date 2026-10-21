# DR-1152: The Big Picture is the family's years in pictures — the NAS library, read as chapters and stories

**Date:** 2026-10-21
**Status:** accepted
**Tier:** B (a new in-app surface over an existing read-only road; one additive NAS route; no schema change; no money)
**Type:** product (the Life Hub) + way (the photo server lists its years)

**Area:** `app/src/lib/family-stories.js` (new, pure), `app/src/components/FamilyStories.jsx` (new), `app/src/components/LifeHub.jsx` (a `panel` the Hub renders itself), `app/src/lib/life-hub.js` (the Big Picture tile and the Add a photo action point at the panel), `app/src/lib/nas-photos.js` (`fetchLibraryYears`), `infra/nas-property-photos/photo_server.py` (`library_years()`, `GET /library/years`, two selftest checks), `app/src/__tests__/the-big-picture-is-the-familys-years.test.jsx` (new, 15 cases), `app/src/__tests__/life-hub.test.jsx` (a tile may name a Hub panel).

**Principles:** DR-1046 (the Life Hub is the home); DR-1002 (the whole library by month, read from the folders); DR-0330 (a tile that opens nothing is a lie); DR-0061 (real data, traced); DR-0076 (no painted number; honest states); DR-0083 (the same-origin transport, never the Funnel URL).
**Declared by:** Darrell, 2026-10-21, from the Life Hub: *"Clicking Big Picture should show the family photos... over time or stories like Google stories of pictures of family times over the years... make sense?"* and *"Right now it goes nowhere...."*

---

## Context

The Hub's first tile, Big Picture, pointed at the `overview` view. Since DR-1046 made the Hub the home, `overview` IS the Hub, so the tap re-rendered the screen the person was already on. That is the DR-0330 defect on the family's front screen.

What he asked for already has its data: the NAS photo server lists the family's library by month from the phones' backups and the dated roots, with each picture's date read from the camera's own file name (DR-1002). Nothing had to be invented; the years had to be read as chapters.

## What was measured

- The tile's target before: `view: 'overview'` (`life-hub.js`); the Hub renders at `overview` (`BigPictureDashboard.jsx` `Home`). Measured on the built app at 390 px: the tap changed nothing.
- The photo server had no way to say which years hold pictures; the app would have had to probe month by month. `library_years()` now counts picture files per `yyyy/mm` folder across the dated roots and the phone backup, one count per file name, newest year first. Selftest: 116/116, including `/library/years` 401 without the bearer and the fixture's `{"year":"2024","count":1,"months":[{"month":"2024-01","count":1}]}`.
- The Hub's existing checks against the host's routes still hold: a tile may now name a `hub` panel instead of a view, and the test proves the Hub renders that panel by name.

## Decision

1. **Big Picture opens "Our years in pictures", a panel inside the Hub** (`hub: 'stories'`, `view: null`). The sub-label says so. The Add a photo action opens the same panel, because that is where a new picture takes its place in the year.
2. **The pictures are the family's own library, nothing else.** Chapters are years; each chapter's count is the server's count of real files; a year with no pictures is not a chapter. "This week across the years" is the frames within seven days of today's date from every year, oldest year first, six per year at most, and the strip is not drawn when there are none.
3. **The story player is the memories feed:** one frame at a time with its date in words and how long ago, progress bars, moving on by itself every 5 s, held while a thumb is down or the tab is hidden, tap right for next and left for back, the keyboard the same, and it ends rather than looping. The listing's own thumbnail shows first and the listing-size picture replaces it when it arrives.
4. **Three honest states in words:** no key on this device (the signed-in family device connects itself from the Life Gallery on the Current View; no password), the NAS unreachable (Retry), an empty library (Add photos; the picker takes many, each shrunk on the device and sent in turn, and the note counts what landed). An older server with no years route is probed back 36 months and shown honestly as the last three years.
5. **The server learns to list its years** (`GET /library/years`, bearer-locked, read-only). The app's `fetchLibraryYears()` returns the years, `{years:null, legacy:true}` on a 404, or null when the NAS cannot be reached.

## Impact

The front screen's first tile does what its label says. The NAS is asked once for the years, once per month near today's date, and one picture per year for the covers; a chapter's other months load when the chapter is opened, 24 at a time, with "Show more" saying how many are left. Nothing is written except by Add a photo, which goes by the existing upload road.

`re-review: 2026-11-21` — Immich memories (DR-1002's later source) as a second feed once that server is kept; and whether the family wants the strip on the Current View too.

## Verification

- `the-big-picture-is-the-familys-years.test.jsx` (15): the tile and the action name the panel and never call the host's setView; Back returns to the Hub; the model's chapters, this-week selection (year wrap included), captions and probe list; the three states in words and Retry; chapters from a fake listing with the server's counts; the player advancing on a fake clock, pausing, asking for the listing-size picture by name, and closing; a chapter opening to its months. `life-hub.test.jsx` (35) green with the panel rule.
- `photo_server.py --selftest`: 116/116.
- Lint, the shell's line budget, legibility, the ledger guards: green on the branch.
