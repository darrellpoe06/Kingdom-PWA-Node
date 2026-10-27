# DR-1261: The library is filled perpetually — the census, the queue, the ratchet, and how the record and the learning are managed

**Date:** 2026-10-27
**Status:** Accepted
**Area:** `app/src/lib/library-census.js` (new), `app/src/lib/library-census-baseline.json` (new), `app/src/components/LibraryCensus.jsx` (new), `app/src/components/ChurchLearn.jsx`, `app/src/__tests__/the-library-is-filled-perpetually.test.js` (new)
**Follows:** DR-0418 (every age version is the full message), DR-0484 (four versions or one repeated), DR-0715 (lessons beside readings), DR-0754 (the record), DR-1255 / DR-1257 / DR-1260 (which version, the record announced), DR-0075 (perpetual improvement), DR-0076 (measure, then change), DR-0108 (review our Ways)

## Context

Darrell, 2026-10-27, after the record strip: *"Make sure we are filling the
course library perpetually with all levels and necessary components and
information and understanding make sense of the management of the course
records and strategies that will help with learning content... make sense?"*

It does: a record is only as good as the library it measures against, and a
library is only being filled if something counts it and something works the
count down.

## What was measured

On the catalog the tests mount (44 courses, 691 lessons; the app mounts 855
with the shell's own courses), by `censusLibrary`, before any change:

| What | Count |
|---|---|
| Readings written, of five per lesson | 3,057 of 3,455 |
| Lessons carrying all five versions | 417 (150 carry four, 124 three) |
| Lessons whole — every version and every part | 317 |
| Lessons with an exam | 676 |
| Lessons waiting for a version or a part | 374 |

What the waiting lessons wait for: the Youth version (239), the Child version
(115), a distinct Adult text (35: four courses whose adult reader is served
the senior words), the Teen version (8), the Senior version (1); a run of
show (143), talking points (49), benefits (18), an exam (15). 72 adult
lessons run under 400 words. Whole courses with the child and youth versions
missing: the fourteen property, finance, broadcast, data-systems and sound
courses; healthy-living has no exams and no benefits at all.

The gates that exist — `full-levels` (shrink-only debt, DR-0418),
`band-differentiation`, `course-band-coverage`, the builder's `band_gates`
— hold NEW work to the standard and keep the old debt from growing. Nothing
counted the whole library in one place, nothing said which lesson waits for
which version, nothing in the app showed it, and no lane worked the list.

## Decision

**The census is a standing instrument, from the mounted catalog.**
`censusLibrary` answers, per lesson, which of the five versions it carries
(real distinct text, never a key's presence) and which of the eight parts a
lesson is built from it has; per course and in total; and derives the GAP
QUEUE: every lesson still waiting, newest first, naming what it waits for.

**It is in the app, beside the record.** The Record area carries "The
library" under the Class record: the counted line on the fold, the four
figures, the course-by-course table with what each waits for, the head of
the queue, and two paragraphs that say how the library is managed and how
learning is measured — for everyone, since it holds no personal data.

**The library never shrinks (the ratchet).** `library-census-baseline.json`
freezes the counts; the test fails the build when readings, whole lessons,
every-version lessons or exams fall below it, or waiting rises above it, or
a new lesson adds to the wait. A gain re-freezes the baseline by hand in
the PR that earned it (the DR-0418 pattern). Proven-to-catch on one lost
version.

**The filling lane works the queue, newest first.** The queue is the work
list; the builder on the NAS, which already writes all bands for a NEW
lesson through the band gates, is the writer. Writing a missing version
INTO an existing lesson is a splice into the course's own source file, and
the 45 course files are not one shape (living-lessons holds 227 `levels`
objects inline; sovereign-ai 36 for 52 lessons; healthy-living one): the
splice must be proven per file before a job runs it unattended. That job is
built next, with budget, lock and the band gates, shipped inactive, and
activated on proof (DR-0225). `re-review: 2026-11-03`.

**How the record and the learning are managed (the Way, DR-0108).**
Three answers, one place: the RECORD says what a learner did (read to the
end, in which version, the exam at the 70% line, on every device); the
LIBRARY says what exists to do it with; the QUEUE says what is still being
written. The strategies in force: five versions of the one message so every
reader gets the full lesson in their own words; an exam on every lesson, the
score as competence; the read mark and the one next step on every Learn
area; the Word first in every lesson; and nothing waits silently — every
gap is counted, queued, and worked down.

## Impact

- Anyone can see what the library holds and what it still waits for, in the
  app, counted live.
- A lost version or an incomplete new lesson cannot merge.
- 374 waits are named and ordered; the writer job is the next build.

## Verification

- `the-library-is-filled-perpetually.test.js` (7): a whole lesson; a lesson
  naming each missing version and part, and short; the ids match the
  picker; the totals, the per-course order, the queue newest first with
  undated last, the line and the counts; the real-catalog ratchet in every
  direction; a new lesson may not add to the wait; proven-to-catch — one
  lost version fails the ratchet.
- Lint clean on every touched file.
