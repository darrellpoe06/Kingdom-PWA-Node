# DR-1239: The rent that is saved is the rent that shows — the advertised price was a column nobody could edit

**Date:** 2026-10-27
**Status:** Accepted
**Area:** `app/src/modules/properties/staging.js`, `PropertiesApp.jsx`, `DoorTabs.jsx`
**Follows:** DR-0908 (a write that never answers is not a write), DR-1007 (a new door on the account)

## Context

Darrell, 2026-10-27, on 805 North Prospect Avenue Apt 4, with the door panel
open and the RENT field holding 1000:

> "The rent amounts don't update appropriately... retest the amounts and make
> sure they update... the $750 will not update to $1000 even after saving it...
> fix it..."

The header above the form said **ADVERTISED · $750/mo**. The field under it said
**1000**. He had saved.

## What was measured

The save worked. `monthly_rent` really did become 1000. **Every screen that
prices an advertised door was reading a different column.**

| where | what it read |
| --- | --- |
| the board row, `DoorTabs.jsx:600` | `tenancy.monthly_rent \|\| r.listed_rent \|\| r.monthly_rent` |
| the open door's header, `PropertiesApp.jsx:173` | the same order |
| the **public shelf**, every `public_vacancies()` view back to migration 0152 | `coalesce(v.listed_rent, v.monthly_rent) AS rent` |

`listed_rent` is written in **exactly one place** — `setListing`, the moment a
door is first advertised, seeded from whatever `monthly_rent` was at that hour
(`PropertiesApp.jsx:1114`). It is in no form on any screen. Grep across the app,
the migrations and the tests finds no second writer.

So an advertised door **froze its price at the hour it went up**, and the
owner's edit landed where nothing he was looking at — and nothing a renter was
looking at — would read. There was no error to see, because nothing failed.

## Impact

Worse than the mismatch he reported. The **public listing quoted the stale
figure to people deciding whether to apply**, and the owner had no way to
discover it, because the board he would check it against quoted the same stale
figure. A door advertised at $750 and later re-priced to $1000 went on offering
itself at $750 indefinitely.

## The decision

**A second price the owner can neither see nor set is not a feature, it is a
shadow.** While one rent field is the only way to price a door, the two move
together.

1. **The write** — `advertisedPriceFollows(rental, patch)` carries a changed
   `monthly_rent` onto `listed_rent`, applied at `editRental`, the single save
   every door edit passes through. It follows a **withdrawn** listing too
   (`setListing` keeps `listed_rent` on the way down, so leaving it behind would
   re-advertise last season's price on the way back up), and it follows the rent
   **to blank** — an advertised door with no rent recorded should say so rather
   than keep quoting a figure nobody set. A door never advertised is untouched.
2. **The read** — the board row and the door header now read the door's own
   `monthly_rent` **before** the frozen `listed_rent`. When the two disagree,
   the one the owner can actually type in is by definition the newer intent.
   This is what tells the truth about the doors that **already drifted**, with
   no data rewritten and nobody re-saving anything.
3. The other tab is announced the patch that was **written**, not the one that
   was typed — otherwise it would be handed the same stale figure.

## Verification — proven to catch

Four breaks, each reverted after:

| break | result |
| --- | --- |
| the rule unwired from `editRental` (the original bug's exact shape) | **FAIL** — the save path is not wired to it |
| the rule stops carrying the price | **FAIL** — 3 cases |
| `DoorTabs` read order flipped back | **FAIL** — the board row |
| the header's read order flipped back | **FAIL** — the open door |

**The gate's own first draft could not fail, and that is recorded here on
purpose.** It compared the first `monthly_rent` on the line against the first
`listed_rent` — but the first `monthly_rent` is the **tenancy's**
(`tenancy?.monthly_rent`), which sits ahead of both whatever the door's order
is. It passed 11/11 against the broken file. Pinning the subject to the door's
own accessor (`r.` / `rental?.`) is what made it a check. A gate that cannot
fail is worth less than no gate, because it is believed (DR-0076 §3).

Also green: `properties-door`, `properties-work-on-any-door`,
`properties-showcase`, `properties-intake` — 124 tests.

## Limits, named rather than left

- **The server view still coalesces `listed_rent` first.** The write fix means
  the public shelf is correct from the next save of any door onward, and the
  client fix means the owner's own screens are correct immediately — but a door
  that drifted and is never edited again would still be advertised publicly at
  its old price. Redefining `public_vacancies()` is a view migration across
  fifteen files and this session has no approved database access to verify it
  against live data; shipping an unverified view change over the public
  storefront is the trade this declines. **`re-review: 2026-11-03`.**
- **There is still no way to advertise at a price other than the door's rent.**
  That capability never existed — `listed_rent` only ever held a copy. If it is
  ever wanted, it needs a field on the form, not a hidden column.
  **`re-review: 2026-12-27`.**
