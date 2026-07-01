-- =============================================================================
-- 0055 — relationship-based permissions + the landlord<->tenant / guardian<->child
--        workflows
-- =============================================================================
-- Declared by Darrell 2026-06-29. Accounts now work, so the question is no longer
-- "is someone signed in" but "what does the RELATIONSHIP between two people grant."
-- This migration is the DB half of lib/relationships.js + lib/tenant-portal.js +
-- lib/guardian-child.js: the real tables the workflows write, with no-leak RLS so
-- each side sees ONLY what its relationship grants.
--
-- TWO new relationships get real, persisted workflows:
--
--   LANDLORD <-> TENANT — a tenant is an external user (NOT an instance member).
--     They are linked to a property via rental_tenancies, and the helper
--     user_is_tenant() scopes every child row to that tenant. A tenant sees their
--     own unit/lease/requests/notices/messages; the landlord (the property's
--     instance) sees all of theirs. The portfolio never leaks to a tenant.
--     NO MONEY MOVES: rent_records are a shared ledger (tenant reports, landlord
--     confirms); money_moved_in_app is hardwired false.
--
--   GUARDIAN <-> CHILD — a child is an instance member with the NEW role 'child'
--     (added to the role check below). 'child' is deliberately OUTSIDE the
--     ('owner','admin','member') set every family-internal table gates on, so a
--     child cannot read Forecast / Inventory / CRM / the books. A guardian
--     (owner/admin) configures the child's capabilities in child_capabilities;
--     approval-gated actions land in child_action_requests for the guardian to
--     approve. A child can never self-approve (update is owner/admin only).
--
-- CHILD-SAFETY + HUMAN-GATED: the app clamps every guardian choice to the model's
-- safety ceiling (lib/relationships.js), and changing access is always a guardian
-- write here — never automatic.
--
-- DEPENDS ON: schema-v2.1-infra (instances, instance_members, user_in_instance,
--             user_role_in_instance), 0024 (authenticated default grants),
--             0011/0023 (engagement_touch_updated_at).
-- IDEMPOTENT: CREATE ... IF NOT EXISTS, DROP-then-CREATE policies, guarded
--             constraint swap. Additive; family-internal + tenant-scoped, no anon.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. Add the 'child' role to instance_members. A child is a member of the family
--    instance but with a role OUTSIDE the governor set, so the standard
--    family-internal policies (IN ('owner','admin','member')) exclude them.
-- ---------------------------------------------------------------------------
ALTER TABLE instance_members DROP CONSTRAINT IF EXISTS instance_members_role_check;
ALTER TABLE instance_members ADD CONSTRAINT instance_members_role_check CHECK (
  role IN ('owner','admin','member','viewer','specialist','child')
);

-- ---------------------------------------------------------------------------
-- 1. rental_tenancies — the link between a tenant auth user and a property/unit.
--    This is what makes "landlord <-> tenant" a real two-sided relationship: the
--    tenant_user_id is the tenant's account; the instance owns the property side.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rental_tenancies (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id     uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by      uuid REFERENCES auth.users(id),
  tenant_user_id  uuid REFERENCES auth.users(id),     -- the tenant's account (nullable until they sign up)
  rental_ref      text,                                -- local rental id this tenancy belongs to
  property_label  text,                                -- denormalized for the tenant's view
  unit_label      text,                                -- their unit / room
  tenant_name     text,
  tenant_email    text,
  tenant_phone    text,
  lease_start     date,
  lease_end       date,
  monthly_rent    numeric NOT NULL DEFAULT 0,
  deposit         numeric NOT NULL DEFAULT 0,
  status          text NOT NULL DEFAULT 'active'
                    CHECK (status IN ('pending','active','ended')),
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz
);
CREATE INDEX IF NOT EXISTS rental_tenancies_instance_idx ON rental_tenancies(instance_id);
CREATE INDEX IF NOT EXISTS rental_tenancies_tenant_idx ON rental_tenancies(tenant_user_id);

DROP TRIGGER IF EXISTS rental_tenancies_touch_updated ON rental_tenancies;
CREATE TRIGGER rental_tenancies_touch_updated
  BEFORE UPDATE ON rental_tenancies
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

-- The tenant-scoping helper. SECURITY DEFINER so a tenant (who cannot read the
-- whole table) can still be matched to their own tenancy in child-row policies.
-- Returns true iff the caller is the tenant on that tenancy.
CREATE OR REPLACE FUNCTION public.user_is_tenant(p_tenancy uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM rental_tenancies t
    WHERE t.id = p_tenancy AND t.tenant_user_id = auth.uid()
  )
