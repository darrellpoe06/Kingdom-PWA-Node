-- =============================================================================
-- 0263 — A DOCUMENT IS SIGNED IN THE APP AND FILED WHERE IT BELONGS (DR-0936)
-- =============================================================================
-- Darrell, 2026-10-10, on the Files tab of 805 North Prospect Avenue Apt 2:
-- "Documents should be able to work integrated with the options to digitally
-- sign... so all necessary documents are populated into their respective
-- places... also have paper documents we can upload to keep as records for
-- tenants... make sense?"
--
-- WHAT EXISTS (0154): property_documents holds a door's papers and a
-- tenancy's papers, the file itself in the row (RLS inherited), readable by
-- that tenancy's household. A tenant can already upload to their own tenancy.
-- What does not exist: any signature. The table's own comment says "a document
-- has a signer", and there was no column for one.
--
-- THE SHAPE (the house's established signing pattern — DR-0350 / 0194 / 0199:
-- a typed legal name, an attestation, the exact version signed, the person's
-- consent to sign electronically, the device clock AND the server clock):
--
--   * The family REQUESTS signatures on a document already filed to a tenancy
--     (property_document_request_signatures), naming who must sign: the
--     tenant, the landlord, or both. The database fingerprints the file it
--     holds (SHA-256 of the stored bytes) at that moment.
--   * Each signer SIGNS (property_document_sign) with the fingerprint of what
--     their screen showed. A different fingerprint is refused, so nobody signs
--     a document other than the one on file. A tenant signs only their own
--     tenancy's papers; only the family signs as landlord.
--   * When every required signer has signed, the document is SIGNED, stamped
--     with the server's instant. It stays where it was filed — the tenancy's
--     papers — so the signed lease is in the tenant's Documents and the door's
--     Files without being copied anywhere.
--   * Every request, signature and completion lands on door_events (0262)
--     with its own instant: the clock covers documents now too.
--
-- THE COUNSEL RULE STANDS (documents.js, lease-template.js: a generated draft
-- is "not ready to sign" until counsel reviews it). A document the app
-- GENERATED can be sent for signature only with the family's recorded
-- attestation that counsel reviewed it — who, and when, kept on the row. A
-- document the family uploaded is their own paper and needs no attestation.
--
-- NOTHING ON THE CLIENT CAN FORGE A SIGNATURE STATE: the sign columns are not
-- in 0154's column-level UPDATE grant, a BEFORE INSERT trigger blanks them on
-- every insert, and signatures are written only by the SECURITY DEFINER
-- function into an append-only table nobody can edit or delete.
--
-- IDEMPOTENT: IF NOT EXISTS, CREATE OR REPLACE, guarded constraints,
-- DROP/CREATE triggers and policies. ADDITIVE.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. The sign state on a document.
-- ---------------------------------------------------------------------------
ALTER TABLE public.property_documents ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'upload';
ALTER TABLE public.property_documents ADD COLUMN IF NOT EXISTS content_hash text;
ALTER TABLE public.property_documents ADD COLUMN IF NOT EXISTS sign_status text NOT NULL DEFAULT 'none';
ALTER TABLE public.property_documents ADD COLUMN IF NOT EXISTS signers_required text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.property_documents ADD COLUMN IF NOT EXISTS sign_requested_at timestamptz;
ALTER TABLE public.property_documents ADD COLUMN IF NOT EXISTS sign_requested_by uuid;
ALTER TABLE public.property_documents ADD COLUMN IF NOT EXISTS counsel_attested_by uuid;
ALTER TABLE public.property_documents ADD COLUMN IF NOT EXISTS counsel_attested_at timestamptz;
ALTER TABLE public.property_documents ADD COLUMN IF NOT EXISTS signed_at timestamptz;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'property_documents_source_check') THEN
    ALTER TABLE public.property_documents ADD CONSTRAINT property_documents_source_check
      CHECK (source IN ('upload', 'generated'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'property_documents_sign_status_check') THEN
    ALTER TABLE public.property_documents ADD CONSTRAINT property_documents_sign_status_check
      CHECK (sign_status IN ('none', 'awaiting', 'signed', 'void'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'property_documents_signers_known') THEN
    ALTER TABLE public.property_documents ADD CONSTRAINT property_documents_signers_known
      CHECK (signers_required <@ ARRAY['tenant', 'landlord']::text[]);
  END IF;
END $$;

-- An insert never arrives signed: whatever the client sent, the sign state
-- starts empty. Only the functions below move it.
CREATE OR REPLACE FUNCTION public.property_documents_insert_unsigned()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.content_hash := NULL;
  NEW.sign_status := 'none';
  NEW.signers_required := '{}';
  NEW.sign_requested_at := NULL;
  NEW.sign_requested_by := NULL;
  NEW.counsel_attested_by := NULL;
  NEW.counsel_attested_at := NULL;
  NEW.signed_at := NULL;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS property_documents_unsigned_on_insert ON public.property_documents;
CREATE TRIGGER property_documents_unsigned_on_insert
  BEFORE INSERT ON public.property_documents
  FOR EACH ROW EXECUTE FUNCTION public.property_documents_insert_unsigned();

-- An UPDATE never moves the sign state either, except through the functions
-- below. They are SECURITY DEFINER, so inside them current_user is their
-- owner; a direct write from the app runs as anon or authenticated. Found
-- 2026-10-10 (DR-0934/DR-0935): with production's table grants the owner's
-- own UPDATE policy let them set sign_status = 'signed' with no signature.
-- The CI chain had no table grants at all, so the smoke passed on a missing
-- privilege rather than on this wall.
CREATE OR REPLACE FUNCTION public.property_documents_sign_state_by_function()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') AND (
       NEW.content_hash        IS DISTINCT FROM OLD.content_hash
    OR NEW.sign_status         IS DISTINCT FROM OLD.sign_status
    OR NEW.signers_required    IS DISTINCT FROM OLD.signers_required
    OR NEW.sign_requested_at   IS DISTINCT FROM OLD.sign_requested_at
    OR NEW.sign_requested_by   IS DISTINCT FROM OLD.sign_requested_by
    OR NEW.counsel_attested_by IS DISTINCT FROM OLD.counsel_attested_by
    OR NEW.counsel_attested_at IS DISTINCT FROM OLD.counsel_attested_at
    OR NEW.signed_at           IS DISTINCT FROM OLD.signed_at
  ) THEN
    RAISE EXCEPTION 'the sign state moves only by sending for signature or signing (0263)'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS property_documents_sign_state_on_update ON public.property_documents;
CREATE TRIGGER property_documents_sign_state_on_update
  BEFORE UPDATE ON public.property_documents
  FOR EACH ROW EXECUTE FUNCTION public.property_documents_sign_state_by_function();

-- ---------------------------------------------------------------------------
-- 2. The signatures: append-only, read where the document is read.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.property_document_signatures (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id       uuid NOT NULL REFERENCES public.property_documents(id) ON DELETE CASCADE,
  instance_id       uuid NOT NULL,
  signer_user_id    uuid NOT NULL,
  signer_role       text NOT NULL CHECK (signer_role IN ('tenant', 'landlord')),
  signature         text NOT NULL CHECK (length(btrim(signature)) BETWEEN 2 AND 120),
  attestation       text NOT NULL CHECK (length(btrim(attestation)) > 0),
  consent           text NOT NULL CHECK (length(btrim(consent)) > 0),
  doc_version       text NOT NULL,
  signed_on_device_at timestamptz,
  signed_at         timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE (document_id, signer_role)
);
CREATE INDEX IF NOT EXISTS property_document_signatures_doc_idx ON public.property_document_signatures(document_id, signed_at);
COMMENT ON TABLE public.property_document_signatures IS
  'DR-0936: one row per signer per document — typed legal name, attestation, e-sign consent, the SHA-256 of the exact bytes signed, the device clock and the server instant. Written only by property_document_sign; nobody edits or deletes one.';

REVOKE ALL ON public.property_document_signatures FROM anon, authenticated;
GRANT SELECT ON public.property_document_signatures TO authenticated;
ALTER TABLE public.property_document_signatures ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS property_document_signatures_read ON public.property_document_signatures;
CREATE POLICY property_document_signatures_read ON public.property_document_signatures FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM property_documents d WHERE d.id = document_id));

