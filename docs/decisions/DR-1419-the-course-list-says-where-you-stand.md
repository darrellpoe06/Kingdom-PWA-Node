# DR-1419: The course list says where you stand, and offers the two nearest wins

**Date:** 2026-11-10
**Status:** Accepted
**Tier:** B (a visible change to the Learn course picker; no data, no schema)
**Type:** feature
**Area:** `app/src/lib/learn-organize.js` (`courseStandingLabel`, `libraryStanding`, `lowHangingFruit`), `app/src/components/CourseFruit.jsx`, three existing lines in `ChurchLearn.jsx`
**Sent in by:** Darrell, 2026-11-10, the open course picker (51 courses, each with a lesson count and nothing else): "Show the percentage of the ones completed vs not started in locations that motivate reading like here and other obvious locations"; "When I see the whole list... I want to start courses that I don't have a record for"; "Low hanging fruit type of information that provokes to good Word time"
**Pairs with:** DR-0686 (every order whose data exists), DR-1183 (one list), DR-0381 (a surface says what is true), DR-1339 (file ceilings)

## Context

The picker said "LL-101 · Living Lessons from the Word · 296 lessons". Whether the reader had finished it, begun it or never opened it was known to the app (the "Not started first" order already sorts by it) and said nowhere on the list.

## Reality trace

- **Real data:** `courseStanding()`, which counts a lesson done when the signed-in record marks it read or this device finished reading it. No second count was made.
- **The surface:** the Learn course picker, the screen in his screenshot.
- **Premise:** `ChurchLearn.jsx` is at its ceiling (5,998 lines), so the picker changes are on three existing lines and the new surface is its own component.

## Decision

- **Every course in the picker says its standing:** "not started", "3 of 8 read · 37%", "begun, none finished", or "all 8 read". The percentage is floored, so it reads 100 only when every lesson is read.
- **The whole list in one line, under the picker:** how many courses are not started, begun and finished, and the lessons read of all of them, with a bar.
- **The two nearest wins, each one tap into the course:** "Closest to finished" (the course already begun with the fewest lessons left) and "Not started, and short" (the shortest course with nothing on the record).
- **An invitation.** No streak, no score, nothing that scolds; with no courses it draws nothing.

## Verification

- `course-standing-on-the-list.test.jsx`, 8 cases, **proven to catch:** 199 of 200 is 99%, never 100; a course only opened is "begun, none finished"; a lesson finished on the device and on the record counts once; the list totals; the two wins and their absence; each win opens its course.
- The 31 existing picker tests pass unchanged, and `ChurchLearn.jsx` is still 5,998 lines.

## Not done, and why

- **"Other obvious locations."** The department chips and the Big Picture do not carry the standing yet; the picker and the line under it are the first. `re-review: 2026-11-17`.
- **Not seen in a real browser.** The picker is a native list and `CourseFruit` reuses the app's own classes; it was tested in the DOM, not measured in Chromium at Big Print. `re-review: 2026-11-12`.
