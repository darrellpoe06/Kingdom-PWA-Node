-- =============================================================================
-- 0022 — church team documents (order of service / announcements / calendar)
-- =============================================================================
-- Darrell 2026-06-14: order-of-service, announcements, and the church calendar
-- are the tech + choir teams' weekly get-ready material — the WHOLE team needs
-- a copy (choir-visible), unlike BG's sermons (admin-only). Mirrors the sermon
-- doc model but with choir-team read access.

CREATE TABLE IF NOT EXISTS choir_team_documents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id     uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  doc_date        date,                 -- service/effective date (nullable; calendars may be monthly)
  doc_type        text NOT NULL DEFAULT 'other' CHECK (doc_type IN ('order-of-service','announcements','calendar','other')),
  title           text NOT NULL,
  document_url    text,                 -- storage path or external link
  document_source text CHECK (document_source IN ('email','upload','manual')),
  email_id        text,                 -- dedupe key for the importer (gmail message id)
  created_by      uuid REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz,
  updated_by      uuid REFERENCES auth.users(id)
);
CREATE INDEX IF NOT EXISTS choir_team_documents_instance_idx ON choir_team_documents(instance_id, doc_date DESC);
CREATE UNIQUE INDEX IF NOT EXISTS choir_team_documents_email_uniq ON choir_team_documents(instance_id, email_id) WHERE email_id IS NOT NULL;

ALTER TABLE choir_team_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS choir_team_documents_read   ON choir_team_documents;
DROP POLICY IF EXISTS choir_team_documents_write  ON choir_team_documents;
DROP POLICY IF EXISTS choir_team_documents_update ON choir_team_documents;
DROP POLICY IF EXISTS choir_team_documents_delete ON choir_team_documents;
CREATE POLICY choir_team_documents_read   ON choir_team_documents FOR SELECT
  USING (user_in_choir(instance_id));
CREATE POLICY choir_team_documents_write  ON choir_team_documents FOR INSERT
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY choir_team_documents_update ON choir_team_documents FOR UPDATE
  USING (user_role_in_instance(instance_id) IN ('owner','admin'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY choir_team_documents_delete ON choir_team_documents FOR DELETE
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

DROP TRIGGER IF EXISTS choir_team_documents_touch_updated ON choir_team_documents;
CREATE TRIGGER choir_team_documents_touch_updated
  BEFORE UPDATE ON choir_team_documents
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

-- Realtime for the table.
DO $realtime$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='choir_team_documents')
  THEN ALTER PUBLICATION supabase_realtime ADD TABLE choir_team_documents; END IF;
END $realtime$;

-- Storage: church-team-documents bucket is CHOIR-readable (whole team), unlike
-- the admin-only sermon-documents bucket. Bucket itself is created by the
-- importer (service key); this is the read policy. Guarded.
DO $$
BEGIN
  DROP POLICY IF EXISTS church_team_documents_choir_read ON storage.objects;
  CREATE POLICY church_team_documents_choir_read ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'church-team-documents' AND user_in_choir( ((storage.foldername(name))[1])::uuid ));
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'church_team_documents_choir_read: insufficient privilege on storage.objects - create via dashboard';
END $$;

NOTIFY pgrst, 'reload schema';
