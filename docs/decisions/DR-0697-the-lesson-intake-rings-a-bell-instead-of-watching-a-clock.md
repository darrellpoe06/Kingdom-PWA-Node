# DR-0697 — The lesson intake rings a bell instead of watching a clock: a saved lesson wakes the intake, and a quiet hour costs nothing

- **Status:** accepted
- **Tier:** A for the record and the workflow (deterministic, no model, report-and-comment only); the NAS change rides the lesson builder's existing service and brakes
- **Type:** orchestration (a Way, DR-0108)
- **Date:** 2026-09-30
- **Scope:** `.github/workflows/lesson-inbox-bell.yml` (new); `scripts/lesson-inbox-bell.mjs` (new, the decision); `scripts/lesson-inbox-waiting.sql` (new, the one "waiting" query, now shared with `.github/workflows/inbox-lessons-waiting.yml`); `infra/nas-lesson-builder/lesson_builder.py` (`Bell`, `bell_dispatch`, rung from the existing LISTEN loop) + `test_lesson_builder.py` (`BellTests`); `app/src/lib/agent-inbox-sync.js` (the note that the insert is the ring); `app/src/__tests__/lesson-inbox-bell.test.js` (new); `scripts/system-flow-registry.mjs` (the bell's place in the flow graph); the standing bell PR #1879 on `bell/lesson-inbox` (labeled `hold`, never merges)
- **Principles:** THREE-BRAKES (as amended, DR-0247 / DR-0248), VERIFICATION-DOCTRINE (DR-0076), PERPETUAL-IMPROVEMENT (DR-0075), WAYS-REVIEW (DR-0108), NOTHING-WAITS (DR-0236)
- **Grounds:** DR-0255 (event-driven first; a timer only as a fallback matched to the change rate); DR-0312 (the Gmail door's signal PR #1346, the same pattern); DR-0610 / DR-0667 (the in-app Routine and its hourly clock); DR-0669 (migration 0243's `pg_notify('lesson_inbox')` and the builder that LISTENs); DR-0614 / DR-0672 (the app reads and writes the NAS database). DR-0692 through DR-0696 are held by the bands lanes in flight (PRs #1876, #1878 and their siblings).

## Context

Darrell, 2026-09-30, verbatim:

> "I don't like timers... they cost more than we need... don't we have a better solution/s?"

and, the same hour:

> "Internal app notices differences or changes are telling the next sections etc?"

The in-app lesson intake is a claude.ai Routine that wakes an AI session every hour at :04 (DR-0667: the platform minimum) to ask one question: is any lesson row waiting? Most hours the answer is no, and the AI turn is spent anyway. His second sentence names the pattern this record adopts for the whole app: a change in one section tells the next section, whichever screen or process made it.

## What was measured

| what | measured |
| --- | --- |
| The Routine | `trig_01KnByrzx8yYCURwfRKUrvTq`, `4 * * * *`: **24 AI wakes a day**, whether or not a lesson waits (DR-0667's table) |
| Where lesson rows land | `agent_inbox` on the NAS database the app reads (REPOINT-ARMED; DR-0672 §1). The app writes them through `relayThought` (`app/src/lib/agent-inbox-sync.js`), called with `tags: ['lesson', ...]` by `OneVoiceInput.jsx`; Whisper transcripts are written there by `infra/nas-lesson-voice` |
| A database signal already exists | Migration 0243 (`agent_inbox_lesson_notify`): a row tagged `lesson`, not captured and not building, inserted or with changed tags, calls `pg_notify('lesson_inbox', <id>)`. `poetech-lesson-builder.service` LISTENs on it (DR-0669), runs as a systemd service, and already holds a GitHub token (`/volume1/PoeTech/secrets/github-token.txt`, DR-0085) |
| The app-side dispatch seam | The `ari-review` `repository_dispatch` "app-side seam" in `ari-comprehensive-review.yml` was **never built**: its trigger is commented out "once the scoped-token custody step lands". No Pages Function under `app/functions` holds a GitHub token or calls `api.github.com` (grep, 2026-09-30). A browser-side dispatch would need a new server secret and a public endpoint anyone could hit |
| Deterministic readers | `inbox-lessons-waiting.yml` (lists waiting rows, never a body), `inbox-lesson-body.yml`, `inbox-lesson-tag.yml` |
| The lanes | `auto-open-pr.yml` fires on `feat/** fix/** merge/** docs/** claude/**`; `auto-merge.yml` selects `^(feat|fix|merge|docs|claude)/`; `keep-prs-current.yml` selects `claude/`. `bell/*` is in none of them |

## Impact

Before: 24 AI turns a day to find, most hours, nothing. After: the AI wakes only when the set of waiting lesson rows changes, which on a normal day is once per lesson sent. A lesson is seen within about a minute of its row landing (the notification is instant; the bell run takes about a minute) instead of up to an hour. The database is the single ring for every writer, so a typed lesson, a Whisper transcript and a Governor's approval all ring the same way, with no code in the browser and no new secret anywhere.

**Cost comparison.** Timer: 24 AI wakes a day, 720 a month, regardless of work. Bell: one deterministic GitHub Actions run per ring (no model; free on the public repository) plus one AI wake per changed waiting set; a quiet day costs one daily safety run and zero AI turns.

**Limits, stated.** The ring runs through the lesson builder service: if that service is down, a row waits for the daily safety run (or for the service's own restart sweep, which does not ring). The NAS side is not re-verified from this sandbox, which has no road to the NAS; the proof below measures it from a runner.

## Decision

1. **The database is the primary ring.** The 0243 notification that already starts a NAS build also rings the bell: `Service.consider` calls `Bell.ring()` for every row notification (ready writer or not), and `Bell` sends one `repository_dispatch` of type `lesson-saved` carrying no id and no words. No `pg_net` and no token in the database: the listener that already runs and already holds the push credential is the smaller, safer road. Whether `pg_net` is installed on the NAS database is reported by the bell's `diagnose` run; it is not needed for this design.
2. **The app rings by saving.** `relayThought`'s insert is the ring (`app/src/lib/agent-inbox-sync.js`, the comment above the insert). The browser sends nothing else, so a save is never awaited on or slowed by the bell. The unbuilt `ari-review` seam is not built for this: it would add a server secret and a public door for a signal the database already gives.
3. **The bell decides deterministically** (`scripts/lesson-inbox-bell.mjs`): nothing waiting, no comment; the same waiting set as its own last comment, no comment; a changed set, ONE comment on PR #1879 listing ids, created_by and tags. A row the NAS tried and handed back (a new `build:` stage tag) counts as changed; bookkeeping tags (`mirrored`) do not. Never a body: the query selects only its length.
4. **The standing bell PR** #1879 on `bell/lesson-inbox` carries `hold` and sits outside every lane pattern. The intake session is subscribed to the bell PR, as the Gmail door's session is subscribed to #1346 (DR-0312).
5. **The brakes.** Budget: one query and at most one comment per run, 5 minutes; on the NAS, 20 seconds between rings (a burst is one ring plus a trailing ring) and 30 rings an hour. Lock: concurrency group `lesson-inbox-bell`. Kill: repository variable `LESSON_BELL=off` (every run skips) or delete the workflow; on the NAS, `LESSON_BELL=off` in `lesson-builder.env`, or the builder's own stop-paths. One daily schedule (14:17 UTC) is the safety net.
6. **The hourly Routine stays on until Darrell has seen the proof.** He disables it himself.
7. **The pattern for the whole app: a change in one section signals the next one.** `scripts/system-flow-registry.mjs` is the map: its `seeds` edges say which section feeds which, so each edge still carried by a clock or a hand is where a future signal belongs. The next three, not built here:
   - **Whisper (`lesson-voice`)**: a raw voice row waits up to 15 minutes for the services-sync clock, yet 0243 already rings on it. Recommendation: the Whisper pass wakes on the same `lesson_inbox` notification (a LISTEN in the existing rider, or the builder handing the id over).
   - **Fixed notes (`feedback-fixed`)**: an hourly cron (`7 * * * *`) looks for fixes that reached the deployed build. Recommendation: trigger it on `workflow_run` of `deploy-cloudflare-pages.yml` completing, keeping a daily fallback.
   - **The Gmail door (`lesson-mail-watch`)**: a 5-minute IMAP poll, 288 runs a day. Recommendation: IMAP IDLE in an existing NAS service that dispatches the same way this bell does, with the poll reduced to a daily fallback.

## Verification

- `app/src/__tests__/lesson-inbox-bell.test.js` (16): the waiting-set diff (first ring, unchanged, changed, empty); a handed-back row rings again while `mirrored` does not; no body reaches the comment even when one is in the input, and markup-shaped tags are dropped; the shared query selects the body only as a length; the triggers, lock, timeout and kill; the lanes never select `bell/*`; the app's save is one insert tagged `lesson` with no network call to GitHub; the 0243 trigger rings on what the app writes; the NAS listener rings on a row notification. Proven to catch: four mutations of the decision script (the same-set check removed, the build-count key removed, the empty check removed, a body put in the comment) each turned the suite red.
- `infra/nas-lesson-builder/test_lesson_builder.py` `BellTests` (5): one ring per burst plus the trailing ring; the hourly ceiling holds a ring and releases it when the window frees; the kill; the dispatch carries no id and no words; the service rings on a row, not on a sweep, not when stopped. Proven to catch: removing the ceiling, ringing on every notification, adding an id to the payload, and removing the loop's trailing flush each turned it red.
- End to end after merge: a `repository_dispatch lesson-saved` produces a bell run whose log shows the waiting set and the decision, and either a comment on #1879 or the correct "nothing changed" outcome; a labelled `bell-proof` row inserted on the live database rings through 0243 and the NAS listener, then is deleted. The run ids are reported with this record's PR.
- re-review: 2026-10-14 — the bell's runs and comments against the Routine's history for the same days; whether the Routine is off; whether the three hand-offs above have been started.
