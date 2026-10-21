# DR-1159: A tenant sees their own tenancy, from the day it became theirs — the landlord sees every tenancy the door has had

**Date:** 2026-10-21
**Status:** accepted
**Tier:** C (RLS: migration 0306 narrows the tenant's read, carried with its proof on a real PostgreSQL in CI, DR-0225)
**Type:** product (privacy) + data wall
**Area:**
- `infra/supabase/migrations-auto/0306-a-tenant-sees-their-own-tenancy-from-the-day-it-became-theirs.sql` (new): `rental_tenancies.tenant_from`, the trigger that stamps it, `tenancy_row_in_tenant_window()`, one RESTRICTIVE read policy on each of seven tables
- `infra/supabase/tests/0306-tenant-window-smoke.sql` (new), run twice-applied in `ci.yml`'s door-work leg and on the live database in `rls-isolation.yml`'s poe-properties leg
- `app/src/modules/properties/model.js`: `tenancyHasTenant`, `tenantSightStart`, `forThisTenancy`; `unseenByThisFace` names where a tenant's history begins
- `app/src/modules/properties/staging.js`: `tenancyForTenantInvite`
- `app/src/modules/properties/cloud.js`: `loadDoorRecord` reads every tenancy the door has had, for the landlord's faces
- `app/src/modules/properties/PropertiesApp.jsx`: the tenant and household faces read `seen` on every tab; the landlord's door notes join the history for the landlord's faces only; a vacant door says so; a tenant's invitation lands on a tenancy that is theirs
- `app/src/__tests__/a-tenant-sees-their-own-tenancy.test.js` (new, 17 cases)

**Grounds:** Darrell, 2026-10-21, with a screenshot of 805 North Prospect Avenue Apt 2 "Seen as a tenant", History (2): a LANDLORD NOTE of 7/6/2026 about the previous tenant moving out without cleaning or returning the keys, and a landlord MESSAGE of 10/10/2026, "Testing the process....". The door has no tenant. The same page said "Your landlord's own private notes about this property are not part of your history." His words: **"A new tenant should only see their history... the landlord should see all historical events and data make sense?"** Then, over the same preview's Documents tab: **"Should be their lease etc... all tabs should make sense."**
**Principles:** DR-0061 (a surface is a live view of real records; reality-trace first); DR-0076 (proven to catch; a surface does not say what is not so); DR-0876 (a face names what it is not shown); DR-0104 (the reviewer's preview is the user's real screen); DR-0870 / DR-0904 (the vacant unit record and the door's own tenancy); DR-0313 / DR-0365 (Poe Properties' instance)

## Context

A new tenant's screens showed history that was not theirs: the landlord's own note about the previous tenant, and a test message written on a door with nobody in it. The page beside them promised the opposite. Darrell asked that a tenant see only their own history and the landlord see all of it, on every tab.

## What was true (the trace)

1. **The preview leaked; the real tenant did not, for the note.** `PropertiesApp` passed the door's `property_notes` into `buildHistory` for every face. The comment on `buildHistory` said "the caller passes it in solely for the management face", and the caller did not. A real tenant's RLS returns no `property_notes`, so the 7/6 note was invisible to a signed-in tenant. In the landlord's preview, though, the rows were read under the landlord's RLS, so his own note appeared under the tenant's heading. DR-0104 says the preview is how the stewards check the tenant's screen, so a preview that shows more than the tenant gets is a false check.
2. **The preview also read the whole door.** `loadDoorRecord` reads the tenancy's rows and the door's own rows (`rental_id`). The tenant face showed both, including work, notes and payments filed on the door itself, which no tenant is granted.
3. **The database had a real hole (not shown in the screenshot).** A tenant reads a tenancy through `user_is_tenant()` and `user_is_tenancy_household()` (0150). These ask whose tenancy it is, never since when. The 10/10 message sits on Apt 2's vacant unit record (DR-0870). Inviting a tenant from the People tab used `ensureDoor()`, which returns that same record, and the claim (0151) writes the new tenant's account onto it. From that moment every message, note, work order, payment, notice and paper the landlord had written there was the new tenant's to read. `ensureDoor()` also falls back to a door's first tenancy, which can be an ENDED one, so a previous tenant's whole record could be handed to the next.
4. **The landlord did not see every tenancy.** The landlord's door history read only the current tenancy and the door's own rows. Earlier tenants' messages and work orders were not on it.

## Decision

1. **A tenancy carries `tenant_from`: the moment it first had a person on it** (a name, an email, a phone or an account). A row born with a person opens its window at birth. A vacant unit record opens its window when its first person lands on it. An account replacing a different account opens it again. An ENDED tenancy claimed by an account whose email or phone is not the one on the row opens it again: the old tenant's record stays theirs. The tenant the row names still sees all of it if they sign in later. The landlord may set `tenant_from` by hand, and the trigger keeps an explicit value.
2. **A tenant or household member reads a row of their tenancy only if it was written at or after `tenant_from`.** This applies to messages, notes, work orders, job documentation, payments, notices and papers. It is one RESTRICTIVE read policy per table beside the existing ones, so no earlier policy is rewritten. The landlord's side (owner, admin, member) and every delegate read as before. Signatures and the change clock (`door_events`) follow their parent rows.
3. **The screen applies the same rule, so the preview tells the truth.** The tenant and household faces read `forThisTenancy`: this tenancy's rows from `tenant_from` (or the row's birth) on, never a door-level row and never another tenancy's. This holds on History, Messages, Work orders, Payments and Notices, and on the change clock under them. The landlord's door notes join the history only for the landlord's and manager's faces.
4. **Every tab makes sense on a door with nobody in it.** The tenant face says "Nobody lives at this door yet" and explains what a tenant will see. My place says there is no lease yet. Documents reads no tenancy. On a tenancy, My place says when its record begins and that the lease and its papers are under Documents. History's "what this face is not shown" names the day the tenant's history begins.
5. **A tenant is invited onto a tenancy that is theirs** (`tenancyForTenantInvite`). A vacant unit record is given their name and contact first, which opens their window and lets a lease filed after the invitation reach them. A tenancy already in their name (same email or phone) is used as it is. An ended tenancy, or one in someone else's name, is never reused: a new tenancy is started for them.
6. **The landlord sees every tenancy the door has had.** `loadDoorRecord` reads all of the door's tenancies for the owner and manager faces, plus the door's own rows. A tenant's read stays their own, and RLS withholds the rest from them regardless.

