-- =============================================================================
-- 0075 ISOLATION SMOKE TEST — the enablement gate for delegated property management
-- =============================================================================
-- Run this on the LIVE NAS Supabase (as the postgres superuser) AFTER applying
-- 0075-delegated-property-management.sql and BEFORE any delegate (non-family
-- property manager / field worker / enabled handyman) account is turned on in the
-- app. It PROVES the scoped row-level security actually isolates people — the exact
-- verification DR-0076 requires ("no unverified multi-tenant isolation marked done").
-- Everything runs in a transaction and ROLLS BACK, so it leaves no data behind. A
-- PASS prints 'ISOLATION SMOKE: PASS'; any leak or wrong grant RAISES.
--
-- The scenario (one landlord instance I + a SEPARATE instance I2):
--   Instance I, owner O.
--   Manager M_A — delegated on scope_ref='PROP-A' (request.manage, rentroll.view,
--                 message.tenant, rent.adjust). role_label 'manager'.
--   Manager M_B — delegated on scope_ref='PROP-B' (request.manage, rentroll.view).
--   Worker  W  — delegated on scope_ref='PROP-A' (property.history, docs.add ONLY).
--                role_label 'field_worker'. No message.tenant, no rentroll.view.
--   Tenant  T  — the tenant on tenancy A (rental_ref='PROP-A').
--   Tenancy B  — a second door (rental_ref='PROP-B'), no tenant account.
--   Handyman H — a worker NOT enabled on T's tenancy (until we flip the switch).
--   Stranger S — no grants at all.
--   Instance I2 — a DIFFERENT family: one tenancy whose rental_ref is ALSO 'PROP-A'
--                 (a deliberate scope_ref COLLISION) — proves the grant is
--                 instance-scoped and cannot leak across the instance boundary.
--   Data in I: a maintenance request on A and on B, a rent_record on A, a
--              tenant_message on A. Data in I2: a tenancy + a request.
--
-- The assertions (what MUST hold):
--   M_A reads PROP-A request        ✔   M_A reads PROP-B tenancy/request ✘ (cross-mgr)
--   M_B reads PROP-A request        ✘   W   reads PROP-A request         ✔ (property.history)
--   W inserts request_documentation ✔   W   inserts tenant_message       ✘ (no message.tenant)
--   W reads rent_records            ✘   M_A inserts rent_balance_adj     ✔ (rent.adjust)
--   W inserts rent_balance_adj      ✘   H reads T messages (not enabled) ✘
--   H reads T messages after enable ✔ (the enable flips it)
--   S sees NOTHING across all tables ✘   nobody sees anything in I2       ✘ (no leak)
-- =============================================================================
BEGIN;

