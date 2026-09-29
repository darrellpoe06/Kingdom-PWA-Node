-- =============================================================================
-- 0242 LESSON PARITY SMOKE — the parity tables are the Governor's alone
-- (DR-0671)
-- =============================================================================
-- Run as postgres AFTER applying 0242, in a transaction that ROLLS BACK.
-- The Governor's email list is swapped for a test address INSIDE the
-- transaction only (lesson_governor_emails), so no real account is touched.
-- PROVES:
--   the Governor reads lesson_parity, lesson_crossref, lesson_parity_fixes,
--   lesson_parity_promotion; a signed-in member reads NONE of them and anon
--   reads none; a member cannot insert, update or delete a parity row and
--   cannot hold a promotion; the Governor's hold keeps a ready writer at
--   'ready', and releasing it makes the writer 'primary'.
-- PASS prints 'LESSON PARITY SMOKE: PASS'; any wrong grant RAISES.
-- =============================================================================
BEGIN;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-4000-a000-000000000242', 'authenticated','authenticated','gov0242@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'b0000000-0000-4000-a000-000000000242', 'authenticated','authenticated','mem0242@test.local','', now(), now());

CREATE OR REPLACE FUNCTION public.lesson_governor_emails()
RETURNS text[] LANGUAGE sql IMMUTABLE
AS $$ SELECT ARRAY['gov0242@test.local']::text[] $$;

INSERT INTO public.lesson_parity (id, teaching_row_id, lesson_id, version_id, reference_version_id, writer, writer_family,
  model_label, parity_score, passed, measure_version)
VALUES ('d0000000-0000-4000-a000-000000000242', 'e0000000-0000-4000-a000-000000000242', 'll-smoke',
  'e1000000-0000-4000-a000-000000000242', 'e2000000-0000-4000-a000-000000000242', 'ollama', 'ollama', 'smoke-label', 0.9612, true, 'parity-v1');
INSERT INTO public.lesson_crossref (build_id, teaching_row_id, lesson_id, measure_version)
VALUES ('e3000000-0000-4000-a000-000000000242', 'e0000000-0000-4000-a000-000000000242', 'll-smoke', 'parity-v1');
INSERT INTO public.lesson_parity_fixes (gap_class, writer_family, status)
VALUES ('missing-verse-retrieval', 'ollama', 'awaiting-writer');
INSERT INTO public.lesson_parity_promotion (writer_family, model_label, streak, required_n, threshold, ready, status)
VALUES ('ollama', 'smoke-label', 14, 14, 0.95, true, 'primary');

CREATE OR REPLACE FUNCTION pg_temp.count_as(_who uuid, _role text, _sql text)
RETURNS int LANGUAGE plpgsql AS $$
DECLARE n int;
BEGIN
  PERFORM set_config('role', _role, true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role', _role)::text, true);
  EXECUTE _sql INTO n;
  PERFORM set_config('role', 'postgres', true);
  RETURN n;
END $$;

CREATE OR REPLACE FUNCTION pg_temp.try_as(_who uuid, _sql text)
RETURNS boolean LANGUAGE plpgsql AS $$
DECLARE n int;
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role', 'authenticated')::text, true);
  BEGIN
    EXECUTE _sql;
    GET DIAGNOSTICS n = ROW_COUNT;
  EXCEPTION WHEN others THEN
    PERFORM set_config('role', 'postgres', true);
    RETURN false;
  END;
  PERFORM set_config('role', 'postgres', true);
  RETURN n > 0;
END $$;

DO $$
DECLARE
  gov uuid := 'a0000000-0000-4000-a000-000000000242';
  mem uuid := 'b0000000-0000-4000-a000-000000000242';
  t text;
  s text;
BEGIN
  FOREACH t IN ARRAY ARRAY['lesson_parity','lesson_crossref','lesson_parity_fixes','lesson_parity_promotion'] LOOP
    IF pg_temp.count_as(gov, 'authenticated', format('SELECT count(*) FROM public.%I', t)) < 1 THEN
      RAISE EXCEPTION 'the Governor cannot read %', t;
    END IF;
    IF pg_temp.count_as(mem, 'authenticated', format('SELECT count(*) FROM public.%I', t)) <> 0 THEN
      RAISE EXCEPTION 'a member reads %', t;
    END IF;
    BEGIN
      IF pg_temp.count_as(NULL, 'anon', format('SELECT count(*) FROM public.%I', t)) <> 0 THEN
        RAISE EXCEPTION 'anon reads %', t;
      END IF;
    EXCEPTION WHEN insufficient_privilege THEN
      PERFORM set_config('role', 'postgres', true);  -- anon has no grant at all: refused outright
    END;
  END LOOP;

  IF pg_temp.try_as(mem, $q$INSERT INTO public.lesson_parity (version_id, reference_version_id, writer_family, parity_score, passed, measure_version)
      VALUES (gen_random_uuid(), gen_random_uuid(), 'ollama', 1, true, 'parity-v1')$q$) THEN
    RAISE EXCEPTION 'a member inserted a parity row';
  END IF;
  IF pg_temp.try_as(gov, $q$UPDATE public.lesson_parity SET parity_score = 1$q$) THEN
    RAISE EXCEPTION 'a signed-in person changed a measured score (only the NAS writes)';
  END IF;
  IF pg_temp.try_as(gov, $q$DELETE FROM public.lesson_parity_fixes$q$) THEN
    RAISE EXCEPTION 'a signed-in person deleted a fix record';
  END IF;
  IF pg_temp.try_as(mem, $q$SELECT public.set_lesson_parity_hold('ollama', 'smoke-label', true)$q$) THEN
    RAISE EXCEPTION 'a member held a promotion';
  END IF;

  -- The Governor holds: a ready writer stays 'ready'. Released: it is 'primary'.
  IF NOT pg_temp.try_as(gov, $q$SELECT public.set_lesson_parity_hold('ollama', 'smoke-label', true)$q$) THEN
    RAISE EXCEPTION 'the Governor could not hold a promotion';
  END IF;
  SELECT status INTO s FROM public.lesson_parity_promotion WHERE writer_family = 'ollama' AND model_label = 'smoke-label';
  IF s <> 'ready' THEN RAISE EXCEPTION 'a held writer reads % (want ready)', s; END IF;
  IF NOT pg_temp.try_as(gov, $q$SELECT public.set_lesson_parity_hold('ollama', 'smoke-label', false)$q$) THEN
    RAISE EXCEPTION 'the Governor could not release a hold';
  END IF;
  SELECT status INTO s FROM public.lesson_parity_promotion WHERE writer_family = 'ollama' AND model_label = 'smoke-label';
  IF s <> 'primary' THEN RAISE EXCEPTION 'a released ready writer reads % (want primary)', s; END IF;

  RAISE NOTICE 'LESSON PARITY SMOKE: PASS';
END $$;

ROLLBACK;
