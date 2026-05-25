-- =====================================================================
-- Kingdom-PWA / SKOS / PoeTech — schema-v2.4-contractor.sql
--
-- v2.4 CONTRACTOR / 1099 / TRADES migration.
-- Depends on: schema-v2.1-infra.sql, v1 projects + transactions.
--
-- Source design doc: docs/00-foundations/SCHEMA-V2-MULTI-DOMAIN-DRAFT.md §8.
--
-- Tables:
--   - contractors_1099  (bidirectional 1099 relationships)
--   - scopes            (scope-of-work agreements)
--   - invoices          (inbound + outbound, linked to scopes + projects)
--   - time_logs         (hourly work logs)
--
-- Concrete flow (Holly Hill plumber example):
--   contractors_1099 (direction=outbound) → scopes (signed) → invoices
--   (direction=inbound, paid_at + transaction_id set on payment).
--   At tax time: SELECT SUM(amount) FROM invoices WHERE direction='inbound'
--   AND paid_at BETWEEN year-start AND year-end GROUP BY contractor_id.
-- =====================================================================

BEGIN;

-- =====================================================================
-- contractors_1099 — bidirectional 1099 relationships
-- =====================================================================

CREATE TABLE IF NOT EXISTS contractors_1099 (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz,
  updated_by  uuid REFERENCES auth.users(id),
  lifecycle   jsonb NOT NULL DEFAULT '{"phase":"active","log":[]}',
  links       jsonb NOT NULL DEFAULT '[]',
  entity_id   uuid REFERENCES entities(id) ON DELETE SET NULL,

  direction              text NOT NULL CHECK (direction IN ('outbound','inbound')),
  -- outbound = we pay them; inbound = they pay us
  contact_display_name   text NOT NULL,
  contact_email          text,
  contact_phone          text,
  business_name          text,
  tax_id_last_4          text,  -- never store full SSN/EIN
  role_description       text,
  ytd_paid               numeric(12,2) NOT NULL DEFAULT 0,
  ytd_received           numeric(12,2) NOT NULL DEFAULT 0,
  monthly_expected       numeric(12,2),
  w9_on_file             boolean NOT NULL DEFAULT false,
  w9_received_at         date,
  status                 text NOT NULL DEFAULT 'active'
                           CHECK (status IN
                             ('active','pipeline','possible','inactive','terminated')),
  external_user_id       uuid REFERENCES external_users(id)
);

CREATE INDEX IF NOT EXISTS contractors_1099_instance_idx
  ON contractors_1099 (instance_id);
CREATE INDEX IF NOT EXISTS contractors_1099_direction_status_idx
  ON contractors_1099 (direction, status) WHERE status IN ('active','pipeline');
CREATE INDEX IF NOT EXISTS contractors_1099_external_user_idx
  ON contractors_1099 (external_user_id) WHERE external_user_id IS NOT NULL;

ALTER TABLE contractors_1099 ENABLE ROW LEVEL SECURITY;

CREATE POLICY contractors_1099_member_read   ON contractors_1099 FOR SELECT
  USING (user_in_instance(instance_id));
CREATE POLICY contractors_1099_member_insert ON contractors_1099 FOR INSERT
  WITH CHECK (user_in_instance(instance_id) AND created_by = auth.uid());
CREATE POLICY contractors_1099_member_update ON contractors_1099 FOR UPDATE
  USING (user_in_instance(instance_id))
  WITH CHECK (user_in_instance(instance_id));
CREATE POLICY contractors_1099_owner_delete  ON contractors_1099 FOR DELETE
  USING (user_role_in_instance(instance_id) = 'owner');

-- =====================================================================
-- scopes — scope-of-work agreements
-- =====================================================================

CREATE TABLE IF NOT EXISTS scopes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz,
  updated_by  uuid REFERENCES auth.users(id),
  lifecycle   jsonb NOT NULL DEFAULT '{"phase":"draft","log":[]}',
  links       jsonb NOT NULL DEFAULT '[]',
  entity_id   uuid REFERENCES entities(id) ON DELETE SET NULL,

  template_type        text,
  template_name        text,
  title                text NOT NULL,
  project_id           uuid REFERENCES projects(id),
  contractor_id        uuid REFERENCES contractors_1099(id),
  contractor_name      text,  -- snapshot at scope creation, persistent
  contractor_email     text,
  contractor_phone     text,
  scope_of_work        text NOT NULL,
  deliverables         text,
  materials_policy     text,
  schedule             text,
  payment_terms        text,
  total_amount         numeric(12,2),
  acceptance_criteria  text,
  requirements         text,
  warranty             text,
  termination_clause   text,
  signed_at            timestamptz,
  signed_by_contractor boolean NOT NULL DEFAULT false,
  status               text NOT NULL DEFAULT 'draft'
                         CHECK (status IN
                           ('draft','sent','signed','active','completed','terminated','disputed'))
);

CREATE INDEX IF NOT EXISTS scopes_instance_status_idx
  ON scopes (instance_id, status);
