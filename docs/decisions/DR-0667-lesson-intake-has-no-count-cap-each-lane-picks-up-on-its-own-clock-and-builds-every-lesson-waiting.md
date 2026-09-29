---
id: DR-0667
title: Lesson intake has no count cap; each lane picks up on its own clock and builds every lesson waiting
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
Both lesson doors are Claude Routines. Until today each firing built a fixed number of lessons (in-app: "budget 3 per firing"; Gmail: "limit 10"). Darrell, 2026-09-29, verbatim, in order:

- *"I don't want pickups to be less than 4 hours... actually probably once a day..."*
- *"Raise it to 5 lessons per day?!!!!! Why have any cap?!!!!!!!!!!!!! Don't add constraints for nothing!!!!!! If I push through 1000 in a day get it done... period!!!!!!"*
- *"We do most lessons in the voice or recording or text... emails come during the day from 7 - 3 pm... we need the have it look at 11 am and 1pm and 3pm... make sense?"*
- *"Voice recordings are another lane!!!!!!! No limits!!!!!!!!!!!!!!!!!!!!!! Obviously!!!!!!!!"*

The once-a-day schedule was set first and replaced the same day; this record carries the final one.

## What was measured
Read with `get_trigger` on 2026-09-29 after the last edit:

| Lane | Routine id | cron | runs | enabled |
| --- | --- | --- | --- | --- |
| Email (Gmail) | `trig_01DAcB2dKRE5vuKAtT2NWbLw` | `CRON_TZ=America/Chicago 0 11,13,15 * * *` | 11:00, 13:00, 15:00 America/Chicago | true |
| In-app voice, recording, text | `trig_01KnByrzx8yYCURwfRKUrvTq` | `4 * * * *` | every hour at :04, around the clock | true |

**The measured limit:** a five-minute schedule for the in-app lane was refused by the platform with "the minimum interval is 1 hour". Hourly is the fastest a Routine can run. Both stored prompts say NO COUNT CAP: the in-app query has no `limit`, and the Gmail search pages until every result is seen.

## Impact
A cap made the owner's lessons wait in line behind a number no one asked for. Now each firing clears whatever is waiting. A heavy day means a larger run, carried by parallel agents. The email lane matches when email arrives (7 a.m. to 3 p.m.). The voice lane, where most lessons start, waits at most an hour. That hour is still a wait, which is why the next step below exists. Reversible: editing a Routine's prompt or cron restores a cap or a clock.

## Decision
Owner-directed, by Darrell:

1. **Two lanes, two clocks.** Email at 11:00, 13:00 and 15:00 America/Chicago. In-app voice, recording and text every hour at :04, the platform minimum.
2. **No count cap in either lane.** "budget 3 per firing" and "limit 10" are removed. Every waiting item is processed each firing and built in parallel, one agent and one PR per lesson. Lesson and DR numbers are assigned up front so they never collide.
3. **Tests.** Targeted tests while building; the full suite and lint once before pushing; CI still runs the full suite on every PR.
4. **Darrell's second account** `c2a6c39a-ae99-4ff7-83c6-b927e2e7f1cc` (his phone login) is his own, and its rows are captured without approval. Confirmed: *"Yes that's my number, build them all"*.
5. **Brakes that remain:** the lock is the `lesson-captured` tag (in-app) and `Label_22` (Gmail), written only after a push succeeds, so a crashed build is retried on a later firing. The kill is disabling the Routine.

This changes the three-brakes budget for this AI-class loop at the owner's direction, on the same footing as the 2026-07-29 amendment in CLAUDE.md (DR-0247, DR-0248). **Quality gates are unchanged:** every verse KJV verbatim from the corpus and pinned in a test, each pin proven-to-catch, provenance honest, full CI on every PR. Not decided here: member rows still need the Governor's `lesson-approved` (DR-0635), and the DR-0610 parallel run still ends only on Darrell's word.

## Rationale
The budget brake exists to stop a loop that spawns its own work. This loop does not create work: its size is exactly what the owner sent. The clock and the lock bound it, the kill stops it, and the gates guard quality, so a count cap only delayed his lessons.

## Verification
- `get_trigger` on both Routines reads the crons above, `enabled: true`, and NO COUNT CAP in the prompt (read 2026-09-29).
- Proven on first firings: every waiting row and thread captured and tagged, one PR per lesson.
- **Next step, buildable now (DR-0236):** an instant trigger that starts a lesson the moment a transcript lands (a `voice-transcript` row written to `agent_inbox`), instead of waiting for the hourly check. The hourly Routine stays as the fallback.
- `re-review: 2026-10-24` (with DR-0610): read a month of runs from `list_triggers`; note the largest day, its wall-clock time, any failed build left for retry, and whether the instant trigger has replaced the hourly wait.

## Links
DR-0312 (the inbox is a lesson door), DR-0608 (the in-app door), DR-0610 (both doors in parallel), DR-0611 (spoken lessons), DR-0635 (member lessons), DR-0236 (nothing waits), DR-0247 and DR-0248 (the 2026-07-29 amendment).
