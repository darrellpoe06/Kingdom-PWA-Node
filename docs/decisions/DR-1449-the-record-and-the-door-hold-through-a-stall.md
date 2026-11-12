# DR-1449: The record and the door hold through a stalled sign-in

**Date:** 2026-11-12
**Status:** Accepted
**Tier:** A (how a stalled read and a missing session are shown; no data changed)
**Type:** decision
**Area:** `app/src/lib/learner-records-sync.js` (read ceiling, bounded retries), `app/src/lib/access-gate.js` (`wearsChurchBrand` reads `memberOnDevice`)
**Sent in by:** Darrell, 2026-11-12, in PoeTech on Learn: "I can't open nor see my records?!", "I'm in PoeTech and it switched me to Love Corner", "I want to use either and only need one... I have access to both", then "Back... what happened".
**Pairs with:** DR-1418 (the record is read again each time), DR-0290 (the brand follows the door), DR-1428 (a lesson link opens in its own app), DR-0076

## Context
The record panel showed "Reading the record now." and no lessons, while the strip above it counted 125 read. Minutes later PoeTech wore the Love Corner brand. Then both came back by themselves at 8:46 AM.

## What was measured
- **The record read had no ceiling.** `fetchLearnerRecords` awaited the session and the query with no timeout. `subscribeLearnerRecords` runs one read at a time and queues the rest. So one hung request held the record shut until the page reloaded.
- **Learn's address is a church route.** It is `?view=church&sub=learn`. `wearsChurchBrand` was `churchDoorOnly || (!signedIn && route)`. So any moment his session was absent, the app treated him as a signed-out visitor on a church link and dressed PoeTech as the Love Corner. That happens at boot before the session is restored, and when a token refresh stalls.
- **One stall explains both symptoms,** and both cleared when the session and the read came back.
- **Saves lost to the stall stayed lost.** The strip read 125 lessons and 62 exams; his record read 116 and 57. A finished reading or exam is filed once, and the filer skips whatever the device already holds, so a save that failed was never sent again.

## Impact
A member saw an empty record and was put in the other app's brand, through no action of his.

## Decision
- **The read has a ceiling.** It gives up at `RECORD_READ_TIMEOUT_MS` (12 s) with a plain error. The panel says it could not reach the record, and what is on screen stays.
- **A failed read is retried by itself:** 3 s, 10 s, then 30 s. After that it waits for a real event (Refresh, focus, the network returning).
- **A member is never dressed as a stranger.** A device that holds a stored session (`hasPersistedSession`) belongs to a member, so the church-link branding does not apply to it. The church door (`/lovecorner/`) still always wears the Love Corner, and a true stranger on a shared church link still meets it. Signing out removes the session, and the rule applies again.
- **Catch-up filing.** After every read of the record, what this device holds that his rows lack is filed again (`deviceFactsMissingFromRecord`): a lesson marked read, or an exam score the record has none of. It is bounded to 25 a read and to each lesson once a minute. A score the record already has is never sent twice, and a course is named only when known.

## Verification
- `the-record-and-the-door-hold-through-a-stall.test.js` (11 cases):
  - a stalled read returns an error at its ceiling;
  - a stall is retried and lands;
  - retries are bounded;
  - a member keeps PoeTech on Learn, while a stranger and the church door keep the Love Corner.
- **Proven to catch twice:** without the ceiling the same read is still pending at 60 s, and the old brand rule dresses the member as a stranger.
- The catch-up names only what his own rows lack and drops each once filed; it is bounded at 25.
- The record suites pass (120 tests), and the shell did not grow.
- NOT YET OBSERVED LIVE: the next stall should show "Could not reach the record just now" and recover by itself. `re-review: 2026-11-19`.
