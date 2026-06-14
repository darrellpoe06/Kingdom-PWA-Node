-- =============================================================================
-- 0020 — allow source='email' on choir_sermons (2026-06-14)
-- =============================================================================
-- Sermons created by the Gmail importer (BG's emailed PROCLAIM documents) carry
-- source='email'; the original 0011 CHECK only allowed youtube/upload/manual.
-- Add 'email' (and keep the rest). Idempotent (drop + re-add the named CHECK).

ALTER TABLE choir_sermons DROP CONSTRAINT IF EXISTS choir_sermons_source_check;
ALTER TABLE choir_sermons ADD CONSTRAINT choir_sermons_source_check
  CHECK (source IN ('youtube','upload','manual','email'));

NOTIFY pgrst, 'reload schema';
