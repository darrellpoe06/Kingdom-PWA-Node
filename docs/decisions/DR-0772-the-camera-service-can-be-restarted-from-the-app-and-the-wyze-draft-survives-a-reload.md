# DR-0772 — The camera service can be restarted from the app, and the Wyze draft survives a reload

- **Status:** accepted
- **Tier:** A (one bearer-locked route on an existing NAS service, spaced 60 s; one device-local draft; no money, no church-facing identity change)
- **Type:** feature + fix
- **Date:** 2026-10-07
- **Scope:** `infra/nas-cameras/cams_forwarder.py` (`POST /restart`, `on_disk` in `/health`, selftest 8c); `app/src/lib/cameras.js` (`serviceCodeState`, `restartService`, `classifyRestartResult`, the Wyze draft `load/save/clearWyzeDraft`, the Wyze `KINDS` line); `app/src/components/Cameras.jsx` (`ServiceRestart`, the draft, `Hear the steps`, the read target); `app/src/lib/help-content.js` (`cameras`); tests `cameras.test.js`, `cameras-render.test.jsx`.
- **Principles:** VERIFICATION-DOCTRINE (DR-0076), THE-APP-IS-THE-PRIMARY-ARTIFACT (DR-0065), DRIVE-DONT-DELEGATE, HOLD-THE-HAND (DR-0621), DR-0770 (the Wyze sign-in in the app), DR-0756 (the camera road)
- **Grounds:** Darrell 2026-10-07: *"Why can't I see the cameras?!"*, *"We also want all functions to be able to work inside the PoeTech App"*, *"You do it!!!!!!! ... why give me a job you can do?!"*, *"Find a solution... tinycam pro can stream it... why how do others do this? Fix it"*, and, after the app redeployed under four typed values: *"Why am I needing to redo this?! Crazy! Fix it!"*

## Context

DR-0770 put the Wyze sign-in in the Cameras tab. An hour after it merged the form answered "The NAS answered HTTP 404": the new `cams_forwarder.py` was on the NAS disk, but the installer restarted the service only when its systemd UNIT changed, so the old process kept serving. The installer fix (restart on a code sha change) and `/health` naming the running sha landed in PR #1985. Two things stayed wrong for the person at the screen:

1. The only ways to make the NAS run its new code were a terminal (PowerShell, ConnectBot) or waiting for the 15-minute services-sync. Darrell refused both, rightly: the agent has a route (the tailnet runner, `nas-clock.yml also_run_once`) and the app should have one too.
2. The sign-in form kept its four values only in React state. A deploy, a reload or a PWA relaunch erased them before the NAS ever accepted them, so he typed them twice and was asked for a third time.

## How others do it (asked, answered with evidence)

tinyCam Pro, docker-wyze-bridge and go2rtc's `wyze:` source all take the same road: sign in to Wyze's cloud with email, password, API ID and API Key, get the camera list, then pull video from each camera over Wyze's P2P (TUTK) protocol, on the LAN when the camera is local and relayed when it is not. Wyze's own forum documents the P2P/TUTK live-view design and tinyCam's cloud-account add; docker-wyze-bridge's README states the API ID/Key requirement and that its TUTK path is go2rtc's built-in `wyze://` source. So the NAS already does what tinyCam does. What failed on 2026-10-07 was not the method; it was a process that had not been restarted. Darrell's tinyCam grid (two properties, a dozen cameras, several "P2P camera offline") is the shape the Cameras tab already draws: a snapshot grid, full motion in place.

## Decision

