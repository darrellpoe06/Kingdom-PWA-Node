---
id: DR-0654
title: The Firestick reads aloud, and one reading keeps one voice
status: accepted
date: 2026-09-25
tier: B
type: defect
declared_by: Darrell
scope:
  - app/src/lib/use-read-aloud.js — the family key before any NAS read; one voice element unlocked in the tap; the NAS voice's reason kept and said; no Web Speech hand-off while the page is hidden; one hand-off function; a reading pins its voice
  - app/src/lib/voice-service.js — a miss rests the NAS voice for as long as its cause lasts; a new key reopens it; a dropped request is asked again; the reason in words
  - app/src/lib/reading-voice-pin.js (new) — the pinned voice, pure
  - app/src/lib/tts.js — a refresh of the voice list never changes the voice of a reading in progress
  - app/src/__tests__/firestick-reads-aloud.test.jsx (new, 12 checks); sovereign-voice-default.test.js (one pin moved to the hand-off)
principles: [VERIFICATION-DOCTRINE (DR-0076), HOLD-THE-HAND (DR-0621), REALITY-TRACE, DO-NOT-RE-ASK (DR-0111)]
grounds:
  - DR-0574 — the key provisions itself before the read (it covered the cloned voice only)
  - DR-0627 / DR-0633 — the NAS voice as real audio; the reader plays like a radio
source: 2026-09-25 ~00:40 UTC — Darrell on his Fire TV Stick (Silk), then on his Android phone
---

## Context

Darrell asked, "Will this work with the Firestick still?" and "We want the voice on too... can it read?!" On his Fire TV Stick, in Silk, in The Love Corner → Learn → Living Lessons, he pressed **Read this lesson**. The panel said: *"This device has no voice of its own, and the church's voice service did not answer."* Nothing was heard.

The same evening, on his Android phone, he reported that the reader *"stopped working in the background"* again, and: *"Reading with two voices at times and the voices change on their own at times... female to male etc.. different female voices."*

## What was measured

- **The NAS voice was up.** voice-lite-probe run 36079165210 on main at 00:48 UTC passed: a synthesis took about 1 s, and so did the call through `https://poetech.us/voice-lite`.
- **The Firestick, reproduced.** Chromium with a Silk user agent, a 960×540 viewport at DPR 2, `speechSynthesis.getVoices()` returning `[]`, a local `/voice-lite` that requires the bearer, and the family key waiting at `get_family_bridge_token`:
  - Before: one POST to `/voice-lite/speak` with **no Authorization header**, a 401, nothing heard, and the studio blamed.
  - After: every request carries `Bearer <family key>` and the NAS audio plays. The highlight moved through 5 sentences in 5 seconds.
