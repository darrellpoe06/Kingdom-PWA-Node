-- =============================================================================
-- 0325 SMOKE — the Institute's walls hold (DR-1460)
-- =============================================================================
-- One transaction; ROLLS BACK. PASS prints 'INSTITUTE WALLS SMOKE: PASS'.
-- Every account and instance here is a test row inside this rollback.
--
--   Church C: O is admin (the office), A an applicant, B another member.
--   S is admin of a different church C2.
--     A cannot apply while the settings read not-filed              ✘
--     O confirms and opens; A applies                                ✔
--     B cannot read A's application; S cannot read it; O can         ✔
--     A cannot mark attendance; O can                                ✔
--     B cannot issue a credential; O cannot before the standard      ✘
--     O accepts, A passes the course's quiz, O marks the floor       ✔
--     O issues; a second issue is refused; verify returns the        ✔
--       minimal fields; a wrong code returns null
-- =============================================================================
BEGIN;
\set o '00000000-0000-4000-a000-0000000a0325'
\set a '00000000-0000-4000-a000-0000000b0325'
\set b '00000000-0000-4000-a000-0000000c0325'
\set s '00000000-0000-4000-a000-0000000d0325'
\set c '00000000-0000-4000-b000-000000010325'
\set c2 '00000000-0000-4000-b000-000000020325'
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000000', :'o', 'authenticated','authenticated','o0325@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'a', 'authenticated','authenticated','a0325@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'b', 'authenticated','authenticated','b0325@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'s', 'authenticated','authenticated','s0325@test.local','', now(), now());
INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  (:'c',  'church-0325a', 'Church 0325 (smoke)', 'church'),
  (:'c2', 'church-0325b', 'Other church 0325 (smoke)', 'church');
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  (:'c',  :'o', 'admin',  'Office O'),
  (:'c',  :'a', 'member', 'Applicant A'),
  (:'c',  :'b', 'member', 'Member B'),
  (:'c2', :'s', 'admin',  'Other office S');
INSERT INTO institute_settings (instance_id) VALUES (:'c');
CREATE OR REPLACE FUNCTION pg_temp.as_user(_who uuid) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role', 'authenticated')::text, true);
  PERFORM set_config('role', 'authenticated', true);
END $$;
CREATE OR REPLACE FUNCTION pg_temp.as_anon() RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
  PERFORM set_config('role', 'anon', true);
