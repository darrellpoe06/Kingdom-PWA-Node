-- =============================================================================
-- 0197 -- COLLEAGUES ALREADY ON THE FORM: a prefilled invite, claimed by
--         email at sign-in (DR-0353)
-- =============================================================================
-- Darrell 2026-09-10: "Add our users into the app so they can log in and
-- already have access to their information... from TLC Therapy Solutions
-- intake form."
--
-- The colleagues who filled the office's Google hiring form (2025-09 to
-- 2026-05) have no account yet. The rule stands that their answers never
-- enter the repository (DR-0344): this file ships the MECHANISM; the answers
-- go straight from the responses sheet into the live database, once, by the
-- office's hand.
--
-- MECHANISM: an onboarding invite may carry a PREFILL -- the packet body as
-- the colleague answered it -- and, apart, the direct-deposit numbers. When
-- that colleague first opens their packet (by the link, or simply by signing
-- in with the same email: tlc_onboarding_claim), the packet is created FROM
-- the prefill, the banking numbers go to the walled table and are wiped from
-- the invite, and everything they answered is already there. They sign the
-- three documents in the app (a signature is never prefilled -- it is theirs
-- to make, on the versioned text) and submit; the office approves as usual.
--
-- A prefill can never carry a password or a bank number in the packet body
-- (the same walls the save function keeps); the form's CAQH password column
-- is never imported.
-- =============================================================================

ALTER TABLE public.tlc_onboarding_invites ADD COLUMN IF NOT EXISTS prefill jsonb;
ALTER TABLE public.tlc_onboarding_invites ADD COLUMN IF NOT EXISTS prefill_banking jsonb;
ALTER TABLE public.tlc_onboarding_invites ADD COLUMN IF NOT EXISTS source text;
ALTER TABLE public.tlc_onboarding_invites DROP CONSTRAINT IF EXISTS tlc_onboarding_invites_prefill_check;
ALTER TABLE public.tlc_onboarding_invites ADD CONSTRAINT tlc_onboarding_invites_prefill_check CHECK (
  prefill IS NULL OR (
    jsonb_typeof(prefill) = 'object'
    AND NOT (prefill ? 'caqhPassword') AND NOT (prefill ? 'password')
    AND NOT (prefill ? 'routingNumber') AND NOT (prefill ? 'accountNumber')));
ALTER TABLE public.tlc_onboarding_invites DROP CONSTRAINT IF EXISTS tlc_onboarding_invites_prefill_banking_check;
ALTER TABLE public.tlc_onboarding_invites ADD CONSTRAINT tlc_onboarding_invites_prefill_banking_check CHECK (
  prefill_banking IS NULL OR jsonb_typeof(prefill_banking) = 'object');
ALTER TABLE public.tlc_onboarding_invites DROP CONSTRAINT IF EXISTS tlc_onboarding_invites_source_check;
ALTER TABLE public.tlc_onboarding_invites ADD CONSTRAINT tlc_onboarding_invites_source_check CHECK (
  source IS NULL OR char_length(source) <= 120);

-- ---------------------------------------------------------------------------
-- One helper starts a packet from an invite: the prefill becomes the packet,
-- the banking numbers go to the walled table and leave the invite.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.tlc_onboarding_start_packet(inv public.tlc_onboarding_invites)
RETURNS public.tlc_onboarding_packets
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_email text;
  v_pkt   public.tlc_onboarding_packets%ROWTYPE;
  v_bank  jsonb := inv.prefill_banking;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
  INSERT INTO public.tlc_onboarding_packets (instance_id, invite_id, applicant_user_id, applicant_email, packet)
  VALUES (inv.instance_id, inv.id, auth.uid(), coalesce(v_email, inv.email), coalesce(inv.prefill, '{}'::jsonb))
  RETURNING * INTO v_pkt;

  IF v_bank IS NOT NULL AND coalesce(v_bank->>'routingNumber', '') <> '' THEN
    INSERT INTO public.tlc_onboarding_banking (packet_id, instance_id, bank_name, routing_number, account_number, account_type)
    VALUES (v_pkt.id, v_pkt.instance_id,
            trim(coalesce(v_bank->>'bankName', '')),
            regexp_replace(coalesce(v_bank->>'routingNumber', ''), '\D', '', 'g'),
            regexp_replace(coalesce(v_bank->>'accountNumber', ''), '\D', '', 'g'),
            CASE WHEN v_bank->>'accountType' = 'savings' THEN 'savings' ELSE 'checking' END)
    ON CONFLICT (packet_id) DO NOTHING;
  END IF;
  -- The numbers now live only behind the wall.
  UPDATE public.tlc_onboarding_invites SET prefill_banking = NULL WHERE id = inv.id;

  INSERT INTO audit_log (instance_id, user_id, action, entity_type, entity_id, from_value, to_value, note)
  VALUES (v_pkt.instance_id, auth.uid(), 'create', 'tlc_onboarding_packet', v_pkt.id,
          NULL, jsonb_build_object('invite_id', inv.id, 'prefilled', inv.prefill IS NOT NULL, 'source', inv.source), 'tlc_onboarding_start_packet');
  RETURN v_pkt;