-- ---------------------------------------------------------------------------
-- 3. The clock covers documents (door_events, 0262).
-- ---------------------------------------------------------------------------
ALTER TABLE public.door_events DROP CONSTRAINT IF EXISTS door_events_subject_check;
ALTER TABLE public.door_events ADD CONSTRAINT door_events_subject_check
  CHECK (subject IN ('rent', 'work', 'document'));
DROP POLICY IF EXISTS door_events_read ON public.door_events;
CREATE POLICY door_events_read ON public.door_events FOR SELECT TO authenticated
  USING (CASE subject
           WHEN 'rent' THEN EXISTS (SELECT 1 FROM rent_records r WHERE r.id = subject_id)
           WHEN 'work' THEN EXISTS (SELECT 1 FROM tenant_maintenance_requests w WHERE w.id = subject_id)
           WHEN 'document' THEN EXISTS (SELECT 1 FROM property_documents d WHERE d.id = subject_id)
           ELSE false END);

-- ---------------------------------------------------------------------------
-- 4. Ask for signatures — the family only.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.property_document_request_signatures(
  p_doc uuid, p_signers text[], p_counsel_reviewed boolean DEFAULT false)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE d record; v_hash text;
BEGIN
  SELECT * INTO d FROM property_documents WHERE id = p_doc;
  IF d.id IS NULL OR coalesce(user_role_in_instance(d.instance_id), '') NOT IN ('owner', 'admin', 'member') THEN
    RAISE EXCEPTION 'only the family can send a document for signature' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF d.archived_at IS NOT NULL THEN RAISE EXCEPTION 'that document has been removed'; END IF;
  IF d.sign_status <> 'none' THEN RAISE EXCEPTION 'that document has already been sent for signature (%)', d.sign_status; END IF;
  IF p_signers IS NULL OR cardinality(p_signers) = 0 OR NOT (p_signers <@ ARRAY['tenant', 'landlord']::text[]) THEN
    RAISE EXCEPTION 'name who signs: the tenant, the landlord, or both';
  END IF;
  IF 'tenant' = ANY (p_signers) AND d.tenancy_id IS NULL THEN
    RAISE EXCEPTION 'file it to the tenancy first: a tenant can only sign their own tenancy''s papers';
  END IF;
  IF d.source = 'generated' AND NOT coalesce(p_counsel_reviewed, false) THEN
    RAISE EXCEPTION 'a generated draft goes to counsel before anyone signs it; record that counsel reviewed it to send it';
  END IF;
  v_hash := encode(sha256(convert_to(d.storage_path, 'UTF8')), 'hex');
  UPDATE property_documents
     SET content_hash = v_hash, sign_status = 'awaiting',
         signers_required = ARRAY(SELECT DISTINCT unnest(p_signers) ORDER BY 1),
         sign_requested_at = clock_timestamp(), sign_requested_by = auth.uid(),
         counsel_attested_by = CASE WHEN d.source = 'generated' THEN auth.uid() END,
         counsel_attested_at = CASE WHEN d.source = 'generated' THEN clock_timestamp() END
   WHERE id = p_doc;
  INSERT INTO door_events (instance_id, subject, subject_id, event, to_value, detail, by_user)
  VALUES (d.instance_id, 'document', d.id, 'signature-requested', array_to_string(p_signers, ','),
          jsonb_strip_nulls(jsonb_build_object('title', d.title, 'kind', d.kind, 'version', v_hash,
            'counsel_attested', CASE WHEN d.source = 'generated' THEN true END)), auth.uid());
  RETURN v_hash;
