# DR-0940 — Square is a way tenants pay, through the family's own payment link

**Date:** 2026-10-10
**Status:** accepted
**Area:** Poe Properties: "How tenants pay you" and the tenant's "I'm paying" (migration 0262, not yet shipped, extended in place)
**Principle:** DR-0899 (the record is written first, then the hand-off), DR-0094 (no money moves in the app), DR-0076

## Context

Darrell, 2026-10-10: *"Christina already has a square account we can use that for payment options... make sense?"*

**SHOULD.** A tenant can pay by card, Apple Pay or Google Pay through Christina's Square account, and the payment lands on the record like every other way.

## What was measured

- `rent_payee` (0262) held Cash App, Venmo, Zelle, bank deposit, cash and check. There was no Square column and no Square method in `PAY_METHODS`.
- 0262 had not reached `main` (`git ls-tree origin/main` lists only 0260). Extending it in place therefore changes no live function. A separate migration would have had to change `rent_payee_for_tenancy()`'s return shape on a live database.

## Impact

The family's card-taking account sat outside the app. A tenant who wanted to pay by card had no road, and a card payment was recorded nowhere until someone typed it in by hand.

## Decision

1. **The family's own Square payment link.** It is made in Christina's Square dashboard (square.link, checkout.square.site, a *.square.site page, or squareup.com) and saved in "How tenants pay you".
   - The database refuses any other address (`rent_payee_square_link_is_square`).
   - No Square key, token or account number ever reaches the app.
2. **"I'm paying" → Square (card).** The payment is recorded first: amount, month, part-payment facts and the device clock. Then the tenant is handed to the Square link, exactly as with Cash App and Venmo.
   - The app opens only a Square address (`isSquareLink`).
   - The family confirms when the money lands. No money moves in the app.
3. **Shared by the other money surfaces.** "Record a payment received" (DR-0903) gains Square through the same method list, and the booking calendar will reuse the same link.

`re-review: 2026-10-24` — Christina pastes her real Square link. A test tenant records $1 by Square and lands on her Square page; she confirms it and it shows on the door's totals.

## Verification

- `infra/supabase/tests/0262-rent-and-clock-smoke.sql` proves two things:
  - a non-Square link is refused and the family's Square link is accepted;
  - the tenant reads it for their door.

  Proven to catch: dropping the Square CHECK fails the smoke by name. 0262 replays three times cleanly, including over the earlier shape.
- `rent-pay.test.jsx` gains three tests:
  - only a Square address is ever opened (proven to catch): a look-alike host, plain http and a foreign host are all refused;
  - the record is written before Square opens;
  - the family saves the link.

## Addendum, 2026-10-10: renumbered

This record was written as DR-0905. #2100 merged its own DR-0905 on main first ("a HEIC photo is a photo"), so this one is DR-0940.
