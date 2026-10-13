# DR-0718 — A started lesson keeps playing with the screen off, a saved lesson plays as one recording, and one reader is on the screen

- **Status:** accepted (built and proven in unit tests; not yet heard on Darrell's phone)
- **Tier:** A (reader playback and panel copy; no data, no money, no new door)
- **Type:** fix
- **Date:** 2026-10-01
- **Scope:** `app/src/lib/clip-queue.js` (the swap on 'ended' needs no await; `join()`), `app/src/lib/joined-clip.js` (new: join WAV pieces into one WAV), `app/src/lib/use-read-aloud.js` (a saved reading plays as one file; the saved gate), `app/src/lib/background-audio.js` (the keep-alive loop is 6 s), `app/src/lib/one-reader.js` (new), `app/src/components/TTSControl.jsx` (one reader renders; the panel says which voice will read before Play), `app/src/components/Practice.jsx` (no second reader in the Learn tab); tests `saved-voice-keeps-playing.test.js`, `one-reader-on-the-screen.test.jsx`, `reader-keeps-playing-in-background.test.js` (regex widened for the new arguments).
- **Principles:** VERIFICATION-DOCTRINE (DR-0076), THE-APP-IS-THE-PRIMARY-ARTIFACT (DR-0065), HOLD-THE-HAND (DR-0621); DR-0653 (one piece per sentence), DR-0654 (one voice per reading), DR-0659 (clips kept on the device).
- **Grounds:** Darrell, 2026-10-01, on a Galaxy Fold 7 in the installed app: *"shouldn't I be able to continue to hear my lessons after I start them even if I go to another app... it stops each time on the downloaded version?!!!!!! Why?!!!!!?????!!!!!"* He also sent a screenshot of the READ ALOUD panel with its Text size, Colors, Follow along and Speed sections drawn two to three times, stacked.

## Context

The panel promises: "The audio voice keeps playing when you switch apps." The audio voice for the System voice or a person's stand-in is the NAS voice (Piper). It comes as one short WAV per sentence (DR-0653), and these play one after another through one `<audio>` element (`clip-queue.js`). A lesson saved for listening offline (DR-0659) is the same pieces, kept in IndexedDB. Alongside the voice, a silent looping `<audio>` element was meant to keep the page alive (`background-audio.js`).

## What was measured

**Root cause.** The reading reached Android as a string of short media files with gaps between them, and a saved reading was skipped entirely after any network miss.

1. **Every short sound is "transient" to Chromium.** Read from Chromium source on 2026-10-01: `media/base/media_content_type.cc` sets `kMinimumContentDurationSecs = 5`. A player of 5 s or less is `kTransient`. In `content/browser/media/session/media_session_impl.cc`, only a `kPersistent` player asks for `AudioFocusType::kGain`, and on Android `IsControllable()` is true only with `kGain`. That means no media notification, no lock-screen controls, and no hold on the app.
   - The keep-alive was `silentWavDataUri()` at its default 0.5 s (`background-audio.js`, `createBackgroundAudio`). It was transient, so it never held anything.
   - The voice pieces are sentence-sized. Measured over the 201 lessons in `living-lessons-class.js`: 39,258 pieces, of which **17,683 (45%) are 5 s or less** at the reader's own 15 characters/second estimate (`clip-progress.js` `ESTIMATED_CHARS_PER_SECOND`). Every one of the 201 lessons has such pieces.
2. **The queue went quiet at every sentence.** On 'ended', `clip-queue.js` called `playAt(index + 1)`, and `playAt` did `await want(i)` before setting `src` (origin/main, `clip-queue.js` lines 113–128). So between sentences the element held nothing new. If the last piece was short, nothing persistent was playing at all. Once Android stops the backgrounded app in that gap, the next 'ended' never runs. The reading stopped at whichever sentence boundary that happened first.
3. **A saved reading was gated on the network.** The device cache is read only inside `playLiteVoice`, and `read()` reached that only when `mayTryLiteVoice()` was true (origin/main `use-read-aloud.js`, the `isSystemVoiceId(voiceId) || isPersonVoiceId(voiceId)) && mayTryLiteVoice()` line). Any NAS miss rests the voice: 30 s for a timeout, 45 s for a failed fetch (which is what "offline" is), 2 min for a 401 (`voice-service.js` `LITE_REST_MS`). During that rest, a fully saved lesson went to the phone's Web Speech voice, which Android stops when the app leaves the screen.
4. **No visibility handler pauses the audio path.** All `visibilitychange` listeners were checked: TTSControl, use-read-aloud, tts.js, reading-position, screen-awake, sw-update. None pauses an `<audio>` element. The only pause is the hold in `onFallback` when a piece *cannot be had* while the page is hidden (DR-0654), and that runs on a failure only.
5. **The panel drawn two and three times.** Each section (`reader-look-and-feel`, `reader-follow-options`, Speed) appears once in `TTSControl.jsx`, so one reader cannot draw it twice. Two readers can. The app mounts its reader on every view (`poe-financial-mvp-v28.jsx`, `<TTSControl view=…>`). Practice → Learn mounts `PracticeLearn` (`Practice.jsx`), whose reader defaults on (`PracticeLearn.jsx` `readAloud = true`, `{readAloud && <TTSControl />}`), and the TLC door does the same. Two fixed readers in one corner means two panels stacked. A jsdom render of two `<TTSControl/>` on origin/main draws two read-aloud buttons. Whether Darrell's screenshot was taken on that tab is not known. A paint artifact is not ruled out, but the duplicate mount is real and is fixed.

## Impact

Before this fix, a lesson on the NAS voice could stop at any sentence boundary once the app left the screen. A saved lesson played offline could go to the phone's voice and stop at once. The lock-screen controls came and went with the length of the sentence playing.

## Decision

- **A saved reading plays as one recording.** When every piece is on the device, `joined-clip.js` joins the WAVs (same PCM format, checked) into one WAV. The queue plays that file from start to finish: one `src`, no swap, no fetch. It keeps the second each piece starts at, so the follow-along highlight and `mediaSession.setPositionState` keep up, and the highlight catches up on return through the same `timeupdate`. Pieces that do not join fall back to playing piece by piece. A reading still being fetched moves onto the joined file at the next sentence boundary once cache-ahead finishes.
- **No await between pieces.** Each piece is remembered when it arrives. 'ended' swaps the next one in synchronously, with no timer and no visibility check. Only a piece not yet arrived is waited for.
- **A saved reading needs no road.** `read()` tries the NAS voice when `mayTryLiteVoice() || await savedOnDevice(clean)`.
- **The keep-alive is 6 s of silence.** Over Chromium's 5 s line, it is a persistent player, so the reading holds the notification and its buttons. The Media Session wiring (play, pause, stop, next, previous, metadata, position) is unchanged and is now asserted. The wake lock stays optional (`screen-awake.js`).
- **The panel says which voice will read, before Play.** A phone voice says that Android stops it and to pick the System voice. A saved lesson says it plays as one recording with the screen off.
- **One reader on the screen.** Readers register in `one-reader.js`. The app-level reader (handed the view) outranks a surface's own, ties go to the first, and the others render nothing. Practice's Learn tab no longer mounts its own reader.

## Verification

- `saved-voice-keeps-playing.test.js` (12) and `one-reader-on-the-screen.test.jsx` (3) pass. Against origin/main's code (new modules present, changed files reverted), **9 of them fail**:
  - the hidden-page 'ended' swap (src still on piece 0 after the event);
  - the joined-file play and hand-over;
  - the saved gate;
  - the 6 s keep-alive;
  - the before-Play panel lines;
  - two readers drawing one panel;
  - the Practice Learn tab.
- 44 existing read-aloud, voice, offline and reader test files pass locally (455 tests). ESLint is clean on the changed files.
- Not verified here: playback on Darrell's Galaxy Fold 7. Proof on a device: start a saved lesson, switch apps, lock the screen. The reading should play to the end with the media notification showing the lesson. **re-review: 2026-10-08**, against his report.
