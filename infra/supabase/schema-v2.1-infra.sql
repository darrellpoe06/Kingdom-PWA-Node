-- =====================================================================
-- Kingdom-PWA / SKOS / PoeTech — schema-v2.1-infra.sql
--
-- v2.1 INFRASTRUCTURE migration. The foundation everything else builds on.
--
-- Locked in 2026-05-25 by Darrell under the directive:
--   "I want this app done in the next few days. I leave in 6 and I want
--    to use it before I go and on vacation. So let's work all night if
--    we have to."
--
-- Source design doc: docs/00-foundations/SCHEMA-V2-MULTI-DOMAIN-DRAFT.md
--                    (revised 2026-05-25 with Q1–Q9 lock-ins)
--
-- Includes:
--   - v1 tenants→instances rename block (§4.0)
--   - Trust ownership widening on `instances` (§4.0.5, answers Q1)
--   - `disclaimers_acknowledgments` table (§4.0.6)
--   - `instance_domains` (§4.1) with `requires_tier`
--   - `role_scopes` (§4.2)
--   - `audit_log` with prev_hash + hash stub columns (§4.3, answers Q3)
--   - `audit_verify_chain()` ~20-line stub (§4.3)
--   - `entity_links` materialized index (§4.4)
--   - `external_users`, `interactions`, `external_invite_tokens` (§4.5)
--   - `instance_subscriptions` + tier helper functions (§4.6, answers Q5)
--   - Confessions client-side AES-GCM column additions (§10.5, answers Q4)
--   - ALTER on instance_members.role to add 'specialist' (§2 IDENTITY-ROLES-AUDIT)
--   - ALTER on entities to add domain + parent_entity_id (§3)
--
-- POE BINDING (per §2 of the design doc):
--   People Over Everything POE in PoeTech. Every architectural tradeoff
--   resolves in favor of the person, not the system. The user always has
--   the last word. The system ranks; the human decides.
--
-- This file is ADDITIVE: it does not drop v1 tables, it does not migrate
-- v1 rows, and every new column is nullable or has a default. The June 1
-- family + church launch can ship against v1 surfaces; v2.1 lights up new
-- capabilities incrementally as the React surfaces are wired.
--
-- The application-layer rename (Supabase + React code: tenant_id →
-- instance_id) is a SEPARATE downstream task chained behind the parallel
-- v1 corrupted-files restoration session. This file is one of its inputs,
-- not the task itself.
-- =====================================================================

BEGIN;

-- =====================================================================
-- §4.0 v1 vocabulary rename: tenants → instances
-- =====================================================================

ALTER TABLE IF EXISTS tenants               RENAME TO instances;
ALTER TABLE IF EXISTS tenant_members        RENAME TO instance_members;
ALTER TABLE IF EXISTS tenant_invites        RENAME TO instance_invites;

-- Column renames on every v1 table that carried the FK + every v1.2 table
-- (rentals, incidents, inquiries, scopes — added by schema-v1.2-numeric-sync).
-- DO block per-table so a missing v1.2 table doesn't abort the migration.
DO $rename_cols$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'entities','accounts','transactions','debts','projects','feedback',
    'confessions','user_telemetry','instance_members','instance_invites',
    'rentals','incidents','inquiries','scopes'
  ] LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = t AND column_name = 'tenant_id'
    ) THEN
      EXECUTE format('ALTER TABLE %I RENAME COLUMN tenant_id TO instance_id', t);
    END IF;
  END LOOP;
END $rename_cols$;

-- v1's user_tenant_settings renames table + column
ALTER TABLE IF EXISTS user_tenant_settings RENAME COLUMN tenant_id TO instance_id;
ALTER TABLE IF EXISTS user_tenant_settings RENAME TO user_instance_settings;

-- Index renames (best-effort; tolerate missing indexes from v1.1)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'tenant_members_user_id_idx') THEN
    EXECUTE 'ALTER INDEX tenant_members_user_id_idx RENAME TO instance_members_user_id_idx';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'tenant_members_tenant_id_idx') THEN
    EXECUTE 'ALTER INDEX tenant_members_tenant_id_idx RENAME TO instance_members_instance_id_idx';
  END IF;
