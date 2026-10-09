# 2026-10-09 — A number you already know reads as the person you know, from your own contacts

**Layer 4 working note.** Decision: DR-0825. Pairs with DR-0736 (the contacts come in from the phone, kept on your own server, yours alone).

## What Darrell said

Three screenshots: the Platform Signups list with a phone-door account shown as `1<ten digits>@phone.poetech.us` and no name; that number selected with Call / Copy; and his phone's dialer showing the deaconess the number belongs to. Rendered for meaning (DR-0331): *"She is a user, and I should know this is her from the data I already have. I want to sync up all my contacts inside the PoeTech App, my family operating system, and users should be able to do this too."*

## What was measured

- `AccessUsageMetrics.jsx` rendered `r.name || r.email` and `signupRowView` gave the raw door address: no formatting, no lookup.
- The viewer's contacts were already in the app twice over, the owner-only `contacts` table (0247) and the device cache, and no surface read them back.
- The door address is a phone, not a mailbox (member-contact.js; measured 2026-09-11), and the contacts were keyed on the way in by the same ten national digits (contacts-import.js), so the lookup is the ten digits.

## What changed

- `app/src/lib/contact-names.js` (new): `buildContactIndex` over both row shapes; `nameFor` (a phone-door address looked up as a phone, never as a mailbox); `labelFor` (the account name senior; "from your contacts" in the gap, "in your contacts as …" beside a different name, nothing extra when equal); `countNamed`; `loadContactIndex` (device first, the table outranks it, where-from and the server's reason said).
- `signup-metrics.js`: `reachOf`, so the door reads `(555) 010-0498 · signs in by phone`, masked `phone ending 0498`.
- `AccessUsageMetrics.jsx`: the rows carry the contact name with its label (`signup-row-who`, `signup-contact-note`); a line under the list counts the rows named, says where the names came from, and names the door, Messages > Add a contact (`signup-contacts-note`).
- `AdminConsole.jsx`: the roster rows the same way (`roster-row-who`, `roster-contact-note`); `contactOf(m)` read once per row.

## Verification

- `contact-names.test.js` 15, `signups-named-from-your-contacts.test.jsx` 4 (the real surface in jsdom), `roster-named-from-your-contacts.test.jsx` 2 (the real Admin roster after Load), `signup-metrics.test.js` +3, `member-contact.test.js` pin updated. Lint clean on every changed file.
- Fixtures use the 555 reserve and made-up names; the repo is public and no real number or name is in the tests.

## For Darrell

Admin > Users > Signups now shows the deaconess's row as her name, "from your contacts", once your contacts are in: Messages > Add a contact > Pick from my phone (or upload your .vcf). The same name shows on the Admin roster. The names come from your own rows, visible to you alone; another steward sees their own contacts' names, and the account itself is untouched. Messages and Inbound get the same lookup next (re-review 2026-10-15).

## Later, 8:30 pm CDT: "Names and cellphone numbers are not being synchronized!" (DR-0826)

PR #2036 merged at 01:24 UTC and deploy 1536 for its SHA (46d8b7978) completed green before the hand dispatch (1537) was needed; DR-0825 is live. Then Darrell: *"I can pull all my contacts into the PoeTech App all at once?"* and *"Names and cellphone numbers are not being synchronized!!!! Why not!!!!"*

Measured: the Messages list read only the device cache (`Messages.jsx:174`, `readContacts()`), so the keeper DR-0736 wrote to was never read back on another device, a hand-added contact never reached it, and Remove forgot on the device only. Fixed in `contacts-store.js` (`pullMyContacts`, `keepContactOnServer`, `forgetContactEverywhere`) and wired in Messages, with a line under Saved contacts that says where the list came from. 10 pure cases, 2 on the real surface. All at once: upload the .vcf (every phone exports all contacts as one file), or Pick from my phone on Android with several selected.

Then Darrell, mid-work: *"Devices from this person... EIN... or MAC address... other device details... all of these are from this user..."* Traced before building (DR-0061): per person the app already holds DM device keys (`dm_device_keys`: device id, label, last seen), push subscriptions (`push_subscriptions`: user agent, label), presence (`member_presence`: coarse platform, build, last seen; 0055 chose no fingerprinting), the TV sign-in device label (0222); the church device register (`church_devices`) is infrastructure assets with a steward, not a person's phones; the full SSN/EIN lives in the on-device vault by design and never in the cloud (`tax-id-vault.js`, Contractors1099), only the type and last four sync. A browser cannot read a MAC address; the NAS on the LAN can. That shape is the next build: one "what we know about this person" read per roster row from those real rows, and a device-to-person assignment where the NAS sees the MAC. Carried as the next item.

## Later: the Poe Properties door looks like PoeTech, the tenants' version (DR-0827)

Darrell, two screenshots of the door: *"Poe Properties App for tenants and workers etc... should look like PoeTech App just the tenants version... Lost features that are low hanging fruit for our tenants."* Measured: `PropertiesDoor.jsx` imported none of the shared chrome libs the TLC door imports (`TlcPublicDoor.jsx:23-34`). Now it carries the five themes, text size and its escape hatch, the hideaway top space, the sticky auto-hiding header, Install, Share · QR with the door's own address, read-aloud and the post-update toast, from the same libs and the same keys the PoeTech shell writes. 5 cases on the real door; the existing 16 still pass. Messages, push and the lessons on this door are recorded as not low-hanging with the why and a date.

Also from Darrell, mid-work: *"End to end comprehensive fields inside the database connects to what we needed from them and communicate etc..."* Folded into the next item (the per-person read): every field the database holds about a person, connected to what we need from them and to the ways to reach them.

## Later: everything on record for a person (DR-0828), and "make Christyn my family" (DR-0829)

DR-0828: a Known fold on every Admin roster row, built pure from the rows a steward may read (message devices, presence, the doors, the contact name), with the ways to reach them as real links and the not-held list (full SSN/EIN in the on-device vault; a MAC a browser cannot read; notification devices the person's alone; no fingerprint by 0055). 11 pure cases and the real roster.

Then Darrell, Platform Signups open and DR-0825 live on it (the row read `14472209779 · (447) 220-9779 · signs in by phone · in your contacts as Christyn Poe`): *"Why can't I make Christyn my family with a check box or whatever... the ability to give and do things as admin!"* / *"Fix it!"* Two faults measured: the phone door names an account by its digits (0140), so the digits read as a name and the contact's name trailed; and the only road into a space was the invite handshake, built for an address, not for an account already on his list. DR-0829: `ownNameOf` (digits are not a name, the contact's name fills the gap); 0255 `add_user_to_instance` with the role control's ceiling and audit; Add to a space on every signup row, Admin offered where he is owner. The smoke (twelve assertions) proven on a local PostgreSQL 16 and in the `role-control` isolation leg.

## Later: the stop-hook caught a deferral, and the LAN device road was built (DR-0830)

My reply named "tying a LAN device to a person" as the next build. The ari-integrity-guard flagged it as a fake boundary (DR-0236): it was buildable now, so it was built now. 0256 adds `owner_user_id` to the device register; Belongs to on the register's editor assigns a device to a member from the roster; the Known fold shows the assigned devices with the MAC the scan recorded. A MAC from a sign-in is still never held; the not-held list says so and says when one shows.

## Later: #2037 merged, the deploy and the migrations proven, and the isolation matrix's four red legs (DR-0831)

#2037 merged as 3d00be193 at 02:11 UTC after two CI rounds of my own: ui-standards (focus rings on the door's sign-out links), consistency-guard (a width cap on the QR card), legibility-guard (the health file's page count), decision-chain (Impact and What was measured on five records), and the interconnect guard (the device register and the person record declared in the flow graph). Deploy 1538 and migration run 654 both completed green for the merge SHA, so 0255 and 0256 are on the hosted database.

The migration run dispatched the isolation matrix (run 283): the role-control leg with the 0255 smoke passed; four legs failed, the same four that failed run 282 before this merge, every one on `out of shared memory / max_locks_per_transaction` inside an overlay function. DR-0831: the pre-step and the files that rebuild what it dropped share one transaction; every later file commits on its own; the guard pins the shape and catches both failed shapes.

## Later: the matrix is green again (DR-0831 proven)

#2039 merged as 628edeedf at 02:36 UTC; deploy 1539 completed success for it. Isolation run 284, dispatched on that SHA, completed success with 23 of 23 legs green, `product-forms`, `viewer-readonly`, `poe-properties` and `tlc-office` among them: the first all-green matrix since the one-transaction rule of 2026-09-25.

## Later: "Timelines based on the Way we work... DRs" (DR-0832)

The Way's timeline is the ledger's re-review dates. Measured on the records: 257 dated re-reviews across 217 records on or after today, 16 on 10-14 and 31 on 10-21 alone, and some already passed. The app showed only a seven-day window and the date per record. Now the governance surface carries a Timeline: passed and not re-reviewed first, with the days; due today; then week by week, the first two open. Pure over the ledger the build ships; 10 cases.