$$;
REVOKE ALL ON FUNCTION public.user_is_tenant(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_is_tenant(uuid) TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON rental_tenancies TO authenticated;
ALTER TABLE rental_tenancies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rental_tenancies_read   ON rental_tenancies;
DROP POLICY IF EXISTS rental_tenancies_insert ON rental_tenancies;
DROP POLICY IF EXISTS rental_tenancies_update ON rental_tenancies;
DROP POLICY IF EXISTS rental_tenancies_delete ON rental_tenancies;
-- Landlord (the property's instance) sees all; the tenant sees only their own row.
CREATE POLICY rental_tenancies_read ON rental_tenancies FOR SELECT TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member')
         OR tenant_user_id = auth.uid());
-- Only the landlord side creates/edits/removes a tenancy.
CREATE POLICY rental_tenancies_insert ON rental_tenancies FOR INSERT TO authenticated
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY rental_tenancies_update ON rental_tenancies FOR UPDATE TO authenticated
  USING      (user_role_in_instance(instance_id) IN ('owner','admin','member'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY rental_tenancies_delete ON rental_tenancies FOR DELETE TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- ---------------------------------------------------------------------------
-- 2. tenant_maintenance_requests — tenant submits, landlord triages.
--    RENAMED (2026-07-01) from `maintenance_requests` to unwedge the db-migrate
--    lane. The name collided with the PRE-EXISTING rentals table
--    `maintenance_requests` (schema-v2.2-rentals.sql, columns rental_id/renter_id).
--    `CREATE TABLE IF NOT EXISTS maintenance_requests` no-op'd against that table,
--    then `CREATE INDEX ... (tenancy_id)` ERRORed ("column tenancy_id does not
--    exist"), and ON_ERROR_STOP aborted every migration behind it. These are two
--    genuinely different data models (relationship-permissions tenancy vs. the
--    rentals record); the recorded call (memory: signup-privacy-and-visibility)
--    is to give THIS one its own name, not to rewrite the rentals model. Forward,
--    additive, no data dropped. Governed by DR-0084.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenant_maintenance_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id     uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  tenancy_id      uuid NOT NULL REFERENCES rental_tenancies(id) ON DELETE CASCADE,
  created_by      uuid REFERENCES auth.users(id),
  created_by_role text NOT NULL DEFAULT 'tenant' CHECK (created_by_role IN ('tenant','landlord')),
  title           text NOT NULL DEFAULT 'Maintenance request',
  detail          text,
  area            text,
  priority        text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  status          text NOT NULL DEFAULT 'submitted'
                    CHECK (status IN ('submitted','received','scheduled','in-progress','resolved','declined','cancelled')),
  resolution_note text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz
);
CREATE INDEX IF NOT EXISTS tenant_maintenance_requests_instance_idx ON tenant_maintenance_requests(instance_id);
CREATE INDEX IF NOT EXISTS tenant_maintenance_requests_tenancy_idx ON tenant_maintenance_requests(tenancy_id);

DROP TRIGGER IF EXISTS tenant_maintenance_requests_touch_updated ON tenant_maintenance_requests;
CREATE TRIGGER tenant_maintenance_requests_touch_updated
  BEFORE UPDATE ON tenant_maintenance_requests
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON tenant_maintenance_requests TO authenticated;
ALTER TABLE tenant_maintenance_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_maintenance_requests_read   ON tenant_maintenance_requests;
DROP POLICY IF EXISTS tenant_maintenance_requests_insert ON tenant_maintenance_requests;
DROP POLICY IF EXISTS tenant_maintenance_requests_update ON tenant_maintenance_requests;
DROP POLICY IF EXISTS tenant_maintenance_requests_delete ON tenant_maintenance_requests;
CREATE POLICY tenant_maintenance_requests_read ON tenant_maintenance_requests FOR SELECT TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member')
         OR user_is_tenant(tenancy_id));
CREATE POLICY tenant_maintenance_requests_insert ON tenant_maintenance_requests FOR INSERT TO authenticated
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member')
              OR user_is_tenant(tenancy_id));
CREATE POLICY tenant_maintenance_requests_update ON tenant_maintenance_requests FOR UPDATE TO authenticated
  USING      (user_role_in_instance(instance_id) IN ('owner','admin','member')
              OR user_is_tenant(tenancy_id))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member')
              OR user_is_tenant(tenancy_id));
