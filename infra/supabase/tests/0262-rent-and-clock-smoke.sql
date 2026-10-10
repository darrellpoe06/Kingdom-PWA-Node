-- =============================================================================
-- 0262 SMOKE — rent is reported the way it is paid; every change keeps its time
-- (DR-0899)
-- =============================================================================
-- Runs in CI on a throwaway PostgreSQL (the door-work leg) and on the LIVE
-- database in the rls-isolation poe-properties leg. One transaction; ROLLS
-- BACK. PASS prints 'RENT AND CLOCK SMOKE: PASS'; any break RAISES.
--
--   the owner writes how he is paid; a tenant cannot                 ✔ / ✘
--   an account number in the deposit line                            ✘
--   a payment link that is not Square; the family's Square link      ✘ / ✔
--   the tenant reads it for their door; a stranger and the other
--     door's tenant read nothing                                     ✔ / ✘
--   the tenant reports a part payment: due, remaining, promise       ✔
--   a remainder larger than what was due                             ✘
--   the report and the owner's confirmation each leave an event,
--     to the instant, with who did it                                ✔
--   the tenant reads their record's events; the other tenant none    ✔ / ✘
--   nobody, the owner included, edits or deletes an event            ✘
--   a work order's filing, move and assignment each leave an event   ✔
-- =============================================================================
BEGIN;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000a0262', 'authenticated','authenticated','owner262@test.local','',   now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000b0262', 'authenticated','authenticated','tenant262@test.local','',  now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000c0262', 'authenticated','authenticated','other262@test.local','',   now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000e0262', 'authenticated','authenticated','stranger262@test.local','',now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  ('00000000-0000-4000-b000-000000010262', 'rent-clock-smoke-262', 'Rent Clock Smoke', 'business')
ON CONFLICT (id) DO NOTHING;
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  ('00000000-0000-4000-b000-000000010262', '00000000-0000-4000-a000-0000000a0262', 'owner', 'Owner')
ON CONFLICT DO NOTHING;
INSERT INTO rentals (id, instance_id, created_by, slug, display_name, address, property_type, status) VALUES
  ('00000000-0000-4000-c000-0000000a0262', '00000000-0000-4000-b000-000000010262', '00000000-0000-4000-a000-0000000a0262', 'DOOR-A-262', 'Door A', '1 A St', 'multi-family', 'occupied'),
  ('00000000-0000-4000-c000-0000000b0262', '00000000-0000-4000-b000-000000010262', '00000000-0000-4000-a000-0000000a0262', 'DOOR-B-262', 'Door B', '2 B St', 'multi-family', 'occupied');
INSERT INTO rental_tenancies (id, instance_id, created_by, rental_ref, property_label, tenant_name, tenant_user_id, monthly_rent, deposit, status) VALUES
  ('00000000-0000-4000-c000-0000000e0262', '00000000-0000-4000-b000-000000010262', '00000000-0000-4000-a000-0000000a0262', 'DOOR-A-262', 'Door A', 'Tenant A', '00000000-0000-4000-a000-0000000b0262', 680, 680, 'active'),
  ('00000000-0000-4000-c000-0000000f0262', '00000000-0000-4000-b000-000000010262', '00000000-0000-4000-a000-0000000a0262', 'DOOR-B-262', 'Door B', 'Tenant B', '00000000-0000-4000-a000-0000000c0262', 700, 700, 'active');

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
    RAISE EXCEPTION 'RENT AND CLOCK SMOKE FAIL: % (expected succeeds=%, got %)', _label, _should, ok;
  END IF;
END $$;

