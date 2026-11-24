# DR-1617: The signed-in person is the one named, and stays signed in

**Date:** 2026-11-24
**Status:** Accepted
**Tier:** B (sign-in behaviour on every door; one environment line on the sovereign auth server; no schema, no money)
**Type:** bug fix
**Area:** `infra/nas-supabase/docker-compose.yml` (auth), `app/src/lib/supabase.js` (`readPersistedSession`), `app/src/lib/account-profile.js` (new), `app/src/poe-financial-mvp-v28.jsx` (profile resolution)
**Sent in by:** Darrell, 2026-11-24: "The Apps keep logging me in and out?!!!!!!! Christina logging in shows Darrell name instead of hers?!!!!! Fix it?!!!!! Find sovereign ways!!!!!!!!!!!! Review DRs...!!!!!?!!!!!"
**Pairs with:** DR-0076, DR-0108, DR-0107, DR-1406 and DR-1577 (the same class: one person's state riding a shared slot), the sovereign cutover (DR-0307), the Google-provider casualty recorded in the same compose file

## Context

Two reports, one session. The apps sign people out and back in on their own, and Christina, signing in, is greeted as Darrell. The fixes stay sovereign: our own auth server's config, our own client code, nothing hosted.

## DRs reviewed

- **The 2026-07 guards on the client stay correct and in place:** `auth-session-guard.js` (try a refresh before accepting a sign-out), the deliberate sign-out window (`logout-deliberate-window.test.js`), the bounded boot read, the auto-refresh re-arm, and `lockAcquireTimeout: 1200`. Each one fixed a real client race. None of them reaches the server-side cause below, which is why the symptom came back.
- **DR-1406 and DR-1577** fixed the same class for pace/depth and reading records: one person's state carried in a slot the whole household or device shares. The profile key here is the third instance.
- **The compose file's own Google note** records the class of the server cause: "a dashboard setting is not a file, so it did not travel with the stack."

## What was measured

1. **Logged out everywhere at once (server).** The sovereign auth server is `supabase/gotrue:v2.177.0`. Its compose sets no `GOTRUE_SECURITY_REFRESH_TOKEN_REUSE_INTERVAL`. GoTrue's source at that tag, read from GitHub: `internal/conf/configuration.go:609` declares the field with **no default**, so it is 0. Rotation is on by default (`:608`). In `internal/api/token_refresh.go:196-209`, a revoked token presented after `updated_at + reuse_interval` (any time, at 0) that is not the direct parent of the active token is treated as **"Possible abuse attempt"**: `RevokeTokenFamily` runs and the client gets `400 refresh_token_already_used`. auth-js 2.118 treats that 400 as non-retryable, removes the stored session (shared by every tab on the origin) and emits `SIGNED_OUT`. The client's guard then tries a refresh, which fails because the whole family is revoked. Hosted ran a 10-second reuse interval, a dashboard setting that did not travel with the cutover. The family runs dozens of tabs across three doors on one origin plus phones and tablets, so two holders refreshing near each other was constant.
2. **Signed in, signed out, signed in, under the wrong name (client boot).** `readPersistedSession` returned the **first** `sb-*-auth-token` in storage order. A device that signed in before the cutover holds two: hosted's `sb-<ref>-auth-token` and the sovereign `sb-poetech-auth-token`. The boot could paint the leftover session (another person's on a shared tablet), and `getSession()` then reconciled to the real one or to null.
3. **"Darrell" for Christina (client profile).** The header's profile pill and Home's welcome name read `poe-current-profile`, one value per device. The sign-in effect read that saved value before the account's own email mapping (`FAMILY_EMAIL_PROFILES`) and returned early once any profile was set. The last person on the device named the next. The same value also chose which entities are visible, so a parishioner signing in on that device received Darrell's profile.

