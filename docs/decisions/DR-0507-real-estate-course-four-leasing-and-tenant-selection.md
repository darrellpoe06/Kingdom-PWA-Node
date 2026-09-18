# DR-0507 — Real Estate course four: Leasing and Tenant Selection

- **Status:** accepted
- **Tier:** B (content the whole school serves)
- **Type:** content
- **Date:** 2026-09-18
- **Scope:** `app/src/lib/leasing-tenants-course.js` (new, 8 lessons × 3 texts, 60 verbatim spans), `app/src/lib/learn-catalog.js` (the row), `app/src/lib/course-band-coverage-baseline.json` (237 → 245), `app/src/__tests__/leasing-tenants-course.test.js` (new, 39 checks), `app/src/__tests__/learn-crosslist.test.js` (32/563 → 33/571) + `course-band-coverage.test.js` (total pin), `app/src/__tests__/buying-terms-course.test.js` + `management-stewardship-course.test.js` + `property-principle-course.test.js` (the elision check's semantics fixed in all three)
- **Principles:** WORD-FIRST (DR-0098), TEACH-DO-NOT-DEBATE (DR-0098), EVERY-BAND-IS-THE-WHOLE-MESSAGE (DR-0418 / DR-0498), VERIFICATION-DOCTRINE (DR-0076 §1 §3 §4 §5), NO-ELISION-IN-A-QUOTATION (DR-0459), YAHWEH-IN-OUR-VOICE (DR-0210), NOTHING-WAITS (DR-0236)
- **Grounds:** DR-0500 (the footing), DR-0501 (the capstone), DR-0504 (the transaction), Darrell's instruction: *"Real-estate first then keep closing the gap!!!!!!!"*

## Where it sits

Courses one through three covered the ground, the stewardship and the deal. This is the first course in the department with a **person** on the other side of the transaction — who you let in, how you decide, what the paper says, and what happens when it goes wrong.

## The arc, one argument in eight moves

1. **Ye know the heart of a stranger.** A tenant occupies the position Scripture calls the stranger — present in a place, dependent on it, without the standing of those already there. Yahweh commands that position with a reason attached to **memory**: *"Also thou shalt not oppress a stranger: for ye know the heart of a stranger, seeing ye were strangers in the land of Egypt"* (Exodus 23:9). And He puts His own conduct in the frame: He *"loveth the stranger, in giving him food and raiment"* (Deuteronomy 10:18) — provision, not sentiment. Made operational as **information asymmetry**: what you know and they need, you tell.
2. **The gold ring and the vile raiment.** James stages what is functionally a showing (James 2:2) and the seating follows the clothing (2:3) — and the verdict lands on the **assessment**, not the sentence spoken: *"Are ye not then partial in yourselves, and are become judges of evil thoughts?"* (James 2:4). The Word does not leave it at unwise: *"if ye have respect to persons, ye commit sin, and are convinced of the law as transgressors"* (James 2:9). The standard is judicial — *"ye shall hear the small as well as the great"* (Deuteronomy 1:17) — and the instrument is **written criteria, in order, before the showing**, plus the honest second list of every reaction that was not on it.
3. **He that answereth a matter before he heareth it** (Proverbs 18:13) — folly **and** shame, two costs — and the structural reason one account is never enough: *"He that is first in his own cause seemeth just; but his neighbour cometh and searcheth him"* (Proverbs 18:17). **This is the lesson that keeps the course honest:** screening on the facts is the diligence commanded here; deciding by appearance is the sin lesson 2 names. Both edges taught, neither staged as a debate for the reader to settle (DR-0098).
4. **Read the covenant in their hearing.** At the founding, the terms were read aloud and the assent came afterward, in their own words (Exodus 24:7) — and it had already been taken once before the book existed (Exodus 24:3). **The assent was taken twice, and the second time after a reading.** A signature evidences assent; it does not create understanding. Five clauses read aloud, then stated back.
5. **Wherein shall he sleep?** Yahweh permits the pledge and puts a clock on holding it (Exodus 22:26), gives the reason as a question about the man's night, and names whose cry He hears (22:27). A security deposit **is** a pledge: held separately, returned on the clock, every deduction itemised and evidenced.
6. **Every man under his own vine** (Micah 4:4) — and **none shall make them afraid**, which includes you. Fear is the measure. The honest limit is stated so this is not sentiment: no landlord can give a renter a vineyard; what he can do is ensure nothing about **him** is the thing they are afraid of.
7. **Go and tell him between thee and him alone** (Matthew 18:15) — you move, privately, first; escalation is in steps; the aim is stated in the instruction (**gained**, not defeated). Paul supplies the posture: *"in the spirit of meekness; considering thyself"* (Galatians 6:1). The trade characteristically inverts this order.
8. **As much as lieth in you** (Romans 12:18). Two limits before the ask, and none on the scope. The boundary cuts both ways: no carrying blame for what another person chose, and no treating their conduct as a release from yours. And the real failure is erosion, not a decision: *"let us not be weary in well doing"* (Galatians 6:9). Every one of the seven lessons before it lies entirely within the steward's own hand.

**The recurring shape, now named across four courses:** a wrong invisible from inside any single instance. The false weight, the lawful process that took Naboth's vineyard, attrition on a promise — and now the seating chart, where no single seating is a crime and the pattern is the sin.

**No book-and-chapter is shared with any of the three sibling courses**, checked against their own reference lists rather than trusted.

## Measured, not asserted

- **60 quoted spans** fetched verbatim from the repository's own KJV; the generator refused to emit until every one matched.
- **Every band dimension measured across all eight lessons in ONE pass** before anything was fixed — the lesson learned the hard way on the capstone, where three anchor failures were fixed one at a time over three runs. One pass found three failing dimensions: every teen band at 0.42–0.49 against the 0.6 floor, four senior bands over grade 10 (10.4–10.8), and three anchor themes at 7, 8 and 9 words of our own prose. All three closed in a single fix round.
- **Final:** teen 2.5–3.9, senior 6.2–10.0, teen below senior in all eight, every band ≥ 0.61 of the adult text, band overlap 0.029–0.085 against a 0.25 ceiling.
- **39 checks** in the course's own test, including five that prove the checks can fail.

## Four defects this course found in our own instruments

1. **The elision check false-blocked a correct lesson.** DR-0459 forbids an ellipsis **inside** a quotation; it permits one in our own prose between two quotations. The regex `"[^"]*(\.\.\.|…)[^"]*"` runs from one closing quote to the next **opening** one, so it flagged *our* prose and refused to generate the course. **It was the checker, not the lesson.** Fixed to test each quoted span alone — in the generator and in all three shipped course tests — and **proven to still catch a real elision in both the ASCII and the Unicode form** before being trusted.
2. **Our own file header claimed three verses the lessons never quoted.** The header named James 2:9, Exodus 24:3 and Galatians 6:9 in the arc while no lesson body carried any of them — a claim without evidence (DR-0076 §1) in our own documentation, caught by the course test rather than by reading. Each genuinely sharpened the lesson it belonged to, so the honest fix was the stronger one: all three were added through the same verbatim gate.
3. **A silent dict overwrite made a measurement go backwards.** A second `EXTRA[(id, band)] = ...` replaced the first, and lesson 8's teen fullness fell from 0.58 to **0.54** after an extension was *added*. Python gives no warning. The generator now reads its own input as text and **refuses** a repeated `=` assignment — proven by restoring the defect and watching it fail.
4. **Six assertions written from what I meant instead of what the text says.** Every one failed on correct content: `he read in the audience` against a text reading `and read in the audience`, `self-blame` against `carrying blame for what another person chose`, and a Deuteronomy 10:17 span the course never quotes. Same class as the `/[Ii]naction/` and `/two witnesses/` misses on the two courses before this. Recorded in the test header because **a check that fails on correct content is a check that will pass on wrong content.**

## And a stale exhaustive pin, for the third time

`buying-terms-course.test.js` pinned the Real Estate shelf at exactly three keys and broke the moment course four landed — the same defect the capstone's pin had, **written a second time after already being fixed once.** Both now assert the property being guarded (one shelf, this course on it, with the siblings) instead of a census that must be edited every time the department grows. Recorded as a repeat because the recurrence is the finding.

## The limit this course carries

Fair-housing duties, screening criteria, denial procedure, deposit limits, entry notice and eviction are state specific, they change, and getting them wrong is actionable. The care note and the tutor posture both say so, and the tutor is instructed never to stage diligence and partiality as a debate for the learner to settle.

## Where it lives

`Learn → Real Estate → Leasing and Tenant Selection`. Four of twenty-two courses in the department now shipped. The gap Darrell named — *"keep closing the gap"* — continues from here.
