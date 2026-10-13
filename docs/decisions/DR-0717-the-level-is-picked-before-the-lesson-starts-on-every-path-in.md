# DR-0717 — The level is picked before the lesson starts, on every path in

- **Status:** accepted (built and proven in CI)
- **Tier:** A (a reader control shown where it already belonged; no data, no schema, no new door)
- **Type:** surface fix
- **Date:** 2026-10-01
- **Scope:** `app/src/components/ChurchLearn.jsx` (the lesson's read door carries level / levels / setLevel; a "Who is learning?" row at the top of a lesson opened by its title; `lessonVersionCount`), `app/src/components/TTSControl.jsx` (the panel's level row moved to the top), `app/src/__tests__/the-level-is-picked-before-the-lesson-starts.test.jsx` (new).
- **Principles:** VERIFICATION-DOCTRINE (DR-0076), REALITY-TRACE (DR-0061), THE-APP-IS-THE-PRIMARY-ARTIFACT (DR-0065), SPEC-CONFORMANCE (DR-0219); DR-0426 (the level is chosen from the beginning, at every stage, and in the reader), DR-0702 (the speaker reads the lesson you are in: the read door).
- **Grounds:** Darrell, 2026-10-01, on the live site in L202 ("Prepared Before the Position", Living Lessons), reached from Learn → Latest lessons, with the READ ALOUD panel open and two screenshots: *"Didn't get the options to choose the lesson level?!!! Why not?"* And, placing it: *"In the reader.... at the beginning before the lesson starts..."*

## Context

**SHOULD** (DR-0426): a learner chooses the level "from the beginning and at each section change", and "the reader [is] able to switch too". The reader panel's "Who is learning?" row (`TTSControl.jsx`) renders only for a read target that hands it `level`, `levels` and `setLevel`.

**ARE** (traced on origin/main): every way into a lesson by its title (Latest lessons, a course's lesson index, Continue, the Next / Back bar) lands in the one-lesson space with the guide CLOSED. In that state the read target is the lesson's door (DR-0702, `ChurchLearn.jsx`), and the door registered only `label`, `title` and `open`. The full lesson target, with the level, registers only once the guide (TutorPanel) is open, and the in-lesson row lives only under the open guide's stage headers. `setAgeBand` was passed on every path; it was not the gap.

**GAP:** a lesson opened by its title showed no level choice above its words and none in the reader. Darrell's exact screen (L202 from Latest lessons, panel open, no row) is that state. A second gap: where the row did show in the panel, it sat below Text size, Colors and Follow along, after the Read buttons, so the reading could start before the level was ever seen.

## What was measured

- **L202 carries five written versions:** `levels.child`, `levels.youth`, `levels.teen`, `levels.senior`, and the top-level `lesson` (the adult version). Read from `app/src/lib/living-lessons-class.js`; asserted in the new test.
- **On origin/main, the new test fails 5 of 6:** Latest lessons → L202, a course's lesson index → a lesson in another course, the two pick tests (no row at the top: `null`), and a shared link to L202 (the panel row comes after "Keep screen on" and the Read button). The sixth (the data check) passes on both.
- **With the fix, 6 of 6 pass,** and 19 existing reader / level / Learn files (206 tests) pass unchanged, including `the-level-is-chosen-at-every-stage-and-in-the-reader`, `the-level-is-chosen-inside-the-lesson`, `learn-sort-every-option`, `reader-lesson-start` and `screen-awake-surfaces`.

## Impact

A reader who opens a lesson with more than one version, by any path, meets "Who is learning?" (Child 6–10, Youth 11–14, Teen 15–17, Adult 18–64, Senior / founding 65+) under the title and above Start and the first paragraph. The READ ALOUD panel shows the same row first, above Keep screen on and the Read buttons. A pick in either place reaches the same remembered band the host already keeps, so the guide and the reading open in that version. Once the guide is open, its Open stage carries the row and the top row steps aside, so the row is never shown twice.

## Decision

1. **The door carries the level.** The read door registers `level`, `levels` and `setLevel` exactly as the full lesson target does, so the panel offers the level before any reading starts.
2. **The lesson asks first.** In the one-lesson space, with the guide closed, a lesson whose written versions number more than one (`lessonVersionCount`: authored age levels plus the adult `lesson`) shows the "Who is learning? Pick first, then start" row under its title. A lesson with one version keeps its top clean; the open guide's stage row still says honestly that switching changes the pace, not the words.
3. **The reader asks first.** The panel's level row moves to the top of the panel, before Keep screen on and the Read buttons; the pill's one-tap select is unchanged.
4. **Untouched:** the floating buttons (another lane, `claude/floaters-into-the-bars`) and the panel's text-size area (PR #1891, `claude/text-size-everywhere`; its diff touches the idle row and the import, not the panel body, so the two changes compose).

## Verification

- `app/src/__tests__/the-level-is-picked-before-the-lesson-starts.test.jsx` renders the real Learn tree (`ChurchLearn` + `TTSControl`, the mounted catalog) with a host that remembers the band, and drives three real paths: Latest lessons → L202, a course's lesson index → a lesson in another course with more than one version, and a shared link to L202 (which opens with the guide open). On each it asserts the lesson's row exists, offers Child and Senior, sits before the first paragraph of the lesson's own words (and before Start when the guide is closed), appears once, and that the panel's row exists and sits before Keep screen on, the Read button and Text size.
- A pick changes the words: Child at the top, then Start, opens the guide whose full reading contains a sentence found only in the child version; a pick of Senior in the panel reaches the same remembered band and the lesson's row shows it.
- Proven to catch: 5 of 6 fail on origin/main without the fix (above).
- The chrome-layout probe runs in CI on this PR; the row is a wrapping flex row inside the reading column.
