-- =============================================================================
-- 0126 CAPABILITY-CHECKLIST SMOKE — the enablement gate for the governance
-- checklist (DR-0242). Run on the LIVE Supabase (as postgres) AFTER 0125+0126.
-- Runs in a transaction and ROLLS BACK. PASS prints
-- 'CAPABILITY CHECKLIST SMOKE: PASS'; any wrong grant RAISES.
--
-- Scenario: family instance F — owner O, member M, viewer V.
--
-- Assertions:
--   V INSERT choir row (no grant)                      -> DENIED         ✘
--   O grants write:choir to V (RPC)                    -> granted        ✔
--   V INSERT choir row (granted)                       -> allowed        ✔
--   V INSERT into the ledger DESPITE the grant         -> DENIED         ✘
--   O revokes write:choir                              -> revoked        ✔
--   V INSERT choir row (revoked)                       -> DENIED         ✘
--   M mints an invite naming F (no grant)              -> RAISES         ✘
--   O grants invite:viewer to M                        -> granted        ✔
--   M mints invite naming F asking role=member         -> row, role FORCED viewer ✔
--   V (a viewer) granted invite:viewer? RPC allows grant to viewer targets, but
--     a viewer without it cannot mint                  -> RAISES         ✘
--   M cannot grant capabilities (owner/admin only)     -> RAISES         ✘
--   O cannot grant an unknown capability               -> RAISES         ✘
--   O cannot grant to self                             -> RAISES         ✘
-- =============================================================================
BEGIN;

\set o 'a0000000-0000-4000-a000-000000000126'
\set m 'b0000000-0000-4000-a000-000000000126'
\set v 'c0000000-0000-4000-a000-000000000126'
\set instF 'f0000000-0000-4000-b000-000000000126'

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', :'o', 'authenticated','authenticated','o0126@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'m', 'authenticated','authenticated','m0126@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'v', 'authenticated','authenticated','v0126@test.local','', now(), now());

INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  (:'instF', 'fam-0126', 'Capability smoke family', 'family');
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  (:'instF', :'o', 'owner',  'Owner O'),
  (:'instF', :'m', 'member', 'Member M'),
  (:'instF', :'v', 'viewer', 'Viewer V');

-- The viewer is on the choir roster (the realistic shape: a guest helping the
-- choir). The PERMISSIVE choir gate (user_in_choir) passes; whether they may
-- WRITE is then decided solely by the restrictive overlay + the checklist —
-- exactly the layer under test.
INSERT INTO choir_members (instance_id, user_id, display_name, choir_role) VALUES
  (:'instF', :'v', 'Viewer V', 'member');

-- ── Helpers: run a statement AS a user; report success/denial ───────────────
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

DO $$
DECLARE
  o uuid := 'a0000000-0000-4000-a000-000000000126';
  m uuid := 'b0000000-0000-4000-a000-000000000126';
  v uuid := 'c0000000-0000-4000-a000-000000000126';
  instF uuid := 'f0000000-0000-4000-b000-000000000126';
  invited jsonb;
  got_role text;
  n int;
