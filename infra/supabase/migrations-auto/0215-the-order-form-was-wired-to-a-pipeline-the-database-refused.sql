-- =============================================================================
-- 0215 — The order form was wired to a pipeline the database refused
-- =============================================================================
-- Reported by Shay, 2026-09-13, on behalf of a real customer: "had Ster create
-- an account on the site and he went to send info through email and it won't
-- let him send." Sterling Moore filled in the Moore Divahs order inquiry on
-- poetech.us, pressed Send my order inquiry, and got back the generic red line
-- "Could not send right now -- please try again in a moment." Trying again
-- could never have worked.
--
-- ROOT CAUSE, EXACT. crm_capture_lead() opens with a CASE that allowlists the
-- pipeline and ends in RAISE EXCEPTION for anything unknown. The allowlist
-- carried seven pipelines. app/src/lib/crm-engine.js defines EIGHT. The missing
-- one is 'moore-orders' -- which is precisely the pipeline the Moore Divahs
-- door's order form submits (business-registry.js capturePipeline). So every
-- order inquiry ever submitted through that door raised:
--
--     crm_capture_lead: unknown pipeline moore-orders
--
-- The client caught the error, returned { skipped: 'capture-error' }, and the
-- form rendered the retry line. Measured rather than assumed: crm_leads holds
-- ZERO rows and has never held one, and the 'poe-family' instance the form
-- targets exists, so the instance lookup was never the problem. The form has
-- not worked once since the door shipped.
--
-- WHY THE TESTS DID NOT CATCH IT, which is the part worth keeping. moore-door
-- .test.js exercises getPipeline('moore-orders') and validateCapture(
-- 'moore-orders', ...) and passes, because both read the JAVASCRIPT pipeline
-- registry. The database's allowlist is a SECOND registry, written by hand in
-- SQL, and nothing compared them. 0085 built this very door and its header
-- says it "Mirrors the crm_capture_lead posture" -- the posture was mirrored
-- and the allowlist was not. A parity gate ships alongside this migration
-- (crm-pipeline-parity.test.js) so the next pipeline added in JS cannot
-- silently be refused by the function.
--
-- THE CHANGE IS THE ONE MISSING BRANCH. Nothing else about the function moves:
-- same signature, same SECURITY DEFINER, same search_path, same explicit-only
-- consent, same forced-safe insert, same tenant pinning by slug. Adding a
-- branch to an allowlist is the whole fix, and the values come from the JS
-- registry rather than from invention -- business 'moore', first stage 'new',
-- sequence 'moore-nurture'.
--
-- DEPENDS ON: the migration that last defined crm_capture_lead (0120).
-- IDEMPOTENT: CREATE OR REPLACE.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.crm_capture_lead(p_pipeline text, p_instance_slug text, p_payload jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
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
  --    KEEP THIS IN SYNC WITH app/src/lib/crm-engine.js PIPELINES. That is not
  --    a wish: crm-pipeline-parity.test.js fails the build when these two
  --    registries disagree, because a pipeline the door can submit and the
  --    function refuses is a form that silently cannot work (0215).
  CASE p_pipeline
    WHEN 'tlc-client-intake'        THEN v_business := 'tlc';        v_stage := 'new'; v_seq := 'tlc-client-nurture';
    WHEN 'tlc-therapist-recruiting' THEN v_business := 'tlc';        v_stage := 'new'; v_seq := 'tlc-recruit-nurture';
    WHEN 'tlc-community-outreach'   THEN v_business := 'tlc';        v_stage := 'new'; v_seq := 'tlc-community-nurture';
    WHEN 'tlc-training-enrollment'  THEN v_business := 'tlc';        v_stage := 'new'; v_seq := 'tlc-training-nurture';
    WHEN 'gtm-subscriber'           THEN v_business := 'gtm';        v_stage := 'new'; v_seq := 'gtm-welcome';
    WHEN 'boxcar-booking'           THEN v_business := 'boxcar';     v_stage := 'new'; v_seq := 'boxcar-confirm';
    WHEN 'realestate-leads'         THEN v_business := 'realestate'; v_stage := 'new'; v_seq := 'realestate-nurture';
    -- The branch that was missing. Sterling's order is the reason it is here.
    WHEN 'moore-orders'             THEN v_business := 'moore';      v_stage := 'new'; v_seq := 'moore-nurture';
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
$function$;

NOTIFY pgrst, 'reload schema';
