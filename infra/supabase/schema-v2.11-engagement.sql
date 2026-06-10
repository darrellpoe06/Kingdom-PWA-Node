-- =============================================================================
-- PoeTech Family OS - schema v2.11 patch: Engagement wedge
-- =============================================================================
-- ADDITIVE ONLY. Two new tables for the in-app Engagement surface:
--   - trivia_answers : one row per member answer to a daily trivia question
--   - messages       : a basic two-way message thread
--
-- Both tables COPY the `feedback` table's multi-tenant RLS shape verbatim
-- (see schema-v1.sql feedback table ~line 199 + its policies ~line 312,
--  renamed tenant_id -> instance_id and user_in_tenant -> user_in_instance
--  by schema-v2.1-infra.sql). Members of an instance can read + insert;
-- there is NO public/anon read of other members' rows.
--
-- Both tables are added to the `supabase_realtime` publication so the PWA
-- can stream INSERTs via postgres_changes, exactly like the feedback stream.
--
-- DEPENDS ON: schema-v1.sql + schema-v1.1-tenant-join.sql + schema-v2.1-infra.sql
--             (provides the `instances` table + user_in_instance() helper).
--
-- IDEMPOTENCY: every CREATE uses IF NOT EXISTS; policies are DROP-then-CREATE;
--              the publication add is guarded by a pg_publication_tables check.
--              Safe to re-run.
--
-- REVERSIBILITY: see the commented rollback block at the bottom.
--
-- Paste into Supabase Dashboard -> SQL Editor -> New query -> Run.
-- Project: PoeTech-Family-OS (mjjlevhdufpaplypnqrv).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. TABLES
-- ---------------------------------------------------------------------------

-- Trivia answers. question_id is a stable app-side string (e.g.
-- 'john18-2026-06-10-q1'); the question text itself lives in the PWA as
-- non-sensitive demo content, so nothing here carries private data.
CREATE TABLE IF NOT EXISTS trivia_answers (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id  uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users(id),
  display_name text NOT NULL,
  question_id  text NOT NULL,
  answer       text NOT NULL,
  is_correct   boolean NOT NULL DEFAULT false,
  answered_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS trivia_answers_instance_idx ON trivia_answers(instance_id);
CREATE INDEX IF NOT EXISTS trivia_answers_answered_idx ON trivia_answers(answered_at DESC);

-- Basic two-way message thread. `thread` lets one instance carry more than
-- one conversation lane; the Engagement surface uses a single default lane.
CREATE TABLE IF NOT EXISTS messages (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id  uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users(id),
  display_name text NOT NULL,
  body         text NOT NULL,
  thread       text NOT NULL DEFAULT 'general',
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS messages_instance_idx ON messages(instance_id);
CREATE INDEX IF NOT EXISTS messages_thread_idx   ON messages(instance_id, thread, created_at DESC);

-- ---------------------------------------------------------------------------
-- 2. RLS - copy the feedback shape: members read, members insert their own.
--    (feedback also has an admin UPDATE policy for triage; trivia + messages
--     are append-only, so they intentionally have no UPDATE/DELETE policy -
--     with RLS enabled and no matching policy, those actions are denied.)
-- ---------------------------------------------------------------------------

ALTER TABLE trivia_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages       ENABLE ROW LEVEL SECURITY;

-- trivia_answers
DROP POLICY IF EXISTS trivia_answers_member_read   ON trivia_answers;
DROP POLICY IF EXISTS trivia_answers_member_insert ON trivia_answers;
CREATE POLICY trivia_answers_member_read   ON trivia_answers FOR SELECT
  USING (user_in_instance(instance_id));
CREATE POLICY trivia_answers_member_insert ON trivia_answers FOR INSERT
  WITH CHECK (user_in_instance(instance_id) AND user_id = auth.uid());

-- messages
DROP POLICY IF EXISTS messages_member_read   ON messages;
DROP POLICY IF EXISTS messages_member_insert ON messages;
CREATE POLICY messages_member_read   ON messages FOR SELECT
  USING (user_in_instance(instance_id));
CREATE POLICY messages_member_insert ON messages FOR INSERT
  WITH CHECK (user_in_instance(instance_id) AND user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 3. REALTIME - add both tables to the supabase_realtime publication so the
--    PWA's postgres_changes streams fire on INSERT (per-table toggle). Only
--    INSERT is streamed, so the default REPLICA IDENTITY is sufficient (the
--    feedback stream relies on the same).
-- ---------------------------------------------------------------------------

DO $realtime$
BEGIN
  -- The publication is created by Supabase on project provisioning. Guard in
  -- case a bare/self-hosted Postgres lacks it.
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime'
       AND schemaname = 'public' AND tablename = 'trivia_answers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE trivia_answers;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime'
       AND schemaname = 'public' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;
END $realtime$;

-- =============================================================================
-- VERIFY (read-only - run after applying):
--   SELECT tablename FROM pg_tables
--    WHERE schemaname='public' AND tablename IN ('trivia_answers','messages');
--   -- expect 2 rows.
--
--   SELECT tablename FROM pg_publication_tables
--    WHERE pubname='supabase_realtime'
--      AND tablename IN ('trivia_answers','messages')
--    ORDER BY tablename;
--   -- expect both: messages, trivia_answers.
--
--   SELECT tablename, policyname, cmd FROM pg_policies
--    WHERE tablename IN ('trivia_answers','messages') ORDER BY tablename, cmd;
--   -- expect member_read (SELECT) + member_insert (INSERT) on each.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- ROLLBACK (additive change is fully reversible - run to undo):
--   ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS messages;
--   ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS trivia_answers;
--   DROP TABLE IF EXISTS messages;
--   DROP TABLE IF EXISTS trivia_answers;
-- ---------------------------------------------------------------------------
-- End of v2.11 patch.
-- =============================================================================
