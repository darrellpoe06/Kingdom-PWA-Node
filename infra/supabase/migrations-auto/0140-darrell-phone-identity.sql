-- =============================================================================
-- 0140 — the Governor's phone account IS Darrell: one identity across doors
-- =============================================================================
-- Measured 2026-08-20 (nas-health run 32388793736), signed in via phone+PIN on
-- the sovereign stack: no Imported tab, the wrong persona, no admin. The app's
-- family/admin identity is keyed to darrellpoe06@gmail.com in every layer, and
-- the phone account (15636502416@phone.poetech.us, created 2026-07-12) was
-- auto-provisioned by branch (c) into its own isolated instance:
--
--   phone account membership:  u-c2a6c39aae994ff783c6b927e2e7f1cc (owner)
--   gmail account memberships: poe-family(owner) colg(owner) moore-divahs(admin)
--   the family data:           poe-family — transactions n=2949, accounts n=3,
--                              family_plans n=1; the isolated instance appears
--                              in NO data count (it holds nothing).
--
-- Same person, two accounts, never synced — his own words. The cure gives the
-- phone account the SAME standing as the gmail identity without touching the
-- gmail account (which keeps working; a password door for it ships beside
-- this). Order matters for scripts/tenancy-guard.mjs: the allowlist-gated
-- function is defined FIRST so the allowlist precedes every poe-family
-- reference (open-join check).

-- 1) Founder allowlist gains the phone identity. Byte-faithful to 0119's
--    deterministic body otherwise (family-type home first, earliest joined,
--    id tiebreak). invite_to_instance is untouched — 0119's stands.
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

  SELECT im.instance_id INTO v_existing
    FROM instance_members im
    JOIN instances i ON i.id = im.instance_id
   WHERE im.user_id = v_user_id AND i.instance_type <> 'church'
   ORDER BY CASE WHEN i.instance_type = 'family' THEN 0 ELSE 1 END,
            im.joined_at ASC,
            i.id ASC
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
  --     0140: the Governor's phone-pin synthetic email joins the list — the
  --     phone door and the gmail door are the same person (DR-0172).
  IF v_user_email IN (
    'darrellpoe06@gmail.com',
    'mrspoe06@gmail.com',
    'christina@tlctherapysolutions.com',
    'darrellpoejr@gmail.com',
    '15636502416@phone.poetech.us'
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

  -- (b) [REMOVED — DR-0187] the old bare-email invite auto-grant lived here.
  -- Membership from an invite now requires claim_invite + confirm_invite.

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

-- 2) The phone account joins poe-family as OWNER — the same standing the gmail
--    identity has held since 2026-05-24 (0113). Idempotent.
INSERT INTO instance_members (instance_id, user_id, role, display_name)
SELECT i.id, u.id, 'owner', 'Darrell'
  FROM instances i
  JOIN auth.users u ON u.email = '15636502416@phone.poetech.us'
 WHERE i.slug = 'poe-family'
ON CONFLICT (instance_id, user_id) DO NOTHING;

-- 3) Retire the phone account's membership in its EMPTY auto-created isolated
--    instance. Without this, 0119's deterministic resolver (family-type first,
--    then EARLIEST joined) would keep landing on the 2026-07-12 isolated seat
--    forever and the poe-family membership above would never be reached. The
--    witness measured the instance in no data count (transactions, accounts,
--    family_plans all 0 there); the instance row itself is left in place.
DELETE FROM instance_members im
 USING instances i, auth.users u
 WHERE im.instance_id = i.id
   AND im.user_id = u.id
   AND i.slug = 'u-c2a6c39aae994ff783c6b927e2e7f1cc'
   AND u.email = '15636502416@phone.poetech.us';

-- 4) The 0025 admin policies (the interest/invite list) recognize the phone
--    identity beside both gmail admins. Recreated whole, idempotently.
DROP POLICY IF EXISTS app_interest_admin_read   ON app_interest;
DROP POLICY IF EXISTS app_interest_admin_update ON app_interest;
DROP POLICY IF EXISTS app_interest_admin_delete ON app_interest;
CREATE POLICY app_interest_admin_read ON app_interest FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'email') IN ('darrellpoe06@gmail.com', 'mrspoe06@gmail.com', '15636502416@phone.poetech.us'));
CREATE POLICY app_interest_admin_update ON app_interest FOR UPDATE
  TO authenticated
  USING      ((auth.jwt() ->> 'email') IN ('darrellpoe06@gmail.com', 'mrspoe06@gmail.com', '15636502416@phone.poetech.us'))
  WITH CHECK ((auth.jwt() ->> 'email') IN ('darrellpoe06@gmail.com', 'mrspoe06@gmail.com', '15636502416@phone.poetech.us'));
CREATE POLICY app_interest_admin_delete ON app_interest FOR DELETE
  TO authenticated
  USING ((auth.jwt() ->> 'email') IN ('darrellpoe06@gmail.com', 'mrspoe06@gmail.com', '15636502416@phone.poetech.us'));

NOTIFY pgrst, 'reload schema';
