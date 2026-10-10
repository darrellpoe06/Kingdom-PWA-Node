-- =============================================================================
-- 0270 SMOKE — the public shelf shows the area on a map, never the street (DR-0935)
-- =============================================================================
-- Runs in CI on a throwaway PostgreSQL (the door-work leg) and on the LIVE
-- database in the rls-isolation poe-properties leg. One transaction; ROLLS
-- BACK. PASS prints 'AREA MAP SMOKE: PASS'; any break RAISES.
--
--   the family sends the exact point; the database keeps only the area      ✔
--   half an area (latitude with no longitude)                               ✘
--   a nearby list of the wrong shape (not a list, 13 lines, empty label,
--     200 miles, miles as text, an extra key)                               ✘
--   a nearby line that names this door's street, any case                   ✘
--   a stranger to the door moves its area                                   ✘ (nothing changes)
--   the public shelf: the rounded area and the lines, never the street      ✔
-- =============================================================================
BEGIN;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000a0270', 'authenticated','authenticated','owner270@test.local','',   now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000e0270', 'authenticated','authenticated','stranger270@test.local','',now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  ('00000000-0000-4000-b000-000000010270', 'area-smoke-270', 'Area Smoke', 'business')
ON CONFLICT (id) DO NOTHING;
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  ('00000000-0000-4000-b000-000000010270', '00000000-0000-4000-a000-0000000a0270', 'owner', 'Owner')
ON CONFLICT DO NOTHING;
INSERT INTO rentals (id, instance_id, created_by, slug, display_name, address, city, state, property_type, status, listed_at, offering, nightly_rate) VALUES
  ('00000000-0000-4000-c000-0000000a0270', '00000000-0000-4000-b000-000000010270', '00000000-0000-4000-a000-0000000a0270', 'AREA-A-270', 'Area A', '9805 Zeta Smoke Avenue', 'Champaign', 'Illinois', 'multi-family', 'vacant', now(), 'short-term', 150);

CREATE OR REPLACE FUNCTION pg_temp.as_user(_who uuid) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role', 'authenticated')::text, true);
END $$;
CREATE OR REPLACE FUNCTION pg_temp.as_anon() RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('role', 'anon', true);
  PERFORM set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
END $$;
CREATE OR REPLACE FUNCTION pg_temp.as_postgres() RETURNS void LANGUAGE plpgsql AS $$
BEGIN PERFORM set_config('role', 'postgres', true); PERFORM set_config('request.jwt.claims', '', true); END $$;

-- Does _sql run for _who? Refusals by privilege, CHECK or RAISE count as "no".
CREATE OR REPLACE FUNCTION pg_temp.runs(_who uuid, _sql text, _label text, _should boolean)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE ok boolean := true;
BEGIN
  IF _who IS NULL THEN PERFORM pg_temp.as_anon(); ELSE PERFORM pg_temp.as_user(_who); END IF;
  BEGIN
    EXECUTE _sql;
  EXCEPTION
    WHEN insufficient_privilege OR check_violation OR raise_exception THEN ok := false;
  END;
  PERFORM pg_temp.as_postgres();
  IF ok IS DISTINCT FROM _should THEN
    RAISE EXCEPTION 'AREA MAP SMOKE FAIL: % (expected %, got %)', _label,
      CASE WHEN _should THEN 'allowed' ELSE 'refused' END, CASE WHEN ok THEN 'allowed' ELSE 'refused' END;
  END IF;
END $$;

DO $$
DECLARE
  o uuid := '00000000-0000-4000-a000-0000000a0270';
  s uuid := '00000000-0000-4000-a000-0000000e0270';
  d uuid := '00000000-0000-4000-c000-0000000a0270';
  upd text := 'UPDATE rentals SET %s WHERE id = ''00000000-0000-4000-c000-0000000a0270''';
  shelf text;