-- Fixed test UUIDs (namespaced so they can't collide with real users).
\set owner    '00000000-0000-4000-a000-0000000a0075'
\set m_a      '00000000-0000-4000-a000-0000000b0075'
\set m_b      '00000000-0000-4000-a000-0000000c0075'
\set worker   '00000000-0000-4000-a000-0000000d0075'
\set tenant   '00000000-0000-4000-a000-0000000e0075'
\set handyman '00000000-0000-4000-a000-0000000f0075'
\set stranger '00000000-0000-4000-a000-0000001a0075'
\set owner2   '00000000-0000-4000-a000-0000002a0075'

\set inst  '00000000-0000-4000-b000-000000010075'
\set inst2 '00000000-0000-4000-b000-000000020075'

\set ten_a '00000000-0000-4000-c000-0000000a0075'
\set ten_b '00000000-0000-4000-c000-0000000b0075'
\set ten_x '00000000-0000-4000-c000-0000000c0075'

\set req_a  '00000000-0000-4000-d000-0000000a0075'
\set req_b  '00000000-0000-4000-d000-0000000b0075'
\set req_x  '00000000-0000-4000-d000-0000000c0075'
\set rent_a '00000000-0000-4000-d000-0000000e0075'
\set msg_a  '00000000-0000-4000-d000-0000000f0075'

-- Minimal auth.users rows so the FKs resolve (superuser bypasses RLS for setup).
-- Include the columns GoTrue marks NOT NULL so the insert holds across schema
-- versions (instance_id/aud/role/encrypted_password/timestamps); the rest default.
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', :'owner',   'authenticated','authenticated','owner075@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'m_a',     'authenticated','authenticated','ma075@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'m_b',     'authenticated','authenticated','mb075@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'worker',  'authenticated','authenticated','worker075@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'tenant',  'authenticated','authenticated','tenant075@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'handyman','authenticated','authenticated','handyman075@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'stranger','authenticated','authenticated','stranger075@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'owner2',  'authenticated','authenticated','owner2075@test.local','', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Two instances (a landlord I + a separate family I2).
INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  (:'inst',  'poe-rentals-075',   'Poe Rentals',   'family'),
  (:'inst2', 'other-rentals-075', 'Other Rentals', 'family');

-- Members: O owns I; O2 owns I2. The managers/workers/handyman/stranger are NOT
-- instance members — that is the whole point (scoped delegates, not members).
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  (:'inst',  :'owner',  'owner', 'Owner'),
  (:'inst2', :'owner2', 'owner', 'Owner Two');

-- Tenancies. A + B in I; X in I2 with a COLLIDING rental_ref 'PROP-A'.
INSERT INTO rental_tenancies (id, instance_id, tenant_user_id, rental_ref, property_label) VALUES
  (:'ten_a', :'inst',  :'tenant', 'PROP-A', 'Property A'),
  (:'ten_b', :'inst',  NULL,      'PROP-B', 'Property B'),
  (:'ten_x', :'inst2', NULL,      'PROP-A', 'Other-family Property A');

-- Maintenance requests: one on A, one on B (in I), one on X (in I2).
INSERT INTO tenant_maintenance_requests (id, instance_id, tenancy_id, title) VALUES
  (:'req_a', :'inst',  :'ten_a', 'Kitchen sink leak (A)'),
  (:'req_b', :'inst',  :'ten_b', 'Furnace check (B)'),
  (:'req_x', :'inst2', :'ten_x', 'Other-family request (X)');

-- A rent_record on A; a tenant_message on A.
INSERT INTO rent_records (id, instance_id, tenancy_id, amount, for_period) VALUES
  (:'rent_a', :'inst', :'ten_a', 1200, '2026-07');
INSERT INTO tenant_messages (id, instance_id, tenancy_id, sender_user_id, from_role, body) VALUES
  (:'msg_a', :'inst', :'ten_a', :'tenant', 'tenant', 'The sink is dripping.');

-- Grants. M_A: PROP-A manager caps. M_B: PROP-B. W: PROP-A field-worker caps only.
INSERT INTO delegated_capabilities (instance_id, grantee_user_id, scope_ref, capability, setting, granted_by, role_label) VALUES
  (:'inst', :'m_a',    'PROP-A', 'request.manage',    'allow', :'owner', 'manager'),
  (:'inst', :'m_a',    'PROP-A', 'rentroll.view',     'allow', :'owner', 'manager'),
  (:'inst', :'m_a',    'PROP-A', 'message.tenant',    'allow', :'owner', 'manager'),
  (:'inst', :'m_a',    'PROP-A', 'rent.adjust',       'allow', :'owner', 'manager'),
  (:'inst', :'m_b',    'PROP-B', 'request.manage',    'allow', :'owner', 'manager'),
  (:'inst', :'m_b',    'PROP-B', 'rentroll.view',     'allow', :'owner', 'manager'),
  (:'inst', :'worker', 'PROP-A', 'property.history',  'allow', :'owner', 'field_worker'),
  (:'inst', :'worker', 'PROP-A', 'docs.add',          'allow', :'owner', 'field_worker');

-- ── Assertion helpers (impersonate a user via the jwt claim, like 0074) ─────────

-- Is a specific row (by id) visible to a user under RLS?
CREATE OR REPLACE FUNCTION pg_temp.assert_sees(_who uuid, _table text, _id uuid, _label text, _should boolean)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE seen boolean;
BEGIN
  PERFORM set_config('role','authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role','authenticated')::text, true);
  EXECUTE format('SELECT EXISTS (SELECT 1 FROM %I WHERE id = %L)', _table, _id) INTO seen;
  PERFORM set_config('role','postgres', true);   -- back to superuser for the next setup
  IF seen <> _should THEN
    RAISE EXCEPTION 'ISOLATION SMOKE FAIL: % (expected visible=%, got %)', _label, _should, seen;
  END IF;
END $$;

