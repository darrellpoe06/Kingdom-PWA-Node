# DR-0433 — Mathematics, slice 1: counting, measure and reason from the Word — eight Elementary lessons, every number the Word's own, the working shown

- **Date:** 2026-09-15
- **Type:** product · curriculum
- **Status:** decided and shipped (this push)
- **Declared by:** Darrell, 2026-09-15 (*"add Mathematics as a Tab"*; and from DR-0431 the same day: *"math that has the Word, totally Word based... the math of the Bible... qualitative and quantitative ways of math, like engineering"*)
- **Pairs with:** DR-0432 (the school), DR-0431 (Little Learners), DR-0417 D3 (the age number, FK ≤ 5.0), DR-0076 (measure, don't claim), DR-0098 (teach what is written and stop), DR-0127 (Word-first lead), DR-0420 (qualitative and quantitative analysis, L156)

## What was built
`app/src/lib/mathematics-class.js` (generated from `scratch/math/gen.mjs`; every quoted span fetched verbatim from `app/public/bible/kjv`), registered in `LEARN_CATALOG` under `category: 'Mathematics'`, `programLevel: 'Elementary'`, `wordFirst` Psalms 147:4-5; Isaiah 40:12.

| code | lesson | the Word's numbers it works |
|---|---|---|
| MAT-101 | Count and Place Value | 603,550 (Numbers 1:46); thousands/hundreds/fifties/tens (Exodus 18:21); threescore and ten; 969 |
| MAT-102 | Adding and Taking Away | 5 + 2 = 7; 12 − 7 = 5; Gideon 22,000 + 10,000 = 32,000; 10,000 − 300 = 9,700; 100 − 1 = 99 |
| MAT-103 | Multiplying and Sharing | thirty/sixty/hundredfold; 70 × 7 = 490; 10 × 100 and 20 × 50; 12 oxen ÷ 6 wagons = 2 |
| MAT-104 | Parts and Fractions | the tenth, the fifth (restitution, Joseph), the half (Zacchaeus), the double portion, omer = 1/10 ephah |
| MAT-105 | Measure | the ark 300 × 50 × 30; Goliath; the ark of the covenant 2½ × 1½ × 1½; ephah/omer/hin; a just weight |
| MAT-106 | Shapes | the molten sea 10 across, 30 about (ratio 3, and the honest line that the Word gives a builder's measure, not a formula); the foursquare altar; the cube city; the bow; the wheel |
| MAT-107 | Time and Cycles | the week; 7 years; 7 × 7 = 49, the 50th; 40 days = 5 weeks 5 days; 70 years counted from the books |
| MAT-108 | Quality and Quantity | Gideon's sort then count; Daniel's ten-day test; the widow's two mites; count the cost; Bezaleel |

Ari's mathematics posture (`MATHEMATICS_TUTOR_META`): show the working; every number from the lesson or the Word; never invent or round a Bible number; say where mathematics adds a name the Word does not use.

## Gate — `app/src/__tests__/mathematics-course.test.js` (proven-to-catch)
Eight lessons and the eight strands by id; Elementary declared; catalog registration under Mathematics with a Word-first frame; per lesson: > 2,500 chars, FK ≤ 5.0, a written number sentence on the page, quiz ≥ 6 with hearable options, the no-grown-up line, verbatim KJV for every double-quoted span, every anchor quoted whole, Yahweh in our voice; **every written number sentence on the page is re-computed by the test** (12+ sentences), the census figure, 7 × 7 = 49 and 49 + 1 = 50, the sea's ratio and the honest formula line; one altered word inside a quote fails.

Measured at ship: FK per lesson 1.0–2.4 (all ≤ 5.0); 6–7 quiz questions each; the whole-span gate green.

## What it does not claim
The Word is not a mathematics textbook and is never made to say what it does not say. MAT-106 teaches that 1 Kings 7:23 records a builder's measure in whole cubits and that mathematics learned the exact ratio by measuring many circles — both true, neither read into the other (DR-0076; DR-0098).

## Timeline (measured)
Slice 1 (8 lessons) took one session. **Slice 2 — re-review 2026-09-22** alongside Little Learners slice 2: bigger numbers and estimation, ratio and proportion (the ark's 6 : 1, the sea's 3 : 1), the temple's geometry, the census as data (Numbers 1 and 26 compared), money and the shekel, and the first algebra (an unknown, from the parable of the talents). **Slice 3 — 2026-10-13**: the bridge into the Engineering & Technology department (DR-0432's timeline).
