-- =============================================================================
-- 0111 ROLE-CONTROL SMOKE TEST — the enablement gate for set_member_role
-- =============================================================================
-- Run on the LIVE NAS Supabase (as postgres) AFTER applying 0111-set-member-role.sql.
-- PROVES the SECURITY-DEFINER role-change guards actually hold (DR-0076) before any
-- surface (Choir Roster, Admin console, the COLG/Love Corner instance) trusts it.
-- Runs in a transaction and ROLLS BACK. PASS prints 'ROLE CONTROL SMOKE: PASS';
-- any wrong grant RAISES.
--
-- Scenario (two instances I and I2):
--   Instance I:  owner O, admin A, admin A2, member M1, member M2.
--   Instance I2: owner O2, member M3.
--
-- Assertions (what MUST hold):
--   member M1 calls set_member_role                 -> RAISES (not owner/admin)   ✘
--   admin A sets M1 member->viewer                  -> changed                    ✔
--   admin A tries M1 -> admin                        -> RAISES (only owner)        ✘
--   admin A tries to change admin A2                 -> RAISES (only owner)        ✘
--   admin A tries to change owner O                  -> RAISES (owner untouchable) ✘
--   admin A tries to change SELF (A)                 -> RAISES (no self-change)    ✘
--   set_member_role(..., 'owner')                    -> RAISES (never owner)       ✘
--   owner O promotes M2 -> admin                     -> changed                    ✔
--   owner O of I tries to change M3 (member of I2)   -> RAISES (not a member here) ✘
--   O (no role in I2) calls set_member_role on I2    -> RAISES (only owner/admin)  ✘
--   list_instance_members(I) as admin A              -> >= 5 rows                  ✔
--   list_instance_members(I) as member M1            -> 0 rows (not owner/admin)   ✘
--   list_instance_members(I2) as O                   -> 0 rows (no cross-instance) ✘
-- =============================================================================
BEGIN;

\set o   '00000000-0000-4000-a000-0000000a0111'
\set a   '00000000-0000-4000-a000-0000000b0111'
\set a2  '00000000-0000-4000-a000-0000000c0111'
\set m1  '00000000-0000-4000-a000-0000000d0111'
\set m2  '00000000-0000-4000-a000-0000000e0111'
\set o2  '00000000-0000-4000-a000-0000000f0111'
\set m3  '00000000-0000-4000-a000-0000001a0111'

\set inst  '00000000-0000-4000-b000-000000010111'
\set inst2 '00000000-0000-4000-b000-000000020111'

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', :'o',  'authenticated','authenticated','o0111@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'a',  'authenticated','authenticated','a0111@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'a2', 'authenticated','authenticated','a2-0111@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'m1', 'authenticated','authenticated','m1-0111@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'m2', 'authenticated','authenticated','m2-0111@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'o2', 'authenticated','authenticated','o2-0111@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'m3', 'authenticated','authenticated','m3-0111@test.local','', now(), now());

INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  (:'inst',  'colg-0111',  'COLG role test',   'church'),
  (:'inst2', 'other-0111', 'Other role test',  'church');
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  (:'inst',  :'o',  'owner',  'Owner O'),
  (:'inst',  :'a',  'admin',  'Admin A'),
  (:'inst',  :'a2', 'admin',  'Admin A2'),
  (:'inst',  :'m1', 'member', 'Member M1'),
  (:'inst',  :'m2', 'member', 'Member M2'),
  (:'inst2', :'o2', 'owner',  'Owner O2'),
  (:'inst2', :'m3', 'member', 'Member M3');

-- ── Helpers ────────────────────────────────────────────────────────────────
-- Call set_member_role AS a user; return the status, or NULL if it RAISED.
CREATE OR REPLACE FUNCTION pg_temp.set_as(_who uuid, _inst uuid, _target uuid, _role text)
RETURNS text LANGUAGE plpgsql AS $$
DECLARE r jsonb;
BEGIN
  PERFORM set_config('role','authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role','authenticated')::text, true);
  BEGIN
    r := public.set_member_role(_inst, _target, _role);
  EXCEPTION WHEN others THEN
    PERFORM set_config('role','postgres', true);
    RETURN NULL;
  END;
  PERFORM set_config('role','postgres', true);
  RETURN r->>'status';
END $$;

-- Count rows list_instance_members returns for a user in an instance.
CREATE OR REPLACE FUNCTION pg_temp.list_count(_who uuid, _inst uuid)
RETURNS int LANGUAGE plpgsql AS $$
DECLARE n int;
BEGIN
  PERFORM set_config('role','authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role','authenticated')::text, true);
  SELECT count(*) INTO n FROM public.list_instance_members(_inst);
  PERFORM set_config('role','postgres', true);
  RETURN n;
END $$;

-- Count instances list_my_admin_instances returns for a user (0112).
CREATE OR REPLACE FUNCTION pg_temp.admin_count(_who uuid)
RETURNS int LANGUAGE plpgsql AS $$
DECLARE n int;
BEGIN
  PERFORM set_config('role','authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role','authenticated')::text, true);
  SELECT count(*) INTO n FROM public.list_my_admin_instances();
  PERFORM set_config('role','postgres', true);
  RETURN n;
END $$;