END $$;

-- Helper functions: RENAME the v1 functions (preserves OIDs + every RLS
-- policy that depends on them, including the v1.2 policies on rentals/
-- incidents/inquiries/scopes). CREATE OR REPLACE below updates each
-- renamed function's body to use the new column names. Plain DROP FUNCTION
-- would fail with "cannot drop ... other objects depend on it" once v1.2
-- policies exist.
DO $rename_fns$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p
              JOIN pg_namespace n ON n.oid = p.pronamespace
             WHERE p.proname = 'user_in_tenant' AND n.nspname = 'public') THEN
    ALTER FUNCTION public.user_in_tenant(uuid) RENAME TO user_in_instance;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc p
              JOIN pg_namespace n ON n.oid = p.pronamespace
             WHERE p.proname = 'user_tenant_role' AND n.nspname = 'public') THEN
    ALTER FUNCTION public.user_tenant_role(uuid) RENAME TO user_role_in_instance;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc p
              JOIN pg_namespace n ON n.oid = p.pronamespace
             WHERE p.proname = 'join_default_tenant' AND n.nspname = 'public') THEN
    ALTER FUNCTION public.join_default_tenant(text) RENAME TO join_default_instance;
  END IF;
END $rename_fns$;

CREATE OR REPLACE FUNCTION public.user_in_instance(instance_uuid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1 FROM instance_members
    WHERE instance_id = instance_uuid AND user_id = auth.uid()
  )
$$;

