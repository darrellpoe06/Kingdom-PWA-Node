-- =============================================================================
-- PoeTech Family OS — schema v1.1 patch: tenant auto-join helper
-- =============================================================================
-- Adds one SECURITY DEFINER function the React app calls once on first
-- sign-in. The function adds the signed-in user as a 'member' of the
-- 'poe-family' tenant by default.
--
-- Why this is needed:
--   The feedback / entities / accounts / transactions / debts / projects
--   tables in schema-v1 all require tenant membership via RLS policies
--   (USING (user_in_tenant(tenant_id))). But tenant_members itself has
--   no INSERT policy, so a freshly-signed-in user cannot add themselves.
--   This SECURITY DEFINER helper closes that gap — controlled, idempotent,
--   and limited to one specific safe action.
--
-- Safe to re-run: function uses CREATE OR REPLACE.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.join_default_tenant(
  display_name_in text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id      uuid := auth.uid();
  v_user_email   text;
  v_tenant_id    uuid;
  v_display_name text;
  v_existing     uuid;
BEGIN
  -- Must be signed in to call this.
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'join_default_tenant: not authenticated';
  END IF;

  -- If user is already a member of ANY tenant, do nothing — return that
  -- tenant_id. (Caller can switch tenants later via a different flow.)
  SELECT tenant_id INTO v_existing
    FROM tenant_members
    WHERE user_id = v_user_id
    LIMIT 1;
  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  -- Look up the default tenant (poe-family). If the seed row is missing,
  -- this raises — that's correct, schema-v1 seeds it.
  SELECT id INTO v_tenant_id FROM tenants WHERE slug = 'poe-family';
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'join_default_tenant: poe-family tenant not seeded';
  END IF;

  -- Resolve a display name: caller-provided first, then the email's local
  -- part as a friendly fallback ("dpoe" from "dpoe@illinois.edu"), then
  -- the literal "Member" if email is missing for some reason.
  SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
  v_display_name := COALESCE(
    NULLIF(trim(display_name_in), ''),
    split_part(v_user_email, '@', 1),
    'Member'
  );

  INSERT INTO tenant_members (tenant_id, user_id, role, display_name)
  VALUES (v_tenant_id, v_user_id, 'member', v_display_name);

  RETURN v_tenant_id;
END;
$$;

-- Allow signed-in users to call this function. (PUBLIC includes anon,
-- but auth.uid() is NULL for anon so the RAISE above blocks them.)
GRANT EXECUTE ON FUNCTION public.join_default_tenant(text) TO authenticated;

-- =============================================================================
-- End of v1.1 patch. Verify with:
--   SELECT proname, prosecdef FROM pg_proc WHERE proname = 'join_default_tenant';
-- Expected: one row, prosecdef = true (SECURITY DEFINER is set).
-- =============================================================================
