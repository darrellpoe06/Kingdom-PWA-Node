# nas-cameras -- the family camera road (DR-0756)

Darrell, 2026-10-06: *"I want to be able to see my wyze cam feeds inside my
PoeTech App... and any system I own..."*

This folder is the whole NAS side of that sentence. Two processes, one door:

| Piece | What it is | Where it listens |
|---|---|---|
| `docker-compose.yml` | **go2rtc 1.9.14** (pinned), ONE restreamer: native Wyze P2P (v1.9.14), native Ring (v1.9.9), ONVIF, RTSP. Gives the app one shape back: a JPEG frame, a progressive MP4, an HLS playlist. | `127.0.0.1:1984` only (host-networked for the cameras' LAN; exposure decided by the seed config) |
| `cams_forwarder.py` + `poetech-cams.service` | the **locked door**: family bridge bearer, 90 s one-camera playback tickets, allowlisted read-only paths, caps. go2rtc has no lock worth putting on the public Funnel; this is it. | `127.0.0.1:8773`, mounted on the Funnel at `/cams` |
| `install.sh` | idempotent; services-sync runs it every cycle; merge to `main` IS the deploy (DR-0236). Mounts `/cams` only after both processes answer. | -- |
| `go2rtc.seed.yaml` | written ONCE to `/volume1/docker/go2rtc/go2rtc.yaml` when absent; never overwritten after. | -- |

The app's same-origin transport is `app/functions/cams/[[path]].js`; the surface
is `app/src/components/Cameras.jsx` (family-only). Recorded in
`infra/nas-transport/RECORDED-STATE.md` (the `/cams` row).

## The one step only Darrell can take (a secret value only he holds)

Everything else self-deploys. Wyze cameras additionally need his Wyze sign-in,
because go2rtc lists the account's cameras from Wyze's cloud ONCE (then streams
them locally over P2P). Nothing in the repo ever holds these values.

**The easy way (2026-10-07): type it once, in the app.** Open the Cameras tab
(family), fill in Wyze email, password, API ID and API Key, press *Sign in and
add my cameras*. The two keys are made ONCE on the Wyze Developer API Console,
not in the Wyze app and not on my.wyze.com: Wyze's own page is
https://support.wyze.com/hc/en-us/articles/16129834216731 (go2rtc's Wyze README
points to the same one); the form links to it and lists the four steps. This is
a one-time step for the person who owns the Wyze account; every other family
member only opens the tab. The app hands the four values over the locked `/cams` road to
`cams_forwarder.py` (`POST /setup/wyze`, family bearer), which hands them to
go2rtc's OWN sign-in (`POST /api/wyze`, verified in go2rtc 1.9.14 source:
`internal/wyze/wyze.go` logs in, writes the account into `go2rtc.yaml`, and
answers the account's cameras) and registers each camera as a stream
(`PUT /api/streams`, also persisted by go2rtc). The cameras appear in the tab
on its next refresh (seconds). The browser keeps nothing; the forwarder writes
nothing and logs nothing; one sign-in runs at a time (a second is told 409).
An API key signs in without a 2FA prompt. The selftest (`--selftest`, section
8b) proves: no bearer -> nothing sent; a Wyze refusal is said plainly; a
re-run leaves registered cameras as they are; no source url, enr, password or
key leaves in the answer; a dark go2rtc -> 502.

**The terminal way** (still works; the app's empty state shows it behind
"Prefer a terminal?"):

**Step 1 (terminal) -- place the Wyze secrets on the NAS.** Get an API ID + API Key from
the Wyze developer portal (Wyze account > API Key). Then, from anywhere in
PowerShell (the values go in the quotes; the file lands root-readable only):

```powershell
cd C:\Users\dpoe\Kingdom-PWA-Node
ssh dpoe@192.168.1.26 "sudo mkdir -p /volume1/PoeTech/secrets; printf 'WYZE_EMAIL=%s\nWYZE_PASSWORD=%s\nWYZE_API_ID=%s\nWYZE_API_KEY=%s\n' 'YOUR-WYZE-EMAIL' 'YOUR-WYZE-PASSWORD' 'YOUR-API-ID' 'YOUR-API-KEY' | sudo tee /volume1/PoeTech/secrets/wyze.env > /dev/null; sudo chmod 600 /volume1/PoeTech/secrets/wyze.env; echo placed"
```

