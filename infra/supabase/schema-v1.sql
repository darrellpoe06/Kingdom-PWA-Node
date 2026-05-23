-- =============================================================================
-- PoeTech Family OS — Supabase schema v1
-- Multi-tenant. Family + church + future tenants share one Postgres,
-- scoped via tenant_id + Row Level Security.
--
-- Paste this entire file into Supabase Dashboard → SQL Editor → New query → Run.
-- Safe to re-run: every CREATE uses IF NOT EXISTS; policies are DROP-then-CREATE.
--
-- Derived from docs/00-foundations/_future/SUPABASE-SCHEMA-LAYER-2.md.
-- This v1 ships the CORE tables needed for family+church testing by June 1.
-- More tables added in subsequent v2/v3 schemas as Layer 2 expands.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. CORE TABLES — tenants and members (every other table references these)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tenants (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         text UNIQUE NOT NULL,
  display_name text NOT NULL,
  tenant_type  text NOT NULL CHECK (tenant_type IN
                 ('family','church','therapy-practice','contractor','nonprofit','business')),
  settings     jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenant_members (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role         text NOT NULL DEFAULT 'member'
                 CHECK (role IN ('owner','admin','member','viewer')),
  display_name text NOT NULL,
  joined_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS tenant_members_user_id_idx  ON tenant_members(user_id);
CREATE INDEX IF NOT EXISTS tenant_members_tenant_id_idx ON tenant_members(tenant_id);

CREATE TABLE IF NOT EXISTS tenant_invites (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email       text NOT NULL,
  role        text NOT NULL DEFAULT 'member'
                CHECK (role IN ('owner','admin','member','viewer')),
  invited_by  uuid NOT NULL REFERENCES auth.users(id),
  accepted_at timestamptz,
  expires_at  timestamptz NOT NULL DEFAULT (now() + interval '14 days')
);

-- ---------------------------------------------------------------------------
-- 2. HELPER FUNCTION — tenant access check, used by every RLS policy below
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.user_in_tenant(tenant_uuid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1 FROM tenant_members
    WHERE tenant_id = tenant_uuid
      AND user_id = auth.uid()
  )
$$;

CREATE OR REPLACE FUNCTION public.user_tenant_role(tenant_uuid uuid)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT role FROM tenant_members
  WHERE tenant_id = tenant_uuid
    AND user_id = auth.uid()
  LIMIT 1
$$;

-- ---------------------------------------------------------------------------
-- 3. RLS on core tables
-- ---------------------------------------------------------------------------

ALTER TABLE tenants         ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_invites  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenants_member_read ON tenants;
CREATE POLICY tenants_member_read ON tenants FOR SELECT
  USING (user_in_tenant(id));

DROP POLICY IF EXISTS tenant_members_self_read ON tenant_members;
CREATE POLICY tenant_members_self_read ON tenant_members FOR SELECT
  USING (user_in_tenant(tenant_id));

DROP POLICY IF EXISTS tenant_invites_admin_read ON tenant_invites;
CREATE POLICY tenant_invites_admin_read ON tenant_invites FOR SELECT
  USING (user_tenant_role(tenant_id) IN ('owner','admin'));

-- ---------------------------------------------------------------------------
-- 4. FINANCIAL OS DOMAIN TABLES
-- ---------------------------------------------------------------------------

-- Reusable column block:  every domain table has these.
-- (Postgres has no native macros; we just repeat the columns.)

CREATE TABLE IF NOT EXISTS entities (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by   uuid NOT NULL REFERENCES auth.users(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz,
  slug         text NOT NULL,
  display_name text NOT NULL,
  entity_type  text NOT NULL CHECK (entity_type IN ('personal','business')),
  notes        text,
  UNIQUE (tenant_id, slug)
);
CREATE INDEX IF NOT EXISTS entities_tenant_idx ON entities(tenant_id);

CREATE TABLE IF NOT EXISTS accounts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by   uuid NOT NULL REFERENCES auth.users(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz,
  entity_id    uuid NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  institution  text,
  account_type text NOT NULL CHECK (account_type IN
                 ('checking','savings','credit','loan','investment','cash')),
  fragment     text,
  balance      numeric(12,2) NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS accounts_tenant_idx ON accounts(tenant_id);
CREATE INDEX IF NOT EXISTS accounts_entity_idx ON accounts(entity_id);

CREATE TABLE IF NOT EXISTS transactions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by      uuid NOT NULL REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz,
  account_id      uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  txn_date        date NOT NULL,
  amount          numeric(12,2) NOT NULL,
  description     text,
  category        text,
  is_transfer     boolean NOT NULL DEFAULT false,
  entity_override uuid REFERENCES entities(id),
  linked_to_kind  text,
  linked_to_id    uuid
);
CREATE INDEX IF NOT EXISTS transactions_tenant_idx  ON transactions(tenant_id);
CREATE INDEX IF NOT EXISTS transactions_account_idx ON transactions(account_id);
CREATE INDEX IF NOT EXISTS transactions_date_idx    ON transactions(txn_date);

CREATE TABLE IF NOT EXISTS debts (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by          uuid NOT NULL REFERENCES auth.users(id),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz,
  entity_id           uuid REFERENCES entities(id),
  creditor            text NOT NULL,
  debt_type           text,
  balance             numeric(12,2) NOT NULL DEFAULT 0,
  apr                 numeric(5,2),
  minimum_payment     numeric(12,2),
  extra_payment       numeric(12,2) NOT NULL DEFAULT 0,
  promo_zero_apr_until date,
  notes               text
);
CREATE INDEX IF NOT EXISTS debts_tenant_idx ON debts(tenant_id);

CREATE TABLE IF NOT EXISTS projects (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by           uuid NOT NULL REFERENCES auth.users(id),
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz,
  title                text NOT NULL,
  start_date           date,
  end_date             date,
  status               text NOT NULL DEFAULT 'planning'
                          CHECK (status IN ('planning','active','ending-soon','done','declined')),
  domain               text,
  description          text,
  hours_per_week       int,
  entity_id            uuid REFERENCES entities(id),
  linked_feedback_ids  uuid[]
);
CREATE INDEX IF NOT EXISTS projects_tenant_idx ON projects(tenant_id);

-- ---------------------------------------------------------------------------
-- 5. NEW SURFACES from 2026-05-23 (feedback, confessions, telemetry)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS feedback (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id              uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id                uuid NOT NULL REFERENCES auth.users(id),
  display_name           text NOT NULL,
  device_label           text,
  app_version            text,
  which_tab              text,
  feedback_text          text NOT NULL,
  sentiment              text CHECK (sentiment IS NULL OR sentiment IN
                            ('love','frustrated','confused','feature-request','bug')),
  is_confidential        boolean NOT NULL DEFAULT false,
  submitted_at           timestamptz NOT NULL DEFAULT now(),
  triage_status          text NOT NULL DEFAULT 'new'
                            CHECK (triage_status IN
                              ('new','reviewed','promoted','declined','needs-info')),
  triage_notes           text,
  promoted_to_project_id uuid REFERENCES projects(id)
);
CREATE INDEX IF NOT EXISTS feedback_tenant_idx   ON feedback(tenant_id);
CREATE INDEX IF NOT EXISTS feedback_submitted_idx ON feedback(submitted_at DESC);

-- Voluntary confession surface — James 5:16. Distinct from per-device Counseling.
-- Audience-scoped RLS; even tenant admins do NOT read 'self-only' confessions.
CREATE TABLE IF NOT EXISTS confessions (
  id                         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                  uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id                    uuid NOT NULL REFERENCES auth.users(id),
  audience                   text NOT NULL CHECK (audience IN
                                ('self-only','leadership','tenant-leadership','family-tenant','specific-user')),
  specific_recipient_user_id uuid REFERENCES auth.users(id),
  context                    text NOT NULL,
  scripture_anchor           text,
  prayer_request             text,
  follow_up_requested        boolean NOT NULL DEFAULT false,
  retention                  text NOT NULL DEFAULT 'permanent'
                                CHECK (retention IN ('permanent','90-days','24-hours')),
  submitted_at               timestamptz NOT NULL DEFAULT now(),
  expires_at                 timestamptz
);
CREATE INDEX IF NOT EXISTS confessions_tenant_user_idx ON confessions(tenant_id, user_id);

CREATE TABLE IF NOT EXISTS user_telemetry (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid REFERENCES tenants(id) ON DELETE SET NULL,
  user_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_start timestamptz NOT NULL DEFAULT now(),
  active_tab    text,
  app_version   text,
  event_type    text NOT NULL CHECK (event_type IN
                   ('page-view','feature-used','install','uninstall','refresh')),
  event_meta    jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS user_telemetry_tenant_time_idx ON user_telemetry(tenant_id, session_start DESC);

-- ---------------------------------------------------------------------------
-- 6. PER-USER-PER-TENANT SETTINGS (theme, dismissals, snowball prefs)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_tenant_settings (
  user_id              uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id            uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  theme                text DEFAULT 'midnight',
  welcome_dismissed    boolean NOT NULL DEFAULT false,
  snowball_sort        text,
  snowball_extra       numeric(12,2),
  debt_snowball_sort   text,
  debt_snowball_extra  numeric(12,2),
  pressure_slider      numeric(3,1),
  PRIMARY KEY (user_id, tenant_id)
);

-- ---------------------------------------------------------------------------
-- 7. RLS — turn on, add the tenant-membership policies
-- ---------------------------------------------------------------------------

ALTER TABLE entities             ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts                ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects             ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback             ENABLE ROW LEVEL SECURITY;
ALTER TABLE confessions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_telemetry       ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tenant_settings ENABLE ROW LEVEL SECURITY;

-- Standard tenant-scoped policies (SELECT for members, INSERT for members
-- with created_by=auth.uid, UPDATE for member+, DELETE for owner only).
-- Implemented for the most-used tables; expand for others in v2.

DO $$
DECLARE t text;
BEGIN
  FOR t IN VALUES ('entities'),('accounts'),('transactions'),('debts'),('projects')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_member_read', t);
    EXECUTE format('CREATE POLICY %I ON %I FOR SELECT USING (user_in_tenant(tenant_id))',
                   t || '_member_read', t);

    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_member_insert', t);
    EXECUTE format('CREATE POLICY %I ON %I FOR INSERT WITH CHECK (user_in_tenant(tenant_id) AND created_by = auth.uid())',
                   t || '_member_insert', t);

    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_member_update', t);
    EXECUTE format('CREATE POLICY %I ON %I FOR UPDATE USING (user_in_tenant(tenant_id))',
                   t || '_member_update', t);

    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_owner_delete', t);
    EXECUTE format('CREATE POLICY %I ON %I FOR DELETE USING (user_tenant_role(tenant_id) = ''owner'')',
                   t || '_owner_delete', t);
  END LOOP;
END $$;

-- Feedback: every tenant member can read + insert; only admins triage.
DROP POLICY IF EXISTS feedback_member_read   ON feedback;
DROP POLICY IF EXISTS feedback_member_insert ON feedback;
DROP POLICY IF EXISTS feedback_admin_update  ON feedback;
CREATE POLICY feedback_member_read   ON feedback FOR SELECT
  USING (user_in_tenant(tenant_id));
CREATE POLICY feedback_member_insert ON feedback FOR INSERT
  WITH CHECK (user_in_tenant(tenant_id) AND user_id = auth.uid());
CREATE POLICY feedback_admin_update  ON feedback FOR UPDATE
  USING (user_tenant_role(tenant_id) IN ('owner','admin'));

-- Confessions: strictest in the schema. The row is visible ONLY to
-- (a) the submitter, plus (b) the explicit audience the submitter chose.
-- No tenant-wide admin override on 'self-only'.
DROP POLICY IF EXISTS confessions_self_read       ON confessions;
DROP POLICY IF EXISTS confessions_self_insert     ON confessions;
DROP POLICY IF EXISTS confessions_audience_read   ON confessions;
DROP POLICY IF EXISTS confessions_recipient_read  ON confessions;

CREATE POLICY confessions_self_read ON confessions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY confessions_self_insert ON confessions FOR INSERT
  WITH CHECK (user_id = auth.uid() AND user_in_tenant(tenant_id));

CREATE POLICY confessions_audience_read ON confessions FOR SELECT
  USING (
    audience IN ('leadership','tenant-leadership')
    AND user_tenant_role(tenant_id) IN ('owner','admin')
  );

CREATE POLICY confessions_recipient_read ON confessions FOR SELECT
  USING (
    audience = 'specific-user'
    AND specific_recipient_user_id = auth.uid()
  );

-- Telemetry: insert-only for members; read only by admins on their own tenant.
DROP POLICY IF EXISTS user_telemetry_member_insert ON user_telemetry;
DROP POLICY IF EXISTS user_telemetry_admin_read    ON user_telemetry;
CREATE POLICY user_telemetry_member_insert ON user_telemetry FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY user_telemetry_admin_read    ON user_telemetry FOR SELECT
  USING (user_tenant_role(tenant_id) IN ('owner','admin'));

-- Settings: each user manages their own per-tenant settings, can read,
-- update, and insert their own rows.
DROP POLICY IF EXISTS user_tenant_settings_self_read   ON user_tenant_settings;
DROP POLICY IF EXISTS user_tenant_settings_self_write  ON user_tenant_settings;
DROP POLICY IF EXISTS user_tenant_settings_self_update ON user_tenant_settings;
CREATE POLICY user_tenant_settings_self_read   ON user_tenant_settings FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY user_tenant_settings_self_write  ON user_tenant_settings FOR INSERT
  WITH CHECK (user_id = auth.uid() AND user_in_tenant(tenant_id));
CREATE POLICY user_tenant_settings_self_update ON user_tenant_settings FOR UPDATE
  USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 8. SEED — the Poe family tenant + Church of the Living God tenant
-- ---------------------------------------------------------------------------

-- These INSERTs are idempotent thanks to UNIQUE constraints.
INSERT INTO tenants (slug, display_name, tenant_type, settings)
VALUES
  ('poe-family',         'Poe Family',                 'family', '{}'::jsonb),
  ('church-of-the-living-god', 'The Church of the Living God', 'church', '{}'::jsonb)
ON CONFLICT (slug) DO NOTHING;

-- Note: tenant_members rows are inserted by the React app on first sign-in,
-- because auth.users rows only exist after a magic-link signup. We do NOT
-- seed members here.

-- =============================================================================
-- End of schema v1. Verify with:
--   SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;
-- Expected tables: accounts, confessions, debts, entities, feedback,
--   projects, tenant_invites, tenant_members, tenants, transactions,
--   user_telemetry, user_tenant_settings
-- =============================================================================
