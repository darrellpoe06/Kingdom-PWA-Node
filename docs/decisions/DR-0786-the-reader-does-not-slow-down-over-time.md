# DR-0786 — The reader does not slow down over time: no scan per saved sentence, no write before a read, the fetch-ahead matches the NAS, and the pauses are measured

- **Status:** accepted
- **Tier:** A (the clip cache's internal scheduling; the same clips, the same cap, the same keys)
- **Type:** fix
- **Date:** 2026-10-07
- **Scope:** `app/src/lib/clip-cache.js` (`put` counts once and schedules an eviction only past the cap; `get` returns the clip and batches "last played" into one `touchMany`; `flush`, `knownBytes`; `AHEAD_CONCURRENCY`; `touchMany` on both backends), `app/src/lib/clip-queue.js` (`onPiece(i, { waitMs, inHand })`, an injectable clock), `app/src/lib/reader-trip.js` (the waits summed per trip; `waitsLine` in `tripSummary`), `app/src/lib/use-read-aloud.js` (the fetch-ahead and the download at the NAS's cap; the queue's measurement into the trip), tests `the-reader-does-not-slow-down-over-time.test.js` (+ `voice-clips-kept-on-device.test.js` awaits `flush`)
- **Principles:** DR-0076 (measure, don't claim; proven to catch), DR-0219, DR-0659 (every piece from the device first), DR-0718 (nothing waits between pieces), DR-0738 (the trip says what the device did)
- **Grounds:** Darrell 2026-10-07, on the Firestick: *"The reader begins to slow down on firestick... longer pauses... etc... over time... why?!!!!!"* and *"Comprehensive fixing... not quick and undermining... thoroughly testing and getting it right asap and high quality..."*

## Context

SHOULD: a reading in the NAS voice plays sentence after sentence with nothing between them (DR-0718); every piece played once is kept on the device (DR-0659). ARE, measured against `lib/clip-cache.js` as it was:

1. **`put` awaited a full eviction on every save.** `api.put` → `await api.evict()` → `store.list()` of EVERY clip on the device, sorted. The fetch-ahead saves a sentence about every second, so the device re-read its whole clip catalogue once a second, and the scan grew with every lesson ever listened to (cap 300 MB default; a sentence ≈ 100 KB; thousands of rows per scan). At the cap it also DELETED on every put.
2. **`get` awaited a write before handing the clip over.** `touch` (read the row, write the row, one transaction) ran inside every read, so the next sentence queued behind the fetch-ahead's writes and scans in the same IndexedDB.
3. **The fetch-ahead asked the NAS three at a time.** The NAS voice takes two (`VOICE_LITE_MAX_INFLIGHT` default 2) and answers the third 503 busy; the caller then waited 600 ms, 1200 ms, … to ask again. When that piece was the player's next sentence, so did the listener.

A phone with a fast flash hid all three. A Firestick's did not: the pause between sentences is exactly the time the next clip waits for the store and the wire, and that time grew — within a lesson as the catalogue filled, and across days as it reached the cap. GAPS: nothing measured the pause, so "why?" had no number.

## What was measured

| what | measured | basis |
| --- | --- | --- |
| scans per save (before) | 1 `store.list()` per `put`, awaited | `clip-cache.js` `put` → `await api.evict()` |
| writes per read (before) | 1 read-write transaction per `get`, awaited before return | `clip-cache.js` `get` → `await store.touch` |
| fetch-ahead vs NAS (before) | 3 at a time vs a cap of 2 | `use-read-aloud.js` `concurrency: 3` (twice); `voice_lite_server.py:73` |
| scans per save (after) | 50 saves under the cap → 1 count, 0 evictions, 0 deletes; 10 saves far over the cap → 1 scheduled eviction, run once | the new suite, with a backend that counts its own calls |
| writes per read (after) | 3 reads → 0 writes before return → 1 `touchMany` on flush | the same suite |

## Decision

1. **No scan per save.** The cache counts its bytes ONCE (the first `put` of a session), then keeps the total by arithmetic; a `put` returns as soon as the clip is written and only SCHEDULES an eviction (`EVICT_DEBOUNCE_MS` 1500) when the total has passed the cap. The eviction recounts authoritatively, least-recently-played first, pinned downloads untouched, and resets the running total. `unpin` keeps the total honest.
2. **No write before a read.** `get` hands the clip to the player at once; "last played" is queued and written in ONE transaction (`touchMany`, both backends) after `TOUCH_DEBOUNCE_MS` 2000, and always before an eviction chooses. `flush()` runs what is due now (tests, a page about to close).
3. **The fetch-ahead matches the NAS.** `AHEAD_CONCURRENCY` = 2, used by the live fetch-ahead and the download; a CI test reads `VOICE_LITE_MAX_INFLIGHT`'s default out of `voice_lite_server.py` and pins the two together, and fails on a bare `concurrency: 3` in the hook.
4. **The pause is measured and said.** The queue reports, per piece, how long the listener waited after the last piece ended and whether the piece was already in hand; the trip sums them (count, total, longest and where, how many fetched while waiting, how many over `LONG_WAIT_MS` 1 s — one small record, not a row per sentence); `tripSummary` ends with e.g. *"waits between sentences: typical 0.2 s, longest 2.3 s at sentence 28 (fetched), 1 over 1.0 s; 5 of 41 fetched while you waited"*. The line shows in the Read Aloud panel after a reading and rides with his feedback (DR-0744), so the next "slower" report arrives with its numbers.

Proven to catch: a counting backend fails the suite if a `put` scans again or an eviction runs per save; a `get` that writes before returning fails; a return to `concurrency: 3` fails; the queue's measurement is tested with an injectable clock (a piece in hand reports 0 ms; a piece still on the wire for 2.3 s reports 2300 ms, fetched); the trip's sum and its one clause are pinned word for word; older trips without waits say nothing new.

## Not yet (why + re-review)

- The Firestick's own numbers are not in hand yet: the measurement ships with this record and the next reading on the TV writes them into the panel's last-trip line. re-review 2026-10-14: read that line (or the feedback it rides with) and close or re-aim.
- The joined-file step (DR-0718) still decodes on the main thread once per reading when every piece is on the device; it is a single stall, not a growing one. re-review 2026-10-21 against the measured waits.

## Verification after merge

- The counting-backend suite `the-reader-does-not-slow-down-over-time.test.js` (12) and `voice-clips-kept-on-device.test.js` (9) green on the merged head; the CI pin of `AHEAD_CONCURRENCY` to `VOICE_LITE_MAX_INFLIGHT` holds.
- On the Firestick: read a long lesson to the end in the NAS voice; the Read Aloud panel's last-trip line now ends with the waits between sentences (typical, longest and where, how many fetched while waiting). That line is the measurement this record was missing.
- re-review 2026-10-14: read that line (or the feedback it rides with) — a typical wait under 0.5 s and no growth from the first sentences to the last closes this; growth re-aims at the joined-file decode or the NAS.

## Impact

Unresolved: on the Firestick the pause between sentences grew with every sentence saved and every lesson kept. Resolved: a save costs one write and no scan; a read costs one read; the NAS is never told busy by our own fetch-ahead; and every reading now carries the size of its own pauses.
