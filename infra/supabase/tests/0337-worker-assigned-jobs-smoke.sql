-- =============================================================================
-- 0337 SMOKE — the worker a job is sent to reads it, and nobody else gains
-- anything (DR-1594)
-- =============================================================================
-- Needs the door-work chain (0055 .. 0264) plus 0151, 0306, 0310 and 0337.
-- Everything is inside one transaction and ROLLS BACK. PASS prints
-- 'WORKER ASSIGNED JOBS SMOKE: PASS'; any break RAISES.
--
-- Scenario (landlord instance I):
--   O   owner.  Doors: V (slug DOOR-V-337), H (DOOR-H-337), X (tenancy TX,
--       tenant N).
--   W1  1099 worker with the field worker's whole ceiling, on door V only.
--   W2  1099 worker with NO grant anywhere.
--   N   the tenant of X.
--
--   W1 reads JH1, a job on door H assigned to him                  ✔
--   W2 reads JH2, a job on door H assigned to him                  ✔
--   W2 reads JH3, the unassigned job on door H                     ✘
--   W1 reads W2's job JH2 (no grant on H, not his job)             ✘
--   W2 documents JH2 as himself; as somebody else; JH3             ✔ / ✘ / ✘
--   W2 reads the documentation on JH2                              ✔
--   W2 moves JH2 (still no UPDATE arm)                             0 rows
--   my_assigned_work_orders() for W2: JH2 only, with its street    ✔
--   N reads TX's job; N reads JH1 / JH2                            ✔ / ✘
--   Claim by name: C claims "Coreyon Smoke"; the open job sent to
--     " coreyon smoke" becomes his, a closed one and another
--     name's do not, and the change is on the job's timeline       ✔
--   Two people invited as "Same Name": the claim matches nothing   ✔
--   The backfill: an empty claimed field_worker invite gains the
--     ceiling and its worker the grants; revoked / manager rows
--     and an existing 'deny' are left alone                        ✔
-- =============================================================================
BEGIN;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000a0337', 'authenticated','authenticated','owner337@test.local','',   now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000b0337', 'authenticated','authenticated','w1337@test.local','',      now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000c0337', 'authenticated','authenticated','w2337@test.local','',      now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000d0337', 'authenticated','authenticated','tenant337@test.local','',  now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000e0337', 'authenticated','authenticated','15635550337@phone.poetech.us','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000f0337', 'authenticated','authenticated','same1337@test.local','',   now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-000000100337', 'authenticated','authenticated','old337@test.local','',     now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  ('00000000-0000-4000-b000-000000010337', 'worker-jobs-smoke-337', 'Worker Jobs Smoke', 'business')
ON CONFLICT (id) DO NOTHING;
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  ('00000000-0000-4000-b000-000000010337', '00000000-0000-4000-a000-0000000a0337', 'owner', 'Owner')
ON CONFLICT DO NOTHING;

INSERT INTO rentals (id, instance_id, created_by, slug, display_name, address, city, state, property_type, status) VALUES
  ('00000000-0000-4000-c000-0000000a0337', '00000000-0000-4000-b000-000000010337', '00000000-0000-4000-a000-0000000a0337', 'DOOR-V-337', 'Vacant Door', '1 Vacant Way', 'Davenport', 'IA', 'multi-family', 'vacant'),
  ('00000000-0000-4000-c000-0000000b0337', '00000000-0000-4000-b000-000000010337', '00000000-0000-4000-a000-0000000a0337', 'DOOR-H-337', 'Other Door',  '2 Other Lane', 'Davenport', 'IA', 'multi-family', 'vacant'),
  ('00000000-0000-4000-c000-0000000c0337', '00000000-0000-4000-b000-000000010337', '00000000-0000-4000-a000-0000000a0337', 'DOOR-X-337', 'Rented Door', '3 Rented Rd',  'Davenport', 'IA', 'multi-family', 'occupied');

INSERT INTO rental_tenancies (id, instance_id, created_by, rental_ref, property_label, tenant_name, tenant_user_id, monthly_rent, deposit, status) VALUES
  ('00000000-0000-4000-c000-0000000e0337', '00000000-0000-4000-b000-000000010337', '00000000-0000-4000-a000-0000000a0337',
   'DOOR-X-337', 'Rented Door', 'Tenant N', '00000000-0000-4000-a000-0000000d0337', 900, 900, 'active');

