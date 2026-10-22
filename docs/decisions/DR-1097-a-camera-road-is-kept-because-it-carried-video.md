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

## Fifth field read (2026-10-18 00:44 UTC, camera-health 39083442780, the app's way)

The witness now asks for each frame the way the app does: through the forwarder's `/snap`, and once more after 30 s.

- **15 of 31 cameras give a frame, up from 12 on the direct ask.** 12 answered on the first ask.
- **The held session is proven live.** Back Yard South, Basement North and Garage Front Yard left the first offer unanswered and timed out at 20 s (504). On the second ask, each gave a frame in 3.3 s. Between the two asks, the holder had re-armed the offer.
- **Three Kinesis cameras timed out on both asks:** 805 Back Door, Front Door View and Outside 7. All three are V3 Pro on firmware 4.58.17.21. Two other V3 Pro cameras on the same firmware answer in 5.8 s (805 Hallway North East, 805 North East). The model therefore does not explain it. In the app, the tab keeps asking every 30 s and the holder keeps re-arming, so a tile appears on whichever offer one of these cameras answers.
- **The 13 cameras dark on both roads are unchanged.** go2rtc answers an empty frame for each of them within 5 s on either ask.

The floor is half, 16 of 31, so the pass is still an incident: one camera short.

**What is left:**

- **Darrell's hand:** the 13 cameras dark on both roads, in the Wyze app; the seven on old firmware first.
- `re-review: 2026-10-20`, unchanged.

## Sixth field read (2026-10-18 20:29 CDT, Darrell's Wyze app on the Fold)

Darrell sent three screenshots: the 805 N Prospect group live in the Wyze app, one camera the Wyze app itself calls "The device is offline", and Wyze's own Firmware Update list.

- **Correction, stated plainly.** The fourth read said seven of the dark cameras "run older firmware than their siblings" and treated that as a sign of being off the network. Wyze's Firmware Update list shows the family's cameras "Up to Date". Garage Doors is on current firmware and still dark. Firmware does not explain the dark cameras, and that inference is withdrawn.
- **Two cameras the Wyze app shows live were never in the app at all:** 805 Porch - Floodlight Cam - East and 805 Floodlight Cam - West (Floodlight Pro, LD_CFP).
  - **The cause, from go2rtc's own source** (`pkg/wyze/cloud.go`, v1.9.14): `if dev.DeviceParams.IP == "" { continue // skip cameras without IP (gwell protocol) }`. The Floodlight Pro is a Gwell camera, so go2rtc's Wyze sign-in dropped it, and it never became a stream.
  - The bridge does list both cameras (`webrtc=True`, `enabled=False`, firmware 2.2.1.1345).
  - None of the counts in this record could see them, because the witness counted 31 go2rtc streams.
- **The Wyze app itself shows a camera offline.** That is the same fact our two roads measured from the NAS for the dark cameras: Wyze issues the channel and the camera never answers. The fix is at the camera, not on the NAS.

**The change, same record:**

- **The cameras go2rtc's sign-in drops are added** (`missing_cameras`, `ensure_missing_cameras`, in the judge's own thread).
  - Which cameras: those the bridge lists that no go2rtc stream (Kinesis, bridge, or direct by MAC) and no roads record carries.
  - How: each is asked of Wyze's signaling. On "ok", it is added on Wyze's WebRTC road under its Wyze nickname, with its restreamed twin, and its record names `reason: not-in-go2rtc`.
  - A camera the family later removes keeps its record and is never added back.
  - **Brakes (DR-0248):**
    - 2 cameras a pass;
    - a camera Wyze refused is not asked again for an hour, and its refusal is kept in Wyze's words;
    - stop-paths `CAMS_KVS=0` or `CAMS_ADD_MISSING=0`.
- **cams-diag prints Wyze's own online/offline word for every camera** (the forwarder's `/devices`, `conn_state`), so "is this camera offline?" is answered by Wyze, not inferred.

**Verification:**

- Selftest: 436 passing; section 8s is new.
- PROVEN TO CATCH: with the add removed, five checks fail. Those five cover the add itself, its record, the never-add-back rule, the budget, and the hour between asks.

**Live, after merge:** the next judge pass asks Wyze for the two Floodlight Pros. cams-diag names whether each was added and prints Wyze's own online word per camera.

## Seventh field read (2026-10-19 03:09-03:25 UTC; cams-diag 39193312253 and 39194598172, camera-health 39193314318)

The sixth read's code is live: the forwarder runs `da48692dea4950bc`, the same as on disk.

- **Both Floodlight Pros are in the app now.** The forwarder added them on Wyze's WebRTC road at 21:46 CDT ("added on Wyze's own WebRTC road: go2rtc's Wyze sign-in skips a camera Wyze gives no address"). The judge then measured 16 KB of video from each: West in 8.8 s, Porch East in 8.3 s. On the witness pass West gave a frame in 4.3 s, and Porch East timed out on both asks (the cause is below).
- **Wyze's own word, per camera: 22 online, 11 offline, of 33.** Wyze itself calls these offline: 805 Apt 4, 805 Front Outside, 805 Porch Cam, Basement Living Room, East North Cam, Front Driveway & Door, Front Yard, Kitchen Cam, Living Room, North East Cam, Outside Front Door. They are 11 of the 13 cameras dark on both roads, so the cause for each is at the camera (its power or its Wi-Fi), as the sixth read said. The other two, Back Yard North and Garage Doors, are online to Wyze and dark to us, so they are ours.
- **The witness read 9 of 33, down from 15 of 31.** The 9 that answered: 805 Back Door, 805 Basement, 805 Floodlight Cam - West, 805 North East, 805 Upper Hallway - South West, Basketball Cam, Great Room, Kitchen 2, PoeBasement. Thirteen cameras Wyze calls online gave no frame on either ask: 805 Front Office View, 805 Hallway - North East, 805 North, 805 Porch - Floodlight Cam - East, Back Yard North, Back Yard South, Basement North, Front, Front Cam, Front Door View, Garage Doors, Garage Front Yard, Outside 7.

**The cause is ours, measured and read in go2rtc's own source (v1.9.14):**

