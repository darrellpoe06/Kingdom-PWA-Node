# DR-0805 — Any camera from the app, tested on the spot: RTSP/RTMP, ONVIF, HTTP, any source line, Ring's own sign-in, and the truth about a Google sign-in

- **Status:** accepted
- **Tier:** B (new owner-only write roads on the NAS forwarder that change go2rtc's streams and its config; credentials pass through the NAS to go2rtc; every road bearer-locked to the owner, every source checked, nothing logged)
- **Type:** feature
- **Date:** 2026-10-07
- **Scope:** `infra/nas-cameras/cams_forwarder.py` (`POST /streams` add + probe, `GET /streams/<id>/test`, `DELETE /streams/<id>` with twins, `POST /setup/ring` through go2rtc's `/api/ring` with its 2FA step; `source_check`, `STREAM_SCHEMES`, `remove_stream_entry`; selftest 8m), `app/src/lib/cameras.js` (`ADD_KINDS`, `buildSourceUrl`, `sourceProblem`, `maskSource`, `probeLine`, `addStream`, `testStream`, `removeStream`, `setupRing`, `GOOGLE_SIGN_IN_NOTE`), `app/src/components/Cameras.jsx` (`AddCamera`, `RingSetup` on the Setup tab; the Google note on the Wyze form), `infra/nas-cameras/README.md`, `app/src/lib/help-content.js`, `cameras.test.js`, `cameras-render.test.jsx`.
- **Principles:** DR-0756 (the family's cameras from the family's own server; "any system I own is one more line"), DR-0770 (the sign-in typed once, in the app), DR-0774 (why a tile is blank, from go2rtc's own mouth), DR-0787 / DR-0789 (what memory holds the config holds; the forwarder writes when go2rtc refuses), DR-0065 (build it in the app), DR-0076
- **Grounds:** Darrell 2026-10-07, the Setup tab's "Add a system you own" text in a screenshot: *"Build the other options... so I can set up rstp... and all other options so I can verify they work!!!!!!!!"*; *"Ring... etc... all pathways for our home cameras... Even Google login options so passwords work using Google... and other means"*; then *"I really meant Google signin... I can't verify nest... I don't have that system..."*

## Context

SHOULD: every camera the family owns is added from the app and seen to work there (DR-0756, DR-0065). ARE: only Wyze had an in-app sign-in; the Setup tab listed Ring, ONVIF, RTSP/RTMP, HomeKit and HTTP/MJPEG as text that ended in "one line in `go2rtc.yaml`, by hand", and nothing probed whether a line added worked. go2rtc's own API (v1.9.14 source, `internal/streams/api.go`): `PUT /api/streams?name=&src=` creates a stream and patches the config; `DELETE /api/streams?src=` removes it and its config line; `GET /api/frame.jpeg?src=` is one frame. Ring (`internal/ring/ring.go`): `GET /api/ring?email=&password=[&code=]` answers `{"needs_2fa": true, "prompt": …}` until the code is given, then `{"sources": [{name, url: "ring:?camera_id=…&device_id=…&refresh_token=…"}]}` with a second "… Snapshot" source per camera.

**The Google sign-in, honestly.** The camera makers' APIs that the NAS speaks — Wyze's and Ring's — take the maker's own email and password (and a 2FA code); neither offers a "sign in with Google" to a third party. A Wyze or Ring account created through Google (or Apple) therefore needs its own password set once in that maker's app; after that, the in-app sign-in here works. The app says this on both forms (`GOOGLE_SIGN_IN_NOTE`). Google's own cameras (Nest; go2rtc's `nest:` source) are **not** built here: nobody in the house has one to verify against, and DR-0076 forbids shipping a road nobody can prove.

## What was measured

| what | measured | basis |
| --- | --- | --- |
| adding a camera (before) | by hand in `go2rtc.yaml`; no probe | the Setup tab's text |
| a source line | built from the boxes with the password URL-encoded; the preview masks it (`rtsp://admin:***@…`) | `cameras.test.js` |
| the allow-list | rtsp, rtsps, rtmp, rtmps, onvif, http(s), ring, nest, wyze, homekit, hass, dvrip, tapo, kasa, isapi, gopro, roborock, webrtc, …; `exec:`, `ffmpeg:…#raw`, `file:` refused before go2rtc | selftest 8m, `sourceProblem` |
| add + probe | PUT (name, source) → go2rtc; one frame probed: "works: a 48 KB picture in 1.2 s" or go2rtc's own reason, scrubbed; the password never comes back | selftest 8m, the render case |
| a taken name | 409 unless `replace` is asked; the app offers Replace it | selftest 8m |
| remove | DELETE takes the stream and its `_h264` / `_sd` twins out of go2rtc; the config line (and an indented list under it) is removed, every other line kept | selftest 8m (`remove_stream_entry`) |
| Ring | without a code: 409 `needs-2fa` with Ring's prompt; wrong password: 401 in Ring's words; with the code: every camera registered (the snapshot source skipped — the frame road serves snapshots); the refresh token never answered back | selftest 8m, `setupRing` tests, the render case |
| suites | forwarder selftest green; `cameras.test.js` + `cameras-render.test.jsx` green | runs below |

## Decision

1. **Add a camera and test it, in the app.** The Setup tab's "Add a system you own" now carries a form: RTSP/RTMP (host, port, user, password, path, protocol incl. rtsps for UniFi Protect), ONVIF (host, port, user, password), HTTP snapshot/MJPEG (the URL), or any source line go2rtc speaks. The preview shows the line with its password hidden. Add registers it on the NAS (PUT; the config directly when go2rtc refuses, DR-0789), probes one frame, and shows the result; Test probes again; Remove asks, then takes it out of go2rtc and the config with its twins.
2. **Ring signs in through the NAS** with Ring's own email, password and the code Ring sends; every Ring camera is registered. Credentials ride to go2rtc only.
3. **A Google sign-in is said plainly, not promised:** the makers' APIs do not take it; set the maker's own password once. Nest is not built until someone in the house can verify it.
4. **Owner-only, checked, unlogged:** every write road needs the family bearer (a grant may only Test); the source scheme allow-list and the name grammar stand before go2rtc is touched; no credential is logged or returned.

## Verification after merge

- CI: the forwarder selftest and the camera suites.
- Deploy proof per DR-0107; the NAS picks up the forwarder on services-sync (`/health` carries the new sha).
- `re-review: 2026-10-10`, Darrell on the tablet: Setup → Add a system you own → RTSP → an existing camera's address → "works: a … picture in … s" and the camera appears on Live; Ring → the code → the Ring cameras appear.

## Impact

- **Family:** every camera the house owns comes in from the app and says whether it works, before anyone leaves the form.
- **NAS:** nothing runs until a camera is added; a bad line is refused at the door.
