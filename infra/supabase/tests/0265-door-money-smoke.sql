-- =============================================================================
-- 0265 SMOKE — the door keeps its money, with or without a tenant (DR-0903)
-- =============================================================================
-- Runs in CI on a throwaway PostgreSQL (the door-work leg) and on the LIVE
-- database in the rls-isolation poe-properties leg. One transaction; ROLLS
-- BACK. PASS prints 'DOOR MONEY SMOKE: PASS'; any break RAISES.
--
--   the owner records money received on an EMPTY door, months ago     ✔
--   a payment on neither a tenancy nor a door                          ✘
--   a tenant writes a door-level payment (no tenancy)                  ✘
--   a door-level payment in a tenant's name, even by the owner        ✘
--   a payment received on a day that has not come                      ✘
--   a tenant's report finds its door by itself                         ✔
--   a payment naming one door and a tenancy on another                 ✘
--   a door from another instance                                       ✘
--   the door keeps the old tenant's money after a new tenant moves in  ✔
--   the new tenant sees only theirs; the old only theirs; a stranger
--     nothing                                                          ✔ / ✘
--   a reported, unconfirmed payment is never added to "received"      ✔
--   a manager reads a door's money with rentroll.view on THAT door,
--     records with rent.confirm, and nothing without                  ✔ / ✘
--   the clock carries the day it came and the door                     ✔
-- =============================================================================
BEGIN;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000a0265', 'authenticated','authenticated','owner265@test.local','',   now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000b0265', 'authenticated','authenticated','old265@test.local','',     now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000c0265', 'authenticated','authenticated','new265@test.local','',     now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000d0265', 'authenticated','authenticated','mgr265@test.local','',     now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000e0265', 'authenticated','authenticated','stranger265@test.local','',now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  ('00000000-0000-4000-b000-000000010265', 'door-money-smoke-265',  'Door Money Smoke',  'business'),
  ('00000000-0000-4000-b000-000000020265', 'door-money-other-265',  'Door Money Other',  'business')
ON CONFLICT (id) DO NOTHING;
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  ('00000000-0000-4000-b000-000000010265', '00000000-0000-4000-a000-0000000a0265', 'owner', 'Owner')
ON CONFLICT DO NOTHING;
INSERT INTO rentals (id, instance_id, created_by, slug, display_name, address, property_type, status) VALUES
  ('00000000-0000-4000-c000-0000000a0265', '00000000-0000-4000-b000-000000010265', '00000000-0000-4000-a000-0000000a0265', 'DOOR-A-265', 'Door A', '1 A St', 'multi-family', 'occupied'),
  ('00000000-0000-4000-c000-0000000b0265', '00000000-0000-4000-b000-000000010265', '00000000-0000-4000-a000-0000000a0265', 'DOOR-B-265', 'Door B', '2 B St', 'multi-family', 'vacant'),
  ('00000000-0000-4000-c000-0000000c0265', '00000000-0000-4000-b000-000000020265', '00000000-0000-4000-a000-0000000a0265', 'DOOR-X-265', 'Door X', '9 X St', 'multi-family', 'vacant');
INSERT INTO rental_tenancies (id, instance_id, created_by, rental_ref, property_label, tenant_name, tenant_user_id, monthly_rent, deposit, status) VALUES
  ('00000000-0000-4000-c000-0000000e0265', '00000000-0000-4000-b000-000000010265', '00000000-0000-4000-a000-0000000a0265', 'DOOR-A-265', 'Door A', 'Old Tenant', '00000000-0000-4000-a000-0000000b0265', 650, 650, 'ended'),
  ('00000000-0000-4000-c000-0000000f0265', '00000000-0000-4000-b000-000000010265', '00000000-0000-4000-a000-0000000a0265', 'DOOR-A-265', 'Door A', 'New Tenant', '00000000-0000-4000-a000-0000000c0265', 700, 700, 'active');
INSERT INTO delegated_capabilities (instance_id, grantee_user_id, scope_ref, capability, setting, granted_by, role_label) VALUES
  ('00000000-0000-4000-b000-000000010265', '00000000-0000-4000-a000-0000000d0265', 'DOOR-B-265', 'rentroll.view', 'allow', '00000000-0000-4000-a000-0000000a0265', 'manager');

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
    RAISE EXCEPTION 'DOOR MONEY SMOKE FAIL: % (expected succeeds=%, got %)', _label, _should, ok;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION pg_temp.num_as(_who uuid, _sql text) RETURNS numeric LANGUAGE plpgsql AS $$
DECLARE n numeric;
BEGIN
  PERFORM pg_temp.as_user(_who);
  EXECUTE _sql INTO n;
  PERFORM pg_temp.as_postgres();
  RETURN coalesce(n, 0);
END $$;

