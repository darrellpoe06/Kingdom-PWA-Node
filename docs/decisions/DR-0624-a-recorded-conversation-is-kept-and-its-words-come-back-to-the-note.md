---
id: DR-0624
title: A recorded conversation is kept, and its words come back to the note — the audio is the source of truth, the note is saved on Stop, the microphone that gives silence is said, and one Whisper rider serves lessons and notes
status: accepted
date: 2026-09-24
tier: B
type: defect
declared_by: Darrell
scope:
  - app/src/components/OneVoiceInput.jsx (the Notes box: Record a conversation in place of "Listen to the whole thing"; interim words; the no-words message)
  - app/src/components/ConversationRecorder.jsx (new: consent tap, record, the silence alert, save on Stop)
  - app/src/components/ThinkingSpace.jsx (the note shows Transcribing / Send again / done; keeps asking for the words)
  - app/src/lib/recorded-note.js (new: the road, pure over its I/O)
  - app/src/lib/voice-dictation.js (interim words, plain error words, nothing-heard, session outcome)
  - app/src/lib/workflow-scribe.js (the recorder gains a level meter, plain mic errors, bitrate, constraints)
  - app/src/lib/lesson-voice.js (sendRecording: one upload-then-relay road for lessons and notes)
  - app/src/poe-financial-mvp-v28.jsx (addNote(text, extra) returns the id; patchNote)
  - infra/nas-lesson-voice/lesson_voice_transcribe.py + install.sh + test_lesson_voice.py (note path, retry, resume, the CPU rung's install)
  - .github/workflows/voice-intake-health.yml (new: the live witness)
principles: [HOLD-THE-HAND (DR-0621), VERIFICATION-DOCTRINE (DR-0076), REALITY-TRACE (DR-0061), APP-IS-PRIMARY (DR-0065), SOVEREIGN-FIRST, DECISION-RECORDS (DR-0011)]
grounds:
  - DR-0611 — the spoken-lesson Whisper road this rides
  - DR-0614 — the NAS writers follow the database the app reads
  - DR-0618 — live-sql.sh reads the live database from a runner
source: 2026-09-24 — Darrell, typed, with screenshots of the Notes tab, and two follow-ups through the coordinator
---

## Context

Darrell, 2026-09-24: *"The intake for PoeTech App did not work... I tried to record a conversation with me and a friend like a meeting note taker and it would not even save the note... it shows like it's recording however at the end there are not text in the text box on the screen where I would think it would display into?!! Fix it!!!"* Then: *"He was on the phone and I'm right at the mic!!!!"*

The surface, confirmed from his screenshots: Notes tab, "Thinking Space · your diary", the Speak button with "Listen to the whole thing" ticked, Your thoughts at 0. The device: a Samsung foldable, Chrome, the installed app.

## What was measured

| what | where | measured |
| --- | --- | --- |
| How the Speak box writes words | `voice-dictation.js` (before) | Browser speech recognition, `interimResults = false`: only FINAL results were written. Nothing appeared while talking. |
| What Save does with an empty box | `OneVoiceInput.jsx` `send()` | `if (!t) return;` — nothing saved and nothing said. The exact failure he saw. |
| Whether any audio was kept | same | None. The speech engine keeps no recording, so there was nothing to recover. |
| A phone call on the same phone | Android behavior | A live call owns the microphone; a page gets silence or `audio-capture`. It never heard even his own voice. |
| The spoken lesson he sent from the Notes lesson chip | live DB, voice-intake-health run 36048978519 | 1 lesson recording (`b1a79408`, 16:05:01Z, thinking-space) marked **voice-failed**; the failure report at 17:13:47Z; **0 transcripts** of any kind. |
| Rung 1: the tower's Whisper | same run, from the NAS; failure row `ffa896bb` | `tlcmediadpt:8771/health` **HTTP 000**. The failure row says why: `<urlopen error [Errno -2] Name or service not known>`. The bare name does not resolve on the NAS at all, so the tower was never reachable whether it was on or not. (The NAS's own `127.0.0.1:8771` is the reading-voice forwarder, not Whisper.) |
| Last rung: faster-whisper on the NAS CPU | same run | `ModuleNotFoundError: No module named 'faster_whisper'`; NAS Python **3.8.15**; the install was tried once at 10:45 local and would not retry for 24 h. pip's reason was hidden by `--quiet`. |
| The audio of that lesson | same run | kept: 1 file on the NAS, 1 object in the `lesson-audio` bucket. Nothing was lost; it was left for dead. |
| The meeting scribe's transcription | `WorkflowScribe.jsx`, `infra/nas-lesson-voice/install.sh` | Uploads to the `/scribe` route; its `scribe-transcribe` loop has no clock (recorded in DR-0611). Not end to end. |

## Impact

Nothing he said reached the app, and the app said nothing about it. A spoken lesson from the same day sat as "failed" with its audio intact and no path back. The same miss would hit every long note, every meeting and every phone.

