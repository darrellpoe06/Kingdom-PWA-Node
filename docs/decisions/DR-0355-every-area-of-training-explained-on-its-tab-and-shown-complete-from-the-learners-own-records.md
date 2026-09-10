# DR-0355 — Every area of Training explained on its tab, and shown complete from the learner's own records

**Date:** 2026-09-10 · **Status:** accepted · **Tier:** A · **Area:** tlc · **Principles:** VERIFICATION-DOCTRINE, APP-IS-PRIMARY, EXCELLENCE-STANDARD, DECISION-RECORDS

## Directive, in Darrell's words (2026-09-10)

- On the therapist strip of Training (Training map · Pathways · Certificates · Assigned · Hours · CE renewal · Catalog & required), at "Assigned lessons · Nothing scheduled yet": *"explain each one possible on this tab... then just show it as complete when they do... etc..."*

## What is true (SHOULD / ARE / GAP)

- **SHOULD:** a therapist landing on any area of Training knows what it is, what to do there, and when it counts as done — and sees it marked done once their own records say so.
- **ARE:** each area had a heading and a panel; the strip itself said nothing about what an area was for, and nothing marked an area complete. The completion math already existed per panel (`trackCompletion`, `requirementProgress`, `ceProgress`, `requiredTrainingSummary`, the library's completed courses, the assignments' reviewed state) but only inside the panel, never on the strip.
- **GAP:** the strip was a row of names; a chip gave no reason to open it and no sign it was finished.

## Decisions

1. **Explain each area, as data.** `lib/learn-areas.js` carries a guide per area — what it is, what to do there, and when it is complete — and `learnAreaExplain(id)` renders it as one line under the strip for the open area.
2. **Complete only from real records (P15, DR-0076).** `learnAreaDone(id, state)` derives done from the learner's own state: every track's lessons read and quizzes passed; every course in the library completed; every offered certificate earned; every scheduled lesson reviewed (never done when nothing was scheduled); the pathway's hours logged; the CE cycle's hours and mandated topics met; every required training current. An informational area (What you'll gain, Pathways) is never marked; its line says nothing to complete.
3. **The strip carries it.** `SectionTabs` takes `explain`, `done` and `detail` per section: the explain line under the strip for the open area with the honest count ("3 of 30 hours") or "Complete · …"; a done tab carries a named check (an image labelled *complete*, never text, so a tab's text stays its label and every existing pin holds). Any strip in the app may use it.

## Proof

`learn-areas.test.js` (6: every area explained; an empty record never done; hours, CE, assigned/for you, courses/map, certificates, required trainings each proven both ways); `section-tabs.test.jsx` (+1); `practice-learn-render.test.jsx` (+1: every therapist area's explain line, none complete on an empty record).
