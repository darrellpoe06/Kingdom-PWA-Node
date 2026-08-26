-- =============================================================================
-- 0150 ISOLATION SMOKE — the enablement gate for the Poe Properties App
-- =============================================================================
-- Run on the LIVE database AFTER applying 0075 + 0150 and BEFORE one tenant,
-- household member, or 1099 worker is invited. It PROVES the invite->claim seam
-- and the tenant's-family arms actually isolate people (DR-0076: no unverified
-- multi-tenant isolation is ever marked done). Everything runs in a transaction
-- and ROLLS BACK. PASS prints 'POE PROPERTIES SMOKE: PASS'; any leak RAISES.
--
-- Scenario (landlord instance I, plus a SEPARATE landlord instance I2):
--   O        — owner of I. Doors: tenancy A (rental_ref 'PROP-A'), tenancy B ('PROP-B').
--   T        — tenant@test.local, invited to tenancy A as 'tenant'.
--   F        — family@test.local, invited to tenancy A as 'household' (T's spouse).
--   W        — worker@test.local, invited as 'field_worker' on tenancy A, with an
--              OVER-ASKING invite: docs.add + property.history + rent.adjust.
--   S        — stranger@test.local. No invite at all.
--   O2 / I2  — a different landlord with their own door. Nothing may cross.
--
-- Assertions:
--   before claim, T sees NOTHING                       ✘  (an invite is not access)
--   S calling claim_property_access() gets 0            ✘  (no invite, no grant)
--   after claim, T reads door A's request/thread/rent   ✔
--   after claim, T reads door B                         ✘  (their door only)
--   F reads door A's request/thread/notice/rent         ✔  (the tenant's family)
--   F inserts a work order + a message + a note         ✔
--   F inserts a rent_record                             ✘  (rent stays with the signer)
--   W claims: docs.add granted, rent.adjust DROPPED     ✔/✘ (the ceiling is the function)
--   W reads door A's request; W reads rent_records      ✔/✘
--   W posts request_documentation + a note              ✔
--   a delegated manager writes posted_tx_id             ✘  (books are instance-side)
--   claiming twice grants nothing the second time       ✔  (single-use)
--   nobody in I sees anything in I2                     ✘  (no cross-landlord leak)
-- =============================================================================
BEGIN;

\set owner    '00000000-0000-4000-a000-0000000a0150'
\set tenant   '00000000-0000-4000-a000-0000000b0150'
\set family   '00000000-0000-4000-a000-0000000c0150'
\set worker   '00000000-0000-4000-a000-0000000d0150'
\set mgr      '00000000-0000-4000-a000-0000000e0150'
\set stranger '00000000-0000-4000-a000-0000000f0150'
\set owner2   '00000000-0000-4000-a000-0000001a0150'

\set inst   '00000000-0000-4000-b000-000000010150'
\set inst2  '00000000-0000-4000-b000-000000020150'
\set tenA   '00000000-0000-4000-c000-00000000a150'
\set tenB   '00000000-0000-4000-c000-00000000b150'
\set tenC2  '00000000-0000-4000-c000-00000000c150'

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', :'owner',   'authenticated','authenticated','owner150@test.local','',   now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'tenant',  'authenticated','authenticated','tenant150@test.local','',  now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'family',  'authenticated','authenticated','family150@test.local','',  now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'worker',  'authenticated','authenticated','worker150@test.local','',  now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'mgr',     'authenticated','authenticated','mgr150@test.local','',     now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'stranger','authenticated','authenticated','stranger150@test.local','',now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'owner2',  'authenticated','authenticated','owner2150@test.local','',  now(), now())
ON CONFLICT (id) DO NOTHING;

-- instances has slug + display_name + instance_type (no name/kind column) — the
-- shape 0075's smoke already proves against this database. 'landlord' is a real
-- instance_type here, and it is what a Poe Properties instance actually is.
INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  (:'inst',  'poe-properties-smoke-150', 'Poe Properties Smoke', 'landlord'),
  (:'inst2', 'other-landlord-smoke-150', 'Other Landlord Smoke', 'landlord')
ON CONFLICT (id) DO NOTHING;
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  (:'inst',  :'owner',  'owner', 'Owner'),
  (:'inst2', :'owner2', 'owner', 'Owner Two')
ON CONFLICT DO NOTHING;

INSERT INTO rental_tenancies (id, instance_id, created_by, rental_ref, property_label, unit_label, tenant_name, tenant_email, monthly_rent, deposit, status) VALUES
  (:'tenA',  :'inst',  :'owner',  'PROP-A', '1003 Koehn', 'Unit 1', 'Tenant One', 'tenant150@test.local', 900, 900, 'active'),
  (:'tenB',  :'inst',  :'owner',  'PROP-B', 'Second Door','Unit 2', 'Tenant Two', 'other150@test.local',  850, 850, 'active'),
  (:'tenC2', :'inst2', :'owner2', 'PROP-A', 'Their Door', 'Unit 1', 'Their Tenant','theirs150@test.local',800, 800, 'active');

