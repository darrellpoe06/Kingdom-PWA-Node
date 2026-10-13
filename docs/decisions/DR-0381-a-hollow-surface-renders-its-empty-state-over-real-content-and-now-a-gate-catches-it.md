# DR-0381 — A hollow surface renders its empty state over real content, and now a gate catches it

- **Date:** 2026-09-13
- **Status:** accepted
- **Tier:** B (the presented lesson is the surface Darrell stands behind a pulpit with)
- **Type:** orchestration / quality
- **Gate:** `scripts/surface-hollow-guard.mjs`, in `verify:gates`

## The report

Darrell, 2026-09-13, from the pulpit's point of view, looking at Part 3 of 9 of a presented lesson:

> "How can their be no presenters notes with all this content?!!!!!!!!!!!!!!! Why is the play button showing no actual meaning in that view of the lesson?!!!!!!!!!!!! Context and competence is needed!!!!!!!!!!!!!!!!! Fix it!!!???!!!!"

And, minutes later, on the same screen:

> "1 point for the while lesson?!!!!!!!!! Very unlikely!!!!!!!!!!!!?"

And then the ask this record exists for:

> "Quality checker that works comprehensively... added to the Ways and documentation..."

## What was actually wrong — measured, not assumed

Three separate defects, all in the same class, none caught by any existing gate:

1. **Six of nine parts of L142 rendered "No presenter notes for this one" while that lesson held ~14,000 characters of authored teaching.** `lessonPresentable` attached notes to a scene ONLY when the run-of-show segment's NAME matched one of four regexes (`big idea|the core|main|^teach`, `deeper|dig|explore|unpack`, `reflect|discuss|…`, `take it|send-off|…`). A segment named "The method" matched none, so it got an empty array. Worse: **`module.lesson` — the single largest asset a lesson has — was never read by that adapter at all.** `courseNotes` used it; `lessonPresentable` did not, and had not for its whole life.

2. **60 of 145 lessons reported ZERO points; 93 reported one or none.** The caps-lead detector required the lead clause's punctuation to be followed by a space *inside the same sentence*, which only happens when the clause closes with `:` `—` or `,`. The house's commonest form closes with a **full stop** — `THE OCCASION. A friend of this house…` — and the sentence splitter cuts exactly there, handing the detector the bare fragment `THE OCCASION.` with nothing after the period to match. **The commonest heading in the corpus was the one form the detector could never see.** L142, 14,000 characters and eleven real points, reported one.

3. **The presenter registered the constant read-aloud label `'this part of the message'`** on every part of every lesson, and the reading itself was only the slide outline — so the speaker pressing play on his own console got a headline and a few bullets, never the message.

## The class this names: a HOLLOW SURFACE

**A surface that renders its empty state, a placeholder, or a generic label while the real content exists and is reachable.** It is worse than a missing feature because it looks finished, and it survives every dimension of review we had: the component mounts, the data is valid, the journey completes, the layout measures clean — and the panel is still blank. Every gate in this repo checked whether data was CORRECT. None checked whether an authored asset actually ARRIVED on the surface built to show it.

## The decisions

1. **No presented part is ever blank.** The lesson is split into its own points-with-prose (`lessonSections`, new) and routed to the part that teaches it (`allocateSections`, new) — matching on the author's words in both places, total and order-preserving, so not one section is dropped and a later part can never teach an earlier section. What does not route still gets the segment's own authored detail. Floor: **zero blank panels across all 1,026 scenes of all 145 lessons**, at every age band.
2. **A standalone ALL-CAPS clause is a point.** Guarded narrowly — 2–9 words, and it must actually head prose (the next sentence has lower-case in it) — so a shout that ends a passage stays a line. Zero-point lessons: 60 → 44. One-or-none: 93 → 51. **44 remains an honest zero**: those authors wrote no point structure, and inventing an outline for them would be fabricating one (DR-0076).
3. **A control names what it acts on, and the no-leak law is NOT relaxed to do it.** The presenter's read-aloud label is built from the part (`Part 3 of 9 — The method — what the room sees`) instead of the constant placeholder. **The reading itself is unchanged: exactly what the room sees.**

   *This is a correction recorded rather than hidden.* A first cut also fed the presenter's private notes to the voice whenever no audience surface was alive, reasoning the audio was then private. `presenter-read-aloud.test.jsx` — an existing pinned test — rejected it, and the test is right. The no-leak law is that what is read aloud IS what is projected, full stop; a condition clever enough to hold today can be wrong later, on a console plugged into the house PA or in a state the component does not model. **Loosening a pinned law is Darrell's call, not a side effect of a label fix.** What he reported was a button with no meaning; the meaning is the label, and the message itself now lives in the notes panel below it, which is where it belongs.

   **Open, for Darrell, not blocking:** he did ask on 2026-08-10 to *"listen to the full message or lesson/s from here"*, and that want is still unmet on the audio path. Meeting it means deciding what "private" means for the console — which is a bright line about a room hearing a speaker's private script, so it is his to draw. **re-review: 2026-09-27.**
4. **The class gets a gate, and the gate goes in the Ways.** `scripts/surface-hollow-guard.mjs` runs in `verify:gates` on every push. `COMPREHENSIVE-REVIEW-STANDARD.md` gains a **ninth dimension** — *the surface is not hollow* — with its three standing questions: does the biggest authored asset arrive, is every empty state reachable only when empty, and does every label name the thing it points at.

## Proof

- **Proven-to-catch (DR-0076 §3), three ways.** Each fix was reverted and the tests re-run: removing the caps-heading detection failed 7 tests; removing the routed prose failed 3; removing the no-blank fallback failed 2. The guard itself was refactored to a pure `analyzeSurfaces(deps)` so `app/src/__tests__/surface-hollow-guard.test.js` feeds each of its five checks a break and requires a finding.
- **The gate earned its keep on its first two runs.** Run one reported `ll18` — and `ll18` was FINE; the check had sampled a 120-character window from the middle of the lesson and it straddled a section boundary the deck necessarily joins in note order. A guard that cries on correct code teaches people to ignore it, so the check was rewritten to assert the real property (every substantial section present verbatim) and the false-positive case is now itself a pinned test. Run two then found a **second real defect nobody had reported**: the six lessons with no authored run-of-show took a different branch which also never read `module.lesson`, so their entire teaching — 31 sections in `ll132` alone — was dropped from the deck.
- 29 new tests across two files; `npm run verify` green.

## The honest limits

- **This is measured on the lessons corpus only.** The hollow-surface class certainly exists on other surfaces; the guard checks the one where it was reported plus the presenter's labels. Extending it to other authored assets is real work, not done here. **re-review: 2026-10-11.**
- **44 lessons still report zero points.** That is an honest zero, not a detector failure — but whether those lessons should be given point structure by their author is a content question, not a code one. **re-review: 2026-10-11.**
- **No live pass on poetech.us.** Everything here is proven against the real corpus in CI; nobody has yet stood in front of the deployed presenter and advanced through a lesson. **re-review: 2026-09-20** (carried with the standing item from the door-feedback chain).

## Pairs with

DR-0076 (gates over claims; proven-to-catch), DR-0239 + COMPREHENSIVE-REVIEW-STANDARD (this is its ninth dimension), DR-0061 (reality-trace — name the real data before building), DR-0075 (perpetual improvement; the dated limits above), DR-0111 (the report was a defect, not a question to re-ask).
