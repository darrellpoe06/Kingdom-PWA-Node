-- =============================================================================
-- 0289 SMOKE — a stay picture joins the wall with the family's yes (DR-1010)
-- =============================================================================
-- One transaction; ROLLS BACK. PASS prints 'STAY WALL SMOKE: PASS'.
--
--   anon, a stranger, and another door's tenant cannot submit            ✘
--   the wrong wording fingerprint, and a missing attestation, are refused ✘
--   the tenant submits, signed over; it is pending; on the clock         ✔
--   the tenant reads their own; a stranger reads nothing; the family all  ✔
--   the public wall shows nothing while it is pending                     ✔
--   the tenant cannot approve; the family approves; the wall shows it,
--     named "Life at 805", with the building's listed doors, no name      ✔
--   a guest with no account submits through the door's card; bad key     ✔ / ✘
--   the family cannot use a picture in a listing under a draft wording;
--     counsel's attestation (family only) lifts that; the listing copy
--     is a real listing picture the public photo road carries; off, and
--     back as the same copy                                               ✔
--   the poster asks: off the wall and out of the listing at once          ✔
--   the family removes for good                                           ✔
--   nobody writes a row directly                                          ✘
--   the sixth guest picture in an hour is refused                         ✘
--   the wall is "Life at this home" when the street is held               ✔
-- =============================================================================
BEGIN;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000a0289', 'authenticated','authenticated','owner289@test.local','',    now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000b0289', 'authenticated','authenticated','tenant289@test.local','',   now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000c0289', 'authenticated','authenticated','other289@test.local','',    now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000d0289', 'authenticated','authenticated','stranger289@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000e0289', 'authenticated','authenticated','guest289@test.local','',    now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  ('00000000-0000-4000-b000-000000010289', 'stay-wall-smoke-289', 'Stay Wall Smoke', 'business')
ON CONFLICT (id) DO NOTHING;
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  ('00000000-0000-4000-b000-000000010289', '00000000-0000-4000-a000-0000000a0289', 'owner', 'Owner')
ON CONFLICT DO NOTHING;
-- Door A (Apt 2, a tenant lives there) and Door C (Apt 3, vacant and listed)
-- share the building at 805 Smoke Avenue; Door B is another building.
INSERT INTO rentals (id, instance_id, created_by, slug, display_name, address, unit, city, state, property_type, status, listed_at, address_visibility, showcase_order) VALUES
  ('00000000-0000-4000-c000-0000000a0289', '00000000-0000-4000-b000-000000010289', '00000000-0000-4000-a000-0000000a0289', 'WALL-A2-289', '805 Smoke Avenue Apt 2', '805 Smoke Avenue', 'Apt 2', 'Champaign', 'Illinois', 'multi-family', 'occupied', now(), 'public', 1),
  ('00000000-0000-4000-c000-0000000c0289', '00000000-0000-4000-b000-000000010289', '00000000-0000-4000-a000-0000000a0289', 'WALL-A3-289', '805 Smoke Avenue Apt 3', '805 Smoke Avenue', 'Apt 3', 'Champaign', 'Illinois', 'multi-family', 'vacant', now(), 'public', 2),
  ('00000000-0000-4000-c000-0000000b0289', '00000000-0000-4000-b000-000000010289', '00000000-0000-4000-a000-0000000a0289', 'WALL-B-289',  '9 Other Street', '9 Other Street', '', 'Champaign', 'Illinois', 'single-family', 'occupied', NULL, 'public', 3);
INSERT INTO rental_tenancies (id, instance_id, created_by, rental_ref, property_label, tenant_name, tenant_user_id, monthly_rent, deposit, status) VALUES
  ('00000000-0000-4000-c000-0000000e0289', '00000000-0000-4000-b000-000000010289', '00000000-0000-4000-a000-0000000a0289', 'WALL-A2-289', 'Apt 2', 'Tenant Tess', '00000000-0000-4000-a000-0000000b0289', 800, 800, 'active'),
  ('00000000-0000-4000-c000-0000000f0289', '00000000-0000-4000-b000-000000010289', '00000000-0000-4000-a000-0000000a0289', 'WALL-B-289',  'Other', 'Tenant Uma',  '00000000-0000-4000-a000-0000000c0289', 900, 900, 'active');
