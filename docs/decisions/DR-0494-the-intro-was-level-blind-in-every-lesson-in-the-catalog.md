# DR-0494 — The intro was level-blind, in every lesson in the catalog

- **Status:** accepted
- **Tier:** B (what every learner meets first)
- **Date:** 2026-09-18
- **Type:** fix
- **Scope:** `app/src/lib/lesson-flow.js` (`introForAge`, `firstSentences`, the Open stage), `app/src/__tests__/the-intro-reads-at-the-learners-level.test.js` (new, 14 checks)
- **Principles:** EVERY-BAND-IS-THE-WHOLE-MESSAGE (DR-0418), LEVEL-CHOSEN-AT-EVERY-STAGE (DR-0426), VERIFICATION-DOCTRINE (DR-0076 §4), NEVER-FABRICATE (DR-0076 §8)

## The report, and the measurement under it

Darrell, 2026-09-18, from the church door: *"child version isn't on the intro"*.

He was right, and no gate in the house could have told him. `buildLessonArc` paced the TEACH stage to the learner's band through `lessonPlanForAge`, and built the Open stage from three raw authored fields — `bigIdea`, `anchor.ref`, `anchor.theme` — with **no band argument reaching them at all**.

Measured across five bands of a real four-band lesson:

| band | teach steps | teach opens | intro (Open stage) |
|---|---|---|---|
| child | 3 | "God never asked you to be perfect like a robot…" | *identical* |
| youth | 2 | "Real talk: you are not flawless…" | *identical* |
| teen | 2 | "Real talk: you are not flawless…" | *identical* |
| adult | 4 | "Start with the honest truth no one should…" | *identical* |
| senior | 2 | "For the seasoned believer…" | *identical* |

The teaching genuinely re-paced. The intro was byte-identical at every level, for **every lesson in the catalog**, since the arc was built. A seven-year-old met the adult big idea, in the adult register, before a word of the lesson written for him.

## Where the replacement comes from, and why it is not invented

No lesson carries a per-band `bigIdea`, and writing one would be fabrication. But each band **already opens by naming its own lesson and stating its point in that age's words** — that is enforced by the title-in-narrative gate. So the band's own opening IS its intro, authored for that reader by the person who wrote the lesson.

This is not a new pattern either: `presentable.js` has led the presenter's slides this way since it was built (`child: lv.child || m.bigIdea`). The Open stage was simply never reached by it.

`introForAge` returns `{ text, levelId, derived }`. A band with its own authored text gets that text's opening; everyone else — and the adult band always — gets the big idea, exactly as before.

## The cost, named rather than hidden

The teach stage then re-reads those opening sentences, so a listener hears them twice within about a minute. That is why the extract is held to roughly one or two sentences rather than a paragraph, and it is a far smaller cost than an intro a child cannot read. The duplication-free version starts the band's teach plan AFTER the intro, which changes step counts and course duration, and is carried separately. **re-review: 2026-11-18.**

## A defect the measurement caught, in my own fix

The first draft cut at the last sentence end inside the window and required it to sit past character 40. Measured across all derived intros, that produced a **three-character** opening for ll5's senior band, whose first words are *"Dr. Martin Picard describes…"* — the period after an abbreviation ends no sentence. `firstSentences` now skips abbreviation periods and accumulates to a stated minimum, and the abbreviation case is a proven-to-catch check rather than a comment.

## The gate

14 checks, including the defect reproduced against the old construction, and the guarantee that keeps this out of fabrication: **every derived intro is a literal prefix of real authored text**, asserted across the whole four-band corpus rather than one lesson.
