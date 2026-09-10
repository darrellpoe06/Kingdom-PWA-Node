-- =============================================================================
-- 0195 TLC INTEREST-AND-VIEWS SMOKE — the interest card, roles of interest,
-- the honeypot, who looks at what, the hiring report (0195, DR-0350 amended).
-- Run on the LIVE Supabase (as postgres) AFTER 0187..0195. Runs in a
-- transaction and ROLLS BACK. PASS prints 'TLC INTEREST SMOKE: PASS'; any
-- wrong grant RAISES.
--
-- Scenario: practice instance P — owner O, therapist T (member); an open
-- posting J, the open interest card I, a draft D; anonymous visitors.
--
-- Assertions:
--   anon lists the open jobs                        -> 2, each with a kind, J before I ✔
--   anon views J three times, I once, D once         -> J 3, I 1, D not counted ✔
--   T (member) reads the view rows                   -> 2 ✔
--   anon reads / inserts tlc_job_views directly       -> DENIED / DENIED ✘
--   anon applies to J with the hidden field filled    -> REFUSED, no row ✘
--   anon applies to J with it empty                   -> received ✔
--   anon applies to I with no roles                   -> REFUSED ✘
--   anon applies to I with 13 roles                   -> REFUSED ✘
--   anon applies to I with roles (one repeated)       -> received, stored deduplicated and sorted ✔
--   O changes the roles by UPDATE                     -> IGNORED (guard) ✔
--   T reads the hiring report                         -> REFUSED ✘
--   O reads the hiring report                         -> 3 jobs, J views 3 + 1 application, I 1 application, roles counted ✔
--   LIVE: the office instance carries exactly one open interest card ✔
-- =============================================================================
BEGIN;

\set o 'a0000000-0000-4000-a000-000000000195'
\set t 'b0000000-0000-4000-a000-000000000195'
\set instP 'f0000000-0000-4000-b000-000000000195'

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', :'o', 'authenticated','authenticated','o0195@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'t', 'authenticated','authenticated','t0195@test.local','', now(), now());

INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  (:'instP', 'prac-0195', 'TLC interest smoke', 'therapy-practice');
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  (:'instP', :'o', 'owner',  'Owner O'),
  (:'instP', :'t', 'member', 'Therapist T');

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
  IF _who IS NULL THEN
    PERFORM set_config('role', 'anon', true);
    PERFORM set_config('request.jwt.claims', '{"role":"anon"}', true);
  ELSE
    PERFORM set_config('role', 'authenticated', true);
    PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role', 'authenticated', 'email', _email)::text, true);
  END IF;
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
  o uuid := 'a0000000-0000-4000-a000-000000000195';
  t uuid := 'b0000000-0000-4000-a000-000000000195';
  instP uuid := 'f0000000-0000-4000-b000-000000000195';
  jJ uuid; jI uuid; jD uuid;
  j jsonb;
  n integer;
  app_id uuid;
  got jsonb;
  live_id uuid;
