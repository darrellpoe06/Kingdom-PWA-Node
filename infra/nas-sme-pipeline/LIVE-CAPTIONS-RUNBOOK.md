# Live sovereign captions — generation runbook (Tier C, ships INERT)

**Status: PLANNED / INERT. Nothing here runs on a schedule or auto-arms.** This is
the sovereign LIVE-caption generator for the COLG (@thelovecorner) Sunday service —
the one piece of DR-0137 that is not yet wired, documented so it is executable by the
team (DR-0108 ways-review) without touching the live broadcast.

## The bright line (read first)

- **NEVER run this on the live OBS box** (`LiveStream-Main-PC`, `100.72.5.90`). That box
  is the live broadcast switcher. This generator runs on a **separate church GPU tower**
  (the LEFT tower / the Ollama box), pulling audio over the network — it never changes an
  OBS setting, never installs on the broadcast box, never competes for its GPU.
- **This is Tier C** (RELEASE-TIERS + the three-brakes law). It ships inert and is armed
  only **with someone watching**, never on a timer, never while Darrell is traveling.

## Why live is separate from historical/perpetual

Historical + perpetual captions are DONE and zero-GPU: `load-transcripts.py` pulls
YouTube's OWN timed auto-captions and now stores them as WebVTT (`video_transcripts.vtt`,
migration 0095), and the app renders them (`CaptionedVideo.jsx`). But YouTube's live
auto-captions lag and are theirs. A caption we OWN *during* the service needs real-time
ASR on our own hardware = Whisper streaming.

## The pipeline (when armed)

```
sanctuary audio  ->  church GPU tower (NOT the OBS box)
  (NDI/Dante/USB     faster-whisper streaming (base/small.en, ~1-2s windows)
   audio tap)        -> cues {start,end,text}
                     -> build WebVTT (same algorithm as captions.js / load-transcripts.py)
                     -> upsert video_transcripts(vtt, cue_count, source='whisper-nas')
                        for the live video id  (REST, service-role key, RLS-exempt)
  app  <- the live service page reads the row and renders the follow-along panel,
          the cues arriving a few seconds behind the audio.
```

The **display side is already built and source-agnostic** — a `whisper-nas` track renders
exactly like a `youtube-asr` one, labeled "Whisper (sovereign, church GPU)". So arming the
generator is the only remaining work; nothing in the app changes.

## The three brakes (required before it may be armed — CLAUDE.md)

1. **Budget** — a wall-clock ceiling per service (e.g. 3h); the process self-terminates at
   the ceiling, it does not run indefinitely.
2. **Single-instance lock** — a lock file; a second start SKIPS (mirrors
   `load-transcripts.py` `acquire_lock()`), so two generators never stack on one service.
3. **Kill-switch** — a `.captions-live-paused` flag + a dead-man's heartbeat: on repeated
   ASR failure or a missed heartbeat it PAUSES itself and refuses to resume until a human
   clears the flag. It never auto-continues into a runaway.

## Arm / disarm (paste-ready, from anywhere)

Darrell can SSH into the church GPU tower from his phone (ConnectBot) or desktop. The
generator ships as a manual command — no cron, no systemd autostart.

```
cd C:\Users\dpoe\Kingdom-PWA-Node
ssh -i C:\Users\dpoe\.ssh\id_ed25519_tlc itdepartment@<LEFT-TOWER-IP> "python3 /volume1/PoeTech/live-captions.py --slug colg --video-id <LIVE_ID> --budget-min 180"
```

Disarm: Ctrl-C, or `touch /volume1/PoeTech/out/.captions-live-paused` on the tower.

## Re-review

- **re-review: 2026-08-01** — build + arm-with-someone-watching. Until then, live captions
  are honestly "pending" in the app; the historical + perpetual tracks carry the load and
  the coverage number reflects reality.