-- How many rows of a table does a user see under RLS?
CREATE OR REPLACE FUNCTION pg_temp.assert_count(_who uuid, _table text, _label text, _expected int)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE n int;
BEGIN
  PERFORM set_config('role','authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role','authenticated')::text, true);
  EXECUTE format('SELECT count(*) FROM %I', _table) INTO n;
  PERFORM set_config('role','postgres', true);
  IF n <> _expected THEN
    RAISE EXCEPTION 'ISOLATION SMOKE FAIL: % expected % rows in %, saw %', _label, _expected, _table, n;
  END IF;
END $$;

-- Does an INSERT succeed (WITH CHECK passes) or get blocked by RLS, for a user?
-- A blocked insert raises insufficient_privilege (42501); we catch it and roll the
-- attempt back via the implicit plpgsql savepoint. _sql must supply all NOT NULL /
-- CHECK-valid columns so ONLY the RLS policy can reject it.
CREATE OR REPLACE FUNCTION pg_temp.assert_insert(_who uuid, _sql text, _label text, _should boolean)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE ok boolean := true;
BEGIN
  PERFORM set_config('role','authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role','authenticated')::text, true);
  BEGIN
    EXECUTE _sql;
  EXCEPTION WHEN insufficient_privilege THEN
    ok := false;
  END;
  PERFORM set_config('role','postgres', true);
  IF ok <> _should THEN
    RAISE EXCEPTION 'ISOLATION SMOKE FAIL: % (expected insert-succeeds=%, got %)', _label, _should, ok;
  END IF;
END $$;

DO $$
DECLARE
  o    uuid := '00000000-0000-4000-a000-0000000a0075';   -- owner
  ma   uuid := '00000000-0000-4000-a000-0000000b0075';   -- manager A
  mb   uuid := '00000000-0000-4000-a000-0000000c0075';   -- manager B
  w    uuid := '00000000-0000-4000-a000-0000000d0075';   -- field worker
  h    uuid := '00000000-0000-4000-a000-0000000f0075';   -- handyman
  s    uuid := '00000000-0000-4000-a000-0000001a0075';   -- stranger
  inst  uuid := '00000000-0000-4000-b000-000000010075';
  tenA uuid := '00000000-0000-4000-c000-0000000a0075';
  tenB uuid := '00000000-0000-4000-c000-0000000b0075';
  tenX uuid := '00000000-0000-4000-c000-0000000c0075';
  reqA uuid := '00000000-0000-4000-d000-0000000a0075';
  reqB uuid := '00000000-0000-4000-d000-0000000b0075';
  reqX uuid := '00000000-0000-4000-d000-0000000c0075';
  rentA uuid := '00000000-0000-4000-d000-0000000e0075';
  msgA uuid := '00000000-0000-4000-d000-0000000f0075';
