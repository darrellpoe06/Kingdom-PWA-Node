# DR-0474 — L88's four soils drained, and a helper defined six lines above the check that needed it

- **Status:** accepted
- **Tier:** B (a learner-facing lesson at every age band, and the first proof that the DR-0473 ratchet drains)
- **Date:** 2026-09-18
- **Type:** content
- **Scope:** `app/src/lib/living-lessons-class.js` (L88's four bands rewritten, youth created, two adult elisions and two in `bigIdea` replaced), `app/src/__tests__/living-lessons-l88-verses.test.js` (22 → 30 checks), all four shrink-only baselines (every one SHRANK)
- **Principles:** EVERY-BAND-IS-THE-WHOLE-MESSAGE (DR-0418), VERIFICATION-DOCTRINE (DR-0076 §3), TEACH-DONT-DEBATE (DR-0098 — carried in plain words, not by citation), TYPOGRAPHIC-THEOLOGY (DR-0210), PERPETUAL-IMPROVEMENT (DR-0075)
- **Grounds:** DR-0473 (the ratchet this lesson is the first drain of), DR-0472 (L89, the lesson before it, found the same way), DR-0459 (no elision inside a quotation), DR-0418 (the pass and its floors)

## Why this exists

L88 is the lesson whose defects, arriving one after L89's identical pair, turned a patch into a series-wide measurement (DR-0473). Draining it is both the next step of the full-levels pass and the first evidence that the new ratchet actually falls.

| band | before | floor | after |
|---|---|---|---|
| child | 142 words, **0.21** | 0.50 | 393 words, **0.589** |
| youth | **absent entirely** | 0.60 | 428 words, **0.642** |
| teen | 194 words, **0.29** | 0.60 | 425 words, **0.637** |
| senior | 297 words, **0.45** | 0.60 | 424 words, **0.636** |

The reading ladder was also inverted at the top — teen 9.46 above senior 8.90 — and is now **2.85 / 3.96 / 7.34 / 8.54**, monotone, child under the 7.0 ceiling, youth (3.96) below the adult lesson (4.86).

## The decision

### a. FOUR SOILS, IN ALL FOUR BANDS, BECAUSE THREE IS A DIFFERENT PARABLE

The parable's whole force is comparative: the same Sower, the same perfect seed, four grounds. A band that carried three soils would not be a shorter version of the lesson, it would be a different claim. So every band now carries all four, each with Jesus' **own decode** attached — which is the reason this can be taught with confidence rather than guesswork — and a check holds each soil per band by the words that band actually uses for it.

Two things the gate now holds that are easy to lose and expensive to lose:

- **The thorn-heart diagnostic.** Thorn-hearts *do* grow. They simply "bring no fruit to perfection" (Luke 8:14) — the almost-harvest is the signature, and it is the only soil that looks like success on the way past. Required in every band.
- **The treatment.** Every band must offer one of the three remedies — the new heart Yahweh gives (Ezekiel 36:26), the fallow ground broken (Jeremiah 4:3), or the heart kept with all diligence (Proverbs 4:23) — so the lesson lands as a diagnosis with a treatment attached and never as a sorting hat.

### b. THE FOUR ELISIONS, AND WHERE THE SECOND PAIR WAS HIDING

The adult lesson carried Luke 8:13 and Ezekiel 36:26 each with an ellipsis standing in for the middle of His own sentence. Both now quote the contiguous verbatim span — which was available the whole time, and in the Ezekiel case is simply the **whole verse**, so the reader gains "and a new spirit will I put within you" rather than losing anything.

**And the gate found a second pair I had not looked for.** After fixing the `lesson` field I re-ran the new DR-0473 scanner, and it reported the identical two quotations still elided in **`bigIdea`** — the same verses, the same ellipses, in the field that introduces the lesson. I had fixed what I had read and would have shipped what I had not. That is precisely what a measurement is for, and it is worth recording that the tool caught its author within minutes of existing.

### c. THE TWO RECITED RECORDS

The old senior band opened by telling the reader to teach the parable inside its chapter **"(Luke 8:5-15; DR-0098)"** and to frame it with "the Governor's lens, **DR-0097**". Two identifiers, at a reader, in the first two sentences. Both rules are right; the citations are ours. The rule now travels in plain words — *"then HIS OWN decode — so every symbol carries His authority rather than ours, and let the Word explain the Word"* — and a check forbids `DR-\d{4}` in any band.

## The finding: A HELPER DEFINED SIX LINES ABOVE THE CHECK THAT NEEDED IT

The nineteenth face of the recurring finding, and the least excusable, because the remedy was already sitting in the same file.

L88's new good-ground check asserted that each band names the good ground as **honest**, **keeping** and **patient** — reading the whole band. The break harness removed *every* teaching phrasing of KEEPING from all four bands, and **the check stayed green**: Luke 8:15's own wording — *"an honest and good heart, having heard the word, keep it, and bring forth fruit with patience"* — contains all three words, so **His sentence was answering for ours**.

I had written the `ourProse` helper for exactly this hazard **six lines above**, after L89's gate taught it, and then did not use it on the one check in the file where all three words appear verbatim in the quotation. Fixed: all three claims now read our prose with quotations stripped, and all three are proven to bite.

## A second finding: THE FOUR GROUNDS WERE NOT FOUR SECTIONS ON SCREEN

Found only by running the real formatter over the finished bands instead of trusting the prose, which is the reality-trace rule applied to my own output.

`formatLessonText` numbers a section from markers an author already writes — `FIRST`/`SECOND`…, `I.`/`II.`, `SOIL n`. My child band labelled the grounds **"GROUND ONE."** through **"GROUND FOUR."**, which it does not recognise. So all four were being absorbed **mid-paragraph** — the reader's chunk literally read *"…the Word just bounces off. GROUND TWO. THE ROCK. …"* — in the one band where the four grounds ARE the lesson and a child most needs to see them apart. The child band rendered as **1 section**; it now renders as **4, numbered 1–4**.

The same run caught a related defect in the senior band: **`SOIL 3` was not being numbered at all** (headings came out `[1, 2, 4]`), because the formatter only takes a marker at a sentence boundary and mine followed a closing parenthesis — `"…an heart of flesh." (Ezekiel 36:26) SOIL 3, THE THORNS`. One short sentence of our own between them restored it. That one was caught by the repo's existing `lesson-format.test.js` during the full verify, which is the gate doing its job on a change I had already convinced myself was finished.

Both are now held: a check asserts the child band renders exactly four numbered sections and that no chunk exceeds the house's 420-character wall limit, and both reverts are proven to fail it.

## The evidence

- **47 quoted spans across the four bands, every one verbatim** against the local KJV corpus under STRICT comparison, **0 unreferenced, 0 ellipses** — and L88's whole-lesson scan now reports `elided: []` and `recited: []`.
- **Fullness:** 0.589 / 0.642 / 0.637 / 0.636; `shortBands` for L88 is `[]`.
- **Ladder 2.85 / 3.96 / 7.34 / 8.54, monotone**, child under ceiling, youth below adult.
- **My first child draft measured FK 1.44** — the same trap as L89's 0.77, fragments rather than sentences. Eleven joins brought it to 2.85. Recorded again because it keeps happening at this register and is invisible to the gate, which only checks the ceiling and the order.
- **Covenant name:** Yahweh 3–4 times in each band's own prose, **zero generic-name uses in our own voice**, every quotation's own wording untouched.
- **ALL FOUR shrink-only baselines shrank, none gained:** fullness short 88 → 87; reading inverted 21 → 20; title-unnamed 154 → 153 (bands 462 → 460); **and the new quotation-integrity baseline: lessons elided 113 → 112, lessons reciting 44 → 43, spans 745 → 741.**
- **The ratchet reported 0 fresh and 3 healed** on this lesson, naming each one — which is the DR-0473 drain working on its first pass rather than being asserted to work.
- **The formatter's own output was measured, not assumed:** child 4 sections / 4 headings, youth 7/7, teen 6/6, senior 4/4, longest chunk 410 against the house's 420 limit.
- **The gate:** 31 checks, green.
- **Proven-to-catch:** 24 breaks in four passes, **18 caught, 0 outstanding.** Pass 1: 14 breaks, 9 caught, and all five non-catches were my own `expected` strings failing to match the real test names — the gate had caught every one of them. Pass 2 corrected those: 4 of 5, with the KEEPING miss exposing the real weakness above. Pass 3 exercised the tightened good-ground check on all three of its claims: 3 of 3. Pass 4 exercised the section-break check by reverting the child band's markers to the form that was shipping: 2 of 2.

## What is left

**87 lessons still carry a short band, and 112 still carry an elided quotation.** The pass continues newest-downward; L87 is next. L153 stays excluded at Darrell's word.

**L88's anchor is still `Luke 8:11, 15`** while the lesson references sixteen places. Same position as L89: DR-0465's derived-anchor rule was written for new lessons and no gate holds it here, so it is named rather than quietly widened. Folded into the existing **`re-review: 2026-10-24`** for the per-lesson gates' own pinned metadata.
