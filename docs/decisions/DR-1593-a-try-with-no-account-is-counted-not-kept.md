# DR-1593: A try with no account is counted, not kept

**Date:** 2026-11-19
**Status:** Accepted
**Tier:** B (one anon-callable write with brakes, one governor-only read; no address stored)
**Type:** decision + feature
**Area:** migration 0341, `app/src/lib/supabase.js` (`signInWithPassword`, `signInWithPhonePin`), `app/src/lib/person-onboarding.js`, Signups > Needs help
**Pairs with:** DR-1592 (Needs help), DR-1336 (0315), DR-0107 (sign-in never breaks on the record-keeper), CLAUDE.md three brakes, DR-0076

## The question

Should the platform record a sign-in try made with a phone or email that has no account?

## What was measured

The auth server answers "Invalid login credentials" both for a wrong password and for an address with no account. The 0315 hook fires only for an account that exists. So a person who signed up with one number and keeps trying another, or who mistypes their email, is stuck and leaves no trace. Darrell asked to "see these issues from our data logs". This is the one stuck person the logs could not show.

## Why not the obvious way

Storing the address would keep personal data about someone who never made an account, readable by anyone who reads the table. An anon-callable write is also a door for spam and for checking which addresses have accounts.

## Decision

Count it, and never keep the address:

| concern | how it is held |
| --- | --- |
| the address | never stored. A sha256 over a random server-side salt is kept; the salt table has RLS on and every API privilege revoked |
| what the governor sees | a hint only: "phone ending 0142", or the first character and the domain of an email, the same masking the list already uses |
| a try for an address that has an account | nothing written (the hook already has it) |
| an enumeration oracle | the function returns nothing in every case |
| budget | 200 counted tries an hour across everyone, then tallied as dropped; at most 50 a day for one address; input bounded to 254 characters and an address shape |
| lock | no loop and no timer; one atomic upsert per call |
| kill-switch | `sign_in_miss_settings.enabled`; the screen says when it is off, and when the cap dropped tries |
| retention | 30 days, swept on every write |
| sign-in safety | called after the answer, fire-and-forget, bounded to 8 s; any error inside becomes a warning |

The governor's read (`admin_sign_in_misses()`, poe-family only) matches each hash against unclaimed Poe Properties invitations with the same salt. So "the invited tenant is trying to sign in before making an account" is said plainly, without an address leaving the database.

The app calls the counter only after `invalid_credentials`. A success, a network failure, or "email not confirmed" counts nothing (a proven-to-catch test).

## Verification

- `infra/supabase/tests/0341-sign-in-misses-smoke.sql` on PostgreSQL 16, 0341 applied twice: SIGN-IN MISSES SMOKE: PASS. It covers: anon counts a try; case and spaces fold to one address; the stored row carries no digits beyond the hint and the hash is salted; an account's address, junk and oversized input write nothing; the cap drops a try and the read shows it; switched off, nothing is counted; the 40-day row is swept; anon cannot read the tables, the salt or the governor's read; a non-governor is refused; the governor's read matches the invitation. Every assertion is scoped to the smoke's own addresses, so it also runs against the real database.
- Proven to catch: with the cap check removed the smoke fails, and with the account check removed it fails; restored, it passes.
- `a-try-with-no-account-is-counted.test.jsx` (7 cases) pins the wiring from both sign-in functions, the no-count cases, that the counter cannot break a sign-in, and the screen text.
- Not verified against the live database: the sandbox has no route to the NAS.

## Not done

A wrong or expired Royalty Link code is still not recorded: GoTrue's verify endpoint has no hook, and the client sees only the error. The smoke runs as the `sign-in-misses` leg of `rls-isolation.yml` against the real database, rolled back, with every assertion scoped to its own addresses. `re-review: 2026-12-03`.
