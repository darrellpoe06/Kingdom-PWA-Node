# DR-0777 — The garage opens with no video in the way, and the sign-in is never typed twice

- **Status:** accepted
- **Tier:** A (app behaviour + two bearer-locked NAS routes + one bounded self-heal loop in the deterministic class, DR-0247: budget + lock)
- **Type:** feature
- **Date:** 2026-10-07
- **Scope:** `infra/nas-cameras/wyze_cloud.py` (new: the Wyze cloud client; selftest), `infra/nas-cameras/cams_forwarder.py` (`GET /devices`, `POST /action`, `POST /setup/wyze/again`, the kept sign-in, `wyze_cloud` in `/health`, `self_heal_once` / `start_self_heal`; selftest 8g), `infra/nas-cameras/install.sh` (code sha over three files), `.github/workflows/ci.yml` (wyze cloud selftest), `.github/workflows/cams-diag.yml` (config shape), `app/src/lib/cameras.js`, `app/src/components/Cameras.jsx` (`GarageButton`, `Doors`, `AddAgain`), `app/src/lib/sw-update.js` (`UPDATE_CHECK_MS`), `app/src/lib/help-content.js`, tests, `infra/nas-loops/services.json`, `infra/nas-cameras/README.md`.
- **Principles:** DR-0065 (the app is the artifact), DRIVE-DONT-DELEGATE ("You do it!"), VERIFICATION-DOCTRINE (DR-0076: the source read, not guessed), DR-0247 (deterministic loop: budget + lock), DR-0774 / DR-0776 (sight; the caps are mechanisms), DR-0075
- **Grounds:** Darrell 2026-10-07: *"I open the garage doors through the camera that supports the switch... I want that functionality inside the PoeTech too"*; *"The video timeouts undermined opening the door at times... sometimes I don't need to see to open the door... it still has to wait for video... why... I want a button for garage that is independent of the video streaming being available"*; *"I better not need to resign in!!! Who would be able to keep doing that!"*; *"I don't want them to time out after any times... create a new API key when necessary if ever... we never give a password just access and no access whenever the owner wants to."*

## Context

The Wyze Garage Door Controller is a dongle (`HL_CGDC`) on a Wyze Cam. In the Wyze app the door button sits on the camera's live view, so a slow or dead stream stood between Darrell and his door. The Wyze app itself does not open the door through the video: it sends one cloud action, `run_action` with `garage_door_trigger`, to the camera's device record.

At 07:31 CDT the same morning, a container recreate (the DR-0775 bind mount) brought go2rtc back with zero streams, and the tab asked for the four Wyze values again. The sign-in had lived only inside go2rtc's own config.

## What was measured

| what | measured | basis |
| --- | --- | --- |
| how the Wyze app opens the door | `POST /app/v2/auto/run_action` `{provider_key: product_model, instance_id: mac, action_key: "garage_door_trigger"}` after a login with `keyid`/`apikey` headers and `md5(md5(md5(password)))` | wyzeapy (SecKatie), `services/base_service.py`, `wyze_auth_lib.py`, `utils.py`, `const.py`: the client Home Assistant's Wyze integration has used for years |
| the garage camera | "Garage Doors", firmware 4.36.17.21, up to date | Darrell's Wyze screenshots |
| go2rtc after the 07:31 CDT recreate | `streams: 0`, log: config loaded from `/config/go2rtc.yaml`, no error line | cams-diag run 37622179962 |
| whether go2rtc persists what the forwarder registered | `PUT /api/streams` and `POST /api/wyze` both call `app.PatchConfig` | go2rtc v1.9.14 `internal/streams/api.go`, `internal/wyze/wyze.go` (read, not recalled) |
| what emptied the file | **not yet known**: the diag did not read the config's shape; it does now (keys, stream count, wyze block present; never a value) | this record's cams-diag change |
| the tablet | still on the 05:45 build at 07:3x with three deploys since; the update checks ran only on focus / visibility, which a tablet on the camera wall never raises | screenshot; `sw-update.js` |

## Impact

Unresolved: a door that waits on a stream it does not need; a sign-in that can be lost to a container recreate and must be typed again by whoever is standing there; a tablet that silently runs old code for hours. Resolved: one tap moves the door with the picture or without it; the NAS keeps the sign-in and re-adds the cameras itself; a long-lived tablet re-checks for a build every ten minutes.

