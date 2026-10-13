# DR-0743 — The doors show in the family app again: the door sync reads the landlord instance

- **Status:** accepted (built and proven in the suite; the live proof is Real Estate on Darrell's phone after deploy)
- **Tier:** B (tenancy resolution in a sync; no migration, no RLS change, no money)
- **Type:** defect
- **Date:** 2026-10-01
- **Scope:** `scripts/sovereign-read-over-tailnet.sh` (the `instances` read names the real column), `app/src/lib/table-sync.js` (`getPropertiesInstanceId`, `getDoorsInstanceId`, the `instanceId` resolver option every read, write, delete and realtime channel of a table sync goes through), `app/src/lib/rentals-sync.js` (the door sync and its lease ids resolve the landlord instance first), `app/src/__tests__/the-doors-show-in-the-family-app.test.js` (new), `docs/decisions/INDEX.md`.
- **Principles:** REALITY-TRACE (DR-0061: name the real rows and the real instance), VERIFICATION-DOCTRINE (DR-0076: measured on the live database before a line was written), DR-0060 (RLS stays the data gate; this changes which instance the app asks for, never what the database allows), DR-0365 (Poe Properties runs in its own instance), HOLD-THE-HAND (DR-0621).
- **Grounds:** Darrell, 2026-10-01, with a screenshot of the family app's Real Estate tab on his Fold: *"Properties?!!!!!"* over "PROPERTIES · 0 — No properties yet. Use + Add property above." Then: *"Features checks didn't catch this?"*

## Context

The family app's Real Estate tab (`components/Rentals.jsx`) lists `data.inflows.rentals`, which `rentals-sync.js` fills from the `rentals` table through `createTableSync`. Every table sync filters its reads and addresses its writes to ONE instance (the 2026-06-12 rule: a person in two instances must never pull the union), and until now that instance was always the one `getInstanceId()` resolves: the family instance, `poe-family`.

## What was measured

- **The rows exist.** `sovereign-read` run 36913318713 (what=tables, 2026-10-01 19:20 UTC), read from the database the app reads: `rentals` holds **13 rows**, ever inserted 13, ever updated 166, ever deleted 0. Nothing was lost.
- **They are not in the family instance.** Migration `0207-poe-properties-runs-in-its-own-instance.sql` (DR-0365, 2026-09-14) created the landlord instance `poe-properties`, made both of Darrell's sign-ins its owner and Christina its admin, and moved every door and the 18 property-scoped tables into it. DR-0365 §5 left the family resolver untouched on purpose: "the family app keeps working for the same people". The door sync was never pointed at the resolver the same migration added for exactly this, `my_properties_instance_role()`.
- **So the family app asked the wrong instance.** `rentals-sync.js` → `createTableSync` → `tenantIdCached()` → `getTenantId()` → `join_default_instance` → `poe-family`; the read filtered `instance_id = poe-family` and got 0 rows. The 0-row guard (`readLooksBroken`, DR-0394) keeps a device's local copy when it already holds synced doors, which is why a phone that had the doors before 0207 kept showing them and a device that loaded after did not. The script that reads instances for exactly this question already carried the diagnosis in its comment ("rentals held 13 rows while the family-OS sync, which filters on the FAMILY instance, could reach none of them... On screen that is identical to having no doors"), but its query names a column the table does not have (`i.name`; the column is `display_name`), so it has printed `QUERY-FAILED` since it was written. Fixed here: the query reads `display_name`.
- **Why the feature checks did not catch it.** The registry gate (DR-0726) proves a control exists on a surface; it does not read rows. The rentals tests prove the merge rules on fake rows. Nothing asked the live database which instance the doors live in and compared it with the instance the app reads. That is the gap the sovereign-read `instances` mode was written for, and it was broken.

## Impact

The family app reads the doors from the instance they live in, so Real Estate shows the 13 doors again on every device, and a new door written from the family app lands beside them in the landlord instance, where the landlord app, the tenants' portal and the rent posting already look. A household with no landlord seat is unchanged: its door sync falls back to the family instance exactly as before.

## Decision

1. **A table sync takes an `instanceId` resolver.** Every read, write, delete and the realtime channel resolve through it, so one table can never read one instance and write another. The default stays the family resolver; nothing else changes for the forty-odd family tables.
2. **The door sync resolves the landlord instance first** (`getDoorsInstanceId`: `my_properties_instance_role()` → its `instance_id`; null or an error → the family instance, with the error said in the console, never swallowed into a wrong read). The lease ids the door sync hands `lease-sync.js` resolve the same way.
3. **RLS is untouched.** Darrell's two sign-ins are owners of `poe-properties` and Christina is its admin (0207); the policies on `rentals` read and write by instance membership. This record changes which instance the app asks for, not what the database allows.

## Verification

- `the-doors-show-in-the-family-app.test.js`: the landlord membership wins; no landlord seat falls back to the family instance; a failing landlord lookup falls back and says so; a table sync given a resolver filters its full read by that instance and addresses its write to it; the door sync and its lease ids are pinned to the landlord resolver by source; **proven to catch:** a sync without a resolver still reads the family instance.
- `rentals-sync.merge.test.js`, `rentals-sync.partial-read-loss.test.js`, `rental-write.test.js`, `table-sync-delete-noop.test.js`, `table-sync-batch-delete.test.js`: unchanged and green.
- Lint clean.
- **Live proof after deploy:** Real Estate on his phone reads "Properties · 13". `re-review: 2026-10-03` against that screenshot.

## Limits, stated

1. A person who is a member of BOTH the family instance and the landlord instance reads the doors from the landlord instance only, which is where they all are since 0207; a door that was never moved (none, measured) would not show.
2. The `instances` read of `sovereign-read` is repaired in this record (`display_name`), so this question can be asked of the live database in one dispatch next time; its first good run is the proof.
