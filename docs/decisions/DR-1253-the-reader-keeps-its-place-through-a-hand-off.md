# DR-1253: The reader keeps its place through a hand-off, and the place never walks backwards on its own

**Date:** 2026-10-27
**Status:** Accepted
**Area:** `app/src/components/TTSControl.jsx`, `app/src/lib/use-read-aloud.js`, `app/src/lib/clip-queue.js`
**Follows:** DR-1251 (the reader never ends a lesson on a fault), DR-0654 (one reading, one voice; the hand-off), DR-0738 (tried again in the dark), DR-0631 (one place record), DR-0653 (one piece per sentence)

## Context

Darrell, 2026-10-27, with L263 open and the reader panel offering "Resume ·
paragraph 2 of 224": *"It cuts off the reader while I was in the lesson and
then starts me from the beginning instead of the 13 part!!!!!!!!!!!! Fix
it!!!!!!!!"*

## What was measured

- The control lights and keeps a sentence as `base + local`: `base` is where
  the run started, `local` the engine's segment index or the NAS queue's
  piece index. Both counters start at 0 for every run of text.
- A hand-off plays the REST of the text as a new run without going through
  the control: the NAS voice failing a piece (`onFallback` → the device
  voice, or a reading held in the dark and resumed in the NAS voice). The
  rest begins at piece i, but its pieces count from 0 — so after a hand-off
  at sentence 13 the control lit sentence 0, scrolled to the top, and wrote
  the bookmark and the place back to the beginning. The audio went on from
  13; the screen and the Resume offer said 2.
- Nothing refused a backwards write: `rememberSentence` wrote whatever index
  it was handed.
- The stall watch added in DR-1251 counted from play() with only a moving
  clock or a `playing` event standing it down; a slow road loading a long
  piece could be taken as stuck.

## Decision

- `useReadAloud` reports `pieceOffset`: how many pieces of this reading come
  before the text now playing. Zero for every `read()` (whose base already
  carries the place); grown by i at each hand-off. The control adds it to the
  engine's index and to the queue's piece, for the lit sentence, the word
  highlight, the scroll, the bookmark and the place.
- The place never walks backwards on its own: within one run the furthest
  sentence reached is kept, and a write more than two sentences behind it is
  refused. A new run (Start, a paragraph pick, Back, a tap) is a new object
  and starts its own count, so a deliberate return is honoured.
- The stall watch stands down when data arrives (`loadeddata`, `canplay`),
  not only on `playing` or a moving clock, and waits 30 s: only a piece that
  never comes is caught.
- The better road is offered, not only described. Darrell, the same hour:
  *"the male voice changes mid-lesson to a female voice... are we using the
  same solutions or researching better options based on our experiences?"*
  The man's voice the NAS reads in (Piper, Ryan) already runs on the phone
  itself (lib/device-voice.js, DR-0656 / DR-0881) and is the first stand-in
  for a failed piece — when the model is kept on the phone. A hand-off that
  finds no man's voice on the phone and that model not yet kept now carries
  one action, "Keep the man's voice on this phone", to the Voice surface's
  card, so the rest of a lesson stays in his voice from then on. What is
  still open: a phone that has not kept the model falls to its own engine,
  as before; whether to keep the model on first use rather than on request
  is the next decision, after the size (about 63 MB) is weighed against a
  family data plan.

## Impact

Hand-offs keep happening exactly as before (DR-0654); what changes is that
the screen and the record follow the audio through them. A reading that
truly restarts from the top (the listener pressed Start) still writes from
the top, because Start is a new run.

## Verification

- `the-reader-keeps-its-place-through-a-hand-off.test.jsx`: a reading at
  sentence 5 hands off (offset 5, piece 0) and the bookmark stays at 5 then
  moves to 6; proven-to-catch — a run that forgets its offset and reports
  piece 0 again is refused by the forward-only rule, so the bookmark does
  not fall.
- `the-queue-never-hangs-on-a-bad-piece.test.js`: data arriving stands the
  stall watch down; a piece that never loads is asked for again once.
- `re-review: 2026-11-10` — count hand-offs in the trips that ride with his
  feedback; if the phone's own engine still takes readings, keep the model
  on first use.