## Decision

1. **The door is a cloud action, never a stream.** `wyze_cloud.py` is a dependency-free client for login, `get_object_list`, `run_action` and `refresh_token`, with Wyze's codes read (`1` ok, `2001` token expired: refresh once and retry, `3019` offline). The forwarder exposes `GET /devices` (cameras only: mac, nickname, online, `garage`, the go2rtc stream id by the same nickname rule) and `POST /action {mac, action}` (`garage`, `siren_on/off`, `power_on/off`), bearer-locked. A second trigger inside 3 s is refused (429) so a door never cycles twice; offline is 409; a camera without the dongle cannot be told to open a door (400).
2. **The Cameras tab has a Doors strip and a Garage button on the tile.** The strip stands even when the restreamer is dark (it is asked for beside the list, not after it). The button needs no ticket and no frame; it rests 3 s after a tap and says Wyze's answer under itself.
3. **The sign-in is kept, root-only, and never typed twice.** When go2rtc accepts a sign-in, the forwarder writes the four values to `/volume1/PoeTech/secrets/wyze.env` (0600). `POST /setup/wyze/again` re-runs the sign-in and the registration from those values with no body. The tab offers "Add my cameras again" first whenever the restreamer is empty and `/health` says `wyze_cloud: ready`; the form stays for a different account.
4. **The restreamer heals itself.** `SELF_HEAL_FIRST_SECONDS` (20) after start and every `SELF_HEAL_SECONDS` (600), the forwarder reads go2rtc's stream list; only when it is empty AND a sign-in is kept does it call its own re-add. Budget: one cloud call per cycle at most; lock: the setup lock; off with `CAMS_SELF_HEAL_SECONDS=0`. Deterministic class (DR-0247): no kill-switch beyond the env, no AI, no spend.
5. **Nothing the family typed expires.** Access tokens are refreshed by the NAS; a dead token re-logs in; if Wyze ever retires the API key itself, `/devices` and the button say `wyze-sign-in-refused` in plain words and the tab asks for that one value once. Per-person access is grants, not passwords: the next record.
6. **The tablet takes new builds on a clock.** `startUpdateChecks` adds a ten-minute `registration.update()` while visible (`UPDATE_CHECK_MS`), beside the focus / visibility checks.

## Verification

- `wyze_cloud.py --selftest` (fake Wyze cloud on loopback): login headers + triple md5, wrong password said, devices with the garage flag, cached list, the garage action's exact call, double tap refused, no-dongle refused, offline said, 2001 refreshed once and retried, credential readers (secrets file first, go2rtc.yaml's `wyze:` block second, quote in a password intact, file 0600). Gates merge in `ci.yml`.
- `cams_forwarder.py --selftest` 8g: `/devices` bearer-locked, cameras only, pairing by stream id, no secret out; `/action` bearer-locked, grammar, 200 → `garage_door_trigger`, 429 with seconds, 400 no-controller, 409 offline, 400 unknown device; the accepted sign-in kept once (the refused one never); `/setup/wyze/again` from the kept values (nothing typed, nothing written again), 503 with nothing kept; `/health` `wyze_cloud` ready / no-credentials; `self_heal_once` touches nothing when streams exist.
- vitest: `cameras.test.js` 58 (the helpers), `cameras-render.test.jsx` 23: the Doors strip stands with the restreamer dark, one tap is one `POST /cams/action` and never a ticket / live / snap, the answer is said, the button rests; the tile's own Garage button; Add my cameras again first when the sign-in is kept, the form only when not; `sw-update.test.js` 21: the clock asks every ten minutes while visible, never while hidden.
- After merge: nas-clock `also_run_once` so the installer restarts the forwarder on the new code sha (now over three files); cams-diag run with the config shape; `/cams/health` carrying `wyze_cloud`.

## Follow-ups

- What emptied go2rtc's config at 07:31 CDT: read from the next cams-diag (config shape) and recorded. Until then the self-heal is the cover. `re-review: 2026-10-08`.
- Per-person camera grants and time-boxed outside links, owner-given and owner-revoked, no password ever shared: DR-0778.
- The LAN-direct HTTPS road named by DR-0776: DR-0779.
