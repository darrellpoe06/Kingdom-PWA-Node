# DR-0870 — An empty unit is still a place: work orders and people before there is a tenant

- **Status:** accepted
- **Tier:** B (the landlord's primary write path)
- **Date:** 2026-10-10
- **Type:** product (defect, premise error)
- **Scope:** `app/src/modules/properties/staging.js` (`vacantUnitRow`, new), `app/src/modules/properties/PropertiesApp.jsx` (`ensureDoor`, `activeDoor`, `submitWorkOrder`, `sendMessage`, `addNote`, the invite handler, `WorkTab`), `app/src/__tests__/the-people-on-a-door-have-names.test.jsx`
- **Principles:** REALITY-TRACE (DR-0061/P15), SURFACE-PREMISE-CONFLICTS, VERIFICATION-DOCTRINE (DR-0076), SPEC-CONFORMANCE (DR-0219)
- **Grounds:** 0055 (`rental_tenancies`, `tenant_maintenance_requests`), 0150 (the RLS that scopes both by `tenancy_id`)

## The word, as spoken

Darrell, 2026-10-10, on the WORK BOARD of 805 North Prospect Avenue Apt 2 —
the card above reading "No tenancy on this door" — with "Add a microwave and
cabinet with exhaust fan inside the kitchen." typed in and FILE IT dead:

> "Workorders don't work... can't send...!?!!!!!"

Minutes earlier, the same landlord, on the same property, with the invite panel
filled in and WRITE THE INVITATION greyed out.

## What was measured

```
tenant_maintenance_requests
  tenancy_id  uuid NOT NULL REFERENCES rental_tenancies(id)   -- 0055:135
```

and in the app:

```js
const activeDoor = doors.find((x) => x.id === activeId) || doors[0] || null;  // doors = rental_tenancies
const submitWorkOrder = async (form) => { if (!activeDoor) return; ... };      // silent
<Btn disabled={!title.trim() || !door}>File it</Btn>
<Btn disabled={!identified || !door}>Write the invitation</Btn>
```

**One cause, four dead surfaces.** A landlord standing on a property with no
tenancy row has `activeDoor === null`, so: FILE IT disabled, WRITE THE
INVITATION disabled, `sendMessage` returned silently, `addNote` returned
silently. None of the four said why.

The premise under the schema is wrong, and it is worth naming plainly: it
encodes *work only happens where a tenant already lives.* The single most
ordinary landlord job there is — fixing up an empty unit before anyone moves
in, which is exactly what he had typed — had nowhere to go.

A second defect found in the same line: `|| doors[0]`. Picking a property with
no tenancy while holding tenancies elsewhere silently selected **a different
property's door**, so a work order filed there would have attached to the
wrong place. Never reported, because the first bug stopped anyone reaching it.

## Impact

Fixing the schema properly — `tenancy_id` nullable plus a `rental_ref` — means
reworking the RLS on five tables that all scope by `tenancy_id` (read, insert
and update policies on requests, messages, notes, rent and job docs). That is
a security-tier change that cannot be verified from this sandbox, and it would
have blocked the fix behind a migration he cannot use today.

So the call is deliberately made on the app side, and the honest limit is
stated: **`tenant_maintenance_requests.tenancy_id` stays NOT NULL.** A work
order still belongs to a tenancy row; what changes is that a tenancy row no
longer has to contain a tenant.

## The decision

1. **A unit with no tenant is a tenancy row with no tenant in it.**
   `rental_tenancies` already allows this with no migration: every tenant
   column is nullable (0055:59-65) and `'pending'` is a legal status
   (0055:70-71). `vacantUnitRow()` builds exactly that row.
2. **`ensureDoor()` makes it on demand.** Filing work, inviting a person,
   sending a message or adding a note on a property with no door record
   creates the record first, then does the thing, and **says that it did**:
   *"Work order filed. This unit had no record yet, so one was created for
   it."* No extra tap, no silent magic.
3. **When someone moves in, that same row is filled, not replaced** — so the
   work history of the empty unit stays attached to the place it happened.
4. **`activeDoor` never falls back to another property.** A fallback to
   `doors[0]` is correct only when nothing has been picked yet.
5. **Every one of those four surfaces says why when it cannot act.**

## Outcome

Covered by `the-people-on-a-door-have-names.test.jsx` (31 green): the vacant
row carries no tenant, uses a status the CHECK constraint actually permits,
carries the **slug** in `rental_ref` (the TEXT key — handing over the UUID is
the 2026-08-27 incident that silently emptied Rooms and Photos on every door),
and refuses rather than writing a row with no home. Source pins assert the
`doors[0]` fallback is gone and that both write paths route through
`ensureDoor`. Properties suites: **108 tests green**; eslint clean.

Not proven from here: the live insert against real RLS. The policy reads
`user_role_in_instance(instance_id) IN ('owner','admin','member')` for
`rental_tenancies_insert` (0055:111-112), which the landlord satisfies on his
own instance — but that is a read of the policy, not a live write.
**Verify on the deployed build before calling this closed.**
`re-review: 2026-10-17`.