INSERT INTO delegated_capabilities (instance_id, grantee_user_id, scope_ref, capability, setting, granted_by, role_label) VALUES
  ('00000000-0000-4000-b000-000000010337', '00000000-0000-4000-a000-0000000b0337', 'DOOR-V-337', 'docs.add',         'allow', '00000000-0000-4000-a000-0000000a0337', 'field_worker'),
  ('00000000-0000-4000-b000-000000010337', '00000000-0000-4000-a000-0000000b0337', 'DOOR-V-337', 'property.history', 'allow', '00000000-0000-4000-a000-0000000a0337', 'field_worker');

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
    RAISE EXCEPTION 'WORKER ASSIGNED JOBS SMOKE FAIL: % (expected visible=%, got %)', _label, _should, seen;
  END IF;
END $$;

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
    RAISE EXCEPTION 'WORKER ASSIGNED JOBS SMOKE FAIL: % (expected write-succeeds=%, got %)', _label, _should, ok;
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
    RAISE EXCEPTION 'WORKER ASSIGNED JOBS SMOKE FAIL: % (expected % rows updated, got %)', _label, _expected, n;
  END IF;
END $$;

DO $$
DECLARE
  o    uuid := '00000000-0000-4000-a000-0000000a0337';
  w1   uuid := '00000000-0000-4000-a000-0000000b0337';
  w2   uuid := '00000000-0000-4000-a000-0000000c0337';
  n    uuid := '00000000-0000-4000-a000-0000000d0337';
  c    uuid := '00000000-0000-4000-a000-0000000e0337';
  s1   uuid := '00000000-0000-4000-a000-0000000f0337';
  old  uuid := '00000000-0000-4000-a000-000000100337';
  inst uuid := '00000000-0000-4000-b000-000000010337';
  dv   uuid := '00000000-0000-4000-c000-0000000a0337';
  dh   uuid := '00000000-0000-4000-c000-0000000b0337';
  tx   uuid := '00000000-0000-4000-c000-0000000e0337';
  jh1  uuid := '00000000-0000-4000-d000-0000000a0337';
  jh2  uuid := '00000000-0000-4000-d000-0000000b0337';
  jh3  uuid := '00000000-0000-4000-d000-0000000c0337';
  jx   uuid := '00000000-0000-4000-d000-0000000d0337';
  jl1  uuid := '00000000-0000-4000-d000-0000000e0337';
  jl2  uuid := '00000000-0000-4000-d000-0000000f0337';
  jl3  uuid := '00000000-0000-4000-d000-000000100337';
  js   uuid := '00000000-0000-4000-d000-000000110337';
  k    int;
  a    uuid;
  row1 record;
