-- =============================================================================
-- 0120 — tlc-community-outreach: register the pipeline on the ONE CRM backbone
-- =============================================================================
-- Declared by Darrell 2026-07-27. Christina's TLC Therapy Solutions community-
-- outreach directory (Zakaria's lists: the Champaign-Urbana "places to email" —
-- schools, youth organizations, domestic-violence shelters, community hospitals,
-- local nonprofits, OB/GYN & women's health clinics — plus the Chicago-area
-- breast cancer centers) lands as leads on the shared backbone.
--
-- ONE-CRM (DR-0081): a new funnel is a new PIPELINE, never a new table. This
-- migration adds NO tables — it re-declares crm_capture_lead() with the
-- 'tlc-community-outreach' branch so the API seam stays in sync with
-- lib/crm-engine.js PIPELINES (the requirement written into 0046).
--
-- PRIVACY: unchanged posture. Organization-level public contacts only; the
-- forced-safe capture shape (first stage, explicit-only consent, pinned
-- instance, contact-level fields only) applies to this pipeline like every
-- other. No PHI columns exist, by design.
--
-- DEPENDS ON: 0046-crm-backbone-leads.sql (crm_leads + the RPC).
-- IDEMPOTENT: CREATE OR REPLACE only. Additive.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.crm_capture_lead(
  p_pipeline      text,
  p_instance_slug text,
  p_payload       jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $fn$
DECLARE
  v_instance   uuid;
  v_business   text;
  v_stage      text;
  v_seq        text;
  v_consent_ok boolean;
  v_method     text;
  v_id         uuid;
BEGIN
  -- 1. Pipeline allowlist + the business + first stage + sequence it maps to.
  --    Keep this in sync with lib/crm-engine.js PIPELINES.
  CASE p_pipeline
    WHEN 'tlc-client-intake'        THEN v_business := 'tlc';        v_stage := 'new'; v_seq := 'tlc-client-nurture';
    WHEN 'tlc-therapist-recruiting' THEN v_business := 'tlc';        v_stage := 'new'; v_seq := 'tlc-recruit-nurture';
    WHEN 'tlc-community-outreach'   THEN v_business := 'tlc';        v_stage := 'new'; v_seq := 'tlc-community-nurture';
    WHEN 'tlc-training-enrollment'  THEN v_business := 'tlc';        v_stage := 'new'; v_seq := 'tlc-training-nurture';
    WHEN 'gtm-subscriber'           THEN v_business := 'gtm';        v_stage := 'new'; v_seq := 'gtm-welcome';
    WHEN 'boxcar-booking'           THEN v_business := 'boxcar';     v_stage := 'new'; v_seq := 'boxcar-confirm';
    WHEN 'realestate-leads'         THEN v_business := 'realestate'; v_stage := 'new'; v_seq := 'realestate-nurture';
    ELSE RAISE EXCEPTION 'crm_capture_lead: unknown pipeline %', p_pipeline;
  END CASE;

  -- 2. Pin the instance by slug. Caller cannot route into another tenant.
  SELECT id INTO v_instance FROM instances WHERE slug = p_instance_slug;
  IF v_instance IS NULL THEN
    RAISE EXCEPTION 'crm_capture_lead: unknown instance slug %', p_instance_slug;
  END IF;

  -- 3. Explicit-only consent + a validated contact method (default email).
  v_consent_ok := (p_payload ->> 'consentOutreachOk') = 'true';
  v_method := COALESCE(NULLIF(p_payload ->> 'contactMethod',''), 'email');
  IF v_method NOT IN ('email','phone','text','linkedin','in-person','other') THEN
    v_method := 'other';
  END IF;

  -- 4. Insert the forced-safe row. Only contact-level fields are read; stage is
  --    the first stage; seed is false; consent is explicit-only.
  INSERT INTO crm_leads (
    instance_id, created_by, slug, business, pipeline, stage,
    name, org, role, contact_method, contact_value,
    source, source_detail, notes, consent, nurture_step, sequence_key, seed, history
  ) VALUES (
    v_instance,
    auth.uid(),  -- null for anon capture; set for an authenticated form
    COALESCE(NULLIF(p_payload ->> 'slug',''), 'cap-' || gen_random_uuid()::text),
    v_business,
    p_pipeline,
    v_stage,
    COALESCE(p_payload ->> 'name', ''),
    NULLIF(p_payload ->> 'org',''),
    NULLIF(p_payload ->> 'role',''),
    v_method,
    NULLIF(p_payload ->> 'contactValue',''),
    COALESCE(NULLIF(p_payload ->> 'source',''), 'other'),
    NULLIF(p_payload ->> 'sourceDetail',''),
    NULLIF(p_payload ->> 'notes',''),
    jsonb_build_object(
      'outreachOk', v_consent_ok,
      'channels', COALESCE(p_payload -> 'consentChannels', '[]'::jsonb),
      'capturedAt', CASE WHEN v_consent_ok THEN now()::text ELSE NULL END,
      'note', COALESCE(p_payload ->> 'consentNote', '')
    ),
    0,
    v_seq,
    false,
    jsonb_build_array(jsonb_build_object('stage', v_stage, 'at', now()::text))
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.crm_capture_lead(text, text, jsonb) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';

-- =============================================================================
-- VERIFY (read-only — run after applying):
--   SELECT public.crm_capture_lead('tlc-community-outreach','tlc',
--     '{"name":"Test Org","org":"Test Org","contactMethod":"email","source":"community-list"}'::jsonb);
--   -- expect: a uuid; the row lands stage 'new', consent outreachOk=false.
-- =============================================================================
