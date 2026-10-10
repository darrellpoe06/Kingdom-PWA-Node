-- =============================================================================
-- 0260 — WORK IS FILED ON THE DOOR, NOT ONLY ON A TENANCY (DR-0859)
-- =============================================================================
-- Darrell, 2026-10-10, on the Work Board for 805 North Prospect Avenue Apt 2
-- with "Add a microwave and cabinet with exhaust fan inside the kitchen." typed
-- and FILE IT greyed out: "Can't file a workorder in the Poe Properties App?!!!!
-- Fix it!!!!!!" ... "They obviously should be able to!!!!!!!!!!!!!!" ... "Any
-- property including our home... if we want to have a 1099 worker come take
-- care of work... right?!!!!!"
--
-- THE DEFECT. 0055 made tenant_maintenance_requests.tenancy_id NOT NULL, and
-- 0075/0150 did the same for request_documentation and tenancy_notes. A work
-- order could only exist THROUGH a tenancy. The door on the screen reads "No
-- tenancy on this door" (measured: every door on this account carries no
-- rental_tenancies row today), so the app had nothing to file against and the
-- button was disabled. The work that most needs a record — the turn between
-- tenants, the microwave, the ductwork, and every job on the family's own home
-- (2111 Talans Dr, 0156: "a mechanical history of the systems and issues like
-- all our properties") — is exactly the work no tenancy will ever hold.
--
-- THE SHAPE. A row now names its DOOR (rental_id -> rentals.id) and/or its
-- TENANCY. At least one is required. A door-level job is the landlord's record
-- of the property; a tenancy job is still the tenant's request, unchanged.
--
-- WHO SEES A DOOR-LEVEL ROW — the existing policies already carry it for the
-- family (user_role_in_instance(instance_id) is the first arm of every one), and
-- every tenancy arm is FALSE when tenancy_id is NULL, so a tenant, a household
-- member or a tenancy-scoped worker sees NOTHING here. What this file ADDS is the
-- door-level delegate arm 0185 already proved for pictures: a delegated
-- capability whose scope_ref names the door's slug (or '*'), through
-- user_delegated_can_rental(). The new policies are separate permissive
-- policies, so nothing that was true before is loosened.
--
--   * read a door's jobs, notes, documentation : request.manage, property.history, docs.add
--   * FILE a door's job                         : request.manage, docs.add
--   * move a door's job along / assign it       : request.manage
--   * document a job, add a note                : request.manage, docs.add
--
-- WHY A WORKER MAY FILE (Darrell, same morning: "even a person walking through an
-- Airbnb or short-term rental works great for getting work done or issues with
-- systems or cleaning done asap"). The cleaner or the 1099 worker walking a
-- short-stay door between guests is the one who SEES the broken fan or the
-- stained couch. A door offered short-term never has a tenancy at all, so the
-- report has to be filable at the door, by the person standing in it. Filing
-- is not managing: a worker still cannot move, assign or close another's job
-- (no UPDATE arm), and reads only the doors he was granted.
--
-- THE WALLS THAT ARE THE DATABASE'S, NOT THE APP'S:
--   1. A row's door must be in the row's instance. Without this a member of
--      instance B could write a row naming A's door, and A's delegate would read
--      B's words through the door arm. A trigger refuses the mismatch.
--   2. Documentation takes its scope FROM ITS REQUEST. instance_id, tenancy_id
--      and rental_id on a request_documentation row are overwritten from the
--      parent request before the policy is checked, so a worker cannot document
--      a job on one door while naming another to pass the policy.
--   3. "Fixed" closes the job. The app already set the request to resolved after
--      a Fixed documentation, but a 1099 worker holds no UPDATE arm on requests
--      (only management does), so for a worker the second write was refused and
--      the job stayed open. The documentation is the fact; the trigger records
--      what it means, once, and never reopens a closed job.
--
-- IDEMPOTENT: ADD COLUMN IF NOT EXISTS, DROP NOT NULL (repeatable), constraints
-- guarded by pg_constraint, CREATE OR REPLACE functions, DROP/CREATE triggers
-- and policies. ADDITIVE: no row is changed; every existing row already has a
-- tenancy, so the new CHECKs hold on the data that exists.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. The door column, and a tenancy that may be absent.
-- ---------------------------------------------------------------------------
ALTER TABLE public.tenant_maintenance_requests ADD COLUMN IF NOT EXISTS rental_id uuid REFERENCES public.rentals(id) ON DELETE CASCADE;
ALTER TABLE public.tenant_maintenance_requests ALTER COLUMN tenancy_id DROP NOT NULL;
CREATE INDEX IF NOT EXISTS tenant_maintenance_requests_rental_idx ON public.tenant_maintenance_requests(rental_id);

ALTER TABLE public.request_documentation ADD COLUMN IF NOT EXISTS rental_id uuid REFERENCES public.rentals(id) ON DELETE CASCADE;
ALTER TABLE public.request_documentation ALTER COLUMN tenancy_id DROP NOT NULL;
CREATE INDEX IF NOT EXISTS request_documentation_rental_idx ON public.request_documentation(rental_id);

ALTER TABLE public.tenancy_notes ADD COLUMN IF NOT EXISTS rental_id uuid REFERENCES public.rentals(id) ON DELETE CASCADE;
ALTER TABLE public.tenancy_notes ALTER COLUMN tenancy_id DROP NOT NULL;
CREATE INDEX IF NOT EXISTS tenancy_notes_rental_idx ON public.tenancy_notes(rental_id, created_at);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tenant_maintenance_requests_names_a_door') THEN
    ALTER TABLE public.tenant_maintenance_requests ADD CONSTRAINT tenant_maintenance_requests_names_a_door
      CHECK (tenancy_id IS NOT NULL OR rental_id IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'request_documentation_names_a_door') THEN
    ALTER TABLE public.request_documentation ADD CONSTRAINT request_documentation_names_a_door
      CHECK (tenancy_id IS NOT NULL OR rental_id IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tenancy_notes_names_a_door') THEN
    ALTER TABLE public.tenancy_notes ADD CONSTRAINT tenancy_notes_names_a_door
      CHECK (tenancy_id IS NOT NULL OR rental_id IS NOT NULL);
  END IF;
END $$;

COMMENT ON COLUMN public.tenant_maintenance_requests.rental_id IS
  'DR-0859: the DOOR this job is on (rentals.id). A job on a vacant door or on the family''s own home has a door and no tenancy; at least one of the two is required.';
COMMENT ON COLUMN public.request_documentation.rental_id IS
  'DR-0859: copied from the parent request by request_documentation_scope_from_request; never trusted from the client.';
COMMENT ON COLUMN public.tenancy_notes.rental_id IS
  'DR-0859: the door a note is on when no tenancy holds it (a dispatch to a vacant door or the home).';

-- ---------------------------------------------------------------------------
-- 1b. The door-level delegate predicate. 0185 created it with exactly this
--     body; it is restated here (CREATE OR REPLACE, same signature, same
--     return type) so this file stands on its own wherever it is replayed.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.user_delegated_can_rental(p_rental uuid, p_capability text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM rentals r
    JOIN delegated_capabilities dc
      ON dc.instance_id     = r.instance_id
     AND dc.grantee_user_id = auth.uid()
     AND dc.capability      = p_capability
     AND dc.setting         = 'allow'
     AND (dc.scope_ref = r.slug OR dc.scope_ref = '*')
    WHERE r.id = p_rental
  )
$$;
REVOKE ALL ON FUNCTION public.user_delegated_can_rental(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_delegated_can_rental(uuid, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. A row's door must be in the row's instance.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.door_row_in_its_instance()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.rental_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM rentals r WHERE r.id = NEW.rental_id AND r.instance_id = NEW.instance_id
  ) THEN
    RAISE EXCEPTION 'the door named on this row is not in its instance'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.door_row_in_its_instance() FROM PUBLIC;

DROP TRIGGER IF EXISTS tenant_maintenance_requests_door_in_instance ON public.tenant_maintenance_requests;
CREATE TRIGGER tenant_maintenance_requests_door_in_instance
  BEFORE INSERT OR UPDATE OF rental_id, instance_id ON public.tenant_maintenance_requests
  FOR EACH ROW EXECUTE FUNCTION public.door_row_in_its_instance();

DROP TRIGGER IF EXISTS tenancy_notes_door_in_instance ON public.tenancy_notes;
CREATE TRIGGER tenancy_notes_door_in_instance
  BEFORE INSERT ON public.tenancy_notes
  FOR EACH ROW EXECUTE FUNCTION public.door_row_in_its_instance();

-- ---------------------------------------------------------------------------
-- 3. Documentation takes its scope from its request (before RLS checks it).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.request_documentation_scope_from_request()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE req record;
BEGIN
  SELECT instance_id, tenancy_id, rental_id INTO req
    FROM tenant_maintenance_requests WHERE id = NEW.request_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'documentation names a work order that does not exist'
      USING ERRCODE = 'foreign_key_violation';
  END IF;
  NEW.instance_id := req.instance_id;
  NEW.tenancy_id  := req.tenancy_id;
  NEW.rental_id   := req.rental_id;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.request_documentation_scope_from_request() FROM PUBLIC;

DROP TRIGGER IF EXISTS request_documentation_scope ON public.request_documentation;
CREATE TRIGGER request_documentation_scope
  BEFORE INSERT ON public.request_documentation
  FOR EACH ROW EXECUTE FUNCTION public.request_documentation_scope_from_request();

-- ---------------------------------------------------------------------------
-- 4. "Fixed" closes the job, for the worker who cannot update it himself.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.request_documentation_fixed_resolves()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.outcome = 'fixed' THEN
    UPDATE tenant_maintenance_requests
       SET status = 'resolved', updated_at = now()
     WHERE id = NEW.request_id
       AND status NOT IN ('resolved', 'declined', 'cancelled');
  END IF;
  RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION public.request_documentation_fixed_resolves() FROM PUBLIC;

DROP TRIGGER IF EXISTS request_documentation_fixed ON public.request_documentation;
CREATE TRIGGER request_documentation_fixed
  AFTER INSERT ON public.request_documentation
  FOR EACH ROW EXECUTE FUNCTION public.request_documentation_fixed_resolves();

-- ---------------------------------------------------------------------------
-- 5. The door-level delegate arms (additive; the 0150 policies are untouched).
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS tenant_maintenance_requests_door_read ON public.tenant_maintenance_requests;
CREATE POLICY tenant_maintenance_requests_door_read ON public.tenant_maintenance_requests FOR SELECT TO authenticated
  USING (rental_id IS NOT NULL
         AND (user_delegated_can_rental(rental_id, 'request.manage')
              OR user_delegated_can_rental(rental_id, 'property.history')
              OR user_delegated_can_rental(rental_id, 'docs.add')));

DROP POLICY IF EXISTS tenant_maintenance_requests_door_insert ON public.tenant_maintenance_requests;
CREATE POLICY tenant_maintenance_requests_door_insert ON public.tenant_maintenance_requests FOR INSERT TO authenticated
  WITH CHECK (rental_id IS NOT NULL
              AND created_by = auth.uid()
              AND created_by_role IN ('worker', 'manager')
              AND (user_delegated_can_rental(rental_id, 'request.manage')
                   OR user_delegated_can_rental(rental_id, 'docs.add')));

DROP POLICY IF EXISTS tenant_maintenance_requests_door_update ON public.tenant_maintenance_requests;
CREATE POLICY tenant_maintenance_requests_door_update ON public.tenant_maintenance_requests FOR UPDATE TO authenticated
  USING      (rental_id IS NOT NULL AND user_delegated_can_rental(rental_id, 'request.manage'))
  WITH CHECK (rental_id IS NOT NULL AND user_delegated_can_rental(rental_id, 'request.manage'));

DROP POLICY IF EXISTS request_documentation_door_read ON public.request_documentation;
CREATE POLICY request_documentation_door_read ON public.request_documentation FOR SELECT TO authenticated
  USING (rental_id IS NOT NULL
         AND (user_delegated_can_rental(rental_id, 'docs.add')
              OR user_delegated_can_rental(rental_id, 'request.manage')
              OR user_delegated_can_rental(rental_id, 'property.history')));

DROP POLICY IF EXISTS request_documentation_door_insert ON public.request_documentation;
CREATE POLICY request_documentation_door_insert ON public.request_documentation FOR INSERT TO authenticated
  WITH CHECK (rental_id IS NOT NULL
              AND (user_delegated_can_rental(rental_id, 'docs.add')
                   OR user_delegated_can_rental(rental_id, 'request.manage')));

DROP POLICY IF EXISTS tenancy_notes_door_read ON public.tenancy_notes;
CREATE POLICY tenancy_notes_door_read ON public.tenancy_notes FOR SELECT TO authenticated
  USING (rental_id IS NOT NULL
         AND (user_delegated_can_rental(rental_id, 'request.manage')
              OR user_delegated_can_rental(rental_id, 'property.history')
              OR user_delegated_can_rental(rental_id, 'docs.add')));

DROP POLICY IF EXISTS tenancy_notes_door_insert ON public.tenancy_notes;
CREATE POLICY tenancy_notes_door_insert ON public.tenancy_notes FOR INSERT TO authenticated
  WITH CHECK (rental_id IS NOT NULL
              AND (user_delegated_can_rental(rental_id, 'request.manage')
                   OR user_delegated_can_rental(rental_id, 'docs.add')));

-- The overlays re-read every policy set (0153 and 0185 did the same).
SELECT public.apply_viewer_readonly_overlay();
SELECT public.apply_assistant_scope_overlay();

NOTIFY pgrst, 'reload schema';
