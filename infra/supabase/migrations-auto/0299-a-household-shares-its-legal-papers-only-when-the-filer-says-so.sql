-- =============================================================================
-- 0299 — a household shares its legal papers only when the filer says so (DR-1077)
-- =============================================================================
-- Darrell, 2026-10-16: "We are in the same family and need our records to be
-- in sync with what we are doing and also some users will not want that... we
-- want all opinions to be able to be used without any issues."
--
-- WHAT WAS THERE. 0180's legal shelf is creator-only on every verb. Paper that
-- Christina files for the make-it-official steps (DR-1076) shows on her
-- account and nowhere else, so a family working one plan keeps two shelves
-- that never meet.
--
-- WHAT THIS DOES. One flag per document, `shared_with_household`, default
-- FALSE. Both choices are first-class:
--   * a person who never shares keeps exactly 0180's behaviour, unchanged;
--   * a person who shares a document lets the OTHER MEMBERS of the household
--     it was filed in read it and open its file. Nobody else.
-- Sharing never hands over the pen: update and delete stay with the filer, as
-- the church shelf (0209 `shared_with_office`) already does.
--
-- THE DESIGN CHOICE THAT MATTERS: 0180's READ POLICY IS LEFT EXACTLY AS IT IS.
-- The device sync (lib/legal-documents-sync.js via table-sync.js) pulls every
-- row RLS returns for the instance and stamps `created_by = me` on anything it
-- uploads. Widening the table's SELECT would pour other people's shared rows
-- into the reader's own store, where a later upload could re-file them as the
-- reader's own. So shared rows reach a reader ONLY through the read-only
-- function below, never through the table. The sync cannot see them.
--
-- WHO "THE HOUSEHOLD" IS: members of the document's instance with role
-- owner, admin or member. Viewers (the read-only lens, DR-0241), assistants
-- (DR-0271), specialists and successors are NOT the household for privileged
-- legal paper and never receive it. Family members join poe-family as
-- 'member' (0001/0012), so owner/admin alone would have excluded them.
--
-- THE 0131 CLASS, closed here: a non-member's role is NULL and `NULL IN (...)`
-- is NULL, never TRUE; every role test is coalesced.
--
-- Idempotent: ADD COLUMN IF NOT EXISTS, DROP POLICY IF EXISTS, CREATE OR
-- REPLACE. Adds no table, so the overlays need no re-run (tenancy-guard rule).
-- APPLY: rides db-migrate on merge (DR-0084). Proven by
-- infra/supabase/tests/0299-legal-household-share-smoke.sql (rls-isolation,
-- leg legal-household).
-- =============================================================================

ALTER TABLE public.legal_documents
  ADD COLUMN IF NOT EXISTS shared_with_household boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.legal_documents.shared_with_household IS
  'FALSE by default (0299). TRUE lets the other owner/admin/member people of this row''s instance read it through household_shared_legal_documents(); the table''s own SELECT stays creator-only.';

-- ---------------------------------------------------------------------------
-- 1. A share can only point at a household the filer belongs to.
-- ---------------------------------------------------------------------------
-- 0180's write checks bind created_by but not instance_id. Harmless while
-- nothing reads across accounts; once a flag can expose a row to an instance,
-- a filer must not be able to aim it at a household that is not theirs.
DROP POLICY IF EXISTS legal_documents_write ON public.legal_documents;
CREATE POLICY legal_documents_write ON public.legal_documents FOR INSERT
  TO authenticated WITH CHECK (
    created_by = auth.uid()
    AND (shared_with_household = false OR public.user_in_instance(instance_id))
  );

DROP POLICY IF EXISTS legal_documents_update ON public.legal_documents;
CREATE POLICY legal_documents_update ON public.legal_documents FOR UPDATE
  TO authenticated USING (created_by = auth.uid())
  WITH CHECK (
    created_by = auth.uid()
    AND (shared_with_household = false OR public.user_in_instance(instance_id))
  );

-- ---------------------------------------------------------------------------
-- 2. The one rule, in one place: may the caller read this shared row?
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.legal_document_visible_to_household(
  doc_instance uuid, doc_owner uuid, doc_shared boolean
) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(doc_shared, false)
     AND auth.uid() IS NOT NULL
     AND doc_owner IS DISTINCT FROM auth.uid()
     AND coalesce(public.user_role_in_instance(doc_instance), '') IN ('owner', 'admin', 'member')
     AND EXISTS (
       SELECT 1 FROM public.instance_members im
        WHERE im.instance_id = doc_instance
          AND im.user_id = doc_owner
          AND im.role IN ('owner', 'admin', 'member')
     );
$$;

REVOKE ALL ON FUNCTION public.legal_document_visible_to_household(uuid, uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.legal_document_visible_to_household(uuid, uuid, boolean) TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. What the household has shared with me — read-only, never my own rows.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.household_shared_legal_documents()
RETURNS TABLE (
  id uuid, instance_id uuid, created_by uuid, shared_by text,
  slug text, category text, doc_type text, label text, date_of date,
  privileged boolean, where_filed text, note text,
  file_name text, file_size bigint, storage_path text,
  created_at timestamptz, updated_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ld.id, ld.instance_id, ld.created_by,
         coalesce(nullif(btrim(im.display_name), ''), 'A member of your household') AS shared_by,
         ld.slug, ld.category, ld.doc_type, ld.label, ld.date_of,
         ld.privileged, ld.where_filed, ld.note,
         ld.file_name, ld.file_size, ld.storage_path,
         ld.created_at, ld.updated_at
    FROM public.legal_documents ld
    LEFT JOIN public.instance_members im
      ON im.instance_id = ld.instance_id AND im.user_id = ld.created_by
   WHERE public.legal_document_visible_to_household(ld.instance_id, ld.created_by, ld.shared_with_household)
   ORDER BY ld.created_at DESC, ld.id;
$$;

REVOKE ALL ON FUNCTION public.household_shared_legal_documents() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.household_shared_legal_documents() TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. The file opens for the same people, and only while it is shared.
-- ---------------------------------------------------------------------------
-- A storage policy's subquery runs under the READER's RLS, and the table's
-- SELECT is creator-only, so the check goes through the definer function.
-- This is an ADDITIONAL permissive SELECT policy; 0180's four owner-only
-- object policies are untouched, and no write verb is widened.
CREATE OR REPLACE FUNCTION public.legal_object_shared_with_me(object_name text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.legal_documents ld
     WHERE ld.storage_path = object_name
       AND public.legal_document_visible_to_household(ld.instance_id, ld.created_by, ld.shared_with_household)
  );
$$;

REVOKE ALL ON FUNCTION public.legal_object_shared_with_me(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.legal_object_shared_with_me(text) TO authenticated;

DO $$
BEGIN
  DROP POLICY IF EXISTS legal_documents_object_household_read ON storage.objects;
  CREATE POLICY legal_documents_object_household_read ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'legal-documents' AND public.legal_object_shared_with_me(name));
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE '0299: insufficient privilege on storage.objects - create legal_documents_object_household_read via the dashboard';
END $$;

NOTIFY pgrst, 'reload schema';