BEGIN
  -- Without a grant: the viewer's choir write is denied (0125 baseline holds).
  IF pg_temp.as_user(v, format(
      'INSERT INTO choir_song_ideas (instance_id, added_by, added_by_name, title) VALUES (%L, %L, ''Viewer V'', ''smoke-idea'')',
      instF, v)) THEN
    RAISE EXCEPTION 'CAPABILITY SMOKE FAIL: ungranted viewer wrote a choir row';
  END IF;

  -- The owner checks write:choir ON for the viewer.
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', o, 'role', 'authenticated')::text, true);
  PERFORM public.set_member_capability(instF, v, 'write:choir', true);
  PERFORM set_config('role', 'postgres', true);

  -- Granted: the viewer NOW writes the choir area...
  IF NOT pg_temp.as_user(v, format(
      'INSERT INTO choir_song_ideas (instance_id, added_by, added_by_name, title) VALUES (%L, %L, ''Viewer V'', ''smoke-idea-2'')',
      instF, v)) THEN
    RAISE EXCEPTION 'CAPABILITY SMOKE FAIL: write:choir grant did not unlock the choir area';
  END IF;

  -- ...but the LEDGER stays sealed despite the grant (default deny; the
  -- never-unlockable core is not area-mapped).
  IF pg_temp.as_user(v, format(
      'INSERT INTO entities (instance_id, created_by, slug, display_name, entity_type) VALUES (%L, %L, ''cap-smoke-0126'', ''Cap Smoke'', ''business'')',
      instF, v)) THEN
    RAISE EXCEPTION 'CAPABILITY SMOKE FAIL: an area grant leaked into the ledger';
  END IF;

  -- Revoke: the door closes again.
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', o, 'role', 'authenticated')::text, true);
  PERFORM public.set_member_capability(instF, v, 'write:choir', false);
  PERFORM set_config('role', 'postgres', true);
  IF pg_temp.as_user(v, format(
      'INSERT INTO choir_song_ideas (instance_id, added_by, added_by_name, title) VALUES (%L, %L, ''Viewer V'', ''smoke-idea-3'')',
      instF, v)) THEN
    RAISE EXCEPTION 'CAPABILITY SMOKE FAIL: a revoked viewer still wrote the choir area';
  END IF;

  -- A plain member cannot mint an invite by naming the space (0125 baseline).
  IF pg_temp.as_user(m, format('SELECT public.invite_to_instance(''cap1-0126@test.local'', ''viewer'', %L)', instF)) THEN
    RAISE EXCEPTION 'CAPABILITY SMOKE FAIL: an undelegated member minted an invite';
  END IF;

  -- Delegate invite:viewer to the member; their mint works but the role is
  -- FORCED to viewer even when they ask for member.
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', o, 'role', 'authenticated')::text, true);
  PERFORM public.set_member_capability(instF, m, 'invite:viewer', true);
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', m, 'role', 'authenticated')::text, true);
  invited := public.invite_to_instance('cap2-0126@test.local', 'member', instF);
  PERFORM set_config('role', 'postgres', true);
  SELECT role INTO got_role FROM instance_invites WHERE id = (invited->>'id')::uuid;
  IF got_role IS DISTINCT FROM 'viewer' THEN
    RAISE EXCEPTION 'CAPABILITY SMOKE FAIL: a delegated member minted role % (must be forced viewer)', got_role;
  END IF;

  -- A viewer (no delegation) still cannot mint.
  IF pg_temp.as_user(v, format('SELECT public.invite_to_instance(''cap3-0126@test.local'', ''viewer'', %L)', instF)) THEN
    RAISE EXCEPTION 'CAPABILITY SMOKE FAIL: a viewer minted an invite';
  END IF;

  -- Guards on the checklist itself: member cannot grant; unknown capability
  -- rejected; self-grant rejected.
  IF pg_temp.as_user(m, format('SELECT public.set_member_capability(%L, %L, ''write:choir'', true)', instF, v)) THEN
    RAISE EXCEPTION 'CAPABILITY SMOKE FAIL: a member changed the checklist';
  END IF;
  IF pg_temp.as_user(o, format('SELECT public.set_member_capability(%L, %L, ''write:everything'', true)', instF, v)) THEN
    RAISE EXCEPTION 'CAPABILITY SMOKE FAIL: an unknown capability was accepted';
  END IF;
  IF pg_temp.as_user(o, format('SELECT public.set_member_capability(%L, %L, ''write:choir'', true)', instF, o)) THEN
    RAISE EXCEPTION 'CAPABILITY SMOKE FAIL: a self-grant was accepted';
  END IF;

  RAISE NOTICE 'CAPABILITY CHECKLIST SMOKE: PASS';
END $$;

SELECT 'CAPABILITY CHECKLIST SMOKE: PASS' AS result;

ROLLBACK;
