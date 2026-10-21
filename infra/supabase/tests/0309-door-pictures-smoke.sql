-- =============================================================================
-- 0309 SMOKE — a door shows its pictures to its people (DR-1197)
-- =============================================================================
-- Runs in CI on a throwaway PostgreSQL (the door-work leg) and on the LIVE
-- database in the rls-isolation poe-properties leg. One transaction; ROLLS
-- BACK. PASS prints 'DOOR PICTURES SMOKE: PASS'; any wrong sight RAISES.
--
-- Scenario: landlord instance F, owner O. Door D (tenancy V, tenant T,
-- household H, worker W delegated docs.add on D) and door X (nobody of
-- theirs). Pictures: P1 a listing shot on D; P2 a turn shot on D; P3 a listing
-- shot on X; P4 T's own move-in picture on V. Rooms: R1 on D, R2 on X.
--
--   T reads D's listing shot and their own picture, not the turn shot     ✔
--   T reads nothing of X: not its listing shot, not its room              ✔
--   H reads what T reads                                                  ✔
--   W reads D's door-level pictures (0185), not X's                       ✔
--   S (a stranger) reads nothing                                          ✔
--   T reads D's room; not X's                                             ✔
--   O turns the switch off on D: T loses the listing shot and the room,
--     keeps their own picture; O still reads everything                   ✔
-- =============================================================================
BEGIN;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000a0309', 'authenticated','authenticated','o0309@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000b0309', 'authenticated','authenticated','t0309@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000c0309', 'authenticated','authenticated','h0309@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000d0309', 'authenticated','authenticated','w0309@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000e0309', 'authenticated','authenticated','s0309@test.local','', now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  ('00000000-0000-4000-b000-000000010309', 'door-pictures-smoke-309', 'Door Pictures Smoke', 'family')
ON CONFLICT (id) DO NOTHING;
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  ('00000000-0000-4000-b000-000000010309', '00000000-0000-4000-a000-0000000a0309', 'owner', 'Owner O')
ON CONFLICT DO NOTHING;
INSERT INTO rentals (id, instance_id, created_by, slug, display_name, address, unit, property_type, status) VALUES
  ('00000000-0000-4000-c000-0000000a0309', '00000000-0000-4000-b000-000000010309', '00000000-0000-4000-a000-0000000a0309', 'DOOR-D-309', 'Door D', '805 D St', 'Apt 1', 'multi-family', 'occupied'),
  ('00000000-0000-4000-c000-0000000b0309', '00000000-0000-4000-b000-000000010309', '00000000-0000-4000-a000-0000000a0309', 'DOOR-X-309', 'Door X', '806 X St', 'Apt 1', 'multi-family', 'vacant');
INSERT INTO rental_tenancies (id, instance_id, created_by, rental_ref, property_label, status, tenant_user_id) VALUES
  ('00000000-0000-4000-c100-0000000a0309', '00000000-0000-4000-b000-000000010309', '00000000-0000-4000-a000-0000000a0309', 'DOOR-D-309', '805 D St Apt 1', 'active', '00000000-0000-4000-a000-0000000b0309');
INSERT INTO tenancy_household (instance_id, tenancy_id, member_user_id, display_name, added_by) VALUES
  ('00000000-0000-4000-b000-000000010309', '00000000-0000-4000-c100-0000000a0309', '00000000-0000-4000-a000-0000000c0309', 'Household H', '00000000-0000-4000-a000-0000000a0309');
INSERT INTO delegated_capabilities (instance_id, grantee_user_id, scope_ref, capability, setting, granted_by, role_label) VALUES
  ('00000000-0000-4000-b000-000000010309', '00000000-0000-4000-a000-0000000d0309', 'DOOR-D-309', 'docs.add', 'allow', '00000000-0000-4000-a000-0000000a0309', 'field_worker');
INSERT INTO property_rooms (id, instance_id, rental_ref, name, kind) VALUES
  ('00000000-0000-4000-d000-0000000a0309', '00000000-0000-4000-b000-000000010309', '00000000-0000-4000-c000-0000000a0309', 'Kitchen', 'kitchen'),
  ('00000000-0000-4000-d000-0000000b0309', '00000000-0000-4000-b000-000000010309', '00000000-0000-4000-c000-0000000b0309', 'Kitchen', 'kitchen');
INSERT INTO property_photos (id, instance_id, rental_ref, tenancy_id, kind, caption, storage_path) VALUES
  ('00000000-0000-4000-e000-0000000a0309', '00000000-0000-4000-b000-000000010309', '00000000-0000-4000-c000-0000000a0309', NULL, 'listing', 'D kitchen', 'data:image/jpeg;base64,AAAA'),
  ('00000000-0000-4000-e000-0000000b0309', '00000000-0000-4000-b000-000000010309', '00000000-0000-4000-c000-0000000a0309', NULL, 'turn', 'D turn', 'data:image/jpeg;base64,AAAA'),
  ('00000000-0000-4000-e000-0000000c0309', '00000000-0000-4000-b000-000000010309', '00000000-0000-4000-c000-0000000b0309', NULL, 'listing', 'X kitchen', 'data:image/jpeg;base64,AAAA'),
  ('00000000-0000-4000-e000-0000000d0309', '00000000-0000-4000-b000-000000010309', '00000000-0000-4000-c000-0000000a0309', '00000000-0000-4000-c100-0000000a0309', 'move-in-condition', 'T move-in', 'data:image/jpeg;base64,AAAA');

