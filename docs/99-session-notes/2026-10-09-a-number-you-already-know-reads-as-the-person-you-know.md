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
