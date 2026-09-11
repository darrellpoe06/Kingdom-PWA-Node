-- =============================================================================
-- 0201 — The household keeps its own record, and its own shelf of documents
-- (DR-0357)
-- =============================================================================
-- Darrell 2026-09-11: "Create the same type of intake forms for PoeTech...
-- We also need a PoeTech family documents upload."
--
-- Two things, both scoped to the family's own instance:
--
-- 1. household_records — ONE record per instance, a cell for every question on
--    the household intake (lib/household-intake.js), filled by any adult with
--    a seat, at any time, patched cell by cell exactly as a TLC packet is
--    (0198), and acknowledged in place with the office's own clock (0199).
--
-- 2. family_documents — the household's shelf. A row is EITHER a file in the
--    private `family-documents` bucket OR a pointer to where the paper lives,
--    following the legal shelves (0180): both are first-class, and a row that
--    is neither is refused.
--
-- THE WALLS, each from a standing decision rather than an opinion:
--   * No account, routing or card number; no password; no Social Security
--     number; no diagnosis. The patch guard refuses them by key, the way
--     0198's does, so no path can write one.
--   * A document is PRIVATE TO WHOEVER PUT IT THERE unless they share it with
--     the household. 0180 decided this for the legal shelves for a reason a
--     family app must honor: a household member must not read another's will,
--     custody file or medical letter by default. `shared_with_household`
--     starts false and only its creator can flip it.
--   * No child-facing data stream. Nothing here is keyed to a minor, and the
--     intake counts children in ranges rather than naming them; a child's own
--     row stays on the Family Roster under a guardian (DR-0093), where the
--     consent/assent flow is still owed.
--   * Files are POINTERS in the row and BYTES in a private bucket, opened by a
--     short-lived signed URL. Nothing in this migration claims encryption at
--     rest with a key only the family holds, because that is not built — the
--     covenant says so in words (DR-0329's honesty rule).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. THE HOUSEHOLD RECORD
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.household_records (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id  uuid NOT NULL UNIQUE REFERENCES instances(id) ON DELETE CASCADE,
  record       jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_by   uuid REFERENCES auth.users(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT household_records_object_chk CHECK (jsonb_typeof(record) = 'object'),
  -- The same refusal as the patch guard, expressed where nothing can bypass it.
  CONSTRAINT household_records_no_secrets_chk CHECK (
    NOT (record ? 'accountNumber' OR record ? 'routingNumber' OR record ? 'cardNumber'
      OR record ? 'password' OR record ? 'ssn' OR record ? 'socialSecurityNumber'
      OR record ? 'diagnosis')
  )
);

CREATE INDEX IF NOT EXISTS household_records_instance_idx ON public.household_records(instance_id);

ALTER TABLE public.household_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS household_records_member_read ON public.household_records;
CREATE POLICY household_records_member_read ON public.household_records FOR SELECT TO authenticated
  USING (public.user_in_instance(instance_id));
-- No write policy: every write goes through the functions below.

-- The keys a patch may never carry.
CREATE OR REPLACE FUNCTION public.household_patch_guard(patch_in jsonb)
RETURNS void
LANGUAGE plpgsql IMMUTABLE
AS $$
BEGIN
  IF patch_in IS NULL OR jsonb_typeof(patch_in) <> 'object' THEN
    RAISE EXCEPTION 'a patch must be an object of named cells';
  END IF;
  IF patch_in ? 'acknowledgments' THEN
    RAISE EXCEPTION 'a signature is made on the document itself, never through a patch';
  END IF;
  IF patch_in ? 'accountNumber' OR patch_in ? 'routingNumber' OR patch_in ? 'cardNumber' THEN
    RAISE EXCEPTION 'this app never holds an account, routing or card number';
  END IF;
  IF patch_in ? 'password' THEN RAISE EXCEPTION 'a password is never stored'; END IF;
  IF patch_in ? 'ssn' OR patch_in ? 'socialSecurityNumber' THEN
    RAISE EXCEPTION 'a Social Security number is never stored in a household record';
  END IF;
  IF patch_in ? 'diagnosis' THEN
    RAISE EXCEPTION 'this app is not a medical record and holds no diagnosis';
  END IF;
  IF (SELECT count(*) FROM jsonb_object_keys(patch_in)) > 80 THEN
    RAISE EXCEPTION 'too many cells in one patch';
  END IF;
END;
$$;

-- Read (and start, on first read by a member) the household's own record.
CREATE OR REPLACE FUNCTION public.household_record_read(instance_in uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_instance uuid;
  v_row      public.household_records%ROWTYPE;
  v_name     text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'sign in first'; END IF;
  v_instance := coalesce(instance_in, nullif(public.my_default_instance_role()->>'instance_id','')::uuid);
  IF v_instance IS NULL THEN RAISE EXCEPTION 'no household to read'; END IF;
  IF NOT public.user_in_instance(v_instance) THEN RAISE EXCEPTION 'that is not your household'; END IF;

  SELECT * INTO v_row FROM public.household_records WHERE instance_id = v_instance;
  IF v_row.id IS NULL THEN
    INSERT INTO public.household_records (instance_id, record, started_by)
    VALUES (v_instance, '{}'::jsonb, auth.uid())
    ON CONFLICT (instance_id) DO UPDATE SET updated_at = public.household_records.updated_at
    RETURNING * INTO v_row;
  END IF;

  SELECT display_name INTO v_name FROM instances WHERE id = v_instance;
  RETURN jsonb_build_object(
    'record_id', v_row.id, 'instance_id', v_row.instance_id, 'household_name', v_name,
    'record', v_row.record, 'updated_at', v_row.updated_at, 'created_at', v_row.created_at,
    'my_role', coalesce(public.user_role_in_instance(v_instance), ''));
END;
$$;
REVOKE ALL ON FUNCTION public.household_record_read(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.household_record_read(uuid) TO authenticated;

-- Fill or correct named cells. Owner/admin of the household; a viewer cannot.
CREATE OR REPLACE FUNCTION public.household_record_patch(
  patch_in    jsonb,
  note_in     text DEFAULT NULL,
  instance_in uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_instance uuid;
  v_role     text;
  v_row      public.household_records%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'sign in first'; END IF;
  PERFORM public.household_patch_guard(patch_in);
  v_instance := coalesce(instance_in, nullif(public.my_default_instance_role()->>'instance_id','')::uuid);
  IF v_instance IS NULL THEN RAISE EXCEPTION 'no household to fill'; END IF;
  v_role := coalesce(public.user_role_in_instance(v_instance), '');
  IF coalesce(v_role, '') NOT IN ('owner','admin') THEN
    RAISE EXCEPTION 'only an adult with a seat in this household may fill its record';
  END IF;

  INSERT INTO public.household_records (instance_id, record, started_by)
  VALUES (v_instance, patch_in, auth.uid())
  ON CONFLICT (instance_id) DO UPDATE
     SET record = coalesce(public.household_records.record, '{}'::jsonb) || patch_in,
         updated_at = now()
  RETURNING * INTO v_row;

  INSERT INTO audit_log (instance_id, user_id, action, entity_type, entity_id, from_value, to_value, note)
  VALUES (v_instance, auth.uid(), 'update', 'household_record', v_row.id,
          jsonb_build_object('by', v_role),
          jsonb_build_object('cells', (SELECT jsonb_agg(k) FROM jsonb_object_keys(patch_in) k)),
          coalesce(nullif(left(btrim(coalesce(note_in, '')), 500), ''), 'household_record_patch'));

  RETURN jsonb_build_object('record_id', v_row.id, 'instance_id', v_row.instance_id,
                            'record', v_row.record, 'updated_at', v_row.updated_at);
END;
$$;
REVOKE ALL ON FUNCTION public.household_record_patch(jsonb, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.household_record_patch(jsonb, text, uuid) TO authenticated;

-- Sign the household's own covenant, in place, with the server's clock (0199's rule).
CREATE OR REPLACE FUNCTION public.household_record_acknowledge(
  key_in         text,
  signature_in   text,
  doc_version_in text DEFAULT NULL,
  attestation_in text DEFAULT NULL,
  agreed_at_in   text DEFAULT NULL,
  instance_in    uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_instance uuid;
  v_role     text;
  v_row      public.household_records%ROWTYPE;
  v_stamp    text := to_char(clock_timestamp() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  v_prev     jsonb;
  v_rec      jsonb;
  v_sig      text := left(btrim(coalesce(signature_in, '')), 200);
  v_att      text := left(btrim(coalesce(attestation_in, '')), 500);
  v_ver      text := left(btrim(coalesce(doc_version_in, '')), 40);
  v_when     text := left(btrim(coalesce(agreed_at_in, '')), 40);
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'sign in first'; END IF;
  IF key_in IS NULL OR key_in <> 'householdCovenant' THEN RAISE EXCEPTION 'no such document to acknowledge'; END IF;
  IF v_sig = '' THEN RAISE EXCEPTION 'sign by typing your full legal name'; END IF;
  IF v_att = '' THEN RAISE EXCEPTION 'the acknowledgment sentence must be checked'; END IF;

  v_instance := coalesce(instance_in, nullif(public.my_default_instance_role()->>'instance_id','')::uuid);
  IF v_instance IS NULL THEN RAISE EXCEPTION 'no household to sign for'; END IF;
  v_role := coalesce(public.user_role_in_instance(v_instance), '');
  IF coalesce(v_role, '') NOT IN ('owner','admin') THEN
    RAISE EXCEPTION 'only an adult with a seat in this household may sign for it';
  END IF;

  SELECT * INTO v_row FROM public.household_records WHERE instance_id = v_instance;
  IF v_row.id IS NULL THEN
    INSERT INTO public.household_records (instance_id, record, started_by)
    VALUES (v_instance, '{}'::jsonb, auth.uid()) RETURNING * INTO v_row;
  END IF;

  v_prev := coalesce(v_row.record->'acknowledgments'->key_in, '{}'::jsonb);
  v_rec := jsonb_build_object(
    'agreed', true,
    'signature', v_sig,
    'signedOn', left(v_stamp, 10),
    'signedAt', CASE WHEN v_when <> '' THEN v_when ELSE v_stamp END,
    'docVersion', v_ver,
    'attestation', v_att,
    'agreedAt', CASE WHEN v_when <> '' THEN v_when ELSE v_stamp END,
    'signedAtServer', CASE
      WHEN coalesce(v_prev->>'signedAtServer', '') <> ''
       AND (v_prev->>'signature') IS NOT DISTINCT FROM v_sig
       AND (v_prev->>'docVersion') IS NOT DISTINCT FROM v_ver
      THEN v_prev->>'signedAtServer'
      ELSE v_stamp END);

  UPDATE public.household_records
     SET record = jsonb_set(
           jsonb_set(coalesce(record, '{}'::jsonb), ARRAY['acknowledgments'], coalesce(record->'acknowledgments', '{}'::jsonb), true),
           ARRAY['acknowledgments', key_in], v_rec, true),
         updated_at = now()
   WHERE id = v_row.id
   RETURNING * INTO v_row;

  INSERT INTO audit_log (instance_id, user_id, action, entity_type, entity_id, from_value, to_value, note)
  VALUES (v_instance, auth.uid(), 'update', 'household_record', v_row.id,
          jsonb_build_object('acknowledged', key_in, 'previousVersion', v_prev->>'docVersion'),
          jsonb_build_object('docVersion', v_ver, 'signedAtServer', v_rec->>'signedAtServer'),
          'household_record_acknowledge');

  RETURN jsonb_build_object('record_id', v_row.id, 'instance_id', v_row.instance_id,
                            'record', v_row.record, 'acknowledged', key_in, 'updated_at', v_row.updated_at);
END;
$$;
REVOKE ALL ON FUNCTION public.household_record_acknowledge(text, text, text, text, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.household_record_acknowledge(text, text, text, text, text, uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. THE HOUSEHOLD'S SHELF OF DOCUMENTS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.family_documents (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id   uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by    uuid NOT NULL REFERENCES auth.users(id),
  slug          text NOT NULL,
  category      text NOT NULL,
  label         text NOT NULL,
  date_of       date,
  expires_on    date,
  note          text,
  where_filed   text,
  file_name     text,
  file_size     bigint,
  storage_path  text,
  -- Private to whoever put it there until they say otherwise (0180's rule,
  -- for the same reason: a household member must not read another's papers
  -- by default).
  shared_with_household boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz,
  CONSTRAINT family_documents_category_chk CHECK (category IN
    ('identity','home','money','insurance','vehicle','school','faith','health-admin','work','legacy','other')),
  CONSTRAINT family_documents_label_chk CHECK (length(btrim(label)) > 0),
  -- A row with neither bytes nor a place names a document nobody can produce.
  CONSTRAINT family_documents_locatable_chk
    CHECK (storage_path IS NOT NULL OR length(btrim(coalesce(where_filed, ''))) > 0)
);

CREATE INDEX IF NOT EXISTS family_documents_shelf_idx ON public.family_documents(instance_id, category, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS family_documents_slug_uk ON public.family_documents(created_by, slug);

ALTER TABLE public.family_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS family_documents_read   ON public.family_documents;
DROP POLICY IF EXISTS family_documents_write  ON public.family_documents;
DROP POLICY IF EXISTS family_documents_update ON public.family_documents;
DROP POLICY IF EXISTS family_documents_delete ON public.family_documents;

-- Mine always; the household's shared shelf if I am in that household.
CREATE POLICY family_documents_read ON public.family_documents FOR SELECT TO authenticated
  USING (created_by = auth.uid()
         OR (shared_with_household AND public.user_in_instance(instance_id)));

CREATE POLICY family_documents_write ON public.family_documents FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND public.user_in_instance(instance_id));

-- Only the person who put it there may change or remove it — sharing it with
-- the household does not hand over the pen.
CREATE POLICY family_documents_update ON public.family_documents FOR UPDATE TO authenticated
  USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

CREATE POLICY family_documents_delete ON public.family_documents FOR DELETE TO authenticated
  USING (created_by = auth.uid());

-- The private bucket. Paths are `<owner user id>/<slug>.<ext>`, so the first
-- folder segment IS the access rule.
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('family-documents', 'family-documents', false)
  ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE '0201: insufficient privilege on storage.buckets - create family-documents (PRIVATE) via the dashboard';
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS family_documents_object_read   ON storage.objects;
  DROP POLICY IF EXISTS family_documents_object_shared ON storage.objects;
  DROP POLICY IF EXISTS family_documents_object_write  ON storage.objects;
  DROP POLICY IF EXISTS family_documents_object_update ON storage.objects;
  DROP POLICY IF EXISTS family_documents_object_delete ON storage.objects;

  CREATE POLICY family_documents_object_read ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'family-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

  -- A document its owner shared with the household opens for that household.
  CREATE POLICY family_documents_object_shared ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'family-documents' AND EXISTS (
      SELECT 1 FROM public.family_documents d
       WHERE d.storage_path = storage.objects.name
         AND d.shared_with_household
         AND public.user_in_instance(d.instance_id)));

  CREATE POLICY family_documents_object_write ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'family-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

  CREATE POLICY family_documents_object_update ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'family-documents' AND (storage.foldername(name))[1] = auth.uid()::text)
    WITH CHECK (bucket_id = 'family-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

  CREATE POLICY family_documents_object_delete ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'family-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE '0201: insufficient privilege on storage.objects - create the five family-documents policies via the dashboard';
END $$;

SELECT public.apply_assistant_scope_overlay();
SELECT public.apply_viewer_readonly_overlay();

NOTIFY pgrst, 'reload schema';
