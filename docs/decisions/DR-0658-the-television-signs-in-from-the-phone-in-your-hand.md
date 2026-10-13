# DR-0658 — The television signs in from the phone in your hand

- **Status:** accepted
- **Tier:** B (a new sign-in door on the front door, a new privileged endpoint that mints sessions, and a migration that changes who may call five functions)
- **Type:** capability + fix
- **Date:** 2026-09-25
- **Scope:** `app/src/components/AuthModal.jsx`, `app/src/components/PhoneSignInPanel.jsx` (new), `app/src/components/DeviceLinkApprove.jsx` (new), `app/src/lib/device-link.js`, `app/src/lib/device-link-client.js` (new), `app/src/lib/tv-device.js` (carried byte-for-byte from #1821), `app/src/main.jsx` (the `?link=` lean boot), `app/functions/api/device-link.js` (new), `app/functions/link.js` (new), `infra/supabase/migrations-auto/0239-the-television-signs-in-from-the-phone-in-your-hand.sql`, `infra/supabase/tests/0239-device-link-smoke.sql`, `.github/workflows/rls-isolation.yml` (the `device-link` leg), `scripts/device-link-e2e.mjs` (new), `scripts/system-flow-registry.mjs`, `scripts/consistency-guard.mjs`, `app/src/lib/native-shell.js` (`/link` joins the re-homed routes; inside the shell the QR names the house)
- **Principles:** HOLD-THE-HAND-OF-THE-PROCESS (DR-0621), VERIFICATION-DOCTRINE (DR-0076), REALITY-TRACE (DR-0061), FORM-FACTOR-MEASURED (DR-0239)
- **Grounds:** Darrell, 2026-09-25 02:30 UTC, on his Fire TV Stick in Silk, looking at "Sign in or create your profile" (Google, or a phone number and 6-digit PIN typed with the remote), cut off at the bottom of the screen: *"Hard to sign in on a Firestick... what happened to the qr code ways?"* And on 2026-09-20: *"I'd rather just be able to use a QR code to access the login quicker and faster."*

## Context

On 2026-09-20 the QR sign-in was designed and half-built. `app/src/lib/device-link.js` holds the RFC 8628 device-authorization rules. Migration 0222 holds the `device_link` table and five functions: start, describe, decide, claim and poll. Nothing in the app used any of it. No component imported the library, there was no `/link` route, and the sign-in dialog had no phone door. It is the failure DR-0621 names: parts built, and the process never walked to its end.

The reality trace, before any code:

- **The dialog** is `AuthModal.jsx`, opened by the church door's "Log in / Create account" (`ChurchHome.jsx:952`), the header (`HeaderAuthButton.jsx`) and the welcome page (`PublicWelcome.jsx`). It offered Google in a popup (`oauth-popup.js`) and `PasswordAuth` (phone + PIN, which signs in with a synthetic `<digits>@phone.poetech.us` login and the PIN as the password: `supabase.js` `signInWithPhonePin`).
- **0222 is live on the database the app reads.** `sovereign-read` run 36086382991 (what=definitions) listed all five functions on the sovereign database, with MISSING: none.
- **`device_link_claim` returns a `user_id`, which is not a session.** Nothing turned an approval into a signed-in television. That was the missing piece.
- **`device_link_start` could never run.** Measured on `supabase/postgres:15.8.1.060`, the NAS's own image, every call raised `column reference "expires_at" is ambiguous`: the function `RETURNS TABLE (user_code, expires_at)`, so its sweep's bare `WHERE expires_at < …` names both a variable and a column. The live function is the same text, so the live start has been broken since 0222. Nothing had ever called it, so nothing had ever seen it.
- **0222 granted `device_link_claim` to `anon` and `authenticated`.** Under the grant fault (below), the end-to-end run shows what that grant allows: anon burned the TV's own approved link, and the real TV could then no longer collect it.
- **Where privileged auth lives:** Pages Functions under `app/functions/api/`. `/api/push-send` is the model. The Pages project holds `SUPABASE_URL` (the Funnel's `/sb` mount) and `SUPABASE_SERVICE_KEY`, installed and proven by `push-sender-credentials.yml` run 34431549970. The key never reaches a browser. The NAS gateway's `auth-v1-sb` route (`infra/nas-supabase/kong.yml`) strips `/sb` and forwards to GoTrue with no key or ACL plugin in between, so GoTrue's admin and verify routes are reachable with the service JWT.

## What was measured

Everything below ran in this sandbox against a local Supabase built from the NAS's own image versions: `supabase/postgres:15.8.1.060`, `supabase/gotrue:v2.177.0` and `postgrest/postgrest:v12.2.12`. The real Pages Functions were mounted on the same origin, the way Cloudflare Pages mounts them. The app was the real `vite build`. Two Chromium contexts (Playwright 1.63, Chromium 1194) played the two roles:

- **TV:** 960×540, a Fire TV Stick's user agent (`AFTKA … Silk/130`), no touch, and `speechSynthesis.getVoices()` returning none.
- **Phone:** 390×844, touch, an iPhone's user agent.

`scripts/device-link-e2e.mjs`: **24/24 checks pass.**

| Scenario | What happened |
|---|---|
| readiness | `GET /api/device-link` → `{"configured":true,"ready":true,"auth":200,"db":200}` |
| approve | TV: church door → Log in → focus lands on **Sign in with your phone** → Enter → QR + `M6TA-PPJT`. The **whole dialog fits 960×540 with no scrolling**: 32,30 to 928,511, content 479 px in a 479 px panel. Phone: `/link?c=m6ta - ppjt` (typed sloppily) lands on `/poetech-app/?link=M6TAPPJT`, signs in with phone number + PIN, sees "Sign in the TV in front of you?" naming "Fire TV, asked just now", and approves. **The TV is signed in as that user 4.0 s after Approve (3.5 s on an earlier run), and the sign-in dialog closes.** |
| deny | The TV stays signed out (no token) and says "That request was turned down. Start again when you are ready." |
| expired | The TV says "This code has expired." The phone cannot approve it. An approved link past its deadline gets `409 {"error":"not-claimable","state":"expired"}` from the endpoint. |
| once | The first claim gets a session; the second gets `409 … "consumed"`. |
| user_code | The user_code sent as a device_code gets `400 bad-device-code`. Anon calling `device_link_claim` with the hash or with the code gets 401 both times. The real TV can still collect its own link afterwards. |

**Proven to catch (DR-0076 §3).** Each fault was installed in the database and its scenario was required to fail:

| `--break=` | Fault | Result |
|---|---|---|
| `deny` | decide approves whatever it is told | deny: FAIL, "token PRESENT" (6/7) |
| `expiry` | claim forgets the deadline | expired: FAIL, a session was issued past the deadline (7/8) |
| `once` | claim forgets it was used | once: FAIL, the second claim was issued a session (2/3) |
| `grant` | 0222's anon/authenticated grant on claim | usercode: FAIL, anon 200 with the hash and with the code, and the real TV then got 409 (2/4) |

Also proven to catch:

- **The SQL smoke** (`0239-device-link-smoke.sql`, now a leg of the rls-isolation matrix) prints PASS on 0222 + 0239. It raised `FAIL: anon could not start a link` against 0222's broken start, and `FAIL: anon can call device_link_claim` under the grant.
- **Unit gates:**
  - loosening `DEVICE_CODE_RE` fails 2 tests in `device-link-wiring.test.js`;
  - focusing Google instead of the phone door on a TV fails 2 tests in `auth-modal-tv.test.jsx`;
  - removing the new Modal-width exemption fails 2 tests in `consistency-modal-width.test.js`.

## Impact

- On a television (a TV user agent from #1821's `tv-device.js`, Silk without touch, or a large screen with neither touch nor a fine pointer), the sign-in dialog is two columns that fit 960×540. The phone door comes first and has focus, so one press of OK shows the QR and the 8-character code. Google sits beside it, and the typed doors fold behind one button. On every other device the phone door sits at the top in one row, and Google keeps focus.
- The QR opens `poetech.us/link?c=CODE`. The phone signs in there if it needs to (Google or phone + PIN), sees which screen is asking, and approves or denies.
- A television that is approved becomes that person, with a real session: GoTrue `generate_link` (magiclink, no mail sent) and then `/verify`, done server-side with the service role.
- The live `device_link_start` works for the first time once 0239 lands.

## Decision

1. **Mint the session in a Pages Function, `/api/device-link`,** beside `/api/push-send`, with the key the Pages project already holds. The security split in `device-link.js` is kept whole:
   - The TV sends the raw device_code only to this endpoint, which hashes it (SHA-256, the same function the TV used) and claims by the hash. A leaked row, which holds only the hash, cannot claim anything.
   - Only a 64-hex code is accepted, so the user_code is refused.
   - The claim burns the row in the same UPDATE that reads it (single use) and refuses an expired row (10 minutes).
2. **Migration 0239:**
   - claim goes to `service_role` alone, revoked from PUBLIC, anon and authenticated (Supabase grants the last two directly);
   - describe and decide need a signed-in person and are metered at 20 per person per 10 minutes (`device_link_rate`, RLS on, no policies);
   - starts are bounded at 30 a minute and 500 live, globally;
   - codes and hashes are shape-checked;
   - start's columns are qualified so it runs.
   - 0222 is left as written (append-only). The matrix leg applies 0222 then 0239, and `migration-replay-order-guard` holds that order.
3. **`/link` is a Pages Function** that normalizes the code and hands the phone to the app's lean `?link=` boot. A Google full-page redirect drops the query, so the code is stashed in sessionStorage first. It resumes only on a return from Google, and only once.
4. **One TV detector.** `tv-device.js` from #1821 is carried byte-for-byte (an identical add merges cleanly whichever lands first), and `isTvClass` builds on its `isTvUserAgent`. An unknown pointer is not "no pointer".
5. **`consistency-guard` learns the Modal prop.** A width handed to `<Modal maxWidthClass>` is painted inside Modal's own `fixed` overlay, which is the modal class the rule allows. The exemption covers the prop value only and is pinned by a test. DeviceLinkApprove carries no width cap; it is a phone page.

## Verification

- `scripts/device-link-e2e.mjs`: 24/24, and 4 fault runs that each fail their own scenario (above).
- `infra/supabase/tests/0239-device-link-smoke.sql`: PASS locally on the NAS image. It is in the rls-isolation matrix (leg `device-link`), which db-migrate dispatches after this merge applies 0239.
- Vitest: `device-link-wiring` 25, `device-link-0239-migration` 9, `auth-modal-tv` 4, `consistency-modal-width` 4. The existing `device-link`, `device-link-migration` and `auth-modal-render` suites still pass.
- Guards: lint, tenancy, business-systems, interconnect (3 new nodes, 0 findings), rls-isolation-matrix, smoke-sql-language, migration-return-type, migration-replay-order, replay-completeness, ui-standards, consistency, contrast, `legibility-guard --health`.
- **Live, after deploy (not measurable from this sandbox, which has no route to poetech.us):**
  - `https://poetech.us/api/device-link` must read `"ready":true`. `auth` is the gateway passing GoTrue's admin route; `db` is the RPCs with the service role.
  - Then the Firestick walk: Log in → Sign in with your phone → scan → Approve.
  - re-review: 2026-09-26, the first live read and the Firestick walk.
