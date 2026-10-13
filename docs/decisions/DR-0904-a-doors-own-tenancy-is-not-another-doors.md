# DR-0904 — A door's own tenancy is not another door's, and that is where the messages went

- **Status:** accepted
- **Tier:** B (the record; a message that cannot be read back is a record that lies)
- **Date:** 2026-10-10
- **Type:** product (defect)
- **Scope:** `app/src/modules/properties/PropertiesApp.jsx` (`activeDoor`), `app/src/__tests__/a-message-stays-on-a-vacant-door.test.jsx` (new), `app/src/__tests__/the-people-on-a-door-have-names.test.jsx` (one source-grep pin retired)
- **Principles:** VERIFICATION-DOCTRINE (DR-0076 §3 proven-to-catch, §5 characterize before you change), HOLD-THE-HAND-OF-THE-PROCESS (DR-0621)
- **Grounds:** DR-0897 / migration 0260 (work is filed on the door), DR-0870 (`ensureDoor` mints a tenancy for a vacant unit), DR-0876 (a record that could not be read is not an empty record), DR-0901 (the door is in the URL, which is how this reproduces)

## The word, as spoken

Darrell, 2026-10-10:

> "Messages didn't stay either all your test have been superficial!!!"

Both halves are fair, and the second is why the first survived.

## What was measured

**The read is correct. The door was wrong.**

`loadDoorRecord` reads `tenant_messages` only when it has a `tenancy_id`, and
that is right: migration 0260 added `rental_id` to
`tenant_maintenance_requests`, `request_documentation` and `tenancy_notes` —
**and to nothing else.** `tenant_messages`, `rent_records` and
`tenant_notices` can only be found by their tenancy. So everything depends on
the app knowing which tenancy a door has.

`activeDoor` (PropertiesApp.jsx:371) decided that, and it said this:

```js
const byId = doors.find((x) => x.id === activeId);
if (byId) return byId;
if (activeId && rentals.some((r) => r.id === activeId)) return null;  // ←
return doors[0] || null;
```

The guarantee that line was added for is **right**: a vacant door must never
borrow `doors[0]`'s tenancy, which once filed a work order against an entirely
different property. But it threw away **this door's own tenancy** along with
the stranger's.

A vacant unit has no tenancy until `ensureDoor()` mints one on the first
message (DR-0870). From that moment the door *does* have a tenancy — and
picking the unit still resolved to `null`, because the board and the link name
a **rental**, and no tenancy carries a rental's id. So `tenancyId` stayed
null, the `tenant_messages` read was skipped entirely, and **every message
ever sent on that door became unreadable.** Written correctly. Kept
correctly. Never looked for.

The link was always there and was simply never followed:
`rental_tenancies.rental_ref` is the rentals **slug** (text, measured
2026-08-27 — the same key confusion that once emptied Rooms and Photos).

## Impact

A door's conversation is the record Darrell built the historical-accuracy
requirement around — *"so we can tell what has happened and who has been
misled or misunderstood"* (DR-0876). On every vacant unit that record was
empty while the database held it in full, and the surface said "No messages
yet", which is DR-0876's exact failure mode arriving through a different door:
an absence the app manufactured, presented as fact.

What the call obligates: the cross-door guarantee must survive the fix. A
message hidden is bad; a work order filed against someone else's property is
worse. Both are now held by rendered tests rather than by reading the source.

## The decision

Resolve the door's **own** tenancy by the key that links them, and return
`null` only when there genuinely is none:

```js
const picked = activeId ? rentals.find((r) => r.id === activeId) : null;
if (picked) {
  return doors.find((d) => d.rental_ref
    && (d.rental_ref === picked.slug || d.rental_ref === picked.id)) || null;
}
```

The id is accepted beside the slug because `vacantUnitRow` falls back to the
id when a rental has no slug.

## Outcome

`a-message-stays-on-a-vacant-door.test.jsx` — **3 green, by rendering.**

**ON TESTING, which is the real subject here.** Darrell: *"all your test have
been superficial."* He is right, and this defect is the proof. Two tests
already covered this code and neither could see it:

- `the-people-on-a-door-have-names.test.jsx` asserted
  `expect(app).toContain("rentals.some((r) => r.id === activeId)")` — a pin on
  one **spelling** of the fix. It would have passed happily while every
  message on a vacant door was invisible, because a string in a source file
  knows nothing about what the app does. **Retired**; what remains is only the
  thing a render cannot say, that the specific bad expression has not come
  back.
- `properties-work-on-any-door.test.jsx` stubs `createTenancy` as a no-op
  returning **no row at all**, so the minted-tenancy path this bug lives on
  does not exist in that harness.

The new file models the one schema fact that decides everything — a message is
found by `tenancy_id` or not at all — and mounts the app **at the unit's own
address**, which is what every reload and shared link now produces (DR-0901).
Mounting with a single door would have hidden the bug: the app falls back to
`doors[0]` and the tenancy resolves by accident.

**Proven-to-catch.** Restoring the shipped `activeDoor`, the first case fails
with the report in its own words:

```
the unit was picked but the record was read with no tenancy,
so messages were never asked for: expected null to be 't-existing'
```

The cross-door case still passes against both versions, as it must — it is the
guarantee being preserved, not the bug being fixed.

Re-run together: **627 green** across 29 suites. eslint clean.

**Not proven from this sandbox:** his own door, with his own minted tenancy,
on the deployed build. `re-review: 2026-10-17`.

## Still open, found while here

`loadApplications` is written and the Applications surface is half-built
(DR-0903, set aside rather than shipped half-done). An application is still a
dead letter: `submitApplication` writes `rental_applications` and nothing in
the app ever reads it, though 0152 granted the landlord that read. And
Poe Properties rides none of `record_events` — the append-only, DB-enforced
audit log (0052) that Inventory and Books already use — so there is no
"who did what and when" for this module. Both are next.