BEGIN
  -- ── Manager scope: M_A reaches only PROP-A ───────────────────────────────────
  PERFORM pg_temp.assert_sees(ma, 'tenant_maintenance_requests', reqA, 'M_A reads PROP-A request', true);
  PERFORM pg_temp.assert_sees(ma, 'rental_tenancies',            tenA, 'M_A reads PROP-A tenancy',  true);
  PERFORM pg_temp.assert_sees(ma, 'rent_records',                rentA,'M_A reads PROP-A rent (rentroll.view)', true);
  -- Cross-manager isolation: M_A must NOT see PROP-B's tenancy or request.
  PERFORM pg_temp.assert_sees(ma, 'rental_tenancies',            tenB, 'M_A must NOT read PROP-B tenancy',  false);
  PERFORM pg_temp.assert_sees(ma, 'tenant_maintenance_requests', reqB, 'M_A must NOT read PROP-B request',  false);
  -- M_B must NOT see PROP-A's request.
  PERFORM pg_temp.assert_sees(mb, 'tenant_maintenance_requests', reqA, 'M_B must NOT read PROP-A request',  false);

  -- ── Field worker: read via property.history, doc via docs.add, nothing more ──
  PERFORM pg_temp.assert_sees(w, 'tenant_maintenance_requests', reqA, 'W reads PROP-A request (property.history)', true);
  PERFORM pg_temp.assert_sees(w, 'rental_tenancies',            tenA, 'W reads PROP-A tenancy (property.history)', true);
  -- W has NO rentroll.view -> cannot read rent_records.
  PERFORM pg_temp.assert_sees(w, 'rent_records',                rentA,'W must NOT read rent_records (no rentroll.view)', false);
  -- W CAN append request documentation (docs.add).
  PERFORM pg_temp.assert_insert(w,
    format($f$INSERT INTO request_documentation (instance_id,request_id,tenancy_id,author_user_id,outcome,note)
              VALUES (%L,%L,%L,%L,'fixed','Replaced the washer.')$f$, inst, reqA, tenA, w),
    'W inserts request_documentation (docs.add)', true);
  -- W CANNOT post a tenant_message (no message.tenant, not an enabled worker).
  PERFORM pg_temp.assert_insert(w,
    format($f$INSERT INTO tenant_messages (instance_id,tenancy_id,sender_user_id,from_role,body)
              VALUES (%L,%L,%L,'manager','hello')$f$, inst, tenA, w),
    'W must NOT post tenant_message (no message.tenant)', false);

  -- ── Rent-balance audit: rent.adjust may append; a field worker may not ───────
  PERFORM pg_temp.assert_insert(ma,
    format($f$INSERT INTO rent_balance_adjustments (instance_id,tenancy_id,adjusted_by,old_balance,new_balance,reason)
              VALUES (%L,%L,%L,1200,1100,'Applied credit')$f$, inst, tenA, ma),
    'M_A appends rent_balance_adjustment (rent.adjust)', true);
  PERFORM pg_temp.assert_insert(w,
    format($f$INSERT INTO rent_balance_adjustments (instance_id,tenancy_id,adjusted_by,old_balance,new_balance,reason)
              VALUES (%L,%L,%L,1200,1000,'nope')$f$, inst, tenA, w),
    'W must NOT append rent_balance_adjustment (no rent.adjust)', false);

  -- ── Enabled handyman channel: the switch flips read access on tenant_messages ─
  PERFORM pg_temp.assert_sees(h, 'tenant_messages', msgA, 'H must NOT read T messages (not enabled)', false);
  -- Owner enables H on T's tenancy (superuser insert; RLS bypassed for setup).
  PERFORM set_config('role','postgres', true);
  INSERT INTO tenancy_worker_access (instance_id, tenancy_id, worker_user_id, enabled_by, active)
    VALUES (inst, tenA, h, o, true);
  PERFORM pg_temp.assert_sees(h, 'tenant_messages', msgA, 'H reads T messages AFTER enable', true);

  -- ── Stranger sees NOTHING across every delegated + tenant-scoped table ────────
  PERFORM pg_temp.assert_count(s, 'rental_tenancies',            'S sees no tenancies',            0);
  PERFORM pg_temp.assert_count(s, 'tenant_maintenance_requests', 'S sees no requests',             0);
  PERFORM pg_temp.assert_count(s, 'rent_records',                'S sees no rent_records',         0);
  PERFORM pg_temp.assert_count(s, 'tenant_messages',             'S sees no tenant_messages',      0);
  PERFORM pg_temp.assert_count(s, 'tenant_notices',              'S sees no tenant_notices',       0);
  PERFORM pg_temp.assert_count(s, 'delegated_capabilities',      'S sees no grants',               0);
  PERFORM pg_temp.assert_count(s, 'tenancy_worker_access',       'S sees no worker enablements',   0);
  PERFORM pg_temp.assert_count(s, 'request_documentation',       'S sees no request docs',         0);
  PERFORM pg_temp.assert_count(s, 'rent_balance_adjustments',    'S sees no balance adjustments',  0);

  -- ── No cross-instance leak: I2's tenancy/request (rental_ref COLLIDES on
  --    'PROP-A') is invisible to every delegate of instance I ──────────────────
  PERFORM pg_temp.assert_sees(ma, 'rental_tenancies',            tenX, 'M_A must NOT read I2 tenancy (scope collision)', false);
  PERFORM pg_temp.assert_sees(ma, 'tenant_maintenance_requests', reqX, 'M_A must NOT read I2 request (scope collision)', false);
  PERFORM pg_temp.assert_sees(w,  'rental_tenancies',            tenX, 'W must NOT read I2 tenancy',   false);
  PERFORM pg_temp.assert_sees(w,  'tenant_maintenance_requests', reqX, 'W must NOT read I2 request',   false);
  PERFORM pg_temp.assert_sees(h,  'tenant_maintenance_requests', reqX, 'H must NOT read I2 request',   false);
  PERFORM pg_temp.assert_sees(s,  'tenant_maintenance_requests', reqX, 'S must NOT read I2 request',   false);

  RAISE NOTICE 'ISOLATION SMOKE: PASS';
END $$;

ROLLBACK;
