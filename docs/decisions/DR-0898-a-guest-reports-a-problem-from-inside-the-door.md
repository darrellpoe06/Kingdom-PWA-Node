# DR-0898 — A guest reports a problem from inside the door

**Date:** 2026-10-10
**Status:** accepted
**Area:** Poe Properties: short stays, the Work board, the office push (migration 0261)
**Principle:** DR-0897 (work is filed on the door), 0152 (no account to talk to us), 0220 / DR-0334 §4 (a push names who and where, never the words), DR-0076 (proven to catch), DR-0060 (RLS is the gate), DR-0236 (nothing waits; activation is per door, by the family)

## Context

Darrell, 2026-10-10, after DR-0897:

> "So even a person walking through an Airbnb or short-term rental works great for getting work done or issues with systems or cleaning done asap... make sense?"

**SHOULD.** Everyone who walks a door can report what they see, quickly:
- the family;
- a manager;
- the 1099 worker or cleaner (DR-0897);
- the **guest** in a short stay.

A guest has no account and should not need one. 0152 already settled that someone who has committed to nothing does not have to sign up to talk to us.

**ARE.** Before this, the only way in for a guest was to be invited to a tenancy. A short stay has no tenancy, so a guest had no way to report anything in the app.

## What was measured

- `rentals.offering` (0155) marks a door as offered long-term, short-term, or both. Apt 2 at 805 North Prospect was named as the short-stay door.
- `tenant_maintenance_requests` admitted no `guest` role: its CHECK allowed tenant, household, worker, manager and landlord (0150).
- `anon` holds no grant on the work tables. The only public write path into this module was `rental_applications` (0152), and nothing there reaches the Work board.

## Impact

Until now, a broken fan, a missing towel, or a leak in a short stay reached the family only by phone. The fix landed on no record, and the cleaner coming next did not know about it.

## Decision

1. **A card per door, opened by the family.**
   - `door_guest_link_open(rental)` mints a 64-hex key from two v4 UUIDs.
   - The key is kept in `door_guest_links`, which only owner/admin/member can read.
   - Opening a door's card again replaces the key, so every old printed copy stops working. `door_guest_link_close` ends it.
   - **Nothing is on until the family opens a card, one door at a time.**
2. **What a guest may do.**
   - `guest_report_door(token)` returns the door's display name and unit. No address, no rent, no people.
   - `guest_report_problem(token, title, detail, name, contact, urgent)` files one work order on that door. It has `created_by_role = 'guest'`, no tenancy, and no account.
   - The guest reads nothing back.
3. **Walls the database keeps.**
   - A live key is required.
   - Lengths are bounded.
   - At most **five reports per door per hour and twenty per day**, after which the guest is told to call or text the host.
   - The office push (`push_outbox`, kind `door_guest_report`) names the door and whether it is urgent, never the guest's words. It is enqueued server-side and is best-effort.
4. **Why a key here when the apply code carries none** (apply-link.js). Applying grants nothing. A guest report writes onto the family's Work board and pings the office, so it is a permission, and a permission is carried by a revocable key.
5. **The app.**
   - **For the family:** the door's Work board shows a "Guests can report a problem" card. It offers Open, the code to print with the link to copy, New card, and Close it.
   - **For the guest:** the code opens `/properties/?report=<key>`. The form names the door, asks what is wrong (plus optional detail, name, contact, and an urgent box), says it was sent, and carries the 911 line for fire, gas or flooding. This works signed in or out.

`re-review: 2026-10-24` — open a card on 805 Apt 2, scan it from a phone that is not signed in, file a report, and confirm it is on the Work board and in the office outbox.

## Verification

- **The database.** `infra/supabase/tests/0261-guest-report-smoke.sql` runs on PostgreSQL in the `door-work` CI leg after 0261 applies twice. It also runs in the live `rls-isolation` poe-properties leg. It proves:
  - only the family opens and reads a card;
  - a worker, a tenant and anon read nothing;
  - the guest sees only the door's name, and a wrong key names nothing;
  - the report lands as `guest` with no tenancy or account, and urgent is honored;
  - the push names the door, not the words;
  - anon cannot read the board;
  - an empty title, a wrong key, and the sixth report in an hour are refused;
  - the worker granted the door sees the report, and another door's tenant does not;
  - a replaced card and a closed card stop working.
  - Measured locally on PostgreSQL 16.15: `GUEST REPORT SMOKE: PASS`.
- **Proven to catch.** Each break made the smoke fail by name, and re-applying 0261 restored PASS:
  - opening the card read policy to every signed-in user → "a worker reads the link";
  - letting anon read the card table → "anon reads the link table";
  - letting anon read the board → "anon reads the work board";
  - raising the hourly ceiling to 50 → "the sixth report in an hour";
  - putting the title into the push → "the office push is missing or carries the guest's words".
- **The app.**
  - `app/src/__tests__/guest-report.test.jsx` (6 tests) covers the address and form rules, the guest page (send, refusal passed through, dead card), and the family's card (off, open, replace, close).
  - `app/src/__tests__/guest-report-door.test.jsx` (2 tests) mounts the real door. A scanned key opens the form and files through `guest_report_problem`; without a key, the ordinary signed-out door shows. The first test fails against the previous `PropertiesDoor.jsx`.
- **The flow graph.** The `door-guest-card` node is declared with 0 findings.
