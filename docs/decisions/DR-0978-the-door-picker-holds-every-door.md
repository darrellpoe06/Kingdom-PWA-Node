# DR-0978: The door picker holds every door, by the board's name

**Date:** 2026-10-12
**Status:** accepted
**Area:** `PropertiesApp.jsx` (the door picker beside the face label), `showcase.js` (`doorLabel`, `doorPickerOptions`), `DoorTabs.jsx` (the board's row label)
**Principle:** DR-0061 (a surface is a live view of real state)

## Context

On 2026-10-12, Darrell sent a screenshot of the landlord's door picker with no words. It held two entries, "805 North Prospect Avenue · Apt 2" and "805 North Prospect Avenue Apt 1", under "YOUR DOORS (12)".

## What was measured

- The picker listed `doors`: the **tenancies** the person can read (`loadMyDoors`). Only two of the twelve doors have a tenancy row: Apt 1, which is rented, and Apt 2, whose own pending record was created when its first message was sent (DR-0870).
- The other ten doors could be reached only by tapping them on the board.
- The two it listed were named by the tenancy's `property_label`/`unit_label`, not the door's name. That is why one read "· Apt 2" and the other " Apt 1".

## Impact

The landlord could not move between his own doors from the picker at the top of every tab. The picker also named doors differently from the board under it.

## Decision

- Whoever can read the doors (`rentals`) picks from **all** of them, in the board's order (`shelfOrder`), by the board's name.
- `doorLabel()` is now the one place a door's name is made; the board and the picker both read it.
- Picking a door selects it by its rentals id. The active door then resolves to that door's own tenancy, if it has one (DR-0904).
- A tenant, who reads no doors, still picks among their own tenancies, as before.

## Verification

- `the-door-picker-holds-every-door.test.jsx` renders the real owner screen with 12 doors and 2 tenancies. It checks that the picker holds 12 options in showcase order by the board's name, and that picking a door with no tenancy selects it.
- **Proven to catch:** with the picker put back on tenancies, both cases fail.