The next services-sync cycle (within 15 minutes) adds the `wyze:` sign-in block
to go2rtc's config. The installer prints `wyze: block added`.

**Step 2 (terminal) -- load the cameras, once.** go2rtc's WebUI lists the account's cameras
and writes one `wyze://` stream line per camera into its config. The WebUI is
loopback-only on the NAS by design, so reach it through an SSH tunnel from the
desktop, then open http://localhost:1984 in the browser, **Add > Wyze**, pick
the cameras. From anywhere in PowerShell:

```powershell
cd C:\Users\dpoe\Kingdom-PWA-Node
ssh -L 1984:127.0.0.1:1984 dpoe@192.168.1.26
```

Leave that window open while you use http://localhost:1984. Close it when done.
The cameras appear in the app on its next list refresh (seconds).

**Honest limits (DR-0076 / DR-0100), not guesses:**
- Only cameras on **DTLS-enabled firmware** stream through go2rtc's native Wyze
  source; **Gwell-based models are not yet supported** (Cam OG, Pan v4,
  **Floodlight Pro**). The Floodlight Pro note matches DR-0050's own
  "spottier" finding. For such a unit the documented fallback is
  `mrlt8/wyze-bridge` (2.10.3) feeding go2rtc over RTSP -- not built here;
  re-review: 2026-11-15 once the fleet is inventoried in the app.
- go2rtc's Wyze source is **new (released 2026-01-19)**. It is the sovereign
  choice (no Wyze SDK, local P2P after the one cloud listing), and its youth is
  a named risk, not a hidden one.
- Enumeration depends on Wyze's cloud once; streaming does not. If Wyze changes
  its API the listing step breaks, the already-written stream lines keep working.

## Adding any other system you own

One line each in `/volume1/docker/go2rtc/go2rtc.yaml` under `streams:` (edit on
the NAS, or through the WebUI tunnel above; go2rtc reloads on save):

```yaml
streams:
  driveway:  onvif://user:pass@192.168.1.60          # ONVIF (the DR-0050 backbone; UniFi Protect speaks rtsps too)
  garage:    rtsp://user:pass@192.168.1.61/live       # anything that already streams
  doorbell:  ring://...                                # native Ring (go2rtc WebUI > Add > Ring signs in and writes the line)
```

Names become the ids the app shows (`front_yard` reads "front yard"). Keep them
to letters, digits, `_ . -`; the forwarder drops anything else rather than put
it in a URL.

## What the app gets

