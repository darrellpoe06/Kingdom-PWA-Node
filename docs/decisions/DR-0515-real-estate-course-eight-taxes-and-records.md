# DR-0515 — Real Estate course eight: Taxes and Records: What You Owe and What You Can Show

- **Status:** accepted
- **Tier:** B (content the whole school serves)
- **Type:** content
- **Date:** 2026-09-18
- **Scope:** `app/src/lib/taxes-records-course.js` (new, 8 lessons × 3 texts), `app/src/lib/learn-catalog.js` (the row), `course-band-coverage-baseline.json` (269 → 277), `stage-reaches-reader-baseline.json` (lessons 446 → 454, total stays 0), `course-quotation-integrity-baseline.json` (446 → 454 lessons, every other number unchanged), `app/src/__tests__/taxes-records-course.test.js` (new, 41 checks), `learn-crosslist.test.js` + `course-band-coverage.test.js` (pins moved)
- **Principles:** WORD-FIRST (DR-0098), SPEAK-ESTABLISHED-FACT (DR-0100), EVERY-BAND-IS-THE-WHOLE-MESSAGE (DR-0418 / DR-0498), EVERY-STAGE-REACHES-THE-READER (DR-0509), VERIFICATION-DOCTRINE (DR-0076 §1 §3 §4), NO-ELISION-IN-A-QUOTATION (DR-0459), YAHWEH-IN-OUR-VOICE (DR-0210)
- **Grounds:** DR-0500 through DR-0513 (the seven before it), Darrell's instruction: *"Real-estate first then keep closing the gap!!!!!!!"*

## Where it sits

Seven courses covered the ground, the stewardship, the transaction, the tenant, the building, the partner and the lender. This one covers the two things that outlast all of them: **what the authorities take, and what you can prove.**

## The arc

1. **Render unto Caesar.** He calls for the coin and asks one question about its markings — *"Whose is this image and superscription?"* (22:20) — and the answer names **two** claims in one breath. The logic of the mark then turns the question on the man holding the coin.
2. **Then are the children free.** He establishes He is not liable and pays anyway. *"Notwithstanding, lest we should offend them"* (17:27). Being right and insisting are two separate decisions.
3. **All the world should be taxed.** The mechanism is the lesson: *"every one into his own city"* (2:3) is what took a man of David's line to Bethlehem. A filing requirement, operated by people with no interest in prophecy.
4. **The rich shall not give more.** Three properties almost no modern assessment has: fixed and knowable, equal in **both** directions, and a use named where the obligation is named.
5. **He will take the tenth.** An itemised schedule read aloud before consent — and the crying came anyway. Hearing a cost and having accounted for one are different states.
6. **They sought their register.** Accused of nothing, and put from the priesthood, because the record could not be produced.
7. **The principal and the fifth part.** How you fix what you found yourself, at a price, paid to the person rather than to a cause.
8. **Will a man rob God.** The one account with no examiner — and they asked *"Wherein have we robbed thee?"* sincerely.

**Why lesson 8 is last, structurally rather than sentimentally:** the first seven obligations all carry an **external instrument of measurement** — a notice, a bill, an amortisation schedule, someone who asks to see the document. The eighth has none. The course is built so that lands after seven sessions of measuring everything else.

**No book-and-chapter is shared with any of the seven siblings**, checked against their own exported lists: Matthew 22, Matthew 17, Luke 2, Exodus 30, 1 Samuel 8, Ezra 2, Leviticus 6, Malachi 3.

## Three places it refuses to overreach (DR-0098 / DR-0100)

**Lesson 4 is not tax policy.** A census offering with an atonement purpose is not a revenue platform; a modern state cannot run on a flat half-shekel, and progressive rates are not condemned by that text. The lesson says so in its own body. What it gives is a standard of evaluation better than the rate alone.

**Lesson 5 does not scold a reader for burdens he never chose.** Israel consented with full disclosure; a reassessment two years into ownership is a different situation with a different remedy. The schedule gets a second column.

**Lesson 8 refuses both abuses of Malachi 3:10 by name** — the investment-contract reading and the withhold-because-others-abused-it reading.

## Measured, not asserted

**137 quoted spans**, every one verified character-for-character against the repo's own KJV before the module was emitted.

Every band dimension passed: teen **2.8–4.6**, senior **7.4–9.9**, fullness **0.68–0.83**, teen-to-senior overlap **0.000–0.024**, at most **0.190** against the adult text. Six benefits and two stories per lesson from the first commit, so the Send-off baseline gained eight lessons with its total still at **zero**.

## What the gates caught in my own work

**Seven spans had dropped a possessive apostrophe** — `Caesar's`, `God's`, `their father's house` — because I was avoiding a straight quote inside a JS string. A quotation missing an apostrophe is **not verbatim**, and the generator refused to emit. The fix is the typographic apostrophe the generator normalises, not a shorter span. Pinned in the course test as the defect this course actually shipped in draft.

**One senior band recited a decision-record ID at a reader** — `(DR-0098)` in lesson 8. The elision/recitation ratchet built earlier tonight (DR-0512) caught it in a brand-new course, which is the ratchet doing exactly what it is for: a learner should meet the teaching, not the file name of the record that produced it. Replaced with the teaching itself rather than recorded as debt.

**Three benefits were mostly quotation.** Strip the verse and only 8–15 words of our own prose remained, against a floor of more than 12. That floor exists precisely to catch a "benefit" that is a verse with a few words around it, because such a line tells the reader nothing he can do. Each gained real substance; the floor was not lowered.

**One overlap shipped at the edge and was not left there.** Lesson 6's senior-to-adult overlap measured **0.249** against a 0.25 ceiling — passing, and far too close, since any later edit to either text would break the build for a reason nobody would connect to this session. Four near-duplicate passages were re-authored in genuinely different words rather than trimmed, because trimming would have cost the band its fullness. It now measures **0.147**.

## Where the department stands

**Eight of twenty-two.** Fourteen remain — insurance and risk, inspections, evictions handled righteously, development, appraisal, and the rest. **re-review: 2026-09-25.**
