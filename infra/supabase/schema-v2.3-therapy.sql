-- =====================================================================
-- Kingdom-PWA / SKOS / PoeTech — schema-v2.3-therapy.sql
--
-- v2.3 THERAPY migration — TLC intake pipeline (non-PHI).
-- Depends on: schema-v2.1-infra.sql.
-- Test instance: TLC, 7 clinicians.
--
-- PHI BOUNDARY (per LEGAL-PRIVACY-BOUNDARY.md):
-- Clinical data — session notes, treatment plans, diagnoses — STAY IN ACUITY.
-- This schema captures the operational intake-to-conversion loop ONLY.
-- Inquiry rows use first_name + last_initial; phone/email are intake-contact
-- channels only, not clinical content.
-- =====================================================================

BEGIN;

-- =====================================================================
-- inquiries — lead intake, non-PHI
-- =====================================================================

CREATE TABLE IF NOT EXISTS inquiries (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz,
  updated_by  uuid REFERENCES auth.users(id),
  lifecycle   jsonb NOT NULL DEFAULT '{"phase":"new","openedAt":null,"closedAt":null,"log":[]}',
  links       jsonb NOT NULL DEFAULT '[]',
  entity_id   uuid REFERENCES entities(id) ON DELETE SET NULL,

  first_name              text NOT NULL,
  last_initial            text NOT NULL,
  contact_method          text NOT NULL CHECK (contact_method IN ('phone','email','both')),
  phone_redacted          text,
  email_redacted          text,
  interest_area           text CHECK (interest_area IN
                            ('individual','couples','family','child',
                             'consultation','group','assessment')),
  has_insurance           text CHECK (has_insurance IN ('Y','N','unsure')),
  insurance_carrier       text,
  preferred_provider_id   uuid,  -- FK to clinicians(id), added after clinicians is created
  best_time_to_call       text,
  source                  text CHECK (source IN
                            ('church','google','facebook','instagram','website',
                             'word-of-mouth','referral-provider','other')),
  source_detail           text,
  notes                   text,
  status                  text NOT NULL DEFAULT 'new'
                            CHECK (status IN
                              ('new','attempting-contact','contacted',
                               'scheduled-intake','converted','declined','non-fit','closed')),
  status_history          jsonb NOT NULL DEFAULT '[]',
  received_at             timestamptz NOT NULL DEFAULT now(),
  handed_off_to_acuity_at timestamptz,
  external_user_id        uuid REFERENCES external_users(id)
);

CREATE INDEX IF NOT EXISTS inquiries_instance_status_idx ON inquiries (instance_id, status);
CREATE INDEX IF NOT EXISTS inquiries_received_at_idx      ON inquiries (received_at DESC);

ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY inquiries_member_read   ON inquiries FOR SELECT
  USING (user_in_instance(instance_id));
CREATE POLICY inquiries_member_insert ON inquiries FOR INSERT
  WITH CHECK (user_in_instance(instance_id) AND created_by = auth.uid());
CREATE POLICY inquiries_member_update ON inquiries FOR UPDATE
  USING (user_in_instance(instance_id))
  WITH CHECK (user_in_instance(instance_id));
CREATE POLICY inquiries_owner_delete  ON inquiries FOR DELETE
  USING (user_role_in_instance(instance_id) = 'owner');

-- =====================================================================
-- clinicians
-- =====================================================================

CREATE TABLE IF NOT EXISTS clinicians (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz,
  updated_by  uuid REFERENCES auth.users(id),
  lifecycle   jsonb NOT NULL DEFAULT '{"phase":"active","log":[]}',
  links       jsonb NOT NULL DEFAULT '[]',
  entity_id   uuid REFERENCES entities(id) ON DELETE SET NULL,

  display_name          text NOT NULL,
  title                 text,
  license_number        text,
  license_state         text,
  licensed_at           date,
  license_expires       date,
  specialties           text[] NOT NULL DEFAULT '{}',
  insurance_panels      text[] NOT NULL DEFAULT '{}',
  accepting_new_clients boolean NOT NULL DEFAULT true,
  schedule_load_pct     int,
  intake_role           text CHECK (intake_role IN
                          ('intake-coordinator','clinician-only','both')),
  user_id               uuid REFERENCES auth.users(id),
  notes                 text,
  status                text NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active','on-leave','departed'))
);

CREATE INDEX IF NOT EXISTS clinicians_instance_idx ON clinicians (instance_id);
CREATE INDEX IF NOT EXISTS clinicians_user_idx     ON clinicians (user_id) WHERE user_id IS NOT NULL;

ALTER TABLE clinicians ENABLE ROW LEVEL SECURITY;

CREATE POLICY clinicians_member_read   ON clinicians FOR SELECT
  USING (user_in_instance(instance_id));
CREATE POLICY clinicians_member_insert ON clinicians FOR INSERT
  WITH CHECK (user_in_instance(instance_id) AND created_by = auth.uid());
CREATE POLICY clinicians_member_update ON clinicians FOR UPDATE
  USING (user_in_instance(instance_id))
  WITH CHECK (user_in_instance(instance_id));
CREATE POLICY clinicians_owner_delete  ON clinicians FOR DELETE
  USING (user_role_in_instance(instance_id) = 'owner');

