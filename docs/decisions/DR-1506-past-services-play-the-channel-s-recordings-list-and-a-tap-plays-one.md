# DR-1506: Past services play — the channel's recordings list, and a tap plays one

**Date:** 2026-11-13
**Status:** Accepted
**Tier:** A (one panel of an existing section reads data it already fetched; no schema, no money, no new route)
**Type:** decision
**Area:** `app/src/components/ChurchHome.jsx` (the Worship row's Past sermons panel; the feed cap; `chosenVideoId`; `serviceDate`), `app/src/__tests__/past-services-play.test.jsx` (new)
**Sent in by:** Darrell, 2026-11-13, from the live Love Corner door with a screenshot of the Past sermons tab: *"Past services don't have any.... fix it..."*
**Pairs with:** DR-0061 (a surface is a live view of real state; a painted number is worse than none), DR-0075 (no dead ends), DR-1499 (a door lands on what it names), DR-1483 (the door's shell)

## Context

The Worship section's third row is Live now · Past sermons · Stay connected. The Past sermons panel carried a paragraph about the Sermon-to-Content pipeline and a Follow-along button. It listed no service. The reader who tapped "Past sermons" to find a past service found prose.

## What was measured

- `ChurchHome.jsx` already fetches the channel's public RSS through the same-origin `/api/church-recent` proxy and parses it with `parseYoutubeFeed(xml, 6)`: the newest six, of which the Live now player shows the first and a strip shows the next five. The feed carries fifteen.
- The public sermon library (`theword_public_sermons()`, the Word — Migdal, route `pulpit`) is a church tab in the same gated list; the Past sermons panel never pointed at it.
- The panel read no record, no feed and no table (DR-0061 §1: a surface whose value cannot be traced to real state does not ship).

## Impact

- The panel now lists every recording the feed carries (the cap is 15, the feed's own ceiling), newest first, each with its date, title and thumbnail; a tap sets `chosenVideoId`, so the Live now player switches to it, and opens the shell's mini-player on it, so the reader stays where they stand (the DR-1499 lesson). Each row also opens on YouTube in a new tab.
- An empty feed says so plainly and names the channel; no channel says that; nothing is painted.
- A door to the full library opens The Word — Migdal (`setChurchView('pulpit')`).
- The pipeline note stays, shortened, under the list; Follow along in the Word stays.

## Decision

The Past sermons panel is a live view of the channel's recordings and a control over the player. Any later source (the sermon library's rows, captions) adds to this list; it never replaces it with prose.

## Verification

- `past-services-play.test.jsx`: five cases. The list (3 of 3, newest first, dates, YouTube links), the tap (mini-player opened on `/embed/BBBBBBBBBBB`, the Live now iframe switched to it), the empty feed (the plain line and the channel link; no list), the library door (`pulpit`), and `serviceDate`. Proven to catch: with the component change stashed, 5 of 5 fail.
- Neighbours: `church-home-render` (14) and `a-door-lands-on-what-it-names` (7) green beside it; eslint clean; `file-budget-guard` OK (the file is 1,124 lines).
- After merge: the deploy's BOOT OK, `site-health.yml` UP, and a look at the live Past sermons tab on the door (DR-0104).
