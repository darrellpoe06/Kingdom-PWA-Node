---
id: DR-0059
title: Self-serve account provisioning — family allowlist joins poe-family, everyone else gets their own instance; closes the dead-end, keeps the data wall
date: 2026-06-13
status: accepted
supersedes: []
superseded-by: null
tier: C
entities: [all]
grounds: [COMMUNITY-FIRST, DATA-AS-EMPOWERMENT, QUALITY-OF-LIFE, GOVERN-EXECUTE-ADVISE, EXECUTION-OUTCOME-OBSERVABILITY]
source: 2026-06-13 — Darrell, after Christina's live-use issues and looking ahead to the church: "we need those people to get an amazing experience not failures... We need user accounts from the beginning and none of this I'm in but not really type of situations." Chose: close the data-exposure gap now; open self-serve sign-up.
---

## Context

Two real signals converged:

1. **Christina's "I'm in but not really."** Identity and tier were a client-side
   guess — a hardcoded map of 5 family emails plus a default "Foundation" tier.
   Anyone outside that map signed in to a half-configured app.
2. **The church is coming.** Darrell named his father-in-law and COLG
   parishioners as the next users. They must get an *amazing* first experience,
   not a failure.

The codebase is already multi-tenant: an `instances` table, `instance_members`,
and per-instance RLS on every data table, with the church's own data model
(`parishioners`, `donor_giving`, …) keyed by `instance_id`. The architecture to
give each household/church its own space already exists.

The gap was **provisioning**. Every client sync path funnels through one RPC,
`join_default_instance()`. Originally it auto-enrolled **any** authenticated
user into the **poe-family** instance — and membership is exactly what RLS
checks — so a non-family sign-in could read *and write* the family's finances.
Migration `0001` (2026-06-12) closed that hole by **raising** for non-family
emails. Safe, but it turned a stranger's sign-in into a dead end
("ask the family to invite you") — the very "I'm in but not really" failure.

## Decision

**Open self-serve sign-up, at the same chokepoint.** Re-replace
`join_default_instance()` (migration `0002`):

- **Family allowlist → the shared `poe-family` instance** (unchanged from 0001;
  the data wall is preserved exactly).
- **Everyone else → their OWN instance** (`slug 'u-<uid>'`), as its `owner`.
  Their data syncs there; RLS keeps it fully theirs. No stranger ever touches
  family data — and no one hits a wall.

Because every sync funnels through this one function, the whole app does the
right thing with **zero client changes**: each user's table-syncs read and
write whatever instance the RPC returns.

Concurrency is made safe (parallel first-sign-in syncs) with a per-user
advisory lock + deterministic slug + `ON CONFLICT` guards, which also fixes a
latent race for a brand-new *family* member's first sign-in.

Decision was Darrell's (GOVERN-EXECUTE-ADVISE): he chose "close it now" and
"open self-serve." The migration rides the DB lane, so **merge = apply** — his
hand stays on the deploy.

## Scope — what this is and is NOT

- **IS (Phase 1, this DR):** the security guarantee + a working, isolated,
  self-serve account for every non-family user. The functional floor.
- **IS NOT (Phase 2, follow-on):** the *polished* first-run — named welcome,
  empty-state onboarding, profile/tier setup, demo→real hydration safety
  (LESSONS-LEARNED 2026-06-03). A self-serve user today lands in a working but
  unstyled empty instance; making that *amazing* is the next build.
- **IS NOT (separate future build):** the **shared church instance** — COLG
  staff/parishioners in one church tenant with roles. That is invitation +
  directory work governed by DATA-AS-EMPOWERMENT (opt-in, minors, community
  voice) and COMMUNITY-FIRST. It is added by mapping emails to the church slug
  in a new migration, plus the church-onboarding UI — not by this function's
  default branch.

## Consequences

- Adding a person to an existing shared instance (twins → poe-family; church
  staff → a church slug) = add their email to the allowlist in a **new**
  migration (per DR-0011), never an edit to a landed one.
- `instance_type` for a personal self-serve space defaults to `'family'`
  (a personal household OS); revisited when business/church onboarding lands.
- Verification is manual (the migration lane has no DB in CI): sign in with a
  non-family test email → confirm a fresh `u-<uid>` instance, `owner` role, and
  zero visibility of poe-family rows; sign in as family → still poe-family.

## Links

`infra/supabase/migrations-auto/0002-join-default-instance-self-serve.sql`
(this), `0001-join-default-instance-family-allowlist.sql` (the guard it builds
on), `infra/supabase/schema-v2.1-infra.sql` (the function + instances/RLS),
`app/src/lib/feedback-sync.js` / `table-sync.js` / `snapshot-sync.js` (the
callers), [DR-0054] (one release lane — merge = deploy), [DR-0011] (one
decision per file), COMMUNITY-FIRST-MISSION, DATA-AS-EMPOWERMENT-NOT-EXTRACTION,
QUALITY-OF-LIFE-AS-NORTH-STAR (`docs/00-foundations/_root/`).
