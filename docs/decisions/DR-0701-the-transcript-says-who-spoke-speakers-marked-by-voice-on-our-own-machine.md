# DR-0701 — The transcript says who spoke: speakers marked by voice on our own machine

- **Status:** accepted (built and proven; armed on the NAS by Darrell's step below)
- **Tier:** B (a new local model on the NAS, off until armed; no cloud, no new door)
- **Type:** pipeline + ways
- **Date:** 2026-09-30
- **Scope:** `infra/nas-lesson-voice/speaker_turns.py` (new, pure), `diarize_local.py` (new), `name_voice.py` (new), `test_speaker_turns.py` (new), `lesson_voice_transcribe.py` (timed segments kept, the speaker step, the header), `install.sh` (armed-only install); `infra/nas-lesson-builder/lesson_writer.py` (WHO SPOKE rules, row rules) + `test_lesson_builder.py`; `app/src/lib/lesson-inbox.js` + `app/src/components/LessonInbox.jsx` (turns shown with their labels) + `the-transcript-says-who-spoke.test.jsx`; `infra/nas-loops/services.json`; `.github/workflows/ci.yml`; `docs/00-foundations/_root/COLG-SERMON-INTAKE.md`.
- **Principles:** VERIFICATION-DOCTRINE (DR-0076), SOVEREIGNTY (DR-0132), THE-APP-IS-THE-PRIMARY-ARTIFACT (DR-0065), HOLD-THE-HAND (DR-0621), DECISION-RECORDS; DR-0611 (the Whisper ladder), DR-0698 (the witnesses), DR-0700 (members named in public church sessions).
- **Grounds:** Darrell, 2026-09-30, verbatim: *"Differentiate between speakers... Bishop Gwin is BG... Darrell Poe is DP... etc..."* / *"Other congregation members are called by BG..."* / *"Make sure our process can tell who's talking moving forward... makes sense?"* / *"I'm DP of course...."*

## Context

The Whisper ladder (DR-0611) writes one block of words. A recorded class has many voices, and L202 had to be attributed by hand from context (DR-0699). Darrell asked that the process tell who is talking from now on.

## What was measured

- **The choice: sherpa-onnx**, local and light: onnxruntime only (no torch), models from the k2-fsa/sherpa-onnx GitHub releases with no account and no gated download (pyannote.audio's own models need a Hugging Face token; whisperX needs torch). pyannote segmentation 3.0 (6.9 MB archive) finds who speaks when; NeMo TitaNet small, English (40 MB) gives one voice vector per voice. A **cp38 manylinux2014 wheel exists** (`sherpa_onnx-1.13.8-cp38`, downloaded and inspected), so the NAS's Python 3.8 venv can take it.
- **Proven on a real recording** (sherpa-onnx's four-speaker test file, 56 s, real speech), with the shipped `diarize_local.py` in this sandbox: the clustering threshold 0.5 split four voices into 8; **0.9 gives exactly four**, the pattern 0 1 1 2 0 3 3 3 2 0 over ten turns, in 27 s of CPU. The default is 0.9 (tunable, `SPEAKER_CLUSTER_THRESHOLD`; `--speakers N` when the count is known). **Voiceprint matching, end to end:** a voiceprint enrolled from ONE turn of voice 0 (0.32 to 6.87 s) was recognised in its other turns at 0:22 and 0:52 (cosine 0.866 against 0.18 to 0.32 for the other voices), and the transcript came out `BG: …`, `S1: …`, `S2: …`, `BG: …`, `DP: …` with the header naming both. `name_voice.py --list` on the same file printed the four voices with their talk time and first turns. The words were placeholders: Whisper's model download (Hugging Face) is blocked from this sandbox, so the words half is proven by the tests with the CPU rung's real segment shape, and on the NAS by Darrell's step.
- **Not measured here:** the NAS's own speed. The Whisper CPU rung already spans passes; the speaker step needs `SPEAKERS_MIN_SECONDS` (150 s) left in a pass, or it keeps the words and marks the speakers on the next pass.

## Impact

A recorded class arrives as turns: `BG:` the teacher, `DP:` Darrell, `S1`, `S2` everyone else until named, `?` where no voice could be placed. The lesson builder attributes each line to its label, "Your lessons" shows the labels, and a lesson no longer has to be attributed by hand from context.

## Decision

1. **Where it runs:** on the NAS, beside the Whisper CPU rung, over the audio the NAS already keeps; the same module runs on the 4070 tower unchanged if it moves. Nothing leaves the NAS.
2. **The format** (pinned in `test_speaker_turns.py` and read by `lesson-inbox.js`): the Whisper line, then `Speakers: marked by voice on our own machine. BG = Bishop Gwin; DP = Darrell Poe. S1, S2 = voices not yet named.`, then one `S1 = Name (Bishop Gwin called them by name just before they spoke).` line per voice BG called on, a blank line, and one `LABEL: words` line per turn. Unarmed or failed: `Speakers: not marked…` and the words exactly as before. "These are his words" became "These are the words": a class has more than one voice.
3. **The rules:** a known voice is named only by its enrolled voiceprint, one voice to one print, above 0.55 cosine; every other voice is S1, S2 in order of first appearance; a member is named only when BG's turn is nothing but a name and that voice speaks next, and the name goes in the header while the lines keep the S label; whether a lesson may USE a member's name is the builder's rule (DR-0700). Nothing is guessed.
4. **Tags:** `speakers:marked` plus `voice:BG` / `voice:DP` for known voices heard, or `speakers:unmarked`; the builder's row rules read them, and a row tagged `church-session-public` lets the builder name members as the teacher calls them.
5. **Inactive until armed:** `LESSON_VOICE_SPEAKERS=1` in `/volume1/PoeTech/secrets/lesson-voice.env` installs the wheel and the two models on the next services-sync cycle and turns the step on. Enrolling BG and DP needs a person who knows the voices, so it is Darrell's step (below). Brakes are the lane's own (DR-0248): the 400 s pass budget, the single-flight lock, and a failure that leaves the transcript unmarked, never lost.

### Darrell's step (paste into PowerShell)

```
cd C:\Users\dpoe\Kingdom-PWA-Node
ssh -t dpoe@192.168.1.26 "echo LESSON_VOICE_SPEAKERS=1 | sudo tee -a /volume1/PoeTech/secrets/lesson-voice.env"
ssh -t dpoe@192.168.1.26 "sudo sh /volume1/PoeTech/repos/Kingdom-PWA-Node/infra/nas-lesson-voice/install.sh"
ssh -t dpoe@192.168.1.26 "cd /volume1/PoeTech/repos/Kingdom-PWA-Node/infra/nas-lesson-voice; sudo LESSON_VOICE_DATA=/volume1/PoeTech/lesson-voice /volume1/PoeTech/venvs/lesson-voice/bin/python name_voice.py --audio /volume1/PoeTech/lesson-voice/audio/c2a6c39a-ae99-4ff7-83c6-b927e2e7f1cc/20260930T190238Z-qbkcyo.webm --list --whisper base"
```

Read the list; then name the two voices you know by their numbers (for example voice 0 is Bishop Gwin, voice 2 is you):

```
cd C:\Users\dpoe\Kingdom-PWA-Node
ssh -t dpoe@192.168.1.26 "cd /volume1/PoeTech/repos/Kingdom-PWA-Node/infra/nas-lesson-voice; sudo LESSON_VOICE_DATA=/volume1/PoeTech/lesson-voice /volume1/PoeTech/venvs/lesson-voice/bin/python name_voice.py --name 0=BG --name 2=DP"
```

## Verification

- `test_speaker_turns.py` 16 tests, `test_lesson_voice.py` 40 (all green, both in ci.yml): the format; every line parses and a bad line is refused; **proven to catch**: with no voiceprints nobody is BG or DP; a weak match stays unknown; one print names one voice; a name said by a non-teacher, a teacher's sentence, a known voice, and two names for one voice each name no one; words no voice covers are `?`, not guessed; the transcriber writes the marked body and tags when armed, the old body with an honest header when not, keeps the words when the diarizer fails, and carries a pass short of time to the next pass without re-transcribing.
- `test_lesson_builder.py` 88 green, with the WHO SPOKE rules and the public-session line proven absent from rows that are not public church sessions.
- `the-transcript-says-who-spoke.test.jsx` 4 green: the app parses the marked shape, never half-parses an unmarked one, and shows each turn with its label.
- The real-recording run above (`diarize_local.py`, `speaker_turns.py`, `name_voice.py` against a real four-speaker file).
- `re-review: 2026-10-14` — after Darrell's step: the first class recorded with speakers marked, and the threshold checked on BG's and DP's real voices.
