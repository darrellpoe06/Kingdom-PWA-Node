-- =============================================================================
-- 0283 SMOKE — a held door shows its building's area (DR-0996)
-- =============================================================================
-- One transaction; ROLLS BACK. PASS prints 'BUILDING AREA SMOKE: PASS'.
--
--   a held bed with no area of its own: the building's area and lines     ✔
--     ... and still no street, no unit, nothing more exact than the town  ✔
--   a door's own area wins over the building's                            ✔
--   the same street in ANOTHER family lends nothing                       ✘
--   "N" is not "North": a near-miss street lends nothing (DR-0967)        ✘
--   building_key folds the unit and cuts at a designator                  ✔
-- =============================================================================
BEGIN;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000a0283', 'authenticated','authenticated','owner283@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000b0283', 'authenticated','authenticated','other283@test.local','', now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  ('00000000-0000-4000-b000-000000010283', 'building-smoke-283', 'Building Smoke', 'business'),
  ('00000000-0000-4000-b000-000000020283', 'building-smoke-283-other', 'Building Smoke Other', 'business')
ON CONFLICT (id) DO NOTHING;

-- The family's building: Apt 2 holds the area (street shown); Apt 4's bed holds
-- its street and stored no area; Apt 5 stored its own area. A near-miss street
-- in the same family, and the same street in another family, both held.
INSERT INTO rentals (id, instance_id, created_by, slug, display_name, address, unit, city, state, property_type, status, listed_at, address_visibility, area_lat, area_lng, nearby, created_at) VALUES
  ('00000000-0000-4000-c000-0000000a0283', '00000000-0000-4000-b000-000000010283', '00000000-0000-4000-a000-0000000a0283', 'BLD-A2-283', '9803 Cedar Smoke Avenue Apt 2', '9803 Cedar Smoke Avenue', 'Apt 2', 'Champaign', 'Illinois', 'multi-family', 'vacant', now(), 'public', 40.125, -88.26,
     '[{"label":"University of Illinois Main Quad","miles":2.0}]'::jsonb, now() - interval '2 days'),
  ('00000000-0000-4000-c000-0000000b0283', '00000000-0000-4000-b000-000000010283', '00000000-0000-4000-a000-0000000a0283', 'BLD-BED-283', '9803 Cedar Smoke Avenue half 0.5 of Room - Bed B', '9803 Cedar Smoke Avenue Apt 4', 'Apt 4', 'Champaign', 'Illinois', 'multi-family', 'vacant', now(), 'after-application', NULL, NULL, NULL, now()),
  ('00000000-0000-4000-c000-0000000c0283', '00000000-0000-4000-b000-000000010283', '00000000-0000-4000-a000-0000000a0283', 'BLD-A5-283', '9803 Cedar Smoke Avenue Apt 5', '9803 Cedar Smoke Avenue', 'Apt 5', 'Champaign', 'Illinois', 'multi-family', 'vacant', now(), 'after-application', 41.0, -87.5, NULL, now()),
  ('00000000-0000-4000-c000-0000000d0283', '00000000-0000-4000-b000-000000010283', '00000000-0000-4000-a000-0000000a0283', 'BLD-NEAR-283', '9803 Cedar Smoke Ave Apt 6', '9803 Cedar Smoke Ave', 'Apt 6', 'Champaign', 'Illinois', 'multi-family', 'vacant', now(), 'after-application', NULL, NULL, NULL, now()),
  ('00000000-0000-4000-c000-0000000e0283', '00000000-0000-4000-b000-000000020283', '00000000-0000-4000-a000-0000000b0283', 'BLD-OTHER-283', 'Another family''s door', '9803 Cedar Smoke Avenue', 'Apt 7', 'Champaign', 'Illinois', 'multi-family', 'vacant', now(), 'after-application', NULL, NULL, NULL, now());

