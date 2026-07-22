-- =============================================================================
-- 0115 — user-initiated self-grant for the Governed Support Door (DR-0223)
-- =============================================================================
-- Darrell 2026-07-22: "Build the user-initiated self-grant next." The other half of
-- the consent model (0114 shipped the governor-granted half): a member can open a
-- support specialist's access to THEIR OWN record — "I need help with this, here's
-- access to my record" — WITHOUT a steward in the loop, because it's their own data.
--
-- Same safety envelope as 0114: never PHI (fail-closed allowlist), the grantee must
-- be a capable specialist, scoped + time-boxed, and every read is still logged by
-- support_read. The NEW guard: the caller must actually OWN the record (user_id =
-- caller, in this instance) — you can only open your OWN data, never anyone else's.
--
-- DEPENDS ON: 0114 (support_supportable_table, support_access_grants,
--             member_has_capability, support_read). IDEMPOTENT. Re-runnable.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. support_owns_resource — does check_user OWN this record, in this instance?
--    Only records with a clear owner column are self-grantable; everything else
--    returns false (fail closed) and must go through the governor-granted path.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.support_owns_resource(instance_uuid uuid, resource_type text, resource_id_in uuid, check_user uuid)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE v_owns boolean := false;
BEGIN
  CASE lower(coalesce(resource_type, ''))
    WHEN 'instance_member' THEN
      SELECT EXISTS (SELECT 1 FROM instance_members
                      WHERE id = resource_id_in AND instance_id = instance_uuid AND user_id = check_user)
        INTO v_owns;
    WHEN 'choir_member' THEN
      SELECT EXISTS (SELECT 1 FROM choir_members
                      WHERE id = resource_id_in AND instance_id = instance_uuid AND user_id = check_user)
        INTO v_owns;
    ELSE
      v_owns := false;   -- no clear owner column -> not self-grantable
  END CASE;
  RETURN v_owns;
END;
$$;
GRANT EXECUTE ON FUNCTION public.support_owns_resource(uuid, text, uuid, uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. request_support_access — the USER-initiated grant. The caller opens a
--    specialist's access to THEIR OWN record. consent_source = 'user'.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.request_support_access(
  instance_uuid uuid, grantee uuid, resource_type_in text, resource_id_in uuid,
  reason_in text, minutes_in int DEFAULT 60)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_table text;
  v_mins  int := greatest(1, least(coalesce(minutes_in, 60), 1440));
  v_id    uuid;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'request_support_access: not authenticated';
  END IF;
  IF coalesce(trim(reason_in), '') = '' THEN
    RAISE EXCEPTION 'request_support_access: a short note about the problem is required';
  END IF;

  -- Never PHI (fail closed — same allowlist as the governor path).
  v_table := support_supportable_table(resource_type_in);
  IF v_table IS NULL THEN
    RAISE EXCEPTION 'request_support_access: "%" is not a supportable record', resource_type_in;
  END IF;

  -- The caller must OWN the record — you can only open YOUR OWN data.
  IF NOT support_owns_resource(instance_uuid, resource_type_in, resource_id_in, v_actor) THEN
    RAISE EXCEPTION 'request_support_access: you can only grant access to your own record';
  END IF;

  -- The grantee must be a capable support specialist in this instance.
  IF NOT member_has_capability(instance_uuid, 'support.breakglass', grantee) THEN
    RAISE EXCEPTION 'request_support_access: that person is not a support specialist here';
  END IF;

  INSERT INTO support_access_grants
    (instance_id, grantee_user_id, resource_type, resource_id, reason, consent_source, granted_by, expires_at)
  VALUES
    (instance_uuid, grantee, lower(resource_type_in), resource_id_in, reason_in, 'user', v_actor,
     now() + make_interval(mins => v_mins))
  RETURNING id INTO v_id;

  INSERT INTO audit_log (instance_id, user_id, action, entity_type, entity_id, to_value, note)
  VALUES (instance_uuid, v_actor, 'permission-grant', 'support_access_grant', v_id,
          jsonb_build_object('grantee', grantee, 'resource_type', lower(resource_type_in),
                             'resource_id', resource_id_in, 'reason', reason_in, 'consent', 'user'),
          'request_support_access (user-initiated)');

  RETURN v_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.request_support_access(uuid, uuid, text, uuid, text, int) TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. list_support_specialists — so a member can SEE who the support staff are to
--    pick one. Names only; caller must be a member of the instance.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.list_support_specialists(instance_uuid uuid)
RETURNS TABLE (user_id uuid, display_name text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT im.user_id, im.display_name
    FROM instance_members im
    JOIN role_capabilities rc ON rc.role = im.role AND rc.capability = 'support.breakglass'
   WHERE im.instance_id = instance_uuid
     AND user_in_instance(instance_uuid)
   ORDER BY im.display_name;
$$;
GRANT EXECUTE ON FUNCTION public.list_support_specialists(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. my_supportable_records — the caller's OWN records they can open for help
--    (their membership row + their choir roster row), so the surface lists them
--    instead of making the user paste a raw id.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.my_supportable_records(instance_uuid uuid)
RETURNS TABLE (resource_type text, resource_id uuid, label text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT 'instance_member'::text, im.id, 'My membership (' || coalesce(im.display_name, 'me') || ')'
    FROM instance_members im
   WHERE im.instance_id = instance_uuid AND im.user_id = auth.uid()
  UNION ALL
  SELECT 'choir_member'::text, cm.id, 'My choir roster entry (' || coalesce(cm.display_name, 'me') || ')'
    FROM choir_members cm
   WHERE cm.instance_id = instance_uuid AND cm.user_id = auth.uid();
$$;
GRANT EXECUTE ON FUNCTION public.my_supportable_records(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
