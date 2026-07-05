-- =============================================================================
-- 0080 — add Darrell Jr to the family allowlist (2026-07-05)
-- =============================================================================
-- Declared by Darrell 2026-07-05: "allow my son and family in." His son already
-- created an account (darrellpoejr@gmail.com) and signed in, but showed up as a
-- PUBLIC SIGNUP with "no space yet" — a self-serve visitor, not a family member.
--
-- This re-replaces join_default_instance() (per DR-0011: new directive = a NEW
-- migration that re-replaces the function, never a rewrite of a landed one; and
-- per 0002's own note: "add their email to the allowlist below in a NEW
-- migration"). The ONLY change from the 0012 definition is one added email in
-- the family allowlist — the security structure (allowlist gate BEFORE the
-- poe-family grant; everyone else gets their OWN isolated instance) is preserved
-- exactly, so the tenancy guard (scripts/tenancy-guard.mjs → checkProvisioning)
-- still passes.
--
-- Effect: on his NEXT sign-in, join_default_instance sees no existing non-church
-- membership (he has "no space yet"), matches the allowlist, and joins him to
-- the shared 'poe-family' instance as a member. No stranger is affected; this is
-- purely additive and reversible (drop the email in a later migration).
--
-- Idempotent: CREATE OR REPLACE, applied in filename order every run; 0080 lands
-- after 0012 and its definition wins. join_church_instance() is untouched (the
-- son is not church staff).

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

  -- Family allowlist -> the shared poe-family instance. Darrell Jr added 2026-07-05.
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

  -- Everyone else -> their OWN isolated instance, owned by them.
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
