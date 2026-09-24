# DR-0611 — A spoken lesson is transcribed by Whisper on our own machines, on a ladder of places, and reaches the lesson intake as words

- **Status:** accepted
- **Tier:** B (a migration: one private storage bucket and three owner-folder policies; no table, no policy change on any existing table). The NAS job is the deterministic class (DR-0248: budget + lock) and starts itself by merge through the self-deploy manifest (DR-0247)
- **Type:** feature + fix
- **Date:** 2026-09-24
- **Scope:** `infra/supabase/migrations-auto/0229-a-spoken-lesson-waits-in-its-speakers-own-folder.sql` (new); `app/src/lib/lesson-voice.js` (new); `app/src/components/VoiceLessonRecorder.jsx` (new); `app/src/components/OneVoiceInput.jsx` (the recorder under the Lesson chip); `infra/nas-lesson-voice/` (new: `lesson_voice_transcribe.py`, `test_lesson_voice.py`, `install.sh`); `infra/nas-loops/services.json` (the `lesson-voice` rider); `.github/workflows/ci.yml` (the proofs gate merge); `infra/nas-scribe/scribe_queue_consumer.py`, `test_scribe_consumer.py`, `infra/nas-loops/loops/scribe-transcribe.sh` (two fixes found on the way); the lesson reader Routine (reads transcript rows)
- **Principles:** SOVEREIGNTY (the words are written on our machines), DR-0132 (outbound poll on the Supabase bus; no inbound door), DR-0247 / DR-0248 (started by record; budget + lock), VERIFICATION-DOCTRINE (DR-0076: every behavior proven-to-catch; the rung and model named on every transcript), SPEC-CONFORMANCE-REVIEW (DR-0219), DR-0608 / DR-0610 (the lesson door and the parallel run this feeds)
- **Grounds:** Darrell, 2026-09-24: *"Only has the to work for intake can whisper work for us?"*, then *"Go build the Whisper intake"*, then *"Can we put whisper on multiple places for easy-to-use or support a better flow or quality?"*

## Context — the question (SHOULD → ARE → GAPS, DR-0219)

**SHOULD.** A lesson spoken into the app is transcribed by Whisper on PoeTech's own machines and arrives at the lesson intake as words, with no dependence on a browser's speech service, no inbound door opened on the NAS (`docs/decisions/DR-0132-n8n-off-the-critical-path.md`, Decision 1: the outbound-poll bus), and more than one place able to do the transcribing.

**ARE (measured 2026-09-24, before this record).**

| part | state |
| --- | --- |
| Whisper on the tower | `infra/church-gpu-node/whisper-gpu/server.py:79` reads a multipart `file` field or JSON `{path}`; anything else is refused at `:97` with `file-or-path-required` |
| the meeting-recorder consumer | posted a raw `application/octet-stream` body (`scribe_queue_consumer.py:234` before this change) to `127.0.0.1:8771` (`:231`), so every queued recording would have been refused three times and the consumer would have paused itself |
| port 8771 on the NAS | belongs to the voice forwarder (`infra/voice-studio/voice_forwarder.py:340`), which relays to the tower's voice studio, not to Whisper |
| the recorder's route from the app | `/scribe` is installed but not mounted on the Funnel (`infra/nas-transport/RECORDED-STATE.md:49`: "needs a real mount"), and the app holds no token for it |
| the recorder's loop | `scribe-transcribe` is enabled in `infra/nas-loops/registry.json:26`, but the clock fires only services-sync and health-check (`infra/nas-loops/install-clock.sh:73-74`), so nothing fires it |
| a lesson from the app | the Lesson chip relays typed or browser-dictated text only (DR-0608) |

**GAPS.** No road carried a recording from the app to Whisper; the existing consumer could not have succeeded on its upload shape or its address; its loop has no clock; and there was one Whisper place, not a ladder.

## Decision

