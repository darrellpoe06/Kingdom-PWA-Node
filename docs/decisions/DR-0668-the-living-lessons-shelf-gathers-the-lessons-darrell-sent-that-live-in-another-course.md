# DR-0668 — The Living Lessons shelf gathers the lessons Darrell sent that live in another course

- **Status:** accepted
- **Tier:** B
- **Type:** word
- **Date:** 2026-09-29
- **Scope:** `app/src/lib/learn-crosslist.js` (three `CROSS_LISTINGS` rows into the `Living Lessons` department); `app/src/lib/living-lessons-class.js` (one line on L160's in-app card pointing to its companion L197); `app/src/__tests__/living-lessons-shelf-crosslist.test.jsx` (new).
- **Principles:** WORD-FIRST, VERIFICATION-DOCTRINE, SPOKEN-TEACHINGS-ARE-BUILD-INPUT, DECISION-RECORDS
- **Grounds:** Darrell 2026-09-29, after pm12 (DR-0664) and World Issues 18 and 19 (DR-0665, DR-0666) were built outside Living Lessons: "Cross reference or make sure it is offered in living lessons also correct?" Mechanism: DR-0447 / DR-0448 (a cross-listed lesson is a pointer, never a copy), DR-0516 (the same, one level up), DR-0598 (Living Lessons is its own department).

## Context

Four of Darrell's queued teachings were built on 2026-09-29. L197 went into Living Lessons; the other three went where their subject lives: pm12 into Project Management, the psychologists' 2021 apology and the student in the gap into World Issues. Each was sent into the app as a lesson, so a reader who looks for Darrell's lessons in Living Lessons would not find three of them.

## What was measured

Read before changing anything: `learn-crosslist.js` declares lesson cross-listings one line each with a reason; `ChurchLearn.jsx` resolves them for whichever department tab is open (`resolveCrossListed`) and renders them as "Also taught across the curriculum", each row opening the lesson in its home course. Living Lessons is a department of its own (category `Living Lessons`, DR-0598), so the existing mechanism already shows pointers on its tab. No extension was needed. The self-listing gate forbids pointing a lesson into its own department, so L160 and L197 (both Living Lessons) cannot cross-list each other; L197 already names L160 in its text.

## Impact

Without this, three of Darrell's lessons are reachable only from Project Management and World Issues. With it, the Living Lessons tab lists all three, each naming its home course, and opening one opens it there, so it keeps one credit and one place record. Program totals do not move.

## Decision

Three pointers into `Living Lessons`: `project-management :: pm12-titles-and-fruits-capability-shown-in-outcomes`, `world-issues :: wi-apa-2021-apology-and-the-one-blood`, `world-issues :: wi-higher-ed-aid-2026-and-the-student-in-the-gap`, each with its reason. For the companion the other way, one line is added to L160's in-app card naming L197. It went on the card rather than into L160's adult text because adding it there made one of L160's measured bands fall under its full-levels floor (measured: the full-levels gate failed with a new short band); on the card it moves no measured band.

## Verification

`living-lessons-shelf-crosslist.test.jsx` (8 tests): the three declarations resolve to live lessons in the mounted catalog; none is self-listed; the Living Lessons department still counts only its own lessons and the department sum still equals the catalog total; on the real component, the Living Lessons tab shows the three rows naming Project Management and World Issues, and opening pm12 from it writes the place record `project-management :: pm12-…`; L197 names L160 and L160's card names L197. Proven to catch: with the apology lesson removed from the index, `missingCrossListings` reports `world-issues :: wi-apa-2021-apology-and-the-one-blood`. The existing crosslist suites (`learn-crosslist`, `learn-crosslisted-shelf`, `learn-crosslisted-in-the-picker`, `course-crosslist`) and the Living Lessons gates (full-levels, L160, L197, quotation, reading level) pass.
