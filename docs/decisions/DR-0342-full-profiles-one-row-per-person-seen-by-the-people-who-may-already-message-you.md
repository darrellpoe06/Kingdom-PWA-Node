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

## Amendment 2026-09-09 — the picture is seen everywhere a person appears, and the header carries the person (Darrell, three screenshots)

*"Make sure the picture is visible on the apps... users like to see their picture... also... move messages to the first tab spot... then family then trivia... All apps users profile shows and has login or out under it... so it is looked at... or seen... And upload a photo spot."*

His saved profile — Darrell Poe, Poe Family, IT, Media, a picture — sat on one screen while the thread list beside it showed `mrspoe06` and `darrellpoejr` with no face, and the header showed a bare LOG OUT box. A profile shown only on its own card is a profile nobody sees. Decided and built:

1. **One hook hands a surface the profiles of everyone on it** — `lib/use-profiles.js` (`useProfiles(userIds)`, one cached `get_profile` read per person, DR-0303's thumbnail-by-id) and `preferredName(profile, ...fallbacks)` (the chosen name first, then the roster's, then the name a message carried).
2. **Faces on the church surfaces:** the 1:1 thread list rows (40px), the open-thread header (22px), the Start-a-message chips (20px), the incoming bubbles (20px), every family-thread message (22px), and the My-profile fold itself (28px, with the person's name in its label). A person without a profile shows initials and the name the surface already had — never a blank.
3. **The header carries the person, on every app** — `HeaderAuthButton` signed in: picture (or initials plus a `+ photo` spot), chosen name, and the obvious bordered **Log out** beneath, exactly where DR-0134's TLC-style box sat. Tapping the face or the name opens **My profile** in the quiet Modal — the upload spot on whichever app they are in — and the header re-reads the row when the dialog closes, so a new picture shows the moment it is saved. The frozen shell still mounts it with one line.
4. **Engagement opens on Message a member,** then Family thread, then Trivia — his order.

Proven-to-catch: `engagement-direct-render.test.jsx` (+2: the tab order and default; a start chip carries the saved picture and the chosen name), `engagement-voice-sections-render.test.jsx` (order pin rewritten to the new truth), `header-auth-button.test.jsx` (+4: picture + name above Log out; initials + `+ photo` without one; the face opens the editor; signed out shows only Log in). Consistency guard: the header chip bounds its name inline, not with a width-cap class (CONSISTENCY-STANDARD rule 1). Honest limit: the sandbox cannot sign in, so the header chip and the faces on real rows are proven in jsdom against the real components; the live look is the next sign-in.

## Amendment 2026-09-09 (11:07 PM) — a server's failure is said in words; the sovereign proxy never streams an edge error page

Darrell's phone, build 3D2417D: My profile's status line filled with `<!DOCTYPE html> ... <title>Origin DNS error |` — Cloudflare's 1016 page, which is what a Pages Function's `fetch()` returns when the Funnel hostname does not resolve. `functions/_lib/funnel-proxy.js` streamed it verbatim, supabase-js made it `error.message`, and the form printed it raw. Two closes: (1) the proxy turns an HTML 5xx from the edge into one JSON 502 with `code: upstream-unreachable`, the page's `<title>` as `detail`, and a `message` a person can read ("The church server could not be reached (Origin DNS error). Nothing was changed — try again in a moment."); the NAS's own JSON errors pass through untouched. (2) `lib/server-error-text.js` — `humanizeServerError()` — is the belt under it: an HTML body is never shown, its title is the one fact kept, and the sentence names what did not happen; the profile save path uses it. Pinned by `server-error-text.test.js` (9: the proxy on a real 530 page, JSON pass-through, a healthy 200 unchanged, the humanizer's cases, a source pin on the save path). The 12 other surfaces that still print `error.message` raw are covered at the transport for sovereign failures; the client sweep onto the helper is dated `re-review: 2026-09-16`.
