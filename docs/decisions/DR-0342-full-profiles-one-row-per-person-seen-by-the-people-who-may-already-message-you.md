# DR-0342 — Full profiles: one row per person, seen by the people who may already message you

- **date:** 2026-09-09
- **status:** accepted
- **tier:** B (one additive migration — a per-user table, owner-only RLS, two SECURITY DEFINER functions that reuse an existing permission and add no reach; no money, no public surface widened)
- **decides:** what a person's profile is in the app, where it lives, who may see it, how it scales, and where it is edited and shown first
- **pairs-with:** DR-0181 (1:1 messages; `users_can_dm` is the one permission), DR-0303 / P40 (the list never carries the bytes), DR-0061 (reality-trace), DR-0076, DR-0100, DR-0108 (Ways review), DR-0331 (his words for meaning)
- **source:** Darrell, 2026-09-09, from the church door, in three lines: *"we want users to have full profiles etc.... Robust Architecture and development and design"* — *"scalability is key"* — after *"review our Ways and what we have done historically first so we don't do what we already know didn't work."*

## The Ways review first (DR-0108)

What the record holds about "a person" in this app: `instance_members.display_name` — one copy per instance a person belongs to (schema v1 `tenant_members`, renamed in v2.1); snapshots of that name in messages (0009), choir rows (0011) and presence (0055); stewardship observations about a member (0122) and per-member capability grants (0126) — both **about** the person, owned by leaders; voice profiles (0047) for the reader's voice. No picture. No house. No ministries a person names for themselves. No testimony. No single row the person owns. Every surface that shows a person shows a string.

What the record says fails: per-surface copies that drift (the 2026-07-28 review's GAP 1 and GAP 2 on the DM roster were both copies disagreeing with the source); lists that carry bytes (DR-0303, the 2026-08-14 lockout); a bucket assumed rather than asserted (0183). What the record says works: one owner-written row read by id; the server's permission reused rather than a new one invented (0118 `list_dm_contacts` mirrors `users_can_dm` "adding no reach"); a thumbnail in every list and the full thing by id on open (DR-0339).

## The decision

1. **One row per person** — `profiles`, keyed by `auth.uid()`, not per instance. A family member who is also a church member is one person with one profile; instance rows keep role and membership. Lookup is a primary-key read; nothing fans out. *(scalability)*
2. **The list never carries the bytes.** The only picture is a thumbnail (`photo_thumb`, a data URL capped at 32,000 characters, about 160px), fetched by id when a card opens, never in a roster. No storage-bucket dependency, so a sovereign box without buckets still serves profiles. Every text field is capped; a row stays a few KB for ever. *(scalability, DR-0303)*
3. **Who may see it is not a new policy.** "May I see your profile?" has the same answer as "may I message you?" — `users_can_dm` (0096). `get_profile(other)` reuses it and adds no reach. The owner narrows it with `visibility`: `members` (default; anyone who may message me sees the full card), `leaders` (only owners/admins of a shared instance), `private` (name and picture only). Name and picture are never hidden from someone who may message you: a thread must always show whom it is with.
4. **One write, one name everywhere.** `upsert_my_profile()` validates on the server and, when the name changes, updates `instance_members.display_name` for every membership the person holds, by the indexed `user_id` — the roster, the contact list and every message header agree from one write.
5. **No direct SELECT for others.** RLS lets a person read and write only their own row; everyone else reads through the function. Profiles cannot be enumerated.
6. **Where it shows and where it is edited, first:** the person's name in a 1:1 thread header opens their card in place (`ProfileCard`); **My profile** (`MyProfile`) sits on Church → Engagement → Message a member. The favorite verse opens in place through `VerseChips` (DR-0340) — the Word is never a string on a card.

## Proven-to-catch (DR-0076 §3)

- `profiles-sync.test.js` (11): pure shapes and validation refuse what the server refuses before it leaves the device; a card is fetched once by id and cached; the save sends exactly the function's arguments; a bad save never reaches the server; the thumbnail helper returns a data URL. **Source pins on 0186** fail if: the table stops being keyed by `auth.users`, RLS opens SELECT to everyone, the thumb or text caps vanish, `get_profile` stops reusing `users_can_dm`, the visibility set changes, or `upsert_my_profile` stops updating every membership's name.
- `profile-surfaces-render.test.jsx` (4) and `engagement-direct-render.test.jsx` (+2): the real `ProfileCard` shows the full card (verse openable in place), the honest partial card for `private`, and a name-only card for a person without a profile; the real `MyProfile` loads mine, edits, and saves through the one write with validated fields; on the real Engagement, the name in an open thread opens the card, and My profile opens the editor.
- Migration guards green: return-type, replay-order, replay-completeness.

## Honest limit (DR-0100)

The sandbox cannot sign in to the live church, so the live round-trip (save → another member opens the card) is not exercised here; it rides the same RPC seam every other church surface uses. The visibility rules are proven in SQL by pin and in the client by render; the first live proof is the next service day's use. `re-review: 2026-09-16` — confirm on the live app that a saved name reaches the contact list and a private profile shows name and picture only.

## Consequences

- Increment 2 (not yet built, dated): the card opens from every place a person is named — the family thread, choir and bus rosters, the presence readout, the stewardship view (`MemberInspect` reads the profile beside its observations). `re-review: 2026-09-16`.
- Increment 3: house = a real link to the family instance rather than free text, once the family door exposes a readable house name. `re-review: 2026-09-30`.
