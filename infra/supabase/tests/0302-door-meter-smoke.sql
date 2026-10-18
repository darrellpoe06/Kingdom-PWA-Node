-- =============================================================================
-- 0302 SMOKE — a door keeps what its meter said (DR-1098)
-- =============================================================================
-- Runs in CI on a throwaway PostgreSQL (the door-work leg) and on the LIVE
-- database in the rls-isolation poe-properties leg. One transaction; ROLLS
-- BACK. PASS prints 'DOOR METER SMOKE: PASS'; any break RAISES.
--
--   the owner files a meter file and its readings                        ✔
--   an import filed in someone else's name                               ✘
--   a reading pointed at another door's import                           ✘
--   a kWh stored as therms, a zero-length read, a negative amount        ✘
--   the same hour twice is refused; an upsert replaces it                ✔
--   a member reads every reading                                         ✔
--   a VIEWER and a stranger read nothing: hourly reads show who is home  ✔
--   a stranger files nothing                                             ✘
--   the hourly fold sums four quarters into one hour, and says estimated ✔
--   an hour with one uncosted quarter has no cost, never a partial one   ✔
--   a member cannot take back a file; the owner can, readings go with it ✔
-- =============================================================================
BEGIN;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000a0302', 'authenticated','authenticated','owner302@test.local','',   now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000b0302', 'authenticated','authenticated','member302@test.local','',  now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000c0302', 'authenticated','authenticated','viewer302@test.local','',  now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000e0302', 'authenticated','authenticated','stranger302@test.local','',now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  ('00000000-0000-4000-b000-000000010302', 'door-meter-smoke-302', 'Door Meter Smoke', 'business')
ON CONFLICT (id) DO NOTHING;
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  ('00000000-0000-4000-b000-000000010302', '00000000-0000-4000-a000-0000000a0302', 'owner',  'Owner'),
  ('00000000-0000-4000-b000-000000010302', '00000000-0000-4000-a000-0000000b0302', 'member', 'Member'),
  ('00000000-0000-4000-b000-000000010302', '00000000-0000-4000-a000-0000000c0302', 'viewer', 'Viewer')
ON CONFLICT DO NOTHING;
INSERT INTO rentals (id, instance_id, created_by, slug, display_name, address, property_type, status) VALUES
  ('00000000-0000-4000-c000-0000000a0302', '00000000-0000-4000-b000-000000010302', '00000000-0000-4000-a000-0000000a0302', 'HOME-302', 'Home', '1 Home St', 'single-family', 'vacant'),
  ('00000000-0000-4000-c000-0000000b0302', '00000000-0000-4000-b000-000000010302', '00000000-0000-4000-a000-0000000a0302', 'RENT-302', 'Rental', '2 Rent St', 'single-family', 'vacant');

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
    WHEN insufficient_privilege OR check_violation OR raise_exception OR unique_violation OR foreign_key_violation THEN ok := false;
  END;
  PERFORM pg_temp.as_postgres();
  IF ok <> _should THEN
    RAISE EXCEPTION 'DOOR METER SMOKE FAIL: % (expected succeeds=%, got %)', _label, _should, ok;
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
CREATE OR REPLACE FUNCTION pg_temp.text_as(_who uuid, _sql text) RETURNS text LANGUAGE plpgsql AS $$
DECLARE v text;
BEGIN
  PERFORM pg_temp.as_user(_who);
  EXECUTE _sql INTO v;
  PERFORM pg_temp.as_postgres();
  RETURN v;
END $$;

DO $$
DECLARE
  o     uuid := '00000000-0000-4000-a000-0000000a0302';
  m     uuid := '00000000-0000-4000-a000-0000000b0302';
  vw    uuid := '00000000-0000-4000-a000-0000000c0302';
  s     uuid := '00000000-0000-4000-a000-0000000e0302';
  inst  text := '00000000-0000-4000-b000-000000010302';
  home  text := '00000000-0000-4000-c000-0000000a0302';
  rent  text := '00000000-0000-4000-c000-0000000b0302';
  imp   text := '00000000-0000-4000-d000-0000000a0302';
  impR  text := '00000000-0000-4000-d000-0000000b0302';
  n     int;
  v     text;
