# DR-1261: The record is announced — how much was consumed, what the exams prove, and the next thing to do, at the top of Learn

**Date:** 2026-10-27
**Status:** Accepted
**Area:** `app/src/lib/record-headline.js` (new), `app/src/components/RecordStrip.jsx` (new), `app/src/components/ChurchLearn.jsx`, `app/src/lib/learner-records.js`, `app/src/components/LearnersPanel.jsx`
**Follows:** DR-0754 (the learner's record reaches the Governor), DR-1255 / DR-1257 (which version was read), DR-1251 (a lesson played to the end is read), DR-0381 (a surface says its live state), DR-0076 (measure, then change)

## Context

Darrell, 2026-10-27, with his Class Record open on the tablet (54 lessons
read, average 100%, 3 exams passed, "MASTERED"): *"The record should be more
announced so it can be used and known for how much knowledge has been
consumed and how many test reflect the competence of the information... so
users can be motivated to do more or finish more tests and reading... make
sense?"*

It does. A record nobody sees motivates nobody.

## What was measured

- **Where the record lived.** Folded in a `<details>` under ONE Learn area
  (Record), reached by a tab whose explain line was one grey sentence. On
  Lessons, Latest, Find and Downloads — where the reading happens — nothing
  of it showed.
- **What it could say and did not.** The rows hold completion, the exam
  score, the attempts and (since 0312) the versions read; the device holds
  finishes and versions; the catalog knows how many lessons there are, how
  many carry an exam (676 of the 691 catalog lessons do), and how many
  versions each carries. No surface joined them into "how much of it", nor
  named the next thing to do.
- **The panel's own figures** were four: lessons read, exams taken, exams
  passed, average. The versions read, on the row since DR-1255, were not
  among them.

## Decision

**One headline, counted from everything the app holds** (`recordHeadline`):
the learner's own rows, the device's places, the shell's merged maps and
the mounted catalog — lessons read of the total and the percent, readings
read of the total, versions read of five, exams passed of taken with the
average and the competency the exams earned, exams still to answer, and
the ONE next step: the newest lesson read whose exam is not yet answered;
else a version never read, on the newest lesson that carries it; else the
next lesson. "Untested" counts only lessons that have an exam. A read that
predates the version is the band's version (DR-1257). Nothing is painted.

**The strip** (`RecordStrip`) stands under the sticky lessons bar on every
Learn area while no lesson is open, signed in: the headline, the competency,
the detail line, the next step as a tap that opens that lesson (or that
version), and "Open your record". It refreshes when a row arrives and the
moment a reading finishes (DR-1251's event). The Record tab carries the
count ("Record · 54").

**The record itself** gains a "Versions read" figure, with how many of the
five remain — DR-1255's second limit, closed.

## Impact

- A reader on any Learn area sees what they have consumed and what the
  exams prove, and has one tap to the next exam or the next version.
- "Record · N" on the tab says the record is not empty before it is opened.
- No new data is stored; one strip of chrome under the bar.

## Verification

- `the-record-is-announced.test.jsx` (9): the headline from rows + device +
  maps against the catalog (a row for a lesson the catalog lacks is not
  counted; readings and versions counted; the exam union; the next exam as
  the newest untested read); every exam answered → the next version on the
  newest lesson that carries it; nothing read → honest zero and "Read the
  next lesson"; an older read counts the band's version; the summary names
  the versions read; the panel shows the figure and says "Not recorded yet"
  honestly; on the real component with the real catalog: the strip under the
  bar, its counted line against the bar's own total, the competency, the next
  exam, "Record · 2" on the tab, "Open your record" opening the Record area,
  the next step opening the lesson, the strip stepping aside while a lesson
  is open, a device finish counted before its row arrives, and no strip
  signed out (proven-to-catch).
- `learners-panel` and `learner-records` suites green; lint clean.
