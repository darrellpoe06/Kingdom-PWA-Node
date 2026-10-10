# DR-0859 — Work is filed on the door, not only on a tenancy

**Date:** 2026-10-10
**Status:** accepted
**Area:** Poe Properties: Work board, Dispatch, job documentation (migration 0260)
**Principle:** DR-0076 (no claim without evidence; proven-to-catch), DR-0060 (RLS is the gate), DR-0061 (a surface is a live view of real state), DR-0219 (SHOULD / ARE / GAPS / CLOSE), DR-0236 (nothing waits); extends DR-0837 (the work is an option of the door) and 0185 (a delegate reaches a door, not only a tenancy)

## Context

Darrell, 2026-10-10, with two screenshots of the Work board on 805 North Prospect Avenue Apt 2. The door reads "No tenancy on this door". The job *"Add a microwave and cabinet with exhaust fan inside the kitchen."* is typed in, and FILE IT is greyed out:

> "Can't file a workorder in the Poe Properties App?!!!! Fix it!!!!!!" ... "They obviously should be able to!!!!!!!!!!!!!!" ... "Any property including our home... if we want to have a 1099 worker come take care of work... right?!!!!!" ... "So even a person walking through an Airbnb or short-term rental works great for getting work done or issues with systems or cleaning done asap... make sense?"

**SHOULD.** Any door the family owns can carry a work order: a rented unit, a vacant unit between tenants, a door offered as a short stay, and the family's own home. 0156 already says the home keeps "a mechanical history of the systems and issues like all our properties." The people who can file include the landlord, a manager, and the 1099 worker or cleaner standing in the door. The worker documents the job, and "Fixed" closes it.

**ARE.** A work order could only exist through a tenancy:
- 0055 made `tenant_maintenance_requests.tenancy_id` NOT NULL. 0075 and 0150 did the same for `request_documentation` and `tenancy_notes`.
- The app's Work board took its door from `activeDoor`, which is a tenancy, and disabled File it without one.

## What was measured

- **The screen.** The screenshots show "No tenancy on this door" on Apt 2. The code comment on DoorsBoard's `onPick` records that every door on this account has no tenancy today. So `doors` was empty, `activeDoor` was null, and `disabled={!title.trim() || !door}` held the button shut on every door.
- **The schema.** `tenancy_id uuid NOT NULL` on all three tables. Even with the button enabled, the insert would have failed.
- **A second, latent defect.** `activeDoor = doors.find(...) || doors[0]`. A vacant door, picked by its rentals id, would have fallen back to some OTHER door's tenancy. Once any tenancy existed, its work would have been filed against, and shown on, the wrong door.
- **A third defect, found by tracing the worker's "Fixed".** The app set the request to resolved after a Fixed documentation. A 1099 worker holds no UPDATE arm on requests; only management does. So for the worker, that second write was refused and the job stayed open.

## Impact

Until this ships, no work order can be recorded on any door on the account: no turn work between tenants, no short-stay cleaning or system issue, and no job on the family's own home. The microwave, the ductwork, and the exhaust fan on Apt 2 have no record in the app. A dispatch to a vacant door cannot leave its note.

## Decision

A row now names its **door** (`rental_id`, a reference to `rentals.id`), its **tenancy**, or both. At least one is required, enforced by a CHECK on all three tables (migration 0260).

1. **Who sees and acts on door-level work.**
   - **The family:** the existing first arm of every policy, `user_role_in_instance(instance_id)`.
   - **A delegate on that door:** new additive policies through `user_delegated_can_rental()` (0185's predicate, restated in 0260 so the file stands alone).
     - Read: `request.manage`, `property.history`, `docs.add`.
     - **File:** `request.manage`, or `docs.add` (the worker or cleaner walking the door). Only as themselves (`created_by = auth.uid()`) and only as worker or manager.
     - Move or assign: `request.manage` only.
     - Document a job or add a note: `request.manage` or `docs.add`.
   - **A tenant or household member:** sees none of it. Every tenancy arm is false on a NULL tenancy.
2. **Walls the database keeps on its own.**
   - A row's door must be in the row's instance (trigger), so one landlord cannot hang a row on another's door.
   - Documentation takes `instance_id`, `tenancy_id` and `rental_id` from its request before RLS reads it (trigger), so a client cannot lie about the scope.
   - A `fixed` documentation resolves its job once and never reopens a closed one (trigger). This closes the worker defect.
3. **The app.**
   - The Work board, Dispatch, notes and documentation work against `workDoor`: the tenancy when somebody lives there, otherwise the door itself.
   - A rented door's job also names its door, so the door keeps its history across tenants.
   - A door picked by its rentals id never borrows another door's tenancy.
   - A 1099 worker may file on a door they were granted. On a tenancy door they still document rather than file, as before.
4. **The guest with no account is the next build, not this one.** This decision covers the guest who reports a problem from inside a short stay, using a link or QR code on the door without signing in. That is a new public write path. It will follow the walled no-account pattern of 0152 (vacancy applications) as its own decision.

`re-review: 2026-10-24` — confirm on the live app that a work order filed on 805 Apt 2 and one filed on the family's home are both read back on the Work board, and that a worker invited to a door can file and mark it Fixed. If the guest door is still unbuilt, that is the first item.

## Verification

- **The database, on a real PostgreSQL** (new CI leg `app — door work orders (PostgreSQL)`, part of the required check):
  - The chain applies in order: the real schema files, then 0055 → 0062 → 0075 → 0150.
  - 0260 applies twice (idempotent).
  - `infra/supabase/tests/0260-door-work-orders-smoke.sql` passes. It covers 20 assertions across the landlord, home, worker, manager, tenant, stranger and second-landlord seats.
  - Measured locally on PostgreSQL 16.15: `DOOR WORK SMOKE: PASS`, from a fresh database.
- **Proven to catch.** Each of the five walls was removed in turn, and the smoke went red, naming the broken assertion:
  - scope trigger → "W documents the job on V while naming the home"
  - instance trigger → "O2 files in I2 naming door V"
  - fixed trigger → "a fixed documentation left the job submitted"
  - door read policy → "W reads the job on door V"
  - names-a-door CHECK → "a job naming neither a tenancy nor a door"
  - Re-applying 0260 restored PASS.
- **The live database.** The same smoke joins the `poe-properties` leg of `rls-isolation.yml`, which runs against production with the real viewer and assistant overlays after db-migrate.
- **The app.** `app/src/__tests__/properties-work-on-any-door.test.jsx` mounts the real app with five cases:
  - Apt 2 with no tenancy: File it is live, and the row names `rental_id` with `tenancy_id` null.
  - A vacant door picked beside a rented one does not borrow the rented door's tenancy.
  - A rented door files through its tenancy and still names the door.
  - The home takes a work order.
  - A worker files as `worker`, and their Fixed carries the door.
  - All five fail against the previous `PropertiesApp.jsx` and pass on this one.
- **The existing suites.** The 39 Poe Properties, migration and RLS test files pass (787 tests). `verify:gates` is green, and the flow graph declares the work-order tables (`door-work-orders` node, 0 findings). Lint is clean.
