# DR-1386: Credit where it is due — READ on evidence at a pace with grace, an exam's taking kept apart from its grading, UNDERSTOOD as the main goal, and every line an evaluation, never a condemnation

**Date:** 2026-11-10
**Status:** Accepted (narrows DR-1384)
**Tier:** A (what a reading and an exam are credited as; device-side; no schema, no money)
**Type:** surface + record + measure
**Area:** Learn space (ChurchLearn, lib/test-integrity.js, lib/pace-understanding.js, MyPaces, LearnersPanel)
**Sent in by:** Darrell — a run of messages, 2026-11-10
**Pairs with:** DR-1384 (narrowed here), DR-1293 (the two witnesses), DR-0076 §4 (measure, don't claim), DR-0754 (the class record), COMMUNITY-FIRST-MISSION Commitment 2 (elderly and non-technical readers by default)

## Context

His words, in order: "Not seeing any part... taking the test... and some kpi's that fit noticing when a human roll a test... We want to give credit where it is due... not anything..."; of DR-1384, "is there a better way?"; "Listening or reading at a pace based on words and processing the information... grace and mercy given... also data driven... with test taken or not is reading... test taking and grading are separate and both should mean more... rereading is also respected... reading and comprehension as the main goal"; "Best Practices for our ministry"; "Mission"; "Give the reader their reader vs reading paces... if they are measuring accurately... and users want that"; "Can we see if we improve or reduce our comprehension based on the speed of the data being consumed?"; "No Condemnation.. evaluation... for an experience to see ourselves in the Way He does".

## What was measured

- DR-1384 let a passed exam or Done finish a reading with nothing seen, and a flick to the bottom set `seen` to 1 at once (jsdom and a fast scroll alike): a reading could be credited with no reading.
- The cloud ledger (0313 trigger) keeps `{at, pct, passed, band}` per attempt and `completed_at` per lesson, which Done also writes. It cannot hold how an attempt was taken without a migration.

## Impact

**What this obligates.** A reading is credited only on evidence, so the Lessons read count and every completion rate now mean what they say; a learner who passed or pressed Done without reading keeps the score and the mark, and the reading waits for the reading. Device-side only; the cloud record gains the finer evidence only through the schema follow-up named below.

## Decision

1. **READ is credited on evidence.** Seen or heard to `READ_FLOOR` (0.9), or a finish by the reader, deck or end door. Done stays the learner's own mark; a passed exam stays a score. Neither finishes a reading on its own (`finishRead` requires `hasReadEvidence`).
2. **Seen at a pace, with grace.** `pacedSeen` credits words no faster than `GRACE_WPM` 600 from where the reading began: about two and a half times the measured adult silent-reading mean of 238 words a minute for non-fiction (Brysbaert, 2019, a meta-analysis of 190 studies). A ceiling on credit, never a floor; a slow reader is never held back. Hearing is paced by the reader's own voice.
3. **Rereading is respected.** Unchanged and confirmed: `finishes` and per-version counts ratchet, and a new reading of a finished lesson measures its witnesses afresh.
4. **Taking kept apart from grading.** Each attempt carries how it was taken: `after` / `partly` / `before` reading, seconds a question, quick (under 5 s a question), first try, and the paces it was read at. The score is always kept.
5. **The line under the score is an evaluation, never a condemnation.** It says what happened, that the score is kept, that tries are unlimited; it never scolds (gated against a word list).
6. **KPIs on the learner card** (`TakenAndGraded`, from the cloud ledger): Understood (on record and passed after it — the main goal), Taken after the lesson, Passed before the lesson, Retakes within a minute, Tries to first pass.
7. **Paces, opt-in** (`MyPaces`, off until turned on): the eyes' pace (words over time between rises, a pause counted to 60 s, shown only once measured on 150 words over 30 s; "beyond grace" when held at the ceiling) beside the reader's measured pace; and **pace and understanding**: first tries only, banded by pace, speaking only when two bands hold 3 first tries each, otherwise saying how many it still needs.

## Honest limits

- On the cloud card, "on the record" is `completed_at`, which Done also writes; the device holds the finer evidence. Carrying per-attempt evidence (reading reached, seconds a question, pace) to the cloud was built the same day on the NAS database (DR-1396, migration 0316); the `agent_inbox` row `474cfe54-0ac1-4c37-ba4c-a325492f034d` went to the hosted mirror, not the live database.
- Paces and the pace-and-understanding view are this device's only. Brain measurement (his prefrontal-cortex ask) and devices when available are filed as `agent_inbox` row `ced55234-1089-463f-bab7-9912fb16b469` (on the hosted mirror, DR-1396); the app measures behaviour, not the brain, and says so.

## Verification

- `read-is-credited-on-evidence.test.jsx` (7, renamed from DR-1384's gate): Done with nothing seen keeps the mark and files no reading; seen or heard to the floor finishes with its version; a flick is not credited; an exam passed before reading keeps the score, says so, is quick, credits no reading; after reading reads 100%. Proven to catch: un-Done and half seen finish nothing.
- `test-integrity.test.js` (6) and `pace-understanding.test.js` (8): floor, pace with grace, taking vs grading, the KPIs, the finding threshold; proven to catch a pass before reading counted as understood, and retakes or unmeasured tries making a finding.
- `learners-panel.test.jsx` +2: the five figures from real rows; no attempts, no figures; no word of condemnation.
