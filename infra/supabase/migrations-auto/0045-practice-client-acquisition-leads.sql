-- =============================================================================
-- 0045 — practice_leads: the client-acquisition (revenue agent team) CRM table
-- =============================================================================
-- Declared by Darrell 2026-06-24. A CLIENT-ACQUISITION process for TLC Therapy
-- Solutions (tlctherapysolutions.com), modeled on the 4-agent "revenue agent
-- team" pattern, built as a reusable in-app workflow under the Practice tab. A
-- practice_lead is the CRM object the workflow lands leads into: a therapy
-- practice / clinician evaluating TLC Therapy Solutions (the B2B product path),
-- or — on the patient-acquisition path — a prospective client for the practice.
--
-- PRE-INTAKE / CONTACT-LEVEL ONLY — NO PHI, BY DESIGN. There are NO clinical
-- columns on this table (no diagnosis, no presenting concern, no session data).
-- This mirrors the Practice inquiry lane's bright line: clinical content lives
-- with the clinician (Acuity), never in SKOS. The B2B path is not PHI-bound;
-- the patient path tracks contact-level data only. The app-side linter
-- (lib/client-acquisition.js flagPotentialPhi / screenMarketingClaim) is the
-- proven-to-catch guard on top of this structural wall.
--
-- ROLE-SCOPED / NO LEAK: family/practice-internal CRM data. RLS scopes every row
-- to the caller's instance and to owner/admin/member roles (the same scope the
-- Practice + Discussions surfaces run under). There is NO anon policy — a lead is
-- never publicly readable or writable. DELETE is tightened to owner/admin.
--
-- CONSENT / SERVED-NOT-SURVEILLED: the consent jsonb records whether outreach is
-- permitted ({ outreachOk, capturedAt, note }); the app gates any outreach action
-- on it. NO outreach is sent from the DB or the app — outputs are drafts a human
-- approves; the NAS workflow (wf-practice-growth, pending) does the drafting.
--
-- DEPENDS ON: schema-v2.1-infra (instances, user_role_in_instance), 0024
--             (restore-authenticated-grants), 0011/0023 (engagement_touch_updated_at).
-- IDEMPOTENT: CREATE ... IF NOT EXISTS, DROP-then-CREATE policies/trigger, guarded
--             publication add. Additive, internal — no public surface.
-- =============================================================================

CREATE TABLE IF NOT EXISTS practice_leads (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id         uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by          uuid REFERENCES auth.users(id),
  slug                text NOT NULL,                       -- stable local id (e.g. 'lead-...')
  audience_preset_key text NOT NULL DEFAULT 'b2b-practices',-- which acquisition path
  name                text NOT NULL DEFAULT '',
  org                 text,                                -- practice / org (B2B)
  role                text,                                -- their role / title (B2B)
  contact_method      text NOT NULL DEFAULT 'email'
                        CHECK (contact_method IN ('email','phone','text','linkedin','other')),
  contact_value       text,
  source              text NOT NULL DEFAULT 'other',
  source_detail       text,
  stage               text NOT NULL DEFAULT 'new',         -- funnel stage (per audience config)
  fit_score           integer CHECK (fit_score IS NULL OR (fit_score >= 0 AND fit_score <= 100)),
  signal_tags         jsonb NOT NULL DEFAULT '[]'::jsonb,  -- demand signals that surfaced this lead
  notes               text,                                -- NO clinical detail (pre-intake only)
  consent             jsonb NOT NULL DEFAULT '{"outreachOk":false,"capturedAt":null,"note":""}'::jsonb,
  nurture_step        integer NOT NULL DEFAULT 0,          -- position in the follow-up sequence
  history             jsonb NOT NULL DEFAULT '[]'::jsonb,  -- stage-change trail
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz,
  updated_by          uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS practice_leads_instance_idx ON practice_leads(instance_id);
CREATE INDEX IF NOT EXISTS practice_leads_stage_idx    ON practice_leads(stage);
CREATE INDEX IF NOT EXISTS practice_leads_created_idx   ON practice_leads(created_at DESC);
-- One row per (instance, slug) so an idempotent re-upload can't duplicate a lead.
CREATE UNIQUE INDEX IF NOT EXISTS practice_leads_slug_uniq ON practice_leads(instance_id, slug);

-- updated_at touch (reuses the shared function defined in 0011/0023).
DROP TRIGGER IF EXISTS practice_leads_touch_updated ON practice_leads;
CREATE TRIGGER practice_leads_touch_updated
  BEFORE UPDATE ON practice_leads
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

-- ---------------------------------------------------------------------------
-- GRANTs. authenticated needs the EXPLICIT grant (the 0024 restore leaves anon
-- untouched; without this a signed-in read/write 403s with 42501 — the Choir
-- incident). NO grant to anon: leads are never public. RLS still gates ROWS.
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON practice_leads TO authenticated;

ALTER TABLE practice_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS practice_leads_read   ON practice_leads;
DROP POLICY IF EXISTS practice_leads_insert ON practice_leads;
DROP POLICY IF EXISTS practice_leads_update ON practice_leads;
DROP POLICY IF EXISTS practice_leads_delete ON practice_leads;

CREATE POLICY practice_leads_read ON practice_leads FOR SELECT
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY practice_leads_insert ON practice_leads FOR INSERT
  TO authenticated
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY practice_leads_update ON practice_leads FOR UPDATE
  TO authenticated
  USING      (user_role_in_instance(instance_id) IN ('owner','admin','member'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY practice_leads_delete ON practice_leads FOR DELETE
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

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
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
       AND tablename = 'practice_leads'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE practice_leads;
  END IF;
END $realtime$;

NOTIFY pgrst, 'reload schema';

-- =============================================================================
-- VERIFY (read-only — run after applying):
--   SELECT count(*) FROM practice_leads;                       -- expect 0 on a fresh apply
--   SELECT polname FROM pg_policies WHERE tablename='practice_leads'; -- expect the 4 policies
--   -- A signed-OUT client SELECT must 403 (no anon policy). A signed-in member
--   -- of the instance can read/insert/update; only owner/admin can delete.
-- =============================================================================
