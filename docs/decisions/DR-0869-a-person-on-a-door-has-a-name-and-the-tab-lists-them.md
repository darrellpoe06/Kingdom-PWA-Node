# DR-0869 — A person on a door has a name, and the People tab actually lists them

- **Status:** accepted
- **Tier:** B (landlord-facing surface; the record a contractor document prints from)
- **Date:** 2026-10-10
- **Type:** product (defect)
- **Scope:** `app/src/modules/properties/people.js` (new), `app/src/modules/properties/PropertiesApp.jsx` (PeopleTab + the invite handler), `app/src/__tests__/the-people-on-a-door-have-names.test.jsx` (new)
- **Principles:** REALITY-TRACE (DR-0061/P15), VERIFICATION-DOCTRINE (DR-0076), SPEC-CONFORMANCE (DR-0219), SURFACE-SAYS-TRUTH
- **Grounds:** DR-0837 (the dispatch is a record), DR-0172 (the phone door), 0075/0150 (the invite + capability model)

## The word, as spoken

Darrell, 2026-10-10, on the PEOPLE tab of a door with the invite panel open, a
role dropdown reading "1099 worker" and his own cell number typed in:

> "Need to be able to add users... 1099 workers... etc..."

and then, one word and four exclamation marks:

> "Names?!!!!"

## What was measured

Traced end to end before writing a line (DR-0219):

| link in the chain | state |
| --- | --- |
| `property_access_invites.display_name` | **exists** |
| `cloud.js inviteToProperties` | **accepts** `displayName` and writes it |
| `dispatch-roster.js:43 workerRoster` | **reads** `display_name` first |
| `documents.js:286` contractor document | **prints** `worker.name \|\| worker.display_name` |
| `people-placement.js:127` (PoeTech "People you know") | **passes** `displayName: name` |
| `PropertiesApp.jsx:1480` (the Poe Properties invite form) | **no name field, no displayName** |

So the column, the writer, the roster reader and the printed document were all
in place, and the one form a landlord actually invites from never asked. Every
person invited from inside the door became a phone number permanently: a phone
number in the Dispatch picker, a phone number in the note written on the door's
permanent record, and a blank line on the contractor's document. Two doors fed
one table and disagreed; the lossy one was the one he was standing in.

Second finding, same tab: `PeopleTab` rendered the invite `Card` and **nothing
else**. `loadInvites()` was already in the component's state (`PropertiesApp`
lines 246/313/316) and `revokeInvite()` had sat in `cloud.js:329` since 0150,
called by **nothing anywhere in the application**. You could add a person and
then never see them, never learn whether they had signed in, and never take
access away from the surface that granted it.

Third: the confirmation read ``Invitation written for ${payload.email}`` —
and `payload.email` is `''` on the phone path, which is the path he used. It
said "Invitation written for ." every time.

## Impact

Unresolved, this quietly degrades the record that the 1099 workflow depends on.
A dispatch note naming "(217) 904-0219" instead of a person is still a record,
but it is not one a family can read a year later, and the contractor document
that prints the name is a document that leaves the house. This is also the
shape the Dispatch roster was already built to expect, so the loss was invisible
from every surface except the one place the name should have been typed.

What it obligates: a name is now **required** to invite. That is a deliberate
cost — one field, two seconds — paid so no unnamed row can enter the table
again from this door.

## The decision

1. **The invite form asks for a name first, and will not send without one.**
   `displayName` is carried through to the row.
2. **The tab lists who is on the door** — name, role, contact, whether they
   have signed in yet, and their grants in plain language rather than
   capability keys. The people whose access was taken away stay visible under
   "Access removed", so a revoke is never silent.
3. **Revoke is wired** to the same surface that grants.
4. **A disabled button always says why.** `whyNotReady()` returns the sentence
   and the surface renders it; a greyed control with no explanation is treated
   as the defect it is.
5. **The synthetic `<digits>@phone.poetech.us` login address is never shown as
   a contact.** It is an identifier; printing it would teach a landlord an
   address that reaches nobody. It renders as the phone it stands for.

## Outcome

`the-people-on-a-door-have-names.test.jsx` — **31 tests, all green**, covering
the name fallback ladder, the phone-door address never surfacing as contact,
door scoping, instance-wide (`scope_ref '*'`) placement, de-duplication,
revoked separation, signed-in ordering, the plain-language grants, every
`whyNotReady` branch, and four render tests against the real `PeopleTab`
including one that types a name and a number and asserts the payload carries
`displayName`.

Proven-to-catch: the roster test fails on the pre-change component (it rendered
no `door-person` rows at all), and the payload test fails without the name
field.

Not done, with a date: **"Text them the link" still writes nothing to the
record**, and it can be tapped for someone who has no invite row at all, so
they would arrive at a door that grants them nothing. Named rather than papered
over. `re-review: 2026-10-24`.
