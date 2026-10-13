# DR-0391 — A list of references is not a sentence, and a green reference must open

- **Date:** 2026-09-13
- **Status:** accepted
- **Tier:** B (the lesson surface, and the reader a listener depends on)
- **Type:** orchestration

## The report

Darrell, 2026-09-13, from the full-screen lesson view with the reader running on the Anchor block:

> "Links don't work in last played... don't read long list of references together... especially in these.... just when the word or a point is needed... makes sense?"

And, confirming the scope a moment later: **"Only lists..."**

## Two defects on one screen, and they are the same family

1. **THE READER PERFORMED AN INDEX.** An anchor line can carry **eighty** references separated by semicolons — L149's does, and that is partly this session's own doing. Read aloud one at a time that is minutes of *"Matthew chapter four verse ten, Isaiah chapter forty-two verse eight, Exodus chapter twenty verse three…"* before a single word of teaching arrives, with no way for a listener to skip it. It is a **list being performed as prose** — the same class as the chrome the reader used to speak (CONTROLS ARE NOT CONTENT).
2. **THE ANCHOR'S REFERENCES LOOKED LIKE LINKS AND WERE NOT.** They rendered as plain interpolated text inside a paragraph coloured `#5A6E3D` — **green because the paragraph is green**, not because anything was interactive. Every other surface in the app promises *"Tap any verse reference to read it right here."* This one call site advertised that affordance and did not have it. **That is the hollow-surface class (DR-0381) wearing a different coat:** a surface that appears interactive and is not.

## The decisions

1. **THE RULE IS ABOUT RUNS, NEVER ABOUT REFERENCES** — which is exactly the line he drew with *"Only lists."* A reference **inside a sentence is the point**, and is what he explicitly wants kept: *"just when the word or a point is needed."* So `collapseReferenceRuns` (new, in `lib/speech-shape.js`) collapses **three or more references that are adjacent** — separated by nothing but punctuation — into one short sentence naming the count and where they are. **One or two are left spoken in full**, and **prose between two references protects both**, because that is a citation doing work.
2. **IT NEVER SILENTLY DROPS CONTENT.** The collapse says *"N Scripture references are listed on the screen"* rather than skipping in silence, so a listener knows something is there instead of wondering what was passed over. The prose around the run is untouched.
3. **THE COLLAPSE RUNS BEFORE EXPANSION, AND AFTER UN-SHOUTING.** Order is load-bearing twice: book names are un-shouted first so the scanner can see them (DR-0386's lesson), and runs collapse **before** `REF_RE` turns each survivor into "chapter X verse Y" — collapsing afterwards would mean expanding eighty references only to discard the expansion.
4. **THE MATCHER STAYS IN ONE PLACE.** It reuses `segmentByReferences` → `findScriptureRefs`, the single shared scanner, so what counts as a reference is still decided once (the 0215 lesson, and DR-0386's deleted second expander).
5. **THE ANCHOR LINE IS WIRED TO `WordInline`,** so every reference in it opens the verbatim KJV in place — the promise the rest of the app already makes.

## Proof

- **Proven-to-catch (DR-0076 §3), in BOTH directions**, because this rule can fail two opposite ways:
  - Disable the collapse → **3** tests fail (the reader is back to performing the index).
  - Make the collapse greedy (`min = 1`) → **5** tests fail, including every test that protects a citation in prose. *A fix that over-applies would have destroyed the thing he asked to keep, so it is pinned as hard as the fix itself.*
  - Revert the anchor line to plain text → the wiring test fails.
- 13 new tests in `reader-skips-reference-lists.test.jsx`, including totality on empty/null input and the adjustable threshold.
- `npm run verify`: **969 files, 14,577 tests, green.**

## The limit, stated

**"Links don't work in last played" had two possible readings and I acted on one.** I took it as the full-screen play view's Anchor block, because that is the screen the screenshot shows and the same screen the rest of his message is about — and reading the code confirmed a real defect there. The other reading is the **"Recently opened"** cluster on the lesson picker; its title chips call the same `open(id)` the main list uses, so no defect was visible there and nothing was changed. If that was the surface he meant, this record is where to start. **re-review: 2026-09-20**, with the live pass.

## Pairs with

DR-0381 (the hollow-surface class and its ninth review dimension — this is another instance), DR-0386 (the reader's rhythm, and the one-registry rule this obeys), DR-0340 (a Scripture reference opens the Word in place — the promise this call site was breaking), DR-0076 (proven-to-catch, in both directions here).
