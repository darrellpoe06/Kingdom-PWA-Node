---
id: DR-0655
title: Every voice is choosable — the studio, every house voice the NAS reports, and every phone voice, in one list, each telling the truth about itself
status: accepted
date: 2026-09-25
tier: A
type: defect
declared_by: Darrell
scope:
  - app/src/lib/tts.js — the utterance carries the picked voice's language (Android honours the pick)
  - app/src/lib/reading-voice.js — picks are stamped; a stale account value never overwrites a newer pick; house voice ids
  - app/src/lib/use-read-aloud.js — one catalog (studio, your voices, house, phone), a picked house voice reads in that model, tap-to-hear, no dead phone voice on a device with none
  - app/src/lib/voice-service.js — fetchHouseVoices reads /voice-lite/voices
  - app/src/components/VoicePicker.jsx (new) — the one picker both surfaces use
  - app/src/components/TTSControl.jsx, app/src/components/ReadingVoiceControl.jsx — use it
  - infra/nas-voice-lite/voice_lite_server.py, infra/nas-voice-lite/install.sh — nine house voices, /voices, aliases kept
  - app/src/__tests__/a-phone-voice-pick-is-honored.test.jsx, app/src/__tests__/every-voice-is-choosable.test.jsx (new)
principles: [VERIFICATION-DOCTRINE (DR-0076), APP-IS-PRIMARY (DR-0065), HOLD-THE-HAND (DR-0621), DO-THE-WORK (DR-0111), DECISION-RECORDS (DR-0011)]
grounds:
  - DR-0627 — the NAS's own audio voice (/voice-lite), which keeps playing when you switch apps
  - DR-0633 — the reader plays like a radio
  - DR-0138 — a stand-in is labelled, never silent
source: 2026-09-25 00:20 UTC — Darrell, verbatim, on his Android phone, then of his Firestick
---

## Context

Darrell, 2026-09-25, 00:20 UTC, on his Android phone, in The Love Corner → Church → Learn, with the Read Aloud panel open on Living Lesson 191 at 1.5x. The panel said "Ready · stand-in voice, the studio is offline." He wrote, verbatim:

> "I can only pic this fake dying voice!!!!!! Why limitations are built into the app!!!!! Fix it!!!!!"

After picking another voice: "I did it didn't work!!!!! ... Obviously". Then he asked whether it still works on his Firestick.

The "dying" sound itself (long pieces degrading in Piper) belongs to another lane (`clip-queue.js`, DR-0653). This record is about the **choice**.

## What was measured

Traced on main at 481531c9. file:line is as it stood there.

- **The phone ignored the pick.** `lib/tts.js:357` set `utterance.voice` and never `utterance.lang`. Chrome on Android chooses the engine voice from the language, so every pick spoke in one default voice. His Android names voices by locale ("English United States (en_US)"), as `voice-assignment.js:251-261` already records from 2026-09-22 ("Nothing changed the actual voice from the same female no matter what I pick"). *Not observed on his phone from here.* The test reproduces it with a fake voice list shaped like his.
- **A stale account value took the pick back.** `lib/reading-voice.js:97-105` adopted the account's `reading_voice_id` whenever it merely differed from this device's pick. The account write (`:72-75`) is best-effort, and supabase-js answers a refused write with an error object instead of throwing. So the old voice stayed on the account, and the next reader to mount put it back.
- **Only English phone voices were offered.** `lib/use-read-aloud.js:181-182` filtered the phone's voices to `/^en/`.
- **The house voices were never named.** The NAS served two Piper voices (`voice_lite_server.py:66-69`: male = en_US-ryan-medium, female = en_US-amy-medium). The app reached them only implicitly, by gender: `use-read-aloud.js:317-323` (`liteVoiceFor`), behind the System voice and a person's stand-in (`:538`). "System voice" therefore quietly meant Ryan while the studio was dark, which is the voice he called fake. Nothing let him pick another.
- **Groups were hardcoded.** `components/TTSControl.jsx:1125-1126` and `components/ReadingVoiceControl.jsx:30` rendered only `['Default', 'Your voices', 'Voices & accents']`. A group not in that list would silently vanish.
- **No way to hear before choosing in the reader panel.** Only the settings variant had "Test", and it read in the already-saved pick.
- **Fire TV (Silk).** It exposes speechSynthesis with an empty voice list (`use-read-aloud.js:567-606`). A phone voice picked on the Android phone follows the account to the Firestick. Read there, it went to a device path that cannot speak.
- **The house voice candidates.** All seven named voices, plus ryan and amy, are listed in rhasspy/piper's own `VOICES.md`, which indexes the `rhasspy/piper-voices` v1.0.0 files at `en/<locale>/<speaker>/<quality>/<name>.onnx` (+ `.onnx.json`). Hugging Face itself is blocked from the sandbox (proxy 403), so the file sizes were not measured here. The installer's `curl -f` and its on-box synthesis probe re-verify every file on the NAS.

## Impact

Every Android listener who picked a phone voice heard the same default voice anyway. Every listener with a failed account write had their pick quietly undone. No listener could choose among the NAS's voices, and there were only two. On a Fire TV, a phone voice picked elsewhere could leave the reader silent.

## Decision

1. **A pick is honoured and remembered.**
   - The utterance carries the picked voice's language (`utteranceLangFor`, `en_GB` → `en-GB`).
   - Picks are stamped (`at` locally, `reading_voice_at` on the account). The account's pick replaces this device's only when it is newer, or when this device has never picked (`remoteVoiceWins`).
   - A picked phone voice missing on this device is said, never swapped in silence.