-- The guest card on Door C (0261's shape), and a confirmed stay with an account.
INSERT INTO door_guest_links (rental_id, instance_id, token, created_by) VALUES
  ('00000000-0000-4000-c000-0000000c0289', '00000000-0000-4000-b000-000000010289', repeat('ab', 32), '00000000-0000-4000-a000-0000000a0289');
INSERT INTO door_stays (instance_id, rental_id, kind, status, check_in, check_out, guest_name, guest_email, attests_21_plus, accepts_house_rules, requested_by)
VALUES ('00000000-0000-4000-b000-000000010289', '00000000-0000-4000-c000-0000000c0289', 'stay', 'confirmed', current_date + 40, current_date + 42, 'Guest Gil', 'guest289@test.local', true, true, '00000000-0000-4000-a000-0000000e0289');

CREATE OR REPLACE FUNCTION pg_temp.as_user(_who uuid) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role', 'authenticated')::text, true);
END $$;
CREATE OR REPLACE FUNCTION pg_temp.as_anon() RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('role', 'anon', true);
  PERFORM set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
END $$;
CREATE OR REPLACE FUNCTION pg_temp.as_postgres() RETURNS void LANGUAGE plpgsql AS $$
BEGIN PERFORM set_config('role', 'postgres', true); END $$;
-- Runs _sql as _who (NULL = anon) and compares with the expectation.
CREATE OR REPLACE FUNCTION pg_temp.runs(_who uuid, _sql text, _label text, _should boolean)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE ok boolean := true; why text := '';
BEGIN
  IF _who IS NULL THEN PERFORM pg_temp.as_anon(); ELSE PERFORM pg_temp.as_user(_who); END IF;
  BEGIN
    EXECUTE _sql;
  EXCEPTION
    WHEN insufficient_privilege OR check_violation OR raise_exception OR unique_violation OR foreign_key_violation THEN ok := false; why := SQLERRM;
  END;
  PERFORM pg_temp.as_postgres();
  IF ok <> _should THEN
    RAISE EXCEPTION 'STAY WALL SMOKE FAIL: % (expected succeeds=%, got % %)', _label, _should, ok, why;
  END IF;
END $$;
CREATE OR REPLACE FUNCTION pg_temp.uuid_as(_who uuid, _sql text) RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE v uuid;
BEGIN
  IF _who IS NULL THEN PERFORM pg_temp.as_anon(); ELSE PERFORM pg_temp.as_user(_who); END IF;
  EXECUTE _sql INTO v;
  PERFORM pg_temp.as_postgres();
  RETURN v;
END $$;
CREATE OR REPLACE FUNCTION pg_temp.count_as(_who uuid, _sql text) RETURNS int LANGUAGE plpgsql AS $$
DECLARE n int;
BEGIN
  IF _who IS NULL THEN PERFORM pg_temp.as_anon(); ELSE PERFORM pg_temp.as_user(_who); END IF;
  EXECUTE _sql INTO n;
  PERFORM pg_temp.as_postgres();
  RETURN n;
END $$;
CREATE OR REPLACE FUNCTION pg_temp.text_as(_who uuid, _sql text) RETURNS text LANGUAGE plpgsql AS $$
DECLARE t text;
BEGIN
  IF _who IS NULL THEN PERFORM pg_temp.as_anon(); ELSE PERFORM pg_temp.as_user(_who); END IF;
  EXECUTE _sql INTO t;
  PERFORM pg_temp.as_postgres();
  RETURN t;
END $$;
CREATE OR REPLACE FUNCTION pg_temp.changes(_who uuid, _sql text) RETURNS int LANGUAGE plpgsql AS $$
DECLARE n int := 0;
BEGIN
  PERFORM pg_temp.as_user(_who);
  BEGIN
    EXECUTE _sql;
    GET DIAGNOSTICS n = ROW_COUNT;
  EXCEPTION WHEN insufficient_privilege THEN n := 0;
  END;
  PERFORM pg_temp.as_postgres();
  RETURN n;
END $$;

DO $$
DECLARE
  o    uuid := '00000000-0000-4000-a000-0000000a0289';
  t    uuid := '00000000-0000-4000-a000-0000000b0289';
  u    uuid := '00000000-0000-4000-a000-0000000c0289';
  s    uuid := '00000000-0000-4000-a000-0000000d0289';
  g    uuid := '00000000-0000-4000-a000-0000000e0289';
  inst uuid := '00000000-0000-4000-b000-000000010289';
  door_a uuid := '00000000-0000-4000-c000-0000000a0289';
  door_c uuid := '00000000-0000-4000-c000-0000000c0289';
  tok  text := repeat('ab', 32);
  img  text := 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==';
  thumb text := 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==';
  att  text := 'By checking this box, I acknowledge that I have read the rights assignment in full and I agree to be bound by it.';
  con  text := 'By typing my full legal name I sign this document electronically, and I agree that this electronic signature has the same force as my handwritten signature.';
  ver  text; hsh text;
  submit text;
  pic_t uuid; pic_g uuid; photo1 uuid; photo2 uuid;
  r record; n int; lbl text; i int;
BEGIN
  SELECT version, body_hash INTO ver, hsh FROM stay_wall_wordings WHERE is_current;
  IF ver IS NULL OR hsh !~ '^[0-9a-f]{64}$' THEN RAISE EXCEPTION 'STAY WALL SMOKE FAIL: no current wording with a fingerprint'; END IF;
  -- The fingerprint the database set is the SHA-256 of the exact words.
  IF hsh IS DISTINCT FROM (SELECT encode(sha256(convert_to(body, 'UTF8')), 'hex') FROM stay_wall_wordings WHERE version = ver) THEN
    RAISE EXCEPTION 'STAY WALL SMOKE FAIL: body_hash is not the SHA-256 of the body';
  END IF;
  -- The wording reads for anyone, with "draft" for this family.
  PERFORM pg_temp.as_anon();
  SELECT * INTO r FROM stay_wall_wording(door_a);
  PERFORM pg_temp.as_postgres();
  IF r.version IS DISTINCT FROM ver OR r.body_hash IS DISTINCT FROM hsh OR r.counsel_attested THEN
    RAISE EXCEPTION 'STAY WALL SMOKE FAIL: anon reads wording % attested % (expected %, draft)', r.version, r.counsel_attested, ver;
  END IF;

  submit := format('SELECT stay_wall_submit(%L, %L, %L, %L, %L, %s, %s, %s, %s, %L, %L, %L, %L, now())',
                   door_a, img, thumb, 'Sunday pancakes in Apt 2', 'Tess Tenant', 'false', 'true', 'true', 'true', ver, hsh, att, con);

  -- 1. Who cannot.
  PERFORM pg_temp.runs(NULL, submit, 'anon submits', false);
  PERFORM pg_temp.runs(s, submit, 'a stranger submits', false);
  PERFORM pg_temp.runs(u, submit, 'another door''s tenant submits on this door', false);
  -- 2. What cannot.
  PERFORM pg_temp.runs(t, replace(submit, hsh, repeat('0', 64)), 'the wrong wording fingerprint', false);
  PERFORM pg_temp.runs(t, format('SELECT stay_wall_submit(%L, %L, %L, %L, %L, false, true, true, false, %L, %L, %L, %L, now())',
                                 door_a, img, thumb, 'no', 'Tess Tenant', ver, hsh, att, con), 'missing the minors attestation', false);
  PERFORM pg_temp.runs(t, replace(submit, 'Tess Tenant', 'T'), 'a one-letter signature', false);
  -- 3. The tenant submits, signed over.
  pic_t := pg_temp.uuid_as(t, submit);
  SELECT * INTO r FROM stay_pictures WHERE id = pic_t;
  IF r.status <> 'pending' OR r.submitted_role <> 'tenant' OR r.submitted_by <> t OR r.wording_version <> ver OR r.wording_hash <> hsh
     OR r.signed_on_device_at IS NULL OR r.signed_at IS NULL OR NOT (r.attests_own AND r.attests_consent AND r.attests_minors) THEN
    RAISE EXCEPTION 'STAY WALL SMOKE FAIL: the tenant''s picture is not signed over as expected (%)', row_to_json(r);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM door_events WHERE subject = 'stay-picture' AND subject_id = pic_t AND event = 'submitted') THEN
    RAISE EXCEPTION 'STAY WALL SMOKE FAIL: the submission is not on the clock';
  END IF;
  -- The guest with a confirmed stay and an account may submit too.
  PERFORM pg_temp.runs(g, replace(replace(submit, door_a::text, door_c::text), 'Tess Tenant', 'Gil Guest'), 'a confirmed guest with an account submits', true);
  -- 4. Who reads.
  IF pg_temp.count_as(t, format('SELECT count(*) FROM stay_pictures WHERE id = %L', pic_t)) <> 1 THEN RAISE EXCEPTION 'STAY WALL SMOKE FAIL: the poster cannot read their own picture'; END IF;
  IF pg_temp.count_as(s, 'SELECT count(*) FROM stay_pictures') <> 0 THEN RAISE EXCEPTION 'STAY WALL SMOKE FAIL: a stranger reads pictures'; END IF;
  IF pg_temp.count_as(u, format('SELECT count(*) FROM stay_pictures WHERE id = %L', pic_t)) <> 0 THEN RAISE EXCEPTION 'STAY WALL SMOKE FAIL: another tenant reads the picture'; END IF;
  IF pg_temp.count_as(o, format('SELECT count(*) FROM stay_pictures WHERE instance_id = %L', inst)) <> 2 THEN RAISE EXCEPTION 'STAY WALL SMOKE FAIL: the family does not read every picture'; END IF;
  IF pg_temp.count_as(t, format('SELECT count(*) FROM door_events WHERE subject = ''stay-picture'' AND subject_id = %L', pic_t)) <> 1 THEN RAISE EXCEPTION 'STAY WALL SMOKE FAIL: the poster cannot read the clock on their picture'; END IF;
  -- 5. Pending is not public.
  IF pg_temp.count_as(NULL, 'SELECT count(*) FROM public_stay_walls()') <> 0 THEN RAISE EXCEPTION 'STAY WALL SMOKE FAIL: a pending picture is on the public wall'; END IF;
  IF pg_temp.text_as(NULL, format('SELECT public_stay_wall_image(%L)', pic_t)) IS NOT NULL THEN RAISE EXCEPTION 'STAY WALL SMOKE FAIL: a pending picture''s bytes are public'; END IF;
  -- 6. The family approves; the tenant cannot.
  PERFORM pg_temp.runs(t, format('SELECT stay_wall_decide(%L, ''approved'')', pic_t), 'the tenant approves their own picture', false);
  PERFORM pg_temp.runs(s, format('SELECT stay_wall_decide(%L, ''approved'')', pic_t), 'a stranger approves', false);
  PERFORM pg_temp.runs(o, format('SELECT stay_wall_decide(%L, ''approved'')', pic_t), 'the family approves', true);
  PERFORM pg_temp.as_anon();
  SELECT * INTO r FROM public_stay_walls() w WHERE w.id = pic_t;
  n := (SELECT count(*) FROM public_stay_walls());
  PERFORM pg_temp.as_postgres();
  IF n <> 1 OR r.id IS NULL THEN RAISE EXCEPTION 'STAY WALL SMOKE FAIL: the approved picture is not on the public wall (% rows)', n; END IF;
  IF r.wall_label <> 'Life at 805' THEN RAISE EXCEPTION 'STAY WALL SMOKE FAIL: the wall is named % (expected "Life at 805")', r.wall_label; END IF;
  IF NOT (door_a = ANY (r.door_ids) AND door_c = ANY (r.door_ids)) OR cardinality(r.door_ids) <> 2 THEN RAISE EXCEPTION 'STAY WALL SMOKE FAIL: the wall''s doors are % (expected Apt 2 and Apt 3)', r.door_ids; END IF;
  IF r.poster IS NOT NULL OR r.unit <> 'Apt 2' OR r.caption <> 'Sunday pancakes in Apt 2' OR r.thumb IS NULL THEN RAISE EXCEPTION 'STAY WALL SMOKE FAIL: the wall row reads % / % / %', r.poster, r.unit, r.caption; END IF;
  IF pg_temp.text_as(NULL, format('SELECT public_stay_wall_image(%L)', pic_t)) IS DISTINCT FROM img THEN RAISE EXCEPTION 'STAY WALL SMOKE FAIL: the approved picture''s bytes do not read publicly'; END IF;
  -- 7. The guest card.
  PERFORM pg_temp.runs(NULL, format('SELECT stay_wall_submit_as_guest(%L, %L, %L, %L, %L, true, true, true, true, %L, %L, %L, %L, now())',
                                    repeat('cd', 32), img, thumb, 'nope', 'Gail Guest', ver, hsh, att, con), 'a dead key', false);
  pic_g := pg_temp.uuid_as(NULL, format('SELECT stay_wall_submit_as_guest(%L, %L, %L, %L, %L, true, true, true, true, %L, %L, %L, %L, now())',
                                        tok, img, thumb, 'Porch coffee', 'Gail Guest', ver, hsh, att, con));
  SELECT * INTO r FROM stay_pictures WHERE id = pic_g;
  IF r.submitted_by IS NOT NULL OR r.submitted_role <> 'guest' OR r.rental_id <> door_c OR r.status <> 'pending' OR NOT r.show_name THEN
    RAISE EXCEPTION 'STAY WALL SMOKE FAIL: the guest-card picture reads % / % / %', r.submitted_by, r.submitted_role, r.status;
  END IF;
  PERFORM pg_temp.runs(o, format('SELECT stay_wall_decide(%L, ''approved'')', pic_g), 'the family approves the guest''s', true);
  PERFORM pg_temp.as_anon();
  SELECT * INTO r FROM public_stay_walls() w WHERE w.id = pic_g;
  n := (SELECT count(*) FROM public_stay_walls());
  PERFORM pg_temp.as_postgres();
  IF n <> 2 OR r.poster <> 'Gail Guest' OR r.unit <> 'Apt 3' THEN RAISE EXCEPTION 'STAY WALL SMOKE FAIL: the guest''s picture on the wall reads % rows, poster %, unit %', n, r.poster, r.unit; END IF;
  -- 8. The listing, under the counsel rule.
  PERFORM pg_temp.runs(o, format('SELECT stay_wall_use_in_listing(%L, true)', pic_g), 'in a listing under a draft wording', false);
  PERFORM pg_temp.runs(t, format('SELECT stay_wall_wording_attest(%L, %L)', inst, ver), 'the tenant attests for counsel', false);
  PERFORM pg_temp.runs(o, format('SELECT stay_wall_wording_attest(%L, %L, ''reviewed by counsel 2026-10-13'')', inst, ver), 'the family records counsel''s review', true);
  IF NOT (SELECT counsel_attested FROM stay_wall_wording(door_c)) THEN RAISE EXCEPTION 'STAY WALL SMOKE FAIL: the wording still reads as a draft after the attestation'; END IF;
  PERFORM pg_temp.runs(o, format('SELECT stay_wall_use_in_listing(%L, true)', pic_t), 'in a listing: Apt 2 is occupied, the copy is made anyway (the shelf decides what shows)', true);
  photo1 := pg_temp.uuid_as(o, format('SELECT stay_wall_use_in_listing(%L, true)', pic_g));
  SELECT * INTO r FROM property_photos WHERE id = photo1;
  IF r.kind <> 'listing' OR r.rental_ref <> door_c OR r.source <> 'wall:' || pic_g::text OR r.storage_path <> img OR r.author_label <> 'Gail Guest' OR r.archived_at IS NOT NULL THEN
    RAISE EXCEPTION 'STAY WALL SMOKE FAIL: the listing copy reads % / % / % / %', r.kind, r.rental_ref, r.source, r.author_label;
  END IF;
  IF pg_temp.count_as(NULL, format('SELECT count(*) FROM public_vacancy_photos(%L) v WHERE v.id = %L', door_c, photo1)) <> 1 THEN RAISE EXCEPTION 'STAY WALL SMOKE FAIL: the public photo road does not carry the listing copy'; END IF;
  PERFORM pg_temp.runs(o, format('SELECT stay_wall_use_in_listing(%L, false)', pic_g), 'off the listing', true);
  IF (SELECT archived_at FROM property_photos WHERE id = photo1) IS NULL THEN RAISE EXCEPTION 'STAY WALL SMOKE FAIL: un-selecting did not archive the copy'; END IF;
  IF pg_temp.count_as(NULL, format('SELECT count(*) FROM public_vacancy_photos(%L) v WHERE v.id = %L', door_c, photo1)) <> 0 THEN RAISE EXCEPTION 'STAY WALL SMOKE FAIL: an archived listing copy still shows'; END IF;
  photo2 := pg_temp.uuid_as(o, format('SELECT stay_wall_use_in_listing(%L, true)', pic_g));
  IF photo2 <> photo1 OR (SELECT archived_at FROM property_photos WHERE id = photo1) IS NOT NULL THEN RAISE EXCEPTION 'STAY WALL SMOKE FAIL: re-selecting did not bring the same copy back (% vs %)', photo2, photo1; END IF;
  -- 9. The poster asks: off the wall and out of the listing at once.
  PERFORM pg_temp.runs(s, format('SELECT stay_wall_ask_removal(%L)', pic_t), 'a stranger asks for a take-down', false);
  PERFORM pg_temp.runs(o, format('SELECT stay_wall_ask_removal(%L)', pic_t), 'the family uses the poster''s ask', false);
  PERFORM pg_temp.runs(t, format('SELECT stay_wall_ask_removal(%L)', pic_t), 'the tenant asks', true);
  IF pg_temp.count_as(NULL, format('SELECT count(*) FROM public_stay_walls() w WHERE w.id = %L', pic_t)) <> 0 THEN RAISE EXCEPTION 'STAY WALL SMOKE FAIL: the picture is still on the wall after the ask'; END IF;
  IF (SELECT status FROM stay_pictures WHERE id = pic_t) <> 'approved' OR (SELECT removal_asked_at FROM stay_pictures WHERE id = pic_t) IS NULL THEN RAISE EXCEPTION 'STAY WALL SMOKE FAIL: the ask did not land on the row'; END IF;
  PERFORM pg_temp.runs(o, format('SELECT stay_wall_use_in_listing(%L, true)', pic_t), 'listing a picture whose poster asked', false);
  PERFORM pg_temp.runs(NULL, format('SELECT stay_wall_ask_removal_as_guest(%L, %L)', tok, pic_t), 'the card asks about the tenant''s picture', false);
  PERFORM pg_temp.runs(NULL, format('SELECT stay_wall_ask_removal_as_guest(%L, %L)', tok, pic_g), 'the guest asks with the card and their id', true);
  IF (SELECT archived_at FROM property_photos WHERE id = photo1) IS NULL THEN RAISE EXCEPTION 'STAY WALL SMOKE FAIL: the guest''s ask did not take the listing copy down'; END IF;
  IF pg_temp.count_as(NULL, 'SELECT count(*) FROM public_stay_walls()') <> 0 THEN RAISE EXCEPTION 'STAY WALL SMOKE FAIL: the wall is not empty after both asks'; END IF;
  -- 10. The family removes for good; the clock holds every move.
  PERFORM pg_temp.runs(t, format('SELECT stay_wall_remove(%L)', pic_t), 'the tenant removes', false);
  PERFORM pg_temp.runs(o, format('SELECT stay_wall_remove(%L, ''asked, done'')', pic_t), 'the family removes', true);
  IF (SELECT status FROM stay_pictures WHERE id = pic_t) <> 'removed' THEN RAISE EXCEPTION 'STAY WALL SMOKE FAIL: not removed'; END IF;
  SELECT count(*) INTO n FROM door_events WHERE subject = 'stay-picture' AND subject_id = pic_t
    AND event IN ('submitted', 'status', 'listing', 'removal-asked');
  IF n < 5 THEN RAISE EXCEPTION 'STAY WALL SMOKE FAIL: only % events on the clock for the tenant''s picture', n; END IF;
  IF NOT EXISTS (SELECT 1 FROM door_events WHERE subject = 'stay-picture' AND subject_id = pic_t AND event = 'status' AND to_value = 'removed') THEN
    RAISE EXCEPTION 'STAY WALL SMOKE FAIL: the removal is not on the clock';
  END IF;
  -- 11. Nobody writes a row directly.
  IF pg_temp.changes(t, format('UPDATE stay_pictures SET status = ''approved'' WHERE id = %L', pic_g)) <> 0 THEN RAISE EXCEPTION 'STAY WALL SMOKE FAIL: the tenant wrote a status directly'; END IF;
  IF pg_temp.changes(o, format('UPDATE stay_pictures SET status = ''approved'', removal_asked_at = NULL WHERE id = %L', pic_g)) <> 0 THEN RAISE EXCEPTION 'STAY WALL SMOKE FAIL: the family wrote a row directly'; END IF;
  PERFORM pg_temp.runs(o, format('INSERT INTO stay_pictures (instance_id, rental_id, submitted_role, poster_name, image, attests_own, attests_consent, attests_minors, wording_version, wording_hash, attestation, consent) VALUES (%L, %L, ''family'', ''Owner'', %L, true, true, true, %L, %L, %L, %L)', inst, door_c, img, ver, hsh, att, con), 'a direct insert', false);
  PERFORM pg_temp.runs(o, format('DELETE FROM stay_pictures WHERE id = %L', pic_g), 'a direct delete', false);
  PERFORM pg_temp.runs(o, 'UPDATE stay_wall_wordings SET body = ''x'' WHERE is_current', 'rewriting the wording', false);
  -- 12. The sixth guest picture in an hour is refused.
  FOR i IN 1..4 LOOP
    PERFORM pg_temp.runs(NULL, format('SELECT stay_wall_submit_as_guest(%L, %L, %L, %L, %L, false, true, true, true, %L, %L, %L, %L, now())',
                                      tok, img, thumb, 'again ' || i, 'Gail Guest', ver, hsh, att, con), 'guest picture ' || (i + 1), true);
  END LOOP;
  PERFORM pg_temp.runs(NULL, format('SELECT stay_wall_submit_as_guest(%L, %L, %L, %L, %L, false, true, true, true, %L, %L, %L, %L, now())',
                                    tok, img, thumb, 'one too many', 'Gail Guest', ver, hsh, att, con), 'the sixth guest picture in an hour', false);
  -- 13. The wall's name when the street is held.
  UPDATE rentals SET address_visibility = 'after-application' WHERE id IN (door_a, door_c);
  PERFORM pg_temp.runs(o, format('SELECT stay_wall_decide(%L, ''approved'')', (SELECT id FROM stay_pictures WHERE caption = 'again 1')), 'approve one more', true);
  lbl := pg_temp.text_as(NULL, 'SELECT wall_label FROM public_stay_walls() LIMIT 1');
  IF lbl <> 'Life at this home' THEN RAISE EXCEPTION 'STAY WALL SMOKE FAIL: a held street names the wall % (expected "Life at this home")', lbl; END IF;
END $$;

SELECT 'STAY WALL SMOKE: PASS' AS result;
ROLLBACK;
