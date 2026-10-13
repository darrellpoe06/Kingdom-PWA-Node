-- =============================================================================
-- 0260 SMOKE — work is filed on the DOOR, and the door's walls hold (DR-0897)
-- =============================================================================
-- Runs in CI on a throwaway PostgreSQL (the door-work leg) and on the LIVE
-- database in the rls-isolation poe-properties leg. Everything is inside one
-- transaction and ROLLS BACK. PASS prints 'DOOR WORK SMOKE: PASS'; any break
-- RAISES.
--
-- Scenario (landlord instance I, plus a SEPARATE landlord instance I2):
--   O   owner of I.  Doors: V (vacant, short-stay), H (the family's own home),
--       X (rented — tenancy TX, tenant N).
--   W   1099 worker: docs.add on door V only.
--   M   manager: request.manage on door V only.
--   N   the tenant of door X.
--   S   a stranger.  O2 owner of I2 with door Z.
--
--   O files on V and on H with NO tenancy                         ✔
--   a row naming neither a tenancy nor a door                     ✘
--   O2 files in I2 naming door V (another landlord's door)        ✘
--   W reads V's job; W reads H's job                              ✔ / ✘
--   W files on V as worker; as 'landlord'; on H                   ✔ / ✘ / ✘
--   W moves V's job (no UPDATE arm for a worker)                  0 rows
--   W documents V's job "fixed" while NAMING door H               lands on V, job resolved
--   W documents H's job                                           ✘
--   M moves V's job; M moves H's job                              1 row / 0 rows
--   W notes on V; W notes on H                                    ✔ / ✘
--   N reads X's tenancy job; N reads V's or H's door jobs         ✔ / ✘
--   S and O2 read nothing of I                                    ✘
-- =============================================================================
BEGIN;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000a0260', 'authenticated','authenticated','owner260@test.local','',   now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000b0260', 'authenticated','authenticated','worker260@test.local','',  now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000c0260', 'authenticated','authenticated','mgr260@test.local','',     now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000d0260', 'authenticated','authenticated','tenant260@test.local','',  now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000e0260', 'authenticated','authenticated','stranger260@test.local','',now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000f0260', 'authenticated','authenticated','owner2260@test.local','',  now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  ('00000000-0000-4000-b000-000000010260', 'door-work-smoke-260',  'Door Work Smoke',  'business'),
  ('00000000-0000-4000-b000-000000020260', 'door-work-smoke2-260', 'Other Landlord 260','business')
ON CONFLICT (id) DO NOTHING;
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  ('00000000-0000-4000-b000-000000010260', '00000000-0000-4000-a000-0000000a0260', 'owner', 'Owner'),
  ('00000000-0000-4000-b000-000000020260', '00000000-0000-4000-a000-0000000f0260', 'owner', 'Owner Two')
ON CONFLICT DO NOTHING;

INSERT INTO rentals (id, instance_id, created_by, slug, display_name, address, property_type, status) VALUES
  ('00000000-0000-4000-c000-0000000a0260', '00000000-0000-4000-b000-000000010260', '00000000-0000-4000-a000-0000000a0260', 'DOOR-V-260', 'Short Stay',   '1 Vacant Way',  'multi-family', 'vacant'),
  ('00000000-0000-4000-c000-0000000b0260', '00000000-0000-4000-b000-000000010260', '00000000-0000-4000-a000-0000000a0260', 'DOOR-H-260', 'Our Home',     '2 Home Lane',   'primary-home', 'owner-occupied'),
  ('00000000-0000-4000-c000-0000000c0260', '00000000-0000-4000-b000-000000010260', '00000000-0000-4000-a000-0000000a0260', 'DOOR-X-260', 'Rented Door',  '3 Rented Rd',   'multi-family', 'occupied'),
  ('00000000-0000-4000-c000-0000000d0260', '00000000-0000-4000-b000-000000020260', '00000000-0000-4000-a000-0000000f0260', 'DOOR-Z-260', 'Their Door',   '4 Theirs St',   'single-family','occupied');

INSERT INTO rental_tenancies (id, instance_id, created_by, rental_ref, property_label, tenant_name, tenant_user_id, monthly_rent, deposit, status) VALUES
  ('00000000-0000-4000-c000-0000000e0260', '00000000-0000-4000-b000-000000010260', '00000000-0000-4000-a000-0000000a0260',
   'DOOR-X-260', 'Rented Door', 'Tenant N', '00000000-0000-4000-a000-0000000d0260', 900, 900, 'active');

INSERT INTO delegated_capabilities (instance_id, grantee_user_id, scope_ref, capability, setting, granted_by, role_label) VALUES
  ('00000000-0000-4000-b000-000000010260', '00000000-0000-4000-a000-0000000b0260', 'DOOR-V-260', 'docs.add',       'allow', '00000000-0000-4000-a000-0000000a0260', 'field_worker'),
  ('00000000-0000-4000-b000-000000010260', '00000000-0000-4000-a000-0000000c0260', 'DOOR-V-260', 'request.manage', 'allow', '00000000-0000-4000-a000-0000000a0260', 'manager');

-- ── helpers ──────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION pg_temp.as_user(_who uuid) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role', 'authenticated')::text, true);
END $$;
CREATE OR REPLACE FUNCTION pg_temp.as_postgres() RETURNS void LANGUAGE plpgsql AS $$
BEGIN PERFORM set_config('role', 'postgres', true); END $$;

CREATE OR REPLACE FUNCTION pg_temp.sees(_who uuid, _table text, _id uuid, _label text, _should boolean)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE seen boolean;
BEGIN
  PERFORM pg_temp.as_user(_who);
  EXECUTE format('SELECT EXISTS (SELECT 1 FROM %I WHERE id = %L)', _table, _id) INTO seen;
  PERFORM pg_temp.as_postgres();
  IF seen <> _should THEN
    RAISE EXCEPTION 'DOOR WORK SMOKE FAIL: % (expected visible=%, got %)', _label, _should, seen;
  END IF;
END $$;

-- A refusal is RLS (42501), a CHECK (23514), a missing parent (23503) or a
-- trigger's RAISE. Anything else (a typo, a missing column) is NOT a refusal
-- and propagates, so a broken smoke can never read as a held wall.
CREATE OR REPLACE FUNCTION pg_temp.writes(_who uuid, _sql text, _label text, _should boolean)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE ok boolean := true;
BEGIN
  PERFORM pg_temp.as_user(_who);
  BEGIN
    EXECUTE _sql;
  EXCEPTION
    WHEN insufficient_privilege OR check_violation OR foreign_key_violation OR raise_exception THEN ok := false;
  END;
  PERFORM pg_temp.as_postgres();
  IF ok <> _should THEN
    RAISE EXCEPTION 'DOOR WORK SMOKE FAIL: % (expected write-succeeds=%, got %)', _label, _should, ok;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION pg_temp.updates(_who uuid, _sql text, _label text, _expected int)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE n int;
BEGIN
  PERFORM pg_temp.as_user(_who);
  EXECUTE _sql;
  GET DIAGNOSTICS n = ROW_COUNT;
  PERFORM pg_temp.as_postgres();
  IF n <> _expected THEN
    RAISE EXCEPTION 'DOOR WORK SMOKE FAIL: % (expected % rows updated, got %)', _label, _expected, n;
  END IF;
END $$;

DO $$
DECLARE
  o    uuid := '00000000-0000-4000-a000-0000000a0260';
  w    uuid := '00000000-0000-4000-a000-0000000b0260';
  m    uuid := '00000000-0000-4000-a000-0000000c0260';
  n    uuid := '00000000-0000-4000-a000-0000000d0260';
  s    uuid := '00000000-0000-4000-a000-0000000e0260';
  o2   uuid := '00000000-0000-4000-a000-0000000f0260';
  inst text := '00000000-0000-4000-b000-000000010260';
  ins2 text := '00000000-0000-4000-b000-000000020260';
  dv   text := '00000000-0000-4000-c000-0000000a0260';
  dh   text := '00000000-0000-4000-c000-0000000b0260';
  tx   text := '00000000-0000-4000-c000-0000000e0260';
  jv   uuid := '00000000-0000-4000-d000-0000000a0260';
  jh   uuid := '00000000-0000-4000-d000-0000000b0260';
  jx   uuid := '00000000-0000-4000-d000-0000000c0260';
  jw   uuid := '00000000-0000-4000-d000-0000000d0260';
  doc  record;
  st   text;
BEGIN
  -- 1. THE LANDLORD FILES ON A DOOR WITH NO TENANCY: the vacant short stay and the home.
  PERFORM pg_temp.writes(o, format(
    'INSERT INTO tenant_maintenance_requests (id, instance_id, rental_id, created_by, created_by_role, title, priority, status)
     VALUES (%L, %L, %L, %L, ''landlord'', ''Microwave and exhaust fan'', ''normal'', ''submitted'')', jv, inst, dv, o),
    'O files a job on the vacant door', true);
  PERFORM pg_temp.writes(o, format(
    'INSERT INTO tenant_maintenance_requests (id, instance_id, rental_id, created_by, created_by_role, title, priority, status)
     VALUES (%L, %L, %L, %L, ''landlord'', ''Furnace filter'', ''normal'', ''submitted'')', jh, inst, dh, o),
    'O files a job on the home', true);
  PERFORM pg_temp.writes(o, format(
    'INSERT INTO tenant_maintenance_requests (id, instance_id, tenancy_id, created_by, created_by_role, title, priority, status)
     VALUES (%L, %L, %L, %L, ''landlord'', ''Leaky faucet'', ''normal'', ''submitted'')', jx, inst, tx, o),
    'O files a job on the rented door through its tenancy', true);

  -- 2. A job must name a door or a tenancy.
  PERFORM pg_temp.writes(o, format(
    'INSERT INTO tenant_maintenance_requests (instance_id, created_by, created_by_role, title) VALUES (%L, %L, ''landlord'', ''Nowhere'')', inst, o),
    'a job naming neither a tenancy nor a door', false);

  -- 3. Another landlord cannot hang a row on this landlord's door.
  PERFORM pg_temp.writes(o2, format(
    'INSERT INTO tenant_maintenance_requests (instance_id, rental_id, created_by, created_by_role, title) VALUES (%L, %L, %L, ''landlord'', ''Planted'')', ins2, dv, o2),
    'O2 files in I2 naming door V', false);

  -- 4. The worker reads the door he was granted, and only that door.
  PERFORM pg_temp.sees(w, 'tenant_maintenance_requests', jv, 'W reads the job on door V', true);
  PERFORM pg_temp.sees(w, 'tenant_maintenance_requests', jh, 'W reads the job on the home', false);
  PERFORM pg_temp.sees(w, 'tenant_maintenance_requests', jx, 'W reads the rented door''s job', false);

  -- 5. The worker walking the door files what he sees, as himself, on his door only.
  PERFORM pg_temp.writes(w, format(
    'INSERT INTO tenant_maintenance_requests (id, instance_id, rental_id, created_by, created_by_role, title) VALUES (%L, %L, %L, %L, ''worker'', ''Stain on the couch'')', jw, inst, dv, w),
    'W files a job on door V', true);
  PERFORM pg_temp.writes(w, format(
    'INSERT INTO tenant_maintenance_requests (instance_id, rental_id, created_by, created_by_role, title) VALUES (%L, %L, %L, ''landlord'', ''Posing as the landlord'')', inst, dv, w),
    'W files on door V claiming to be the landlord', false);
  PERFORM pg_temp.writes(w, format(
    'INSERT INTO tenant_maintenance_requests (instance_id, rental_id, created_by, created_by_role, title) VALUES (%L, %L, %L, ''worker'', ''Not his door'')', inst, dh, w),
    'W files a job on the home', false);

  -- 6. Filing is not managing: the worker cannot move a job.
  PERFORM pg_temp.updates(w, format('UPDATE tenant_maintenance_requests SET status = ''declined'' WHERE id = %L', jv),
    'W moves the job on door V', 0);

  -- 7. Documentation takes its scope from its request, and "fixed" closes the job.
  PERFORM pg_temp.writes(w, format(
    'INSERT INTO request_documentation (instance_id, request_id, tenancy_id, rental_id, outcome, note)
     VALUES (%L, %L, NULL, %L, ''fixed'', ''Installed'')', inst, jv, dh),
    'W documents the job on V while naming the home', true);
  SELECT rental_id, tenancy_id INTO doc FROM request_documentation WHERE request_id = jv;
  IF doc.rental_id IS DISTINCT FROM dv::uuid OR doc.tenancy_id IS NOT NULL THEN
    RAISE EXCEPTION 'DOOR WORK SMOKE FAIL: documentation kept the client''s scope (rental %, tenancy %)', doc.rental_id, doc.tenancy_id;
  END IF;
  SELECT status INTO st FROM tenant_maintenance_requests WHERE id = jv;
  IF st <> 'resolved' THEN
    RAISE EXCEPTION 'DOOR WORK SMOKE FAIL: a fixed documentation left the job %', st;
  END IF;
  PERFORM pg_temp.writes(w, format(
    'INSERT INTO request_documentation (instance_id, request_id, rental_id, outcome) VALUES (%L, %L, %L, ''fixed'')', inst, jh, dv),
    'W documents the job on the home', false);

  -- 8. The manager moves jobs on his door, and only there.
  PERFORM pg_temp.updates(m, format('UPDATE tenant_maintenance_requests SET status = ''scheduled'' WHERE id = %L', jw),
    'M moves the worker''s job on door V', 1);
  PERFORM pg_temp.updates(m, format('UPDATE tenant_maintenance_requests SET status = ''scheduled'' WHERE id = %L', jh),
    'M moves the job on the home', 0);

  -- 9. Notes on the door.
  PERFORM pg_temp.writes(w, format(
    'INSERT INTO tenancy_notes (instance_id, rental_id, request_id, author_user_id, author_role, body) VALUES (%L, %L, %L, %L, ''worker'', ''Needs a second coat'')', inst, dv, jw, w),
    'W notes on door V', true);
  PERFORM pg_temp.writes(w, format(
    'INSERT INTO tenancy_notes (instance_id, rental_id, author_user_id, author_role, body) VALUES (%L, %L, %L, ''worker'', ''Not his door'')', inst, dh, w),
    'W notes on the home', false);

  -- 10. The tenant sees their own request, never the landlord's door work.
  PERFORM pg_temp.sees(n, 'tenant_maintenance_requests', jx, 'N reads their own job', true);
  PERFORM pg_temp.sees(n, 'tenant_maintenance_requests', jv, 'N reads the vacant door''s job', false);
  PERFORM pg_temp.sees(n, 'tenant_maintenance_requests', jh, 'N reads the home''s job', false);

  -- 11. Nobody outside I reads anything in I.
  PERFORM pg_temp.sees(s,  'tenant_maintenance_requests', jv, 'S reads the vacant door''s job', false);
  PERFORM pg_temp.sees(o2, 'tenant_maintenance_requests', jh, 'O2 reads the home''s job', false);

  -- 12. The landlord reads every job on every door.
  PERFORM pg_temp.sees(o, 'tenant_maintenance_requests', jv, 'O reads the vacant door''s job', true);
  PERFORM pg_temp.sees(o, 'tenant_maintenance_requests', jh, 'O reads the home''s job', true);
  PERFORM pg_temp.sees(o, 'tenant_maintenance_requests', jw, 'O reads the worker''s report', true);

  RAISE NOTICE 'DOOR WORK SMOKE: PASS';
END $$;

ROLLBACK;