| Call | Who may | Returns |
|---|---|---|
| `GET /cams/health` | anyone | go2rtc's own version + stream count, the running forwarder's sha and the on-disk sha, the live cap and clock, or 502 when dark |
| `GET /cams/list` | family bearer | `[{id, name, kind}]` -- never a source URL |
| `POST /cams/ticket {camera, ttl?}` | family bearer | a ticket for that one camera: 90 s by default, up to 3600 s for a recorded clip |
| `GET /cams/snap/<id>.jpg?w=640` | bearer or ticket | one JPEG frame; on a miss the JSON names the cause (`frame-timeout` 504, go2rtc's own scrubbed error, `go2rtc-unreachable`) |
| `GET /cams/why/<id>` | family bearer | why a camera has no picture: producers (kind, host, state; never a url), go2rtc's log lines for the stream, one timed probe (DR-0774) |
| `GET /cams/live/<id>.mp4?t=` | ticket | progressive MP4 (Chrome / Edge / Firefox / Android) |
| `GET /cams/live/<id>/index.m3u8?t=` | ticket | HLS/fMP4 (Safari, iOS, Fire TV); the ticket rides every segment line |
| `POST /cams/setup/wyze` | family bearer | the Wyze sign-in from the app (DR-0770) |
| `POST /cams/setup/wyze/again` | family bearer | re-adds the cameras from the sign-in the NAS KEPT, nothing typed (DR-0777); the forwarder also does this itself when go2rtc comes back with zero streams |
| `POST /cams/restart` | family bearer | restarts the forwarder from the file on disk (DR-0772) |
| `GET /cams/devices` | family bearer | the Wyze account's cameras over Wyze's own cloud (`wyze_cloud.py`): mac, nickname, online, `garage` (controller dongle present), the go2rtc stream id it pairs with (DR-0777) |
| `POST /cams/action {mac, action}` | family bearer | one cloud action, no video in the path: `garage` (= `garage_door_trigger`, the Wyze app's own call), `siren_on/off`, `power_on/off`; 429 inside 3 s, 409 offline (DR-0777) |
| `GET/PUT /cams/recording` | family bearer | which cameras record, their retention, the disk budget, the recorder's status (DR-0775) |
| `GET /cams/rec/<id>` | family bearer | the camera's clips on disk `[{name, bytes, start}]` |
| `GET /cams/rec/<id>/<clip>.mp4?t=` | ticket | the clip, with Range (206) so the player can seek |

The app picks HLS when the device's `<video>` says it can play
`application/vnd.apple.mpegurl`, else MP4 -- no player library, the browser's own
decoder. Snapshots are the default (one frame every 5 s per camera, three in
flight at once, a failed camera rested 30 s); a tap opens full motion in place
and a view that drops reconnects itself; **Wall +** watches several cameras
live together; a blank tile names its cause and **Why?** asks the NAS.

## Recorded loops (DR-0775)

`cams_recorder.py` (poetech-cams-recorder.service) copies every camera the
owner switches on into ten-minute MP4 segments under
`/volume1/PoeTech/cameras/recordings/<id>/` using the ffmpeg inside the
go2rtc container (`docker exec`, stream copy, no transcoding). Retention is
per camera (1 day to 1 year); ONE disk budget prunes the oldest clip first
across every camera when it is reached; the clip being written is never
deleted. The owner steers it from the Cameras tab (Record, keep, budget); the
forwarder writes `recording.json` beside `go2rtc.yaml` and the recorder
reconciles within its 10 s loop, restarting a dead ffmpeg with a backoff
(5 s to 5 min). Status (clips, bytes, oldest, newest, disk free, the running
code's sha) is in `recording.status.json`, shown in the tab with a rate
MEASURED from real clips. Selftest: `python3 cams_recorder.py --selftest`.

## Brakes and witnesses

- **Forwarder**: 12 live streams at once by default (503 `busy` beyond), no
  per-view clock by default (`CAMS_LIVE_MAX_SECONDS=0`; set a number only if
  the home link measures short), 6 snapshots in flight, 12 s / 20 s per-call
  timeouts, a 4 KB ticket body cap. Request-driven: no timer, no compute
  until a browser asks. Darrell 2026-10-07: "Let's not build in undermining
  constraints"; his link is 1 Gbps fiber, and the one unknown (Funnel relay
  throughput) is measured in the tab, not pre-empted.
- **Recorder**: the disk budget is the budget; systemd is the lock; it does
  nothing until `recording.json` enables a camera.
- **Selftests** (`cams_forwarder.py --selftest`, `cams_recorder.py --selftest`)
  gate merge in `ci.yml`, each proven to catch.
- **Witnesses**: `site-health.yml` probes `GET /cams/health` from outside the
  NAS each run and compares the running forwarder's sha with main;
  `cams-diag.yml` (dispatch) prints go2rtc's own streams, log and container
  log from the NAS over the tailnet, scrubbed (DR-0774).
- **Funnel bandwidth** is undisclosed by Tailscale. The app shows measured
  time-to-first-frame and bytes per view so the real link is visible, not
  assumed. re-review: 2026-11-06 with the measured numbers from the app.

## Verify on the NAS

```sh
curl -s http://127.0.0.1:1984/api
curl -s http://127.0.0.1:8773/health
sudo /var/packages/Tailscale/target/bin/tailscale funnel status
journalctl -u poetech-cams -n 50
sudo docker logs poetech-go2rtc --tail 50
```
