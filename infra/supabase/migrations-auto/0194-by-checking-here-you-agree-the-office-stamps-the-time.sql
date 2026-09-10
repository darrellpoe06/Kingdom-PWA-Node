-- =============================================================================
-- 0194 -- "BY CHECKING HERE, YOU AGREE": the office stamps the time
--         (DR-0350 amended)
-- =============================================================================
-- Darrell 2026-09-10: "let's use the time stamps however say 'by checking
-- here you agree' -- something that says they acknowledged it."
--
-- 0191 made every typed signature pin a document version, a device time and
-- the ESIGN consent line. Two things were still soft: the checkbox said only
-- "I have read this and I agree" (the app now carries an explicit attestation
-- sentence, lib/tlc-signing.js, and stores it with the signature), and the
-- TIME was the device's word alone. This file gives each acknowledgment a
-- server stamp: on submit, tlc_onboarding_save writes
-- acknowledgments.<key>.signedAtServer = now() for every signed
-- acknowledgment that has none yet or whose signature / document version
-- changed since the stored packet -- so the record carries the person's
-- device time AND the office's own clock, and a returned packet resubmitted
-- with the same signatures keeps its original stamp.
-- =============================================================================

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
  v_stamp text := to_char(clock_timestamp() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'); -- wall time, not the transaction's now()
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
  -- A credential never enters the row (design point 4).
  IF packet_in ? 'caqhPassword' OR packet_in ? 'password' THEN
    RAISE EXCEPTION 'a password is never stored in an intake packet';
  END IF;
  -- Banking never rides in the packet json either (design point 3).
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
    IF array_length(v_missing, 1) > 0 THEN
      RETURN jsonb_build_object('status', v_pkt.status, 'submitted', false, 'missing', to_jsonb(v_missing));
    END IF;

    -- The office's own clock on every signed acknowledgment (0194). A stamp
    -- already present survives a resubmit unless the signature or the
    -- document version changed -- then it is a new signing and is stamped anew.
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

NOTIFY pgrst, 'reload schema';
