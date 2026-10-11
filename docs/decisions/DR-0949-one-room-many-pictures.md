# DR-0949 — One room, many pictures

**Date:** 2026-10-10 · **Status:** Accepted · **Declared by:** Darrell
**Code:** `app/src/modules/properties/DoorTabs.jsx` (`GalleryTab`, the bulk bar)
**Gate:** `app/src/__tests__/a-room-for-many-pictures-at-once.test.jsx`

## Context

Once the room picker reached the photo editor (DR-0948), the remaining cost was
arithmetic: twelve move-out photographs is twelve times Edit → pick → Save.

## What was measured

Thirty-six taps on a phone to say one thing — and nearly always the same thing,
because a move-out set is naturally grouped: six bathroom shots in a row, then
the kitchen. The room is exactly the field worth setting once for several.

## Impact

A per-picture-only flow makes labelling a real set expensive enough that it
does not get done, and an unlabelled set is worth much less in a deposit
dispute than a labelled one.

## Decision

"Choose several" puts a checkbox on each tile; "All N shown" takes the whole
filtered set; one picker files them. **Off by default** — a grid permanently in
selection mode makes tapping a picture to *look* at it ambiguous, and looking
is what the grid is mostly for. Writes are serial and the count reported is the
count that **saved**, not the count attempted. Clearing the room sends `null`,
never `''`.

## Verification

Five cases, all by mounting and clicking. Proven to catch: mutating the tally
to count attempts rather than outcomes fails the honest-count case by name.
1224 green; eslint clean. **re-review: 2026-10-17.**
