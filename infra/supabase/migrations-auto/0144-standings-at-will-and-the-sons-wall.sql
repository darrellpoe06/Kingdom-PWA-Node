-- =============================================================================
-- 0144 — every standing settable at will by the Governor; the son's wall raised
-- =============================================================================
-- The history this closes (measured 2026-08-23, Darrell's own screenshots of
-- his son's session): DR-0093 (2026-07-03) decided children join through the
-- safety rails, never the email allowlist — and named the allowlist "the
-- dangerous door" that unlocks all family financials and the imported feed.
-- Two days later, migration 0080 (2026-07-05) added darrellpoejr@gmail.com to
-- that allowlist anyway, trusting the 'family' persona to scope his view.
-- The persona was never the wall — RLS is, and RLS saw 'member'. The son has
-- held full financial visibility since. Darrell 2026-08-23: "child/successor
-- ... how did this happen and how can we safeguard?" and "I may want my uncle
-- or aunt... or brother in love... all statuses to be able to update to our
-- decided status at will."
--
-- Two moves:
--   1) set_member_role learns the WHOLE standing vocabulary — admin, member,
--      viewer, assistant, successor, child — so the Governor moves anyone
--      (uncle, aunt, brother-in-law, a son) between decided standings at
--      will from Role & stewards. The protective standings are the owner's
--      hand alone: only an OWNER may grant or remove 'child' or 'successor'.
--   2) Darrell Jr's standing becomes 'child' — the 0055/0082 walls apply the
--      moment this lands: zero books access, no writes, sign-in cannot flip
--      him back (join_default_instance is ON CONFLICT DO NOTHING). Moving him
--      to 'successor' (reads, cannot write) later is one tap in the control.

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
  -- Never 'owner' by this control. 'assistant' settable as of 0130 (DR-0271);
  -- 'successor' and 'child' settable as of 0144 so the family's standings are
  -- the Governor's to change at will — with the extra owner-only gate below.
  IF v_role NOT IN ('admin','member','viewer','assistant','successor','child') THEN
    RAISE EXCEPTION 'set_member_role: role must be admin, member, viewer, assistant, successor, or child';
  END IF;

  -- NULL-safe (0131 class): a non-member's role is NULL and NULL NOT IN (...)
  -- would skip the gate. Coalesced at assignment AND in the test (belt and
  -- braces — the guard reads the IF line).
  v_actor_role := coalesce(user_role_in_instance(instance_uuid), '');
  IF coalesce(v_actor_role, '') NOT IN ('owner','admin') THEN
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

  -- The protective standings are the owner's hand alone (0144): only an OWNER
  -- may set someone to child/successor, or lift someone out of them.
  IF (v_role IN ('child','successor') OR v_target.role IN ('child','successor')) AND v_actor_role <> 'owner' THEN
    RAISE EXCEPTION 'set_member_role: only an owner can set or change the child and successor standings';
  END IF;

  IF v_target.role = v_role THEN
    RETURN jsonb_build_object('status', 'noop', 'role', v_role);
  END IF;

  UPDATE instance_members SET role = v_role WHERE id = v_target.id;

  -- Record it (CAGE). Rank privilege to label grant vs revoke; assistant and
  -- successor rank below member (narrow reach); child ranks lowest.
  INSERT INTO audit_log (instance_id, user_id, action, entity_type, entity_id, from_value, to_value, note)
  VALUES (
    instance_uuid, v_actor,
    CASE WHEN (CASE v_role WHEN 'admin' THEN 4 WHEN 'member' THEN 3 WHEN 'assistant' THEN 2 WHEN 'successor' THEN 2 WHEN 'viewer' THEN 1 ELSE 0 END)
            > (CASE v_target.role WHEN 'admin' THEN 4 WHEN 'member' THEN 3 WHEN 'assistant' THEN 2 WHEN 'successor' THEN 2 WHEN 'viewer' THEN 1 ELSE 0 END)
         THEN 'permission-grant' ELSE 'permission-revoke' END,
    'instance_member', v_target.id,
    jsonb_build_object('role', v_target.role),
    jsonb_build_object('role', v_role),
    'set_member_role'
  );

  RETURN jsonb_build_object('status', 'changed', 'role', v_role);
END;
$$;
REVOKE ALL ON FUNCTION public.set_member_role(uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_member_role(uuid, uuid, text) TO authenticated;

-- Relationship — the label that GROWS (Darrell 2026-08-23: "keep the
-- relationship fields capable of growing like the other fields... as we go").
-- Free text on purpose: a relationship (Son, Uncle, Brother-in-law, ...) is a
-- label, never a power, so it carries no value whitelist — only a length cap.
-- The closed vocabularies stay closed for stated reasons: standings carry
-- POWER (every value has a tested wall), and W-2/1099 are the IRS's words.
ALTER TABLE instance_members ADD COLUMN IF NOT EXISTS relationship text;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'instance_members_relationship_len'
       AND conrelid = 'instance_members'::regclass
  ) THEN
    ALTER TABLE instance_members
      ADD CONSTRAINT instance_members_relationship_len
      CHECK (relationship IS NULL OR length(relationship) <= 40);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.set_member_relationship(instance_uuid uuid, target_user uuid, new_rel text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_rel   text := trim(coalesce(new_rel, ''));
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'set_member_relationship: not authenticated';
  END IF;
  IF coalesce(user_role_in_instance(instance_uuid), '') NOT IN ('owner','admin') THEN
    RAISE EXCEPTION 'set_member_relationship: only an owner/admin can set relationships';
  END IF;
  IF length(v_rel) > 40 THEN
    RAISE EXCEPTION 'set_member_relationship: keep the relationship under 40 characters';
  END IF;
  UPDATE instance_members SET relationship = NULLIF(v_rel, '')
   WHERE instance_id = instance_uuid AND user_id = target_user;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'set_member_relationship: that person is not a member of this space';
  END IF;
  RETURN jsonb_build_object('ok', true, 'relationship', NULLIF(v_rel, ''));
END;
$$;
REVOKE ALL ON FUNCTION public.set_member_relationship(uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_member_relationship(uuid, uuid, text) TO authenticated;

-- The roster speaks both labels: relationship + classification already ride
-- list_instance_members (classification since 0143); add relationship.
DROP FUNCTION IF EXISTS public.list_instance_members(uuid);
CREATE FUNCTION public.list_instance_members(instance_uuid uuid)
RETURNS TABLE (user_id uuid, display_name text, email text, role text, classification text, relationship text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT im.user_id, im.display_name, u.email::text, im.role, im.classification, im.relationship
    FROM instance_members im
    LEFT JOIN auth.users u ON u.id = im.user_id
   WHERE im.instance_id = instance_uuid
     AND user_role_in_instance(instance_uuid) IN ('owner','admin')
   ORDER BY
     CASE im.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 WHEN 'member' THEN 2 ELSE 3 END,
     im.display_name;
$$;
REVOKE ALL ON FUNCTION public.list_instance_members(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_instance_members(uuid) TO authenticated;

-- The son's wall, raised by the Governor's decision (Darrell 2026-08-23:
-- "child/successor"): darrellpoejr@gmail.com holds the 'child' standing in the
-- family space. 0082's walls take effect immediately — books read: none,
-- writes: none. This migration file is the decision record for the change.
UPDATE instance_members im
   SET role = 'child'
  FROM instances i, auth.users u
 WHERE i.id = im.instance_id AND i.slug = 'poe-family'
   AND u.id = im.user_id AND u.email = 'darrellpoejr@gmail.com'
   AND im.role <> 'child';

NOTIFY pgrst, 'reload schema';
