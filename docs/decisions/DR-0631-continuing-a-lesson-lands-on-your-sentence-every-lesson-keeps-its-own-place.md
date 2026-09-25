# DR-0631 — Continuing a lesson lands on your sentence, and every lesson keeps its own place

- **Status:** accepted (built); one open decision recorded below (cross-device), with a recommendation
- **Tier:** A for what shipped (device-local record, no schema, no money, no identity change). The open decision is Tier B (it would add a table and move the place off the device).
- **Type:** feature / defect
- **Date:** 2026-09-24
- **Scope:** `app/src/lib/learn-resume.js` (one place per lesson; `getPlaceFor`, `listPlaces`, `placeInProgress`, `placeWhere`, `placeAgo`, `clearAllPlaces`, `started`; legacy record migrated and mirrored), `app/src/lib/lesson-landing.js` (new: the sentence at the reading line; the landing), `app/src/lib/read-follow.js` (`highlightResume`), `app/src/index.css` (the "you were here" mark, both paths, Midnight too), `app/src/components/LessonContinue.jsx` (new: the Continue offer, the course chip, the row state), `app/src/lib/learn-units.js` (new: `unitLabels`, lifted out of ChurchLearn), `app/src/components/ChurchLearn.jsx` (wiring), tests below, `app/src/lib/legibility-health.json` (one more passing page).
- **Principles:** SPEC-CONFORMANCE (DR-0219), VERIFICATION-DOCTRINE (DR-0076), REALITY-TRACE (DR-0061), APP-IS-PRIMARY (DR-0065), PERPETUAL-IMPROVEMENT (DR-0075), DO-THE-WORK (DR-0111)
- **Grounds:** DR-0262 (every lesson its own space; the place survives both directions), DR-0418 (Refresh first), DR-0450 (if it is over, it is over), DR-0552 (the reader takes you back), the 2026-09-14 exact-location work, DR-0151 (device-local vs a synced store is its own decision)

## Context — what he said

Darrell, 2026-09-24, from using the live app:

> "Continuing a lesson doesn't work well... it needs to be way better..."

## SHOULD — what continuing a lesson must do, in his words (DR-0219)

| # | His words | Where recorded |
|---|---|---|
| S1 | "It's too easy to lose your place inside of the Learn space after starting one self-paced lesson." (2026-07-30) | `app/src/lib/learn-resume.js:4` |
| S2 | "each one I believe needs a space that dont allow for loosing your place... the system sets up the reader to lose their places." (2026-08-02) | `docs/decisions/DR-0262-every-lesson-gets-its-own-space-place-survives-both-directions.md:17` |
| S3 | "Also need the lessons to begin exactly where they left off at least the sentence." (2026-09-14) | `app/src/lib/learn-resume.js:21` |
| S4 | "Lessons keep being interrupted and I'm loosing my exact location!!! Fix it!!!" (2026-09-14) | `ChurchLearn.jsx`, the exact-location block |
| S5 | "I like making sure they start where they left last time... so it can be a refresher if they wanted it" (2026-09-15) | `learn-resume.js`, REFRESH FIRST |
| S6 | "if it's over, it's over... you want to re-listen to the same freaking lesson, obviously." (2026-09-16) | `DR-0450` |
| S7 | "If and when you leave the page to do something necessary and want to come back in and listen to what you were just listening to... move them back to the highlighted sentences" (2026-09-20) | `DR-0552` |
| S8 | "the course drop down is still not above... even above where you left off" (2026-09-06) — the picker comes first | `ChurchLearn.jsx`, THE COURSE PICKER SITS FIRST |

So continuing SHOULD: bring you back to the same lesson, part, step **and sentence**, whatever you did in between (reload, another tab, another course, another lesson, listening); be one obvious tap from where you look, with the course picker still first; offer a refresher; treat a finished lesson as finished; and never lose one lesson's place to another.

## What was measured — ARE: the real journeys, before the change

