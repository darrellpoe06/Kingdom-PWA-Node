# DR-0702 — A lesson never read says Start, and the speaker reads the lesson you are in from the beginning

- **Status:** accepted
- **Tier:** A
- **Type:** fix
- **Date:** 2026-09-30
- **Declared by:** Darrell
- **Scope:** `app/src/lib/learn-resume.js` (`placeInProgress`); `app/src/lib/read-target.js` (door targets, `requestRead` options, `isReadDoor`); `app/src/components/ChurchLearn.jsx` (the open lesson registers a door while its guide is closed); `app/src/components/TTSControl.jsx` (door path, "start to finish" from the top, Resume only for a real place, want options carried through); `app/src/__tests__/reader-lesson-start.test.jsx` (new); `app/src/__tests__/continue-a-lesson.test.js`, `app/src/__tests__/reader-resume-and-step-picker.test.jsx` and `app/src/__tests__/over-is-over-and-all-is-obvious.test.jsx` (pins changed on purpose, see Decision).
- **Principles:** HOLD-THE-HAND (DR-0621), VERIFICATION-DOCTRINE (DR-0076), SPEC-CONFORMANCE (DR-0219), APP-IS-PRIMARY (DR-0065), DECISION-RECORDS (DR-0011)
- **Grounds:** DR-0631 (one place per lesson, the lesson's own Start / Continue button); DR-0632 (the reader's bookmark and Resume button); DR-0627 and DR-0633 (the reader keeps playing with the screen off and between apps); DR-0439 (the screen stays on while it reads); DR-0654 (the voice element is unlocked inside the tap). The numbers DR-0692 to DR-0695 are reserved for the parallel band groups and DR-0697 is claimed by two open branches, so this record takes DR-0702.

## Context

Darrell, 2026-09-30, from phone screenshots of L202 "Prepared Before the Position" in Living Lessons (shown as "L202 · 1 of 201"):

> "I've never read this lesson and it's already asking me to continue?... also... the reader should be asking me to read it from the beginning because I pushed the speaker while inside the lesson... why isn't it working?.... it only works after I hit play... it should be both... make sense?"

## What was measured

**SHOULD.** DR-0631: the lesson's own button says Continue *when it is in progress* and lands on the reader's place. `read-target.js` header: while a lesson is the screen's primary reading, the floating reader offers "Read this lesson" as its primary action. DR-0632: Resume is offered for a real place.

**ARE (traced in the code before any change).**

1. **Continue on a lesson never read.** The card's label (`ChurchLearn.jsx:2444` on `origin/main`) is decided by `placeInProgress(placeByLesson[m.id])`, and `placeInProgress` (`learn-resume.js:276-279`) returned true for `started === true` alone or for any saved `sentenceKey`. Neither needs any reading:
   - `started: true` is written by arriving through a link or any "open with the guide" door (`ChurchLearn.jsx:1888`; a shared lesson link sets `resumeOpenGuide` at `ChurchLearn.jsx:3582`), by the lesson's Start button (`:2435`), by Play (`:2469`) and by Play from the index (`:1918`), even when the reader never moves.
   - The eye-scroll writer (`ChurchLearn.jsx:1697`) saves the sentence at the reading line, and at the very top of a lesson `sentenceIndexAtLine` (`lesson-landing.js:69-87`) returns the first sentence, index 0 with its fingerprint. `recordPlace` then marks the lesson started, because any `sentence` key in the patch counts as a move (`learn-resume.js:376`).
   So a lesson opened once, by a link or a single finger drag, said "Continue this lesson". Continue from part 1, step 1, sentence 1 is the same place Start opens.
2. **The speaker inside a lesson offered only the page.** The lesson registers its reading only inside `TutorPanel` (`ChurchLearn.jsx:1133-1157`), which renders only while the guide is open (`:2891`). A lesson opened by its title shows its card with the guide closed, so `getReadTarget()` was null, and the panel (`TTSControl.jsx:1556-1590`) showed only "Read this page", "Start where I tap" and "Talk about this". Play worked because Play opens the guide and then calls `requestRead` (`ChurchLearn.jsx:2472`).
3. **"Start to finish" did not start at the top.** The primary button called `readTargetNow(target)` with no start (`TTSControl.jsx:1561`), which begins at `savedStartIndex()`, the saved sentence or bookmark. DR-0632 recorded this as invisible and pinned it in `reader-resume-and-step-picker.test.jsx`.

