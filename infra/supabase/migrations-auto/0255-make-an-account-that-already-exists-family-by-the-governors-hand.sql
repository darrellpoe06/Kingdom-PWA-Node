-- =============================================================================
-- 0255 — Make an account that already exists family (or any space), by the
--        governor's hand (DR-0829)
-- =============================================================================
-- Darrell 2026-10-09, Platform Signups open with a family member's phone-door
-- account listed as a public signup: "Why can't I make Christyn my family with
-- a check box or whatever... the ability to give and do things as admin!"
--
-- WHY THE INVITE ROAD WAS NOT ENOUGH. invite_to_instance (0081/0104/0130) binds
-- an EMAIL STRING to a person through a claim link and a re-confirmation
-- (DR-0187), because knowing an address is not knowing the person. On the
-- signups list the governor is not holding an address: he is pointing at an
-- AUTHENTICATED ACCOUNT by its id, one that already signed in. The two facts
-- DR-0187 wants are both present: an owner/admin wrote the grant for that exact
-- identity, and Supabase has already authenticated that identity. So the grant
-- can be immediate, by the governor's hand, with the same ceiling the role
-- control already enforces (set_member_role, 0130/0131).
--
-- GUARDS (the same family as set_member_role):
--   * caller signed in and owner/admin of the space (user_role_in_instance);
--   * the target is a real account (auth.users), never the caller;
--   * role in admin/member/viewer; never owner; only an OWNER mints admin;
--   * idempotent: already a member at that role -> noop; at another role ->
--     the role is changed (owner rows are never touched);
--   * audit_log on every grant or change (permission-grant / permission-revoke
--     by rank, as set_member_role does).
-- The person's own self-serve space is untouched: nothing is moved or deleted.
-- IDEMPOTENT: CREATE OR REPLACE only.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.add_user_to_instance(
  instance_uuid uuid,
  target_user uuid,
  new_role text DEFAULT 'member',
  display_name_in text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_actor      uuid := auth.uid();
  v_actor_role text;
  v_role       text := lower(trim(coalesce(new_role, 'member')));
  v_target     record;
  v_email      text;
  v_name       text;
  v_new_id     uuid;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'add_user_to_instance: not authenticated';
  END IF;
  IF instance_uuid IS NULL OR target_user IS NULL THEN
    RAISE EXCEPTION 'add_user_to_instance: a space and a person are required';
  END IF;
  IF v_role NOT IN ('admin','member','viewer') THEN
    RAISE EXCEPTION 'add_user_to_instance: role must be admin, member, or viewer';
  END IF;

  v_actor_role := user_role_in_instance(instance_uuid);
  IF v_actor_role IS NULL OR v_actor_role NOT IN ('owner','admin') THEN
    RAISE EXCEPTION 'add_user_to_instance: only an owner/admin of that space can add people to it';
  END IF;
  IF target_user = v_actor THEN
    RAISE EXCEPTION 'add_user_to_instance: you cannot add yourself';
  END IF;
  IF v_role = 'admin' AND v_actor_role <> 'owner' THEN
    RAISE EXCEPTION 'add_user_to_instance: only an owner can grant admin access';
  END IF;

  SELECT lower(coalesce(email, '')) INTO v_email FROM auth.users WHERE id = target_user;
  IF v_email IS NULL THEN
    RAISE EXCEPTION 'add_user_to_instance: that account does not exist';
  END IF;

  v_name := COALESCE(
    NULLIF(left(trim(coalesce(display_name_in, '')), 80), ''),
    NULLIF(split_part(v_email, '@', 1), ''),
    'Member'
  );

  SELECT * INTO v_target
    FROM instance_members
   WHERE instance_id = instance_uuid AND user_id = target_user
   LIMIT 1;

  IF v_target.id IS NOT NULL THEN
    IF v_target.role = 'owner' THEN
      RAISE EXCEPTION 'add_user_to_instance: an owner''s role cannot be changed here';
    END IF;
    IF v_target.role = v_role THEN
      RETURN jsonb_build_object('status', 'noop', 'role', v_role);
    END IF;
    -- Removing admin is an owner's act too, as set_member_role has it.
    IF v_target.role = 'admin' AND v_actor_role <> 'owner' THEN
      RAISE EXCEPTION 'add_user_to_instance: only an owner can remove admin access';
    END IF;
    UPDATE instance_members SET role = v_role WHERE id = v_target.id;
    INSERT INTO audit_log (instance_id, user_id, action, entity_type, entity_id, from_value, to_value, note)
    VALUES (
      instance_uuid, v_actor,
      CASE WHEN (CASE v_role WHEN 'admin' THEN 3 WHEN 'member' THEN 2 ELSE 0 END)
              > (CASE v_target.role WHEN 'admin' THEN 3 WHEN 'member' THEN 2 WHEN 'assistant' THEN 1 WHEN 'viewer' THEN 0 ELSE 2 END)
           THEN 'permission-grant' ELSE 'permission-revoke' END,
      'instance_member', v_target.id,
      jsonb_build_object('role', v_target.role),
      jsonb_build_object('role', v_role),
      'add_user_to_instance'
    );
    RETURN jsonb_build_object('status', 'changed', 'role', v_role);
  END IF;

  INSERT INTO instance_members (instance_id, user_id, role, display_name)
    VALUES (instance_uuid, target_user, v_role, v_name)
    RETURNING id INTO v_new_id;
  INSERT INTO audit_log (instance_id, user_id, action, entity_type, entity_id, from_value, to_value, note)
  VALUES (
    instance_uuid, v_actor, 'permission-grant', 'instance_member', v_new_id,
    NULL, jsonb_build_object('role', v_role, 'display_name', v_name),
    'add_user_to_instance'
  );
  RETURN jsonb_build_object('status', 'added', 'role', v_role);
END;
$$;

REVOKE ALL ON FUNCTION public.add_user_to_instance(uuid, uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.add_user_to_instance(uuid, uuid, text, text) TO authenticated;
