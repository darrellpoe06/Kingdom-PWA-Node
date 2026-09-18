# DR-0489 — Four more lessons, and the repair that broke a floor

- **Status:** accepted
- **Tier:** B (lesson content on the corpus reader path)
- **Date:** 2026-09-18
- **Type:** content
- **Scope:** `app/src/lib/living-lessons-class.js` (ll84 youth; ll92 youth + senior; ll93 youth + senior; ll162 youth), `app/src/lib/band-differentiation-baseline.json` (12 -> 8), `app/src/lib/quotation-integrity-baseline.json` (698 -> 690), `app/src/lib/title-in-narrative-baseline.json` (438 -> 434)
- **Principles:** EVERY-BAND-IS-THE-WHOLE-MESSAGE (DR-0418), DIFFERENTIATION-IS-NOT-ABBREVIATION (DR-0484), NO-ELISION-IN-A-QUOTATION (DR-0459)
- **Grounds:** DR-0484 through DR-0488

## Measured

| lesson | worst before | worst after | bands written |
|---|---|---|---|
| ll84 blessed-and-highly-favored | 0.70 | **0.22** | youth |
| ll92 yahweh-standardized-love | 0.67, 0.62 | **0.34** | youth, senior |
| ll93 come-let-us-reason | 0.67, 0.64 | **0.27** | youth, senior |
| ll162 do-not-take-a-death-so-personal | 0.64 | **0.15** | youth |

Recorded duplication debt **12 -> 8 lessons**. Sixteen of twenty repaired.

## The finding: a repair that broke a different floor

ll162's new youth band measured **0.59 against a floor of 0.60**. The full-levels gate failed it, correctly, and the failure is the one this pass is most exposed to: **differentiation is not abbreviation** (DR-0484's own hard constraint). Re-conceiving a band sentence by sentence naturally sheds words, and a band that comes out shorter than the one it replaced has traded one defect for a worse one.

The remedy was not padding. The band was missing something real: the question a young reader carries after a death and almost never says out loud — *was it my fault, did I not pray hard enough, was I being punished.* The lesson already quotes Lamentations 3:33, `"For he doth not afflict willingly nor grieve the children of men."`, and that verse answers the question directly. Putting the question and the answer next to each other took the band to **0.65** and made it a better lesson than the one that was short.

**The rule this suggests, and it is now standing practice for the rest of the pass: when a re-authored band falls under its floor, look for what the old band never said rather than for more words.** A band that was cloned from another band is usually missing something its own reader needed, and the floor is a useful place to notice it.

## Two baselines moved again

Both sibling ledgers shrank without being aimed at — **quotation-integrity 698 -> 690** elided spans (my bands quote whole rather than carrying the old elisions through) and **title-in-narrative 438 -> 434** unnamed bands (each new band opens by naming its lesson). That is now the third and fourth time in this pass (DR-0487, DR-0488). It is no longer a surprise; it is how the five ledgers behave, and re-running all five after touching any prose is settled practice.

## What remains

Eight lessons: ll98 0.63, ll103 0.62, ll97 0.61, ll104 0.61, ll171 0.59, ll167 0.58, ll94 0.54, ll168 0.54.