BEGIN
  -- 1. The exact point goes in; only the area stays.
  PERFORM pg_temp.runs(o, format(upd, 'area_lat = 40.123364, area_lng = -88.25828'), 'the family sets the area', true);
  IF (SELECT area_lat FROM rentals WHERE id = d) IS DISTINCT FROM 40.125
     OR (SELECT area_lng FROM rentals WHERE id = d) IS DISTINCT FROM -88.26 THEN
    RAISE EXCEPTION 'AREA MAP SMOKE FAIL: the exact point was kept (%, %), not the rounded area',
      (SELECT area_lat FROM rentals WHERE id = d), (SELECT area_lng FROM rentals WHERE id = d);
  END IF;

  -- 2. Half an area.
  PERFORM pg_temp.runs(o, format(upd, 'area_lng = NULL'), 'a latitude with no longitude', false);

  -- 3. The shape of the nearby list.
  PERFORM pg_temp.runs(o, format(upd, $q$nearby = '{"label":"Campus","miles":2}'$q$), 'nearby that is not a list', false);
  PERFORM pg_temp.runs(o, format(upd, format('nearby = %L', (SELECT jsonb_agg(jsonb_build_object('label', 'Place ' || g, 'miles', g)) FROM generate_series(1, 13) g))), 'thirteen nearby lines', false);
  PERFORM pg_temp.runs(o, format(upd, $q$nearby = '[{"label":"  ","miles":1}]'$q$), 'a nearby line with no words', false);
  PERFORM pg_temp.runs(o, format(upd, $q$nearby = '[{"label":"The moon","miles":200}]'$q$), 'a nearby line 200 miles away', false);
  PERFORM pg_temp.runs(o, format(upd, $q$nearby = '[{"label":"Campus","miles":"2"}]'$q$), 'miles written as text', false);
  PERFORM pg_temp.runs(o, format(upd, $q$nearby = '[{"label":"Campus","miles":2,"lat":40.1}]'$q$), 'a nearby line carrying a coordinate', false);
  PERFORM pg_temp.runs(o, format(upd, $q$nearby = '[{"label":"University of Illinois Main Quad","miles":2.0},{"label":"Target","miles":1.3}]'$q$), 'the family states what is nearby', true);

  -- 4. Never the street, in any case.
  PERFORM pg_temp.runs(o, format(upd, $q$nearby = '[{"label":"Cafes up zeta smoke avenue","miles":0.2}]'$q$), 'a nearby line that names this door''s street', false);

  -- 5. A stranger to the door moves nothing.
  PERFORM pg_temp.as_user(s);
  UPDATE rentals SET area_lat = 41, area_lng = -87 WHERE id = d;
  PERFORM pg_temp.as_postgres();
  IF (SELECT area_lat FROM rentals WHERE id = d) IS DISTINCT FROM 40.125 THEN
    RAISE EXCEPTION 'AREA MAP SMOKE FAIL: a stranger moved the door''s area';
  END IF;

  -- 6. The public shelf: the area and the lines, never the street.
  PERFORM pg_temp.as_anon();
  SELECT row_to_json(v)::text INTO shelf FROM public_vacancies() v WHERE v.id = d;
  PERFORM pg_temp.as_postgres();
  IF shelf IS NULL THEN RAISE EXCEPTION 'AREA MAP SMOKE FAIL: the listed door is not on the shelf'; END IF;
  IF shelf NOT LIKE '%"area_lat":40.125%' OR shelf NOT LIKE '%"area_lng":-88.26%' THEN
    RAISE EXCEPTION 'AREA MAP SMOKE FAIL: the shelf does not carry the rounded area: %', shelf;
  END IF;
  IF shelf NOT LIKE '%University of Illinois Main Quad%' THEN
    RAISE EXCEPTION 'AREA MAP SMOKE FAIL: the shelf does not carry the nearby lines';
  END IF;
  IF shelf ILIKE '%Zeta Smoke%' OR shelf LIKE '%40.1233%' THEN
    RAISE EXCEPTION 'AREA MAP SMOKE FAIL: the shelf carries the street or the exact point: %', shelf;
  END IF;

  RAISE NOTICE 'AREA MAP SMOKE: PASS';
END $$;

ROLLBACK;