DO $$
DECLARE
  o    uuid := '00000000-0000-4000-a000-0000000a0111';
  a    uuid := '00000000-0000-4000-a000-0000000b0111';
  a2   uuid := '00000000-0000-4000-a000-0000000c0111';
  m1   uuid := '00000000-0000-4000-a000-0000000d0111';
  m2   uuid := '00000000-0000-4000-a000-0000000e0111';
  m3   uuid := '00000000-0000-4000-a000-0000001a0111';
  o2   uuid := '00000000-0000-4000-a000-0000000f0111';
  inst  uuid := '00000000-0000-4000-b000-000000010111';
  inst2 uuid := '00000000-0000-4000-b000-000000020111';
BEGIN
  -- A plain member cannot change roles.
  IF pg_temp.set_as(m1, inst, m2, 'viewer') IS NOT NULL THEN
    RAISE EXCEPTION 'ROLE CONTROL SMOKE FAIL: a member was able to change a role';
  END IF;

  -- An admin can move a member member->viewer.
  IF pg_temp.set_as(a, inst, m1, 'viewer') <> 'changed' THEN
    RAISE EXCEPTION 'ROLE CONTROL SMOKE FAIL: an admin could not set member->viewer';
  END IF;
  IF (SELECT role FROM instance_members WHERE instance_id = inst AND user_id = m1) <> 'viewer' THEN
    RAISE EXCEPTION 'ROLE CONTROL SMOKE FAIL: M1 role did not become viewer';
  END IF;

  -- An admin cannot grant admin.
  IF pg_temp.set_as(a, inst, m1, 'admin') IS NOT NULL THEN
    RAISE EXCEPTION 'ROLE CONTROL SMOKE FAIL: an admin granted admin (only an owner may)';
  END IF;

  -- An admin cannot change another admin.
  IF pg_temp.set_as(a, inst, a2, 'member') IS NOT NULL THEN
    RAISE EXCEPTION 'ROLE CONTROL SMOKE FAIL: an admin changed another admin (only an owner may)';
  END IF;

  -- An admin cannot touch an owner.
  IF pg_temp.set_as(a, inst, o, 'member') IS NOT NULL THEN
    RAISE EXCEPTION 'ROLE CONTROL SMOKE FAIL: an owner was demotable via the control';
  END IF;

  -- No self-change.
  IF pg_temp.set_as(a, inst, a, 'member') IS NOT NULL THEN
    RAISE EXCEPTION 'ROLE CONTROL SMOKE FAIL: a caller changed their own role';
  END IF;

  -- Never grant owner.
  IF pg_temp.set_as(o, inst, m2, 'owner') IS NOT NULL THEN
    RAISE EXCEPTION 'ROLE CONTROL SMOKE FAIL: owner was grantable via the control';
  END IF;

  -- An owner CAN promote to admin.
  IF pg_temp.set_as(o, inst, m2, 'admin') <> 'changed' THEN
    RAISE EXCEPTION 'ROLE CONTROL SMOKE FAIL: an owner could not promote a member to admin';
  END IF;

  -- Cross-instance: the target must be a member of THIS instance.
  IF pg_temp.set_as(o, inst, m3, 'viewer') IS NOT NULL THEN
    RAISE EXCEPTION 'ROLE CONTROL SMOKE FAIL: changed a role for a non-member of this instance';
  END IF;
  -- And an outsider owner has no authority in I2.
  IF pg_temp.set_as(o, inst2, m3, 'viewer') IS NOT NULL THEN
    RAISE EXCEPTION 'ROLE CONTROL SMOKE FAIL: an outsider changed a role across the instance boundary';
  END IF;

  -- list_instance_members: admin sees the roster; a member sees nothing; no cross leak.
  IF pg_temp.list_count(a, inst) < 5 THEN
    RAISE EXCEPTION 'ROLE CONTROL SMOKE FAIL: admin list_instance_members returned % (expected >= 5)', pg_temp.list_count(a, inst);
  END IF;
  IF pg_temp.list_count(m1, inst) <> 0 THEN
    RAISE EXCEPTION 'ROLE CONTROL SMOKE FAIL: a non-admin could list instance members (%)', pg_temp.list_count(m1, inst);
  END IF;
  IF pg_temp.list_count(o, inst2) <> 0 THEN
    RAISE EXCEPTION 'ROLE CONTROL SMOKE FAIL: list_instance_members leaked across the instance boundary (%)', pg_temp.list_count(o, inst2);
  END IF;

  -- list_my_admin_instances (0112): owner/admin see their OWN admin spaces only.
  IF pg_temp.admin_count(o) <> 1 THEN
    RAISE EXCEPTION 'ROLE CONTROL SMOKE FAIL: owner O should administer exactly 1 space, saw %', pg_temp.admin_count(o);
  END IF;
  IF pg_temp.admin_count(a) <> 1 THEN
    RAISE EXCEPTION 'ROLE CONTROL SMOKE FAIL: admin A should administer exactly 1 space, saw %', pg_temp.admin_count(a);
  END IF;
  IF pg_temp.admin_count(m1) <> 0 THEN
    RAISE EXCEPTION 'ROLE CONTROL SMOKE FAIL: a non-admin (M1) should administer 0 spaces, saw %', pg_temp.admin_count(m1);
  END IF;
  IF pg_temp.admin_count(o2) <> 1 THEN
    RAISE EXCEPTION 'ROLE CONTROL SMOKE FAIL: owner O2 should administer exactly its own 1 space, saw %', pg_temp.admin_count(o2);
  END IF;

  RAISE NOTICE 'ROLE CONTROL SMOKE: PASS';
END $$;

ROLLBACK;
