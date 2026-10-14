-- =============================================================================
-- 0290 SMOKE — a listing's picture list never carries the bytes (DR-1016)
-- =============================================================================
-- One transaction; ROLLS BACK. PASS prints 'LISTING BYTES SMOKE: PASS'.
--
--   the list has the same pictures, in the same order, as public_vacancy_photos,
--     and no storage_path column                                            ✔
--   has_thumb says whether the upload wrote a thumbnail                     ✔
--   one picture at a time: 'thumb' answers the thumbnail, or the full image
--     when there is none; 'full' answers the full image                    ✔
--   a picture that is not in THIS unit's showable set answers NULL         ✔
--   a picture of an unlisted door answers NULL                              ✔
--   anon may read all of it; nobody may write through it                  ✔
-- =============================================================================
BEGIN;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000a0290', 'authenticated','authenticated','owner290@test.local','', now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  ('00000000-0000-4000-b000-000000010290', 'listing-bytes-290', 'Listing Bytes Smoke', 'business')
ON CONFLICT (id) DO NOTHING;
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  ('00000000-0000-4000-b000-000000010290', '00000000-0000-4000-a000-0000000a0290', 'owner', 'Owner')
ON CONFLICT DO NOTHING;

-- A listed door with two pictures (one with a thumbnail), and an unlisted
-- door with one.
INSERT INTO rentals (id, instance_id, created_by, slug, display_name, address, unit, property_type, status, city, state, listed_at) VALUES
  ('00000000-0000-4000-c000-0000000a0290', '00000000-0000-4000-b000-000000010290', '00000000-0000-4000-a000-0000000a0290', 'LB-LISTED',   'Listed',   '9830 Bytes Smoke Ave', 'Apt 1', 'multi-family', 'vacant', 'Champaign', 'IL', now()),
  ('00000000-0000-4000-c000-0000000b0290', '00000000-0000-4000-b000-000000010290', '00000000-0000-4000-a000-0000000a0290', 'LB-UNLISTED', 'Unlisted', '9832 Bytes Smoke Ave', 'Apt 1', 'multi-family', 'vacant', 'Champaign', 'IL', NULL);
INSERT INTO property_photos (id, instance_id, rental_ref, kind, caption, storage_path, thumb_path, sort_order, taken_at) VALUES
  ('00000000-0000-4000-d000-0000000a0290', '00000000-0000-4000-b000-000000010290', '00000000-0000-4000-c000-0000000a0290', 'listing', 'kitchen', 'data:image/jpeg;base64,FULLKITCHEN', 'data:image/jpeg;base64,THUMBKITCHEN', 1, '2026-01-01'),
  ('00000000-0000-4000-d000-0000000b0290', '00000000-0000-4000-b000-000000010290', '00000000-0000-4000-c000-0000000a0290', 'listing', 'porch',   'data:image/jpeg;base64,FULLPORCH',   NULL,                                 2, '2026-01-02'),
  ('00000000-0000-4000-d000-0000000c0290', '00000000-0000-4000-b000-000000010290', '00000000-0000-4000-c000-0000000b0290', 'listing', 'hidden',  'data:image/jpeg;base64,FULLHIDDEN',  NULL,                                 1, '2026-01-03');

CREATE OR REPLACE FUNCTION pg_temp.as_anon() RETURNS void LANGUAGE plpgsql AS $$
BEGIN PERFORM set_config('role', 'anon', true); PERFORM set_config('request.jwt.claims', '', true); END $$;
CREATE OR REPLACE FUNCTION pg_temp.as_postgres() RETURNS void LANGUAGE plpgsql AS $$
BEGIN PERFORM set_config('role', 'postgres', true); PERFORM set_config('request.jwt.claims', '', true); END $$;

DO $$
DECLARE
  listed CONSTANT uuid := '00000000-0000-4000-c000-0000000a0290';
  unlisted CONSTANT uuid := '00000000-0000-4000-c000-0000000b0290';
  kitchen CONSTANT uuid := '00000000-0000-4000-d000-0000000a0290';
  porch CONSTANT uuid := '00000000-0000-4000-d000-0000000b0290';
  hidden CONSTANT uuid := '00000000-0000-4000-d000-0000000c0290';
  a text; b text; n int; cols int;
BEGIN
  PERFORM pg_temp.as_anon();

  -- 1. The same pictures in the same order, and no bytes column.
  SELECT string_agg(l.caption, ',' ORDER BY l.n) INTO a
    FROM public.public_vacancy_photo_list(listed) WITH ORDINALITY AS l(id, caption, taken_at, from_sibling, has_thumb, n);
  SELECT string_agg(p.caption, ',' ORDER BY p.n) INTO b
    FROM public.public_vacancy_photos(listed) WITH ORDINALITY AS p(id, caption, storage_path, taken_at, from_sibling, n);
  IF a IS DISTINCT FROM b OR a <> 'kitchen,porch' THEN
    RAISE EXCEPTION 'list order: list=% photos=%', a, b;
  END IF;
  SELECT count(*) INTO cols FROM pg_proc pr JOIN pg_namespace ns ON ns.oid = pr.pronamespace
   WHERE ns.nspname = 'public' AND pr.proname = 'public_vacancy_photo_list'
     AND pg_get_function_result(pr.oid) LIKE '%storage_path%';
  IF cols <> 0 THEN RAISE EXCEPTION 'the list carries storage_path'; END IF;

  -- 2. has_thumb.
  SELECT string_agg(l.caption || ':' || l.has_thumb::text, ',' ORDER BY l.n) INTO a
    FROM public.public_vacancy_photo_list(listed) WITH ORDINALITY AS l(id, caption, taken_at, from_sibling, has_thumb, n);
  IF a <> 'kitchen:true,porch:false' THEN RAISE EXCEPTION 'has_thumb: %', a; END IF;

  -- 3. One picture at a time.
  IF public.public_vacancy_picture(listed, kitchen, 'thumb') <> 'data:image/jpeg;base64,THUMBKITCHEN' THEN RAISE EXCEPTION 'thumb of kitchen'; END IF;
  IF public.public_vacancy_picture(listed, kitchen, 'full') <> 'data:image/jpeg;base64,FULLKITCHEN' THEN RAISE EXCEPTION 'full of kitchen'; END IF;
  IF public.public_vacancy_picture(listed, porch, 'thumb') <> 'data:image/jpeg;base64,FULLPORCH' THEN RAISE EXCEPTION 'thumb of porch falls back to the full image'; END IF;
  IF public.public_vacancy_picture(listed, porch) <> 'data:image/jpeg;base64,FULLPORCH' THEN RAISE EXCEPTION 'default size is thumb'; END IF;

  -- 4. Not this unit's picture; 5. an unlisted door's picture.
  IF public.public_vacancy_picture(unlisted, kitchen, 'full') IS NOT NULL THEN RAISE EXCEPTION 'another unit reads a picture it does not show'; END IF;
  IF public.public_vacancy_picture(listed, hidden, 'full') IS NOT NULL THEN RAISE EXCEPTION 'an unlisted door''s picture leaked'; END IF;
  IF public.public_vacancy_picture(unlisted, hidden, 'full') IS NOT NULL THEN RAISE EXCEPTION 'an unlisted door shows its own picture'; END IF;
  SELECT count(*) INTO n FROM public.public_vacancy_photo_list(unlisted);
  IF n <> 0 THEN RAISE EXCEPTION 'an unlisted door lists pictures'; END IF;

  PERFORM pg_temp.as_postgres();
  RAISE NOTICE 'LISTING BYTES SMOKE: PASS';
END $$;

ROLLBACK;
