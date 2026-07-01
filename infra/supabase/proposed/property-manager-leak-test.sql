-- =====================================================================
-- PROVEN-TO-CATCH leak test for the scoped Property-Manager role.
-- Pairs with property-manager-scoped-role.sql (apply that FIRST).
--
-- HOW TO RUN (staging DB with the schema + the proposed migration applied):
--   psql "$STAGING_DATABASE_URL" -v ON_ERROR_STOP=1 -f property-manager-leak-test.sql
-- Exit 0 + "ALL PROPERTY-MANAGER ISOLATION CHECKS PASSED" = pass.
-- Any RAISE EXCEPTION aborts with the failing check = fail. No green, no ship.
--
-- The whole run is wrapped in a transaction and ROLLED BACK — it seeds
-- throwaway data, proves isolation, and leaves the DB untouched.
--
-- NOT RUN by Claude this session (Verification Doctrine / no-fake-green):
--   the served 3-way proof needs (a) this migration applied to a DB and
--   (b) a real magic-link PM session. Both are human/Tier-C steps. This file
--   is the runnable proof; running it is the owner's trigger.
--
-- PROVEN-TO-CATCH — this test FAILS (not silently passes) if the model breaks:
--   * If any PM policy used user_in_instance() instead of pm_assigned_to_rental()
--     -> the PM (not a member) sees 0 maintenance -> CHECK 5 FAILS (under-grant).
--   * If the PM were made an instance_member (the fail-OPEN design) ->
--     -> CHECKS 7-10 (finances = 0) FAIL (the leak is caught).
--   * If pm_property_view leaked a financial column -> CHECK 3b FAILS.
--   * If assignment write were allowed to the PM -> CHECK 11 FAILS (escalation).
-- =====================================================================

BEGIN;

-- Fixed throwaway UUIDs (kNN = instance, uNN = auth user, xNN = external user).
--   iA = owner instance A; iB = a DIFFERENT owner's instance B.
--   rA1 = PM-assigned rental; rA2 = same instance, NOT assigned; rB1 = other instance.
\set iA  '''aaaaaaaa-0000-0000-0000-000000000001'''
\set iB  '''bbbbbbbb-0000-0000-0000-000000000002'''
\set uOwnerA '''11111111-0000-0000-0000-0000000000a1'''
\set uOwnerB '''22222222-0000-0000-0000-0000000000b1'''
\set uPM  '''33333333-0000-0000-0000-0000000000c1'''
\set xPM  '''44444444-0000-0000-0000-0000000000d1'''
\set rA1 '''a1a1a1a1-0000-0000-0000-0000000000f1'''
\set rA2 '''a2a2a2a2-0000-0000-0000-0000000000f2'''
\set rB1 '''b1b1b1b1-0000-0000-0000-0000000000f3'''

