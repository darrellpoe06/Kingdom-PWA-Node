-- =============================================================================
-- 0337 — a 1099 worker reads the job sent to them (DR-1594)
-- =============================================================================
-- Darrell, 2026-11-19: "We add Coreyon as a 1099 worker and he is not getting
-- the work orders!!!!!!!???!!! Isaiah Ramos either!!!!!!? Find and fix it!!!!!!"
--
-- TRACED (DR-0219), four places where a worker the family sent a job to could
-- not read it:
--
--   1. The invite form on a door started with both capability boxes UNCHECKED.
--      An invite sent as it stood carried capabilities '{}', the claim
--      (0150/0151) granted nothing, and every work-order policy (0150 by
--      tenancy, 0260 by door) asks for a grant. The form is fixed in the app;
--      the invites ALREADY written that way are brought up here (section 4).
--   2. Dispatch writes assigned_to, and NO policy read assigned_to. Being sent
--      a job gave the worker nothing on a door he held no grant for.
--      0310 already had user_is_assigned_to_request() for the job's pictures;
--      nothing used it for the job itself. Sections 1 and 2.
--   3. A job sent by NAME before the worker had signed in carries
--      assigned_to_label only, and nothing ever filled in assigned_to when he
--      did. Section 3.
--   4. A worker has no way to read the door a job is on when he holds no grant
--      there, so a list of his jobs could not say where to go. Section 2b.
--
-- SECURITY. Every arm added here keys on assigned_to = auth.uid(): the worker
-- the family assigned the job to, and nobody else. Nothing a worker could read
-- before is narrowed; nothing a tenant, household member, manager or stranger
-- reads changes. A worker still has no UPDATE arm on a job ("fixed" closes it
-- through 0260's request_documentation_fixed_resolves, as before). The 0306
-- tenant window is RESTRICTIVE and stays in force over the new arms.
--
-- No existing function is redefined; this file only adds. Every function it
-- adds is new, so no earlier replay chain has to change to stay current.
--
-- IDEMPOTENT: DROP POLICY IF EXISTS / CREATE OR REPLACE / DROP TRIGGER IF
-- EXISTS; the backfill touches only rows still in the state it repairs.
-- DEPENDS ON: 0150, 0151, 0260, 0262 (door_events), 0310
-- (user_is_assigned_to_request).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. The worker a job is assigned to reads it, and reads and adds its
--    documentation (photos, outcome, follow-up). Additive policies only.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS tenant_maintenance_requests_assigned_read ON public.tenant_maintenance_requests;
CREATE POLICY tenant_maintenance_requests_assigned_read ON public.tenant_maintenance_requests
  FOR SELECT TO authenticated
  USING (assigned_to IS NOT NULL AND assigned_to = auth.uid());

DROP POLICY IF EXISTS request_documentation_assigned_read ON public.request_documentation;
CREATE POLICY request_documentation_assigned_read ON public.request_documentation
  FOR SELECT TO authenticated
  USING (public.user_is_assigned_to_request(request_id));

-- The note is his own (author_user_id is himself) and on a job he was given.
-- Its instance, tenancy and door are copied from the job by 0260's trigger
-- before this check runs, so he cannot file it anywhere else.
DROP POLICY IF EXISTS request_documentation_assigned_insert ON public.request_documentation;
CREATE POLICY request_documentation_assigned_insert ON public.request_documentation
  FOR INSERT TO authenticated
  WITH CHECK (author_user_id = auth.uid()
              AND public.user_is_assigned_to_request(request_id));

-- ---------------------------------------------------------------------------
-- 2b. The worker's own job list, across every door, with WHERE each job is.
--     Column-explicit on purpose: the door's label and street address and
--     nothing else of the rental (no rent, no owner figures), and only for
--     jobs assigned to the caller.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.my_assigned_work_orders()
RETURNS TABLE (
  id uuid, instance_id uuid, tenancy_id uuid, rental_id uuid,
  title text, detail text, area text, priority text, status text,
  proof_required text, assigned_to_label text,
  created_at timestamptz, updated_at timestamptz,
  door_label text, unit_label text, address text, city text, state text, zip text
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.id, r.instance_id, r.tenancy_id, coalesce(r.rental_id, rt.id),
         r.title, r.detail, r.area, r.priority, r.status,
         r.proof_required, r.assigned_to_label,
         r.created_at, r.updated_at,
         coalesce(t.property_label, rt.display_name, rt.address), t.unit_label,
         rt.address, rt.city, rt.state, rt.zip
    FROM tenant_maintenance_requests r
    LEFT JOIN rental_tenancies t ON t.id = r.tenancy_id
    LEFT JOIN rentals rt
      ON rt.id = r.rental_id
      OR (r.rental_id IS NULL AND rt.instance_id = r.instance_id AND rt.slug = t.rental_ref)
   WHERE auth.uid() IS NOT NULL
     AND r.assigned_to = auth.uid()
   ORDER BY r.created_at DESC
$$;
REVOKE ALL ON FUNCTION public.my_assigned_work_orders() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.my_assigned_work_orders() TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. A job sent by name before the worker signed in becomes HIS when he does.
--
--    Matched within the invite's own instance, on the name the family invited
--    him under (trimmed, case-insensitive), only on an open job with no
--    account on it yet. When two different people in that instance were
--    invited under the same name, nothing is matched: a guess would hand one
--    man's job to the other. The door_events trigger (0262) records each
--    assignment on the job's timeline, to the instant.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.assign_named_jobs_to_worker(p_invite uuid)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv   record;
  nm    text;
  same  int;
  n     int := 0;
BEGIN
  SELECT * INTO inv FROM property_access_invites WHERE id = p_invite;
  IF NOT FOUND OR inv.revoked OR inv.claimed_by IS NULL OR inv.role_label <> 'field_worker' THEN
    RETURN 0;
  END IF;
  nm := lower(btrim(coalesce(inv.display_name, '')));
  IF nm = '' THEN RETURN 0; END IF;

  SELECT count(DISTINCT coalesce(i.claimed_by::text, lower(i.email))) INTO same
    FROM property_access_invites i
   WHERE i.instance_id = inv.instance_id
     AND i.role_label = 'field_worker'
     AND i.revoked = false
     AND lower(btrim(coalesce(i.display_name, ''))) = nm;
  IF same <> 1 THEN RETURN 0; END IF;

  UPDATE tenant_maintenance_requests
     SET assigned_to = inv.claimed_by
   WHERE instance_id = inv.instance_id
     AND assigned_to IS NULL
     AND lower(btrim(coalesce(assigned_to_label, ''))) = nm
     AND status IN ('submitted', 'received', 'scheduled', 'in-progress');
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;
REVOKE ALL ON FUNCTION public.assign_named_jobs_to_worker(uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.property_access_invites_claim_assigns()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.claimed_by IS NOT NULL
     AND NEW.claimed_by IS DISTINCT FROM OLD.claimed_by
     AND NEW.role_label = 'field_worker'
     AND NOT NEW.revoked THEN
    PERFORM public.assign_named_jobs_to_worker(NEW.id);
  END IF;
  RETURN NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.property_access_invites_claim_assigns() FROM PUBLIC;

DROP TRIGGER IF EXISTS property_access_invites_claim_assigns ON public.property_access_invites;
CREATE TRIGGER property_access_invites_claim_assigns
  AFTER UPDATE OF claimed_by ON public.property_access_invites
  FOR EACH ROW EXECUTE FUNCTION public.property_access_invites_claim_assigns();

-- ---------------------------------------------------------------------------
-- 4. The invitations already written. Darrell's direction, 2026-11-19, for the
--    1099 workers he invited: they get the field worker's whole ceiling
--    (property.history, docs.add), not nothing.
--
--    Touched: field_worker invites that are NOT revoked and carry no
--    capability. Their capabilities become the ceiling, and a worker who has
--    already claimed one is granted the ceiling on the invite's scope (else
--    every door, '*'), exactly as the claim would have. A grant row that
--    already exists is left as it is, so a deliberate 'deny' stays a deny.
--    Not touched: revoked invites, every other role, any capability outside
--    the field worker's ceiling.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  inv record;
  cap text;
BEGIN
  FOR inv IN
    SELECT * FROM property_access_invites
     WHERE role_label = 'field_worker'
       AND revoked = false
       AND coalesce(cardinality(capabilities), 0) = 0
  LOOP
    IF inv.claimed_by IS NOT NULL THEN
      FOREACH cap IN ARRAY ARRAY['property.history', 'docs.add'] LOOP
        INSERT INTO delegated_capabilities
          (instance_id, grantee_user_id, scope_ref, capability, setting, granted_by, role_label)
        VALUES
          (inv.instance_id, inv.claimed_by, coalesce(inv.scope_ref, '*'), cap, 'allow', inv.invited_by, 'field_worker')
        ON CONFLICT (instance_id, grantee_user_id, scope_ref, capability) DO NOTHING;
      END LOOP;
    END IF;
    UPDATE property_access_invites
       SET capabilities = ARRAY['property.history', 'docs.add']
     WHERE id = inv.id;
  END LOOP;
END $$;

-- And every worker who has already signed in is given the jobs sent to his
-- name before he did (section 3's rule, for the claims made before it).
DO $$
DECLARE
  inv record;
BEGIN
  FOR inv IN
    SELECT id FROM property_access_invites
     WHERE role_label = 'field_worker' AND revoked = false AND claimed_by IS NOT NULL
  LOOP
    PERFORM public.assign_named_jobs_to_worker(inv.id);
  END LOOP;
END $$;

-- The overlays re-read every policy set (0260 and 0310 did the same).
SELECT public.apply_viewer_readonly_overlay();
SELECT public.apply_assistant_scope_overlay();

NOTIFY pgrst, 'reload schema';
