# DR-1336: Sign-ins and failures are on the record — GoTrue's own hook writes the rows the audit table was built for

**Date:** 2026-11-05
**Status:** accepted
**Tier:** B (a migration on a core table: `audit_log.instance_id` becomes nullable for one class of row; a GoTrue hook switched on in the sovereign compose; a required CI leg)
**Type:** security posture + gate (VERIFICATION-DOCTRINE) · DR-1330 D6
**Area:** `infra/supabase/migrations-auto/0315-sign-ins-and-failures-are-on-the-record.sql`; `infra/supabase/tests/0315-auth-events-smoke.sql`; `infra/nas-supabase/docker-compose.yml` (auth service); `.github/workflows/ci.yml` (leg `auth-events`, in the aggregator); `.github/workflows/rls-isolation.yml` (matrix entry); `.github/workflows/nas-health.yml` (the six-hour read)
**Grounds:** VERIFICATION-DOCTRINE (DR-0076 §3 proven to catch), DR-0107 (a down site is the worst outcome: the hook never rejects), DR-0060 (the database is the wall), DR-1330 (the review that measured the silence)

## Context

The Ways review (DR-1330) measured that `audit_log` has allowed `login` and `failed-auth` since the day it was created and nothing ever wrote them: role changes and support grants were audited, a sign-in and a wrong password were not. The slide's "log critical security events" had a table and no writer. Darrell ratified the build.

## What was measured

- **The writer is the auth server's own hook.** GoTrue v2.177.0 calls a Postgres function on every password verification attempt when two env vars are set on the auth service; migration 0315 provides `auth_password_verification_attempt(event)`, which writes one row (`login` or `failed-auth`, `entity_type = 'auth'`, the person's first instance or none) and returns `{}` on every path, including a malformed event or a failed insert, with a WARNING. It remembers; it never rejects, so sign-in behaviour is unchanged (DR-0107).
- **Whose row:** the person's. `audit_log.instance_id` becomes nullable so a fresh profile with no instance still gets its row; the member-read policy never shows a NULL-instance row. `auth_events_recent(p_hours)` returns the auth rows of the instances the caller owns or administers (capped at 500 rows and 30 days); members and anon cannot execute it; the hook itself is not callable by the signed-in.
- **Proven on a real PostgreSQL 16 here, before CI:** 0315 applied twice; the smoke's eight assertions passed; with the owners' read revoked the same smoke failed at the owner's read; the migration restored it and the smoke passed again. The CI leg `auth-events` repeats exactly that on every push and is in the required aggregator; the rls-isolation matrix runs the smoke against the live database daily, rolled back.
- **The read:** nas-health's six-hourly observe prints sign-ins, failures and distinct people for the last six hours and raises a workflow warning at twenty failures (the shape of a guessed PIN). An in-app feed rides D7's register page under Admin, reading `auth_events_recent`.

## Impact

Every password attempt against the sovereign auth server leaves a row from the moment the compose change deploys through services-sync and GoTrue restarts with the two hook variables. The twelve guards that judge migrations are green on 0315. Not done here: an alert to a phone (the ntfy road is itself under review in nas-signin-heal.yml); the warning in the nas-health run is the bell until then. `re-review: 2026-11-19` — read the first two weeks of rows on the live database and set the burst threshold from what a normal day measures, not from the guess of twenty.

## Decision

The hook, the read, the leg and the matrix entry are the Way for auth events; a new auth-relevant action is a row in `audit_log` with a smoke, never a log line nobody reads.

## Verification

Local PostgreSQL 16: 0315 twice, smoke PASS, fault CAUGHT (`permission denied for function auth_events_recent`), restore PASS. Guards: migration-prose, migration-return-type, smoke-sql-language, replay-completeness, migration-replay-order, rls-isolation-matrix, inline-constraint-replay, newest-definition-replay, constraint-allow-list, measurement-carries-no-identity, workflow-list-order, infra-transport — all OK. `ci.yml`, `rls-isolation.yml`, `nas-health.yml` and the compose file parse.
