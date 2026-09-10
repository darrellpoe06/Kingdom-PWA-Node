-- =============================================================================
-- 0196 -- THE OFFICE EDITS ITS OWN FORMS: the intake questions and the
--         documents, versioned, in the app (DR-0352)
-- =============================================================================
-- Darrell 2026-09-10, on the live Onboarding tab: "where is the intake form so
-- we can have staff update it?! everything needs to be able to be updated by
-- staff!"
--
-- BEFORE: the intake packet's questions (lib/tlc-onboarding.js SECTIONS), the
-- two agreements (lib/tlc-agreements.js) and the handbook (lib/tlc-handbook.js)
-- were code. Nothing in the app let the office change a label, add a
-- question, or revise a document; a change was a deploy.
--
-- AFTER: one row per office document key -- 'intake-form', 'policies' (the
-- handbook), 'confidentiality', 'contractorAgreement' -- holds the office's
-- LIVE definition as jsonb, versioned: every save is version+1 with a
-- required note, who and when, and the full body kept append-only in
-- history. The code definitions remain the ORIGINAL (the default when no row
-- exists, and what "Reset to the original" restores -- as a new version,
-- never by deleting). The packet form, the readout, the Team reader and the
-- signature record read the live definition through one function; a
-- signature pins the content hash of the text it signed (DR-0350 §5), so an
-- edit never rewrites what an earlier colleague agreed to.
--
-- WHO: the office owner/admin write (Christina, the Operations Manager,
-- Darrell); every office member reads; a colleague with a packet in the
-- office reads (they fill the form and sign the documents); nobody else.
-- The six base required answers and the three signatures stay the FLOOR the
-- server enforces no matter how the form is edited; a custom question the
-- office marks required is enforced at submit from the live definition.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.tlc_office_documents (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES public.instances(id) ON DELETE CASCADE,
  office_id   text NOT NULL DEFAULT 'tlc' CHECK (char_length(office_id) BETWEEN 1 AND 40),
  key         text NOT NULL CHECK (key IN ('intake-form','policies','confidentiality','contractorAgreement')),
  body        jsonb NOT NULL CHECK (jsonb_typeof(body) = 'object'),
  version     integer NOT NULL DEFAULT 1 CHECK (version >= 1),
  note        text CHECK (note IS NULL OR char_length(note) <= 500),
  updated_by  uuid REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (instance_id, key)
);
CREATE INDEX IF NOT EXISTS tlc_office_documents_instance_idx ON public.tlc_office_documents (instance_id, office_id);

