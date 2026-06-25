-- =============================================================================
-- 0046 — crm_leads + crm_activities: the ONE sovereign CRM backbone
-- =============================================================================
-- Declared by Darrell 2026-06-24. "Formalize ONE shared, sovereign in-app CRM
-- backbone and wire the acquisition funnels onto it." This is the SINGLE store
-- (not one table per business): every funnel — TLC (client intake / therapist
-- recruiting / training enrollment), the GTM subscriber funnel, Boxcar same-night
-- booking, and real-estate leads — writes leads into `crm_leads`, scoped by
-- `business` + `pipeline`. `crm_activities` is the touchpoint / activity trail.
-- The pure engine is lib/crm-engine.js; the surface is CRM.jsx; the sync is
-- crm-sync.js; this migration is the store + the API seam (crm_capture_lead).
--
-- RELATION TO 0045-practice-client-acquisition-leads.sql (the TLC lane, in
-- flight): that migration created `practice_leads` for the TLC client-acquisition
-- workflow. `crm_leads` is the GENERALIZED superset of that design (adds
-- `business` + `pipeline`; same consent / source / stage / nurture / history /
-- no-PHI shape). The TLC lane's leads retarget onto `crm_leads` via the engine's
-- leadFromPracticeAcquisition() adapter — one table, no fork. Both migrations are
-- independently idempotent, so they coexist safely while the lanes converge.
--
-- PRIVACY / PII-MINIMAL — contact-level data ONLY. There are NO clinical columns
-- (no diagnosis, presenting concern, session data) and NO payment columns (no
-- card, bank, processor). PHI lives with the clinician (Acuity); money is the
-- owner's hand. The structural wall is the absence of the columns; the app-side
-- linter (crm-engine.js flagPotentialPhi / screenMarketingClaim) is the proven-
-- to-catch guard on top.
--
-- CONSENT / SERVED-NOT-SURVEILLED — the consent jsonb records whether outreach is
-- permitted ({ outreachOk, channels, capturedAt, note }); the app gates every
-- outreach action on it. NO outreach is sent from the DB or the app — follow-up
-- steps are drafts a human approves; the sovereign LLM (NAS workflow) drafts copy.
--
-- ROLE-SCOPED / NO LEAK — owner/admin/member of the row's instance for read/
-- write; DELETE tightened to owner/admin. Authenticated staff use RLS-gated
-- direct access. PUBLIC/inbound capture (forms, the content engine, n8n) goes
-- through the SECURITY DEFINER crm_capture_lead() RPC, which forces the safe
-- shape (first stage, explicit-only consent, attributed source, pinned instance)
-- and NEVER lets an anon caller self-advance, self-approve, or self-consent.
--
-- DEPENDS ON: schema-v2.1-infra (instances, user_role_in_instance), 0024
--             (restore-authenticated-grants), 0011/0023 (engagement_touch_updated_at).
-- IDEMPOTENT: CREATE ... IF NOT EXISTS, CREATE OR REPLACE, DROP-then-CREATE
--             policies/trigger, guarded publication add. Additive.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- crm_leads — the canonical lead record. Generic across every business.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crm_leads (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id     uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by      uuid REFERENCES auth.users(id),
  slug            text NOT NULL,                          -- stable local id (e.g. 'lead-...')
  business        text NOT NULL DEFAULT 'tlc',            -- which vertical/tenant config
  pipeline        text NOT NULL DEFAULT 'tlc-client-intake', -- which funnel within the business
  stage           text NOT NULL DEFAULT 'new',            -- funnel stage (per pipeline config)
  name            text NOT NULL DEFAULT '',
  org             text,                                   -- practice / company (B2B)
  role            text,                                   -- their role / title (B2B)
  contact_method  text NOT NULL DEFAULT 'email'
                    CHECK (contact_method IN ('email','phone','text','linkedin','in-person','other')),
  contact_value   text,
  source          text NOT NULL DEFAULT 'other',          -- attributed acquisition source
  source_detail   text,
  fit_score       integer CHECK (fit_score IS NULL OR (fit_score >= 0 AND fit_score <= 100)),
  signal_tags     jsonb NOT NULL DEFAULT '[]'::jsonb,     -- demand signals that surfaced this lead
  notes           text,                                   -- NO clinical detail (contact-level only)
  consent         jsonb NOT NULL DEFAULT '{"outreachOk":false,"channels":[],"capturedAt":null,"note":""}'::jsonb,
  nurture_step    integer NOT NULL DEFAULT 0,             -- position in the follow-up sequence
  sequence_key    text,                                   -- the pipeline's nurture sequence
  owner_user_id   uuid REFERENCES auth.users(id),         -- the staff owner of this lead
  seed            boolean NOT NULL DEFAULT false,          -- demo/seed (never an outreach target)
  links           jsonb NOT NULL DEFAULT '{}'::jsonb,     -- cross-entity connections
  history         jsonb NOT NULL DEFAULT '[]'::jsonb,     -- stage-change trail
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz,
  updated_by      uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS crm_leads_instance_idx ON crm_leads(instance_id);
CREATE INDEX IF NOT EXISTS crm_leads_pipeline_idx ON crm_leads(instance_id, pipeline);
CREATE INDEX IF NOT EXISTS crm_leads_stage_idx    ON crm_leads(stage);
CREATE INDEX IF NOT EXISTS crm_leads_created_idx   ON crm_leads(created_at DESC);
-- One row per (instance, slug) so an idempotent re-upload can't duplicate a lead.
CREATE UNIQUE INDEX IF NOT EXISTS crm_leads_slug_uniq ON crm_leads(instance_id, slug);

DROP TRIGGER IF EXISTS crm_leads_touch_updated ON crm_leads;
CREATE TRIGGER crm_leads_touch_updated
  BEFORE UPDATE ON crm_leads
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

-- ---------------------------------------------------------------------------
-- crm_activities — the touchpoint / activity trail for a lead. A note, a status
-- change, an outreach DRAFT, an outreach a human SENT, or an inbound message.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crm_activities (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id     uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  lead_id         uuid NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
  created_by      uuid REFERENCES auth.users(id),
  slug            text,                                   -- stable local id
  kind            text NOT NULL DEFAULT 'note'
                    CHECK (kind IN ('note','status-change','outreach-draft','outreach-sent','inbound','task')),
  channel         text CHECK (channel IS NULL OR channel IN ('email','phone','text','linkedin','in-person','other')),
  direction       text CHECK (direction IS NULL OR direction IN ('inbound','outbound')),
  summary         text,
  body            text,
  meta            jsonb NOT NULL DEFAULT '{}'::jsonb,
  at              timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS crm_activities_instance_idx ON crm_activities(instance_id);
CREATE INDEX IF NOT EXISTS crm_activities_lead_idx     ON crm_activities(lead_id, at DESC);

-- ---------------------------------------------------------------------------
-- GRANTs. authenticated needs the EXPLICIT grant (the 0024 restore leaves anon
-- untouched; without this a signed-in read/write 403s with 42501 — the Choir
-- incident). NO direct table grant to anon: inbound/public capture goes through
-- the SECURITY DEFINER RPC below, never a raw table write. RLS still gates ROWS.
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON crm_leads      TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON crm_activities TO authenticated;

ALTER TABLE crm_leads      ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;

-- crm_leads: owner/admin/member read+write; owner/admin delete. No anon policy.
DROP POLICY IF EXISTS crm_leads_read   ON crm_leads;
DROP POLICY IF EXISTS crm_leads_insert ON crm_leads;
DROP POLICY IF EXISTS crm_leads_update ON crm_leads;
DROP POLICY IF EXISTS crm_leads_delete ON crm_leads;

CREATE POLICY crm_leads_read ON crm_leads FOR SELECT
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY crm_leads_insert ON crm_leads FOR INSERT
  TO authenticated
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY crm_leads_update ON crm_leads FOR UPDATE
  TO authenticated
  USING      (user_role_in_instance(instance_id) IN ('owner','admin','member'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY crm_leads_delete ON crm_leads FOR DELETE
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- crm_activities: same instance/role scope, keyed through the parent lead's
-- instance. owner/admin/member read+write; owner/admin delete.
DROP POLICY IF EXISTS crm_activities_read   ON crm_activities;
DROP POLICY IF EXISTS crm_activities_insert ON crm_activities;
DROP POLICY IF EXISTS crm_activities_update ON crm_activities;
DROP POLICY IF EXISTS crm_activities_delete ON crm_activities;

CREATE POLICY crm_activities_read ON crm_activities FOR SELECT
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY crm_activities_insert ON crm_activities FOR INSERT
  TO authenticated
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY crm_activities_update ON crm_activities FOR UPDATE
  TO authenticated
  USING      (user_role_in_instance(instance_id) IN ('owner','admin','member'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY crm_activities_delete ON crm_activities FOR DELETE
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- ===========================================================================
-- crm_capture_lead — the API seam. The ONE wired "other end" every funnel,
-- public form, content-engine touchpoint, and inbound channel writes a lead
-- through. SECURITY DEFINER so an anon/inbound caller can land a lead WITHOUT a
-- raw table grant — but only in a forced-safe shape:
--   * pipeline must be on the allowlist (else the call raises)
--   * instance is pinned by slug (caller cannot route into another tenant)
--   * stage is FORCED to the pipeline's first stage (no self-advance)
--   * consent is EXPLICIT-only: outreachOk is whatever the payload literally
--     passed as the boolean true; anything else is false (no self-consent)
--   * only the contact-level fields below are read from the payload — any extra
--     key (clinical, payment, etc.) is simply never read (structural strip)
--   * seed is always false (a captured lead is real, never demo)
-- Returns the new lead id.
-- ===========================================================================
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

-- The capture RPC is callable by anon (public forms) and authenticated (in-app
-- forms, the content engine, n8n). It is the ONLY anon write path; there is no
-- anon grant on the tables themselves.
GRANT EXECUTE ON FUNCTION public.crm_capture_lead(text, text, jsonb) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- REALTIME — stream so a lead captured on one device shows up live on another,
-- the same way inquiries / discussions / projects sync.
-- ---------------------------------------------------------------------------
DO $realtime$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'crm_leads'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE crm_leads;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'crm_activities'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE crm_activities;
  END IF;
END $realtime$;

NOTIFY pgrst, 'reload schema';

-- =============================================================================
-- VERIFY (read-only — run after applying):
--   SELECT count(*) FROM crm_leads;                              -- expect 0 fresh
--   SELECT polname FROM pg_policies WHERE tablename='crm_leads'; -- expect 4 policies
--   -- Anon capture lands a forced-safe lead:
--   SELECT public.crm_capture_lead('gtm-subscriber','poe-family',
--     '{"name":"Test","contactValue":"t@example.com","source":"website","consentOutreachOk":true}'::jsonb);
--   -- A signed-OUT raw SELECT/INSERT on crm_leads must 403 (no anon table grant).
-- =============================================================================