DO $$
DECLARE
  bed   uuid := '00000000-0000-4000-c000-0000000b0283';
  apt5  uuid := '00000000-0000-4000-c000-0000000c0283';
  near  uuid := '00000000-0000-4000-c000-0000000d0283';
  other uuid := '00000000-0000-4000-c000-0000000e0283';
  shelf text;
  r record;
BEGIN
  PERFORM set_config('role', 'anon', true);
  PERFORM set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);

  -- 1. The held bed draws its building's area and lines.
  SELECT * INTO r FROM public_vacancies() v WHERE v.id = bed;
  IF r.id IS NULL THEN RAISE EXCEPTION 'BUILDING AREA SMOKE FAIL: the bed left the shelf'; END IF;
  IF r.area_lat IS DISTINCT FROM 40.125 OR r.area_lng IS DISTINCT FROM -88.26 THEN
    RAISE EXCEPTION 'BUILDING AREA SMOKE FAIL: the held bed has area %,% -- not its building''s 40.125,-88.26', r.area_lat, r.area_lng;
  END IF;
  IF r.nearby IS NULL OR r.nearby->0->>'label' IS DISTINCT FROM 'University of Illinois Main Quad' THEN
    RAISE EXCEPTION 'BUILDING AREA SMOKE FAIL: the held bed has no nearby lines: %', r.nearby;
  END IF;
  SELECT row_to_json(v)::text INTO shelf FROM public_vacancies() v WHERE v.id = bed;
  IF shelf ILIKE '%Cedar Smoke%' OR shelf NOT LIKE '%"street":null%' OR shelf NOT LIKE '%"unit":null%' OR shelf NOT LIKE '%"address_shown":false%' THEN
    RAISE EXCEPTION 'BUILDING AREA SMOKE FAIL: the borrowed area brought the street with it: %', shelf;
  END IF;

  -- 2. A door's own area wins.
  SELECT * INTO r FROM public_vacancies() v WHERE v.id = apt5;
  IF r.area_lat IS DISTINCT FROM 41.0 OR r.area_lng IS DISTINCT FROM -87.5 OR r.nearby IS NOT NULL THEN
    RAISE EXCEPTION 'BUILDING AREA SMOKE FAIL: Apt 5''s own area was replaced: %,% %', r.area_lat, r.area_lng, r.nearby;
  END IF;

  -- 3. Another family on the same street lends nothing.
  SELECT * INTO r FROM public_vacancies() v WHERE v.id = other;
  IF r.area_lat IS NOT NULL OR r.nearby IS NOT NULL THEN
    RAISE EXCEPTION 'BUILDING AREA SMOKE FAIL: another family''s door drew this family''s area';
  END IF;

  -- 4. A near-miss street is not the building (DR-0967: cleaned, never fuzzy).
  SELECT * INTO r FROM public_vacancies() v WHERE v.id = near;
  IF r.area_lat IS NOT NULL THEN
    RAISE EXCEPTION 'BUILDING AREA SMOKE FAIL: "Ave" was guessed to be "Avenue"';
  END IF;

  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claims', '', true);

  -- 5. The key itself.
  IF public.building_key('805 North Prospect Avenue Apt 4', 'Apt 4') <> '805 north prospect avenue'
     OR public.building_key('805 North Prospect Avenue Apt 4', 'Bed B') <> '805 north prospect avenue'
     OR public.building_key('805 North Prospect Avenue', 'Apt 2') <> '805 north prospect avenue'
     OR public.building_key('805 North Prospect Avenue Unit 3', '') <> '805 north prospect avenue' THEN
    RAISE EXCEPTION 'BUILDING AREA SMOKE FAIL: building_key reads % / % / % / %',
      public.building_key('805 North Prospect Avenue Apt 4', 'Apt 4'),
      public.building_key('805 North Prospect Avenue Apt 4', 'Bed B'),
      public.building_key('805 North Prospect Avenue', 'Apt 2'),
      public.building_key('805 North Prospect Avenue Unit 3', '');
  END IF;

  RAISE NOTICE 'BUILDING AREA SMOKE: PASS';
END $$;

ROLLBACK;
