# DR-0771 — A lesson that waits too long rings the bell again and pushes its person

- **Status:** accepted
- **Tier:** A (deterministic class, DR-0248: budget + lock; one SQL function, one call per wake of an already-running service; no new timer fleet, no money, no church-facing identity change)
- **Type:** feature + schema (one function; no new table or column)
- **Date:** 2026-10-07
- **Scope:** `infra/supabase/migrations-auto/0252-a-lesson-that-waits-too-long-rings-again-and-pushes-its-person.sql`; `scripts/arrivals-ci-smoke.sql` + `.github/workflows/ci.yml` (`arrivals-push` leg applies 0252); `infra/nas-lesson-builder/lesson_builder.py` (`Db.stale_sweep`, `Service.sweep_stale`, milestone `waiting#s<n>`, three env knobs); `scripts/lesson-inbox-bell.mjs` (`staleAlarms`, milestone, label, header); `app/src/lib/lesson-inbox.js` + `app/src/components/LessonInbox.jsx` (the `stale` field on each item, shown); `scripts/system-flow-registry.mjs`; tests `test_lesson_builder.py`, `lesson-inbox-bell.test.js`, `your-lessons-live.test.jsx`.
- **Principles:** VERIFICATION-DOCTRINE (DR-0076), HOLD-THE-HAND (DR-0621), REALITY-TRACE (DR-0061), DR-0725 (no timer; the bell), DR-0728 (every arrival counted), DR-0248 (deterministic class: budget + lock), DR-0236 (nothing waits)
- **Grounds:** Darrell 2026-10-07: *"build the stale-row alarm"*, and: *"make sure we have end to end database fields mapped to the necessary items and integrate them into the system solutions comprehensively"*.

## Context

The weekend audit (session note 2026-10-07) found two lesson rows made Sunday 2026-10-04 at 13:50 UTC that waited until Tuesday 2026-10-07 with nobody told. The bell (DR-0725) rang once when they landed, as designed; the NAS builder tried one and handed it back in 8 seconds; and from then on the road was silent, because a row that simply WAITS reaches no milestone. The push outbox (DR-0728) fires only on ready and published. The waiting list prints only when a person asks. A waiting row had no deterministic owner.

## What was measured

- Run 37560321693 (inbox-lessons-waiting, 2026-10-07 02:06 UTC): `83ad1f8f` "waiting for the intake" since 2026-10-04 13:50:31; `c3285321` "handed back (last: failed), waiting for the intake; attempt 2". Neither had moved in 60 hours.
- The bell PR comments at 13:50:58 and 14:04:56 on 2026-10-04 were the last word about them (lesson-inbox-bell runs that day).
- `scripts/lesson-inbox-bell.mjs milestone()` and `lesson_builder.py bell_milestone()` both answer `waiting` for such a row, so `decide()` found "nothing changed since the last ring" on every later run, exactly as written.
- The NAS builder's `listen_forever` already wakes at least every 300 s (`select` timeout) and reconnects with a sweep, so a check on its wake adds no timer.

## Impact

A recording spoken into the app on a weekend could sit unbuilt for days with no signal to the intake and none to the person who recorded it. The app's covenant that a spoken word gets built (CLAUDE.md, "Spoken Teachings Are Build Input") depended on someone happening to look.

## Decision

1. **The alarm is a field on the row.** Migration 0252 adds `lesson_inbox_stale_sweep(p_first_hours, p_repeat_hours, p_now)`: every ROOT lesson row (no `of:` tag) still waiting by the one definition (`scripts/lesson-inbox-waiting.sql`), older than the first window (default 4 h), not alarmed within the repeat window (default 24 h), not a canary, gains the tag `stale-alarm@<time>` and enqueues one `push_outbox` row for its own person, keyed `lesson:<row>:stale:<n>`. The function is the single source of the alarm; everything else reads the field.
2. **The NAS builder is the one caller.** `Service.sweep_stale()` runs on each wake of the LISTEN loop, no sooner than `LESSON_STALE_SWEEP_SECONDS` (900) apart, with `LESSON_STALE_FIRST_HOURS` (4) and `LESSON_STALE_REPEAT_HOURS` (24). It rings the bell for each alarmed row; the tag change also rings through 0243, and the bell dedupes. A database without 0252 is said once, never a crash.
3. **Every reader of the row shows the field.** The bell's milestone becomes `waiting#s<n>` (and `waiting#b<n>#s<m>` for a handed-back row), so the bell rings and the comment names the alarm, its last time and the hours waited; the header counts rows past the alarm. Your lessons reads the same stamps into `stale: {count, lastAt}` and shows "Still waiting · the alarm rang N times, last ..." under the row. The system-flow registry carries `db:agent_inbox#stale-alarm` written by the builder and read by the bell.
4. **One teaching, one alarm.** Only the root row is alarmed; its transcript inherits the state through the bell's grouping and the screen's parent/child join. Pushes dedupe on their key; a re-run inside the repeat window is a no-op.

### The field map (end to end)

| Field | Where it lives | Written by | Read by |
|---|---|---|---|
| `agent_inbox.tags` ∋ `stale-alarm@<time>` | the row itself | 0252 `lesson_inbox_stale_sweep` (called by the NAS builder) | 0243 notify trigger → builder LISTEN; `bell_milestone` / `milestone()` → bell key; `progressOf` → bell comment; `lessonItems` → Your lessons `stale` |
| `push_outbox` row `kind=lesson`, `target_role=person`, `target_user=created_by`, `dedupe_key=lesson:<row>:stale:<n>`, `url` Your lessons | push outbox (0220/0246 shape) | 0252 | `push-outbox-drain.yml` → the person's phone (DR-0400 switch) |
| `waited_hours`, `alarm_no` | the function's answer | 0252 | the builder's log line `lesson-stale: alarm #n for <id> (waited h h)` |
| windows 4 h / 24 h / 900 s | `lesson-builder.env` on the NAS | Darrell | `Service.sweep_stale` |

## Verification

- `scripts/arrivals-ci-smoke.sql` (CI `arrivals-push` leg, real PostgreSQL 16) — proven-to-catch: the first sweep alarms exactly the 5 h root row (one tag, one push for its person, the Your lessons landing, no lesson text), not its transcript, not a 2 h row, not a captured row, not a canary; a second sweep inside the window alarms nothing; 25 h later the long waiter gets `:stale:2` and the aged row its first; the alarmed row still WAITS by the bell's definition; the ready push is not tripped; the person reads exactly their own three pushes.
- `test_lesson_builder.py` — the milestone reads the field (`waiting#s1`, `waiting#s2`, `waiting#b2#s1`; the bell key changes); the sweep calls 0252 with the configured windows, rings the bell with the NEW milestone, keeps its spacing, re-asks after it; a missing function is said once and stops nothing. 102 tests green.
- `lesson-inbox-bell.test.js` — an alarm tag on a quiet waiting row rings the bell again and the comment names it; `your-lessons-live.test.jsx` — the screen's `stale` field counts the stamps and keeps the last time.

**His test:** record a lesson, do nothing. Four hours later the bell PR gets a comment naming the alarm, Your lessons shows "Still waiting · the alarm rang once", and the phone gets "A lesson is still waiting" once the push drain is armed.

**Honest limits (DR-0100):** the push reaches a phone only where `push-outbox-drain.yml` is armed (DR-0400's switch); until then the outbox fills, and the bell and the screen still carry the alarm. The alarm names a waiting row, it does not build it; the intake it wakes does. A verdict does not yet cancel a build in flight (the audit's second gap); re-review: 2026-10-14.
