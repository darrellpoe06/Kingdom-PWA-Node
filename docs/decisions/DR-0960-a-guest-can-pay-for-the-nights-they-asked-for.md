# DR-0960 — A guest can pay for the nights they asked for, and paying is not member-scoped

**Date:** 2026-10-11 · **Status:** Accepted · **Declared by:** Darrell
**Code:** `infra/supabase/migrations-auto/0277-a-guest-can-pay-for-the-nights-they-asked-for.sql`, `app/src/modules/properties/cloud.js`, `app/src/modules/properties/Booking.jsx`
**Gates:** `app/src/__tests__/a-short-stay-door-has-a-booking-calendar.test.jsx`

## Context

Darrell, 2026-10-11, in four messages over about a minute, immediately after
the night cap came off:

> "If they pay!!!!!!!!!!!"
> "Square payment options!!!!!!!!!"
> "This can't be member scoped... we will need to be able to receive funds from everyone..."
> "Also be members..."

Unlimited nights, on the condition that they are paid for — by anyone, member
or not.

## What was measured

**The rail already existed and nothing could reach it.** `0262` added
`rent_payee.square_link` for exactly this, on Darrell's own 2026-10-10 word
recorded in that file: *"Christina already has a square account we can use that
for payment options."* `rent-pay.js` already validates and opens it for a
**tenant** paying rent.

But `rent_payee`'s read policy is `FOR SELECT TO authenticated`, and a
short-stay guest has no account at all. The booking card therefore ended at:
*"Nothing is charged here. The family confirms, then sends the address,
check-in steps and how to pay."* A guest ready to pay, at the one moment they
are ready, was told to wait for a message.

## Impact

A guest is most willing to pay in the seconds after they ask. Sending them
away to wait for a message spends that moment, and every hour between the ask
and the payment is an hour the nights are neither paid for nor free to sell to
somebody else. With the night cap gone (DR-0959) the exposure grows with the
length of the stay: a sixty-night ask held unpaid is sixty nights of calendar
tied up on a promise.

## Decision

1. **`public_stay_payment(uuid)`** returns the family's Square link and the
   nightly rate, granted to **`anon` AND `authenticated`** — "receive funds
   from everyone", and "also be members", are the same function.
2. **Narrow on purpose.** One column out of `rent_payee` — not the cashtag,
   Zelle address, bank-deposit wording or who a cheque is payable to. Those
   belong to the tenant relationship and a stranger has no claim on them.
   `rent_payee` itself stays member-only.
3. **Only for a door that is on the shelf** — listed, offered short-term or
   both, not our own home. A pay link for a door nobody can book is not
   something a stranger needs.
4. **The link is re-checked as a Square address here**, not only where it is
   written, because this is the road a stranger is sent down with money.
5. **Money still does not move in the app.** `0055` hardwires
   `money_moved_in_app` false with a CHECK. The app shows the amount and hands
   the guest to Square; the family confirms the stay and confirms the money
   landed, exactly as for rent.
6. **A missing or unreadable link says so** — "We will send you how to pay when
   we confirm" — rather than hiding the question or inventing a method.

## Verification

Executed on real **PostgreSQL 16.15**, applied twice:

| caller | listed short-term door | unlisted door | long-term-only door |
|---|---|---|---|
| anonymous | **link + $150** | nothing | nothing |
| signed in, not a member | **link** | — | — |
| family member | **link** | — | — |

And the wall holds underneath: a direct `SELECT` on `rent_payee` is
`permission denied` for anon and returns **0 rows** for a signed-in
non-member, while the member reads their 1 row.

**10 green** in the booking suite, driving the real form to the Asked screen
and asserting the button, its `href`, the `$450.00` total, and
`target="_blank"` with `noopener`.

**Proven to catch:** making a failed read fall back to a link anyway fails two
cases — *"says plainly that we will send how to pay when no link is set"* and
*"a FAILED read is the same honest answer, never an invented link."*

**A bug in my own migration, found because a test returned nothing and I
checked instead of assuming:** the filter read `offering IN ('short-stay',
'both')`. `'short-stay'` is not a value `rentals.offering` can hold — 0155
constrains it to `long-term` / `short-term` / `both` — so the pay link would
have been withheld from **every door**, failing nowhere. The seed behind the
test had silently violated the same CHECK, which is what made it visible.

**Not proven from this sandbox:** whether `rent_payee.square_link` is actually
set for Poe Properties in the live database. If it is not, every guest sees the
honest fallback line until Darrell pastes the link in.
**re-review: 2026-10-18.**