DO $$
DECLARE
  o     uuid := '00000000-0000-4000-a000-0000000a0265';
  old_t uuid := '00000000-0000-4000-a000-0000000b0265';
  new_t uuid := '00000000-0000-4000-a000-0000000c0265';
  m     uuid := '00000000-0000-4000-a000-0000000d0265';
  s     uuid := '00000000-0000-4000-a000-0000000e0265';
  inst  text := '00000000-0000-4000-b000-000000010265';
  doorA text := '00000000-0000-4000-c000-0000000a0265';
  doorB text := '00000000-0000-4000-c000-0000000b0265';
  doorX text := '00000000-0000-4000-c000-0000000c0265';
  tOld  text := '00000000-0000-4000-c000-0000000e0265';
  tNew  text := '00000000-0000-4000-c000-0000000f0265';
  rB    uuid := '00000000-0000-4000-d000-0000000a0265';
  rOld  uuid := '00000000-0000-4000-d000-0000000b0265';
  rNew  uuid := '00000000-0000-4000-d000-0000000c0265';
  ev    record;
  v     numeric;
BEGIN
  -- 1. Money on an empty door, received long ago, recorded today.
  PERFORM pg_temp.runs(o, format(
    'INSERT INTO rent_records (id, instance_id, rental_id, reported_by, reported_by_role, amount, for_period, method, memo, status, confirmed_at, paid_on)
     VALUES (%L, %L, %L, %L, ''landlord'', 400, ''2025-01'', ''cash'', ''Two weeks, short stay'', ''confirmed'', now(), ''2025-01-15'')', rB, inst, doorB, o),
    'the owner records money received on an empty door', true);
  PERFORM pg_temp.runs(o, format(
    'INSERT INTO rent_records (instance_id, reported_by, reported_by_role, amount, method, status) VALUES (%L, %L, ''landlord'', 10, ''cash'', ''confirmed'')', inst, o),
    'a payment on neither a tenancy nor a door', false);
  PERFORM pg_temp.runs(new_t, format(
    'INSERT INTO rent_records (instance_id, rental_id, reported_by, reported_by_role, amount, method, status) VALUES (%L, %L, %L, ''tenant'', 10, ''cash'', ''reported'')', inst, doorA, new_t),
    'a tenant writes a door-level payment', false);
  PERFORM pg_temp.runs(new_t, format(
    'INSERT INTO rent_records (instance_id, rental_id, reported_by, reported_by_role, amount, method, status) VALUES (%L, %L, %L, ''landlord'', 10, ''cash'', ''confirmed'')', inst, doorA, new_t),
    'a tenant writes a door-level payment calling himself the landlord', false);
  -- The wall under the policies: even the owner cannot file a door-level
  -- payment in a tenant's name (a tenant reports only on their own tenancy).
  PERFORM pg_temp.runs(o, format(
    'INSERT INTO rent_records (instance_id, rental_id, reported_by, reported_by_role, amount, method, status) VALUES (%L, %L, %L, ''tenant'', 10, ''cash'', ''reported'')', inst, doorB, o),
    'a door-level payment in a tenant''s name', false);
  PERFORM pg_temp.runs(o, format(
    'INSERT INTO rent_records (instance_id, rental_id, reported_by, reported_by_role, amount, method, status, paid_on) VALUES (%L, %L, %L, ''landlord'', 10, ''cash'', ''confirmed'', (current_date + 30))', inst, doorB, o),
    'a payment received on a day that has not come', false);

  -- 2. A tenant's report finds its door; a wrong door or a foreign door is refused.
  PERFORM pg_temp.runs(old_t, format(
    'INSERT INTO rent_records (id, instance_id, tenancy_id, reported_by, reported_by_role, amount, for_period, method, status, paid_on)
     VALUES (%L, %L, %L, %L, ''tenant'', 650, ''2025-06'', ''zelle'', ''reported'', ''2025-06-01'')', rOld, inst, tOld, old_t),
    'the old tenant reports June', true);
  IF (SELECT rental_id::text FROM rent_records WHERE id = rOld) IS DISTINCT FROM doorA THEN
    RAISE EXCEPTION 'DOOR MONEY SMOKE FAIL: a tenant''s payment did not find its door';
  END IF;
  PERFORM pg_temp.runs(new_t, format(
    'INSERT INTO rent_records (instance_id, tenancy_id, rental_id, reported_by, reported_by_role, amount, method, status) VALUES (%L, %L, %L, %L, ''tenant'', 10, ''cash'', ''reported'')', inst, tNew, doorB, new_t),
    'a payment naming one door and a tenancy on another', false);
  PERFORM pg_temp.runs(o, format(
    'INSERT INTO rent_records (instance_id, rental_id, reported_by, reported_by_role, amount, method, status) VALUES (%L, %L, %L, ''landlord'', 10, ''cash'', ''confirmed'')', inst, doorX, o),
    'a door from another instance', false);

  -- 3. The owner confirms June; the new tenant reports October (not yet confirmed).
  UPDATE rent_records SET status = 'confirmed', confirmed_at = now() WHERE id = rOld;
  PERFORM pg_temp.runs(new_t, format(
    'INSERT INTO rent_records (id, instance_id, tenancy_id, reported_by, reported_by_role, amount, for_period, method, status)
     VALUES (%L, %L, %L, %L, ''tenant'', 700, ''2026-10'', ''cashapp'', ''reported'')', rNew, inst, tNew, new_t),
    'the new tenant reports October', true);

  -- 4. The door keeps its money across tenants; each person sees their own.
  v := pg_temp.num_as(o, format('SELECT sum(received) FROM door_money_months WHERE rental_id = %L', doorA));
  IF v <> 650 THEN RAISE EXCEPTION 'DOOR MONEY SMOKE FAIL: the owner sees % received on door A, expected 650 (the reported 700 is not received)', v; END IF;
  v := pg_temp.num_as(o, format('SELECT sum(awaiting) FROM door_money_months WHERE rental_id = %L', doorA));
  IF v <> 700 THEN RAISE EXCEPTION 'DOOR MONEY SMOKE FAIL: the owner sees % awaiting on door A, expected 700', v; END IF;
  v := pg_temp.num_as(o, format('SELECT sum(received) FROM door_money_months WHERE rental_id = %L AND month = ''2025-01-01''', doorB));
  IF v <> 400 THEN RAISE EXCEPTION 'DOOR MONEY SMOKE FAIL: the empty door''s January money is %, expected 400 in January 2025', v; END IF;
  v := pg_temp.num_as(new_t, format('SELECT sum(received) + sum(awaiting) FROM door_money_months WHERE rental_id = %L', doorA));
  IF v <> 700 THEN RAISE EXCEPTION 'DOOR MONEY SMOKE FAIL: the new tenant sees % on door A, expected only their own 700', v; END IF;
  v := pg_temp.num_as(old_t, format('SELECT sum(received) + sum(awaiting) FROM door_money_months WHERE rental_id = %L', doorA));
  IF v <> 650 THEN RAISE EXCEPTION 'DOOR MONEY SMOKE FAIL: the old tenant sees % on door A, expected only their own 650', v; END IF;
  v := pg_temp.num_as(s, 'SELECT count(*) FROM door_money_months');
  IF v <> 0 THEN RAISE EXCEPTION 'DOOR MONEY SMOKE FAIL: a stranger reads % door-month rows', v; END IF;
  v := pg_temp.num_as(s, format('SELECT count(*) FROM rent_records WHERE rental_id IN (%L, %L)', doorA, doorB));
  IF v <> 0 THEN RAISE EXCEPTION 'DOOR MONEY SMOKE FAIL: a stranger reads % payments', v; END IF;

  -- 5. A manager: door B by grant, door A not at all, and no writing without rent.confirm.
  v := pg_temp.num_as(m, format('SELECT sum(received) FROM door_money_months WHERE rental_id = %L', doorB));
  IF v <> 400 THEN RAISE EXCEPTION 'DOOR MONEY SMOKE FAIL: the door-B manager sees % on door B, expected 400', v; END IF;
  v := pg_temp.num_as(m, format('SELECT count(*) FROM rent_records WHERE rental_id = %L', doorA));
  IF v <> 0 THEN RAISE EXCEPTION 'DOOR MONEY SMOKE FAIL: the door-B manager reads door A''s money'; END IF;
  PERFORM pg_temp.runs(m, format(
    'INSERT INTO rent_records (instance_id, rental_id, reported_by, reported_by_role, amount, method, status) VALUES (%L, %L, %L, ''manager'', 50, ''cash'', ''confirmed'')', inst, doorB, m),
    'a manager with only rentroll.view records a payment', false);
  INSERT INTO delegated_capabilities (instance_id, grantee_user_id, scope_ref, capability, setting, granted_by, role_label)
    VALUES (inst::uuid, m, 'DOOR-B-265', 'rent.confirm', 'allow', o, 'manager');
  PERFORM pg_temp.runs(m, format(
    'INSERT INTO rent_records (instance_id, rental_id, reported_by, reported_by_role, amount, method, status) VALUES (%L, %L, %L, ''manager'', 50, ''cash'', ''confirmed'')', inst, doorB, m),
    'a manager with rent.confirm on door B records a payment there', true);
  PERFORM pg_temp.runs(m, format(
    'INSERT INTO rent_records (instance_id, rental_id, reported_by, reported_by_role, amount, method, status) VALUES (%L, %L, %L, ''manager'', 50, ''cash'', ''confirmed'')', inst, doorA, m),
    'the door-B manager records a payment on door A', false);

  -- 6. The clock carries the day it came and the door.
  SELECT * INTO ev FROM record_events WHERE subject = 'rent' AND subject_id = rB AND event = 'reported';
  IF ev.id IS NULL OR (ev.detail->>'paid_on') IS DISTINCT FROM '2025-01-15' OR (ev.detail->>'rental_id') IS DISTINCT FROM doorB OR ev.by_user IS DISTINCT FROM o THEN
    RAISE EXCEPTION 'DOOR MONEY SMOKE FAIL: the record of the empty door''s payment is incomplete (%)', ev;
  END IF;
  IF pg_temp.num_as(o, format('SELECT count(*) FROM record_events WHERE subject_id = %L', rB)) <> 1 THEN
    RAISE EXCEPTION 'DOOR MONEY SMOKE FAIL: the owner cannot read the door-level payment''s event';
  END IF;

  RAISE NOTICE 'DOOR MONEY SMOKE: PASS';
END $$;

ROLLBACK;