## Decision

1. **The audio is the source of truth for a conversation.** On the Notes box, "Record a conversation" takes the place of "Listen to the whole thing" (combined, not duplicated: its job of hearing something played out loud is served better by a recording). Surfaces that keep no notes keep the old option. It is the scribe's own recorder (chunked, wake lock, 3-hour self-stop), with processing off and gain on, at 32 kbit/s so three hours fits the 50 MB upload ceiling.
2. **One tap of consent.** "Everyone here agreed. Start recording", stated with the Illinois all-party rule (720 ILCS 5/14), in the scribe's consent shape, stored with the note and tagged on its row.
3. **Never "recording" over silence.** The stream is measured (an AnalyserNode). Five seconds of true zeros shows: *"The phone isn't letting the app hear the microphone — a phone call may be using it. On a call, put it on speaker and record from a second device, or record after the call."* A refused mic (`NotReadableError`, `NotAllowedError`) is said in words.
4. **Stated honestly: a phone call cannot be recorded through the same phone's browser on Android.** The consent step says so and names the working path: the call on speaker, recorded on a second device.
5. **Saved on Stop, before any network call.** The note appears under Your thoughts at once, marked "Transcribing…". The audio is kept on the phone (IndexedDB) until it is sent. A failed send shows "kept on this phone but not sent yet (reason)" with Send again, and retries by itself.
6. **The words come back to the note, privately.** The recording goes to the private `lesson-audio` bucket under the person's own folder (its 0229 owner-folder policies fit, so no new bucket). One agent_inbox row tagged `note + voice + audio:<path> + note:<id> + consent:all-agreed` asks the NAS rider. **The rider writes the words to `<audio>.txt` in the same owner-only folder, never into agent_inbox** (every household member can read agent_inbox; a private conversation must not be broadcast), and files a proof row `note + voice-transcript + of:<row>` carrying only the word count, rung and model. The app sees the proof, reads the words, fills the note, and removes the `.txt`. Note rows never carry `lesson`, so they never reach the lesson reader or the hosted mirror.
7. **One rider, combined.** `lesson_voice_transcribe.py` serves both kinds. A `voice-failed` recording is retried once a rung answers again, and a retry that fails is never re-announced. A long recording on the CPU rung stops at the pass's deadline and resumes from the second it reached (`clip_timestamps`), so an hour is never lost to a 400-second pass.
8. **The tower is reached by a name the NAS can resolve**: its tailnet name `tlcmediadpt.tail5a2f35.ts.net:8771`, then its tailnet address `100.69.19.13:8771` (the candidates voice-studio's installer already uses). A rung that does not answer `/health` in 6 seconds is skipped, never waited on for the 900-second transcription timeout.
9. **The CPU rung is installed for real.** pip is upgraded inside the venv first (the venv pip on 3.8 cannot see the wheels), `faster-whisper<1.1` (the line that runs on 3.8), the attempt logged to `pip.log` for the witness, retried at once when the recipe changes, and the model kept in `$DATA/hf`. The transcription pass gets only what is left of the 480 s installer ceiling.
10. **Dictation stays, fixed.** Interim words show in the box while speaking. Nothing heard for 8 seconds says so instead of "listening". A session that wrote no words says *"The phone heard no words, so nothing was written and nothing was saved"* and offers "Record instead".

## Verification

- `record-a-conversation.test.jsx` (19), on the real Thinking Space with the real recorder hook, only the browser and network faked: record, consent, Stop, a saved note marked Transcribing, the rider's words fill it, the `.txt` removed. **Proven-to-catch:** a silent microphone (true zeros) shows the phone-call alert and a hearing one does not; a dictation session with no final words shows the no-words message (on the old code that element does not exist and Save silently does nothing); a signed-out send keeps the note with Send again. The e2e test caught a real defect before merge: `URL.createObjectURL` throwing inside the recorder's stop handler would have lost the recording; it is now guarded.
- `test_lesson_voice.py` (35, was 21): the note path (words to the owner's folder, proof-only row, never mirrored), the failed-row retry gated on a live rung and never re-announced, the two-pass resume, the install recipe.
- The live witness `voice-intake-health.yml` reads the live database and the NAS side (read-only, no bodies printed). The outcome after merge is recorded below.

## Verification after merge

Pending the first services-sync cycle after merge; recorded here in the follow-up commit.

## Limits, stated

- **Keeping the audio alongside dictation** (both at once) is not done: on Android the speech engine and a recorder cannot share the microphone, and trying risks breaking the dictation that works. The Record button is the fallback. re-review: 2026-10-08.
- **A recording the phone kills mid-way** (the app closed while recording) keeps only what the recorder flushed; chunks are held in memory, not written to the phone each minute. re-review: 2026-10-08.
- **The meeting scribe** (`WorkflowScribe`) still rides its own `/scribe` road with no clocked transcriber. It should join this rider. re-review: 2026-10-01.
- Speaker turns are not marked.
