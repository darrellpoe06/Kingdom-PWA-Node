# DR-0791 — The voice stays clear: the player stretches nothing it can ask the voice for, and every sentence's pace is measured

- **Status:** accepted
- **Tier:** A (the pace the NAS voice and the studio are asked for, and what the one audio element stretches; the same clips, keys and cache; no surface moved)
- **Type:** fix
- **Date:** 2026-10-07
- **Scope:** `app/src/lib/clip-queue.js` (`paceFor(rate)` names the voice's pace; `fetchClip(text, i, pace)`; `setRate` drops the pending prefetches and asks again at the new pace when it differs; `join({speed})` carries the pace its pieces were spoken at; `onPace` reports every piece's chars, clip length, wall time, element rate, voice pace and whether it was paused; `get pace`), `app/src/lib/use-read-aloud.js` (`playLiteVoice`: a source and keys per pace, `joinFromDevice(pace)` joins the pace's own pieces first, the saved 1x join is the last resort and is marked `stretched`; the fetch-ahead's join is skipped when the chip has moved; `playMyVoice`: the same `paceFor` / `onPace`), `app/src/lib/reader-trip.js` (`note('pace')` sums the pieces; `paceLine`; `DRAG_RATIO`; the join line names a stretched last resort), `app/src/lib/help-content.js`, the suite `the-voice-stays-clear-the-player-stretches-nothing.test.js`.
- **Principles:** DR-0076 (measure, don't claim; proven to catch), DR-0219 (SHOULD / ARE / GAPS / CLOSE), DR-0659 (every piece from the device first), DR-0718 (a saved reading as one file), DR-0746 (the trip says what the device did), DR-0769 (fast speech is spoken, not stretched), DR-0786 (the pauses are measured)
- **Grounds:** Darrell 2026-10-07, on the Firestick, the male stand-in reading: *"Why does the male voice sound like it's slowing down while it's talking? Not able to correctly enunciate words... etc... all the time... it should be clear and understandable..."* and, on the fix: *"Well... I like the reader on most devices... is this a comprehensive version or fix?"*

## Context

SHOULD: a reading in the NAS voice (Piper `en_US-ryan-medium`, the stand-in when the studio is down) is spoken by the voice at the pace the listener chose, and the browser's element stretches only what the voice could not speak (DR-0769: a time-stretch smears consonants, which is the mumble). ARE, measured against `lib/use-read-aloud.js` and `lib/clip-queue.js` as they were:

1. **The pace was pinned once, at Play.** `const speed = voiceSpeedFor(rateRef.current)` was taken once and every piece was tagged with it. A speed change mid-reading reached the queue only as `setRate(r)`, which set the element's `playbackRate = r / pieceSpeed`. From 1.5× down to 1× that is **0.667×**, from 2× to 1.5× it is 0.75×: every later sentence was 1.5× audio played at two-thirds speed with pitch held, which is a voice that drawls and slurs its consonants. The pin was re-taken only by a jump or the next lesson.
2. **A saved reading at any speed but 1× was always stretched.** `joinFromDevice()` looked only for the 1× pieces (`savedKeys`), and `startJoined` set `pieceSpeed = 1`, so a downloaded lesson listened to at 1.5× was the 1× file stretched to 1.5× for its whole length, never spoken at 1.5× — on every device, every time, for anyone whose speed chip is not on 1×.
3. **Nothing measured what the device did with the sound.** The trip (DR-0786) measured the silence between sentences and nothing about the sentences themselves: not the clip's length, not how long the device took to play it, not what the element's rate was. "It slows down while it's talking" had no number to answer it with.

The cloud sandbox cannot hear the Firestick (DR-0125's reason, applied to sound). What it can do is remove the one stretch the code itself introduces, and make the device say what it did.

## What was measured

| what | measured | basis |
| --- | --- | --- |
| element rate after a mid-reading slowdown (before) | 1.5× → 1×: `playbackRate` 0.667; 2× → 1.5×: 0.75 | `clip-queue.js` `applyRate`: `speed / pieceSpeed`, `pieceSpeed` fixed at the pinned pace |
| a saved lesson at 1.5× (before) | the 1× pieces joined, element 1.5× for the whole file | `use-read-aloud.js` `joinFromDevice` on `savedKeys` only; `startJoined` `pieceSpeed = 1` |
| what the trip knew about the sentences (before) | waits only; no clip length, wall time or rate | `reader-trip.js` `note('piece')` |
| element rate after a slowdown (after) | the piece on the element 0.667 (once), every later piece 1.0; the pending prefetches dropped and re-asked at 1× | the new suite, a queue with `paceFor` and a counting `fetchClip` |
| a join that names its pace (after) | 1.5× pieces, rate 1.5×: element 1.0; a join that names none: 1.5 (the saved 1× file, as before) | the same suite |
| per-piece measurement (after) | `{i, chars, clipS, wallMs, paused, playbackRate, pieceSpeed}` per piece, from pieces and from a joined file's offsets; a pause inside a piece marked | the same suite |
| the trip line (after) | "pace: the voice spoke at 1.5×, the player stretched nothing; about 15 letters a second reached the ear; the device played 3 sentences in 1.03× their length (no drag)" | `paceLine` in the same suite |
| proven to catch | 13 of 13 fail against the code as it was | the suite run with the three lib files stashed |
| nothing else broke | the 8 neighbouring voice suites: 76 tests green | `vitest run` on those files |

## Decision

1. **The pace follows the speed chip.** The queue takes `paceFor(rate)`; when `setRate` lands on a pace the voice should speak differently, the pieces not yet on the element are dropped and asked for again at the new pace, and `fetchClip` receives the pace to ask for. The piece already playing takes the remainder once; from the next sentence the element stretches nothing. A `setRate` whose pace is unchanged (2.5× and 3× both clamp to the voice's 2×) drops nothing. Both audio voices (the NAS stand-in and the studio's own) do this.
2. **A joined file says the pace it was spoken at,** and the element takes only the remainder; a join that says nothing is the saved 1× file and is stretched exactly as before.
3. **The pace's own pieces come first.** `joinFromDevice(pace)` joins the reading at the pace it asks for when every piece is on the device (so a lesson listened to twice at 1.5× is one unstretched file the second time). When they are not, the first piece is asked of the NAS at the pace; **only when the NAS cannot answer it** is the saved 1× file joined and stretched, so a saved lesson still plays with no network, and the trip says it was stretched and why. The fetch-ahead's join is skipped when the chip moved during the reading (its pieces are at the old pace).
4. **Every sentence's pace is measured** into the trip: letters, the clip's length, the wall time it took to play (a piece the listener paused inside is marked and not timed), the element's rate and the voice's pace. `paceLine` says it in one clause on the panel's "Last reading" line: the pace the voice spoke at, what the player did to it (a rate below 1× is named as the slur), about how many letters a second reached the ear, and whether the device **dragged** — took more than `DRAG_RATIO` (1.2×) a sentence's own length to play it, with the worst sentence named.
5. **Not changed, on purpose.** The 0.7× "Slower" chip is spoken by Piper at `--length_scale 1.43` (the voice's own slow pace, not a stretch) and is the listener's choice. The voice model (`en_US-ryan-medium`) is unchanged: whether its own clarity is the remaining cause is what the pace line on the Firestick will say.

## Verification after merge

- The 13-test suite runs in CI; the 76 neighbouring tests are green.
- **The listening test (`re-review: 2026-10-10`, Darrell on the Firestick):** play L214 in the male stand-in, change the speed once mid-reading, let it run a minute, then read the "Last reading" line in Read Aloud. **If** it says *the player stretched nothing* and *no drag*, the remaining cause is the voice model itself and the next DR picks a clearer male Piper voice for the NAS (`infra/nas-voice-lite/install.sh` downloads voices by name; `VOICES` in `voice_lite_server.py`). **If** it names a stretch below 1× or a drag, that is the next fix, with its number.
- Deploy proof per DR-0107: a real deploy run on the merge SHA.

## Impact

- **Listener:** after a speed change the voice speaks the new pace from the next sentence instead of being slowed or sped by the player; a saved lesson at 1.5× or 2× is spoken at that pace when the NAS is reachable; the panel's last-reading line now carries the pace numbers, so "it slows down" comes with a measurement.
- **Cost:** a saved lesson listened to at a pace other than 1× asks the NAS for its pieces once per pace (then they are on the device under their own keys); offline it plays as before.
- **System:** no schema, no route, no NAS change; the queue's new option is opt-in (`paceFor` absent = the old behaviour, pinned by test).
