# DR-0842 — Every seat a person holds, and every seat they have walked

- **Status:** accepted
- **Tier:** A for this slice (a read of rows the steward already reads, shown in the Known fold); the next slice (a training lane for a seat a child does not yet hold) is Tier B and gets its own record
- **Type:** feature
- **Date:** 2026-10-09
- **Scope:** `app/src/lib/apprenticeship.js` (new, pure: `SEATS`, `seatsHeld`, `seatsWalked`, `seatsToWalk`, `apprenticeshipLine`), `app/src/lib/person-record-sync.js` (`loadSeatRows`), `app/src/components/PersonRecord.jsx` (the Seats section of the Known fold), `app/src/__tests__/apprenticeship-seats.test.jsx` (4), `roster-named-from-your-contacts.test.jsx` (mock widened).
- **Principles:** DR-0828 (everything on record for a person, in one read), DR-0839 (the way to grant each seat is a placement that exists), DR-0145 (a person's opens are read only by a steward of one of their spaces), DR-0104 (reviewing is looking; running a seat is real), DR-0076 (held comes from rows, walked from opens; a refusal is said), DR-0236 (the first slice is built now; the training lane is named, not deferred silently).
- **Grounds:** Darrell, 2026-10-09: *"I want my kids to see how to manage these systems from all positions so they can learn how to navigate life and experience running our businesses... make sense? Before they need to..."*

## Context

The platform holds the family's work in seats: tenant, household member, 1099 worker, manager and landlord on Poe Properties; church member; business member; family. A child learns a seat by holding it and doing what it does, on the real system, before the day they must. Nothing showed a parent which seats a child holds, which they have actually used, and which are still to come. Reviewer mode (DR-0104) looks as a stranger; it does not run a seat.

## What was measured

- The rows that say a seat is held: `instance_members` per space the steward administers (`listInstanceMembersStrict`), `property_access_invites` for the Poe Properties roles (`loadInvites`, theirs by `claimed_by` or email). The rows that say it was walked: `user_usage_metrics` (0145), one row per view name with opens in 30 days; the shell records the top-level view id (`recordView(view)`, `poe-financial-mvp-v28.jsx` 1036).
- The Known fold (DR-0828) already read a person's devices and doors; a seats read fits beside it with the same honesty rules.

## Impact

- Unresolved: a parent cannot tell, from the app, which positions a child has held or touched; "before they need to" has no measure.
- The call obligates: held is read from rows, walked from opens, and the seats not yet held each carry the exact placement that grants them (DR-0839), so the next step is one tap away, never a plan.

## Decision

1. **The seats catalog** (`SEATS`): each seat with where it lives, what it does in plain words, the views it is walked in, and how it is granted.
2. **Held:** memberships map to landlord (owner of Poe Properties), manager (any other member of it), church, business, family; Poe Properties invites map to tenant, household, 1099 worker, manager, claimed or not yet signed in; one entry per seat and place.
3. **Walked:** the opens of that seat's views in the last thirty days, and when last; a server that will not say (not a steward of their spaces) is said as such.
4. **Not yet:** every seat not held, with its placement.
5. **Named, built next (Tier B, its own record):** the training lane: a child opens a seat they do not hold on a practice door or a practice space with real screens and no real money, with a checklist of what the seat does ticked as they do it, and the parent sees the walk. Until then, the honest way to walk a seat is to hold it: place the child as a tenant on a real door, a worker on real jobs, a viewer on the books.

## Verification

- `apprenticeship-seats.test.jsx`: held from memberships and invites (one per seat and place; another person's rows, a revoked invite and a stranger's invite left out; the owner of Poe Properties is the landlord); walked as the opens of the seat's views and not yet with the way to grant each; the catalog whole; the line with usage, with a refusal, with nothing held; `loadSeatRows` reading each administered space and keeping only this person, with the invites and the usage, and every read refused answered as empty with `invitesOk: false`; the Known fold rendered for a child holding family and a tenant seat showing the line, which seat was walked, what each seat does, and the six not yet with the placement.
- The roster and person-record suites still green; eslint clean.
- `re-review: 2026-10-23`: the training lane record, and whether the Poe Properties door records its views (today only the PoeTech shell records, so a tenant seat walked on the door app reads as not walked here; that gap is named in the fold's wording and closed by recording views on the door).
