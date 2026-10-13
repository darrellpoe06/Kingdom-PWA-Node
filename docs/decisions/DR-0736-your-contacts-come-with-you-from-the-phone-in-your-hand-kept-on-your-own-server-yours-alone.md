# DR-0736 — Your contacts come with you from the phone in your hand, kept on your own server, yours alone

- **Status:** accepted
- **Tier:** B (a new table that keeps a person's address book; row-level walls proven on a real PostgreSQL in CI; no money, no new door, private by default)
- **Type:** feature
- **Date:** 2026-10-01
- **Scope:** `app/src/lib/vcard-parse.js` (new: the .vcf reader for vCard 2.1, 3.0 and 4.0), `app/src/lib/contacts-import.js` (new: the Contact Picker shape, the plan: new / already saved / already on PoeTech, never merged), `app/src/lib/contacts-store.js` (new: the keeper; the table when signed in, the device list always, the reason said), `app/src/components/ContactsImport.jsx` (new: the panel inside Messages > Add a contact), `app/src/components/Messages.jsx` (mounts it; passes the roster), `infra/supabase/migrations-auto/0247-your-contacts-come-with-you-from-the-phone-kept-on-the-nas-yours-alone.sql` (new: `contacts`, owner-only RLS, one row per owner and key), `scripts/contacts-ci-smoke.sql` + `.github/workflows/ci.yml` (`contacts-walls`, a required leg), `app/src/lib/feature-registry.json` (surface `messages`, four controls) + `app/src/__tests__/feature-presence.test.jsx` (its walk), tests `vcard-parse.test.js`, `contacts-import.test.js`, `contacts-from-the-phone.test.jsx`.
- **Principles:** THE-APP-IS-THE-PRIMARY-ARTIFACT (DR-0065), VERIFICATION-DOCTRINE (DR-0076), DR-0231 (contact info is a first-class record the member keeps), DR-0342 (one profile row per person; nobody enumerates others), DR-0353 (a person becomes a member only through a claim link they open), DR-0726 (every control registered), DR-0111 (identities are never merged by a heuristic; merging is the Governor's word).
- **Grounds:** Darrell, 2026-10-01: *"upload phone contacts into PoeTech from the cellphone"*, with a comprehensive, DR-grounded review asked for first: *"Tell me what you understand and how you will build it?"* The review was given and the build agreed the same day; this record is that build.

## Context

From the phone in his hand, Darrell wants his contacts, all of them or the ones he picks, inside the PoeTech App: kept, searchable and usable (text, call, email, invite), not stranded in the phone.

What the repo already decided: contact information is a first-class in-app record the member keeps, remembered, never a text thread's scattershot (DR-0231); the identity spine is phone-free by construction, instances to members to roles, and a person joins only by an invite plus a claim link they open themselves (DR-0353); one profile row per person, read only by the people who may already message you, enumerable by nobody (DR-0342); a missing phone or email is a fact about a row, never a constraint, and two rows that look like one person are hinted with their reason and never merged (`member-contact.js`, Darrell 2026-09-11). Family data stays on the NAS; nothing about the family goes to a third-party cloud AI.

What existed: `saved-contacts.js` (2026-07-28), a real address book with name, phone and email and deterministic ids, kept in one browser's `localStorage` on one phone. Its own header named cloud sync as the follow-on. Messages > Add a contact saves one contact at a time by hand. No Contact Picker, no .vcf import, no table on the NAS, no bulk road anywhere (grep: zero hits).

## What was measured

- Doors available from a phone, measured against the platform: the Contact Picker (`navigator.contacts.select`) exists in Chrome for Android and in the installed app there, and nowhere on iOS or desktop; every phone's Contacts app and Google Contacts can share or export all contacts as one vCard (.vcf) file. So the picker is shown only where it exists and the file is the road that works everywhere.
- vCard shapes real exports carry, each pinned by a test: 2.1 with `QUOTED-PRINTABLE` values and bare type words (`TEL;CELL`); 3.0 with `item1.` groups, `TYPE=` params, backslash escapes and folded lines; 4.0 with `tel:` and `mailto:` URIs. A CSV handed in by mistake is reported as *not a contacts file*, never as zero contacts.
- The plan over a measured case (4 incoming, 1 saved, 2 members): 1 new, 1 already saved (same ten digits), 2 already on PoeTech (one by email, one by the phone-door digits), 0 repeated; the summary line reads `1 new · 1 already saved · 2 already on PoeTech`. The same person twice in one file (one card by phone, one by email that shares the phone) is counted once.
- The walls, on a real PostgreSQL 16 in CI (`scripts/contacts-ci-smoke.sql`): the owner reads their own two rows; a re-import updates the row (still two, the name changed, `updated_at` set); another signed-in person reads none, and their insert as the owner, update and delete each do nothing; anon reads none and cannot insert; a blank key is refused. Twelve RAISE checks; `every wall held` is the job's grep.
- Where the contacts are kept, by the store's own answer: signed in, `nas+device` (an upsert on `(owner_id, contact_key)` then the device list); signed out or demo, `device` with the reason *Not signed in, so they are kept on this device only*; a server error is returned in the answer, not swallowed, and the device still has them.
- One limit, stated: the Messages roster rows carry a name and a user id, not an email or a phone, so *already on PoeTech* is found only where the roster exposes an identifier. Today that is the people whose rows carry one. A member-match road that keeps the identifiers private (hashes, or an RPC that answers yes or no) is the named follow-on. `re-review: 2026-10-15`.

## Impact

- From Messages > Add a contact, a person picks contacts from their phone or uploads their whole contacts file, sees *N new · M already saved · K already on PoeTech* with every row named and its reason, and keeps them with one tap. Nothing is kept before the preview; cancelling the picker is not an error.
- The contacts live on the person's own server in `contacts`, one row per owner and key, read and written by the owner alone. The device list stays the offline cache and the fast path. Lose the phone, keep the list.
- Nothing is merged. A contact that matches a member carries `matched_user` as a hint; the contact stays the owner's, the member stays their own account (DR-0111's first carve-out, as `member-contact.js` already holds for the roster).
- Private by default: no `instance_id`, no household read policy, no anon policy. Sharing a contact with the house is a later, explicit choice.
- Every control is registered (DR-0726) under a new `messages` surface and walked by the presence gate, including the preview's Keep and Not now, reached through a real .vcf in jsdom.

## Decision

1. Two doors in, one shape out: the Contact Picker where the phone has it, a .vcf file everywhere. Add a contact by hand stays as it was.
2. The plan is shown before anything is kept; each row is new, already saved, or already on PoeTech, with who and why. The same person twice in a file is kept once.
3. The keeper is migration 0247's `contacts`: owner-only row-level security on read, insert, update and delete; unique on `(owner_id, contact_key)` so a re-import updates; `matched_user` is a hint, never a merge. The device list is written on every save.
4. Signed out or in demo, nothing reaches the table; the device keeps the contacts and the panel says so.
5. The walls are proven on a real PostgreSQL in CI as a required leg (`contacts-walls`), the same shape as 0244's and 0246's smokes.
6. No Google People API or any third-party sync in this cut; the phone itself is the source.

## Verification

- `app/src/__tests__/vcard-parse.test.js`: 10 tests over the three vCard versions, folding, N-to-name order, structured addresses, quoted parameters, URIs, a non-vCard file (fails loudly), a truncated file, an empty card.
- `app/src/__tests__/contacts-import.test.js`: 10 tests over the picker shape, the plan and its reasons, the duplicate count, the summary line, the table row, and the store's three answers (signed in, signed out, server error).
- `app/src/__tests__/contacts-from-the-phone.test.jsx`: the real panel in jsdom: a .vcf through the file door renders the preview with its summary and rows; Keep writes the upsert with `onConflict: 'owner_id,contact_key'` and reports where the contacts were kept; a CSV is refused with the reason; the pick button is absent without a picker and present with one.
- `scripts/contacts-ci-smoke.sql` on PostgreSQL 16 in `ci.yml` (`contacts-walls`, in the required aggregate's `needs`): 0247 applied twice, twelve RAISE checks, `every wall held`.
- `feature-presence.test.jsx` walks the `messages` surface: four registered controls found, two of them only after a real file is read.
- Proven to catch: before the plan excluded duplicates, the measured case counted the repeated card as a third new contact; before the unique index, the smoke's re-import produced a third row and failed on *a re-import duplicated a contact*.
- Darrell's own test on the Fold: Contacts > Share > PoeTech, or Pick from my phone, then Keep; the row count on the NAS equals the preview's total.
