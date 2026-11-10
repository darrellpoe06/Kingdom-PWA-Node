# DR-1409: The read count counts readings — a finish at the end of a reading no longer repeats with every sentence after it

**Date:** 2026-11-10
**Status:** Accepted
**Tier:** A (how the device counts its own finishes; one repair of an inflated count; no schema, no money)
**Type:** bug fix
**Area:** `app/src/lib/learn-resume.js`, the lesson space's `finishRead` and deck finish in `ChurchLearn.jsx`
**Sent in by:** Darrell, 2026-11-10, with a screenshot of Living Lessons L292 to L297, all written that day, showing READ ×38, ×38, ×41 and ×29: "Read count is off... fix it..."
**Pairs with:** DR-1384 / DR-1386 (a reading is credited on evidence), DR-1255 (which version was read), DR-0076

## Context

The count beside a lesson is how many times it was read to the end on this device. It ratchets on each rise of the place's `done` flag.

## What was measured

The re-finish loop was reproduced on the real place store.

- **Where the finish lands.** DR-1384 credits a reading at the evidence floor (0.9), before its last sentences.
- **What the next sentence does.** Every sentence after the floor is a move. A move cleared `done` and reset the reading's evidence.
- **Why it re-finishes at once.** The move's own heard position, past 0.9, put the evidence back over the floor straight away, and the reader credited it again.
- **The size of it.** A 50-sentence reading counted one finish per sentence past the floor.
- **When it began.** The auto-finish reached main at 2026-11-10 14:58:50 UTC (cbcc784), which matches the day's counts.
- **A second gap, found by the test.** Starting over at the top after those moves did not reset the stale end, so the new reading was credited at its first sentence.

## Impact

The number beside a lesson says how many times it was really read. Today's lessons read once now say READ, not READ ×38.

## Decision

- **A re-read counts only when it is a reading.** The place keeps `low`, the least it has reached since the reading began. A second finish counts only in two cases:
  - that low fell under 0.25, so the reader went back near the start;
  - or a whole lesson was presented end to end on the deck (`whole`).
- **The first finish always counts.**
- **Starting again from the top** of a lesson already counted begins a fresh reading, with fresh evidence.
- **The reader skips a reading that never went back** (`readingIsFresh`), so `finishPlace` is no longer called over and over.
- **The repair.** A place finished more than once since 14:58:50 UTC and written under the old rule is collapsed once to one read, with each version kept at one. A place written under the new rule (`rule: 2`) is never collapsed.

- **Found while proving it: ci.yml stopped parsing.** From 29dc042 on, a one-line `run:` holding `SMOKE: PASS` made ci.yml invalid YAML, so GitHub ran no ci.yml job on four pushes and nothing showed red. The step is now a block. `scripts/workflows-parse.py` parses every workflow in `verify:gates` and in its own `workflows-parse.yml`, outside the file it guards. **Proven to catch:** run on the committed ci.yml, it names line 1162, column 296.

The inflated counts cannot be recovered. A lesson that was truly read twice since then will show one read.

## Verification

`the-read-count-counts-readings.test.js` has 8 cases:

- A 50-sentence reading counts 1.
- **Proven to catch:** without the reader's guard, the old rule finishes after many sentences, and the new count rule still holds at 1.
- Back to the top and through again counts 2.
- Re-reading only the last paragraph stays at 1.
- The deck's whole finish counts.
- ×38 since the loop collapses to "✓ READ · Adult".
- ×3 from before the loop is left alone.
- After the collapse, a real re-read counts again.

The 122 test files that touch the place store, the read mark, the evidence rule and the lesson space were run.
