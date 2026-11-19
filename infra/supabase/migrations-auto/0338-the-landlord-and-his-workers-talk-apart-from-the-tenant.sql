-- =============================================================================
-- 0338 — the landlord and his workers talk apart from the tenant, and the
--        tenant is told where things are (DR-1598)
-- =============================================================================
-- Darrell, 2026-11-19: "Land lords and owners should be able to see their 1099
-- workers work and texts about the properties when they go... We should be
-- able to see and message each other about the properties however the tenants
-- should only have access to message we send them and what and where certain
-- things are like baseboard heating etc..." Then: "We want the message about
-- the properties to be able to have tenant communications however we also
-- need the separation of the conversation so both/ all options." And: "Only in
-- group chats... one with the tenants being able to see what's happening and
-- another for sensitive information... so 1099 and landlord can discuss and
-- others who we want can be added etc..."
--
-- TRACED (DR-0219). tenant_messages is ONE thread per tenancy, read and
-- written by the tenant, the household, the landlord, a manager with
-- message.tenant and a worker the door enabled (0150). Nothing was ever
-- written there as staff-only, so no existing row is exposed: it is the
-- tenant group chat, and it stays exactly as it is. What did not exist was a
-- place the landlord and his workers could talk that a tenant cannot read.
--
-- 1. THE STAFF CHAT, one per door (rentals.id): a real member list (who added
--    whom, when; who removed whom, when) and its messages. Readers: the
--    instance's owner or admin, always; an active member; never anyone who
--    lives at that door (its tenant or an active household member), even if a
--    row naming them were written by hand. Members are added and removed only
--    through staff_chat_add_member / staff_chat_remove_member, by the owner,
--    an admin, or a manager of that door; the worker a job on the door is
--    assigned to is added by the database itself.
-- 2. WHERE THINGS ARE. property_systems already records each system's
--    location_note ("basement, north wall"). A system the landlord marks
--    share_with_tenant is shown to that door's tenant and household through
--    where_things_are(tenancy): its name, kind and where it is, nothing else
--    of the record (no make, serial, age or cost).
--
-- Additive and idempotent. Nothing existing is rewritten.
-- DEPENDS ON: 0055, 0075, 0150 (tenancy predicates), 0156 (property_systems),
-- 0260 (user_delegated_can_rental).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. Does the caller live at this door? Its tenant, or an active household
--    member of a tenancy on it. SECURITY DEFINER: a predicate over rows the
--    caller may not read.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.user_lives_at_door(p_rental uuid, p_user uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM rentals r
      JOIN rental_tenancies t ON t.instance_id = r.instance_id AND t.rental_ref = r.slug
 LEFT JOIN tenancy_household h ON h.tenancy_id = t.id AND h.active = true
                              AND h.member_user_id = coalesce(p_user, auth.uid())
     WHERE r.id = p_rental
       AND (t.tenant_user_id = coalesce(p_user, auth.uid()) OR h.member_user_id IS NOT NULL)
  )
