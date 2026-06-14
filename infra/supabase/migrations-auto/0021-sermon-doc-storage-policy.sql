-- =============================================================================
-- 0021 — sermon-documents storage: owner/admin read policy (2026-06-14)
-- =============================================================================
-- BG's sermon .docx files live in the private 'sermon-documents' Storage bucket
-- at path <instance_id>/<sermon_id>/<file>. Only church owner/admin (BG, Darrell,
-- Christina) may read them — matching the admin-only choir_sermon_documents
-- table. This SELECT policy lets an authenticated owner/admin mint a signed URL
-- to open a doc; everyone else is denied. Guarded: if the migration role can't
-- manage storage.objects policies, it skips with a NOTICE (create via dashboard).

DO $$
BEGIN
  DROP POLICY IF EXISTS sermon_documents_admin_read ON storage.objects;
  CREATE POLICY sermon_documents_admin_read ON storage.objects FOR SELECT TO authenticated
    USING (
      bucket_id = 'sermon-documents'
      AND user_role_in_instance( ((storage.foldername(name))[1])::uuid ) IN ('owner','admin')
    );
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'sermon_documents_admin_read: insufficient privilege on storage.objects - create this policy via the Supabase dashboard';
END $$;
