-- =============================================================================
-- 0199 — A check at the bottom of every document: the colleague acknowledges
-- in place, the office stamps the time (DR-0356)
-- =============================================================================
-- Darrell 2026-09-10: "still don't have a check box at the bottom of the
-- documents with time stamps for when they agreed... like a green check that
-- they acknowledged!"
--
-- The three acknowledgments (handbook / policies, confidentiality,
-- contractor agreement) could be signed only inside the packet form, only
-- while the packet was a draft or returned, and only by saving the WHOLE
-- packet. This function signs ONE document, from wherever the document is
-- read (Team → Documents, the reader inside the packet), by the colleague
-- themself, at any status — and the office's own clock stamps it, the same
-- stamp 0194 gives a submit. What is written is exactly the acknowledgment
-- record the packet already carries (agreed, signature, signedOn, signedAt,
-- docVersion, attestation, agreedAt, signedAtServer), so every reader of the
-- packet (the readout, the export, the review) sees it the same way.
--
-- WALLS: only the packet's own applicant may sign (the office never signs for
-- a colleague); a signature needs the typed full name and the checkbox
-- sentence; only the three known keys; the record is a new signing when the
-- signature or the document version differs from what is stored (the stamp
-- renews), otherwise the stored stamp is kept.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.tlc_onboarding_acknowledge(
  packet_id_in uuid,
  key_in text,
  signature_in text,
  doc_version_in text DEFAULT NULL,
  attestation_in text DEFAULT NULL,
  agreed_at_in text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_pkt   public.tlc_onboarding_packets%ROWTYPE;
  v_name  text;
  v_stamp text := to_char(clock_timestamp() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  v_prev  jsonb;
  v_rec   jsonb;
  v_sig   text := left(trim(coalesce(signature_in, '')), 200);
  v_att   text := left(trim(coalesce(attestation_in, '')), 500);
  v_ver   text := left(trim(coalesce(doc_version_in, '')), 40);
  v_agreed_at text := left(trim(coalesce(agreed_at_in, '')), 40);
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'sign in first'; END IF;
  IF key_in IS NULL OR key_in NOT IN ('policies','confidentiality','contractorAgreement') THEN
    RAISE EXCEPTION 'no such document to acknowledge';
  END IF;
  IF v_sig = '' THEN RAISE EXCEPTION 'sign by typing your full legal name'; END IF;
  IF v_att = '' THEN RAISE EXCEPTION 'the acknowledgment sentence must be checked'; END IF;

  SELECT * INTO v_pkt FROM public.tlc_onboarding_packets WHERE id = packet_id_in;
  IF v_pkt.id IS NULL THEN RAISE EXCEPTION 'no such packet'; END IF;
  IF v_pkt.applicant_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'only the colleague themself may acknowledge a document';
  END IF;

  v_prev := coalesce(v_pkt.packet->'acknowledgments'->key_in, '{}'::jsonb);
  v_rec := jsonb_build_object(
    'agreed', true,
    'signature', v_sig,
    'signedOn', left(v_stamp, 10),
    'signedAt', CASE WHEN v_agreed_at <> '' THEN v_agreed_at ELSE v_stamp END,
    'docVersion', v_ver,
    'attestation', v_att,
    'agreedAt', CASE WHEN v_agreed_at <> '' THEN v_agreed_at ELSE v_stamp END,
    -- A re-signing (a different name, or a different document version) is
    -- stamped anew; the same signing keeps the office's first stamp (0194).
    'signedAtServer', CASE
      WHEN coalesce(v_prev->>'signedAtServer', '') <> ''
       AND (v_prev->>'signature') IS NOT DISTINCT FROM v_sig
       AND (v_prev->>'docVersion') IS NOT DISTINCT FROM v_ver
      THEN v_prev->>'signedAtServer'
      ELSE v_stamp END
  );

  UPDATE public.tlc_onboarding_packets
     SET packet = jsonb_set(
           jsonb_set(coalesce(packet, '{}'::jsonb), ARRAY['acknowledgments'], coalesce(packet->'acknowledgments', '{}'::jsonb), true),
           ARRAY['acknowledgments', key_in], v_rec, true),
         updated_at = now()
   WHERE id = v_pkt.id
   RETURNING * INTO v_pkt;

  INSERT INTO audit_log (instance_id, user_id, action, entity_type, entity_id, from_value, to_value, note)
  VALUES (v_pkt.instance_id, auth.uid(), 'update', 'tlc_onboarding_packet', v_pkt.id,
          jsonb_build_object('acknowledged', key_in, 'previousVersion', v_prev->>'docVersion'),
          jsonb_build_object('docVersion', v_ver, 'signedAtServer', v_rec->>'signedAtServer'),
          'tlc_onboarding_acknowledge');

  SELECT display_name INTO v_name FROM instances WHERE id = v_pkt.instance_id;
  RETURN public.tlc_onboarding_packet_view(v_pkt, v_name) || jsonb_build_object('acknowledged', key_in);
END;
$$;
REVOKE ALL ON FUNCTION public.tlc_onboarding_acknowledge(uuid, text, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tlc_onboarding_acknowledge(uuid, text, text, text, text, text) TO authenticated;

SELECT public.apply_assistant_scope_overlay();
SELECT public.apply_viewer_readonly_overlay();

NOTIFY pgrst, 'reload schema';