END $$;
CREATE OR REPLACE FUNCTION pg_temp.as_postgres() RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('role', 'postgres', true);
END $$;
GRANT EXECUTE ON FUNCTION pg_temp.as_user(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION pg_temp.as_anon() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION pg_temp.as_postgres() TO authenticated, anon;
DO $$
DECLARE
  o uuid := '00000000-0000-4000-a000-0000000a0325';
  a uuid := '00000000-0000-4000-a000-0000000b0325';
  b uuid := '00000000-0000-4000-a000-0000000c0325';
  s uuid := '00000000-0000-4000-a000-0000000d0325';
  c uuid := '00000000-0000-4000-b000-000000010325';
  v_enroll uuid;
  v_n int;
  v_done jsonb;
  v_cred jsonb;
  v_seen jsonb;
  v_refused boolean;
BEGIN
  -- 1. A cannot apply while the paperwork reads not-filed.
  PERFORM pg_temp.as_user(a);
  v_refused := false;
  BEGIN
    INSERT INTO institute_enrollments (instance_id, program_key, program_title, course_keys)
      VALUES (c, 'ministry-leadership', 'Ministry Leadership', ARRAY['church-offices']);
  EXCEPTION WHEN OTHERS THEN v_refused := true;
  END;
  IF NOT v_refused THEN RAISE EXCEPTION '0325: an application was accepted before the office confirmed the paperwork'; END IF;

  -- 2. B (a member, not the office) cannot open enrollment.
  PERFORM pg_temp.as_user(b);
  UPDATE institute_settings SET exemption_status = 'confirmed', enrollment_open = true WHERE instance_id = c;
  PERFORM pg_temp.as_postgres();
  SELECT count(*) INTO v_n FROM institute_settings WHERE instance_id = c AND enrollment_open;
  IF v_n <> 0 THEN RAISE EXCEPTION '0325: a member who is not the office opened enrollment'; END IF;

  -- 3. O confirms and opens; A applies.
  PERFORM pg_temp.as_user(o);
  UPDATE institute_settings SET exemption_status = 'confirmed', enrollment_open = true, attendance_floor = 2 WHERE instance_id = c;
  PERFORM pg_temp.as_user(a);
  INSERT INTO institute_enrollments (instance_id, program_key, program_title, course_keys)
    VALUES (c, 'ministry-leadership', 'Ministry Leadership', ARRAY['church-offices'])
    RETURNING id INTO v_enroll;
  IF v_enroll IS NULL THEN RAISE EXCEPTION '0325: the applicant could not apply once enrollment was open'; END IF;

  -- 4. B cannot read A's application; S cannot; O can; A can.
  PERFORM pg_temp.as_user(b);
  SELECT count(*) INTO v_n FROM institute_enrollments WHERE id = v_enroll;
  IF v_n <> 0 THEN RAISE EXCEPTION '0325: a member read another member''s application'; END IF;
  PERFORM pg_temp.as_user(s);
  SELECT count(*) INTO v_n FROM institute_enrollments WHERE id = v_enroll;
  IF v_n <> 0 THEN RAISE EXCEPTION '0325: another church''s office read this church''s application'; END IF;
  PERFORM pg_temp.as_user(o);
  SELECT count(*) INTO v_n FROM institute_enrollments WHERE id = v_enroll;
  IF v_n <> 1 THEN RAISE EXCEPTION '0325: the office cannot read the roll'; END IF;
  PERFORM pg_temp.as_user(a);
  SELECT count(*) INTO v_n FROM institute_enrollments WHERE id = v_enroll;
  IF v_n <> 1 THEN RAISE EXCEPTION '0325: the applicant cannot read their own application'; END IF;

  -- 5. A cannot accept themselves; the WITH CHECK refuses the status.
  v_refused := false;
  BEGIN
    UPDATE institute_enrollments SET status = 'accepted' WHERE id = v_enroll;
  EXCEPTION WHEN OTHERS THEN v_refused := true;
  END;
  IF NOT v_refused THEN RAISE EXCEPTION '0325: an applicant accepted their own application'; END IF;

  -- 6. A cannot mark attendance; O can.
  v_refused := false;
  BEGIN
    INSERT INTO institute_attendance (instance_id, enrollment_id, session_date, present) VALUES (c, v_enroll, DATE '2026-11-17', true);
  EXCEPTION WHEN OTHERS THEN v_refused := true;
  END;
  IF NOT v_refused THEN RAISE EXCEPTION '0325: a student marked their own attendance'; END IF;
  PERFORM pg_temp.as_user(o);
  INSERT INTO institute_attendance (instance_id, enrollment_id, session_date, present, marked_by) VALUES (c, v_enroll, DATE '2026-11-17', true, o);

  -- 7. B cannot issue; O cannot issue before the standard is met.
  PERFORM pg_temp.as_user(b);
  v_refused := false;
  BEGIN
    v_cred := institute_issue_credential(v_enroll, 'Applicant A');
  EXCEPTION WHEN OTHERS THEN v_refused := true;
  END;
  IF NOT v_refused THEN RAISE EXCEPTION '0325: a member who is not the office issued a credential'; END IF;
  PERFORM pg_temp.as_user(o);
  v_refused := false;
  BEGIN
    v_cred := institute_issue_credential(v_enroll, 'Applicant A');
  EXCEPTION WHEN OTHERS THEN v_refused := true;
  END;
  IF NOT v_refused THEN RAISE EXCEPTION '0325: a credential issued before the completion standard was met'; END IF;

  -- 8. O accepts; A passes the course's quiz; O marks the second session; the standard reads complete.
  UPDATE institute_enrollments SET status = 'accepted' WHERE id = v_enroll;
  INSERT INTO institute_attendance (instance_id, enrollment_id, session_date, present, marked_by) VALUES (c, v_enroll, DATE '2026-11-19', true, o);
  PERFORM pg_temp.as_user(a);
  INSERT INTO learner_lesson_records (user_id, lesson_id, course_key, quiz_pct, quiz_passed, quiz_at)
    VALUES (a, 'offices-1', 'church-offices', 90, true, now());
  v_done := institute_completion(v_enroll);
  IF NOT coalesce((v_done->>'complete')::boolean, false) THEN RAISE EXCEPTION '0325: the standard did not read complete after the rows that meet it exist: %', v_done::text; END IF;

  -- 9. O issues; a second issue is refused; the row carries a number and a code.
  PERFORM pg_temp.as_user(o);
  v_cred := institute_issue_credential(v_enroll, 'Applicant A');
  IF coalesce(v_cred->>'credentialNo', '') = '' OR coalesce(v_cred->>'verifyCode', '') = '' THEN RAISE EXCEPTION '0325: the credential has no number or code'; END IF;
  v_refused := false;
  BEGIN
    v_cred := institute_issue_credential(v_enroll, 'Applicant A');
  EXCEPTION WHEN OTHERS THEN v_refused := true;
  END;
  IF NOT v_refused THEN RAISE EXCEPTION '0325: a second credential issued for the same enrollment'; END IF;
  PERFORM pg_temp.as_postgres();
  SELECT verify_code INTO STRICT v_seen FROM (SELECT to_jsonb(verify_code) AS verify_code FROM institute_credentials WHERE enrollment_id = v_enroll) q;

  -- 10. Anyone verifies with the code and gets the minimal fields; a wrong code gets null; A reads their own credential; B reads none.
  PERFORM pg_temp.as_anon();
  v_cred := institute_verify_credential(v_seen #>> '{}');
  IF v_cred IS NULL OR (v_cred->>'holderName') <> 'Applicant A' OR (v_cred ? 'issued_by') THEN RAISE EXCEPTION '0325: the verify door returned the wrong fields: %', coalesce(v_cred::text, 'null'); END IF;
  IF institute_verify_credential('NOT-A-CODE') IS NOT NULL THEN RAISE EXCEPTION '0325: a wrong code verified'; END IF;
  PERFORM pg_temp.as_user(a);
  SELECT count(*) INTO v_n FROM institute_credentials WHERE enrollment_id = v_enroll;
  IF v_n <> 1 THEN RAISE EXCEPTION '0325: the holder cannot read their own credential'; END IF;
  PERFORM pg_temp.as_user(b);
  SELECT count(*) INTO v_n FROM institute_credentials WHERE enrollment_id = v_enroll;
  IF v_n <> 0 THEN RAISE EXCEPTION '0325: a member read another member''s credential'; END IF;

  PERFORM pg_temp.as_postgres();
  RAISE NOTICE 'INSTITUTE WALLS SMOKE: PASS';
END $$;
ROLLBACK;