CREATE OR REPLACE FUNCTION public.user_role_in_instance(instance_uuid uuid)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT role FROM instance_members
  WHERE instance_id = instance_uuid AND user_id = auth.uid()
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.join_default_instance(display_name_in text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id      uuid := auth.uid();
  v_user_email   text;
  v_instance_id  uuid;
  v_display_name text;
  v_existing     uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'join_default_instance: not authenticated';
  END IF;
  SELECT instance_id INTO v_existing FROM instance_members
    WHERE user_id = v_user_id LIMIT 1;
  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;
  SELECT id INTO v_instance_id FROM instances WHERE slug = 'poe-family';
  IF v_instance_id IS NULL THEN
    RAISE EXCEPTION 'join_default_instance: poe-family instance not seeded';
  END IF;
  SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
  v_display_name := COALESCE(
    NULLIF(trim(display_name_in), ''),
    split_part(v_user_email, '@', 1),
    'Member'
  );
  INSERT INTO instance_members (instance_id, user_id, role, display_name)
    VALUES (v_instance_id, v_user_id, 'member', v_display_name);
  RETURN v_instance_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.user_in_instance(uuid)          TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_role_in_instance(uuid)     TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_default_instance(text)     TO authenticated;

-- RLS: drop v1-named policies and recreate under the new names
DROP POLICY IF EXISTS tenants_member_read       ON instances;
DROP POLICY IF EXISTS tenant_members_self_read  ON instance_members;
DROP POLICY IF EXISTS tenant_invites_admin_read ON instance_invites;

-- Member titles — paired with the rename (one person carries many titles)
ALTER TABLE instance_members ADD COLUMN IF NOT EXISTS title text;
COMMENT ON COLUMN instance_members.title IS
  'Free-text human-readable role(s) the member carries inside this instance. '
  'Permissions come from `role` + `role_scopes` only, not from `title`. POE binding: '
  'titles describe the person; roles describe the database CRUD permission.';

-- =====================================================================
-- §4.0.5 Trust ownership architecture (answers Q1, locked 2026-05-25)
-- =====================================================================

-- Widen instance_type to include trust + holding-company
ALTER TABLE instances DROP CONSTRAINT IF EXISTS instances_instance_type_check;
ALTER TABLE instances ADD CONSTRAINT instances_instance_type_check CHECK (
  instance_type IN (
    'family','church','therapy-practice','contractor','nonprofit','business',
    'landlord','law-practice','mentor','trades','media-org',
    'trust','holding-company'              -- new in v2.1
  )
);

-- Parent-instance pointer for trust → operating-company graph
ALTER TABLE instances ADD COLUMN IF NOT EXISTS parent_instance_id uuid REFERENCES instances(id);

-- Legal / operational metadata (non-privileged) — Legal-domain matters live encrypted in v2.6
ALTER TABLE instances ADD COLUMN IF NOT EXISTS legal_structure_notes jsonb NOT NULL DEFAULT '{}';
COMMENT ON COLUMN instances.legal_structure_notes IS
  'Non-privileged administrative shape for trusts and operating companies: '
  'entity_kind, state_of_formation, ein_last_4, registered_agent, trustees, '
  'beneficiaries, successor_trustee, operating_agreement_uri. Privileged content '
  'belongs in the encrypted Legal domain (v2.6) not here.';

-- Widen instance_members.role to add 'specialist' (5th CRUD role from IDENTITY-ROLES-AUDIT.md)
ALTER TABLE instance_members DROP CONSTRAINT IF EXISTS instance_members_role_check;
ALTER TABLE instance_members ADD CONSTRAINT instance_members_role_check CHECK (
  role IN ('owner','admin','member','viewer','specialist')
);

-- Entity widening for sub-entity + domain attribution
ALTER TABLE entities ADD COLUMN IF NOT EXISTS domain text;
ALTER TABLE entities ADD COLUMN IF NOT EXISTS parent_entity_id uuid REFERENCES entities(id);

-- =====================================================================
-- §10.5 Confessions client-side AES-GCM columns (answers Q4, locked 2026-05-25)
-- =====================================================================

ALTER TABLE confessions
  ADD COLUMN IF NOT EXISTS context_ciphertext          bytea,
  ADD COLUMN IF NOT EXISTS context_iv                  bytea,
  ADD COLUMN IF NOT EXISTS prayer_request_ciphertext   bytea,
  ADD COLUMN IF NOT EXISTS prayer_request_iv           bytea,
  ADD COLUMN IF NOT EXISTS scripture_anchor_ciphertext bytea,
  ADD COLUMN IF NOT EXISTS scripture_anchor_iv         bytea,
  ADD COLUMN IF NOT EXISTS encryption_version          smallint NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS confessions_enc_version_idx ON confessions (encryption_version);

COMMENT ON COLUMN confessions.encryption_version IS
  '0 = v1 plaintext columns authoritative; 1 = client-side AES-GCM ciphertext '
  'columns authoritative (plaintext columns zeroed by app-layer migration step). '
  'POE binding: the user holds the PIN; the server cannot decrypt; PIN loss = data loss, intentional.';

-- =====================================================================
-- §4.0.6 Disclaimers acknowledgments — non-liability posture in data layer
-- =====================================================================

CREATE TABLE IF NOT EXISTS disclaimers_acknowledgments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id     uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  acknowledged_by uuid NOT NULL REFERENCES auth.users(id),
  disclaimer_kind text NOT NULL CHECK (disclaimer_kind IN (
    'general-not-legal-advice',
    'general-not-financial-advice',
    'general-not-tax-advice',
    'lease-template-current-law',
    'scope-of-work-binding-contract',
    'tax-statement-self-verify',
    'donor-tax-statement',
    '1099-export-self-verify',
    'data-export-personal-responsibility',
    'legal-template-jurisdiction-stale'
  )),
  acknowledged_at timestamptz NOT NULL DEFAULT now(),
  disclaimer_text text NOT NULL,
  disclaimer_hash text NOT NULL,
  context_kind    text,
  context_id      uuid,
  scope           text NOT NULL DEFAULT 'single-use'
                  CHECK (scope IN ('single-use','session','30-days','until-revoked')),
  expires_at      timestamptz,
  revoked_at      timestamptz
);

CREATE INDEX IF NOT EXISTS disclaimers_ack_instance_user_kind_idx
  ON disclaimers_acknowledgments (instance_id, acknowledged_by, disclaimer_kind);
