# DR-1667: Every course option in the new look, and the Institute at every text size

**Date:** 2026-11-26
**Status:** Accepted
**Tier:** B (layout and options; no content changed)
**Type:** product
**Area:** `app/src/components/learn-studio/CourseLessonsView.jsx`, `app/src/components/learn-studio/LessonsInOrder.jsx`, `app/src/components/learn-studio/LearnStudio.jsx`, `app/src/components/learn-studio/LearnStudioPreview.jsx`, `app/src/components/learn-studio/learn-studio.css`, `app/src/index.css` (Institute studio), `scripts/chrome-layout-probe.mjs`, `scripts/live-link-probe.mjs`, `app/src/__tests__/learn-functions-in-new-look.test.jsx`
**Sent in by:** Darrell, 2026-11-26 09:40-09:43 (phone): the classic Living Lessons page with its parts and sorts open, "All options?!!!"; then the new Institute at a larger text size, "Don't look right!!!!"
**Pairs with:** DR-1662 (every Learn function in the new look), DR-1664 (the new look for every member)

## Context

The new look's course page had Pictures | List and four orders. The classic course page has more, and Darrell showed every one of them. Separately, the new Institute's top card and feature tiles were laid out for one text size.

## What was measured

- Classic course page options missing from the new look: the parts of the course by the Word's divisions (All lessons, The Law, History, Wisdom & Poetry, The Prophets, The Gospels, Acts, The Letters, Revelation, with counts), the "By the Word's divisions" order, Recently opened, foldable months (and Fold all), a ▶ Play on every lesson, and the course's tagline, audience and completeness line.
- Institute: `.is-hero` fixed at two columns (text + a 42% photo column) and `.is-feats` at three columns regardless of text size; the app's text size scales the root font (`lib/text-size.js`), so at a larger size words split mid-word ("Chancello r", "Leadershi p").
- Measured in Chromium at 390px on the built app after the fix: hero 2 columns / tiles 3 at 100%, 1 / 2 at 150%, 1 / 1 at 200%; no element overflows and no sideways scroll at any size.
- The chrome-layout probe measured 0 of 9 lesson widths on #2905's earlier head: it opened lessons by link and waited for the classic reader, which every member no longer lands on (DR-1664).

## Decision

1. **The course page carries every classic option**, read from the same libraries as the classic page (`lesson-sections`, `lesson-order`, `lesson-completeness`, `ux-signals`): the course's tagline, audience and completeness line; the parts as one-tap chips that narrow both Pictures and List; every order including the Word's divisions, which groups the list under headings; month and division headings that fold, with Fold all; ▶ Play on every row; Recently opened (shared with the classic page; the new lesson screen now records a use), one tap straight back into the lesson.
2. **The Institute follows the reader's text size**: em-based container breakpoints stack the top card when the text no longer fits beside the photo, the feature tiles and counters reflow by text size, and no word is split.
3. **The probes name the reader they measure**: `chrome-layout-probe.mjs` and `live-link-probe.mjs` open the classic reader with `learnStudio=0` (still a live surface: the fail-safe and the reader off the new look). The new look's link landing is walked by `app-journeys.mjs`. The Lesson Experience has no layout probe of its own yet: `re-review` below.

## Impact

- Every option of the classic course page is in the new look, on every course.
- The Institute reads cleanly at every text size.

## Verification after merge

- `learn-functions-in-new-look.test.jsx`, `course-lessons-view.test.jsx`, `lessons-in-order.test.jsx`, `lesson-experience-prototype.test.jsx`: 95 of 95, including the parts narrowing both looks, the five orders with divisions grouping and folding, ▶ Play on every row, and Recently opened reopening the lesson.
- `institute-studio.test.jsx`, `legibility-guard`, `ui-standards-set`, `large-print-guard`: 83 of 83; legibility: no new violations.
- `chrome-layout-probe.mjs --sweep` on a local build: exit 0, every lesson width measured.
- Not yet seen on Darrell's phone.
- Open: a layout probe for the Lesson Experience itself.

`re-review: 2026-12-03`
