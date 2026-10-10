# DR-0909 — A system keeps its pictures

**Date:** 2026-10-10
**Status:** accepted
**Area:** Poe Properties: the Systems tab (migration 0267)
**Principle:** DR-0908 (sharp tiles), DR-0906 (branded viewer), DR-0303 (the list never carries the bytes), DR-0076

## Context

Darrell, 2026-10-10: *"Should be able to add images etc of systems... all places that make sense... make sense?"*

**SHOULD.** The furnace, the water heater, the roof each carry their pictures: the data plate, the flue, the new unit, the before and after of a service visit.

## What was measured

- `property_systems` and `property_system_events` (0156) hold words and dates only. There is no picture column and no link to `property_photos`.
- `property_photos` (0153, 0154, 0185) already has thumbnails, captions, archive, the arranged order, the door and tenancy walls, and the worker's road to the door. Its kinds are fixed since 0153.

## Impact

A picture of the data plate could only be filed as a loose door picture, cut off from the system it shows. The model and serial number the next repair needs were not where the furnace was.

## Decision

1. **Picture anchors (0267).** `property_photos` gains optional `system_id` and `system_event_id`, plus a `system` kind. One picture store; every existing wall applies unchanged.
   - A trigger refuses a system on another door, or a service visit that does not exist.
   - A visit's picture finds its system and its door by itself.
2. **The Systems tab.** An opened system shows "Pictures of <system>" as sharp tiles that open the branded viewer.
   - "Add pictures" takes several at once.
   - Optionally the pictures are "from a visit" (e.g. the annual service) and carry a line saying what they show. Each is filed as a full image plus a thumbnail.
   - Those who cannot manage the door see the pictures and no way to add.
3. **Wider sweep.** Other surfaces that should take pictures are tracked as their own task, so each lands with its own proof.

`re-review: 2026-10-24` — on 805 N Prospect, open the furnace, add the data plate and two pictures from a service visit. Confirm they show on the system, open sharp, and save branded.

## Verification

- `infra/supabase/tests/0267-system-pictures-smoke.sql` runs in the `door-work` leg (whose chain now also applies 0156 and 0185) and in the live rls-isolation leg. It proves:
  - the owner files a furnace picture on its door;
  - another door's furnace is refused;
  - a visit's picture finds its system and door;
  - a missing visit is refused;
  - a made-up kind is refused;
  - a stranger reads nothing.

  Proven to catch: dropping the trigger fails it, and so does opening the kind check. All eight door smokes (0260 through 0267) pass together.
- `a-system-keeps-its-pictures.test.jsx` (5 tests) covers:
  - this system's pictures only, archived ones excluded, newest first;
  - the filed rows;
  - the visit named on a picture;
  - several pictures filed on the chosen visit, with a non-picture refused by name;
  - no add control for those who cannot manage the door.
