# 2026-10-07 — The garage opens without the video, and the sign-in is kept

**Layer 4 working note.** Decision: DR-0777. Pairs with DR-0776 (live in every tile), DR-0774 (sight), DR-0772 (the service restarts from the app; the draft survives), DR-0770 (the sign-in in the app).

## What Darrell said

- *"I open the garage doors through the camera that supports the switch... I want that functionality inside the PoeTech too."*
- *"The video timeouts undermined opening the door at times... sometimes I don't need to see to open the door... it still has to wait for video... why... I want a button for garage that is independent of the video streaming being available."*
- At 07:3x CDT, a screenshot: "NAS restreamer up · go2rtc 1.9.14 · 0 streams", the empty sign-in form. *"I better not need to resign in!!! Who would be able to keep doing that!"*
- *"I don't want them to time out after any times... create a new API key when necessary if ever... we never give a password just access and no access whenever the owner wants to."*

## What was measured

- cams-diag run 37622179962 (07:36 CDT): forwarder `streams: 0`; go2rtc restarted 07:31:00 CDT (the DR-0775 bind mount recreated the container), config `/config/go2rtc.yaml`, no error; the forwarder restarted 07:31:02 on its code sha. The 31 streams registered at 06:xx were gone.
- go2rtc v1.9.14 source (read): `PUT /api/streams` and `POST /api/wyze` both persist through `app.PatchConfig`. So the file SHOULD have held both the streams and the `wyze:` block. What emptied it is not yet known; cams-diag now prints the config's shape (keys, stream count, wyze block present, size, mtime; never a value).
- The Wyze app's door road: wyzeapy's `run_action` with `garage_door_trigger`, login with `keyid`/`apikey` headers and md5×3. Not video.
- The tablet: 05:45 build at 07:3x with deploys at 06:57, 08:03 (UTC) and 12:05, 12:21 UTC; `sw-update.js` asked the browser for a new worker only on focus / visibility.

## What changed

- `infra/nas-cameras/wyze_cloud.py` (new): login, devices (garage flag by dongle `HL_CGDC`), `run_action`, refresh-and-retry on 2001, the secrets-file and go2rtc.yaml credential readers, 0600 writer. Selftest green; CI step.
- `cams_forwarder.py`: `GET /devices`, `POST /action`, `POST /setup/wyze/again`; the accepted sign-in is written to `wyze.env` (not on a refusal, not on a re-add); `/health` carries `wyze_cloud`; `self_heal_once` + `start_self_heal` (20 s after start, then every 600 s; only when go2rtc lists zero streams and a sign-in is kept). Selftest 8g.
- `install.sh`: code sha over three files, so the forwarder restarts when `wyze_cloud.py` changes.
- `Cameras.jsx`: `Doors` strip (stands when the restreamer is dark), `GarageButton` (strip + tile; rests 3 s; says the answer), `AddAgain` (first in the empty state when `/health` says the sign-in is kept; the form stays for a different account).
- `sw-update.js`: `UPDATE_CHECK_MS` ten-minute clock while visible.
- `cams-diag.yml`: config shape section.
- README routes, services.json, help-content (Doors; never type the sign-in twice).

## For Darrell

Open Cameras after the deploy. If the tab still shows the empty form with no "Add my cameras again" box, the NAS has no sign-in kept (go2rtc's file lost its `wyze:` block with the streams). Type the four values ONE more time; from then on the NAS keeps them itself and re-adds the cameras whenever the restreamer comes back empty. The Doors strip appears the moment the sign-in is kept, with or without a picture.

## Open

- What emptied `go2rtc.yaml` at 07:31 CDT. Next cams-diag answers; re-review 2026-10-08.
- Per-person grants + outside links (DR-0778); the LAN-direct road (DR-0779).
