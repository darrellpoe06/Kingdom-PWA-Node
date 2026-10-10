# DR-0903 — The door keeps its money, with or without a tenant

**Date:** 2026-10-10
**Status:** accepted
**Area:** Poe Properties: the Rent tab, the door header, the Doors board (migration 0265)
**Principle:** DR-0897 (work on the door), DR-0899 (rent hand-off and the clock), DR-0094 (no money moves), DR-0076 (unknown never reads as zero), DR-0061 (real data)

## Context

Darrell, 2026-10-10, on the Rent tab of a door, in the landlord's seat:

> "How to add payments to the historical events?"

and then:

> "We want the historical money for each property to be available... with or without the tenants information... so the door always pays... and inside other places... tenants information can be integrated into the timetable however the most important thing is to see how much money is being accumulated by each asset... make sense?"

**SHOULD.**
- The family can add a payment it received, including past payments, and it lands in the door's history.
- Money is kept on the DOOR, whether or not a tenancy is on record. The door's history outlives every tenant.
- Each asset shows what it has accumulated: overall, by year and by month.
- Tenant details ride along when there are any, but are not required.

## What was measured

- `rent_records.tenancy_id` was NOT NULL (0055), so a payment could only be written against a tenancy. That covers none of the doors on this account today, no short stay, and nothing from before the app.
- A payment knew its tenancy and nothing else. The door was reached only by matching the tenancy's `rental_ref` text to `rentals.slug`.
- The landlord's only write was "Confirm received" on a tenant's report. A payment the family received itself could not be written at all.
- `reported_at` records when a payment was typed, not when the money came, so a January payment entered in October read as October.
- Nothing summed money per door. 0203's `door_month` reads the books' `rent_payments`, which hold zero rows; the Poe Properties app keeps rent in `rent_records`.

## Impact

Money that came in on a door with no tenancy had nowhere to be recorded, the landlord could not add a payment he received, and no door could say what it had brought in. The asset's history was split across tenancies, or missing. Darrell's question ("how much money is being accumulated by each asset") had no answer anywhere in the app.

## Decision

1. **A payment names its door (0265).**
   - `rent_records.rental_id` points at the door, and `tenancy_id` becomes optional. A row must name a tenancy, a door or both, never neither.
   - When there is a tenancy, the database fills the door in from it, and every existing row is backfilled.
   - A payment that names one door and a tenancy on another is refused, and so is a door from another instance.
2. **The day the money came.** `paid_on` holds the real date, which may be long past. A day that has not come yet is refused.
3. **A payment with no tenancy is the family's record.** It is written by the landlord or a manager; a tenant only ever reports against their own tenancy. A CHECK enforces this even under the policies.
4. **Delegated managers, door by door.** On a door, a manager can read its money with `rentroll.view`, record a payment with `rent.confirm` and correct one with `rent.adjust`. This is the 0260 pattern. The instance-role arms are unchanged.
5. **`door_money_months`** gives, for each door and each month the money came:
   - confirmed money received and the number of payments;
   - money reported but not yet confirmed, which is never added to "received";
   - how many payments had no tenant on record.

   It is `security_invoker`, so it runs under the reader's own RLS. A tenant sees only their own money, and a stranger sees nothing.
6. **The clock carries it.** The record_events entry for a new payment holds `paid_on` and the door, and a change to `paid_on` is logged with the other changes.
7. **In the app.**
   - **Rent tab, family seat:**
     - "What this door has brought in": the lifetime total, each year, and a month-by-month bar list, with money awaiting confirmation named separately.
     - "Record a payment received": amount, the day it came (past allowed), the month it is for, how it came, from whom (when nobody is on record), and a note. It is written as confirmed, on the tenancy when one is named, otherwise on the door alone.
     - Payment history now shows the door's whole history, newest first. Each payment says when the money came, and whether it had no tenant on record or belonged to an earlier tenancy.
     - The tenant's own "I'm paying" balance still counts only their tenancy.
   - **Door header:** "$X brought in since YYYY-MM", or "no money recorded yet".
   - **Doors board:** the same line on every card, plus a portfolio line: "$X brought in across N doors · $Y this year".
   - **History:** a payment sits on the day it came.

A door with nothing recorded says so. It never shows $0.00 as though it had been counted (DR-0076). No money moves in the app (DR-0094).

`re-review: 2026-10-24` — on the live app:
- record a past payment on an empty door (805 Apt 2) and on a rented door;
- confirm both appear in Payment history and History, and that the header, board card and portfolio totals change by the amounts recorded;
- from a tenant seat, confirm only their own payments show.

## Verification

- **The database.** `infra/supabase/tests/0265-door-money-smoke.sql` runs in the `door-work` CI leg after 0265 applies twice, and in the live rls-isolation poe-properties leg. It proves:
  - the owner records money received on an empty door, months back;
  - refused: a payment on neither a tenancy nor a door; a door-level payment by a tenant, or in a tenant's name even by the owner; a day not yet come; a door that does not match the tenancy; a door from another instance;
  - a tenant's report finds its door by itself;
  - the door keeps the old tenant's money after a new tenant moves in, while each tenant reads only their own and a stranger reads nothing;
  - a reported payment is never counted as received;
  - a manager reads door B by grant, sees nothing of door A, and records only with `rent.confirm` on that door;
  - the clock carries the day the money came and the door.

  Measured locally on PostgreSQL 16.15: all six door smokes (0260 through 0265) pass together on the exact CI chain.
- **Proven to catch.** Each of these breaks failed the smoke by name:
  - dropping the door trigger;
  - dropping the family-only CHECK;
  - dropping the tenancy-or-door CHECK;
  - counting reported payments as received;
  - running the view as its definer;
  - opening the door read policy to everyone;
  - removing the capability from the door insert policy;
  - removing `paid_on` from the clock.

  The first run showed that a NULL-unsafe comparison let the clock break pass, and a policy refusal hid the family-only CHECK. Both checks were tightened before shipping.
- **The app.** `the-door-keeps-its-money.test.jsx` (8 tests) covers:
  - the totals, years and months;
  - that a reported payment is never added;
  - the portfolio total;
  - that an unknown door never reads $0 (proven to catch);
  - the received-payment form's refusals;
  - the landlord's real journey on an empty door: written on the door, confirmed, on the day it came, with no tenancy;
  - a rented door, which records against its tenancy and still names the door;
  - the board's per-door lines and portfolio line;
  - that a tenant never sees the family's money card or the form. This was proven to catch by removing the family guard.