## Impact

- **Tenants:** a signed-in tenant or household member no longer reads anything written on their tenancy row before it became theirs. This covers messages, notes, work orders, payments, notices and papers. A vacant door's preview shows an empty, explained face.
- **Landlords:** the owner and manager faces lose nothing. They gain every earlier tenancy on the door's history. Their own door notes stay off the tenant's screen.
- **Existing records:** 0306 backfills `tenant_from` from the row's birth. A unit record claimed with no name on it is backfilled from its claim. A tenant who was reading vacancy-era rows on such a record stops seeing them, which is the point.
- **The obligation it creates:** a lease filed on a vacant record before the invitation named the tenant is not theirs to read until the landlord moves `tenant_from` back. The re-review checks for this case. No price, gate or public page changes.

## Verification

- `a-tenant-sees-their-own-tenancy.test.js`: **17 pass**, with Apt 2's own events as fixtures (the 7/6 note, the 10/10 message). Proven to catch, each by loosening `forThisTenancy` and re-running:
  - dropping the date window → 4 fail (the 10/10 message reaches the new tenant);
  - dropping the tenancy match → 1 fail (a door-level and another tenancy's work order reach them).
- `0306-tenant-window-smoke.sql` on a real PostgreSQL 16 (the door-work chain, 0306 applied **twice**): **PASS.** Proven to catch, each by breaking the live function or trigger and re-running:
  - the window open to everyone → FAIL "the new tenant read 2 messages on V";
  - no restrictive policy on notes → FAIL "the new tenant read 1 vacancy-era notes";
  - an ended tenancy never reopening → FAIL "a stranger on an ended tenancy read 1 of the old tenant's messages";
  - a vacant record keeping its birth date → FAIL "V's window opened at [a month ago]";
  - every claim reopening → FAIL "the tenant the ended tenancy names read 0 of its messages".
- With 0306 applied, the existing smokes still pass locally: 0260, 0261, 0262, 0263, 0264, 0265, 0266, 0275, and 0150's isolation smoke. 0207's could not run on this replica because it needs columns the replica lacks; the live leg runs it.
- Migration guards: rls-isolation-matrix, replay-order, replay-completeness, smoke-sql-language, return-type, inline-constraint, newest-definition. All OK.
- **Not verified here:** the live database's existing tenancies after the backfill. The sandbox has no route to it; the rls-isolation leg runs 0306 and its smoke there on the next dispatch.
- **re-review:** 2026-11-04. Read Apt 2 "seen as a tenant" on the live build, and one real tenant's screen after a move-in. Record whether any tenant lost sight of a record that was theirs. The case to look for is a lease filed on a vacant record before the invitation named them; that tenant needs `tenant_from` moved back by hand.