$$;
REVOKE ALL ON FUNCTION public.user_lives_at_door(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_lives_at_door(uuid, uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 1. The staff chat.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.property_staff_chats (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES public.instances(id) ON DELETE CASCADE,
  rental_id   uuid NOT NULL REFERENCES public.rentals(id) ON DELETE CASCADE,
  created_by  uuid REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS property_staff_chats_door_uniq ON public.property_staff_chats(rental_id);

CREATE TABLE IF NOT EXISTS public.property_staff_chat_members (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id  uuid NOT NULL REFERENCES public.instances(id) ON DELETE CASCADE,
  chat_id      uuid NOT NULL REFERENCES public.property_staff_chats(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users(id),
  display_name text,
  added_by     uuid REFERENCES auth.users(id),
  added_at     timestamptz NOT NULL DEFAULT clock_timestamp(),
  removed_by   uuid REFERENCES auth.users(id),
  removed_at   timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS property_staff_chat_members_active_uniq
  ON public.property_staff_chat_members(chat_id, user_id) WHERE removed_at IS NULL;
CREATE INDEX IF NOT EXISTS property_staff_chat_members_user_idx ON public.property_staff_chat_members(user_id);

CREATE TABLE IF NOT EXISTS public.property_staff_messages (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id    uuid NOT NULL REFERENCES public.instances(id) ON DELETE CASCADE,
  chat_id        uuid NOT NULL REFERENCES public.property_staff_chats(id) ON DELETE CASCADE,
  sender_user_id uuid NOT NULL REFERENCES auth.users(id),
  body           text NOT NULL,
  sent_at        timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX IF NOT EXISTS property_staff_messages_chat_idx ON public.property_staff_messages(chat_id, sent_at);
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'property_staff_messages_body_len') THEN
    ALTER TABLE public.property_staff_messages ADD CONSTRAINT property_staff_messages_body_len
      CHECK (length(btrim(body)) BETWEEN 1 AND 4000);
  END IF;
END $$;

COMMENT ON TABLE public.property_staff_chats IS
  'DR-1598: the staff group chat of one door: landlord, admins, managers and the 1099 workers he adds. Its tenant and household never read it.';

-- May the caller read and write this chat? Owner or admin of its instance, or
-- an active member; and never someone who lives at its door.
CREATE OR REPLACE FUNCTION public.user_in_staff_chat(p_chat uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM property_staff_chats c
     WHERE c.id = p_chat
       AND auth.uid() IS NOT NULL
       AND NOT public.user_lives_at_door(c.rental_id)
       AND (user_role_in_instance(c.instance_id) IN ('owner', 'admin')
            OR EXISTS (SELECT 1 FROM property_staff_chat_members m
                        WHERE m.chat_id = c.id AND m.user_id = auth.uid() AND m.removed_at IS NULL))
  )
$$;
REVOKE ALL ON FUNCTION public.user_in_staff_chat(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_in_staff_chat(uuid) TO authenticated;

-- Who may run a door's chat (add, remove, open it): the owner or an admin of
-- the instance, a member of the family, or a manager of that door.
CREATE OR REPLACE FUNCTION public.user_runs_staff_chat_for(p_rental uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM rentals r WHERE r.id = p_rental
                   AND user_role_in_instance(r.instance_id) IN ('owner', 'admin', 'member'))
      OR public.user_delegated_can_rental(p_rental, 'request.manage')
$$;
REVOKE ALL ON FUNCTION public.user_runs_staff_chat_for(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_runs_staff_chat_for(uuid) TO authenticated;

ALTER TABLE public.property_staff_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_staff_chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_staff_messages ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.property_staff_chats, public.property_staff_chat_members, public.property_staff_messages FROM anon, authenticated;
GRANT SELECT ON public.property_staff_chats, public.property_staff_chat_members TO authenticated;
GRANT SELECT, INSERT ON public.property_staff_messages TO authenticated;

DROP POLICY IF EXISTS property_staff_chats_read ON public.property_staff_chats;
CREATE POLICY property_staff_chats_read ON public.property_staff_chats FOR SELECT TO authenticated
  USING (public.user_in_staff_chat(id));

DROP POLICY IF EXISTS property_staff_chat_members_read ON public.property_staff_chat_members;
CREATE POLICY property_staff_chat_members_read ON public.property_staff_chat_members FOR SELECT TO authenticated
  USING (public.user_in_staff_chat(chat_id));

DROP POLICY IF EXISTS property_staff_messages_read ON public.property_staff_messages;
CREATE POLICY property_staff_messages_read ON public.property_staff_messages FOR SELECT TO authenticated
  USING (public.user_in_staff_chat(chat_id));

DROP POLICY IF EXISTS property_staff_messages_insert ON public.property_staff_messages;
CREATE POLICY property_staff_messages_insert ON public.property_staff_messages FOR INSERT TO authenticated
  WITH CHECK (sender_user_id = auth.uid() AND public.user_in_staff_chat(chat_id));

-- A message's instance is its chat's, never the client's.
CREATE OR REPLACE FUNCTION public.property_staff_messages_scope()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT instance_id INTO NEW.instance_id FROM property_staff_chats WHERE id = NEW.chat_id;
  IF NEW.instance_id IS NULL THEN
    RAISE EXCEPTION 'that chat does not exist' USING ERRCODE = 'foreign_key_violation';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.property_staff_messages_scope() FROM PUBLIC;
DROP TRIGGER IF EXISTS property_staff_messages_scope ON public.property_staff_messages;
CREATE TRIGGER property_staff_messages_scope
  BEFORE INSERT ON public.property_staff_messages
  FOR EACH ROW EXECUTE FUNCTION public.property_staff_messages_scope();

-- The chat of a door, made the first time someone who runs it (or the
-- database, for an assignment) asks. Internal; no grant to authenticated.
CREATE OR REPLACE FUNCTION public.staff_chat_of_door(p_rental uuid, p_by uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_chat uuid; v_inst uuid;
BEGIN
  SELECT id INTO v_chat FROM property_staff_chats WHERE rental_id = p_rental;
  IF v_chat IS NOT NULL THEN RETURN v_chat; END IF;
  SELECT instance_id INTO v_inst FROM rentals WHERE id = p_rental;
  IF v_inst IS NULL THEN RETURN NULL; END IF;
  INSERT INTO property_staff_chats (instance_id, rental_id, created_by)
  VALUES (v_inst, p_rental, p_by)
  ON CONFLICT (rental_id) DO NOTHING;
  SELECT id INTO v_chat FROM property_staff_chats WHERE rental_id = p_rental;
  RETURN v_chat;
END;
$$;
REVOKE ALL ON FUNCTION public.staff_chat_of_door(uuid, uuid) FROM PUBLIC;

-- Add one person. Internal: the two callers below check who may.
CREATE OR REPLACE FUNCTION public.staff_chat_put_member(p_chat uuid, p_user uuid, p_name text, p_by uuid)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE c record;
BEGIN
  SELECT * INTO c FROM property_staff_chats WHERE id = p_chat;
  IF NOT FOUND OR p_user IS NULL THEN RETURN 'no-chat'; END IF;
  IF public.user_lives_at_door(c.rental_id, p_user) THEN RETURN 'lives-here'; END IF;
  IF EXISTS (SELECT 1 FROM property_staff_chat_members
              WHERE chat_id = p_chat AND user_id = p_user AND removed_at IS NULL) THEN
    RETURN 'already';
  END IF;
  INSERT INTO property_staff_chat_members (instance_id, chat_id, user_id, display_name, added_by)
  VALUES (c.instance_id, p_chat, p_user, nullif(btrim(coalesce(p_name, '')), ''), p_by);
  RETURN 'added';
END;
$$;
REVOKE ALL ON FUNCTION public.staff_chat_put_member(uuid, uuid, text, uuid) FROM PUBLIC;

-- Open a door's chat (made on first open). Returns its id, or NULL when the
-- caller may neither run it nor read it.
CREATE OR REPLACE FUNCTION public.open_staff_chat(p_rental uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_chat uuid;
BEGIN
  IF auth.uid() IS NULL OR public.user_lives_at_door(p_rental) THEN RETURN NULL; END IF;
  SELECT id INTO v_chat FROM property_staff_chats WHERE rental_id = p_rental;
  IF v_chat IS NOT NULL AND public.user_in_staff_chat(v_chat) THEN RETURN v_chat; END IF;
  IF NOT public.user_runs_staff_chat_for(p_rental) THEN RETURN NULL; END IF;
  v_chat := public.staff_chat_of_door(p_rental, auth.uid());
  -- A manager (not an owner or admin) reads through membership.
  PERFORM public.staff_chat_put_member(v_chat, auth.uid(), NULL, auth.uid());
  RETURN v_chat;
END;
$$;
REVOKE ALL ON FUNCTION public.open_staff_chat(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.open_staff_chat(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.staff_chat_add_member(p_chat uuid, p_user uuid, p_name text DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_rental uuid;
BEGIN
  SELECT rental_id INTO v_rental FROM property_staff_chats WHERE id = p_chat;
  IF v_rental IS NULL THEN RETURN 'no-chat'; END IF;
  IF NOT public.user_runs_staff_chat_for(v_rental) OR NOT public.user_in_staff_chat(p_chat) THEN
    RAISE EXCEPTION 'only the landlord or a manager of this door adds people to its staff chat'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN public.staff_chat_put_member(p_chat, p_user, p_name, auth.uid());
END;
$$;
REVOKE ALL ON FUNCTION public.staff_chat_add_member(uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.staff_chat_add_member(uuid, uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.staff_chat_remove_member(p_chat uuid, p_user uuid)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_rental uuid; n int;
BEGIN
  SELECT rental_id INTO v_rental FROM property_staff_chats WHERE id = p_chat;
  IF v_rental IS NULL THEN RETURN 'no-chat'; END IF;
  IF NOT public.user_runs_staff_chat_for(v_rental) OR NOT public.user_in_staff_chat(p_chat) THEN
    RAISE EXCEPTION 'only the landlord or a manager of this door removes people from its staff chat'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  UPDATE property_staff_chat_members
     SET removed_at = clock_timestamp(), removed_by = auth.uid()
   WHERE chat_id = p_chat AND user_id = p_user AND removed_at IS NULL;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN CASE WHEN n > 0 THEN 'removed' ELSE 'not-a-member' END;
END;
$$;
REVOKE ALL ON FUNCTION public.staff_chat_remove_member(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.staff_chat_remove_member(uuid, uuid) TO authenticated;

-- The worker a job is assigned to joins that door's staff chat. An
-- assignment never fails because of this: anything unexpected is skipped.
CREATE OR REPLACE FUNCTION public.tenant_maintenance_requests_worker_joins_chat()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_rental uuid; v_chat uuid;
BEGIN
  IF NEW.assigned_to IS NULL OR (TG_OP = 'UPDATE' AND NEW.assigned_to IS NOT DISTINCT FROM OLD.assigned_to) THEN
    RETURN NULL;
  END IF;
  BEGIN
    v_rental := NEW.rental_id;
    IF v_rental IS NULL AND NEW.tenancy_id IS NOT NULL THEN
      SELECT r.id INTO v_rental FROM rental_tenancies t
        JOIN rentals r ON r.instance_id = t.instance_id AND r.slug = t.rental_ref
       WHERE t.id = NEW.tenancy_id;
    END IF;
    IF v_rental IS NULL THEN RETURN NULL; END IF;
    v_chat := public.staff_chat_of_door(v_rental, auth.uid());
    PERFORM public.staff_chat_put_member(v_chat, NEW.assigned_to, NEW.assigned_to_label, auth.uid());
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'worker not added to the staff chat: %', SQLERRM;
  END;
  RETURN NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.tenant_maintenance_requests_worker_joins_chat() FROM PUBLIC;
DROP TRIGGER IF EXISTS tenant_maintenance_requests_worker_joins_chat ON public.tenant_maintenance_requests;
CREATE TRIGGER tenant_maintenance_requests_worker_joins_chat
  AFTER INSERT OR UPDATE OF assigned_to ON public.tenant_maintenance_requests
  FOR EACH ROW EXECUTE FUNCTION public.tenant_maintenance_requests_worker_joins_chat();

-- The workers already assigned an open job join its door's chat now.
DO $$
DECLARE j record; v_rental uuid; v_chat uuid;
BEGIN
  FOR j IN
    SELECT id, rental_id, tenancy_id, assigned_to, assigned_to_label FROM tenant_maintenance_requests
     WHERE assigned_to IS NOT NULL AND status IN ('submitted', 'received', 'scheduled', 'in-progress')
  LOOP
    v_rental := j.rental_id;
    IF v_rental IS NULL AND j.tenancy_id IS NOT NULL THEN
      SELECT r.id INTO v_rental FROM rental_tenancies t
        JOIN rentals r ON r.instance_id = t.instance_id AND r.slug = t.rental_ref
       WHERE t.id = j.tenancy_id;
    END IF;
    IF v_rental IS NOT NULL THEN
      v_chat := public.staff_chat_of_door(v_rental, NULL);
      PERFORM public.staff_chat_put_member(v_chat, j.assigned_to, j.assigned_to_label, NULL);
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Where things are.
-- ---------------------------------------------------------------------------
ALTER TABLE public.property_systems ADD COLUMN IF NOT EXISTS share_with_tenant boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN public.property_systems.share_with_tenant IS
  'DR-1598: shown to the door''s tenant and household as "where things are": its name, kind and location_note only.';

CREATE OR REPLACE FUNCTION public.where_things_are(p_tenancy uuid)
RETURNS TABLE (id uuid, name text, kind text, location_note text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id, s.name, s.kind, s.location_note
    FROM rental_tenancies t
    JOIN rentals r ON r.instance_id = t.instance_id AND r.slug = t.rental_ref
    JOIN property_systems s ON s.rental_ref = r.id AND s.instance_id = t.instance_id
   WHERE t.id = p_tenancy
     AND s.share_with_tenant
     AND s.archived_at IS NULL
     AND (public.user_is_tenant(t.id) OR public.user_is_tenancy_household(t.id)
          OR user_role_in_instance(t.instance_id) IN ('owner', 'admin', 'member'))
   ORDER BY s.name
$$;
REVOKE ALL ON FUNCTION public.where_things_are(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.where_things_are(uuid) TO authenticated;

SELECT public.apply_viewer_readonly_overlay();
SELECT public.apply_assistant_scope_overlay();

NOTIFY pgrst, 'reload schema';
