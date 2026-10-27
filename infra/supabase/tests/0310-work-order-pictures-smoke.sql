-- =============================================================================
-- 0310 SMOKE — a work order keeps its pictures, a note carries them, and a
--              name typed once is offered after (DR-1235)
-- =============================================================================
-- Runs in CI on a throwaway PostgreSQL (the door-work leg) and on the LIVE
-- database in the rls-isolation poe-properties leg. One transaction; ROLLS
-- BACK. PASS prints 'WORK ORDER PICTURES SMOKE: PASS'; any wrong sight or
-- wrong write RAISES.
--
-- Scenario: landlord instance F, owner O. Door D with tenancy V (tenant T).
-- Work order Q on V/D, GIVEN TO worker W (assigned_to = W; W holds no
-- delegated capability and no enabled-worker row — only the assignment).
-- A stranger S. A note N on Q.
--
--   O files P1 on Q, riding note N, on door D                            ✔
--   W files P2 on Q as the assigned worker (uploaded_by = W)             ✔
--   W cannot file as somebody else, nor on a job he was not given        ✔
--   S cannot file on Q                                                   ✔
--   O files P3 on a Real Estate incident with no door and no tenancy     ✔
--   a picture hung on nothing at all is refused by the CHECK             ✔
--   O reads P1, P2, P3; W reads P1 and P2, never P3; T reads Q's two;
--     S reads nothing                                                    ✔
--   picture_names: O remembers "Before" then "before " → one row, used
--     twice, the first spelling kept; W (assigned) names too; S cannot;
--     a blank name is refused; S reads no names, W reads F's             ✔
-- =============================================================================
BEGIN;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000a0310', 'authenticated','authenticated','o0310@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000b0310', 'authenticated','authenticated','t0310@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000d0310', 'authenticated','authenticated','w0310@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000e0310', 'authenticated','authenticated','s0310@test.local','', now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  ('00000000-0000-4000-b000-000000010310', 'work-order-pictures-smoke-310', 'Work Order Pictures Smoke', 'family')
ON CONFLICT (id) DO NOTHING;
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  ('00000000-0000-4000-b000-000000010310', '00000000-0000-4000-a000-0000000a0310', 'owner', 'Owner O')
ON CONFLICT DO NOTHING;
INSERT INTO rentals (id, instance_id, created_by, slug, display_name, address, unit, property_type, status) VALUES
  ('00000000-0000-4000-c000-0000000a0310', '00000000-0000-4000-b000-000000010310', '00000000-0000-4000-a000-0000000a0310', 'DOOR-D-310', 'Door D', '805 D St', 'Apt 2', 'multi-family', 'occupied');
INSERT INTO rental_tenancies (id, instance_id, created_by, rental_ref, property_label, status, tenant_user_id) VALUES
  ('00000000-0000-4000-c100-0000000a0310', '00000000-0000-4000-b000-000000010310', '00000000-0000-4000-a000-0000000a0310', 'DOOR-D-310', '805 D St Apt 2', 'active', '00000000-0000-4000-a000-0000000b0310');
-- The work order, GIVEN TO W. Nothing else names W anywhere.
INSERT INTO tenant_maintenance_requests (id, instance_id, tenancy_id, rental_id, created_by, created_by_role, title, priority, status, assigned_to, assigned_to_label) VALUES
  ('00000000-0000-4000-c200-0000000a0310', '00000000-0000-4000-b000-000000010310', '00000000-0000-4000-c100-0000000a0310', '00000000-0000-4000-c000-0000000a0310', '00000000-0000-4000-a000-0000000a0310', 'landlord', 'Exhaust fan and microwave', 'normal', 'in-progress', '00000000-0000-4000-a000-0000000d0310', 'Worker W'),
  ('00000000-0000-4000-c200-0000000b0310', '00000000-0000-4000-b000-000000010310', '00000000-0000-4000-c100-0000000a0310', '00000000-0000-4000-c000-0000000a0310', '00000000-0000-4000-a000-0000000a0310', 'landlord', 'Not W''s job', 'normal', 'submitted', NULL, NULL);
