# DR-0770 — The Wyze sign-in is typed once, in the app, and the NAS does the rest

- **Status:** accepted
- **Tier:** A (one new bearer-locked route on an existing sovereign door; a form on an existing family-gated surface; no schema, no money; the secret crosses the same locked road the family's photos and taxes already use)
- **Type:** feature
- **Date:** 2026-10-07
- **Scope:** `infra/nas-cameras/cams_forwarder.py` (`POST /setup/wyze`, `stream_name_for`, `wyze_cameras_from`, selftest section 8b, 17 new checks); `app/src/lib/cameras.js` (`WYZE_FIELDS`, `validateWyzeSetup`, `classifySetupResult`, `setupWyze`); `app/src/components/Cameras.jsx` (`WyzeSetup`; the PowerShell steps behind "Prefer a terminal?"); `infra/nas-cameras/README.md`, `install.sh` (message); tests `cameras.test.js`, `cameras-render.test.jsx`.
- **Principles:** DRIVE-DONT-DELEGATE, APP-IS-PRIMARY (DR-0065), REALITY-TRACE (DR-0061), VERIFICATION-DOCTRINE (DR-0076), SOVEREIGN-FIRST, DR-0108 (review our ways: a "must be by hand" is a premise to challenge), DR-0236 (nothing waits)
- **Grounds:** Darrell 2026-10-07, on the two PowerShell steps DR-0756 left him: *"Is that the easiest way to build it so I don't have to do much work for it to work right away?"* — No. DR-0756 classified the Wyze sign-in as his-hand because the VALUES are his; it then made the WAY his-hand too (a terminal, a tunnel, a click in a WebUI), and that part was never necessary.

## Context

DR-0756 shipped the family cameras with everything self-deploying except the Wyze sign-in, which it left as two paste-ready PowerShell blocks: place `wyze.env` on the NAS, then tunnel to go2rtc's WebUI and click *Add > Wyze*. Reviewing the way (DR-0108): go2rtc 1.9.14's own source (`internal/wyze/wyze.go`) shows the WebUI does nothing a locked server route cannot: `POST /api/wyze` takes the four values as a form, logs in, writes the account into `go2rtc.yaml` itself (`app.PatchConfig`), and answers the account's cameras as sources (`{"sources":[{name,info,url}]}`, 404 "no sources" for an account with none, 401 with Wyze's own error when refused); `PUT /api/streams?name&src` registers a stream and persists it. So the whole second step, and the secrets file of the first, were a human doing by hand what the restreamer already does by API.

## Reality trace (before building)

- **Real data:** go2rtc's running config on the NAS (its `wyze:` accounts and `streams:`), read and written through its loopback API; the app's `/list` already reads the result.
- **End to end:** the same `/cams` Funnel mount and Pages Function (`app/functions/cams/[[path]].js`) already carries `POST /ticket` with a JSON body, so a second POST route rides the proven road with no transport change (RECORDED-STATE unchanged; infra-transport-guard green).
- **The surface the user meets:** the Cameras tab's empty state, where the PowerShell blocks were; the form takes their place and the blocks stay one tap behind "Prefer a terminal?".
- **Assumptions written down:** an API key from the Wyze developer portal signs in without a 2FA prompt (go2rtc's handler has no MFA-code path; the key is how Wyze's own API bypasses it). A refused sign-in is Wyze's answer, said plainly, never retried in a loop.

## Impact

Until this, the family's cameras depended on Darrell at a desktop with PowerShell, an SSH tunnel and a browser tab on the restreamer's WebUI, for a step that is one form's worth of typing. Every other system (Ring, ONVIF, RTSP) was one line in a config; Wyze, the system he actually owns, was the one with chores attached. The cost was his time at the one place in the app meant to need none of it, and a Cameras tab that stayed empty until he found a desk.

## Decision

1. **One form, once, in the app.** Wyze email, password, API ID, API Key. Checked before anything is sent (`validateWyzeSetup`); posted with the family bearer to `POST /cams/setup/wyze`; the fields are cleared the moment the NAS answers well, and left as typed when Wyze refuses, so a typo can be fixed. The result names each camera, says which are already here, and says plainly which units the restreamer cannot stream yet (non-DTLS firmware: Cam OG, Pan v4, Floodlight Pro), never a guess.
2. **The forwarder hands the sign-in to go2rtc's own door and writes nothing itself.** It validates, forwards the four values as a form to `/api/wyze`, reads the sources, registers each as a stream (`PUT /api/streams`), and answers `{ok, added, cameras:[{id,name,model,dtls,registered,existing}]}`. A camera whose stream id already exists is left exactly as it is (idempotent re-run). The source urls (they carry each camera's `enr` secret), the password and the key never leave in the answer; error details from Wyze are scrubbed of both before they are relayed; nothing is logged. One setup runs at a time (409 for a second); the body is capped; a dark go2rtc is 502, never this process's own 200.
3. **The terminal way stays.** `wyze.env` + the installer's one-time `wyze:` block + the WebUI tunnel remain documented and reachable in the app behind one tap, for a device without the family key or a person who prefers a shell.

## Verification

- `cams_forwarder.py --selftest` section 8b — no bearer -> 401 and nothing sent upstream; a missing field named (400); a non-email refused; Wyze refusing -> 401 `wyze-sign-in-refused`; an account with no cameras -> 200 with zero added and the note; a good sign-in -> the four values reach go2rtc's form, ids `front_yard`/`garage_cam`, the already-registered one left as is and the new one PUT with its exact url, no url/enr/password/key in the answer, dtls and model reported; a second setup in flight -> 409; oversized body -> 400; go2rtc dark -> 502. All 17 pass; the whole selftest passes.
- `cameras.test.js` — `validateWyzeSetup`, `classifySetupResult` (every answer one honest sentence), `setupWyze` (bearer, body, never throws).
- `cameras-render.test.jsx` — the empty state shows the form first with the four named fields and no `<pre>`, the two PowerShell blocks appear behind "Prefer a terminal?"; submitting posts the four values with the family bearer, names what was added, clears the fields, reloads the list; a refusal is said plainly and clears nothing. 51 camera + UI-standards tests green; eslint clean.

**His test:** open Cameras, type the four values, press *Sign in and add my cameras*; within a minute the cameras are listed by name and the tiles appear on the next refresh. No PowerShell.

**Honest limits (DR-0100):** the sign-in reaches the NAS only from a device holding the family key (anyone else is 401 at the door); a Wyze account protected in a way the API key cannot satisfy is refused and said so; non-DTLS units are registered but will not stream until go2rtc supports Gwell models (re-review 2026-11-15 per DR-0756). An "Add a Wyze account" entry on the READY state (a second account once cameras exist) is not built; re-review: 2026-11-15 with the Gwell review.
