# DR-0361 — A provider switched off is never offered, and the cutover dropped Google

**Date:** 2026-09-11 · **Status:** accepted · **Tier:** B · **Area:** platform · **Principles:** VERIFICATION-DOCTRINE, APP-IS-PRIMARY, EXCELLENCE-STANDARD, DETERMINISTIC-FIRST, DECISION-RECORDS

> **Renumbered on merge.** Minted as DR-0360 on a concurrent branch (DR-0011's branch-per-session convention, DR-0052's renumber rule). PR #1526 merged first and keeps DR-0360, so both records on that branch shifted up one. No decision was lost; the INDEX pointer records the shift.


## What happened, in the room

2026-09-11, 11:58am. A Love Corner planning meeting with the finance steward and the church office. Darrell had just walked the room through poetech.us/love-corner, signed out to show what a member sees, and told them to create an account. Someone tapped **Continue with Google** and got a popup containing this, and nothing else:

```
{"code":400,"error_code":"validation_failed",
 "msg":"Unsupported provider: provider is not enabled"}
```

Raw JSON. No heading, no message, no way back. In front of the people we were asking to trust the app with the church's money. Darrell, sending the screenshot: *"Google is getting an error message when logging in... help."*

This is the **front door**, so it is the same class as a down site (DR-0107): a member who cannot get in has no opinion about anything else we built.

## What is true (SHOULD / ARE / GAPS)

**SHOULD:** the front door offers only ways in that work, and a way that stops working says so in words a person can act on. `app/src/lib/supabase.js:352-358` states the intent outright — Google is *"the recommended primary sign-in path for family + church users."*

**ARE — traced to the literal config and the literal client code, not inferred:**

| Claim | Reality |
|---|---|
| GoTrue on the sovereign stack knows about Google | **No.** `infra/nas-supabase/docker-compose.yml` gave the `auth` service no `GOTRUE_EXTERNAL_*` key of any kind. GoTrue reads external providers from its OWN env, so `/authorize?provider=google` answered 400 for every member, every time. |
| The provider config travelled with the cutover | **No.** On hosted Supabase, Google was enabled in the **dashboard**. A dashboard setting is not a file, so it did not travel with a stack swap that moved a URL and a key (DR-0307). |
| The app can tell that a provider is dead | **No.** `signInWithOAuth` builds the `/authorize` URL **client-side** and never touches the network, so it cannot fail. `oauth-popup.js:59-71` checks `urlRes.error` and always finds it empty. |
| The member at least sees an error | **No, twice.** The popup navigates to the dead endpoint and renders GoTrue's raw JSON. When they close that window the flow reports `cancelled`, and `AuthModal`'s cancelled branch set `busy=false` and **no message at all**. |
| Had Google been switched on, the return trip would have worked | **No — a second, hidden break.** `ADDITIONAL_REDIRECT_URLS` was seeded with exactly two entries, the root and `/poetech-app/`. The church lives at **`/love-corner`**, which is not in that list, so GoTrue would have refused the return URL and bounced the browser to `SITE_URL` instead — dropping the `?oauth_popup=1` marker the popup handshake reads. Sign-in would have "worked" and the app would never have noticed. |

**GAPS:** the provider config existed only in a vendor's browser tab; nothing in the client ever asked whether a provider was live; and the allow-list would have broken the fix on the very next tap.

## Decisions

1. **The provider config lives in a FILE, on our side.** `GOTRUE_EXTERNAL_GOOGLE_ENABLED / _CLIENT_ID / _SECRET / _REDIRECT_URI` are now in `infra/nas-supabase/docker-compose.yml`, delivered by services-sync like everything else on this stack. A setting that lives only in somebody's dashboard is a setting that dies at the next cutover — that is the root cause, and this is the structural close.

2. **Credential-gated, exactly like SMTP.** `install.sh` seeds `GOOGLE_ENABLED=false` with empty credentials, so a stack that has never been told about Google comes up **healthy** with Google simply off — the state it has been in all along — and switching it on is a two-value edit plus a restart, no deploy, no migration. An unset secret must never keep the stack down.

3. **The callback is the same-origin `/sb` door, stated explicitly, never derived.** `API_EXTERNAL_URL` is still `http://127.0.0.1:8800` on this stack. A callback derived from it would be a loopback address Google refuses outright and which could never return a family browser to poetech.us. So `GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI` is set literally to `https://poetech.us/sb/auth/v1/callback`.

4. **The allow-list converges instead of being re-seeded.** `set_kv` refuses to touch a key that already exists — right for an operator's edit, wrong for a list missing a member. A new append-only `add_csv_kv` adds `https://poetech.us/**` to `ADDITIONAL_REDIRECT_URLS`, keeping every entry an operator added and covering every present and future route, `/love-corner` included.