-- An UPDATE or DELETE that RLS filters to zero rows is a refusal too.
CREATE OR REPLACE FUNCTION pg_temp.changes(_who uuid, _sql text) RETURNS int LANGUAGE plpgsql AS $$
DECLARE n int := 0;
BEGIN
  PERFORM pg_temp.as_user(_who);
  BEGIN
    EXECUTE _sql;
    GET DIAGNOSTICS n = ROW_COUNT;
  EXCEPTION WHEN insufficient_privilege THEN n := 0;
  END;
  PERFORM pg_temp.as_postgres();
  RETURN n;
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
  o    uuid := '00000000-0000-4000-a000-0000000a0262';
  t    uuid := '00000000-0000-4000-a000-0000000b0262';
  t2   uuid := '00000000-0000-4000-a000-0000000c0262';
  s    uuid := '00000000-0000-4000-a000-0000000e0262';
  inst text := '00000000-0000-4000-b000-000000010262';
  ta   text := '00000000-0000-4000-c000-0000000e0262';
  doorA text := '00000000-0000-4000-c000-0000000a0262';
  rr   uuid := '00000000-0000-4000-d000-0000000a0262';
  wo   uuid := '00000000-0000-4000-d000-0000000b0262';
  ev   record;
  n    int;
BEGIN
  -- 1. How the landlord is paid: his to write, never an account number.
  PERFORM pg_temp.runs(t, format('INSERT INTO rent_payee (instance_id, cashtag) VALUES (%L, ''$Thief'')', inst), 'a tenant writes the payee', false);
  PERFORM pg_temp.runs(o, format('INSERT INTO rent_payee (instance_id, cashtag, zelle_to, deposit_note) VALUES (%L, ''$PoeProperties'', ''(555) 010-0100'', ''Account 123456789 at Chase'')', inst),
    'an account number in the deposit line', false);
  PERFORM pg_temp.runs(o, format('INSERT INTO rent_payee (instance_id, cashtag, zelle_to, deposit_note, cash_note) VALUES (%L, ''$PoeProperties'', ''(555) 010-0100'', ''Deposit at any Chase branch to Poe Properties LLC'', ''Hand it to Darrell, get a receipt'')', inst),
    'the owner writes how he is paid', true);

  -- 1b. Square: the family's own payment link, a Square address and nothing else.
  PERFORM pg_temp.runs(o, format('UPDATE rent_payee SET square_link = ''https://evil.example/pay'' WHERE instance_id = %L', inst),
    'a payment link that is not Square', false);
  PERFORM pg_temp.runs(o, format('UPDATE rent_payee SET square_link = ''https://square.link/u/PoeRent1'' WHERE instance_id = %L', inst),
    'the family sets its Square payment link', true);

  -- 2. The tenant reads it for their door; nobody outside does.
  IF pg_temp.count_as(t, format('SELECT count(*)::int FROM public.rent_payee_for_tenancy(%L)', ta)) <> 1 THEN RAISE EXCEPTION 'RENT AND CLOCK SMOKE FAIL: the tenant cannot read how to pay'; END IF;
  IF pg_temp.count_as(t, format('SELECT count(*)::int FROM public.rent_payee_for_tenancy(%L) WHERE square_link = ''https://square.link/u/PoeRent1''', ta)) <> 1 THEN RAISE EXCEPTION 'RENT AND CLOCK SMOKE FAIL: the tenant cannot read the Square link'; END IF;
  IF pg_temp.count_as(t2, format('SELECT count(*)::int FROM public.rent_payee_for_tenancy(%L)', ta)) <> 0 THEN RAISE EXCEPTION 'RENT AND CLOCK SMOKE FAIL: another door''s tenant reads it through door A'; END IF;
  IF pg_temp.count_as(s, format('SELECT count(*)::int FROM public.rent_payee_for_tenancy(%L)', ta)) <> 0 THEN RAISE EXCEPTION 'RENT AND CLOCK SMOKE FAIL: a stranger reads it'; END IF;
  IF pg_temp.count_as(t, 'SELECT count(*)::int FROM rent_payee') <> 0 THEN RAISE EXCEPTION 'RENT AND CLOCK SMOKE FAIL: a tenant reads the payee table directly'; END IF;

  -- 3. A part payment is recorded with what remains and when.
  PERFORM pg_temp.runs(t, format(
    'INSERT INTO rent_records (id, instance_id, tenancy_id, reported_by, reported_by_role, amount, for_period, method, memo, status, due_amount, remaining_after, rest_promised_on, reported_on_device_at)
     VALUES (%L, %L, %L, %L, ''tenant'', 300, ''2026-10'', ''cashapp'', ''Rest on payday'', ''reported'', 680, 380, ''2026-10-20'', ''2026-10-10T12:00:00Z'')', rr, inst, ta, t),
    'the tenant reports a part payment', true);
  PERFORM pg_temp.runs(t, format(
    'INSERT INTO rent_records (instance_id, tenancy_id, reported_by, reported_by_role, amount, for_period, method, status, due_amount, remaining_after)
     VALUES (%L, %L, %L, ''tenant'', 10, ''2026-10'', ''cash'', ''reported'', 680, 900)', inst, ta, t),
    'a remainder larger than what was due', false);

  -- 4. Every change keeps its time and its hand.
  SELECT * INTO ev FROM record_events WHERE subject = 'rent' AND subject_id = rr AND event = 'reported';
  IF ev.id IS NULL OR ev.by_user IS DISTINCT FROM t OR (ev.detail->>'remaining_after')::numeric <> 380 OR ev.detail->>'rest_promised_on' <> '2026-10-20' THEN
    RAISE EXCEPTION 'RENT AND CLOCK SMOKE FAIL: the report left no complete event (%)', ev;
  END IF;
  n := pg_temp.changes(o, format('UPDATE rent_records SET status = ''confirmed'', confirmed_at = now() WHERE id = %L', rr));
  IF n <> 1 THEN RAISE EXCEPTION 'RENT AND CLOCK SMOKE FAIL: the owner could not confirm'; END IF;
  SELECT * INTO ev FROM record_events WHERE subject = 'rent' AND subject_id = rr AND event = 'status';
  IF ev.id IS NULL OR ev.from_value <> 'reported' OR ev.to_value <> 'confirmed' OR ev.by_user IS DISTINCT FROM o THEN
    RAISE EXCEPTION 'RENT AND CLOCK SMOKE FAIL: the confirmation left no event (%)', ev;
  END IF;

  -- 5. The events are read where the record is read.
  IF pg_temp.count_as(t, format('SELECT count(*)::int FROM record_events WHERE subject_id = %L', rr)) <> 2 THEN RAISE EXCEPTION 'RENT AND CLOCK SMOKE FAIL: the tenant cannot read their record''s events'; END IF;
  IF pg_temp.count_as(t2, format('SELECT count(*)::int FROM record_events WHERE subject_id = %L', rr)) <> 0 THEN RAISE EXCEPTION 'RENT AND CLOCK SMOKE FAIL: another tenant reads them'; END IF;
  IF pg_temp.count_as(o, format('SELECT count(*)::int FROM record_events WHERE subject_id = %L', rr)) <> 2 THEN RAISE EXCEPTION 'RENT AND CLOCK SMOKE FAIL: the owner cannot read them'; END IF;

  -- 6. Nobody rewrites the clock.
  IF pg_temp.changes(o, format('UPDATE record_events SET event = ''nothing happened'' WHERE subject_id = %L', rr)) <> 0 THEN RAISE EXCEPTION 'RENT AND CLOCK SMOKE FAIL: the owner edited an event'; END IF;
  IF pg_temp.changes(o, format('DELETE FROM record_events WHERE subject_id = %L', rr)) <> 0 THEN RAISE EXCEPTION 'RENT AND CLOCK SMOKE FAIL: the owner deleted an event'; END IF;

  -- 7. A work order's life keeps its time too.
  PERFORM pg_temp.runs(o, format(
    'INSERT INTO tenant_maintenance_requests (id, instance_id, rental_id, created_by, created_by_role, title) VALUES (%L, %L, %L, %L, ''landlord'', ''Exhaust fan'')', wo, inst, doorA, o),
    'the owner files a work order', true);
  n := pg_temp.changes(o, format('UPDATE tenant_maintenance_requests SET status = ''scheduled'', assigned_to_label = ''Mike'' WHERE id = %L', wo));
  IF (SELECT count(*) FROM record_events WHERE subject = 'work' AND subject_id = wo) <> 3 THEN
    RAISE EXCEPTION 'RENT AND CLOCK SMOKE FAIL: filing, scheduling and assigning should be three events, saw %',
      (SELECT count(*) FROM record_events WHERE subject = 'work' AND subject_id = wo);
  END IF;

  RAISE NOTICE 'RENT AND CLOCK SMOKE: PASS';
END $$;

ROLLBACK;
