-- =====================================================================
-- PROPOSED (GATED — NOT auto-applied). See infra/supabase/proposed/README.md
--
-- property-manager-scoped-role.sql
-- Scoped, least-privilege access for an EXTERNAL 1099 Property Manager.
--
-- DESIGN CHOICE (fail-closed): the Property Manager is an EXTERNAL USER
-- (Pattern D, schema-v2.9-portal-rls.sql), NOT an instance_member.
--   - An instance_member passes user_in_instance() everywhere -> would see
--     finances/Books unless every sensitive table blocklists the role
--     (fail-OPEN, fragile). Rejected.
--   - An external user is a member of NO instance -> passes user_in_instance()
--     NOWHERE -> default-DENY on everything. She sees ONLY rows an explicit,
--     un-revoked assignment opens to her (fail-CLOSED, by construction).
--
-- Reuses live primitives:
--   external_users, external_invite_tokens, interactions, current_external_user_id()
--   (schema-v2.1-infra.sql, schema-v2.9-portal-rls.sql).
--
-- Depends on: schema-v2.1-infra.sql, schema-v2.2-rentals.sql, schema-v2.9-portal-rls.sql.
-- Pairs with: docs/00-foundations/PROPERTY-MANAGER-ROLE-ONBOARDING.md,
--             docs/00-foundations/ROLES-MEMBERSHIP-MULTITENANCY-ADR.md,
--             property-manager-leak-test.sql (proven-to-catch).
-- Guards: tenancy-guard.mjs (RLS on new instance_id table) + grant-guard.mjs.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. Widen external_users.type to admit the property-manager kind.
-- ---------------------------------------------------------------------
ALTER TABLE external_users DROP CONSTRAINT IF EXISTS external_users_type_check;
ALTER TABLE external_users ADD CONSTRAINT external_users_type_check CHECK (type IN (
  'contractor','renter','client','donor','parishioner','volunteer','customer','vendor',
  'property-manager'                                    -- NEW
));

-- ---------------------------------------------------------------------
-- 2. property_assignments — THE scoping control Christina operates.
--    One row = "this PM may manage this property." Un-assign = set revoked_at.
--    (rental_id today = a property; when the rentals lane lands a units table,
--     add an optional unit_id and AND it into pm_assigned_to_rental.)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS property_assignments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id      uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  external_user_id uuid NOT NULL REFERENCES external_users(id) ON DELETE CASCADE,
  rental_id        uuid NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
  scope            text NOT NULL DEFAULT 'manage' CHECK (scope IN ('manage','view')),
  assigned_by      uuid NOT NULL REFERENCES auth.users(id),
  created_at       timestamptz NOT NULL DEFAULT now(),
  revoked_at       timestamptz,
  revoked_by       uuid REFERENCES auth.users(id),
  UNIQUE (external_user_id, rental_id)
);
CREATE INDEX IF NOT EXISTS property_assignments_pm_idx
  ON property_assignments (external_user_id) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS property_assignments_rental_idx
  ON property_assignments (rental_id) WHERE revoked_at IS NULL;

ALTER TABLE property_assignments ENABLE ROW LEVEL SECURITY;

-- Only an owner/admin of the OWNING instance may create/modify assignments.
-- (This is the DB-level enforcement of "humans grant permission, not Claude":
--  an agent has no owner/admin session, so it cannot write this table.)
CREATE POLICY property_assignments_owner_read ON property_assignments FOR SELECT
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY property_assignments_owner_insert ON property_assignments FOR INSERT
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin')
              AND assigned_by = auth.uid());
CREATE POLICY property_assignments_owner_update ON property_assignments FOR UPDATE
  USING (user_role_in_instance(instance_id) IN ('owner','admin'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));

-- The PM may READ her OWN assignments (so her app can list her units).
-- She may NOT write them -> privilege escalation is structurally impossible.
CREATE POLICY property_assignments_pm_self_read ON property_assignments FOR SELECT
  USING (external_user_id = current_external_user_id() AND revoked_at IS NULL);

