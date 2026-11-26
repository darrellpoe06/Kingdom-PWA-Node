# DR-1705: the lesson keeps reading with the screen off

**Date:** 2026-11-26
**Status:** Accepted
**Tier:** A — read-aloud playback; no money, schema or identity
**Type:** product
**Area:** `app/src/lib/chosen-voice-narrator.js`, `app/src/lib/lesson-audio-voice.js`, `app/src/components/learn-studio/lesson-background.js`, `app/src/components/learn-studio/LessonExperience.jsx`
**Pairs with:** DR-1685 (the new look reads in the chosen voice), DR-1688 (the chosen speed), DR-0718 (the keep-alive length), DR-0654 (one element unlocked in the tap), DR-0076

## Context

Darrell, 2026-11-26: *"why does the app not work when ... you turn the screen
off ... it should work in the background. That's the point of the app. It's a
reader app ... if you want to turn off your screen and let it read to you,
that should be something that you're able to do."*

## What was measured

The new lesson look (most lessons, `ChurchLearn.jsx:2569`) read the default
System voice through `createBrowserTTS`, the phone's Web Speech engine, and
held no media session or keep-alive. Web Speech is not media: Android Chrome
stops it when the screen turns off, iOS pauses it on lock. The classic reader
already played the System voice as NAS audio (`use-read-aloud.js:1283`).
Full trace, sources and output: [session note](../99-session-notes/2026-11-26-the-lesson-keeps-reading-with-the-screen-off.md).

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
   is stretched. Pressing Play at the same speed keeps the pieces made ahead.

## Verification

- `the-lesson-keeps-reading-with-the-screen-off.test.jsx`, 15 cases. Eight
  fail on main's code (proven to catch). The neighbouring suites pass.
- Real Chromium: sentences 2 to 5 played after the page was hidden (emulated).
- **Not claimed:** not yet heard on Darrell's Fold. iOS standalone background
  audio varies by version. Signed-out readers have no key and use the phone's
  voice. `re-review: 2026-12-10`: confirm on the Fold; decide a signed-out road.
