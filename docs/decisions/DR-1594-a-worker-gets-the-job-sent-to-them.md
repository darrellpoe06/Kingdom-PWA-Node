# DR-1594: A 1099 worker gets the job sent to them

**Date:** 2026-11-19
**Status:** Accepted
**Tier:** B (RLS on work orders, additive; a backfill of existing invites by Darrell's direction)
**Type:** fix
**Area:** Poe Properties: the invite form, `property_access_invites`, `tenant_maintenance_requests`, `request_documentation`
**Pairs with:** DR-0313 (invite by phone), DR-0837 (the dispatch is a record), DR-0897 (work on the door), DR-0869 (names), DR-0060 (RLS is the gate), DR-0076 (proven-to-catch)

## Context

Darrell, 2026-11-19: *"We add Coreyon as a 1099 worker and he is not getting the work orders!!!!!!!???!!! Isaiah Ramos either!!!!!!? Find and fix it!!!!!!"*

The chain, traced on main at 020636a: the landlord invites a worker on a door (`PeopleTab`) → a `property_access_invites` row → the worker signs in and the app calls `claim_property_access()` (0151) → the claim grants each capability ON the invite that sits inside the field worker's ceiling (`property.history`, `docs.add`) → the app calls the person a field worker only when they hold one of those → work orders are read under RLS, by tenancy (0150) or by door (0260), and every arm asks for a grant.

Four places where that chain left a worker with nothing:

1. **The invite form started with both boxes unchecked** (`useState([])`, reset to `[]` on role change and after send). An invite sent as the form stood carried `capabilities '{}'`; the claim granted nothing; the app did not even recognise a field worker; RLS hid every work order. PoeTech's "People you know" sent the full set, so the door form was the only road that did this.
2. **Assigning a job gave the worker nothing.** Dispatch writes `assigned_to`; no policy read it. 0310 already had `user_is_assigned_to_request()` for the job's pictures, and nothing used it for the job itself.
3. **A job sent by name before the worker signed in** carries `assigned_to_label` only, and nothing filled `assigned_to` when they did.
4. **Invites already written** with no capability stay empty on the live database.

## What was measured

- `PropertiesApp.jsx` PeopleTab on main 020636a: `const [caps, setCaps] = useState([])`, reset to `[]` on role change and after send; PoeTech's `people-placement.js:88` sent `['property.history', 'docs.add']` for the same role.
- Every SELECT policy on `tenant_maintenance_requests` (0150:215, 0260:215) and `request_documentation` (0150:263, 0260:235): none names `assigned_to`; 0310:72 `user_is_assigned_to_request()` was used only for `property_photos`.
- `claim_property_access()` (0151) writes `assigned_to` nowhere; `dispatchRecord` sets `assignedTo: worker.userId || null`.
- `loadMyGrants` (cloud.js:163) selected `delegated_capabilities` with no grantee filter; 0075:93 lets an owner read every row of the instance; `realRole` reads grants before ownership.

## Decision

1. **The form starts checked.** A 1099 worker starts with the field worker's whole ceiling; a manager with the set "People you know" sends (no balance adjustment). Unchecking every box disables the button and says why, and `inviteToProperties` refuses `no-capabilities` before the row exists. Tenants and household members are unchanged (they hold no grant).
2. **Migration 0337** (additive; no existing function or policy is redefined):
   - `tenant_maintenance_requests_assigned_read`: `assigned_to = auth.uid()`.
   - `request_documentation_assigned_read` / `_assigned_insert`: the assigned worker reads the job's notes and adds his own (`author_user_id = auth.uid()`). Still no UPDATE arm; "fixed" closes the job through 0260's trigger, as before.
   - `my_assigned_work_orders()`: the caller's assigned jobs across every door with the door's label and street only, for the worker's own list.
   - A trigger on the claim: open jobs in the invite's instance whose `assigned_to_label` matches the invited name (trimmed, any case) and have no account become the worker's. When two people in that instance were invited under one name, nothing is matched. 0262's `door_events` trigger records each assignment on the job's timeline.
3. **The backfill, by Darrell's explicit direction for the workers he invited:** every NOT revoked `field_worker` invite with no capability gets the ceiling; every worker who already claimed one is granted the ceiling on the invite's scope (else `'*'`). An existing grant row is left as it is, so a deliberate `deny` stays. Revoked invites, other roles, and anything outside the ceiling are not touched. Workers who already signed in are given the jobs sent to their name before they did.

4. **The owner stays the owner.** 0075 lets an owner read every grant in his instance, and `loadMyGrants` did not filter by grantee. The app reads the role grants-first, so a landlord whose workers held grants would have met the worker's face in his own app. This had stayed hidden only because his workers' invites were empty. The read now names the signed-in person (`grantee_user_id = me`), and signed-out reads nothing.

## Verification

- `infra/supabase/tests/0337-worker-assigned-jobs-smoke.sql`, on PostgreSQL 16 after the ci.yml door-work chain plus 0151/0306/0310/0337: PASS. Without 0337 it fails at "W1 reads his job on door H"; without the claim trigger at "the job sent by name was not given"; without the backfill at "the claimed empty invite now carries {}". With 0337 applied, the 0260, 0264, 0306 and 0310 smokes still PASS.
- `a-worker-gets-the-job-sent-to-them.test.jsx` (17): with the role change reset to `[]` again, the two screen tests fail; with the grant read unfiltered, the owner test fails.

## Not done

The smoke is not yet wired into the `door-work` leg of ci.yml or the poe-properties leg of rls-isolation.yml: another session owns the CI lane today, and workflows are not edited here. `re-review: 2026-11-26` to wire it. The worker's cross-door "My work orders" list, the in-app notice of a new job, and the landlord's "why isn't he getting them" view follow in their own PRs on this DR.
