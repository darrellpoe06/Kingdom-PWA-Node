-- =============================================================================
-- 0024 — restore `authenticated` table grants (2026-06-16)  [INCIDENT FIX]
-- =============================================================================
-- INCIDENT: the Choir tab could not save. Choir -> Schedule / Sermons / links
-- all failed with "Could not save (insert-error)", and choir lists read empty.
--
-- ROOT CAUSE (verified, not guessed): the `authenticated` Postgres role was
-- MISSING its table privileges on the tables created by the later migrations
-- (choir_* from 0011, the engagement trivia/messages tables, contractors_1099,
-- and — once it applies — the 0023 conference set). RLS was fine and the user
-- WAS owner of the instance; the failure was one layer below RLS. Reproduced as
-- the real signed-in user (owner, user_in_choir = true) hitting choir_schedule:
--
--   INSERT choir_schedule -> 403  code 42501
--   "permission denied for table choir_schedule"
--   hint: "GRANT SELECT, INSERT ON public.choir_schedule TO authenticated;"
--
-- 42501 is a table-GRANT denial, NOT an RLS denial — Postgres checks the role's
-- table privilege BEFORE it ever evaluates a row policy. The same 403 hit SELECT
-- on every choir_* table, so the tab also read empty. Tables created earlier
-- (accounts, debts, projects, rentals, feedback...) already carry the grant and
-- worked — which is exactly why this looked like "only Choir is broken."
--
-- WHY IT HAPPENED: this project lost its Supabase-default
-- `GRANT ... TO anon, authenticated` at some point. 0019-restore-service-role-
-- grants restored it for `service_role` ONLY (it explicitly says "anon/
-- authenticated are unaffected"); nothing ever restored `authenticated`. Every
-- table the migration lane has created since then shipped with no authenticated
-- grant. This migration restores the default for `authenticated` AND sets the
-- default-privilege so future tables created by the lane inherit it — so this
-- class of bug cannot recur silently (guarded by scripts/grant-guard.mjs).
--
-- NO LEAK (RLS-safe): granting table privileges does NOT bypass RLS. RLS still
-- filters every row to the caller's instance. Row-Level Security is ENABLED on
-- every instance-scoped table — proven on each build by tenancy-guard (Check A:
-- "every table that declares instance_id has RLS enabled") — and the choir /
-- conference policies are instance-scoped (0011 user_in_choir/user_role_in_
-- instance; conference-rls-guard). This grant restores the SAME model the
-- already-working tables (accounts/rentals/...) use: grant to authenticated,
-- RLS gates the rows. We do NOT touch `anon` (no new logged-out exposure).
--
-- IDEMPOTENT: GRANT / ALTER DEFAULT PRIVILEGES are declarative and safe to
-- re-run (the lane re-applies every file each run). Tier A (production bug fix).

-- 1. Schema usage (already present for authenticated; asserted idempotently).
GRANT USAGE ON SCHEMA public TO authenticated;

-- 2. Restore DML on every EXISTING public table (catches choir_*, trivia,
--    messages, contractors_1099, and — when 0023 has applied first in the same
--    lane run — the conference tables). DML only (no TRUNCATE/REFERENCES/TRIGGER)
--    — least privilege; RLS does the row filtering.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- 3. Sequences (for any serial-backed inserts; choir uses uuid PKs, harmless here).
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 4. Recurrence-proof: future tables created by the lane role inherit the grant,
--    so the NEXT new instance-scoped table can never ship grant-less again.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO authenticated;

-- 5. Belt-and-suspenders: re-assert RLS is ENABLED on the instance-scoped tables
--    this grant newly reaches, so the table privilege can never outrun the row
--    gate. All already enabled (0011 / 0009 / 0010) — these are no-ops that make
--    the no-leak guarantee local to this file.
ALTER TABLE choir_members        ENABLE ROW LEVEL SECURITY;
ALTER TABLE choir_songs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE choir_schedule       ENABLE ROW LEVEL SECURITY;
ALTER TABLE choir_messages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE choir_absences       ENABLE ROW LEVEL SECURITY;
ALTER TABLE choir_sermons        ENABLE ROW LEVEL SECURITY;
ALTER TABLE choir_resources      ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