CREATE INDEX IF NOT EXISTS disclaimers_ack_context_idx
  ON disclaimers_acknowledgments (context_kind, context_id);

ALTER TABLE disclaimers_acknowledgments ENABLE ROW LEVEL SECURITY;

CREATE POLICY disclaimers_ack_self_read ON disclaimers_acknowledgments FOR SELECT
  USING (user_in_instance(instance_id) AND acknowledged_by = auth.uid());

CREATE POLICY disclaimers_ack_self_insert ON disclaimers_acknowledgments FOR INSERT
  WITH CHECK (user_in_instance(instance_id) AND acknowledged_by = auth.uid());

-- =====================================================================
-- §4.6 Instance subscriptions — tier-gated capabilities (answers Q5)
-- =====================================================================

CREATE TABLE IF NOT EXISTS instance_subscriptions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id     uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  tier            text NOT NULL CHECK (tier IN (
    'foundation',     -- free / read-only / single-user
    'poetech-plus',   -- $9/mo per-seat upgrade on top of foundation
    'family',         -- $19/mo household tier — homes only, internal renters only
    'premium',        -- $49/mo solo professional — therapy intake, mentor, legal personal
    'business',       -- $99/mo small business — rentals with non-family renters allowed
    'landlord',       -- $99/mo landlord — up to 10 doors
    'enterprise'      -- $299+ — multi-instance trust + holding-company root
  )),
  tier_limits     jsonb NOT NULL DEFAULT '{}',
  status          text NOT NULL DEFAULT 'active'
                  CHECK (status IN ('trial','active','past-due','cancelled','expired')),
  current_period_start timestamptz NOT NULL DEFAULT now(),
  current_period_end   timestamptz,
  stripe_customer_id     text,
  stripe_subscription_id text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid NOT NULL REFERENCES auth.users(id),
  updated_at      timestamptz
);

CREATE INDEX IF NOT EXISTS instance_subscriptions_active_idx
  ON instance_subscriptions (instance_id) WHERE status = 'active';

ALTER TABLE instance_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY instance_subs_member_read ON instance_subscriptions FOR SELECT
  USING (user_in_instance(instance_id));
