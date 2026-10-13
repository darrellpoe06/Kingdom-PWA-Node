# DR-0947 — One refresh for a whole set, and a screen that does not contradict itself

**Date:** 2026-10-10 · **Status:** Accepted · **Declared by:** Darrell
**Code:** `app/src/modules/properties/DoorTabs.jsx` (`GalleryTab.submit`, the empty branch), `PropertiesApp.jsx` (`onAdd` / `onDone`)
**Gate:** `app/src/__tests__/an-unread-door-does-not-say-empty.test.jsx`

## Context

Darrell, 2026-10-10: **"The flow of uploading pictures is not working well...
it keeps flashing... and pausing the coming back with new images about 20
seconds later."** And, from the same screenshots, two sentences printed at
once under a header reading "10 pictures": *"No move out condition pictures at
this door yet."* and *"No pictures on this property yet."*

## What was measured

`onAdd` is awaited **inside** the per-picture loop (DR-0907 made the save
serial, correctly), and the handler it calls ended with `loadDoorData();
boot();` — `boot()` being the whole app bootstrap: doors, grants, household,
rentals. A twelve-picture set therefore ran **twelve full bootstraps** and
twelve door reloads, interleaved with the writes, seconds each on the
throttled cross-origin road.

His run also reported `Skipped 2 ... The requested file could not be read,
typically due to permission problems that have occurred after a reference to a
file was acquired` — the browser's `NotReadableError`, what an Android file
handle gives once the page has churned long enough underneath it.

The empty branch tested `shown`, the **filtered** list, instead of `allShots`.

## Impact

A screen that flashes and stalls for twenty seconds reads as broken, and under
the old code a person who gave up mid-way lost whatever had not been written.
The remount churn plausibly cost two photographs outright. And the second
sentence was false: the door held ten pictures while the app announced it held
none, at the exact moment he was hunting for a missing set.

## Decision

Hoist the refresh: `onAdd` saves and returns; a new `onDone` fires **once**
when the set is through. The saves stay serial. The generic empty state tests
`allShots`, so it appears only when the door really holds nothing; the
filtered case is already said above, once, accurately.

## Verification

Proven to catch, both: moving the refresh back inside the loop fails the
twelve-picture case; restoring the branch to `shown` fails the contradiction
case. The twelve-picture case drives the real file input with twelve real
`File` objects. 1174 green; eslint clean. **re-review: 2026-10-17.**