1. **The service names both shas.** `/health` carries `forwarder` (the running code) and `on_disk` (the file beside it). Equal is current; different is "behind its code", the 2026-10-07 state, said out loud in the tab with both shas; an older forwarder that cannot say is `unknown`, never a guess.
2. **One button restarts it from the app.** `POST /restart` (family bearer) answers `{ok, restarting, running, on_disk, changed}`, flushes, then exits 3 after half a second; systemd's `Restart=on-failure` starts it again from the file on disk. One restart per 60 s (`429 restart-too-soon` otherwise); a body is ignored; nothing is pulled or written by the route. The tab shows "Update the camera service now" when behind, "Restart the camera service" otherwise, and re-reads the road ten seconds later. An older service that lacks the route is named (404 → "cannot restart itself yet; it updates itself within 15 minutes of a merge").
3. **The Wyze draft survives a reload.** The four values are saved on THIS device as typed (the same storage that already holds the family key), restored on mount with a line saying so, erased the moment the NAS accepts them, and erasable by hand ("Clear these from this device"). The copy no longer claims "nothing is kept in this browser"; it says exactly what is kept and until when.
4. **The steps can be heard, and Ari can explain the tab.** The sign-in registers its steps as the screen's reading (`setReadTarget('cameras-wyze-setup', …, elementId 'wyze-setup')`, cleared on unmount); "Hear the steps" asks the reader for them from the top. `help-content.js` gains `cameras`, so the Help/"Talk about this" door answers for the tab, including the tinyCam comparison and the key page steps.
5. **The agent restarts the NAS itself, now.** `nas-clock.yml` with `also_run_once=true` fires services-sync over the tailnet runner; the new installer sees the code sha change and restarts the forwarder. Dispatched this session (run 37573061542) the minute PR #1985 merged. No PowerShell, no ConnectBot asked of Darrell.

## Impact

The camera road's one remaining human step is the Wyze account owner's four values, typed once and never lost. Everything else, including recovering from a stale process, is a tap in the app or an action the agent takes. Honest limits stand: Gwell models (Cam OG, Pan v4, Floodlight Pro) are not yet streamable by go2rtc; a camera tinyCam shows as "P2P camera offline" will be offline here too, and the tab will say so from the restreamer's own answer, not guess.

## A false incident, found and closed in the same session

Run 37573386665 of `site-health.yml`, dispatched to prove the restart, crashed at the forwarder-sha compare I added in #1985: the job has no checkout, so `sha256sum < infra/nas-cameras/cams_forwarder.py` read an empty workspace, the probe step exited 1 before writing its verdict, and the ledger filed incident #1986 as "probe step crashed before reporting" while every probed URL (the app, pages.dev, the backend, `/nas-photos/healthz`, `/cams/health`) had answered 200. A witness that fails on its own bug is the DR-0076 class in reverse: it claims a down site over an up one. The compare now fetches main's copy from GitHub, reads `on_disk` too, and a miss is noted, never fatal. The next passing run closes #1986 by the workflow's own recovery step.

## Verification

- `cams_forwarder.py --selftest`: all checks green, section 8c new (no bearer → 401 and no exit; a bearer restart → 200 naming both shas, then exit 3 observed; a second tap inside 60 s → 429 with no second exit; allowed again after the window; a body changes nothing); `/health` names `on_disk`.
- `cameras.test.js`: `serviceCodeState`, `classifyRestartResult`, `restartService` (POST, bearer, never throws), the draft (save/load/clear, all-empty removes, corrupt or throwing storage never breaks the form).
- `cameras-render.test.jsx`: the draft survives unmount + mount and Clear erases it; the steps are the registered reading with the form element and Hear the steps asks for them; a behind service shows both shas and the button posts with the bearer; a current service shows no notice and a 404 is said plainly. 51 camera tests green; help-content 107 green; UI standards + legibility green; eslint clean.
- After merge: services-sync (or the dispatched run) restarts the forwarder; `/cams/health` then carries `forwarder == on_disk == main's sha` and site-health's "camera forwarder code" check reads equal. Darrell's test: open Cameras, the four values are still there, press Sign in and add my cameras.

## Follow-ups

- The restart route restarts only the forwarder; a stale go2rtc image is compose's business and already no-ops when current. If a case appears where go2rtc itself must be bounced from the app, add it then. `re-review: 2026-11-15` (with DR-0770's Wyze source review).
- The voice-lite service has the same `code` field in `/health`; a matching restart route there is the same shape when a need appears. `re-review: 2026-10-21`.
