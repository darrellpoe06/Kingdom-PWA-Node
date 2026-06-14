-- =============================================================================
-- PoeTech Family OS - schema v2.12 patch: Trivia QUESTIONS + review lifecycle
-- =============================================================================
-- ADDITIVE ONLY. Extends the v2.11 Engagement wedge so trivia questions are
-- GENERATED from a real source (Bishop Gwin's emailed message, primary; the
-- YouTube video of the message, fallback; standard Scripture options, filler)
-- and REVIEWED before they go live - instead of being hardcoded demo content.
--
-- v2.11 shipped trivia_answers (with a free-text question_id) + messages.
-- This patch adds:
--   - trivia_questions : the stored, sourced, reviewable question (draft ->
--                        approved -> active lifecycle + provenance)
--   - trivia_answers.question_uuid : an OPTIONAL FK linking an answer to a
--                        stored question. The original question_id text column
--                        is left intact so existing/demo answers keep working.
--
-- WHO REVIEWS: an instance owner/admin (Darrell or Christina). BG authors the
-- content via his email; he cannot gate publishing while he is preaching, so
-- questions wait in `draft` for an owner/admin to approve in-app. The n8n
-- generation pipeline inserts drafts using the Supabase SERVICE ROLE key,
-- which bypasses RLS; human review + approval happen under the RLS policies
-- below.
--
-- POE binding: score is a MIRROR not a JUDGE; questions trace to what was
-- actually taught (provenance columns). Per RELEASE-TIERS, the autonomous
-- generation pipeline that feeds this table is Tier C and ships INACTIVE with
-- the three brakes (budget + single-instance lock + kill-switch) - this
-- migration only provides the table it writes into.
--
-- DEPENDS ON: schema-v2.1-infra.sql (instances, user_in_instance,
--             user_role_in_instance) + schema-v2.11-engagement.sql.
--
-- IDEMPOTENCY: CREATE ... IF NOT EXISTS; ADD COLUMN IF NOT EXISTS; policies are
--              DROP-then-CREATE; publication add is guarded. Safe to re-run.
-- REVERSIBILITY: see the rollback block at the bottom.
--
-- Paste into Supabase Dashboard -> SQL Editor -> New query -> Run.
-- Project: PoeTech-Family-OS (mjjlevhdufpaplypnqrv).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. TABLE - trivia_questions
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS trivia_questions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id   uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by    uuid REFERENCES auth.users(id),   -- NULL when inserted by the n8n service role
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz,
  updated_by    uuid REFERENCES auth.users(id),

  -- Provenance: every question traces back to what was actually taught.
  source        text NOT NULL DEFAULT 'standard'
                  CHECK (source IN ('bg-email','youtube','standard')),
  source_ref    text,            -- email subject/Message-ID, or YouTube URL
  message_date  date,            -- the Sunday/Wednesday the message was given

  -- Content.
  prompt          text NOT NULL,
  choices         jsonb NOT NULL,    -- [{"key":"a","label":"..."}, ...]
  correct_choice  text NOT NULL,     -- matches a choices[].key
  scripture_ref   text,              -- ESV-first per SCRIPTURE-REFERENCE-STANDARD
  note            text,              -- teaching point shown after answering

  -- Lifecycle: draft -> approved -> active -> archived (or rejected).
  status        text NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft','approved','active','archived','rejected')),
  active_date   date,                -- the day this is the live question
  approved_by   uuid REFERENCES auth.users(id),
  approved_at   timestamptz
);

CREATE INDEX IF NOT EXISTS trivia_questions_instance_idx ON trivia_questions(instance_id);
CREATE INDEX IF NOT EXISTS trivia_questions_status_idx   ON trivia_questions(instance_id, status);
CREATE INDEX IF NOT EXISTS trivia_questions_active_idx   ON trivia_questions(instance_id, active_date DESC);

-- ---------------------------------------------------------------------------
-- 2. LINK - optional FK from an answer to a stored question (additive)
--    Existing answers keep their free-text question_id; generated questions
--    also set question_uuid so scoring/analytics can join cleanly.
-- ---------------------------------------------------------------------------

ALTER TABLE trivia_answers
  ADD COLUMN IF NOT EXISTS question_uuid uuid REFERENCES trivia_questions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS trivia_answers_question_uuid_idx ON trivia_answers(question_uuid);

-- ---------------------------------------------------------------------------
-- 3. RLS - members see only LIVE questions; owners/admins review drafts.
--    NOTE: this gates review on the instance member ROLE. The approver(s)
--    (Darrell / Christina) must hold role 'owner' or 'admin' in
--    instance_members for the 'poe-family' instance. Verify with:
--      SELECT user_id, role FROM instance_members WHERE instance_id = <poe-family>;
-- ---------------------------------------------------------------------------

ALTER TABLE trivia_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS trivia_questions_member_read    ON trivia_questions;
DROP POLICY IF EXISTS trivia_questions_reviewer_read  ON trivia_questions;
DROP POLICY IF EXISTS trivia_questions_reviewer_write ON trivia_questions;
DROP POLICY IF EXISTS trivia_questions_reviewer_edit  ON trivia_questions;

-- Regular members: only approved/active/archived (never drafts/rejected).
CREATE POLICY trivia_questions_member_read ON trivia_questions FOR SELECT
  USING (user_in_instance(instance_id) AND status IN ('approved','active','archived'));

-- Reviewers (owner/admin): see everything, including drafts.
CREATE POLICY trivia_questions_reviewer_read ON trivia_questions FOR SELECT
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- Reviewers may insert (manual add) and update (approve / edit / reject).
CREATE POLICY trivia_questions_reviewer_write ON trivia_questions FOR INSERT
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));

CREATE POLICY trivia_questions_reviewer_edit ON trivia_questions FOR UPDATE
  USING (user_role_in_instance(instance_id) IN ('owner','admin'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));

-- ---------------------------------------------------------------------------
-- 4. updated_at touch trigger (reviewer edits)
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- 5. REALTIME - stream trivia_questions INSERT/UPDATE so the Review tab and
--    the live-question card update without a manual refresh.
-- ---------------------------------------------------------------------------

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

-- =============================================================================
-- VERIFY (read-only - run after applying):
--   SELECT tablename FROM pg_tables
--    WHERE schemaname='public' AND tablename='trivia_questions';   -- 1 row
--
--   SELECT column_name FROM information_schema.columns
--    WHERE table_name='trivia_answers' AND column_name='question_uuid';  -- 1 row
--
--   SELECT policyname, cmd FROM pg_policies
--    WHERE tablename='trivia_questions' ORDER BY cmd;
--   -- expect member_read (SELECT), reviewer_read (SELECT),
--   --        reviewer_write (INSERT), reviewer_edit (UPDATE).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- ROLLBACK (additive change is fully reversible):
--   ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS trivia_questions;
--   DROP TRIGGER IF EXISTS trivia_questions_touch_updated ON trivia_questions;
--   ALTER TABLE trivia_answers DROP COLUMN IF EXISTS question_uuid;
--   DROP TABLE IF EXISTS trivia_questions;
--   -- (engagement_touch_updated_at() left in place; harmless if unused.)
-- ---------------------------------------------------------------------------
-- End of v2.12 patch.
-- =============================================================================
