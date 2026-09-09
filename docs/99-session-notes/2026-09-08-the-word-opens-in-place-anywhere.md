# The Word opens in place, anywhere it is named

**Date:** 2026-09-08
**Branch:** `claude/property-photos-project-docs-cdsexr` (restarted from `main` @ `ac23a30` after PR #1486 merged — a fresh change, not a stack on merged history)
**Rules in force:** DR-0219 (SHOULD / ARE / GAPS) · UX-PATTERNS principle 6 + Pattern 2e (inline, the still screen) · Pattern 2g (36px floor, focus ring, spoken label) · DR-0314 (a standard lives in the doc and the gate, not only in code) · DR-0076 (verbatim text, honest miss) · DR-0111 / DR-0236 (do the work, nothing waits)
**Decision record:** DR-0340

---

## What was asked

Darrell, looking at the Torah pattern map on his phone: make the verse references tappable so the Word shows when pressed — without leaving the page, without the screen jumping, opening exactly where the tap was, so nobody has to find their place again. Then, widening it: *"really anywhere should have this ability... so the scriptures can always be read... anywhere at anytime... simple functions just to show the Word."*

## What the trace found

| # | Finding | Where |
|---|---|---|
| 1 | References on the pattern map were inert `<span>`s | `TorahPatternMap.jsx` |
| 2 | Cross-references in the Scripture Library were inert spans | `ScriptureLibrary.jsx` |
| 3 | References named inside prose were plain text | Study plain/deep layers, Learn stories, the map's own sentences |
| 4 | The one button form (`BibleReader`) navigates to the reader — right for the reader, wrong as the general answer | `BibleReader.jsx` |
| 5 | Two reference matchers, neither position-aware, so prose could not be cut around a reference | `video-harvest.js`, `prep-outline.js` |
| 6 | The whole KJV is already hosted in the app, lazily by book, verbatim — the text source needed nothing new | `lib/bible-kjv.js` |

Required reading opened before the design (the hook asked, rightly): EXCELLENCE-STANDARD, UX-PATTERNS in full, every principle line of LESSONS-LEARNED. Three things changed because of it: the touch floor went from 32px to 36px, `gentleReveal` was added on open so the screen holds still, and the KJV badge sits beside the text the way Pattern 1 draws it.

## What changed

- **`components/VerseChips.jsx`** — a row of reference buttons; the verse opens beneath the row; several at once; no href; honest miss; `gentleReveal` on overshoot only.
- **`lib/video-harvest.js`** — `findScriptureRefs(text)` exported beside `extractScriptureRefs`: same regex, positions kept, the range end now captured. `extractScriptureRefs` unchanged in behaviour.
- **`lib/verse-refs.js`** — pure `segmentByReferences` / `referencesIn`.
- **`components/WordInline.jsx`** — prose with each named reference as an in-place chip; the verse opens under the paragraph; a paragraph naming nothing renders as the plain element.
- **Wired:** TorahPatternMap (chips + three prose fields), Study (plain, deep, scripture line), ChurchLearn (story body + verse line), ScriptureLibrary (cross-references).
- **Docs:** UX-PATTERNS Pattern 2h; DR-0340; INDEX row + pointer → DR-0341; register row.
- **`app/src/lib/legibility-health.json`** regenerated (the legibility gate keeps it byte-in-sync with a fresh scan; it moved when the surfaces changed).

## Evidence

- `npx vitest run` — 12,753 passed, 0 failed, 869 files.
- `npx eslint … --max-warnings 0` — clean on every changed file.
- `ui-standards-guard` 0 regressions · `consistency-guard`, `monolith-budget-guard`, `module-boundary-guard`, `contrast-guard`, `legibility` — all OK.
- New tests: `verse-chips.test.jsx` (9), `word-inline.test.jsx` (13) — each proven-to-catch as listed in DR-0340; the real map is mounted with the KJV fetch stubbed at the `bible-kjv` seam and opens Genesis 6:2 in the card.
- Not verified here: the tap on a real phone. jsdom proves the button, the placement and the text; the DR-0104 live review is the first tap on the map.

## Remainder, dated

- LessonFlow, PracticeLearn, the living-lessons bodies, the Godhead study onto `WordInline`; and whether a source scan can gate an inert reference without noise — `re-review: 2026-09-22`.

---

## Same day, four more words from Darrell — DR-0341

*"make all scriptures open with one click... collectively... and close collectively... also work independently... both"* · *"have them chronological... as much as they can be"* · *"Make sure the users know also"* · *"train the Ari to read Job and job."*

- **`lib/show-the-word.js` + `components/ShowTheWordToggle.jsx`** — one app-wide switch (house `useSyncExternalStore` pattern, remembered on the device, fail-soft); `useOpenRefs` in `VerseChips.jsx` is the one open-state model both primitives share: the switch decides the page, a tap overrides one reference, flipping the switch clears the overrides. A page-wide open passes `reveal={false}` so nothing nudges.
- **`lib/scripture-order.js`** — era bands (order, never dates), then shelf, then chapter:verse; `OPEN_PLACEMENTS` names Job, Joel, Obadiah, James, Hebrews. Chip rows and opened verses sort; prose never does.
- **The hint** — one sentence beside the switch; pinned.
- **Job / job** — `isNotAVerse` in `video-harvest.js`, applied by both `extractScriptureRefs` and `findScriptureRefs`: everyday-word books need a capital initial; am/pm and a leading zero mean a clock. The harvest's own lowercase pins (`psalm 46:10`, `1 john 4:9-10`) still hold.
- **Guards:** the consistency guard caught a `max-w-prose` on the new hint (width-cap over baseline) — removed; the toggle's row wraps instead.

**Evidence:** `npx vitest run` — 12,776 passed, 0 failed, 871 files. Lint clean. `ui-standards-guard` 0 regressions; consistency, monolith, module-boundary, contrast, legibility OK. `legibility-health.json` regenerated.

---

## 2026-09-09 — the remainder, pulled forward (Darrell: "do the LessonFlow, PracticeLearn and Godhead study now... don't wait")

- **`LessonFlow.jsx`** — the shared Learn engine every course and the living lessons ride: both part blurbs on `WordInline`; `ShowTheWordToggle` in the paged view (under the stage rail) and the read-it-all view.
- **`PracticeLearn.jsx`** — the big idea, every teaching paragraph, quiz explanations, the course summary, the four strands.
- **`EternalAlgorithmsStudy.jsx`** — the Godhead study (outcome, then, the psychological perspective), the series' plain and deep layers, the forge's three layers, the covenant review's summary and points, the intertwine, the study intro; the toggle under the Godhead banner and beside the study intro. The curated verse blocks that were already open by design stay as they were.
- Pins added to `word-inline.test.jsx` and `show-the-word.test.jsx`; the DR-0340 / Pattern 2h `re-review: 2026-09-22` closed with this evidence; the source-scan gate question carried to 2026-10-09 with its reason.
