-- =============================================================================
-- 0305 DEVELOPMENT SMOKE — a building is counted before it is built (0305,
-- DR-1162). Runs in a transaction and ROLLS BACK.
-- PASS prints 'DEVELOPMENT SMOKE: PASS'; any wrong grant RAISES.
--
-- Scenario: landlord instance F — owner O, admin D, member M, VIEWER C (the rule is an allow-list of owner, admin and member, so a viewer stands for every other role: child, assistant, viewer).
-- Instance X — owner Z, with a project of its own.
--
-- Assertions
--   O creates a project and every kind of record under it               ✔
--   D (admin) writes a budget line                                       ✔
--   M (member) reads the project and its lines                           ✔
--   M (member) writes a line                                  -> REFUSED ✘
--   C (viewer) reads nothing                                             ✔
--   Z (another instance) reads nothing and writes nothing     -> REFUSED ✘
--   O files a line under X's project from F                   -> REFUSED ✘
--   a passed check with no date                               -> REFUSED ✘
--   an approved change order with no decision date            -> REFUSED ✘
--   a change order of zero, a kind that does not exist        -> REFUSED ✘
--   a blank budget amount is stored as NULL, not 0                       ✔
--   deleting the project takes its records with it                       ✔
-- =============================================================================
BEGIN;

\set o 'a0000000-0000-4000-a000-000000000305'
\set d 'b0000000-0000-4000-a000-000000000305'
\set m 'c0000000-0000-4000-a000-000000000305'
\set c 'd0000000-0000-4000-a000-000000000305'
\set z 'e0000000-0000-4000-a000-000000000305'
\set instF '10000000-0000-4000-b000-000000000305'
\set instX '20000000-0000-4000-b000-000000000305'
\set projF '30000000-0000-4000-c000-000000000305'
\set projX '31000000-0000-4000-c000-000000000305'

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', :'o', 'authenticated','authenticated','o0305@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'d', 'authenticated','authenticated','d0305@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'m', 'authenticated','authenticated','m0305@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'c', 'authenticated','authenticated','c0305@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'z', 'authenticated','authenticated','z0305@test.local','', now(), now());

INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  (:'instF', 'land-0305', 'The 0305 landlord', 'family'),
  (:'instX', 'land-0305-x', 'Another landlord', 'family');
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  (:'instF', :'o', 'owner',  'Owner O'),
  (:'instF', :'d', 'admin',  'Admin D'),
  (:'instF', :'m', 'member', 'Member M'),
  (:'instF', :'c', 'viewer', 'Viewer C'),
  (:'instX', :'z', 'owner',  'Owner Z');

INSERT INTO public.dev_projects (id, instance_id, created_by, name, kind)
VALUES (:'projX', :'instX', :'z', 'Their building', 'duplex');

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

CREATE OR REPLACE FUNCTION pg_temp.count_as(_who uuid, _email text, _sql text)
RETURNS int LANGUAGE plpgsql AS $$
DECLARE n int;
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role', 'authenticated', 'email', _email)::text, true);
  EXECUTE _sql INTO n;
  PERFORM set_config('role', 'postgres', true);
  RETURN n;
END $$;

DO $$
DECLARE
  o uuid := 'a0000000-0000-4000-a000-000000000305';
  d uuid := 'b0000000-0000-4000-a000-000000000305';
  m uuid := 'c0000000-0000-4000-a000-000000000305';
  c uuid := 'd0000000-0000-4000-a000-000000000305';
  z uuid := 'e0000000-0000-4000-a000-000000000305';
  instF uuid := '10000000-0000-4000-b000-000000000305';
  instX uuid := '20000000-0000-4000-b000-000000000305';
  projF uuid := '30000000-0000-4000-c000-000000000305';
  projX uuid := '31000000-0000-4000-c000-000000000305';
  n int;
