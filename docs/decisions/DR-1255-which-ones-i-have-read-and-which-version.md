# DR-1255: Which ones I have read, and which version — the row says, from every device, and offers the one not read

**Date:** 2026-10-27
**Status:** Accepted
**Area:** `app/src/lib/learn-resume.js`, `app/src/lib/lesson-read-mark.js` (new), `app/src/components/LessonContinue.jsx`, `app/src/components/LatestLessons.jsx`, `app/src/components/ChurchLearn.jsx`, `app/src/components/TTSControl.jsx`, `app/src/components/Presenter.jsx`, `app/src/lib/read-target.js`, `app/src/lib/learner-records.js`, `app/src/lib/learner-records-sync.js`, `app/src/lib/use-learner-records.js`, `infra/supabase/migrations-auto/0312-a-version-read-stays-read.sql` (new), `infra/supabase/tests/0250-learner-records-smoke.sql`, `.github/workflows/ci.yml`
**Follows:** DR-1251 (a lesson played to the end is read), DR-0754 (the learner's record crosses devices), DR-0715 (both numbers: lessons and readings), DR-0631 (one place per lesson), DR-0702 (a place at the start is not progress), DR-0076 (measure, then change)

## Context

Darrell, 2026-10-27, with the Latest list on his tablet — 58 lessons, 290
readings, 58 for every age, and not one row marked: *"Why can't I tell which
ones I've already read?!!!!!!!!!!!!!!!! Even which version so I can try the
one I didn't read!!!!!! Fix it!!!!!!"*

The list had just gained ▶ Play and the device's own Continue / FINISHED mark
(DR-1251). He had read lessons that morning on his phone. The tablet showed
nothing, and nothing anywhere could have said which of a lesson's five
versions he had read.

## What was measured

In the code, before any change (DR-0076 §4):

- **One source, one device.** The row's mark came only from the device's
  place (`lib/learn-resume.js`): FINISHED when THAT device's place carried
  `done` or a finish count. His phone's places never reach the tablet.
- **The cloud record was there and unread by the row.** `learner_lesson_records`
  (0250) carries `completed_at` per lesson and crosses his devices (DR-0754);
  the shell merges it into `progress`. Neither list read it for its mark.
- **A finished lesson opened again showed nothing.** `done` clears the moment a
  reading moves (so the lesson can start from the top, DR-0702); the row
  showed a place only when `done` or in progress, so a lesson read to the end
  and reopened lost its mark on the list — the finish count was there, unread.
- **No version anywhere.** The place counted the LESSON; the record's one row
  per lesson carried the band, not the words. A lesson read to the children
  and the same lesson read as an adult were one fact. The deck's parts are the
  lesson's own `lesson` text (the adult version) in every register
  (`lib/presentable.js`); the lesson space serves the band's own level or the
  words it falls back to (`resolveForAge`).
- **A write erased what it did not say.** `saveLearnerRecord` sent every column
  on every upsert: a mark-read carried `quiz_pct: null` over a passed exam, and
  an exam carried `completed_at: null` over a read.

## Decision

**The version read is recorded, from the words actually served.** The lesson
space names its version on the reading it registers (`versionRead`: the
band's own level, else the words it fell back to — a child handed the adult
text has read the adult version, which is the honest answer and the one that
keeps the child's own version offered). The reader notes that version on the
place once per reading (and again when the level is switched mid-read), so a
finish counts it. The deck names what it read at its end (`deckVersion`: the
adult words whenever the lesson has them; a lesson with only levels reads the
register's own). The guide's last unit counts the version the reader noted,
if one was; else the finish is a finish of a version the device did not
record, and the row says so.

**The place carries `version` and `versions`.** `versions` counts each version
read to the end and ratchets like `finishes`; ids only, never text (the
privacy line of `learn-resume.js` holds). An older finish reads as read,
version unknown.

**The record carries `versions_read`, and the wall keeps the union.** Migration
0312 adds the column (bounded to the five ids by a CHECK) and a BEFORE
INSERT OR UPDATE trigger that keeps every version the row already held, in
the picker's order, each once — a device that has not yet seen what another
device filed can never shrink it. An unknown word is kept, not laundered, so
the CHECK refuses it (the smoke proved the first draft laundered it).

**A reading files its versions; a file never unmarks.** `toggleClassModule`
called with `{ versionsRead }` marks the lesson read if it is not and sends
the versions; the tap still toggles. The course filer sends a finished place
whenever the record lacks a version it holds, and counts a finish by its
count, not its flag. A write names only the columns it was told.

**The row answers from everything the app holds.** `readMark` joins the
device's place, the learner's own record (his row, never another learner's)
and the versions the lesson really carries: "✓ READ · Adult", "✓ READ ×2 ·
Teen, Adult", "✓ READ · version not recorded", or "✓ READ" on a one-version
lesson — with a tap for each version not read that sets the band to it,
lifts a standing depth override, opens the lesson and starts the reading at
the top. On both lists.

## Impact

- A lesson read on his phone is marked on his tablet; which version he read is
  named; the one he has not read is one tap away. A lesson finished and
  reopened stays marked.
- A mark-read no longer erases an exam, and an exam no longer erases a read.
- The place map grows by two small fields per lesson; no text is stored.

## Verification

- `which-ones-i-have-read.test.js` (23): the ids are one set everywhere; the
  per-version count ratchets and nothing lowers it; the noted version is
  counted by a bare finish; unknown ids are never stored; an older finish is
  read with no version; the words served per band, with fallbacks and the
  override; the deck's version per register; the mark from device, record,
  both, none; proven-to-catch: finished-then-reopened stays read; the wiring
  pinned as source contracts.
- `the-row-says-which-version-i-read.test.jsx` (5): the Latest list rendered
  — the mark, its aria sentence, the taps and their door, the record-only
  row, the no-version record, device and record together, Continue intact.
- `a-read-is-filed-with-its-version.test.jsx` (6): the row carries the
  column; a write names only what it was told (proven-to-catch for the exam
  and the read); the hook files without unmarking and still toggles.
- `a-lesson-played-to-the-end-is-read` re-pinned: the deck files `['adult']`.
- 0312 applied twice and the learner-record smoke green on a local
  PostgreSQL 16, cases 8–9 added (the union across devices, the empty
  update, the exam that leaves the read, the refused word); CI applies 0312
  in the learner-records job.
- Lint clean on every touched file.

## Not done, and why

- ~~The guide walked step by step without the reader does not name its
  version.~~ Closed the same day by **DR-1257**: every write of the place from
  the lesson space names the version it serves, and an older read is
  attributed to the band's version.
- The Class Record panel and `lessons-walked.js` still read the band, not the
  versions; the column is on the row and ready for them. `re-review: 2026-11-10`.