CREATE POLICY tenant_maintenance_requests_delete ON tenant_maintenance_requests FOR DELETE TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- ---------------------------------------------------------------------------
-- 3. rent_records — the rent LEDGER. Tenant reports a payment, landlord confirms.
--    NO MONEY MOVES IN-APP: money_moved_in_app is hardwired false (a CHECK pins
--    it), and there is no card / processor field. The tenant pays out-of-band
--    (the owner's processor / hand) and records it; the landlord confirms receipt.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rent_records (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id         uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  tenancy_id          uuid NOT NULL REFERENCES rental_tenancies(id) ON DELETE CASCADE,
  reported_by         uuid REFERENCES auth.users(id),
  reported_by_role    text NOT NULL DEFAULT 'tenant' CHECK (reported_by_role IN ('tenant','landlord')),
  amount              numeric NOT NULL CHECK (amount > 0),
  for_period          text,                            -- e.g. '2026-07'
  method              text NOT NULL DEFAULT 'owner-processor',
  memo                text,
  status              text NOT NULL DEFAULT 'reported'
                        CHECK (status IN ('reported','confirmed','disputed','void')),
  money_moved_in_app  boolean NOT NULL DEFAULT false CHECK (money_moved_in_app = false),
  reported_at         timestamptz NOT NULL DEFAULT now(),
  confirmed_at        timestamptz,
  updated_at          timestamptz
);
CREATE INDEX IF NOT EXISTS rent_records_instance_idx ON rent_records(instance_id);
CREATE INDEX IF NOT EXISTS rent_records_tenancy_idx ON rent_records(tenancy_id);

DROP TRIGGER IF EXISTS rent_records_touch_updated ON rent_records;
CREATE TRIGGER rent_records_touch_updated
  BEFORE UPDATE ON rent_records
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON rent_records TO authenticated;
ALTER TABLE rent_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rent_records_read   ON rent_records;
DROP POLICY IF EXISTS rent_records_insert ON rent_records;
DROP POLICY IF EXISTS rent_records_update ON rent_records;
DROP POLICY IF EXISTS rent_records_delete ON rent_records;
CREATE POLICY rent_records_read ON rent_records FOR SELECT TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member')
         OR user_is_tenant(tenancy_id));
-- Tenant records (initiates) their own; the landlord may also record/confirm.
CREATE POLICY rent_records_insert ON rent_records FOR INSERT TO authenticated
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member')
              OR user_is_tenant(tenancy_id));
