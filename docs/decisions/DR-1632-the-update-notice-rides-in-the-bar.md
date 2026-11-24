# DR-1632: The update notice rides in the bar

**Date:** 2026-11-24
**Status:** Accepted
**Tier:** A (where one notice is drawn; the update and reload behavior is unchanged)
**Type:** decision
**Area:** `app/src/components/ChromeDock.jsx`; `app/src/components/PwaPrompts.jsx` (`UpdatePrompt`); `app/src/lib/chrome-dock.js` (`markDockMounted`, `useDockMounted`)
**Sent in by:** Darrell, 2026-11-24, with the line pinned over the lesson he was following: *"Can't see the reading when a new update is available find another way to give a notice without undermining the lessons live!!!!!!"*
**Pairs with:** DR-1503 (an update waiting on a reading says so), DR-0748 (nothing interrupts words coming in), DR-0076

## Context

DR-1503 made the app say when a newer build is waiting on a reading. It said so in a line fixed across the top of the page, at the reader's text size, over the words being read.

## What was measured

Before: `UpdatePrompt` rendered `.update-ready fixed top-2 left-2 right-2`; on his screen it covered two lines of the lesson. After: with the bar mounted, one bar button (`dock-update-ready`, 44 px floor, its name the whole sentence) and no pinned line; the tap stops the reading and reloads once. Proven to catch: with no bar on the page the line still shows. `update-notice-never-covers-the-reading.test.jsx` 2 green; `update-while-reading.test.jsx` 9 green unchanged.

## Impact

Nothing sits on the lesson while it is read. The notice is still given, and the tap still loads the new version.

## Decision

1. Where the bottom bar is mounted, the notice is a bar button labelled Update, drawn only while an update waits.
2. The pinned line remains only as the fallback for a page with no bar, so the notice is never silent.
3. The bar says it is mounted through a counted flag, since its reader slot is not always drawn.
