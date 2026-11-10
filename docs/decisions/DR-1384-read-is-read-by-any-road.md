# DR-1384: Read is read by any road — a passed exam, Done, or every part seen finishes the reading, so the list shows ✓ READ

**Date:** 2026-11-10
**Status:** Accepted
**Tier:** A (when a reading counts as finished; no schema, no money)
**Type:** surface + record
**Area:** Learn space read marks (ChurchLearn, lib/learn-resume.js, lib/lesson-read-mark.js)
**Sent in by:** Darrell — three screenshots of L3 and one message, 2026-11-10
**Pairs with:** DR-1255 (which lessons I have read, and which version), DR-1251 (a finish is filed to the record at once), DR-1257 (the version is recorded naturally), DR-0631 (leaving by the end door is finishing)

## Context

His words: "I took the exam and passed and still the receipt and record passed however it doesn't look like I read it... fix it..." His screenshots show L3 at "ALL READ · seen 100%" with Done marked, while the list shows ✓ READ · ADULT on L1 and L2 and nothing on L3.

## What was measured

- The list's mark is read from a finished place or the learner's record (`readMark`). A place was finished only by the read-aloud's last sentence, the deck's last part, or the guide's end door in the lesson's own space.
- Three real readings never finished a place: every part seen by hand (seen reaches 1), a passed exam, and Done. So L3 was recorded as Done and passed, and still not as read.

## Impact

**What this obligates.** A reading counts by any road the reader takes. Each of the three finishes the place once, with the version its band was served, and the finish is filed to the record the same moment (DR-1251). Un-marking Done finishes nothing; half seen is not read; a finished place is never finished twice by these roads. **Honest limits.** A lesson already marked Done before this change is filed when it is next opened and its place is written, or when Done is pressed again; nothing back-fills on its own.

## Decision

1. `ChurchLearn.jsx` gains `finishRead(id)`: if the place is not finished, `finishPlace` with the served version.
2. It is called when seen reaches 1 as the place is read back, when Done is pressed on (not off), and when an exam result arrives with `passed`.

## Verification

- `read-is-read-by-any-road.test.jsx`: 4 cases. Done finishes and files `{ versionsRead: ['adult'] }`. Seen 1 finishes on the next place write. The pass hook is pinned. Un-Done and half seen finish nothing. Proven to catch: with the two calls removed, the Done and seen cases fail.
- Neighbour gates green: played-to-the-end, which-ones-I-have-read, version recorded naturally, the row names the version, a read is filed with its version (64 cases with the lesson-space gates).
