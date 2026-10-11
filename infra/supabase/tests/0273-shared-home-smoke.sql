-- =============================================================================
-- 0273 SMOKE — a shared home says so, and the separated listings share pictures
-- =============================================================================
-- One transaction, ROLLS BACK. PASS prints 'SHARED HOME SMOKE: PASS'.
--
-- MUST BE TRUE:
--   a BED door is labelled as a bed in a shared home, never "1-bed"      ✔
--   a ROOM door is labelled a private room in a shared home              ✔
--   a WHOLE UNIT is labelled exactly as before                           ✔
--   shared_home is true for a bed and a room, false for a unit           ✔
--   utilities_included carries through, and NULL stays NULL              ✔
--   a door with no pictures borrows from the listing it shares a room    ✔
--   and the borrowed rows say from_sibling                               ✔
--
-- MUST NOT BE TRUE — these are the walls, and each is a way this could leak:
--   a door with its OWN pictures never borrows                           ✘
--   a RECORD photograph never reaches a stranger, own or borrowed        ✘
--   a WHOLE UNIT never borrows from anything                             ✘
--   a door never borrows across instances                                ✘
--   a door never borrows from a sibling that is OCCUPIED                 ✘
--   a door never borrows from a sibling that is NOT LISTED               ✘
--   the street is still not published                                    ✘
-- =============================================================================

BEGIN;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000a0273', 'authenticated','authenticated','owner273@test.local','', now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  ('00000000-0000-4000-b000-000000010273', 'shared-home-smoke-273', 'Shared Home Smoke', 'business'),
  ('00000000-0000-4000-b000-000000020273', 'other-family-273', 'Another Family', 'business')
ON CONFLICT (id) DO NOTHING;
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  ('00000000-0000-4000-b000-000000010273', '00000000-0000-4000-a000-0000000a0273', 'owner', 'Owner')
ON CONFLICT DO NOTHING;

-- Room 1 holds Bed A (pictures) and Bed B (none). Apt 9 is a whole unit.
-- Bed C is another family's bed, in a room that happens to share the name.
-- Bed D shares the room but is NOT listed. Bed E shares it but is occupied.
INSERT INTO rentals (id, instance_id, created_by, slug, display_name, address, property_type, status, city, state, listed_at, rentable_level, room_label, utilities_included) VALUES
 ('00000000-0000-4000-c000-00000000000a','00000000-0000-4000-b000-000000010273','00000000-0000-4000-a000-0000000a0273','bed-a-273','Room 1 - Bed A','805 N Prospect Apt 4','multi-family','vacant','Champaign','Illinois',now(),'bed','Room 1',true),
 ('00000000-0000-4000-c000-00000000000b','00000000-0000-4000-b000-000000010273','00000000-0000-4000-a000-0000000a0273','bed-b-273','Room 1 - Bed B','805 N Prospect Apt 4','multi-family','vacant','Champaign','Illinois',now(),'bed','Room 1',true),
 ('00000000-0000-4000-c000-00000000000d','00000000-0000-4000-b000-000000010273','00000000-0000-4000-a000-0000000a0273','bed-d-273','Room 1 - Bed D','805 N Prospect Apt 4','multi-family','vacant','Champaign','Illinois',NULL,'bed','Room 1',NULL),
 ('00000000-0000-4000-c000-00000000000e','00000000-0000-4000-b000-000000010273','00000000-0000-4000-a000-0000000a0273','bed-e-273','Room 1 - Bed E','805 N Prospect Apt 4','multi-family','vacant','Champaign','Illinois',now(),'bed','Room 1',NULL),
 ('00000000-0000-4000-c000-000000000099','00000000-0000-4000-b000-000000010273','00000000-0000-4000-a000-0000000a0273','unit-9-273','Apt 9','805 N Prospect Apt 9','multi-family','vacant','Champaign','Illinois',now(),'unit',NULL,NULL),
 ('00000000-0000-4000-c000-000000000077','00000000-0000-4000-b000-000000010273','00000000-0000-4000-a000-0000000a0273','room-7-273','Room 7','805 N Prospect Apt 7','multi-family','vacant','Champaign','Illinois',now(),'room','Room 7',false),
 ('00000000-0000-4000-c000-00000000000c','00000000-0000-4000-b000-000000020273','00000000-0000-4000-a000-0000000a0273','bed-c-273','Room 1 - Bed C','9 Elsewhere','multi-family','vacant','Urbana','Illinois',now(),'bed','Room 1',NULL)
