# DR-1630: One lesson is one lesson

**Date:** 2026-11-24
**Status:** Accepted
**Tier:** A (one count on the course picker; no schema, no data)
**Type:** decision
**Area:** `app/src/lib/learn-organize.js` (`libraryStanding`)
**Sent in by:** Darrell, 2026-11-24, with the course picker reading "149 of 994 lessons read" above a Latest list reading "All 993 lessons": *"993 or 994 lessons currently? Can't be both!!!!!!!"*
**Pairs with:** DR-1420 (where the reader stands), DR-0687 (the Latest count line), DR-0076

## Context

L153 is authored once in Living Lessons and carried whole into Sovereign A.I. under `sharedWith`. The Latest list has listed it once since 2026-10-27 and says so. The standing line summed each course's schedule length and so counted it twice.

## What was measured

Before: `libraryStanding` added `courseLessonCount(c)` per course: 994 on his screen beside Latest's 993. After: the total is the number of distinct lessons, a carried copy counted at its home. `course-standing-on-the-list.test.jsx` 9 green: 3 + 2 schedule rows with one carried lesson total 4; read through the second door alone counts 1; read through both counts 1; with the home course not mounted the copy counts as its own lesson.

## Impact

The two totals on the Learn page agree. A reader who finished the carried lesson in either course is credited once.

## Decision

1. The library total counts a lesson once: a `sharedWith` copy whose home course is mounted is the home lesson.
2. It reads as read when either door was read.
3. Each course still counts its own lessons on its own row; only the library total dedupes.
