-- =============================================================================
-- 0075 — delegated property management: scoped access for NON-family operators
--        (property managers + field workers), plus the enabled handyman<->tenant
--        channel, frictionless handyman docs, and the rent-balance audit trail.
-- =============================================================================
-- SECURITY-CRITICAL. 0055 shipped the landlord<->tenant backbone (rental_tenancies,
-- tenant_maintenance_requests, rent_records, tenant_notices, tenant_messages) and
-- the user_is_tenant() scoping helper; 0062 added the property MANAGER as a first-
-- class role and made requests assignable. Those operators, until now, only worked
-- if they were instance MEMBERS (which grants the whole instance). This migration
-- adds a SCOPED delegation model so an OUTSIDE account (a property manager or a
-- field worker who is NOT family, NOT an instance member) can be granted access to
-- exactly one property (a rental_ref), or a portfolio-of-this-grant ('*'), for
-- exactly the capabilities the landlord toggles on — revocably.
--
-- THE SPINE:
--   delegated_capabilities — the per-person, per-property, per-capability toggle
--     grid. Only an instance owner/admin writes it (the grantor controls grants);
--     the grantee reads only their OWN rows. setting='allow' is the ONLY value that
--     grants access here ('approval'/'deny' do not — 'approval' is an app-layer
--     workflow, never a DB read/write grant).
--   user_delegated_can(tenancy, capability) — the SECURITY DEFINER predicate that
--     resolves a tenancy -> its instance_id + rental_ref, then checks for an 'allow'
--     row for the caller whose scope_ref matches that rental_ref OR is '*'. It
--     mirrors user_is_tenant()'s shape (STABLE, SECURITY DEFINER, search_path pinned,
--     REVOKE ALL FROM PUBLIC + GRANT EXECUTE TO authenticated) so the two compose.
--
-- Every tenant-scoped table's RLS is EXTENDED (never loosened): the existing
-- owner/admin/member and user_is_tenant arms are preserved EXACTLY; only OR arms are
-- added for the mapped delegated capability. These tables are already tenant-scoped
-- (one tenancy = one door), which is the whole point — a delegated arm here can only
-- ever reach the tenancies whose rental_ref the operator was granted. NO delegated
-- arm grants the books / Forecast / Inventory / CRM / the portfolio.
--
-- CAPABILITY VOCABULARY (the toggle grid's columns):
--   manager:      request.manage, message.tenant, notice.post, rentroll.view,
--                 rent.confirm, rent.adjust, application.review
--   field_worker: property.history, docs.add
--
-- NO MONEY MOVES (unchanged from 0055): rent_records stay a shared ledger with
-- money_moved_in_app hardwired false; rent.adjust edits a BALANCE and lands an
-- append-only audit row, it never moves money.
--
-- DEPENDS ON: 0055 (rental_tenancies + the five tenant tables + user_is_tenant +
--             user_role_in_instance), 0062 (manager role, assigned_to), 0024
--             (authenticated default grants), 0011/0023 (engagement_touch_updated_at).
-- IDEMPOTENT: CREATE ... IF NOT EXISTS, CREATE OR REPLACE FUNCTION, DROP POLICY
--             IF EXISTS then CREATE, guarded publication add. Additive; every arm is
--             ADDITIVE to existing RLS. No anon. Governed by DR-0084 (self-applying
--             lane) + DR-0076 (isolation is UNVERIFIED until 0075-isolation-smoke.sql
--             passes on the live NAS Supabase — see that file, it is the gate).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. delegated_capabilities — the per-person, per-property, revocable toggle grid.
--    scope_ref is a rental_ref value (one door) OR the literal '*' (portfolio of
--    this grant = every managed door of this grantee). UNIQUE across
--    (instance, grantee, scope_ref, capability) so a toggle is a single row the
--    grantor flips. Only setting='allow' grants; 'approval'/'deny' do not.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS delegated_capabilities (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id      uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  grantee_user_id  uuid NOT NULL REFERENCES auth.users(id),
  scope_ref        text NOT NULL,                        -- a rental_ref, OR '*' (all-managed/portfolio of this grant)
  capability       text NOT NULL,                        -- request.manage | message.tenant | notice.post | rentroll.view | rent.confirm | rent.adjust | application.review | property.history | docs.add
  setting          text NOT NULL DEFAULT 'deny'
                     CHECK (setting IN ('deny','approval','allow')),
  granted_by       uuid REFERENCES auth.users(id),
  role_label       text CHECK (role_label IN ('manager','field_worker')),
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS delegated_capabilities_uniq
  ON delegated_capabilities(instance_id, grantee_user_id, scope_ref, capability);
CREATE INDEX IF NOT EXISTS delegated_capabilities_grantee_idx
  ON delegated_capabilities(grantee_user_id);
CREATE INDEX IF NOT EXISTS delegated_capabilities_instance_idx
  ON delegated_capabilities(instance_id);

DROP TRIGGER IF EXISTS delegated_capabilities_touch_updated ON delegated_capabilities;
CREATE TRIGGER delegated_capabilities_touch_updated
  BEFORE UPDATE ON delegated_capabilities
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON delegated_capabilities TO authenticated;
ALTER TABLE delegated_capabilities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS delegated_capabilities_read   ON delegated_capabilities;
DROP POLICY IF EXISTS delegated_capabilities_insert ON delegated_capabilities;
DROP POLICY IF EXISTS delegated_capabilities_update ON delegated_capabilities;
DROP POLICY IF EXISTS delegated_capabilities_delete ON delegated_capabilities;
-- Grantor (owner/admin) controls the grants; the grantee reads only their OWN rows.
CREATE POLICY delegated_capabilities_read ON delegated_capabilities FOR SELECT TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin')
         OR grantee_user_id = auth.uid());
CREATE POLICY delegated_capabilities_insert ON delegated_capabilities FOR INSERT TO authenticated
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY delegated_capabilities_update ON delegated_capabilities FOR UPDATE TO authenticated
  USING      (user_role_in_instance(instance_id) IN ('owner','admin'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY delegated_capabilities_delete ON delegated_capabilities FOR DELETE TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- The scoped-delegation predicate. SECURITY DEFINER (mirrors user_is_tenant) so a
-- delegate — who cannot read delegated_capabilities beyond their own rows, nor the
-- whole rental_tenancies table — can still be matched to a tenancy in child-row
-- policies. Returns true IFF an 'allow' row exists for the caller + capability whose
-- scope_ref is either the tenancy's rental_ref OR '*', in the tenancy's instance.
-- Only setting='allow' grants; 'approval'/'deny' never grant a read/write here.
CREATE OR REPLACE FUNCTION public.user_delegated_can(p_tenancy uuid, p_capability text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM rental_tenancies t
    JOIN delegated_capabilities dc
      ON dc.instance_id     = t.instance_id
     AND dc.grantee_user_id = auth.uid()
     AND dc.capability      = p_capability
     AND dc.setting         = 'allow'
     AND (dc.scope_ref = t.rental_ref OR dc.scope_ref = '*')
    WHERE t.id = p_tenancy
  )
$$;
REVOKE ALL ON FUNCTION public.user_delegated_can(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_delegated_can(uuid, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. tenancy_worker_access — the landlord-ENABLED handyman<->tenant channel. This
--    is the narrow, per-tenancy switch that lets an enabled worker read/post on a
--    specific tenancy's tenant_messages (wired in section 3). It is DISTINCT from
--    delegated_capabilities: worker access is a single explicit enable per tenancy,
--    not a portfolio grant. active=false revokes without deleting the history.
--    Defined here (with its helper) BEFORE section 3 so the tenant_messages policy
--    can reference user_is_enabled_worker() at CREATE POLICY time.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenancy_worker_access (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id     uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  tenancy_id      uuid NOT NULL REFERENCES rental_tenancies(id) ON DELETE CASCADE,
  worker_user_id  uuid NOT NULL REFERENCES auth.users(id),
  enabled_by      uuid REFERENCES auth.users(id),
  active          boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS tenancy_worker_access_uniq
  ON tenancy_worker_access(tenancy_id, worker_user_id);
CREATE INDEX IF NOT EXISTS tenancy_worker_access_instance_idx
  ON tenancy_worker_access(instance_id);
CREATE INDEX IF NOT EXISTS tenancy_worker_access_worker_idx
  ON tenancy_worker_access(worker_user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON tenancy_worker_access TO authenticated;
ALTER TABLE tenancy_worker_access ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenancy_worker_access_read   ON tenancy_worker_access;
DROP POLICY IF EXISTS tenancy_worker_access_insert ON tenancy_worker_access;
DROP POLICY IF EXISTS tenancy_worker_access_update ON tenancy_worker_access;
DROP POLICY IF EXISTS tenancy_worker_access_delete ON tenancy_worker_access;
-- Owner/admin (or a message.tenant manager) enables/revokes; the grantee reads
-- their own enablement, owner/admin read all in the instance.
CREATE POLICY tenancy_worker_access_read ON tenancy_worker_access FOR SELECT TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin')
         OR worker_user_id = auth.uid());
CREATE POLICY tenancy_worker_access_insert ON tenancy_worker_access FOR INSERT TO authenticated
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin')
              OR user_delegated_can(tenancy_id,'message.tenant'));
CREATE POLICY tenancy_worker_access_update ON tenancy_worker_access FOR UPDATE TO authenticated
  USING      (user_role_in_instance(instance_id) IN ('owner','admin')
              OR user_delegated_can(tenancy_id,'message.tenant'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin')
              OR user_delegated_can(tenancy_id,'message.tenant'));
CREATE POLICY tenancy_worker_access_delete ON tenancy_worker_access FOR DELETE TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin')
         OR user_delegated_can(tenancy_id,'message.tenant'));

-- The enabled-worker predicate. SECURITY DEFINER (mirrors user_is_tenant) so an
-- enabled worker can be matched on a tenancy they cannot otherwise read. True IFF
-- an ACTIVE row exists for the caller on that tenancy.
CREATE OR REPLACE FUNCTION public.user_is_enabled_worker(p_tenancy uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM tenancy_worker_access w
    WHERE w.tenancy_id = p_tenancy
      AND w.worker_user_id = auth.uid()
      AND w.active = true
  )
$$;
REVOKE ALL ON FUNCTION public.user_is_enabled_worker(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_is_enabled_worker(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. Extend the tenant tables' RLS to honor the SCOPED delegate. For each table we
--    DROP-then-CREATE the existing policy (0055/0062 named them <table>_<action>),
--    PRESERVING the owner/admin/member and user_is_tenant arms EXACTLY, and ADDING
--    only the mapped delegated OR arm. Nothing is loosened; delete policies are left
--    as-is (owner/admin — no delegated delete). A delegated arm can only ever reach
--    a tenancy whose rental_ref the operator was granted (scope), or '*'.
-- ---------------------------------------------------------------------------

-- 3a. tenant_maintenance_requests — read: managers (request.manage) + field workers
--     (property.history / docs.add) may VIEW; write: only request.manage manages.
DROP POLICY IF EXISTS tenant_maintenance_requests_read   ON tenant_maintenance_requests;
DROP POLICY IF EXISTS tenant_maintenance_requests_insert ON tenant_maintenance_requests;
DROP POLICY IF EXISTS tenant_maintenance_requests_update ON tenant_maintenance_requests;
CREATE POLICY tenant_maintenance_requests_read ON tenant_maintenance_requests FOR SELECT TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member')
         OR user_is_tenant(tenancy_id)
         OR user_delegated_can(tenancy_id,'request.manage')
         OR user_delegated_can(tenancy_id,'property.history')
         OR user_delegated_can(tenancy_id,'docs.add'));
CREATE POLICY tenant_maintenance_requests_insert ON tenant_maintenance_requests FOR INSERT TO authenticated
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member')
              OR user_is_tenant(tenancy_id)
              OR user_delegated_can(tenancy_id,'request.manage'));
CREATE POLICY tenant_maintenance_requests_update ON tenant_maintenance_requests FOR UPDATE TO authenticated
  USING      (user_role_in_instance(instance_id) IN ('owner','admin','member')
              OR user_is_tenant(tenancy_id)
              OR user_delegated_can(tenancy_id,'request.manage'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member')
              OR user_is_tenant(tenancy_id)
              OR user_delegated_can(tenancy_id,'request.manage'));

-- 3b. rent_records — read: rentroll.view; insert: rent.confirm; update: rent.adjust.
--     (Original insert allowed the tenant; original update was owner/admin/member.)
DROP POLICY IF EXISTS rent_records_read   ON rent_records;
DROP POLICY IF EXISTS rent_records_insert ON rent_records;
DROP POLICY IF EXISTS rent_records_update ON rent_records;
CREATE POLICY rent_records_read ON rent_records FOR SELECT TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member')
         OR user_is_tenant(tenancy_id)
         OR user_delegated_can(tenancy_id,'rentroll.view'));
CREATE POLICY rent_records_insert ON rent_records FOR INSERT TO authenticated
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member')
              OR user_is_tenant(tenancy_id)
              OR user_delegated_can(tenancy_id,'rent.confirm'));
CREATE POLICY rent_records_update ON rent_records FOR UPDATE TO authenticated
  USING      (user_role_in_instance(instance_id) IN ('owner','admin','member')
              OR user_delegated_can(tenancy_id,'rent.adjust'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member')
              OR user_delegated_can(tenancy_id,'rent.adjust'));

-- 3c. tenant_notices — read + write: notice.post. (Original insert/update was
--     owner/admin/member; read was owner/admin/member OR tenant.)
DROP POLICY IF EXISTS tenant_notices_read   ON tenant_notices;
DROP POLICY IF EXISTS tenant_notices_insert ON tenant_notices;
DROP POLICY IF EXISTS tenant_notices_update ON tenant_notices;
CREATE POLICY tenant_notices_read ON tenant_notices FOR SELECT TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member')
         OR user_is_tenant(tenancy_id)
         OR user_delegated_can(tenancy_id,'notice.post'));
CREATE POLICY tenant_notices_insert ON tenant_notices FOR INSERT TO authenticated
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member')
              OR user_delegated_can(tenancy_id,'notice.post'));
CREATE POLICY tenant_notices_update ON tenant_notices FOR UPDATE TO authenticated
  USING      (user_role_in_instance(instance_id) IN ('owner','admin','member')
              OR user_delegated_can(tenancy_id,'notice.post'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member')
              OR user_delegated_can(tenancy_id,'notice.post'));

-- 3d. tenant_messages — read + insert: a message.tenant manager OR an enabled worker.
--     APPEND-ONLY still (no update/delete policies existed; none added).
DROP POLICY IF EXISTS tenant_messages_read   ON tenant_messages;
DROP POLICY IF EXISTS tenant_messages_insert ON tenant_messages;
CREATE POLICY tenant_messages_read ON tenant_messages FOR SELECT TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member')
         OR user_is_tenant(tenancy_id)
         OR user_delegated_can(tenancy_id,'message.tenant')
         OR user_is_enabled_worker(tenancy_id));
CREATE POLICY tenant_messages_insert ON tenant_messages FOR INSERT TO authenticated
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member')
              OR user_is_tenant(tenancy_id)
              OR user_delegated_can(tenancy_id,'message.tenant')
              OR user_is_enabled_worker(tenancy_id));

-- 3e. rental_tenancies — a scoped operator may SEE the tenancies they manage
--     (request.manage / rentroll.view / property.history / application.review). The
--     tenancy id IS the argument to user_delegated_can here. Insert/update/delete
--     stay owner/admin(/member) EXACTLY as 0055 shipped them (untouched below).
DROP POLICY IF EXISTS rental_tenancies_read ON rental_tenancies;
CREATE POLICY rental_tenancies_read ON rental_tenancies FOR SELECT TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member')
         OR tenant_user_id = auth.uid()
         OR user_delegated_can(id,'request.manage')
         OR user_delegated_can(id,'rentroll.view')
         OR user_delegated_can(id,'property.history')
         OR user_delegated_can(id,'application.review'));

-- ---------------------------------------------------------------------------
-- 4. request_documentation — frictionless handyman docs on a maintenance request.
--    tenancy_id is denormalized so RLS can scope without a join. APPEND-ONLY: only
--    SELECT + INSERT are granted (a documented outcome is a fact; no edit/delete).
--    followup is only meaningful when outcome='not_fixed' (enforced in the app).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS request_documentation (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id      uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  request_id       uuid NOT NULL REFERENCES tenant_maintenance_requests(id) ON DELETE CASCADE,
  tenancy_id       uuid NOT NULL,                          -- denormalized for RLS scoping
  author_user_id   uuid REFERENCES auth.users(id),
  outcome          text CHECK (outcome IN ('fixed','not_fixed')),
  followup         text CHECK (followup IN ('needs_parts','needs_money','needs_time','other')),
  note             text,
  image_data       text,                                   -- base64 / compressed data URL, nullable
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS request_documentation_instance_idx ON request_documentation(instance_id);
CREATE INDEX IF NOT EXISTS request_documentation_request_idx  ON request_documentation(request_id);
CREATE INDEX IF NOT EXISTS request_documentation_tenancy_idx  ON request_documentation(tenancy_id);

GRANT SELECT, INSERT ON request_documentation TO authenticated;
ALTER TABLE request_documentation ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS request_documentation_read   ON request_documentation;
DROP POLICY IF EXISTS request_documentation_insert ON request_documentation;
CREATE POLICY request_documentation_read ON request_documentation FOR SELECT TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member')
         OR user_delegated_can(tenancy_id,'docs.add')
         OR user_delegated_can(tenancy_id,'request.manage')
         OR user_is_tenant(tenancy_id));
CREATE POLICY request_documentation_insert ON request_documentation FOR INSERT TO authenticated
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member')
              OR user_delegated_can(tenancy_id,'docs.add')
              OR user_delegated_can(tenancy_id,'request.manage')
              OR user_is_tenant(tenancy_id));

