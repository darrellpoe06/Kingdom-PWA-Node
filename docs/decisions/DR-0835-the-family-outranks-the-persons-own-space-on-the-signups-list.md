# DR-0835 — The family outranks the person's own space on the signups list

- **Status:** accepted
- **Tier:** A (one SECURITY DEFINER read function re-ranked; no table, no policy, no new grant)
- **Type:** fix
- **Date:** 2026-10-09
- **Scope:** `infra/supabase/migrations-auto/0257-the-family-outranks-the-persons-own-space-on-the-signups-list.sql` (`admin_signup_metrics` re-created: the naming membership chosen by what the space is, then by join date; `spaces` count per account), `infra/supabase/tests/0257-signups-family-outranks-own-space-smoke.sql` (six assertions), `.github/workflows/rls-isolation.yml` (role-control leg carries both), `app/src/components/AccessUsageMetrics.jsx` (the add's sentence points at the badge), `app/src/__tests__/signups-named-from-your-contacts.test.jsx` (+1).
- **Principles:** DR-0829 (make an existing account family from the signups row), DR-0219 (SHOULD, ARE, GAPS, CLOSE: the sentence said done, the badge said otherwise), DR-0076 (the smoke fails on 0079 and passes on 0257), DR-0060 (the governor gate is unchanged).
- **Grounds:** Darrell, 2026-10-09, two screenshots: Christyn's row reading *"Christyn Poe is now Member (edit) of Poe Family."* beside a badge still reading PUBLIC SIGNUP and a tile still reading 4 family. *"Doesn't show the member has arrived based on the label after switching Christyn to family... End to end!!!!!!!!!?!!!!!!!!!"*

## Context

The signups list re-reads itself after an add (DR-0829 wired `onDone` to the loader). It re-read, and the badge did not move, because the read was wrong: `admin_signup_metrics` (0079) named each account by ONE membership chosen with `ORDER BY (church) ASC, joined_at ASC`, the earliest space joined. Every self-serve account joins its own `u-*` space on its first day, so a family membership granted later could never win. Christyn was family in the database and "public signup" on the screen.

## What was measured

- 0079 lines 108-115: the LATERAL picks `im2.joined_at ASC LIMIT 1`; a `u-*` row joined weeks earlier always precedes the family row joined today.
- The smoke, run on a local PostgreSQL 16 against 0079: `SMOKE FAIL: made family later still reads self-serve (0079 picked the earliest space)`; against 0257: `SIGNUPS CATEGORY SMOKE: PASS`.
- The screenshot: the sentence, the unchanged badge, the unchanged tile; the signups suite as it was passed because its mock never changed its answer between reads.

## Impact

- Unresolved: every account the governor makes family, church or business from the signups row keeps reading as a public signup, and the family tile never counts them; the surface contradicts the database it says it reads.
- The call obligates: the membership that names an account is the most significant one the person holds, and the list says how many spaces hold them. The governor gate, the privacy posture, the presence join, the tiles, the detail cap and the truncation flag are 0079's, untouched.

## Decision

1. **Rank by what the space is, then by when it was joined:** poe-family first, then a church, then any other named space (a business), and the person's own `u-*` space last. A self-serve account alone still reads self-serve; no space at all still reads unprovisioned.
2. **`spaces`** on each row: how many spaces hold the account, so a person in two reads as such.
3. **The role-control isolation leg** applies 0257 and runs its smoke on the hosted database on every CI pass; the smoke joins its own governor to the real poe-family inside its transaction and reads only its own rows, never a total.
4. **The add's sentence points at the badge:** *The badge below updates as the list re-reads.* The sentence is not the proof; the badge is.

## Verification

- `0257-signups-family-outranks-own-space-smoke.sql`: made family later reads family with 2 spaces and the family membership's name; own space alone reads self-serve; a church outranks the own space; a business outranks it; no space reads unprovisioned; the family tile counts; a caller outside poe-family is refused. Fails on 0079, passes on 0257 (local PostgreSQL 16, this session).
- `signups-named-from-your-contacts.test.jsx` (6): after the add the list is re-read and the badge and the family tile follow the server's word; the mock now answers a fresh object per call, as the real fetch does.
- Owed after merge: db-migrate applies 0257 to the hosted project; the role-control leg green; Christyn's row reads FAMILY on the live build and the tile 5.
- `re-review: 2026-10-16`: the Who-has-access roster and the signups list read side by side on the live build for anyone added that week.
