-- =============================================================================
-- 0243 LESSON BUILDER SMOKE — versions, decisions and the builder's settings
-- (DR-0669)
-- =============================================================================
-- Run as postgres AFTER applying 0237 and 0243, in a transaction that ROLLS
-- BACK. The Governor's email list is swapped for a test address inside the
-- transaction only. PROVES: the Governor reads lesson_versions and a household
-- member reads none; no signed-in person can write a version; a backfill
-- version can never be published (CHECK); the Governor writes a decision born
-- 'decided' and cannot forge its outcome; a member cannot decide; the
-- Governor changes the writer mode but cannot forge the service's status
-- column; the three rings are installed. PASS prints
-- 'LESSON BUILDER SMOKE: PASS'.
-- =============================================================================
BEGIN;

\set gov 'a0000000-0000-4000-a000-000000000240'
\set mem 'b0000000-0000-4000-a000-000000000240'
\set inst 'f0000000-0000-4000-b000-000000000240'

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', :'gov', 'authenticated','authenticated','gov0240@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'mem', 'authenticated','authenticated','mem0240@test.local','', now(), now());

INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  (:'inst', 'fam-0240', 'Builder smoke household', 'family');
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  (:'inst', :'gov', 'owner',  'Governor'),
  (:'inst', :'mem', 'member', 'Member');

CREATE OR REPLACE FUNCTION public.lesson_governor_emails()
RETURNS text[] LANGUAGE sql IMMUTABLE
AS $$ SELECT ARRAY['gov0240@test.local']::text[] $$;

CREATE OR REPLACE FUNCTION pg_temp.as_user(_who uuid, _sql text)
RETURNS boolean LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role', 'authenticated')::text, true);
  BEGIN
    EXECUTE _sql;
  EXCEPTION WHEN others THEN
    PERFORM set_config('role', 'postgres', true);
    RETURN false;
  END;
  PERFORM set_config('role', 'postgres', true);
  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION pg_temp.count_as(_who uuid, _sql text)
RETURNS int LANGUAGE plpgsql AS $$
DECLARE n int;
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role', 'authenticated')::text, true);
  EXECUTE _sql INTO n;
  PERFORM set_config('role', 'postgres', true);
  RETURN n;
END $$;

DO $$
DECLARE
  gov  uuid := 'a0000000-0000-4000-a000-000000000240';
  mem  uuid := 'b0000000-0000-4000-a000-000000000240';
  inst uuid := 'f0000000-0000-4000-b000-000000000240';
  b    uuid := 'e0000000-0000-4000-a000-000000000240';
  v1   uuid := 'd0000000-0000-4000-a000-00000000a240';
  n int;
  ok boolean;
BEGIN
  -- The service (postgres here, the NAS builder in life) writes a version.
  INSERT INTO lesson_versions (id, build_id, instance_id, writer, family, model_label, prompt_sha256, prompt_text, body)
  VALUES (v1, b, inst, 'claude-cli', 'claude', 'label', 'sha', 'the prompt', '{"verdict":"lesson"}');

  n := pg_temp.count_as(gov, 'SELECT count(*) FROM lesson_versions WHERE build_id = ''e0000000-0000-4000-a000-000000000240''');
  IF n <> 1 THEN RAISE EXCEPTION 'FAIL: the Governor could not read the version (%)', n; END IF;
  n := pg_temp.count_as(mem, 'SELECT count(*) FROM lesson_versions WHERE build_id = ''e0000000-0000-4000-a000-000000000240''');
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL: a member read a lesson version (%)', n; END IF;

  IF pg_temp.as_user(gov, format(
      'INSERT INTO lesson_versions (build_id, writer, prompt_sha256, prompt_text) VALUES (%L, ''forged'', ''s'', ''p'')', b)) THEN
    RAISE EXCEPTION 'FAIL: a signed-in person wrote a lesson version';
  END IF;

  -- A backfill version can never be published.
  BEGIN
    INSERT INTO lesson_versions (build_id, writer, prompt_sha256, prompt_text, backfill, published)
    VALUES (b, 'x', 's', 'p', true, true);
    RAISE EXCEPTION 'FAIL: a published backfill version was accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;

  -- The Governor decides; the decision is born 'decided' with no outcome.
  IF NOT pg_temp.as_user(gov, format(
      'INSERT INTO lesson_decisions (build_id, instance_id, version_id, decided_by) VALUES (%L, %L, %L, %L)', b, inst, v1, gov)) THEN
    RAISE EXCEPTION 'FAIL: the Governor could not write a decision';
  END IF;
  IF pg_temp.as_user(gov, format(
      'INSERT INTO lesson_decisions (build_id, version_id, decided_by, status, lesson_id) VALUES (%L, %L, %L, ''shipped'', ''ll1-x'')', b, v1, gov)) THEN
    RAISE EXCEPTION 'FAIL: a decision was written with a forged outcome';
  END IF;
  IF pg_temp.as_user(mem, format(
      'INSERT INTO lesson_decisions (build_id, version_id, decided_by) VALUES (%L, %L, %L)', b, v1, mem)) THEN
    RAISE EXCEPTION 'FAIL: a member wrote a lesson decision';
  END IF;
  n := pg_temp.count_as(mem, 'SELECT count(*) FROM lesson_decisions');
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL: a member read a decision (%)', n; END IF;

  -- The Governor's control: the mode, yes; the service's own status, never.
  IF NOT pg_temp.as_user(gov, format(
      'UPDATE lesson_builder_settings SET writer_mode = ''primary'', updated_by = %L WHERE id = 1', gov)) THEN
    RAISE EXCEPTION 'FAIL: the Governor could not set the writer mode';
  END IF;
  IF (SELECT writer_mode FROM lesson_builder_settings WHERE id = 1) <> 'primary' THEN
    RAISE EXCEPTION 'FAIL: the writer mode did not change';
  END IF;
  IF pg_temp.as_user(gov, 'UPDATE lesson_builder_settings SET service_status = ''{"state":"forged"}'' WHERE id = 1') THEN
    RAISE EXCEPTION 'FAIL: a signed-in person forged the service status';
  END IF;
  PERFORM pg_temp.as_user(mem, format(
      'UPDATE lesson_builder_settings SET writer_mode = ''selected'', updated_by = %L WHERE id = 1', mem));
  IF (SELECT writer_mode FROM lesson_builder_settings WHERE id = 1) <> 'primary' THEN
    RAISE EXCEPTION 'FAIL: a member changed the writer mode';
  END IF;

  -- The rings.
  SELECT count(*) INTO n FROM pg_trigger
   WHERE NOT tgisinternal AND tgname IN ('agent_inbox_lesson_notify', 'lesson_decision_notify', 'lesson_builder_settings_notify');
  IF n <> 3 THEN RAISE EXCEPTION 'FAIL: % of the 3 rings are installed', n; END IF;

  RAISE NOTICE 'LESSON BUILDER SMOKE: PASS';
END $$;

ROLLBACK;
