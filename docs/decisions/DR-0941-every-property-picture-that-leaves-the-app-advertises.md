# DR-0941 — Every property picture that leaves the app advertises

**Date:** 2026-10-10
**Status:** accepted
**Area:** Poe Properties: the public listing viewer (Storefront) and the door's Pictures tab; the shared Lightbox
**Principle:** DR-0065 (the app is the artifact), DR-0076, the Lightbox's own "unbreakable" rule

## Context

Darrell, 2026-10-10: *"Make sure we have our logos and qrcodes inside each image of the properties so it's always an advertisement... make sense... especially since users can download it... all downloaded materials have our tags and logos... etc..."*

**SHOULD.** Any copy of a property picture that leaves the app carries the Poe Properties logo, the tag, and a QR code back to that place, whether it is saved, screenshotted or forwarded.

## What was measured

- The shared `Lightbox` "⬇ Save" link handed out `curSrc`, the original picture, with no file name and no mark. Both property viewers (`Storefront.jsx` VacancyCard and `DoorTabs.jsx` GalleryTab) open that Lightbox.
- Property pictures are stored as data URLs (`storage_path: pic.dataUrl`, `DoorTabs.jsx:1303`), so a canvas can read them and draw a mark into the pixels.
- `qrcode.react` is already in the app, and `applyUrl(rentalId)` (`apply-link.js:42`) is already the address of a unit's own listing.

## Impact

Every picture a renter, a guest or the family saved or forwarded travelled bare: no name, no way back to the place, nothing that said whose it was.

## Decision

1. **`lib/brand-stamp.js` draws a band across the foot of the picture**, in the pixels, with:
   - the Poe Properties mark;
   - "Poe Properties · <the door>";
   - "Scan to see this place · poetech.us/properties/?apply=<unit>";
   - a QR code to that unit's listing.

   The band is sized to the picture's width with a readable floor, so a phone can scan the QR off a screen. The QR is rendered with the React and qrcode.react already in the app; no server renderer ships to the phone.
2. **Stamped when shown full-size or saved, never at upload.** The stored original stays the family's clean record (an inspection, a damage photo, a reshoot).
3. **The Lightbox takes a `stamp`:**
   - **On screen:** the picture shows the stamped copy once it is ready.
   - **Save:** hands out only the stamped copy, named for the place (`poe-properties-<door>-<n>.jpg`).
   - **If the stamp cannot be made:** viewing still works (the viewer's unbreakable rule), but Save is withheld and the viewer says the picture could not be prepared for saving. Nothing leaves unbranded through the app.
   - **Without a `stamp`:** family photos elsewhere in PoeTech are unchanged.
4. **Wired** on the public listing viewer and on the door's Pictures tab.

### Limits, stated plainly

- A screenshot of a thumbnail grid is not stamped; the full-size view is.
- A determined person can crop the band. The mark makes the honest path carry the advertisement; it is not a lock.

`re-review: 2026-10-24` — open a listing on a phone, view a picture full-size and Save it. The saved file carries the band, and its QR, scanned from the screen, opens that unit's listing.

## Verification

`every-property-picture-advertises.test.jsx` (8 tests) covers:
- **The band:** its layout, wording and file name.
- **The QR:** a real SVG.
- **The drawing:** photo, band, logo, QR and both lines all drawn into the pixels.
- **A picture that will not load:** returns null and never throws.
- **The viewer:**
  - with a stamp, both the screen and Save are the stamped copy and the original never appears in the page (proven to catch);
  - when the stamp fails, the picture is still seen and Save is withheld (proven to catch, by handing out the original);
  - without a stamp, nothing changes.

The existing gallery and viewer suites (680 tests across the properties, photo and gallery files) pass unchanged. They also caught the first draft, which hid the picture when the stamp failed.

## Addendum, 2026-10-10: renumbered

This record was written as DR-0906. #2101 merged its own DR-0906 on main first ("records versus advertising"), so this one is DR-0941, with every reference renamed.
