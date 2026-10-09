# DR-0801 — Every voice keeps its own pitch, so one voice is several readers

- **Status:** accepted
- **Tier:** A (a control added and a per-voice memory; the engine, the catalog and the Scripture cast's own pitches are unchanged)
- **Type:** feature
- **Date:** 2026-10-07
- **Scope:** `app/src/lib/voice-shape.js` (new), `app/src/lib/tts.js` (`setPitch` exposed from `useTts`, the pref persisted as rate already was), `app/src/lib/use-read-aloud.js` (`pitch`, `setPitch`, `stepPitch`; a voice's shape applied when it is picked and on every read), `app/src/components/TTSControl.jsx` (the five steps in the tall panel; one cycling button in the TV rail), `app/src/lib/reader-controller.js` (`pitch` joins the right rail), test `a-voice-you-shape.test.jsx`
- **Principles:** DR-0800 (a rail control is one cycling bar button), DR-0721 (my own voice, said plainly), DR-0076 (measure, don't claim), DR-0075
- **Grounds:** Darrell 2026-10-07, on the Firestick: *"Can we choose different male and female voices... different pitches... or even a pitch and other voice kpi sliders to get a unique voice that has the right sound for each individual?"* and, in the same breath, *"I only see one option other than my own that doesn't work yet until the 4070 does something... correct?"*

## Context

SHOULD: a listener picks a voice that sounds right to them. ARE: the picker offers three groups (`use-read-aloud.js:285`) — the System voice, the household's own recorded voices, and "Voices & accents", which is **whatever `speechSynthesis.getVoices()` returns on that device**, filtered to English. A TV browser returns few or none, so on a Firestick the list really is one entry plus his own, and his own needs the studio answering. GAPS: three. (1) He is right, and nothing in the app said so. (2) The Web Speech API has **no gender field** — male and female come only from which named voices a device offers, so "choose a male or female voice" cannot be a setting we expose; it is a consequence of the device. (3) The engine has carried a pitch since it was written — `engine.pitch`, `u.pitch`, `setPitch`, a saved pref — and the Scripture cast already tells its characters apart with it (`voice-assignment.js` `standInPitch`), but **nothing ever exposed a control**, so the saved pitch could never change from 1.0. CLOSE: below.

## What was measured

| what | measured | basis |
| --- | --- | --- |
| what the picker can offer | 1 System voice + consented person voices + every English `speechSynthesis` voice the device reports | `use-read-aloud.js:285-307` |
| gender as a setting | not available — the Web Speech API exposes `name`, `lang`, `localService`, `voiceURI`, and no gender | the spec; the catalog stores no gender either |
| pitch already in the engine | `engine.pitch` applied to every utterance (`tts.js:427`), `setPitch` (`tts.js:647`), saved in the pref (`tts.js:240`) | read in source |
| pitch reachable by a listener before this | none — `useTts` returned `setRate` and `setVoiceURI`, never `setPitch` | `tts.js:810` as it stood |
| distinct readers after this, on a device that reports one voice | 5 (one voice × five named steps) | `distinctVoices`, pinned on his own case in the gate |

**Honest uncertainty.** The Firestick's own voice list was read from the code path, not from his device — this sandbox has no route to poetech.us and no TV. That one engine voice at five pitches reads as five tellable-apart readers is a claim about how it sounds; the gate proves the pitch reaches the utterance, and his ear is the judge of the rest. Whether the studio can mint real male and female sovereign voices is a separate matter waiting on the 4070, untouched here.

## Impact

Unresolved: the only way to change how a reading sounded was to pick a different voice, and on a TV there was no different voice to pick — so the answer to *"can we get the right sound for each individual?"* was no, on the device where it was asked. The engine could do it the whole time and nothing could ask it to. Resolved: five named pitches, kept **per voice**, so one engine voice is five readers a listener can tell apart, with no studio and no 4070; the Scripture cast's own per-character pitches still win where they apply.

## Decision

1. **Pitch is a setting, and it belongs to the voice.** `voice-shape.js` keeps `{ pitch }` per voice id on the device. Picking a voice brings its shape back; shaping a voice back to Natural forgets it rather than storing a default.
2. **Five named steps, not a slider.** Deepest · Deeper · Natural · Lighter · Highest. A remote's D-pad cannot drag a slider; it can land on a chip, and it can tap one button that cycles. The tall panel shows all five; the TV rail shows one button whose word IS the step (DR-0800).
3. **The engine is asked, not reimplemented.** `useTts` now exposes `setPitch` exactly as it exposes `setRate` — it sets the live engine, which restarts the current sentence, and persists the pref. A read uses the shaped pitch unless a cast stand-in has set its own.
4. **What cannot be done is said, not implied.** Male and female are not a setting we can offer: the Web Speech API has no gender, and the voices a device lists are the voices there are. This record is where that is written down.

Proven to catch (DR-0076): a pitch set on the engine lands on the utterance, measured against a fake synth that records what it was handed; a non-numeric pitch never reaches the utterance; rubbish, an array, a string pitch and an out-of-range number in storage all read as no shape or a clamped one, never a crash; a storage that throws on read and on write is survived; a voice shaped to Natural leaves no row and no file; two voices hold two different sounds; the rail button's word moves with the setting and the shape is written.

## Verification

- `a-voice-you-shape.test.jsx` green, with the engine measured against a fake synth; the rail gates (`the-sides-look-like-the-buttons-below`, `reader-controller-pulls-out-on-tv`) green with `pitch` on the right rail.
- On the Firestick after deploy: open a lesson, press the sound button on the right side, hear the same voice read deeper, and confirm it is still deeper after switching away and back.
- re-review 2026-10-21: whether five steps are enough, whether speed should be kept per voice the same way, and — when the studio answers — whether real male and female sovereign voices make the pitch steps a refinement rather than the whole lever.
