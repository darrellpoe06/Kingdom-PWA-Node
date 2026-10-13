# DR-1003: Any door, any cadence — the true month beside each price, so the choice is informed

**Date:** 2026-10-13
**Status:** accepted
**Area:**
- migration 0286 (`rentals.weekly_rate`, `rentals.biweekly_rate`, `rentals.building_note`; `public_vacancies()` widened and re-ordered), smoke `0286-any-cadence-smoke.sql`
- `app/src/modules/properties/cadence.js` (`CADENCES`, `cadencePrices`, `cadenceLine`, `betterDeal`, `dealLine`, `cadenceChoice`)
- `app/src/modules/properties/Storefront.jsx` (`vacancy-cadence`, `vacancy-deal`, `vacancy-building`; the bed's copy), `PropertiesDoor.jsx` and `PropertiesApp.jsx` (the two shelf mappings), `DoorTabs.jsx` (`EditRental`: the two rates, the building's note, the preview), `intake.js` + `PropertiesDoor.jsx` (the application's "How you would like to pay")
- `scripts/e2e/door-journeys.mjs` (A1, `--break=cadence`), `ci.yml`, `rls-isolation.yml`, `build-door-db.sh`

**Amends:** DR-0952 (a bed's copy now says the bedroom is shared, two to a room), DR-0155 (a door's price is no longer monthly-or-nightly only), DR-0997 (the building lends its note the way it lends its area)
**Declared by:** Darrell, 2026-10-13

## His word

> "$800 a monthly however $200 weekly... sounds the same until you get a 5 week month."

And in the same breath: rooms before beds; a bed is in a bedroom shared, two to a room; 805's laundry is in the entry.

## The problem

A weekly price is paid 52 times a year, not 48. $200 a week is $867 a month on average and $1,000 in a five-week month; "every two weeks" is paid 26 times, so $400 is $867 on average and $1,200 in a month with three paydays. A listing that prints "$200/week" beside "$800/month" and stops leaves the renter to discover the difference at the end of the first long month. The database held a monthly rent and, for a short stay, a nightly rate — no weekly, no every-two-weeks — so a family that rents by the week had nowhere to say so, and a renter nowhere to compare.

## Decision

1. **A door is priced by any cadence.** `rentals.weekly_rate` and `rentals.biweekly_rate` join `monthly_rent` and `nightly_rate` (0286). NULL is "not offered that way", never $0; a rate below zero is refused by the database. Whether weekly × 4.33 should exceed the month is the family's pricing choice, not a database rule — the shelf makes the choice informed instead.
2. **The true month is printed beside each price, and the better deal is named.** The public card prints, under the monthly figure: *"Monthly $800 · Weekly $200 ($867 a month on average, $1,000 in a five-week month) · Every two weeks $400 ($867 a month on average, $1,200 in a month with three paydays)"* and *"Monthly is the better deal: $67 a month less than weekly on average."* Nightly joins the line on a short-stay door (a month of nights, 30.4 on average and 31 in a long month). A door priced monthly and no other way prints nothing extra: one figure compared with itself is noise. The arithmetic lives once, in `cadence.js`, pure and tested; the family's door editor shows the same line under the fields before Save, so what they will publish is what they read.
3. **The renter says how they would like to pay.** The application's first section asks *How you would like to pay* — monthly, weekly, every two weeks — with the help line "the listing shows what each comes to in a month; monthly is usually the better deal". It rides in the application's answers; no new table.
4. **Rooms before beds.** Among doors of the same showcase order a private room is offered before a bed; the family's own order still wins when set (0282).
5. **A bed says the bedroom is shared, two to a room.** The card's shared-home line for a bed reads *"A bed in a shared bedroom, two to a room, in a shared home."* (a private room keeps *"A private room in a shared home."*), before the price, as DR-0952 placed it.
6. **What the building offers is on every door in it.** `rentals.building_note` ("Laundry in the entry") is lent by `public_vacancies()` to a sibling door that stored none — same family, same building key — exactly as 0283 lends the building's area; another family's door on the same street lends nothing. The card prints *"The building: Laundry in the entry."* The family types it once, on any door of the building.

## Not in this decision

- A tenancy's rent cadence (what a lease collects, when, and how Rent and the ledger count a five-week month). The tenancy still holds one monthly rent; the renter's chosen cadence arrives on the application for the family to write into the lease. `re-review: 2026-10-27`.
- A short stay's quote (BookAStay) already prices by the night; it does not restate the month.

## Verification

- **`0286-any-cadence-smoke.sql`** (ANY CADENCE SMOKE: PASS): the weekly and every-two-weeks prices the family set come through to anon; a monthly-only door reads NULL for the others, never $0; a rate below zero is refused (`check_violation`, both columns); a door with no note reads its building's, from its own family, never another family's on the same street; among equal showcase order the private room is offered before the bed; the held bed still carries no street, no unit, no tenant, no point. Applied twice. **Proven to catch:** with 0283's function back the smoke fails on the missing column. 0273, 0280 and 0283's shelf smokes still pass on the widened function.
- **Unit:** `the-true-month-beside-every-cadence` (14): 52 weeks a year, 26 paydays, 365 nights; the five-week month is five weeks and not 4.33 of them (proven to catch); nothing is ever $0; the sentence; monthly-only says nothing; weekly-only still says the month; the better deal, the honest reverse, a tie within a dollar, one cadence is no choice. `the-true-month-is-on-the-card`: the card prints the line, the deal and the building's note; a monthly-only door prints no comparison; the bed's copy. `a-shared-home-says-so` follows the new bed copy.
- **Door journeys (Chrome, PostgREST, the real chain):** A1 reads the card's cadence line, the deal and the building's note on the seeded door ($800 a month, $200 a week, laundry in the entry). `--break=cadence` (the weekly price removed) fails A1, as it must; in CI's proven-to-catch loop.
- **Wired into:** `ci.yml` (0286 applied twice, the smoke), `rls-isolation.yml` (the poe-properties leg), `build-door-db.sh`.
- **Not observed live:** the line on poetech.us for a real door, which needs the family to set a weekly price in Doors → Edit after the deploy and db-migrate. `re-review: 2026-10-27`.