END $$;
REVOKE ALL ON FUNCTION public.property_document_request_signatures(uuid, text[], boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.property_document_request_signatures(uuid, text[], boolean) TO authenticated;

-- ---------------------------------------------------------------------------
-- 5. Sign — as the tenant of that tenancy, or as the family.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.property_document_sign(
  p_doc uuid, p_role text, p_signature text, p_doc_version text,
  p_attestation text, p_consent text, p_device_at timestamptz DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE d record; v_left int;
BEGIN
  SELECT * INTO d FROM property_documents WHERE id = p_doc;
  IF d.id IS NULL THEN RAISE EXCEPTION 'no such document' USING ERRCODE = 'insufficient_privilege'; END IF;
  IF p_role = 'tenant' THEN
    IF d.tenancy_id IS NULL OR NOT user_is_tenant(d.tenancy_id) THEN
      RAISE EXCEPTION 'only the tenant of this tenancy can sign as tenant' USING ERRCODE = 'insufficient_privilege';
    END IF;
  ELSIF p_role = 'landlord' THEN
    IF coalesce(user_role_in_instance(d.instance_id), '') NOT IN ('owner', 'admin') THEN
      RAISE EXCEPTION 'only the family can sign as landlord' USING ERRCODE = 'insufficient_privilege';
    END IF;
  ELSE
    RAISE EXCEPTION 'sign as the tenant or as the landlord';
  END IF;
  IF d.sign_status <> 'awaiting' THEN RAISE EXCEPTION 'this document is not waiting for signatures (%)', d.sign_status; END IF;
  IF NOT (p_role = ANY (d.signers_required)) THEN RAISE EXCEPTION 'this document does not ask for a % signature', p_role; END IF;
  IF p_doc_version IS DISTINCT FROM d.content_hash THEN
    RAISE EXCEPTION 'the document changed or did not load completely; reopen it and read it again before signing';
  END IF;
  IF EXISTS (SELECT 1 FROM property_document_signatures WHERE document_id = p_doc AND signer_role = p_role) THEN
    RAISE EXCEPTION 'the % has already signed this document', p_role;
  END IF;

  INSERT INTO property_document_signatures
    (document_id, instance_id, signer_user_id, signer_role, signature, attestation, consent, doc_version, signed_on_device_at)
  VALUES (p_doc, d.instance_id, auth.uid(), p_role, btrim(p_signature), btrim(p_attestation), btrim(p_consent), p_doc_version, p_device_at);
  INSERT INTO door_events (instance_id, subject, subject_id, event, to_value, detail, by_user)
  VALUES (d.instance_id, 'document', d.id, 'signed', p_role,
          jsonb_strip_nulls(jsonb_build_object('title', d.title, 'version', p_doc_version, 'on_device_at', p_device_at)), auth.uid());

  SELECT count(*) INTO v_left FROM unnest(d.signers_required) r
   WHERE NOT EXISTS (SELECT 1 FROM property_document_signatures s WHERE s.document_id = p_doc AND s.signer_role = r);
  IF v_left = 0 THEN
    UPDATE property_documents SET sign_status = 'signed', signed_at = clock_timestamp() WHERE id = p_doc;
    INSERT INTO door_events (instance_id, subject, subject_id, event, to_value, detail, by_user)
    VALUES (d.instance_id, 'document', d.id, 'fully-signed', 'signed', jsonb_build_object('title', d.title, 'version', p_doc_version), auth.uid());
    RETURN 'signed';
  END IF;
  RETURN 'awaiting';
END $$;
REVOKE ALL ON FUNCTION public.property_document_sign(uuid, text, text, text, text, text, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.property_document_sign(uuid, text, text, text, text, text, timestamptz) TO authenticated;

SELECT public.apply_viewer_readonly_overlay();
SELECT public.apply_assistant_scope_overlay();

NOTIFY pgrst, 'reload schema';
