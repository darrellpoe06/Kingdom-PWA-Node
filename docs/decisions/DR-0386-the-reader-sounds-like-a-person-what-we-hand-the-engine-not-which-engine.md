# DR-0386 — The reader sounds like a person: what we hand the engine, not which engine

- **Date:** 2026-09-13 (shipped in #1561; record written 2026-09-13 on Darrell's instruction to reconstruct)
- **Status:** accepted
- **Tier:** B
- **Type:** orchestration

## What was asked

Darrell, 2026-09-13: *"the text to speak aspect needs to be better at the words sounds... can we get close to humans when talking or do we still have to sound like a computer no offense?"*

## The finding

None taken — and the honest finding is that **most of what sounded mechanical was OUR TEXT, not the voice.** Four faults, all in what we handed the engine, none needing a different synthesizer.

1. **PHRASES CUT IN HALF.** `segmentText` split on `.` `!` `?` then word-wrapped anything over 180 chars at whatever word happened to cross the limit — a hard stop in the middle of a clause. Nobody breathes there. It now cuts at a real boundary (`;` `:` `,` and *and/but/so/because/which/when/where/while*) and falls back to the old word wrap only when no boundary is in range.
2. **SHOUTING.** The house style writes lead clauses in capitals — **313 of them across the corpus, measured.** Engines treat an ALL-CAPS run inconsistently and several spell it out, so "THE DIRECTIVE." is read *T-H-E D-I-R-E-C-T-I-V-E*. Lowered for the UTTERANCE only; the screen keeps its capitals.
3. **SHOUTED VERSE REFERENCES.** Measured: **6** in the corpus ("HEBREWS 2:14", "LEVITICUS 17:7"). `speech-text.js` matches a *capitalised* book name, so these slipped past every reference rule and came out as "two COLON fourteen". Book names are un-shouted first, so the matcher sees what it expects.
4. **TYPOGRAPHY.** Em-dashes became a real breath, curly quotes flattened, ellipses made into a pause the engine actually takes.

## What was NOT built, deliberately

**No second reference expander.** `speech-text.js` already says "First John, chapter one, verse eight" and knows a psalm is numbered rather than chaptered. A first draft of the new module carried its own worse copy before that file was read properly — **deleted.** One registry, which is the 0215 lesson.

## The trap that was nearly walked into

`read-follow.js` locates every spoken segment in the DISPLAYED text with `indexOf`, to draw the follow-along highlight. Shaping the segments would have returned `-1` on every lookup and **the highlight would have silently stopped, with nothing failing loudly.** So splitting and shaping are kept apart: segments stay **exact substrings** of the page, and only the utterance is smoothed. A test asserts the substring property, and breaking it fails.

## Proof

`npm run verify` green: 960 files, 14,342 tests. 17 new tests, two proven-to-catch — one for the follow-along trap, one for the word-sequence gate that refuses any shaping which adds, drops or reorders a word.

## Why this record is late

#1561 shipped with no decision record. Reconstructed from the commit's own detailed message and the diff. See DR-0381. Pairs with DR-0382 (the timbre half, shipped next).
