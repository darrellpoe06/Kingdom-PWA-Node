# DR-0828 — Everything on record for a person, in one read, and what the cloud never holds, said

- **Status:** accepted
- **Tier:** A (reads of rows the viewer already reads under their own RLS; no new table, no new policy, nothing written)
- **Type:** feature
- **Date:** 2026-10-09
- **Scope:** `app/src/lib/person-record.js` (new, pure: `buildPersonRecord`, `dmDeviceView`, `presenceView`, `sortDevices`, `reachLinks`, `summaryLine`, `NOT_HELD`), `app/src/lib/person-record-sync.js` (new, reads only: `loadDmDevicesOf`, `loadPresenceOf`, `loadPersonRows`), `app/src/components/PersonRecord.jsx` (new: the fold), `app/src/components/AdminConsole.jsx` (a Known toggle on every roster row beside Inspect; the fold gets the viewer's contact index), tests `person-record.test.js` (11) and `roster-named-from-your-contacts.test.jsx` (+1, the real roster).
- **Principles:** VERIFICATION-DOCTRINE (DR-0076, rule 8 above all: an absence is stated, never painted), USER-ACCOUNTS-AND-HISTORIES-STANDARD (the steward reads a user's record through RLS, never around it), DR-0825 (the viewer's contacts name the person), DR-0231 (notification opt-in is the person's), DR-0111 (nothing merged), 0055 (no fingerprinting).
- **Grounds:** Darrell, 2026-10-09: *"Devices from this person... EIN... or MAC address... other device details... all of these are from this user... etc."* Then: *"End to end comprehensive fields inside the database connects to what we needed from them and communicate etc..."*

## Context

The roster row said who a member is and how to reach them (DR-0425-era member-contact), and Inspect held the stewardship record. What it did not do is gather everything the database already holds about the person into one read, with the ways to reach them as real actions, and say which things the cloud does not hold, so a blank could be read for what it is.

## What was measured (DR-0061, before building)

- Per person the cloud holds, readable by a steward: `dm_device_keys` (device id, label, last seen; any signed-in person may read any user's rows, 0249), `member_presence` (coarse platform, build, last seen; owner/admin read, 0055), the roster row's doors (email, phone-door digits, the person's own declared email and phone, 0210/0213), and the viewer's own contact name for them (DR-0825).
- Held by the person alone: `push_subscriptions` (owner-only read, DR-0231).
- Never in the cloud, by earlier decisions: the full SSN/EIN (the on-device tax-id vault, `tax-id-vault.js`, Contractors1099: only type and last four sync); a MAC address (a browser cannot read one; the NAS on the LAN can); a device fingerprint (0055 chose a coarse platform on purpose).
- `church_devices` is the church's infrastructure register with a steward, not a person's phones; it is not a person field.

## Impact

- Unresolved: a steward asking "what do we know about this person" reads five surfaces and still cannot tell a blank from a thing the cloud never holds; a question like "what is her EIN" or "what is his MAC" gets guessed at instead of answered.
- The call obligates: reads only, through the walls that already exist; an absence stated with its reason; nothing merged and nothing fingerprinted; the ways to reach a person as real actions.

## Decision

1. One record per roster row, built pure from rows already read: who (own name, the contact name labelled), the sign-in doors with their source, the ways to reach them as real `sms:`, `tel:` and `mailto:` links, the devices seen newest first (message devices and presence), and a summary line that counts only what is there.
2. What the cloud does not hold is a list on the record, each with its why: the full SSN/EIN, the MAC address, notification devices, a fingerprint. A steward reads a blank as a stated absence, not a missing field.
3. Reads only, each with `{ ok, rows, reason }`; a refused read shows its reason in the fold.
4. The MAC road, named and not built here: a NAS-side device-to-person assignment where the LAN is visible. `re-review: 2026-10-23`.

## Verification

- `person-record.test.js`: the two device views and the newest-first sort; reach links only where a fact supports them; the phone-door member named from the viewer's contacts with the phone as the door, text and call to reach, both devices newest first, the summary and the not-held list; a bare member with every absence stated; the person's own answer outranking the derived door; the loader carrying each table's answer and refusing without a user.
- `roster-named-from-your-contacts.test.jsx`: on the real Admin roster, Known opens the fold with the contact name, the phone door and its source, the text and call links and no email link, the device row, the refused presence read's reason, and the not-held entries for the EIN and the MAC.
- Lint clean at zero warnings; every gate green.