BEGIN
  -- The jobs, filed by the owner as postgres (the walls under test are reads).
  INSERT INTO tenant_maintenance_requests (id, instance_id, rental_id, created_by, created_by_role, title, status, assigned_to, assigned_to_label) VALUES
    (jh1, inst, dh, o, 'landlord', 'Gutter on H for W1', 'scheduled', w1, 'W One'),
    (jh2, inst, dh, o, 'landlord', 'Furnace on H for W2', 'scheduled', w2, 'W Two'),
    (jh3, inst, dh, o, 'landlord', 'Unassigned on H',     'submitted', NULL, NULL);
  INSERT INTO tenant_maintenance_requests (id, instance_id, tenancy_id, created_by, created_by_role, title, status) VALUES
    (jx, inst, tx, o, 'landlord', 'Leaky faucet in X', 'submitted');

  -- 1. The worker reads the job sent to him, on a door he holds no grant for.
  PERFORM pg_temp.sees(w1, 'tenant_maintenance_requests', jh1, 'W1 reads his job on door H', true);
  PERFORM pg_temp.sees(w2, 'tenant_maintenance_requests', jh2, 'W2 (no grant) reads his job on door H', true);
  PERFORM pg_temp.sees(w2, 'tenant_maintenance_requests', jh3, 'W2 reads the unassigned job on door H', false);
  PERFORM pg_temp.sees(w2, 'tenant_maintenance_requests', jh1, 'W2 reads W1''s job', false);
  PERFORM pg_temp.sees(w1, 'tenant_maintenance_requests', jh2, 'W1 reads W2''s job', false);
  PERFORM pg_temp.sees(w2, 'tenant_maintenance_requests', jx,  'W2 reads the tenancy''s job', false);

  -- 2. He documents his own job, as himself, and nothing else.
  PERFORM pg_temp.writes(w2, format(
    'INSERT INTO request_documentation (instance_id, request_id, author_user_id, outcome, note) VALUES (%L, %L, %L, NULL, ''Arrived'')', inst, jh2, w2),
    'W2 documents his job', true);
  PERFORM pg_temp.writes(w2, format(
    'INSERT INTO request_documentation (instance_id, request_id, author_user_id, outcome, note) VALUES (%L, %L, %L, NULL, ''Posing'')', inst, jh2, o),
    'W2 documents his job as the owner', false);
  PERFORM pg_temp.writes(w2, format(
    'INSERT INTO request_documentation (instance_id, request_id, author_user_id, outcome, note) VALUES (%L, %L, %L, NULL, ''Not his'')', inst, jh3, w2),
    'W2 documents the unassigned job', false);
  PERFORM pg_temp.as_user(w2);
  SELECT count(*) INTO k FROM request_documentation WHERE request_id = jh2;
  PERFORM pg_temp.as_postgres();
  IF k <> 1 THEN RAISE EXCEPTION 'WORKER ASSIGNED JOBS SMOKE FAIL: W2 reads % notes on his job, expected 1', k; END IF;

  -- 3. Being sent a job is not managing it.
  PERFORM pg_temp.updates(w2, format('UPDATE tenant_maintenance_requests SET status = ''declined'' WHERE id = %L', jh2),
    'W2 moves his job', 0);

  -- 4. His list, across doors, says where each job is.
  PERFORM pg_temp.as_user(w2);
  SELECT count(*) INTO k FROM public.my_assigned_work_orders();
  SELECT * INTO row1 FROM public.my_assigned_work_orders() LIMIT 1;
  PERFORM pg_temp.as_postgres();
  IF k <> 1 OR row1.id <> jh2 OR row1.address IS DISTINCT FROM '2 Other Lane' OR row1.rental_id IS DISTINCT FROM dh THEN
    RAISE EXCEPTION 'WORKER ASSIGNED JOBS SMOKE FAIL: W2''s list is % rows (%, %)', k, row1.id, row1.address;
  END IF;
  PERFORM pg_temp.as_user(n);
  SELECT count(*) INTO k FROM public.my_assigned_work_orders();
  PERFORM pg_temp.as_postgres();
  IF k <> 0 THEN RAISE EXCEPTION 'WORKER ASSIGNED JOBS SMOKE FAIL: the tenant''s worker list has % rows', k; END IF;

  -- 5. The tenant still sees only their tenancy.
  PERFORM pg_temp.sees(n, 'tenant_maintenance_requests', jx,  'N reads their own job', true);
  PERFORM pg_temp.sees(n, 'tenant_maintenance_requests', jh1, 'N reads W1''s job', false);
  PERFORM pg_temp.sees(n, 'tenant_maintenance_requests', jh2, 'N reads W2''s job', false);

  -- 6. A job sent by name before he signed in becomes his when he claims.
  INSERT INTO tenant_maintenance_requests (id, instance_id, rental_id, created_by, created_by_role, title, status, assigned_to_label) VALUES
    (jl1, inst, dv, o, 'landlord', 'Sent by name',          'scheduled', ' coreyon smoke '),
    (jl2, inst, dv, o, 'landlord', 'Closed, sent by name',  'resolved',  'Coreyon Smoke'),
    (jl3, inst, dv, o, 'landlord', 'Someone else''s',       'scheduled', 'Isaiah Smoke');
  INSERT INTO property_access_invites (instance_id, email, invited_phone, role_label, scope_ref, capabilities, display_name, invited_by)
  VALUES (inst, '15635550337@phone.poetech.us', '5635550337', 'field_worker', '*', ARRAY['property.history','docs.add'], 'Coreyon Smoke', o);
  PERFORM pg_temp.as_user(c);
  PERFORM public.claim_property_access();
  PERFORM pg_temp.as_postgres();
  SELECT assigned_to INTO a FROM tenant_maintenance_requests WHERE id = jl1;
  IF a IS DISTINCT FROM c THEN RAISE EXCEPTION 'WORKER ASSIGNED JOBS SMOKE FAIL: the job sent by name was not given to the worker who claimed'; END IF;
  SELECT assigned_to INTO a FROM tenant_maintenance_requests WHERE id = jl2;
  IF a IS NOT NULL THEN RAISE EXCEPTION 'WORKER ASSIGNED JOBS SMOKE FAIL: a closed job was reassigned'; END IF;
  SELECT assigned_to INTO a FROM tenant_maintenance_requests WHERE id = jl3;
  IF a IS NOT NULL THEN RAISE EXCEPTION 'WORKER ASSIGNED JOBS SMOKE FAIL: another name''s job went to the claimer'; END IF;
  SELECT count(*) INTO k FROM door_events WHERE subject = 'work' AND subject_id = jl1 AND event = 'assigned' AND by_user = c;
  IF k <> 1 THEN RAISE EXCEPTION 'WORKER ASSIGNED JOBS SMOKE FAIL: the assignment is not on the job''s timeline (% events)', k; END IF;
  PERFORM pg_temp.sees(c, 'tenant_maintenance_requests', jl1, 'C reads the job sent to his name', true);

  -- 7. Two people under one name: nothing is guessed.
  INSERT INTO tenant_maintenance_requests (id, instance_id, rental_id, created_by, created_by_role, title, status, assigned_to_label) VALUES
    (js, inst, dv, o, 'landlord', 'Sent to a shared name', 'scheduled', 'Same Name');
  INSERT INTO property_access_invites (instance_id, email, role_label, scope_ref, capabilities, display_name, invited_by) VALUES
    (inst, 'same1337@test.local',  'field_worker', '*', ARRAY['docs.add'], 'Same Name', o),
    (inst, 'same2337@test.local',  'field_worker', '*', ARRAY['docs.add'], 'same name', o);
  PERFORM pg_temp.as_user(s1);
  PERFORM public.claim_property_access();
  PERFORM pg_temp.as_postgres();
  SELECT assigned_to INTO a FROM tenant_maintenance_requests WHERE id = js;
  IF a IS NOT NULL THEN RAISE EXCEPTION 'WORKER ASSIGNED JOBS SMOKE FAIL: an ambiguous name was matched'; END IF;