- **The cause.** DR-0574 put the key request inside the cloned-voice branch only. The **System voice**, the default nobody changes, went to `/voice-lite` with whatever key the device happened to hold. A device that had never opened Real Estate, Taxes, the Gallery or the Voice studio held none. Silk reports no device voices, so the fallback was silence.
- **Two voices, and the voice changing.** On a phone profile with a man's and a woman's device voice:
  - A hand-over from the phone voice to the NAS voice started the NAS clip while Web Speech was still speaking. `read()` stopped only the audio, never the phone's voice.
  - The NAS voice for the System voice is a woman's. The phone's System stand-in resolved to a **man's** voice (`en-us-male`). So a failed NAS piece handed the rest of a woman's reading to a man.
  - A studio clip's `onerror` spoke its text in the phone's voice even after the clip had been torn down.
  - **The voice list refreshing mid-reading restarted the sentence in another voice.** Android fires `voiceschanged` more than once. On each refresh `tts.js` set the engine back to the saved default, and `setVoice()` restarts the sentence being spoken. With a saved default of `en-gb-female` and the reading in its own voice, one refresh restarted the sentence as `en-gb-female`. That is "different female voices". `use-read-aloud.js` also re-applied the phone pick on every refresh (the voice-choice agent's flag).
- **The background.** A failed NAS piece handed the rest to Web Speech even with the page hidden, and Android stops Web Speech in the background. One slow piece rested the NAS voice for a flat 2 minutes, and every read in that window went to Web Speech.

## Impact

A Firestick could not hear a lesson at all unless that device had once opened a page that happened to fetch the key. On a phone, a reading could speak in two voices at once, switch from a woman to a man mid-lesson, and stop in the background after one slow piece.

## Decision

1. **The key before any NAS read, whatever the voice.** `read()` asks the family for the key before the System voice or a person's voice goes to the NAS. A new key reopens a road rested by a 401 at once.
2. **The reason is kept and said.** No key: sign in on this screen. Slow: longer than 15 seconds. Busy. The route is missing. The screen would not start the sound. The studio is no longer blamed for the NAS voice's answer.
3. **A miss rests the voice for as long as its cause lasts.**
   - A busy NAS (503) or a refused play: no rest.
   - A slow answer: 30 s.
   - A dropped road: 45 s.
   - A locked door or a missing route: 2 min, reopened by a new key.
   - A dropped request (a network blip, a 5xx) is asked again twice before the reading gives up on it.
4. **One voice element, unlocked inside the tap.** It is made and played silent while the gesture is live, and the queue reuses it.
5. **One voice at a time.** Before an audio voice starts, the phone's voice is stopped. Silencing an audio voice detaches its handlers and drops its source, so a torn-down clip cannot start a second voice. Every hand-off to the phone's voice goes through one function.
6. **One reading, one voice.** A reading pins its voice when it starts: the gender, and once chosen, the one device voice. Jumps and hand-overs keep the pin. A fallback speaks in a device voice of the pinned gender and says so in one line. If the phone has no voice of that gender, the line says that too. A cold, empty voice list is waited for rather than defaulted.
7. **Nothing goes to Web Speech while the page is hidden.** The place is held and shown as paused. It resumes in the NAS voice when the page is seen again, or when Play is pressed.
8. **A voice-list refresh never touches a reading.** The default voice is resolved again only while nothing is being read. A new pick still applies at once, mid-reading. A refresh of the same pick waits.

## Verification

- `firestick-reads-aloud.test.jsx` has 13 checks against the real hook, the real `synthesizeLite` and the real clip queue.
  - 12 fail on origin/main's `use-read-aloud.js` + `voice-service.js` + `tts.js`, each on its own assertion:
    - no key on the first request (`''` vs `Bearer fam-key`);
    - "did not answer" instead of the sign-in line;
    - a new key did not reopen the road;
    - the first clip refused on a strict-gesture engine;
    - no "press play once more";
    - one 502 ended the reading;
    - the NAS clip started while the phone voice spoke (1 overlap);
    - the NAS voice was female and the phone took over as male;
    - Web Speech started in the background;
    - a voice-list refresh restarted the sentence as `en-gb-female`;
    - two pure checks on the new reasons.
  - The pin check is new code and passes on both.
- The related suites pass: 55 files, 631 tests. They include the background, notice, key, voice-pick and sovereign-voice suites. One pin moved from `a.onerror … tts.speak` to the hand-off function, which still ends in `tts.speak`.
- **Chromium, TV profile:** with the key at the RPC, 6 authorized requests and the NAS audio playing. Without it, the sign-in line.
- **Chromium, Android profile:**
  - The NAS voice (female) fails on piece 2, and the rest speaks as `en-us-female`. Before the fix it was `en-us-male`.
  - A hand-over from the phone voice (male) cancels Web Speech before the NAS clip, the NAS voice is asked for `male`, and there are 0 overlaps.

**His test on the Firestick:** open The Love Corner → Learn → Living Lessons → any lesson, press 🔊, then **Read this lesson — start to finish**.
- If this Firestick is signed in to the family account, the lesson reads aloud in the church's voice and the lit sentence follows it.
- If it is not signed in, the panel says to sign in on this screen. After signing in, one more press reads it.

re-review: 2026-10-02 — his listen on the Firestick and on the phone with the screen off. Then the **church key** (DR-0566's pending decision): a Love Corner member who belongs to no family space still gets no key, so such a member's Firestick is told to sign in and still cannot hear the church voice.
