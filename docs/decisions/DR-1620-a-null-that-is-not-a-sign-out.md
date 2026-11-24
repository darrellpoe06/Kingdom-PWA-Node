# DR-1620: A null that is not a sign-out keeps the stored session

**Date:** 2026-11-24
**Status:** Accepted
**Tier:** B (sign-in behaviour on every door; client only, no schema, no money)
**Type:** bug fix
**Area:** `app/src/lib/supabase.js` (`onAuthChange`), `app/src/poe-financial-mvp-v28.jsx` (the profile picker's condition), `app/src/__tests__/a-null-that-is-not-a-sign-out.test.js`
**Sent in by:** Darrell, 2026-11-24, eight screenshots at 11:21-11:22 PM local: the signed-out front page, then signed in, then "Who's using this device?"
**Pairs with:** DR-1618 (the same class through the reconcile), DR-1617, DR-1619, DR-0076

## Context

DR-1618 stopped the boot reconcile from reading a failed refresh as a sign-out. With the NAS road still dark, Darrell met the signed-out front page again, was signed back in, and then got the profile picker.

## What was measured

- auth-js 2.118 `_emitInitialSession` (`GoTrueClient.js` lines 3659-3671): when `getSession()` errors, a failed fetch included, every subscriber gets `INITIAL_SESSION` with a **null** session. The sign-in stays stored, because a retryable refresh failure does not remove it.
- `onAuthChange` guarded only `SIGNED_OUT`. Every other event took the fast path, so `INITIAL_SESSION null` reached the gate, which painted the signed-out front page (`accessState` → `'gate'`).
- When the session came back, the shell drew "Who's using this device?" for as long as the account's own profile had not been resolved again. That condition looked only at `!currentProfile`.

## Impact

Whenever the road to the NAS failed at the moment the app started or resumed, a signed-in family member was shown the signed-out page and then a picker that reads as a login wall, though nothing about their sign-in had changed.

## Decision

1. A null session on any event other than `SIGNED_OUT`, while the session is still stored, is ignored. `SIGNED_OUT` keeps its recovery path, and an empty store still reads as signed out, so a real sign-out is unchanged.
2. The profile picker is held while a signed-in account's own profile is still resolving (`profileResolvedForRef` has not reached this user id). A picker the person asks for from the switcher still shows, because by then the account has been resolved.

The shell stays at its frozen budget of 5171 lines.

## Verification

`a-null-that-is-not-a-sign-out.test.js`, 5 cases, run against the real `onAuthChange` with a stand-in client:

- `INITIAL_SESSION null` with the sign-in stored emits nothing.
- With nothing stored, it reads signed out.
- A live session always passes.
- **Proven to catch:** the old fast path passed the null through.
- The picker's condition is pinned.

547 tests across the auth and profile suites pass, and eslint is clean. `re-review: 2026-11-26`
