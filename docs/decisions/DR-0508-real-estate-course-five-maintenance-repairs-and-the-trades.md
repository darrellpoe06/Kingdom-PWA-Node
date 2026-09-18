# DR-0508 — Real Estate course five: Maintenance, Repairs and the Trades

- **Status:** accepted
- **Tier:** B (content the whole school serves)
- **Type:** content
- **Date:** 2026-09-18
- **Scope:** `app/src/lib/maintenance-trades-course.js` (new, 8 lessons × 3 texts, 79 verbatim spans), `app/src/lib/learn-catalog.js` (the row), `app/src/lib/course-band-coverage-baseline.json` (245 → 253), `app/src/__tests__/maintenance-trades-course.test.js` (new, 39 checks), `app/src/__tests__/learn-crosslist.test.js` (33/571 → 34/579) + `course-band-coverage.test.js` (total pin)
- **Principles:** WORD-FIRST (DR-0098), SPEAK-ESTABLISHED-FACT (DR-0100), EVERY-BAND-IS-THE-WHOLE-MESSAGE (DR-0418 / DR-0498), VERIFICATION-DOCTRINE (DR-0076 §1 §3 §4), NO-ELISION-IN-A-QUOTATION (DR-0459), YAHWEH-IN-OUR-VOICE (DR-0210), NOTHING-WAITS (DR-0236)
- **Grounds:** DR-0500, DR-0501, DR-0504, DR-0507 (the four courses before it), Darrell's instruction: *"Real-estate first then keep closing the gap!!!!!!!"*

## Where it sits

Courses one through four covered the ground, the stewardship, the transaction and the person on the other side. This one covers the **building itself** — what keeps it standing, who does that work, and the ways an owner quietly lets it go.

## The arc, one argument in eight moves

1. **By much slothfulness the building decayeth** (Ecclesiastes 10:18) — two verbs, not synonyms: DECAYETH is the silent stage, DROPPETH THROUGH is the same problem later. And the companion verse answers the money objection instead of stepping around it: *"If the iron be blunt, and he do not whet the edge, then must he put to more strength"* (Ecclesiastes 10:10). Neglect never removes work; it converts cheap work into expensive work. **The principle the course rests on: maintenance is a RATE, not a project.**
2. **Called by name, and filled for the work** (Exodus 31:2-5; 35:35). The first person Scripture reports as filled with the Spirit of Yahweh is a **craftsman**, introduced by name with a genealogy, and the filling is itemised in materials — gold, silver, brass, cut stone, carved timber. Made operational in four measurable places: speed of payment, honesty of scope, whether his judgment is asked, whether he is thanked in a form he would recognise.
3. **Daubed with untempered morter** (Ezekiel 13:10-11). The oracle falls on the **daubers**, not the builder, and names the charge: *"saying, Peace; and there was no peace."* The sin is a false report about a structure, issued in a material rather than in words. Discovery is by **load**, never by inspection. And the aggravating factor the other courses' defects did not have: a visible stain is an INSTRUMENT, so painting it deletes the gauge while the water keeps running.
4. **For they dealt faithfully** (2 Kings 12:12, 15). Repair money handed to workmen and deliberately not reconciled — **and the limit is stated before the application**, because a careless reading makes this an argument against ordinary prudence. Trust treated as an asset with a measurable yield, and the ledger run in BOTH directions: would a tradesman start work for YOU on your word alone?
5. **Stone made ready before it was brought** (1 Kings 6:7). The grammar carries it — *SO THAT* — so the silence is the consequence of preparation, not a rule about reverence. Inverted into a diagnostic: job-site noise is mostly decisions made late, at the most expensive moment available. Plus the cultural obstacle that actually defeats this: preparation is invisible and activity photographs well.
6. **Wages into a bag with holes** (Haggai 1:4, 6, 9). Deferred maintenance is not a retained sum; it exits through channels nobody instruments — emergency rate, collateral damage, vacancy, concession, the good tenant who does not renew, management hours. The illusion survives because the saving is recorded in one place and the cost disperses across six others. Second edge, about **order** rather than amount: *"cieled houses"* is finish work chosen ahead of structure.
7. **Where no oxen are, the crib is clean** (Proverbs 14:4, 23). A low maintenance line is **AMBIGUOUS** — genuine efficiency and total neglect produce the identical number — so it is never read alone. The instrument is a paired reading: cost beside production, one page, same period.
8. **The repairer of the breach** (Isaiah 58:12, 7). The chapter attaches that name to Isaiah 58:7 — bread to the hungry, the cast-out brought into a house — not to competence. Strictly there is no such thing as maintaining property; there is keeping a roof over a person.

