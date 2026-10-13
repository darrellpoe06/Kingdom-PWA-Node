# DR-0613 — The NAS publishes the family key itself; no steward pastes it, and the Voice page assigns no chore

- **Status:** accepted
- **Tier:** B (a migration: one SECURITY DEFINER function callable by the service role only; a no-leak smoke in the isolation matrix)
- **Type:** fix
- **Date:** 2026-09-24
- **Scope:** `infra/supabase/migrations-auto/0231-the-nas-publishes-the-family-key-itself.sql`; `infra/supabase/tests/0231-box-publishes-family-key-smoke.sql` and its leg in `.github/workflows/rls-isolation.yml`; `infra/nas-bridge-publish/` (new: `publish_family_key.py`, `test_publish_family_key.py`, `owners.txt`, `install.sh`); `infra/nas-loops/services.json` (the `family-key` rider); `.github/workflows/ci.yml` (the proofs gate merge); `app/src/lib/voice-system-check.js` (the key row's "What to do"); `app/src/__tests__/the-key-provisions-itself-before-the-read.test.js` (the pin)
- **Principles:** DRIVE-DONT-DELEGATE ("Humans don't do anything is our Ways", 2026-08-03), DR-0247 (agreed work starts itself), VERIFICATION-DOCTRINE (DR-0076: the no-leak smoke), DR-0060 (tenancy), SOVEREIGNTY
- **Grounds:** Darrell, 2026-09-24, with two screenshots of the Voice page (poetech.us/poetech-app/?view=voice) showing FAIL on "This device holds the family key the studio requires" and FAIL on "The voice studio answers": *"The voice needs an engineer to make work!!!!!!!!!? Fix it so users can do it!!!!!!!!!!!!"*, then *"What happens when the nas is down?!!!!!!!!!!!"*

## Context — the question

The Voice page's key row told a signed-in family member that "a steward pastes it once in Real Estate → Photos". That is an engineer's step presented to a user.

## What was measured

| what | measured |
| --- | --- |
| `family_secure_config` on the live project | **0 rows**: the key had never been published |
| where the key exists | on the NAS, `/volume1/PoeTech/secrets/chat-bridge-token.txt`, minted by `infra/nas-property-photos/install.sh:18` and read by `infra/voice-studio/install.sh:52` |
| the device side | already automatic: `lib/bridge-provision.js` asks `get_family_bridge_token` (0128) for the key; it had nothing to return |
| the studio | measured dark from the NAS earlier today (NAS health run 36017773837: the forwarder's pass-through `HTTP 502`); the arming lane waits on the `TOWER_CREED_PASSWORD` repository secret |

## Impact

Unresolved: every family device showed a red key row with a chore no user can do, and reading stayed on the stand-in voice even with the studio up. Resolved: the key reaches every family device with no human step, and the page says "Nothing for you to do".

## Decision

1. **The NAS publishes the key itself** on the self-deploy clock (services-sync, every 15 minutes) through `box_publish_family_bridge_token` (0231): callable by the service role only; writes only to non-church instances where an account in the committed `owners.txt` is owner or admin; writes only when the stored key differs. The key opens the family NAS, so no other instance ever receives it, proven by the smoke (a non-named owner's instance and a church instance receive nothing; an authenticated user cannot call it; an outsider reads NULL).
2. **The Voice page assigns no chore.** The key row reads "Nothing for you to do" and names the only real cause left if it stays red: the account is not an owner or admin of the family space. A pin forbids the paste chore from returning.
3. **When the NAS is down** (his question), stated plainly: the key already published keeps working (it lives in the database, not on the NAS); the voice studio is unreachable, because the voice road runs web → NAS → tower, so reading plays in the labelled stand-in voice; spoken lessons wait safely in the private bucket and are transcribed when the NAS returns; typed lessons, the lesson reader and the Decision Intelligence board run on the cloud database and are unaffected.
4. **The studio row** ("The voice studio answers") already assigns no chore. The studio's absence is a machine state, not a user step: the tower must be on and armed. Arming waits on one value only Darrell holds, the `TOWER_CREED_PASSWORD` repository secret; that is the single remaining human step in the whole voice chain, and it is a one-time value, not engineering.

## Verification

- `test_publish_family_key.py` 7 (CI); the 0231 smoke in the RLS matrix on the real database (rolled back); `the-key-provisions-itself-before-the-read.test.js` and the voice-system-check suites, the services-sync guard, the migration guards: green. eslint 0.
- After merge: db-migrate applies 0231; within 15 minutes of the NAS mirror pulling, `select count(*) from family_secure_config` reads 1 or more; open the Voice page signed in and the key row reads PASS.

## Limits, stated

1. **The voice depends on two machines** (the NAS forwarder and the tower). A tower-side Funnel path would let the voice survive a NAS outage; it is an architecture change to the transport (RECORDED-STATE) and is recorded here, not taken silently. `re-review: 2026-10-07`.
2. **If the NAS lacks the Supabase service credential**, the rider says so by name each cycle and publishes nothing; the credential file is the one `load-transcripts.py` already writes with, so it is expected present.
