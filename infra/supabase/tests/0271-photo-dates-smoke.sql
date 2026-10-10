-- =============================================================================
-- 0271 SMOKE — the upload date is the anchor, the taken date is a claim
-- =============================================================================
-- Runs in CI on a throwaway PostgreSQL and on the LIVE database in the
-- rls-isolation poe-properties leg. Everything is in one transaction and ROLLS
-- BACK. PASS prints 'PHOTO DATES SMOKE: PASS'; any break RAISES.
--
-- Darrell, 2026-10-10: "always put the uploaded dates... and the other option
-- is default however editable... however the upload dat never is".
--
-- PROVEN TO CATCH — each of these must be REFUSED, and the test fails if any
-- of them is allowed:
--   moving uploaded_at                                   ✘
--   moving uploaded_by                                   ✘
--   changing the image (storage_path)                    ✘  (0154, unchanged)
--   moving the photo to another door                     ✘  (0154, unchanged)
--   a taken_at in the year 1200                          ✘  (new sanity check)
--   a taken_at well AFTER it was uploaded                ✘  (new sanity check)
--
-- And these must be ALLOWED, which is the capability being added:
--   setting taken_at on a photo that never had one       ✔
--   CORRECTING a taken_at that was already set           ✔
--   clearing it back to unknown                          ✔
--   edited_at moves, so a correction is visible as one   ✔
-- =============================================================================

BEGIN;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000a0271', 'authenticated','authenticated','owner261@test.local','', now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  ('00000000-0000-4000-b000-000000010271', 'photo-dates-smoke-271', 'Photo Dates Smoke', 'business')
ON CONFLICT (id) DO NOTHING;
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  ('00000000-0000-4000-b000-000000010271', '00000000-0000-4000-a000-0000000a0271', 'owner', 'Owner')
ON CONFLICT DO NOTHING;

INSERT INTO rentals (id, instance_id, created_by, slug, display_name, address, property_type, status) VALUES
  ('00000000-0000-4000-c000-000000010271', '00000000-0000-4000-b000-000000010271',
   '00000000-0000-4000-a000-0000000a0271', 'photo-dates-door-261', 'Door 261', '261 Smoke St', 'multi-family', 'vacant'),
  ('00000000-0000-4000-c000-000000020271', '00000000-0000-4000-b000-000000010271',
   '00000000-0000-4000-a000-0000000a0271', 'photo-dates-door2-261', 'Door 261 B', '262 Smoke St', 'multi-family', 'vacant')
ON CONFLICT (id) DO NOTHING;

DO $$
DECLARE
  o   uuid := '00000000-0000-4000-a000-0000000a0271';
  ins uuid := '00000000-0000-4000-b000-000000010271';
  d   uuid := '00000000-0000-4000-c000-000000010271';
  d2  uuid := '00000000-0000-4000-c000-000000020271';
  p   uuid;
  up  timestamptz;
  ed1 timestamptz;
  ed2 timestamptz;
  got timestamptz;

BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object('sub', o, 'role','authenticated')::text, true);
  PERFORM set_config('role', 'authenticated', true);

  -- A photograph filed with NO taken_at — the ordinary case for a set chosen
  -- from a phone, and the one 0154 made permanently undateable.
  INSERT INTO property_photos (instance_id, rental_ref, kind, caption, storage_path)
  VALUES (ins, d, 'move-out-condition', 'as it came back', 'data:image/jpeg;base64,AAAA')
  RETURNING id, uploaded_at, edited_at INTO p, up, ed1;

  IF up IS NULL THEN RAISE EXCEPTION 'uploaded_at was not recorded on insert'; END IF;

  -- 1. SET a taken_at that was never there. This is the whole point.
  UPDATE property_photos SET taken_at = up - interval '12 days' WHERE id = p;
  SELECT taken_at, edited_at INTO got, ed2 FROM property_photos WHERE id = p;
  IF got IS NULL THEN RAISE EXCEPTION 'setting taken_at on an undated photo did not take'; END IF;
  IF ed2 IS NULL OR ed2 <= ed1 THEN
    RAISE EXCEPTION 'edited_at did not move — a correction must be visible as one';
  END IF;

  -- 2. CORRECT it again (he typed the wrong day the first time).
  UPDATE property_photos SET taken_at = up - interval '9 days' WHERE id = p;
  SELECT taken_at INTO got FROM property_photos WHERE id = p;
  IF got IS NULL OR got <> up - interval '9 days' THEN
    RAISE EXCEPTION 'correcting an existing taken_at did not take';
  END IF;

  -- 3. Clear it back to unknown.
  UPDATE property_photos SET taken_at = NULL WHERE id = p;
  SELECT taken_at INTO got FROM property_photos WHERE id = p;
  IF got IS NOT NULL THEN RAISE EXCEPTION 'clearing taken_at did not take'; END IF;

  -- 4. THE ANCHOR DOES NOT MOVE.
  BEGIN
    UPDATE property_photos SET uploaded_at = up - interval '30 days' WHERE id = p;
    RAISE EXCEPTION 'uploaded_at WAS CHANGED — the anchor is not holding';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE '%anchor is not holding%' THEN RAISE; END IF;
  END;

  BEGIN
    UPDATE property_photos SET uploaded_by = NULL WHERE id = p;
    RAISE EXCEPTION 'uploaded_by WAS CHANGED — who filed it is not holding';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE '%not holding%' THEN RAISE; END IF;
  END;

  -- 5. The 0154 walls that must survive untouched.
  BEGIN
    UPDATE property_photos SET storage_path = 'data:image/jpeg;base64,BBBB' WHERE id = p;
    RAISE EXCEPTION 'the IMAGE was changed — evidence is not holding';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE '%not holding%' THEN RAISE; END IF;
  END;

  BEGIN
    UPDATE property_photos SET rental_ref = d2 WHERE id = p;
    RAISE EXCEPTION 'the photo was MOVED to another door — the door is not holding';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE '%not holding%' THEN RAISE; END IF;
  END;

  -- 6. A date that is not a date is not a correction.
  BEGIN
    UPDATE property_photos SET taken_at = timestamptz '1200-01-01' WHERE id = p;
    RAISE EXCEPTION 'a taken_at in the year 1200 was ACCEPTED';
  EXCEPTION WHEN check_violation THEN NULL;
  END;

  BEGIN
    UPDATE property_photos SET taken_at = up + interval '40 days' WHERE id = p;
    RAISE EXCEPTION 'a taken_at long AFTER the upload was ACCEPTED';
  EXCEPTION WHEN check_violation THEN NULL;
  END;

  -- 7. And a legitimate date still lands after all that.
  UPDATE property_photos SET taken_at = up - interval '3 days' WHERE id = p;
  SELECT taken_at INTO got FROM property_photos WHERE id = p;
  IF got IS NULL THEN RAISE EXCEPTION 'a sane taken_at was refused'; END IF;

  RAISE NOTICE 'PHOTO DATES SMOKE: PASS';
END $$;

ROLLBACK;
