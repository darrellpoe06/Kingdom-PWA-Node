-- =============================================================================
-- 0078 — storage buckets exist by migration, not by hand (2026-07-05)
-- =============================================================================
-- Post-move gap: the 'sermon-documents' and 'church-team-documents' Storage
-- buckets were created BY HAND on the original Supabase project — only their
-- access policies rode migrations (0021, 0022). A database move therefore
-- arrives with the policies but WITHOUT the buckets, so signed-URL reads of
-- legacy document paths and the NAS sermon-backfill writes fail on the new
-- project until someone remembers the hand step. This migration makes the
-- buckets part of the schema: idempotent, safe to re-run, applied by the
-- db-migrate lane wherever the database lives.
--
-- Both buckets are PRIVATE (public = false): reads go through short-lived
-- signed URLs gated by the RLS policies in 0021/0022; nothing is exposed by
-- bucket existence alone.
--
-- NOTE (honest limits): bucket rows are schema; the OBJECTS inside them are
-- files in the storage backend and do NOT ride SQL migrations. If historical
-- uploads did not move with the database, those paths will 404 until re-loaded
-- (the sermon backfill can re-run). This migration removes the structural
-- failure, not the data-copy step.

DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES
    ('sermon-documents', 'sermon-documents', false),
    ('church-team-documents', 'church-team-documents', false)
  ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE '0078: insufficient privilege on storage.buckets - create sermon-documents + church-team-documents (private) via the Supabase dashboard';
END $$;
