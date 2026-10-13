-- =============================================================================
-- 0109 -- Story Library submissions (the testimony-first curation record)
-- =============================================================================
-- Declared by Darrell 2026-07-21: "keep a running record of potential stories
-- that users begin to become a curator for because they fit the Word... I have
-- personal stories that fit better than anything I've heard imagine others who
-- have experienced life... the opportunity to create after understanding the
-- process... never lie call a parable and testimony whatever they actually are."
--
-- The AI parables shipped first (living-lessons-class.js stories[], PR #991/#992)
-- for training and as the pattern to learn from. THIS is Layer 2: the record a
-- user curates into -- a real, lived TESTIMONY (or an authored PARABLE) that
-- fits a verse, captured, reviewed by a steward, and promoted into a lesson's
-- stories[] once it passes. The client lib (app/src/lib/story-library.js,
-- unit-tested, DR-0076) enforces the never-lie truth-label BEFORE any write:
--   - kind is exactly 'parable' or 'testimony' (never a fiction mislabeled true);
--   - a TESTIMONY claims a real lived event, so it MUST carry attribution
--     (source) AND explicit consent to share -- a parable claims nothing real
--     and needs neither. This mirrors the promotion gate in lesson-flow.test.js.
--
-- ACCESS: instance members read SUBMITTED+ rows (the shared curation queue);
-- an author reads/writes their OWN drafts + submissions; owner/admin (the
-- stewards) review, decline, and promote. Testimony consent + minor protection
-- (DATA-AS-EMPOWERMENT: opt-in per stream, family voice governs) are carried on
-- the row and enforced in the lib; this surface is Tier C (COLG-facing user
-- content) and soaks under `hold` + reviewer-mode before it is trusted.
--
-- DEPENDS ON: schema-v2.1-infra.sql (instances, user_in_instance,
-- user_role_in_instance, engagement_touch_updated_at). ADDITIVE + IDEMPOTENT +
-- realtime-published -- same construction as 0097-ministry-meetings.sql.
-- Word-first: "we are ambassadors for Christ" (2 Cor 5:20); "Let all things be
-- done decently and in order" (1 Cor 14:40); "speaking the truth in love"
-- (Eph 4:15).
-- =============================================================================

CREATE TABLE IF NOT EXISTS story_library_submissions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id      uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  kind             text NOT NULL CHECK (kind IN ('parable','testimony')),
  tone             text NOT NULL DEFAULT 'light' CHECK (tone IN ('light','solemn')),
  title            text NOT NULL,
  body             text NOT NULL,
  verse            text NOT NULL,                    -- the reference/anchor the story serves
  source           text,                             -- attribution; REQUIRED for testimony (enforced in lib)
  consent          boolean NOT NULL DEFAULT false,   -- explicit consent to share; REQUIRED true for testimony
  target_lesson_id text,                             -- which living-lesson it fits (nullable -- unplaced is fine)
  status           text NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft','submitted','reviewed','promoted','declined')),
  review_notes     text,
  submitted_by     uuid REFERENCES auth.users(id),
  submitted_name   text,
  reviewed_by      uuid REFERENCES auth.users(id),
  reviewed_at      timestamptz,
  promoted_at      timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz,
  updated_by       uuid REFERENCES auth.users(id)
);
CREATE INDEX IF NOT EXISTS story_library_instance_idx ON story_library_submissions(instance_id, status, created_at);
CREATE INDEX IF NOT EXISTS story_library_author_idx   ON story_library_submissions(submitted_by);

ALTER TABLE story_library_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS story_library_read   ON story_library_submissions;
DROP POLICY IF EXISTS story_library_write  ON story_library_submissions;
DROP POLICY IF EXISTS story_library_update ON story_library_submissions;
DROP POLICY IF EXISTS story_library_delete ON story_library_submissions;

-- READ: a member sees the shared curation queue (submitted and beyond); an
-- author always sees their own rows, including private drafts.
CREATE POLICY story_library_read ON story_library_submissions FOR SELECT
  USING (
    user_in_instance(instance_id)
    AND (status <> 'draft' OR submitted_by = auth.uid())
  );

-- WRITE: a member inserts their own rows only (submitted_by is themselves).
CREATE POLICY story_library_write ON story_library_submissions FOR INSERT
  WITH CHECK (user_in_instance(instance_id) AND submitted_by = auth.uid());

-- UPDATE: an author edits their own row while it is still a draft or submitted;
-- stewards (owner/admin) may review/decline/promote any row in their instance.
CREATE POLICY story_library_update ON story_library_submissions FOR UPDATE
  USING (
    user_role_in_instance(instance_id) IN ('owner','admin')
    OR (submitted_by = auth.uid() AND status IN ('draft','submitted'))
  )
  WITH CHECK (user_in_instance(instance_id));

-- DELETE: an author removes their own not-yet-promoted row; stewards may remove any.
CREATE POLICY story_library_delete ON story_library_submissions FOR DELETE
  USING (
    user_role_in_instance(instance_id) IN ('owner','admin')
    OR (submitted_by = auth.uid() AND status <> 'promoted')
  );

DROP TRIGGER IF EXISTS story_library_touch_updated ON story_library_submissions;
CREATE TRIGGER story_library_touch_updated BEFORE UPDATE ON story_library_submissions
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

DO $realtime$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND tablename = 'story_library_submissions'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE story_library_submissions;
    END IF;
  END IF;
END
$realtime$;
