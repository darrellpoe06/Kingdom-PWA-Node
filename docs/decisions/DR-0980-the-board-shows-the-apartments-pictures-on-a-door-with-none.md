# DR-0980: The board shows the apartment's pictures on a door with none of its own

**Date:** 2026-10-12
**Status:** accepted
**Area:** `DoorTabs.jsx` (`DoorsBoard`), new `apartment.js` (`sameApartment`, `streetKey` and `unitKey`, moved from `cloud.js` unchanged and re-exported there)
**Principle:** DR-0963 (a door in a shared apartment borrows its pictures), DR-0968 (the apartment number decides what is one apartment)

## Context

Darrell, 2026-10-12, with a screenshot of the Doors board: Bed B read "NO PHOTO" directly under Bed A's 37 photos.

> "Why don't the images show up for apartment 4 B?"
> "If the Apartment field is the same?!"

## What was measured

- Bed B has no pictures of its own; the apartment's 37 are filed on Bed A.
- Two surfaces already borrowed across the apartment:
  - the door's own Pictures tab (`loadSiblingPhotos`, DR-0963);
  - the public card (`public_vacancy_photos`, 0278).
- The board's cover and count read only the door's own rows (`pickCovers(photos)`, keyed by `rental_ref`), so it was the one surface that said "No photo".
- Bed B's address carries the unit ("805 North Prospect Avenue Apt 4") and Bed A's does not. `sameApartment` already treats these as one apartment: the street is compared with the unit folded out, and the unit by its number.

## Impact

The landlord's own board said one door had nothing to show while its listing and its gallery showed the whole apartment. The board contradicted the public card.

## Decision

- A board card with no cover of its own shows the cover of a door in the same apartment, using the same rule:
  - same instance;
  - `sameApartment`: same street, same apartment number;
  - never a whole place with no unit.
- The count says so: "37 photos shared with Apt 4".
- A door's own pictures always come first.
- `sameApartment` moved to `apartment.js`, a pure module, so the board can use it without loading the data layer. `cloud.js` re-exports it, so there is still one function and no copy.

## Verification

- `properties-doors-board.test.jsx` checks:
  - Bed B (unit typed into its address) shows Apt 4's cover and "3 photos shared with Apt 4";
  - Bed A keeps its own count;
  - Apt 2 at the same street, and a door in another instance, borrow nothing.
- **Proven to catch:** with the borrow removed, Bed B's case fails.
- `the-sibling-read-asks-by-id.test.js` (13) still passes through the re-export.

## Next (asked in the same breath)

"I may want to have a different order of pictures for apartment B": each door's own order of the apartment's shared pictures. It needs a per-door order table and goes in the next PR.
