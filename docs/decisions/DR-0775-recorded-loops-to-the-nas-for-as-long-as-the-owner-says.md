# DR-0775 — Recorded loops to the NAS, for as long as the owner says

- **Status:** accepted
- **Tier:** A (one new NAS service writing to the family's own disk under a disk budget; one bind mount; bearer-locked settings and ticketed playback on the existing camera road; no money, no schema, no church-facing identity)
- **Type:** feature
- **Date:** 2026-10-07
- **Scope:** `infra/nas-cameras/cams_recorder.py` (new), `infra/nas-cameras/poetech-cams-recorder.service` (new), `infra/nas-cameras/docker-compose.yml` (the recordings bind mount), `infra/nas-cameras/install.sh` (recorder install + code-sha restart; the forwarder restarts on either file), `infra/nas-cameras/cams_forwarder.py` (`GET/PUT /recording`, `GET /rec/<id>`, `GET /rec/<id>/<clip>` with Range, `ttl` on `/ticket`; selftest 8e), `.github/workflows/ci.yml` (recorder selftest), `app/src/lib/cameras.js` (recording helpers, measured forecast), `app/src/components/Cameras.jsx` (`RecordingPanel`), `app/src/lib/help-content.js`, `infra/nas-cameras/README.md`, `infra/nas-loops/services.json`; tests `cameras.test.js`, `cameras-render.test.jsx`.
- **Principles:** THE-APP-IS-THE-PRIMARY-ARTIFACT (DR-0065), VERIFICATION-DOCTRINE (DR-0076: measured, never painted), DR-0248 (deterministic class: budget + lock), DR-0236 (nothing waits), SOVEREIGN-PYTHON (the memory: born-Python NAS pipelines, never a new n8n webhook), DR-0756 / DR-0774 (the camera road)
- **Grounds:** Darrell 2026-10-07: *"Recorded loops for however long I want backed up to the nas?"* and, the same hour, *"Let's not build in undermining constraints... we want to build the best pipelines"*.

## Context

The camera road (DR-0756) showed live frames and nothing else; a frame missed was a frame gone. Darrell asked for the thing every camera system owner wants and every vendor sells back as a subscription: continuous recording, on his own disk, kept as long as he chooses.

## What was measured

- go2rtc README (v1.9.14): the official image "comes preinstalled with FFmpeg and Python"; any stream is an RTSP stream at `rtsp://host:8554/{stream_name}`; go2rtc records nothing itself. So the recorder needs no new program on the box: the ffmpeg inside the running container, reached with `docker exec`, copying the RTSP stream without transcoding.
- `docker-compose.yml` runs go2rtc host-networked with `/volume1/docker/go2rtc:/config`; a second bind mount gives the container a place to write that the host forwarder can read.
- The forwarder's playback tickets lived 90 s and a clip plays for minutes in Range pieces, each checked against the ticket; a clip would have cut off mid-play.
- Disk: unknown until clips exist. The forecast in the tab is computed from real clips (bytes over the span between a camera's oldest and newest clip), and says "not measured yet" under an hour of clips. No nominal bitrate is assumed anywhere.

## Impact

Without it the family's own cameras keep nothing and the house's memory lives in a vendor's cloud or nowhere. With it the owner decides, per camera, what is kept and for how long, and the disk cannot be filled by accident.

## Decision

1. **One recorder service, sovereign Python.** `cams_recorder.py` reconciles reality to `recording.json` every 10 s: one `docker exec poetech-go2rtc ffmpeg -i rtsp://127.0.0.1:8554/<id> -c copy -f segment -segment_time 600 -segment_atclocktime 1 -strftime 1 /recordings/<id>/%Y-%m-%dT%H-%M-%S.mp4` per enabled camera; stops what is switched off; restarts what died with a backoff of 5 s, 15 s, 60 s, 300 s; writes `recording.status.json` (per camera: recording, restarts, last exit, clips, bytes, oldest, newest; totals; disk free; the running code's sha).
2. **Retention per camera, one budget over all.** Each camera keeps 1 day to 1 year (default 14). One disk budget (default 200 GB, floor 5) prunes the oldest clip first across every camera when reached. The clip being written is never deleted. A camera switched off keeps its clips until retention or the budget removes them.
3. **The owner steers it from the tab.** `RecordingPanel` in Cameras: Record / Recording per camera, a keep selector, the budget, the measured line ("N recording · about X a day · the budget holds about D days"), on-disk and free bytes, the recorder's own report time. Settings go through the forwarder's bearer-locked `PUT /recording`, which refuses to enable a camera go2rtc does not have (a typo never spawns an ffmpeg) and writes the file atomically.
4. **Clips play through the same locked road.** `GET /rec/<id>` lists clips; `GET /rec/<id>/<clip>.mp4?t=` serves them with Range (206, 416) under a camera-scoped ticket that may now ask for up to 3600 s (`ttl` on `/ticket`, floor 90, ceiling 3600). Containment is by grammar (camera id, clip name) and by path check under the root.
5. **The installer carries it.** `install.sh` creates the recordings folder, adds the bind mount through compose, installs and enables `poetech-cams-recorder.service`, and restarts it on a code change; the forwarder restarts when either `cams_forwarder.py` or `cams_recorder.py` changes (it imports the recorder's helpers).
6. **Brakes, DR-0248 class.** The disk budget is the budget; systemd is the single-instance lock; stop paths are `enabled:false`, an empty config, or the unit. It does nothing until the owner switches a camera on.

## Verification

- `cams_recorder.py --selftest`: all green. A bad config normalizes (budget floored, retention clamped, bad ids and shapes dropped); a corrupt file records nothing and says so; the ffmpeg command is docker-exec + stream copy + time-named segments under the bind mount; two enabled cameras spawn two processes and the disabled one none; a camera switched off is terminated with its clips kept; a dead ffmpeg is noticed with its exit code and restarted only after the backoff; retention removes the 3-day-old clip and keeps the 1-day-old and the open one; a camera with no entry keeps 14 days; over budget the oldest clips across cameras go first and the open clip stays; status carries clips, bytes, free, sha, segment length.
- `cams_forwarder.py --selftest` 8e: `/recording` bearer-gated both ways; the default config records nothing; enabling an unknown camera is refused by name; PUT normalizes and writes to disk; `/rec/<id>` lists clips and ignores a stray file; a camera ticket plays the clip (200, Accept-Ranges), a Range is honored byte-exact (206 with Content-Range), a suffix Range works, past the end is 416, another camera's ticket is refused, only the clip grammar is served, a path escape is refused, a missing clip is 404; a ticket may ask up to 3600 s and never more or less than the bounds.
- `cameras.test.js` 51 green (urls, clipParts, groupClipsByDay newest first, the measured forecast and its three sentences, fetch/save/fetchClips with the bearer and every failure named). `cameras-render.test.jsx` 19 green: Record sends a PUT with the camera enabled and 14 days; the keep selector sends 30; Save budget sends 250; Clips lists by day newest first; a tap mints a 3600 s ticket and the player's src is the ticketed clip; an older NAS without the recorder is said plainly. help-content, UI standards, legibility, gates, eslint clean.
- After merge + NAS sync: the installer's log names the recorder active; `GET /cams/recording` answers; Darrell's test: press Record on one camera, wait eleven minutes, press Clips, play the first ten-minute clip.

## Follow-ups

- Motion-only recording and event marks on the timeline, once continuous clips exist to measure against. `re-review: 2026-10-21`.
- A day timeline that scrubs across clips as one piece (today: ten-minute clips picked by time). `re-review: 2026-10-21`.
- Cameras at the other house record only once they stream (DR-0774's relay decision). `re-review: 2026-10-14`.
