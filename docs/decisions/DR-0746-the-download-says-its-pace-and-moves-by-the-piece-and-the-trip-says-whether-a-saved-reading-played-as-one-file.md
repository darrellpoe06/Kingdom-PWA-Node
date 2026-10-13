# DR-0746 — The download says its pace and moves by the piece, and the trip says whether a saved reading played as one file

- **Status:** accepted (built and proven in the suite; the live proof is the next download on his phone and the next `[reader]` line on a note)
- **Tier:** A (copy and progress on the download panel; one fact added to the reader's trip; no table, no policy, no money)
- **Type:** defect
- **Date:** 2026-10-02
- **Scope:** `app/src/lib/lesson-downloads.js` (`SYNTH_CHARS_PER_SECOND`, `DOWNLOAD_STREAMS`, `paceSeconds`, `paceWords`; the plan carries `voiceChars` and `paceSeconds`; the run reports every piece, the bytes, the measured pace, the last piece's time and the last error), `app/src/components/LessonDownloads.jsx` (`progressText`, `progressFraction`, `stallWords`, `STALL_AFTER_MS`; the pace line before the start; the bar by the piece), `app/src/lib/use-read-aloud.js` (the trip notes `join` / `join-missed`), `app/src/lib/reader-trip.js` (the summary says it), `app/src/__tests__/the-download-says-its-pace.test.jsx` (new), `app/src/__tests__/reader-trip.test.js` (two cases), `docs/decisions/INDEX.md`.
- **Principles:** VERIFICATION-DOCTRINE (DR-0076: a pace from a measured run, a bar from counted pieces, never a painted number), DR-0100 (the pace of the church computer stated plainly), DR-0738 (the reader keeps its own trip), DR-0744 (the trip rides with feedback), DR-0722 (downloads), DR-0718 (a saved reading plays as one file), HOLD-THE-HAND (DR-0621).
- **Grounds:** Darrell, 2026-10-02, three messages. On "Download every lesson": *"Huge amount of data to download... can we make them lighter?"* On L105 with every level and the voice, "0 of 1 saved" over an empty bar: *"Not downloading..."* Three minutes later, L105 marked Saved: *"It did it... I guess... it didn't show the progress bar.. until it was downloaded... make sense?"* And then, playing the saved lesson: *"Still turns off when in the background!!!!!!!!"*

## Context

**SHOULD.** DR-0722: a download says what it will take before it starts and shows its progress while it runs. DR-0718: a saved reading plays as one file so the phone keeps it playing off screen. DR-0738 / DR-0744: when a reading stops, the phone's own account of it reaches the steward.

## What was measured (SHOULD → ARE → GAPS, DR-0219)

**ARE, the pace.** The reading voice is made on the church computer as the download runs, one sentence at a time. Measured 2026-10-01 (`voice-lite-probe` run 36926132891, outside-in through poetech.us): six pieces of 861 characters took 43.7 s to make, 19.7 characters a second on one stream; the download runs two streams (the NAS takes two at a time). L105 with every level is about 50,000 characters of voice: about 21 minutes at that pace, and he saw it finish in about three, so the two streams and the NAS cache did better than the floor. "Every lesson with the voice" (37 MB of words, about 37 million characters) is about 11 days of synthesis at the measured pace. The panel never said any of this.

**ARE, the bar.** `runDownload` reported progress only when a whole lesson landed (`report()` after each lesson), and the bar was lessons done over lessons total. One lesson with every level is hundreds of pieces, so for the whole run the bar stayed at zero and the line read "0 of 1 saved". That is his screenshot, and his "Not downloading...".

**ARE, the background stop.** A saved reading is joined into one WAV and played start to finish only when every piece is on the device under the same key the reader asks for (the same voice, the same cut of the same text); otherwise it plays piece by piece, and a phone can stop a piece-by-piece read off screen. Which of the two happened on his phone is not written anywhere: the trip (DR-0738) records the voice, the pieces, the dark screen and a hand-off, not whether the join was made. So "Still turns off" cannot yet be told apart from "played piece by piece because one piece was missing", and the fix cannot be aimed.

**ARE, the size.** A piece is 16-bit 22,050 Hz PCM WAV at 44,100 bytes a second (DR-0722's measurement, 4,400 bytes a character). That is why "every lesson" reads 31.3 GB and 61.6 GB. A compressed clip is the structural answer and is its own record, in flight.

**ARE, a piece fetched twice.** Found by the new test while counting: when one level says the same sentence twice, both occurrences went into the missing list and the two workers fetched the same key side by side (L105's four children's levels: 181 fetches for 173 new pieces). Eight syntheses the church computer did for nothing.

**GAPS.** (1) No pace before the start. (2) A bar that cannot move for an hour. (3) No stall or refusal said in words while it runs. (4) The trip does not say whether the saved reading played as one file. (5) A sentence said twice in one level was fetched twice.

## Impact

Before a download starts, the panel says how long the church computer needs for that choice, and for a plan of hours it says to save the words and let the voice be kept as you listen. While it runs, the line reads "0 of 1 lesson saved · 37 of 312 voice pieces · 14 MB · about 32 minutes more at this pace", the bar moves by the piece, and a long silence or a refusal is said. After a saved reading stops, the next note sent from the lesson carries whether it played as one file or why not, so the fix is aimed at a fact.

## Decision

1. **The pace is said before the start** (`paceSeconds`, `paceWords`): the plan's voice characters over the measured 19.7 characters a second per stream, two streams; "about N seconds / minutes / hours / days". Over three hours, the line adds: save the words only and the voice is kept as you listen.
2. **The run reports every piece**: `pieces {done, total, fetched, held}`, the bytes on the device, the characters made and the pace measured from them, when the last piece landed, and the last error. A piece is counted once in a run, as the plan counts it (the same sentence in two levels is one piece), and a sentence said twice in one level is fetched once. The panel's line and bar read from them; "N more at this pace" uses the run's own measured pace, never the estimate.
3. **A stall is said** (`stallWords`): a refused piece names its reason ("The reading voice was busy. Trying the next."); no piece for 45 seconds says the church computer is making it and the download waits, it does not give up.
4. **The trip says whether a saved reading played as one file**: `join {pieces, bytes, seconds}` when the join was made; `join-missed {reason: not-saved | missing-piece i of n | not-joinable}` when it was not; `tripSummary` writes "played as one file" or "played piece by piece: …". The next `[reader]` line on a note carries it (DR-0744).

## Verification

- `the-download-says-its-pace.test.jsx` (9 tests): `paceSeconds` reads characters over streams; `paceWords` says seconds, minutes, hours, days; a plan with the voice carries its characters and pace, words only none; **proven to catch:** progress reports arrive between the first and the last, counting pieces, bytes, characters and the pace, held pieces counted and never fetched again (none arrive against the old run); a refused piece is the last error; `progressText`, `progressFraction` and `stallWords` read as specified; the panel shows the pace line with the voice and none without.
- `reader-trip.test.js`: a trip with a `join` event says "played as one file"; with `join-missed` says "played piece by piece: piece 12 of 60 was not on the device".
- `lesson-downloads.test.jsx` (16 tests): unchanged and green.
- Lint clean.
- **Live proof:** the next download on his phone shows pieces moving; the next note from a saved lesson that stopped reads `[reader] … played as one file` or `… piece by piece: …`. `re-review: 2026-10-04`.

## Limits, stated

1. The pace before the start is a floor from one measured run on one stream; the run's own line corrects it within the first pieces.
2. The size of the clips is unchanged here; the compressed clip (Opus from the NAS, with the one-file join decoding it) is its own record in flight.
3. Whether his saved L105 played as one file is not known until the next note; this record makes it knowable, it does not claim the answer.
