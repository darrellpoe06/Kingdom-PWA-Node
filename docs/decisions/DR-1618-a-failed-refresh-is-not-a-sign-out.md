# DR-1618: A failed refresh is not a sign-out

**Date:** 2026-11-24
**Status:** Accepted
**Tier:** B (sign-in behaviour on every door; client only, no schema, no money)
**Type:** bug fix
**Area:** `app/src/lib/supabase.js` (`resolveInitialSession`), `app/src/__tests__/a-failed-refresh-is-not-a-sign-out.test.js`
**Sent in by:** Darrell, 2026-11-24, three screenshots after DR-1617 deployed: "Still and issue!!!!"
**Pairs with:** DR-1617, DR-0076, DR-0107

## Context

DR-1617 deployed (build `cd21ca0`, "latest" on his tablet). At 9:39 PM local he was signed in and named Darrell. At 9:40 the signed-out front page showed, beside "Read failed: public_vacancies · rpc-error · TypeError: Failed to fetch". At 9:40 he was signed in again.

## What was measured

- auth-js 2.118 `getSession()` (`GoTrueClient.js` `__loadSession`, lines 2537-2570): when the stored access token has expired, it calls `_callRefreshToken`, and on any error it returns `{ data: { session: null }, error }`.
- `_callRefreshToken` (lines 4296-4313) keeps the stored session on a retryable error (a failed fetch, a 5xx). Only a rejected refresh with an expired access token removes it.
- `resolveInitialSession` emitted every reconcile result, so `{ session: null, error: Failed to fetch }` became "signed out" and the gate painted the front page while the sign-in sat in storage. The next successful refresh signed him back in. That is the flip in the screenshots.
- The trigger is the same road failure that leaves the homes list empty: the app reaches the NAS by the absolute Funnel URL (the 2026-10-09 temporary unlock), and those fetches fail at times. The access token lives one hour, so every return after an hour away met it.

## Impact

Anyone whose access token had expired was shown the signed-out front page whenever the road to the NAS blinked, and signed back in when it recovered, with no action of their own. DR-1617's server fix could not reach this, because the refresh never arrived at the server.

## Decision

A reconcile that answers a null session **with an error**, while the session is still stored on the device, keeps the session and emits nothing. A real sign-out still reads signed out: a rejected refresh removes the stored session (so storage is empty and the null is emitted), and `onAuthStateChange` still reports `SIGNED_OUT`. A null with no error (never signed in) and a fresh session from the server are unchanged.

## Verification

`a-failed-refresh-is-not-a-sign-out.test.js`, 5 cases: a network-failed refresh keeps the stored sign-in; a rejected refresh that cleared storage reads signed out; never-signed-in reads signed out; a fresh session replaces the stored one. **Proven to catch:** the old reconcile emits null on the failed fetch. The auth suites that use `resolveInitialSession` or `readPersistedSession` pass beside it (169 tests). eslint clean.

**Not verified here:** the road itself. The "Failed to fetch" is the Funnel transport debt DR-1617 recorded. This change stops it from signing anyone out; it does not make the reads succeed. `re-review: 2026-11-26`
