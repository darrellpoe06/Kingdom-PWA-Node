-- =============================================================================
-- 0002 — self-serve provisioning on the default-instance auto-join (2026-06-13)
-- =============================================================================
-- Builds on 0001 (family allowlist). 0001 closed the security hole by RAISING
-- for any non-family signed-in user. That kept strangers out of the family's
-- data, but it also DEAD-ENDED their experience -- a signed-in non-family
-- person ("I'm in but not really": Bishop Gwin, a parishioner, Darrell's
-- father-in-law) got an exception and device-local-only persistence, told to
-- "ask the family to invite you." That is the failure Darrell flagged
-- (2026-06-13): "we need those people to get an amazing experience not
-- failures... none of this I'm in but not really."
--
-- Darrell's direction (2026-06-13): open SELF-SERVE sign-up. A non-family user
-- must get a WORKING account in their OWN isolated instance -- never a failure,
-- and never a foot inside the poe-family data.
--
-- This re-replaces join_default_instance():
--   - Family allowlist -> join the shared 'poe-family' instance (unchanged
--     from 0001; the security guarantee is preserved exactly).
--   - Everyone else     -> create THEIR OWN instance (slug 'u-<uid>') and make
--     them its owner. Their data syncs there; per-instance RLS keeps it fully
--     theirs. No stranger ever touches family data; no one hits a dead end.
--
-- Concurrency: on sign-in the client fires many table-syncs in parallel, each
-- calling this function (table-sync.js, snapshot-sync.js, feedback-sync.js).
-- A per-user advisory lock + deterministic slug + ON CONFLICT guards make
-- first-time provisioning converge on exactly ONE instance. (This also fixes a
-- pre-existing race for a brand-new FAMILY member's first sign-in, where
-- parallel INSERTs could collide on instance_members' unique constraint.)
--
-- Idempotent: CREATE OR REPLACE. The lane applies all migrations in filename
-- order every run, so this (0002) lands after 0001 and its definition wins.
-- To map a NEW person to an existing shared instance (the twins -> poe-family;
-- church staff -> a church instance), add their email to the allowlist below
-- in a NEW migration that re-replaces this function (per DR-0011: new directive
-- = new file, never a rewrite of a landed one).

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

  -- Serialize this user's concurrent first-time provisioning so parallel
  -- syncs cannot create two instances for one person. Released at txn end.
  PERFORM pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));

  -- Idempotent: already a member of any instance -> return it (the common
  -- path for every returning user, including all current family members).
  SELECT instance_id INTO v_existing FROM instance_members
    WHERE user_id = v_user_id LIMIT 1;
  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  SELECT lower(coalesce(email, '')) INTO v_user_email FROM auth.users WHERE id = v_user_id;
  v_display_name := COALESCE(
    NULLIF(trim(display_name_in), ''),
    NULLIF(split_part(v_user_email, '@', 1), ''),
    'Member'
  );

  -- Family allowlist -> the shared poe-family instance (unchanged from 0001).
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

  -- Everyone else -> their OWN instance, owned by them. This is BOTH the
  -- privacy guarantee (a non-family user can never read or write family data,
  -- because they are only ever a member of their own instance) AND the
  -- self-serve account (their space, empty, fully theirs).
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
