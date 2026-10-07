# 2026-10-07 — "Why can't I see the cameras?!" — the service restarts from the app, and the draft survives

**Layer 4 working note.** Decision: DR-0772. Pairs with DR-0770 (the Wyze sign-in in the app) and DR-0756 (the camera road).

## What Darrell saw

- The Cameras tab, Wyze form filled, "The NAS answered HTTP 404." (DR-0770 merged an hour earlier.)
- tinyCam Pro on his Android and Fire Stick showing two properties and a dozen cameras, several "P2P camera offline", and the question: *"tinycam pro can stream it... why how do others do this? Fix it."*
- After a redeploy under him: the form empty again. *"Why am I needing to redo this?!"*

## What was measured

- The NAS ran the OLD `cams_forwarder.py` process with the NEW file on disk: `install.sh` restarted the service only on a systemd unit change (fixed in PR #1985 with a code-sha stamp; `/health` now names the running sha).
- The form held its four values only in React state; `WyzeSetup` cleared them on success and nothing else, but a reload remounts the component with empty state. The deploy of PR #1985 (04:43 UTC) reloaded the PWA.
- How tinyCam and the bridges do it, with basis: Wyze's forum (live view is TUTK P2P, HTTPS for credentials); tinyCam's Wyze support is a cloud-account add over that P2P; docker-wyze-bridge requires the API ID/Key and uses go2rtc's built-in `wyze://` source for TUTK; go2rtc's own Wyze page says the same. The go2rtc 1.9.14 pinned on the NAS is the same road. The method was never the problem.

## What changed (this PR)

- `cams_forwarder.py`: `/health` carries `on_disk` beside `forwarder`; `POST /restart` (bearer) answers, flushes, exits 3; systemd brings it back from disk; one per 60 s; selftest 8c proves 401-no-exit, 200-then-exit-3, 429-no-second-exit, allowed after the window.
- `cameras.js`: `serviceCodeState`, `restartService`/`classifyRestartResult`, the device-local Wyze draft (`loadWyzeDraft`/`saveWyzeDraft`/`clearWyzeDraft`), the Wyze KINDS line says the sign-in is here and names the tinyCam road.
- `Cameras.jsx`: `ServiceRestart` under the road chip ("camera service behind its code · running X · on disk Y" + "Update the camera service now"); the form restores the draft and says so, erases it on success, "Clear these from this device"; `Hear the steps` + the form registered as the screen's reading; KindsHelp names the tinyCam comparison.
- `help-content.js`: `cameras` entry for Ari's Help / Talk about this.

## What the agent did on the NAS, itself

- PR #1985 merged 04:43:56 UTC. At 04:46 the agent dispatched `nas-clock.yml` on main with `also_run_once=true` (run 37573061542), which fires services-sync over the tailnet runner; the new installer restarts the forwarder on the code-sha change. The proof is the run's cams install step and `/cams/health` reporting the new sha; recorded in the PR once observed.

## For Darrell

Open Cameras. The four values are still in the boxes (and will be after the next deploy, too). Press **Sign in and add my cameras**. If the chip says "camera service behind its code", press **Update the camera service now** first; it is back in about ten seconds.

Honest limits unchanged: Gwell units (Cam OG, Pan v4, Floodlight Pro) are not yet streamable by go2rtc; a camera tinyCam shows offline is offline here too.