- **The forwarder's stream sampler showed hung frame requests with nobody watching.** Front Cam had 13 consumers, Front Door View 10, 805 Hallway - North East 8, and 805 Front Office View and 805 North 2 each. Every one of them read "bytes-frozen" for 155 samples, which is 39 minutes. 805 Front Office View held a live Kinesis socket with 3 medias and no bytes. These sessions had connected and carried no video.
- **go2rtc never lets go of a frame request on such a session.** In `internal/mjpeg/mjpeg.go`, `handlerKeyframe` waits for a key frame (`cons.WriteTo`) with no clock and never reads the request's context. A client that gives up leaves its consumer behind. `internal/mp4/mp4.go`, by contrast, removes its consumer when the reader drops ("handle when the client drops the connection"), so the holder's live MP4 never leaked.
- **A stream with a consumer is redialled forever.** `internal/streams/producer.go` (`reconnect`) retries with backoff that tops out at one minute. `stopProducers` stops a producer only when no consumer is left.
- **A PUT does not close the old stream.** `streams.New` puts a NEW stream in the map and leaves the old one running with its consumers. So each re-arm and each road try on a frozen camera left one more session dialling Wyze for good. go2rtc's log carried 560 Kinesis sockets closed by Amazon, with several a minute for the same camera.
- **The holder counted any bytes as video.** A dial that brought a few hundred bytes and then went silent was "held", so it was never re-armed.

**The change, same record:**

- **A frame of a held Kinesis camera is asked of go2rtc only while its session carries video.** `/snap` waits, within its own 20 s clock, until the holder has read 16 KB of video (`KVS_HELD_MIN_BYTES`, the judge's own mark) on the current dial, with the last byte within 3 s (`KVS_FLOWING_FRESH`). Otherwise it answers 504 "no video on Wyze's WebRTC road yet; go2rtc was not asked". A camera the holder is not holding (holders full, or `CAMS_KVS_HOLD_MAX=0`) is asked as before.
- **A dial that brings less than 16 KB is unanswered, whatever bytes it carried.** It is re-armed at most once per `KVS_REARM_GAP`, and every dial is spaced by `KVS_REDIAL_SECONDS`.
- **Every Kinesis camera can be held: the budget is 32 holders, up from 16.** 20 of the 33 cameras ride Kinesis now. A camera past the budget is asked of go2rtc unheld, which is the request go2rtc never lets go of.
- **go2rtc is released once.** `infra/nas-cameras/go2rtc.release-epoch` names this read. On its next cycle the installer restarts `poetech-go2rtc` once for that epoch and records it; the streams come back from the config on disk. Only a restart frees the requests that already leaked.
  - Budget: one restart per committed epoch.
  - Stop-path: leave the file unchanged.
- **A refused PUT now logs go2rtc's own reason.** The journal showed "HTTP 400" with no words; it now says whether `streams.New` refused the source or only `app.PatchConfig` failed to write the file.

**Verification:**

- Selftest: 446 passing; section 8t is new.
- PROVEN TO CATCH, the old byte rule restored: the frozen dial (900 bytes, then silence) is counted as held and never re-armed, so 8t's first check fails.
- PROVEN TO CATCH, the `/snap` gate removed: go2rtc is asked for a frame of a session with no video, so two checks fail.

**Live, after merge:** services-sync restarts go2rtc once, and the forwarder restarts on its new code. Then the next every-camera pass of camera-health is read against the 22 cameras Wyze calls online, and cams-diag against the sampler's consumer counts, which should be 0 with nobody watching.

- `re-review: 2026-10-20`, unchanged.

## Eighth field read (2026-10-19 04:29 UTC; cams-diag 39199689871): the release took every camera down

**Stated plainly: the one go2rtc restart this record shipped took every camera in the app down.**

- The forwarder runs the seventh read's code (`733cfd6749f8936e`), and the installer released go2rtc for epoch `2026-10-19.frozen-frames` at 23:02 CDT.
- go2rtc came back with **zero streams**, on its default listeners (`rtsp :8554`, not `127.0.0.1:8554`).
- Its own log at start: `yaml: line 96: could not find expected ':'`. `go2rtc.yaml` would not parse, so go2rtc ran without it.

**The cause is older than the release, and it explains a second mystery.**

- The file was last written at 22:55 CDT by the old forwarder's direct line rewrite (the judge's road try on Front). go2rtc had refused every PUT with HTTP 400 for hours before that.
- A PUT runs `streams.New` (the stream goes live in memory) and then `app.PatchConfig`, which must parse the file. An unreadable file fails the second step every time. The 400s were never the stream: they were the file.
- The old go2rtc kept running only because it had read the file before it broke. The restart was the first moment anything had to read it again.
- The self-heal then tried to re-add the cameras from the Wyze sign-in and was refused (HTTP 502) every ten minutes.

**The change, same record:**

