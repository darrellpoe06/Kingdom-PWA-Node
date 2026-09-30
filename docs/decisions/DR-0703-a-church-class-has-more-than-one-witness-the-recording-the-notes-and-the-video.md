# DR-0703 — A church class has more than one witness: the recording, the teacher's notes, and the church's video

- **Status:** accepted
- **Tier:** A (a read-only workflow and a Way; nothing is written anywhere)
- **Type:** ways + workflow
- **Date:** 2026-09-30
- **Scope:** `.github/workflows/church-video-witness.yml` (new, dispatch only, read-only); `scripts/system-flow-registry.mjs` (registered); the lesson-builder Way (carried into the builder rules by DR-0706).
- **Principles:** VERIFICATION-DOCTRINE (DR-0076), WORD-FIRST, SPOKEN-TEACHINGS-ARE-BUILD-INPUT, HOLD-THE-HAND (DR-0621), DECISION-RECORDS
- **Grounds:** Darrell, 2026-09-30, on L202: *"We will have a YouTube video uploaded to our church channel today... may already be there... use the transcription from that also to verify our lesson today from that Bible study session... We have workflows for that..."*; DR-0333 (the COLG sermon intake: the Wednesday email and the YouTube pass); DR-0168.

## Context

L202 was built from one witness: a phone recording made inside the app and transcribed by Whisper on the NAS CPU (agent_inbox `aed9557b-…`). Whisper marks no speakers, mishears names and references, and the recording began partway through the message. Darrell named two more witnesses that already exist for a church class: the church posts the study to its YouTube channel, and Bishop Gwin emails his notes for the study on the same day (DR-0333: from `bg@thechurchofthelivinggod.com`, Darrell on Cc, the body empty and the words in a `.docx`).

## What was measured

- **The notes arrived.** Gmail, 2026-09-30 16:05 UTC, from `bg@thechurchofthelivinggod.com`, subject `09-30-2026 - PROCLAIM - ONCE A CHRISTIAN - ALWAYS A CHRISTIAN ! JOSHUA 1.8 NKJV`, one `.docx` (26,426 bytes), body a signature only, exactly as DR-0333 recorded. Read in full. The message is titled **Once a Christian, Always a Christian!**, anchored on Joshua 1:8, with five points: 1. Success requires courage (Joshua 1:1-6; Numbers 13:1-3, 31-33; 14:1-2, 5-10); 2. Don't let others define you (Joshua 1:2); 3. Homecoming is about legacy (Psalm 145:4; Exodus 17:9; 24:12-13; 32:17-20; Numbers 27:18-20; Deuteronomy 31:1-3, 7-8; 34:9); 4. God defines success (Joshua 1:7-8); 5. Represent (2 Corinthians 5:17; Matthew 5:16; Romans 8:35-39). The recording opens inside point 2 ("those experiences were not intended to define you"), so point 1 and most of point 2 are not in it. The notes confirm the lesson's own reading of the recording: legacy was point three, success point four, represent the last; "Matthew chapter 5 verse 6" is Matthew 5:16; Romans 8:35-39 closes the message.
- **The video.** This sandbox and GitHub runners cannot reach YouTube (DR-0333; the proxy answers 403). The living road is the NAS: the channel sync writes `choir_sermons`, the transcript trickle on the NAS's residential IP writes `video_transcripts`. No workflow could read whether a given day's class had arrived there, so `church-video-witness.yml` was added: given a date it prints the sync's newest service dates (so a stale sync is seen), every `choir_sermons` row of that date with its transcript's length, words, source and verdict, and on request the one video's words as dotted base64 with an md5 round-trip (P63). Read-only; it never fetches from YouTube.

## Impact

Without this, a lesson built from an in-app recording rests on a single machine-heard witness, and the check Darrell asked for depends on a person remembering to look. With it, the notes are read the day they land (DR-0333 pass one) and the video is checked through the road we own, with no connector and no timer.

## Decision

1. **A church class has up to three witnesses, and the lesson builder uses every one that exists:** the in-app recording (words, order, the room's voices), the teacher's own notes (the title, the points and their order, the Scripture he opened), and the church's posted video (a second recording of the same words). The notes and the video correct the recording; the lesson says which witness carries each claim, and quotes only the KJV from `app/public/bible/kjv` whatever translation the notes use.
2. **The video is read through the NAS road only** (`church-video-witness.yml`). No row for the date is reported as exactly that, with the sync's freshness beside it; a stale sync is a defect to raise, never a reason to skip (DR-0333).
3. **The follow-up is event-driven, not a timer:** the channel sync and the transcript trickle already run on the NAS clock; when the day's row carries words, the lesson is re-verified against them and corrected in a new PR.

## Verification

- The workflow is registered in `scripts/system-flow-registry.mjs`; `system-flow-graph.test.jsx` 54/54 green with it.
- The notes were read from the real message (the `.docx` extracted from the raw message; 26,426 bytes), not summarised from a subject line.
- `re-review: 2026-10-07` — the first dispatch for 2026-09-30 and whether the video row and its words arrived.
