# DR-1439: Understanding comes by repetition, order means nothing, reading counts on its own, and the most studied and the most room to grow are named

**Date:** 2026-11-12
**Status:** Accepted
**Tier:** A (how his own record is read; no data changed)
**Type:** decision
**Area:** `app/src/lib/course-pace.js` (`standing` reading/tested/tries, `mostStudied`), `components/LearnersPanel.jsx` (`TakenAndGraded`, `StandingAndPace`), `components/UnderstoodGoals.jsx`
**Sent in by:** Darrell, 2026-11-12, with two screenshots of his record, in substance:
- the numbers do not make sense;
- the screen devalues reading;
- whether a test was taken before or after the reading does not mean anything, and getting the understanding is what means most;
- understanding comes from the repetition of the study, and it promotes rigor;
- show the most studied subjects and material, and the most opportunities to grow understanding.

**Supersedes in part:** DR-1386 (the order-of-attempt figures), DR-1417 (the rushed and quick-retake test on a lion)
**Pairs with:** DR-1422, DR-1434

## Context
His record answered "how many understood?" in two different ways on one screen.

## What was measured
- **Two definitions on one screen.**
  - Understood read **5 of 47**. It counted only attempts in the history (kept since 0313), only after the reading, and never a retake within a minute.
  - Mastered at 100% read **51 of 923** from the rows, in any order.
- **Order figures beside them.** "Taken after the lesson", "Passed before the lesson" and "Retakes within a minute" divided the same study by order and timing.
- **No count for reading alone.** No figure showed courses read in full.

## Impact
One reading of the record, everywhere on the card. Reading has its own count, every try counts as study, and understanding is the measure that matters most.

## Decision
- **One reading of the record.** "Understanding" and "Where you stand" both use `courseStanding`, so they cannot disagree.
- **Understood** means read in full with every answer right, in either order, after as many tries as it takes. It is the same number as **Understood at 100%**, one lion per lesson.
- **Read and passed** means the lesson read and its exam passed, in either order.
- **Times tested** is shown as study: "every try is study; repetition is rigor".
- **Set aside:** taken after, passed before, and retakes within a minute.
- **Where you stand adds Courses read in full and Lessons read**, beside Courses fully completed, Read and passed, and Understood at 100%.
- **Most studied** ranks the top three courses by times tested, then lessons read.
- **Mindsets to master** (his words, rendered for meaning): read in full; repeat the study; hold the rigor at 100%.
- **Most opportunities to grow understanding** ranks the top three courses by lessons studied (read or tested) but not yet at 100%. These are the nearest gains.

## Verification
- **`learners-panel.test.jsx`, 27 green.**
  - Proven to catch: a 100% reached thirty seconds after a miss is a lion (it was 0 before); none of the set-aside figures is drawn.
  - A pass before the reading counts once the lesson is read.
  - Most studied and the room to grow are named.
- **`course-pace.test.js`, 24 green.** Courses read in full, lessons read, tested, tries, the most-studied order, and the growth ranking (a course fully understood or never opened is left out).
- **Other suites.** `record-marks`, `test-integrity`, `course-standing`, `family-standing` green; lint clean.

`re-review: 2026-11-13`: confirm on his live record that Understood equals Understood at 100%.
