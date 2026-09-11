-- =============================================================================
-- 0209 — The church keeps each person's record, and their own shelf
-- =============================================================================
-- Darrell 2026-09-11: "Create the same type of intake forms for the Love Corner
-- App that we did for the PoeTech and Poe Properties Apps... We also need a
-- Love Corner documents upload."
--
-- This follows 0201 (the household's record and shelf) with ONE STRUCTURAL
-- DIFFERENCE that changes everything downstream: a household has ONE record
-- per instance; a CHURCH HAS MANY PEOPLE. So the key here is
-- (instance_id, user_id) and every rule below is about the boundary between
-- one member and another, and between a member and the office.
--
-- THE WALLS, each from a standing decision rather than an opinion:
--
--   * NO GIVING AMOUNT, BY CONSTRUCTION. Not in a patch, not in the row. A
--     church knowing what each person gives is the oldest way a congregation
--     gets quietly sorted, so the capability is REFUSED rather than the
--     practice discouraged: there is nothing to leak and nothing to look up.
--     Enforced twice — the patch guard by key, and a table constraint nothing
--     can bypass.
--   * NO account, routing or card number; no password; no SSN; no diagnosis.
--     Same refusals as 0198/0201, for the same reasons.
--   * A PRAYER REQUEST GOES ONLY AS FAR AS THE PERSON SAID. The row carries the
--     audience the person chose, the office read returns the request ONLY when
--     that audience includes them, and the default is the narrowest. Widening
--     it is the person's own patch, never the office's.
--   * A MEMBER READS AND FILLS THEIR OWN RECORD. Not another member's — not
--     even a staff member reads another person's full record; the office read
--     returns the ROLL fields (who, how to reach them, standing, where they
--     offered to serve) and nothing else.
--   * NO CHILD-FACING DATA STREAM. Nothing here is keyed to a minor. The intake
--     counts children in ranges and names none; a child's own row stays on the
--     Family Roster under a guardian (DR-0093), where the consent/assent flow
--     is still owed.
--   * A DOCUMENT IS PRIVATE TO WHOEVER PUT IT THERE unless they share it with
--     the office. 0180 and 0201 decided this shape; a church must honour it at
--     least as strictly, because the asymmetry between a congregant and their
--     church is larger than between two adults in one house.
--   * Files are POINTERS in the row and BYTES in a private bucket, opened by a
--     short-lived signed URL. Nothing here claims encryption at rest with a key
--     only the person holds, because that is not built — and the church
--     covenant says so in words (DR-0329's honesty rule).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. THE MEMBER RECORD — one per person, per church
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.church_member_records (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id  uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  record       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT church_member_records_one_per_person UNIQUE (instance_id, user_id),
  CONSTRAINT church_member_records_object_chk CHECK (jsonb_typeof(record) = 'object'),
  -- The refusals, expressed where nothing can bypass them.
  CONSTRAINT church_member_records_no_secrets_chk CHECK (
    NOT (record ? 'accountNumber' OR record ? 'routingNumber' OR record ? 'cardNumber'
      OR record ? 'password' OR record ? 'ssn' OR record ? 'socialSecurityNumber'
      OR record ? 'diagnosis')
  ),
  -- What a person gives is between them and Yahweh. The row cannot hold it.
  CONSTRAINT church_member_records_no_giving_chk CHECK (
    NOT (record ? 'givingAmount' OR record ? 'givingTotal' OR record ? 'income')
  )
);

CREATE INDEX IF NOT EXISTS church_member_records_instance_idx
  ON public.church_member_records(instance_id);
CREATE INDEX IF NOT EXISTS church_member_records_user_idx
  ON public.church_member_records(instance_id, user_id);

ALTER TABLE public.church_member_records ENABLE ROW LEVEL SECURITY;

-- A person reads their OWN row directly. Everything else goes through the
-- functions below, so the office can never simply select the table.
DROP POLICY IF EXISTS church_member_records_own_read ON public.church_member_records;
CREATE POLICY church_member_records_own_read ON public.church_member_records FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND public.user_in_instance(instance_id));

-- ---------------------------------------------------------------------------
-- 2. THE PATCH GUARD — the keys a member record may never carry
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.church_member_patch_guard(patch_in jsonb)
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
  IF patch_in ? 'givingAmount' OR patch_in ? 'givingTotal' OR patch_in ? 'income' THEN
    RAISE EXCEPTION 'what a person gives is never stored in their church record';
  END IF;
  IF patch_in ? 'accountNumber' OR patch_in ? 'routingNumber' OR patch_in ? 'cardNumber' THEN
    RAISE EXCEPTION 'this app never holds an account, routing or card number';
  END IF;
  IF patch_in ? 'password' THEN RAISE EXCEPTION 'a password is never stored'; END IF;
  IF patch_in ? 'ssn' OR patch_in ? 'socialSecurityNumber' THEN
    RAISE EXCEPTION 'a Social Security number is never stored in a church record';
  END IF;
  IF patch_in ? 'diagnosis' THEN
    RAISE EXCEPTION 'this app is not a medical record and holds no diagnosis';
  END IF;
  IF (SELECT count(*) FROM jsonb_object_keys(patch_in)) > 80 THEN
    RAISE EXCEPTION 'too many cells in one patch';
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. READ AND FILL YOUR OWN RECORD
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.church_member_record_read(instance_in uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_instance uuid;
  v_row      public.church_member_records%ROWTYPE;
  v_name     text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'sign in first'; END IF;
  v_instance := coalesce(instance_in, nullif(public.my_default_instance_role()->>'instance_id','')::uuid);
  IF v_instance IS NULL THEN RAISE EXCEPTION 'no church to read'; END IF;
  IF NOT public.user_in_instance(v_instance) THEN RAISE EXCEPTION 'that is not your church'; END IF;

  SELECT * INTO v_row FROM public.church_member_records
   WHERE instance_id = v_instance AND user_id = auth.uid();
  IF v_row.id IS NULL THEN
    INSERT INTO public.church_member_records (instance_id, user_id, record)
    VALUES (v_instance, auth.uid(), '{}'::jsonb)
    ON CONFLICT (instance_id, user_id) DO UPDATE
       SET updated_at = public.church_member_records.updated_at
    RETURNING * INTO v_row;
  END IF;

  SELECT display_name INTO v_name FROM instances WHERE id = v_instance;
  RETURN jsonb_build_object(
    'record_id', v_row.id, 'instance_id', v_row.instance_id, 'church_name', v_name,
    'record', v_row.record, 'updated_at', v_row.updated_at, 'created_at', v_row.created_at,
    'my_role', coalesce(public.user_role_in_instance(v_instance), ''));
END;
$$;
REVOKE ALL ON FUNCTION public.church_member_record_read(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.church_member_record_read(uuid) TO authenticated;

-- Fill or correct your own cells. NOT an office function: nobody fills in
-- somebody else's answers about their own life.
CREATE OR REPLACE FUNCTION public.church_member_record_patch(
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
  v_row      public.church_member_records%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'sign in first'; END IF;
  PERFORM public.church_member_patch_guard(patch_in);
  v_instance := coalesce(instance_in, nullif(public.my_default_instance_role()->>'instance_id','')::uuid);
  IF v_instance IS NULL THEN RAISE EXCEPTION 'no church to fill'; END IF;
  IF NOT public.user_in_instance(v_instance) THEN RAISE EXCEPTION 'that is not your church'; END IF;

  INSERT INTO public.church_member_records (instance_id, user_id, record)
  VALUES (v_instance, auth.uid(), patch_in)
  ON CONFLICT (instance_id, user_id) DO UPDATE
     SET record = coalesce(public.church_member_records.record, '{}'::jsonb) || patch_in,
         updated_at = now()
  RETURNING * INTO v_row;

  INSERT INTO audit_log (instance_id, user_id, action, entity_type, entity_id, from_value, to_value, note)
  VALUES (v_instance, auth.uid(), 'update', 'church_member_record', v_row.id,
          jsonb_build_object('own_record', true),
          jsonb_build_object('cells', (SELECT jsonb_agg(k) FROM jsonb_object_keys(patch_in) k)),
          coalesce(nullif(left(btrim(coalesce(note_in, '')), 500), ''), 'church_member_record_patch'));

  RETURN jsonb_build_object('record_id', v_row.id, 'instance_id', v_row.instance_id,
                            'record', v_row.record, 'updated_at', v_row.updated_at);
END;
$$;
REVOKE ALL ON FUNCTION public.church_member_record_patch(jsonb, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.church_member_record_patch(jsonb, text, uuid) TO authenticated;

-- Sign the church covenant, in place, with the server's own clock (0199's rule).
-- The patch guard above REFUSES an 'acknowledgments' key on purpose: a
-- signature is made on the document, never typed into a cell. So this is the
-- only door, and without it the covenant this intake requires would be
-- unsignable. Unlike the household's version there is NO seat test — the
-- record belongs to the person, and a person signs for themselves.
CREATE OR REPLACE FUNCTION public.church_member_record_acknowledge(
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
  v_row      public.church_member_records%ROWTYPE;
  v_stamp    text := to_char(clock_timestamp() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  v_prev     jsonb;
  v_rec      jsonb;
  v_sig      text := left(btrim(coalesce(signature_in, '')), 200);
  v_att      text := left(btrim(coalesce(attestation_in, '')), 500);
  v_ver      text := left(btrim(coalesce(doc_version_in, '')), 40);
  v_when     text := left(btrim(coalesce(agreed_at_in, '')), 40);
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'sign in first'; END IF;
  IF key_in IS NULL OR key_in <> 'churchCovenant' THEN RAISE EXCEPTION 'no such document to acknowledge'; END IF;
  IF v_sig = '' THEN RAISE EXCEPTION 'sign by typing your full legal name'; END IF;
  IF v_att = '' THEN RAISE EXCEPTION 'the acknowledgment sentence must be checked'; END IF;

  v_instance := coalesce(instance_in, nullif(public.my_default_instance_role()->>'instance_id','')::uuid);
  IF v_instance IS NULL THEN RAISE EXCEPTION 'no church to sign for'; END IF;
  IF NOT public.user_in_instance(v_instance) THEN RAISE EXCEPTION 'that is not your church'; END IF;

  SELECT * INTO v_row FROM public.church_member_records
   WHERE instance_id = v_instance AND user_id = auth.uid();
  IF v_row.id IS NULL THEN
    INSERT INTO public.church_member_records (instance_id, user_id, record)
    VALUES (v_instance, auth.uid(), '{}'::jsonb) RETURNING * INTO v_row;
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
    -- Re-reading a document you already signed, unchanged, does not re-date the
    -- signature. A NEW version does (0199 keep-or-renew).
    'signedAtServer', CASE
      WHEN coalesce(v_prev->>'signedAtServer', '') <> ''
       AND (v_prev->>'signature') IS NOT DISTINCT FROM v_sig
       AND (v_prev->>'docVersion') IS NOT DISTINCT FROM v_ver
      THEN v_prev->>'signedAtServer'
      ELSE v_stamp END);

  UPDATE public.church_member_records
     SET record = jsonb_set(
           jsonb_set(coalesce(record, '{}'::jsonb), ARRAY['acknowledgments'], coalesce(record->'acknowledgments', '{}'::jsonb), true),
           ARRAY['acknowledgments', key_in], v_rec, true),
         updated_at = now()
   WHERE id = v_row.id
   RETURNING * INTO v_row;

  INSERT INTO audit_log (instance_id, user_id, action, entity_type, entity_id, from_value, to_value, note)
  VALUES (v_instance, auth.uid(), 'update', 'church_member_record', v_row.id,
          jsonb_build_object('acknowledged', key_in, 'previousVersion', v_prev->>'docVersion'),
          jsonb_build_object('docVersion', v_ver, 'signedAtServer', v_rec->>'signedAtServer'),
          'church_member_record_acknowledge');

  RETURN jsonb_build_object('record_id', v_row.id, 'instance_id', v_row.instance_id,
                            'record', v_row.record, 'acknowledged', key_in, 'updated_at', v_row.updated_at);
END;
$$;
REVOKE ALL ON FUNCTION public.church_member_record_acknowledge(text, text, text, text, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.church_member_record_acknowledge(text, text, text, text, text, uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. THE OFFICE READ — the roll, and NOT a window into a person's life
-- ---------------------------------------------------------------------------
-- What the office legitimately needs is who is here, how to reach them, where
-- they stand and where they offered to serve. It does NOT need what somebody
-- studies, what their household looks like, or what they asked prayer for —
-- so this returns a NAMED SET of cells and nothing else. A key added to the
-- intake tomorrow does not silently become visible to the office today.
CREATE OR REPLACE FUNCTION public.church_roll_read(instance_in uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_instance uuid;
  v_role     text;
  v_rows     jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'sign in first'; END IF;
  v_instance := coalesce(instance_in, nullif(public.my_default_instance_role()->>'instance_id','')::uuid);
  IF v_instance IS NULL THEN RAISE EXCEPTION 'no church to read'; END IF;
  v_role := coalesce(public.user_role_in_instance(v_instance), '');
  IF coalesce(v_role, '') NOT IN ('owner','admin') THEN
    RAISE EXCEPTION 'only the church office may read the roll';
  END IF;

  SELECT coalesce(jsonb_agg(jsonb_build_object(
           'user_id',   r.user_id,
           'updated_at', r.updated_at,
           -- The roll cells, named one by one on purpose.
           'fullName',          r.record->>'fullName',
           'preferredName',     r.record->>'preferredName',
           'contactEmail',      r.record->>'contactEmail',
           'contactPhone',      r.record->>'contactPhone',
           'contactPreference', r.record->>'contactPreference',
           'homeArea',          r.record->>'homeArea',
           'standing',          r.record->>'standing',
           'sinceWhen',         r.record->>'sinceWhen',
           'howYouFoundUs',     r.record->>'howYouFoundUs',
           'newMemberWelcome',  r.record->'newMemberWelcome',
           'servingInterest',   coalesce(r.record->'servingInterest', '[]'::jsonb),
           'servingNote',       r.record->>'servingNote',
           'canDrive',          r.record->'canDrive',
           'needsRide',         r.record->'needsRide',
           'rideServices',      coalesce(r.record->'rideServices', '[]'::jsonb),
           'accessibleNeeded',  r.record->'accessibleNeeded',
           'accessNeeds',       r.record->>'accessNeeds',
           -- The prayer request appears ONLY if the person pointed it at the
           -- office or wider. Left out entirely otherwise — not blanked, absent.
           'prayerRequest', CASE
             WHEN r.record->>'prayerShareable' IN ('The prayer team','The whole church')
               THEN r.record->>'prayerRequest' ELSE NULL END,
           'prayerShareable', r.record->>'prayerShareable'
         ) ORDER BY r.record->>'fullName'), '[]'::jsonb)
    INTO v_rows
    FROM public.church_member_records r
   WHERE r.instance_id = v_instance;

  RETURN jsonb_build_object('instance_id', v_instance, 'rows', v_rows,
                            'count', jsonb_array_length(v_rows));
END;
$$;
REVOKE ALL ON FUNCTION public.church_roll_read(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.church_roll_read(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 5. THE SHELF — church_documents
-- ---------------------------------------------------------------------------
-- A row is EITHER a file in the private `church-documents` bucket OR a pointer
-- to where the paper lives. Both first class; a row that is neither is refused.
CREATE TABLE IF NOT EXISTS public.church_documents (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id   uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  filed_by      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title         text NOT NULL,
  kind          text NOT NULL DEFAULT 'other',
  note          text,
  storage_path  text,
  paper_location text,
  shared_with_office boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT church_documents_title_chk CHECK (btrim(title) <> ''),
  -- A file OR a pointer. Never neither.
  CONSTRAINT church_documents_has_something_chk CHECK (
    coalesce(btrim(storage_path), '') <> '' OR coalesce(btrim(paper_location), '') <> ''
  )
);

CREATE INDEX IF NOT EXISTS church_documents_instance_idx ON public.church_documents(instance_id);
CREATE INDEX IF NOT EXISTS church_documents_filer_idx ON public.church_documents(instance_id, filed_by);

ALTER TABLE public.church_documents ENABLE ROW LEVEL SECURITY;

-- PRIVATE TO WHOEVER FILED IT, until they share it with the office. Sharing
-- does not hand over the pen: update and delete stay with the filer.
DROP POLICY IF EXISTS church_documents_read ON public.church_documents;
CREATE POLICY church_documents_read ON public.church_documents FOR SELECT TO authenticated
  USING (
    public.user_in_instance(instance_id)
    AND (
      filed_by = auth.uid()
      OR (shared_with_office = true
          AND coalesce(public.user_role_in_instance(instance_id), '') IN ('owner','admin'))
    )
  );

DROP POLICY IF EXISTS church_documents_insert ON public.church_documents;
CREATE POLICY church_documents_insert ON public.church_documents FOR INSERT TO authenticated
  WITH CHECK (filed_by = auth.uid() AND public.user_in_instance(instance_id));

DROP POLICY IF EXISTS church_documents_update ON public.church_documents;
CREATE POLICY church_documents_update ON public.church_documents FOR UPDATE TO authenticated
  USING (filed_by = auth.uid() AND public.user_in_instance(instance_id))
  WITH CHECK (filed_by = auth.uid() AND public.user_in_instance(instance_id));

DROP POLICY IF EXISTS church_documents_delete ON public.church_documents;
CREATE POLICY church_documents_delete ON public.church_documents FOR DELETE TO authenticated
  USING (filed_by = auth.uid() AND public.user_in_instance(instance_id));

-- ---------------------------------------------------------------------------
-- 6. THE BUCKET — private, like every other shelf in this system
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('church-documents', 'church-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Objects are laid out as <instance_id>/<user_id>/<file>, so the path itself
-- carries the ownership the policies check.
DROP POLICY IF EXISTS church_documents_objects_read ON storage.objects;
CREATE POLICY church_documents_objects_read ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'church-documents'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

DROP POLICY IF EXISTS church_documents_objects_write ON storage.objects;
CREATE POLICY church_documents_objects_write ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'church-documents'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

DROP POLICY IF EXISTS church_documents_objects_delete ON storage.objects;
CREATE POLICY church_documents_objects_delete ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'church-documents'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

COMMENT ON TABLE public.church_member_records IS
  'One record per PERSON per church (0209). Holds no giving amount by table constraint — what a person gives is never stored here.';
COMMENT ON TABLE public.church_documents IS
  'A person''s own shelf at their church (0209). Private to whoever filed it until they share it with the office; sharing does not hand over the pen.';

-- ---------------------------------------------------------------------------
-- 7. THE OVERLAYS — re-run, because this migration created instance-scoped tables
-- ---------------------------------------------------------------------------
-- Two standing overlays apply to EVERY instance-scoped table in this system,
-- and a new table does not inherit them by existing: the migration has to ask.
--   * the assistant scope overlay (0130) keeps an assistant's reach inside the
--     workspace it was given, so a new table cannot become a side door;
--   * the viewer read-only overlay (DR-0241) keeps a viewer a viewer.
-- Both are re-run here rather than assumed. Caught by assistant-scope-noleak
-- and tenancy-guard when this migration was first written without them - which
-- is the gates doing exactly what DR-0060 built them to do.
SELECT public.apply_assistant_scope_overlay();
SELECT public.apply_viewer_readonly_overlay();