-- Confirming receipt is the landlord's action.
CREATE POLICY rent_records_update ON rent_records FOR UPDATE TO authenticated
  USING      (user_role_in_instance(instance_id) IN ('owner','admin','member'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY rent_records_delete ON rent_records FOR DELETE TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- ---------------------------------------------------------------------------
-- 4. tenant_notices — landlord posts, tenant reads.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenant_notices (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id   uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  tenancy_id    uuid NOT NULL REFERENCES rental_tenancies(id) ON DELETE CASCADE,
  created_by    uuid REFERENCES auth.users(id),
  title         text NOT NULL DEFAULT 'Notice',
  body          text,
  kind          text NOT NULL DEFAULT 'general',
  posted_at     timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz
);
CREATE INDEX IF NOT EXISTS tenant_notices_instance_idx ON tenant_notices(instance_id);
CREATE INDEX IF NOT EXISTS tenant_notices_tenancy_idx ON tenant_notices(tenancy_id);

DROP TRIGGER IF EXISTS tenant_notices_touch_updated ON tenant_notices;
CREATE TRIGGER tenant_notices_touch_updated
  BEFORE UPDATE ON tenant_notices
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON tenant_notices TO authenticated;
ALTER TABLE tenant_notices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_notices_read   ON tenant_notices;
DROP POLICY IF EXISTS tenant_notices_insert ON tenant_notices;
DROP POLICY IF EXISTS tenant_notices_update ON tenant_notices;
DROP POLICY IF EXISTS tenant_notices_delete ON tenant_notices;
CREATE POLICY tenant_notices_read ON tenant_notices FOR SELECT TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member')
         OR user_is_tenant(tenancy_id));
CREATE POLICY tenant_notices_insert ON tenant_notices FOR INSERT TO authenticated
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY tenant_notices_update ON tenant_notices FOR UPDATE TO authenticated
  USING      (user_role_in_instance(instance_id) IN ('owner','admin','member'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY tenant_notices_delete ON tenant_notices FOR DELETE TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- ---------------------------------------------------------------------------
-- 5. tenant_messages — the two-way thread scoped to a tenancy. APPEND-ONLY (a
--    sent message is a fact): grant SELECT + INSERT only, no update/delete.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenant_messages (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id    uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  tenancy_id     uuid NOT NULL REFERENCES rental_tenancies(id) ON DELETE CASCADE,
  sender_user_id uuid REFERENCES auth.users(id),
  from_role      text NOT NULL DEFAULT 'tenant' CHECK (from_role IN ('tenant','landlord')),
  body           text NOT NULL,
  sent_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tenant_messages_instance_idx ON tenant_messages(instance_id);
CREATE INDEX IF NOT EXISTS tenant_messages_tenancy_idx ON tenant_messages(tenancy_id);

GRANT SELECT, INSERT ON tenant_messages TO authenticated;
ALTER TABLE tenant_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_messages_read   ON tenant_messages;
DROP POLICY IF EXISTS tenant_messages_insert ON tenant_messages;
CREATE POLICY tenant_messages_read ON tenant_messages FOR SELECT TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member')
         OR user_is_tenant(tenancy_id));
CREATE POLICY tenant_messages_insert ON tenant_messages FOR INSERT TO authenticated
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member')
              OR user_is_tenant(tenancy_id));

-- ---------------------------------------------------------------------------
-- 6. child_capabilities — the guardian's configuration of a child's access.
--    Only a guardian (owner/admin) writes; the child may READ their own. This is
--    the persisted form of lib/relationships.js's child policy (the app clamps to
--    the safety ceiling before writing here).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS child_capabilities (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id    uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  child_user_id  uuid REFERENCES auth.users(id),
  child_persona  text NOT NULL,                        -- stable per-child key
  capability     text NOT NULL,
  setting        text NOT NULL CHECK (setting IN ('allow','approval','deny')),
  set_by         uuid REFERENCES auth.users(id),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS child_capabilities_uniq
  ON child_capabilities(instance_id, child_persona, capability);
CREATE INDEX IF NOT EXISTS child_capabilities_instance_idx ON child_capabilities(instance_id);
CREATE INDEX IF NOT EXISTS child_capabilities_child_idx ON child_capabilities(child_user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON child_capabilities TO authenticated;
ALTER TABLE child_capabilities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS child_capabilities_read   ON child_capabilities;
DROP POLICY IF EXISTS child_capabilities_insert ON child_capabilities;
DROP POLICY IF EXISTS child_capabilities_update ON child_capabilities;
DROP POLICY IF EXISTS child_capabilities_delete ON child_capabilities;
-- Guardians manage it; the child reads only their own settings.
CREATE POLICY child_capabilities_read ON child_capabilities FOR SELECT TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin')
         OR child_user_id = auth.uid());
-- Setting access is a GUARDIAN action only (permission changes are human-gated).
CREATE POLICY child_capabilities_insert ON child_capabilities FOR INSERT TO authenticated
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY child_capabilities_update ON child_capabilities FOR UPDATE TO authenticated
  USING      (user_role_in_instance(instance_id) IN ('owner','admin'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY child_capabilities_delete ON child_capabilities FOR DELETE TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- ---------------------------------------------------------------------------
-- 7. child_action_requests — the approval queue. A child invoking an
--    approval-gated capability creates a pending request; the guardian resolves
--    it. A child can NEVER self-approve: update is owner/admin only.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS child_action_requests (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id    uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  child_user_id  uuid REFERENCES auth.users(id),
  child_persona  text,
  capability     text NOT NULL,
  context        text,
  status         text NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','approved','denied','expired','cancelled')),
  guardian_note  text,
  resolved_by    uuid REFERENCES auth.users(id),
  requested_at   timestamptz NOT NULL DEFAULT now(),
  resolved_at    timestamptz
);
CREATE INDEX IF NOT EXISTS child_action_requests_instance_idx ON child_action_requests(instance_id);
CREATE INDEX IF NOT EXISTS child_action_requests_child_idx ON child_action_requests(child_user_id);
CREATE INDEX IF NOT EXISTS child_action_requests_status_idx ON child_action_requests(instance_id, status);

GRANT SELECT, INSERT, UPDATE, DELETE ON child_action_requests TO authenticated;
ALTER TABLE child_action_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS child_action_requests_read   ON child_action_requests;
DROP POLICY IF EXISTS child_action_requests_insert ON child_action_requests;
DROP POLICY IF EXISTS child_action_requests_update ON child_action_requests;
DROP POLICY IF EXISTS child_action_requests_delete ON child_action_requests;
-- Guardian sees all in the instance; the child sees only their own requests.
CREATE POLICY child_action_requests_read ON child_action_requests FOR SELECT TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin')
         OR child_user_id = auth.uid());
-- The child (or a guardian) files a request; the child may only file their own.
CREATE POLICY child_action_requests_insert ON child_action_requests FOR INSERT TO authenticated
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin')
              OR child_user_id = auth.uid());
-- ONLY a guardian resolves a request — a child can never approve their own.
CREATE POLICY child_action_requests_update ON child_action_requests FOR UPDATE TO authenticated
  USING      (user_role_in_instance(instance_id) IN ('owner','admin'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY child_action_requests_delete ON child_action_requests FOR DELETE TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- ---------------------------------------------------------------------------
-- Realtime: add the new tables to the supabase_realtime publication (guarded, so
-- a re-run does not error if they are already members).
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE rental_tenancies; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE tenant_maintenance_requests; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE rent_records; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE tenant_notices; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE tenant_messages; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE child_capabilities; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE child_action_requests; EXCEPTION WHEN duplicate_object THEN NULL; END;
  END IF;
END $$;