CREATE OR REPLACE FUNCTION pg_temp.as_user(_who uuid) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role', 'authenticated')::text, true);
END $$;
CREATE OR REPLACE FUNCTION pg_temp.as_postgres() RETURNS void LANGUAGE plpgsql AS $$
BEGIN PERFORM set_config('role', 'postgres', true); END $$;
CREATE OR REPLACE FUNCTION pg_temp.count_as(_who uuid, _sql text) RETURNS int LANGUAGE plpgsql AS $$
DECLARE n int;
BEGIN
  PERFORM pg_temp.as_user(_who);
  EXECUTE _sql INTO n;
  PERFORM pg_temp.as_postgres();
  RETURN n;
END $$;
CREATE OR REPLACE FUNCTION pg_temp.expect(_who uuid, _sql text, _want int, _label text) RETURNS void LANGUAGE plpgsql AS $$
DECLARE n int;
BEGIN
  n := pg_temp.count_as(_who, _sql);
  IF n <> _want THEN
    RAISE EXCEPTION 'DOOR PICTURES SMOKE FAIL: % (expected %, read %)', _label, _want, n;
  END IF;
END $$;

DO $$
DECLARE
  o     uuid := '00000000-0000-4000-a000-0000000a0309';
  t     uuid := '00000000-0000-4000-a000-0000000b0309';
  h     uuid := '00000000-0000-4000-a000-0000000c0309';
  w     uuid := '00000000-0000-4000-a000-0000000d0309';
  s     uuid := '00000000-0000-4000-a000-0000000e0309';
  doorD text := '00000000-0000-4000-c000-0000000a0309';
  doorX text := '00000000-0000-4000-c000-0000000b0309';
  door_level text;
  on_door text;
  on_x text;
  rooms_d text;
  rooms_x text;
BEGIN
  door_level := format('SELECT count(*)::int FROM property_photos WHERE rental_ref = %L AND tenancy_id IS NULL', doorD);
  on_door    := format('SELECT count(*)::int FROM property_photos WHERE rental_ref = %L', doorD);
  on_x       := format('SELECT count(*)::int FROM property_photos WHERE rental_ref = %L', doorX);
  rooms_d    := format('SELECT count(*)::int FROM property_rooms WHERE rental_ref = %L', doorD);
  rooms_x    := format('SELECT count(*)::int FROM property_rooms WHERE rental_ref = %L', doorX);

  -- The owner reads everything on both doors.
  PERFORM pg_temp.expect(o, on_door, 3, 'the owner reads every picture on D');
  PERFORM pg_temp.expect(o, on_x, 1, 'the owner reads the picture on X');

  -- The tenant: D's listing shot and their own picture; never the turn shot.
  PERFORM pg_temp.expect(t, door_level, 1, 'the tenant reads only the listing shot among D''s door-level pictures');
  PERFORM pg_temp.expect(t, on_door, 2, 'the tenant reads D''s listing shot and their own move-in picture');
  PERFORM pg_temp.expect(t, format('SELECT count(*)::int FROM property_photos WHERE rental_ref = %L AND kind = ''turn''', doorD), 0, 'the tenant never reads a turn shot');
  PERFORM pg_temp.expect(t, on_x, 0, 'the tenant reads nothing of door X');
  PERFORM pg_temp.expect(t, rooms_d, 1, 'the tenant reads D''s room');
  PERFORM pg_temp.expect(t, rooms_x, 0, 'the tenant reads no room of X');

  -- The household member reads what the tenant reads.
  PERFORM pg_temp.expect(h, on_door, 2, 'the household reads what the tenant reads on D');
  PERFORM pg_temp.expect(h, on_x, 0, 'the household reads nothing of X');
  PERFORM pg_temp.expect(h, rooms_d, 1, 'the household reads D''s room');

  -- The worker delegated on D reads D's door-level pictures (0185), nothing of X.
  PERFORM pg_temp.expect(w, door_level, 2, 'the worker reads both of D''s door-level pictures');
  PERFORM pg_temp.expect(w, on_x, 0, 'the worker reads nothing of X');
  PERFORM pg_temp.expect(w, rooms_d, 1, 'the worker reads D''s room');

  -- A stranger reads nothing.
  PERFORM pg_temp.expect(s, on_door, 0, 'a stranger reads no picture on D');
  PERFORM pg_temp.expect(s, rooms_d, 0, 'a stranger reads no room on D');

  -- The landlord turns the switch off on D.
  UPDATE rentals SET pictures_shared_with_door = false WHERE id = doorD::uuid;
  PERFORM pg_temp.expect(t, door_level, 0, 'with the switch off the tenant loses the listing shot');
  PERFORM pg_temp.expect(t, on_door, 1, 'with the switch off the tenant keeps their own picture');
  PERFORM pg_temp.expect(t, rooms_d, 0, 'with the switch off the tenant loses the room');
  PERFORM pg_temp.expect(h, on_door, 1, 'with the switch off the household keeps only the tenancy''s own picture');
  PERFORM pg_temp.expect(w, door_level, 2, 'the switch does not touch the worker''s delegated read');
  PERFORM pg_temp.expect(o, on_door, 3, 'the switch does not touch the owner');

  -- And back on: the sight returns.
  UPDATE rentals SET pictures_shared_with_door = true WHERE id = doorD::uuid;
  PERFORM pg_temp.expect(t, door_level, 1, 'with the switch on again the tenant reads the listing shot');

  RAISE NOTICE 'DOOR PICTURES SMOKE: PASS';
END $$;

ROLLBACK;