CREATE POLICY instance_subs_owner_admin_write ON instance_subscriptions FOR INSERT
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin') AND created_by = auth.uid());
CREATE POLICY instance_subs_owner_admin_update ON instance_subscriptions FOR UPDATE
  USING (user_role_in_instance(instance_id) IN ('owner','admin'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
-- No DELETE — use status='cancelled' or status='expired'

-- Tier helper functions
CREATE OR REPLACE FUNCTION public.instance_active_tier(p_instance uuid)
RETURNS text
LANGUAGE sql STABLE
AS $$
  SELECT tier FROM instance_subscriptions
  WHERE instance_id = p_instance AND status = 'active'
  ORDER BY current_period_start DESC LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.tier_rank(p_tier text)
RETURNS int
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE p_tier
    WHEN 'foundation'   THEN 0
    WHEN 'poetech-plus' THEN 1
    WHEN 'family'       THEN 2
    WHEN 'premium'      THEN 3
    WHEN 'landlord'     THEN 4
    WHEN 'business'     THEN 5
    WHEN 'enterprise'   THEN 6
    ELSE -1
  END
$$;

CREATE OR REPLACE FUNCTION public.instance_meets_tier(p_instance uuid, p_required text)
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT tier_rank(instance_active_tier(p_instance)) >= tier_rank(p_required)
$$;

GRANT EXECUTE ON FUNCTION public.instance_active_tier(uuid)    TO authenticated;
GRANT EXECUTE ON FUNCTION public.tier_rank(text)               TO authenticated;
GRANT EXECUTE ON FUNCTION public.instance_meets_tier(uuid,text) TO authenticated;

-- =====================================================================
-- §4.1 instance_domains — which domain modules are enabled per instance
-- =====================================================================

CREATE TABLE IF NOT EXISTS instance_domains (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  domain      text NOT NULL CHECK (domain IN (
    'family','church','rentals','therapy','contractor',
    'legal','mentor','nonprofit','media','tech-business','trades'
  )),
  enabled_at  timestamptz NOT NULL DEFAULT now(),
  enabled_by  uuid NOT NULL REFERENCES auth.users(id),
  settings    jsonb NOT NULL DEFAULT '{}',
  requires_tier text,
  UNIQUE (instance_id, domain)
);

CREATE INDEX IF NOT EXISTS instance_domains_instance_idx ON instance_domains (instance_id);

ALTER TABLE instance_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY instance_domains_member_read ON instance_domains FOR SELECT
  USING (user_in_instance(instance_id));
CREATE POLICY instance_domains_owner_admin_insert ON instance_domains FOR INSERT
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin') AND enabled_by = auth.uid());
CREATE POLICY instance_domains_owner_admin_update ON instance_domains FOR UPDATE
  USING (user_role_in_instance(instance_id) IN ('owner','admin'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY instance_domains_owner_admin_delete ON instance_domains FOR DELETE
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- Tier enforcement: refuse INSERT if the instance's tier doesn't cover the domain
CREATE OR REPLACE FUNCTION public.instance_domains_tier_enforce()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.requires_tier IS NOT NULL
     AND NOT instance_meets_tier(NEW.instance_id, NEW.requires_tier) THEN
    RAISE EXCEPTION
      'Domain % requires tier % but instance has tier %. Upgrade required.',
      NEW.domain, NEW.requires_tier, COALESCE(instance_active_tier(NEW.instance_id), 'none');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS instance_domains_tier_enforce_trg ON instance_domains;
CREATE TRIGGER instance_domains_tier_enforce_trg
  BEFORE INSERT OR UPDATE OF requires_tier ON instance_domains
  FOR EACH ROW EXECUTE FUNCTION instance_domains_tier_enforce();

-- =====================================================================
-- §4.2 role_scopes — per-member scope modifiers
-- =====================================================================

CREATE TABLE IF NOT EXISTS role_scopes (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_member_id uuid NOT NULL REFERENCES instance_members(id) ON DELETE CASCADE,
  scope_kind         text NOT NULL CHECK (scope_kind IN
                       ('entity','property','module','read-only-flag','time-bounded')),
  scope_value        text,
  expires_at         timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  created_by         uuid NOT NULL REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS role_scopes_member_idx ON role_scopes (instance_member_id);

ALTER TABLE role_scopes ENABLE ROW LEVEL SECURITY;

CREATE POLICY role_scopes_member_read ON role_scopes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM instance_members tm
      WHERE tm.id = role_scopes.instance_member_id
        AND user_in_instance(tm.instance_id)
    )
  );

CREATE POLICY role_scopes_owner_write ON role_scopes FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM instance_members tm
      WHERE tm.id = role_scopes.instance_member_id
        AND user_role_in_instance(tm.instance_id) = 'owner'
    )
  );

-- Helper: effective role given a scope filter
CREATE OR REPLACE FUNCTION public.user_role_in_scope(
  p_instance uuid, p_scope_kind text, p_scope_value text
) RETURNS text
LANGUAGE sql STABLE
AS $$
  SELECT tm.role
  FROM instance_members tm
  LEFT JOIN role_scopes rs ON rs.instance_member_id = tm.id
                          AND rs.scope_kind  = p_scope_kind
                          AND rs.scope_value = p_scope_value
  WHERE tm.instance_id = p_instance
    AND tm.user_id     = auth.uid()
  LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.user_role_in_scope(uuid,text,text) TO authenticated;

-- =====================================================================
-- §4.3 audit_log — append-only, with hash-chain stub (answers Q3)
-- =====================================================================

CREATE TABLE IF NOT EXISTS audit_log (
  id          bigserial PRIMARY KEY,
  instance_id uuid NOT NULL REFERENCES instances(id),
  user_id     uuid REFERENCES auth.users(id),
  at          timestamptz NOT NULL DEFAULT now(),
  action      text NOT NULL CHECK (action IN (
    'create','update','delete','status-change','export',
    'login','logout','permission-grant','permission-revoke',
    'invite','accept-invite','pin-change','export-privileged',
    'export-stripped','failed-auth','system'
  )),
  entity_type text NOT NULL,
  entity_id   uuid,
  from_value  jsonb,
  to_value    jsonb,
  ip          inet,
  device      text,
  note        text,
  prev_hash   text,
  hash        text
);

CREATE INDEX IF NOT EXISTS audit_log_instance_at_idx ON audit_log (instance_id, at DESC);
CREATE INDEX IF NOT EXISTS audit_log_entity_idx     ON audit_log (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS audit_log_user_at_idx    ON audit_log (user_id, at DESC);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_log_member_read ON audit_log FOR SELECT
  USING (user_in_instance(instance_id));
-- No INSERT/UPDATE/DELETE policies: writes go only through audit_write() (SECURITY DEFINER)

-- Append-only writer
CREATE OR REPLACE FUNCTION public.audit_write(
  p_instance  uuid,
  p_action    text,
  p_entity    text,
  p_entity_id uuid,
  p_from      jsonb,
  p_to        jsonb,
  p_note      text
) RETURNS bigint
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_id bigint;
BEGIN
  INSERT INTO audit_log (instance_id, user_id, action, entity_type, entity_id, from_value, to_value, note)
    VALUES (p_instance, auth.uid(), p_action, p_entity, p_entity_id, p_from, p_to, p_note)
    RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.audit_write(uuid,text,text,uuid,jsonb,jsonb,text) TO authenticated;

-- Hash-chain verify stub — Phase 3+ wires the hash inputs; until then this walks
-- chained rows and returns the first tampered row id (or NULL if chain is clean
-- OR if hash columns are NULL, in which case there's nothing to verify).
CREATE OR REPLACE FUNCTION public.audit_verify_chain(
  p_from_id bigint, p_to_id bigint
) RETURNS bigint
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  r        record;
  expected text;
BEGIN
  expected := NULL;
  FOR r IN
    SELECT id, prev_hash, hash, action, entity_type, entity_id,
           extract(epoch FROM at)::text AS at_e,
           coalesce(from_value::text,'') AS fv,
           coalesce(to_value::text,'')   AS tv
      FROM audit_log
     WHERE id BETWEEN p_from_id AND p_to_id
     ORDER BY id
  LOOP
    IF r.hash IS NULL OR r.prev_hash IS NULL THEN
      CONTINUE;  -- chain not populated yet (default-disabled state)
    END IF;
    IF expected IS NOT NULL AND r.prev_hash <> expected THEN
      RETURN r.id;  -- tampered: prev_hash mismatch
    END IF;
    IF encode(digest(coalesce(r.prev_hash,'') || r.action || r.entity_type ||
                     coalesce(r.entity_id::text,'') || r.at_e || r.fv || r.tv, 'sha256'),
              'hex') <> r.hash THEN
      RETURN r.id;  -- tampered: hash recomputation mismatch
    END IF;
    expected := r.hash;
  END LOOP;
  RETURN NULL;
END;
$$;

-- Note: digest() requires the pgcrypto extension; enable it once at install time.
-- The verify stub is OK to ship without pgcrypto because it short-circuits on
-- NULL hash columns (the default state). If pgcrypto is missing AND someone
-- populates the chain, the function will error at the digest() call — which is
-- the right behavior (fail loud).

GRANT EXECUTE ON FUNCTION public.audit_verify_chain(bigint,bigint) TO authenticated;

-- =====================================================================
-- §4.4 entity_links — materialized cross-entity link index
-- =====================================================================

CREATE TABLE IF NOT EXISTS entity_links (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id      uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  from_entity_type text NOT NULL,
  from_entity_id   uuid NOT NULL,
  to_entity_type   text NOT NULL,
  to_entity_id     uuid NOT NULL,
  kind             text NOT NULL,
  source           text NOT NULL CHECK (source IN ('auto','user','suggested')),
  at               timestamptz NOT NULL DEFAULT now(),
  by_user_id       uuid REFERENCES auth.users(id),
  note             text,
  UNIQUE (instance_id, from_entity_type, from_entity_id, to_entity_type, to_entity_id, kind)
);

CREATE INDEX IF NOT EXISTS entity_links_from_idx ON entity_links (from_entity_type, from_entity_id);
CREATE INDEX IF NOT EXISTS entity_links_to_idx   ON entity_links (to_entity_type, to_entity_id);

ALTER TABLE entity_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY entity_links_member_read ON entity_links FOR SELECT
  USING (user_in_instance(instance_id));

-- =====================================================================
-- §4.5 external_users + interactions + invite tokens
-- =====================================================================

CREATE TABLE IF NOT EXISTS external_users (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id        uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  type               text NOT NULL CHECK (type IN (
    'contractor','renter','client','donor',
    'parishioner','volunteer','customer','vendor'
  )),
  display_name       text NOT NULL,
  email              text,
  phone              text,
  linked_entity_type text NOT NULL,
  linked_entity_id   uuid NOT NULL,
  invite_status      text NOT NULL DEFAULT 'not-invited'
                     CHECK (invite_status IN
                       ('not-invited','invited','accepted','revoked','expired')),
  invited_at         timestamptz,
  invited_by         uuid REFERENCES auth.users(id),
  accepted_at        timestamptz,
  last_seen_at       timestamptz,
  permissions        text[] NOT NULL DEFAULT '{}',
  notes              text,                                  -- INTERNAL-ONLY
  lifecycle          jsonb NOT NULL DEFAULT '{"phase":"active","log":[]}',
  links              jsonb NOT NULL DEFAULT '[]',
  created_at         timestamptz NOT NULL DEFAULT now(),
  created_by         uuid NOT NULL REFERENCES auth.users(id),
  updated_at         timestamptz,
  UNIQUE (instance_id, email, type)
);

CREATE INDEX IF NOT EXISTS external_users_instance_idx ON external_users (instance_id);
CREATE INDEX IF NOT EXISTS external_users_linked_idx   ON external_users (linked_entity_type, linked_entity_id);

ALTER TABLE external_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY external_users_member_read ON external_users FOR SELECT
  USING (user_in_instance(instance_id));
CREATE POLICY external_users_member_write ON external_users FOR INSERT
  WITH CHECK (user_in_instance(instance_id) AND created_by = auth.uid());
CREATE POLICY external_users_member_update ON external_users FOR UPDATE
  USING (user_in_instance(instance_id))
  WITH CHECK (user_in_instance(instance_id));

CREATE TABLE IF NOT EXISTS interactions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id         uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  external_user_id    uuid NOT NULL REFERENCES external_users(id) ON DELETE CASCADE,
  internal_user_id    uuid REFERENCES auth.users(id),
  at                  timestamptz NOT NULL DEFAULT now(),
  direction           text NOT NULL CHECK (direction IN ('inbound','outbound')),
  channel             text NOT NULL CHECK (channel IN
                        ('in-app','email','sms','phone','in-person')),
  kind                text NOT NULL CHECK (kind IN
                        ('message','status-update','file-share','request','payment','visit')),
  summary             text NOT NULL,
  body                text,
  attachments         jsonb NOT NULL DEFAULT '[]',
  lifecycle_note      text,
  linked_entity_type  text,
  linked_entity_id    uuid,
  visible_to_external boolean NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS interactions_external_idx ON interactions (external_user_id, at DESC);

ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY interactions_member_read ON interactions FOR SELECT
  USING (user_in_instance(instance_id));
CREATE POLICY interactions_member_write ON interactions FOR INSERT
  WITH CHECK (user_in_instance(instance_id));

CREATE TABLE IF NOT EXISTS external_invite_tokens (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_user_id   uuid NOT NULL REFERENCES external_users(id) ON DELETE CASCADE,
  token_hash         text NOT NULL UNIQUE,
  expires_at         timestamptz NOT NULL,
  used_at            timestamptz,
  device_fingerprint text,
  created_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE external_invite_tokens ENABLE ROW LEVEL SECURITY;
-- No direct read policy. Only SECURITY DEFINER auth helpers touch this table.

-- =====================================================================
-- RLS policies on the renamed v1 tables (recreate after the rename block)
-- =====================================================================

CREATE POLICY instances_member_read ON instances FOR SELECT
  USING (user_in_instance(id));

-- Trust ownership: members of a parent (the trust) can read the trust's row +
-- its children's `legal_structure_notes`-bearing rows but NOT the operating data
CREATE POLICY instances_parent_chain_read ON instances FOR SELECT
  USING (
    user_in_instance(id)
    OR user_in_instance(parent_instance_id)
    OR id IN (
      SELECT parent_instance_id FROM instances WHERE user_in_instance(id)
    )
  );

CREATE POLICY instance_members_self_read ON instance_members FOR SELECT
  USING (user_in_instance(instance_id));

CREATE POLICY instance_invites_admin_read ON instance_invites FOR SELECT
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- =====================================================================
-- Update v1.2 trigger function bodies to use instance_id (post-rename).
-- These triggers fire on every INSERT/UPDATE of accounts/debts/rentals/
-- etc.; if their bodies still referenced NEW.tenant_id after the column
-- rename, every write would error. CREATE OR REPLACE keeps the OID so
-- the existing trigger bindings continue to call the updated function.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.resolve_entity_slug_to_id()
RETURNS TRIGGER AS $fn$
BEGIN
  IF NEW.entity_slug IS NOT NULL AND NEW.entity_id IS NULL THEN
    SELECT id INTO NEW.entity_id
      FROM entities
     WHERE instance_id = NEW.instance_id AND slug = NEW.entity_slug
     LIMIT 1;
  END IF;
  RETURN NEW;
END;
$fn$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.resolve_account_slug_to_id()
RETURNS TRIGGER AS $fn$
BEGIN
  IF NEW.account_slug IS NOT NULL AND NEW.account_id IS NULL THEN
    SELECT id INTO NEW.account_id
      FROM accounts
     WHERE instance_id = NEW.instance_id AND slug = NEW.account_slug
     LIMIT 1;
  END IF;
  RETURN NEW;
END;
$fn$ LANGUAGE plpgsql;

-- v1.2 created several *_tenant_slug_uidx indexes; rename for vocabulary
-- consistency. Best-effort — skip silently if the index doesn't exist.
DO $rename_idx$
DECLARE pair RECORD;
BEGIN
  FOR pair IN
    SELECT * FROM (VALUES
      ('accounts_tenant_slug_uidx',     'accounts_instance_slug_uidx'),
      ('debts_tenant_slug_uidx',        'debts_instance_slug_uidx'),
      ('transactions_tenant_slug_uidx', 'transactions_instance_slug_uidx'),
      ('projects_tenant_slug_uidx',     'projects_instance_slug_uidx'),
      ('rentals_tenant_idx',            'rentals_instance_idx_v12'),
      ('rentals_tenant_slug_uidx',      'rentals_instance_slug_uidx'),
      ('incidents_tenant_idx',          'incidents_instance_idx_v12'),
      ('incidents_tenant_slug_uidx',    'incidents_instance_slug_uidx'),
      ('inquiries_tenant_idx',          'inquiries_instance_idx_v12'),
      ('inquiries_tenant_slug_uidx',    'inquiries_instance_slug_uidx'),
      ('scopes_tenant_idx',             'scopes_instance_idx_v12'),
      ('scopes_tenant_slug_uidx',       'scopes_instance_slug_uidx')
    ) AS t(old_name, new_name)
  LOOP
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = pair.old_name) THEN
      EXECUTE format('ALTER INDEX %I RENAME TO %I', pair.old_name, pair.new_name);
    END IF;
  END LOOP;
END $rename_idx$;

COMMIT;

-- =====================================================================
-- End of schema-v2.1-infra.sql
-- Dispatch, 2026-05-25 — Q1-Q9 lock-ins + trust ownership + POE binding
-- =====================================================================
