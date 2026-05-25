# Home Church Pattern — Forthcoming Note

> **Status:** FORTHCOMING / note 2026-05-25. Darrell direction: *"This Church Tab will eventually be any user's home church if possible, not sure yet."*
>
> **Purpose:** capture the intent and the schema-level reality so the Church tab can serve any user's home church without forcing a v3 redesign.

## What Darrell said

The Church tab currently surfaces The Church of the Living God (COLG) — the Poe family's home church — using a single `data.church.*` seed object inside the v1 React app. The forward intent is to let any user pick *their* home church, with all the same shape: service times, broadcast/social, give links, ministry openings, prayer requests, voice/link notes.

## What the schema already supports (no new tables needed)

The multi-domain schema landed in v2.1 + v2.7 already supports multi-tenant churches without change:

- **`instances.instance_type = 'church'`** — every church is its own instance.
- **`instance_members`** — a user can be a member of multiple instances simultaneously (the family instance + the church instance, plus a second user could be a member of *their* family + *their* church). The titles in `instance_members.title` describe the human role; the CRUD `role` controls permissions.
- **`parishioners`, `prayer_requests`, `ministries`, `ministry_signups`, `donor_giving`, `volunteer_hours`, `service_offerings`, `giving_reconciliations`** — all scope to `instance_id`. No row leaks between churches.
- **`external_users.type = 'parishioner'`** — non-member attendees + congregation-portal access work the same way per `_root/ECOSYSTEM-PARTICIPANTS.md`.

The schema is already correct for "any user's home church." What changes is the UI + the seed loading path.

## What needs to be built (UX-layer work, not schema)

1. **Pickable home church.** When a user lands on the Church tab, the surface reads their *home church* from `user_instance_settings` (or a new `user_settings.home_church_instance_id` field) rather than the hardcoded `data.church.*` seed.
2. **Discovery flow.** First-time visit: prompt the user to either (a) connect to an existing church instance they're a member of, (b) create a new church instance (subject to tier — Church / Nonprofit tier), or (c) decline and proceed without a home church (still useful: prayer journal, voice notes, ministry interest tracking against no specific church).
3. **Seed format published.** A simple JSON format for the per-church `data.church.*` shape (name, nickname, tagline, verse, services, media, links, contactEmail) that a church admin can paste in to seed their instance's church record. Future: a form-based admin surface.
4. **Cross-church membership.** A user attending multiple churches (visiting family, traveling for missions, dual-affiliated) can be a member of multiple church instances. The home-church picker has a "primary / visiting" distinction.

## Privacy posture (unchanged from existing foundations)

The same posture from `LEGAL-PRIVACY-BOUNDARY.md` + `ECOSYSTEM-PARTICIPANTS.md` + the v2.1 AES-GCM extension applies:

- A user's prayer requests are scoped to the church instance the request was submitted within. Switching home church does NOT migrate prior prayer journal entries across instances.
- Voice/link notes from the Add Your Voice surface are local-first; sharing crosses an audience boundary only on explicit per-row consent (the audience enum from `prayer_requests`).
- Confessional content (`confessions` table, client-side AES-GCM in v2.1) stays per-user, never leaves the device decrypted, never auto-migrates between churches.

## When this lands

After v2.x React rename is complete + the live Supabase swap to instances is verified. The home-church picker is a small new tab/widget; the data layer is already in place.

## What does NOT need to change

The Add Your Voice surface (church-tab voice + link + text input center) already accepts text + voice + link. It's tab-agnostic by construction — the JSX renders against whatever `church` prop is passed in. Once `church` is sourced from a user-pickable home church instead of the hardcoded seed, the surface "just works" for any user's home church without re-implementation.

---

*Cross-reference:* `_root/ECOSYSTEM-PARTICIPANTS.md` (parishioner external_users type), `_root/COUNCIL-CHAMBER.md` (the listening surface, where pastoral conversation lives — also tab-agnostic), `_root/LEGAL-PRIVACY-BOUNDARY.md` (the bright line to TLC stays in place per church instance), `_root/MULTI-INSTANCE-STRATEGY.md` (the multi-instance model the schema implements).

*Schema files this depends on:* `infra/supabase/schema-v2.1-infra.sql` (instances + instance_members) and `infra/supabase/schema-v2.7-church.sql` (parishioners + service_offerings + giving_reconciliations). Both already pushed to origin.
