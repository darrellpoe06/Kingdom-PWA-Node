-- =============================================================================
-- 0285 SMOKE — a NAS picture is filed on a door once (DR-1000)
-- =============================================================================
-- One transaction; ROLLS BACK. PASS prints 'NAS PICTURE ONCE SMOKE: PASS'.
--
--   the family files a NAS picture on a door with its source              ✔
--   the same source on the same door a second time is refused             ✘
--   the same source on a SIBLING door is allowed (the building's archive) ✔
--   a source that is not a NAS shape is refused                           ✘
--   a stranger to the family cannot file one                              ✘
-- =============================================================================
BEGIN;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000a0285', 'authenticated','authenticated','owner285@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000e0285', 'authenticated','authenticated','stranger285@test.local','', now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  ('00000000-0000-4000-b000-000000010285', 'nas-once-smoke-285', 'NAS Once Smoke', 'business')
ON CONFLICT (id) DO NOTHING;
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  ('00000000-0000-4000-b000-000000010285', '00000000-0000-4000-a000-0000000a0285', 'owner', 'Owner')
ON CONFLICT DO NOTHING;
INSERT INTO rentals (id, instance_id, created_by, slug, display_name, address, unit, city, state, property_type, status) VALUES
  ('00000000-0000-4000-c000-0000000a0285', '00000000-0000-4000-b000-000000010285', '00000000-0000-4000-a000-0000000a0285', 'ONCE-A-285', 'Apt 1', '9805 Dogwood Smoke Lane', 'Apt 1', 'Champaign', 'Illinois', 'multi-family', 'vacant'),
  ('00000000-0000-4000-c000-0000000b0285', '00000000-0000-4000-b000-000000010285', '00000000-0000-4000-a000-0000000a0285', 'ONCE-B-285', 'Apt 2', '9805 Dogwood Smoke Lane', 'Apt 2', 'Champaign', 'Illinois', 'multi-family', 'vacant');

DO $$
DECLARE
  inst uuid := '00000000-0000-4000-b000-000000010285';
  a uuid := '00000000-0000-4000-c000-0000000a0285';
  b uuid := '00000000-0000-4000-c000-0000000b0285';
  n int;
  refused boolean;
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-4000-a000-0000000a0285', 'role', 'authenticated')::text, true);

  -- 1. The family files a NAS picture on Apt 1 with its source.
  INSERT INTO property_photos (instance_id, rental_ref, kind, caption, storage_path, thumb_path, source, uploaded_by)
  VALUES (inst, a, 'listing', 'the porch', 'data:image/jpeg;base64,/9j/4AAQ', 'data:image/jpeg;base64,/9j/4AAQ', 'nas:9805Dogwood:9001', '00000000-0000-4000-a000-0000000a0285');
  SELECT count(*) INTO n FROM property_photos WHERE rental_ref = a AND source = 'nas:9805Dogwood:9001';
  IF n <> 1 THEN RAISE EXCEPTION 'NAS PICTURE ONCE SMOKE FAIL: the family could not file the picture with its source (% rows)', n; END IF;

  -- 2. The same source on the same door a second time is refused by the database.
  refused := false;
  BEGIN
    INSERT INTO property_photos (instance_id, rental_ref, kind, caption, storage_path, thumb_path, source, uploaded_by)
    VALUES (inst, a, 'move-in-condition', 'again', 'data:image/jpeg;base64,/9j/4AAQ', 'data:image/jpeg;base64,/9j/4AAQ', 'nas:9805Dogwood:9001', '00000000-0000-4000-a000-0000000a0285');
  EXCEPTION WHEN unique_violation THEN refused := true;
  END;
  IF NOT refused THEN RAISE EXCEPTION 'NAS PICTURE ONCE SMOKE FAIL: the same NAS picture was filed on the same door twice'; END IF;

  -- 3. The sibling door (same building, same archive) may file the same picture.
  INSERT INTO property_photos (instance_id, rental_ref, kind, caption, storage_path, thumb_path, source, uploaded_by)
  VALUES (inst, b, 'listing', 'the porch', 'data:image/jpeg;base64,/9j/4AAQ', 'data:image/jpeg;base64,/9j/4AAQ', 'nas:9805Dogwood:9001', '00000000-0000-4000-a000-0000000a0285');
  SELECT count(*) INTO n FROM property_photos WHERE rental_ref = b AND source = 'nas:9805Dogwood:9001';
  IF n <> 1 THEN RAISE EXCEPTION 'NAS PICTURE ONCE SMOKE FAIL: the sibling door could not file the building''s picture'; END IF;

  -- 4. A source that is not a NAS shape is refused.
  refused := false;
  BEGIN
    INSERT INTO property_photos (instance_id, rental_ref, kind, caption, storage_path, thumb_path, source, uploaded_by)
    VALUES (inst, a, 'listing', 'x', 'data:image/jpeg;base64,/9j/4AAQ', 'data:image/jpeg;base64,/9j/4AAQ', 'http://elsewhere/x.jpg', '00000000-0000-4000-a000-0000000a0285');
  EXCEPTION WHEN check_violation THEN refused := true;
  END;
  IF NOT refused THEN RAISE EXCEPTION 'NAS PICTURE ONCE SMOKE FAIL: a source that is not a NAS shape was accepted'; END IF;

  -- 5. A stranger cannot file one on the family's door.
  PERFORM set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-4000-a000-0000000e0285', 'role', 'authenticated')::text, true);
  refused := false;
  BEGIN
    INSERT INTO property_photos (instance_id, rental_ref, kind, caption, storage_path, thumb_path, source, uploaded_by)
    VALUES (inst, a, 'listing', 'stolen', 'data:image/jpeg;base64,/9j/4AAQ', 'data:image/jpeg;base64,/9j/4AAQ', 'nas:9805Dogwood:9002', '00000000-0000-4000-a000-0000000e0285');
  EXCEPTION WHEN insufficient_privilege OR check_violation THEN refused := true;
  END;
  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claims', '', true);
  IF NOT refused OR (SELECT count(*) FROM property_photos WHERE source = 'nas:9805Dogwood:9002') <> 0 THEN
    RAISE EXCEPTION 'NAS PICTURE ONCE SMOKE FAIL: a stranger filed a picture on the family''s door';
  END IF;

  RAISE NOTICE 'NAS PICTURE ONCE SMOKE: PASS';
END $$;

ROLLBACK;
