-- =============================================================================
-- 0266 SMOKE — a door's camera is asked for, and given to whoever the family
-- chooses (DR-0938)
-- =============================================================================
-- Runs in CI on a throwaway PostgreSQL (the door-work leg) and on the LIVE
-- database in the rls-isolation poe-properties leg. One transaction; ROLLS
-- BACK. PASS prints 'DOOR CAMERA ACCESS SMOKE: PASS'; any break RAISES.
--
--   the family offers the porch and the hallway; a tenant cannot          ✔ / ✘
--   the menu is read by the tenant, household and worker on the door;
--     the other door's tenant and a stranger read nothing                ✔ / ✘
--   the tenant asks for the porch; the role is the database's            ✔
--   a second open ask; a camera not offered; a stranger's ask            ✘
--   the worker and the household ask; each stamped with their role       ✔
--   the tenant grants their own ask                                      ✘
--   the family grants the tenant's ask; the tenant reads the token;
--     the worker and a stranger do not                                   ✔ / ✘
--   the family declines the worker; a declined ask is then granted       ✔ / ✘
--   the family gives an Airbnb guest a link; a tenant cannot; a gift
--     without the NAS grant                                              ✔ / ✘
--   the family takes it back: the token is gone; revoked -> granted      ✔ / ✘
--   who asked never changes; nothing is deleted                          ✘
--   asked, granted, declined, given, revoked are on the clock; each
--     person reads only their own                                        ✔
-- =============================================================================
BEGIN;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000a0266', 'authenticated','authenticated','owner266@test.local','',   now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000b0266', 'authenticated','authenticated','tenant266@test.local','',  now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000c0266', 'authenticated','authenticated','house266@test.local','',   now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000d0266', 'authenticated','authenticated','worker266@test.local','',  now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000e0266', 'authenticated','authenticated','stranger266@test.local','',now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000f0266', 'authenticated','authenticated','other266@test.local','',   now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  ('00000000-0000-4000-b000-000000010266', 'door-camera-smoke-266', 'Door Camera Smoke', 'business')
ON CONFLICT (id) DO NOTHING;
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  ('00000000-0000-4000-b000-000000010266', '00000000-0000-4000-a000-0000000a0266', 'owner', 'Owner')
ON CONFLICT DO NOTHING;
INSERT INTO rentals (id, instance_id, created_by, slug, display_name, address, property_type, status) VALUES
  ('00000000-0000-4000-c000-0000000a0266', '00000000-0000-4000-b000-000000010266', '00000000-0000-4000-a000-0000000a0266', 'DOOR-A-266', 'Door A', '805 A St', 'multi-family', 'occupied'),
  ('00000000-0000-4000-c000-0000000b0266', '00000000-0000-4000-b000-000000010266', '00000000-0000-4000-a000-0000000a0266', 'DOOR-B-266', 'Door B', '806 B St', 'multi-family', 'occupied');
INSERT INTO rental_tenancies (id, instance_id, created_by, rental_ref, property_label, tenant_name, tenant_user_id, monthly_rent, deposit, status) VALUES
  ('00000000-0000-4000-c000-0000000e0266', '00000000-0000-4000-b000-000000010266', '00000000-0000-4000-a000-0000000a0266', 'DOOR-A-266', 'Door A', 'Tenant A', '00000000-0000-4000-a000-0000000b0266', 680, 680, 'active'),
  ('00000000-0000-4000-c000-0000000f0266', '00000000-0000-4000-b000-000000010266', '00000000-0000-4000-a000-0000000a0266', 'DOOR-B-266', 'Door B', 'Tenant B', '00000000-0000-4000-a000-0000000f0266', 700, 700, 'active');
INSERT INTO tenancy_household (instance_id, tenancy_id, member_user_id, display_name, active) VALUES
  ('00000000-0000-4000-b000-000000010266', '00000000-0000-4000-c000-0000000e0266', '00000000-0000-4000-a000-0000000c0266', 'Household A', true);
