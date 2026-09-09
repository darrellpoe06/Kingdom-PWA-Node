# Show the Word — every fold that holds the Word follows the switch

**Date:** 2026-09-09 · **Branch:** `claude/property-photos-project-docs-cdsexr` · **Rule:** DR-0341 §5 (amendment), UX-PATTERNS 2h, DR-0076

**Trigger.** Darrell on the Study series page (Eternal Algorithms), three screenshots: *"The Word does not drop down on all pages?!!!"*

**Root cause (traced in a real Chromium against the real bundle).** The switch flips correctly (a DOM click on the button set storage `on`, flipped the label, opened five folds). But every content fold on the page — Section "Go deeper", the forge deep layer, the Godhead entries, the covenant review, the witness pairs, and the Study deep source — held its own `useState(false)` and ignored the switch, so the verses opened inside closed folds and nothing showed. The Torah map's cards had the same defect and were fixed alone in #1490; the class was never closed.

**Fix.** `useOpenWithTheWord()` in `app/src/lib/show-the-word.js` (switch decides; a tap flips one fold; the switch clears flips). Bound in `TorahPatternMap` (refactored onto the hook), `EternalAlgorithmsStudy` (five folds), `Study` (deep source). Exempt with reasons: "About this", PracticeLearn lesson accordions, ChurchLearn tutor panel, ScriptureLibrary per-verse tools, the chips' own state.

**Proof.**
- `show-the-word.test.jsx`: real `EternalAlgorithmsStudy` render (all content folds false → true → one closes on its own → Hide closes all) and a source scan across every component that folds and renders the Word; proven-to-catch by reverting `Study.jsx` to `useState(false)` (failed by name), then restored. 27 tests.
- Real Chromium, 412×915: Church → Eternal Algorithms → Study series → one tap on the button → label "Hide the Word", five folds open, five Close buttons, six verse regions, zero page errors; the three folds left shut are "Install app", "About this", the network chip. Screenshots `10-study-before.png`, `11-study-after-switch.png`, `12-study-after-switch-b.png`.
- Guards: ui-standards 0 regressions; consistency, module-boundary, monolith-budget, contrast, fab-overlap OK; eslint clean.

**Also observed.** The live-service bar (fixed, up to 45vh) covers the top third of a phone during a service window and swallowed the headless tap until dismissed. By design, collapsible and dismissible; noted for the next driver.
