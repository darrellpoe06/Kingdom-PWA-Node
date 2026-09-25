---
id: DR-0636
title: A spoken lesson really records, the box's one Send sends it, and the words come back to the speaker — measured in a real browser, never "recording" over silence, never an empty box, never a hidden transcript
status: accepted
date: 2026-09-24
tier: B
type: defect
declared_by: Darrell
scope:
  - app/src/components/VoiceLessonRecorder.jsx (rides the shared recorder; level bar, bytes captured, silence alert with Start again, verdict; no second send)
  - app/src/components/OneVoiceInput.jsx (one Send for a spoken lesson; the box is never empty; Your lessons under the Lesson recorder)
  - app/src/lib/workflow-scribe.js (timeslice, bytes, live level, meter context made in the tap and held, five looks a second, takeVerdict)
  - app/src/lib/voice-dictation.js (releaseSpeechRecognition: one microphone, one holder)
  - app/src/lib/lesson-inbox.js + app/src/components/LessonInbox.jsx (the jsonb filter, the hidden parent row, words shown, back to the box)
  - scripts/system-flow-registry.mjs (spoken-lesson-loop)
  - scripts/mic-record-probe.mjs + .github/workflows/ci.yml (the real-Chromium microphone probe)
principles: [HOLD-THE-HAND (DR-0621), VERIFICATION-DOCTRINE (DR-0076), REALITY-TRACE (DR-0061), DECISION-RECORDS (DR-0011)]
grounds:
  - DR-0611 — the spoken-lesson road
  - DR-0624 — the recorded conversation and its shared recorder
  - DR-0615 — Your prompts, whose put-in-the-box road Your lessons now shares
  - DR-0622 — the flow graph that declares the loop
source: 2026-09-24 4:41pm — Darrell on his Fold, Church → Speak → Lesson chip, with a screenshot, then three follow-ups through the coordinator
---

## Context

Darrell, 2026-09-24 at 4:41pm on his Fold: the Lesson recorder's clock read "0:22 / 30:00" with "Send the spoken lesson" and "Discard" showing and no playback. *"Doesn't work!!!!!!"*, *"Never recorded"*, *"Can't push send because nothing populated in the text box... make sense?!!!"*, and *"never saw anything any text... nothing"*.

## What was measured

| what | where | measured |
| --- | --- | --- |
| The old lesson recorder | `voice-recording.js` `useVoiceRecorder` | `mr.start()` with no timeslice, no level, no byte count, no release of the Speak button's hold on the microphone, and Send offered for an empty take. The clock ticked whether or not anything was heard. |
| The two sends | `OneVoiceInput.jsx` | The main Send was `disabled={!text.trim()}` and the recorder never wrote into the box, so after speaking the main Send stayed dead; a second "Send the spoken lesson" sat inside the recorder. |
| The meter, in a REAL Chromium (`scripts/mic-record-probe.mjs`, fake microphone) | first run | Chromium's built-in fake microphone read **true zeros** through Web Audio for the whole 5 s while the recording decoded to a peak of 1.08. Fed a voice-level tone instead (`--use-file-for-fake-audio-capture`): **21,135 bytes in 5 s, decoded peak 1.00, level bar 100% → 75%, playback shown, verdict ready**. Muted microphone (the selftest): **1,401 bytes, decoded peak 0, the silence alert shown, "Nothing was recorded — the microphone gave only silence…"**. |
| Your lessons, the read | `lesson-inbox.js` | `.contains('tags', ['lesson'])` is sent as `cs.{lesson}`, which is not JSON; `tags` is jsonb, so the read is refused every time. And the rider tags a failed parent `voice-failed`, which the list used to hide: Darrell's own lesson `b1a79408` was invisible on both counts. Its transcript `9f70cd51` (21:33 UTC, 1:07, NAS CPU) existed with no surface showing it. |
| Where Your lessons appeared | `ThinkingSpace.jsx` only | Not under the Church Speak box's Lesson recorder, where he sent it. |

## Impact

He spoke a lesson and saw a clock, a dead Send, and nothing afterwards. A lesson that WAS written down by Whisper still showed him nothing.

## Decision

1. **The lesson recorder rides the conversation recorder** (one recorder, DR-0621 combine): audio handed over every second, a live level bar, "N KB captured", the Speak button's speech engine stopped before the microphone is asked for (`releaseSpeechRecognition`), and a 3-second rule: silence or no bytes is said on the surface with the likely cause (a call, another app, or the Speak button) and one tap to **Start again**.
2. **Never "recording" over silence, and never "silence" over a recording.** The meter's AudioContext is made inside the tap and resumed, its source node is held, it looks five times a second, and a second with no reading counts as unknown, never as silence.
3. **An empty or silent take says "Nothing was recorded — <why>" and is never offered to Send.** Any take with audio has playback.
4. **One Send.** While recording, the box reads "Recording your lesson… 0:22" (and Send waits for Stop). On Stop it reads "Spoken lesson, 0:22 (the words come back from Whisper)" or keeps the words typed, and the box's own Send, labelled "Send the lesson", sends the recording plus any typed words. The recorder has no send button.
5. **The speaker sees what happened.** Your lessons (the speaker's own rows, filtered by `created_by`) shows under the Lesson recorder as well as on the Notes tab: received, waiting for Whisper, the words Whisper wrote (shown, not hidden), or why it failed and that it is tried again by itself. "Put these words in the box" hands the words back, on the Your prompts road.
6. **The loop is declared**: `spoken-lesson-loop`, lesson door → Whisper rider → Your lessons → the box, closed in the flow graph.
7. **The Speak button** shows "Listening… your words appear here as you speak." in the empty box while it listens, plus DR-0624's interim words and plain no-words message.

## Verification

- `spoken-lesson-one-send.test.jsx` (11), on the real Speak box with the real recorder hook and fakes that behave like the real things (a recorder that hands audio over each timeslice, a muted microphone that reads zeros, PostgREST refusing a non-JSON jsonb filter): record → the box is never empty → Stop → Send enabled → it sends (**proven-to-catch**: removing the box's lesson line fails it); a silent microphone → the alert in 3 s and "Nothing was recorded", no Send; typed words ride along; the Speak button's hold is released; a transcript that exists is shown under the recorder (**proven-to-catch**: it failed before the parent-row fix); a member sees only their own rows and Darrell only his; a failure shows its reason; the words go back to the box and the loop closes.
- `lesson-voice.test.jsx` recorder block rewritten (10): timeslice + meter + consent requested; the level bar and bytes; 3 s of no bytes and 3 s of zeros each said (2 s not yet); the verdict; playback vs "Nothing was recorded"; no second send.
- `scripts/mic-record-probe.mjs` in CI after the read-highlight probe: the real component in real Chromium, and its selftest proves it can tell a muted microphone from a working one.

## Limits, stated

- **A live draft from speech while recording** is not attempted: on Android the speech engine and the recorder cannot share the microphone, and trying would risk the recording itself. The box says what is happening instead; the real words come from Whisper. re-review: 2026-10-08.
- Household members can read one another's agent_inbox rows under the existing RLS (0127, instance-wide read); Your lessons shows only the speaker's own. Narrowing the policy is a schema decision. re-review: 2026-10-08.
- A lesson row is marked built into a lesson only on the hosted mirror (`lesson-captured`), which the app does not read; "with the lesson reader" is shown, not the finished lesson's name.