ON CONFLICT (id) DO NOTHING;

-- Bed E is occupied, so nothing of its may be borrowed (or shown).
INSERT INTO rental_tenancies (instance_id, created_by, rental_ref, property_label, monthly_rent, deposit, status) VALUES
 ('00000000-0000-4000-b000-000000010273','00000000-0000-4000-a000-0000000a0273','bed-e-273','Room 1 - Bed E',750,750,'active')
ON CONFLICT DO NOTHING;

INSERT INTO property_photos (instance_id, rental_ref, kind, caption, storage_path) VALUES
 ('00000000-0000-4000-b000-000000010273','00000000-0000-4000-c000-00000000000a','listing','the kitchen','data:image/jpeg;base64,AAAA'),
 ('00000000-0000-4000-b000-000000010273','00000000-0000-4000-c000-00000000000a','move-out-condition','PRIVATE — how it came back','data:image/jpeg;base64,BBBB'),
 ('00000000-0000-4000-b000-000000010273','00000000-0000-4000-c000-00000000000d','listing','from the UNLISTED bed','data:image/jpeg;base64,CCCC'),
 ('00000000-0000-4000-b000-000000010273','00000000-0000-4000-c000-00000000000e','listing','from the OCCUPIED bed','data:image/jpeg;base64,DDDD'),
 ('00000000-0000-4000-b000-000000020273','00000000-0000-4000-c000-00000000000c','listing','ANOTHER FAMILY''S kitchen','data:image/jpeg;base64,EEEE'),
 ('00000000-0000-4000-b000-000000010273','00000000-0000-4000-c000-000000000077','listing','room sevens own','data:image/jpeg;base64,FFFF');

DO $$
DECLARE
  bedA uuid := '00000000-0000-4000-c000-00000000000a';
  bedB uuid := '00000000-0000-4000-c000-00000000000b';
  unit9 uuid := '00000000-0000-4000-c000-000000000099';
  room7 uuid := '00000000-0000-4000-c000-000000000077';
  lbl  text;
  shr  boolean;
  util boolean;
  n    int;