**GAPS.** (1) Progress was claimed with no position past the start. (2) No reading existed for the reader while a lesson was open with its guide closed. (3) The primary button's words ("start to finish") and its behavior (resume) disagreed.

## Impact

A reader opening the newest lesson was told they had already begun it, and pressing the speaker inside it offered the page rather than the lesson. The one path that worked, ▶ Play, was not the one his thumb reached for.

## Decision

1. **A place at the start is not progress.** `placeInProgress` is now true only when the lesson is not finished and has `stage > 0`, `step > 0` or `sentence > 0`. `started` is still recorded (the map's pruning keeps started lessons first); it no longer claims a place to continue. The Continue offer, the row's Continue marker, the sticky bar chip and the landing all read the same function, so they agree. Course sort's "in progress" (`learn-organize.js`) is not changed: opening a course's lesson still counts the course as begun.
2. **The open lesson registers a door.** While a lesson's own space is open and its guide is not, `ChurchLearn` registers a read target with `open(opts)` in place of text (`read-target.js` accepts it). Opening the guide replaces the door with the full reading; closing it brings the door back.
3. **The speaker's first choice is that lesson from the beginning.** The panel's primary button, "Read this lesson — start to finish", now reads from sentence 0. For a door it claims the audio session inside the tap (the same claim `readTargetNow` makes, so the screen-off and background path holds from the press), then calls `open({ startSentence: 0 })`. That does exactly what ▶ Play does: records use, marks the lesson started, opens the guide and calls `requestRead`. The reader's want now carries options, and it waits past a door for the full target.
4. **Resume only for a real place.** The Resume button shows this reading's bookmark (DR-0632), or else the lesson's own saved place past the start ("Resume where you left off", found by its sentence fingerprint). A lesson never read shows no Resume.
5. **Play is unchanged.** Play still asks for the reader's default start, which is where the reading was left or else the top.
6. **Changed pins, on purpose.** `continue-a-lesson.test.js` pinned "Start … is in progress"; it now pins that a Start tap and the first sentence are not progress. `reader-resume-and-step-picker.test.jsx` pinned "start to finish" resuming at the bookmark; it now pins the top, with Resume offered beside it. `over-is-over-and-all-is-obvious.test.jsx` pinned a lesson paused part-way resuming through "start to finish"; it now resumes through "Resume where you left off", which a saved sentence without a fingerprint (an older record) also offers.

## Verification

- `app/src/__tests__/reader-lesson-start.test.jsx` (11 tests), on the real `TTSControl` and the real `ChurchLearn` with the real L202 id:
  - a door is offered first, above "Read this page", with no Resume; pressing it calls `open({ startSentence: 0 })`;
  - with a bookmark, Resume reads "Paragraph 2 of 3" and opens the door there;
  - a mounted lesson with a bookmark reads from its first sentence;
  - a saved lesson place past the start is offered as Resume and lands on its sentence;
  - a want for "from the beginning" reaches the lesson once it registers;
  - a page with no lesson keeps the generic panel (control);
  - L202 reached by a link (`started` only) and L202 with a first-sentence fingerprint both say "Start this lesson →";
  - L202 with real progress still says Continue (control);
  - L202 opened by its title registers a door, and the door opens the guide, registers the full lesson (over 100 characters, no door) and leaves a want `{ owner: L202, opts: { startSentence: 0 } }`;
  - closing the guide brings the door back.
- `app/src/__tests__/continue-a-lesson.test.js`: a Start tap and a first-sentence fingerprint are excluded from the in-progress list.
- **Proven-to-catch:** with the four source files stashed back to `origin/main` and the tests kept, the run records 10 failed / 15 passed across the two files (9 of the 11 new tests plus the changed in-progress pin); the two new tests that pass on both are the controls. Restored: 25 of 25 pass.
- Full suite, `npm run lint` and `npm run build` are run before the push; results are recorded on the PR.
