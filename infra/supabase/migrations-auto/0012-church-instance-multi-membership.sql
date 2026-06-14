-- =============================================================================
-- 0012 — church instance + multi-instance membership (Darrell 2026-06-14)
-- =============================================================================
-- The church is its OWN tenant, separate from the Poe family. Darrell + Christina
-- lead units at church, so they belong to BOTH their family instance AND the
-- church instance and reach the Choir tab from their normal family login. BG +
-- media + singers belong to the church instance only. The choir module (0011)
-- must resolve the CHURCH instance, not join_default_instance() (the family).
--
-- WHY THIS IS SAFE TO APPLY: no church instance exists yet, so the church-blind
-- change to join_default_instance() is a NO-OP for every current user (they have
-- exactly one, family-type, instance — still matched and returned). The new
-- multi-instance path only activates when a leader first calls
-- join_church_instance(). Per DR-0011 this is a NEW migration that re-replaces
-- join_default_instance(), not a rewrite of 0002.
--
-- Tenancy is core/isolation (DR-0060 tenancy guard, P14). The poe-family
-- security guarantee is preserved EXACTLY: a non-allowlisted user never touches
-- family data; church membership lives in its own instance.
-- Idempotent: ON CONFLICT DO NOTHING + CREATE OR REPLACE.

-- ---------------------------------------------------------------------------
-- 1. Seed the church instance (The Church of the Living God / COLG). Display
--    name is editable later; slug is the stable key. instance_type already
--    supports 'church' (schema-v1 CHECK).
-- ---------------------------------------------------------------------------
INSERT INTO instances (slug, display_name, instance_type)
  VALUES ('colg', 'The Church of the Living God', 'church')
  ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. join_default_instance — now CHURCH-BLIND. The "already a member" path
--    returns the user's FAMILY/personal instance (instance_type <> 'church'),
--    so a leader who also belongs to the church instance still gets their
--    family instance for all family data. Everything else is unchanged from
--    0002 (family allowlist -> poe-family; everyone else -> own instance).
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

  IF v_user_email IN (
    'darrellpoe06@gmail.com',
    'mrspoe06@gmail.com',
    'christina@tlctherapysolutions.com'
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

-- ---------------------------------------------------------------------------
-- 3. join_church_instance — resolve (and, for allowlisted leaders, auto-join)
--    the church instance. Returns the church instance id, or NULL for a user
--    with no church access (the choir module then shows "ask to be added").
--    The leader allowlist mirrors the family pattern; broader church
--    onboarding (singers/media getting a membership) is the next increment.
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
BEGIN
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_user_id::text, 1));

  -- Already a member of a church instance -> return it.
  SELECT im.instance_id INTO v_existing
    FROM instance_members im
    JOIN instances i ON i.id = im.instance_id
   WHERE im.user_id = v_user_id AND i.instance_type = 'church'
   LIMIT 1;
  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  SELECT lower(coalesce(email, '')) INTO v_user_email FROM auth.users WHERE id = v_user_id;

  -- Leader allowlist -> role in the church instance. Everyone else: no church
  -- access yet (NULL), surfaced as the "ask the director to add you" state.
  v_role := CASE v_user_email
    WHEN 'darrellpoe06@gmail.com' THEN 'owner'
    WHEN 'mrspoe06@gmail.com' THEN 'admin'
    WHEN 'christina@tlctherapysolutions.com' THEN 'admin'
    WHEN 'bg@thechurchofthelivinggod.com' THEN 'admin'
    ELSE NULL
  END;
  IF v_role IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT id INTO v_instance_id FROM instances WHERE slug = 'colg';
  IF v_instance_id IS NULL THEN
    RETURN NULL;
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

GRANT EXECUTE ON FUNCTION public.join_default_instance(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_church_instance(text) TO authenticated;
