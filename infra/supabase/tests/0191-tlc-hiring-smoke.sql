-- =============================================================================
-- 0191 TLC HIRING SMOKE — the enablement gate for jobs and applications
-- (0191, DR-0350). Run on the LIVE Supabase (as postgres) AFTER 0187..0191.
-- Runs in a transaction and ROLLS BACK. PASS prints 'TLC HIRING SMOKE: PASS';
-- any wrong grant RAISES.
--
-- Scenario: office instance F — owner O, therapist T (member), assistant A,
-- viewer V; applicant P is a stranger with NO login at all (anon).
--
-- Assertions:
--   O posts a job (draft) and opens it                 -> allowed          ✔
--   T (member) reads the posting                       -> 1                ✔
--   T / A / V insert a job                             -> DENIED           ✘
--   anon reads the open jobs through tlc_public_jobs   -> this office's open one, never its draft ✔
--   anon applies through tlc_apply                     -> allowed, 1 row    ✔
--   anon applies again to the same job                 -> REFUSED          ✘
--   anon applies to a draft job                        -> REFUSED          ✘
--   anon inserts into tlc_job_applications directly    -> DENIED           ✘
--   T (member) / A / V read applications               -> 0                ✔
--   O reads applications                               -> 1                ✔
--   O moves it to offered                              -> allowed          ✔
--   O changes the applicant's email by UPDATE          -> IGNORED (trigger) ✔
--   T hires                                            -> REFUSED          ✘
--   O hires                                            -> hired, invite minted for that email, linked ✔
--   O hires again                                      -> already, same invite ✔
--   O marks the telehealth hand-off invited            -> stamped at/by    ✔
-- =============================================================================
BEGIN;

\set o 'a0000000-0000-4000-a000-000000000191'
\set t 'b0000000-0000-4000-a000-000000000191'
\set a 'c0000000-0000-4000-a000-000000000191'
\set v 'd0000000-0000-4000-a000-000000000191'
\set instF 'f0000000-0000-4000-b000-000000000191'

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', :'o', 'authenticated','authenticated','o0191@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'t', 'authenticated','authenticated','t0191@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'a', 'authenticated','authenticated','a0191@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'v', 'authenticated','authenticated','v0191@test.local','', now(), now());

INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  (:'instF', 'office-0191', 'TLC hiring smoke', 'therapy-practice'); -- 0193: the office resolver answers only from a therapy-practice membership
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  (:'instF', :'o', 'owner',     'Owner O'),
  (:'instF', :'t', 'member',    'Therapist T'),
  (:'instF', :'a', 'assistant', 'Assistant A'),
  (:'instF', :'v', 'viewer',    'Viewer V');

CREATE OR REPLACE FUNCTION pg_temp.as_user(_who uuid, _email text, _sql text)
RETURNS boolean LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role', 'authenticated', 'email', _email)::text, true);
  BEGIN
    EXECUTE _sql;
  EXCEPTION WHEN others THEN
    PERFORM set_config('role', 'postgres', true);
    RETURN false;
  END;
  PERFORM set_config('role', 'postgres', true);
  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION pg_temp.as_anon(_sql text)
RETURNS boolean LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('role', 'anon', true);
  PERFORM set_config('request.jwt.claims', '{"role":"anon"}', true);
  BEGIN
    EXECUTE _sql;
  EXCEPTION WHEN others THEN
    PERFORM set_config('role', 'postgres', true);
    RETURN false;
  END;
  PERFORM set_config('role', 'postgres', true);
  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION pg_temp.count_as(_who uuid, _email text, _sql text)
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE n integer;
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role', 'authenticated', 'email', _email)::text, true);
  EXECUTE _sql INTO n;
  PERFORM set_config('role', 'postgres', true);
  RETURN n;
END $$;

CREATE OR REPLACE FUNCTION pg_temp.json_as(_who uuid, _email text, _sql text)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE j jsonb;
BEGIN
  IF _who IS NULL THEN
    PERFORM set_config('role', 'anon', true);
    PERFORM set_config('request.jwt.claims', '{"role":"anon"}', true);
  ELSE
    PERFORM set_config('role', 'authenticated', true);
    PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role', 'authenticated', 'email', _email)::text, true);
  END IF;
  EXECUTE _sql INTO j;
  PERFORM set_config('role', 'postgres', true);
  RETURN j;
END $$;

