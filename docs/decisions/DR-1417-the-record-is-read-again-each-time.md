# DR-1417: The record is read again each time it is opened, and says when it was read

**Date:** 2026-11-10
**Status:** Accepted
**Tier:** A (more reads of a table the learner may already read; no schema, no write path changed)
**Type:** bug fix
**Area:** `app/src/lib/learner-records-sync.js` (`subscribeLearnerRecords`, freshness), `app/src/lib/use-learner-records.js`, `app/src/components/RecordFreshness.jsx`, `LearnersPanel.jsx`
**Sent in by:** Darrell, 2026-11-10: "Are the latest numbers always available when clicked on record? If not fix it... latest numbers always... Synced... with latest reading data... make sure... each time... if needed... triggers for whatever"
**Pairs with:** DR-0754 (the record leaves the device), DR-0076 §8 (unknown is never green), DR-0255 (events before timers)

## The answer to his question: no

- **SHOULD:** the Record shows the latest numbers whenever it is opened.
- **ARE (read from the code):** the record was read once at sign-in, and again only when a realtime change arrived. Opening the Record read nothing. Coming back to the app read nothing. This device's own save was seen only if the realtime socket delivered it, and that socket is not proven on the sovereign road.
- **A second defect found on the way:** a read that failed handed the screen an empty list, so a dropped connection drew a learner with no record.

## Decision

- **Read again on every real moment, none of them a timer:** the Record appearing, its section being opened, the Refresh button, this device's own save landing, the app coming back to the front, the window taking focus, the network returning, and the realtime change as before.
- **A failed read keeps what is on the screen** and says "Could not reach the record just now", with the time the figures shown were read.
- **The record says when it was read:** "Latest figures, read from the record at 6:24:05 PM". Before the first read lands it says it is reading, never a time.
- **Bounded:** one read in flight, at most one waiting, never closer than 1.5 seconds, so a burst of events is one read. A read that changes nothing no longer rewrites the device's state.

## Verification

`the-record-is-read-again-each-time.test.jsx`, 9 cases, **proven to catch:** asked again it reads again and hands over the new rows; focus, network and visibility each read; a failed read hands over nothing and keeps the last read time; ten asks at once are two reads at most; the gap is kept; nothing is read after unsubscribe; unknown is never drawn as fresh; the panel asks on appearing, on its section opening (not on closing), and on Refresh. The 32 existing sync and hook tests pass unchanged.

## Not done, and why

- **Reading in progress is not on the record.** How far a lesson has been read lives on the device until the lesson is finished or its exam is taken; another device does not see a half-read lesson. Putting it on the record is a schema change. `re-review: 2026-11-17`.
- **Not observed on the live site;** the sandbox has no route to it. `re-review: 2026-11-12`, on Darrell's next look at the Record.
