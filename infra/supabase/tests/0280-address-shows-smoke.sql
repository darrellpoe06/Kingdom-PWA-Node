-- =============================================================================
-- 0280 SMOKE — the address shows unless the family holds it (DR-0977)
-- =============================================================================
-- One transaction; ROLLS BACK. PASS prints 'ADDRESS SHOWS SMOKE: PASS'.
--
--   a new door, nothing chosen: the street and unit are on the shelf        ✔
--   the family holds the street: no street, no unit, a placeable label      ✔
--   a stranger to the door cannot show a held street                        ✘ (nothing changes)
--   the one-time reset left its record (the re-run guard exists)            ✔
-- =============================================================================
BEGIN;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000a0280', 'authenticated','authenticated','owner280@test.local','',   now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000e0280', 'authenticated','authenticated','stranger280@test.local','',now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  ('00000000-0000-4000-b000-000000010280', 'address-smoke-280', 'Address Smoke', 'business')
ON CONFLICT (id) DO NOTHING;
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  ('00000000-0000-4000-b000-000000010280', '00000000-0000-4000-a000-0000000a0280', 'owner', 'Owner')
ON CONFLICT DO NOTHING;
-- Neither insert names address_visibility: the column's default is under test.
INSERT INTO rentals (id, instance_id, created_by, slug, display_name, address, unit, city, state, property_type, status, listed_at) VALUES
  ('00000000-0000-4000-c000-0000000a0280', '00000000-0000-4000-b000-000000010280', '00000000-0000-4000-a000-0000000a0280', 'ADDR-A-280', 'Shown Door', '9801 Alder Smoke Lane', 'Apt 1', 'Champaign', 'Illinois', 'multi-family', 'vacant', now()),
  ('00000000-0000-4000-c000-0000000b0280', '00000000-0000-4000-b000-000000010280', '00000000-0000-4000-a000-0000000a0280', 'ADDR-B-280', 'Held Door',  '9802 Birch Smoke Lane', 'Apt 2', 'Champaign', 'Illinois', 'multi-family', 'vacant', now());

DO $$
DECLARE
  a uuid := '00000000-0000-4000-c000-0000000a0280';
  b uuid := '00000000-0000-4000-c000-0000000b0280';
  shelf text;
  n int;
BEGIN
  -- 1. The default shows the street.
  IF (SELECT address_visibility FROM rentals WHERE id = a) IS DISTINCT FROM 'public' THEN
    RAISE EXCEPTION 'ADDRESS SHOWS SMOKE FAIL: a new door defaults to %, not public', (SELECT address_visibility FROM rentals WHERE id = a);
  END IF;
  PERFORM set_config('role', 'anon', true);
  SELECT row_to_json(v)::text INTO shelf FROM public_vacancies() v WHERE v.id = a;
  PERFORM set_config('role', 'postgres', true);
  IF shelf IS NULL OR shelf NOT LIKE '%"street":"9801 Alder Smoke Lane"%' OR shelf NOT LIKE '%"unit":"Apt 1"%' OR shelf NOT LIKE '%"address_shown":true%' THEN
    RAISE EXCEPTION 'ADDRESS SHOWS SMOKE FAIL: a shown door''s street is not on the shelf: %', shelf;
  END IF;

  -- 2. The family holds the street.
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-4000-a000-0000000a0280', 'role', 'authenticated')::text, true);
  UPDATE rentals SET address_visibility = 'after-application' WHERE id = b;
  PERFORM set_config('role', 'anon', true);
  PERFORM set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
  SELECT row_to_json(v)::text INTO shelf FROM public_vacancies() v WHERE v.id = b;
  PERFORM set_config('role', 'postgres', true);
  IF shelf IS NULL THEN RAISE EXCEPTION 'ADDRESS SHOWS SMOKE FAIL: the held door left the shelf'; END IF;
  IF shelf ILIKE '%Birch Smoke%' OR shelf LIKE '%"unit":"Apt 2"%' OR shelf NOT LIKE '%"street":null%' OR shelf NOT LIKE '%"address_shown":false%' THEN
    RAISE EXCEPTION 'ADDRESS SHOWS SMOKE FAIL: a held street reached the shelf: %', shelf;
  END IF;
  IF shelf NOT LIKE '%in Champaign, Illinois%' THEN
    RAISE EXCEPTION 'ADDRESS SHOWS SMOKE FAIL: the held door lost its placeable label: %', shelf;
  END IF;

  -- 3. A stranger cannot show it.
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-4000-a000-0000000e0280', 'role', 'authenticated')::text, true);
  UPDATE rentals SET address_visibility = 'public' WHERE id = b;
  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claims', '', true);
  IF (SELECT address_visibility FROM rentals WHERE id = b) IS DISTINCT FROM 'after-application' THEN
    RAISE EXCEPTION 'ADDRESS SHOWS SMOKE FAIL: a stranger showed the family''s held street';
  END IF;

  -- 4. The re-run guard exists.
  SELECT count(*) INTO n FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'rentals' AND column_name = 'address_visibility_before_0280';
  IF n <> 1 THEN RAISE EXCEPTION 'ADDRESS SHOWS SMOKE FAIL: the one-time guard column is missing, so a re-run would undo every hold'; END IF;

  RAISE NOTICE 'ADDRESS SHOWS SMOKE: PASS';
END $$;

ROLLBACK;