CREATE INDEX IF NOT EXISTS scopes_contractor_idx
  ON scopes (contractor_id) WHERE contractor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS scopes_project_idx
  ON scopes (project_id) WHERE project_id IS NOT NULL;

ALTER TABLE scopes ENABLE ROW LEVEL SECURITY;

CREATE POLICY scopes_member_read   ON scopes FOR SELECT
  USING (user_in_instance(instance_id));
CREATE POLICY scopes_member_insert ON scopes FOR INSERT
  WITH CHECK (user_in_instance(instance_id) AND created_by = auth.uid());
CREATE POLICY scopes_member_update ON scopes FOR UPDATE
  USING (user_in_instance(instance_id))
  WITH CHECK (user_in_instance(instance_id));
CREATE POLICY scopes_owner_delete  ON scopes FOR DELETE
  USING (user_role_in_instance(instance_id) = 'owner');

-- =====================================================================
-- invoices — inbound + outbound
-- =====================================================================

CREATE TABLE IF NOT EXISTS invoices (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz,
  updated_by  uuid REFERENCES auth.users(id),
  lifecycle   jsonb NOT NULL DEFAULT '{"phase":"received","log":[]}',
  links       jsonb NOT NULL DEFAULT '[]',
  entity_id   uuid REFERENCES entities(id) ON DELETE SET NULL,

  contractor_id     uuid NOT NULL REFERENCES contractors_1099(id),
  scope_id          uuid REFERENCES scopes(id),
  project_id        uuid REFERENCES projects(id),
  direction         text NOT NULL CHECK (direction IN ('inbound','outbound')),
  -- inbound = we receive (we owe); outbound = we send (they owe)
  invoice_number    text,
  invoice_date      date NOT NULL,
  amount            numeric(12,2) NOT NULL,
  description       text,
  document_uri      text,
  due_date          date,
  paid_at           timestamptz,
  transaction_id    uuid REFERENCES transactions(id),
  status            text NOT NULL DEFAULT 'received'
                      CHECK (status IN
                        ('draft','sent','received','approved','paid',
                         'disputed','voided','overdue'))
);

CREATE INDEX IF NOT EXISTS invoices_contractor_idx
  ON invoices (contractor_id);
CREATE INDEX IF NOT EXISTS invoices_status_idx
  ON invoices (status) WHERE status NOT IN ('paid','voided');
CREATE INDEX IF NOT EXISTS invoices_paid_year_idx
  ON invoices (contractor_id, paid_at)
  WHERE direction = 'inbound' AND status = 'paid';

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY invoices_member_read   ON invoices FOR SELECT
  USING (user_in_instance(instance_id));
CREATE POLICY invoices_member_insert ON invoices FOR INSERT
  WITH CHECK (user_in_instance(instance_id) AND created_by = auth.uid());
CREATE POLICY invoices_member_update ON invoices FOR UPDATE
  USING (user_in_instance(instance_id))
  WITH CHECK (user_in_instance(instance_id));
CREATE POLICY invoices_owner_delete  ON invoices FOR DELETE
  USING (user_role_in_instance(instance_id) = 'owner');

-- =====================================================================
-- time_logs — hourly work
-- =====================================================================

CREATE TABLE IF NOT EXISTS time_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz,
  updated_by  uuid REFERENCES auth.users(id),
  lifecycle   jsonb NOT NULL DEFAULT '{"phase":"submitted","log":[]}',
  links       jsonb NOT NULL DEFAULT '[]',
  entity_id   uuid REFERENCES entities(id) ON DELETE SET NULL,

  contractor_id uuid NOT NULL REFERENCES contractors_1099(id),
  scope_id      uuid REFERENCES scopes(id),
  project_id    uuid REFERENCES projects(id),
  work_date     date NOT NULL,
  hours         numeric(5,2) NOT NULL,
  rate          numeric(8,2),
  amount        numeric(12,2),
  description   text NOT NULL,
  status        text NOT NULL DEFAULT 'submitted'
                  CHECK (status IN
                    ('submitted','approved','disputed','rejected','paid')),
  invoice_id    uuid REFERENCES invoices(id)
);

CREATE INDEX IF NOT EXISTS time_logs_contractor_date_idx
  ON time_logs (contractor_id, work_date DESC);
CREATE INDEX IF NOT EXISTS time_logs_scope_idx
  ON time_logs (scope_id) WHERE scope_id IS NOT NULL;

ALTER TABLE time_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY time_logs_member_read   ON time_logs FOR SELECT
  USING (user_in_instance(instance_id));
CREATE POLICY time_logs_member_insert ON time_logs FOR INSERT
  WITH CHECK (user_in_instance(instance_id) AND created_by = auth.uid());
CREATE POLICY time_logs_member_update ON time_logs FOR UPDATE
  USING (user_in_instance(instance_id))
  WITH CHECK (user_in_instance(instance_id));

COMMIT;

-- =====================================================================
-- End of schema-v2.4-contractor.sql
-- =====================================================================
