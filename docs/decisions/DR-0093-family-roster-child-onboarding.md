# DR-0093 — The Family Roster: children join through the safety rails, never through the allowlist

- **Status:** accepted
- **Tier:** C (family onboarding, a minor's data — shipped on the reviewed PR at the Governor's explicit direction: "I'll add my son and daughters so I can explain it to users")
- **Scope:** the household roster; every future family member, minors first
- **Date:** 2026-07-03
- **Principles:** DATA-AS-EMPOWERMENT, APP-IS-PRIMARY, VERIFICATION-DOCTRINE, REALITY-TRACE, QUALITY-OF-LIFE, GOVERN-EXECUTE-ADVISE, DECISION-RECORDS

## Directive

Darrell, 2026-07-03: "Can I add my son to my family account?" then, after the trace was reported: "I'll add my son and daughters so I can explain it to users." The Governor chose the safe-rails build.

## What the trace found (reality first)

Two doors existed into "family":
- **The safe door, built but door-less:** migrations 0055/0057 already model children correctly — `instance_members` role `'child'` deliberately outside the governor set (RLS walls it out of Forecast/Inventory/CRM/books), `family_member_profiles` with `minor_tier` (`under13`/`teen`/`adult`) and `coppa_protected GENERATED ALWAYS AS (minor_tier = 'under13')` (a guardian cannot un-protect a 10-year-old), guardian-only writes, `child_capabilities` + `child_action_requests` (a child never self-approves), family messaging with sibling privacy + guardian oversight and no external egress by construction. The `provision_child_member` RPC (guardian-only, SECURITY DEFINER) and the `provisionChild()` client helper existed — **wired to nothing**.
- **The dangerous door:** the hardcoded `FAMILY_EMAIL_PROFILES` allowlist in the shell (with a literal "add the twins' emails" TODO). That flag is binary: it unlocks all family financials and the imported bank/Gmail PII feed. FAMILY-SHARING-PERMISSIONS-STATUS.md names this exact move the highest-risk gap.

## Decision

Ship **FamilyRoster** (components/FamilyRoster.jsx + lib/family-roster.js), mounted in the Command, Control & Serve Center → **Serve** faculty (governor-gated, no-leak):

1. **Live roster** from `family_member_profiles` — name, tier badge (with the derived COPPA state shown), account-linked state. The empty state says it is the real table, not a placeholder.
2. **Add a member (guardian only)** — name + age band (+ optional account UUID), validated client-side (`validateProvision`: tier whitelist, UUID shape, persona slug), then `provision_child_member`. The RPC's upsert means add-now-link-later: re-adding the same name with the UUID fills in the account and grants the `'child'` role.
3. **Honest failure states, named:** a non-guardian is told the RLS wall refused; a missing 0057 migration points at the Migration-ledger row on the Quality & Throughput board. Never a silent no-op.
4. **The bright line, as a guard:** this surface never imports or calls `isFamilyEmail` / `FAMILY_EMAIL_PROFILES` — pinned by a test on code usage. Adding a child structurally cannot open the financials door.
5. **Guardian steps in-card:** account creation stays guardian-side in the Supabase dashboard (no child self-signup, by design), per the 0057 header.

## Guards

`family-roster.test.jsx` (14): pure rules pinned; the REAL card mounted in jsdom against injected IO — happy path (RPC called with normalized values), guardian-refused, migration-missing, bad-UUID-stopped-client-side; allowlist bright-line guard; RPC/migration seam parity (guardian wall + COPPA-derived column asserted in the real SQL); Serve-faculty mount guard.

## Not done, with why (DR-0075)

- **No device-picker child profiles yet** — the picker is a display/PIN overlay for the family shared-device experience; children signing in with their own accounts don't route through it. re-review: when the first child account is linked.
- **No app-layer `child`-role gating of client surfaces** — RLS is the real wall and holds today; the client currently treats a child sign-in as a regular non-family user (which shows LESS, not more). A client-side role read (`user_role_in_instance`) that tailors a child's view is the natural next slice. re-review: with the first linked child account.
- **No consent/assent capture flow** — DATA-AS-EMPOWERMENT's parental-consent + child-assent commitment needs a designed flow, not a checkbox bolted on tonight. re-review: before any child-facing data stream (IoT, biosensors, messaging beyond family) activates.

## Consequences

- Darrell can add his son and daughters now (name + age band) and demonstrate the flow to users; accounts link later without rework.
- The migration-ledger dependency is visible on the same board (if 0057 hasn't applied in the cloud, the card says so and the DB Health row shows why).
- The "add the twins' emails" TODO in the shell is now the road NOT taken — the roster is the paved path.