-- ---------------------------------------------------------------------
-- 3. The single predicate every management surface AND-checks.
--    Returns false when there is no external_user claim (internal users),
--    so it never widens an internal member's access.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.pm_assigned_to_rental(p_rental_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1 FROM property_assignments pa
    WHERE pa.rental_id        = p_rental_id
      AND pa.external_user_id  = current_external_user_id()
      AND pa.revoked_at IS NULL
  )
$$;
GRANT EXECUTE ON FUNCTION public.pm_assigned_to_rental(uuid) TO authenticated, anon;

-- ---------------------------------------------------------------------
-- 4. Management-surface access.
--    Naturally rental-scoped tables get a Pattern-D PM portal policy.
--    Column-SENSITIVE tables (rentals, renters — they carry owner
--    financials / internal notes) are exposed via a restricted VIEW only,
--    so the PM can NEVER read a financial column even for her own units.
-- ---------------------------------------------------------------------

-- 4a. maintenance_requests — PM reads + works requests on assigned units.
CREATE POLICY maint_req_pm_portal_read ON maintenance_requests FOR SELECT
  USING (pm_assigned_to_rental(rental_id));
CREATE POLICY maint_req_pm_portal_insert ON maintenance_requests FOR INSERT
  WITH CHECK (pm_assigned_to_rental(rental_id)
              AND created_by = auth.uid()
              AND submitted_via IN ('in-person','owner-discovery','phone','email','sms'));
CREATE POLICY maint_req_pm_portal_update ON maintenance_requests FOR UPDATE
  USING (pm_assigned_to_rental(rental_id))
  WITH CHECK (pm_assigned_to_rental(rental_id));

-- 4b. interactions — PM<->tenant/owner message log for assigned units.
--     (interactions.linked_entity_type/id points at the rental.)
CREATE POLICY interactions_pm_portal_read ON interactions FOR SELECT
  USING (linked_entity_type = 'rental' AND pm_assigned_to_rental(linked_entity_id));
CREATE POLICY interactions_pm_portal_insert ON interactions FOR INSERT
  WITH CHECK (linked_entity_type = 'rental' AND pm_assigned_to_rental(linked_entity_id));

-- 4c. rentals -> pm_property_view: ONLY management columns, ONLY assigned units.
--     No purchase_price / mortgage / market_value / taxes / insurance / hoa.
--     A definer view is the column boundary; the WHERE is the row boundary.
--     Non-PM callers get zero rows (pm_assigned_to_rental is false for them),
--     so this view is invisible to internal users, who use `rentals` directly.
CREATE OR REPLACE VIEW public.pm_property_view AS
  SELECT id, instance_id, address, unit, display_name, property_type,
         city, state, zip, status
  FROM rentals
  WHERE pm_assigned_to_rental(id);
GRANT SELECT ON public.pm_property_view TO authenticated;

-- 4d. renters -> pm_renter_view: tenant coordination contact for assigned
--     units only. No `notes` (internal), no financial linkage.
CREATE OR REPLACE VIEW public.pm_renter_view AS
  SELECT DISTINCT r.id, r.instance_id, r.display_name,
         r.contact_email, r.contact_phone,
         r.emergency_contact_name, r.emergency_contact_phone,
         l.rental_id
  FROM renters r
  JOIN leases l ON l.renter_id = r.id
  WHERE pm_assigned_to_rental(l.rental_id);
GRANT SELECT ON public.pm_renter_view TO authenticated;

-- NOTE (default-DENY, intentional — "NOT finances"):
--   leases, rent_payments, accounts, transactions, debts, family_snapshots,
--   and every other table get NO PM policy and NO PM view. The PM is not an
--   instance member, so user_in_instance() is false for her there -> zero rows.
--   Owner financials, rent amounts, personal/non-rental properties, other
--   owners' instances, and other businesses are all invisible by construction.