INSERT INTO delegated_capabilities (instance_id, grantee_user_id, scope_ref, capability, setting, granted_by, role_label) VALUES
  ('00000000-0000-4000-b000-000000010266', '00000000-0000-4000-a000-0000000d0266', 'DOOR-A-266', 'docs.add', 'allow', '00000000-0000-4000-a000-0000000a0266', 'field_worker');

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
    WHEN insufficient_privilege OR check_violation OR raise_exception OR unique_violation THEN ok := false;
  END;
  PERFORM pg_temp.as_postgres();
  IF ok <> _should THEN
    RAISE EXCEPTION 'DOOR CAMERA ACCESS SMOKE FAIL: % (expected succeeds=%, got %)', _label, _should, ok;
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
  EXCEPTION WHEN insufficient_privilege OR check_violation OR raise_exception THEN n := 0;
  END;
  PERFORM pg_temp.as_postgres();
  RETURN n;
END $$;

CREATE OR REPLACE FUNCTION pg_temp.val_as(_who uuid, _sql text) RETURNS text LANGUAGE plpgsql AS $$
DECLARE v text;
BEGIN
  PERFORM pg_temp.as_user(_who);
  EXECUTE _sql INTO v;
  PERFORM pg_temp.as_postgres();
  RETURN v;
END $$;

DO $$
DECLARE
  o    uuid := '00000000-0000-4000-a000-0000000a0266';
  t    uuid := '00000000-0000-4000-a000-0000000b0266';
  h    uuid := '00000000-0000-4000-a000-0000000c0266';
  w    uuid := '00000000-0000-4000-a000-0000000d0266';
  s    uuid := '00000000-0000-4000-a000-0000000e0266';
  t2   uuid := '00000000-0000-4000-a000-0000000f0266';
  inst text := '00000000-0000-4000-b000-000000010266';
  doorA text := '00000000-0000-4000-c000-0000000a0266';
  askT uuid := '00000000-0000-4000-d000-0000000a0266';
  askW uuid := '00000000-0000-4000-d000-0000000b0266';
  gift uuid := '00000000-0000-4000-d000-0000000c0266';
  tok  text := 'g.abcdefabcdef.' || repeat('1', 32);
  tok2 text := 'g.bcdefabcdefa.' || repeat('2', 32);
  v    text;
