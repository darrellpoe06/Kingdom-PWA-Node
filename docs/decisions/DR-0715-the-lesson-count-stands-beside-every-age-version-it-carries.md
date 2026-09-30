# DR-0715 — The lesson count stands beside every age version it carries

- **Status:** accepted
- **Tier:** A (two counts added to existing Learn surfaces; no data, no money, no schema)
- **Type:** surface + count
- **Date:** 2026-09-30
- **Scope:** `app/src/lib/learn-organize.js` (`READING_VERSIONS`, `lessonVersions`, `countReadings`, `catalogReadings`, `readingsLine`, `readingsMeaning`, `monthReadings`, `countWords`; each Latest row carries `versions`); `app/src/components/LatestLessons.jsx` (the scale line and both numbers on each month); `app/src/components/ChurchLearn.jsx` (the Courses tab line); test `lesson-age-versions-count.test.jsx`.
- **Principles:** VERIFICATION-DOCTRINE (DR-0076 §1 §4, measured and never assumed), REALITY-TRACE (DR-0061), THE APP IS THE PRIMARY ARTIFACT (DR-0065), PERPETUAL IMPROVEMENT (DR-0075)
- **Grounds:** Darrell 2026-09-30, on Learn → "Latest lessons, every course": *"is the lesson count 349 or is that with every variation based on the age number? I want both so it shows the scale even if no one else pays attention... they will know their children can read the same content in their age groups cognitive language and paced for them too."*

## Context

The Latest lessons header read "750" and each month read one number (September: 349). Both counted one row per lesson. 750 is the whole catalog and 349 is the lessons first added in September. Neither counted the age versions, so the header hid the work that lets a child, a youth and a teen each read the same lesson in their own words.

## What is counted

The reader's band picker (`learn-framework.js` `AGE_BANDS`) offers Child, Youth, Teen, Adult and Senior. `resolveForAge` serves a band its own text when `levels[key]` holds one and otherwise falls back to another band's text. A fallback is not a version. So a band counts only when:

- its own text is a non-empty string (an empty, blank, missing or non-string band is not counted), and
- that text is not a copy of a version already counted (spacing aside).

The Adult version is `levels.standard` when it is written, and otherwise the top-level `lesson`. A lesson with no adult text and only senior and teen bands is not given an adult version, because the adult reader is handed the senior text.

## What was measured (2026-09-30, the mounted catalog: 50 courses, every lesson Learn mounts)

| | Lessons | Readings (every age version) |
|---|---|---|
| Whole catalog | 750 | 2,641 |
| September 2026 | 349 | 1,273 |
| August 2026 | 94 | 360 |
| July 2026 | 242 | 818 |
| June 2026 | 65 | 190 |

By band across the catalog: child 348, youth 188, teen 677, adult 716, senior 712. Versions per lesson: 188 lessons carry all five, 123 carry four, 368 carry three, 34 carry two and 37 carry one. No band was dropped as a copy of the adult text, and no band is an empty string. One lesson carries a `levels.adult` key, which the reader never serves; it is not counted.

## Decision

1. The Latest lessons header keeps its lesson line and adds one line under it: "2,641 readings counting every age version (child, youth, teen, adult, senior)." The bands named are only those that really hold a version.
2. One plain sentence says what it means, and only as far as it is true: "Most lessons are written again for younger readers, so a child can read the same lesson in words and at a pace that fit them." It says "Most" only while more than half the lessons carry a child, youth or teen version of their own (measured: 713 of 750 carry a child, youth or teen version, and 713 carry more than one version), and "Some" otherwise.
3. Each month shows both: "349 lessons · 1,273 readings".
4. The Courses tab line reads "Every course in one place · 50 courses · 750 lessons · 2,641 readings counting every age version."
5. Nothing is typed in. Every number is counted from the mounted catalog on each render. The count is kept per lesson against its `levels` object, so a re-render costs under a millisecond.

## Verification

- `lesson-age-versions-count.test.jsx` pins the count on a small fixture. It covers five written bands, an empty and a blank band, a missing and a null band, a teen band that repeats the adult text with extra spaces, `levels.standard` beside `lesson`, and a lesson with no adult text. It is proven to catch: a naive key count gets the fixture wrong.
- The same file renders the header on the fixture and checks both numbers and each month's two numbers.
- On the real catalog it computes the total from every mounted lesson and checks that the header, the month rows (summed) and the Courses tab all equal it. The total is computed in the test, not typed.
- The existing `learn-sort-every-option` and `learn-is-a-school` tests still pass unchanged.
- The header and month rows wrap (the month row is `flex-wrap`), so nothing is held to one line at 360px. The chrome-layout probe does not open the Latest list. The sandbox cannot download Chromium, so that probe runs on CI.

## Re-review

`re-review: 2026-10-31` — as the band groups (DR-0692 to DR-0696) fill the child and youth bands, the readings total rises by itself. Check then that the sentence still reads true, and whether "every lesson" can replace "Most lessons".
