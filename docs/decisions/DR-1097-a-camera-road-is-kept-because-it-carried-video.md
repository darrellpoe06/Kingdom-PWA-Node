# DR-1097: A camera road is kept because it carried video. Wyze's own WebRTC joins the roads, and the witness counts the cameras that never worked

**Date:** 2026-10-17
**Status:** accepted
**Tier:** A (the NAS forwarder's road record and go2rtc config; nothing new on the LAN or the Funnel; a deterministic judge with budget and lock)
**Type:** orchestration
**Area:**
- `infra/nas-cameras/cams_forwarder.py`: the Kinesis road (`kvs_source`, `is_kvs_source`, `bridge_kvs_signal`, `restream_source`); the byte probe (`stream_bytes`); the road judge (`judge_candidates`, `judge_camera`, `judge_pass`, `start_judge`); `ensure_bridge_roads` re-signs, honors and pins the road; `/why` carries the road and its verdict; selftest 8p
- `.github/workflows/camera-health.yml`: every-camera passes every third hour and a floor
- `.github/workflows/cams-diag.yml`: the judge's verdict per camera
- `app/src/lib/cameras.js`, `app/src/components/Cameras.jsx`: the road named truthfully, the verdict on the tile's Why?, the owner's "Use Wyze's WebRTC"

**Amends:** DR-0809 (the bridge road; its rule that the bridge's web credentials never ride a stream line), DR-0835 (roads judged by whether they answer), DR-0806 (the camera road witness).
**Grounds:** DR-0076 (measure, don't claim; a green check must mean something), DR-0248 (budget plus lock), DR-0621 (hold the hand of the process), DR-0100 (state the fact plainly).
**Declared by:** Darrell, 2026-10-17: *"Cameras never work!!!!!!!!!!! Fix it!!!!!"*

## Context

The cameras reach the app over one road: poetech.us `/cams` → the Funnel → `cams_forwarder.py` on the NAS → go2rtc. go2rtc reaches each Wyze camera directly when the camera is on the NAS's own network with DTLS firmware. Otherwise it goes through the Wyze bridge (`mrlt8/wyze-bridge:2.10.3`, DR-0809), which dials Wyze's TUTK peer-to-peer service. DR-0807 and DR-0835 left one question open by name: why does the Wyze app show cameras whose peer service tells the bridge `IOTC_ER_DEVICE_OFFLINE`?

## What was measured

- **camera-health 39068529374** (probe every camera, 20:52 UTC): **3 of 31 cameras gave a frame**. front_cam answered on the direct road; great_room and kitchen_2 answered through the bridge. The other 28 gave nothing in 5 s.
- **camera-health 39059172203** (the scheduled pass, 18:41 UTC) probed only the 2 cameras recording or watched and wrote "no regression". Every run that day was green. The witness compared each pass only with the one before, so 28 cameras that never answered were never an incident.
- **cams-diag 39068531141:**
  - 60 of go2rtc's 62 streams ride the bridge (`rtsp 127.0.0.1:8555`).
  - go2rtc's log is a wall of `read tcp 127.0.0.1->127.0.0.1:8555: i/o timeout` in every viewer mode.
  - The bridge holds a connection to 2 cameras (great-room, kitchen-2). Every other camera reads `IOTC_ER_DEVICE_OFFLINE`: the 805 cameras, Kitchen Cam, Living Room, Front Yard, Outside Front Door, North East and others. Or `IOTC_ER_TIMEOUT`: Front Door View, Basketball, the garage and back-yard cameras, the rest of 805.
  - The forwarder kept moving cameras between the two dead roads: `direct-unreachable: watched with no byte arriving for 336123s`, 3.9 days.
  - Wyze reports the cameras at 192.168.4.x, 192.168.7.x, 192.168.11.x and 10.0.0.x. The NAS is on 192.168.1.26/24.
- **Outside sources:**
  - [mrlt8/docker-wyze-bridge#1544](https://github.com/mrlt8/docker-wyze-bridge/issues/1544), opened 2026-07-07, bridge 2.10.3 (the version we pin): `IOTC_ER_TIMEOUT` and `IOTC_ER_DEVICE_OFFLINE` on every stream while the cameras are live in the Wyze app. No fix upstream.
  - The [IDisposable fork](https://github.com/IDisposable/docker-wyze-bridge) states that Wyze disabled TUTK on newer firmware in 2025, and falls back to WebRTC.
  - The bridge we run already serves Wyze's WebRTC signaling: `app/frontend.py` route `/signaling/<name>` with `?kvs` calls `get_kvs_signal` → `wyzecam.api.get_cam_webrtc`, behind HTTP Basic auth with the bridge's web sign-in. A camera Wyze will not serve this way answers "Camera does not support WebRTC".
  - go2rtc 1.9.14 consumes that road as `webrtc:http://…/signaling/<cam>?kvs#format=wyze` (`internal/webrtc/README.md`; `wyzeClient` in `internal/webrtc/kinesis.go` at the v1.9.14 tag).

## Impact

- **Every dark Wyze camera is tested on the road the Wyze app itself watches through.**
  - Cameras Wyze serves over WebRTC, and that carry video there, stay on that road.
  - A camera on Wyze's WebRTC road needs no route to its LAN and no TUTK. That covers the 805 cameras on 10.0.0.x and the house cameras on the other subnets.
- **Every camera gets a measured answer per road**: video in N ms, no byte in 30 s, or Wyze's own words. The answer shows on the tile's Why? in the app, in cams-diag, and in `/streams/roads`. "Why is this tile blank" no longer ends at a guess.
- **The witness stops passing a broken camera wall.**
  - Every third hour (UTC) the scheduled pass probes every camera.
  - A pass where fewer than half give a frame is an incident under `priority:cameras`, with the dark cameras named, whatever the previous pass said.
- **The app's words are true.** The bridge no longer claims to be "the road the Wyze app itself uses"; the Wyze app's road is now named as its own.

## Decision

1. **A road is kept because it carried video, never because of its address or its name.**
   - A Wyze camera on the bridge or the Kinesis road with no byte for 15 minutes is judged:
     1. its current road is read the way the app's live view reads it (go2rtc `stream.mp4`, 16 KB within 30 s);
     2. when that carries nothing, the other road is put on the same stream and read the same way;
     3. the road that carried video stays.
   - When neither carries video, the camera goes back to the line it had and is named dark on both, with each road's own failure.
   - A road the bridge carries is never traded for the cloud: a working peer road is read first and kept.
2. **Wyze's WebRTC is reached through the bridge's signaling.** It is not a new service, not a new image, and not a new port. Its SD twin is go2rtc's own restream of the main stream (`rtsp://127.0.0.1:8554/<id>`), so a tile and a live view share one Kinesis session.
3. **The bridge's web sign-in rides the Kinesis line.** This amends DR-0809's rule for this one road. The route is behind the web sign-in, and the API key opens only API paths (`web_ui.py`, `verify_password`). The two values sit where the stream key and the Wyze account already sit: root-only `go2rtc.yaml` and roads file, scrubbed wherever a URL is quoted, with the bridge bound to loopback. They never leave the NAS. `/why`, `/list`, `/streams/roads` and cams-diag carry no line.
4. **Brakes (deterministic class, DR-0248):**
   - **budget:** 3 cameras per pass, each probe 30 s, the pass 240 s;
   - **lock:** one pass at a time, in its own thread, so the sampler never waits on Wyze;
   - **pacing:** a judged camera is not judged again for an hour.
   - Stop-paths are `CAMS_KVS=0`, or the owner pinning a road.
   - The owner's hand: "Use Wyze's WebRTC", "Use the Wyze bridge", "Use the direct road", and "Let the NAS choose", which asks the judge again at once.
5. **The witness probes every camera every third hour and holds those passes to a floor of half.** "Never worked" is an incident, not a baseline.

**Not built here, with its reason.** Replacing the bridge image with the IDisposable fork (go2rtc-native, WebRTC fallback) is the next road if Wyze's WebRTC proves unavailable for these cameras. It replaces a running service, so the measured verdicts from this road decide it, not an assumption. `re-review: 2026-10-20`. Read the cams-diag judge section after the first full sweep, about 3 hours after install: how many cameras rode Kinesis, how many Wyze refused and in what words, and how many are dark on both. If Kinesis carries fewer than half of the dark cameras, the fork comes next with that number as its reason.

## Verification

- **`cams_forwarder.py --selftest`:** 403 checks, every one passing. Section 8p adds 35, plus 2 on `/why`.
  - The Kinesis line is the documented go2rtc form, signed with the web sign-in. Only a `?kvs` signaling line on the bridge's own address counts as that road.
  - Wyze's answer is read as its result alone: the signed URL and the TURN credential never leave the function.
  - "Camera does not support WebRTC", "cam not found" and a wrong sign-in (HTTP 401) are each named.
  - The byte probe names go2rtc's own failure and is bounded by its own clock against a stream that answers and sends nothing.
  - **PROVEN TO CATCH:** the road sync alone, which was all that ran before this record, keeps a camera on the dark bridge dark.
  - The judge moves a bridge-dark camera that Kinesis carries, with its restreamed twin and the config matching memory.
  - It leaves a camera Wyze refuses, naming it in Wyze's own words. It tries a camera dark on both roads, then puts it back. It keeps a camera the bridge carries, and touches nothing. It moves a Kinesis camera gone dark back to the bridge.
  - Candidates: never-judged first; not the one carrying bytes, not the pinned one, not one judged within the hour, not a direct or twin stream.
  - Budget, clock and lock each proven. The owner's "kvs" and "bridge" each applied. A changed web sign-in re-signs once.
  - `/why` carries the verdict and no line, key or password.
- **camera-health judge, run under node against the real readings:**
  - today's every-camera pass, 3 of 31: the old judge raised nothing; the new judge raises the incident, naming 28 dark cameras;
  - 17 of 31: no incident.
- **App:** `cameras.test.js` and `cameras-render.test.jsx`, 148 passing. The new tests cover the Kinesis road through `/list`, the truthful road words, `judgedLine` for kept, refused and dark-on-both, `bridgeLine`'s Kinesis count, and the Why? panel showing the measured verdict and the owner's Kinesis button.
- **Live, after merge (DR-0107), not yet observed:**
  - services-sync installs the forwarder; its code sha restarts it.
  - Within 15 minutes the first judge pass runs.
  - cams-diag's judge section and the next every-camera camera-health pass give the measured count. That count is the proof, or the reason for the fork.

## Second field read (2026-10-17 22:02 UTC, cams-diag 39073414169)

The forwarder (`29adca738b9715e5`, running and on disk) judged every dark camera within 15 minutes of services-sync installing it. The judge is the reason this was seen at all: each verdict is measured and named.

- **26 cameras: Wyze's signaling answered "cam not found".** The cause is ours. The bridge lists every camera twice under one MAC, for example `back-yard-north` and `back-yard-north-sub`. The road sync matched by MAC and kept the last name, so 26 main streams rode a `-sub` substream, which DR-0979 had already measured timing out on every camera. Wyze's signaling knows no camera by a `-sub` name.
- **3 cameras answered "ok" but carried no video in 30 s:** east_north_cam, kitchen_cam and north_east_cam. These are the cameras with no `-sub` twin. Wyze's peer service reports the same three `IOTC_ER_DEVICE_OFFLINE`.
- **The bridge carried video on 2 cameras, which were kept there:** great_room (4077 ms) and kitchen_2 (3810 ms).

**The change, same record:**

- `by_mac_main` matches a MAC to the bridge's main name, never its `-sub`.
- Every camera recorded on a `-sub` is moved to its main stream once.
- The judge asks Wyze by the main name.
- Judge version 2 re-judges every version-1 verdict at once, rather than after the hour.
- A camera dark on both roads keeps go2rtc's own log lines about it (`go2rtc_said`), never the bridge's timeout wall. The three "ok but no video" cameras will say why.

**Verification:**

- Selftest 410 passing. Section 8q is proven to catch: with the old lines restored, the `-sub` re-sign check and the main-name check both fail.
- The next cams-diag reads the second sweep.

## Third field read (2026-10-17 23:00 UTC, cams-diag 39077312135 and camera-health 39077314118)

The forwarder (`12adef08468784da`, running and on disk) judged every Wyze camera again under its main name.

- **14 cameras carry video on Wyze's WebRTC road and were kept there**, 16 KB of video in 6.2 to 9.5 s each: 805 Back Door, 805 Basement, 805 Front Office View, 805 Hallway North East, 805 North, 805 North East, 805 Upper Hallway South West, Basement North, Basketball, Front, Front Door View, Garage Front Yard, Outside 7, PoeBasement. Every one of them was dark on the bridge's TUTK road.
- **The bridge still carries great_room and kitchen_2. front_cam rides the direct road.**
- **13 cameras are dark on both roads:** 805 Apt 4, 805 Front Outside, Back Yard North, Back Yard South, Basement Living Room, East North, Front Driveway Door, Front Yard, Garage Doors, Kitchen Cam, Living Room, North East Cam, Outside Front Door. 805 Porch is not judged yet. For each of the 13, Wyze issued a signaling channel ("ok"), go2rtc sent its offer, and the camera never answered. go2rtc's log closes each of those offers with `websocket: close 1001 (going away)` ten minutes and one second after it was sent (13 offers read, every one 10:01): that is Amazon closing an idle signaling socket. Wyze's peer service separately calls Kitchen Cam, Living Room, Front Yard, Outside Front Door and North East `IOTC_ER_DEVICE_OFFLINE`. For those cameras two separate Wyze services agree that the camera is not answering anyone tonight. That points to the camera's power or Wi-Fi, which no road on the NAS can reach.
- **The witness: 13 of 31 cameras gave a frame**, up from 3 of 31 this afternoon. Four Kinesis cameras the judge had just watched carry video (805 Back Door, Basement North, Front, Garage Front Yard) timed out at the witness's 12 s frame clock.

**Three defects of ours, measured in the same read:**

1. **Every tile frame was a fresh Kinesis offer.** go2rtc hangs up a camera when its last viewer leaves, and the app asks each camera for a frame every 5 s. go2rtc's Kinesis dial has no clock of its own (`kinesisClient` in `internal/webrtc/kinesis.go`, v1.9.14). An offer a camera leaves unanswered therefore holds that camera, and every viewer behind it, for ten minutes. The log shows it: Basement North carried video for the judge at 17:23:18, and the next offer at 17:23:35 hung until 17:33:36.
2. **The record told the app the wrong road.** While the judge had a camera on Kinesis to read it, the road sync saw the Kinesis line and wrote "kvs" into the record. The judge then put the bridge line back under a record that still said "kvs". The cams-diag rows for back_yard_south, front_yard and north_east_cam read `road=kvs` beside "kept bridge (DARK ON BOTH)".
3. **The frame clocks were shorter than the road.** A Kinesis frame waits for the dial and a whole key frame. The forwarder's and the app's 12 s, and the witness's 12 s, cut off cameras that work.

**The change, same record:**

- **The held session (`KvsHold`).** A Kinesis camera someone is looking at keeps one session: a holder reads its live stream until nobody has asked for it for 60 s, and every frame and live view joins that session. A dial with no byte in 20 s is abandoned: the camera's own line is put again (a PUT gives go2rtc a fresh stream, so the next dial is a fresh offer), at most once every 30 s.
  - **Brakes (DR-0248):**
    - **budget:** 16 holders; each one ends 60 s after the last look and never outlives an hour; one dial every 5 s.
    - **lock:** one holder per camera, under one table lock.
    - **stop-paths:** `CAMS_KVS=0` or `CAMS_KVS_HOLD_MAX=0`.
  - `/health` and `/streams/roads` name the held cameras and their counts, never a line.
- **The judge's camera is the judge's.** The sync leaves a camera alone while the judge tries its other road. A camera dark on both is written back as the road go2rtc holds. A record that already says "kvs" over a bridge line is healed by the next sync.
- **Clocks:**
  - a Kinesis frame gets 20 s on the NAS and 22 s in the app;
  - the witness probes every camera for 20 s.
- **cams-diag** prints each camera's model and firmware from the bridge's own list (named fields only). It also counts the Kinesis offers Wyze never answered.

**Verification:**

- **Selftest:** 429 passing; section 8r is new. Each fix was mutated out once, and each mutation fails its checks:
  - with no re-arm, 2 checks fail;
  - with no judge guard, 1 fails;
  - with no record heal, 1 fails;
  - with no road written back on dark, 1 fails.
- **App camera tests:** 226 passing.
- **Live after merge (DR-0107):** the next cams-diag and the next every-camera pass of the witness.

**What is left, by name:** the 13 cameras dark on both roads. The next step needs Darrell's hand, with no code: open the Wyze app on the Fold and look at those 13. A camera the Wyze app also shows offline needs power or Wi-Fi at the camera. A camera the Wyze app shows live while Kinesis stays unanswered is the case the IDisposable fork exists for. Its model and firmware in the next cams-diag decide it. `re-review: 2026-10-20`, unchanged.

## Fourth field read (2026-10-18 00:22 UTC, cams-diag 39082506292 and camera-health 39082507944)

The forwarder `0972e334d36d20e1` is running and on disk. Deploy 39079706218 is green for d7a3f6b03.

**What is proven live:**

- At install, the record heal corrected four rows at once: basement_living_room, east_north_cam, front_yard and north_east_cam. Each record said "kvs" while go2rtc held the bridge line. No row now reads `road=kvs` beside "kept bridge".
- The judge's re-tries win cameras back. Back Yard South had two unanswered offers and then carried video on the third (16 KB in 9.2 s). It now rides Kinesis.
- No viewer opened the app between the install and the read, so the holder has not run yet (`started 0`). The witness reached go2rtc directly and never touched it.

**What the read shows:**

- **A Kinesis offer is answered by some cameras on one try and not the next.**
  - Four cameras that carried video at 23:00 left their next offer unanswered: 805 Upper Hallway South West, Basement North, Front Door View, Garage Front Yard.
  - The witness's single 20 s ask timed out on six cameras on the Kinesis road, the same unanswered dial each time: 805 Back Door, Back Yard South, Basement North, Front, Garage Front Yard, Outside 7.
  - go2rtc's log holds 37 unanswered offers.
  - The witness read 12 of 31.
- **The model does not decide it.** Cameras with the same model and firmware (V2 4.9.9.3006, V3 4.36.17.21, V3 Pro 4.58.17.21) appear among the cameras that carry video and among the dark ones. Wyze marks every camera `webrtc=True`.
- **Firmware age does line up with the dark cameras.** Seven of the 13 run firmware older than their siblings: East North and North East Cam (V3 4.36.3.18), 805 Front Outside (V3 Pro 4.58.16.6114), Outside Front Door (V3 Pro 4.58.13.1321), Front Driveway Door and Front Yard (V2 4.9.9.1851), Kitchen Cam (V2 4.28.4.49). A camera that has been off its network misses the updates its siblings took. The other six run current firmware: 805 Apt 4, Back Yard North, Basement Living Room, Living Room (V2), Garage Doors (V3).

**The change, same record: the witness asks the way the app asks.** Every frame now goes through the forwarder's `/snap`, the road the Cameras tab takes, with its breaker, its held Kinesis session and its 20 s clock. A camera silent on the first ask is asked once more after 30 s, as the tab does (`SNAP_RETRY_FAILED_MS`). The pass now reports two numbers: cameras that gave a frame on either ask, and how many did so on the first ask. The floor of half holds against the first number. A harness against a fake forwarder confirmed it:

- a camera that answers only on the second ask counts;
- a camera that never answers stays dark;
- the first-ask count is kept.

`timeout-minutes` is now 25, for the second pass.

**What is left:**

- **Darrell's hand:** look at the 13 cameras in the Wyze app, and start with the seven on old firmware.
- **The next read:** the next every-camera pass of the witness, now made the app's way.
- `re-review: 2026-10-20`, unchanged. The fork comes next if Kinesis, asked the app's way, still carries fewer than half.