Driven in real Chromium at a 390×844 phone viewport against a production build of `main` (signed out; Learn renders at `?view=church&sub=learn`). Screens: `before-*.png` in the session's `continue-lesson/` folder.

| Journey | Where the reader left | Where it landed (before) |
|---|---|---|
| J1 start a self-paced lesson, advance to part 2 step 3, scroll mid-reading, **reload** | Living Lessons L1, part 2, step 3, reading the story at scrollY 2,281 | Learn top. The only Continue ("Resume →") sat at **y = 2,084 on an 844-px screen**. After tapping it: right lesson, part and step — at **scrollY 0**, the course header on screen, the words a long scroll below. |
| J2 **another tab** of the app and back | same, scrollY 2,238 | same: Resume at y = 2,043 (off the first screen); after the tap, right step, **scrollY 0**. |
| J3 **another course** and back | same | **No Continue anywhere** on the course: the banner is read once per mount and nulled on use. Landed in the lesson list at scrollY 4,210. |
| J4 **a second lesson** in another course, then back to the first | L1 part 2, step 3 | The record now named the A.I. course lesson — **L1's place was overwritten**; no Continue for L1 on the Learn top, its course, or its list. Reopening L1 by hand started at part 1. |
| J5 **listen**, stop, continue | the reader stores `{sentence, sentenceKey}` per spoken sentence | Continue opened the right step at scrollY 285, with the saved sentence 1,007 px below the chrome, off screen and unmarked. |
| J6 **finish** a lesson (walk to the end, leave by the end door) | part 5 of 5 | Not recorded as finished (only the read-aloud's last sentence could mark it); after reload the banner offered **Resume → part 5** (off-screen at y = 2,084). |
| J7 **Start fresh** | banner present | Worked, **without asking**, and wiped the device's only place. |

Also measured: opening a lesson grows the page to ~67,500 DOM nodes **in both builds** (Learn's top alone carries ~33,000: a 19,000-node all-lessons card panel and a 9,900-node print-only copy of the curriculum). Not introduced here — see Opportunities.

## GAPS — named plainly

1. **One place per device.** `KEY = 'poe-learn-place'` held one object; a second lesson overwrote the first (J4). The lesson's own space read "the device's place" (`getPlace()`), so a lesson that was not the latest reopened at part 1.
2. **No per-course or per-lesson Continue.** The only offer was one banner, below the picker, the lesson index and the finder (y ≈ 2,084), and it vanished after one use until Learn remounted (J3).
3. **The landing did not reach the words.** A Continue opened the right step and left the view at scrollY 0 (J1, J2), or wherever it was (J5). Nothing marked the sentence.
4. **The eye kept no sentence.** Only the read-aloud wrote `sentence`; a person reading recorded nothing finer than the step.
5. **Two place records disagreed.** The lesson's scroll memory (`reading-position.js`, a bare scrollY for an anchor-less lesson, saved on unmount after the page had changed) ran beside the place record; the journeys show them disagreeing on every return.
6. **The banner was easy to miss** (below the fold on a phone, J1, J2, J6).
7. **Finishing by hand was not finishing** (J6).
8. **Start fresh destroyed without asking** and could only forget everything (J7).
9. **Content updates.** The sentence is matched by fingerprint (survives re-pacing); a lesson removed from the catalog offered nothing. Holding, but a changed sentence fell back silently.
10. **Across devices** the place does not follow the reader (device-local by design — see the open decision).
11. **The lesson named by its array position** (found with DR-0626's list change): the in-lesson counter read "191 / 191" on L192, Prev / Next walked the written array (Next from L60 skipped L61), and the Continue offers named lessons the same way.

## Impact

Unresolved, a reader who left a lesson — by a reload, another tab, another course or another lesson — came back to the right step at best, at the top of the page, with the only way back two and a half screens down; a second lesson erased the first. Resolved, every lesson begun is one tap from the first screen, and the tap puts the reader on the sentence they left, marked. Nothing about a lesson's text leaves the device.

## Decision — CLOSE: what was built

1. **One place per lesson** (`learn-resume.js`). The record is a small map keyed `course::lesson`, newest first, capped at 60 (begun lessons kept ahead of mere glances; the latest never dropped). `getPlace()` still means "the latest", `recordPlace()` still merges — into **that lesson's own** record, so returning to a lesson picks up its part and step. The old single key is migrated on first read and kept as a mirror of the latest, so an older tab of the app keeps working and its writes are folded in. `started` separates beginning a lesson (Start / Continue / Play / any move) from glancing at its card.
2. **Continue, one tap, where a person looks** (`LessonContinue.jsx`):
   - **Under the course picker** (the picker stays first, S8): the latest lesson as one large button — lesson, course, part and step, how long ago — with Refresh first and Start fresh, and **every other lesson in progress** beneath it.
   - **In the sticky lessons bar**: the open course's lesson in progress. The bar never scrolls away.
   - **On each row of the lesson list**: Continue on a lesson begun, "✓ Finished" on one done.
   - **On the lesson's own card**: "Start this lesson →" becomes "Continue this lesson →".
3. **The landing** (`lesson-landing.js`). Continue opens the guide at the saved part and step, finds the saved sentence **by fingerprint** in the rendered lesson (the guide first), scrolls it to 44 px under ALL the pinned chrome (measured, not assumed), and marks it for six seconds in the Continue control's own olive (never red, DR-0099). If the sentence cannot be found, it lands on the saved step and **says only what it knows**: "Picked up at part 2, step 3, at the start of that step — your exact sentence could not be found in it." A bare index is never followed.
4. **The eye writes the sentence** into the same record the voice does: after a scroll the person made (wheel, a finger dragging the page, scroll keys — never the reader's follow-scroll, the landing's own scroll, or a tap), the sentence **nearest** the reading line is saved. The separate scroll record for lessons is retired, so there is **one** place, not two.
7. **The lesson is named by its own number, and Prev / Next walk the reader's order** (with DR-0626, merged in). DR-0626 put the list in number order; inside a lesson the counter still printed the array position — "191 / 191" on L192 in Darrell's screenshot — and Prev / Next walked the written array, where L61 is stored before L60, so Next from L60 skipped L61. Now the counter reads "L192" (with "· 191 of 191" beside it on a wider screen), Prev / Next and the hands-free advance walk the order picked in the list (number by default; newest first or by the Word's divisions when chosen), and every Continue names a lesson by its own number. Built on `lib/lesson-order.js` (DR-0626's helpers), not beside it.
5. **Leaving by the end door is finishing**; a finished lesson is not offered to continue, and its row says Finished.
6. **Start fresh asks first** (`confirmThen`) and forgets **only the lesson it names**; the others keep their places.

### After — the same journeys

Screens: `after-*.png` beside the before screens. Results: `after-results-J1-7.json`.

| Journey | Where it lands now (same build, same driver, same phone viewport) |
|---|---|
| J1 reload | Learn opens with "Pick up where you left off" at **y ≈ 637 — on the first screen**, a 110-px button. One tap: L1, part 2, step 3, and **the exact sentence the reader left** ("The Eastern Christian tradition speaks of theosis…") 44 px under the pinned chrome, marked, with "Picked up where you left off — part 2, step 3. Your sentence is marked." |
| J2 another tab and back | The same, the offer at y ≈ 596; the same sentence, on screen, marked. |
| J3 another course and back | The offer at the top, the course's own Continue in the sticky lessons bar, and Continue on the lesson's row; the same sentence, on screen, marked. |
| J4 a second lesson, then back | Both offered on the first screen: "Continue Week 1 · What is A.I., really?" (y ≈ 596) and, under "Also in progress · 1", L1 (y ≈ 780). The record kept both lessons. Tapping L1 lands on its part 2, step 3 and its exact sentence. |
| J5 listen, stop, continue | The sentence the reader saved survives leaving by another tab (it did not, until the tap fix below), and Continue lands on it and marks it (scrollY 1,625, the mark on "The Eastern Christian tradition…"). |
| J6 finish | Leaving by the end door records it finished: L1's row reads "✓ Finished", it is no longer offered to continue, and it reopens at part one. |
| J7 Start fresh | Asks first; forgets only the lesson it names (the A.I. lesson); L1 keeps its own record. |

**Two defects the journeys caught in this change before it shipped, each fixed and pinned:**

- **The nearest sentence, not the next.** The first after-run came back ~130 px lower than the reader left: the reading line fell on the Back / Next buttons, and "the first sentence below the line" was a story heading 150 px down. The rule now takes the sentence nearest the line (`continue-a-lesson-landing.test.js`, "across a gap of controls"). Run against the first rule: `first-below rule: 1 -> FAIL (expected 0)`; against the shipped rule: `nearest rule: 0 -> PASS`.
- **A tap is not a scroll.** With a tap counted as the reader moving, tapping the Scripture tab to leave recorded the view under the finger over the sentence the read-aloud had saved (traced: the record went from `lgl5tf` to `5ur3fq` on the tap). Only wheel, touch-drag and scroll keys count now (`the-exact-location-is-kept.test.js`, "a tap is not a scroll").

## Verification

- `continue-a-lesson.test.js` (14) — the per-lesson record, in-progress, Start fresh per lesson, legacy migration both ways, the cap, the words.
- `continue-a-lesson-landing.test.js` (11) — the reading line (nearest sentence), fingerprint-only matching, the landing and its honest fallback.
- `continue-a-lesson-numbers.test.jsx` (7) — L192 is named L192 in the lesson and in every Continue; Next from L60 opens L61; L192 is last by number; "Newest first" picked in the list is what Next follows. **Proven-to-catch:** run over this file's pre-change ChurchLearn and LessonContinue, 4 of 7 fail — the offer reads "Lesson 191 · Two Hours…", the counter is not L192, Next from L60 opens L62, and Newest first is ignored.
- `continue-a-lesson-render.test.jsx` (9) — the offer lists every lesson begun, sits under the picker and above the list; Continue on the older lesson opens it at its own part and step; the bar chip; the row states; the card's own Continue; Start fresh confirms and forgets one; the end door finishes.
- Updated on purpose: `learn-resume.test.js` (the shape now carries `started`), `learn-resume-render.test.jsx` and `learn-lesson-space.test.jsx` ("Continue →", and Start fresh confirms), `the-exact-location-is-kept.test.js` (pins the single record instead of the retired scroll record), `learn-course-picker-is-first.test.jsx` (its "picker before resume" check returned early when no place existed — a check that could not fail; it now seeds a real place).
- **Proven-to-catch.** The core assertion ("going back to lesson A after lesson B picks up A where it was", old API only) run against the pre-change `learn-resume.js` from `origin/main`: `reopened ll1 at stage 0, step 0 -> FAIL`; against the new module: `stage 1, step 2 -> PASS`. `continue-a-lesson-render.test.jsx` run over the pre-change Learn screen (the ChurchLearn before this change, over the new record): **9 of 9 fail**; over the new screen, 9 of 9 pass.
- Full suite and lint, on the merged branch: `npm run lint` clean; `npx vitest run` — 1,200 files, **20,157 tests passing**. One worker process was killed mid-run by memory pressure from other sessions on the machine (no test failed); the one file it held, `the-title-stays-in-view.test.jsx`, was then run alone: 19 of 19 pass. All CI guard scripts (`npm run verify:gates`) pass, and the consistency, UI-standards and legibility guards hold (legibility health: one more passing page).
- **The count, 191 or 192 (2026-09-25).** Darrell, on the Living Lessons index, where the header read "PICK A LESSON BY TITLE · 191" and "All lessons · 191" and the newest row read L192, asked: "We need the count correct 191 or 192?" Measured: **191 lessons exist and the highest number is 192, because no L79 was ever made** (`app/src/lib/living-lessons-dates.js:20`; `lesson-order.js:11`). `schedule` is the real module list, not built from `weeks`, and nothing is missing or duplicated: every lesson has its own unshared number, and `LIVING_LESSONS_META.weeks` (191) equals the list's length for every one of the 42 catalog courses. So both numbers were true. The fault was the header (`ChurchLearn.jsx`, `· {schedule.length}`), which gave the reader no way to reconcile them. Separately, the course heading ("The N lessons") and "Play the overview (all N at a glance)" read the hand-kept `meta.weeks`. The Markdown export's Length line did too (`church-classes.js:522`). Each of these would drift the day a lesson landed without a matching `weeks` edit. **Built:** `lessonSpan` and `lessonCountLabel` in `lesson-order.js`, read from the schedule alone. The header now reads "191 lessons · L1–L192 · no L79" (`data-testid="course-lesson-count"`). The heading, the overview button and the export's Length line read the schedule's length. `the-lesson-count-is-derived.test.jsx` (6) computes the count, the highest number and the gaps from the lessons independently. It also checks that three more lessons read "194 lessons · L1–L195 · no L79". **Proven-to-catch:** run over ChurchLearn's display lines as they were on main, 2 of 6 fail. The header has no count label (it ends in a bare "191"), and a lesson added without touching `meta.weeks` shows "The 191 lessons" beside 192 rows. With the change, 6 of 6 pass.
- **Number.** This record was first written as DR-0621, then DR-0623; both were taken by concurrent branches while it was being built. DR-0631 was free on every remote branch when it was pushed.

## The open decision — the place across devices

**The line as written:** the place "lives ONLY in this device's localStorage. Never sent to a server, never aggregated, never joined to an account" (`learn-resume.js`, PRIVACY-FIRST). **No later DR relaxes it** — searched `docs/decisions` for cross-device, synced place, learn place; DR-0151 names a synced store for device-local state as "a different (Tier B) decision". So it was **not** built. Everything else was.

**Recommendation (default: yes):** keep the place across a signed-in reader's own devices, author-only.

- An author-only table (`learn_places`: `instance_id`, `created_by = auth.uid()`, `course_key`, `lesson_id`, `stage`, `step`, `sentence`, `sentence_key`, `done`, `started`, `at`; unique per author + course + lesson), every policy `created_by = auth.uid() AND user_in_instance(instance_id)` exactly as migration 0232, with the assistant-scope and viewer-readonly overlays and a no-leak smoke in the RLS isolation matrix.
- What would travel is what the device already keeps: keys, indexes and a non-reversible sentence fingerprint — **no lesson text**.
- The device copy stays the offline fallback; newest `at` wins per lesson; signed out stays device-only; one visible switch to keep it on this device only.

It needs his word because it moves a stated privacy line. **re-review: 2026-10-01.**

## Opportunities carried (dated, DR-0075)

- **Lesson weight.** Opening a lesson reaches ~67,500 DOM nodes (both builds); Learn's top carries a 19,000-node all-lessons card panel and a 9,900-node print-only curriculum. Under load a Continue tap measured 13–20 s. A separate performance change with its own print tests; not widened into this one. **re-review: 2026-10-01.**
- **The app's own tab strip over the lesson.** At a phone width with the header collapsed, the Church sub-tab strip pins beneath the lesson's sticky bar and covers a band of the reading (identical before and after). The landing measures and clears it; the overlap itself belongs to the shell's sticky stacking. **re-review: 2026-10-01.**
- **Read-aloud in the headless journey.** In headless Chromium the reader never reached the speech engine, so J5 wrote the exact record the reader writes and measured the landing from it; the reader's own sentence writes are pinned by `resume-at-the-sentence.test.js` and `the-exact-location-is-kept.test.js`. The on-device listen-stop-continue pass is the live review (DR-0104).