BEGIN
  -- The owner files a meter file on the home, and another on the rental.
  PERFORM pg_temp.runs(o, format(
    'INSERT INTO property_energy_imports (id, instance_id, rental_ref, file_name, source_format, reading_count, created_by) VALUES (%L, %L, %L, ''ameren.xml'', ''espi-xml'', 5, %L)', imp, inst, home, o),
    'the owner files a meter file', true);
  PERFORM pg_temp.runs(o, format(
    'INSERT INTO property_energy_imports (id, instance_id, rental_ref, file_name, source_format, reading_count, created_by) VALUES (%L, %L, %L, ''rental.csv'', ''csv'', 0, %L)', impR, inst, rent, o),
    'the owner files the rental''s meter file', true);
  PERFORM pg_temp.runs(m, format(
    'INSERT INTO property_energy_imports (instance_id, rental_ref, source_format, reading_count, created_by) VALUES (%L, %L, ''csv'', 0, %L)', inst, home, o),
    'an import filed in someone else''s name', false);

  -- Four quarter-hours (one estimated) and one costed hour, all on the home.
  PERFORM pg_temp.runs(o, format(
    'INSERT INTO property_energy_readings (instance_id, rental_ref, import_id, commodity, direction, start_at, seconds, amount, unit, cost_cents, quality) VALUES '
    || '(%1$L, %2$L, %3$L, ''electricity'', ''delivered'', ''2026-09-01T05:00:00Z'', 900, 100, ''Wh'', 1.5, ''measured''),'
    || '(%1$L, %2$L, %3$L, ''electricity'', ''delivered'', ''2026-09-01T05:15:00Z'', 900, 200, ''Wh'', 3, ''estimated''),'
    || '(%1$L, %2$L, %3$L, ''electricity'', ''delivered'', ''2026-09-01T05:30:00Z'', 900, 300, ''Wh'', 4.5, ''measured''),'
    || '(%1$L, %2$L, %3$L, ''electricity'', ''delivered'', ''2026-09-01T05:45:00Z'', 900, 400, ''Wh'', NULL, ''measured''),'
    || '(%1$L, %2$L, %3$L, ''electricity'', ''delivered'', ''2026-09-01T06:00:00Z'', 3600, 1000, ''Wh'', 15, ''measured'')', inst, home, imp),
    'the owner files the readings', true);

  PERFORM pg_temp.runs(o, format(
    'INSERT INTO property_energy_readings (instance_id, rental_ref, import_id, commodity, direction, start_at, seconds, amount, unit) VALUES (%L, %L, %L, ''electricity'', ''delivered'', ''2026-09-02T05:00:00Z'', 3600, 1, ''Wh'')', inst, home, impR),
    'a reading pointed at another door''s import', false);
  PERFORM pg_temp.runs(o, format(
    'INSERT INTO property_energy_readings (instance_id, rental_ref, import_id, commodity, direction, start_at, seconds, amount, unit) VALUES (%L, %L, %L, ''electricity'', ''delivered'', ''2026-09-02T05:00:00Z'', 3600, 1, ''therm'')', inst, home, imp),
    'a kWh stored as therms', false);
  PERFORM pg_temp.runs(o, format(
    'INSERT INTO property_energy_readings (instance_id, rental_ref, import_id, commodity, direction, start_at, seconds, amount, unit) VALUES (%L, %L, %L, ''electricity'', ''delivered'', ''2026-09-02T05:00:00Z'', 0, 1, ''Wh'')', inst, home, imp),
    'a zero-length read', false);
  PERFORM pg_temp.runs(o, format(
    'INSERT INTO property_energy_readings (instance_id, rental_ref, import_id, commodity, direction, start_at, seconds, amount, unit) VALUES (%L, %L, %L, ''electricity'', ''delivered'', ''2026-09-02T05:00:00Z'', 3600, -1, ''Wh'')', inst, home, imp),
    'a negative amount', false);
  PERFORM pg_temp.runs(o, format(
    'INSERT INTO property_energy_readings (instance_id, rental_ref, import_id, commodity, direction, start_at, seconds, amount, unit) VALUES (%L, %L, %L, ''electricity'', ''delivered'', ''2026-09-01T06:00:00Z'', 3600, 9, ''Wh'')', inst, home, imp),
    'the same hour twice', false);

  -- A newer file's word on an hour replaces the older one (the app's upsert).
  PERFORM pg_temp.runs(m, format(
    'INSERT INTO property_energy_readings (instance_id, rental_ref, import_id, commodity, direction, start_at, seconds, amount, unit, cost_cents) VALUES (%L, %L, %L, ''electricity'', ''delivered'', ''2026-09-01T06:00:00Z'', 3600, 1100, ''Wh'', 16.5) '
    || 'ON CONFLICT (rental_ref, commodity, direction, start_at, seconds) DO UPDATE SET amount = EXCLUDED.amount, cost_cents = EXCLUDED.cost_cents, import_id = EXCLUDED.import_id', inst, home, imp),
    'a member re-imports an hour and it is replaced', true);
  SELECT amount::text INTO v FROM property_energy_readings WHERE rental_ref = home::uuid AND start_at = '2026-09-01T06:00:00Z';
  IF v IS DISTINCT FROM '1100' THEN RAISE EXCEPTION 'DOOR METER SMOKE FAIL: the upsert did not replace the hour (%)', v; END IF;

  -- Who reads.
  n := pg_temp.count_as(m, format('SELECT count(*) FROM property_energy_readings WHERE rental_ref = %L', home));
  IF n <> 5 THEN RAISE EXCEPTION 'DOOR METER SMOKE FAIL: the member read % readings, expected 5', n; END IF;
  n := pg_temp.count_as(vw, format('SELECT count(*) FROM property_energy_readings WHERE rental_ref = %L', home));
  IF n <> 0 THEN RAISE EXCEPTION 'DOOR METER SMOKE FAIL: a viewer read % readings; hourly reads show who is home', n; END IF;
  n := pg_temp.count_as(vw, 'SELECT count(*) FROM property_energy_imports');
  IF n <> 0 THEN RAISE EXCEPTION 'DOOR METER SMOKE FAIL: a viewer read % imports', n; END IF;
  n := pg_temp.count_as(s, 'SELECT count(*) FROM property_energy_readings');
  IF n <> 0 THEN RAISE EXCEPTION 'DOOR METER SMOKE FAIL: a stranger read % readings', n; END IF;
  n := pg_temp.count_as(s, format('SELECT count(*) FROM public.property_energy_hourly(%L)', home));
  IF n <> 0 THEN RAISE EXCEPTION 'DOOR METER SMOKE FAIL: the hourly fold summed % hours for a stranger', n; END IF;
  PERFORM pg_temp.runs(s, format(
    'INSERT INTO property_energy_imports (instance_id, rental_ref, source_format, reading_count, created_by) VALUES (%L, %L, ''csv'', 0, %L)', inst, home, s),
    'a stranger files a meter file', false);
  PERFORM pg_temp.runs(vw, format(
    'INSERT INTO property_energy_imports (instance_id, rental_ref, source_format, reading_count, created_by) VALUES (%L, %L, ''csv'', 0, %L)', inst, home, vw),
    'a viewer files a meter file', false);

  -- The hourly fold.
  v := pg_temp.text_as(m, format(
    'SELECT string_agg(to_char(start_at AT TIME ZONE ''UTC'', ''HH24:MI'') || ''/'' || seconds || ''/'' || amount || ''/'' || coalesce(cost_cents::text, ''none'') || ''/'' || quality, '' '' ORDER BY start_at) FROM public.property_energy_hourly(%L)', home));
  IF v IS DISTINCT FROM '05:00/3600/1000/none/estimated 06:00/3600/1100/16.5/measured' THEN
    RAISE EXCEPTION 'DOOR METER SMOKE FAIL: the hourly fold read "%"', v;
  END IF;
  n := pg_temp.count_as(m, format('SELECT count(*) FROM public.property_energy_hourly(%L, ''2026-09-01T06:00:00Z'')', home));
  IF n <> 1 THEN RAISE EXCEPTION 'DOOR METER SMOKE FAIL: the fold since 06:00 returned % hours, expected 1', n; END IF;

  -- Taking back a file.
  n := pg_temp.count_as(m, format('WITH d AS (DELETE FROM property_energy_imports WHERE id = %L RETURNING 1) SELECT count(*) FROM d', imp));
  IF n <> 0 THEN RAISE EXCEPTION 'DOOR METER SMOKE FAIL: a member took back a file'; END IF;
  n := pg_temp.count_as(m, format('WITH d AS (DELETE FROM property_energy_readings WHERE rental_ref = %L RETURNING 1) SELECT count(*) FROM d', home));
  IF n <> 0 THEN RAISE EXCEPTION 'DOOR METER SMOKE FAIL: a member deleted % readings one by one', n; END IF;
  n := pg_temp.count_as(o, format('WITH d AS (DELETE FROM property_energy_imports WHERE id = %L RETURNING 1) SELECT count(*) FROM d', imp));
  IF n <> 1 THEN RAISE EXCEPTION 'DOOR METER SMOKE FAIL: the owner could not take back a file'; END IF;
  SELECT count(*) INTO n FROM property_energy_readings WHERE rental_ref = home::uuid;
  IF n <> 0 THEN RAISE EXCEPTION 'DOOR METER SMOKE FAIL: % readings outlived the file that owned them', n; END IF;

  RAISE NOTICE 'DOOR METER SMOKE: PASS';
END $$;

ROLLBACK;
