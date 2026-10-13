# DR-0385 — Numbered points on 84 lessons, a speaker's index, and a paragraph stepper

- **Date:** 2026-09-13 (shipped in #1560; record written 2026-09-13 on Darrell's instruction to reconstruct)
- **Status:** accepted
- **Tier:** B (the surface a speaker preaches from)
- **Type:** orchestration

## What was asked

Darrell, describing the problem **from behind a pulpit rather than behind a screen**: *"All lessons need to be using these highlighted numbers for the points... we need the speaker to be able to keep their place while looking away from the text to look people in their eyes... we also want the number of points to be known and for them to be available in a list somehow... we need the forward or backwards player to move back and fourth to last paragraph or sometimes a whole section... currently I believe we just get section jumps."*

## The decisions

1. **MEASURED BEFORE BUILDING (DR-0061).** Of 144 lessons only **31** carried any numbered point — 113 had none, because the existing markers (FIRST/SECOND, I./II., SOIL n) are used by a minority of authors. A tally of how sentences actually START across the corpus found the real convention: **313 ALL-CAPS lead clauses**, going unnumbered. That is where the points live. Coverage went 31 → 84.
2. **A capitalised lead clause is a point.** Deliberately narrow: 2+ caps words, letters only, closed by `.` `:` `—` or `,`, under 70 chars, with a lower-case remainder so a shouted sentence is not mistaken for a heading. *(The remaining blind spot — a clause closing with a full stop, which the sentence splitter cuts — was not found until 2026-09-13 and is DR-0381.)*
3. **EXPLICIT MARKERS WIN OUTRIGHT**, so the 31 lessons that already had numbers render byte-identically and no lesson counts 1,2,3 and then restarts at FIRST. Not one word changes; the reconstruction gate still passes.
4. **He was right about the arrows, and the cause was structural rather than a bug.** The only stepper stepped AGE-PACED segments, and the adult band has exactly one — so the whole lesson renders at once and the only arrows are the ARC STAGE arrows. Those are the section jumps he was seeing. `lesson-walk.js` adds both strides: **one paragraph** (the fine adjustment for a speaker who looked up and lost the line) and **one whole point**.
5. **Back from INSIDE a point returns to that point's head** — "start this one over" — and only then to the point before, the way a music player behaves. **Ends STAY rather than wrap:** a double tap at the top never throws a speaker to the end of the lesson mid-sentence.
6. **The count is stated in words before anything is tapped**, every point is listed with its number, the current one is marked, and tapping jumps. A lesson with no points says *"one continuous reading"* rather than showing an empty list — 60 lessons are flowing narrative whose author wrote no outline, and inventing one would be fabricating structure (DR-0076).
7. **Labels carry the POINT, not the marker:** "the trouble lab", never "FIRST". Controls are 44px, sticky and focus-ringed, because a speaker reaching for them is not looking at them.

## What the build taught

- **Two gates caught us.** The fold gate refused a local `useState` on a fold — "Open with the Word" is how a reader says *show me everything*, so the index follows the house switch. And `lesson-format.test` pinned the exact import spelling, which broke on punctuation rather than on wiring; generalised to the real property.
- **A break that FAILED taught something.** Trying to break the back-from-inside-a-point branch moved zero tests. It was not a weak test: the branch was **dead** — when the head is below the cursor it IS the largest index below the cursor. Removed rather than left as a line no test can fail on.

## Proof

`npm run verify` green: 959 files, 14,325 tests. 26 new tests, two proven-to-catch.

## Why this record is late

#1560 shipped with no decision record. Reconstructed from the commit's own detailed message and the diff. See DR-0381.
