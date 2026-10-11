# DR-0959 — A guest may stay as long as they like, at the nightly rate

**Date:** 2026-10-11 · **Status:** Accepted · **Declared by:** Darrell
**Code:** `infra/supabase/migrations-auto/0276-a-guest-may-stay-as-long-as-they-like.sql`, `app/src/modules/properties/booking.js`, `app/src/modules/properties/Booking.jsx`
**Gates:** `app/src/__tests__/a-short-stay-door-has-a-booking-calendar.test.jsx`

## Context

Darrell, 2026-10-11, reading his own live card on his phone:

> "we dont want people to do short term leases because of staying passed 29
> days!!!!!!! They can stay for a year with $150 a day if they want
> too!!!!!!!!!!!!!!!!!!"

**This is the second time he has asked.** `0269` line 77 records the first, in
his own words — *"Not 29 day cap?... why?"* — and the cap survived that round
with a research note attached. He has now reaffirmed it plainly, so it is his
decision and this carries it out.

## What was measured

The card on his screenshot read: **"Up to 29 nights here; for longer, apply for
a lease."** Three places enforced it — a database CHECK
(`door_stays_guest_asks_under_30_nights`), `GUEST_MAX_NIGHTS = 29`, and the
copy. A guest wanting sixty nights at $150 was refused and pointed at a lease:
exactly the outcome he is rejecting.

## Impact

Turning away a guest who wants to pay the nightly rate for two months is
turning away revenue the door is sitting there waiting for. Worse, it pushed
them toward a lease — the instrument he does **not** want for these stays.

## Decision

**A guest may ask for any length up to a year, at the nightly rate.** The
family still confirms every stay by hand, which is where the judgement lives.

**Stated once, not argued (DR-0100).** Two real facts sat behind the 29 and
neither is changed here — only who weighs them:

- the Hotel Operators' Occupancy Tax and Champaign's 7% reach stays under
  **30 consecutive days**; past that a stay generally falls outside them;
- a 30+ night occupancy begins to carry tenancy characteristics, and Illinois
  draws no bright line — it was on the ask-counsel list in 0269 and it remains
  there.

Neither is a reason the *form* should refuse the booking. The card now names
the 30-night line as something worth knowing before confirming a long stay,
rather than as a wall.

**The year ceiling stays.** A booking calendar is not a lease ledger; an ask
for four hundred nights is a typo, not an offer.

## Verification

Executed on real **PostgreSQL 16.15**, chain through 0269, applied twice:

| ask | before 0276 | after 0276 |
|---|---|---|
| 60 nights | **refused** — `violates check constraint door_stays_guest_asks_under_30_nights` | **accepted** |
| 359 nights (a year) | refused | **accepted** |
| 425 nights | refused | **still refused** — `door_stays_at_most_a_year` |

7 green in the booking suite, including that night thirty and night sixty now
pass validation, and that the ceiling message names 365.

**A robustness defect found by a failed run of my own test.** The first version
of 0276 began `ALTER TABLE public.door_stays …` unguarded, and errored with
*'relation "public.door_stays" does not exist'* on a chain that stopped before
0269. Several CI legs replay a partial chain on purpose, so that would have
broken them. The whole body is now inside an existence guard.

**Not proven from this sandbox:** the live card. **re-review: 2026-10-18.**
