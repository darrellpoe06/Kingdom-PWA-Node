# DR-0977: The address shows unless the family holds it, and the map is asked for

**Date:** 2026-10-12
**Status:** accepted
**Area:** migration 0280, `public_vacancies()`, `app/functions/geocode.js` (`/geocode`), `area.js` (`findPoint`, `mapsUrl`), `AreaMap.jsx` (`MapOnRequest`, `AreaEditor`), `Storefront.jsx`, the door editor (`DoorTabs.jsx`)
**Supersedes:** DR-0933's "never the street"; amends DR-0935 (the map is no longer drawn on every card)
**Principle:** DR-0076 (proven to catch), DR-0061 (a surface is a live view of real state)

## Context

Darrell asked for this on 2026-10-12, after he was told to paste a Google Maps link to put Apt 2 on the map:

> "Why would I ever need to add a Google maps link when you can do that as a standard for any address we add?!!!!! Just make the like work based on the addresses then let the user choose the map or show the address as options... make sense?"

> "I only want a map when I want it.. so show address unless... don't want to spend time or data for the map if not required or requested... however... we want to use it when we want to... make sense?"

## What was measured

- **The street.** 0268 (DR-0933, 2026-10-10) made `rental_address_is_public()` return false for every door. The shelf therefore never carried a street, whatever a door was set to. The editor showed a fixed "Never shown to strangers" line in place of a choice.
- **The editor never read the setting.** `loadMyRentals` did not select `address_visibility`. The editor always displayed its own default (`'after-application'`) and wrote that default on every save. A stored value therefore cannot be told apart from a real choice.
- **The map.** 0270's card drew 15 OpenStreetMap tiles on every listing that had an area, without being asked. A door could get an area only from a point pasted by hand from a map app.
- **The Functions.** Since 2026-10-09, Cloudflare has invoked no Pages Function on poetech.us (#2057, day 2 on 2026-10-12, Cloudflare-side). A same-origin route alone would currently answer with the app's own HTML.

## Impact

- The family had to leave the app, find the house in another app, long-press it and paste coordinates. Without that, the door had no map at all.
- Every visitor's phone fetched map tiles for every card, whether or not they wanted a map.
- Visitors could never see a street, even where the family wanted it shown.

## Decision

1. **The street shows unless the family holds it.**
   - `rental_address_is_public()` honours the door's setting again: `'public'` shows the street; `'after-application'` (or NULL) holds it.
   - The column defaults to `'public'`.
   - 0280 sets every existing door to `'public'` **once**. Each door's old value is kept in `address_visibility_before_0280`, and that column's existence is what keeps the reset from re-running. The replay and the isolation matrix re-apply 0280 indefinitely, and a re-run must never undo a family's hold.
   - The door editor offers the choice ("Show the street address" / "Hold it until someone applies or books"), and the sentence under it says what the shelf will do.
2. **`public_vacancies()` gains `street`**: the address, only when shown. The card prints it unless the door's name already says it, and names the unit once.
3. **A map only when asked for.**
   - A card shows **Show on map** and, for a shown street, **Open in Maps**. Open in Maps is Google's documented URL (`maps/search/?api=1&query=`), which opens the phone's own maps app.
   - No tile is fetched and no address is looked up until the button is pressed.
   - The family's nearby lines are text, so they still show without the map.
   - A held street gets no Open in Maps: a pin on the rounded area would read as the house.
4. **The point comes from the address.**
   - `/geocode` asks the US Census geocoder, then OpenStreetMap's Nominatim. Neither needs a key or an account. Each request has a 6 s timeout, and a found point is cached for a week.
   - On the phone, `findPoint` asks `/geocode` first. Only when that route gives no answer at all (unreachable, or HTML as during #2057) does it ask Nominatim directly. A route that answers "not found" is believed.
   - The family's editor has **Find it from the address**. Pinning by hand stays as a fallback. The exact point is used once, for the distances, and only the rounded area is saved (0270 is unchanged).

## Verification

- **0280 check** (`0280-address-shows-smoke.sql`):
  - A new door shows its street and unit.
  - A held door shows neither, and keeps its placeable label.
  - A stranger cannot show a held street.
  - The guard column exists.
  - **Proven to catch:**
    - with the default dropped: "a new door defaults to NULL";
    - with `rental_address_is_public` returning true: FAIL;
    - with the guard column removed: FAIL.
- **Re-run keeps a hold.** Measured locally: a committed held door stays `after-application` after 0280 is re-applied. With the guard removed, the same re-run turns it to `public`. CI now runs this check.
- **0152 and 0270 checks** were re-pinned to held and shown. With DR-0933's "never" restored, 0152 fails ("a shown door carries its name, unit and street"). 0270's original insert, run against 0280, fails ("the shelf carries the street").
- **Door journeys in Chrome**, through PostgREST 12.2.12, over a chain built to 0280: **10 of 10**.
  - E1: the family finds the door from its own address. The lookup asks once, for "805 North Prospect Avenue, Champaign, Illinois", and the database reads 40.12500, -88.26000 with 12 lines.
  - C2: zero tiles are fetched before the tap and 15 after; the held street and the exact point are absent; no Open in Maps is offered.
  - H1: the family shows the street, and the next visitor sees it with an Open in Maps link to the address.
  - **Proven to catch:**
    - `--break=street`: A1 fails;
    - `--break=area`: E1 fails.
  - The area fault's undo now replays 0270 → 0273 → 0278 → 0280. Re-applying 0270 alone had rebuilt `public_vacancies()` without `street`, measured.
- **Unit tests:**
  - `an-address-finds-its-map.test.js` (11): both services' response shapes, the fallback order, timeouts, the route's status and cache headers, and the #2057 HTML case falling through to OpenStreetMap.
  - `the-public-shelf-shows-the-area-on-a-map.test.jsx` (21): includes no fetch before the tap, the lookup on tap, the editor's find-from-address save, and the unit named once.
- **Not observed:**
  - A live `/geocode` call. The sandbox has no route to the Census, Nominatim or poetech.us, and Cloudflare is not running Functions (#2057). Until #2057 clears, phones use the direct OpenStreetMap road.
  - The response shapes are recorded from the services' documented formats, not fetched live.
  - **re-review: 2026-10-26** (live lookup on a phone, and `/geocode` once Functions run again).