4. **The phone account named by its digits (header).** Darrell's screenshots, sent mid-session: signed in by phone, the account menu read "15636502416". That account's profile row has no name, and `headerName` fell back to the synthetic address's local part.
5. **"public_vacancies · rpc-error · TypeError: Failed to fetch"** on the signed-out front page and "Could not reach the record just now" in the Love Corner, in the same screenshots. These are network failures on the road to the server, not an auth answer: the shipped app reaches it by the absolute Funnel URL under the 2026-10-09 temporary unlock in `deploy-cloudflare-pages.yml`, which the transport rule warns throttles cross-origin fetches. auth-js treats a failed fetch as retryable and keeps the session, so this cause does not sign anyone out by itself. It does leave reads empty while it lasts.

Not measured in this session: the live NAS's running env (the sandbox has no route to it; DR-0108's runner road applies). The deployed fix is verified by the next `services-sync` cycle recreating the auth container from this compose.

## Decision

1. **Server:** the auth service sets `GOTRUE_SECURITY_REFRESH_TOKEN_REUSE_INTERVAL: "10"` (hosted parity) and states `GOTRUE_SECURITY_REFRESH_TOKEN_ROTATION_ENABLED: "true"`. Reuse detection stays on outside the 10-second window. It ships through the existing lane: merge, the mirror pulls, `infra/nas-supabase/install.sh` runs `docker compose up -d`, and only the auth container is recreated. Sessions live in the database and the JWT secret is unchanged, so nobody is signed out by the change itself. Reverting it is one line.
2. **Client boot:** `readPersistedSession` reads only the slot the client really persists under (`supabase.auth.storageKey`). An empty slot means signed out, whatever a leftover slot holds. A caller that passes its own store (tests) keeps the shape scan.
3. **Client profile:** `lib/account-profile.js`. A saved profile is honoured only for the account that saved it (`poe-current-profile-owner` = that user id). Otherwise a family email maps to its own profile and anyone else is `self`. The effect resolves once per account (user id), so a token refresh never re-runs it and a pick from the switcher stands. Every pick is stamped with its account. A saved value from before this rule has no owner and is replaced once by the account's own mapping. Darrell's own Family-view choice comes back to Darrell after one re-pick. Nothing new is collected: the stamp is the user id the device already holds.

4. **Header name:** `headerName(profile, session, knownName)`. A profile name still wins. Next comes the account's own family persona (`personName` on the PoeTech door: Darrell or Christina, never the household roll-up `family`). A phone sign-in with neither reads its formatted number, never the raw synthetic address.

## Verification

`the-signed-in-person-is-the-one-named.test.js`, 20 cases:

- **Profile:** Christina on a device holding Darrell's pre-rule pick is named Christina. A pick stamped as Darrell's is not shown to her. A person's own pick stands. An outsider never inherits a family profile. Email case is ignored. Storage blocked never throws. The shell resolves through the rule once per user id, and the old early return is gone. **Proven to catch:** the old order names Darrell for Christina.
- **Boot:** with two auth slots, the client's own key wins whatever the storage order. An empty own slot is signed out. **Proven to catch:** the old shape scan paints the leftover session.
- **Header:** Darrell's phone sign-in with no profile name reads Darrell. An unknown phone sign-in reads `(563) 650-2416`, not digits. A chosen profile name wins. The shell passes the persona, never `family`.
- **Server:** the auth block sets a reuse interval of at least 10 and keeps rotation on. **Proven to catch:** removing the line fails the check.

`poetech-door-account-picture.test.jsx`'s literal pin gains `personName`. `reviewer-mode.test.js`'s wiring pin moves to the new write form. Its intent is unchanged: a reviewer's picks never touch the saved profile. The existing auth suites (`auth-session-guard`, `logout-deliberate-window`, `oauth-provider-preflight-guard`, `session-handoff`) stay green.

## Open, dated

- **The live server value** is confirmed after deploy by reading the auth container's env over the runner road (DR-0108). `re-review: 2026-11-26`
- **The Funnel road's "Failed to fetch"** is the transport debt the 2026-10-09 unlock already names. It is measured from a runner (site-health), not from this sandbox, which has no route. `re-review: 2026-11-26`
- **Darrell's phone account gets its own profile name** (My Profile). Then the fallback is no longer needed for him.
- **`infra/supabase/docker-compose.yml`** (the older, non-installed stack) does not carry the line. It is not what `install.sh` runs. `re-review: 2026-12-08`, or when that stack is retired.
