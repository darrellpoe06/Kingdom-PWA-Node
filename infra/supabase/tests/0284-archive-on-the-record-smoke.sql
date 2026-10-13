-- =============================================================================
-- 0284 SMOKE — the whole address and its archive on the record (DR-0999)
-- =============================================================================
-- One transaction; ROLLS BACK. PASS prints 'ARCHIVE ON THE RECORD SMOKE: PASS'.
--
--   the family names a door's archive, and reads it back                  ✔
--   a channel with a space or a slash is refused by the database           ✘
--   a stranger to the family cannot name it                                ✘ (nothing changes)
--   the main public shelf never shows the channel                          ✔
-- =============================================================================
BEGIN;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000a0284', 'authenticated','authenticated','owner284@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000e0284', 'authenticated','authenticated','stranger284@test.local','', now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  ('00000000-0000-4000-b000-000000010284', 'archive-smoke-284', 'Archive Smoke', 'business')
ON CONFLICT (id) DO NOTHING;
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  ('00000000-0000-4000-b000-000000010284', '00000000-0000-4000-a000-0000000a0284', 'owner', 'Owner')
ON CONFLICT DO NOTHING;
INSERT INTO rentals (id, instance_id, created_by, slug, display_name, address, unit, city, state, property_type, status, listed_at) VALUES
  ('00000000-0000-4000-c000-0000000a0284', '00000000-0000-4000-b000-000000010284', '00000000-0000-4000-a000-0000000a0284', 'ARCH-A-284', 'Archive Door', '9804 Dogwood Smoke Lane', 'Apt 1', 'Champaign', 'Illinois', 'multi-family', 'vacant', now());

DO $$
DECLARE
  a uuid := '00000000-0000-4000-c000-0000000a0284';
  got text;
  shelf text;
  refused boolean := false;
BEGIN
  -- 1. The family names the archive and reads it back.
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-4000-a000-0000000a0284', 'role', 'authenticated')::text, true);
  UPDATE rentals SET photo_channel = '9804Dogwood', address_held_at = now() WHERE id = a;
  SELECT photo_channel INTO got FROM rentals WHERE id = a;
  IF got IS DISTINCT FROM '9804Dogwood' THEN
    RAISE EXCEPTION 'ARCHIVE ON THE RECORD SMOKE FAIL: the family could not name the archive (reads %)', got;
  END IF;

  -- 2. A mistyped channel is refused by the database, not just the form.
  BEGIN
    UPDATE rentals SET photo_channel = 'bad name/with slash' WHERE id = a;
  EXCEPTION WHEN check_violation THEN refused := true;
  END;
  IF NOT refused THEN RAISE EXCEPTION 'ARCHIVE ON THE RECORD SMOKE FAIL: a channel with a space and a slash was accepted'; END IF;

  -- 3. A stranger cannot name it.
  PERFORM set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-4000-a000-0000000e0284', 'role', 'authenticated')::text, true);
  UPDATE rentals SET photo_channel = 'Stolen' WHERE id = a;
  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claims', '', true);
  IF (SELECT photo_channel FROM rentals WHERE id = a) IS DISTINCT FROM '9804Dogwood' THEN
    RAISE EXCEPTION 'ARCHIVE ON THE RECORD SMOKE FAIL: a stranger renamed the family''s archive';
  END IF;

  -- 4. The open shelf never carries the channel name.
  PERFORM set_config('role', 'anon', true);
  SELECT row_to_json(v)::text INTO shelf FROM public_vacancies() v WHERE v.id = a;
  PERFORM set_config('role', 'postgres', true);
  IF shelf IS NULL THEN RAISE EXCEPTION 'ARCHIVE ON THE RECORD SMOKE FAIL: the door left the shelf'; END IF;
  IF shelf ILIKE '%9804Dogwood%' OR shelf ILIKE '%photo_channel%' THEN
    RAISE EXCEPTION 'ARCHIVE ON THE RECORD SMOKE FAIL: the archive name reached the open shelf: %', shelf;
  END IF;

  RAISE NOTICE 'ARCHIVE ON THE RECORD SMOKE: PASS';
END $$;

ROLLBACK;
