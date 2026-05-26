-- =============================================================================
-- PoeTech Family OS — Supabase schema v1.2
-- Numeric-table sync support: accounts, debts, transactions, projects.
-- Also stages rentals, incidents, inquiries, and scopes for the second wave.
--
-- Safe to re-run. Every change uses IF NOT EXISTS or DO/EXCEPTION blocks.
--
-- Paste into Supabase Dashboard → SQL Editor → New query → Run.
-- Required before VerifyBalances opens the numeric-table sync gate.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. ACCOUNTS — add slug, entity_slug, in_legal, is_primary
--    Mirrors the entities pattern (slug is the local prototype id;
--    remote UUID is held as `id`). entity_slug lets fromRow/toRow translate
--    without a per-call lookup against entities.
-- -----------------------------------------------------------------------------
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS slug         text;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS entity_slug  text;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS in_legal     boolean NOT NULL DEFAULT false;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS is_primary   boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS accounts_tenant_slug_uidx
  ON accounts (tenant_id, slug)
  WHERE slug IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 2. DEBTS — add slug, entity_slug, leave_alone flag, plus the descriptive
--    fields the local shape carries that the v1 schema dropped: note, flag.
-- -----------------------------------------------------------------------------
ALTER TABLE debts ADD COLUMN IF NOT EXISTS slug         text;
ALTER TABLE debts ADD COLUMN IF NOT EXISTS entity_slug  text;
ALTER TABLE debts ADD COLUMN IF NOT EXISTS leave_alone  boolean NOT NULL DEFAULT false;
ALTER TABLE debts ADD COLUMN IF NOT EXISTS flag_label   text;

CREATE UNIQUE INDEX IF NOT EXISTS debts_tenant_slug_uidx
  ON debts (tenant_id, slug)
  WHERE slug IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 3. TRANSACTIONS — add slug + account_slug + entity_override_slug.
-- -----------------------------------------------------------------------------
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS slug                  text;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS account_slug          text;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS entity_override_slug  text;

CREATE UNIQUE INDEX IF NOT EXISTS transactions_tenant_slug_uidx
  ON transactions (tenant_id, slug)
  WHERE slug IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 4. PROJECTS — add slug + entity_slug.
-- -----------------------------------------------------------------------------
ALTER TABLE projects ADD COLUMN IF NOT EXISTS slug         text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS entity_slug  text;

CREATE UNIQUE INDEX IF NOT EXISTS projects_tenant_slug_uidx
  ON projects (tenant_id, slug)
  WHERE slug IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 5. NEW TABLES — rentals, incidents, inquiries, scopes.