- **A go2rtc that lists no streams gets back every stream its own file defines, before anything else** (`restore_streams_from_config`, on the self-heal's clock: 20 s after start, then every 10 min).
  - The file is read by shape, the way `config_stream_names` reads it, with every source of a list. Each stream is PUT with its own sources.
  - The expected 400 is ignored: the stream is in memory all the same.
- **cams-diag prints the shape of every line that is not a key, a list item, a comment or blank, and of the last six lines.** That is the indent, the class, the quote counts, the length and how the line ends. Never a value, and a key name only under `streams:`. This finds line 96 without reading a secret.

**Verification:**

- Selftest: 448 passing.
- PROVEN TO CATCH: with the restore removed from the self-heal, its check fails.

**What is left:**

- **Repair line 96 itself,** once cams-diag names its shape. Until then the streams live in go2rtc's memory and the next go2rtc restart empties it again, though the self-heal puts them back within ten minutes.
- **No go2rtc release without proving the file parses first:** a restart is a config load. The installer's epoch step gains that check before any new epoch.
- `re-review: 2026-10-20`, unchanged.

## Ninth field read (2026-10-19 05:13 UTC; cams-diag 39203389412): the cameras are back, and line 96 has a shape

- **The cameras are back in go2rtc:** `/health` lists 66 streams on the forwarder `8b86e1cbbf5f1000`. The restore from the file worked on its first tick.
- **Line 96 has a shape:**
  - It is one character at column 0, and it is the file's last line.
  - It follows the `wyze:` block, whose lines 91-95 are well-formed keys.
  - It is not a key, which is the line go2rtc could not read.
  - No line at column 0 that is not a key can sit in a block mapping, so taking it out loses nothing a parser could read.

**The change, same record:**

- **The forwarder repairs the file, and go2rtc proves the repair** (`repair_config_strays`, on every self-heal tick).
  - Lines at column 0 that are not a key, a comment, blank or a document marker are taken out.
  - The result goes to go2rtc's own `POST /api/config`. go2rtc parses it with its own yaml and writes it only when it parses (`internal/api/config.go`).
  - A refusal leaves the file exactly as it was and logs go2rtc's reason.
- **No go2rtc release without a parse.** Before an epoch restart, the installer has the running go2rtc parse the current file the same way. Anything but 200 means no restart and no epoch recorded, and the reason is said.

**Verification:**

- Selftest: 454 passing.
- PROVEN TO CATCH, the repair taken out of the self-heal: the check that every tick repairs fails.
- PROVEN TO CATCH, the repair that keeps the stray line: two checks fail.

**Live, after merge:** the next self-heal tick logs "config-repair". From then on a PUT is accepted (200), so the journal's "refused PUT ... HTTP 400" lines stop.

- How the stray character got there is not yet known; the repair stands guard every ten minutes whatever wrote it.
- `re-review: 2026-10-20`, unchanged.

## Tenth field read (2026-10-19 06:16-06:22 UTC; cams-diag 39208913645, camera-health 39208915955): the floor is met

- **The repair is live.**
  - At 00:31:26 CDT the journal logged: "config-repair: line(s) 96 of go2rtc.yaml held nothing YAML can read; taken out, and go2rtc parsed the result before writing it".
  - `go2rtc.yaml` now has 95 lines, and none fails the shape check.
  - No "refused PUT" line has been logged since.
  - go2rtc lists 66 streams, and the forwarder runs `a9c0e306c7c02777`.
- **Unanswered Kinesis offers in go2rtc's log fell to 44, from 560 before the release.**
- **The witness reads 18 of 33 (17 on the first ask), the best read in this record.**
  - The baseline before the repair (camera-health 39203690931) was 16 of 33. Before the seventh read it was 9 of 33.
  - The floor is half (17), so the pass is not an incident. The `priority:cameras` label came off.
- **Dark: 15.**
  - **11 that Wyze itself called offline in the sixth and seventh reads:** 805 Apt 4, 805 Front Outside, 805 Porch Cam, Basement Living Room, East North Cam, Front Driveway & Door, Front Yard, Kitchen Cam, Living Room, North East Cam, Outside Front Door. Wyze's own list answered HTTP 429 this time: the cloud is rate-limiting this account's listing.
  - **4 that are ours:**
    - **805 Floodlight Cam - West:** go2rtc answered "exit status 183" on both asks. Its held session carried video (the judge measured 16 KB in 4.5 s), and ffmpeg could not make a JPEG of the key frame. 183 is ffmpeg's invalid-data code.
    - **Back Yard South, Front Cam, Garage Doors:** "no video on Wyze's WebRTC road yet". Each camera left the offer unanswered on both asks, and go2rtc was rightly not asked for a frame.
- **Back Yard North, Basement North, Front Door View, Outside 7 and Front all answered.** The judge had called each of them dark on both roads; every one was a camera the frozen sessions had been holding.

**What is left:**

- **805 Floodlight Cam - West's frame: fixed in the same record.**
  - cams-diag 39210024616 with `camera=805_floodlight_cam_-_west`: the full-size frame answered 200 in 4.2 s (169 KB), and the 35 s stream probe carried 4.8 MB.
  - Only the resized frame (`?w=640`, the size the tab and the witness ask for) failed, because go2rtc hands the resize to ffmpeg, which exits 183 on that camera's key frame.
  - `/snap` now asks once more at the camera's own size when go2rtc's resize answers 500 "exit status ...". Any other 500 is passed on in go2rtc's own words and never retried.
  - Selftest: 456 passing. PROVEN TO CATCH: with the retry taken out, its check fails.
- `re-review: 2026-10-20`, unchanged: decide on the IDisposable fork for the Kinesis dial clock against this read.

## Eleventh field read (2026-10-19 07:22-07:29 UTC; camera-health 39215549062): Floodlight West answers

- **805 Floodlight Cam - West now gives a frame** (9.2 s, 28 KB) on forwarder `1b9bec4d5cf9784a`. The full-size retry is live.
- **The witness reads 18 of 33 again (17 on the first ask)**, which meets the floor. The `priority:cameras` label stays off.
- **The Kinesis cameras that go dark change from pass to pass:**
  - Back Yard South, dark in the tenth read, answered in 8.9 s.
  - Basement North and Outside 7, which answered in the tenth read, left both offers unanswered.
  - Front Cam and Garage Doors left the offer unanswered in both reads.
  - So on Wyze's WebRTC road a camera answers an offer some of the time; this is not a fixed set of broken cameras.
- **Dark, 15:**
  - The same 11 that Wyze itself calls offline.
  - 4 that left Wyze's offer unanswered on both asks: Basement North, Front Cam, Garage Doors, Outside 7.
- **In the app this means:**
  - The tab asks again every 30 s, and the holder sends a fresh offer every 30 s while someone looks.
  - A camera that answers some offers shows up within a minute or two.
  - A camera Wyze calls offline shows Wyze's own "offline" word.

`re-review: 2026-10-20`, unchanged. Two questions stand at that review:

- Whether a camera that answers only some offers needs a longer dial than 20 s.
- Whether the IDisposable fork is needed at all.

## Twelfth field read (2026-10-20 13:55-14:03 UTC; cams-diag 39434555270, camera-health 39434540645): the review

- **The witness reads 16 of 33 (16 on the first ask), one under the floor of 17.** The `priority:cameras` label is back on #2011.
- **Six Kinesis cameras gave no video on both asks**, 30 s apart. Each answered 504 "no video on Wyze's WebRTC road yet". They were Back Yard North, Basement North, Front, Garage Doors, Garage Front Yard and Outside 7.
  - Front Cam (6.1 s) and Front Door View (10.5 s) answered this time. Front Cam had been dark in the two reads before. The dark set keeps rotating.
- **Eleven cameras answered "go2rtc answered an empty frame" in 5 s on both asks.**
  - Wyze's own list could not be read (HTTP 429; see below).
  - The bridge's log names IOTC_ER_DEVICE_OFFLINE for seven of them in the lines read: Kitchen Cam, Living Room, North East Cam, Outside Front Door, Front Driveway & Door, Front Yard and 805 Apt 4. That is Wyze's P2P service saying the camera itself is not connected. It is a second witness, separate from the cloud list.
  - The other four were not in the lines read: Basement Living Room, East North Cam, 805 Front Outside and 805 Porch Cam.
  - Their addresses sit outside the NAS's own 192.168.1.0/24 (192.168.4.76, 10.0.0.7, 192.168.7.0).

**Question 1, a longer dial than 20 s: no.**
- Every camera that gave a frame did so in 3.8 to 12.0 s (all 16 this pass).
- The judge's own successful dials took 3.5 to 9.4 s.
- Every camera that gave no frame gave nothing for the full 20 s, on both asks.
- What decides is whether Wyze answers the offer at all. A longer wait on an unanswered offer only puts off the next fresh one. The dial stays at 20 s.

**Question 2, the IDisposable fork: not built.**
- The bar set when this record was opened: "If Kinesis carries fewer than half of the dark cameras, the fork comes next." The judge counts 13 of the 20 Kinesis-road cameras carrying video.
- The 7 it calls dark are not a fixed set: Back Yard South, Front Cam and Front Door View each answered in this read or one of the two before it.
- The fork reaches these firmwares on the same Wyze WebRTC road, so it would not change an unanswered offer.
- The other eleven are offline at Wyze's P2P service, which no bridge image reaches.

**Found by this read, and fixed in this record: Wyze's 429 was never waited out.**
- Wyze's cloud answered HTTP 429 to the device list in the tenth read, and again in this one.
- `wyze_cloud.py` had no wait after a 429:
  - A sign-in that failed left no token.
  - The next open of the tab signed in again.
- In the app, this was the Doors note "Wyze's cloud did not answer the NAS (http-429)". The garage button and Wyze's per-camera offline word went missing.
- **The fix:** a 429 is obeyed per endpoint (sign-in, refresh, the list, an action).
  - The NAS asks again only after Wyze's `Retry-After`. Without one, it waits 5 minutes, doubling to 1 hour while the 429s continue.
  - During the wait, the last list Wyze gave is served, with its age (`age_s`).
  - With no list to serve, `/devices` answers 503 `rate-limited` with `retry_in`. The tab says "Wyze asked the NAS to slow down. It asks Wyze again in about N minutes."
- **Proven:**
  - `wyze_cloud.py --selftest` passes with 10 new checks.
  - The forwarder selftest passes 458 (was 456).
  - CI now runs the Wyze cloud selftest, which it never ran before.
  - PROVEN TO CATCH: with the wait taken out, 6 of those 10 checks fail.
- **Not known yet:** whether Wyze's 429 is on the sign-in or on the list. cams-diag now prints Wyze's own detail and the wait.

**Found by this read, not yet decided: TURN clients failing to refresh.**
- In about 90 seconds, 78 of go2rtc's last 80 log lines were TURN clients failing to refresh permissions:
  - 10 of Amazon's 401 Unauthorized, and 29 broken pipes;
  - 15 different relay servers, and 39 different permission ids.
- A live Kinesis relay refreshes. This many failures points to sessions that ended without being closed.
- That is not yet measured as a leak, and not yet tied to the unanswered offers. cams-diag now counts these failures over the last 10 minutes, so two reads hours apart can tell a leak from a moment.

`re-review: 2026-10-21`. Two questions stand at that review:
- **The TURN count, read twice, hours apart.** If it climbs, sessions are being left open, and the fix is between releasing go2rtc on a clock and closing them at the source.
- **Wyze's 429.** Which endpoint answers it, and whether it lifts once the NAS waits.

## Thirteenth field read (2026-10-20 15:10 UTC; cams-diag 39445926381): the TURN flood is a leak in go2rtc, and it is answered

Darrell, the same afternoon: "Build the turn fix it now". The second reading the twelfth read set for 2026-10-21 was not waited for.

**The reading, on forwarder `94989bcb1da43bd7`:**
- **TURN:** go2rtc logged 524 TURN refresh failures in 10 minutes. That is 80 of Amazon's 401 Unauthorized and 180 broken pipes, across 19 relay servers and 264 permission ids.
  - The twelfth read's 78 lines in about 90 s is the same rate. This is a steady state, not a moment.
- **Kinesis offers Wyze never answered:** 811, counted since go2rtc's last start.
- **Wyze's own list answers again:** 22 online and 11 offline. The 11 are exactly the eleven the twelfth read named. The 429 lifted after the forwarder restarted with the wait from the twelfth read; whether the wait is what lifted it is not known.

**The cause, read in go2rtc's own source (`internal/webrtc/kinesis.go`, identical at v1.9.14 and on master):**
- `kinesisClient` creates a PeerConnection, sends the offer, then waits on `connState`.
- On any error it returns without `pc.Close()`. The errors are Amazon closing the signaling socket of an unanswered offer (`close 1001 (going away)`), or `webrtc: failed`.
- `go2rtcClient` beside it does close its PeerConnection on error. This one never does.
- So every failed Kinesis dial leaves a pion PeerConnection behind. Its TURN clients keep refreshing with Amazon until go2rtc exits, and the 401s begin once the credentials expire.
- There is no newer release to move to: master carries the same code.

**What the forwarder does now (built the same day):**
- **Fewer leaks are made.**
  - The road judge no longer dials a camera Wyze's own list calls offline. Every judgement of one of those eleven was an offer nobody could answer.
  - `/snap` answers a Kinesis camera that Wyze calls offline with 503 `wyze-offline`. It sends no offer, and it reads only the list already held, so a frame never waits on Wyze's cloud.
  - The tab says "Wyze says it is offline". With no Wyze list, nothing is skipped: unknown is not offline.
- **The leaks are released.** go2rtc is restarted in place, with `POST /api/restart`, which re-executes it and reloads `go2rtc.yaml`. That happens only when all of these hold:
  - at least `CAMS_GO2RTC_RELEASE_AFTER` (200) failed Kinesis dials have been logged since the last release;
  - nobody is watching live, and no Kinesis session is held;
  - go2rtc parses `go2rtc.yaml` first (`POST /api/config` answers 200), per the eighth read;
  - no release has happened in the last 6 hours.
- **The brakes** (deterministic class, DR-0248):
  - budget: one release per 6 hours, stamped before the restart is asked;
  - lock: the release runs in the self-heal thread, under `RELEASE_LOCK`;
  - stop-path: `CAMS_GO2RTC_RELEASE_AFTER=0`.
- **What a release costs:**
  - A recording loses a few seconds; the recorder reconnects with its own backoff.
  - The count comes from go2rtc's in-memory log, which holds 1 MB. It can undercount; it never counts a dial twice.
- **Where it shows:** `/health` → `bridge.go2rtc_release` carries the last check, the failed-dial count and the last release.

**Proven:**
- Forwarder selftest: 473 passing (was 458).
- PROVEN TO CATCH, each part taken out on its own turns its checks red:
  - the judge's offline skip;
  - the "nobody watching" rule;
  - the config parse before a restart;
  - the `/snap` offline gate;
  - the 6-hour budget;
  - the stamp written before the restart is asked. go2rtc re-executes itself from a goroutine and can cut its own reply short. Stamped after the ask, a cut-short reply would read as a failure and the next tick would restart go2rtc again.
- App camera tests: 161 pass. Lint exit 0. verify:gates exit 0.

`re-review: 2026-10-21`. Two readings decide it, both from cams-diag:
- **The TURN count after the first release.** It should fall to near zero, then climb back only at the rate of offers Wyze leaves unanswered.
- **Whether a release has happened at all**, from `bridge.go2rtc_release` in `/health`. If the threshold of 200 is never reached between 6-hour windows, lower it.

## Fourteenth field read (2026-10-20 16:17-16:25 UTC; cams-diag 39456101489, camera-health 39456108466): the first release, live

- **The forwarder released go2rtc by itself at 15:46:36 UTC**, about 14 minutes after #2291 merged, on forwarder `b6d7158648f84ad6`. `/health` → `bridge.go2rtc_release` reads `released_dials: 906`.
  - go2rtc came back with all 66 streams from `go2rtc.yaml`, so the parse check before the restart held.
- **TURN refresh failures in the last 10 minutes: 0**, down from 524 an hour earlier.
  - Unanswered Kinesis offers since go2rtc's start: 5, where the count had reached 811 before the release.
- **The judge read Wyze's list** (`wyze_list: true`) and skipped all eleven cameras Wyze calls offline.
- **The witness reads 18 of 33, all 18 on the first ask.** The floor is met, and the `priority:cameras` label came off #2011.
  - Front, Basement North and Front Cam answered.
  - Four Kinesis cameras left both offers unanswered: Back Yard North, Garage Doors, Garage Front Yard and Outside 7.
  - 805 Apt 4 answered `wyze-offline` in 9 ms with no offer sent, which is the new `/snap` gate working.
- **Dark, 15:**
  - the 11 Wyze calls offline;
  - the 4 Kinesis cameras above.

`re-review: 2026-10-21`, unchanged: read the TURN count again hours after this release. It should climb back only at the rate of offers Wyze leaves unanswered.

## Fifteenth field read (2026-10-21 00:40 UTC; cams-diag 39522679592 with `camera=805_porch_-_floodlight_cam_-_east`): "Never works in our app"

Darrell, 19:35 CDT, sent a screenshot of 805 Porch - Floodlight Cam - East playing live in the Wyze app: "Never works in our app always working in wyze... fix it!!!!"

**What the NAS says about that camera, on loopback:**
- go2rtc's frame: 200 in 4.1 s, 183 KB.
- `/why`: probe 200 in 5.4 s. The judge kept it on Wyze's WebRTC road, with 16 KB of video in 8.3 s.
- A 35 s stream: 5.0 MB.
- So the camera, Wyze's road and go2rtc all carry it.
- The gap is on the road the phone rides. The served build points at the Funnel (`UNLOCK_CAMS_BASE`), and no instrument had ever asked a camera that way.
- **Built:** cams-diag now asks both loopback and the Funnel the way the tab does: the tile's frame, a ticket, and 25 s of the live MP4, with codes, first byte, bytes, content-type, CORS and codec boxes. The next dispatch with this camera reads the phone's road.

**Found by the same read: `go2rtc.yaml` is unreadable again, a new shape.**
- The file was written at 19:20 CDT.
- After the wyze: block it carries three column-0 fragments (7, 3 and 7 characters) with two indented lines between them.
- The repair took the fragments out, and go2rtc still refused the file: "line 96: mapping key "api_key" already defined at line 94; line 97: mapping key "password" already defined at line 95".
- Those two lines are the tail of an older, longer copy of the same block.
- Until the file reads, every PUT goes unpersisted and the release (thirteenth read) refuses to restart go2rtc. Its parse guard is doing its job.
- **Fixed:** an indented line after a column-0 stray goes with the stray, up to the next real top-level key. go2rtc's own parse still decides before anything is written. The first `api_key` and `password` are kept.
- What wrote the tail is not known. The forwarder writes this file only through a temporary file and `os.replace`, which cannot leave a tail behind.

**Found by the same read: the tab's live tiles still offered a camera Wyze calls offline.**
- At 19:35 CDT, while the tab was open, kvs-hold re-armed 805 Apt 4 every 40 s, and each re-arm was an unanswered offer.
- The thirteenth read's gate covered frames only.
- **Fixed:** a live MP4 or HLS playlist of a Kinesis camera Wyze's list calls offline is 503 `wyze-offline` too. No session is held and go2rtc is never asked.

**Proven:**
- Forwarder selftest: 478 passing (was 473).
- PROVEN TO CATCH: taking out the indented-tail rule turns 3 checks red, and taking out the live gate turns its check red.

`re-review: 2026-10-21`. Run cams-diag with this camera once #2322 is live, and read the phone's road. Whatever that road refuses is the next fix.

**The phone's road, read the same night** (cams-diag 39523337060, run from this branch, 00:46-00:48 UTC):
- **Through the Funnel, asked the way the tab asks:**
  - frame `?w=640`: 200 in 0.99 s;
  - ticket: issued;
  - live `.mp4`: 200, first byte at 1.45 s, 3.99 MB in 25 s, `video/mp4; codecs="avc1.42E01F"` (H.264, which every phone plays);
  - `access-control-allow-origin: https://poetech.us`.
- So the camera's own stream reaches the phone over the Funnel. The Funnel and the NAS are not what fails.
- **What fails is the grid.**
  - A grid tile asks the camera's SD twin (`liveStreamId(..., { sd: true })`, Cameras.jsx). For a Kinesis camera the twin is go2rtc's own RTSP restream (`rtsp://127.0.0.1:8554/<id>`).
  - go2rtc's RTSP client gives a DESCRIBE answer 5 s (`pkg/rtsp/conn.go`, the package `Timeout`, which `#timeout=` does not reach). That answer waits on the Kinesis dial, which takes 6 to 12 s.
  - So the twin of a camera not already flowing timed out. These are the `read tcp ->127.0.0.1:8554: i/o timeout` lines that fill `/why`, while the camera's own stream and frame worked.
- **Fixed:** a twin of a held Kinesis camera is asked of go2rtc only once the held session carries video, within the 20 s frame clock, the same rule `/snap` follows. Otherwise it answers 504 and names why.
- **Proven:** selftest 480. PROVEN TO CATCH: with the wait taken out, its check fails.

## Sixteenth read (2026-10-21 01:00 UTC): the direct road, the way the Wyze app opens a camera

Darrell, 2026-10-21: "Do we have to have the tellscale or nas way... why not another more permanent way.... thinking about how!!!!!!!!!! If this keeps undermining the very mission of the requirements?!!!!!!!"

**What the Wyze app does.** It opens Wyze's own WebRTC session (Amazon Kinesis Video Streams) from the phone. The video goes from the camera to the phone, or through Amazon's TURN relay, and never crosses a NAS or a tunnel. The tab can do the same for every camera the NAS keeps on Wyze's WebRTC road.

**Built (the direct road):**
- **NAS, `POST /cams/direct {camera}`** (cams_forwarder.py `kvs_direct_session`, `_direct`). The NAS keeps the Wyze account and asks the bridge for one session (`/signaling/<name>?kvs`, the same answer go2rtc's `wyzeClient` reads). It hands the signed-in viewer only three things, all short-lived and good for that one camera:
  - a presigned `wss://` URL to Amazon's signaling service, refused unless its host is `*.amazonaws.com`;
  - the session's `stun:`/`turn:` servers, with every other scheme dropped;
  - its client id.
- **The Wyze email, password and API key never leave the NAS.** Neither does the bridge's own sign-in. A selftest pins that the answer carries nothing else.
- **Who can ask:** the same viewer group as `/ticket` (the family key, or a camera grant for that camera).
- **The app, `lib/camera-direct.js`.** The browser opens that WebSocket and an RTCPeerConnection (video and audio, receive only). It speaks Kinesis signaling the way go2rtc's `kinesisClient` does:
  - an `SDP_OFFER`, then `ICE_CANDIDATE`s, each payload base64 JSON, to `recipientClientId`;
  - it reads `SDP_ANSWER` and `ICE_CANDIDATE`, holding Wyze's early candidates until the answer arrives.
- **The tiles and the large view** (`TileLive`, `LiveVideo`) try it first for a camera with `road: 'kvs'`. A tile on it reads "Straight from Wyze's WebRTC".
- **Anything that brings no picture falls back to the NAS road:**
  - 404 (not on that road), 503 (Wyze calls it offline), a refusal, 15 s with no track, or 8 s with no new video bytes;
  - a camera that failed here takes the NAS road for 2 minutes, then is tried again.
- **The NAS road stays** for every camera not on Wyze's WebRTC road, for frames, for recordings, and as the fallback.

**Brakes (DR-0248, deterministic class):**
- **Budget:** one session per camera per 3 s on the NAS, since each is a Wyze API call through the bridge; at most 6 direct sessions per device; every connect times out at 15 s.
- **Lock:** per camera, under `DIRECT_LOCK`.
- **Stop-path:** `CAMS_DIRECT=0` on the NAS, which sends every camera back to the NAS road.

**Proven (not yet live):**
- Forwarder selftest: 496 passing (was 480). PROVEN TO CATCH, each break turning a check red:
  - the offline gate;
  - the Amazon-host check;
  - the scheme filter;
  - the main-name rule;
  - the per-camera budget;
  - the stop-path.
- App: 15 unit checks (`camera-direct.test.js`) and one render check (a Kinesis camera plays from the stream with no NAS ticket; a 404 sends it to the NAS road). PROVEN TO CATCH, each break turning a check red:
  - the road gate;
  - the early-candidate hold;
  - the failure memory;
  - the stall watchdog.

**What the 01:00 UTC screenshot shows** (Darrell's View 2, before any of this or #2322 is live on the NAS):
- 805 north and 805 north east show pictures.
- 805 porch cam and 805 back door read "waiting for the first picture". 805 Porch Cam is on Wyze's own offline list (thirteenth read); #2322's live gate makes it say so instead of waiting.

**Not known yet:** whether Amazon answers a second viewer while go2rtc's held session is open on the same camera. If it refuses, the tile falls back to the NAS road, which is today's behavior.

`re-review: 2026-10-21`. Once this is live, open Cameras on the Fold. A Kinesis tile reads "Straight from Wyze's WebRTC" when the direct road carried it, and the NAS's live count drops by one for each such tile.

## Seventeenth read (2026-10-21 01:07-01:20 UTC; cams-diag 39525490979, 39526244413): the tab was hanging up streams that were still flowing

Darrell, 20:03-20:04 CDT, seven screenshots of the window view, with each tile's camera clock showing. The pictures held for 15-25 s, then went black, and the reconnect count rose. "Cameras constantly blinking... the disconnecting logic is horrible!!!!"

**Measured over the phone's own road (the Funnel, Origin poetech.us, a ticket), 90 s per camera:**
- 805_north_sd: 8.6 MB, the longest gap between chunks 1.5 s, still flowing at 90 s (curl exit 28).
- 805_north_east_sd: the media clock ran at 1.019× the wall clock over 89 s. The fragments were 0.0-0.3 s each. The longest gap was 1.4 s, and it was still flowing at 90 s.
- So the NAS and the Funnel did not end these streams. The tab did.
- Its rules hung up on proxies: a play position that had not moved for 6 s, a lag past 12 s, and a 20 s first-picture clock.
- One NAS cut showed in the forwarder journal too: kvs-hold re-armed 805_north at 20:02:08 while the window watched it. A re-arm ends every consumer.

**Fixed (`lib/cameras.js` tendLiveVideo, Cameras.jsx, cams_forwarder.py KvsHold):**
- **Frozen** now means nothing moves for 10 s: not the position, not the arriving data, not the decoded frames.
- **A stuck position with data still arriving is a stall.** The element is asked to play on, or a gap in what has arrived is stepped over, inside data already here. It never jumps to the edge (DR-0808). It is given up only after 20 s.
- **Lag:** it is run down at 1.5×, and the stream is opened fresh only past 30 s behind.
- **The first-picture clock** never hangs up an element that already holds a frame.
- **The hold never re-arms a camera** whose live viewer got bytes in the last 5 s (`viewer_flowing`, counted as `spared`).

**Proven:**
- Camera vitest: 114 + 39 + 15 passing. PROVEN TO CATCH, each break turning checks red: position-only life (3 checks), a 12 s lag limit (1), and the re-arm guard (forwarder selftest, 500 passing).

`re-review: 2026-10-21`. Once live, the tiles' "last:" line and `/streams/health` live_ends name every hang-up that is left, and who made it.

## Eighteenth read (2026-10-21 03:38-03:53 UTC; cams-diag 39539674831, 39540521203 with `camera=805_north_sd`): the seventeenth read's fixes are live, and the road still flows

**What is live, measured, not assumed:**
- **The app.** #2324 merged as 98a600b15 at 03:15:55 UTC. Deploy 39537621749 was dispatched 2 s later and finished green at 03:18.
- **The NAS.** The forwarder restarted at 03:31:17 UTC (its journal). `/health` reads `forwarder` = `on_disk` = `2500b3b0e2d7a7f8`, the sha256 of main's `infra/nas-cameras/cams_forwarder.py`. The freeze/stall/lag rules and the re-arm guard are what is running.

**The phone's road, after the fixes (805_north_sd, 90 s each, a ticket, Origin poetech.us):**

| road | first byte | bytes | longest silence | media clock vs wall | at 90 s |
|---|---|---|---|---|---|
| loopback 127.0.0.1:8773 | 1.85 s | 8.43 MB | 1.8 s | 1.001x, lead +0.1 s | still flowing (curl 28) |
| the Funnel `/cams` | 1.51 s | 8.53 MB | 1.5 s | 1.004x, lead +0.3 s | still flowing (curl 28) |

- Every 5 s window carried 244-562 KB; no window was empty.
- The fragments were 0.00-0.15 s each, H.264 (`avc1.42E01F`).
- Frames answered 200, about 23-25 KB, with `Access-Control-Allow-Origin: https://poetech.us` on both roads.

**What this read could not say, plainly.** `/streams/health` live_ends read "none yet". The forwarder had restarted at 03:31 and no family tile had opened a live view since. The probe opened two, but the diag printed the ends BEFORE the probes ran, so its own 90 s views could never appear in this read. That is a hole in the witness, not in the road.

**Fixed in this read (`.github/workflows/cams-diag.yml`):**
- The ends are read twice: before the probes, for how the family's own views ended, and again after them, where the probe's views must appear. If they do not, the record is not catching what it claims to.
- The frame probe no longer prints `strings: command not found` on a box without binutils.

**Not proven yet: the blinking itself.** That takes the family's own tiles. `re-review: 2026-10-21`: the next time Cameras is open on the Fold, the tiles' "last:" line and the after-probe live ends name each hang-up that is left, and who made it (`source-ended` / `source-silent` / `viewer-left` / `clock`).

## Nineteenth read (2026-10-21 04:58-05:05 UTC; cams-diag 39547175167 with `camera=805_north_sd`): the tab was leaving every old stream open

**What Darrell saw** (Fold, 23:58-23:59 CDT). Only one tile had a picture: "805 upper hallway south west · Wyze WebRTC", the direct road. Every NAS tile was black:
- "reconnected 10× last: the picture froze for 10 s"
- "reconnected 8× last: no picture after 20 s"
- the large view read "Reconnecting in 24 s (the browser could not open this stream)"

**What the NAS saw, measured.**
- At 23:59:32 CDT (the forwarder journal's connection resets), **32 live views ended in the same second, all `viewer-left`**. 32 is `MAX_LIVE`, every slot the NAS has.
- Several were the same camera, open at the same time:
  - 805_north_sd: five views (217, 243, 285, 355 and 391 s old)
  - 805_porch_-_floodlight_cam_-_east_sd: five
  - 805_back_door_sd: four
  - 805_north_east_sd: four
  - 805_hallway_-_north_east_sd: three
- Every one of them was still carrying video when it ended: 6.7 to 54 MB each.
- The road itself was fine. Probes of 805_north_sd a minute later each ran a full 90 s: 8.51 MB on loopback and 8.36 MB through the Funnel, longest silence 1.8 s, media clock 1.000x and 1.003x of the wall.
- The eighteenth read's witness gap is closed: the after-probe ends list the probe's own view (805_north_sd, 88.2 s, 8310 KB).

**Root cause, in the tab** (`TileLive` and `LiveVideo`, app/src/components/Cameras.jsx).
- A reconnect renders a new `<video>` keyed by its src. React calls the old element's ref with `null`, and the ref wrote that `null` into `timers.current.video`, the only handle the release code had.
- So nothing ever paused the old element, cleared its src or called `load()`. Unmount found `null` too.
- A `<video>` taken out of the page keeps its live MP4 open. Every reconnect left one stream running unseen.
- Those orphans held the NAS's slots, so a new view got 503 busy ("could not open"). They also crowded the phone's road, so the views actually being watched starved ("froze", "no picture"). Each starved view reconnected and left another orphan.
- The direct road was untouched because its WebRTC session is closed explicitly (`closeDirect`).
- Likely why it got worse after #2324 (inferred, not measured): the old KvsHold re-arm cut every viewer of a camera now and then, orphans included. The seventeenth read's guard rightly stopped re-arming a camera whose viewer is getting bytes, and an orphan always is. So nothing reaped them any more.

**Fixed:**
- **In the app** (`app/src/lib/camera-video.js`, used by all three live players):
  - `holdVideo` ignores React's `ref(null)`, so the handle is never lost.
  - A replaced element is released at once: pause, `srcObject = null`, remove src, `load()`.
  - The view's end releases its element before the next one opens (`dropVideo`), and so do unmount and "released".
- **On the NAS** (`cams_forwarder.py`, ONE CAMERA, A FEW VIEWS): a camera holds at most `LIVE_PER_CAMERA` (3) live views.
  - One more tells the OLDEST to end and shuts its socket, so a stuck write fails now. The end is recorded as `superseded`.
  - An orphan from any device, or any future bug, can never again keep a slot from a viewer who is really watching.
  - Brakes (deterministic class, DR-0248): the count is the budget, one lock, stop-path `CAMS_LIVE_PER_CAMERA=0`.

**Proven:**
- A new render case reconnects a grid tile three times and the large view twice. Every element held before has no src, the one on screen does, and Close releases the last.
- PROVEN TO CATCH:
  - Without the release on end, or without the release on replace, the case is red ("tile try 1 released on end").
  - Without the forwarder's cap, 3 selftest checks are red.
- End to end in the selftest: with the cap at 1, a second view ends the first at 0.30 s, before its 1 s clock, recorded `superseded`; the second view plays on to its clock.
- Camera vitest 186 passing (5 files); forwarder selftest ALL PASSED; `verify:gates` 0.

`re-review: 2026-10-22`. Once this is live, open Cameras on the Fold, leave it for 10 minutes, then run cams-diag.
- **Success looks like:** live views of any one camera never number more than the open tiles and views showing it; no burst of 32 `viewer-left` ends; few or no `superseded` ends.
- **If `superseded` ends are many:** a device is still leaving orphans, and the forwarder's record names the camera.

**Live, measured (2026-10-21 05:34-05:45 UTC):**
- #2336 merged as 1798c64fa. Deploy 39550333860 finished green, so the app's release of a replaced player is what poetech.us serves.
- The NAS forwarder restarted at 05:43:23 UTC (its journal), after nas-bootstrap 39551003507 ran services-sync. cams-diag 39551265002 reads `forwarder` = `on_disk` = `c421f67a4529bae4`, the sha256 of main's `cams_forwarder.py`, so the per-camera cap is running.
- cams-diag 39550896037 ran after the app deploy but before the forwarder restart. It still saw the old app's pattern: views that ended around 05:28 UTC included four of 805_floodlight_cam_-_west_sd and three of the east porch floodlight open together. That tab had loaded before the deploy.
- The family's own proof is the re-review above.

## Twentieth read (2026-10-21 13:49-14:20 UTC; cams-diag 39609030877, 39613813084 with `camera=front_cam`; camera-health 39612037321 probe_all): the 05:43 fix holds, and five online cameras go dark on and off

**The nineteenth read's fix, again.**
- The forwarder is still `c421f67a4529bae4`.
- No camera had two of its own views open at once. No view ended `superseded`.
- The only family use since 06:01 UTC was under a minute, at 06:53 UTC and 07:04 UTC. That is not enough to judge blinking, so a check-in at 23:31 UTC carries it.

**What the thirteenth read left open.**
- TURN refresh failures: 0 at 06:51 and 0 at 13:49 UTC. No relay session is being left open.
- No 429 appears in either diag.
- "Kinesis offers Wyze never answered" rose from 29 to 47 in seven hours. These are offers Amazon closes after 10 minutes, not sessions held open. They come from the cameras below.

**Every camera (camera-health 39612037321, no regression):**
- 17 of 33 give a frame, 15 of them on the first ask.
- 11 of the 16 dark cameras are the ones Wyze's own list calls OFFLINE. The app cannot fix those.
- The other 5 are online by Wyze's list and dark on both roads: front_cam, garage_doors, outside_7, back_yard_south, front.

**front_cam, read by the NAS (`/why`).**
- go2rtc's producer is connected to Amazon's signaling. Its media path is a host candidate on the LAN (`192.168.1.16`): 3 medias, 2 receivers.
- No video arrives. Kinesis closes with `1001 going away`, and the 35 s probe and the frame probe both got 0 bytes.
- The same camera carried video earlier: front_cam_sd 729 KB in 21 s, and garage_doors_sd 3.8 MB in 41 s, both about 06:53 UTC.
- So the camera goes dark intermittently, and the KvsHold re-arm already asks it for a fresh offer when it does.

**Not built, and why.** The cause is not yet isolated. A connected session with no video from a camera that streamed hours earlier sits on the camera's or Wyze's side of the offer. Building against a guess would break DR-0076.

`re-review: 2026-10-22`: from the Fold, open each of the five on the direct road ("Straight from Wyze's WebRTC").
- If the direct road carries one that the NAS cannot, the NAS's offer is the difference, and that is the fix to build.
- If neither road carries it, the camera is dark to Wyze too, and the app says so in words.

## Twenty-first read (2026-10-21 23:33 UTC; cams-diag 39694175625): the orphan fix holds through the evening, and one camera reopened itself

**What the evening showed.** The forwarder keeps its last 80 ends, and the diag prints the newest 40: 20:08:59 to 22:23:11 UTC.
- All 80 were `viewer-left`. None was `superseded`, `source-ended`, `source-silent` or `clock`.
- No camera had two of its own views open at once. The nineteenth read's orphans are gone.
- TURN refresh failures: 0. Wyze's own list: 22 online, 11 offline, of 33.

**Two shapes, and only one is a blink.**
- **22:18 to 22:23 UTC: the grid opened and closed.** Thirteen `_sd` tiles ended within one second of each other, three times: 22:22:45 (0.1 to 4.0 s each), about 22:22:54 (0.1 to 0.5 s each), then single tiles at 22:23:01 and 22:23:11. Every camera ending at once is the whole grid unmounting (leaving the tab or switching away), not one tile blinking.
- **20:08 to 20:12 UTC: one camera, opened again and again.** `805_floodlight_cam_-_west_sd` had five views in a row: 0.3, 7.1, 7.4, 14.1 and 44.8 s. Each started 1 to 3 s after the one before ended (18 s before the last). `805_porch_-_floodlight_cam_-_east` then ran 54.1 s and 56.7 s, 3 s apart. That is the blinking shape Darrell named: a view ends and the next one opens.

**What this read could not say.** The tab hangs up every one of these, so each reads `viewer-left`. A person tapping, or the app's own freeze or lag rule (`LIVE_LAG_RECONNECT_S` 30), looks the same from the NAS. The gaps fit the app's reconnect wait (`LIVE_RECONNECT_DELAY_MS` 1500 ms, then doubling), but that is a fit, not a proof.

**Built tonight: each end says who opened it again.**
- The app already counted its reconnects into the live URL (`r=`, `liveUrl`), but only in the large view. The grid tile and the Hub (`TileLive`) now send the count too (`Cameras.jsx`).
- The forwarder keeps that count on every end (`live_reconnect_of`, `live_end_note(..., reconnect=)`). It is bounded to 0 to 999, and anything else reads 0.
- cams-diag prints `r=` on each end, and a line counting the ends the app reopened itself against tiles mounted fresh (`r=0`).
- Proven to catch: the forwarder route dropping the count turns 1 selftest check red; `TileLive` dropping it turns `cameras-render` red at "tile try 2". Both restored: the selftest passes, 236 camera tests pass.

`re-review: 2026-10-22`, with the direct-road question above. Read cams-diag after the family next uses Cameras:
- Ends with `r` of 1 or more are the app reopening a tile on its own. Their durations name the rule: about 20 s is the first-frame bound, 30 s or more behind live is the lag rule. The fix goes there.
- Runs that are all `r=0` are tiles mounted fresh: a tap, the tab left and opened again, or a remount. Those are read from the screen, not from the NAS.

**My own break, the same night.** The first cams-diag after #2385 (39700246848, 00:32 UTC) died at `sh: line 170: syntax error near unexpected token '('`. The new printer line said "the app's own reconnect", and its apostrophe closed the `python3 -c '...'` string around it. I had tested that Python on its own, outside the shell quoting it lives in. The words no longer use an apostrophe, and `cams-diag-prints-every-live-end.test.js` now runs the workflow's own `live_ends()` under `sh` with curl stubbed. It fails on that break (2 cases red against the broken printer) and passes on the fix (3 green).
