# DR-0745 — The band you pick is what you read, from the first words on the card

- **Status:** accepted (built and proven in the suite; the live proof is L206 on his Fold with Child picked)
- **Tier:** A (one paragraph on the lesson card reads from the picked band's own text; no table, no policy, no money)
- **Type:** defect
- **Date:** 2026-10-01
- **Scope:** `app/src/lib/learn-framework.js` (`openingOf`, `bandOpening`), `app/src/components/ChurchLearn.jsx` (the closed-guide card's first paragraph and its Share), `app/src/__tests__/the-band-you-pick-is-what-you-read.test.js` (new), `app/src/__tests__/the-level-is-picked-before-the-lesson-starts.test.jsx` (one case added), `docs/decisions/INDEX.md`.
- **Principles:** REALITY-TRACE (DR-0061: observed on his screen, three bands in turn), VERIFICATION-DOCTRINE (DR-0076: the words are the band's own authored text, never a summary the app invents), DR-0717 (the level is picked before the lesson starts), DR-0692 (every lesson carries all four bands; the band is only worth picking if it is read), DR-0075 (feel, flow, smoothness), HOLD-THE-HAND (DR-0621).
- **Grounds:** Darrell, 2026-10-01, three screenshots of L206 on his Fold with Senior, Child and Adult picked in turn under "Who is learning? Pick first, then start", and the same paragraph under all three: *"What keeps happening to the options for all ages?!!!!!!!!!!!!!!! The features keep coming and going!!!!!!!!! Why????????!!!!!!!!"*

## Context

**SHOULD.** DR-0717: the level is picked before the lesson starts. DR-0692: every lesson carries all four bands, each a full version in that age's words. So a pick should change what the person reads, from the first words.

## What was measured (SHOULD → ARE → GAPS, DR-0219)

**ARE (his screens, 2026-10-01).** L206 carries a child, youth, teen and senior version (`levels` in `living-lessons-class.js`), and `resolveForAge` returns the right one for each band. But the lesson card with the guide closed drew `m.bigIdea` as its first paragraph, the adult register, whatever band was picked. The band's own words began only after "Start this lesson" opened the guide. His three screenshots show exactly that: the band row changing, the paragraph under it not. The Read Aloud panel already read the band's words (it builds its arc from the band), so the voice and the screen disagreed.

**GAPS.** A pick changed nothing a person could see on the card. Nothing said whose words the first paragraph was.

## Impact

Pick Child and the card's first paragraph is the child version's own opening, captioned "In the words for Child 6–10"; pick Senior and it is the senior opening; pick Adult and it is the big idea as before. Share under it carries the words on the screen. A lesson with no bands shows its big idea for everyone, exactly as before, and nothing is ever invented.

## Decision

1. **`bandOpening(module, band, override)`** (`learn-framework.js`): when the lesson carries the picked band's own authored text, the card's first paragraph is that text's first movement (`openingOf`: up to the first blank line or spelled movement marker such as "ONE.", else the leading sentences within 900 characters); otherwise the big idea. An explicit depth override keeps the big idea.
2. **The card says whose words** (`ChurchLearn.jsx`): a caption "In the words for Child 6–10" above the paragraph when the words are the band's own; none for the big idea. The paragraph carries `data-testid="lesson-opening"` and `data-band`, and the Share under it carries the same words.
3. The level row stays above the opening (DR-0717); the open guide is unchanged (it already read the band).

## Verification

- `the-band-you-pick-is-what-you-read.test.js` (9 tests): `openingOf` stops at the first movement marker when the lead is long enough, at a blank line, keeps a short lead whole, cuts a long unbroken text at a sentence within the limit, and returns empty for empty; L206 for a child opens in the child words (a prefix of the child version, not the big idea); youth, teen and senior each open in their own words and all differ; **proven to catch:** the adult band keeps the big idea and a lesson with no bands keeps it for every band; a depth override keeps it.
- `the-level-is-picked-before-the-lesson-starts.test.jsx` (new case): on L202 from Latest lessons the card opens on the big idea with no caption; picking Child changes the card's first paragraph to a prefix of the child version with the caption "Child 6–10", the level row above it; picking Senior changes it again; the other six cases unchanged and green.
- Lint clean.
- **Live proof after deploy:** L206 on his Fold, Child picked, the first paragraph reads "Kings who search it out: the Word is the book that sets the mind…" under "In the words for Child 6–10". `re-review: 2026-10-03`.

## Limits, stated

1. The caption names the band, not the author of the version; the version's provenance stays in the lesson's own words.
2. The opening is the band text's first movement, so the rest of the band version still begins at Start this lesson; the whole band version is not laid on the closed card (DR-0438: one lesson, one copy).