END $$;

-- 8. THE BACKFILL. Rows in the state the live database may hold, then 0337
--    is run again over them (it is idempotent).
INSERT INTO property_access_invites (id, instance_id, email, role_label, scope_ref, capabilities, display_name, invited_by, claimed_at, claimed_by) VALUES
  ('00000000-0000-4000-e000-0000000a0337', '00000000-0000-4000-b000-000000010337', 'old337@test.local', 'field_worker', NULL, '{}', 'Old Worker',
   '00000000-0000-4000-a000-0000000a0337', now(), '00000000-0000-4000-a000-000000100337'),
  ('00000000-0000-4000-e000-0000000b0337', '00000000-0000-4000-b000-000000010337', 'unclaimed337@test.local', 'field_worker', 'DOOR-V-337', '{}', 'Not Yet',
   '00000000-0000-4000-a000-0000000a0337', NULL, NULL),
  ('00000000-0000-4000-e000-0000000c0337', '00000000-0000-4000-b000-000000010337', 'revoked337@test.local', 'field_worker', NULL, '{}', 'Revoked',
   '00000000-0000-4000-a000-0000000a0337', NULL, NULL),
  ('00000000-0000-4000-e000-0000000d0337', '00000000-0000-4000-b000-000000010337', 'mgr337@test.local', 'manager', NULL, '{}', 'Manager',
   '00000000-0000-4000-a000-0000000a0337', NULL, NULL);
