# Church IP cameras (left / right / center) -> OBS via RTSP -- setup runbook

_2026-07-14. Darrell has the web username/password for the three online church
cameras (left, right, center) and asked how the agent can help the livestream.
This is the runbook that wires those cameras into OBS so they are usable on the
stream. **The credentials stay on the church side and are never sent to the
agent** -- you type them into OBS (or the NAS secrets file) at the booth machine._

## The one security rule

- **Do NOT paste the camera username/password into the chat / the agent.** Anything
  sent there is stored in the conversation transcript. Treat any credential that
  lands in a message as compromised and rotate it.
- The agent has **no route to the church LAN** from the cloud anyway (same reason it
  cannot reach the NAS or poetech.us directly), so holding the creds buys nothing.
- Creds live in exactly two church-side places: the **OBS source config** on the
  production box, and (optionally) a **NAS secrets file** if a script ever needs
  them. Never in the repo, never in chat.

## Where these cameras fit (ties to lib/church-av-devices.js)

A camera with a **web login** is an **IP camera**, which speaks **RTSP**. Per the
`CAMERA_CONNECTIONS` matrix it reaches production one of two ways:

1. **OBS software-switcher lane (this runbook):** each IP camera's RTSP stream is an
   **OBS source** on a church tower (OBS already lives on the CUDA production box).
   OBS mixes left/right/center and outputs to the stream (YouTube/Facebook) and, via
   NDI, to the wall. No extra hardware. This is the fastest path and what to use for
   "help the livestream when needed."
2. **ATEM hardware lane:** IP camera -> **NDI/RTSP -> SDI converter** -> ATEM SDI
   input. Switching only, no ATEM remote camera control (that is Blackmagic-SDI
   specific). Use only if the cut is being done on the ATEM, not OBS.

Human always keeps the live cut (DR-0012 / AV-GUARDRAILS): the agent can prepare
scenes, health-check, and document -- it does not auto-cut the live program.

## RTSP URL -- the template (fill in on the booth machine)

The RTSP main-stream URL format depends on the camera brand. Find your three
cameras' LAN IPs (in the camera app or the router's DHCP client list), then use the
matching template. Replace `USER`, `PASS`, and `IP` at the booth machine only.

```
# Amcrest / Dahua
rtsp://USER:PASS@IP:554/cam/realmonitor?channel=1&subtype=0

# Hikvision (and most Hik-OEM)
rtsp://USER:PASS@IP:554/Streaming/Channels/101

# Reolink
rtsp://USER:PASS@IP:554/h264Preview_01_main

# PTZOptics / most ONVIF NDI-HX PTZ cams
rtsp://USER:PASS@IP:554/1

# Unknown brand -> ONVIF Device Manager (free) reveals the exact RTSP path,
# or check the camera's own web UI under Network -> RTSP.
```

`subtype=0` / `_main` / `101` / `/1` = the FULL-resolution main stream (use for the
program). The sub-stream (`subtype=1`, `_sub`, `102`, `/2`) is low-res -- handy for a
multiview/preview grid without saturating the network.

## Add each camera to OBS (church production box)

Do this once per camera (left, right, center):

1. OBS -> **Sources** panel -> **+** -> **Media Source** -> name it `CAM-LEFT`
   (then `CAM-RIGHT`, `CAM-CENTER`).
2. **Uncheck** "Local File".
3. **Input:** paste the RTSP URL for that camera (with USER/PASS/IP filled in).
4. **Input Format:** `rtsp`
5. Recommended flags for a live feed (paste in "Input" advanced or leave default if
   it plays): reduce latency + reconnect ->
   - Check **"Restart playback when source becomes active"**
   - Check **"Use hardware decoding when available"**
   - In **Reconnect Delay** set ~2s so a blip self-heals.
6. OK. The feed should appear. Repeat for the other two cameras.
7. Build **Scenes**: e.g. `Wide` (center), `Left`, `Right`, `Split` (all three in a
   grid). The director switches scenes = switching cameras; OBS out already feeds the
   stream and the NDI "OBS" output feeds the wall (per the middle-screen topology).

## How the agent helps from here (no creds needed)

- **Scene layout + this runbook:** maintained in the repo; the agent iterates the
  OBS scene collection design and the AV chain docs.
- **Switching / health when live:** through **obs-websocket** (v5, the church box's
  :4455) as the documented control surface, and Ari's `av-loop` standing duty --
  read state, suggest/execute a switch under the human's hand, never an autonomous
  cut on the live box (DR-0012).
- **What the agent needs from you (values only you hold, not creds):** the three
  camera **brands** and their **LAN IPs**, so the RTSP template above can be pinned
  to the exact path per camera. Drop those in chat (brand + IP are not secrets); the
  USER/PASS stay at the booth.

## The livestream-archive tie-in (the other half of today's question)

Today's conference streams show live in Church -> Worship (channel embed) but are
not yet in The Word, because the channel import has not run. Unblock: set
`VITE_YOUTUBE_API_KEY` in Vercel, then The Word (admin) -> "Import from channel"
pulls today's 4+ streams in, each dated and auto-labeled `conference`. Sovereign
alternative: run `infra/church-media-golive/youtube_load.py` on the NAS with the
Supabase service key. See that script's header for the exact steps.
