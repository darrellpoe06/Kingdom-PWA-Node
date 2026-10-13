-- =============================================================================
-- 0261 SMOKE — a guest reports a problem from inside the door (DR-0898)
-- =============================================================================
-- Runs in CI on a throwaway PostgreSQL (the door-work leg) and on the LIVE
-- database in the rls-isolation poe-properties leg. One transaction; ROLLS
-- BACK. PASS prints 'GUEST REPORT SMOKE: PASS'; any break RAISES.
--
--   a worker opens a guest link                                  ✘
--   the owner opens one; the family reads it; a worker, a tenant
--     and anon do not                                            ✔ / ✘
--   anon sees which door (label only) with the token; nothing
--     with a wrong one                                           ✔ / ✘
--   anon files a report: it lands on the door, as 'guest', with
--     no tenancy and no account, and the office push names the
--     door, never the guest's words                              ✔
--   anon reads the board                                         ✘
--   an empty title; a wrong token                                ✘
--   the sixth report in an hour                                  ✘
--   the worker granted that door reads the guest's report        ✔
--   replacing the link kills the old card; closing kills it all  ✘
-- =============================================================================
BEGIN;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000a0261', 'authenticated','authenticated','owner261@test.local','',  now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000b0261', 'authenticated','authenticated','worker261@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000d0261', 'authenticated','authenticated','tenant261@test.local','', now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  ('00000000-0000-4000-b000-000000010261', 'guest-report-smoke-261', 'Guest Report Smoke', 'business')
ON CONFLICT (id) DO NOTHING;
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  ('00000000-0000-4000-b000-000000010261', '00000000-0000-4000-a000-0000000a0261', 'owner', 'Owner')
ON CONFLICT DO NOTHING;
INSERT INTO rentals (id, instance_id, created_by, slug, display_name, address, unit, property_type, status) VALUES
  ('00000000-0000-4000-c000-0000000a0261', '00000000-0000-4000-b000-000000010261', '00000000-0000-4000-a000-0000000a0261',
   'STAY-261', 'The Short Stay', '9 Secret Street', 'Apt 2', 'multi-family', 'vacant'),
  ('00000000-0000-4000-c000-0000000c0261', '00000000-0000-4000-b000-000000010261', '00000000-0000-4000-a000-0000000a0261',
   'RENTED-261', 'Rented Door', '8 Rented Rd', NULL, 'multi-family', 'occupied');
INSERT INTO rental_tenancies (id, instance_id, created_by, rental_ref, property_label, tenant_name, tenant_user_id, monthly_rent, deposit, status) VALUES
  ('00000000-0000-4000-c000-0000000e0261', '00000000-0000-4000-b000-000000010261', '00000000-0000-4000-a000-0000000a0261',
   'RENTED-261', 'Rented Door', 'Tenant', '00000000-0000-4000-a000-0000000d0261', 900, 900, 'active');
INSERT INTO delegated_capabilities (instance_id, grantee_user_id, scope_ref, capability, setting, granted_by, role_label) VALUES
  ('00000000-0000-4000-b000-000000010261', '00000000-0000-4000-a000-0000000b0261', 'STAY-261', 'docs.add', 'allow', '00000000-0000-4000-a000-0000000a0261', 'field_worker');

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
BEGIN PERFORM set_config('role', 'postgres', true); END $$;

-- Run _sql as _who (NULL = anon). A refusal is RLS/grant (42501), a CHECK or
-- a RAISE; anything else propagates, so a broken smoke never reads as a wall.
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
  IF ok <> _should THEN
    RAISE EXCEPTION 'GUEST REPORT SMOKE FAIL: % (expected succeeds=%, got %)', _label, _should, ok;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION pg_temp.count_as(_who uuid, _sql text) RETURNS int LANGUAGE plpgsql AS $$
DECLARE n int;
BEGIN
  IF _who IS NULL THEN PERFORM pg_temp.as_anon(); ELSE PERFORM pg_temp.as_user(_who); END IF;
  EXECUTE _sql INTO n;
  PERFORM pg_temp.as_postgres();
  RETURN n;