-- ---------------------------------------------------------------------
-- 5. Onboarding RPC — the turnkey mechanism. An OWNER/ADMIN calls this;
--    an agent cannot (no owner session). Returns the external_user_id the
--    app uses to mint the magic-link invite (external_invite_tokens).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.invite_property_manager(
  p_email        text,
  p_display_name text,
  p_rental_ids   uuid[]
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_caller     uuid := auth.uid();
  v_instance   uuid;
  v_email      text := lower(trim(coalesce(p_email, '')));
  v_ext_id     uuid;
  v_rental     uuid;
  v_owned      int;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'invite_property_manager: not authenticated';
  END IF;
  IF v_email = '' OR position('@' in v_email) = 0 THEN
    RAISE EXCEPTION 'invite_property_manager: a valid email is required';
  END IF;
  IF p_rental_ids IS NULL OR array_length(p_rental_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'invite_property_manager: at least one rental must be assigned';
  END IF;

  -- Every assigned rental must belong to ONE instance the caller owns/admins.
  SELECT DISTINCT instance_id INTO v_instance
    FROM rentals WHERE id = ANY(p_rental_ids);
  IF v_instance IS NULL THEN
    RAISE EXCEPTION 'invite_property_manager: rentals not found';
  END IF;
  SELECT count(*) INTO v_owned
    FROM rentals
    WHERE id = ANY(p_rental_ids) AND instance_id = v_instance;
  IF v_owned <> array_length(p_rental_ids, 1) THEN
    RAISE EXCEPTION 'invite_property_manager: all rentals must be in the same instance';
  END IF;
  IF user_role_in_instance(v_instance) NOT IN ('owner','admin') THEN
    RAISE EXCEPTION 'invite_property_manager: only an owner/admin may invite a property manager';
  END IF;

  -- Create (or reuse) the external user for this PM in this instance.
  INSERT INTO external_users (instance_id, type, display_name, email,
                              linked_entity_type, linked_entity_id,
                              invite_status, invited_at, invited_by,
                              permissions, created_by)
  VALUES (v_instance, 'property-manager', coalesce(nullif(trim(p_display_name),''), v_email),
          v_email, 'instance', v_instance, 'invited', now(), v_caller,
          ARRAY['maintenance:read','maintenance:write','messages','tenant-contact:read'],
          v_caller)
  ON CONFLICT (instance_id, email, type)
    DO UPDATE SET invite_status = 'invited', invited_at = now(), invited_by = v_caller
  RETURNING id INTO v_ext_id;

  -- Assign the selected rentals (idempotent; re-activates a revoked one).
  FOREACH v_rental IN ARRAY p_rental_ids LOOP
    INSERT INTO property_assignments (instance_id, external_user_id, rental_id, assigned_by)
    VALUES (v_instance, v_ext_id, v_rental, v_caller)
    ON CONFLICT (external_user_id, rental_id)
      DO UPDATE SET revoked_at = NULL, revoked_by = NULL, assigned_by = v_caller;
  END LOOP;

  RETURN v_ext_id;   -- app mints the magic-link token from this id.
END;
$$;
GRANT EXECUTE ON FUNCTION public.invite_property_manager(text, text, uuid[]) TO authenticated;

COMMIT;

-- =====================================================================
-- HANDOFF to the rentals-management lane (local_9aedb5b8):
-- Every NEW management-surface table you add (units, per-unit notes,
-- tenant/PM message threads, service requests) that carries a rental_id
-- MUST add this PM portal policy so the PM sees ONLY assigned units:
--
--   CREATE POLICY <t>_pm_portal_read ON <t> FOR SELECT
--     USING (pm_assigned_to_rental(rental_id));
--   -- + matching _insert/_update WITH CHECK (pm_assigned_to_rental(rental_id))
--
-- If a table keys on unit_id instead of rental_id, resolve unit_id -> rental_id
-- and extend pm_assigned_to_rental accordingly. Never expose owner financials
-- to the PM; hide sensitive columns behind a view as in 4c/4d.
-- =====================================================================
