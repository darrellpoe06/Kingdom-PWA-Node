# 2026-10-07 — The stale-row alarm (DR-0771), and the two Sunday rows closed

**What Darrell said:** "Mark it not-a-lesson and build the stale-row alarm" — "Both" — "make sure we have end to end database fields mapped to the necessary items and integrate them into the system solutions comprehensively".

**Closed first:** rows `83ad1f8f` (recording "Freedom Yeshua", 7:17, Sun 2026-10-04 13:50 UTC) and `c3285321` (its transcript) marked `not-a-lesson` with the reason by `inbox-lesson-tag.yml` runs 37570567214 and 37570571782 (both success). They leave the waiting list.

**What changed** (record: `docs/decisions/DR-0771-a-lesson-that-waits-too-long-rings-again-and-pushes-its-person.md`):
- `infra/supabase/migrations-auto/0252-...sql` — `lesson_inbox_stale_sweep(first_hours, repeat_hours, now)`: the alarm is a FIELD on the row (`stale-alarm@<time>`) plus one push per window for its person.
- `infra/nas-lesson-builder/lesson_builder.py` — `Db.stale_sweep`, `Service.sweep_stale` on every wake (spacing 900 s), milestone `waiting#s<n>`; env `LESSON_STALE_FIRST_HOURS` / `LESSON_STALE_REPEAT_HOURS` / `LESSON_STALE_SWEEP_SECONDS`.
- `scripts/lesson-inbox-bell.mjs` — `staleAlarms`, milestone, label with alarm count, last time and hours waited; header counts rows past the alarm.
- `app/src/lib/lesson-inbox.js`, `app/src/components/LessonInbox.jsx` — `stale: {count, lastAt}` per item, shown.
- `scripts/arrivals-ci-smoke.sql`, `.github/workflows/ci.yml` — 0252 applied twice and proven in the arrivals leg.
- `scripts/system-flow-registry.mjs` — `db:agent_inbox#stale-alarm` written by the builder, read by the bell.

**Also in this change (Darrell, on his phone at my.wyze.com: "Not finding an api key... again... is this best for elderly users?"):** the Cameras sign-in form now links straight to Wyze's API key page (not the Wyze app, not my.wyze.com), lists the four steps, and says it is a one-time step for the account owner; family members only open the tab. go2rtc requires the key (its source: "api_key and api_id required"), so the step is made plain, not removed. `app/src/lib/cameras.js` (`WYZE_API_KEY_HELP_URL`, `WYZE_API_KEY_STEPS`), `Cameras.jsx`, README.

**Evidence:** builder unit tests 102 green; arrivals smoke on a local PostgreSQL 16 ("every wall held"); bell and Your lessons tests green; eslint clean; guards OK.

**re-review:** 2026-10-14 — a verdict should cancel a build in flight (the audit's second gap).
