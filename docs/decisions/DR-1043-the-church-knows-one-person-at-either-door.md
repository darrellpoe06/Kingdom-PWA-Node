# DR-1043: The church knows one person at either door — the owner was refused at his phone door

**Date:** 2026-10-15
**Status:** accepted
**Tier:** A (defect fix: an identity read that took one handle for the whole person)
**Type:** orchestration
**Area:**
- `infra/supabase/migrations-auto/0294-the-church-knows-one-person-at-either-door.sql` (`join_church_instance` reads `person_links`; allowlist and invites match every address that identifies the caller)
- `infra/supabase/tests/0294-church-either-door-smoke.sql` (live proof, rls-isolation choir-claim leg)
- `app/src/__tests__/church-either-door.test.js` (the rule's shape, proven to catch)

**Extends:** DR-0311 (one person, two doors, one library) to the church join; follows 0151 (invites match every identity) and 0182 (the business role reads through the link).
**Pairs with:** DR-1032 (the refusal names what it read, which is how this cause became visible) and DR-1037 (any member may read the order). DR-1037 lets a member read; this record makes the owner's phone door a member.
**Grounds:** Darrell 2026-10-15, screenshot from the Fold at 4:54 AM, build CB82457; DR-0060 (the tenancy wall stays the gate); DR-0076 (proven to catch); DR-0621 (a flag is where the work starts)
**Declared by:** Darrell — *"Which is why I wanted the one account merged so all data is synced to one record after knowing my multiple data points... email and cellphone... make sense? Opportunities and constraints"*

## Concern

The owner of the church space opened Church → Order of Service and was refused. The honest gate from DR-1032 said why in its own words:

> Signed in as 15636502416@phone.poetech.us.
> No church space answered for this account. A steward adds you by inviting your email from the Choir tab.
> Read failed — no church space answered for this account

## Context

Darrell signs in two ways: his Gmail password, and his phone number with a PIN. GoTrue cannot hold a PIN and a password on one row, so these are two `auth.users` rows (DR-0311, measured). DR-0311 recorded the fact "these two rows are one person" once, in `person_links`, and taught the owner-scoped libraries to read through it. 0151 taught property invites to match every address of the person. 0182 taught the business role to read the seat through the link, after the Moore door drew a blank header for him on his tablet. The church join never learned it.

## What was measured

- `join_church_instance` as defined by 0014 (the latest definition before this record) decides by ONE address: `SELECT lower(email) FROM auth.users WHERE id = auth.uid()`. The leader allowlist names `darrellpoe06@gmail.com`; the invite match reads the same single address.
- The phone door's address is the synthetic `15636502416@phone.poetech.us`. It matches neither, so the door gets no seat on `colg`, and every church read after it (`user_role_in_instance`, `user_in_choir`, `user_is_worship_finalizer`, the order's RLS) answers "outsider" to the owner.
- DR-0311's census: the Gmail identity holds the `colg` owner seat; the phone door holds only door-class rows. `instance_members` stays on the door by DR-0311 §5, so the door needs its own seat.
- Reproduced in a scratch PostgreSQL 16 with the real join bodies: the 0014 join returns NULL for a linked door (smoke FAIL: "the linked door joined <NULL>"); 0294 applied twice returns the church with role owner (smoke PASS). With the real address shapes, the phone door joins `colg` as owner and is named `darrellpoe06`, never the digits.

## Impact

- Darrell at his phone door: the Order of Service, the Playbook, the Choir tab and every church surface open as owner.
- Anyone else with a linked door (none today; `person_links` is written by migration only) is seated with the role their other door holds.
- An invite sent to a person's email is accepted at whichever door they use.
- No new grantee: a link joins two accounts of the same person by construction and has no app write policy (0141). A stranger, or a door whose person has no church standing, still gets NULL.

## Decision

1. `join_church_instance` answers in this order, first answer wins: the caller's own church seat (unchanged); a linked identity's church seat, copied with the same role (owner > admin > the rest, 0182's rule); the leader allowlist and pending invites matched against every address that identifies the caller.
2. The door gets its own `instance_members` seat rather than every read learning `same_person`. That keeps DR-0311 §5, matches how the family space already seats the phone door (0140), and makes every existing read and policy answer correctly with no further change.
3. A seated door is named as the person: the name the app passes, else the linked seat's name, else the local part of a real address. Never the digits of a synthetic login.
4. Same contract as 0014: SECURITY DEFINER, pinned search_path, the advisory lock, an idempotent seat insert, the same signature. Nothing is deleted. The allowlist names and their roles are unchanged.

**On the one-account merge Darrell asked about** (recorded here because this defect is its cost): the full merge he wants is two sign-in methods on one account row. Today it is blocked because the phone road is a PIN stored as a password on a synthetic address, and one row cannot hold two passwords. The road to it is a phone sign-in that resolves to the primary account, which is a new authentication path and a Tier C change. Until then every identity read must honour the link, and this is the third read to learn it (0182, 0151, now 0294). `re-review: 2026-10-22` — sweep every remaining `auth.uid()`-only seat or role read for the same defect, and bring Darrell the design for a single-account phone sign-in.

## Verification

- `0294-church-either-door-smoke.sql` on a scratch PostgreSQL 16: FAIL on the 0014 join, PASS on 0294 applied twice. It asserts the linked door is seated as owner and reads owner, keeps the person's seat name, gets one seat on a second join, accepts an invite addressed to the other door, and that a stranger and an unlinked door get nothing.
- The same smoke runs on the live database in the rls-isolation choir-claim leg after the merge, using test accounts only.
- `church-either-door.test.js`: 17 pins, proven to catch on the 0014 join, a smuggled second owner, and a link written by the join.
- Live check after deploy and db-migrate: Darrell reloads Church → Order of Service at his phone door.
