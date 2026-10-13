# DR-0825 — A number you already know reads as the person you know, from your own contacts, by you alone

- **Status:** accepted
- **Tier:** A (a read of rows the viewer already owns; no new table, no new door, no new policy; nothing written to any account)
- **Type:** feature
- **Date:** 2026-10-09
- **Scope:** `app/src/lib/contact-names.js` (new: the index of the viewer's own contacts by email and by the ten national digits of a phone; `nameFor`, `labelFor`, `countNamed`, `loadContactIndex`), `app/src/lib/signup-metrics.js` (`reachOf`: a phone-door address reads as the phone it is; masked, the last four digits), `app/src/components/AccessUsageMetrics.jsx` (Platform Signups rows carry the contact name, the count named, and the door to bring contacts in), `app/src/components/AdminConsole.jsx` (the roster rows, the same way), tests `contact-names.test.js`, `signups-named-from-your-contacts.test.jsx`, `roster-named-from-your-contacts.test.jsx`, `signup-metrics.test.js` (three cases added), `member-contact.test.js` (its source pin follows the row's single `contactOf` read).
- **Principles:** THE-APP-IS-THE-PRIMARY-ARTIFACT (DR-0065), VERIFICATION-DOCTRINE (DR-0076), DR-0231 (contact info is a first-class record the member keeps), DR-0342 (nobody enumerates other people's records), DR-0736 (the contacts come in from the phone and are the owner's alone), DR-0111 (identities are never merged by a heuristic), DR-0100 (say what is known plainly; a synthetic address is not a mailbox).
- **Grounds:** Darrell, 2026-10-09, with Platform Signups open beside his phone's dialer. The list showed a phone-door account as `1<ten digits>@phone.poetech.us` and nothing else; the dialer on the same phone showed the name of the deaconess that number belongs to. Rendered for meaning (DR-0331): *"She is a user, and I should know this is her from the data I already have. I want to sync up all my contacts inside the PoeTech App, my family operating system, and users should be able to do this too."*

## Context

DR-0736 brought the contacts in: the Contact Picker, the .vcf upload, the `contacts` table that only its owner reads, the device cache. What it did not do is read them back. No surface looked a raw number or address up in the viewer's own contacts, so the governor's signup list and the Admin roster printed the sign-in identity and stopped, even when the viewer's phone, and the app's own table, already knew the person.

The gap is exactly the one Darrell named: the data was already his, inside the app, and the app did not use it. "Sync up all contacts" is not a new door (the doors exist); it is the read-back, so that everywhere a number or an address appears, the person the viewer already knows is shown instead.

## What was measured

- On the live Platform Signups list (his screenshots, 2026-10-09): a phone-door row read as `1<ten digits>@phone.poetech.us`, with no name and no phone formatting; the same ten digits on his dialer carried a name. `AccessUsageMetrics.jsx` rendered `r.name || r.email`, and `signupRowView` produced the raw address.
- Where the viewer's contacts already live: `public.contacts` (migration 0247, owner-only on read, insert, update and delete; `phones text[]`, `emails text[]`, `name`) and the device cache (`poetech.savedContacts.v1`, one phone and one email per row). Two shapes, both indexed here.
- The phone-door identity is a phone, not a mailbox (member-contact.js, measured 2026-09-11: `auth.users.phone` 0 of 23, the door accounts carry their number in the address). So the lookup strips the door suffix and matches on the ten national digits, which is how the contacts were keyed on the way in (contacts-import.js `identifiers`).
- Proven to catch: with the lookup removed, `signups-named-from-your-contacts.test.jsx` fails on the first row (`Sister Lamb` absent); with the door still rendered as an address, the same test fails on `@phone.poetech.us` present; with the account name overwritten by the contact name, `labelFor`'s "in your contacts as" case fails.

## Impact

- Platform Signups and the Admin roster show, for every row, the name the viewer's own contacts give it: in the gap when the account has no name of its own ("from your contacts"), or beside the account's own name when the two differ ("in your contacts as …"). A stranger stays a formatted phone or an address; no name is invented.
- A phone-door address now reads as the phone it is, `(555) 010-0498 · signs in by phone`, and masked as `phone ending 0498`, on the signup list as it already did on the roster.
- Under the signup list, one line says how many rows were named and from where (your own server, or this device when the server did not answer, with the reason), and names the door to bring more in: Messages > Add a contact.
- Per viewer by construction: the index is built from rows the database already restricts to their owner, so two stewards looking at the same account each see their own name for it, and a person who brought nothing in sees exactly what they saw before. Nothing is written to the account; nothing is merged (DR-0111); the contact name is a label with its source said.
- Every user has it, since every user has Messages > Add a contact (DR-0736) and every surface that reads through this index reads the viewer's own rows.

## Decision

1. One lookup, `contact-names.js`, for every surface that shows a number or an address: index by lowercase email and by the ten national digits; a phone-door address is looked up as a phone and never as a mailbox.
2. The account's own name is senior and is never overwritten. The contact name fills a gap, labelled, or stands beside the account name, labelled. Equal names say nothing extra.
3. The device cache is read first and the table outranks it on the same identifier; the surface says where the names came from, and says when the server did not answer (DR-0076 rule 8).
4. No new table, policy, RPC or third-party sync. The read-back uses the rows DR-0736 already keeps; sharing a contact's name with the household stays a later, explicit choice.
5. Where next: Messages (the roster there carries names and user ids, not identifiers, DR-0736's stated limit) and Inbound, as each is reached. The lookup is the one place to call. `re-review: 2026-10-15`, with DR-0736's.

## Verification

- `contact-names.test.js`: 15 cases over both row shapes, the leading-1 strip, the unnamed row, first-claim-wins, the reported phone-door case, email case-folding, the never-as-a-mailbox rule, the three honest labels, the count, and the loader's three answers (server and device merged with the server senior; device only with the server's reason; nothing brought in).
- `signups-named-from-your-contacts.test.jsx`: the real `AccessUsageMetrics` in jsdom with the RPC and the contacts seams stubbed: the door row reads as the contact name with its label and as a formatted phone; the named row keeps its name with the contact name beside it; the stranger stays a phone; the note counts 2 of 3 and names the door; with nothing brought in every row reads as before; with the server silent the device names show and the note says so; masked shows the last four digits.
- `roster-named-from-your-contacts.test.jsx`: the real `AdminConsole` roster after Load: the door row reads as the contact name with the reach line unchanged; the named row keeps its name; with nothing brought in, as before.
- `signup-metrics.test.js`: `reachOf` unmasked, masked, and a real address untouched.
- Darrell's own test on the Fold: Admin > Users > Signups, with his contacts brought in under Messages > Add a contact (pick from the phone, or upload the .vcf): the deaconess's row reads as her name, "from your contacts".
