# DR-0774 — The camera feed gives sight: why a tile is blank, a view that stays up, and a wall

- **Status:** accepted
- **Tier:** A (one read-only diagnostic route on the NAS forwarder; one read-only workflow over the tailnet; app behaviour; two default caps raised; no money, no schema, no church-facing identity)
- **Type:** feature + fix + orchestration (the diagnostic eye)
- **Date:** 2026-10-07
- **Scope:** `infra/nas-cameras/cams_forwarder.py` (`GET /why/<id>`, honest `/snap` causes, `MAX_LIVE` 12, `LIVE_MAX_SECONDS` 0, selftest 8d); `.github/workflows/cams-diag.yml` (new); `app/src/lib/cameras.js` (`humanizeCameraError`, `classifySnapError`, `explainWhy`, `fetchWhy`, `runLimited`, `skipFailedFrame`, the wall); `app/src/components/Cameras.jsx` (`LiveVideo`, `WhyPanel`, the wall, the parallel sweep); `app/src/lib/help-content.js`; tests `cameras.test.js`, `cameras-render.test.jsx`.
- **Principles:** VERIFICATION-DOCTRINE (DR-0076: observe, never guess), REALITY-TRACE (DR-0061), DR-0100 (state the established fact), DR-0108 (review our Ways: the team's eye), DR-0756 / DR-0770 / DR-0772 (the camera road), DR-0247 (brakes are build requirements, never a stall)
- **Grounds:** Darrell 2026-10-07, in order: *"Find a solution... tinycam pro can stream it... why how do others do this? Fix it"*; *"I need multiple views... I want to see different cameras together... the feed needs to be able to give us sight.... fix it"*; *"Let's not build in undermining constraints... we want to build the best pipelines"*; *"I have high speed internet... 1gig up and down... fiber"*.

## Context

The Wyze sign-in landed (DR-0770 / DR-0772) and the NAS registered 31 cameras. The first screen after that gave no sight: every tile "No frame yet · last try failed: HTTP 502", a live view that "ended after 13 s", and the copy blamed a 300-second NAS clock that had not fired. Minutes later the picture split: the cameras at the house the NAS sits in streamed (back yard, basement north, basketball, front, front door view), and the rest stayed blank. The app could not say which was which or why.

## What was measured

- go2rtc's Wyze README (v1.9.14, `internal/wyze/README.md`): *"Connection to the camera is local only (direct P2P to camera IP)"*; *"Internet access is only needed when loading cameras from your account. After that, all streaming is local P2P"*; *"Only cameras with DTLS-enabled firmware are supported"*; Gwell models unsupported. `pkg/wyze/client.go`: DTLS dial to the camera's host with 5 s steps and no relay fallback; errors `wyze: connect failed: %w`, `wyze: only DTLS cameras are supported`, `wyze: av login failed`, `K10001/K10002 failed`.
- The tinyCam grid on his phone shows two properties (805 and 2111). tinyCam reaches both because it uses Wyze's TUTK relay; go2rtc's source does not. The cameras that filled in are the ones on the NAS's own LAN.
- `_snap` turned a 12 s socket timeout into `502 go2rtc-unreachable` while `/health` said go2rtc was up: a true cause (the camera did not answer) reported as a false one (the restreamer is dark).
- The sweep was one camera at a time with a 12 s timeout each: 31 cameras, many failing, refreshed every ~2 minutes ("frame 2 m ago" on every tile that had one), not every 5 s.
- The live view ended at 28 s with "first picture in 2.6 s"; `LIVE_MAX_SECONDS` was 300. The stream ended on its own and the app only offered a button.
- His link: 1 Gbps symmetric fiber. The "protect the home link" caps (2 live, 300 s) protected nothing real; the unknown is Tailscale Funnel's relay throughput, which only measurement will tell.

## Impact

The one tab the family uses to see the house said "HTTP 502" where the truth was "this camera is at the other house" or "this camera did not answer in 12 s", went black for no NAS reason, and could show one camera at a time. A tool that cannot say why it is blank is not giving sight.

## Decision

1. **A blank tile names its real cause.** `/snap` answers `504 frame-timeout {after_s}` on a timeout, `no-frame` with go2rtc's own scrubbed error text on a go2rtc error, and `go2rtc-unreachable` only when go2rtc is. The tile shows a short true reason ("no answer in 12 s", "NAS cannot reach it on its network", "firmware has no DTLS", "camera refused the sign-in").
2. **The NAS explains on request.** `GET /why/<id>` (family bearer) returns the stream's producers (kind, host, state; never a url), the recent go2rtc log lines naming the stream (scrubbed of enr/password/key/token), and one timed frame probe with go2rtc's own error. The tile's Why? button renders it in plain words, with the raw lines underneath.
3. **A live view keeps itself alive.** `LiveVideo` re-opens a view that ended without the viewer closing it, up to 6 times 1.5 s apart, shows "reconnected N×", and offers Resume only after the last try. The copy never claims a NAS clock that did not fire.
4. **A wall.** Wall + on any tile adds it to "Watch together", a grid of live views at the top of the tab, kept per device; Wall − and Clear the wall take them down. The wall's size follows the NAS's `max_live`.
5. **The sweep gives every answering camera its 5 s.** Three frames in flight at once; a camera that just failed is rested 30 s; cameras on the wall or open live are not polled (the live view is the frame).
6. **The undermining caps come off by default.** `MAX_LIVE` 12, `LIVE_MAX_SECONDS` 0 (no clock). Both remain mechanisms, reported in `/health` and settable by env, so a measured Funnel limit can be applied with a number rather than a guess.
7. **The team has an eye.** `cams-diag.yml` (dispatch) joins the tailnet, SSHes to the NAS, and prints go2rtc's streams (kind, host, state), its log, the container's log, the forwarder's health and journal, the NAS's LAN addresses, and one timed probe with `/why` for a named camera. Read-only, scrubbed, no hand of Darrell's.

## What this does NOT fix, said plainly

Cameras at the other address cannot be reached by this NAS with go2rtc's Wyze source; that is the source's design, not a bug here. The road to them is a Wyze adapter that speaks TUTK relay (docker-wyze-bridge with `NET_MODE=ANY`, feeding go2rtc as RTSP) or a second box on that LAN. That is the next decision, taken with the diag workflow's measurement of which cameras are local. `re-review: 2026-10-14`.

## Verification

- `cams_forwarder.py --selftest`: all green; 8d new: go2rtc's error text reaches the app on a failed frame with the enr scrubbed; a camera that does not answer is `504 frame-timeout` naming the seconds, never "unreachable"; `/why` is bearer-gated, refuses a malformed id, summarizes producers without the url, passes the stream's log lines and not another stream's, carries the probe's error, leaks no secret, and says "ok, playing" for a healthy camera; the shipped defaults are 12 live and no clock.
- `cameras.test.js` 45 green (error classes, tile reasons, explainWhy, fetchWhy, the sweep's rest and pool, the wall's storage and limit). `cameras-render.test.jsx` 17 green: the live view reconnects with a new ticket and shows the count, offers Resume only after the last try, never names a clock the NAS does not run; the wall opens two live views with their own tickets, stops polling their snapshots, Remove and Clear take them down; a 504 tile reads "no answer in 12 s" and Why? shows the NAS's plain-words reason with the host it tried. help-content 107, UI standards and legibility green, eslint clean.
- After merge and the NAS sync: `cams-diag.yml` dispatched by the agent names which cameras are on the NAS's LAN and what go2rtc logs for the rest.

## Follow-ups (each its own decision)

- Cameras at the other house: the relay adapter or a second box (above). `re-review: 2026-10-14`.
- Recording loops to the NAS with a retention the owner chooses (Darrell: *"Recorded loops for however long I want backed up to the nas?"*): per-camera continuous segments from go2rtc's RTSP via the image's own ffmpeg, a disk budget that prunes oldest first, a playback timeline in the tab. Next build.
- Access for the family and beyond (Darrell: *"My wife and family should also have access... one time setup for owners and they can give access to who they want.... inside or out"*): today the family key on a device opens every camera to that family member, set up once by the owner. Per-person camera grants (an RLS table the tab reads) and time-boxed outside links (camera-scoped tickets with a longer TTL, minted by the owner, revocable) are the next build after recording.
- The wall through the Funnel: measure real per-view bitrate and Funnel throughput on the OpsBoard before any cap is reinstated; an on-LAN direct path to the NAS when the device is at home is the structural improvement.
