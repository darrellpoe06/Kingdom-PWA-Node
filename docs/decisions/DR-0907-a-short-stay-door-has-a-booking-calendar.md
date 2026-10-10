# DR-0907 — A short-stay door has a booking calendar

**Date:** 2026-10-10
**Status:** accepted
**Area:** Poe Properties: the public listing ("Book a stay") and the door's Stays tab (migration 0269)
**Principle:** DR-0094 (no money moves in the app), DR-0910 (the street is handed over on confirmation, never published), DR-0899 (the clock), DR-0076

## Context

Darrell, 2026-10-10:
- *"Calendar for booking the apartment?"*
- *"With blackout dates for already booked..."*
- *"Short term rentals need another form..."* (with a screenshot of the long-term rental application)
- *"We want to have an ability to have users keep their accounts and historical information so they can rebook the place asap"*
- *"Not 29 day cap?... why?"*
- *"we like getting emails and other connections data for clarity on users preferences... may end up offering products inside the apartment for repeat stays"*

The research note (`docs/99-session-notes/2026-10-10-short-stay-agreement-requirements-research.md`) sets the guardrails:
- the state hotel tax and Champaign's 7% cover stays under 30 consecutive days;
- a 30+ night stay may start to look like a tenancy (on the ask-counsel list);
- the minimal lawful guest verification is a lead guest 21+ and a photo ID viewed once, never stored;
- fair-housing law applies.

## What was measured

- A short-stay door could be offered with a nightly rate (0155) and listed (0152). Nothing held a night: no stay, no blackout, no way to ask, nothing to stop a double booking.
- The only way in from the public listing was the long-term rental application, which asks for landlord history and a current address.

## Impact

Short stays were taken by hand, with no calendar the family or a guest could trust and no record of who stayed or what they liked. A guest met a lease application to book two nights.

## Decision

1. **`door_stays` (0269)** holds guests' stays and the family's blackouts. Nothing is deleted. A stay moves requested → confirmed, declined or cancelled, and a confirmed stay can be cancelled.
   - **No double booking:** enforced by the database. A trigger locks the door's row, so two confirmations at the same instant are made one after the other and the second is refused. No extension to install on the live database.
   - **Guest cap:** a guest's own ask is at most 29 nights. The family may enter any length itself; the cap protects by default, and the owner decides.
2. **The public calendar (`door_booked_nights`)** returns taken ranges only, for a listed short-stay door: never a name, a phone or a reason.
3. **The short form ("Book a stay — no account needed").** Taken nights show dark. The guest taps the arrival night, then the day they leave, and sees the nights and the total. They give:
   - name and a phone or email;
   - "I am 21 or older and will show a photo ID at check-in";
   - "I accept the house rules";
   - what would make the stay better;
   - an unticked "Send me offers for my next stay by email".

   `request_a_stay()` checks all of it again: open nights, a listed short-stay door, first night not past, at most three open asks per contact.
4. **Preferences and consent.** The guest's wishes and their email offers yes are kept, the yes with its moment. A yes with no email is not kept, and every offer email must carry an unsubscribe (CAN-SPAM). A text-message yes is separate and never inferred from it (TCPA).
5. **Rebooking.** A guest with an account (phone and PIN) reads their own stays. The family may attach a stay booked without an account to a guest's account, once. A stay that belongs to someone is never re-pointed, and an unproven phone number never claims someone else's history.
6. **The family's Stays tab:**
   - asks with contact, wishes and the offers yes, each with Confirm or Decline;
   - what is coming up, with Cancel;
   - Black out nights (the reason is only theirs);
   - "Enter a stay yourself" at any length, with a note that over 29 nights the lease is worth considering;
   - past stays with what each guest wished for.
7. **On the listing:** a short-term door shows "Book a stay". A long-term door shows "Apply for a lease". A door offered both ways shows both.
8. **Still to build, tracked:** a signed-in guest's "My stays / Book again" screen; the short-stay agreement e-signed on confirmation (the counsel rule applies to its wording); the camera link and later the lock window filled from a confirmed stay; payment through the Square link. Each lands with its own proof.

`re-review: 2026-10-24` — on the live listing:
- book 2 nights at 805 N Prospect Apt 2 from a phone with no account;
- confirm it in the Stays tab;
- check the nights show dark on the public calendar;
- black out a weekend;
- cancel the stay and check its nights reopen.

## Verification

- **The database.** `infra/supabase/tests/0269-booking-calendar-smoke.sql` runs in the `door-work` leg and the live rls-isolation leg. It proves:
  - a blackout shows to the public as a range with no reason;
  - refused: taken nights, a missing attestation, 30 nights by a guest, a door not taking stays, an unlisted door, a past first night, a fourth open ask;
  - the family's 60-night stay is allowed;
  - wishes and the offers yes are kept with their moment, and a yes with no email is not kept;
  - nobody but the family reads the rows;
  - confirm names who decided, and a blackout over a confirmed stay is refused;
  - a stranger cannot change or claim a stay;
  - cancel reopens the nights and is final;
  - the family attaches a stay to a guest's account once and never re-points it, and the guest then reads exactly their own;
  - the clock reads blocked, then asked, confirmed, cancelled in order.

  Proven to catch, each failing by name: no overlap trigger, no guest cap, a family read open to all, a leaking public calendar, no update trigger, an RPC that ignores the attestations, no clock. All nine door smokes (0260 through 0269) pass together on the CI-shaped chain.
- **The app.** `a-short-stay-door-has-a-booking-calendar.test.jsx` (7 tests) covers:
  - night arithmetic and the month grid;
  - the guest's checks: a taken night, past, over the limit, a missing attestation (proven to catch);
  - the desk's sorting;
  - the full guest form: dark nights, tap in and out, the total, both attestations, wishes, and the unticked offers box sent as false;
  - an over-taken range refused before sending;
  - the family's confirm, decline, cancel, blackout and a two-month stay entered by hand.
