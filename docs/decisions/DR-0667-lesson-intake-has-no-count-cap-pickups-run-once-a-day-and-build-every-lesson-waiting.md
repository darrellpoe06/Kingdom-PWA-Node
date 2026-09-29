---
id: DR-0667
title: Lesson intake has no count cap; pickups run once a day and build every lesson waiting
date: 2026-09-29
status: accepted
supersedes: []
superseded-by: null
tier: n/a
entities: [poetech]
grounds: [THREE-BRAKES, DRIVE-DONT-DELEGATE, VERIFICATION-DOCTRINE, WORD-FIRST, DECISION-RECORDS]
source: Darrell, 2026-09-29, in the session that runs both lesson Routines; amends the budget named in DR-0610 and the DR-0312 Way
---

## Context
Both lesson doors are Claude Routines. Until today each firing built a fixed number of lessons (in-app: "budget 3 per firing"; Gmail: "limit 10"), on a sub-daily clock. Darrell, 2026-09-29, verbatim:

- *"I don't want pickups to be less than 4 hours... actually probably once a day..."*
- *"Raise it to 5 lessons per day?!!!!! Why have any cap?!!!!!!!!!!!!! Don't add constraints for nothing!!!!!! If I push through 1000 in a day get it done... period!!!!!!"*

## What was measured
Read with `get_trigger` on 2026-09-29, after the edit:

| Routine | id | schedule | enabled |
| --- | --- | --- | --- |
| In-app lesson intake | `trig_01KnByrzx8yYCURwfRKUrvTq` | `CRON_TZ=America/Chicago 18 4 * * *` (daily 04:18) | true |
| Gmail lesson intake | `trig_01DAcB2dKRE5vuKAtT2NWbLw` | `CRON_TZ=America/Chicago 48 4 * * *` (daily 04:48) | true |

Both stored prompts now say NO COUNT CAP: the in-app query has no `limit`, and the Gmail search pages until every result is seen. Both prompts name the lock and the kill as the brakes that remain.

## Impact
A cap made the owner's lessons wait in line behind a number no one had asked for; a week of lessons could take days to drain. Removing it means one daily firing clears whatever is waiting, however many that is. The cost is a larger single run on a heavy day, carried by parallel agents rather than by a queue. Reversible: editing the Routine prompt restores a cap.

## Decision
Owner-directed, by Darrell:

1. **Pickups run once a day.** In-app at 04:18 America/Chicago, Gmail at 04:48 America/Chicago.
2. **No count cap.** "budget 3 per firing" and "limit 10" are removed. Every waiting item is processed each firing, built in parallel: one agent and one PR per lesson, lesson and DR numbers assigned up front so they never collide.
3. **Tests.** Targeted tests while building; the full suite and lint once before pushing; CI still runs the full suite on every PR.
4. **Darrell's second account** `c2a6c39a-ae99-4ff7-83c6-b927e2e7f1cc` (his phone login) is his own and is captured without approval. Confirmed: *"Yes that's my number, build them all"*.
5. **Brakes that remain:** the lock is the `lesson-captured` tag (in-app) and `Label_22` (Gmail), written only after a push succeeds, so a crashed build is retried the next day; the kill is disabling the Routine.

This changes the three-brakes budget for this AI-class loop at the owner's direction, on the same footing as the 2026-07-29 amendment in CLAUDE.md (DR-0247, DR-0248). **Quality gates are unchanged:** every verse KJV verbatim from the corpus and pinned in a test, each pin proven-to-catch, provenance honest, full CI on every PR. Not decided here: member rows still need the Governor's `lesson-approved` (DR-0635), and the parallel run of DR-0610 still ends only on Darrell's word.

## Rationale
The budget brake exists to stop a runaway loop that spawns work on its own. This loop does not create its own work: its size is exactly what the owner sent. The daily clock and the lock bound it, the kill stops it, and the gates guard quality, so a count cap only delayed his lessons.

## Verification
- `get_trigger` on both Routines reads the schedules above, `enabled: true`, and NO COUNT CAP in the prompt (read 2026-09-29).
- First daily firings, 2026-09-29 04:18 and 04:48 America/Chicago: every waiting row and thread is captured and tagged, one PR per lesson.
- `re-review: 2026-10-24` (with DR-0610): read a month of runs from `list_triggers`; note the largest day, its wall-clock time, and any failed build left for retry.

## Links
DR-0312 (the inbox is a lesson door), DR-0608 (the in-app door), DR-0610 (both doors in parallel), DR-0611 (spoken lessons), DR-0635 (member lessons), DR-0247 and DR-0248 (the 2026-07-29 amendment).
