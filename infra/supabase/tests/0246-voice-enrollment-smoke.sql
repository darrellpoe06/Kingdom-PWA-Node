-- =============================================================================
-- 0246 VOICE ENROLLMENT SMOKE — consent first, own row only, removal is real,
-- the Governor sees labels and never more (DR-0720)
-- =============================================================================
-- Run as postgres AFTER 0237 (or scripts/curriculum-ci-bootstrap.sql) and
-- 0246, in a transaction that ROLLS BACK. The Governor's email list is swapped
-- for a test address INSIDE the transaction only, so no real account is touched.
-- PROVES:
--   * no sample is filed without consent (send_voice_sample refuses);
--   * a sample outside the person's own folder is refused;
--   * a person reads only their own row; no client writes the table directly;
--   * BG is held; DP is the Governor's alone; one label per person;
--   * remove_my_voice deletes the consent row and says so;
--   * the label list is the Governor's alone, and carries no sample path.
-- PASS prints 'VOICE ENROLLMENT SMOKE: PASS'; any leak RAISES.
-- =============================================================================
\set ON_ERROR_STOP 1
BEGIN;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-4000-a000-000000000246', 'authenticated','authenticated','gov0246@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'b0000000-0000-4000-a000-000000000246', 'authenticated','authenticated','ma0246@test.local','',  now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'c0000000-0000-4000-a000-000000000246', 'authenticated','authenticated','mb0246@test.local','',  now(), now());

CREATE OR REPLACE FUNCTION public.lesson_governor_emails()
RETURNS text[] LANGUAGE sql IMMUTABLE
AS $$ SELECT ARRAY['gov0246@test.local']::text[] $$;

CREATE OR REPLACE FUNCTION pg_temp.as_user(_who uuid) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role', 'authenticated')::text, true);
  PERFORM set_config('role', 'authenticated', true);
END $$;
CREATE OR REPLACE FUNCTION pg_temp.as_postgres() RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('role', 'postgres', true);
END $$;
GRANT EXECUTE ON FUNCTION pg_temp.as_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION pg_temp.as_postgres() TO authenticated;

DO $$
DECLARE
  a uuid := 'b0000000-0000-4000-a000-000000000246';
  b uuid := 'c0000000-0000-4000-a000-000000000246';
  g uuid := 'a0000000-0000-4000-a000-000000000246';
  n int;
  j jsonb;
BEGIN
  -- 1. No consent, no sample.
  PERFORM pg_temp.as_user(a);
  BEGIN
    PERFORM public.send_voice_sample(a::text || '/20261001T120000Z-x.webm');
    RAISE EXCEPTION 'LEAK: a sample was filed without consent';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;

  -- 2. Consent, then a sample from the own folder only.
  PERFORM public.give_voice_consent('jm', 'Jane Mercy', 'I agree: keep a voice signature on the home server.', false);
  BEGIN
    PERFORM public.send_voice_sample(b::text || '/x.webm');
    RAISE EXCEPTION 'LEAK: a sample from another person''s folder was accepted';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  j := public.send_voice_sample(a::text || '/20261001T120000Z-x.webm');
  IF j->>'status' <> 'sample-sent' THEN RAISE EXCEPTION 'FAIL: own sample not filed: %', j; END IF;

  -- 3. No direct writes.
  BEGIN
    UPDATE public.voice_enrollments SET status = 'enrolled' WHERE user_id = a;
    RAISE EXCEPTION 'LEAK: a client marked itself enrolled';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    INSERT INTO public.voice_enrollments (user_id, label, consent_text) VALUES (b, 'XX', 'forged');
    RAISE EXCEPTION 'LEAK: a client inserted a consent row directly';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;

  -- 4. Reserved and taken labels.
  PERFORM pg_temp.as_user(b);
  BEGIN
    PERFORM public.give_voice_consent('BG', 'Not Bishop', 'I agree.', false);
    RAISE EXCEPTION 'LEAK: a member took BG';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    PERFORM public.give_voice_consent('DP', 'Not Darrell', 'I agree.', false);
    RAISE EXCEPTION 'LEAK: a member took DP';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    PERFORM public.give_voice_consent('JM', 'Someone Else', 'I agree.', false);
    RAISE EXCEPTION 'LEAK: a member took another person''s label';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  PERFORM public.give_voice_consent('MB', 'Member B', 'I agree.', true);

  -- 5. Each reads only their own row.
  SELECT count(*) INTO n FROM public.voice_enrollments;
  IF n <> 1 THEN RAISE EXCEPTION 'LEAK: member B read % rows (expected only their own)', n; END IF;
  SELECT count(*) INTO n FROM public.voice_enrollments WHERE user_id = a;
  IF n <> 0 THEN RAISE EXCEPTION 'LEAK: member B read member A''s consent'; END IF;

  -- 6. The label list is the Governor's alone.
  BEGIN
    PERFORM * FROM public.voice_enrollment_labels();
    RAISE EXCEPTION 'LEAK: a member read the label list';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  PERFORM pg_temp.as_user(g);
  SELECT count(*) INTO n FROM public.voice_enrollment_labels();
  IF n <> 2 THEN RAISE EXCEPTION 'FAIL: the Governor saw % labels (expected 2)', n; END IF;
  SELECT count(*) INTO n FROM public.voice_enrollments;
  IF n <> 0 THEN RAISE EXCEPTION 'LEAK: the Governor read % consent rows directly (expected 0)', n; END IF;
  PERFORM public.give_voice_consent('DP', 'Darrell Poe', 'I agree.', false);  -- the Governor may re-enroll himself

  -- 7. Remove my voice.
  PERFORM pg_temp.as_user(a);
  j := public.remove_my_voice();
  IF NOT (j->>'removed')::boolean OR j->>'label' <> 'JM' THEN RAISE EXCEPTION 'FAIL: remove did not say so: %', j; END IF;
  SELECT count(*) INTO n FROM public.voice_enrollments;
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL: the consent row survived removal'; END IF;
  BEGIN
    PERFORM public.send_voice_sample(a::text || '/again.webm');
    RAISE EXCEPTION 'LEAK: a sample was filed after the consent was removed';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;

  PERFORM pg_temp.as_postgres();
  RAISE NOTICE 'VOICE ENROLLMENT SMOKE: PASS';
END $$;

ROLLBACK;
