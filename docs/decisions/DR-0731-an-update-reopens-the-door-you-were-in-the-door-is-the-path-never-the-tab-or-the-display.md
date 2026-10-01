# DR-0731 — An update reopens the door you were in: the door is the path, never the tab or the display

- **Status:** accepted
- **Tier:** A (one boot predicate; no data, no money; the church door keeps its path and its param)
- **Type:** fix
- **Date:** 2026-10-01
- **Scope:** `app/src/lib/church-own-door.js` (`isChurchDoorContext`: path first, then the door param; the standalone-display legacy clause removed; `CHURCH_DOOR_PATH`); `app/src/__tests__/lovecorner-door.test.js`, `church-tab-not-lovecorner.test.jsx`, `public-church-brand.test.js` (the installed-PoeTech-app pin).
- **Principles:** VERIFICATION-DOCTRINE (DR-0076), THE-APP-IS-THE-PRIMARY-ARTIFACT (DR-0065), DR-0258 (install-scope split), DR-0584 (one worker per door), DR-0174 / DR-0290 (the brand follows the door, not the tab).
- **Grounds:** Darrell, 2026-10-01: *"When I'm in the PoeTech App and a new build comes it reopen me into the Love Corner App... instead of the PoeTech App... when I'm only reading the Word that works... however I'm also working in other tabs... How can they be built together and also work almost independently so it knows which one..."* and a screenshot of the Church > The Word list wearing "The Love Corner" header inside his PoeTech session.

## Context

PoeTech and The Love Corner are one build with disjoint doors: `/poetech-app/` and `/lovecorner/app/`, each with its own manifest and its own service worker scope (DR-0258, DR-0584). A door is a page-load property. The shell captures `churchDoorOnly = isChurchDoorContext()` once at first render and, when true, presents the focused church-only app. An update's reload (`sw-update.js`, `location.reload()`) keeps the URL.

## What was measured

- `isChurchDoorContext` on origin/main: `?lovecorner=1` → true; otherwise `?view=church` **and standalone display** → true. The second rule was the 2026-07-30 "legacy install" clause, written for Love Corner installs whose start URL was a bare `?view=church`, "until their manifest refresh picks up the new start_url".
- The installed PoeTech app also runs standalone. On its Church tab, nav-history writes `?view=church` (`church-tab-not-lovecorner.test.jsx` proves it). So an update reload there satisfied the legacy clause and booted the Love Corner-only app — exactly the report. The reader is spared because its URL is not `?view=church`.
- Pinned before the change: `isChurchDoorContext('?view=church', { standalone: true })` returned true at `/poetech-app/`.
- Since 2026-09-23 the church app installs at `/lovecorner/app/`, so a path decides the door with no inference from the tab or the display.

## Impact

Before: any member working in the Church tab of the installed PoeTech app came back inside the Love Corner app after a new build, with PoeTech's other tabs gone until they reopened the app. After: an update reload returns the page as the app it booted as, on every tab. The Love Corner app is unchanged at its own path and through its entry page and QR.

## Decision

- `isChurchDoorContext(search, { pathname })`: true when the path starts with `/lovecorner/`, or when the door's own param `?lovecorner=1` is present; otherwise false. `opts.standalone` is accepted and ignored.
- The legacy standalone clause is removed, not kept behind a date: it has no remaining honest case now that the church app has its own path, and it misfired on the primary user. A pre-2026-09-23 Love Corner install still launching at `/poetech-app/?view=church` now boots as PoeTech; its way back is poetech.us/lovecorner (the church's own path). **re-review: 2026-10-15** — ask whether any church member reports that.

## Verification

- `lovecorner-door.test.js`: church path → true with or without a param; `?lovecorner=1` → true on any path; `/poetech-app/?view=church` → false in a browser tab AND standalone (the 2026-10-01 pin, which the old rule fails); other views and doors → false.
- `church-tab-not-lovecorner.test.jsx`: the real nav-history harness — Church tab inside the installed PoeTech app, URL `?view=church&sub=learn`, standalone → not the door; the door param still survives navigation.
- `public-church-brand.test.js`: the installed Love Corner app at its path still wears the church; the installed PoeTech app on its Church tab does not.
- Not measured here: the next real update on Darrell's Fold while on the Church tab. Darrell's screen is the final witness.
