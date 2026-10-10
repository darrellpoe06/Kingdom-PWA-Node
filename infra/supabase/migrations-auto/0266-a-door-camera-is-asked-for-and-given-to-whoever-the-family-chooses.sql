-- =============================================================================
-- 0266 — A DOOR'S CAMERA IS ASKED FOR, AND GIVEN TO WHOEVER THE FAMILY CHOOSES
--        (DR-0904)
-- =============================================================================
-- Darrell, 2026-10-10, in the Cameras tab: "Cameras tab shows no Cameras!!!!!!
-- It allows giving access to who?!!!!!!!!" and then: "I want the camera to be
-- there for users needing to login and request for certain ones... like the
-- porch... we can just give new tenants and 1099 workers.. and Airbnb
-- guests... whoever we want to... make sense?!!!!!"
--
-- WHAT WAS TRUE (DR-0841, 0258): one grant per TENANCY, written on the
-- rental_tenancies row, read only by the tenant and household signed into it.
-- A 1099 worker sent to the door could never be given the porch camera; a
-- short-stay guest had no road at all; nobody could ASK; and nothing recorded
-- who held which camera, since when, or who decided.
--
-- THE SHAPE.
--   1. door_camera_menu — the cameras the family offers on a door, by NAS id
--      and name. Anyone ON the door (signed in as its tenant, household, a
--      delegated worker or manager, or the family) reads the menu; only the
--      family writes it. Offering a camera shows its NAME, never its feed.
--   2. door_camera_access — one row per person per ask or gift:
--        * kind 'request': a signed-in person on the door asks for cameras on
--          the menu, with a reason. Their role on the door is filled by the
--          database, never taken from the client. One open ask per person
--          per door.
--        * kind 'given': the family gives access outright — to a person with
--          an account, or by LINK to someone with none (an Airbnb guest, a
--          worker without the app) — with a name on the row.
--      The family alone decides: requested -> granted | declined; granted ->
--      revoked. A grant carries the NAS grant token (the NAS mints and
--      enforces it, DR-0778); the token is read only by the person it was
--      given to and by the family.
--   3. Every ask, decision and take-back is on record_events (subject
--      'camera') with its own instant.
--
-- IDEMPOTENT + ADDITIVE.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. Who is on a door, and as what.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.door_role_of_user(p_rental uuid)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN coalesce(user_role_in_instance(r.instance_id), '') IN ('owner', 'admin', 'member') THEN 'family'
    WHEN EXISTS (SELECT 1 FROM rental_tenancies t
                  WHERE t.instance_id = r.instance_id AND t.rental_ref = r.slug
                    AND t.status IN ('active', 'pending') AND t.tenant_user_id = auth.uid()) THEN 'tenant'
    WHEN EXISTS (SELECT 1 FROM rental_tenancies t JOIN tenancy_household h ON h.tenancy_id = t.id
                  WHERE t.instance_id = r.instance_id AND t.rental_ref = r.slug
                    AND t.status IN ('active', 'pending') AND h.member_user_id = auth.uid() AND h.active = true) THEN 'household'
    WHEN EXISTS (SELECT 1 FROM delegated_capabilities dc
                  WHERE dc.instance_id = r.instance_id AND dc.grantee_user_id = auth.uid()
                    AND dc.setting = 'allow' AND (dc.scope_ref = r.slug OR dc.scope_ref = '*')
                    AND dc.role_label = 'manager') THEN 'manager'
    WHEN EXISTS (SELECT 1 FROM delegated_capabilities dc
                  WHERE dc.instance_id = r.instance_id AND dc.grantee_user_id = auth.uid()
                    AND dc.setting = 'allow' AND (dc.scope_ref = r.slug OR dc.scope_ref = '*')) THEN 'worker'
    ELSE NULL END
  FROM rentals r WHERE r.id = p_rental AND auth.uid() IS NOT NULL