BEGIN
  -- 1. THE LABEL TELLS THE TRUTH ABOUT WHAT IS BEING RENTED.
  SELECT label, shared_home, utilities_included INTO lbl, shr, util
    FROM public_vacancies() WHERE id = bedA;
  IF lbl IS NULL THEN RAISE EXCEPTION 'the bed is not on the public shelf at all'; END IF;
  IF lbl ~* '^[0-9]+-bed' THEN
    RAISE EXCEPTION 'a BED is still advertised as a whole apartment: %', lbl;
  END IF;
  IF lbl !~* 'shared' THEN
    RAISE EXCEPTION 'a bed in a shared home does not say shared: %', lbl;
  END IF;
  IF shr IS NOT TRUE THEN RAISE EXCEPTION 'shared_home is not true for a bed'; END IF;
  IF util IS NOT TRUE THEN RAISE EXCEPTION 'utilities_included did not carry through'; END IF;

  SELECT label, shared_home, utilities_included INTO lbl, shr, util
    FROM public_vacancies() WHERE id = room7;
  IF lbl !~* 'private room in a shared' THEN
    RAISE EXCEPTION 'a ROOM is not named as a private room in a shared home: %', lbl;
  END IF;
  IF shr IS NOT TRUE THEN RAISE EXCEPTION 'shared_home is not true for a room'; END IF;
  IF util IS NOT FALSE THEN RAISE EXCEPTION 'utilities_included false did not carry through'; END IF;

  -- A WHOLE UNIT IS UNCHANGED, which is what keeps this from being a rewrite.
  SELECT label, shared_home, utilities_included INTO lbl, shr, util
    FROM public_vacancies() WHERE id = unit9;
  IF lbl ~* 'shared' THEN RAISE EXCEPTION 'a whole unit was called shared: %', lbl; END IF;
  IF shr IS NOT FALSE THEN RAISE EXCEPTION 'shared_home is not false for a whole unit'; END IF;
  IF util IS NOT NULL THEN RAISE EXCEPTION 'unsaid utilities became an answer — that is a listing lying by omission'; END IF;

  -- 2. A DOOR WITH ITS OWN PICTURES SHOWS EXACTLY THOSE.
  SELECT count(*) INTO n FROM public_vacancy_photos(bedA);
  IF n <> 1 THEN RAISE EXCEPTION 'Bed A should show its ONE listing picture, got %', n; END IF;
  IF EXISTS (SELECT 1 FROM public_vacancy_photos(bedA) WHERE from_sibling) THEN
    RAISE EXCEPTION 'a door with its own pictures borrowed anyway';
  END IF;
  IF EXISTS (SELECT 1 FROM public_vacancy_photos(bedA) WHERE caption ~* 'PRIVATE') THEN
    RAISE EXCEPTION 'A RECORD PHOTOGRAPH REACHED A STRANGER';
  END IF;

  -- 3. THE DOOR WITH NONE BORROWS FROM THE LISTING IT SHARES A ROOM WITH.
  SELECT count(*) INTO n FROM public_vacancy_photos(bedB);
  IF n <> 1 THEN RAISE EXCEPTION 'Bed B should borrow exactly the one showable sibling picture, got %', n; END IF;
  IF NOT EXISTS (SELECT 1 FROM public_vacancy_photos(bedB) WHERE from_sibling AND caption = 'the kitchen') THEN
    RAISE EXCEPTION 'Bed B did not borrow its sibling''s kitchen, or did not say it was borrowed';
  END IF;

  -- 4. EVERY WALL HOLDS ON THE BORROWED ROW TOO. Each of these is in the
  --    sibling's Room 1 and each must be refused for its own reason.
  IF EXISTS (SELECT 1 FROM public_vacancy_photos(bedB) WHERE caption ~* 'PRIVATE') THEN
    RAISE EXCEPTION 'a RECORD photograph was borrowed to a stranger';
  END IF;
  IF EXISTS (SELECT 1 FROM public_vacancy_photos(bedB) WHERE caption ~* 'UNLISTED') THEN
    RAISE EXCEPTION 'borrowed from a door that is not advertised';
  END IF;
  IF EXISTS (SELECT 1 FROM public_vacancy_photos(bedB) WHERE caption ~* 'OCCUPIED') THEN
    RAISE EXCEPTION 'borrowed from a door SOMEBODY LIVES IN';
  END IF;
  IF EXISTS (SELECT 1 FROM public_vacancy_photos(bedB) WHERE caption ~* 'ANOTHER FAMILY') THEN
    RAISE EXCEPTION 'BORROWED ACROSS INSTANCES — another family''s pictures on our shelf';
  END IF;

  -- 5. A WHOLE UNIT NEVER BORROWS. It has no siblings and must not acquire any.
  SELECT count(*) INTO n FROM public_vacancy_photos(unit9);
  IF n <> 0 THEN RAISE EXCEPTION 'a whole unit with no pictures borrowed % of them', n; END IF;

  -- 6. THE STREET IS STILL NOT PUBLISHED (DR-0935), which this must not relax.
  IF EXISTS (SELECT 1 FROM public_vacancies() WHERE label ~* 'Prospect' OR label ~* 'Elsewhere') THEN
    RAISE EXCEPTION 'the STREET reached the public shelf';
  END IF;

  RAISE NOTICE 'SHARED HOME SMOKE: PASS';
END $$;

ROLLBACK;
