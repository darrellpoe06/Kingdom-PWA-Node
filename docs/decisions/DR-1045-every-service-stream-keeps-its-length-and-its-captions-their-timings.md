# DR-1045: Every service stream keeps its length, and its captions keep their timings

**Date:** 2026-10-15
**Status:** accepted
**Tier:** A (additive columns, a budgeted NAS rider on the existing road, a read-only view)
**Type:** orchestration
**Area:**
- `infra/supabase/migrations-auto/0295-every-service-stream-keeps-its-length.sql` (`choir_sermons.stream_seconds`, `stream_started_at`, `stream_read_at`; `video_transcripts.segments`)
- `infra/church-media-golive/stream_length_sync.py` + `stream_length_install.sh` (the NAS stream-length rider; `infra/nas-loops/services.json` entry `stream-length`; ci.yml selftest; flow-graph rider)
- `infra/nas-sme-pipeline/load-transcripts.py` (a no-caption verdict is asked again daily for 30 days; captions keep their timings)
- `app/src/lib/service-actuals.js` (`streamRecord`), `app/src/lib/choir-sync.js` (the three stream fields), `app/src/components/ServiceActuals.jsx` (By the stream, inside Track record)

**Extends:** DR-1029 (the 75 to 90 minute window and the Track record), DR-0723 (the NAS's own yt-dlp), the choir-dates road (yt-dlp from the NAS's residential address).
**Grounds:** DR-0076 (truthful or absent; an upper bound is named as one), DR-0248 (budget + lock), DR-0247 (agreed work starts itself), DR-0621
**Declared by:** Darrell — *"Also the YouTube streams on Sunday can be used to see if we as a team kept the proper timetable based on the timelines inside the live stream... did we keep the time within our agreed upon constraints and how well do we do weekly according to the data driven information?"*, *"Did we go over or under time based on the video stream that day?"*, and *"YouTube doesn't caption until a day or few later and then there is always captions... Make sense?"*

## Concern

Darrell asked whether the 10-11-2026 service ran over or under, by its stream. The system could not answer.

## Context

The NAS already dates every service video by reading its YouTube page with yt-dlp from the house's own address (choir_dates_sync.py), because GitHub's runners are bot-checked and the stored Data-API key is rejected. The transcript trickle (load-transcripts.py) fetches each video's captions. The Order of Service's Track record reads clocked services against the 75 to 90 minute window, and the Actual times panel already harvests song and sermon timestamps from the corpus.

## What was measured

church-video-witness run 38740116010, dispatched for 2026-10-11 and read from the live database:

- The service is on record: choir_sermons, video skY8rJWxoZ4, "Keep Reaching!", Bishop Lloyd E. Gwin, synced 2026-10-12.
- Nothing in the database holds how long any stream ran. The tower's YouTube index reads each video's duration and writes it to a local JSON file only.
- Its transcript row reads `TranscriptsDisabled`, fetched 2026-10-15 01:45:14 UTC. The service date 2026-10-11 plus the 4-day caption grace ended at 2026-10-15 00:00 UTC, so the ask came 1.7 hours after the grace ran out, and the "no captions" verdict was recorded as durable. The loader never asks a durable verdict again. Darrell's experience is that captions always arrive, sometimes days later.
- The loader joined the caption words into plain text and discarded each caption's start second, so even a captioned service carried no time marks.

## Impact

- Each service video since 2026-01-01 gets its stream length, newest first, 40 per 15-minute NAS cycle. Each new Sunday and Wednesday is read on the first cycle after its row exists.
- Church → Order of Service → Track record gains By the stream. Each Sunday and Wednesday shows its stream length and whether it was inside, over or under the window, by how many minutes. The record also shows the share inside the window and the average length. It says plainly that a stream's length includes time before the first line and after the benediction, so it is the most the service could have taken.
- A service whose captions came late is asked again once a day for 30 days from its service date, so the 10-11 service is re-asked on the next cycle after 2026-10-15 21:45 UTC.
- Captions are stored with their start seconds (`segments`), the marks that place each line of the order inside the stream.

## Decision