1. **The road is the Supabase bus, outbound only.** The Speak box (under the Lesson chip) records the lesson, uploads it to the private `lesson-audio` bucket under the speaker's own folder (0229: the first folder is the access rule; no anon access), and files one `agent_inbox` row tagged `lesson`, `voice`, `audio:<path>`. A refused row removes the upload; a signed-out send files nothing; both are said on the surface.
2. **The NAS answers it by riding the self-deploy clock** (`services.json` → `infra/nas-lesson-voice/install.sh`, every 15 minutes, the transcript-trickle pattern), not a registry loop that has no clock. Each pass polls `agent_inbox` with the service role, downloads the audio, keeps it on the NAS, transcribes it, files the transcript as a new row tagged `lesson`, `voice-transcript`, `of:<row id>`, `whisper:<rung>` in the same instance and under the same author, tags the original `voice-transcribed`, and deletes the cloud copy.
3. **The Whisper ladder** (his "multiple places"): every endpoint in `WHISPER_URLS` in order (default the 4070 tower, `tlcmediadpt:8771`, large-v3-turbo on the GPU), then faster-whisper on the NAS's own CPU (model `small`, installed once by the rider and retried at most daily). The first rung that returns words wins. Adding a place is one line in `/volume1/PoeTech/secrets/lesson-voice.env`. Every transcript says which rung and which model wrote it, so quality is compared on real lessons, not assumed.
4. **Idempotent by the database, honest on failure.** Before writing, the pass asks whether a transcript row for that id already exists. A row that fails three times is tagged `voice-failed` and a `lesson` + `voice-failed` row states the last reason, so the failure reaches Darrell instead of looping.
5. **Brakes (DR-0248):** 3 rows and 400 seconds per pass inside the 480-second installer ceiling; a single-flight lockfile (a stale one is broken). No credential on the box is a named, quiet no-op.
6. **The lesson reader** builds lessons from `voice-transcript` rows, treats a `voice` row as waiting until its transcript arrives, and reports a `voice-failed` row to Darrell.
7. **Two fixes on the meeting-recorder consumer**, found by this review: it now uploads multipart and defaults to the tower; its run example says so.

## What was measured

| what | measured |
| --- | --- |
| `test_lesson_voice.py` | 16 proofs: the road; quiet rows untouched; traversal refused; idempotent; empty words are a failure; the voice-failed row after 3 tries and silence after; item and time budget; live lock skips; stale lock broken; ladder default, order, the CPU last rung, every reason said when none answers; the multipart shape |
| `test_scribe_consumer.py` | 14 (12 before + 2: multipart, tower default) |
| `lesson-voice.test.jsx` | 15: owner-folder path; the migration private with three owner policies and no anon; tags and body; recording limits; upload-then-row; signed-out files nothing; refused upload files no row; refused row removes the upload; the recorder's record, stop, cap, send, failure and unsupported states; mounted only under the Lesson chip |
| migration guards | tenancy, replay-order, matrix, replay-completeness, smoke-language, return-type: green with 0229 |

## Limits, stated

1. **Whether Whisper answers on the tower today is not measured.** This sandbox cannot reach the NAS or the tower. If the tower is dark, the NAS CPU rung carries the lesson more slowly; the first CPU transcription also downloads the `small` model, which can take more than one pass. The first real voice lesson's transcript row names the rung that wrote it: that is the measurement. `re-review: 2026-10-01`.
2. **The recorder's own loop (`scribe-transcribe`) still has no clock**, and `/scribe` still has no Funnel mount. Meetings are not part of this record; the fixes above make the consumer correct for the day it is clocked. `re-review: 2026-10-07`, with the Decision Intelligence review's phase 4.
3. **The report back to the sender** remains DR-0608's open item: the reader reports in this chat, not yet on the Speak box.

## Verification

- CI: the two Python suites and the vitest suite gate the merge.
- After merge: db-migrate applies 0229; services-sync installs the rider within 15 minutes of the mirror pull. On a phone: Church → Speak → Lesson chip → Record the lesson → Stop → Send; then `select tags from agent_inbox where tags ? 'voice-transcript' order by created_at desc limit 1` shows the transcript row and its `whisper:<rung>` tag, and the storage object is gone.
