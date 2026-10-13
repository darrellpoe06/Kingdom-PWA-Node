# DR-0826 — The keeper pulls back: your contacts reach every phone you sign in on, and a hand-added one reaches the server

- **Status:** accepted
- **Tier:** A (reads and writes rows the viewer already owns under DR-0736's walls; no new table, no new policy)
- **Type:** fix
- **Date:** 2026-10-09
- **Scope:** `app/src/lib/contacts-store.js` (`pullMyContacts`, `keepContactOnServer`, `forgetContactEverywhere`, `tableRowToDevice`), `app/src/components/Messages.jsx` (pulls on open; a hand-added contact is kept on the server; Remove forgets on both; the Saved contacts line says where the list came from), tests `contacts-keeper-pulls-back.test.js` (10) and `messages-contacts-from-the-keeper.test.jsx` (2, the real surface).
- **Principles:** VERIFICATION-DOCTRINE (DR-0076), DR-0736 (the contacts come in and are kept on your own server), DR-0825 (a number you know reads as the person you know), DR-0231, DR-0342.
- **Grounds:** Darrell, 2026-10-09, minutes after DR-0825 shipped: *"Names and cellphone numbers are not being synchronized!!!!!!!!!! Why not!!!!!!"* And: *"I can pull all my contacts into the PoeTech App all at once?"*

## Context

DR-0736 wrote every imported contact to the owner-only `contacts` table AND to the device list, and said the table was the keeper so a lost phone does not lose the list. True on the way in. On the way out, the Messages surface read only the device list (`readContacts()` over `localStorage`), so:

- a contact brought in on the phone never appeared on the Fold, or on any other device, or in the same browser after its storage was cleared;
- a contact added by hand under Add a contact went to the device only and never reached the server at all;
- Remove forgot a contact on the device only, so once a pull existed it would have come back.

That is the whole of "not synchronized": the keeper kept, and nothing asked it.

## What was measured

- `Messages.jsx:174` (before): `refreshSaved = () => setSaved(readContacts())`, device only; `keepContact` called `upsertContact` only; `forgetContact` called `removeContact` only. No call to `loadMyContacts` anywhere in a surface.
- The merge on pull is the device list's own: `upsertContact` matches on a shared phone or email, so a contact already on the device under an older name is updated to the server's name, not duplicated (pinned: two rows in, one row out, the server's name on it).
- The all-at-once question, measured against the doors that exist: the .vcf upload takes a whole contacts file (every phone exports all contacts as one .vcf); the Contact Picker on Android Chrome is multi-select. Both land in the same plan and the same keeper.

## Impact

- Unresolved: a person who brought their contacts in on one phone opens Messages on another and sees none of them, and a contact added by hand is lost with the phone; the keeper DR-0736 promised is not a keeper. Every surface that names a number from the viewer's contacts (DR-0825) stays blind on every device but one.
- The call obligates: one read path for the list (pull on open), one write path for a hand-added contact (device and server), and a Remove that reaches both, with the list always saying where it came from.

## Decision

1. On opening Messages, the viewer's rows are pulled from the table into this device's list, merged onto the same people. The Saved contacts line says `N from your own server, the same list on every phone you sign in on`, or `Showing this device's list; your server did not answer (reason)`, never silence (DR-0076 rule 8).
2. A contact added by hand is kept on the server too (source `manual`), keyed exactly as the device list keys it, signed in only; signed out stays device-only with the reason.
3. Remove forgets the contact on the device AND deletes the owner's row by key on the server, so the next pull does not bring it back.
4. The import panel is unchanged: Keep already wrote both places. `re-review: 2026-10-15` with DR-0736 and DR-0825.

## Verification

- `contacts-keeper-pulls-back.test.js`: pull merges onto the same person and the server's name wins; a server error leaves the device list alone and carries the reason; a thrown client is a reason; the manual keep upserts one row keyed `p:<ten digits>` or `e:<email>` with `source: 'manual'` on `(owner_id, contact_key)`; signed out writes nothing; nothing identifying writes nothing; forget removes the device row and deletes by key; a server refusal is a reason with the device row still gone.
- `messages-contacts-from-the-keeper.test.jsx`: the real Messages surface in jsdom pulls two rows and shows both with the `2 from your own server` line; with the server silent the device's own row still shows and the line names the reason.
- Proven to catch: with the pull removed, the first render case fails on `Saved contacts` absent (the list was empty); with the keeper line removed, on the note.