BEGIN
  INSERT INTO tlc_jobs (instance_id, office_id, kind, title, summary, status, posted_at)
  VALUES (instP, 'tlc', 'posting', 'Telehealth therapist', 'Part-time caseload, Illinois clients.', 'open', now()) RETURNING id INTO jJ;
  INSERT INTO tlc_jobs (instance_id, office_id, kind, title, summary, status, posted_at)
  VALUES (instP, 'tlc', 'interest', 'Tell us which roles interest you', 'Say which roles fit you and a few sentences about yourself.', 'open', now() - interval '1 day') RETURNING id INTO jI;
  INSERT INTO tlc_jobs (instance_id, office_id, kind, title, summary, status)
  VALUES (instP, 'tlc', 'posting', 'Intake coordinator', 'Answer inquiries and schedule consults.', 'draft') RETURNING id INTO jD;

  -- ── The door's list ──────────────────────────────────────────────────────
  j := pg_temp.json_as(NULL, NULL, 'SELECT public.tlc_public_jobs(''tlc'')');
  SELECT jsonb_agg(x) INTO j FROM jsonb_array_elements(j) x WHERE (x->>'id')::uuid IN (jJ, jI);
  IF jsonb_array_length(j) <> 2 THEN RAISE EXCEPTION 'TLC INTEREST SMOKE FAIL: anon sees % open jobs of P, expected 2', jsonb_array_length(j); END IF;
  IF j->0->>'kind' <> 'posting' OR j->1->>'kind' <> 'interest' THEN
    RAISE EXCEPTION 'TLC INTEREST SMOKE FAIL: the posting must list before the interest card, each with a kind: %', j;
  END IF;

  -- ── Who looks at what ────────────────────────────────────────────────────
  PERFORM pg_temp.json_as(NULL, NULL, format('SELECT public.tlc_job_viewed(''tlc'', %L)', jJ));
  PERFORM pg_temp.json_as(NULL, NULL, format('SELECT public.tlc_job_viewed(''tlc'', %L)', jJ));
  PERFORM pg_temp.json_as(NULL, NULL, format('SELECT public.tlc_job_viewed(''tlc'', %L)', jJ));
  PERFORM pg_temp.json_as(NULL, NULL, format('SELECT public.tlc_job_viewed(''tlc'', %L)', jI));
  j := pg_temp.json_as(NULL, NULL, format('SELECT public.tlc_job_viewed(''tlc'', %L)', jD));
  IF (j->>'counted')::boolean THEN RAISE EXCEPTION 'TLC INTEREST SMOKE FAIL: a draft posting counted a view'; END IF;
  SELECT views INTO n FROM tlc_job_views WHERE job_id = jJ AND day = current_date;
  IF n <> 3 THEN RAISE EXCEPTION 'TLC INTEREST SMOKE FAIL: J has % views, expected 3', n; END IF;
  SELECT views INTO n FROM tlc_job_views WHERE job_id = jI AND day = current_date;
  IF n <> 1 THEN RAISE EXCEPTION 'TLC INTEREST SMOKE FAIL: I has % views, expected 1', n; END IF;
  n := pg_temp.count_as(t, 't0195@test.local', format('SELECT count(*)::int FROM tlc_job_views WHERE instance_id = %L', instP));
  IF n <> 2 THEN RAISE EXCEPTION 'TLC INTEREST SMOKE FAIL: the therapist reads % view rows, expected 2', n; END IF;
  -- anon has no SELECT grant on the counts at all (0195 grants authenticated
  -- only), so the read is refused outright -- stronger than an empty answer.
  -- rls-isolation run 136 read this as "permission denied" when the smoke
  -- expected 0 rows; the wall is right, the assertion now says so.
  IF pg_temp.as_anon(format('SELECT count(*) FROM tlc_job_views WHERE instance_id = %L', instP)) THEN
    RAISE EXCEPTION 'TLC INTEREST SMOKE FAIL: anon could read the view counts (no grant should exist)';
  END IF;
  IF pg_temp.as_anon(format('INSERT INTO tlc_job_views (instance_id, job_id, day, views) VALUES (%L, %L, current_date - 1, 999)', instP, jJ)) THEN
    RAISE EXCEPTION 'TLC INTEREST SMOKE FAIL: anon wrote a view row directly';
  END IF;

  -- ── The honeypot ─────────────────────────────────────────────────────────
  IF pg_temp.as_anon(format('SELECT public.tlc_apply(''tlc'', %L, %L::jsonb)', jJ,
       '{"name":"Robo Script","email":"robo@example.com","statement":"A script fills every field it finds, including the one nobody sees.","website":"http://spam.example"}')) THEN
    RAISE EXCEPTION 'TLC INTEREST SMOKE FAIL: an application with the hidden field filled was accepted';
  END IF;
  SELECT count(*)::int INTO n FROM tlc_job_applications WHERE job_id = jJ;
  IF n <> 0 THEN RAISE EXCEPTION 'TLC INTEREST SMOKE FAIL: the refused application wrote a row'; END IF;
  IF NOT pg_temp.as_anon(format('SELECT public.tlc_apply(''tlc'', %L, %L::jsonb)', jJ,
       '{"name":"Jane Doe","email":"jane@example.com","statement":"A person leaves the field she never sees empty.","website":""}')) THEN
    RAISE EXCEPTION 'TLC INTEREST SMOKE FAIL: a real application was refused';
  END IF;

  -- ── Roles of interest ────────────────────────────────────────────────────
  IF pg_temp.as_anon(format('SELECT public.tlc_apply(''tlc'', %L, %L::jsonb)', jI,
       '{"name":"Sam Seeker","email":"sam@example.com","statement":"I would love to be part of the team in whatever role fits."}')) THEN
    RAISE EXCEPTION 'TLC INTEREST SMOKE FAIL: an interest note with no role was accepted';
  END IF;
  IF pg_temp.as_anon(format('SELECT public.tlc_apply(''tlc'', %L, %L::jsonb)', jI,
       '{"name":"Sam Seeker","email":"sam@example.com","statement":"I would love to be part of the team in whatever role fits.","interest_roles":["r1","r2","r3","r4","r5","r6","r7","r8","r9","r10","r11","r12","r13"]}')) THEN
    RAISE EXCEPTION 'TLC INTEREST SMOKE FAIL: thirteen roles were accepted';
  END IF;
  j := pg_temp.json_as(NULL, NULL, format('SELECT public.tlc_apply(''tlc'', %L, %L::jsonb)', jI,
       '{"name":"Sam Seeker","email":"sam@example.com","statement":"I would love to be part of the team in whatever role fits.","interest_roles":["therapist","aispecialist","therapist"," "]}'));
  app_id := (j->>'id')::uuid;
  IF app_id IS NULL OR j->>'kind' <> 'interest' THEN RAISE EXCEPTION 'TLC INTEREST SMOKE FAIL: the interest note did not land: %', j; END IF;
  SELECT interest_roles INTO got FROM tlc_job_applications WHERE id = app_id;
  IF got <> '["aispecialist","therapist"]'::jsonb THEN RAISE EXCEPTION 'TLC INTEREST SMOKE FAIL: roles stored as %, expected deduplicated and sorted', got; END IF;
  PERFORM pg_temp.as_user(o, 'o0195@test.local', format('UPDATE tlc_job_applications SET interest_roles = ''["owner"]''::jsonb, status = ''reviewing'' WHERE id = %L', app_id));
  SELECT interest_roles INTO got FROM tlc_job_applications WHERE id = app_id;
  IF got <> '["aispecialist","therapist"]'::jsonb THEN RAISE EXCEPTION 'TLC INTEREST SMOKE FAIL: the guard let the roles change: %', got; END IF;

  -- ── The hiring report ────────────────────────────────────────────────────
  IF pg_temp.as_user(t, 't0195@test.local', 'SELECT public.tlc_hiring_report()') THEN
    RAISE EXCEPTION 'TLC INTEREST SMOKE FAIL: a member read the hiring report';
  END IF;
  j := pg_temp.json_as(o, 'o0195@test.local', 'SELECT public.tlc_hiring_report()');
  IF jsonb_array_length(j->'jobs') <> 3 THEN RAISE EXCEPTION 'TLC INTEREST SMOKE FAIL: the report lists % jobs, expected 3', jsonb_array_length(j->'jobs'); END IF;
  SELECT x INTO got FROM jsonb_array_elements(j->'jobs') x WHERE (x->>'id')::uuid = jJ;
  IF (got->>'views_total')::int <> 3 OR (got->>'views_7d')::int <> 3 OR (got->>'applications_total')::int <> 1 OR (got->'applications'->>'new')::int <> 1 THEN
    RAISE EXCEPTION 'TLC INTEREST SMOKE FAIL: J reports %', got;
  END IF;
  SELECT x INTO got FROM jsonb_array_elements(j->'jobs') x WHERE (x->>'id')::uuid = jI;
  IF (got->>'views_total')::int <> 1 OR (got->>'applications_total')::int <> 1 OR (got->'applications'->>'reviewing')::int <> 1 THEN
    RAISE EXCEPTION 'TLC INTEREST SMOKE FAIL: I reports %', got;
  END IF;
  IF NOT (j->'roles' @> '[{"role":"therapist","interested":1},{"role":"aispecialist","interested":1}]'::jsonb) THEN
    RAISE EXCEPTION 'TLC INTEREST SMOKE FAIL: the roles of interest are not counted: %', j->'roles';
  END IF;

  -- ── LIVE: the office instance carries its standing interest card ─────────
  SELECT id INTO live_id FROM instances WHERE slug = 'tlc-therapy-solutions';
  SELECT count(*)::int INTO n FROM tlc_jobs WHERE instance_id = live_id AND kind = 'interest';
  IF n <> 1 THEN RAISE EXCEPTION 'TLC INTEREST SMOKE FAIL: the live office has % interest cards, expected 1', n; END IF;

  RAISE NOTICE 'TLC INTEREST SMOKE: PASS';
END $$;

SELECT 'TLC INTEREST SMOKE: PASS' AS result;

ROLLBACK;
