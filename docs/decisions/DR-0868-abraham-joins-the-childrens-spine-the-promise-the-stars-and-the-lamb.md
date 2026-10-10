# DR-0868 — Abraham joins the children's spine: the promise, the stars, and the lamb Yahweh provided

- **Status:** accepted
- **Tier:** B (family-facing teaching content for children)
- **Date:** 2026-10-10
- **Type:** product (lesson)
- **Scope:** `app/src/lib/little-learners-class.js` (lil9, new), `app/src/__tests__/little-learners-course.test.js` (count 8 → 9), `app/src/lib/course-band-coverage-baseline.json` + its test (allFour 234 → 235), `app/src/lib/lesson-dates.json` (derived)
- **Principles:** WORD-FIRST (DR-0127), VERIFICATION-DOCTRINE (DR-0076 — every verse fetched from disk), TYPOGRAPHIC-THEOLOGY (CLAUDE.md Layer 0), DR-0417/DR-0418 (four full bands), DR-0733/DR-0795 (talk-together in every band)
- **Grounds:** DR-0431 (Little Learners), DR-0867 (Noah) and lil7 (Adam and Eve) — the first two stations of this spine

## The word, as spoken

Darrell, 2026-10-10: *"Abc's 123'.... etc... Genesis - Revelation... Adam and Eve... etc... basic building blocks of Yahweh's Perspectives explicitly for the children..."*

Adam and Eve, then Noah, now Abraham. Third station.

## What was measured

Before this: Little Learners carried **8** lessons. The Genesis-to-Revelation spine Darrell named had two of its stations written — lil7 (Adam and Eve) and lil8 (Noah) — and stopped at the flood.

The read-aloud band was measured three times while being written, against the live gate rather than by eye:

| pass | grade | ceiling | verdict |
| --- | --- | --- | --- |
| first draft | 2.35 | 2.0 | over |
| after one simplification | 2.05 | 2.0 | still over |
| after the second | **1.90** | 2.0 | inside |

Only my own sentences were shortened. Quotations are excluded from the measure by `ourProseOnly`, so there was never a reason — or a way — to touch a word of Scripture to reach the number.

## The decision

**lil9 — Abraham: the promise, the stars, and the lamb Yahweh provided.** Five bands, hand-written, in the order the text gives them:

1. **He left before he was told where.** *"Get thee out of thy country, and from thy kindred, and from thy father’s house, unto a land that I will shew thee:"* (Genesis 12:1) Three securities removed in one clause, and a future tense where an address should be.
2. **The promise was biologically closed**, and the answer was a sky rather than an argument: *"Look now toward heaven, and tell the stars, if thou be able to number them"* (Genesis 15:5).
3. **The hinge.** *"And he believed in the LORD; and he counted it to him for righteousness."* (Genesis 15:6) No work, no ritual, no law yet in existence — and the ORDER matters: the believing came first, the credit followed. This is the verse the teen and senior bands dwell on.
4. **"At the set time"** (Genesis 21:2) — there was a schedule and he was not shown it, which is the part a reader who has waited recognises.
5. **The lamb.** *"My son, God will provide himself a lamb for a burnt offering"* (Genesis 22:8) — and a ram was provided, caught in a thicket.

**Genesis 22 is carried at the level of trust and provision for the littlest.** The course posture is explicit that Ari must *never frighten* a 3-to-6-year-old (`LITTLE_LEARNERS_TUTOR_META.posture`). So the read-aloud band tells what Abraham *said* — that Yahweh would give the lamb — and that Yahweh did. Nothing is softened into untruth; the knife is simply not where a four-year-old's attention is placed. The teen and senior bands carry the weight.

**Every verse fetched from `app/public/bible/kjv/Genesis.json`** — 12:1, 12:2, 15:5, 15:6, 17:5, 21:2, 22:8. Genesis 12:1 carries a curly apostrophe in "father’s", preserved exactly.

## Verification

Measured on the live gates before the lesson entered the catalog file:

- **Read-aloud band**: 2,287 chars (floor 1,000), grade **1.90** against a ceiling of 2.0. It took two simplification passes — the first draft measured 2.35 and the second 2.05, both over. Only my own sentences were simplified; quotations are excluded from the measure and not one word of Scripture was touched to hit a number.
- **Ladder rises, every band over floor**: child 0.71 / grade 3.07 · youth 1.09 / 4.55 · teen 1.19 / 6.84 · senior 1.09 / 7.77.
- **Worst band overlap 0.04** against a ceiling of 0.25 — four real versions.
- **All 29 quoted spans** checked against the KJV on disk: zero faults. No generic term in our own voice.
- **131 green** across little-learners-course, course-four-bands-group-a, course-band-coverage, course-quotation-integrity, american-spelling and the coloring-page gate; eslint clean.

**One fault the gates caught:** the anchor `ref` read `Genesis 15:5-6`, a range, while the lesson labels those two verses separately. The gate requires every anchor ref to appear as a quoted label in the lesson. Corrected to `Genesis 15:6`, which is the hinge verse the anchor theme already quotes.

## Ratchets moved, each on purpose

- Little Learners count **8 → 9**, pinned exactly.
- `course-band-coverage` allFour **234 → 235**, regenerated from the real catalog by `course-band-baseline-write.mjs`. **adultOnly stays 0.**

## What is NOT in this slice, with a date

- **The spine continues**: Moses, David, the Lamb, the Cross, the Empty Tomb, the King returning. **re-review: 2026-10-17**
- **Little Learners letters D–Z and numbers 8–20** remain unwritten; DR-0431's date governs those. **re-review: 2026-10-17**
