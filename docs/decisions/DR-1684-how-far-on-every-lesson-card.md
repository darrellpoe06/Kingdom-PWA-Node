# DR-1684: how far, on every lesson card — and the new look's reading finally writes its place

**Date:** 2026-11-26
**Status:** Accepted
**Tier:** A — additive surface over an existing device-local record; no new data, no schema, nothing sent
**Type:** feature
**Area:** `lib/lesson-progress.js` (new), `components/LessonProgressBar.jsx` (new), the learn-studio views, `LessonContinue.jsx`, `presentation.js`, `ChurchLearn.jsx` (net zero lines)
**Pairs with:** DR-1293, DR-1419, DR-0631, DR-1384/1386, DR-1662, DR-0099, DR-0076
**Session note:** `docs/99-session-notes/2026-11-26-how-far-on-every-lesson-card.md`

## Context

Darrell, 2026-11-26, on the new-look Learn grid: "Possibly a indicator bar that
shows how far a lesson has been listened to or read so we can pick the ones we
are closest to finishing etc... make sense?" Then: "For all lessons not just these."

## What was measured

1. The number already exists: each lesson's device-local place carries `seen`
   and `heard`, shares of the version's WORDS (DR-1293), so it survives a
   re-paced age band. A step or sentence index has no total; it is never a %.
2. It was shown only on the classic row ("Continue · 38% read", DR-1419).
3. **Gap:** the new-look Experience opened from the grid got no-op
   `onSeen/onHeard/onLevel`, so a reading there wrote nothing at all.
4. The grid's places were refreshed only on a finish, so a half-read lesson
   came back to a grid that did not know it.
5. "Closest to finished" existed for courses only, never for lessons.

## Decision

1. One number (`lessonProgress`: null with no record or nothing measured; the
   measured fraction; full when credited) and one drawer (`LessonProgressBar`:
   studio gold strip, classic theme tokens, on-color `currentColor`). Gold,
   never red (DR-0099). No motion. Words for screen readers, said once.
2. On every Learn surface that lists lessons, new look and classic.
3. Closest to Finished by lesson across the catalog: a new-look row, and a
   Latest | Closest to finished order on the classic offer. Never a streak.
4. `studioWitness` gives the Experience real witnesses (same place as
   `savePlace`, read credited on the same floor as `finishRead`); closing it
   re-reads the places.

## Impact

Privacy unchanged (reads the reader's own device place only). A lesson read in
the new look now reaches Continue, the read marks and the record, which it
silently did not before. ChurchLearn holds its budget.

## Verification

`lesson-progress-bar.test.jsx`, 19 cases (fixtures incl. no record, re-paced,
finished; card renders only from a record; ordering; witnesses end to end).
Painted-value gate proven to catch (60% fixture, literal-width drawer); a
step-as-50% mutation failed 4 cases. Contrast >= 3:1 measured in all 11
themes. Live: Prophetic Voices grid 82/41/100/14%, none on unread; no overflow
at 360/390/1024 px.

## Not done, with why

The classic Continue offer lists only places with a step (DR-0702), so an
Experience-only reading is absent there; widening it is its own decision. ContinueChip has no bar (a control). `re-review: 2026-12-10`.
