-- =============================================================================
-- 0267 SMOKE — a system keeps its pictures (DR-0932)
-- =============================================================================
-- Runs in CI on a throwaway PostgreSQL (the door-work leg) and on the LIVE
-- database in the rls-isolation poe-properties leg. One transaction; ROLLS
-- BACK. PASS prints 'SYSTEM PICTURES SMOKE: PASS'; any break RAISES.
--
--   the owner files a picture of the furnace on its door                ✔
--   a picture naming a furnace on another door                          ✘
--   a picture of a service visit finds its system and its door by itself ✔
--   a picture naming a service visit that does not exist                ✘
--   the 'system' kind is a kind; a made-up kind is not                  ✔ / ✘
--   a stranger reads no system picture                                  ✔
-- =============================================================================
BEGIN;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000a0267', 'authenticated','authenticated','owner267@test.local','',   now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000e0267', 'authenticated','authenticated','stranger267@test.local','',now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  ('00000000-0000-4000-b000-000000010267', 'system-pictures-smoke-267', 'System Pictures Smoke', 'business')
ON CONFLICT (id) DO NOTHING;
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  ('00000000-0000-4000-b000-000000010267', '00000000-0000-4000-a000-0000000a0267', 'owner', 'Owner')
ON CONFLICT DO NOTHING;
INSERT INTO rentals (id, instance_id, created_by, slug, display_name, address, property_type, status) VALUES
  ('00000000-0000-4000-c000-0000000a0267', '00000000-0000-4000-b000-000000010267', '00000000-0000-4000-a000-0000000a0267', 'DOOR-A-267', 'Door A', '805 A St', 'multi-family', 'vacant'),
  ('00000000-0000-4000-c000-0000000b0267', '00000000-0000-4000-b000-000000010267', '00000000-0000-4000-a000-0000000a0267', 'DOOR-B-267', 'Door B', '806 B St', 'multi-family', 'vacant');
INSERT INTO property_systems (id, instance_id, rental_ref, name, kind) VALUES
  ('00000000-0000-4000-d000-0000000a0267', '00000000-0000-4000-b000-000000010267', '00000000-0000-4000-c000-0000000a0267', 'Furnace', 'other'),
  ('00000000-0000-4000-d000-0000000b0267', '00000000-0000-4000-b000-000000010267', '00000000-0000-4000-c000-0000000b0267', 'Furnace', 'other');
INSERT INTO property_system_events (id, instance_id, system_ref, rental_ref, kind, event_date, summary) VALUES
  ('00000000-0000-4000-d000-0000000c0267', '00000000-0000-4000-b000-000000010267', '00000000-0000-4000-d000-0000000a0267', '00000000-0000-4000-c000-0000000a0267', 'serviced', '2026-10-01', 'Annual service');

CREATE OR REPLACE FUNCTION pg_temp.as_user(_who uuid) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role', 'authenticated')::text, true);
END $$;
CREATE OR REPLACE FUNCTION pg_temp.as_postgres() RETURNS void LANGUAGE plpgsql AS $$
BEGIN PERFORM set_config('role', 'postgres', true); END $$;
CREATE OR REPLACE FUNCTION pg_temp.runs(_who uuid, _sql text, _label text, _should boolean)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE ok boolean := true;
BEGIN
  PERFORM pg_temp.as_user(_who);
  BEGIN
    EXECUTE _sql;
  EXCEPTION
    WHEN insufficient_privilege OR check_violation OR raise_exception THEN ok := false;
  END;
  PERFORM pg_temp.as_postgres();
  IF ok <> _should THEN
    RAISE EXCEPTION 'SYSTEM PICTURES SMOKE FAIL: % (expected succeeds=%, got %)', _label, _should, ok;
  END IF;
END $$;
CREATE OR REPLACE FUNCTION pg_temp.count_as(_who uuid, _sql text) RETURNS int LANGUAGE plpgsql AS $$
DECLARE n int;
BEGIN
  PERFORM pg_temp.as_user(_who);
  EXECUTE _sql INTO n;
  PERFORM pg_temp.as_postgres();
  RETURN n;
END $$;

DO $$
DECLARE
  o     uuid := '00000000-0000-4000-a000-0000000a0267';
  s     uuid := '00000000-0000-4000-a000-0000000e0267';
  inst  text := '00000000-0000-4000-b000-000000010267';
  doorA text := '00000000-0000-4000-c000-0000000a0267';
  furnA text := '00000000-0000-4000-d000-0000000a0267';
  furnB text := '00000000-0000-4000-d000-0000000b0267';
  visit text := '00000000-0000-4000-d000-0000000c0267';
  p1    uuid := '00000000-0000-4000-e000-0000000a0267';
  p2    uuid := '00000000-0000-4000-e000-0000000b0267';
  v     text;
BEGIN
  PERFORM pg_temp.runs(o, format(
    'INSERT INTO property_photos (id, instance_id, rental_ref, kind, caption, storage_path, system_id) VALUES (%L, %L, %L, ''system'', ''Data plate'', ''data:image/jpeg;base64,AAAA'', %L)', p1, inst, doorA, furnA),
    'the owner files a picture of the furnace on its door', true);
  PERFORM pg_temp.runs(o, format(
    'INSERT INTO property_photos (instance_id, rental_ref, kind, caption, storage_path, system_id) VALUES (%L, %L, ''system'', ''Wrong door'', ''data:image/jpeg;base64,AAAA'', %L)', inst, doorA, furnB),
    'a picture naming a furnace on another door', false);
  PERFORM pg_temp.runs(o, format(
    'INSERT INTO property_photos (id, instance_id, kind, caption, storage_path, system_event_id) VALUES (%L, %L, ''system'', ''After the service'', ''data:image/jpeg;base64,AAAA'', %L)', p2, inst, visit),
    'a picture of a service visit', true);
  SELECT system_id::text || '|' || rental_ref::text INTO v FROM property_photos WHERE id = p2;
  IF v IS DISTINCT FROM (furnA || '|' || doorA) THEN RAISE EXCEPTION 'SYSTEM PICTURES SMOKE FAIL: the visit''s picture did not find its system and door (%)', v; END IF;
  PERFORM pg_temp.runs(o, format(
    'INSERT INTO property_photos (instance_id, rental_ref, kind, caption, storage_path, system_event_id) VALUES (%L, %L, ''system'', ''Ghost'', ''data:image/jpeg;base64,AAAA'', gen_random_uuid())', inst, doorA),
    'a picture naming a service visit that does not exist', false);
  PERFORM pg_temp.runs(o, format(
    'INSERT INTO property_photos (instance_id, rental_ref, kind, caption, storage_path) VALUES (%L, %L, ''selfie'', ''x'', ''data:image/jpeg;base64,AAAA'')', inst, doorA),
    'a made-up kind', false);
  IF pg_temp.count_as(o, format('SELECT count(*)::int FROM property_photos WHERE system_id = %L', furnA)) <> 2 THEN RAISE EXCEPTION 'SYSTEM PICTURES SMOKE FAIL: the owner does not see both furnace pictures'; END IF;
  IF pg_temp.count_as(s, format('SELECT count(*)::int FROM property_photos WHERE system_id = %L', furnA)) <> 0 THEN RAISE EXCEPTION 'SYSTEM PICTURES SMOKE FAIL: a stranger reads the furnace pictures'; END IF;

  RAISE NOTICE 'SYSTEM PICTURES SMOKE: PASS';
END $$;

ROLLBACK;
