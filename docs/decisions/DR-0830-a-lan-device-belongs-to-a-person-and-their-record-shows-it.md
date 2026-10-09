# DR-0830 — A LAN device belongs to a person, and their record shows it, MAC included

- **Status:** accepted
- **Tier:** A (one nullable column on the device register; the register's walls unchanged; the person's record reads rows the viewer may already read)
- **Type:** feature
- **Date:** 2026-10-09
- **Scope:** `infra/supabase/migrations-auto/0256-a-lan-device-belongs-to-a-person.sql` (new: `church_devices.owner_user_id`), `app/src/lib/church-devices.js` (`ownerUserId` on the device), `app/src/lib/church-devices-sync.js` (both mappers and the column map), `app/src/components/DeviceInventory.jsx` (Belongs to, from the space's roster, on the editor), `app/src/lib/person-record-sync.js` (`loadLanDevicesOf`), `app/src/lib/person-record.js` (`lanDeviceView`; the MAC entry in `NOT_HELD` now says when a MAC does show), `app/src/components/PersonRecord.jsx` (LAN devices in the fold with their own reason line), tests `person-record.test.js` (+2), `church-devices-sync-mappers.test.js` (+1), `roster-named-from-your-contacts.test.jsx` (the fold shows the LAN device and its MAC), `device-belongs-to-a-person.test.jsx` (new, the real editor).
- **Principles:** DR-0828 (everything on record for a person), DR-0076 (a MAC shown is a MAC a scan read; provenance stays with the row), DR-0236 (buildable now is built now), 0056 (the register's walls), DR-0061.
- **Grounds:** Darrell, 2026-10-09: *"Devices from this person... ein... or mac address... other device details... all of these are from this user."* DR-0828 recorded the MAC as not held and named the LAN road; the stop-hook caught that naming as a deferral of buildable work, and it was right.

## Context

A browser cannot read a MAC address, so no sign-in ever carries one; that stays true. But the church device register already holds the MACs a real LAN scan read (`specs.mac`, scan-confirmed, DR-0076 provenance), and nothing tied a register row to the person whose device it is. The tie is one column and one picker.

## Decision

1. `church_devices.owner_user_id` (0256), nullable, set only by an editor's hand in the register (Belongs to, from the space's roster, Nobody assigned first). Never derived from a scan.
2. The person's record (Admin > Known, DR-0828) lists the register's active devices assigned to them with type, location and the MAC as recorded, or *MAC not recorded*; a refused read says so with its reason.
3. The not-held list keeps its honesty: a MAC from a sign-in is never held; a MAC shows only through an assigned, scan-recorded device.

## Verification

- `person-record.test.js`: `lanDeviceView` with and without a MAC; the record puts an assigned device first by date; the loader carries the register's answer and refuses without a user.
- `church-devices-sync-mappers.test.js`: `ownerUserId` round-trips through the row and the column map; absent reads null.
- `device-belongs-to-a-person.test.jsx`: on the real register, Edit opens Belongs to with the roster and Nobody assigned first; a pick is saved as `ownerUserId`.
- `roster-named-from-your-contacts.test.jsx`: the Known fold shows the assigned tablet with its location and MAC beside the message device.
- The migration applies twice (ADD COLUMN IF NOT EXISTS); the register's policies are untouched.
