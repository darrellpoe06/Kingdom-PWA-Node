# DR-0725: A saved lesson rings the bell, and the builder's progress is seen without a timer

- **Status:** accepted
- **Tier:** A for the record, the workflows and the decision script (deterministic, no model, read-and-comment only). The NAS change rides the lesson builder's existing service, budget, lock and stop-paths (DR-0669), armed by record on merge (DR-0247).
- **Type:** orchestration (a Way, DR-0108)
- **Date:** 2026-10-01
- **Scope:**
  - `.github/workflows/lesson-inbox-bell.yml` (new; `repository_dispatch: lesson-waiting` plus `workflow_dispatch`, with no schedule).
  - `scripts/lesson-inbox-bell.mjs` (new; the decision, the progress lines and the status print).
  - `scripts/lesson-inbox-waiting.sql` (new; the one "waiting" query, now shared with `inbox-lessons-waiting.yml`).
  - `scripts/lesson-inbox-progress.sql`, `scripts/lesson-builder-versions.sql` and `scripts/lesson-builder-status.sh` (new; the rows in flight, each writer's gate result, the service status and the lesson PRs, all read-only).
  - `.github/workflows/inbox-lessons-waiting.yml` (now also prints the builder's progress).
  - `infra/nas-lesson-builder/lesson_builder.py`:
    - `Bell`, `bell_dispatch`, `bell_milestone` and `bell_key`;
    - `Db.notify_stage`, `Db.row_tags` and `Db.waiting_tags`;
    - `Build._milestone`;
    - `job_of('stage:<id>')`.
  - `test_lesson_builder.py` (`BellTests`).
  - `app/src/lib/agent-inbox-sync.js` (the note that the insert is the ring).
  - `app/src/__tests__/lesson-inbox-bell.test.js` (new).
  - `scripts/system-flow-registry.mjs`.
  - The standing bell PR #1879 on `bell/lesson-inbox`, labeled `hold`; it never merges.
- **Principles:** THREE-BRAKES (as amended, DR-0247 and DR-0248), VERIFICATION-DOCTRINE (DR-0076), PERPETUAL-IMPROVEMENT (DR-0075), WAYS-REVIEW (DR-0108), NOTHING-WAITS (DR-0236).
- **Grounds:**
  - DR-0255: event-driven first.
  - DR-0312: the Gmail door's signal PR #1346, the same pattern.
  - DR-0610 and DR-0667: the in-app Routine and its hourly clock.
  - DR-0669: migration 0243's `pg_notify('lesson_inbox')` and the builder that LISTENs.
  - DR-0085: the NAS-resident push token.
  - DR-0614 and DR-0672: the app reads and writes the NAS database.
- **Supersedes:** the unmerged draft of this bell on `claude/lesson-inbox-bell`, which was numbered DR-0701. It never landed, and this record replaces it. DR-0698 and DR-0702 to DR-0724 are claimed by other lanes.

## Context

Darrell, 2026-09-30, verbatim:

> "I don't like timers... they cost more than we need... don't we have a better solution/s?"

and 2026-10-01, just after making a lesson in the app and seeing nothing happen:

> "Why can't it just be triggered by me doing the lesson so it's not a timer!!!!!"

and, of that lesson, showing "building" from about 01:00 UTC:

> "how long?"

A claude.ai Routine (`trig_01KnByrzx8yYCURwfRKUrvTq`) woke the in-app lesson intake every hour to ask one question: is any lesson row waiting? Most hours none was, and the AI turn was spent anyway. When a lesson was waiting, it still waited up to an hour, and then waited again in the runner queue. Once the NAS builder took a row, no one outside the NAS could see how far it had got.

## What was measured

| what | measured (2026-10-01, from the code on `main` and this branch) |
| --- | --- |
| The clock | `trig_01KnByrzx8yYCURwfRKUrvTq`, hourly: **24 AI wakes a day**, whether or not a lesson waits (DR-0667) |
| Where a lesson lands | `agent_inbox` on the NAS database the app reads. `relayThought` (`app/src/lib/agent-inbox-sync.js`) inserts it with `tags: ['lesson', ...]` (`OneVoiceInput.jsx`) |
| The database signal | **Already on main:** migration 0243 `agent_inbox_lesson_notify`. A row tagged `lesson`, not captured and not building, that is inserted or has its tags changed, calls `pg_notify('lesson_inbox', NEW.id::text)`, which carries **the id only**. The other two notifies carry `'decision:' \|\| id` and `'backfill'` |
| Is the NAS builder clocked? | **No.** `poetech-lesson-builder.service` (`Type=simple`, `Restart=always`) LISTENs on `lesson_inbox` and `consider()`s each row the moment it is notified. services-sync only (re)installs it and sends a SIGHUP each cycle, which is a safety sweep. Its select timeout of 300 s is a keep-alive, not a work clock. Step 3 of the brief was therefore already true. |
| The NAS-held GitHub credential | `/volume1/PoeTech/secrets/github-token.txt` (DR-0085). The builder already pushes lesson branches with it (`TOKEN_FILE`, `lesson_builder.py`). No new credential exists or is needed |
| Progress visibility | `status.json` and `lesson_builder_settings.service_status` (DR-0669) are written by the service and printed by no workflow. The stage tags (`build:<stage>@<time>`) are on the row, but nothing outside the NAS read them |
| The lanes | `auto-open-pr.yml`, `auto-merge.yml` and `keep-prs-current.yml` never select `bell/*`, so #1879 is never merged |

## Impact

Before: 24 AI turns a day to find, most hours, nothing; a waiting lesson waited up to an hour; a building lesson was invisible.

After:
- A lesson is announced within about a minute of its row landing: the notification is instant, and the bell run is one short Actions job.
- The intake session wakes only when a row reaches a milestone it has not been told about.
- Darrell and the session see the builder's progress as it happens, with start, elapsed time, attempt, writers, gate results and the PR.
- A quiet day costs zero AI turns and zero runs.
- The database is the single ring for every writer: a typed lesson, a Whisper transcript and a Governor's approval all ring the same way. There is no code in the browser and no new secret.

**Limits, stated.**
- The ring runs through the lesson builder service. If that service is down, a row is re-offered at the service's next start or at the services-sync sweep it already receives. That sweep is deduplicated, so it is free when nothing is new.
- The comment cap (24 a day) can hold a progress comment on a very busy day. The next new milestone after the window frees carries the full picture.
- The hourly Routine stays on until Darrell has seen the proof (task #14). He switches it off.

## Decision

1. **The database is the ring; the NAS sends the bell.**
   - The 0243 notification that already starts a NAS build also offers the row to `Bell`.
   - For each new **row key** (`<id>|<milestone>`), `Bell` sends **one** `repository_dispatch` of type `lesson-waiting`, carrying the row ids only. It reads the row's tags (`Db.row_tags`) and never its body.
   - The token is the NAS-held push token, read in place and never logged. There is no `pg_net` and no token in the database.
2. **Build milestones ring the same channel.**
   - A build sends `pg_notify('lesson_inbox', 'stage:<id>')` (`Db.notify_stage`), carrying the id only, when it reaches `gated` and at every finish: shipped, awaiting review, failed, deferred, duplicate or skipped.
   - The service rings `building` when it claims a row, and `failed` when a build process crashes or passes its budget.
   - `job_of` reads `stage:` as a bell-only notification, so it never starts a build.
   - The milestone rule (`bell_milestone` in Python, `milestone` in the script) is one rule, tested on both sides.
3. **The bell decides deterministically** (`scripts/lesson-inbox-bell.mjs`).
   - It reads the rows in flight: waiting, building, awaiting review, handed back, and those shipped in the last day.
   - It comments on PR #1879 only when a row is at a milestone its own last comment did not name.
   - A row leaving the set (captured by the intake, or aged out) is not news.
   - The comment carries ids, who and when, plus tag-derived progress: the stage, start, elapsed time, attempt, writers, each writer's gate result (`lesson_versions`, never a prompt or a body), and the PR once shipped.
   - Free-text tags (such as `build-reason:`) are dropped before anything is formatted.
   - The intake session is subscribed to the bell PR, as the Gmail door's session is subscribed to #1346 (DR-0312). A comment wakes it within a minute, with no clock.
4. **The status step.** `inbox-lessons-waiting.yml` (dispatch) now also prints the builder's service status, its systemd state and `status.json`, its running locks, and every row in flight. It is read-only and has no write permission.
5. **The brakes** (DR-0248, the deterministic class).
   - **Budget.** On the NAS: 20 s spacing (a burst is one dispatch plus a trailing one) and **60 dispatches a day** (`LESSON_BELL_MAX_PER_DAY`). In Actions: a 5-minute job, and **24 comments a day**, never more AI wakes than the Routine it replaces (`vars.LESSON_BELL_MAX_PER_DAY`).
   - **Single-flight.** One systemd service and one `Bell` per process on the NAS; concurrency group `lesson-inbox-bell` in Actions.
   - **Stop-paths.** The builder's own `ARMED-BY-RECORD` and `services.json enabled:false` (`kill_state`), `LESSON_BELL=off` in `lesson-builder.env`, the repository variable `LESSON_BELL=off`, or deleting the workflow.
   - **Armed by record on merge.** services-sync restarts the builder when its code changes.
6. **No timer anywhere in the bell.** The draft's daily schedule is removed. The safety net is the builder's restart and the services-sync sweep it already receives, which re-offers every waiting row through the same dedupe.
7. **The hourly Routine stays on until Darrell has seen the proof.** He switches it off.

## Verification

- `app/src/__tests__/lesson-inbox-bell.test.js` (25 tests) proves:
  - **The trigger and every NOTIFY payload carry no body.** The three `pg_notify` payloads in 0243 are exactly `NEW.id::text`, `'decision:' || NEW.id::text` and `'backfill'`.
  - Every query selects the body only as a length, and never a prompt.
  - **The workflow comments on #1879 only when the set changes.** That covers the first ring, an unchanged set, a new milestone, and a row leaving the set; a re-tag like `mirrored` is not news, and a handed-back row is.
  - The per-day cap holds.
  - Each milestone (waiting, building, gated, shipped) is news exactly once.
  - The building line shows start, elapsed time, attempt and writer, and no body.
  - Gates and the PR show once they exist.
  - The status print names the service, each writer and every row.
  - The workflow has no schedule. A dispatch payload reaches the shell only through env, filtered to ids.
  - A proof insert ends its own run.
  - The app's save is one insert with no GitHub call.
  - The lanes never select `bell/*`.
- `infra/nas-lesson-builder/test_lesson_builder.py` `BellTests` (10 tests) proves:
  - **The dispatch is sent once per new row (deduped).** That holds across a re-notify, the app's `build:<sha>` stamp, and a restart (`bell.json`). A handed-back row rings once more.
  - Each milestone rings once.
  - A burst is one dispatch plus a trailing one.
  - The per-day cap holds the ring and releases it when the day frees.
  - A failed send is kept for retry.
  - The kill works.
  - The dispatch names ids only (a body passed in is filtered out).
  - A build's `gated` stage and its finish notify the id only.
  - The service rings on a row, on the sweep and on `stage:`, rings `building` at claim, and stays silent when stopped.
  - The full file passes (98 tests).
- **Proven to catch.** Each of these mutations turned the suites red:
  - Python: the dedupe check removed; the id filter in the dispatch removed; the daily cap removed; the handed-back key removed; the claim ring removed; the `gated` notify removed; the `stage:` parse removed; the gated-after-claim comparison loosened.
  - JS: the daily cap removed; the same-set check removed; a schedule added; `NEW.body` added to the 0243 notify; the proof-insert guard removed; the gated comparison loosened; the new-milestone rule replaced by set equality; the attempt count changed; the progress query selecting `body`; the free-text tag filter loosened.
- **End to end, after merge and the next services-sync.**
  1. `lesson-inbox-bell.yml proof=insert` inserts a row tagged `lesson`, `canary`, `bell-proof` and `mirrored`, and ends its run.
  2. The NAS sends `lesson-waiting`.
  3. A `repository_dispatch` run comments on #1879.

  The measure is the comment's `created_at` minus the row's `created_at`, in seconds. The run ids and the measured seconds are reported with this record's PR; `proof=delete` removes the row.
- re-review: 2026-10-15. Check the bell's comments against the Routine's history for the same days, whether the Routine is off, and whether each milestone reached #1879 for a real lesson.