1. **The stream's length is stored, read once, never overwritten.** The rider writes `stream_seconds`, `stream_started_at` and `stream_read_at` only where `stream_seconds IS NULL`. A missing, zero or absurd length is never written. A video YouTube no longer serves is named in a state file and never re-read.
2. **The length is an upper bound, named as one.** It is never shown as the service's clocked length. The clocked Track record (Actual times) stays the measure of the service itself.
3. **A no-caption verdict is not the last word for a month.** Re-asked once a day for 30 days from the service date; after that the Whisper-on-NAS fallback stands as before.
4. **Captions keep their timings.** `[[start_seconds, text], ...]`, written beside the text. A box whose schema has not caught up still receives the words, never a lost write.
5. **Same road, same brakes.** NAS residential IP, the NAS's own pinned yt-dlp, budget in the script, lock and timeout in the runner, selftest gating merge.

**Not built here, with its reason:** matching each line of Christina's order to the moment it began in the stream. That needs a real timed caption track to calibrate the phrase matching, such as "the call to give" or "let us pray", against what was actually said. The database holds none yet, because this change is what starts storing them. `re-review: 2026-10-22`. By then the 10-11 and 10-18 services should carry timed captions. Build the line locator against them, feed its minutes into Actual times, and add the weekly trend of which line runs long most.

## Verification

- `stream_length_sync.py --selftest`: 10 checks. They cover a live stream's length and real start; an upload with no start; missing, zero or absurd lengths never written; the patch body; no download and no playable format needed; unreadable videos skipped; an answering, a refusing and a gone yt-dlp each named correctly. Wired into ci.yml.
- `test_load_transcripts.py`: 31 tests, 7 new. The 10-11 Sunday is asked again 20 hours after its last ask, proven to catch against the old rule that left it resolved forever. Asks happen at most once a day. A month-old video is not re-asked. Unknown last asks count as old, and unknown dates never loop. Timings are kept in order with empty lines dropped.
- `stream-record.test.jsx`: 9 tests. They cover over, under and inside by minutes; only Sundays and Wednesdays with a length; one service read once; an empty record rather than a painted zero; the mapper; 0295 additive with no policy change; and the screen showing the verdict with the upper-bound sentence, or the empty state.
- Live, after merge: db-migrate applies 0295 hosted and sovereign. Once the NAS services-sync cycle runs `stream-length`, church-video-witness for 2026-10-11 or the Track record shows the 10-11 stream's length and verdict.
- **Live proof, read 2026-10-15 (DR-0107):** PR #2193 squash-merged as `7c11a3b1c`. Deploy 38743053866 green, boot-check 13:40:30. db-migrate 38743053836: `=== applying 0295-every-service-stream-keeps-its-length.sql ===`, `applied=1 skipped=293 failed=0` hosted; the live-definition witness read 40 functions matching; sovereign replay ledger 299/295. rls-isolation 38743830645 green, all 23 legs. nas-health 38745505840: the NAS mirror at `7c11a3b1` and services-sync `all services synced` exit 0. PR #2195 (`c52e7118b`) gave church-video-witness the stream columns; its run 38747136673 for 2026-10-11 read:
  - **10-11-2026, "Keep Reaching!": stream 103:42 (6222 s), started 11:01 AM Central (16:01:06 UTC), 14 minutes over the 90-minute limit as an upper bound.** That Sunday also carried the two one-time items DR-1044 left out of the standard order.
  - The rider's first cycles read 80 of the 96 service videos since 2026-01-01; 16 wait for the next cycle.
  - The last five Sundays by the stream: 10-11 104′ (over 14), 10-04 91′ (over 1), 09-27 89′ (inside), 09-20 97′ (over 7), 09-13 90′ (inside). Two of five inside; average 94′.
  - The last five Wednesdays: 66′, 64′, 64′, 63′, 64′. Each is 9 to 12 minutes under the 75-minute floor, read against the one window Darrell declared for every service (DR-1029).
  - The 10-11 transcript still reads `TranscriptsDisabled` from its 01:45 UTC ask; under the new rule it is asked again after 21:45 UTC today.