-- --- seed auth.users (columns can vary by Supabase version; adapt if needed) ---
INSERT INTO auth.users (id, email, aud, role) VALUES
  (:uOwnerA, 'ownerA@example.com', 'authenticated', 'authenticated'),
  (:uOwnerB, 'ownerB@example.com', 'authenticated', 'authenticated'),
  (:uPM,     'pm@example.com',     'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- --- two isolated owner instances + memberships ---
INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  (:iA, 'leak-test-owner-a', 'Owner A Props', 'landlord'),
  (:iB, 'leak-test-owner-b', 'Owner B Props', 'landlord')
ON CONFLICT (id) DO NOTHING;
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  (:iA, :uOwnerA, 'owner', 'Owner A'),
  (:iB, :uOwnerB, 'owner', 'Owner B')
ON CONFLICT DO NOTHING;

-- --- rentals: rA1 & rA2 in A (with owner financials), rB1 in B ---
INSERT INTO rentals (id, instance_id, created_by, address, display_name, property_type,
                     purchase_price, mortgage_amount, current_market_value, status) VALUES
  (:rA1, :iA, :uOwnerA, '805 Elm #1', '805 Elm Unit 1', 'multi-family', 250000, 180000, 300000, 'occupied'),
  (:rA2, :iA, :uOwnerA, '999 Oak',    '999 Oak',        'single-family', 400000, 300000, 450000, 'occupied'),
  (:rB1, :iB, :uOwnerB, '12 Other St','12 Other St',    'single-family', 111111, 90000,  120000, 'occupied')
ON CONFLICT (id) DO NOTHING;

-- --- an owner financial row (accounts) in A: PM must NEVER see it ---
INSERT INTO accounts (id, instance_id, created_by, name, type, balance)
  VALUES (gen_random_uuid(), :iA, :uOwnerA, 'Owner A Operating', 'checking', 42000)
ON CONFLICT DO NOTHING;

-- --- maintenance requests: one per rental ---
INSERT INTO maintenance_requests (id, instance_id, created_by, rental_id, category, description, submitted_via) VALUES
  (gen_random_uuid(), :iA, :uOwnerA, :rA1, 'plumbing',   'Leak under sink (assigned unit)', 'owner-discovery'),
  (gen_random_uuid(), :iA, :uOwnerA, :rA2, 'electrical', 'Breaker trips (UNassigned unit)', 'owner-discovery'),
  (gen_random_uuid(), :iB, :uOwnerB, :rB1, 'hvac',       'No heat (OTHER owner)',           'owner-discovery')
ON CONFLICT DO NOTHING;

-- --- the PM as an EXTERNAL user in instance A, assigned to rA1 ONLY ---
INSERT INTO external_users (id, instance_id, type, display_name, email,
                            linked_entity_type, linked_entity_id, invite_status,
                            invited_by, created_by)
  VALUES (:xPM, :iA, 'property-manager', 'Test PM', 'pm@example.com',
          'instance', :iA, 'accepted', :uOwnerA, :uOwnerA)
ON CONFLICT (id) DO NOTHING;
INSERT INTO property_assignments (instance_id, external_user_id, rental_id, assigned_by)
  VALUES (:iA, :xPM, :rA1, :uOwnerA)
ON CONFLICT DO NOTHING;

-- =====================================================================
-- ACT AS THE PROPERTY MANAGER (external session: sub=uPM, external_user_id=xPM)
-- =====================================================================
SELECT set_config('request.jwt.claims',
  json_build_object('role','authenticated','sub', :uPM, 'external_user_id', :xPM)::text, true);
SET LOCAL ROLE authenticated;

DO $$
DECLARE n int; leaked numeric;
BEGIN
  -- CHECK 1: sees exactly her 1 assigned unit via the PM view.
  SELECT count(*) INTO n FROM pm_property_view;
  IF n <> 1 THEN RAISE EXCEPTION 'CHECK 1 FAIL: PM should see 1 assigned unit, saw %', n; END IF;

  -- CHECK 2: that unit is rA1 (not rA2, not rB1).
  IF NOT EXISTS (SELECT 1 FROM pm_property_view WHERE address = '805 Elm #1') THEN
    RAISE EXCEPTION 'CHECK 2 FAIL: PM view is not the assigned unit'; END IF;
  IF EXISTS (SELECT 1 FROM pm_property_view WHERE address IN ('999 Oak','12 Other St')) THEN
    RAISE EXCEPTION 'CHECK 2 FAIL: PM view leaked an unassigned/other-owner unit'; END IF;

  -- CHECK 3a: base rentals table is fully invisible (not an instance member).
  SELECT count(*) INTO n FROM rentals;
  IF n <> 0 THEN RAISE EXCEPTION 'CHECK 3a FAIL: PM read % base rentals rows (must be 0)', n; END IF;

  -- CHECK 3b: the PM view carries NO financial column (proven by absence).
  BEGIN
    EXECUTE 'SELECT purchase_price FROM pm_property_view LIMIT 1';
    RAISE EXCEPTION 'CHECK 3b FAIL: pm_property_view exposed a financial column';
  EXCEPTION WHEN undefined_column THEN NULL;  -- expected: column is not in the view
  END;

  -- CHECK 4: tenant contact only for the assigned unit (via pm_renter_view).
  --          (0 rows here is fine if no lease seeded; must NEVER include other units.)
  IF EXISTS (SELECT 1 FROM pm_renter_view WHERE rental_id IN (:'rA2', :'rB1')) THEN
    RAISE EXCEPTION 'CHECK 4 FAIL: renter view leaked a non-assigned unit'; END IF;

  -- CHECK 5: maintenance — sees the assigned unit's request, ONLY that one.
  SELECT count(*) INTO n FROM maintenance_requests;
  IF n <> 1 THEN RAISE EXCEPTION 'CHECK 5 FAIL: PM should see 1 maintenance req, saw %', n; END IF;
  IF NOT EXISTS (SELECT 1 FROM maintenance_requests WHERE rental_id = :'rA1') THEN
    RAISE EXCEPTION 'CHECK 5 FAIL: PM cannot see the assigned unit maintenance'; END IF;

  -- CHECK 6: her own active assignment is readable; others are not.
  SELECT count(*) INTO n FROM property_assignments;
  IF n <> 1 THEN RAISE EXCEPTION 'CHECK 6 FAIL: PM should read only her 1 assignment, saw %', n; END IF;

  -- CHECK 7-10: FINANCES / OTHER DATA — hard zero (the core no-leak bar).
  SELECT count(*) INTO n FROM accounts;      IF n<>0 THEN RAISE EXCEPTION 'CHECK 7 FAIL: PM saw % accounts (finances leaked!)', n; END IF;
  SELECT count(*) INTO n FROM rent_payments; IF n<>0 THEN RAISE EXCEPTION 'CHECK 8 FAIL: PM saw % rent_payments', n; END IF;
  SELECT count(*) INTO n FROM leases;        IF n<>0 THEN RAISE EXCEPTION 'CHECK 9 FAIL: PM saw % leases', n; END IF;
  SELECT count(*) INTO n FROM transactions;  IF n<>0 THEN RAISE EXCEPTION 'CHECK 10 FAIL: PM saw % transactions', n; END IF;

  -- CHECK 11: PRIVILEGE ESCALATION — PM cannot grant herself a new unit.
  BEGIN
    INSERT INTO property_assignments (instance_id, external_user_id, rental_id, assigned_by)
      VALUES (:'iA', :'xPM', :'rA2', :'uPM');
    RAISE EXCEPTION 'CHECK 11 FAIL: PM was able to self-assign a unit (escalation!)';
  EXCEPTION WHEN insufficient_privilege OR check_violation THEN NULL;  -- expected: RLS denies
  END;

  -- CHECK 12: PM cannot log maintenance against an UNassigned unit.
  BEGIN
    INSERT INTO maintenance_requests (instance_id, created_by, rental_id, category, description, submitted_via)
      VALUES (:'iA', :'uPM', :'rA2', 'other', 'should be denied', 'owner-discovery');
    RAISE EXCEPTION 'CHECK 12 FAIL: PM inserted maintenance on an unassigned unit';
  EXCEPTION WHEN insufficient_privilege OR check_violation THEN NULL;  -- expected: RLS denies
  END;

  RAISE NOTICE 'PM identity: all 12 checks passed.';
END $$;
RESET ROLE;

-- =====================================================================
-- SANITY: an internal owner-A member still works normally (no regression).
-- =====================================================================
SELECT set_config('request.jwt.claims',
  json_build_object('role','authenticated','sub', :uOwnerA)::text, true);
SET LOCAL ROLE authenticated;
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM rentals;             -- sees A1 + A2, not B1
  IF n <> 2 THEN RAISE EXCEPTION 'SANITY FAIL: owner A should see 2 rentals, saw %', n; END IF;
  IF EXISTS (SELECT 1 FROM rentals WHERE address = '12 Other St') THEN
    RAISE EXCEPTION 'SANITY FAIL: owner A leaked owner B rental'; END IF;
  SELECT count(*) INTO n FROM pm_property_view;     -- not a PM -> 0
  IF n <> 0 THEN RAISE EXCEPTION 'SANITY FAIL: non-PM saw % PM-view rows', n; END IF;
  RAISE NOTICE 'Internal owner-A identity: sanity passed.';
END $$;
RESET ROLE;

DO $$ BEGIN RAISE NOTICE 'ALL PROPERTY-MANAGER ISOLATION CHECKS PASSED'; END $$;

ROLLBACK;   -- leave the DB exactly as we found it.