$$;
REVOKE ALL ON FUNCTION public.door_role_of_user(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.door_role_of_user(uuid) TO authenticated;

-- A tenant or household member cannot read `rentals`, so their screen does
-- not know its door's id. This answers exactly that, for a tenancy the caller
-- is on, and nothing else: the id of its door, or NULL.
CREATE OR REPLACE FUNCTION public.door_of_my_tenancy(p_tenancy uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.id FROM rental_tenancies t
    JOIN rentals r ON r.instance_id = t.instance_id AND r.slug = t.rental_ref
   WHERE t.id = p_tenancy AND door_role_of_user(r.id) IS NOT NULL
$$;
REVOKE ALL ON FUNCTION public.door_of_my_tenancy(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.door_of_my_tenancy(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 1. The menu: what the family offers on a door.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.door_camera_menu (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES public.instances(id) ON DELETE CASCADE,
  rental_id   uuid NOT NULL REFERENCES public.rentals(id) ON DELETE CASCADE,
  camera_id   text NOT NULL CHECK (length(camera_id) BETWEEN 1 AND 120),
  camera_name text NOT NULL CHECK (length(camera_name) BETWEEN 1 AND 120),
  created_by  uuid REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE (rental_id, camera_id)
);
COMMENT ON TABLE public.door_camera_menu IS
  'DR-0904: the cameras the family offers on a door. Read by anyone on the door (names only, never a feed); written by the family.';

DROP TRIGGER IF EXISTS door_camera_menu_door_in_instance ON public.door_camera_menu;
CREATE TRIGGER door_camera_menu_door_in_instance
  BEFORE INSERT OR UPDATE ON public.door_camera_menu
  FOR EACH ROW EXECUTE FUNCTION public.door_row_in_its_instance();

REVOKE ALL ON public.door_camera_menu FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.door_camera_menu TO authenticated;
ALTER TABLE public.door_camera_menu ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS door_camera_menu_read ON public.door_camera_menu;
CREATE POLICY door_camera_menu_read ON public.door_camera_menu FOR SELECT TO authenticated
  USING (door_role_of_user(rental_id) IS NOT NULL);
DROP POLICY IF EXISTS door_camera_menu_write ON public.door_camera_menu;
CREATE POLICY door_camera_menu_write ON public.door_camera_menu FOR ALL TO authenticated
  USING (door_role_of_user(rental_id) = 'family')
  WITH CHECK (door_role_of_user(rental_id) = 'family');

-- ---------------------------------------------------------------------------
-- 2. Asks and gifts.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.door_camera_access (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id       uuid NOT NULL REFERENCES public.instances(id) ON DELETE CASCADE,
  rental_id         uuid NOT NULL REFERENCES public.rentals(id) ON DELETE CASCADE,
  kind              text NOT NULL CHECK (kind IN ('request', 'given')),
  person_user_id    uuid REFERENCES auth.users(id),
  person_role       text NOT NULL CHECK (person_role IN ('tenant', 'household', 'worker', 'manager', 'guest', 'family', 'other')),
  person_label      text NOT NULL CHECK (length(btrim(person_label)) BETWEEN 1 AND 120),
  cameras           text[] NOT NULL CHECK (cardinality(cameras) BETWEEN 1 AND 64),
  camera_names      text[],
  reason            text CHECK (reason IS NULL OR length(reason) <= 500),
  status            text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'granted', 'declined', 'revoked')),
  grant_id          text,
  grant_token       text CHECK (grant_token IS NULL OR grant_token ~ '^g\.[a-f0-9]{12}\.[a-f0-9]{32}$'),
  days              int CHECK (days IS NULL OR days BETWEEN 0 AND 3650),
  expires_on        date,
  decided_by        uuid REFERENCES auth.users(id),
  decided_at        timestamptz,
  decision_note     text CHECK (decision_note IS NULL OR length(decision_note) <= 500),
  created_by        uuid REFERENCES auth.users(id),
  created_at        timestamptz NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT door_camera_access_granted_has_token CHECK ((status = 'granted') = (grant_token IS NOT NULL) OR status = 'revoked'),
  CONSTRAINT door_camera_access_request_has_person CHECK (kind <> 'request' OR person_user_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS door_camera_access_door_idx ON public.door_camera_access(rental_id, created_at);
CREATE INDEX IF NOT EXISTS door_camera_access_person_idx ON public.door_camera_access(person_user_id) WHERE person_user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS door_camera_access_one_open_ask
  ON public.door_camera_access(rental_id, person_user_id) WHERE kind = 'request' AND status = 'requested';
COMMENT ON TABLE public.door_camera_access IS
  'DR-0904: who asked for or was given which cameras on a door, who decided, until when. The NAS grant token is read only by its holder and the family.';

-- Before insert: the door is in the row's instance; an ask is checked against
-- the menu and stamped with the asker's real role; a gift is the family's.
CREATE OR REPLACE FUNCTION public.door_camera_access_on_insert()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_role text; v_names text[]; v_missing int;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM rentals r WHERE r.id = NEW.rental_id AND r.instance_id = NEW.instance_id) THEN
    RAISE EXCEPTION 'the door named on this row is not in its instance' USING ERRCODE = 'check_violation';
  END IF;
  v_role := door_role_of_user(NEW.rental_id);
  NEW.created_by := auth.uid();
  NEW.created_at := clock_timestamp();
  NEW.decided_by := NULL; NEW.decided_at := NULL;
  IF NEW.kind = 'request' THEN
    IF v_role IS NULL THEN
      RAISE EXCEPTION 'only someone signed into this door can ask for its cameras' USING ERRCODE = 'insufficient_privilege';
    END IF;
    NEW.person_user_id := auth.uid();
    NEW.person_role := v_role;
    NEW.status := 'requested';
    NEW.grant_token := NULL; NEW.grant_id := NULL; NEW.expires_on := NULL;
    SELECT count(*) INTO v_missing FROM unnest(NEW.cameras) c
     WHERE NOT EXISTS (SELECT 1 FROM door_camera_menu m WHERE m.rental_id = NEW.rental_id AND m.camera_id = c);
    IF v_missing > 0 THEN
      RAISE EXCEPTION 'only the cameras offered on this door can be asked for' USING ERRCODE = 'check_violation';
    END IF;
  ELSE
    IF coalesce(v_role, '') <> 'family' THEN
      RAISE EXCEPTION 'only the family gives camera access' USING ERRCODE = 'insufficient_privilege';
    END IF;
    IF NEW.status <> 'granted' OR NEW.grant_token IS NULL THEN
      RAISE EXCEPTION 'a gift is written with the grant the NAS minted' USING ERRCODE = 'check_violation';
    END IF;
    NEW.decided_by := auth.uid(); NEW.decided_at := clock_timestamp();
  END IF;
  SELECT array_agg(coalesce(m.camera_name, c) ORDER BY o)
    INTO v_names
    FROM unnest(NEW.cameras) WITH ORDINALITY AS u(c, o)
    LEFT JOIN door_camera_menu m ON m.rental_id = NEW.rental_id AND m.camera_id = u.c;
  NEW.camera_names := coalesce(NEW.camera_names, v_names);
  IF NEW.kind = 'request' THEN NEW.camera_names := v_names; END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.door_camera_access_on_insert() FROM PUBLIC;

DROP TRIGGER IF EXISTS door_camera_access_insert ON public.door_camera_access;
CREATE TRIGGER door_camera_access_insert
  BEFORE INSERT ON public.door_camera_access
  FOR EACH ROW EXECUTE FUNCTION public.door_camera_access_on_insert();

-- Before update: only the family decides, along the allowed moves; who, what
-- door and when-asked never change.
CREATE OR REPLACE FUNCTION public.door_camera_access_on_update()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF coalesce(door_role_of_user(OLD.rental_id), '') <> 'family' THEN
    RAISE EXCEPTION 'only the family decides camera access' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF NEW.instance_id IS DISTINCT FROM OLD.instance_id OR NEW.rental_id IS DISTINCT FROM OLD.rental_id
     OR NEW.kind IS DISTINCT FROM OLD.kind OR NEW.person_user_id IS DISTINCT FROM OLD.person_user_id
     OR NEW.person_role IS DISTINCT FROM OLD.person_role OR NEW.created_at IS DISTINCT FROM OLD.created_at
     OR NEW.created_by IS DISTINCT FROM OLD.created_by OR NEW.reason IS DISTINCT FROM OLD.reason THEN
    RAISE EXCEPTION 'who asked, for which door, and when, never change' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status AND NOT (
       (OLD.status = 'requested' AND NEW.status IN ('granted', 'declined'))
    OR (OLD.status = 'granted' AND NEW.status = 'revoked')) THEN
    RAISE EXCEPTION 'camera access cannot move from % to %', OLD.status, NEW.status USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.status = 'revoked' THEN NEW.grant_token := NULL; END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.decided_by := auth.uid(); NEW.decided_at := clock_timestamp();
  ELSE
    NEW.decided_by := OLD.decided_by; NEW.decided_at := OLD.decided_at;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.door_camera_access_on_update() FROM PUBLIC;

DROP TRIGGER IF EXISTS door_camera_access_update ON public.door_camera_access;
CREATE TRIGGER door_camera_access_update
  BEFORE UPDATE ON public.door_camera_access
  FOR EACH ROW EXECUTE FUNCTION public.door_camera_access_on_update();

REVOKE ALL ON public.door_camera_access FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.door_camera_access TO authenticated;
ALTER TABLE public.door_camera_access ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS door_camera_access_read ON public.door_camera_access;
CREATE POLICY door_camera_access_read ON public.door_camera_access FOR SELECT TO authenticated
  USING (person_user_id = auth.uid() OR door_role_of_user(rental_id) = 'family');
DROP POLICY IF EXISTS door_camera_access_insert ON public.door_camera_access;
CREATE POLICY door_camera_access_insert ON public.door_camera_access FOR INSERT TO authenticated
  WITH CHECK ((kind = 'request' AND person_user_id = auth.uid() AND door_role_of_user(rental_id) IS NOT NULL)
              OR (kind = 'given' AND door_role_of_user(rental_id) = 'family'));
DROP POLICY IF EXISTS door_camera_access_update ON public.door_camera_access;
CREATE POLICY door_camera_access_update ON public.door_camera_access FOR UPDATE TO authenticated
  USING (door_role_of_user(rental_id) = 'family')
  WITH CHECK (door_role_of_user(rental_id) = 'family');
-- No DELETE policy: the ledger of who held which camera is kept.

-- ---------------------------------------------------------------------------
-- 3. The clock covers camera access (record_events, 0262/0263).
-- ---------------------------------------------------------------------------
ALTER TABLE public.record_events DROP CONSTRAINT IF EXISTS record_events_subject_check;
ALTER TABLE public.record_events ADD CONSTRAINT record_events_subject_check
  CHECK (subject IN ('rent', 'work', 'document', 'camera'));
DROP POLICY IF EXISTS record_events_read ON public.record_events;
CREATE POLICY record_events_read ON public.record_events FOR SELECT TO authenticated
  USING (CASE subject
           WHEN 'rent' THEN EXISTS (SELECT 1 FROM rent_records r WHERE r.id = subject_id)
           WHEN 'work' THEN EXISTS (SELECT 1 FROM tenant_maintenance_requests w WHERE w.id = subject_id)
           WHEN 'document' THEN EXISTS (SELECT 1 FROM property_documents d WHERE d.id = subject_id)
           WHEN 'camera' THEN EXISTS (SELECT 1 FROM door_camera_access a WHERE a.id = subject_id)
           ELSE false END);

CREATE OR REPLACE FUNCTION public.record_events_from_camera_access()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO record_events (instance_id, subject, subject_id, event, to_value, detail, by_user)
    VALUES (NEW.instance_id, 'camera', NEW.id, CASE NEW.kind WHEN 'request' THEN 'asked' ELSE 'given' END, NEW.status,
            jsonb_strip_nulls(jsonb_build_object('person', NEW.person_label, 'role', NEW.person_role,
              'cameras', to_jsonb(NEW.camera_names), 'reason', NEW.reason, 'days', NEW.days, 'expires_on', NEW.expires_on,
              'rental_id', NEW.rental_id)),
            auth.uid());
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO record_events (instance_id, subject, subject_id, event, from_value, to_value, detail, by_user)
    VALUES (NEW.instance_id, 'camera', NEW.id, NEW.status, OLD.status, NEW.status,
            jsonb_strip_nulls(jsonb_build_object('person', NEW.person_label, 'cameras', to_jsonb(NEW.camera_names),
              'days', NEW.days, 'expires_on', NEW.expires_on, 'note', NEW.decision_note)),
            auth.uid());
  END IF;
  RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION public.record_events_from_camera_access() FROM PUBLIC;

DROP TRIGGER IF EXISTS door_camera_access_events ON public.door_camera_access;
CREATE TRIGGER door_camera_access_events
  AFTER INSERT OR UPDATE ON public.door_camera_access
  FOR EACH ROW EXECUTE FUNCTION public.record_events_from_camera_access();

-- The two instance-scoped tables join the viewer read-only and assistant
-- overlays, as every table created after 0130/0241 does.
SELECT public.apply_viewer_readonly_overlay();
SELECT public.apply_assistant_scope_overlay();

NOTIFY pgrst, 'reload schema';
