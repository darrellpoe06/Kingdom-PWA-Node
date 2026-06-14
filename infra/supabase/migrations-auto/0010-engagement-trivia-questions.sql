-- =============================================================================
-- 0010 — Engagement: trivia_questions + review lifecycle (auto-lane copy of v2.12)
-- =============================================================================
-- Brings schema-v2.12-engagement-questions.sql into the self-applying migration
-- lane (DR-0054). The shipped Engagement surface + Review tab read/write
-- trivia_questions (app/src/lib/engagement-sync.js); this guarantees the table,
-- the optional answer->question FK, the review RLS, and the realtime stream are
-- present. Runs AFTER 0009 (depends on trivia_answers existing). Idempotent —
-- CREATE ... IF NOT EXISTS, ADD COLUMN IF NOT EXISTS, DROP-then-CREATE policies,
-- CREATE OR REPLACE function, DROP-then-CREATE trigger, guarded publication add.
--
-- DEPENDS ON: 0009 (trivia_answers) + the base schema live in this project
--             (instances, user_in_instance, user_role_in_instance).
-- =============================================================================

CREATE TABLE IF NOT EXISTS trivia_questions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id   uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by    uuid REFERENCES auth.users(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz,
  updated_by    uuid REFERENCES auth.users(id),

  source        text NOT NULL DEFAULT 'standard'
                  CHECK (source IN ('bg-email','youtube','standard')),
  source_ref    text,
  message_date  date,

  prompt          text NOT NULL,
  choices         jsonb NOT NULL,
  correct_choice  text NOT NULL,
  scripture_ref   text,
  note            text,

  status        text NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft','approved','active','archived','rejected')),
  active_date   date,
  approved_by   uuid REFERENCES auth.users(id),
  approved_at   timestamptz
);

CREATE INDEX IF NOT EXISTS trivia_questions_instance_idx ON trivia_questions(instance_id);
CREATE INDEX IF NOT EXISTS trivia_questions_status_idx   ON trivia_questions(instance_id, status);
CREATE INDEX IF NOT EXISTS trivia_questions_active_idx   ON trivia_questions(instance_id, active_date DESC);

ALTER TABLE trivia_answers
  ADD COLUMN IF NOT EXISTS question_uuid uuid REFERENCES trivia_questions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS trivia_answers_question_uuid_idx ON trivia_answers(question_uuid);

ALTER TABLE trivia_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS trivia_questions_member_read    ON trivia_questions;
DROP POLICY IF EXISTS trivia_questions_reviewer_read  ON trivia_questions;
DROP POLICY IF EXISTS trivia_questions_reviewer_write ON trivia_questions;
DROP POLICY IF EXISTS trivia_questions_reviewer_edit  ON trivia_questions;

CREATE POLICY trivia_questions_member_read ON trivia_questions FOR SELECT
  USING (user_in_instance(instance_id) AND status IN ('approved','active','archived'));

CREATE POLICY trivia_questions_reviewer_read ON trivia_questions FOR SELECT
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

CREATE POLICY trivia_questions_reviewer_write ON trivia_questions FOR INSERT
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));

CREATE POLICY trivia_questions_reviewer_edit ON trivia_questions FOR UPDATE
  USING (user_role_in_instance(instance_id) IN ('owner','admin'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));

CREATE OR REPLACE FUNCTION public.engagement_touch_updated_at()
RETURNS trigger AS $fn$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$fn$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trivia_questions_touch_updated ON trivia_questions;
CREATE TRIGGER trivia_questions_touch_updated
  BEFORE UPDATE ON trivia_questions
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

DO $realtime$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime'
       AND schemaname = 'public' AND tablename = 'trivia_questions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE trivia_questions;
  END IF;
END $realtime$;

NOTIFY pgrst, 'reload schema';