DO $$
DECLARE
  o uuid := 'a0000000-0000-4000-a000-000000000191';
  t uuid := 'b0000000-0000-4000-a000-000000000191';
  a uuid := 'c0000000-0000-4000-a000-000000000191';
  v uuid := 'd0000000-0000-4000-a000-000000000191';
  instF uuid := 'f0000000-0000-4000-b000-000000000191';
  ins_job text := 'INSERT INTO tlc_jobs (instance_id, office_id, title, summary, status) VALUES (%L, ''tlc'', ''Telehealth therapist'', ''Part-time caseload, Illinois clients, supervision provided.'', ''draft'')';
  job_id uuid;
  draft_id uuid;
  app_id uuid;
  j jsonb;
  got text;
  got_inv uuid;
  got_inv2 uuid;
  got_ts timestamptz;
  n integer;
BEGIN
  -- ── Jobs ─────────────────────────────────────────────────────────────────
  IF NOT pg_temp.as_user(o, 'o0191@test.local', format(ins_job, instF)) THEN
    RAISE EXCEPTION 'TLC HIRING SMOKE FAIL: the owner could not post a job';
  END IF;
  SELECT id INTO job_id FROM tlc_jobs WHERE instance_id = instF;
  IF NOT pg_temp.as_user(o, 'o0191@test.local', format('UPDATE tlc_jobs SET status = ''open'', posted_at = now() WHERE id = %L', job_id)) THEN
    RAISE EXCEPTION 'TLC HIRING SMOKE FAIL: the owner could not open the job';
  END IF;
  -- a second, draft posting stays private
  INSERT INTO tlc_jobs (instance_id, office_id, title, summary, status) VALUES (instF, 'tlc', 'Intake coordinator', 'Answer inquiries and schedule consults.', 'draft') RETURNING id INTO draft_id;

  n := pg_temp.count_as(t, 't0191@test.local', 'SELECT count(*)::int FROM tlc_jobs');
  IF n <> 2 THEN RAISE EXCEPTION 'TLC HIRING SMOKE FAIL: the therapist sees % postings, expected 2', n; END IF;
  IF pg_temp.as_user(t, 't0191@test.local', format(ins_job, instF)) THEN RAISE EXCEPTION 'TLC HIRING SMOKE FAIL: a member posted a job'; END IF;
  IF pg_temp.as_user(a, 'a0191@test.local', format(ins_job, instF)) THEN RAISE EXCEPTION 'TLC HIRING SMOKE FAIL: the assistant posted a job'; END IF;
  IF pg_temp.as_user(v, 'v0191@test.local', format(ins_job, instF)) THEN RAISE EXCEPTION 'TLC HIRING SMOKE FAIL: a viewer posted a job'; END IF;

  -- ── The door, anonymous ──────────────────────────────────────────────────
  -- The door lists every open posting of office 'tlc' (the live office's own
  -- standing interest card among them since 0195), so this smoke reads only
  -- ITS instance's rows out of the list: the open one present, the draft not.
  j := pg_temp.json_as(NULL, NULL, 'SELECT public.tlc_public_jobs(''tlc'')');
  SELECT coalesce(jsonb_agg(x), '[]'::jsonb) INTO j FROM jsonb_array_elements(j) x WHERE (x->>'id')::uuid IN (job_id, draft_id);
  IF jsonb_array_length(j) <> 1 OR j->0->>'title' <> 'Telehealth therapist' THEN
    RAISE EXCEPTION 'TLC HIRING SMOKE FAIL: anon sees % open postings of this office (%), expected the one open one', jsonb_array_length(j), j;
  END IF;

  j := pg_temp.json_as(NULL, NULL, format('SELECT public.tlc_apply(''tlc'', %L, %L::jsonb)', job_id,
        '{"name":"Jane Doe","email":"Jane@Example.com","statement":"Six years of telehealth work with adults and couples in Illinois.","years_experience":"6","license_type":"LCSW","link":"https://example.com/jane"}'));
  IF j->>'id' IS NULL THEN RAISE EXCEPTION 'TLC HIRING SMOKE FAIL: anon could not apply'; END IF;
  app_id := (j->>'id')::uuid;
  SELECT email INTO got FROM tlc_job_applications WHERE id = app_id;
  IF got <> 'jane@example.com' THEN RAISE EXCEPTION 'TLC HIRING SMOKE FAIL: the email was not lowered (%)', got; END IF;

  IF pg_temp.as_anon(format('SELECT public.tlc_apply(''tlc'', %L, %L::jsonb)', job_id, '{"name":"Jane Doe","email":"jane@example.com","statement":"Applying twice to the same open position should be refused."}')) THEN
    RAISE EXCEPTION 'TLC HIRING SMOKE FAIL: a second application to the same job went through';
  END IF;
  IF pg_temp.as_anon(format('SELECT public.tlc_apply(''tlc'', %L, %L::jsonb)', draft_id, '{"name":"Jane Doe","email":"jane2@example.com","statement":"A draft posting must not accept an application at all."}')) THEN
    RAISE EXCEPTION 'TLC HIRING SMOKE FAIL: an application to a draft job went through';
  END IF;
  IF pg_temp.as_anon(format('INSERT INTO tlc_job_applications (instance_id, job_id, name, email, statement) VALUES (%L, %L, ''X Y'', ''x@y.io'', ''direct insert must be denied by RLS'')', instF, job_id)) THEN
    RAISE EXCEPTION 'TLC HIRING SMOKE FAIL: anon inserted an application directly';
  END IF;

  -- ── Who reads applications ───────────────────────────────────────────────
  n := pg_temp.count_as(t, 't0191@test.local', 'SELECT count(*)::int FROM tlc_job_applications');
  IF n <> 0 THEN RAISE EXCEPTION 'TLC HIRING SMOKE FAIL: a member sees % applications, expected 0', n; END IF;
  n := pg_temp.count_as(a, 'a0191@test.local', 'SELECT count(*)::int FROM tlc_job_applications');
  IF n <> 0 THEN RAISE EXCEPTION 'TLC HIRING SMOKE FAIL: the assistant sees % applications, expected 0', n; END IF;
  n := pg_temp.count_as(v, 'v0191@test.local', 'SELECT count(*)::int FROM tlc_job_applications');
  IF n <> 0 THEN RAISE EXCEPTION 'TLC HIRING SMOKE FAIL: a viewer sees % applications, expected 0', n; END IF;
  n := pg_temp.count_as(o, 'o0191@test.local', 'SELECT count(*)::int FROM tlc_job_applications');
  IF n <> 1 THEN RAISE EXCEPTION 'TLC HIRING SMOKE FAIL: the owner sees % applications, expected 1', n; END IF;

  -- ── Review, the guard, hire ──────────────────────────────────────────────
  IF NOT pg_temp.as_user(o, 'o0191@test.local', format('UPDATE tlc_job_applications SET status = ''offered'', email = ''hijack@example.com'' WHERE id = %L', app_id)) THEN
    RAISE EXCEPTION 'TLC HIRING SMOKE FAIL: the owner could not move the application';
  END IF;
  SELECT status || '|' || email INTO got FROM tlc_job_applications WHERE id = app_id;
  IF got <> 'offered|jane@example.com' THEN RAISE EXCEPTION 'TLC HIRING SMOKE FAIL: the guard let the email change (%)', got; END IF;

  IF pg_temp.as_user(t, 't0191@test.local', format('SELECT public.tlc_application_hire(%L)', app_id)) THEN
    RAISE EXCEPTION 'TLC HIRING SMOKE FAIL: a member hired';
  END IF;
  j := pg_temp.json_as(o, 'o0191@test.local', format('SELECT public.tlc_application_hire(%L)', app_id));
  IF (j->>'already')::boolean OR j->>'token' IS NULL THEN RAISE EXCEPTION 'TLC HIRING SMOKE FAIL: hire returned % ', j; END IF;
  SELECT status, invite_id INTO got, got_inv FROM tlc_job_applications WHERE id = app_id;
  IF got <> 'hired' OR got_inv IS NULL THEN RAISE EXCEPTION 'TLC HIRING SMOKE FAIL: hire did not land (% / %)', got, got_inv; END IF;
  SELECT email INTO got FROM tlc_onboarding_invites WHERE id = got_inv;
  IF got <> 'jane@example.com' THEN RAISE EXCEPTION 'TLC HIRING SMOKE FAIL: the invite is for % not the applicant', got; END IF;
  j := pg_temp.json_as(o, 'o0191@test.local', format('SELECT public.tlc_application_hire(%L)', app_id));
  got_inv2 := (j->>'invite_id')::uuid;
  IF NOT (j->>'already')::boolean OR got_inv2 IS DISTINCT FROM got_inv THEN RAISE EXCEPTION 'TLC HIRING SMOKE FAIL: hiring twice minted again (%)', j; END IF;

  -- ── The telehealth hand-off is stamped ───────────────────────────────────
  IF NOT pg_temp.as_user(o, 'o0191@test.local', format('UPDATE tlc_job_applications SET telehealth_status = ''invited'' WHERE id = %L', app_id)) THEN
    RAISE EXCEPTION 'TLC HIRING SMOKE FAIL: the owner could not mark the hand-off';
  END IF;
  SELECT telehealth_at INTO got_ts FROM tlc_job_applications WHERE id = app_id AND telehealth_by = o;
  IF got_ts IS NULL THEN RAISE EXCEPTION 'TLC HIRING SMOKE FAIL: the hand-off was not stamped'; END IF;

  RAISE NOTICE 'TLC HIRING SMOKE: PASS';
END $$;

ROLLBACK;
