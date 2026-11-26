# 2026-11-26 — how far, on every lesson card (DR-1684, full narrative)

The decision record is `docs/decisions/DR-1684-how-far-on-every-lesson-card.md`; this note carries the full trace it cites.

## Context

Darrell, 2026-11-26, from the new-look Learn grid (lesson cards with a cover,
a headline and an "N min" badge, under a course heading with "6 lessons"):

> "Possibly a indicator bar that shows how far a lesson has been listened to or
> read so we can pick the ones we are closest to finishing etc... make sense?"

Then, a scope correction: **"For all lessons not just these."** The bar goes on
every lesson card in every course, everywhere Learn lists lessons, and the
"closest to finished" pick covers the whole catalog.

## What was measured (the reality trace)

1. **The number already exists, and it is honest.** Each lesson's device-local
   place (`lib/learn-resume.js`, one per lesson since DR-0631) carries `seen` and
   `heard`: the furthest share of the version's **words** that has been on
   screen, and the furthest the reader has spoken (DR-1293). `placeReached()`
   merges them. Words, not steps or sentence indexes, so the fraction holds
   when a lesson is re-paced for another age band or time-fit: index 14 of one
   rendering is not index 14 of another, but 40% of the words is still 40%.
   A step or sentence index alone has no total in the record, so it is never
   turned into a percentage.
2. **It was shown in one place only:** the classic by-title row's
   "Continue · 38% read" (DR-1419). No card, no new-look surface, no shelf.
3. **A real end-to-end gap.** `LearnStudioPreview` opened the new-look Lesson
   Experience with `onSeen() {}`, `onHeard() {}`, `onLevel() {}` and no `place`,
   so a lesson read or heard there (the default on the owner devices, since
   DR-1664) **wrote nothing**: no place, no witness, no Continue, no read
   credit. A bar fed by that path could never have filled.
4. **The grid's places were stale.** ChurchLearn reads the device's places once
   and refreshes them only when a reading finishes, so a lesson left halfway in
   the Experience came back to a grid (and a Continue Learning row) that did
   not know it.
5. **"Closest to finished" existed only for COURSES** (LearnDashboard's
   `fruit.nearest`, lessons left in a course), never for lessons.

## Decision

1. **One number, one drawer.** `lib/lesson-progress.js` `lessonProgress(place)`
   returns `null` for no place and for a place with nothing measured; the
   measured fraction otherwise ("About 40% read", "Under 1% read", "All read");
   full for a reading credited to the end ("Read to the end"). The reading
   version is named when known ("…, Adult version"). `LessonProgressBar.jsx` is
   the only component that draws the fill, in three looks: `studio` (gold strip
   along the bottom of the cover, on a near-opaque dark track), `classic` (the
   in-lesson bar's own #E8E4DC / #5A6E3D tokens, which every `[data-theme]`
   remaps), `oncolor` (inside a filled button: `currentColor`, so it is as
   visible as the button's words in every theme). Gold, never red (DR-0099). No
   width transition (reduced motion). The words ride as screen-reader text, or
   in the host's `aria-label` when the host already says them, never twice.
2. **Every surface that lists lessons carries it:** new-look cards (course
   grids, Continue Learning, Discover, Recently Added, shelves, Relationships,
   search results), the single-lesson cover, the new-look List rows, the course
   page's Recently opened and list rows; classic Continue offer, the by-title
   list and Latest lessons (both through `RowContinue`), and the classic course
   page's Start/Continue button. A reading measured in the Experience (no step)
   shows its bar on the classic row without claiming a Continue.
3. **Closest to finished, by lesson, across the catalog.** `closestToFinished()`
   keeps places begun, measured and unfinished, furthest first, then most
   recent. The new-look home has a **Closest to Finished** row under Continue
   Learning (from every saved place, not only those with a step), and the
   classic "Pick up where you left off" offer gains a **Latest | Closest to
   finished** order. Unmeasured lessons are never ranked on a guess. A plain
   list to choose from, never a streak (DATA-AS-EMPOWERMENT, anti-pattern 2).
4. **The new look's reading writes its place.** `studioWitness()` gives the
   Experience real `place / onSeen / onHeard / onLevel` that write the same
   place CourseView's `savePlace` writes, and credit the read on the same
   evidence floor as its `finishRead` (READ_FLOOR 0.9, `readingIsFresh`), so
   the read mark and the bar agree. The witnesses are passed whether or not a
   quiz hand-off is present. Closing the Experience re-reads the device's places,
   so the bars, Continue Learning and Closest to Finished are current.

## Impact

- **Privacy:** unchanged. The bar only reads the place the reader already keeps
  on this device; nothing new is collected or sent; Start fresh still clears
  it (USER-ACCOUNTS-AND-HISTORIES; DATA-AS-EMPOWERMENT).
- **Latency/persistence:** one `listPlaces()` parse per Experience close; one
  `Map` lookup per card. No new storage key.
- **Behavior change, intended:** a lesson read in the new look now shows up in
  Continue, the read marks and the learner's record, which it silently did not
  before; the Experience offers "Pick up where you left off" from that place.
- **ChurchLearn** stays at its budget (6036 lines, ceiling 6037): the import
  and the bar ride existing lines.

## Verification

- `app/src/__tests__/lesson-progress-bar.test.jsx`, 19 cases: the fraction on
  fixtures (no record, step-only record, re-paced age band, finished then
  re-read, tiny, all read); the bar renders only from a real record; the
  new-look card, the classic Continue row and the Experience-only row; the
  ordering; `studioHome` across two courses; the classic offer's toggle;
  the Experience witnesses end to end with credit only past the floor.
- **The gate, proven to catch:** a source scan fails any file other than
  `LessonProgressBar.jsx` that draws a lesson-progress fill, and fails the
  drawer if its width is not `pr.fraction * 100` or it stops reading
  `lessonProgress`. Fed a painted 60% card and a literal-width drawer, it
  flags both. A mutation that turned an unmeasured step-only place into "50%"
  failed 4 cases.
- **Contrast, measured** on the real colors (WCAG 1.4.11, ≥ 3:1): classic fill
  vs track in the default theme and all 11 `[data-theme]` palettes read from
  `THEME_CSS`; gold vs the dark strip composited over a pure-white photograph;
  gold vs the list-row track.
- **Live:** the real app on a dev server, Prophetic Voices course page in the
  new look with four seeded places: bars at 82%, 41%, 100% (finished), 14%;
  the two lessons with no record carry none; the classic rows and buttons on
  the same page show the same numbers. Horizontal overflow 0 at 360, 390 and
  1024 px.
- Related suites: 16 files, 196 tests green; full Vitest run in CI.

## Not done, with why

- **The classic Continue offer lists only places with a step** (`placeInProgress`,
  DR-0702), so a lesson read only in the Experience appears in the new look's
  Closest to Finished and on its classic row, but not in the classic offer.
  Widening `placeInProgress` would change what "Continue" claims everywhere;
  that is its own decision. `re-review: 2026-12-10`.
- **ContinueChip** (the sticky bar's one-word chip) carries no bar: it is a
  control, not a lesson card, and has no room. `re-review: 2026-12-10`.