INSERT INTO tenant_maintenance_requests (id, instance_id, tenancy_id, created_by, created_by_role, title, priority, status) VALUES
  ('00000000-0000-4000-d000-00000000a150', :'inst',  :'tenA',  :'owner',  'landlord', 'Furnace out',  'urgent', 'submitted'),
  ('00000000-0000-4000-d000-00000000b150', :'inst',  :'tenB',  :'owner',  'landlord', 'Leaky faucet', 'normal', 'submitted'),
  ('00000000-0000-4000-d000-00000000c150', :'inst2', :'tenC2', :'owner2', 'landlord', 'Their job',    'normal', 'submitted');

INSERT INTO tenant_messages (id, instance_id, tenancy_id, sender_user_id, from_role, body) VALUES
  ('00000000-0000-4000-e000-00000000a150', :'inst', :'tenA', :'owner', 'landlord', 'Coming Tuesday.');
INSERT INTO tenant_notices (id, instance_id, tenancy_id, created_by, title, kind) VALUES
  ('00000000-0000-4000-e000-00000000b150', :'inst', :'tenA', :'owner', 'Water shutoff', 'notice');
INSERT INTO rent_records (id, instance_id, tenancy_id, reported_by, reported_by_role, amount, for_period, method, status) VALUES
  ('00000000-0000-4000-e000-00000000c150', :'inst', :'tenA', :'owner', 'landlord', 900, '2026-08', 'zelle', 'confirmed');

-- The landlord's invites. NOTE the worker invite deliberately ASKS FOR rent.adjust,
-- which is outside the field_worker ceiling — the claim function must drop it.
INSERT INTO property_access_invites (instance_id, email, role_label, tenancy_id, scope_ref, capabilities, display_name, relationship, invited_by) VALUES
  (:'inst', 'tenant150@test.local', 'tenant',       :'tenA', NULL,     '{}',                                              'Tenant One', NULL,     :'owner'),
  (:'inst', 'family150@test.local', 'household',    :'tenA', NULL,     '{}',                                              'Spouse',     'spouse', :'owner'),
  (:'inst', 'worker150@test.local', 'field_worker', :'tenA', 'PROP-A', '{docs.add,property.history,rent.adjust}',          'Handy Sam',  NULL,     :'owner'),
  (:'inst', 'mgr150@test.local',    'manager',      NULL,    'PROP-A', '{request.manage,rentroll.view,rent.adjust}',       'Manager Kim',NULL,     :'owner');

-- ── helpers (same shape as 0074/0075) ────────────────────────────────────────
CREATE OR REPLACE FUNCTION pg_temp.assert_sees(_who uuid, _table text, _id uuid, _label text, _should boolean)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE seen boolean;
BEGIN
  PERFORM set_config('role','authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role','authenticated')::text, true);
  EXECUTE format('SELECT EXISTS (SELECT 1 FROM %I WHERE id = %L)', _table, _id) INTO seen;
  PERFORM set_config('role','postgres', true);
  IF seen <> _should THEN
    RAISE EXCEPTION 'POE PROPERTIES SMOKE FAIL: % (expected visible=%, got %)', _label, _should, seen;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION pg_temp.assert_count(_who uuid, _table text, _label text, _expected int)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE n int;
BEGIN
  PERFORM set_config('role','authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role','authenticated')::text, true);
  EXECUTE format('SELECT count(*) FROM %I', _table) INTO n;
  PERFORM set_config('role','postgres', true);
  IF n <> _expected THEN
    RAISE EXCEPTION 'POE PROPERTIES SMOKE FAIL: % expected % rows in %, saw %', _label, _expected, _table, n;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION pg_temp.assert_write(_who uuid, _sql text, _label text, _should boolean)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE ok boolean := true;
BEGIN
  PERFORM set_config('role','authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role','authenticated')::text, true);
  BEGIN
    EXECUTE _sql;
  EXCEPTION
    WHEN insufficient_privilege THEN ok := false;
    WHEN raise_exception THEN ok := false;   -- the posting trigger's guard
  END;
  PERFORM set_config('role','postgres', true);
  IF ok <> _should THEN
    RAISE EXCEPTION 'POE PROPERTIES SMOKE FAIL: % (expected write-succeeds=%, got %)', _label, _should, ok;
  END IF;
END $$;

-- Run claim_property_access() AS a user and return its receipt.
CREATE OR REPLACE FUNCTION pg_temp.claim_as(_who uuid)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE r jsonb;
BEGIN
  PERFORM set_config('role','authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role','authenticated')::text, true);
  SELECT public.claim_property_access() INTO r;
  PERFORM set_config('role','postgres', true);
  RETURN r;
