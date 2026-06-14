-- =============================================================================
-- 0009 — Engagement wedge: trivia_answers + messages (auto-lane copy of v2.11)
-- =============================================================================
-- Brings schema-v2.11-engagement.sql into the self-applying migration lane
-- (DR-0054 / db-migrate.yml) so the already-shipped Engagement surface
-- (app/src/lib/engagement-sync.js reads/writes trivia_answers + messages) has
-- guaranteed backing tables instead of relying on a one-time Studio paste. The
-- lane re-applies every file every run, so this file is — like the original —
-- fully idempotent (CREATE ... IF NOT EXISTS, DROP-then-CREATE policies, a
-- guarded publication add). A no-op where the tables were already hand-applied.
--
-- DEPENDS ON: the base schema already live in this project (instances table +
--             user_in_instance() helper, from schema-v1 / v1.1 / v2.1-infra).
-- =============================================================================

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

ALTER TABLE trivia_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages       ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS trivia_answers_member_read   ON trivia_answers;
DROP POLICY IF EXISTS trivia_answers_member_insert ON trivia_answers;
CREATE POLICY trivia_answers_member_read   ON trivia_answers FOR SELECT
  USING (user_in_instance(instance_id));
CREATE POLICY trivia_answers_member_insert ON trivia_answers FOR INSERT
  WITH CHECK (user_in_instance(instance_id) AND user_id = auth.uid());

DROP POLICY IF EXISTS messages_member_read   ON messages;
DROP POLICY IF EXISTS messages_member_insert ON messages;
CREATE POLICY messages_member_read   ON messages FOR SELECT
  USING (user_in_instance(instance_id));
CREATE POLICY messages_member_insert ON messages FOR INSERT
  WITH CHECK (user_in_instance(instance_id) AND user_id = auth.uid());

DO $realtime$
BEGIN
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

NOTIFY pgrst, 'reload schema';