INSERT INTO tenancy_notes (id, instance_id, tenancy_id, rental_id, request_id, author_user_id, author_role, body) VALUES
  ('00000000-0000-4000-c300-0000000a0310', '00000000-0000-4000-b000-000000010310', '00000000-0000-4000-c100-0000000a0310', '00000000-0000-4000-c000-0000000a0310', '00000000-0000-4000-c200-0000000a0310', '00000000-0000-4000-a000-0000000a0310', 'landlord', 'Checked it: the fan is in');

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
    RAISE EXCEPTION 'WORK ORDER PICTURES SMOKE FAIL: % (expected %, read %)', _label, _want, n;
  END IF;
END $$;
-- A refusal is RLS (42501), a CHECK (23514), a missing parent (23503) or a
-- RAISE. Anything else (a typo, a missing column) propagates, so a broken
-- smoke can never read as a held wall (0260's rule, kept).
CREATE OR REPLACE FUNCTION pg_temp.writes(_who uuid, _sql text, _label text, _should boolean) RETURNS void LANGUAGE plpgsql AS $$
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
    RAISE EXCEPTION 'WORK ORDER PICTURES SMOKE FAIL: % (expected write-succeeds=%, got %)', _label, _should, ok;
  END IF;
END $$;

DO $$
DECLARE
  o    uuid := '00000000-0000-4000-a000-0000000a0310';
  t    uuid := '00000000-0000-4000-a000-0000000b0310';
  w    uuid := '00000000-0000-4000-a000-0000000d0310';
  s    uuid := '00000000-0000-4000-a000-0000000e0310';
  inst uuid := '00000000-0000-4000-b000-000000010310';
  door uuid := '00000000-0000-4000-c000-0000000a0310';
  ten  uuid := '00000000-0000-4000-c100-0000000a0310';
  q    uuid := '00000000-0000-4000-c200-0000000a0310';
  q2   uuid := '00000000-0000-4000-c200-0000000b0310';
  n    uuid := '00000000-0000-4000-c300-0000000a0310';
  p1   uuid := '00000000-0000-4000-e000-0000000a0310';
  p2   uuid := '00000000-0000-4000-e000-0000000b0310';
  p3   uuid := '00000000-0000-4000-e000-0000000c0310';
  on_q text; on_inc text; on_note text; names text;
  first_name text; n_uses int; n_rows int;
BEGIN
  on_q    := format('SELECT count(*)::int FROM property_photos WHERE request_id = %L', q);
  on_inc  := 'SELECT count(*)::int FROM property_photos WHERE incident_ref = ''in-1761500000000''';
  on_note := format('SELECT count(*)::int FROM property_photos WHERE note_id = %L', n);
  names   := format('SELECT count(*)::int FROM picture_names WHERE instance_id = %L', inst);

  -- 1. The owner files a picture on the work order, riding the note, on the door.
  PERFORM pg_temp.writes(o, format(
    'INSERT INTO property_photos (id, instance_id, rental_ref, tenancy_id, request_id, note_id, kind, caption, storage_path, uploaded_by)
     VALUES (%L, %L, %L, %L, %L, %L, ''inspection'', ''Checked'', ''data:image/jpeg;base64,AAAA'', %L)', p1, inst, door, ten, q, n, o),
    'O files P1 on Q, riding note N', true);

  -- 2. The assigned worker files his own picture of his own job.
  PERFORM pg_temp.writes(w, format(
    'INSERT INTO property_photos (id, instance_id, rental_ref, request_id, kind, caption, storage_path, uploaded_by)
     VALUES (%L, %L, %L, %L, ''work-order-after'', ''After'', ''data:image/jpeg;base64,AAAA'', %L)', p2, inst, door, q, w),
    'W (assigned, nothing else) files P2 on Q', true);
  PERFORM pg_temp.writes(w, format(
    'INSERT INTO property_photos (instance_id, rental_ref, request_id, kind, caption, storage_path, uploaded_by)
     VALUES (%L, %L, %L, ''work-order-after'', ''Posing'', ''data:image/jpeg;base64,AAAA'', %L)', inst, door, q, o),
    'W files on Q claiming to be O', false);
  PERFORM pg_temp.writes(w, format(
    'INSERT INTO property_photos (instance_id, rental_ref, request_id, kind, caption, storage_path, uploaded_by)
     VALUES (%L, %L, %L, ''work-order-after'', ''Not mine'', ''data:image/jpeg;base64,AAAA'', %L)', inst, door, q2, w),
    'W files on a job he was not given', false);

  -- 3. A stranger files nothing.
  PERFORM pg_temp.writes(s, format(
    'INSERT INTO property_photos (instance_id, rental_ref, request_id, kind, caption, storage_path, uploaded_by)
     VALUES (%L, %L, %L, ''work-order-after'', ''Planted'', ''data:image/jpeg;base64,AAAA'', %L)', inst, door, q, s),
    'S files on Q', false);

  -- 4. A Real Estate incident with no door and no tenancy still holds its picture.
  PERFORM pg_temp.writes(o, format(
    'INSERT INTO property_photos (id, instance_id, incident_ref, kind, caption, storage_path, uploaded_by)
     VALUES (%L, %L, ''in-1761500000000'', ''work-order-before'', ''Foyer light'', ''data:image/jpeg;base64,AAAA'', %L)', p3, inst, o),
    'O files P3 on an incident with no door', true);
  PERFORM pg_temp.writes(o, format(
    'INSERT INTO property_photos (instance_id, kind, caption, storage_path, uploaded_by)
     VALUES (%L, ''work-order-before'', ''Nowhere'', ''data:image/jpeg;base64,AAAA'', %L)', inst, o),
    'a picture hung on nothing', false);

  -- 5. Who reads what.
  PERFORM pg_temp.expect(o, on_q,    2, 'the owner reads both pictures on Q');
  PERFORM pg_temp.expect(o, on_inc,  1, 'the owner reads the incident picture');
  PERFORM pg_temp.expect(o, on_note, 1, 'the owner reads the picture on note N');
  PERFORM pg_temp.expect(w, on_q,    2, 'the assigned worker reads both pictures on his job');
  PERFORM pg_temp.expect(w, on_inc,  0, 'the assigned worker never reads the incident picture');
  PERFORM pg_temp.expect(t, on_q,    2, 'the tenant reads the pictures on the work order at their door');
  PERFORM pg_temp.expect(t, on_inc,  0, 'the tenant never reads the incident picture');
  PERFORM pg_temp.expect(s, on_q,    0, 'a stranger reads no picture on Q');
  PERFORM pg_temp.expect(s, on_inc,  0, 'a stranger reads no incident picture');

  -- 6. A name typed once is one of the options after; typed again it is counted, not doubled.
  PERFORM pg_temp.as_user(o);
  PERFORM public.remember_picture_name(inst, 'Before');
  SELECT rn.name, rn.uses INTO first_name, n_uses FROM public.remember_picture_name(inst, '  before ') rn;
  PERFORM pg_temp.as_postgres();
  IF first_name <> 'Before' OR n_uses <> 2 THEN
    RAISE EXCEPTION 'WORK ORDER PICTURES SMOKE FAIL: "before " should match "Before" (kept %, uses %)', first_name, n_uses;
  END IF;
  PERFORM pg_temp.expect(o, names, 1, 'one name row after Before + before');
  PERFORM pg_temp.writes(w, format('SELECT public.remember_picture_name(%L, ''After'')', inst), 'the assigned worker names a picture', true);
  PERFORM pg_temp.writes(s, format('SELECT public.remember_picture_name(%L, ''Planted'')', inst), 'a stranger names nothing', false);
  PERFORM pg_temp.writes(o, format('SELECT public.remember_picture_name(%L, ''   '')', inst), 'a blank name', false);
  PERFORM pg_temp.writes(o, format('INSERT INTO picture_names (instance_id, name) VALUES (%L, ''Direct'')', inst), 'a direct insert around the one writer', false);
  PERFORM pg_temp.expect(o, names, 2, 'the owner reads both names');
  PERFORM pg_temp.expect(w, names, 2, 'the assigned worker reads the instance''s names');
  PERFORM pg_temp.expect(s, names, 0, 'a stranger reads no names');
  SELECT count(*)::int INTO n_rows FROM picture_names WHERE instance_id = inst AND name_key = 'before';
  IF n_rows <> 1 THEN RAISE EXCEPTION 'WORK ORDER PICTURES SMOKE FAIL: name_key folds case (rows %)', n_rows; END IF;

  RAISE NOTICE 'WORK ORDER PICTURES SMOKE: PASS';
END $$;

ROLLBACK;
