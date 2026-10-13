-- =============================================================================
-- 0111 — set_member_role + list_instance_members (DR-0220 Phase 3)
-- =============================================================================
-- Darrell 2026-07-21 (with two screenshots — the Choir Roster and Admin -> Role &
-- stewards): "I want to be able to control access roles here and other obvious
-- places inside the PoeTech App... Inside the Love Corner App also."
--
-- THE GAP: roles are only ever SET at creation (join_*/invite RPCs). There is no
-- instance_members UPDATE policy and no role-change RPC anywhere, so an owner/admin
-- cannot promote/demote an existing member, and the Admin "Role & stewards" tab can
-- only READ the caller's own role. This adds the missing primitive — one function
-- that powers every "obvious place" (Choir Roster, Admin console, Bus Ministry, the
-- COLG/Love Corner church instance) because they all ride instance_members.role.
--
-- BRIGHT LINES (the guards, all enforced INSIDE the SECURITY DEFINER function):
--   * NEVER grants 'owner'. new_role is capped at admin/member/viewer. Owners are
--     the founder-bootstrap set (join_*_instance allowlist) and are UNTOUCHABLE via
--     this control — a target whose current role is 'owner' is rejected — so no
--     lockout is possible.
--   * Only an OWNER may create or revoke an 'admin'. An admin can only move people
--     between member<->viewer. Prevents admin-sprawl + self-escalation.
--   * NO self-change (caller cannot edit their own role).
--   * Caller must be owner/admin of the instance; target must already be a member.
--   * Every change writes an audit_log row (CAGE: permission-grant/permission-revoke
--     with from/to role), so who-changed-whom is on the record.
--
-- Isolation-tested (tests/0111-role-control-smoke.sql, CI role-control-isolation.yml)
-- before any surface trusts it (DR-0076): a member can't self-promote, an admin
-- can't mint an admin, owners are untouchable, no self-change, no cross-instance.
--
-- DEPENDS ON: schema-v2.1-infra.sql (instance_members, user_role_in_instance,
--             audit_log). IDEMPOTENT: CREATE OR REPLACE. Safe to re-run.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. set_member_role(instance, target_user, new_role) — the guarded role change.
--    Returns jsonb { status, role } — status 'changed' | 'noop' (already that role).
--    Rejections RAISE (the client surfaces the message).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_member_role(instance_uuid uuid, target_user uuid, new_role text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_actor      uuid := auth.uid();
  v_actor_role text;
  v_role       text := lower(trim(coalesce(new_role, '')));
  v_target     record;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'set_member_role: not authenticated';
  END IF;
  -- Never 'owner' by this control (matches "never owner by invite"); only the
  -- three grantable roles pass. specialist/child/successor/assistant have their
  -- own provisioning paths and are not set here.
  IF v_role NOT IN ('admin','member','viewer') THEN
    RAISE EXCEPTION 'set_member_role: role must be admin, member, or viewer';
  END IF;

  v_actor_role := user_role_in_instance(instance_uuid);
  IF v_actor_role NOT IN ('owner','admin') THEN
    RAISE EXCEPTION 'set_member_role: only an owner/admin can change roles';
  END IF;

  IF target_user = v_actor THEN
    RAISE EXCEPTION 'set_member_role: you cannot change your own role';
  END IF;

  SELECT * INTO v_target
    FROM instance_members
   WHERE instance_id = instance_uuid AND user_id = target_user
   LIMIT 1;
  IF v_target.id IS NULL THEN
    RAISE EXCEPTION 'set_member_role: that person is not a member of this space';
  END IF;

  -- Owners are untouchable via this control (no demote, no lockout).
  IF v_target.role = 'owner' THEN
    RAISE EXCEPTION 'set_member_role: an owner''s role cannot be changed here';
  END IF;

  -- Only an OWNER may create or revoke an admin.
  IF (v_role = 'admin' OR v_target.role = 'admin') AND v_actor_role <> 'owner' THEN
    RAISE EXCEPTION 'set_member_role: only an owner can grant or remove admin access';
  END IF;

  IF v_target.role = v_role THEN
    RETURN jsonb_build_object('status', 'noop', 'role', v_role);
  END IF;

  UPDATE instance_members SET role = v_role WHERE id = v_target.id;

  -- Record it (CAGE). Rank privilege to label grant vs revoke.
  INSERT INTO audit_log (instance_id, user_id, action, entity_type, entity_id, from_value, to_value, note)
  VALUES (
    instance_uuid, v_actor,
    CASE WHEN (CASE v_role WHEN 'admin' THEN 2 WHEN 'member' THEN 1 ELSE 0 END)
            > (CASE v_target.role WHEN 'admin' THEN 2 WHEN 'member' THEN 1 WHEN 'viewer' THEN 0 ELSE 1 END)
         THEN 'permission-grant' ELSE 'permission-revoke' END,
    'instance_member', v_target.id,
    jsonb_build_object('role', v_target.role),
    jsonb_build_object('role', v_role),
    'set_member_role'
  );

  RETURN jsonb_build_object('status', 'changed', 'role', v_role);
END;
$$;
GRANT EXECUTE ON FUNCTION public.set_member_role(uuid, uuid, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. list_instance_members(instance) — owner/admin only. The real member list the
--    Admin "Role & stewards" tab + the Choir roster read to show a control panel.
--    Returns user_id, display_name, email, role (email helps identify the person;
--    owner/admin seeing their own instance's member emails is expected).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.list_instance_members(instance_uuid uuid)
RETURNS TABLE (user_id uuid, display_name text, email text, role text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT im.user_id, im.display_name, u.email::text, im.role
    FROM instance_members im
    LEFT JOIN auth.users u ON u.id = im.user_id
   WHERE im.instance_id = instance_uuid
     AND user_role_in_instance(instance_uuid) IN ('owner','admin')
   ORDER BY
     CASE im.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 WHEN 'member' THEN 2 ELSE 3 END,
     im.display_name;
$$;
GRANT EXECUTE ON FUNCTION public.list_instance_members(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
