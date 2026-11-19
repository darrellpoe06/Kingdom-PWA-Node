# DR-1577: A record is one person's

**Date:** 2026-11-19
**Status:** Accepted
**Tier:** A for the code (it stops false rows being written; no schema, no row changed). The cleanup of rows already written is NOT in this record's change and waits for Darrell's word (below).
**Type:** decision
**Area:** `app/src/lib/snapshot-sync.js`, `app/src/lib/learner-records.js`, `app/src/lib/use-learner-records.js`, `app/src/__tests__/a-record-is-one-persons.test.js`
**Sent in by:** Darrell, 2026-11-19, with two screenshots of his wife's learner record: *"My wife doesn't read lessons... what or where does these numbers come from?"* then *"It's should be based on the users... It's her record!!!! It's a drop down...."* and *"Household is also a record"*.
**Pairs with:** DR-0754 (the learner record), DR-1450 (the catch-up filing), DR-1406 (pace and depth left the household snapshot for the same reason), DR-0060 (rows are owned by the account that writes them), DR-0076, DR-0061

## Context

Her record read 143 lessons, 91 exams taken and passed, 110 attempts. The second screenshot showed 140 of them under "Not placed in a course", an average of 100%, and "Understood at 100%: 1 of 969". She does not read lessons.

## What was measured

- **Two screenshots and the code; the live rows were not read.** The hosted project returns no rows for `learner_lesson_records` (the app reads the NAS's own database, DR-0310), and that database is not reachable from the build sandbox. Everything below is traced in code and matched to what the screen showed.
- **A person's reading rode the household's shared row.** What was read (`classProgress`) and how each exam went (`classQuiz`) live in the app's data object. `buildSnapshotPayload` pushes that object to `family_snapshots`, one row per household, last write wins, pulled at sign-in. Neither key was on its exclusion lists. So one member's reading arrived on every member's device.
- **The catch-up then filed it under whoever was signed in.** DR-1450 (2026-11-12) files, after every read of the record, what the device holds that the account's rows lack: 25 a read, each lesson once a minute, with a course named only when known. On her device that is the household's reading, filed under her account, with no course. That is the 140, and it is why no reading evidence stands behind them.
- **The Governor's device had a second road in.** The record read returns every learner's rows for the Governor, and `mergeRecordsIntoState` merged all of them into his own device maps with no filter on whose they were.
- **DR-1406 found the same shape nine days ago** for pace and depth and fixed those two keys only.

## Impact

A member's record states reading and exam scores they never did, and it grows each time their app is open. The Governor's record and the household's totals are inflated the same way, to a degree not measured here. A surface whose whole value is trust was showing numbers that are not real (DR-0061).

## Decision

1. **A person's reading never rides the household snapshot.** `PERSONAL_RECORD_KEYS` (`classProgress`, `classQuiz`, `classMine`, `classOwner`) are never pushed, and an incoming snapshot that still carries them never lands them. A person's reading crosses devices by their own rows and by no other road.
2. **The catch-up files only what this account did on this device.** Marking a lesson read or answering an exam notes the lesson under the account's own id (`classMine`). `deviceFactsMissingFromRecord` takes that set and files nothing outside it. DR-1450's purpose is kept for everything done from here on; a save lost to a stall BEFORE this change is not recoverable by the catch-up, because nothing says whose it was.
3. **The device holds one person's record.** Only the signed-in account's own rows enter the device maps. The first time an account is seen on a device, the maps are rebuilt from its own rows plus what it did there (`deviceStateForAccount`); the device's copy still wins on a lesson the account's own rows name.
4. **The household is a record too, and it is the sum of its people.** Nothing here changes the household totals' arithmetic; they become true once each person's rows are.

**Not done here, and Darrell's to decide:** removing the false rows already written. Recommended rule, provable from the rows themselves: a row whose `completed_at` or `quiz_at` is identical to the millisecond to another account's row for the same lesson is a copy, and the later-written one is removed. `re-review: 2026-11-21`.

## Verification

`a-record-is-one-persons.test.js`, 11 cases: the four keys are never pushed and never landed; the plain merge is shown to be how his reading reached her device; without the rule his three lessons are filed under her with no course, and with it nothing is; what she did herself is still filed; the rebuild keeps her own and drops his; merging every row the Governor may read is shown to put another learner's lesson in his maps; the hook is pinned to pass only its own rows and its own made-here set. The record and snapshot suites pass beside it (44 files, 484 tests), including DR-1450's and DR-1406's own. eslint clean. **Not verified:** the live rows, and the behaviour on her phone. After merge: read her rows through the live database road and look at her record on the device.
