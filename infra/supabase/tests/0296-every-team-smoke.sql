-- =============================================================================
-- 0296 SMOKE — every team has a roster, not just the choir (DR-1052)
-- =============================================================================
-- One transaction; ROLLS BACK. PASS prints 'EVERY TEAM SMOKE: PASS'.
-- Runs on the live database the isolation leg uses, so every account here is
-- a test account.
--
--   T is a test church. P owns it. M is on the MEDIA roster. B is on the BUS
--   roster. C is on the CHOIR's own roster (choir_members, untouched by 0296).
--   S holds a church seat and is on no team. X is a stranger.
--
--   user_in_ministry:
--     P  (owner)      -> true for media AND bus       (the owner/admin door)  ✔
--     M  on media     -> true for media                                       ✔
--     M  on media     -> FALSE for bus        (teams do not leak)             ✘
--     B  on bus       -> FALSE for media      (nor the other way)             ✘
--     S  seated, none -> FALSE for media      (a church seat is not a team)   ✘
--     X  stranger     -> FALSE for media                                      ✘
--     C  on the choir -> FALSE for media      (choir_members is not every
--                                              team's roster)                 ✘
--   The choir is untouched by 0296:
--     user_in_choir(T) as C -> still true, read off choir_members             ✔
--     user_in_choir(T) as M -> false (a media seat grants no choir)           ✘
--   The roster's own RLS:
--     M reads the media roster                                                ✔
--     M reads NO row of the bus roster                                        ✘
--     M cannot add themselves to a roster (owner/admin write only)            ✘
-- =============================================================================
BEGIN;

\set t '00000000-0000-4000-b000-000000010296'
\set p '00000000-0000-4000-a000-0000000a0296'
\set m '00000000-0000-4000-a000-0000000b0296'
\set b '00000000-0000-4000-a000-0000000c0296'
\set c '00000000-0000-4000-a000-0000000d0296'
\set s '00000000-0000-4000-a000-0000000e0296'
\set x '00000000-0000-4000-a000-0000000f0296'

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000000', :'p', 'authenticated','authenticated','p0296@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'m', 'authenticated','authenticated','m0296@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'b', 'authenticated','authenticated','b0296@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'c', 'authenticated','authenticated','c0296@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'s', 'authenticated','authenticated','s0296@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'x', 'authenticated','authenticated','x0296@test.local','', now(), now());

INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  (:'t', 'church-0296', 'Every Team Church Smoke', 'church');

-- Everyone but the stranger holds a church seat; only P leads it.
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  (:'t', :'p', 'owner',  'Pastor P'),
  (:'t', :'m', 'member', 'Media M'),
  (:'t', :'b', 'member', 'Bus B'),
  (:'t', :'c', 'member', 'Choir C'),
  (:'t', :'s', 'member', 'Seated S');

-- The new rosters: two different teams.
INSERT INTO ministry_members (instance_id, ministry, user_id, display_name, team_role) VALUES
  (:'t', 'media', :'m', 'Media M', 'camera'),
  (:'t', 'bus',   :'b', 'Bus B',   'driver');

-- The CHOIR's own roster, which 0296 does not touch.
INSERT INTO choir_members (instance_id, user_id, display_name, choir_role) VALUES
  (:'t', :'c', 'Choir C', 'member');

-- Ask a predicate AS a signed-in user (the 0294 helper pattern).
CREATE OR REPLACE FUNCTION pg_temp.in_ministry_as(_who uuid, _inst uuid, _ministry text)
RETURNS boolean LANGUAGE plpgsql AS $$
DECLARE r boolean;
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role', 'authenticated')::text, true);
  r := public.user_in_ministry(_inst, _ministry);
  PERFORM set_config('role', 'postgres', true);
  RETURN r;
END $$;

CREATE OR REPLACE FUNCTION pg_temp.in_choir_as(_who uuid, _inst uuid)
RETURNS boolean LANGUAGE plpgsql AS $$
DECLARE r boolean;
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role', 'authenticated')::text, true);
  r := public.user_in_choir(_inst);
  PERFORM set_config('role', 'postgres', true);
  RETURN r;
END $$;

-- Count what a signed-in user can actually READ of a roster (RLS).
CREATE OR REPLACE FUNCTION pg_temp.roster_rows_as(_who uuid, _ministry text)
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE n integer;
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role', 'authenticated')::text, true);
  SELECT count(*) INTO n FROM public.ministry_members WHERE ministry = _ministry;
  PERFORM set_config('role', 'postgres', true);
  RETURN n;