-- ---------------------------------------------------------------------------
-- 5. rent_balance_adjustments — append-only audit trail for balance edits. A
--    rent.adjust operation records old/new + reason here; this table never moves
--    money, it records the human-authored correction. APPEND-ONLY: SELECT + INSERT
--    grants only (an audit row is immutable).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rent_balance_adjustments (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id    uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  tenancy_id     uuid NOT NULL,                            -- denormalized for RLS scoping
  adjusted_by    uuid REFERENCES auth.users(id),
  old_balance    numeric,
  new_balance    numeric,
  reason         text,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rent_balance_adjustments_instance_idx ON rent_balance_adjustments(instance_id);
CREATE INDEX IF NOT EXISTS rent_balance_adjustments_tenancy_idx  ON rent_balance_adjustments(tenancy_id);

GRANT SELECT, INSERT ON rent_balance_adjustments TO authenticated;
ALTER TABLE rent_balance_adjustments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rent_balance_adjustments_read   ON rent_balance_adjustments;
DROP POLICY IF EXISTS rent_balance_adjustments_insert ON rent_balance_adjustments;
-- Read: owner/admin + the adjuster themselves + any manager with rentroll.view on
-- that tenancy. Insert: owner/admin OR a rent.adjust manager.
CREATE POLICY rent_balance_adjustments_read ON rent_balance_adjustments FOR SELECT TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin')
         OR adjusted_by = auth.uid()
         OR user_delegated_can(tenancy_id,'rentroll.view'));
CREATE POLICY rent_balance_adjustments_insert ON rent_balance_adjustments FOR INSERT TO authenticated
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin')
              OR user_delegated_can(tenancy_id,'rent.adjust'));

-- ---------------------------------------------------------------------------
-- Realtime: add the new tables to the supabase_realtime publication (guarded, so a
-- re-run does not error if they are already members). RLS applies to the stream, so
-- a delegate only receives rows their SELECT policy already permits.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE delegated_capabilities; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE tenancy_worker_access;  EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE request_documentation;  EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE rent_balance_adjustments; EXCEPTION WHEN duplicate_object THEN NULL; END;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