END $$;

DO $$
DECLARE
  t    uuid := '00000000-0000-4000-a000-0000000b0150';
  f    uuid := '00000000-0000-4000-a000-0000000c0150';
  w    uuid := '00000000-0000-4000-a000-0000000d0150';
  m    uuid := '00000000-0000-4000-a000-0000000e0150';
  s    uuid := '00000000-0000-4000-a000-0000000f0150';
  tenA uuid := '00000000-0000-4000-c000-00000000a150';
  tenB uuid := '00000000-0000-4000-c000-00000000b150';
  tC2  uuid := '00000000-0000-4000-c000-00000000c150';
  reqA uuid := '00000000-0000-4000-d000-00000000a150';
  reqB uuid := '00000000-0000-4000-d000-00000000b150';
  reqC uuid := '00000000-0000-4000-d000-00000000c150';
  msgA uuid := '00000000-0000-4000-e000-00000000a150';
  ntcA uuid := '00000000-0000-4000-e000-00000000b150';
  rntA uuid := '00000000-0000-4000-e000-00000000c150';
  inst uuid := '00000000-0000-4000-b000-000000010150';
  rcpt jsonb;
BEGIN
  -- 1. AN INVITE IS NOT ACCESS. Nothing is visible before the claim.
  PERFORM pg_temp.assert_sees(t, 'rental_tenancies', tenA, 'T sees door A BEFORE claiming', false);
  PERFORM pg_temp.assert_sees(f, 'tenant_messages',  msgA, 'F sees the thread BEFORE claiming', false);
  PERFORM pg_temp.assert_sees(w, 'tenant_maintenance_requests', reqA, 'W sees the job BEFORE claiming', false);

  -- 2. NO INVITE, NO GRANT. A stranger's claim is a no-op.
  rcpt := pg_temp.claim_as(s);
  IF (rcpt->>'claimed')::int <> 0 THEN
    RAISE EXCEPTION 'POE PROPERTIES SMOKE FAIL: stranger claimed % invites', rcpt->>'claimed';
  END IF;
  PERFORM pg_temp.assert_count(s, 'rental_tenancies', 'stranger sees no doors', 0);

  -- 3. THE TENANT CLAIMS. Their door only.
  rcpt := pg_temp.claim_as(t);
  IF (rcpt->>'tenancies')::int <> 1 THEN
    RAISE EXCEPTION 'POE PROPERTIES SMOKE FAIL: tenant claim stamped % tenancies', rcpt->>'tenancies';
  END IF;
  PERFORM pg_temp.assert_sees(t, 'rental_tenancies',            tenA, 'T reads their door',        true);
  PERFORM pg_temp.assert_sees(t, 'rental_tenancies',            tenB, 'T reads the OTHER door',    false);
  PERFORM pg_temp.assert_sees(t, 'tenant_maintenance_requests', reqA, 'T reads their work order',  true);
  PERFORM pg_temp.assert_sees(t, 'tenant_maintenance_requests', reqB, 'T reads door B work order', false);
  PERFORM pg_temp.assert_sees(t, 'tenant_messages',             msgA, 'T reads their thread',      true);
  PERFORM pg_temp.assert_sees(t, 'rent_records',                rntA, 'T reads their payment history', true);

  -- 4. THE TENANT'S FAMILY. Same door, no rent write.
  rcpt := pg_temp.claim_as(f);
  IF (rcpt->>'household')::int <> 1 THEN
    RAISE EXCEPTION 'POE PROPERTIES SMOKE FAIL: household claim recorded % members', rcpt->>'household';
  END IF;
  PERFORM pg_temp.assert_sees(f, 'tenant_maintenance_requests', reqA, 'F reads the door work order', true);
  PERFORM pg_temp.assert_sees(f, 'tenant_messages',             msgA, 'F reads the door thread',     true);
  PERFORM pg_temp.assert_sees(f, 'tenant_notices',              ntcA, 'F reads the door notice',     true);
  PERFORM pg_temp.assert_sees(f, 'rent_records',                rntA, 'F reads the payment history', true);
  PERFORM pg_temp.assert_sees(f, 'tenant_maintenance_requests', reqB, 'F reads door B',              false);
  PERFORM pg_temp.assert_write(f,
    format('INSERT INTO tenant_maintenance_requests (instance_id, tenancy_id, created_by_role, title, priority, status) VALUES (%L,%L,%L,%L,%L,%L)',
           inst, tenA, 'household', 'Family reports a leak', 'normal', 'submitted'),
    'F files a work order', true);
  PERFORM pg_temp.assert_write(f,
    format('INSERT INTO tenant_messages (instance_id, tenancy_id, from_role, body) VALUES (%L,%L,%L,%L)',
           inst, tenA, 'household', 'We are home after 5.'),
    'F writes on the thread', true);
  PERFORM pg_temp.assert_write(f,
    format('INSERT INTO tenancy_notes (instance_id, tenancy_id, author_role, body) VALUES (%L,%L,%L,%L)',
           inst, tenA, 'household', 'Left the gate unlocked for the plumber.'),
    'F writes a note', true);
  PERFORM pg_temp.assert_write(f,
    format('INSERT INTO rent_records (instance_id, tenancy_id, reported_by_role, amount, for_period, method, status) VALUES (%L,%L,%L,%L,%L,%L,%L)',
           inst, tenA, 'tenant', 900, '2026-09', 'zelle', 'reported'),
    'F reports rent (must be refused — rent stays with the signer)', false);

  -- 5. THE 1099 WORKER. The ceiling is the function: rent.adjust was ASKED FOR
  --    in the invite and must NOT exist after the claim.
  rcpt := pg_temp.claim_as(w);
  IF (rcpt->>'grants')::int <> 2 THEN
    RAISE EXCEPTION 'POE PROPERTIES SMOKE FAIL: worker claim wrote % grants (expected exactly docs.add + property.history)', rcpt->>'grants';
  END IF;
  IF EXISTS (SELECT 1 FROM delegated_capabilities WHERE grantee_user_id = w AND capability = 'rent.adjust') THEN
    RAISE EXCEPTION 'POE PROPERTIES SMOKE FAIL: the field-worker ceiling LEAKED rent.adjust';
  END IF;
  PERFORM pg_temp.assert_sees(w, 'tenant_maintenance_requests', reqA, 'W reads the job',            true);
  PERFORM pg_temp.assert_sees(w, 'rent_records',                rntA, 'W reads the rent ledger',    false);
  PERFORM pg_temp.assert_sees(w, 'tenant_messages',             msgA, 'W reads the enabled thread', true);
  PERFORM pg_temp.assert_write(w,
    format('INSERT INTO request_documentation (instance_id, request_id, tenancy_id, outcome, followup, note) VALUES (%L,%L,%L,%L,%L,%L)',
           inst, reqA, tenA, 'not_fixed', 'needs_parts', 'Ordered the igniter.'),
    'W documents the job', true);
  PERFORM pg_temp.assert_write(w,
    format('INSERT INTO tenancy_notes (instance_id, tenancy_id, author_role, body) VALUES (%L,%L,%L,%L)',
           inst, tenA, 'worker', 'Tenant was home; part arrives Thursday.'),
    'W writes a note', true);
  -- The thread must be able to say WORKER. Before 0150 widened the CHECK the only
  -- values were tenant/landlord/manager, so a handyman's message had to pose as
  -- the manager's — on a record whose entire purpose is judging who did what, when.
  PERFORM pg_temp.assert_write(w,
    format('INSERT INTO tenant_messages (instance_id, tenancy_id, from_role, body) VALUES (%L,%L,%L,%L)',
           inst, tenA, 'worker', 'Igniter is in; back Thursday morning.'),
    'W speaks on the thread AS the worker', true);

  -- 6. THE BOOKS ARE THE INSTANCE'S. A rent.adjust manager may correct a balance
  --    but may NEVER stamp the posting columns.
  rcpt := pg_temp.claim_as(m);
  PERFORM pg_temp.assert_write(m,
    format('UPDATE rent_records SET amount = 875 WHERE id = %L', rntA),
    'manager adjusts the balance (rent.adjust)', true);
  PERFORM pg_temp.assert_write(m,
    format('UPDATE rent_records SET posted_tx_id = %L WHERE id = %L', 'tx-forged', rntA),
    'manager posts to the BOOKS (must be refused)', false);

  -- 7. SINGLE USE. A second claim grants nothing more.
  rcpt := pg_temp.claim_as(t);
  IF (rcpt->>'claimed')::int <> 0 THEN
    RAISE EXCEPTION 'POE PROPERTIES SMOKE FAIL: an invite was claimable twice (%)', rcpt->>'claimed';
  END IF;

  -- 8. NO CROSS-LANDLORD LEAK. Instance I2's door is invisible to everyone in I.
  PERFORM pg_temp.assert_sees(t, 'rental_tenancies',            tC2,  'T sees the other landlord',  false);
  PERFORM pg_temp.assert_sees(f, 'tenant_maintenance_requests', reqC, 'F sees the other landlord',  false);
  PERFORM pg_temp.assert_sees(w, 'tenant_maintenance_requests', reqC, 'W sees the other landlord',  false);
  PERFORM pg_temp.assert_sees(m, 'tenant_maintenance_requests', reqC, 'M sees the other landlord',  false);

  RAISE NOTICE 'POE PROPERTIES SMOKE: PASS';
END $$;

ROLLBACK;
