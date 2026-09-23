# DR-0583 — The five migrations that never lived here come home: the sovereign NO-GO named, and closed by one recovered file

- **Status:** accepted
- **Tier:** B (a migration to both databases; a NO-OP on hosted by construction, creates 5 tables / 17 functions / 5 triggers / 35 policies on the sovereign box)
- **Type:** orchestration
- **Date:** 2026-09-23
- **Scope:** `infra/supabase/migrations-auto/0225-the-five-migrations-that-never-lived-here-come-home.sql`
- **Principles:** VERIFICATION-DOCTRINE (DR-0076 — read from the catalog, not from memory), REVIEW-OUR-WAYS (DR-0108), NOTHING-WAITS (DR-0236), SPEC-CONFORMANCE (DR-0219)
- **Grounds:** DR-0582 §2 ("reading that line is the next session's first act"); nas-health run 35872569736 (2026-09-23 14:13Z); the hosted ledger `public._schema_migrations`; #1467 (2026-09-05)

## What was measured

The first post-repoint parity line ever read, from the NAS cutover status file (nas-health run 35872569736, job 107220161280):

| dimension | missing on the sovereign box, by name |
| --- | --- |
| tables (5) | `_expected_grants`, `_sync_tokens`, `course_shares`, `courses`, `lessons` |
| functions (17) | `assert_expected_grants`, `claim_course_share`, `courses_bump_on_lesson_change`, `immutable_join`, `learn_touch_updated_at`, `ledger_order_disagreements`, `ledger_reject_duplicate_ordinal`, `lessons_inherit_instance`, `lessons_needing_audio`, `migration_ordinal`, `mint_course_share`, `refresh_expected_grants`, `revoke_course_share`, `set_lesson_audio`, `sync_learn_catalog`, `sync_learn_catalog_result`, `upsert_course_from_json` |
| triggers (5) | `_schema_migrations.ledger_unique_ordinal`, `courses.courses_touch`, `lessons.lessons_bump_course`, `lessons.lessons_instance`, `lessons.lessons_touch` |
| rls policies (35) | the 12 declared on `courses` / `lessons` / `course_shares`; 23 overlay policies (`assistant_scope_*`, `viewer_readonly_*`) on those three tables and on `push_subscriptions` |
| live ahead (expected) | `auth_identities`, `auth_users` |
| storage | DR-0317's recorded gap (8 vs 7 buckets; 455 vs 12 objects) |

**The cause, read from the hosted ledger.** Five rows in `public._schema_migrations` name files this repository has never contained: `0168-the-ledger-refuses-a-second-file-with-the-same-number.sql`, `0169-grants-are-asserted-after-every-migration.sql`, `0170-courses-a-lesson-belongs-to-a-course.sql`, `0171-a-course-is-imported-the-same-way-twice.sql` (all four `applied_at 2026-09-05 14:50:44Z`) and `0172-a-lesson-can-carry-its-own-voice.sql` (`14:54:49Z`). #1467 met them as ordinal collisions that day and renumbered this repository's own files around them — "a courses/grants workstream is applying migrations to the same database from outside main." It moved our numbers; it could not move their SQL here. The sovereign replay (`replay_migrations.sh`) restores the hosted baseline of 2026-08-19 and then replays only `migrations-auto` files that sort after it — so five migrations hosted ran from outside the repository are invisible to the box. The ledger row COUNT matched (230 = 230, the ledger table rides the baseline dump) while the objects did not, which is why DR-0317's "17 functions short" could never be explained by counts. Every object the parity line names is created by exactly those five files (verified object-by-object against hosted's catalog and comments: `Run at the end of every migration and in CI (W5)`, `(W3)`, `0181`).

## Decision

1. **One recovered file, 0225, carries the five migrations' effect.** Recovered from hosted's live catalog (`pg_get_functiondef`, `pg_get_constraintdef`, `pg_get_triggerdef`, `pg_policies`, `pg_indexes`, `information_schema`, every object comment) — never re-typed from memory of files nobody here has read. Written to be a no-op where the objects exist (hosted: create-if-not-exists, create-or-replace, drop-if-exists + create) and to create them where they do not (the box). It lands as ledger row 0225 on both sides; the five external rows stay as hosted recorded them.
2. **Two things do not travel.** The `learn-catalog` sync token (a 64-char secret in `_sync_tokens`) is minted on the box on first apply (`ON CONFLICT DO NOTHING`, hosted untouched) — a placeholder until the edge function that reads it moves off hosted, and the file says so. The `_expected_grants` snapshot (3,497 hosted rows) is populated on the box only where the table is empty; hosted's snapshot is not re-blessed.
3. **Portability guards, measured.** `check_function_bodies = off` for the file (two recovered functions are `LANGUAGE sql` over `net._http_response`; a box without the `net` schema would fail the CREATE, not the call), restored at the end. `gen_random_uuid()` in place of pgcrypto's `gen_random_bytes` so the mint does not depend on an extension's schema. On hosted (measured 2026-09-23): `has_net = true`, `has_pgcrypto = true`, `assert_expected_grants()` returns clean, `ledger_order_disagreements()` = 6 (the expected six).
4. **The ledger guard reaches the box last.** `ledger_unique_ordinal` is created as the final statement, so the INSERT that records this very file is its first test on the sovereign side.

## Gates

Guards run against 0225 locally, all PASS: rls-isolation-matrix, migration-replay-order, replay-completeness, smoke-sql-language, migration-return-type, assistant-scope, grant, tenancy (the viewer overlay covers the three new tables). CI runs the same set on the push.

## Dependencies, said plainly

- **The sovereign replay only runs when the gateway wait passes.** The 14:00Z cycle printed `nas-supabase: sync: not-run … the gateway did not answer 200 within 150s` while `docker ps` showed `supabase-kong Up 11 days (healthy)` and `/sb/auth/v1/health HTTP 200` from the same run — the wait and the gateway disagree, and that disagreement (DR-0582's open item, `re-review: 2026-09-30`) is now what stands between this file and a GO. Until it is read, 0225 lands on hosted through the migrate lane and waits on the box.
- **Hosted's `sync_learn_catalog` URL is hosted's.** The box's copy will call hosted's edge function; moving that function is DR-0132-class work, `re-review: 2026-10-14`.

## Verification after merge

The next nas-health cycle's status line must read `cutover-sync: post-repoint {"go": true, …}` with `schema_missing_by_name` empty. If it does not, the names it prints are the next file.
