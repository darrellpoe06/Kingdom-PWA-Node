# Full profiles — one row per person, seen by the people who may already message you

**Date:** 2026-09-09 · **Branch:** `claude/property-photos-project-docs-cdsexr` · **Record:** DR-0342 · migration 0186

**Darrell:** *"we want users to have full profiles etc.... Robust Architecture and development and design"* — *"scalability is key"* — and first, *"review our Ways and what we have done historically."*

**Ways review (DR-0108).** A person in this app was a string: `instance_members.display_name`, one copy per instance, snapshotted into messages, choir rows and presence; leader-owned observations (0122) and grants (0126) about a member; no picture, house, ministries, testimony, or row the person owns. The recorded failures: copies that drift (the 2026-07-28 DM roster gaps), lists that carry bytes (DR-0303), buckets assumed (0183). The recorded successes: one owner-written row read by id; the server's permission reused (0118 mirrors `users_can_dm`); a thumbnail in every list, the full thing by id (DR-0339).

**Built.**
- `0186` — `profiles` keyed by `auth.uid()`; capped thumbnail and text fields; owner-only RLS; `get_profile(other)` reusing `users_can_dm` + owner `visibility`; `upsert_my_profile()` validating and syncing every membership's `display_name`.
- `lib/profiles-sync.js` — shapes, validation, thumbnail (160px, ≤32,000 chars), cached read by id, the one write.
- `ProfileCard` (opens from the name in a 1:1 thread header; the verse opens in place) and `MyProfile` (on Church → Engagement → Message a member).

**Proof.** `profiles-sync.test.js` (11, including SQL pins), `profile-surfaces-render.test.jsx` (4), `engagement-direct-render.test.jsx` (+2); migration guards (return-type, replay-order, completeness) green; ui-standards 0 regressions; consistency, contrast, module-boundary, monolith, fab-overlap, legibility OK; eslint clean.

**Honest limit.** No live sign-in from the sandbox; the live round-trip is the next service day's use. `re-review: 2026-09-16`.
