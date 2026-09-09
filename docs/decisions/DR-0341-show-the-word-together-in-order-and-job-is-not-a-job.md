# DR-0341 — Show the Word together or one at a time, in the order it happened, and Job is not a job

- **date:** 2026-09-08
- **status:** accepted
- **tier:** A (a reading affordance on the DR-0340 primitives; no schema, no money, no new external call)
- **decides:** that every Scripture on a page opens and closes with one tap AND each reference still toggles on its own; that opened verses read in timeline-then-flow order as far as the Word settles it; that the reader is told all three in place; and that the one shared reference matcher tells a book's name from an everyday word
- **pairs-with:** DR-0340 (a reference opens the Word in place), DR-0201 / Pattern 2e (inline, the still screen), DR-0076 / DR-0100 (verbatim, honest about what is settled), scripture-chronology.js (stated vs computed; no absolute dates; forks named), DR-0314 (a standard lives in the doc and the gate)
- **source:** Darrell, 2026-09-08, four messages in a row on the tap-to-open verses: *"Also need to make all scriptures open with one click so the reader can read it with or without the scriptures presented... or else users have to click each one separately"* — *"collectively... and close collectively... also work independently... both... best of all options"* — *"also... have them chronological... as much as they can be... so it makes sense based on their timelines and or the flow of scriptures"* — *"Make sure the users know also..."* — and *"Is it possible to train the Ari to read Job and job differentiating the work from the person in the biblical scriptures?"*

## Decision 1 — Together AND one at a time, both

`lib/show-the-word.js` is one app-wide switch (module store + `useSyncExternalStore`, the house pattern; remembered on the device, fail-soft on storage). `ShowTheWordToggle` flips it. Every `VerseChips` and `WordInline` on the page reads it through one shared model (`useOpenRefs`): the switch decides the page; a tap on any chip overrides that one reference on top of it; flipping the switch clears the overrides so the page reads whole again. A verse opened by the switch never nudges the screen — thirty verses opening at once must hold perfectly still (Pattern 2e); only a tapped verse below the fold gets `gentleReveal`'s overshoot.

## Decision 2 — In the order it happened, as far as the Word settles it

`lib/scripture-order.js`: a reference sorts by **era band** first (a coarse, widely-held placement of each of the 66 books — Job among the patriarchs, the prophets with the kings they spoke to, the letters beside Acts), then by the Word's own arrangement, then chapter and verse. The flow of Scripture is the fallback wherever history does not clearly say otherwise. Bands carry ORDER, never a date; placements the Word leaves open (Job, Joel, Obadiah, James, Hebrews) are named in `OPEN_PLACEMENTS`, never silently resolved — the same three honesty rules `scripture-chronology.js` runs on. A chip row and the verses beneath it read in this order; prose stays exactly as the author wrote it while the verses beneath it read in order.

## Decision 3 — The reader is told, in place

Beside the switch, one plain sentence: *"Tap any verse reference to read it right here. Show the Word opens them all at once, in the order they happened, as far as the Word itself settles it."* No tour, no hover-only tooltip; the sentence sits where the chips are.

## Decision 4 — Job the man, job the work: a rule and a gate, not training

The shared matcher (`video-harvest.js`, used by the harvest, the sermon points, and the reader's chips — one matcher, one judgement) already requires the "Book chapter:verse" shape, so "a job" was never a verse. What slipped through was a time of day beside an everyday word: "meet at the job 9:30" is a real Job 9:30. Two deterministic rules: a book whose name is an everyday word (job, mark, acts, numbers, judges) counts only when written as a NAME — an initial capital, "Job" or "JOB" — while every other book still matches in any case because transcripts arrive lowercase; and any match followed by am/pm, or carrying a clock's leading zero, is a time, not a verse. Pinned in `word-inline.test.jsx` ("reads Job the man and job the work as different things") and unchanged for the harvest's own pins.

## Proven-to-catch (DR-0076 §3)

`show-the-word.test.jsx` (11): a switch that opens only one component's chips, a chip that ignores the switch or a switch that ignores a chip's tap, a page-wide open that nudges the screen, a forgotten preference, a missing hint, or a surface without the toggle — each fails a named case. `scripture-order.test.jsx` (10): a book left out of every era, Job sorted after Malachi, a within-book verse out of order, a date in the era table, an unreadable reference crashing the sort, or a surface rendering verses in author order — each fails. `word-inline.test.jsx` gains the Job/job cases.

## Consequences

A reader chooses in one tap to read with the Word open or closed, and still opens or closes any one verse. What opens reads in the order it happened, honestly bounded. Ari never mistakes a worker's job for the man from Uz.
