-- =============================================================================
-- 0300 — the office opens what a member shared with it (DR-1086)
-- =============================================================================
-- MEASURED 2026-10-17 (the document-store inventory behind DR-1086): 0209 lets
-- the church office READ a member's document row once the member shares it
-- (church_documents_read: shared_with_office AND owner/admin), but the storage
-- policy for the file only ever admits the filer's own folder
-- ((storage.foldername(name))[2] = auth.uid()). So the office saw the paper on
-- the roll, tapped Open, and was refused: a promise the row made and the file
-- broke. The in-app viewer (DR-1078) now names that refusal plainly, which is
-- how it would have surfaced.
--
-- WHAT THIS DOES. One ADDITIONAL permissive SELECT policy on storage.objects,
-- for the church-documents bucket only, through a definer function, because a
-- storage policy's subquery runs under the reader's RLS. The function admits
-- exactly what the row policy already admits for the office: the member
-- shared it, and the reader is owner/admin of that church. 0209's own object
-- policies are untouched, and no write verb is widened.
--
-- THE 0131 CLASS: a non-member's role is NULL; the role test is coalesced.
-- Idempotent: CREATE OR REPLACE, DROP POLICY IF EXISTS. Adds no table.
-- Proven by infra/supabase/tests/0300-office-opens-shared-smoke.sql.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.church_object_shared_with_my_office(object_name text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.church_documents cd
     WHERE cd.storage_path = object_name
       AND cd.shared_with_office = true
       AND coalesce(public.user_role_in_instance(cd.instance_id), '') IN ('owner', 'admin')
  );
$$;

REVOKE ALL ON FUNCTION public.church_object_shared_with_my_office(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.church_object_shared_with_my_office(text) TO authenticated;

DO $$
BEGIN
  DROP POLICY IF EXISTS church_documents_objects_office_read ON storage.objects;
  CREATE POLICY church_documents_objects_office_read ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'church-documents' AND public.church_object_shared_with_my_office(name));
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE '0300: insufficient privilege on storage.objects - create church_documents_objects_office_read via the dashboard';
END $$;

NOTIFY pgrst, 'reload schema';