-- ===================================================================
-- v1.2 already created an "inquiries" table for contractor lead intake
-- with a DIFFERENT column shape. v2.3's CREATE TABLE IF NOT EXISTS is a
-- no-op against that existing table, so the new columns never land and
-- the FK below errors with "column preferred_provider_id does not exist".
-- Backfill the missing v2.3 columns first.
-- ===================================================================
ALTER TABLE inquiries
  ADD COLUMN IF NOT EXISTS updated_by              uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS lifecycle               jsonb NOT NULL DEFAULT '{"phase":"new","openedAt":null,"closedAt":null,"log":[]}',
  ADD COLUMN IF NOT EXISTS links                   jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS entity_id               uuid REFERENCES entities(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS last_initial            text,
  ADD COLUMN IF NOT EXISTS phone_redacted          text,
  ADD COLUMN IF NOT EXISTS email_redacted          text,
  ADD COLUMN IF NOT EXISTS insurance_carrier       text,
  ADD COLUMN IF NOT EXISTS preferred_provider_id   uuid,
  ADD COLUMN IF NOT EXISTS external_user_id        uuid,
  ADD COLUMN IF NOT EXISTS handed_off_to_acuity_at timestamptz;

-- Backfill the inquiries preferred_provider_id FK now that clinicians exists
ALTER TABLE inquiries
  ADD CONSTRAINT inquiries_preferred_provider_fk
  FOREIGN KEY (preferred_provider_id) REFERENCES clinicians(id)
  DEFERRABLE INITIALLY DEFERRED;

-- =====================================================================
-- intake_handoffs — bridge between SKOS and Acuity
-- =====================================================================

CREATE TABLE IF NOT EXISTS intake_handoffs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz,
  updated_by  uuid REFERENCES auth.users(id),
  lifecycle   jsonb NOT NULL DEFAULT '{"phase":"scheduled","log":[]}',
  links       jsonb NOT NULL DEFAULT '[]',
  entity_id   uuid REFERENCES entities(id) ON DELETE SET NULL,

  inquiry_id            uuid NOT NULL REFERENCES inquiries(id),
  clinician_id          uuid NOT NULL REFERENCES clinicians(id),
  acuity_appointment_id text,
  scheduled_for         timestamptz,
  handoff_at            timestamptz NOT NULL DEFAULT now(),
  handed_off_by         uuid NOT NULL REFERENCES auth.users(id),
  status                text NOT NULL DEFAULT 'scheduled'
                          CHECK (status IN
                            ('scheduled','attended','no-show','rescheduled','cancelled')),
  notes                 text  -- intake-coordinator notes only; never clinical
);

CREATE INDEX IF NOT EXISTS intake_handoffs_inquiry_idx   ON intake_handoffs (inquiry_id);
CREATE INDEX IF NOT EXISTS intake_handoffs_clinician_idx ON intake_handoffs (clinician_id);

ALTER TABLE intake_handoffs ENABLE ROW LEVEL SECURITY;

CREATE POLICY intake_handoffs_member_read   ON intake_handoffs FOR SELECT
  USING (user_in_instance(instance_id));
CREATE POLICY intake_handoffs_member_insert ON intake_handoffs FOR INSERT
  WITH CHECK (user_in_instance(instance_id) AND created_by = auth.uid());
CREATE POLICY intake_handoffs_member_update ON intake_handoffs FOR UPDATE
  USING (user_in_instance(instance_id))
  WITH CHECK (user_in_instance(instance_id));

-- =====================================================================
-- clinician_assignments — working pre-handoff assignment
-- =====================================================================

CREATE TABLE IF NOT EXISTS clinician_assignments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz,
  updated_by  uuid REFERENCES auth.users(id),
  lifecycle   jsonb NOT NULL DEFAULT '{"phase":"active","log":[]}',
  links       jsonb NOT NULL DEFAULT '[]',
  entity_id   uuid REFERENCES entities(id) ON DELETE SET NULL,

  inquiry_id     uuid NOT NULL REFERENCES inquiries(id),
  clinician_id   uuid NOT NULL REFERENCES clinicians(id),
  assigned_at    timestamptz NOT NULL DEFAULT now(),
  assigned_by    uuid NOT NULL REFERENCES auth.users(id),
  reason         text,
  status         text NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active','superseded','released'))
);

CREATE INDEX IF NOT EXISTS clinician_assignments_inquiry_idx
  ON clinician_assignments (inquiry_id);
CREATE INDEX IF NOT EXISTS clinician_assignments_clinician_idx
  ON clinician_assignments (clinician_id) WHERE status = 'active';

ALTER TABLE clinician_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY clin_assign_member_read   ON clinician_assignments FOR SELECT
  USING (user_in_instance(instance_id));
CREATE POLICY clin_assign_member_insert ON clinician_assignments FOR INSERT
  WITH CHECK (user_in_instance(instance_id) AND created_by = auth.uid());
CREATE POLICY clin_assign_member_update ON clinician_assignments FOR UPDATE
  USING (user_in_instance(instance_id))
  WITH CHECK (user_in_instance(instance_id));

COMMIT;

-- =====================================================================
-- End of schema-v2.3-therapy.sql
-- =====================================================================