BEGIN
  -- ═══ THE OWNER BUILDS THE RECORD ═════════════════════════════════════════
  IF NOT pg_temp.as_user(o, 'o0305@test.local', format(
    'INSERT INTO public.dev_projects (id, instance_id, created_by, name, kind, units, gross_sq_ft, residential_cap_bp, commercial_cap_bp)
     VALUES (%L, %L, %L, ''Richmond mixed use'', ''mixed-use'', 40, 45000, 550, 600)', projF, instF, o)) THEN
    RAISE EXCEPTION 'DEVELOPMENT SMOKE FAIL: the owner could not start a project';
  END IF;
  IF NOT pg_temp.as_user(o, 'o0305@test.local', format(
    'INSERT INTO public.dev_budget_lines (project_id, instance_id, kind, label, budget_cents) VALUES
       (%1$L, %2$L, ''land'', ''Land'', 127000000),
       (%1$L, %2$L, ''ti'', ''Tenant improvement allowance'', 52000000),
       (%1$L, %2$L, ''contingency'', ''Owner contingency'', 50000000),
       (%1$L, %2$L, ''hard'', ''Masonry'', NULL)', projF, instF)) THEN
    RAISE EXCEPTION 'DEVELOPMENT SMOKE FAIL: the owner could not write budget lines';
  END IF;
  IF NOT pg_temp.as_user(o, 'o0305@test.local', format(
    'INSERT INTO public.dev_change_orders (project_id, instance_id, created_by, label, amount_cents, source, status, decided_on)
     VALUES (%L, %L, %L, ''Drawing revisions'', 6000000, ''contingency'', ''approved'', ''2025-03-01'')', projF, instF, o)) THEN
    RAISE EXCEPTION 'DEVELOPMENT SMOKE FAIL: the owner could not record an approved change order';
  END IF;
  IF NOT pg_temp.as_user(o, 'o0305@test.local', format(
    'INSERT INTO public.dev_bays (project_id, instance_id, name, sq_ft, ti_cents) VALUES (%L, %L, ''Bay A'', 3000, 19500000)', projF, instF)) THEN
    RAISE EXCEPTION 'DEVELOPMENT SMOKE FAIL: the owner could not record a commercial bay';
  END IF;
  IF NOT pg_temp.as_user(o, 'o0305@test.local', format(
    'INSERT INTO public.dev_checks (project_id, instance_id, phase_key, check_key, state, checked_on, signed_by)
     VALUES (%L, %L, ''foundation'', ''concrete-strength'', ''passed'', ''2024-03-12'', ''Third-party lab'')', projF, instF)) THEN
    RAISE EXCEPTION 'DEVELOPMENT SMOKE FAIL: the owner could not record a passed check';
  END IF;
  IF NOT pg_temp.as_user(o, 'o0305@test.local', format(
    'INSERT INTO public.dev_capital (project_id, instance_id, kind, name, amount_cents, rate_bp, share_bp)
     VALUES (%L, %L, ''investor'', ''Investor A'', 200000000, 800, 5000)', projF, instF)) THEN
    RAISE EXCEPTION 'DEVELOPMENT SMOKE FAIL: the owner could not record an investor';
  END IF;
  IF NOT pg_temp.as_user(d, 'd0305@test.local', format(
    'INSERT INTO public.dev_budget_lines (project_id, instance_id, kind, label, budget_cents) VALUES (%L, %L, ''soft'', ''Permits'', 2100000)', projF, instF)) THEN
    RAISE EXCEPTION 'DEVELOPMENT SMOKE FAIL: an admin could not write a budget line';
  END IF;

  -- A blank amount is NULL, never 0.
  SELECT count(*)::int INTO n FROM public.dev_budget_lines WHERE project_id = projF AND label = 'Masonry' AND budget_cents IS NULL;
  IF n <> 1 THEN RAISE EXCEPTION 'DEVELOPMENT SMOKE FAIL: a blank amount was not kept blank'; END IF;

  -- ═══ WHO READS ═══════════════════════════════════════════════════════════
  n := pg_temp.count_as(m, 'm0305@test.local', format('SELECT count(*)::int FROM public.dev_budget_lines WHERE project_id = %L', projF));
  IF n <> 5 THEN RAISE EXCEPTION 'DEVELOPMENT SMOKE FAIL: a member should read the 5 lines, read %', n; END IF;
  n := pg_temp.count_as(c, 'c0305@test.local', 'SELECT count(*)::int FROM public.dev_projects');
  IF n <> 0 THEN RAISE EXCEPTION 'DEVELOPMENT SMOKE FAIL: a viewer read % projects', n; END IF;
  n := pg_temp.count_as(c, 'c0305@test.local', 'SELECT count(*)::int FROM public.dev_capital');
  IF n <> 0 THEN RAISE EXCEPTION 'DEVELOPMENT SMOKE FAIL: a viewer read the investors'; END IF;
  n := pg_temp.count_as(z, 'z0305@test.local', format('SELECT count(*)::int FROM public.dev_projects WHERE instance_id = %L', instF));
  IF n <> 0 THEN RAISE EXCEPTION 'DEVELOPMENT SMOKE FAIL: another instance read F''s project'; END IF;
  n := pg_temp.count_as(z, 'z0305@test.local', format('SELECT count(*)::int FROM public.dev_change_orders WHERE instance_id = %L', instF));
  IF n <> 0 THEN RAISE EXCEPTION 'DEVELOPMENT SMOKE FAIL: another instance read F''s change orders'; END IF;

  -- ═══ WHO MAY NOT WRITE ═══════════════════════════════════════════════════
  IF pg_temp.as_user(m, 'm0305@test.local', format(
    'INSERT INTO public.dev_budget_lines (project_id, instance_id, kind, label, budget_cents) VALUES (%L, %L, ''hard'', ''Steel'', 100)', projF, instF)) THEN
    RAISE EXCEPTION 'DEVELOPMENT SMOKE FAIL: a member wrote a budget line';
  END IF;
  IF pg_temp.as_user(c, 'c0305@test.local', format(
    'INSERT INTO public.dev_projects (instance_id, created_by, name) VALUES (%L, %L, ''A child''''s build'')', instF, c)) THEN
    RAISE EXCEPTION 'DEVELOPMENT SMOKE FAIL: a viewer started a project';
  END IF;
  IF pg_temp.as_user(z, 'z0305@test.local', format(
    'INSERT INTO public.dev_budget_lines (project_id, instance_id, kind, label, budget_cents) VALUES (%L, %L, ''hard'', ''Theirs'', 100)', projF, instF)) THEN
    RAISE EXCEPTION 'DEVELOPMENT SMOKE FAIL: another instance wrote into F''s project';
  END IF;
  -- O cannot file a line under X's project by naming F's instance on it.
  IF pg_temp.as_user(o, 'o0305@test.local', format(
    'INSERT INTO public.dev_budget_lines (project_id, instance_id, kind, label, budget_cents) VALUES (%L, %L, ''hard'', ''Misfiled'', 100)', projX, instF)) THEN
    RAISE EXCEPTION 'DEVELOPMENT SMOKE FAIL: a line was filed under another instance''s project';
  END IF;
  IF pg_temp.as_user(z, 'z0305@test.local', format('UPDATE public.dev_projects SET name = ''Taken'' WHERE id = %L', projF)) THEN
    SELECT count(*)::int INTO n FROM public.dev_projects WHERE id = projF AND name = 'Taken';
    IF n <> 0 THEN RAISE EXCEPTION 'DEVELOPMENT SMOKE FAIL: another instance renamed F''s project'; END IF;
  END IF;

  -- ═══ WHAT THE RECORD REFUSES ═════════════════════════════════════════════
  IF pg_temp.as_user(o, 'o0305@test.local', format(
    'INSERT INTO public.dev_checks (project_id, instance_id, phase_key, check_key, state) VALUES (%L, %L, ''mep'', ''hvac'', ''passed'')', projF, instF)) THEN
    RAISE EXCEPTION 'DEVELOPMENT SMOKE FAIL: a check passed with no date';
  END IF;
  IF pg_temp.as_user(o, 'o0305@test.local', format(
    'INSERT INTO public.dev_change_orders (project_id, instance_id, created_by, label, amount_cents, status) VALUES (%L, %L, %L, ''Undated'', 100, ''approved'')', projF, instF, o)) THEN
    RAISE EXCEPTION 'DEVELOPMENT SMOKE FAIL: a change order was approved with no decision date';
  END IF;
  IF pg_temp.as_user(o, 'o0305@test.local', format(
    'INSERT INTO public.dev_change_orders (project_id, instance_id, created_by, label, amount_cents) VALUES (%L, %L, %L, ''Nothing'', 0)', projF, instF, o)) THEN
    RAISE EXCEPTION 'DEVELOPMENT SMOKE FAIL: a change order of zero was kept';
  END IF;
  IF pg_temp.as_user(o, 'o0305@test.local', format(
    'INSERT INTO public.dev_budget_lines (project_id, instance_id, kind, label) VALUES (%L, %L, ''magic'', ''Nothing'')', projF, instF)) THEN
    RAISE EXCEPTION 'DEVELOPMENT SMOKE FAIL: a budget line of a kind that does not exist was kept';
  END IF;

  -- ═══ THE PROJECT TAKES ITS RECORDS WITH IT ═══════════════════════════════
  IF NOT pg_temp.as_user(o, 'o0305@test.local', format('DELETE FROM public.dev_projects WHERE id = %L', projF)) THEN
    RAISE EXCEPTION 'DEVELOPMENT SMOKE FAIL: the owner could not delete the project';
  END IF;
  SELECT count(*)::int INTO n FROM public.dev_budget_lines WHERE project_id = projF;
  IF n <> 0 THEN RAISE EXCEPTION 'DEVELOPMENT SMOKE FAIL: the lines outlived their project'; END IF;
  SELECT count(*)::int INTO n FROM public.dev_projects WHERE id = projX;
  IF n <> 1 THEN RAISE EXCEPTION 'DEVELOPMENT SMOKE FAIL: the other instance''s project was touched'; END IF;

  RAISE NOTICE 'DEVELOPMENT SMOKE: PASS';
END $$;

SELECT 'DEVELOPMENT SMOKE: PASS' AS result;

ROLLBACK;
