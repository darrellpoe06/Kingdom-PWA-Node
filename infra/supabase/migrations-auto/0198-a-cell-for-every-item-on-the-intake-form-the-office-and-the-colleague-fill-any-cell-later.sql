-- =============================================================================
-- 0198 -- A CELL FOR EVERY ITEM ON THE INTAKE FORM: the office and the
--         colleague fill any cell, later (DR-0354)
-- =============================================================================
-- Darrell 2026-09-10: "at least create a place for all items on the intake
-- form even if Christina needs to add the data later or even have users add
-- their own data... we need the cells to accommodate the data."
--
-- BEFORE: a colleague's answers lived only in their packet, editable by them
-- while it was a draft; the office could read a packet, never write a cell;
-- a prefilled invite (0197) held answers nobody could see until the person
-- signed in.
--
-- AFTER: every question on the live intake form is a cell the office sees
-- and may fill for a colleague at any time, on a packet of any status or on
-- a not-yet-opened prefilled invite; and a colleague fills or corrects their
-- own cells at any status, approved included. Each change is a patch of
-- named keys, merged onto the record, audited with who and which keys.
--
-- WALLS that never move: a signature, a signed document, a password or a
-- bank number can never be written through a patch (the acknowledgments are
-- the colleague's to make in the packet; banking rides the walled table).
-- =============================================================================

-- The keys a patch may never carry.
CREATE OR REPLACE FUNCTION public.tlc_onboarding_patch_guard(patch_in jsonb)
RETURNS void
LANGUAGE plpgsql IMMUTABLE
AS $$
BEGIN
  IF patch_in IS NULL OR jsonb_typeof(patch_in) <> 'object' THEN RAISE EXCEPTION 'a patch must be an object of named cells'; END IF;
  IF patch_in ? 'acknowledgments' OR patch_in ? 'documents' THEN RAISE EXCEPTION 'signatures and signed documents are the colleague''s to make in the packet, never a patch'; END IF;
  IF patch_in ? 'caqhPassword' OR patch_in ? 'password' THEN RAISE EXCEPTION 'a password is never stored in an intake packet'; END IF;
  IF patch_in ? 'routingNumber' OR patch_in ? 'accountNumber' OR patch_in ? 'bankName' OR patch_in ? 'accountType' THEN RAISE EXCEPTION 'banking is saved separately, never inside the packet'; END IF;
  IF (SELECT count(*) FROM jsonb_object_keys(patch_in)) > 80 THEN RAISE EXCEPTION 'too many cells in one patch'; END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- A packet: the office owner/admin, or the colleague themself, fills cells.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.tlc_onboarding_patch(packet_id_in uuid, patch_in jsonb, note_in text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_pkt  public.tlc_onboarding_packets%ROWTYPE;
  v_name text;
  v_who  text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'sign in first'; END IF;
  PERFORM public.tlc_onboarding_patch_guard(patch_in);
  SELECT * INTO v_pkt FROM public.tlc_onboarding_packets WHERE id = packet_id_in;
  IF v_pkt.id IS NULL THEN RAISE EXCEPTION 'no such packet'; END IF;
  IF v_pkt.applicant_user_id = auth.uid() THEN
    v_who := 'self';
  ELSIF coalesce(public.user_role_in_instance(v_pkt.instance_id), '') IN ('owner','admin') THEN
    v_who := 'office';
  ELSE
    RAISE EXCEPTION 'that packet is not yours to change';
  END IF;

  UPDATE public.tlc_onboarding_packets
     SET packet = coalesce(packet, '{}'::jsonb) || patch_in, updated_at = now()
   WHERE id = v_pkt.id
   RETURNING * INTO v_pkt;

  INSERT INTO audit_log (instance_id, user_id, action, entity_type, entity_id, from_value, to_value, note)
  VALUES (v_pkt.instance_id, auth.uid(), 'update', 'tlc_onboarding_packet', v_pkt.id,
          jsonb_build_object('by', v_who),
          jsonb_build_object('cells', (SELECT jsonb_agg(k) FROM jsonb_object_keys(patch_in) k)),
          coalesce(nullif(left(trim(coalesce(note_in, '')), 500), ''), 'tlc_onboarding_patch'));

  SELECT display_name INTO v_name FROM instances WHERE id = v_pkt.instance_id;
  RETURN public.tlc_onboarding_packet_view(v_pkt, v_name) || jsonb_build_object('patched_by', v_who);
END;
$$;
REVOKE ALL ON FUNCTION public.tlc_onboarding_patch(uuid, jsonb, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tlc_onboarding_patch(uuid, jsonb, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- A not-yet-opened prefilled invite: the office reads and fills its cells.
-- The banking numbers on it are never returned -- only whether they are there.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.tlc_onboarding_invite_read(invite_id_in uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_office record;
  v_inv    public.tlc_onboarding_invites%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'sign in first'; END IF;
  SELECT * INTO v_office FROM public.tlc_onboarding_my_office();
  IF v_office.instance_id IS NULL OR coalesce(v_office.role, '') NOT IN ('owner','admin') THEN
    RAISE EXCEPTION 'only the office owner or admin reads an invite';
  END IF;
  SELECT * INTO v_inv FROM public.tlc_onboarding_invites WHERE id = invite_id_in AND instance_id = v_office.instance_id;
  IF v_inv.id IS NULL THEN RAISE EXCEPTION 'no such invite in your office'; END IF;
  INSERT INTO audit_log (instance_id, user_id, action, entity_type, entity_id, from_value, to_value, note)
  VALUES (v_inv.instance_id, auth.uid(), 'export', 'tlc_onboarding_invite', v_inv.id, NULL, jsonb_build_object('prefilled', v_inv.prefill IS NOT NULL), 'tlc_onboarding_invite_read');
  RETURN jsonb_build_object(
    'invite_id', v_inv.id, 'email', v_inv.email, 'note', v_inv.note, 'source', v_inv.source,
    'created_at', v_inv.created_at, 'expires_at', v_inv.expires_at, 'revoked_at', v_inv.revoked_at,
    'status', 'invited', 'packet', coalesce(v_inv.prefill, '{}'::jsonb),
    'banking_on_file', v_inv.prefill_banking IS NOT NULL AND coalesce(v_inv.prefill_banking->>'routingNumber', '') <> '');
END;
$$;
REVOKE ALL ON FUNCTION public.tlc_onboarding_invite_read(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tlc_onboarding_invite_read(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.tlc_onboarding_invite_patch(invite_id_in uuid, patch_in jsonb, note_in text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_office record;
  v_inv    public.tlc_onboarding_invites%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'sign in first'; END IF;
  PERFORM public.tlc_onboarding_patch_guard(patch_in);
  SELECT * INTO v_office FROM public.tlc_onboarding_my_office();
  IF v_office.instance_id IS NULL OR coalesce(v_office.role, '') NOT IN ('owner','admin') THEN
    RAISE EXCEPTION 'only the office owner or admin fills an invite''s cells';
  END IF;
  SELECT * INTO v_inv FROM public.tlc_onboarding_invites WHERE id = invite_id_in AND instance_id = v_office.instance_id;
  IF v_inv.id IS NULL THEN RAISE EXCEPTION 'no such invite in your office'; END IF;
  IF EXISTS (SELECT 1 FROM public.tlc_onboarding_packets p WHERE p.invite_id = v_inv.id) THEN
    RAISE EXCEPTION 'this invite was opened; fill the packet instead';
  END IF;
  UPDATE public.tlc_onboarding_invites
     SET prefill = coalesce(prefill, '{}'::jsonb) || patch_in
   WHERE id = v_inv.id
   RETURNING * INTO v_inv;
  INSERT INTO audit_log (instance_id, user_id, action, entity_type, entity_id, from_value, to_value, note)
  VALUES (v_inv.instance_id, auth.uid(), 'update', 'tlc_onboarding_invite', v_inv.id,
          jsonb_build_object('by', 'office'),
          jsonb_build_object('cells', (SELECT jsonb_agg(k) FROM jsonb_object_keys(patch_in) k)),
          coalesce(nullif(left(trim(coalesce(note_in, '')), 500), ''), 'tlc_onboarding_invite_patch'));
  RETURN jsonb_build_object('invite_id', v_inv.id, 'email', v_inv.email, 'status', 'invited', 'packet', v_inv.prefill);
END;
$$;
REVOKE ALL ON FUNCTION public.tlc_onboarding_invite_patch(uuid, jsonb, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tlc_onboarding_invite_patch(uuid, jsonb, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- The office list says which waiting invites already carry answers, and whose.
-- Everything else is 0187's, verbatim (the list never carries a body, DR-0303).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.tlc_onboarding_list()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_office record;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'sign in first'; END IF;
  SELECT * INTO v_office FROM public.tlc_onboarding_my_office();
  IF v_office.instance_id IS NULL OR coalesce(v_office.role, '') NOT IN ('owner','admin') THEN
    RETURN jsonb_build_object('office_name', v_office.office_name, 'manager', false, 'invites', '[]'::jsonb, 'packets', '[]'::jsonb);
  END IF;
  RETURN jsonb_build_object(
    'office_name', v_office.office_name,
    'manager', true,
    'invites', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
               'id', i.id, 'email', i.email, 'note', i.note, 'token', i.token,
               'created_at', i.created_at, 'expires_at', i.expires_at, 'revoked_at', i.revoked_at,
               'opened', EXISTS (SELECT 1 FROM public.tlc_onboarding_packets p WHERE p.invite_id = i.id),
               'prefilled', i.prefill IS NOT NULL,
               'source', i.source,
               'applicant_name', nullif(trim(concat_ws(' ', i.prefill->>'firstName', i.prefill->>'lastName')), ''),
               'license_type', i.prefill->>'licenseType')
             ORDER BY i.created_at DESC)
        FROM public.tlc_onboarding_invites i
       WHERE i.instance_id = v_office.instance_id
         AND i.revoked_at IS NULL
         AND NOT EXISTS (SELECT 1 FROM public.tlc_onboarding_packets p WHERE p.invite_id = i.id)), '[]'::jsonb),
    'packets', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
               'packet_id', p.id, 'invite_id', p.invite_id, 'email', p.applicant_email,
               'status', p.status,
               'applicant_name', nullif(trim(concat_ws(' ', p.packet->>'firstName', p.packet->>'lastName')), ''),
               'preferred_name', p.packet->>'preferredName',
               'license_type', p.packet->>'licenseType',
               'submitted_at', p.submitted_at, 'reviewed_at', p.reviewed_at,
               'clinician_id', p.clinician_id, 'updated_at', p.updated_at, 'created_at', p.created_at)
             ORDER BY p.updated_at DESC)
        FROM public.tlc_onboarding_packets p
       WHERE p.instance_id = v_office.instance_id), '[]'::jsonb)
  );
END;
$$;
REVOKE ALL ON FUNCTION public.tlc_onboarding_list() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tlc_onboarding_list() TO authenticated;

SELECT public.apply_assistant_scope_overlay();
SELECT public.apply_viewer_readonly_overlay();

NOTIFY pgrst, 'reload schema';
