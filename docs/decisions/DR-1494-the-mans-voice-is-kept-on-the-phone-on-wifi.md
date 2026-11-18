# DR-1494: The man's voice is kept on the phone by itself, on wifi

**Date:** 2026-11-13 · **Status:** Accepted · **Tier:** B (reader behaviour) · **Area:** `app/src/lib/keep-voice-on-wifi.js`, `app/src/lib/use-read-aloud.js`, `app/src/lib/reading-voice-hold.js`
**Follows:** DR-1254 (closes its open condition), DR-1482 (hold, never switch; Decision 5), DR-0881 (the Piper on the device is the first stand-in), DR-0656 (device voice), DR-0076 (unknown is never assumed)

## Context

Darrell, 2026-11-13, rendered for meaning (DR-0331): he wants the man's voice the same from the start of a reading to its end, every time. DR-1254 left one call open: keep the Piper man's voice (Ryan, about 63 MB) on the phone the first time it is needed, weighed against a family data plan. DR-1482 made the reader hold rather than switch, offered a button, and carried the same call (Decision 5). He settled it: keep it automatically, but only on an unmetered connection.

## What was measured

- **SHOULD.** One reading, one voice (DR-0654, `reading-voice-pin.js`); a failed NAS piece is first asked of the Piper kept on the device (`use-read-aloud.js` `speakPiece`, DR-0881).
- **ARE.** Nothing ever kept the voice but the Voice-surface button. And the readiness check was hollow: `deviceVoiceReady` stored `!!v.cached`, but `checkDeviceVoice` returns `cached` as an object (`device-voice.js` `cachedState`), always truthy, so the reader always thought the voice was kept. Two effects on a real phone: DR-1482's "Keep the man's voice on this phone" button never appeared (its `ready()` was always true), and the device voice was asked with no `voice`, so it was always the man's, even for a woman's reading.
- **GAPS.** No keep on first use; a hollow ready; the device voice not asked for the reading's own gender.

## Decision

1. `keep-voice-on-wifi.js`: when a reading starts in the man's voice, the connection is unmetered and `checkDeviceVoice` says `downloadable`, the existing `downloadDeviceVoice` runs in the background, not awaited by the reading. One keep per session; a metered check does not use it up. Outcome written to the trip as `keep-voice` (started, kept with bytes, or the error); silent to the reading. Called with one line where a reading starts.
2. **Unmetered is measured, never assumed (DR-0076):** `navigator.connection.type` is `wifi` or `ethernet`, and `saveData` is not true. Cellular, any other type, no type (desktop Chrome's effectiveType-only), and no `navigator.connection` at all (iOS Safari, Firefox) are not unmetered; there the DR-1482 button stays the way.
3. Ready means `state === 'ready'`, per voice; only a yes is remembered, so a voice kept mid-session (on wifi, or by the button) is used at the next failed piece. The device voice is asked for the reading's pinned gender, and the hold notice (reading-voice-hold.js) checks that gender.
4. Kept on the phone, a NAS hiccup is read by the same man's voice on the phone: no hold, no switch. Limit unchanged from DR-0881: pace 1 only, and a device slower than real time stands down.
5. This closes DR-1254's open condition and DR-1482 Decision 5's keep-on-first-use clause.

## Impact

On wifi, the first reading in the man's voice keeps him on the phone (about 77 MB once, with the runtime); every later reading stays in his voice through a NAS hiccup. On cellular or an unknown connection nothing downloads; the hold and the button now actually show.

## Verification

- `the-reader-keeps-the-mans-voice-on-wifi.test.jsx`, 9 cases: the pure unmetered rule; once per session, never for a woman's reading, a failed keep noted; a metered check leaves the keep unused; and on the hook: wifi + downloadable downloads once across two readings; cellular, no connection, Save-Data and already kept download nothing; kept + NAS failure reads on in the phone's Piper asked for `male`, nothing spoken by a woman's phone voice, no hold.
- **Proven to catch:** against origin/main's `use-read-aloud.js` (c5f2ec387ae), cases 1 and 6 fail. Five mutations of the new module (absent as unmetered, Save-Data ignored, cellular counted, state unchecked, no once-latch) each fail at least one case.
- DR-1482's 13 cases green; reader and voice suites green; lint, file-budget-guard and format-guard clean.
