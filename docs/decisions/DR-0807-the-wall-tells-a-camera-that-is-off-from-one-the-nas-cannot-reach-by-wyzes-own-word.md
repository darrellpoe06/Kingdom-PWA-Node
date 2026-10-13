# DR-0807 — The wall tells a camera that is OFF from one the NAS cannot reach, by Wyze's own word

**Date:** 2026-10-07 · **Status:** decided · **Lane:** cameras (PR #2010) · **Pairs with:** DR-0803 (the wall says why in one line), DR-0777 (Wyze cloud devices, independent of video), DR-0806 (the camera road witness)

## Context

Darrell, 2026-10-07 at 18:26 CDT, the Wyze app open on a tablet beside ours: *"805 we have no video... however the wyze cam app works... why?!!!"* and, with three screenshots: *"Some are actually down and others have been on continuously...."* The Wyze app showed **805 Porch - Floodlight Cam - East**, **805 Hallway - North East** and **805 Basement** live with the day's clock on them, **805 North** as "Device Offline" with a last frame from 2026-09-28 05:47, and **805 Floodlight Cam - West** with a last frame from 2026-09-28 11:57.

Our wall (DR-0803) said one true thing about all ten 805 cameras: *"on a network the NAS cannot reach."* True, and not the whole truth. Two of those ten are down at the camera; the Wyze app knows that and ours did not say it, although the forwarder has carried Wyze's `conn_state` for every device since DR-0777 (`/cams/devices` → `online`).

## What was measured

cams-diag run 37702488586 (2026-10-07 23:28 UTC, the NAS read over the tailnet):

| Fact | Measured |
|---|---|
| Streams defined | 31; 9 producing media (`medias=3`), 22 `wyze:` sources resting |
| The ten 805 cameras | addressed by Wyze at `10.0.0.x`; the NAS has `192.168.1.26/24`, `10.8.0.1` (its own VPN), docker bridges — no route to `10.0.0.0/24`; go2rtc: `connect failed: discovery timeout` |
| The twelve other `wyze:` cameras | `192.168.1.x` (four, on the NAS's own LAN) and `192.168.4/7/11.x`; go2rtc: `only DTLS cameras are supported` |
| Why the Wyze app works where ours does not | the Wyze app reaches a camera through Wyze's own relay from anywhere; go2rtc's `wyze:` source speaks to the camera's LAN address directly, so it needs a road to that LAN |
| go2rtc at 18:25:39 CDT | `panic: runtime error: invalid memory address or nil pointer dereference` in `pkg/mp4.(*Consumer).AddTrack` → `bufio.(*Writer).Write` (an MP4 consumer writing after its HTTP response closed); docker `restart: unless-stopped` brought it back at 18:25:40 — the moment Darrell saw "no video" on every tile at once |
| The forwarder | running `2171a7233d6efd6f`, `d45dc35c5492ea06` on disk: services-sync had read `HOLD(daily call cap reached (96 >= 96))` since 22:55 UTC (nas-clock run 37699154012) — the clock fires 96/day and the cap was 96, so three hand-fired one-shots spent the day's slots |

## Decision

1. **Wyze's own word joins the wall's arithmetic.** `groupCameraFaults(cameras, frames, devices)` takes the parsed `/cams/devices` list. A down camera whose Wyze device says `online:false` is counted **off at the camera itself (Wyze reports them offline too)**; one that go2rtc cannot reach while Wyze says `online:true` is counted **on (Wyze sees them), but on a network the NAS cannot reach**; a camera Wyze has no device for stays exactly where DR-0803 put it. Biggest cause first, as before.
2. **The tile's Why? carries the same word.** Under the NAS's own explanation: *"Wyze itself reports this camera offline: it is down at the camera, not only out of the NAS's reach. Check its power and Wi-Fi where it hangs."* or *"Wyze sees this camera online: it is on, and the Wyze app can show it through Wyze's own relay. Only the NAS has no road to it."* Nothing when Wyze has no word.
3. **The services-sync cap is 120, not 96** (`infra/nas-loops/registry.json`): the clock's 96 plus 24 hand-fires. A cap equal to the clock is a brake that bites the clock itself.
4. **Not changed, named:** the road to the 805 LAN. go2rtc's `wyze:` source is LAN-only by design; the two ways that work are a node AT 805 on the tailnet advertising `10.0.0.0/24` (any always-on box there), or a relay-capable bridge on the NAS (the docker-wyze-bridge road, `NET_MODE=ANY`, which also speaks to the non-DTLS firmware). DR-0806 carries both as the next move; neither is built here because neither can be verified from this session. `re-review: 2026-10-14`.

## Verification after merge

- Open the Cameras tab with the Wyze account signed in: the wall's one line now has up to four parts; **805 North** (and any camera the Wyze app shows "Device Offline") is counted under *off at the camera itself*; press Why? on it and the Wyze line is there (`data-testid="why-wyze-805_north"`).
- Gate: `the-wall-says-why-in-one-line.test.js` — the real night's fixture with four Wyze devices: 1 off, 2 on-but-unreachable, 7 unknown, 17 DTLS; the sentence names all four; without a devices list the DR-0803 fixture is byte-identical; `wyzeSaysFor` true/false/null; the tile lines; no log word in a label.
- `cams-diag` after the next services-sync (00:00 UTC, when the UTC-day counter resets): forwarder sha equals on_disk; `stream-health.json` present; `_sd` twins listed. The witness (`camera-health.yml`) flags a forwarder-vs-disk mismatch as a regression on its own.

## Impact

A person reading the wall learns what the Wyze app would have told them, without opening it: which cameras are off, which are on but out of the NAS's reach, and which the NAS simply cannot speak to yet. The arithmetic stays pure and testable; the device list is the only new input, and it was already fetched. The cap change keeps a hand-fired deploy from starving the clocked one for the rest of a day.
