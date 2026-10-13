-- =============================================================================
-- 0130 ASSISTANT-SCOPE SMOKE — the enablement gate for grantable assistant
-- rights (DR-0271). Run on the LIVE Supabase (as postgres) AFTER 0130.
-- Runs in a transaction and ROLLS BACK. PASS prints
-- 'ASSISTANT SCOPE SMOKE: PASS'; any wrong grant RAISES.
--
-- Scenario: family instance F — owner O, member M, assistant A, viewer V.
--
-- Assertions (Christina 2026-08-04: "everything in the Assistant tab",
-- nothing on the other tabs):
--   A INSERT + SELECT office_records (own instance)     -> allowed        ✔
--   M SELECT sees A's office row (shared workspace)     -> allowed        ✔
--   V INSERT office_records                             -> DENIED         ✘
--   A INSERT entities (the books)                       -> DENIED (0100)  ✘
--   A SELECT entities                                   -> 0 rows         ✘
--   A SELECT inquiries (membership-gated family data)   -> 0 rows         ✘
--   A INSERT inquiries                                  -> DENIED         ✘
--   M SELECT inquiries (no regression for members)      -> >= 1 row       ✔
--   my_default_instance_role() as A                     -> 'assistant'    ✔
--   O invites role 'assistant' (explicit target)        -> row, role kept ✔
--   A invites anyone                                    -> RAISES         ✘
--   O set_member_role(V -> assistant)                   -> changed        ✔
--   O remove_instance_member(V)                         -> removed        ✔
--   A removes anyone / O removes self                   -> RAISES         ✘
-- =============================================================================
BEGIN;

\set o 'a0000000-0000-4000-a000-000000000130'
\set m 'b0000000-0000-4000-a000-000000000130'
\set a 'c0000000-0000-4000-a000-000000000130'
\set v 'd0000000-0000-4000-a000-000000000130'
\set instF 'f0000000-0000-4000-b000-000000000130'

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', :'o', 'authenticated','authenticated','o0130@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'m', 'authenticated','authenticated','m0130@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'a', 'authenticated','authenticated','a0130@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'v', 'authenticated','authenticated','v0130@test.local','', now(), now());

INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  (:'instF', 'fam-0130', 'Assistant scope smoke family', 'family');
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  (:'instF', :'o', 'owner',     'Owner O'),
  (:'instF', :'m', 'member',    'Member M'),
  (:'instF', :'a', 'assistant', 'Assistant A'),
  (:'instF', :'v', 'viewer',    'Viewer V');

-- ── Helpers: run a statement AS a user; report success/denial or a count ─────
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

CREATE OR REPLACE FUNCTION pg_temp.as_user_count(_who uuid, _sql text)
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE n integer;
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role', 'authenticated')::text, true);
  EXECUTE _sql INTO n;
  PERFORM set_config('role', 'postgres', true);
  RETURN n;
END $$;

DO $$
DECLARE
  o uuid := 'a0000000-0000-4000-a000-000000000130';
  m uuid := 'b0000000-0000-4000-a000-000000000130';
  a uuid := 'c0000000-0000-4000-a000-000000000130';
  v uuid := 'd0000000-0000-4000-a000-000000000130';
  instF uuid := 'f0000000-0000-4000-b000-000000000130';
  invited jsonb;
  got_role text;
  res jsonb;
  n int;
