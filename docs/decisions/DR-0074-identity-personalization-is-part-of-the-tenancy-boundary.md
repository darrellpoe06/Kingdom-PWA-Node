---
id: DR-0074
title: Identity personalization is part of the tenancy boundary — gate real names + the family picker on VERIFIED membership, not on the presence of a session; RLS-test a suspected exposure before calling it a breach
date: 2026-06-14
status: accepted
supersedes: []
superseded-by: null
tier: A
entities: [all]
grounds: [DATA-AS-EMPOWERMENT, COMMUNITY-FIRST, EXECUTION-OUTCOME-OBSERVABILITY, GOVERN-EXECUTE-ADVISE, QUALITY-OF-LIFE, LESSONS-LEARNED]
source: 2026-06-14 — a young parishioner (Jayden) signed in to poetech.us, could not "get in," and the app showed "Darrell" at the top as if he were Darrell. Darrell feared a family-data exposure. Investigation: authentication + instance provisioning both succeeded; the wall was a post-auth UX gate, and the name was a hardcoded UI string, not a data read. Confirmed no leak by an RLS reality test against live data + the parishioner's own feedback screenshot.
---

## Context

A signed-in NON-family user (a parishioner with his own account + instance)
hit two things built only for the Poe family device-sharing model:

1. **The family device-picker was a full-screen lockout** for him — "Who's
   using this device?" offered only Darrell / Christina / Family, none of them
   him, and could not be dismissed without picking one. He authenticated, then
   could not get in. His own feedback (mirrored to the `feedback` table, his
   instance): *"My name isnt at the top | Missing: Jayden brown."*
2. **Real family first names rendered to him.** `PROFILES` substituted the
   real names ("Darrell"/"Christina") whenever `authSession` was truthy — i.e.
   gated on "is anyone signed in?", not "is this a family member?". He picked
   "Darrell" (the only owner option) and the header showed DARRELL.

Darrell read "Darrell at the top" as a possible data breach. It was not. The
name is a hardcoded UI string; the **RLS reality test** proved the data wall
held: with `Prefer: count=exact`, `service_role` (bypasses RLS) saw the real
rows while the unauthorized identity's own path got **401/blocked on every data
table** (instances, instance_members, family_snapshots, accounts, feedback).
The parishioner's only membership is his own EMPTY instance; the uniform RLS
predicate `user_in_instance(instance_id)` confines his reads to it. His
feedback screenshot showed only the name + PUBLIC foundation-tier content
(the COLG church card, already public; an install prompt) — no financials, no
private records. Severity: **cosmetic identity-label exposure, not a breach.**

This is the identity analog of DR-0060: the tenancy boundary was understood as
covering *data rows*, but **personalization (names, the picker, "whose device
is this") is also part of that boundary** and was gated on the weaker signal.

## Decision

**1. Identity personalization gates on VERIFIED family membership, never on the
mere presence of a session.** Real names show only to a verified family email
(`isFamilyEmail`); every other state — anonymous, demo, picker, and an
*outside signed-in user* — keeps the sanitized pair (Adam/Naomi). The family
device-picker (Darrell/Christina/Family) is a family-only surface and never the
landing for a non-family account.

**2. A signed-in non-family user gets their own self-serve profile, never the
family picker.** The provisioning effect assigns `currentProfile = 'self'` for
any signed-in email not on the family allowlist. `'self'` is deliberately NOT
in `PROFILES` (no extra picker button), is excluded from the wf18 family-PII
gate, and hides the profile-switch chip — so the parishioner lands in their own
(empty) space instead of a lockout. This completes DR-0059 Phase 2 in code.

**3. Before a suspected exposure is called a breach, run the RLS reality test
against live data.** Compare what `service_role` (RLS bypassed) returns vs what
the unauthorized identity's OWN path returns (anon / a non-member token), with
exact row counts. A cached or hardcoded name on screen is **not** a data read;
only rows returned through the user's own RLS path are. Distinguish the two
before escalating — the panic cost of "my family data is exposed" is real, and
so is the cost of dismissing a real leak; the test resolves which it is in
minutes (LESSONS P21).

## Consequences

- The name-gate and the `'self'` profile shipped to `main` on 2026-06-14 (the
  two code halves of this record). This DR is the governing rationale + the
  RLS-reality-test discipline; it is Tier A (a documented privacy/UX fix on a
  trust surface) per RELEASE-TIERS.
- Forward fix (queued, not in this change): extend the DR-0060 tenancy guard
  with a third class — **identity/personalization gated on `authSession` alone
  rather than `isFamilyEmail`** fails the build — so this class is *prevented*,
  not re-discovered (the binding pattern of DR-0060). The guard ships only after
  it is proven to CATCH the break (anti-theater discipline).
- Known residual: a `'self'` user's own newly-created entities inherit the
  default `visibleTo: ['darrell','christina','family']` backfill, which the
  entity filter would hide from `'self'`. Harmless for a brand-new empty
  instance; flagged in LESSONS as a watch-item for when self-serve users create
  real entities.
- Open, separate symptom (not auth-identity): Darrell is logged out after a
  time. No in-app code clears the session; the client config is correct
  (`persistSession`/`autoRefreshToken`/localStorage). Most-likely the default
  ~1h access-token TTL + a suspended-PWA / multi-device refresh-token rotation;
  confirm the JWT-expiry + refresh-reuse-interval in the Supabase dashboard.

## Links

`app/src/poe-financial-mvp-v28.jsx` (`PROFILES` name-gate via `isFamilyEmail`;
the `setProfile('self')` provisioning branch), `app/src/lib/supabase.js`
(session config), [DR-0059] (self-serve provisioning — this completes its Phase
2), [DR-0060] (tenancy guard — the data analog; the forward fix extends it),
[DR-0064] (act-without-re-asking — this fix shipped in-lane), LESSONS-LEARNED
(2026-06-14 entry; P20/P21), DATA-AS-EMPOWERMENT-NOT-EXTRACTION,
COMMUNITY-FIRST-MISSION (the parishioner is the named first community).
