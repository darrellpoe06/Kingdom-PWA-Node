-- =============================================================================
-- 0294 SMOKE — the church knows one person at either door (DR-1043)
-- =============================================================================
-- One transaction; ROLLS BACK. PASS prints 'CHURCH EITHER DOOR SMOKE: PASS'.
-- Runs on the live database the isolation leg uses, so every account here is
-- a test account: the real allowlisted addresses are never inserted.
--
--   P owns test church T; D is P's linked phone door with no seat:
--     join as D                         -> T, seated, same role 'owner'       ✔
--     user_role_in_instance(T) as D     -> 'owner' (every church read follows)✔
--     D's seat is named as the person   -> P's seat name, not the digits      ✔
--     join as D again                   -> T, one seat, no duplicate          ✔
--   Q has an invite to T for Q's email; E is Q's linked door:
--     join as E                         -> T, role 'member', invite accepted  ✔
--   S, a stranger with no link and no invite:
--     join as S                         -> NULL, no seat                      ✘
--   F, a door linked to G, who holds no church seat and no invite:
--     join as F                         -> NULL, no seat                      ✘
--   A link reaches only its own pair: S never sees T through P's link        ✘
-- =============================================================================
BEGIN;

\set p '00000000-0000-4000-a000-0000000a0294'
\set d '00000000-0000-4000-a000-0000000b0294'
\set q '00000000-0000-4000-a000-0000000c0294'
\set e '00000000-0000-4000-a000-0000000d0294'
\set s '00000000-0000-4000-a000-0000000e0294'
\set f '00000000-0000-4000-a000-0000000f0294'
\set g '00000000-0000-4000-a000-000000100294'
\set t '00000000-0000-4000-b000-000000010294'

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000000', :'p', 'authenticated','authenticated','p0294@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'d', 'authenticated','authenticated','15550100294@phone.test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'q', 'authenticated','authenticated','q0294@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'e', 'authenticated','authenticated','15550200294@phone.test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'s', 'authenticated','authenticated','s0294@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'f', 'authenticated','authenticated','15550300294@phone.test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'g', 'authenticated','authenticated','g0294@test.local','', now(), now());

INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  (:'t', 'church-0294', 'Either Door Church Smoke', 'church');
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  (:'t', :'p', 'owner', 'Pastor P');

-- Links are written as postgres only (0141: no app write policy).
INSERT INTO person_links (primary_user, door_user) VALUES
  (:'p', :'d'),
  (:'q', :'e'),
  (:'g', :'f');

INSERT INTO instance_invites (instance_id, email, role, invited_by, expires_at) VALUES
  (:'t', 'q0294@test.local', 'member', :'p', now() + interval '1 day');

-- Call a function AS a signed-in user.
CREATE OR REPLACE FUNCTION pg_temp.join_as(_who uuid)
RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE r uuid;
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role', 'authenticated')::text, true);
  r := public.join_church_instance(NULL);
  PERFORM set_config('role', 'postgres', true);
  RETURN r;
END $$;

CREATE OR REPLACE FUNCTION pg_temp.role_as(_who uuid, _inst uuid)
RETURNS text LANGUAGE plpgsql AS $$
DECLARE r text;
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role', 'authenticated')::text, true);
  r := public.user_role_in_instance(_inst);
  PERFORM set_config('role', 'postgres', true);
  RETURN r;
END $$;

DO $$
DECLARE
  p uuid := '00000000-0000-4000-a000-0000000a0294';
  d uuid := '00000000-0000-4000-a000-0000000b0294';
  e uuid := '00000000-0000-4000-a000-0000000d0294';
  s uuid := '00000000-0000-4000-a000-0000000e0294';
  f uuid := '00000000-0000-4000-a000-0000000f0294';
  t uuid := '00000000-0000-4000-b000-000000010294';
  got uuid;
  r text;
  n int;
BEGIN
  -- The linked door is seated on the same church with the same role.
  got := pg_temp.join_as(d);
  IF got IS DISTINCT FROM t THEN
    RAISE EXCEPTION 'CHURCH EITHER DOOR SMOKE FAIL: the linked door joined % (want the test church)', got;
  END IF;
  r := pg_temp.role_as(d, t);
  IF r IS DISTINCT FROM 'owner' THEN
    RAISE EXCEPTION 'CHURCH EITHER DOOR SMOKE FAIL: the linked door reads role % (want owner)', r;
  END IF;
  SELECT display_name INTO r FROM instance_members WHERE instance_id = t AND user_id = d;
  IF r IS DISTINCT FROM 'Pastor P' THEN
    RAISE EXCEPTION 'CHURCH EITHER DOOR SMOKE FAIL: the door is named % (want the person''s seat name)', r;
  END IF;

  -- A second join returns the same church and makes no second seat.
  got := pg_temp.join_as(d);
  SELECT count(*) INTO n FROM instance_members WHERE instance_id = t AND user_id = d;
  IF got IS DISTINCT FROM t OR n <> 1 THEN
    RAISE EXCEPTION 'CHURCH EITHER DOOR SMOKE FAIL: second join % with % seats', got, n;
  END IF;

  -- An invite to the person's email is accepted at their other door.
  got := pg_temp.join_as(e);
  r := pg_temp.role_as(e, t);
  IF got IS DISTINCT FROM t OR r IS DISTINCT FROM 'member' THEN
    RAISE EXCEPTION 'CHURCH EITHER DOOR SMOKE FAIL: invited door joined % as %', got, r;
  END IF;
  SELECT count(*) INTO n FROM instance_invites
   WHERE instance_id = t AND email = 'q0294@test.local' AND accepted_at IS NOT NULL;
  IF n <> 1 THEN
    RAISE EXCEPTION 'CHURCH EITHER DOOR SMOKE FAIL: the invite was not marked accepted';
  END IF;

  -- A stranger with no link and no invite gets nothing.
  got := pg_temp.join_as(s);
  SELECT count(*) INTO n FROM instance_members WHERE user_id = s;
  IF got IS NOT NULL OR n <> 0 THEN
    RAISE EXCEPTION 'CHURCH EITHER DOOR SMOKE FAIL: a stranger joined % with % seats', got, n;
  END IF;

  -- A door whose person holds no church standing gets nothing.
  got := pg_temp.join_as(f);
  SELECT count(*) INTO n FROM instance_members WHERE user_id = f;
  IF got IS NOT NULL OR n <> 0 THEN
    RAISE EXCEPTION 'CHURCH EITHER DOOR SMOKE FAIL: a door with no standing joined % with % seats', got, n;
  END IF;

  -- The owner's own door still answers as before.
  got := pg_temp.join_as(p);
  IF got IS DISTINCT FROM t THEN
    RAISE EXCEPTION 'CHURCH EITHER DOOR SMOKE FAIL: the owner''s own seat answered %', got;
  END IF;

  RAISE NOTICE 'CHURCH EITHER DOOR SMOKE: PASS';
END $$;

ROLLBACK;