END $$;

-- Anon sees NOTHING: refused outright, or allowed to ask and shown no rows.
-- Either is the wall; production grants differ from a bare PostgreSQL's.
CREATE OR REPLACE FUNCTION pg_temp.anon_sees_none(_sql text, _label text) RETURNS void LANGUAGE plpgsql AS $$
DECLARE n int;
BEGIN
  PERFORM pg_temp.as_anon();
  BEGIN
    EXECUTE _sql INTO n;
  EXCEPTION WHEN insufficient_privilege THEN n := 0;
  END;
  PERFORM pg_temp.as_postgres();
  IF n <> 0 THEN RAISE EXCEPTION 'GUEST REPORT SMOKE FAIL: % (anon saw % rows)', _label, n; END IF;
END $$;

CREATE OR REPLACE FUNCTION pg_temp.open_as(_who uuid, _rental uuid) RETURNS text LANGUAGE plpgsql AS $$
DECLARE t text;
BEGIN
  PERFORM pg_temp.as_user(_who);
  t := public.door_guest_link_open(_rental);
  PERFORM pg_temp.as_postgres();
  RETURN t;
END $$;

DO $$
DECLARE
  o    uuid := '00000000-0000-4000-a000-0000000a0261';
  w    uuid := '00000000-0000-4000-a000-0000000b0261';
  n    uuid := '00000000-0000-4000-a000-0000000d0261';
  stay uuid := '00000000-0000-4000-c000-0000000a0261';
  tok  text;
  tok2 text;
  lbl  text;
  row  record;
  push record;
  i    int;
