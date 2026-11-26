# DR-1688: the lesson player keeps the listener's chosen speed

**Date:** 2026-11-26
**Status:** Accepted
**Tier:** A — a read-aloud preference; no money, schema or identity
**Type:** product
**Area:** `app/src/components/learn-studio/LessonExperience.jsx`, `app/src/lib/tts.js`
**Pairs with:** DR-1575 (one speed on the device, heard by every reader), DR-0076, DR-0075

## Context

Darrell, 2026-11-26: *"When I push it to push play, it will not keep the 1.5
reading level I like."* ("Reading level" here means the read-aloud speed.)

## What was measured

The house already keeps one speed per device (`lib/tts.js`, `poe-tts-prefs`,
DR-1575). The READ button and the Personalize sheet read it and write it.
Two places did not:

1. **The new-look lesson player** (`LessonExperience.jsx`) held `useState(1)`.
   It never read the saved speed and never saved a pick. Every lesson built a
   fresh narrator at the engine's 1x. On the next lesson the chip still showed
   1.5× while the voice read at 1×; a reload or reopen put it back at 1×.
2. **`useTextToSpeech().setRate`** returned before saving on a device with no
   built-in speech engine, such as a television's web view. The recorded voice
   still reads on those devices, but the pick was never kept, and the next
   render put the old speed back.

On the old code the next lesson's narrator played at `[1]`, not `[1.5]`.

## Decision

1. The lesson player's speed **is the device's saved speed**. It is read when
   the player mounts, saved on every chip tap (`saveTTSRate`), and followed
   while the player is open (`subscribeTTSPrefs`), so the sheet and the READ
   button reach it.
2. **Every narrator gets the speed before it plays**: when it is built, and
   again when Play is pressed: device voice and any recorded narrator alike.
3. Any speed round-trips. The chip moves to the next step above the current
   speed, and the label names any speed exactly (1.25×, 3×, 5×).
4. `setRate` saves the speed even when the device has no built-in voice.
5. **Per device, not per account, on purpose.** Since DR-1575, one number
   means a different pace on a laptop than on a phone. This decision keeps
   that rule. `re-review: 2027-01-26`: decide whether a speed picked on one
   device should be offered as the starting speed on a new device.

## Impact

Pick 1.5× once: every lesson, a reload, both lesson pages and the READ button
start at 1.5×.

## Verification

- `the-lesson-player-keeps-the-chosen-speed.test.jsx`: 7 cases. All seven
  failed on the old code (proven to catch) and pass now. They cover a fresh
  mount, a reload, the next lesson, every speed in RATE_STEPS, a pick made
  elsewhere, the chip past its four steps, and a device with no built-in voice.
- The existing lesson-experience and reader suites still pass.
- **Not claimed:** not yet seen on Darrell's phone; proof is the live lesson at 1.5×.
