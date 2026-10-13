-- =============================================================================
-- 0234 SYSTEM FLOW PROOF SMOKE — the platform's live numbers are the
-- governors' to read, and nobody's to write from the app (DR-0622)
-- =============================================================================
-- Run as postgres AFTER applying 0234, in a transaction that ROLLS BACK.
-- PROVES: a member of poe-family reads the proof rows; a VIEWER of poe-family
-- reads none; the owner of another instance reads none; nobody signed in can
-- insert, change or delete a row. PASS prints 'SYSTEM FLOW PROOF SMOKE: PASS';
-- any wrong grant RAISES.
-- =============================================================================
BEGIN;

\set gov  'a0000000-0000-4000-a000-000000000234'
\set vw   'b0000000-0000-4000-a000-000000000234'
\set out  'c0000000-0000-4000-a000-000000000234'
\set instO 'f0000000-0000-4000-b000-000000010234'

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', :'gov', 'authenticated','authenticated','gov0234@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'vw',  'authenticated','authenticated','vw0234@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'out', 'authenticated','authenticated','out0234@test.local','', now(), now());

-- The governor circle is the poe-family instance. Use the real one when it
-- exists; create it inside this rolled-back transaction when it does not.
INSERT INTO instances (id, slug, display_name, instance_type)
SELECT 'f0000000-0000-4000-b000-000000000234', 'poe-family', 'Poe family (smoke)', 'family'
 WHERE NOT EXISTS (SELECT 1 FROM instances WHERE slug = 'poe-family');
INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  (:'instO', 'other-0234', 'Proof smoke other', 'family');

INSERT INTO instance_members (instance_id, user_id, role, display_name)
SELECT id, :'gov'::uuid, 'member', 'Governor G' FROM instances WHERE slug = 'poe-family';
INSERT INTO instance_members (instance_id, user_id, role, display_name)
SELECT id, :'vw'::uuid, 'viewer', 'Viewer V' FROM instances WHERE slug = 'poe-family';
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  (:'instO', :'out', 'owner', 'Owner O');

INSERT INTO public.system_flow_proof (run_id, resource, written, newest_at, consumed)
VALUES ('smoke-0234', 'db:feedback', 3, now(), 1);

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
  gov uuid := 'a0000000-0000-4000-a000-000000000234';
  vw  uuid := 'b0000000-0000-4000-a000-000000000234';
  outsider uuid := 'c0000000-0000-4000-a000-000000000234';
  q text := 'SELECT count(*) FROM public.system_flow_proof WHERE run_id = ''smoke-0234''';
  n int;
BEGIN
  n := pg_temp.count_as(gov, q);
  IF n <> 1 THEN
    RAISE EXCEPTION 'FAIL: a poe-family member read % proof rows (should be 1)', n;
  END IF;

  n := pg_temp.count_as(vw, q);
  IF n <> 0 THEN
    RAISE EXCEPTION 'LEAK: a poe-family VIEWER read % proof rows', n;
  END IF;

  n := pg_temp.count_as(outsider, q);
  IF n <> 0 THEN
    RAISE EXCEPTION 'LEAK: the owner of another instance read % proof rows', n;
  END IF;

  IF pg_temp.as_user(gov, 'INSERT INTO public.system_flow_proof (run_id, resource) VALUES (''forged'', ''db:feedback'')') THEN
    RAISE EXCEPTION 'LEAK: a signed-in governor wrote a proof row from the app';
  END IF;
  IF pg_temp.as_user(outsider, 'INSERT INTO public.system_flow_proof (run_id, resource) VALUES (''forged'', ''db:feedback'')') THEN
    RAISE EXCEPTION 'LEAK: an outsider wrote a proof row';
  END IF;
  PERFORM pg_temp.as_user(gov, 'UPDATE public.system_flow_proof SET written = 999 WHERE run_id = ''smoke-0234''');
  PERFORM pg_temp.as_user(gov, 'DELETE FROM public.system_flow_proof WHERE run_id = ''smoke-0234''');
  SELECT count(*) INTO n FROM public.system_flow_proof WHERE run_id = 'smoke-0234' AND written = 3;
  IF n <> 1 THEN
    RAISE EXCEPTION 'LEAK: a signed-in user changed or deleted a proof row';
  END IF;

  RAISE NOTICE 'SYSTEM FLOW PROOF SMOKE: PASS';
END $$;

ROLLBACK;
