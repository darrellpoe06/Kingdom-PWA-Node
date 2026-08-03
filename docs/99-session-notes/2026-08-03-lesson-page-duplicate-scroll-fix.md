# Lesson Page Duplicated Itself in One Scroll — Found, Fixed, Pinned (2026-08-03)

**Layer 4 working artifact.** Darrell, from his phone inside Living Lessons (Lesson 33 of 70, guide open), with screenshots: *"Inside the lessons they seem to be just repeating the same information in one long scroll each page is a duplicate on the same page? opportunities and constraints."*

## What was actually happening (SHOULD → ARE, DR-0219)

- **SHOULD:** the lesson's own space (DR-0264) is the one clean copy of the lesson — the learner is never asked to scroll past the same content twice.
- **ARE:** while a lesson's guide (Ari / TutorPanel) was open, the lesson **card kept rendering its full preview** — big idea, "What this frees in you" benefits, the hands-on line, and the anchor (`ChurchLearn.jsx` card block) — while the open guide's **Open / Apply / Send-off stages render the same four fields** (`renderStage`). For Living Lessons the `bigIdea` is a full paragraph, so the phone showed the whole lesson body twice in one scroll — exactly "each page is a duplicate on the same page."
- Not a data bug: the arc (`buildLessonArc`) is *derived from* the card's fields by design. The defect was the card failing to yield while the guide walks the same content.

## Opportunities

1. **One lesson, one copy (shipped).** While the guide is open, the card's four preview blocks leave the screen; the guide's staged walk is the single copy. Closing the guide brings the scannable preview back. This completes the DR-0264 "secure lesson space" move: first the course chrome left the space; now the card's own echo does.
2. **The class is pinned (shipped).** New test in `learn-lesson-space.test.jsx`: with the guide open, `bigIdea` and the anchor each appear exactly once in the lesson card; benefits and hands-on at most once. Proven-to-catch: the pin was run against the unfixed code first and failed with count 2.
3. **Sibling surfaces checked.** PracticeLearn's collapsed rows show only the title and render only the LessonRunner when open — no duplication there. The print-only curriculum block intentionally repeats everything for paper; it is CSS-hidden on screen and untouched.

## Constraints

- The card header (lesson number, title, date, timeline line) stays while the guide is open — that is the space's identity, not duplication.
- The preview *is* wanted while the guide is closed: it is what lets a reader scan a lesson before starting it. The fix is conditional, not a removal.
- The guide renders `bigIdea`/anchor in its **Open** stage, benefits in **Send-off**, hands-on in **Apply** — so every field the card yields is still reached, staged, inside the arc. No content lost (DR-0215 posture: move, never cut).

## Verification

- Pin failed on unfixed code (count 2), passes on fixed (count 1) — proven-to-catch (DR-0076 §3).
- Full Vitest suite: 620 files, 6,958 passing.
