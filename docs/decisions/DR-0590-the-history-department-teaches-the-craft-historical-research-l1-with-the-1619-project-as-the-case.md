# DR-0590 — The History department teaches the craft: Historical Research, Level 1, with the 1619 Project as the case — Word first, the record second, the debate named only to be educated past

- **Status:** accepted
- **Tier:** A (an additive Learn course on the existing History shelf; no schema, no transport, no money)
- **Type:** feature
- **Date:** 2026-09-23
- **Scope:** `app/src/lib/historical-research-course.js` (new — eight competencies, two bands each, 16 verified voices, a 47-entry timeline); `app/src/__tests__/historical-research-course.test.js` (new — 47 pins); `app/src/lib/learn-catalog.js` (the second History row); `app/src/lib/learn-crosslist.js` (the course also shelved under The Word & The Way); `app/src/lib/learn-plain-words.js`; `scripts/history-voices-witness.mjs` + `.github/workflows/history-voices-witness.yml` (the new file's voices are probed on the runner); the three course baselines (`course-band-coverage-baseline.json` 358→366, `stage-reaches-reader-baseline.json` 547→555, `course-quotation-integrity-baseline.json` 547→555) and the two count pins that read them
- **Principles:** WORD-FIRST (DR-0097), TEACH-THE-WORD-DONT-DEBATE-IT (DR-0098), SPEAK-ESTABLISHED-FACT (DR-0100), VERIFICATION-DOCTRINE (DR-0076), YAHWEH-IN-OUR-VOICE (DR-0210), THE-STANDARD-BEFORE-THE-STORY (DR-0572)
- **Grounds:** Darrell 2026-09-23: *"Let's use the 1619 project as a history or historical research 1 level competencies based on those professors work"*; *"Word first research and then Lessons as our Ways and documentation mandated"*; *"Hannah-Jones and teamwork of journalism and journalists who put their skills into comprehensive education of history based on the evidence"*. DR-0572 opened the department on the standard; this record is the second course, the craft.

## Context

The History department had one course, `history-truth` (DR-0572): the standard a reader holds before any story. It had nothing that taught the reader to DO research — to go to the record, to require two witnesses, to separate a fact from an interpretation, to weigh a party's own account, to read a correction, to know which questions the Word has already settled, and to write it down in order with sources. Darrell asked for exactly that, at level 1, with the 1619 Project as the working case: the magazine project of August 2019, the five historians' letter of December 2019 (Bynum, McPherson, Oakes, Wilentz, Wood), the editor's reply of December 20, 2019, the fact-checker's account (Leslie M. Harris, Politico, March 6, 2020), the editor's note of March 11, 2020 that revised one sentence to "some of the colonists", the Pulitzer of May 2020, and the book of November 2021. He asked that the Word come first and that the journalists' teamwork be credited as evidence-based work, not dismissed.

The premise conflict was named before building: a course on a live public controversy could easily become the both-sides-for-ratings posture DR-0098 forbids. The design answer was to teach the CRAFT with the controversy as the specimen — every lesson opens on a KJV passage that gives the competency its warrant, every historical claim carries a dated document, and the one open question (how far, and for whom, the protection of slavery moved the colonists toward independence) is named as genuinely open at its edges while everything the record settles is stated plainly.

## What was measured

| what | measured |
| --- | --- |
| competencies (lessons) | 8, each with a big idea, an anchor passage, two stories, five benefits, a facilitator note, two quiz items |
| words across lesson + teen band + senior band | 11,611 |
| quoted Scripture spans, all `"..." (Book c:v)`, all KJV verbatim | 161 spans, 0 faults (scratch `verses.mjs` walk) |
| distinct Scripture anchors | 32 |
| reading bands | teen ≤ 6.0 FK and senior ≤ 10.0 on every lesson; teen < senior; each band ≥ 0.6 of its lesson's words; 8-word shingle overlap ≤ 0.25 |
| verified outside voices | 16 (2 per lesson), 11 distinct URLs on `HISTORY_SOURCE_HOSTS`, each ≥ 8 words, no elision, no verse tag |
| source verification | every voice URL and phrase probed on a GitHub runner: `history-voices-witness` runs 35928051751 and 35928368190; four candidate pages that answered 404 or were index pages were NOT used |
| timeline | 47 dated entries, ascending 1526 → 2021; every four-digit year in prose is on the timeline and every timeline year is in prose (zero faults both directions) |
| both-sides theatre | 0 hits for "some historians say", "you decide", "contested"; "genuinely open" appears only beside motive / how far / for whom / edges / colonists, never beside "whether slavery was wrong" |
| credit | Hannah-Jones and the journalists named together in 5 of 8 lessons and in the catalog blurb; lesson 7 names "skill in the service of education" |
| gates on the new file | 47 pins in `historical-research-course.test.js`; the shared suites (crosslist 48/704, band coverage 366, stage-reaches-reader 555, quotation integrity 555, history-course, curriculum-diversity, learn-organize) all green; lint 0 warnings; `verify:gates`, legibility and tenancy PASS |

## Impact

Without this course the department teaches the standard and stops; a reader who meets the 1619 debate meets it as a fight between camps. With it the reader has eight repeatable moves and a worked case, and the one live question is bounded to its real edges rather than smeared across the whole subject (DR-0100 tier 2). The cost is a second row on the History shelf, three baselines moved by exactly the eight new lessons, and one more file in the witness workflow's path list; nothing existing changes shape.

## Decision

1. `historical-research-1619` ships as the second History course, after `history-truth`, and is cross-shelved under The Word & The Way (32 measured anchors).
2. Every competency is Word-first: the anchor passage is the warrant, quoted verbatim from the KJV with "the LORD" untouched inside quotes and "Yahweh" in our voice (DR-0210).
3. The 1619 Project is the case, not the enemy: its documented strengths (the team, the records, the reach) and its documented corrections are both on the record with dates; the journalists' work is credited as evidence-based work.
4. The debate is named to be educated past by the Word and the documents (DR-0098); what the Word settles (slavery as man-stealing, Exodus 21:16; one blood, Acts 17:26; Matthew 25:40) is taught as settled and is not a research question.
5. The new file rides the existing history gates (voices, timeline, bands, quotation integrity, band coverage) and its voices are probed on the runner whenever the file changes.

## Verification

- `npx vitest run src/__tests__/historical-research-course.test.js` — 47/47; the proven-to-catch pins fail on a dropped verse tag, an elided voice, a year missing from the timeline and a both-sides phrase.
- The affected shared suites: 189 tests green in one run alongside the new file.
- Voices: `history-voices-witness` probe runs 35928051751 and 35928368190 (every URL 200 and every phrase found); the file's own header cites the run.
- After merge: the course is read at Church → Learn → History → second course on the live build; DR-0104 live review is the standing next step (site-health run, then a walk of lesson 1 and lesson 7 on a phone width).
- re-review: 2026-10-21 — measure whether any reader opened lesson 7 (the Word settles) from the shelf, and whether the crosslist row draws readers from The Word & The Way.
