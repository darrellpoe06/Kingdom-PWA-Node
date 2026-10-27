# DR-1257: The version is recorded naturally, an older read is the band's version, and the row keeps its look

**Date:** 2026-10-27
**Status:** Accepted
**Area:** `app/src/components/ChurchLearn.jsx`, `app/src/lib/lesson-read-mark.js`, `app/src/components/LessonContinue.jsx`, `app/src/components/LatestLessons.jsx`
**Follows:** DR-1255 (which ones I have read, and which version), DR-0246 (tab content stretches the full width), DR-0076 (measure, then change)

## Context

Darrell, 2026-10-27, three messages inside the hour DR-1255 shipped. On its
one dated limit (the guide walked without the reader records no version):
*"The version read should be recorded naturally.... obviously!!!!!!"* Then,
with L247 on his tablet reading "✓ READ ×2 · VERSION NOT RECORDED" beside
five version taps that had squeezed the title to one word per line: *"2x...
if I don't know what I read... or which version... how can I read the
others?!"* and *"the flow of the app and look...."*

## What was measured

- **The place was written from the lesson space on six roads** (a title tap,
  Start, Play, a step, Start over, a resume) through one function,
  `savePlace`, and none of them named the version; only the reader (from its
  registered target) and the deck (at its end) did. So a guide walked step by
  step and finished by its end door counted a version of nothing.
- **His two reads of L247 predate the version.** The device held
  `finishes: 2, versions: {}`; the record, when filed, holds `age_band` as it
  was at filing. The words a reading serves are decided by the band
  (`resolveForAge`), so the band on record is evidence of the version read.
- **The look.** The mark's wrapper sat inline in a `flex` row beside a
  `flex-1 min-w-0` title; five taps cannot shrink, so the title did, to its
  narrowest word. The consistency guard (DR-0246) refuses a width cap, rightly.

## Decision

**Recorded naturally.** `savePlace` names the version the space serves the
lesson at the reader's band (`versionRead(m, ageBand, levelOverride)`) on
every write, so a start, a step, a part and the end door all carry it, and a
finish by any road counts it. The reader and the deck keep naming theirs; the
three agree because they read the same words.

**An older read is the band's version, said so.** A finish with no version
named is attributed to the version the reader's band is served — the band on
the record where the read was filed, else the device's — and the sentence
says it was not recorded at the time. A recorded version is never overridden;
a band the lesson does not serve attributes nothing. The other versions are
offered, which is the whole point: he can read the ones he has not.

**The row wraps.** Both lesson rows are `flex-wrap`; a mark with taps to
offer is `order-last basis-full`, its own line under the title, right-aligned;
a mark with none stays inline. No width cap.

## Impact

- "✓ READ ×2 · Adult" with Child, Youth, Teen and Senior to tap, on L247 and
  every lesson read before today, from the band on record.
- Every road into a lesson records the version from now on.
- DR-1255's first dated limit is closed here; its second (the Class Record
  panel shows the band, not the versions) keeps `re-review: 2026-11-10`.

## Verification

- `the-version-is-recorded-naturally.test.jsx` (6) on the real component and
  catalog: opening a lesson as an adult notes `adult` and the end door counts
  it with no reader; opening as a child notes the version the child band is
  served (proven-to-catch against the adult default); the attributed mark and
  its sentence; a recorded version never overridden; the record's band wins
  over the device's; the row wraps, the mark with taps is last and full-width
  with no width cap, the inline mark stays inline, ▶ Play stays on the row.
- `the-row-says-which-version-i-read`, `which-ones-i-have-read` and the
  consistency guard green; lint clean.
