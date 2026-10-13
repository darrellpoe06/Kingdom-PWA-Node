-- =============================================================================
-- 0131 — drop the stale role CHECK twin + NULL-safe every privilege guard
-- =============================================================================
-- Post-incident (2026-08-04): the first FULL run of the rls-isolation matrix
-- after 0130 landed went red on 5 of 9 legs, and every failure traced to one
-- of TWO pre-existing production defects the live smokes exposed (the matrix
-- doing exactly its job — DR-0076 proven-to-catch, for real, against prod):
--
--   1. STALE CONSTRAINT TWIN. public.instance_members carries BOTH
--      instance_members_role_check (the canonical 8-role list, 0100) AND the
--      pre-rename tenant_members_role_check (owner/admin/member/viewer ONLY,
--      from schema-v1 when the table was tenant_members). 0055/0082/0100 all
--      dropped by the NEW name, so the old twin survived every swap — and
--      because CHECKs AND together, NO child / successor / specialist /
--      assistant membership row has EVER been insertable on production. The
--      0082/0100 books-wall smokes could never have passed live, and 0130's
--      assistant grant (confirm_invite -> INSERT role 'assistant') would fail
--      today. Measured live before this fix:
--        tenant_members_role_check CHECK (role = ANY (ARRAY['owner','admin',
--        'member','viewer']))  -- alongside the canonical 8-role check.
--
--   2. NULL-BLIND PRIVILEGE GUARDS. user_role_in_instance() returns NULL for
--      a NON-member (correct for RLS policies, where NULL = excluded). But in
--      plpgsql,  IF v_role NOT IN ('owner','admin') THEN RAISE  evaluates
--      NULL NOT IN (...) -> NULL -> false -> THE RAISE NEVER FIRES: a signed-
--      in OUTSIDER (no membership row at all) walks past the guard. The
--      matrix proved it live: an outsider changed a role (0111 smoke), minted
--      a choir claim code (0110 smoke). Same class in the support door,
--      child provisioning, and the showcase steward RPCs. 0126 already wrote
--      the guard NULL-safe (IS NULL OR ...) — and its leg is exactly the one
--      that PASSED. This migration re-declares every NULL-blind guard in the
--      0126 shape. The fix is at the CALL SITES on purpose: making
--      user_role_in_instance() return a non-NULL sentinel would flip every
--      NOT-IN RLS policy (the books walls) OPEN for outsiders.
--
-- Bodies are byte-faithful to their latest landed versions (0130, 0114, 0110,
-- 0094, 0092, 0057); ONLY the guard lines change. Recurrence is gated by
-- app/src/__tests__/nullsafe-role-guards.test.js (scans every migration for
-- the NULL-blind pattern). Forward-only (DR-0011); idempotent throughout.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Drop the stale pre-rename constraint twins. The canonical checks remain
--    the one gate each:
--      * instance_members_role_check (8 roles, 0100) — the twin blocked EVERY
--        child/successor/specialist/assistant membership insert.
--      * instances_instance_type_check (13 types) — the twin (6 types, from
--        schema-v1's tenants table) blocked every newer instance type
--        (landlord, law-practice, mentor, trades, media-org, trust,
--        holding-company), measured live 2026-08-04. Same class: the widening
--        migrations dropped by the NEW name only.
--    (Other tenant%-named checks live on genuinely tenant-named renter-portal
--    tables — real names, not rename leftovers; untouched.)
-- ---------------------------------------------------------------------------
ALTER TABLE public.instance_members DROP CONSTRAINT IF EXISTS tenant_members_role_check;
ALTER TABLE public.instances DROP CONSTRAINT IF EXISTS tenants_tenant_type_check;

-- ---------------------------------------------------------------------------
-- 2. set_member_role — NULL-safe actor guard + NULL-safe only-owner-touches-
--    admin guard. Body otherwise byte-faithful to 0130.
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
  IF v_role NOT IN ('admin','member','viewer','assistant') THEN
    RAISE EXCEPTION 'set_member_role: role must be admin, member, viewer, or assistant';
  END IF;

  -- NULL-safe: an outsider (no membership row) must hit the RAISE, not slip
  -- past it on NULL NOT IN (the 0131 class fix).
  v_actor_role := user_role_in_instance(instance_uuid);
  IF v_actor_role IS NULL OR v_actor_role NOT IN ('owner','admin') THEN
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

  -- Only an OWNER may create or revoke an admin (IS DISTINCT FROM: NULL-safe).
  IF (v_role = 'admin' OR v_target.role = 'admin') AND v_actor_role IS DISTINCT FROM 'owner' THEN
    RAISE EXCEPTION 'set_member_role: only an owner can grant or remove admin access';
  END IF;

  IF v_target.role = v_role THEN
    RETURN jsonb_build_object('status', 'noop', 'role', v_role);
  END IF;

  UPDATE instance_members SET role = v_role WHERE id = v_target.id;

  INSERT INTO audit_log (instance_id, user_id, action, entity_type, entity_id, from_value, to_value, note)
  VALUES (
    instance_uuid, v_actor,
    CASE WHEN (CASE v_role WHEN 'admin' THEN 3 WHEN 'member' THEN 2 WHEN 'assistant' THEN 1 ELSE 0 END)
            > (CASE v_target.role WHEN 'admin' THEN 3 WHEN 'member' THEN 2 WHEN 'assistant' THEN 1 WHEN 'viewer' THEN 0 ELSE 2 END)
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
-- 3. remove_instance_member — same two guards hardened; body faithful to 0130.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.remove_instance_member(instance_uuid uuid, target_user uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_actor      uuid := auth.uid();
  v_actor_role text;
  v_target     record;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'remove_instance_member: not authenticated';
  END IF;

  v_actor_role := user_role_in_instance(instance_uuid);
  IF v_actor_role IS NULL OR v_actor_role NOT IN ('owner','admin') THEN
    RAISE EXCEPTION 'remove_instance_member: only an owner/admin can remove a member';
  END IF;

  IF target_user = v_actor THEN
    RAISE EXCEPTION 'remove_instance_member: you cannot remove yourself';
  END IF;

  SELECT * INTO v_target
    FROM instance_members
   WHERE instance_id = instance_uuid AND user_id = target_user
   LIMIT 1;
  IF v_target.id IS NULL THEN
    RETURN jsonb_build_object('status', 'noop');
  END IF;

  IF v_target.role = 'owner' THEN
    RAISE EXCEPTION 'remove_instance_member: an owner cannot be removed';
  END IF;
  IF v_target.role = 'admin' AND v_actor_role IS DISTINCT FROM 'owner' THEN
    RAISE EXCEPTION 'remove_instance_member: only an owner can remove an admin';
  END IF;

  DELETE FROM instance_members WHERE id = v_target.id;

  INSERT INTO audit_log (instance_id, user_id, action, entity_type, entity_id, from_value, to_value, note)
  VALUES (
    instance_uuid, v_actor, 'permission-revoke',
    'instance_member', v_target.id,
    jsonb_build_object('role', v_target.role),
    jsonb_build_object('role', null),
    'remove_instance_member'
  );

  RETURN jsonb_build_object('status', 'removed', 'role', v_target.role);
END;
$$;
GRANT EXECUTE ON FUNCTION public.remove_instance_member(uuid, uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. mint_choir_claim_code — NULL-safe director guard; body faithful to 0110.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.mint_choir_claim_code(member_id_in uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id  uuid := auth.uid();
  v_member   record;
  v_code     text;
  v_expires  timestamptz := now() + interval '30 days';
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'mint_choir_claim_code: not authenticated';
  END IF;

  SELECT * INTO v_member FROM choir_members WHERE id = member_id_in;
  IF v_member.id IS NULL THEN
    RAISE EXCEPTION 'mint_choir_claim_code: no such roster member';
  END IF;

  -- Only an owner/admin of the roster's instance may issue a code (NULL-safe).
  IF coalesce(user_role_in_instance(v_member.instance_id), '') NOT IN ('owner','admin') THEN
    RAISE EXCEPTION 'mint_choir_claim_code: only a choir director (owner/admin) can issue a claim code';
  END IF;

  -- A code is for linking an as-yet-unlinked person; never for an already-claimed row.
  IF v_member.user_id IS NOT NULL THEN
    RAISE EXCEPTION 'mint_choir_claim_code: this roster member is already linked to an account';
  END IF;

  v_code := gen_choir_claim_code();
  UPDATE choir_members
     SET claim_code = v_code, claim_expires = v_expires
   WHERE id = member_id_in;

  RETURN jsonb_build_object('code', v_code, 'expires_at', v_expires, 'display_name', v_member.display_name);
END;
$$;
GRANT EXECUTE ON FUNCTION public.mint_choir_claim_code(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 5. grant_support_access — NULL-safe governor guard; body faithful to 0114.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.grant_support_access(
  instance_uuid uuid, grantee uuid, resource_type_in text, resource_id_in uuid,
  reason_in text, minutes_in int DEFAULT 60)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_actor      uuid := auth.uid();
  v_actor_role text;
  v_table      text;
  v_mins       int := greatest(1, least(coalesce(minutes_in, 60), 1440));  -- 1 min .. 24 h
  v_id         uuid;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'grant_support_access: not authenticated';
  END IF;
  IF coalesce(trim(reason_in), '') = '' THEN
    RAISE EXCEPTION 'grant_support_access: a reason is required (every grant is on the record)';
  END IF;

  -- CLINICAL/PHI + unknown is NEVER grantable (fail closed).
  v_table := support_supportable_table(resource_type_in);
  IF v_table IS NULL THEN
    RAISE EXCEPTION 'grant_support_access: "%" is not a supportable resource — clinical/PHI is never break-glass-able', resource_type_in;
  END IF;

  -- Only an owner/admin of the instance may grant (governor-granted, audited;
  -- NULL-safe — an outsider must hit the RAISE).
  v_actor_role := user_role_in_instance(instance_uuid);
  IF v_actor_role IS NULL OR v_actor_role NOT IN ('owner','admin') THEN
    RAISE EXCEPTION 'grant_support_access: only an owner/admin can grant support access';
  END IF;

  -- The grantee must hold the support.breakglass capability (a Dev/Ops Specialist).
  IF NOT member_has_capability(instance_uuid, 'support.breakglass', grantee) THEN
    RAISE EXCEPTION 'grant_support_access: the grantee does not have support break-glass capability';
  END IF;

  INSERT INTO support_access_grants
    (instance_id, grantee_user_id, resource_type, resource_id, reason, consent_source, granted_by, expires_at)
  VALUES
    (instance_uuid, grantee, lower(resource_type_in), resource_id_in, reason_in, 'governor', v_actor,
     now() + make_interval(mins => v_mins))
  RETURNING id INTO v_id;

  INSERT INTO audit_log (instance_id, user_id, action, entity_type, entity_id, to_value, note)
  VALUES (instance_uuid, v_actor, 'permission-grant', 'support_access_grant', v_id,
          jsonb_build_object('grantee', grantee, 'resource_type', lower(resource_type_in),
                             'resource_id', resource_id_in, 'reason', reason_in, 'expires_minutes', v_mins),
          'grant_support_access');

  RETURN v_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.grant_support_access(uuid, uuid, text, uuid, text, int) TO authenticated;

-- ---------------------------------------------------------------------------
-- 6. provision_child_member — NULL-safe guardian guard; body faithful to 0057.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.provision_child_member(
  p_instance      uuid,
  p_persona       text,
  p_display_name  text,
  p_minor_tier    text DEFAULT 'under13',
  p_child_user_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_profile_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '28000';
  END IF;
  -- Only a guardian (owner/admin) of THIS instance may provision a child (NULL-safe).
  IF coalesce(user_role_in_instance(p_instance), '') NOT IN ('owner','admin') THEN
    RAISE EXCEPTION 'only a guardian (owner/admin) may provision a child' USING ERRCODE = '42501';
  END IF;
  IF p_minor_tier NOT IN ('under13','teen','adult') THEN
    RAISE EXCEPTION 'invalid minor_tier %', p_minor_tier USING ERRCODE = '22023';
  END IF;

  IF p_child_user_id IS NOT NULL THEN
    INSERT INTO instance_members (instance_id, user_id, role, display_name)
      VALUES (p_instance, p_child_user_id, 'child', COALESCE(NULLIF(btrim(p_display_name), ''), p_persona))
      ON CONFLICT (instance_id, user_id) DO UPDATE
        SET role = 'child', display_name = EXCLUDED.display_name;
  END IF;

  INSERT INTO family_member_profiles
    (instance_id, member_user_id, member_persona, display_name, minor_tier, guardian_user_id, created_by)
    VALUES (p_instance, p_child_user_id, p_persona,
            COALESCE(NULLIF(btrim(p_display_name), ''), p_persona), p_minor_tier, v_uid, v_uid)
  ON CONFLICT (instance_id, member_persona) DO UPDATE
    SET member_user_id   = COALESCE(EXCLUDED.member_user_id, family_member_profiles.member_user_id),
        display_name     = EXCLUDED.display_name,
        minor_tier       = EXCLUDED.minor_tier,
        guardian_user_id = EXCLUDED.guardian_user_id,
        updated_at       = now()
  RETURNING id INTO v_profile_id;

  RETURN v_profile_id;
END;
$$;
REVOKE ALL ON FUNCTION public.provision_child_member(uuid,text,text,text,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.provision_child_member(uuid,text,text,text,uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 7. The showcase steward RPCs — NULL-safe steward guards; bodies faithful to
--    their latest versions (add/update: 0094; pin/delete: 0092).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.add_showcase_piece(p_instance_slug text, p_slug text, p_title text, p_description text, p_product_type text, p_image_path text, p_price_cents integer DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_inst uuid; v_role text; v_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT id INTO v_inst FROM instances WHERE slug = p_instance_slug;
  SELECT im.role INTO v_role FROM instance_members im WHERE im.instance_id = v_inst AND im.user_id = auth.uid();
  IF v_role IS NULL OR v_role NOT IN ('owner','admin','member') THEN RAISE EXCEPTION 'not a steward of this business'; END IF;
  INSERT INTO showcase_pieces (instance_id, created_by, slug, title, description, product_type, image_path, price_cents)
  VALUES (v_inst, auth.uid(), p_slug, trim(coalesce(p_title,'')), p_description, coalesce(p_product_type,'other'), p_image_path, p_price_cents)
  ON CONFLICT (instance_id, slug) DO NOTHING
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.update_showcase_piece(p_instance_slug text, p_slug text, p_title text, p_description text, p_price_cents integer)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_inst uuid; v_role text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT id INTO v_inst FROM instances WHERE slug = p_instance_slug;
  SELECT im.role INTO v_role FROM instance_members im WHERE im.instance_id = v_inst AND im.user_id = auth.uid();
  IF v_role IS NULL OR v_role NOT IN ('owner','admin','member') THEN RAISE EXCEPTION 'not a steward of this business'; END IF;
  UPDATE showcase_pieces
     SET title = trim(coalesce(p_title,'')), description = p_description,
         price_cents = p_price_cents, updated_at = now()
   WHERE instance_id = v_inst AND slug = p_slug;
  RETURN FOUND;
END $$;

CREATE OR REPLACE FUNCTION public.set_showcase_pin(p_instance_slug text, p_slug text, p_pinned boolean)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_inst uuid; v_role text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT id INTO v_inst FROM instances WHERE slug = p_instance_slug;
  SELECT im.role INTO v_role FROM instance_members im WHERE im.instance_id = v_inst AND im.user_id = auth.uid();
  IF v_role IS NULL OR v_role NOT IN ('owner','admin','member') THEN RAISE EXCEPTION 'not a steward of this business'; END IF;
  UPDATE showcase_pieces SET pinned = coalesce(p_pinned,false), updated_at = now()
   WHERE instance_id = v_inst AND slug = p_slug;
  RETURN FOUND;
END $$;

CREATE OR REPLACE FUNCTION public.delete_showcase_piece(p_instance_slug text, p_slug text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_inst uuid; v_role text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT id INTO v_inst FROM instances WHERE slug = p_instance_slug;
  SELECT im.role INTO v_role FROM instance_members im WHERE im.instance_id = v_inst AND im.user_id = auth.uid();
  IF v_role IS NULL OR v_role NOT IN ('owner','admin') THEN RAISE EXCEPTION 'owner/admin only'; END IF;
  DELETE FROM showcase_pieces WHERE instance_id = v_inst AND slug = p_slug;
  RETURN FOUND;
END $$;

NOTIFY pgrst, 'reload schema';
