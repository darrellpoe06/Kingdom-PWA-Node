# DR-1289: A lesson shows the picture it talks about, and the picture is data

**Date:** 2026-10-29
**Status:** Accepted
**Tier:** A (additive surface: a new optional figure block in the lesson card and the guide's teach stage; no schema, no data path, no money)
**Type:** surface
**Area:** Learn · Living Lessons (`app/src/lib/lesson-figures.js`, `app/src/components/LessonFigures.jsx`, `app/src/components/ChurchLearn.jsx`)
**Sent in by:** the family, 2026-10-29, with two phone screenshots of L270 "The Progress of Revelation": *"We need to see images in the lessons if we need a diagram or workflows timelines etc... we have connected to canvas correct?"* (Canva.)
**Pairs with:** DR-0076 (§1 evidence, §3 proven-to-catch, §8 provenance), DR-0098, DR-0100, DR-0061 / DR-0065 (the app is the primary artifact), DR-0340 (a reference opens the Word in place), DR-0381 (a surface does not promise what it does not do), DR-1287 (the people in a lesson picture)

## Context

L270 asks the room *"Which book did you assume was written first, and what changed when you saw the chart?"* and *"Why would a chart leave a box blank..."*, and it showed no chart. The chart existed: two photographed study-Bible pages, already transcribed line for line into `progress-of-revelation.js` and pinned by the L270 gate. Nothing could draw it, because **no lesson could carry a picture of any kind.** Measured before building: the lesson renderer shows prose, bands, stories, quiz, audio and video; every field named `figure` in lesson code meant a number or a person. `MediaList` draws a handful of hand-coded SVG diagrams keyed by name for the broadcast course, and it renders only inside the guide.

## Decision

1. **A lesson may carry `figures`**, and a registry in `lesson-figures.js` attaches figures built from data that lives in its own module (so the 27,000-line course file does not grow an import per chart). `LessonFigures` draws them in the lesson card under "What this frees in you", and in the guide's teach stage under the paced reading. The card and the guide are never on screen together (`!tutorOpen`), so a figure never shows twice.
2. **Four kinds.** `span-chart` (rows on a time scale, each with its own dated span), `sequence` (steps in order: a workflow, a wiring, a run of events), `quadrant` (two axes, four cells), and `image` (a file under `/lesson-figures/` in the app's own public folder, with alt text, a caption and its source).
3. **Data first, drawn in HTML.** The first three kinds render from data as real text, not a canvas or a baked image, so a screen reader, the TTS and Big Print all reach every word; colours are the app's themed classes, so every theme including midnight repaints them; nothing is wider than its column, so a 360px Fold cover screen does not scroll sideways. Bars and arrows are `aria-hidden` decoration, and every fact they show is in the words beside them, which is the text alternative. Every reference a figure names opens the Word in place (WordInline).
4. **Canva is for illustration only.** A Canva export or a generated drawing enters as an `image` figure: exported, committed under `app/public/lesson-figures/`, and served by the app, so no lesson depends on a third-party cloud when it is read. Charts and timelines are never images, because their data must stay checkable.
5. **Every figure names its source.** One built from an outside record carries the lesson's own disclosure about it. L270's figure carries *"We did not check the chart against any other chart."*, the lesson's own sentence.

## What was measured

Every Living Lesson string was searched for a chart, map, diagram, timeline or workflow the reader is pointed at. Story props ("a chart on the fridge") and metaphors ("speed without a map") were not counted. Five lessons pointed at a picture the reader could not see, and each now carries one:

| Lesson | Figure | Kind | Drawn from |
|---|---|---|---|
| L270 The Progress of Revelation | the 66 books in writing order, date and author per book | span-chart | `progress-of-revelation.js` (the transcribed chart), row for row |
| L140 The people of Judah | the timeline the Word carries, 931 BC to AD 70 | sequence | the lesson's part ONE (dates it states as settled history) |
| L47 Navigating the age | the map in five movements | sequence | the facilitator's map |
| L131 Joy is not happiness | the wiring diagram: the LORD, joy, strength; the day is not on it | sequence | benefit 1 and the facilitator's whiteboard |
| L15 Seasoned with salt | the Conversational Compass | quadrant | the lesson's compass section |

L201 already renders its own dated `timeline` block and is not counted. L30, L133 and L196 point to in-app surfaces that exist (the Timeline, the Torah pattern map).

## Impact

- Five lessons now show the picture their own text points to. On a 360px phone, measured in a real Chromium against the dev build, every figure is 336px wide, and the page overflows sideways by 0px in the light and midnight themes. L270's chart is 2,339px tall at 360px, so each testament folds away with one tap.
- Nothing changes for a lesson with no figure: `LessonFigures` renders nothing (tested).
- No new dependency, no network call at read time, no schema.

## Verification

Held by the gate (`lesson-figures.test.jsx`, 32 tests):

- Each of the five lessons carries its figure; every registry key is a real lesson; every registered figure passes `figureProblems`.
- **L270 is the chart.** 66 rows, 39 and 27, in the chart's order; every date equals `chartDateOf` and every author `chartAuthorOf`; Job has no date and no bar; Unknown, Anonymous and the two "(?)" are kept exactly; the disclosure is the lesson's own words.
- **Nothing is invented on the other four.** Every reference and every year a sequence or quadrant prints must already stand in its own lesson.
- **Proven to catch:** a figure with no source, an unknown kind, a one-step sequence, a backwards span, an image outside `/lesson-figures/`, an image without alt text, and a three-cell quadrant are each named and each dropped rather than drawn.
- It renders as real text (jsdom): 66 rows, Job unbarred, the disclosure on screen; four quadrant cells, each naming its place on both axes in words.

## Open

- No lesson carries an `image` figure yet. The first illustration will be made in Canva under DR-1287, exported into `app/public/lesson-figures/`, and pass the same gate. **re-review: 2026-11-12.**
- The hand-coded `DIAGRAMS` in `MediaList` (broadcast course) could move onto these kinds. Not needed for this change. **re-review: 2026-11-26.**
