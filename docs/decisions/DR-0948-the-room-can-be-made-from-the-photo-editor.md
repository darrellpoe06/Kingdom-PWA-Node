# DR-0948 — The room can be made where the picture is, not only in another tab

**Date:** 2026-10-10 · **Status:** Accepted · **Declared by:** Darrell
**Code:** `app/src/modules/properties/DoorTabs.jsx` (`PhotoEditor`)
**Gate:** `app/src/__tests__/an-unread-door-does-not-say-empty.test.jsx`

## Context

Darrell, 2026-10-10, with twelve move-out photographs just landed and the photo
editor open on one of them: **"Need to be able to choose the rooms after....
make sense?"**

## What was measured

He could already choose an **existing** room there. His screenshot shows why
that was no use: the list offered exactly "Not a specific room" and "Bedroom",
and every photograph behind it was a **bathroom**. The door has one room. The
ADD panel has carried an inline "+ Add a room…" since rooms shipped; the
EDITOR never got it.

## Impact

The same person, doing the same job, on the same screen, five seconds later,
met a dead end — and the way out was to leave a grid of twelve half-labelled
pictures for another tab and come back. That is the kind of seam nobody
designs and everybody walks into.

## Decision

The editor takes the same `onAddRoom` already passed to the tab and offers the
same inline affordance. The new room is **selected the moment it exists**, so
the picture being edited lands in the room just made — creating a room and
then having to pick it again would be the same trip in miniature.

## Verification

Proven to catch by mounting with one bathroom photograph and a door whose only
room is "Bedroom" — his situation exactly — then clicking through: Bathroom is
confirmed absent, made from the picker, and the PATCH asserted to carry the new
room's id. Removing the affordance fails it with his own complaint back in the
runner. **re-review: 2026-10-17.**
