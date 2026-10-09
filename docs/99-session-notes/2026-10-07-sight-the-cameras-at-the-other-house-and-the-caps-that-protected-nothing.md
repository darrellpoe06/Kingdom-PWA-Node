# 2026-10-07 — Sight: the cameras at the other house, and the caps that protected nothing

**Layer 4 working note.** Decision: DR-0774. Follows DR-0770 (sign-in in the app) and DR-0772 (restart from the app, the draft survives).

## The sequence, as it happened

1. The Wyze sign-in landed on the second try (the first was refused by the old process, DR-0772). The chip went from 0 to 31 streams.
2. First screen: every tile "last try failed: HTTP 502"; a live view "ended after 13 s (the NAS stops each live view at 300 s...)" with "the browser could not open this stream".
3. Four minutes later: back yard north and south, basement north, basketball cam, front, front cam and front door view had frames (1.5 s to 37 s each, "frame 2 m ago"); basement living room and east north cam stayed blank; the live view had a first picture in 2.6 s and ended at 28 s.
4. Darrell: "the feed needs to be able to give us sight", "I need multiple views", "Let's not build in undermining constraints", "1gig up and down fiber", "Recorded loops for however long I want backed up to the nas?", "My wife and family should also have access...".

## What the evidence says

- go2rtc's Wyze source is local P2P to the camera's IP only (its README, verbatim in DR-0774). The NAS at 192.168.1.26 reaches the cameras on that LAN. The cameras at the other address are listed by the Wyze account but cannot be dialed from here. tinyCam reaches them through Wyze's relay.
- The forwarder reported a 12 s timeout as "go2rtc-unreachable" (502). That label was false: go2rtc was up and the camera did not answer.
- The sweep was serial: 31 cameras × up to 12 s each.
- The live view's end was the stream's, not the NAS clock's.

## What shipped (DR-0774)

Honest snap causes; `GET /why/<id>`; the Why? panel; a self-reconnecting live view; the wall; a parallel sweep that rests failures; defaults 12 live and no clock; `cams-diag.yml`, the read-only eye over the tailnet.

## Next, in order

1. After merge + NAS sync: dispatch `cams-diag.yml` with one blank camera's id; read which LAN the NAS is on and go2rtc's exact error for that camera. That measurement decides the other-house road (TUTK-relay adapter feeding go2rtc as RTSP, or a box at that house).
2. Recording loops to the NAS: per-camera continuous segments via the go2rtc image's ffmpeg from `rtsp://127.0.0.1:8554/<id>`, owner-chosen retention, a disk budget that prunes oldest first, a playback timeline in the tab. Disk math before building: bitrate × cameras × days, measured from real segments.
3. Access: today the family key on a device = every camera for that family member, set up once by the owner. Next: per-person grants (RLS) and time-boxed outside links (camera-scoped tickets with a longer TTL, minted and revoked by the owner).
