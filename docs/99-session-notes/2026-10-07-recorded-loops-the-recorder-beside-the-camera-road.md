# 2026-10-07 — Recorded loops: the recorder beside the camera road

**Layer 4 working note.** Decision: DR-0775. Follows DR-0774 (sight) the same afternoon.

## The ask

Darrell: "Recorded loops for however long I want backed up to the nas?" The ari-guard stop hook then caught my reply deferring it to "the next build" (DR-0236 fake boundary). Built the same session.

## Choices, with their basis

- **ffmpeg from inside the go2rtc container** (go2rtc README: the image ships FFmpeg and Python), reached with `docker exec` from a host Python service. No new binary on DSM, no second image, stream copy only (no CPU for transcoding).
- **Ten-minute segments, clock-aligned, time-named** (`%Y-%m-%dT%H-%M-%S.mp4`), flat per camera folder; the app groups by day. The segment muxer cannot create day folders itself.
- **Retention per camera + one budget over all**, oldest first across cameras, the clip being written exempt. The budget is the deterministic brake (DR-0248).
- **Ticket TTL up to 3600 s for clip playback**: Range pieces are each checked against the ticket; 90 s would cut a clip off.
- **A measured disk line**, never a nominal bitrate: bytes over the span between a camera's oldest and newest clip; "not measured yet" under an hour.

## Still open

Motion marks and a scrubbing day timeline (re-review 2026-10-21). The other house records once it streams (DR-0774's relay decision, 2026-10-14). Per-person and outside access is DR-0776, built next in this session.
