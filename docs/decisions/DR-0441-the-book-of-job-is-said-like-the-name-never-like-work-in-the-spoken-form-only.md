# DR-0441 — The book of Job is said like the name, never like work, in the spoken form only

- **Status:** accepted
- **Tier:** A (a spoken-form rule and its pins; the page and every quotation are untouched)
- **Date:** 2026-09-16
- **Type:** product
- **Scope:** `app/src/lib/speech-text.js` (`sayTheBookOfJob`, wired into `toSpokenForm`), `app/src/__tests__/speech-text.test.js`
- **Principles:** WORD-FIRST (the Word said right, out loud), TYPOGRAPHIC THEOLOGY bright line (never edit the written text or a quotation), VERIFICATION-DOCTRINE (DR-0076), PERPETUAL-IMPROVEMENT (DR-0075)
- **Grounds:** DR-0285 (2nd Timothy, never two Timothy — the spoken-form seam), DR-0381 / DR-0386 (the reader's rhythm lives in the text handed to the voice)

## The word, as spoken

Darrell, 2026-09-16: *"Reader keeps saying Job like working not Job like the name... can we fix that?!!! Perpetually?"*

## What was true

Every device engine reads the four letters J-o-b as employment. The spoken-form seam already fixed the numbered books and chapter-and-verse (DR-0285), and it left this name alone, so every reference to the patriarch and his book — 32 lessons cite him — was said wrong, out loud, to a listener who may not be reading along.

## The decision

In the **spoken form only**, the capitalised word is said "Jobe" (the spelling every engine reads as the name) wherever it is the patriarch or his book: a reference (`Job 1:6` → "Jobe chapter 1 verse 6"), the name in prose, the possessive. The only exclusions are the capitalised employment senses that can open a sentence, decided by the word that follows ("Job interviews…", "Job losses…"); lowercase "job" is never a name and is never touched. The page keeps "Job"; every quotation keeps "Job"; only the string handed to the voice changes.

"Perpetually" is answered by the gate: the test pins the reference, the prose name, the possessive, a line with two references, the lowercase word, and two capitalised employment sentences — and a proven-to-catch case shows the raw string still says the working word. A regression cannot ship.

## Boundary

A shouted all-caps "JOB" inside a lead clause that is not a reference is lowered by the shouting rule before this one sees it and will read as the common noun; the corpus writes his name in title case, and the un-shouting of book names already restores a reference like "JOB 1:6" before this rule runs.

## Re-review

- **re-review: 2026-09-23** — one lesson that cites Job (L133 or L142) read aloud on his phone; if any engine says "Jobe" oddly, the spelling is the knob, not the rule.
