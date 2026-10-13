-- =============================================================================
-- 0081 — data-driven access: invite_to_instance + invite-consuming join
-- =============================================================================
-- Declared by Darrell 2026-07-05: "adding him currently here doesn't work —
-- create a comprehensive intuitive system for addressing this issue and make it
-- work." Today adding a family member means hand-editing a SQL migration (the
-- join_default_instance allowlist) AND a shell constant, then deploying. That is
-- a developer task, not a system. This migration makes granting family/instance
-- access DATA-DRIVEN: a governor invites by email from inside the app, and the
-- invitee auto-joins on their next sign-in — no code change, no deploy.
--
-- The machinery already existed for the CHURCH (invite_to_church +
-- join_church_instance consume instance_invites). This generalizes that proven
-- pattern to any NON-church instance (the family), changing nothing about the
-- security model:
--   1. invite_to_instance(email, role) — SECURITY DEFINER; the caller must be
--      owner/admin of their (non-church) instance; upserts one live invite row.
--      Never issues 'owner'. Mirrors invite_to_church (0014) exactly, minus the
--      church hardcode.
--   2. join_default_instance() now CONSUMES a pending, unexpired invite BEFORE
--      it falls through to self-provisioning — so an invited email lands in the
--      inviter's instance with the invited role instead of a fresh solo space.
--      The founder allowlist stays as BOOTSTRAP (the shared poe-family seed), so
--      scripts/tenancy-guard.mjs → checkProvisioning still passes.
--
-- Ordering matters (per the 0080 review): the invite check sits AFTER the
-- "already a member" guard and the founder allowlist, but BEFORE the solo-space
-- branch — otherwise an invited user who already self-provisioned is shadowed.
-- Idempotent: CREATE OR REPLACE, applied in filename order; 0081 lands after
-- 0080 and its join_default_instance definition wins.

-- ---------------------------------------------------------------------------
-- 1. invite_to_instance — the in-app grant primitive (generalized from
--    invite_to_church). The caller invites someone to THEIR OWN non-church
--    instance; the invitee auto-joins on next sign-in via join_default_instance.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.invite_to_instance(email_in text, role_in text DEFAULT 'member')
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id  uuid := auth.uid();
  v_instance uuid;
  v_email    text := lower(trim(coalesce(email_in, '')));
  v_role     text := lower(trim(coalesce(role_in, 'member')));
  v_id       uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'invite_to_instance: not authenticated';
  END IF;
  IF v_email = '' OR position('@' in v_email) = 0 THEN
    RAISE EXCEPTION 'invite_to_instance: a valid email is required';
  END IF;
  -- instance_invites.role CHECK allows only owner/admin/member/viewer; never
  -- invite an 'owner', and default unknown roles to member.
  IF v_role NOT IN ('admin','member','viewer') THEN
    v_role := 'member';
  END IF;

  -- Caller must be owner/admin of a NON-church instance (their family/personal
  -- instance). Church invites keep their own path (invite_to_church).
  SELECT im.instance_id INTO v_instance
    FROM instance_members im
    JOIN instances i ON i.id = im.instance_id
   WHERE im.user_id = v_user_id AND i.instance_type <> 'church' AND im.role IN ('owner','admin')
   LIMIT 1;
  IF v_instance IS NULL THEN
    RAISE EXCEPTION 'invite_to_instance: only an instance owner/admin can invite';
  END IF;

  -- One live invite per email+instance: clear any prior unaccepted one.
  DELETE FROM instance_invites
   WHERE instance_id = v_instance AND lower(email) = v_email AND accepted_at IS NULL;

  INSERT INTO instance_invites (instance_id, email, role, invited_by)
    VALUES (v_instance, v_email, v_role, v_user_id)
    RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.invite_to_instance(text, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. join_default_instance — now consumes a pending invite before self-serve.
--    (Re-replaces 0080; the founder allowlist + solo-space branches are
--    unchanged, a pending-invite branch is inserted between them.)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.join_default_instance(display_name_in text DEFAULT NULL)
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
  v_slug         text;
  v_invite_id    uuid;
  v_invite_role  text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'join_default_instance: not authenticated';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));

  -- Already a member of a NON-church instance -> return it (the common path).
  SELECT im.instance_id INTO v_existing
    FROM instance_members im
    JOIN instances i ON i.id = im.instance_id
   WHERE im.user_id = v_user_id AND i.instance_type <> 'church'
   LIMIT 1;
  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  SELECT lower(coalesce(email, '')) INTO v_user_email FROM auth.users WHERE id = v_user_id;
  v_display_name := COALESCE(
    NULLIF(trim(display_name_in), ''),
    NULLIF(split_part(v_user_email, '@', 1), ''),
    'Member'
  );

  -- (a) Founder allowlist -> the shared poe-family instance (BOOTSTRAP seed).
  IF v_user_email IN (
    'darrellpoe06@gmail.com',
    'mrspoe06@gmail.com',
    'christina@tlctherapysolutions.com',
    'darrellpoejr@gmail.com'
  ) THEN
    SELECT id INTO v_instance_id FROM instances WHERE slug = 'poe-family';
    IF v_instance_id IS NULL THEN
      RAISE EXCEPTION 'join_default_instance: poe-family instance not seeded';
    END IF;
    INSERT INTO instance_members (instance_id, user_id, role, display_name)
      VALUES (v_instance_id, v_user_id, 'member', v_display_name)
      ON CONFLICT (instance_id, user_id) DO NOTHING;
    RETURN v_instance_id;
  END IF;

  -- (b) Pending in-app INVITE to a non-church instance -> accept + join it with
  -- the invited role. This is the data-driven grant: no code change per person.
  SELECT inv.id, inv.instance_id, inv.role
    INTO v_invite_id, v_instance_id, v_invite_role
    FROM instance_invites inv
    JOIN instances i ON i.id = inv.instance_id
   WHERE i.instance_type <> 'church'
     AND lower(inv.email) = v_user_email
     AND inv.accepted_at IS NULL
     AND inv.expires_at > now()
   ORDER BY inv.expires_at DESC
   LIMIT 1;
  IF v_invite_id IS NOT NULL THEN
    UPDATE instance_invites SET accepted_at = now() WHERE id = v_invite_id;
    INSERT INTO instance_members (instance_id, user_id, role, display_name)
      VALUES (v_instance_id, v_user_id, v_invite_role, v_display_name)
      ON CONFLICT (instance_id, user_id) DO NOTHING;
    RETURN v_instance_id;
  END IF;

  -- (c) Everyone else -> their OWN isolated instance, owned by them.
  v_slug := 'u-' || replace(v_user_id::text, '-', '');
  INSERT INTO instances (slug, display_name, instance_type)
    VALUES (v_slug, v_display_name, 'family')
    ON CONFLICT (slug) DO NOTHING;
  SELECT id INTO v_instance_id FROM instances WHERE slug = v_slug;
  INSERT INTO instance_members (instance_id, user_id, role, display_name)
    VALUES (v_instance_id, v_user_id, 'owner', v_display_name)
    ON CONFLICT (instance_id, user_id) DO NOTHING;
  RETURN v_instance_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_default_instance(text) TO authenticated;
