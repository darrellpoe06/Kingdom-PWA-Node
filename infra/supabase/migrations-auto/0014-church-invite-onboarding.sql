-- =============================================================================
-- 0014 — church onboarding by invite (Darrell 2026-06-14)
-- =============================================================================
-- The leader allowlist (0012) lets Darrell/Christina/BG into the church
-- instance, but the choir + media team need access too so they actually see the
-- Choir tab. A director (owner/admin of the church instance) INVITES a member by
-- email + role; when that person signs in, join_church_instance() accepts the
-- pending invite and adds them. Reuses the existing instance_invites table.
--
-- CHURCH-SCOPED ONLY: this re-replaces join_church_instance (per DR-0011, a new
-- file) and adds invite_to_church(); it does NOT touch join_default_instance, so
-- the family app is unaffected. Additive + idempotent (CREATE OR REPLACE).

-- ---------------------------------------------------------------------------
-- 1. invite_to_church(email, role) — a church owner/admin creates an invite for
--    their church instance. SECURITY DEFINER: it verifies the caller's church
--    role itself, so no broad INSERT policy on instance_invites is needed.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.invite_to_church(email_in text, role_in text DEFAULT 'member')
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_church  uuid;
  v_email   text := lower(trim(coalesce(email_in, '')));
  v_role    text := lower(trim(coalesce(role_in, 'member')));
  v_id      uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'invite_to_church: not authenticated';
  END IF;
  IF v_email = '' OR position('@' in v_email) = 0 THEN
    RAISE EXCEPTION 'invite_to_church: a valid email is required';
  END IF;
  IF v_role NOT IN ('admin','member','viewer') THEN
    v_role := 'member';  -- never invite an 'owner'; default unknown roles to member
  END IF;

  -- Caller must be owner/admin of a church instance.
  SELECT im.instance_id INTO v_church
    FROM instance_members im
    JOIN instances i ON i.id = im.instance_id
   WHERE im.user_id = v_user_id AND i.instance_type = 'church' AND im.role IN ('owner','admin')
   LIMIT 1;
  IF v_church IS NULL THEN
    RAISE EXCEPTION 'invite_to_church: only a church owner/admin can invite';
  END IF;

  -- One live invite per email+instance: clear any prior unaccepted one.
  DELETE FROM instance_invites
   WHERE instance_id = v_church AND lower(email) = v_email AND accepted_at IS NULL;

  INSERT INTO instance_invites (instance_id, email, role, invited_by)
    VALUES (v_church, v_email, v_role, v_user_id)
    RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- 2. join_church_instance — now also ACCEPTS a pending invite (after the leader
--    allowlist). Re-replaces 0012's version (per DR-0011). Leader path unchanged.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.join_church_instance(display_name_in text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id      uuid := auth.uid();
  v_user_email   text;
  v_instance_id  uuid;
  v_display_name text;
  v_existing     uuid;
  v_role         text;
  v_invite_id    uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_user_id::text, 1));

  SELECT im.instance_id INTO v_existing
    FROM instance_members im
    JOIN instances i ON i.id = im.instance_id
   WHERE im.user_id = v_user_id AND i.instance_type = 'church'
   LIMIT 1;
  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  SELECT lower(coalesce(email, '')) INTO v_user_email FROM auth.users WHERE id = v_user_id;

  -- Leader allowlist (unchanged).
  v_role := CASE v_user_email
    WHEN 'darrellpoe06@gmail.com' THEN 'owner'
    WHEN 'mrspoe06@gmail.com' THEN 'admin'
    WHEN 'christina@tlctherapysolutions.com' THEN 'admin'
    WHEN 'bg@thechurchofthelivinggod.com' THEN 'admin'
    ELSE NULL
  END;
  IF v_role IS NOT NULL THEN
    SELECT id INTO v_instance_id FROM instances WHERE slug = 'colg';
  ELSE
    -- Accept a pending, unexpired invite to a church instance.
    SELECT inv.id, inv.instance_id, inv.role
      INTO v_invite_id, v_instance_id, v_role
      FROM instance_invites inv
      JOIN instances i ON i.id = inv.instance_id
     WHERE i.instance_type = 'church'
       AND lower(inv.email) = v_user_email
       AND inv.accepted_at IS NULL
       AND inv.expires_at > now()
     ORDER BY inv.expires_at DESC
     LIMIT 1;
    IF v_invite_id IS NOT NULL THEN
      UPDATE instance_invites SET accepted_at = now() WHERE id = v_invite_id;
    END IF;
  END IF;

  IF v_role IS NULL OR v_instance_id IS NULL THEN
    RETURN NULL;  -- no church access; the choir surface shows "ask to be added"
  END IF;

  v_display_name := COALESCE(
    NULLIF(trim(display_name_in), ''),
    NULLIF(split_part(v_user_email, '@', 1), ''),
    'Member'
  );
  INSERT INTO instance_members (instance_id, user_id, role, display_name)
    VALUES (v_instance_id, v_user_id, v_role, v_display_name)
    ON CONFLICT (instance_id, user_id) DO NOTHING;
  RETURN v_instance_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.invite_to_church(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_church_instance(text) TO authenticated;
