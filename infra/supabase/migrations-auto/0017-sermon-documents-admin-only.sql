-- =============================================================================
-- 0017 — sermon documents are owner/admin-only; unpreached drafts too
-- =============================================================================
-- Darrell 2026-06-14: "BG, myself and Christina will be the only eyes on BG's
-- sermon documents, before his sermons and after." The document link added in
-- 0016 sat on choir_sermons, which every choir member can read — wrong boundary.
-- This moves documents into their OWN owner/admin-only table (only the church
-- owner/admin — BG, Darrell, Christina — can read or write them) and restricts
-- DRAFT sermons (unpreached, in-prep) to owner/admin as well. The historical
-- preached messages + videos stay visible to the choir; the prep documents and
-- in-progress drafts do not. P14 trust boundary; must hold BEFORE any document
-- is ingested. Idempotent.

-- 1. Admin-only document store, one per sermon.
CREATE TABLE IF NOT EXISTS choir_sermon_documents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id     uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  sermon_id       uuid NOT NULL REFERENCES choir_sermons(id) ON DELETE CASCADE,
  document_url    text NOT NULL,
  document_source text CHECK (document_source IN ('email','upload','manual')),
  created_by      uuid REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz,
  updated_by      uuid REFERENCES auth.users(id)
);
CREATE UNIQUE INDEX IF NOT EXISTS choir_sermon_documents_sermon_uniq ON choir_sermon_documents(sermon_id);

-- 2. Documents leave the choir-readable table (0016 columns; empty so far).
ALTER TABLE choir_sermons DROP COLUMN IF EXISTS document_url;
ALTER TABLE choir_sermons DROP COLUMN IF EXISTS document_source;

-- 3. RLS — documents: owner/admin only (the three eyes).
ALTER TABLE choir_sermon_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS choir_sermon_documents_read   ON choir_sermon_documents;
DROP POLICY IF EXISTS choir_sermon_documents_write  ON choir_sermon_documents;
DROP POLICY IF EXISTS choir_sermon_documents_update ON choir_sermon_documents;
DROP POLICY IF EXISTS choir_sermon_documents_delete ON choir_sermon_documents;
CREATE POLICY choir_sermon_documents_read   ON choir_sermon_documents FOR SELECT
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY choir_sermon_documents_write  ON choir_sermon_documents FOR INSERT
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY choir_sermon_documents_update ON choir_sermon_documents FOR UPDATE
  USING (user_role_in_instance(instance_id) IN ('owner','admin'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY choir_sermon_documents_delete ON choir_sermon_documents FOR DELETE
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- 4. RLS — choir_sermons: members see only PREACHED messages (active/archived);
--    owner/admin see everything, including unpreached drafts.
DROP POLICY IF EXISTS choir_sermons_read          ON choir_sermons;
DROP POLICY IF EXISTS choir_sermons_reviewer_read ON choir_sermons;
CREATE POLICY choir_sermons_read ON choir_sermons FOR SELECT
  USING (user_in_choir(instance_id) AND status IN ('active','archived'));
CREATE POLICY choir_sermons_reviewer_read ON choir_sermons FOR SELECT
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- 5. touch trigger + realtime.
DROP TRIGGER IF EXISTS choir_sermon_documents_touch_updated ON choir_sermon_documents;
CREATE TRIGGER choir_sermon_documents_touch_updated
  BEFORE UPDATE ON choir_sermon_documents
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

DO $realtime$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'choir_sermon_documents'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE choir_sermon_documents;
  END IF;
END $realtime$;

NOTIFY pgrst, 'reload schema';