--    Mirror the column layout of accounts/debts (tenant + created_by +
--    timestamps + slug + entity_slug + domain fields).
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS rentals (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by          uuid NOT NULL REFERENCES auth.users(id),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz,
  slug                text,
  entity_slug         text,
  entity_id           uuid REFERENCES entities(id),
  address             text NOT NULL,
  unit                text,
  monthly_rent        numeric(12,2) NOT NULL DEFAULT 0,
  mortgage_payment    numeric(12,2) NOT NULL DEFAULT 0,
  reserves            numeric(12,2) NOT NULL DEFAULT 0,
  status              text,
  notes               text,
  tenant_name         text
);
CREATE INDEX IF NOT EXISTS rentals_tenant_idx ON rentals(tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS rentals_tenant_slug_uidx
  ON rentals (tenant_id, slug) WHERE slug IS NOT NULL;

CREATE TABLE IF NOT EXISTS incidents (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by          uuid NOT NULL REFERENCES auth.users(id),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz,
  slug                text,
  entity_slug         text,
  entity_id           uuid REFERENCES entities(id),
  incident_date       date NOT NULL,
  amount              numeric(12,2) NOT NULL DEFAULT 0,
  category            text,
  description         text,
  urgency             text,
  status              text,
  due_date            date,
  resolved_at         date,
  linked_to_kind      text,
  linked_to_slug      text
);
CREATE INDEX IF NOT EXISTS incidents_tenant_idx ON incidents(tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS incidents_tenant_slug_uidx
  ON incidents (tenant_id, slug) WHERE slug IS NOT NULL;

CREATE TABLE IF NOT EXISTS inquiries (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by           uuid NOT NULL REFERENCES auth.users(id),
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz,
  slug                 text,
  first_name           text,
  contact_method       text,
  contact_value        text,
  interest_area        text,
  has_insurance        text,
  preferred_provider   text,
  best_time_to_call    text,
  source               text,
  source_detail        text,
  notes                text,
  status               text NOT NULL DEFAULT 'new',
  status_history       jsonb NOT NULL DEFAULT '[]'::jsonb,
  conversation_log     jsonb NOT NULL DEFAULT '[]'::jsonb,
  received_at          timestamptz
);
CREATE INDEX IF NOT EXISTS inquiries_tenant_idx ON inquiries(tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS inquiries_tenant_slug_uidx
  ON inquiries (tenant_id, slug) WHERE slug IS NOT NULL;

CREATE TABLE IF NOT EXISTS scopes (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by           uuid NOT NULL REFERENCES auth.users(id),
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz,
  slug                 text,
  entity_slug          text,
  entity_id            uuid REFERENCES entities(id),
  project_slug         text,
  template_type        text,
  template_name        text,
  title                text NOT NULL,
  contractor_name      text,
  contractor_email     text,
  contractor_phone     text,
  scope_of_work        text,
  deliverables         text,
  materials            text,
  schedule             text,
  payment_terms        text,
  status               text NOT NULL DEFAULT 'draft'
);
CREATE INDEX IF NOT EXISTS scopes_tenant_idx ON scopes(tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS scopes_tenant_slug_uidx
  ON scopes (tenant_id, slug) WHERE slug IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 6. RLS — turn on for the new tables and apply the standard tenant-scoped
--    policies (SELECT for members, INSERT with created_by=auth.uid, UPDATE
--    for members, DELETE for members).
-- -----------------------------------------------------------------------------
ALTER TABLE rentals    ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents  ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries  ENABLE ROW LEVEL SECURITY;
ALTER TABLE scopes     ENABLE ROW LEVEL SECURITY;

DO $do$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['rentals','incidents','inquiries','scopes']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I_select ON %I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_insert ON %I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_update ON %I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_delete ON %I', t, t);

    EXECUTE format(
      'CREATE POLICY %I_select ON %I FOR SELECT USING (user_in_tenant(tenant_id))',
      t, t
    );
    EXECUTE format(
      'CREATE POLICY %I_insert ON %I FOR INSERT WITH CHECK (user_in_tenant(tenant_id) AND created_by = auth.uid())',
      t, t
    );
    EXECUTE format(
      'CREATE POLICY %I_update ON %I FOR UPDATE USING (user_in_tenant(tenant_id))',
      t, t
    );
    EXECUTE format(
      'CREATE POLICY %I_delete ON %I FOR DELETE USING (user_in_tenant(tenant_id))',
      t, t
    );
  END LOOP;
END $do$;

-- =============================================================================
-- End of schema v1.2. Verify with the table-list query from v1.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 7. Relax NOT NULL on UUID FKs so slug-based sync can insert without the
--    app having to resolve UUIDs first. Slugs (entity_slug, account_slug)
--    are the source of truth for cross-table links; UUIDs remain as
--    secondary identifiers populated by the trigger below when possible.
-- -----------------------------------------------------------------------------
ALTER TABLE accounts     ALTER COLUMN entity_id  DROP NOT NULL;
ALTER TABLE transactions ALTER COLUMN account_id DROP NOT NULL;

-- -----------------------------------------------------------------------------
-- 8. Best-effort entity_slug -> entity_id population on insert/update.
--    If the matching entity has already synced, the FK link forms.
--    If not, entity_id stays NULL and the app uses entity_slug.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION resolve_entity_slug_to_id()
RETURNS TRIGGER AS $fn$
BEGIN
  IF NEW.entity_slug IS NOT NULL AND NEW.entity_id IS NULL THEN
    SELECT id INTO NEW.entity_id
      FROM entities
     WHERE tenant_id = NEW.tenant_id AND slug = NEW.entity_slug
     LIMIT 1;
  END IF;
  RETURN NEW;
END;
$fn$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION resolve_account_slug_to_id()
RETURNS TRIGGER AS $fn$
BEGIN
  IF NEW.account_slug IS NOT NULL AND NEW.account_id IS NULL THEN
    SELECT id INTO NEW.account_id
      FROM accounts
     WHERE tenant_id = NEW.tenant_id AND slug = NEW.account_slug
     LIMIT 1;
  END IF;
  RETURN NEW;
END;
$fn$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS accounts_resolve_entity  ON accounts;
DROP TRIGGER IF EXISTS debts_resolve_entity     ON debts;
DROP TRIGGER IF EXISTS rentals_resolve_entity   ON rentals;
DROP TRIGGER IF EXISTS incidents_resolve_entity ON incidents;
DROP TRIGGER IF EXISTS scopes_resolve_entity    ON scopes;
DROP TRIGGER IF EXISTS projects_resolve_entity  ON projects;

CREATE TRIGGER accounts_resolve_entity  BEFORE INSERT OR UPDATE ON accounts  FOR EACH ROW EXECUTE FUNCTION resolve_entity_slug_to_id();
CREATE TRIGGER debts_resolve_entity     BEFORE INSERT OR UPDATE ON debts     FOR EACH ROW EXECUTE FUNCTION resolve_entity_slug_to_id();
CREATE TRIGGER rentals_resolve_entity   BEFORE INSERT OR UPDATE ON rentals   FOR EACH ROW EXECUTE FUNCTION resolve_entity_slug_to_id();
CREATE TRIGGER incidents_resolve_entity BEFORE INSERT OR UPDATE ON incidents FOR EACH ROW EXECUTE FUNCTION resolve_entity_slug_to_id();
CREATE TRIGGER scopes_resolve_entity    BEFORE INSERT OR UPDATE ON scopes    FOR EACH ROW EXECUTE FUNCTION resolve_entity_slug_to_id();
CREATE TRIGGER projects_resolve_entity  BEFORE INSERT OR UPDATE ON projects  FOR EACH ROW EXECUTE FUNCTION resolve_entity_slug_to_id();

DROP TRIGGER IF EXISTS transactions_resolve_account ON transactions;
CREATE TRIGGER transactions_resolve_account BEFORE INSERT OR UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION resolve_account_slug_to_id();