END;
$$;
REVOKE ALL ON FUNCTION public.tlc_onboarding_start_packet(public.tlc_onboarding_invites) FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Open by the link: 0187's shape; the packet now starts from the helper.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.tlc_onboarding_open(token_in text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_inv    public.tlc_onboarding_invites%ROWTYPE;
  v_pkt    public.tlc_onboarding_packets%ROWTYPE;
  v_name   text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'sign in first'; END IF;
  SELECT * INTO v_inv FROM public.tlc_onboarding_invites WHERE token = trim(coalesce(token_in, ''));
  IF v_inv.id IS NULL THEN RETURN jsonb_build_object('status', 'unknown'); END IF;
  IF v_inv.revoked_at IS NOT NULL THEN RETURN jsonb_build_object('status', 'revoked'); END IF;

  SELECT display_name INTO v_name FROM instances WHERE id = v_inv.instance_id;
  SELECT * INTO v_pkt FROM public.tlc_onboarding_packets WHERE invite_id = v_inv.id;

  IF v_pkt.id IS NULL THEN
    IF v_inv.expires_at < now() THEN RETURN jsonb_build_object('status', 'expired'); END IF;
    v_pkt := public.tlc_onboarding_start_packet(v_inv);
  ELSIF v_pkt.applicant_user_id <> auth.uid() THEN
    RETURN jsonb_build_object('status', 'taken');
  END IF;

  RETURN public.tlc_onboarding_packet_view(v_pkt, v_name);
END;
$$;
REVOKE ALL ON FUNCTION public.tlc_onboarding_open(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tlc_onboarding_open(text) TO authenticated;

-- ---------------------------------------------------------------------------
-- Claim by email: a colleague who signs in with the address the office
-- invited finds their packet without the link. Their own packet, if one
-- exists, comes first; else the newest open invite for their email starts
-- one; else null.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.tlc_onboarding_claim()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_email text;
  v_inv   public.tlc_onboarding_invites%ROWTYPE;
  v_pkt   public.tlc_onboarding_packets%ROWTYPE;
  v_name  text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'sign in first'; END IF;
  SELECT * INTO v_pkt FROM public.tlc_onboarding_packets WHERE applicant_user_id = auth.uid() ORDER BY updated_at DESC LIMIT 1;
  IF v_pkt.id IS NOT NULL THEN
    SELECT display_name INTO v_name FROM instances WHERE id = v_pkt.instance_id;
    RETURN public.tlc_onboarding_packet_view(v_pkt, v_name) || jsonb_build_object('claimed', false);
  END IF;

  SELECT lower(coalesce(email, '')) INTO v_email FROM auth.users WHERE id = auth.uid();
  IF v_email = '' THEN RETURN NULL; END IF;
  SELECT i.* INTO v_inv
    FROM public.tlc_onboarding_invites i
   WHERE i.email = v_email AND i.revoked_at IS NULL AND i.expires_at > now()
     AND NOT EXISTS (SELECT 1 FROM public.tlc_onboarding_packets p WHERE p.invite_id = i.id)
   ORDER BY i.created_at DESC LIMIT 1;
  IF v_inv.id IS NULL THEN RETURN NULL; END IF;

  v_pkt := public.tlc_onboarding_start_packet(v_inv);
  SELECT display_name INTO v_name FROM instances WHERE id = v_pkt.instance_id;
  RETURN public.tlc_onboarding_packet_view(v_pkt, v_name) || jsonb_build_object('claimed', true);
END;
$$;
REVOKE ALL ON FUNCTION public.tlc_onboarding_claim() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tlc_onboarding_claim() TO authenticated;

-- ---------------------------------------------------------------------------
-- The office mints a prefilled invite (owner/admin) -- the app's own way to
-- bring a colleague on with what the office already knows. The import from
-- the old form uses the same shape.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.tlc_onboarding_invite_prefilled(email_in text, note_in text, prefill_in jsonb, banking_in jsonb DEFAULT NULL, source_in text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_base jsonb;
BEGIN
  IF prefill_in IS NOT NULL AND (jsonb_typeof(prefill_in) <> 'object'
     OR prefill_in ? 'caqhPassword' OR prefill_in ? 'password' OR prefill_in ? 'routingNumber' OR prefill_in ? 'accountNumber') THEN
    RAISE EXCEPTION 'a prefill is the packet body only: never a password, never a bank number';
  END IF;
  v_base := public.tlc_onboarding_invite(email_in, note_in);
  UPDATE public.tlc_onboarding_invites
     SET prefill = prefill_in, prefill_banking = banking_in, source = nullif(left(trim(coalesce(source_in, '')), 120), '')
   WHERE id = (v_base->>'id')::uuid;
  RETURN v_base || jsonb_build_object('prefilled', prefill_in IS NOT NULL);
END;
$$;
REVOKE ALL ON FUNCTION public.tlc_onboarding_invite_prefilled(text, text, jsonb, jsonb, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tlc_onboarding_invite_prefilled(text, text, jsonb, jsonb, text) TO authenticated;

SELECT public.apply_assistant_scope_overlay();
SELECT public.apply_viewer_readonly_overlay();

NOTIFY pgrst, 'reload schema';
