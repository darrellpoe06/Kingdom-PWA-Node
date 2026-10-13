-- =============================================================================
-- 0089 — provision the moore-divahs instance + Shay's seat (DR-0114 step 3)
-- =============================================================================
-- Darrell 2026-07-07 supplied Shay's sign-in email: mooredivahs1@yahoo.com.
-- Her business gets its OWN instance — making her a member of poe-family would
-- expose the family books (wrong wall). This provisions, data-driven and
-- idempotently:
--   1. The 'moore-divahs' instance (instance_type 'business').
--   2. Shay's seat: if her auth user already exists (she attempted sign-up
--      2026-07-07), a DIRECT owner membership — it is HER business; otherwise
--      a 60-day instance_invites row (role admin; the 0081 lane consumes it on
--      her first sign-in; promote to owner after).
--   3. Darrell's admin seat (governor oversight), direct membership.
--
-- SEQUENCING (deliberate): the door RPCs + BUSINESSES.moore still read
-- 'poe-family' until the unified-door increment re-points reads and migrates
-- the existing moore rows in ONE coherent change — provisioning the seat first
-- means her sign-in lands with a role already waiting (cf-instance board item).
-- IDEMPOTENT: ON CONFLICT / NOT EXISTS guards throughout.
-- =============================================================================

DO $moore_instance$
DECLARE
  v_inst    uuid;
  v_shay    uuid;
  v_darrell uuid;
BEGIN
  INSERT INTO instances (slug, display_name, instance_type)
  VALUES ('moore-divahs', 'Moore Divahs', 'business')
  ON CONFLICT (slug) DO NOTHING;

  SELECT id INTO v_inst FROM instances WHERE slug = 'moore-divahs';
  SELECT id INTO v_shay    FROM auth.users WHERE lower(email) = 'mooredivahs1@yahoo.com'  ORDER BY created_at ASC LIMIT 1;
  SELECT id INTO v_darrell FROM auth.users WHERE lower(email) = 'darrellpoe06@gmail.com' ORDER BY created_at ASC LIMIT 1;

  -- Shay: direct owner seat when her account exists; else a consumable invite.
  IF v_shay IS NOT NULL THEN
    INSERT INTO instance_members (instance_id, user_id, role, display_name)
    VALUES (v_inst, v_shay, 'owner', 'Shay')
    ON CONFLICT (instance_id, user_id) DO NOTHING;
  ELSIF v_darrell IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM instance_invites
       WHERE instance_id = v_inst AND lower(email) = 'mooredivahs1@yahoo.com' AND accepted_at IS NULL
    ) THEN
      INSERT INTO instance_invites (instance_id, email, role, invited_by, expires_at)
      VALUES (v_inst, 'mooredivahs1@yahoo.com', 'admin', v_darrell, now() + interval '60 days');
    END IF;
  END IF;

  -- Darrell: governor oversight seat on the business instance.
  IF v_darrell IS NOT NULL THEN
    INSERT INTO instance_members (instance_id, user_id, role, display_name)
    VALUES (v_inst, v_darrell, 'admin', 'Darrell')
    ON CONFLICT (instance_id, user_id) DO NOTHING;
  END IF;
END $moore_instance$;

-- Verify after apply:
--   SELECT slug FROM instances WHERE slug='moore-divahs';           -> 1 row
--   SELECT role, display_name FROM instance_members im
--     JOIN instances i ON i.id = im.instance_id
--    WHERE i.slug='moore-divahs';  -> Shay owner (or a pending invite) + Darrell admin
--   Anon/RLS posture unchanged — no policies or grants touched here.
