# DR-1162: The landlord files some or all of a door's NAS archive to its record in one move; the empty gallery says what kind of none it is

**Date:** 2026-10-21
**Status:** accepted
**Tier:** A (the family's own filing; the archive stays behind the family key; the record's walls are unchanged)
**Type:** feature

**Area:** `app/src/modules/properties/DoorTabs.jsx` (`NasShelf`: tick boxes, "File N ticked as records", "Use N ticked on the listing", "File all N on this door's archive as records", the bar; `GalleryTab`: the empty sentence), `app/src/__tests__/the-nas-pictures-join-the-listing.test.jsx` (three cases), the two suites that pinned the old sentence.

**Principles:** DR-1002 (a NAS picture joins a door once), DR-0961 (the bar counts real writes), DR-0947 (one refresh for a batch), DR-0946 / DR-0876 (an absence is never invented), 0185 (a delegated worker reads the door's pictures), DR-0778 (the family key never leaves a family device).
**Declared by:** Darrell, 2026-10-21, from "Seen as a 1099 worker" on 709 Commercial St: *"1099 worker won't see pictures of the property?"*, then, with the Edit side's shelf showing 121 on the NAS archive: *"Yes it does on the other edit side... my point..."*, *"Fix it... and whatever else makes more sense..."*, *"Landlord chooses what to show some or all?"*

---

## What was measured

- The worker's Pictures tab reads `property_photos` for the door (0185 admits a worker with Document It or Property history); 709 Commercial St had **0** rows, so it read "No pictures on this property yet", a sentence the app invented about a door whose archive held **121** pictures (`709CommercialSt` on the NAS photo server, read in 1.3 s over the same-origin road).
- The archive is behind the family bearer (`photo_server.py` fails closed; `bridgeToken()` is per family device), so no worker's, manager's or tenant's phone can read it directly. What they can read is what is **filed** to the record.
- Filing was one picture at a time ("picked, never twice"), each with its own refresh.

## Decision

1. **Some or all, the landlord's choice.** On the shelf: a tick on every unfiled tile; "File N ticked as records" / "Use N ticked on the listing"; and on the door's own archive, "File all N on this door's archive as records", which pages the archive from the NAS (24 at a time, at most 50 pages), skips what the door already holds (the source rule, 0285), files each once through the same path as a single pick, counts what landed and what did not, shows the bar (DR-0961) and refreshes the gallery once at the end (DR-0947).
2. **The archive stays the family's.** Nothing here hands the key or the shelf to another seat; what a worker sees on his own phone is exactly what the landlord filed.
3. **The empty gallery says what kind of none it is.** "No pictures filed to this door's record yet", then, on a family device with the archive in reach, "This door's NAS archive is below: file some or all, and everyone on this door sees them"; on any other seat, "The family keeps this door's archive on the NAS; what they file shows here." Never "no pictures on this property".

## Impact

A filed picture carries the bytes at listing size (the existing shape); a whole archive of 121 is a one-time write of some tens of megabytes to the sovereign database. `re-review: 2026-11-11` — whether a filed NAS picture should carry only its source and thumbnail, with the full picture fetched from the NAS by a family device and from a signed copy by everyone else.

## Verification

- `the-nas-pictures-join-the-listing.test.jsx`: two ticked of three file as records, each once, one refresh (**proven to catch** the per-picture refresh); File all pages the archive, skips the one already on the door, counts "1 of 2 filed; 1 did not land", one refresh; every picture filed means no tick and no batch offered. The five earlier cases unchanged.
- `an-unread-door-does-not-say-empty` and `properties-qr-gallery-files` pin the new sentence; the unread-versus-empty distinction they exist for is untouched.