CREATE TABLE IF NOT EXISTS public.tlc_office_document_history (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES public.instances(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES public.tlc_office_documents(id) ON DELETE CASCADE,
  key         text NOT NULL,
  version     integer NOT NULL,
  body        jsonb NOT NULL,
  note        text,
  saved_by    uuid REFERENCES auth.users(id),
  saved_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (document_id, version)
);
CREATE INDEX IF NOT EXISTS tlc_office_document_history_doc_idx ON public.tlc_office_document_history (document_id, version DESC);

ALTER TABLE public.tlc_office_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tlc_office_document_history ENABLE ROW LEVEL SECURITY;

-- Every office member reads the live definitions; the history is the
-- owner/admin's; nobody writes either by hand -- only the save function
-- (SECURITY DEFINER) does, so every version carries its note and author.
DROP POLICY IF EXISTS tlc_office_documents_member_read ON public.tlc_office_documents;
CREATE POLICY tlc_office_documents_member_read ON public.tlc_office_documents
  FOR SELECT TO authenticated
  USING (coalesce(public.user_role_in_instance(instance_id), '') <> '');
DROP POLICY IF EXISTS tlc_office_document_history_manager_read ON public.tlc_office_document_history;
CREATE POLICY tlc_office_document_history_manager_read ON public.tlc_office_document_history
  FOR SELECT TO authenticated
  USING (coalesce(public.user_role_in_instance(instance_id), '') IN ('owner','admin'));
GRANT SELECT ON public.tlc_office_documents TO authenticated;
GRANT SELECT ON public.tlc_office_document_history TO authenticated;

-- ---------------------------------------------------------------------------
-- Save (owner/admin): a new version, a required note, the body kept whole.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.tlc_office_document_save(key_in text, body_in jsonb, note_in text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_office record;
  v_note   text := trim(coalesce(note_in, ''));
  v_row    public.tlc_office_documents%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'sign in first'; END IF;
  SELECT * INTO v_office FROM public.tlc_onboarding_my_office();
  IF v_office.instance_id IS NULL OR coalesce(v_office.role, '') NOT IN ('owner','admin') THEN
    RAISE EXCEPTION 'only the office owner or admin can change the office forms';
  END IF;
  IF key_in NOT IN ('intake-form','policies','confidentiality','contractorAgreement') THEN
    RAISE EXCEPTION 'unknown office document';
  END IF;
  IF body_in IS NULL OR jsonb_typeof(body_in) <> 'object' OR jsonb_typeof(body_in->'sections') <> 'array' THEN
    RAISE EXCEPTION 'the document must be an object with a sections array';
  END IF;
  IF key_in <> 'intake-form' AND trim(coalesce(body_in->>'title', '')) = '' THEN
    RAISE EXCEPTION 'a document needs a title';
  END IF;
  IF char_length(v_note) < 3 OR char_length(v_note) > 500 THEN
    RAISE EXCEPTION 'say in a few words what changed (3 to 500 characters)';
  END IF;

  INSERT INTO public.tlc_office_documents (instance_id, office_id, key, body, version, note, updated_by)
  VALUES (v_office.instance_id, 'tlc', key_in, body_in, 1, v_note, auth.uid())
  ON CONFLICT (instance_id, key) DO UPDATE
    SET body = EXCLUDED.body,
        version = public.tlc_office_documents.version + 1,
        note = EXCLUDED.note,
        updated_by = auth.uid(),
        updated_at = now()
  RETURNING * INTO v_row;

  INSERT INTO public.tlc_office_document_history (instance_id, document_id, key, version, body, note, saved_by)
  VALUES (v_row.instance_id, v_row.id, v_row.key, v_row.version, v_row.body, v_row.note, auth.uid());

  INSERT INTO audit_log (instance_id, user_id, action, entity_type, entity_id, from_value, to_value, note)
  VALUES (v_row.instance_id, auth.uid(), 'update', 'tlc_office_document', v_row.id,
          jsonb_build_object('version', v_row.version - 1), jsonb_build_object('version', v_row.version, 'key', v_row.key), v_note);

  RETURN jsonb_build_object('key', v_row.key, 'version', v_row.version, 'updated_at', v_row.updated_at, 'note', v_row.note);
END;
$$;
REVOKE ALL ON FUNCTION public.tlc_office_document_save(text, jsonb, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tlc_office_document_save(text, jsonb, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- Read: the office's live definitions, for a member OR a colleague with a
-- packet in that office (they fill the form and sign the documents). An
-- empty object for anyone else; the app falls back to the original.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.tlc_office_documents_read(office_in text DEFAULT 'tlc')
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_instance uuid;
BEGIN
  IF auth.uid() IS NULL THEN RETURN '{}'::jsonb; END IF;
  -- The office the caller belongs to first, then the office whose packet is theirs.
  SELECT im.instance_id INTO v_instance
    FROM instance_members im JOIN instances i ON i.id = im.instance_id
   WHERE im.user_id = auth.uid() AND i.instance_type = 'therapy-practice'
   ORDER BY im.joined_at ASC, i.id ASC LIMIT 1;
  IF v_instance IS NULL THEN
    SELECT p.instance_id INTO v_instance
      FROM public.tlc_onboarding_packets p
     WHERE p.applicant_user_id = auth.uid()
     ORDER BY p.updated_at DESC LIMIT 1;
  END IF;
  IF v_instance IS NULL THEN RETURN '{}'::jsonb; END IF;
  RETURN coalesce((
    SELECT jsonb_object_agg(d.key, jsonb_build_object('body', d.body, 'version', d.version, 'updated_at', d.updated_at, 'note', d.note))
      FROM public.tlc_office_documents d
     WHERE d.instance_id = v_instance AND d.office_id = coalesce(office_in, 'tlc')), '{}'::jsonb);
END;
$$;
REVOKE ALL ON FUNCTION public.tlc_office_documents_read(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tlc_office_documents_read(text) TO authenticated;

-- ---------------------------------------------------------------------------
-- Submit enforces the LIVE form's required questions on top of the floor.
-- Everything else is 0194's, verbatim.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.tlc_onboarding_save(
  packet_id_in uuid,
  packet_in    jsonb,
  headshot_in  text DEFAULT NULL,
  banking_in   jsonb DEFAULT NULL,
  submit_in    boolean DEFAULT false)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_pkt   public.tlc_onboarding_packets%ROWTYPE;
  v_name  text;
  v_missing text[] := '{}';
  v_key   text;
  v_stamp text := to_char(clock_timestamp() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  v_form  jsonb;
  v_field jsonb;
  v_type  text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'sign in first'; END IF;
  SELECT * INTO v_pkt FROM public.tlc_onboarding_packets WHERE id = packet_id_in;
  IF v_pkt.id IS NULL OR v_pkt.applicant_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'that packet is not yours';
  END IF;
  IF v_pkt.status NOT IN ('draft','returned') THEN
    RAISE EXCEPTION 'this packet was already %', v_pkt.status;
  END IF;
  IF packet_in IS NULL OR jsonb_typeof(packet_in) <> 'object' THEN
    RAISE EXCEPTION 'the packet must be an object';
  END IF;
  IF packet_in ? 'caqhPassword' OR packet_in ? 'password' THEN
    RAISE EXCEPTION 'a password is never stored in an intake packet';
  END IF;
  IF packet_in ? 'routingNumber' OR packet_in ? 'accountNumber' THEN
    RAISE EXCEPTION 'banking is saved separately, never inside the packet';
  END IF;

  IF banking_in IS NOT NULL AND jsonb_typeof(banking_in) = 'object'
     AND coalesce(banking_in->>'routingNumber', '') <> '' THEN
    INSERT INTO public.tlc_onboarding_banking (packet_id, instance_id, bank_name, routing_number, account_number, account_type)
    VALUES (v_pkt.id, v_pkt.instance_id,
            trim(coalesce(banking_in->>'bankName', '')),
            regexp_replace(coalesce(banking_in->>'routingNumber', ''), '\D', '', 'g'),
            regexp_replace(coalesce(banking_in->>'accountNumber', ''), '\D', '', 'g'),
            CASE WHEN banking_in->>'accountType' = 'savings' THEN 'savings' ELSE 'checking' END)
    ON CONFLICT (packet_id) DO UPDATE
      SET bank_name = EXCLUDED.bank_name,
          routing_number = EXCLUDED.routing_number,
          account_number = EXCLUDED.account_number,
          account_type = EXCLUDED.account_type,
          updated_at = now();
  END IF;

  IF submit_in THEN
    FOREACH v_key IN ARRAY ARRAY['firstName','lastName','phone','preferredEmail','licenseType','employmentStatus'] LOOP
      IF trim(coalesce(packet_in->>v_key, '')) = '' THEN v_missing := v_missing || v_key; END IF;
    END LOOP;
    FOREACH v_key IN ARRAY ARRAY['policies','confidentiality','contractorAgreement'] LOOP
      IF coalesce(packet_in->'acknowledgments'->v_key->>'agreed', 'false') <> 'true'
         OR trim(coalesce(packet_in->'acknowledgments'->v_key->>'signature', '')) = '' THEN
        v_missing := v_missing || ('acknowledgments.' || v_key);
      END IF;
    END LOOP;

    -- The office's LIVE form (0196): a question it marked required, and did
    -- not hide, must be answered too. Files, signatures and the availability
    -- grid are judged above or by the office, never here.
    SELECT d.body INTO v_form FROM public.tlc_office_documents d
     WHERE d.instance_id = v_pkt.instance_id AND d.key = 'intake-form';
    IF v_form IS NOT NULL THEN
      FOR v_field IN
        SELECT f FROM jsonb_array_elements(v_form->'sections') s, jsonb_array_elements(s->'fields') f
         WHERE coalesce((f->>'required')::boolean, false) AND NOT coalesce((f->>'hidden')::boolean, false)
      LOOP
        v_key := v_field->>'key';
        v_type := coalesce(v_field->>'type', 'text');
        IF v_key IS NULL OR v_type IN ('file','acknowledgment','availability') OR v_key = ANY (v_missing) THEN CONTINUE; END IF;
        IF v_type = 'multiselect' THEN
          IF jsonb_typeof(packet_in->v_key) <> 'array' OR jsonb_array_length(packet_in->v_key) = 0 THEN v_missing := v_missing || v_key; END IF;
        ELSIF v_type = 'yesno' THEN
          IF packet_in->v_key IS NULL OR jsonb_typeof(packet_in->v_key) = 'null' THEN v_missing := v_missing || v_key; END IF;
        ELSE
          IF trim(coalesce(packet_in->>v_key, '')) = '' THEN v_missing := v_missing || v_key; END IF;
        END IF;
      END LOOP;
    END IF;

    IF array_length(v_missing, 1) > 0 THEN
      RETURN jsonb_build_object('status', v_pkt.status, 'submitted', false, 'missing', to_jsonb(v_missing));
    END IF;

    FOREACH v_key IN ARRAY ARRAY['policies','confidentiality','contractorAgreement'] LOOP
      IF coalesce(packet_in->'acknowledgments'->v_key->>'signedAtServer', '') = ''
         OR (v_pkt.packet->'acknowledgments'->v_key->>'signature') IS DISTINCT FROM (packet_in->'acknowledgments'->v_key->>'signature')
         OR (v_pkt.packet->'acknowledgments'->v_key->>'docVersion') IS DISTINCT FROM (packet_in->'acknowledgments'->v_key->>'docVersion') THEN
        packet_in := jsonb_set(packet_in, ARRAY['acknowledgments', v_key, 'signedAtServer'], to_jsonb(v_stamp), true);
      END IF;
    END LOOP;
  END IF;

  UPDATE public.tlc_onboarding_packets
     SET packet = packet_in,
         headshot_thumb = CASE WHEN headshot_in IS NULL THEN headshot_thumb WHEN headshot_in = '' THEN NULL ELSE headshot_in END,
         status = CASE WHEN submit_in THEN 'submitted' ELSE status END,
         submitted_at = CASE WHEN submit_in THEN now() ELSE submitted_at END,
         updated_at = now()
   WHERE id = v_pkt.id
   RETURNING * INTO v_pkt;

  IF submit_in THEN
    INSERT INTO audit_log (instance_id, user_id, action, entity_type, entity_id, from_value, to_value, note)
    VALUES (v_pkt.instance_id, auth.uid(), 'status-change', 'tlc_onboarding_packet', v_pkt.id,
            jsonb_build_object('status', 'draft'),
            jsonb_build_object('status', 'submitted',
                               'acknowledgments', (SELECT jsonb_object_agg(k, jsonb_build_object(
                                    'docVersion', packet_in->'acknowledgments'->k->>'docVersion',
                                    'signedAtServer', packet_in->'acknowledgments'->k->>'signedAtServer'))
                                  FROM unnest(ARRAY['policies','confidentiality','contractorAgreement']) AS k)),
            'tlc_onboarding_save');
  END IF;

  SELECT display_name INTO v_name FROM instances WHERE id = v_pkt.instance_id;
  RETURN public.tlc_onboarding_packet_view(v_pkt, v_name) || jsonb_build_object('submitted', submit_in);
END;
$$;
REVOKE ALL ON FUNCTION public.tlc_onboarding_save(uuid, jsonb, text, jsonb, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tlc_onboarding_save(uuid, jsonb, text, jsonb, boolean) TO authenticated;

SELECT public.apply_assistant_scope_overlay();
SELECT public.apply_viewer_readonly_overlay();

NOTIFY pgrst, 'reload schema';
