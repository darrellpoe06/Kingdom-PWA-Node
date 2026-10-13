# DR-0984: Each door shows the apartment in its own order, and every shared picture opens large

**Date:** 2026-10-13
**Status:** accepted
**Area:**
- migration 0282 (`door_photo_order`, `public_vacancy_photos`)
- `cloud.js` (`loadSiblingPhotos` order, `saveDoorPhotoOrder`, `loadDoorPhotoOrders`)
- `DoorTabs.jsx` (`GalleryTab` shared card, `DoorsBoard` cover)
- `PropertiesApp.jsx`

**Amends:** DR-0963 (the shared card's promise), DR-0980 (the board's borrowed cover)
**Principle:** DR-0076 (proven to catch), DR-0219 (say what it should do, then prove it does)

## Context

Darrell, 2026-10-12, on the two listings for Apt 4 (Bed A and Bed B):

> "I may want to have a different order of pictures for apartment B... also... make sense?"
> "One showing LivingRoom Kitchen as a cover the other showing the Bedroom as a cover... either way... just advertising... make sense?"

Then, quoting the gallery's own note ("Ticking one here edits it on the door that owns it, for both listings at once — it is never a copy and never a way to give this door its own"):

> "This is the opposite of the required specifications... I want to be able to show two different rooms in the same apartment so the people know what two of the rooms look like right away without clicking a picture... also the apartment B picture can't be used/ clicked and enlarged... fix all of it... make sense?"

## What was measured

- **The order belonged to the owning door.** A bed with no pictures of its own borrows the apartment's: the family sees them through DR-0963, the public through 0273 and 0278. But it saw them only in the owning door's order, so the two listings of one apartment always opened on the same picture.
- **The shelf ignored the family's own order.** 0161 sorted the public pictures by `sort_order`. 0273 and 0278 sort by `taken_at` only (`ORDER BY 5, 4`), so the newest picture led every listing, whatever was arranged.
- **Shared pictures could not be enlarged.** The shared card drew each one with no control around it. The gallery's viewer was built from `shown`, which is the door's own pictures only.
- **The note promised the opposite.** It said "never a way to give this door its own", which is the reverse of what was asked.

## Impact

- A visitor comparing Bed A and Bed B saw the same first photo twice and had to tap through to see a second room.
- The family could not enlarge Bed B's pictures in Bed B's own gallery.
- Every listing led with whichever picture was taken last.

## Decision

1. **`door_photo_order`** stores one row per (door, borrowed picture): this door's position for a picture that lives on another door of the same apartment.
   - Nothing is copied. The picture stays on its door (0154 freezes `storage_path`).
   - A trigger refuses a door's own picture (its own order is `sort_order`), a picture from another apartment (`same_apartment`, 0273), and anything across instances.
   - Row-level security: the family reads it (owner, admin, member, viewer, assistant), and only owner, admin and member arrange it. Strangers and anonymous visitors get nothing.
2. **`public_vacancy_photos` sorting.**
   - A door's own pictures sort by `sort_order` again, then by date.
   - A borrowing door's pictures sort by its own order first, then the owning door's `sort_order`, then date.
   - The output shape is unchanged.
3. **Gallery.** Every shared picture opens large in the same viewer as the door's own. Each has ←, → and **Make this listing's cover**, saved for this door only. The first one is labelled "This listing's cover". The note now says the order and the cover are this listing's own, and that a caption or a tick still changes the picture itself on both listings.
4. **Board.** A borrowing door's card leads with the cover it chose. Without a choice, it falls back to the apartment's cover (DR-0980).

## Verification

- **`0282-door-photo-order-smoke.sql`** checks that:
  - the shelf leads with the arranged kitchen, not the newest bedroom;
  - Bed B leads with the bedroom after choosing it, and Bed A still leads with the kitchen;
  - a door's own picture, another apartment's door, a stranger's write and a stranger's read are all refused.
  - **Proven to catch:**
    - with 0278's ordering back: "Bed A leads with bedroom -- the family's sort_order is not honoured";
    - with the trigger dropped: "a door placing its own picture here";
    - with row-level security off: "a stranger placing a picture".
- **Neighbouring checks.** The 0273, 0280 and 0270 checks still pass on a chain built through 0282. Checked this time with 0281 really applied; my last change missed exactly this (DR-0977 → 0281).
- **`the-rest-of-the-apartment.test.jsx`** (12):
  - **Make this listing's cover** puts the bedroom first for Bed B, and it is drawn as "This listing's cover".
  - A shared picture opens in the viewer.
  - There are no controls without a way to save.
  - The note test is re-pinned to the new promise.
  - **Proven to catch:** with the tap removed, the enlarge test fails; with this door's order ignored, the cover test fails.
- **`properties-doors-board.test.jsx`:** Bed B's card shows its chosen picture, Bed A keeps its own, and an order row for a picture outside the apartment is ignored. **Proven to catch.**
- All 23 test files that stub the data layer pass (225 tests).
- **Not yet observed live:** Bed B chosen and seen on the public card on a phone. re-review 2026-10-27.
