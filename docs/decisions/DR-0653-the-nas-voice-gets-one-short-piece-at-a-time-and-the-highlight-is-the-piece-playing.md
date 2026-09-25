---
id: DR-0653
title: The NAS voice is handed one short piece at a time, and the lit sentence is the piece that is playing
status: accepted
date: 2026-09-24
tier: A
type: defect
declared_by: Darrell
scope:
  - app/src/lib/clip-queue.js — one piece per reading segment (≤ ~180 characters), two pieces fetched ahead
  - app/src/lib/use-read-aloud.js — pieces cut from the text as written (spoken form per piece), a busy NAS is waited for, the playing piece is reported
  - app/src/components/TTSControl.jsx — the highlight follows the playing piece
  - infra/nas-voice-lite/fixtures/l191-summary.json, .github/workflows/voice-lite-probe.yml — before/after clips from the live route
principles: [HOLD-THE-HAND (DR-0621), VERIFICATION-DOCTRINE (DR-0076), DECISION-RECORDS (DR-0011)]
grounds:
  - DR-0627 — the stand-in voice is real audio from the NAS (this corrects how it is fed)
source: 2026-09-24 — Darrell, from his phone, reading L191 in the NAS voice at 1.5×, A+++, dark theme
---

## Context

The NAS voice (DR-0627) reached Darrell's phone that evening, a man's voice reading L191 with the panel saying "stand-in voice, the studio is offline". He then wrote:

- "it reads however it loses the words and actually degrades into undetectable gibberish... after initially sounding like a man!"
- "The next would be highlighting a sentence before or after then its all down hill after the first like 15 - 30 seconds roughly."

## What was measured

- **What was sent.** `chunkForClips` cut the reading at sentences and then glued them back together: a first piece of up to 220 characters, then pieces of up to 600. On L191's own text this gave 28 pieces. The first was 91 characters; 27 of the rest were between 406 and 599. The first piece is about 15 to 30 seconds of speech at 1.5×, which is when it went "all down hill".
- **What the voice does with it.** Piper splits its input only at `.` `!` `?`. L191's summary sentence is a run of semicolon clauses, 866 characters with no full stop until the end, so it reached the model as one utterance. A VITS voice drifts on long utterances, which is the "gibberish".
  - The server already collapses newlines to spaces (`" ".join(text.split())`), so that was not the cause.
  - Speed is set only in the browser (`playbackRate`); the server passes no `length_scale`. So speed was not applied twice.
- **Why the highlight was off.** For these pieces it came from the clip's clock, spread evenly across up to 600 characters. Speech is not even across characters, so the lit sentence landed one early or one late, and further off inside long pieces.
- **"One sentence behind the voice"** (Darrell, live, 2026-09-25). Main still cut its pieces from the SPOKEN form. `toSpokenForm` removes the full stops in references ("2 Tim. 1:7" becomes "2nd Tim chapter 1 verse 7"). On a lesson-style paragraph with five references, that gave 11 sentences as written but 7 spoken pieces, and main's first piece carried five sentences. The light then came from the clip's clock, so from the first reference on it fell behind the voice and stayed behind. `the-lit-sentence-is-the-one-heard.test.jsx` drives the real hook. It fails on main's `use-read-aloud.js` and `clip-queue.js`, with no piece reported while the glued piece plays, and passes here.
- **The new cut, measured across the whole Living Lessons corpus:** 11,604 texts give 133,628 pieces. The longest is 181 characters, and none is over 200. L191's summary becomes 6 pieces (181, 159, 161, 175, 172 and 13 characters).
- **The live before/after, through `https://poetech.us/voice-lite`** (voice-lite-probe run 36077630714, artifact `voice-lite-clip`: `before-whole-sentence.wav`, `after-piece-0..5.wav`, `after-pieces-joined.wav`):
  - Before, the whole 866-character sentence as one request: 21.2 s of audio, **40.8 characters a second**, about twice a speaking pace. The voice ran the words together and dropped them. That is the gibberish.
  - After, the six pieces: 10.1, 8.2, 8.8, 6.9, 9.2 and 0.9 s, **18 to 25 characters a second** (15 on the 13-character tail), 44.0 s in all. Every piece is at a speaking pace.

## Impact

Every lesson read in the NAS voice degraded after its first piece, and the highlight did not match the voice.

## Decision

1. **One piece per reading segment.** The pieces are exactly `segmentText`'s segments: cut where a person breathes, at about 180 characters, never glued. Piece *i* is the same sentence as highlight segment *i*.
   - Pieces are cut from the text as written. Each is turned into its spoken form ("2nd Timothy") on its own, so the indexes never shift.
2. **The lit sentence is the piece that is playing.** `onPiece(i)` reports the index, and the reader lights segment *i*. The clip-clock guess is kept only for the studio's single long clip, where there is nothing better to go on.
3. **Two pieces ahead.** Pieces are shorter and more numerous, so the next two are fetched while one plays. That matches the NAS's limit of two syntheses at once. A 503 "busy" answer is waited out and retried, not treated as the voice being down.

## Verification

- `voice-lite-one-sentence-per-clip.test.jsx`:
  - L191's 866-character summary reaches the voice in pieces of at most 200 characters. This fails on the old gluing, which made pieces of 573 characters.
  - The live probe's fixture is the app's own cut.
  - Piece *i* equals `segmentText` segment *i*.
  - At 1.5×, the queue reports pieces 0, 1, 2… once each, with the rate held.
  - On the real reader, sentence *i* is lit while piece *i* plays. This fails with the old clock guess, which stays on sentence 1.
- `reader-keeps-playing-in-background.test.js` is updated to the new shape (one piece per segment, two ahead).
- **Live:** `voice-lite-probe` synthesizes the whole summary as one request (before) and the six pieces (after) through `https://poetech.us/voice-lite`, and keeps both as artifacts with their durations.

**His test:** open L191, choose "Read this lesson — start to finish" and listen past the first minute. The voice stays clear, and the lit sentence is the one being spoken.

re-review: 2026-10-01 — his listen past the first minute; if the NAS CPU leaves gaps between pieces, raise the prefetch or use the `low` voices.