BEGIN
  -- 1. The menu: the family offers; a tenant cannot.
  PERFORM pg_temp.runs(t, format('INSERT INTO door_camera_menu (instance_id, rental_id, camera_id, camera_name) VALUES (%L, %L, ''kitchen'', ''Kitchen'')', inst, doorA),
    'a tenant offers a camera', false);
  PERFORM pg_temp.runs(o, format('INSERT INTO door_camera_menu (instance_id, rental_id, camera_id, camera_name) VALUES (%L, %L, ''805_porch'', ''805 Porch''), (%L, %L, ''805_hall'', ''805 Hallway'')', inst, doorA, inst, doorA),
    'the family offers the porch and the hallway', true);
  IF pg_temp.val_as(t, format('SELECT count(*) FROM door_camera_menu WHERE rental_id = %L', doorA))::int <> 2 THEN RAISE EXCEPTION 'DOOR CAMERA ACCESS SMOKE FAIL: the tenant cannot read the menu'; END IF;
  IF pg_temp.val_as(h, format('SELECT count(*) FROM door_camera_menu WHERE rental_id = %L', doorA))::int <> 2 THEN RAISE EXCEPTION 'DOOR CAMERA ACCESS SMOKE FAIL: the household cannot read the menu'; END IF;
  IF pg_temp.val_as(w, format('SELECT count(*) FROM door_camera_menu WHERE rental_id = %L', doorA))::int <> 2 THEN RAISE EXCEPTION 'DOOR CAMERA ACCESS SMOKE FAIL: the worker sent to the door cannot read the menu'; END IF;
  IF pg_temp.val_as(t2, format('SELECT count(*) FROM door_camera_menu WHERE rental_id = %L', doorA))::int <> 0 THEN RAISE EXCEPTION 'DOOR CAMERA ACCESS SMOKE FAIL: another door''s tenant reads door A''s menu'; END IF;
  IF pg_temp.val_as(s, 'SELECT count(*) FROM door_camera_menu')::int <> 0 THEN RAISE EXCEPTION 'DOOR CAMERA ACCESS SMOKE FAIL: a stranger reads a menu'; END IF;

  -- 1b. A tenant's screen learns its door's id; nobody else's does.
  IF pg_temp.val_as(t, 'SELECT public.door_of_my_tenancy(''00000000-0000-4000-c000-0000000e0266'')') IS DISTINCT FROM doorA THEN RAISE EXCEPTION 'DOOR CAMERA ACCESS SMOKE FAIL: the tenant cannot learn their door'; END IF;
  IF pg_temp.val_as(h, 'SELECT public.door_of_my_tenancy(''00000000-0000-4000-c000-0000000e0266'')') IS DISTINCT FROM doorA THEN RAISE EXCEPTION 'DOOR CAMERA ACCESS SMOKE FAIL: the household cannot learn their door'; END IF;
  IF pg_temp.val_as(t2, 'SELECT public.door_of_my_tenancy(''00000000-0000-4000-c000-0000000e0266'')') IS NOT NULL THEN RAISE EXCEPTION 'DOOR CAMERA ACCESS SMOKE FAIL: another door''s tenant learns door A'; END IF;
  IF pg_temp.val_as(s, 'SELECT public.door_of_my_tenancy(''00000000-0000-4000-c000-0000000e0266'')') IS NOT NULL THEN RAISE EXCEPTION 'DOOR CAMERA ACCESS SMOKE FAIL: a stranger learns door A'; END IF;

  -- 2. Asking.
  PERFORM pg_temp.runs(t, format(
    'INSERT INTO door_camera_access (id, instance_id, rental_id, kind, person_user_id, person_role, person_label, cameras, reason)
     VALUES (%L, %L, %L, ''request'', %L, ''family'', ''Tenant A'', ARRAY[''805_porch''], ''Packages go missing'')', askT, inst, doorA, t),
    'the tenant asks for the porch', true);
  SELECT person_role || '|' || array_to_string(camera_names, ',') INTO v FROM door_camera_access WHERE id = askT;
  IF v IS DISTINCT FROM 'tenant|805 Porch' THEN RAISE EXCEPTION 'DOOR CAMERA ACCESS SMOKE FAIL: the ask was not stamped with the tenant''s real role and the camera''s name (%)', v; END IF;
  PERFORM pg_temp.runs(t, format(
    'INSERT INTO door_camera_access (instance_id, rental_id, kind, person_user_id, person_role, person_label, cameras) VALUES (%L, %L, ''request'', %L, ''tenant'', ''Tenant A'', ARRAY[''805_hall''])', inst, doorA, t),
    'a second open ask from the same person', false);
  PERFORM pg_temp.runs(w, format(
    'INSERT INTO door_camera_access (instance_id, rental_id, kind, person_user_id, person_role, person_label, cameras) VALUES (%L, %L, ''request'', %L, ''worker'', ''Mike'', ARRAY[''kitchen''])', inst, doorA, w),
    'an ask for a camera not offered', false);
  PERFORM pg_temp.runs(s, format(
    'INSERT INTO door_camera_access (instance_id, rental_id, kind, person_user_id, person_role, person_label, cameras) VALUES (%L, %L, ''request'', %L, ''tenant'', ''Stranger'', ARRAY[''805_porch''])', inst, doorA, s),
    'a stranger asks', false);
  PERFORM pg_temp.runs(w, format(
    'INSERT INTO door_camera_access (id, instance_id, rental_id, kind, person_user_id, person_role, person_label, cameras, reason)
     VALUES (%L, %L, %L, ''request'', %L, ''tenant'', ''Mike'', ARRAY[''805_porch'', ''805_hall''], ''Watching the delivery'')', askW, inst, doorA, w),
    'the worker asks', true);
  IF (SELECT person_role FROM door_camera_access WHERE id = askW) <> 'worker' THEN RAISE EXCEPTION 'DOOR CAMERA ACCESS SMOKE FAIL: the worker''s ask was stamped as what he claimed'; END IF;
  PERFORM pg_temp.runs(h, format(
    'INSERT INTO door_camera_access (instance_id, rental_id, kind, person_user_id, person_role, person_label, cameras) VALUES (%L, %L, ''request'', %L, ''tenant'', ''Household A'', ARRAY[''805_hall''])', inst, doorA, h),
    'the household asks', true);
  IF NOT EXISTS (SELECT 1 FROM door_camera_access WHERE person_user_id = h AND person_role = 'household') THEN RAISE EXCEPTION 'DOOR CAMERA ACCESS SMOKE FAIL: the household ask is not stamped household'; END IF;

  -- 3. Deciding: only the family.
  IF pg_temp.changes(t, format('UPDATE door_camera_access SET status = ''granted'', grant_token = %L WHERE id = %L', tok, askT)) <> 0 THEN
    RAISE EXCEPTION 'DOOR CAMERA ACCESS SMOKE FAIL: the tenant granted their own ask';
  END IF;
  IF pg_temp.changes(o, format('UPDATE door_camera_access SET status = ''granted'', grant_token = %L, grant_id = ''abcdefabcdef'', days = 365 WHERE id = %L', tok, askT)) <> 1 THEN
    RAISE EXCEPTION 'DOOR CAMERA ACCESS SMOKE FAIL: the family could not grant';
  END IF;
  IF (SELECT decided_by FROM door_camera_access WHERE id = askT) IS DISTINCT FROM o THEN RAISE EXCEPTION 'DOOR CAMERA ACCESS SMOKE FAIL: the grant does not name who decided'; END IF;
  IF pg_temp.val_as(t, format('SELECT grant_token FROM door_camera_access WHERE id = %L', askT)) IS DISTINCT FROM tok THEN RAISE EXCEPTION 'DOOR CAMERA ACCESS SMOKE FAIL: the tenant cannot read their own grant'; END IF;
  IF pg_temp.val_as(w, format('SELECT grant_token FROM door_camera_access WHERE id = %L', askT)) IS NOT NULL THEN RAISE EXCEPTION 'DOOR CAMERA ACCESS SMOKE FAIL: the worker reads the tenant''s grant'; END IF;
  IF pg_temp.val_as(s, 'SELECT count(*) FROM door_camera_access')::int <> 0 THEN RAISE EXCEPTION 'DOOR CAMERA ACCESS SMOKE FAIL: a stranger reads the ledger'; END IF;
  IF pg_temp.changes(o, format('UPDATE door_camera_access SET status = ''declined'', decision_note = ''Not for this job'' WHERE id = %L', askW)) <> 1 THEN
    RAISE EXCEPTION 'DOOR CAMERA ACCESS SMOKE FAIL: the family could not decline';
  END IF;
  IF pg_temp.changes(o, format('UPDATE door_camera_access SET status = ''granted'', grant_token = %L WHERE id = %L', tok2, askW)) <> 0 THEN
    RAISE EXCEPTION 'DOOR CAMERA ACCESS SMOKE FAIL: a declined ask was granted';
  END IF;

  -- 4. Giving: an Airbnb guest with no account, by link.
  PERFORM pg_temp.runs(t, format(
    'INSERT INTO door_camera_access (instance_id, rental_id, kind, person_role, person_label, cameras, status, grant_token) VALUES (%L, %L, ''given'', ''guest'', ''My cousin'', ARRAY[''805_porch''], ''granted'', %L)', inst, doorA, tok2),
    'a tenant gives camera access', false);
  PERFORM pg_temp.runs(o, format(
    'INSERT INTO door_camera_access (instance_id, rental_id, kind, person_role, person_label, cameras, status) VALUES (%L, %L, ''given'', ''guest'', ''Airbnb guest'', ARRAY[''805_porch''], ''granted'')', inst, doorA),
    'a gift without the NAS grant', false);
  PERFORM pg_temp.runs(o, format(
    'INSERT INTO door_camera_access (id, instance_id, rental_id, kind, person_role, person_label, cameras, status, grant_token, grant_id, days, expires_on)
     VALUES (%L, %L, %L, ''given'', ''guest'', ''Airbnb guest, Oct 12 to 15'', ARRAY[''805_porch''], ''granted'', %L, ''bcdefabcdefa'', 5, current_date + 5)', gift, inst, doorA, tok2),
    'the family gives an Airbnb guest the porch by link', true);

  -- 5. Taking back.
  IF pg_temp.changes(o, format('UPDATE door_camera_access SET status = ''revoked'' WHERE id = %L', gift)) <> 1 THEN RAISE EXCEPTION 'DOOR CAMERA ACCESS SMOKE FAIL: the family could not take it back'; END IF;
  IF (SELECT grant_token FROM door_camera_access WHERE id = gift) IS NOT NULL THEN RAISE EXCEPTION 'DOOR CAMERA ACCESS SMOKE FAIL: a taken-back row still holds its token'; END IF;
  IF pg_temp.changes(o, format('UPDATE door_camera_access SET status = ''granted'', grant_token = %L WHERE id = %L', tok2, gift)) <> 0 THEN RAISE EXCEPTION 'DOOR CAMERA ACCESS SMOKE FAIL: revoked moved back to granted'; END IF;

  -- 6. The ledger holds.
  IF pg_temp.changes(o, format('UPDATE door_camera_access SET person_user_id = %L WHERE id = %L', o, askT)) <> 0 THEN RAISE EXCEPTION 'DOOR CAMERA ACCESS SMOKE FAIL: who asked was rewritten'; END IF;
  IF pg_temp.changes(o, format('DELETE FROM door_camera_access WHERE id = %L', askT)) <> 0 THEN RAISE EXCEPTION 'DOOR CAMERA ACCESS SMOKE FAIL: the ledger lost a row'; END IF;

  -- 7. The clock.
  IF (SELECT count(*) FROM record_events WHERE subject = 'camera' AND subject_id = askT AND event IN ('asked', 'granted')) <> 2 THEN RAISE EXCEPTION 'DOOR CAMERA ACCESS SMOKE FAIL: the ask and the grant are not both on the clock'; END IF;
  IF NOT EXISTS (SELECT 1 FROM record_events WHERE subject = 'camera' AND subject_id = askW AND event = 'declined' AND by_user = o) THEN RAISE EXCEPTION 'DOOR CAMERA ACCESS SMOKE FAIL: the decline is not on the clock'; END IF;
  IF (SELECT count(*) FROM record_events WHERE subject = 'camera' AND subject_id = gift AND event IN ('given', 'revoked')) <> 2 THEN RAISE EXCEPTION 'DOOR CAMERA ACCESS SMOKE FAIL: the gift and its taking back are not both on the clock'; END IF;
  IF pg_temp.val_as(t, format('SELECT count(*) FROM record_events WHERE subject_id = %L', askT))::int <> 2 THEN RAISE EXCEPTION 'DOOR CAMERA ACCESS SMOKE FAIL: the tenant cannot read their own ask''s clock'; END IF;
  IF pg_temp.val_as(t, format('SELECT count(*) FROM record_events WHERE subject_id = %L', askW))::int <> 0 THEN RAISE EXCEPTION 'DOOR CAMERA ACCESS SMOKE FAIL: the tenant reads the worker''s clock'; END IF;

  RAISE NOTICE 'DOOR CAMERA ACCESS SMOKE: PASS';
END $$;

ROLLBACK;
