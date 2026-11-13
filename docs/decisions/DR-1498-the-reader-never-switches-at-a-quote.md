# DR-1498: The reader never switches voice at a quote

**Date:** 2026-11-13 · **Status:** Accepted · **Tier:** B (reader behaviour) · **Area:** `app/src/lib/speech-shape.js`, `app/src/lib/read-follow.js`, `app/src/lib/clip-queue.js`, `app/src/lib/reading-voice-hold.js`, `app/src/lib/use-read-aloud.js`, `app/src/components/LessonFigures.jsx`
**Follows:** DR-1482 (keep the voice you chose; the books list is seen, not read), DR-1254 (the hand-off offered the man's voice), DR-1251 (a bad piece is asked for again), DR-0417 (a reference chip is a word of its sentence)

## Context

Darrell, 2026-11-13, after DR-1482 deployed (c5f2ec387ae), rendered for meaning (DR-0331): reading lessons aloud on Chrome, at a quoted verse, where the text says things like saith the LORD, the reader pauses a moment and goes on in another voice, not the man's voice he chose; pushing forward puts his voice back, and it comes again at the next quote. His screenshot shows the FOLLOW highlight on the lone closing quote mark after "your thoughts." He also saw the books-dates fold ("optional, open to review") being read.

## What was measured

- **SHOULD.** One reading, one voice (DR-0654, DR-1482). Every piece the NAS voice is asked for is a sentence (`clip-queue.js` chunkForClips: piece i is highlight segment i).
- **ARE, the cut.** `speech-shape.js` clauseSegments cut at `/[^.!?]+[.!?]*/`: after the full stop, before the closing quote. His paragraph gave `...your thoughts.` and a next piece beginning `" (Isaiah 55:8-9, KJV) "Render...`; a reading ending on `."` gave a piece that was only `"`.
- **ARE, the chip.** On the lesson page each reference is a kept `<button>` (WordInline, DR-0417), and `read-follow.js` counted BUTTON as a block (added 2026-09-14 for quiz labels), so it put a stop either side of the chip: `(Isaiah 55:8-9, KJV)` became `(. Isaiah 55:8-9. , KJV)` and the cut made the piece `" (.`. Its highlight is the closing quote: his screenshot.
- **ARE, the miss.** A piece with no word becomes empty text (`toSpokenForm` + `forSynthesis`), `synthesizeLite` answers `empty-text`, the queue's `startPiece` called `fallBack(i)`, and `onFallback` handed the WHOLE REST to the phone (`deviceRestRef`). A skip or rewind calls `read()` afresh in the NAS voice: the reported pattern exactly.
- **ARE, the books fold (B).** On main both reading paths build their text from the DOM through `buildFollowMap` (page READ: `TTSControl.jsx` start; lesson target: mapTarget) after `revealAllForReading`; the composed text (`readAloudTextFromArc`, the saved-lesson path) never carries figures. A lesson whose only figure is the books list is skipped whole. A lesson with the list AND another figure (L140) is not: the fold opens and its summary line, which names the list and says optional, open to review, was read. His tab most likely still ran the earlier bundle: `sw-update.js` checks every 10 minutes and on return to the screen, and `useIntakeHold('reading')` defers the update reload while a reading plays.

## Decision

1. The cut keeps a closing quote or bracket on the sentence it closes, keeps a bracketed reference (up to 60 characters) with the verse it follows, and joins any piece with no letter or digit to its neighbour. Every segment is still an exact slice of the text (read-follow locates by indexOf).
2. A kept reference chip is inline in the follow map, never a block.
3. A piece with no word is passed: its highlight advances, nothing is asked for, nothing counts as a failure.
4. One failed NAS piece is asked for once more, fresh; if it still fails, the phone says THAT piece alone (`speakPieceOnPhone`), and the next piece is the NAS voice again. Only a phone voice of the reading's gender may say it (DR-1482); without one, or with the screen off, the queue hands on as before and DR-1482's hold decides. Two failed pieces in a row is the voice gone: the rest is handed on, not asked twice per sentence.
5. The books fold's summary carries `data-read-skip` in every case.
6. Not built here: a prompt telling a long-open tab mid-reading that a new build is live (the update waits for the reading to end). `re-review: 2026-11-27`.

## Impact

- Saved readings: clip keys are per piece text, so the few pieces at a quote boundary are fetched once more, then kept.
- The studio (my voice) queue is unchanged: it passes no fresh ask and no stand-in.

## Verification

- `the-reader-never-switches-at-a-quote.test.jsx`: his paragraph cut with no wordless piece and no piece starting with a closing mark; the real WordInline paragraph mapped with the reference as written; the queue skips a bare quote without a fallback; one bad piece retried, stood in, and the NAS voice resumes; the hook speaks exactly that one piece in a man's voice and asks the NAS for the next; the books fold (closed and opened, list-only and L140) absent from the spoken map and from the composed reading.
- Proven to catch: run against origin/main's six source files (results recorded in the PR).