END $$;

-- Can a signed-in user add themselves to a roster?
CREATE OR REPLACE FUNCTION pg_temp.self_add_blocked(_who uuid, _inst uuid, _ministry text)
RETURNS boolean LANGUAGE plpgsql AS $$
DECLARE blocked boolean := false;
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role', 'authenticated')::text, true);
  BEGIN
    INSERT INTO public.ministry_members (instance_id, ministry, user_id, display_name)
      VALUES (_inst, _ministry, _who, 'self-added');
  EXCEPTION WHEN insufficient_privilege OR check_violation THEN blocked := true;
  END;
  PERFORM set_config('role', 'postgres', true);
  RETURN blocked;
END $$;

DO $$
DECLARE
  t uuid := '00000000-0000-4000-b000-000000010296';
  p uuid := '00000000-0000-4000-a000-0000000a0296';
  m uuid := '00000000-0000-4000-a000-0000000b0296';
  b uuid := '00000000-0000-4000-a000-0000000c0296';
  c uuid := '00000000-0000-4000-a000-0000000d0296';
  s uuid := '00000000-0000-4000-a000-0000000e0296';
  x uuid := '00000000-0000-4000-a000-0000000f0296';
BEGIN
  -- The owner/admin door, unchanged from user_in_choir's contract.
  IF NOT pg_temp.in_ministry_as(p, t, 'media') THEN RAISE EXCEPTION 'owner is not in media'; END IF;
  IF NOT pg_temp.in_ministry_as(p, t, 'bus')   THEN RAISE EXCEPTION 'owner is not in bus';   END IF;

  -- The team seat this migration exists to create.
  IF NOT pg_temp.in_ministry_as(m, t, 'media') THEN RAISE EXCEPTION 'media member is not in media'; END IF;
  IF NOT pg_temp.in_ministry_as(b, t, 'bus')   THEN RAISE EXCEPTION 'bus member is not in bus';     END IF;

  -- THE WALL BETWEEN TEAMS. A generic roster whose predicate ignored its own
  -- ministry column would silently make every team one team — a worse failure
  -- than the gap 0296 closes. Asserted in both directions.
  IF pg_temp.in_ministry_as(m, t, 'bus')   THEN RAISE EXCEPTION 'TEAMS LEAK: media member reads as bus'; END IF;
  IF pg_temp.in_ministry_as(b, t, 'media') THEN RAISE EXCEPTION 'TEAMS LEAK: bus member reads as media'; END IF;

  -- A church seat is not a team seat; a stranger is neither.
  IF pg_temp.in_ministry_as(s, t, 'media') THEN RAISE EXCEPTION 'a plain church member reads as media'; END IF;
  IF pg_temp.in_ministry_as(x, t, 'media') THEN RAISE EXCEPTION 'a stranger reads as media';            END IF;

  -- The choir is untouched: C still reads true off choir_members, and
  -- choir_members is not being read as every team's roster.
  IF NOT pg_temp.in_choir_as(c, t) THEN RAISE EXCEPTION 'REGRESSION: the choir member lost the choir'; END IF;
  IF pg_temp.in_ministry_as(c, t, 'media') THEN RAISE EXCEPTION 'choir_members read as the media roster'; END IF;
  -- And a media seat grants no choir.
  IF pg_temp.in_choir_as(m, t) THEN RAISE EXCEPTION 'media member reads as choir'; END IF;

  -- The roster's own RLS: your team's roster, not another team's.
  IF pg_temp.roster_rows_as(m, 'media') <> 1 THEN
    RAISE EXCEPTION 'media cannot read its own roster (saw %)', pg_temp.roster_rows_as(m, 'media'); END IF;
  IF pg_temp.roster_rows_as(m, 'bus') <> 0 THEN
    RAISE EXCEPTION 'TEAMS LEAK: media read % bus roster row(s)', pg_temp.roster_rows_as(m, 'bus'); END IF;

  -- Owner/admin write only.
  IF NOT pg_temp.self_add_blocked(m, t, 'media') THEN
    RAISE EXCEPTION 'a member added themselves to a roster'; END IF;
END $$;

SELECT 'EVERY TEAM SMOKE: PASS' AS result;
ROLLBACK;
