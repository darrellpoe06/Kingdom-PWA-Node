---
id: DR-0137
title: Sovereign captions — live, perpetual, historical; owned by us, on every surface
date: 2026-07-09
status: accepted
supersedes: []
superseded-by: null
tier: B
entities: [church, all]
grounds: [WORD-FIRST, COMMUNITY-FIRST, VERIFICATION-DOCTRINE, DATA-AS-EMPOWERMENT, APP-IS-PRIMARY, QUALITY-OF-LIFE]
source: session-2026-07-09-sovereign-captions
---

## Context

YouTube shows closed captions on the COLG (@thelovecorner) Sunday livestream, and we
don't — Darrell asked why, then: "we want live perpetual and historical sovereign
captions asap... when we add features we need to update our Ways and documentation...
Ari's responsibility and reports should all update to reflect... No static data."

The why (verified read-only, 2026-07-09): those captions are **YouTube's**. Google
runs ASR server-side and paints captions onto ITS player only. The OBS box
(`LiveStream-Main-PC`, OBS 32.1.2, streaming to YouTube RTMPS) has **no caption keys
in its profile** — the stream we push carries video + audio only, no CEA-608/708
track. So YouTube's captions never leave the YouTube watch page: not the in-room
projection, not the PoeTech app, not the Presenter/NDI output, not Facebook, not a
downloaded clip. We contribute none of it.

We already harvest the caption TEXT: `youtube-captions.py` / `load-transcripts.py`
pull YouTube's auto-captions into `video_transcripts.text` (DR-0058) — but they
**joined the segments and discarded the per-segment timing**, the one thing a synced
caption track needs. We had the words and threw away the clock.

## Decision

Own our captions — a sovereign, timestamped track, on every surface, measured:

1. **The track is ours, source-agnostic.** A caption is normalized cues
   `{start,end,text}` serialized to WebVTT. Migration **0095** gives
   `video_transcripts` two columns — `vtt` (the WebVTT document) and `cue_count` —
   reusing the existing `source` (youtube-asr | whisper-nas | manual), `lang`, and
   `updated_at` (no duplicate columns). The fetch scripts keep the timing and emit
   VTT; the pure spine is `app/src/lib/captions.js` (parse/build/sync/search),
   byte-identical to the Python builders so YouTube-sourced and Whisper-sourced
   captions render the same.

2. **Historical + perpetual ship now, zero-GPU.** `load-transcripts.py` (already the
   braked, trickle-paced backfill loader) now writes `vtt` + `cue_count` on every
   fetch — so the archive backfills and each new upload is captioned on the next run.

3. **On-demand display is a synchronized follow-along panel.** You CANNOT attach a
   `<track>` to a YouTube iframe, so `CaptionedVideo.jsx` renders the cues beside the
   sermon video (Pulpit): the current line highlights + auto-scrolls, every line is
   click-to-seek, and the whole message is searchable — captions + a searchable
   transcript in one, for deaf/HOH viewers, independent of YouTube. It degrades to the
   bare iframe when a video has no track (unbreakable), and the YouTube IFrame API is
   optional (blocked → the panel still lists/searches/seeks).

4. **Live is scaffolded, not claimed.** Sovereign live captions require real-time ASR
   = a **Whisper-streaming generator on a church GPU box (NOT the live OBS box)**,
   documented as a Tier-C runbook that ships **inert** under the three-brakes rule
   (budget + single-instance lock + kill-switch) and is armed only with someone
   watching. The display pipeline is ready to consume live cues the moment that
   generator exists; until then we do not paint a "live captions" state.

5. **Coverage is a measured number, in Ari's report.** `captions-coverage.js` computes
   captioned-videos / the real corpus (only a track with `cue_count > 0` counts — an
   untimed transcript is NOT captioned). It renders live on the Harvest Ledger and is
   a new Ari standing duty. Low coverage files a concern automatically
   (`derive-concerns.js`) — accessibility is an obligation, not a nicety.

## Rationale

- **WORD-FIRST** — captioning the Word makes it legible to everyone; the track is the
  message in the reader's hands, searchable and jumpable.
- **COMMUNITY-FIRST** — COLG's congregation skews elderly; deaf/HOH access on the
  in-room and app surfaces is the named first-community obligation, not YouTube's to
  grant or revoke.
- **VERIFICATION-DOCTRINE** — coverage is measured against the real corpus; an untimed
  transcript is honestly not a caption; unknown timing never fakes a highlight.
- **DATA-AS-EMPOWERMENT / sovereignty** — the track is stored in our DB and served by
  us, on every surface, not borrowed from a vendor's player.
- **APP-IS-PRIMARY** — the capability lands in the app (the panel, the coverage
  report) where the family and congregation actually meet it.

## Consequences

- `video_transcripts` gains `vtt` + `cue_count` (additive, existing grant carries;
  RLS unchanged — READ user_in_choir, WRITE owner/admin).
- The on-demand caption panel is live on Pulpit; historical/perpetual coverage climbs
  as `load-transcripts.py` runs its normal trickle.
- Live sovereign captions remain a pending Tier-C runbook item (Whisper-streaming
  generator) — NEVER touching the live broadcast box.
- New surfaces added this change update the Ways (REV-0029), Ari's duties + report,
  and the concerns board — per the standing "update our Ways and documentation" rule.

## Links

- Migration: `infra/supabase/migrations-auto/0095-video-transcripts-captions-vtt.sql`
- Spine: `app/src/lib/captions.js` + `app/src/lib/captions-coverage.js`
- Display: `app/src/components/CaptionedVideo.jsx` (wired in `Pulpit.jsx`)
- Fetch: `infra/nas-sme-pipeline/load-transcripts.py`, `youtube-captions.py`
- Ways review: `docs/reviews/REVIEWS.md` REV-0029
- Grounds: DR-0058 (video_transcripts), DR-0076 (verification), DR-0104 (live review),
  COMMUNITY-FIRST-MISSION, ACCESSIBILITY (see/hear pair)