5. **Ask GoTrue before sending anyone to it.** `app/src/lib/auth-providers.js` reads `/auth/v1/settings` — GoTrue's own public description of its own configuration, reachable same-origin because kong's `auth-v1` route carries no key-auth — and `guardProvider('google')` gates both Google entry points (`AuthModal`, `ConferenceAccountOnRamp`) **before** either navigates. This is the reality-trace rule (DR-0061) applied to a button: real state, from the running service, on the screen the member is actually on.

6. **"Could not ask" is NOT "switched off" — the one deliberate inversion of the unknown-is-never-good rule.** Everywhere else, unknown freshness never reads as fresh (DR-0125). Here it is inverted on purpose: a failed probe is evidence we could not ask, not evidence Google is dead, and blocking sign-in on a flaky network would **take away a login path that works**. That is a worse outcome than the JSON popup this fixes. So known-disabled blocks; enabled or unknown proceeds exactly as before, with no regression and no new way to be locked out. The probe carries a 4-second abort ceiling so it can never become the hang it exists to prevent.

7. **A dead end is the bug, so the message routes them.** The blocked state reads *"Google sign-in isn't switched on yet. Use your email and password just below — or the 'trouble signing in?' link to get a sign-in link emailed to you."* It names the provider, names a path that works, and never puts a raw error code in front of a person. A gate that stops someone without telling them where to go has moved the dead end, not removed it.

8. **The cancelled branch re-asks instead of going quiet.** If the pre-flight probe could not reach GoTrue and the popup then closes with no session, the modal re-probes with a fresh cache and explains itself. A genuine cancel is still silent; a real outage is not.

## Proof (DR-0076)

`app/src/__tests__/oauth-provider-preflight-guard.test.js` — 25 tests, green, gating both halves:

- The probe reads the real endpoint (`https://poetech.us/sb/auth/v1/settings`), handles a trailing slash, and treats a provider GoTrue omits from `external` as disabled.
- **No-lockout, four ways:** a 500, an offline throw, malformed JSON, and a body with no `external` map each resolve to `unknown`, and `guardProvider` returns `ok` for all four. A hung fetch aborts at its ceiling and answers `unknown` (fake timers).
- The blocked message names Google, names email, and is asserted **not** to contain `validation_failed`, `Unsupported provider`, or a `{`.
- **Source gate:** a scanner over both call sites fails the build if a handler starts a Google OAuth flow without `guardProvider('google')`, or runs the guard after the navigation.
- **Infra gate:** the compose file must carry all four provider keys, and the callback must not be loopback-derived.
- **Proven to catch (anti-theater, four cases):** the exact pre-fix handler fails the source gate; a guard placed after the navigation fails; the pre-fix `auth` service block fails the infra gate with all four keys named; a callback derived from `API_EXTERNAL_URL` fails as loopback-derived.

The `add_csv_kv` helper was exercised against four cases before shipping — an existing list missing the glob (the real NAS state), a second run (idempotent, no duplicate), the key absent entirely, and an operator's own custom entry (preserved, not rewritten).

## The lawful human tail — one value, and why no channel can carry it

The **DR-0108 challenge, run before anything here was called a hand-step:** services-sync delivers the compose change and the `install.sh` seeding on the NAS's own clock, so the code half needs no human at all. The remote-hands runner (`nas-health.yml`) can observe and drive a one-off command without waiting for the cycle. What neither channel may do is put Google's **client secret** into a GitHub Actions log or a chat transcript.

So the tail is exactly one lawful kind: a **secret value onto a device**, typed by the person who holds it — Darrell, from his own keyboard or ConnectBot. Two items, both his and neither blocking anything else in this change:

1. The Google Cloud OAuth client's **client ID and client secret** (a value only Darrell holds), written into `/volume1/docker/supabase/.env` and `GOOGLE_ENABLED` flipped to `true`.
2. Adding `https://poetech.us/sb/auth/v1/callback` to that OAuth client's **Authorized redirect URIs** — a console click in Google Cloud, which no channel of ours reaches.

The paste-ready block for both is in `infra/nas-supabase/GOOGLE-SIGN-IN.md`. Until they are done, Google stays off and the guard tells members so in words, which is already strictly better than 2026-09-11.

## What this does NOT do

- **It does not turn Google on.** It makes turning it on a two-value edit, and makes the off state honest. The stack stays exactly as healthy as it is today.
- **It does not touch Apple.** `signInWithApple` has the same blind spot and the same fix available; `signInWithApple` is not currently rendered on any surface, so it is not on this path. **re-review: 2026-09-25** — extend `guardProvider` to the Apple button when that button ships.
- **It does not add a provider-state badge to the sign-in surface.** The guard is on the click, which is the deterministic gate; dimming a button on load is polish on top. **re-review: 2026-10-02.**

## Chain

DR-0307 (the sovereign Supabase cutover — the change whose blind spot this was) · DR-0125 (the site has its own witness; the unknown-is-never-fresh rule this deliberately inverts, and says why) · DR-0107 (a down front door outranks delivery velocity) · DR-0061 (reality-trace: name the real data and the real screen) · DR-0076 (measure, don't claim; proven-to-catch) · DR-0108 (challenge the channels before calling anything a hand-step)
