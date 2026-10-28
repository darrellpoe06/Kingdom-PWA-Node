# DR-1262: The library is filled perpetually — the census, the queue, the ratchet, and how the record and the learning are managed

**Date:** 2026-10-27
**Status:** Accepted
**Area:** `app/src/lib/library-census.js`, `app/src/lib/library-census-baseline.json`, `app/src/components/LibraryCensus.jsx`, `app/src/components/ChurchLearn.jsx`, `scripts/library-gaps.mjs`, `scripts/splice-lesson-level.mjs`, `scripts/register-json-imports.mjs` + `scripts/json-loader-hooks.mjs`, `infra/nas-lesson-builder/fill_versions.py` + `test_fill_versions.py`, `poetech-fill-versions.service` + `.timer`, `install-fill-versions.sh`, `infra/nas-loops/services.json` (fill-versions, enabled:false)
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

**The filling lane works the queue, newest first — built, proven, shipped
inactive.** `infra/nas-lesson-builder/fill_versions.py` is a oneshot the
NAS timer fires four times a day: it reads the same queue the app shows
(`scripts/library-gaps.mjs`, through `scripts/register-json-imports.mjs` so
plain node can import the catalog), takes a lesson's missing band (child,
youth, teen, senior), asks the primary writer for THAT band whole with the
lesson's own verses verbatim, gates it (the verse scan, the band's share of
the adult lesson, the child ceiling, differentiation; shortness already in
OTHER bands is not this write's fault), splices it into the course file by
the file's parse tree (`scripts/splice-lesson-level.mjs`, acorn; a result
that would not parse is refused, never written), runs the local ratchet,
and pushes a `claude/fill-*` branch the lane opens as a PR — CI is the
brake. A lesson waiting for the ADULT text is the lesson, not a version,
and is reported, not written; the 26 lessons of healthy-living and
who-he-is are built from data with no literal to splice, and are named and
skipped. Brakes: 2 per run, 6 per day (a ledger that survives restarts),
30 minutes of wall clock, one instance (O_EXCL), and the registry switch
`fill-versions` in `infra/nas-loops/services.json`, SHIPPED `enabled:false`
(DR-0225, the AI-class rule: a writer spends). The installer arms and
disarms the timer from that flag each services-sync cycle; the job re-reads
it before every run. Activation is the flip, with the first passes watched.

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
- 374 waits are named and ordered; the fill lane is installed on the NAS,
  off until the registry says on; each pass it writes two versions through
  the gates and the lane, and the ratchet counts them in.

## Verification

- `the-splice-lands-in-every-course-file.test.js` (4): every placed lesson
  located by the parse tree; a marker version spliced into a copy of every
  course file that declares lessons imports back as that lesson's version
  (added-band, replaced, added-levels); the two data-built courses are the
  only unplaced ones; a foreign lesson or band is refused.
- `test_fill_versions.py` (14): the plan skips the adult text and data-built
  lessons and stops at the tighter budget; the prompt asks for one band
  whole with the verses; a reply that is not that band is refused; the gate
  judges only this band and refuses a verse fault, a short band, a child
  over the ceiling and alike bands; a run writes within budget, splices,
  commits, pushes and keeps the ledger; the kill switch, the lock, the day
  budget across runs, a refused band, a refused splice, failing local gates
  and no reachable writer each stop the push.
- `the-library-is-filled-perpetually.test.js` (7): a whole lesson; a lesson
  naming each missing version and part, and short; the ids match the
  picker; the totals, the per-course order, the queue newest first with
  undated last, the line and the counts; the real-catalog ratchet in every
  direction; a new lesson may not add to the wait; proven-to-catch — one
  lost version fails the ratchet.
- Lint clean on every touched file.
