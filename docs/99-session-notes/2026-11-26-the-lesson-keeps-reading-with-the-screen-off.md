# The lesson keeps reading with the screen off — trace, sources, evidence (DR-1705)

Session note for [DR-1705](../decisions/DR-1705-the-lesson-keeps-reading-with-the-screen-off.md). What changed, why, and the evidence.

## What was measured

- **SHOULD.** Since 2026-08-10 the reader is meant to keep reading in the
  background (`lib/background-audio.js` header). The classic reader
  (`lib/use-read-aloud.js:1283-1294`) plays the System voice as NAS audio
  clips (`/voice-lite`, Piper) and holds the keep-alive and the lock-screen
  controls.
- **ARE.** The new lesson look, where most lessons now open
  (`ChurchLearn.jsx:2569` → `LessonExperienceDoor.jsx`), built its narrator
  from `chosenVoiceNarrator`. With no person voice picked (the default System
  voice) that returned `createBrowserTTS`, the phone's Web Speech engine
  (`chosen-voice-narrator.js`, the `!isPersonVoiceId` branch). The player held
  no media session and no keep-alive (`LessonExperience.jsx`, `play()`).
- **GAP.** Web Speech is not media. Android Chrome stops it when the screen
  turns off or the app leaves the screen (Darrell's phone, 2026-09-24, already
  recorded in `background-audio.js`). iOS pauses speech on lock. With no media
  session the phone showed no card and no buttons for the lesson.

Sources read 2026-11-26: web.dev "Media Session API" (media of 5 s or more
gets the notification; action handlers), W3C Media Session, MDN Media Session
API, WebKit bug 198277 (standalone web apps lose audio in the background on
some iOS versions), Apple forum 849627 (speech pauses at lock).

## Decision

1. **The System voice in the lesson player is real audio.** When this device
   holds the family key and the NAS voice is not resting, each sentence is a
   clip: first from this device's clip cache (no road needed), else
   `/voice-lite`, with 15 s for the first piece and 60 s for the pieces fetched
   ahead. They play through one element unlocked in the tap
   (`createCloneNarrator`). A miss is remembered for as long as its cause
   lasts (`markLiteVoiceMiss`).
2. **The fallback is the phone's voice, and the player says so.** With no key
   or a resting road, the phone's voice reads at once, inside the tap. If a
   piece fails mid-lesson, the phone's voice reads from that sentence. Either
   way one line says it stops when the screen turns off. A browser accent the
   listener picked on purpose stays their choice.
3. **The player owns the lock screen while it reads**
   (`lesson-background.js`). Play, Start over and any jump claim the
   keep-alive, the card (lesson title) and the phone's buttons inside the tap.
   Play and pause drive the player, next and previous step a paragraph, and
   the card follows the player's status and position. After 2 s of idle every
   button is handed back, so the listener's own music keeps its controls.
4. **Speed holds (DR-1688).** The clip voice is asked to speak at the
   listener's speed (1.5× spoken, not stretched). Above 2× only the remainder
   is stretched. The narrator reports its rate, so pressing Play at the same
   speed keeps the pieces already made ahead.

## Impact

On a phone signed in to the family key, a lesson in the new look keeps
reading with the screen off or in another app, and the lock screen and
notification can pause, play and skip it. Position is saved on each sentence
(`PROGRESS_KEY`), as before.

## Verification

- `the-lesson-keeps-reading-with-the-screen-off.test.jsx`, 15 cases. Eight
  failed against main's `chosen-voice-narrator.js` and `LessonExperience.jsx`
  (proven to catch) and pass now.
- The lesson-experience, speed, my-voice and background-audio suites pass.
- Real Chromium (Playwright): the narrator played sentences 2 to 5 after the
  page was made hidden, with the keep-alive held and the card titled. Headless
  keeps tabs visible, so the hide was emulated with `visibilitychange`.
- **Not claimed:** not yet heard on Darrell's Fold 7 with the screen off.
  iOS standalone background audio depends on the iOS version (WebKit 198277).
  Signed-out visitors have no key and read in the phone's voice, which stops
  at screen-off. `re-review: 2026-12-10`: confirm on the Fold, and decide
  whether a signed-out reader gets an audio road.

## Files changed

- `app/src/lib/lesson-audio-voice.js` (new): `liteClipFor(voice)`, the System
  voice piece maker: device clip cache first (1.5 s lookup bound), then
  `synthesizeLite` (15 s first piece, 60 s ahead), a clip from the road saved
  for the next play, a miss remembered; `deviceVoiceNote(reason)`.
- `app/src/lib/chosen-voice-narrator.js`: the System voice routes to
  `createCloneNarrator` with `liteClipFor` when `hasBridgeToken() &&
  mayTryLiteVoice()`; the narrator exposes `rate`; each clip's element is set
  to the residual rate (only above 2x).
- `app/src/components/learn-studio/lesson-background.js` (new):
  `useLessonBackground` (claim in the tap, status/position follow, idle
  release after 2 s, release on unmount) and `paragraphStep`.
- `app/src/components/learn-studio/LessonExperience.jsx`: claims the session
  in Play / Start over / jumps; wires the phone's buttons. 1500 lines (budget).

## Playwright output (real Chromium, headless)

`--autoplay-policy=no-user-gesture-required`; six 1.2 s WAV tones as the NAS
answers; `createCloneNarrator` at 1.5x with `createBackgroundAudio` held.

```
hiddenBy: visibilitychange emulated (headless keeps tabs visible)
keepAlive: true, card title: "Not With Eyeservice"
  155 ms visible  playing sentence 0
 1505 ms visible  playing sentence 1
 2848 ms hidden   playing sentence 2
 4192 ms hidden   playing sentence 3
 5537 ms hidden   playing sentence 4
 6880 ms hidden   playing sentence 5
```

## The phone check (Galaxy Fold 7, installed app)

1. Open a lesson in the new look, signed in, and press Play.
2. Press the power button. The reading should keep going, and the lock screen
   card should show the lesson title.
3. On the lock screen, press pause, then play, then next. The reading should
   pause, go on, and move to the next paragraph. Unlock: the highlight should
   be on the sentence you heard.

If the player says "the phone’s own voice reads from here", the NAS voice did
not answer; that voice stops at screen-off, and the line names why.
