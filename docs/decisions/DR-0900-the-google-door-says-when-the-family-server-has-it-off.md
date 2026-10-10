# DR-0900 — The Google door says when the family server has it off

**Date:** 2026-10-10
**Status:** accepted
**Area:** sign-in: PasswordAuth (the PoeTech app and the Poe Properties door), auth-providers, site-health
**Principle:** DR-0361 (a provider switched off is never offered), DR-0076 (measure, don't claim), DR-0125 (the site has its own witness), DR-0107 (a front door that does not open outranks velocity)

## Context

Darrell, 2026-10-10, in the installed PoeTech Family OS window on the "Link requested" screen, with the cursor on "Continue with Google — no email needed":

> "Need to work with Google... doesn't work!!!!!!!"

**SHOULD.** Google sign-in works. If Google is off, the door says so and offers only the doors that work (DR-0361).

**ARE.**
- **The button was offered regardless.** Earlier today the Google door was added to every screen of PasswordAuth, including "Link requested", whose copy says "Google needs no email". It was offered whatever the family server said.
- **The refusal went nowhere.** The guard (`guardProviderCached('google')`) correctly refuses when GoTrue reports Google off. But it wrote its message to `error`, and the "Link requested" screen never draws `error`. So the tap did nothing at all.
- **Google was never switched on.** The family server's Google provider has been credential-gated since DR-0361. Turning it on needs the OAuth client's ID and secret written onto the NAS, plus a redirect URI added in Google Cloud. Nothing in the repo records that being done.
- **Nothing measured it.** No witness had ever read whether Google is on.

## What was measured

- The guard's refusal path: `setError(gate.message)` (PasswordAuth.jsx), and the `linksent` branch never renders `error`.
- `infra/nas-supabase/install.sh` seeds `GOOGLE_ENABLED=false`. `enable_google_oauth.sh` is the only path that sets it true. No session note, DR, or witness records it being run.
- The guard's message told people to use the "trouble signing in?" link "to get a sign-in link emailed to you". The family server sends no email (SMTP is not wired), so that door cannot open either.
- This sandbox has no route to poetech.us (`connect_rejected`), so the live answer comes from the runner witness below.

## Impact

The one door offered as the way in "with no email" did nothing when tapped. The only sentence that would have explained why was being written somewhere no one could see it.

## Decision

1. **A door the server reports OFF is not offered.**
   - PasswordAuth reads the provider probe on mount.
   - When GoTrue reports `google:false`, the button is replaced by: "Google sign-in is not switched on at the family server yet. Use your password, or your phone number and PIN."
   - The "Link requested" copy stops promising Google.
   - When the state is unknown or enabled, the button stays: DR-0361's rule that "could not ask" is not "off".
2. **A refusal is drawn under the door.** Every Google refusal (pre-flight, fallback, re-check) is shown right below the Google door on every screen, so a tap never does nothing.
3. **The refusal names only doors that open.** The guard's message no longer suggests an emailed link.
4. **The site witness reads the doors.** `site-health.yml` now records GoTrue's own `google` / `email` / `phone` state from `/sb/auth/v1/settings` in its notes on every run.
5. **Switching Google on is a value only Darrell holds.** It needs the OAuth client secret from his Google Cloud console, put onto the NAS, plus one redirect URI added in the console. The paste-ready steps are in `infra/nas-supabase/GOOGLE-SIGN-IN.md` (DR-0361) and in this session's reply.

`re-review: 2026-10-17` — read the site-health note for `"google":true`. If it still reads false, Google is still off, and the door says so until it is switched on.

## Verification

- **New test.** `app/src/__tests__/google-door-says-when-it-is-off.test.jsx` (3 tests) mounts the real PasswordAuth against a stubbed GoTrue settings endpoint:
  - **Google off:** there is no button, the sentence is present, and "Link requested" does not promise Google.
  - **Google on:** the button is present, and the copy names it.
- **Proven to catch.** Both "off" tests fail against the previous `PasswordAuth.jsx`.
- **Existing suites.** The existing door and pre-flight suites pass (`every-door-has-a-way-in-without-email`, `oauth-provider-preflight-guard`, and every `*auth*` suite: 186 tests across 14 files). Lint is clean.