**The department's recurring shape, named a fifth time:** a wrong invisible from inside any single instance — the false weight, the lawful process that took Naboth's vineyard, attrition on a promise, the seating chart, and now the daub.

**No book-and-chapter is shared with any of the four sibling courses.** All nine here are fresh ground: Ecclesiastes 10, Exodus 31, Exodus 35, Ezekiel 13, 2 Kings 12, 1 Kings 6, Haggai 1, Proverbs 14, Isaiah 58.

## Measured, not asserted

- **79 quoted spans** verbatim from the repository's own KJV — **clean on the generator's FIRST run**, the first course in this department where that was true.
- **Every dimension measured across all eight lessons in one pass before anything was fixed.** ONE dimension failed: fullness (eight teen bands at 0.38–0.58, two senior at 0.56–0.60). Everything else passed first time — no collision, teen FK 3.0–3.9 against a 6.0 ceiling, senior 7.5–9.8 against 10.0, the ladder correct in all eight, and every anchor theme already carrying real prose.
- **Final:** teen 3.1–4.1, senior 7.7–9.5, every band ≥ 0.65 of the adult text, all three overlaps ≤ 0.24.
- **39 checks**, five of which prove the checks can fail.

## The instrument was wrong twice, in opposite directions

The measuring script I used to declare "all dimensions pass" disagreed with the gate **twice**, and both were caught by the gate rather than by the script — which is the wrong way round.

1. **It measured fewer dimensions than the gate.** The script checked only teen~senior overlap; the test checks teen~senior, teen~adult AND senior~adult. It reported "all dimensions pass" while two senior bands sat at 0.276 and 0.324 against a 0.25 ceiling.
2. **Then it measured the same dimension differently.** After adding the two missing overlaps, the script counted raw shingles while the gate strips quotations first — verbatim Scripture is shared between bands *by design*. That over-reported maint3 at 0.288 where the gate reads 0.10, and would have sent me to re-author two lessons that were fine.

Same class, third instance: the quiz-explain word count used a whitespace split where the gate counts word characters of our prose only, so the script passed a 9-word explain the gate rejected. **A measuring instrument that does not compute exactly what the gate computes is not a measurement — it is a second opinion with no standing.** All three now match the gate exactly.

Two senior bands (lesson 5 and lesson 8) were genuinely too close to their adult text and were re-authored to approach the same passage from a different angle rather than being reworded.

## What this course refuses to do

- **A slogan instead of an instrument.** "Deferred maintenance is a false economy" is true and useless alone. Lesson 6 names the actual downstream channels; lesson 7 gives the paired reading rather than telling anyone to spend more.
- **Moralising a real constraint.** Money IS finite. Lesson 1 raises that objection *in the text* and answers it with the blunt-iron verse.
- **Misreading 2 Kings 12 as "audits are faithless."** Lesson 4 states the limit before the application, and the test pins it — dropping the limit is what would make the lesson dangerous rather than merely wrong.

## The limit this course carries

Building codes, permits, trade licensing, habitability standards and contractor liability are jurisdiction specific and change — and nothing here qualifies anyone to perform work that requires a licensed trade. The care note and the tutor posture both say so, and the test pins both.

## Where it lives

`Learn → Real Estate → Maintenance, Repairs and the Trades`. **Five of twenty-two** courses in the department shipped.