2. **One list, every voice, each with a one-line truth**, in this order:
   - **Church studio voice**, with its honest state (up / offline now / not answering yet) and what reads in its place.
   - **Your voices** (cloned, consent-gated as before).
   - **House voices (church server)**: exactly what the NAS reports at `/voice-lite/voices`, never a painted list. When the NAS does not answer, a disabled line says so. A picked house voice that cannot answer stays visible with that state.
   - **Phone voices**: every voice the engine reports, English first, then natural/Google, then US English, then by name. Nothing is filtered away.
   - Each entry's line says whether it keeps playing when you switch apps. House and studio voices do; phone voices stop on Android.
3. **A house voice picked is that model.**
   - `read()` sends its id to `/voice-lite/speak`.
   - If the NAS cannot voice it, the phone reads and the status says "phone voice, the house voice is not answering".
4. **More and better house voices** (`voice_lite_server.py` `VOICES`, `install.sh` `HOUSE_VOICES`, kept identical by a test):
   - en_US ryan-medium, amy-medium, lessac-medium, joe-medium, hfc_male-medium and hfc_female-medium; en_GB alan-medium and northern_english_male-medium; en_US ryan-high.
   - `male`/`female` stay as aliases.
   - A model counts as installed only with its `.onnx.json` beside it.
   - `/voices` answers the installed list with label, gender, accent, quality and note.
   - The high model is **labelled** slower (more NAS CPU per paragraph), never blocked.
5. **Hear before choosing.** Picking a voice plays a short sample in it, unless a reading is under way. "▶ Hear it" replays it. `preview(id)` reads in a voice without changing the pick.
6. **Fire TV.**
   - A device that reports no voices shows the studio and house groups and no empty phone group.
   - The default reads as NAS audio.
   - A phone voice picked elsewhere reads in the NAS voice there, and says why.
   - The picker is a native `<select>` and a `<button>`, both focusable with a visible focus ring, so a remote's D-pad and Enter work it.
7. **One picker.** `VoicePicker.jsx` serves the reader panel and the header/settings control. Groups render in the catalog's own order. The header picker no longer hides on a device without a speech engine, since the house voices play there.

**What the NAS does on its next services-sync.** `install.sh` runs from the manifest (`infra/nas-loops/services.json`, entry `voice-lite`):
- It downloads each missing `.onnx.json` (small) and at most **one** `.onnx` model per cycle, in the order above. Ryan and amy are already there, so the seven new models arrive over the next seven cycles.
- It proves each model once by synthesizing "In the beginning was the Word." and marks it `.proven`. A model that cannot speak is removed and downloads fresh next cycle.
- The server reads the disk on every request, so each voice appears in the app's list as soon as it lands. No restart is needed.

## Verification

- `a-phone-voice-pick-is-honored.test.jsx` (5), against the real hook and engine with a fake Android voice list:
  - the picked voice speaks with `lang` `en-GB` and is not routed to /voice-lite;
  - the pick survives a remount while the account still holds the old voice;
  - a newer pick from another device still follows;
  - a cold voice list waits and uses the pick;
  - a missing pick is said.
  - **Proven to catch:** `tts.js` from main → 2 red (`expected '' to be 'en-GB'`); `reading-voice.js` from main → 1 red (`expected 'person:darrell' to be 'English India (en_IN)'`); `use-read-aloud.js` from main → 1 red. Shipped first as PR #1813.
- `every-voice-is-choosable.test.jsx` (19):
  - the house list is exactly the server's answer, and a different answer gives a different list;
  - a silent NAS is a disabled line;
  - every entry has a note, and high is labelled slower;
  - the studio state is honest;
  - a house pick reaches the NAS as that model, without a phone voice over it;
  - the house pick persists across a remount;
  - a house voice that fails falls to the phone and says so;
  - a sample does not change the pick;
  - every phone voice is offered, ranked;
  - Fire TV: no empty phone group, the default is NAS audio, and a phone pick from another device reads in the NAS voice;
  - the server's VOICES and the installer's HOUSE_VOICES are identical and each is in the verified list;
  - the picker saves and samples on pick, never samples over a reading, shows every group in order, and is remote-workable.
  - **Proven to catch, each run:**
    - a painted house list → 6 red;
    - `liteVoiceFor` ignoring house ids → the house-pick tests red;
    - the studio default skipping the NAS → "the default fell to the device voice instead of the NAS";
    - the no-voice device guard removed → "the phone pick went to a device with no voices";
    - the `/^en/` filter restored → the phone test red;
    - no sample on pick → the picker test red;
    - no save on pick → both persistence tests red;
    - a voice dropped from install.sh → the drift test red.
- `voice_lite_server.py --selftest`: 28 checks, 13 of them new (model-id picks, both aliases, `/voices` content, order and 503, mid-download listing, the not-yet-downloaded fallback, the config-beside-model rule). **Proven to catch:** `resolve_voice` ignoring model ids → "FAIL a voice picked by model id reaches the synthesizer".

**His 20-second test:** open the Read Aloud panel, pick "Alan · British man" under House voices. It speaks a sample in Alan. Tap Read this page and switch apps; Alan keeps reading. Pick a Google or English phone voice; the sample is in that voice.

re-review: 2026-10-02 — after seven services-sync cycles, all nine house voices listed live, and his phone test.