BEGIN
  -- The assistant WORKS the office workspace: insert + read back.
  IF NOT pg_temp.as_user(a, format(
      'INSERT INTO office_records (instance_id, created_by, office_id, kind, slug, payload) VALUES (%L, %L, ''tlc'', ''org'', ''smoke-org-1'', ''{"organization":"Smoke Org"}'')',
      instF, a)) THEN
    RAISE EXCEPTION 'ASSISTANT SCOPE SMOKE FAIL: the assistant could not write the office workspace';
  END IF;
  n := pg_temp.as_user_count(a, format('SELECT count(*) FROM office_records WHERE instance_id = %L', instF));
  IF n < 1 THEN
    RAISE EXCEPTION 'ASSISTANT SCOPE SMOKE FAIL: the assistant cannot read the office workspace';
  END IF;

  -- Christina's side of the same workspace: a member/owner SEES the
  -- assistant's row (the shared-workspace guarantee, both directions).
  n := pg_temp.as_user_count(m, format('SELECT count(*) FROM office_records WHERE instance_id = %L', instF));
  IF n < 1 THEN
    RAISE EXCEPTION 'ASSISTANT SCOPE SMOKE FAIL: a member does not see the shared office workspace';
  END IF;

  -- A viewer cannot write the workspace (read set excludes viewer too).
  IF pg_temp.as_user(v, format(
      'INSERT INTO office_records (instance_id, created_by, office_id, kind, slug, payload) VALUES (%L, %L, ''tlc'', ''org'', ''smoke-org-v'', ''{}'')',
      instF, v)) THEN
    RAISE EXCEPTION 'ASSISTANT SCOPE SMOKE FAIL: a viewer wrote the office workspace';
  END IF;

  -- The books stay walled (0100 + the overlay): no write, no read.
  IF pg_temp.as_user(a, format(
      'INSERT INTO entities (instance_id, created_by, slug, display_name, entity_type) VALUES (%L, %L, ''smoke-0130'', ''Smoke'', ''business'')',
      instF, a)) THEN
    RAISE EXCEPTION 'ASSISTANT SCOPE SMOKE FAIL: the assistant wrote the books';
  END IF;
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', o, 'role', 'authenticated')::text, true);
  INSERT INTO entities (instance_id, created_by, slug, display_name, entity_type)
    VALUES (instF, o, 'smoke-0130-owner', 'Owner Smoke', 'business');
  PERFORM set_config('role', 'postgres', true);
  n := pg_temp.as_user_count(a, format('SELECT count(*) FROM entities WHERE instance_id = %L', instF));
  IF n <> 0 THEN
    RAISE EXCEPTION 'ASSISTANT SCOPE SMOKE FAIL: the assistant read % books row(s)', n;
  END IF;

  -- Membership-gated family data (inquiries rode user_in_instance — the exact
  -- gap the overlay closes): the assistant sees NOTHING and writes NOTHING;
  -- a member still sees it (narrowing only, and only for 'assistant').
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', m, 'role', 'authenticated')::text, true);
  INSERT INTO inquiries (instance_id, created_by, first_name) VALUES (instF, m, 'Smoke');
  PERFORM set_config('role', 'postgres', true);
  n := pg_temp.as_user_count(a, format('SELECT count(*) FROM inquiries WHERE instance_id = %L', instF));
  IF n <> 0 THEN
    RAISE EXCEPTION 'ASSISTANT SCOPE SMOKE FAIL: the assistant read % inquiry row(s) — the other tabs leaked', n;
  END IF;
  IF pg_temp.as_user(a, format(
      'INSERT INTO inquiries (instance_id, created_by, first_name) VALUES (%L, %L, ''Leak'')',
      instF, a)) THEN
    RAISE EXCEPTION 'ASSISTANT SCOPE SMOKE FAIL: the assistant wrote an inquiry';
  END IF;
  n := pg_temp.as_user_count(m, format('SELECT count(*) FROM inquiries WHERE instance_id = %L', instF));
  IF n < 1 THEN
    RAISE EXCEPTION 'ASSISTANT SCOPE SMOKE FAIL: the overlay regressed a MEMBER''s inquiries read';
  END IF;

  -- The client's honest role source: the assistant learns its own role.
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  res := public.my_default_instance_role();
  PERFORM set_config('role', 'postgres', true);
  IF (res->>'role') IS DISTINCT FROM 'assistant' OR (res->>'instance_id')::uuid IS DISTINCT FROM instF THEN
    RAISE EXCEPTION 'ASSISTANT SCOPE SMOKE FAIL: my_default_instance_role returned % (expected assistant in F)', res;
  END IF;

  -- The GRANT path: the owner invites an assistant; the role survives the mint
  -- (never clamped to member, never owner).
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', o, 'role', 'authenticated')::text, true);
  invited := public.invite_to_instance('asst-0130@test.local', 'assistant', instF);
  PERFORM set_config('role', 'postgres', true);
  SELECT role INTO got_role FROM instance_invites WHERE id = (invited->>'id')::uuid;
  IF got_role IS DISTINCT FROM 'assistant' THEN
    RAISE EXCEPTION 'ASSISTANT SCOPE SMOKE FAIL: the invite minted role % (expected assistant)', got_role;
  END IF;

  -- The assistant holds NO granting power.
  IF pg_temp.as_user(a, format('SELECT public.invite_to_instance(''x-0130@test.local'', ''viewer'', %L)', instF)) THEN
    RAISE EXCEPTION 'ASSISTANT SCOPE SMOKE FAIL: an assistant minted an invite';
  END IF;

  -- Role control + revoke: O flips V to assistant, then removes them entirely.
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', o, 'role', 'authenticated')::text, true);
  res := public.set_member_role(instF, v, 'assistant');
  PERFORM set_config('role', 'postgres', true);
  IF (res->>'status') IS DISTINCT FROM 'changed' THEN
    RAISE EXCEPTION 'ASSISTANT SCOPE SMOKE FAIL: set_member_role(v -> assistant) returned %', res;
  END IF;
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', o, 'role', 'authenticated')::text, true);
  res := public.remove_instance_member(instF, v);
  PERFORM set_config('role', 'postgres', true);
  IF (res->>'status') IS DISTINCT FROM 'removed' THEN
    RAISE EXCEPTION 'ASSISTANT SCOPE SMOKE FAIL: remove_instance_member returned %', res;
  END IF;
  SELECT count(*) INTO n FROM instance_members WHERE instance_id = instF AND user_id = v;
  IF n <> 0 THEN
    RAISE EXCEPTION 'ASSISTANT SCOPE SMOKE FAIL: the removed member still holds a membership row';
  END IF;

  -- Revoke guards: an assistant removes no one; no self-removal.
  IF pg_temp.as_user(a, format('SELECT public.remove_instance_member(%L, %L)', instF, m)) THEN
    RAISE EXCEPTION 'ASSISTANT SCOPE SMOKE FAIL: an assistant removed a member';
  END IF;
  IF pg_temp.as_user(o, format('SELECT public.remove_instance_member(%L, %L)', instF, o)) THEN
    RAISE EXCEPTION 'ASSISTANT SCOPE SMOKE FAIL: a self-removal was accepted';
  END IF;

  RAISE NOTICE 'ASSISTANT SCOPE SMOKE: PASS';
END $$;

SELECT 'ASSISTANT SCOPE SMOKE: PASS' AS result;

ROLLBACK;
