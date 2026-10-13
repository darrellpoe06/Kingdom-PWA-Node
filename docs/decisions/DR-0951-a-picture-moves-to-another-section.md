# DR-0951 — A picture moves to another section, without being re-uploaded

**Date:** 2026-10-11 · **Status:** Accepted · **Declared by:** Darrell
**Code:** `app/src/modules/properties/DoorTabs.jsx` (`GalleryTab`, the bulk bar)
**Gate:** `app/src/__tests__/a-record-can-become-an-advertisement.test.jsx`

## Context

Darrell, 2026-10-11, on Bed A holding MOVE IN CONDITION (39) and LISTING (0),
with Bed B showing NO PHOTO:

> "Need to be able to move pictures to the advertisement sections for
> advertisement when necessary... make sense?"
> "I don't want to have to re-upload when we already have them...."
> "Just move to another section based on the needs of the situations..."

## What was measured

Thirty-nine record photographs and no listing photographs, so the door could
not advertise. The only way to change a kind was one picture at a time in the
editor.

## Impact

Re-uploading is not a minor cost on his road: pushing thirty-nine photographs
through the throttled Funnel again is the thing that has already cost him two
evenings. And a door that cannot advertise does not rent.

## Decision

The bulk bar (DR-0949) takes a second field. **Move, not copy**: the same rows
change `kind`; no row is created and `storage_path` is never touched (0154
freezes it regardless).

Moving a record **into** listing makes a picture of the inside of a place
publicly visible — the hazard DR-0906 was written about — so the kind picker
carries the same two named optgroups as the add panel, opens on a RECORD,
never remembers an advertising choice, and raises the same red exception on
the same screen as the button. DR-0906 was never about forbidding advertising;
it was about never defaulting to it, and this is him choosing it deliberately.

## Verification

Four cases, all by mounting and clicking. Proven to catch, including an
assertion that `storage_path` is **untouched** so a copy cannot pass as a
move. The warning appears only once listing is chosen, never while a record
is; it moves back the other way with no warning; and setting the room still
works without touching the kind. 1102 green. **re-review: 2026-10-17.**