BEGIN
  -- 1. Only the family opens a link.
  PERFORM pg_temp.runs(w, format('SELECT public.door_guest_link_open(%L)', stay), 'a worker opens a guest link', false);
  tok := pg_temp.open_as(o, stay);
  IF tok !~ '^[0-9a-f]{64}$' THEN RAISE EXCEPTION 'GUEST REPORT SMOKE FAIL: the token is not 64 hex characters (%)', tok; END IF;

  -- 2. Only the family reads it.
  IF pg_temp.count_as(o, 'SELECT count(*)::int FROM door_guest_links') <> 1 THEN RAISE EXCEPTION 'GUEST REPORT SMOKE FAIL: the owner cannot read the link'; END IF;
  IF pg_temp.count_as(w, 'SELECT count(*)::int FROM door_guest_links') <> 0 THEN RAISE EXCEPTION 'GUEST REPORT SMOKE FAIL: a worker reads the link'; END IF;
  IF pg_temp.count_as(n, 'SELECT count(*)::int FROM door_guest_links') <> 0 THEN RAISE EXCEPTION 'GUEST REPORT SMOKE FAIL: a tenant reads the link'; END IF;
  PERFORM pg_temp.anon_sees_none('SELECT count(*)::int FROM door_guest_links', 'anon reads the link table');

  -- 3. The guest sees which door, and nothing else.
  PERFORM pg_temp.as_anon();
  SELECT label INTO lbl FROM public.guest_report_door(tok);
  PERFORM pg_temp.as_postgres();
  IF lbl IS DISTINCT FROM 'The Short Stay' THEN RAISE EXCEPTION 'GUEST REPORT SMOKE FAIL: the guest sees % for the door', lbl; END IF;
  IF pg_temp.count_as(NULL, format('SELECT count(*)::int FROM public.guest_report_door(%L)', repeat('0', 64))) <> 0 THEN
    RAISE EXCEPTION 'GUEST REPORT SMOKE FAIL: a wrong token names a door';
  END IF;

  -- 4. The guest files a report.
  PERFORM pg_temp.runs(NULL, format(
    'SELECT public.guest_report_problem(%L, %L, %L, %L, %L, true)', tok, 'Exhaust fan rattles', 'Loud all night', 'Ana', '555-0100'),
    'anon files a report with the token', true);
  SELECT * INTO row FROM tenant_maintenance_requests WHERE rental_id = stay AND created_by_role = 'guest';
  IF row.id IS NULL OR row.tenancy_id IS NOT NULL OR row.created_by IS NOT NULL OR row.priority <> 'urgent'
     OR row.detail NOT LIKE '%Reported by a guest (Ana, 555-0100).%' THEN
    RAISE EXCEPTION 'GUEST REPORT SMOKE FAIL: the report did not land as a guest row on the door (%)', row;
  END IF;
  SELECT * INTO push FROM push_outbox WHERE kind = 'door_guest_report' AND instance_id = '00000000-0000-4000-b000-000000010261';
  IF push.id IS NULL OR push.body NOT LIKE '%The Short Stay%' OR push.body LIKE '%Exhaust%' OR push.body LIKE '%Ana%' THEN
    RAISE EXCEPTION 'GUEST REPORT SMOKE FAIL: the office push is missing or carries the guest''s words (%)', push;
  END IF;

  -- 5. The guest reads nothing back.
  PERFORM pg_temp.anon_sees_none('SELECT count(*)::int FROM tenant_maintenance_requests', 'anon reads the work board');

  -- 6. Junk and wrong keys are refused.
  PERFORM pg_temp.runs(NULL, format('SELECT public.guest_report_problem(%L, %L)', tok, ' '), 'an empty title', false);
  PERFORM pg_temp.runs(NULL, format('SELECT public.guest_report_problem(%L, %L)', repeat('0', 64), 'Prank'), 'a wrong token', false);

  -- 7. Five an hour, then the guest is told to call.
  FOR i IN 2..5 LOOP
    PERFORM pg_temp.runs(NULL, format('SELECT public.guest_report_problem(%L, %L)', tok, 'Report ' || i), 'report ' || i || ' of five', true);
  END LOOP;
  PERFORM pg_temp.runs(NULL, format('SELECT public.guest_report_problem(%L, %L)', tok, 'Report six'), 'the sixth report in an hour', false);

  -- 8. The worker granted the door reads the guest's report.
  IF pg_temp.count_as(w, format('SELECT count(*)::int FROM tenant_maintenance_requests WHERE rental_id = %L AND created_by_role = ''guest''', stay)) <> 5 THEN
    RAISE EXCEPTION 'GUEST REPORT SMOKE FAIL: the worker on the door does not see the guest reports';
  END IF;
  IF pg_temp.count_as(n, format('SELECT count(*)::int FROM tenant_maintenance_requests WHERE rental_id = %L', stay)) <> 0 THEN
    RAISE EXCEPTION 'GUEST REPORT SMOKE FAIL: a tenant of another door sees the guest reports';
  END IF;

  -- 9. A new card kills the old one; closing kills it all.
  DELETE FROM tenant_maintenance_requests WHERE rental_id = stay;   -- clear the hourly ceiling
  tok2 := pg_temp.open_as(o, stay);
  IF tok2 = tok THEN RAISE EXCEPTION 'GUEST REPORT SMOKE FAIL: replacing the link kept the same token'; END IF;
  PERFORM pg_temp.runs(NULL, format('SELECT public.guest_report_problem(%L, %L)', tok, 'Old card'), 'the replaced card', false);
  PERFORM pg_temp.runs(NULL, format('SELECT public.guest_report_problem(%L, %L)', tok2, 'New card'), 'the new card', true);
  PERFORM pg_temp.runs(w, format('SELECT public.door_guest_link_close(%L)', stay), 'a worker closes the link', false);
  PERFORM pg_temp.runs(o, format('SELECT public.door_guest_link_close(%L)', stay), 'the owner closes the link', true);
  PERFORM pg_temp.runs(NULL, format('SELECT public.guest_report_problem(%L, %L)', tok2, 'After closing'), 'a closed link', false);

  RAISE NOTICE 'GUEST REPORT SMOKE: PASS';
END $$;

ROLLBACK;