UPDATE property_access_invites SET revoked = true WHERE id = '00000000-0000-4000-e000-0000000c0337';
-- A deliberate deny the family wrote for the old worker is kept.
INSERT INTO delegated_capabilities (instance_id, grantee_user_id, scope_ref, capability, setting, granted_by, role_label) VALUES
  ('00000000-0000-4000-b000-000000010337', '00000000-0000-4000-a000-000000100337', '*', 'property.history', 'deny', '00000000-0000-4000-a000-0000000a0337', 'field_worker');
INSERT INTO tenant_maintenance_requests (id, instance_id, rental_id, created_by, created_by_role, title, status, assigned_to_label) VALUES
  ('00000000-0000-4000-d000-000000200337', '00000000-0000-4000-b000-000000010337', '00000000-0000-4000-c000-0000000a0337',
   '00000000-0000-4000-a000-0000000a0337', 'landlord', 'Sent to the old worker by name', 'scheduled', 'old worker');

\ir ../migrations-auto/0337-a-worker-reads-the-job-sent-to-them.sql

DO $$
DECLARE
  caps text[];
  k    int;
  st   text;
  a    uuid;
BEGIN
  SELECT capabilities INTO caps FROM property_access_invites WHERE id = '00000000-0000-4000-e000-0000000a0337';
  IF caps IS DISTINCT FROM ARRAY['property.history','docs.add'] THEN
    RAISE EXCEPTION 'WORKER ASSIGNED JOBS SMOKE FAIL: the claimed empty invite now carries %', caps;
  END IF;
  SELECT capabilities INTO caps FROM property_access_invites WHERE id = '00000000-0000-4000-e000-0000000b0337';
  IF caps IS DISTINCT FROM ARRAY['property.history','docs.add'] THEN
    RAISE EXCEPTION 'WORKER ASSIGNED JOBS SMOKE FAIL: the unclaimed empty invite now carries %', caps;
  END IF;
  SELECT capabilities INTO caps FROM property_access_invites WHERE id = '00000000-0000-4000-e000-0000000c0337';
  IF cardinality(caps) <> 0 THEN RAISE EXCEPTION 'WORKER ASSIGNED JOBS SMOKE FAIL: a revoked invite was changed'; END IF;
  SELECT capabilities INTO caps FROM property_access_invites WHERE id = '00000000-0000-4000-e000-0000000d0337';
  IF cardinality(caps) <> 0 THEN RAISE EXCEPTION 'WORKER ASSIGNED JOBS SMOKE FAIL: a manager invite was changed'; END IF;

  SELECT setting INTO st FROM delegated_capabilities
   WHERE grantee_user_id = '00000000-0000-4000-a000-000000100337' AND scope_ref = '*' AND capability = 'docs.add';
  IF st IS DISTINCT FROM 'allow' THEN RAISE EXCEPTION 'WORKER ASSIGNED JOBS SMOKE FAIL: the claimed worker was not granted docs.add (%)', st; END IF;
  SELECT setting INTO st FROM delegated_capabilities
   WHERE grantee_user_id = '00000000-0000-4000-a000-000000100337' AND scope_ref = '*' AND capability = 'property.history';
  IF st IS DISTINCT FROM 'deny' THEN RAISE EXCEPTION 'WORKER ASSIGNED JOBS SMOKE FAIL: a deliberate deny was overwritten (%)', st; END IF;
  SELECT count(*) INTO k FROM delegated_capabilities
   WHERE grantee_user_id = '00000000-0000-4000-a000-000000100337' AND capability NOT IN ('property.history', 'docs.add');
  IF k <> 0 THEN RAISE EXCEPTION 'WORKER ASSIGNED JOBS SMOKE FAIL: % grants outside the ceiling', k; END IF;

  SELECT assigned_to INTO a FROM tenant_maintenance_requests WHERE id = '00000000-0000-4000-d000-000000200337';
  IF a IS DISTINCT FROM '00000000-0000-4000-a000-000000100337'::uuid THEN
    RAISE EXCEPTION 'WORKER ASSIGNED JOBS SMOKE FAIL: a worker who had already signed in was not given the job sent to his name';
  END IF;

  RAISE NOTICE 'WORKER ASSIGNED JOBS SMOKE: PASS';
END $$;

ROLLBACK;
