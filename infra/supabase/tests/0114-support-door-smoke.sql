-- =============================================================================
-- 0114 SUPPORT-DOOR SMOKE TEST — the enablement gate for the governed support door
-- =============================================================================
-- Run on the LIVE NAS Supabase (as postgres) AFTER applying 0114-governed-support-
-- door.sql. PROVES the break-glass guards hold (DR-0223 / DR-0076) before any
-- support surface is trusted. Runs in a transaction and ROLLS BACK. PASS prints
-- 'SUPPORT DOOR SMOKE: PASS'; any wrong grant/read RAISES.
--
-- Scenario (instance I + a separate I2):
--   I:  owner O, admin A, specialist SP (has support.breakglass), member M (none).
--   I2: specialist SP2.
--   The resource under support = M's own instance_members row (a non-PHI record).
--
-- Assertions:
--   member_has_capability(SP, support.breakglass)      -> true                     ✔
--   member_has_capability(M,  support.breakglass)      -> false                    ✘
--   grant for a PHI/unknown type ('confession')        -> RAISES (never grantable) ✘
--   grant by a member (not owner/admin)                -> RAISES                   ✘
--   grant to a NON-capable grantee (M)                 -> RAISES (no capability)   ✘
--   grant by owner O to SP for M's member row          -> returns a grant id       ✔
--   support_read(grant) by A (not the grantee)         -> RAISES (not yours)       ✘
--   support_read(grant) by SP                          -> status 'ok' + data       ✔
--   ... and it WROTE an audit_log 'export' row          -> logged                   ✔
--   after expiry, support_read(grant) by SP            -> 'expired'                 ✘
--   after revoke, support_read(grant) by SP            -> 'expired'                 ✘
-- =============================================================================
BEGIN;

\set o   '00000000-0000-4000-a000-0000000a0114'
\set a   '00000000-0000-4000-a000-0000000b0114'
\set sp  '00000000-0000-4000-a000-0000000c0114'
\set m   '00000000-0000-4000-a000-0000000d0114'
\set sp2 '00000000-0000-4000-a000-0000000e0114'

\set inst  '00000000-0000-4000-b000-000000010114'
\set inst2 '00000000-0000-4000-b000-000000020114'

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', :'o',   'authenticated','authenticated','o0114@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'a',   'authenticated','authenticated','a0114@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'sp',  'authenticated','authenticated','sp0114@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'m',   'authenticated','authenticated','m0114@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'sp2', 'authenticated','authenticated','sp2-0114@test.local','', now(), now());

INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  (:'inst',  'colg-0114',  'Support door test',  'church'),
  (:'inst2', 'other-0114', 'Other support test', 'church');
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  (:'inst',  :'o',   'owner',      'Owner O'),
  (:'inst',  :'a',   'admin',      'Admin A'),
  (:'inst',  :'sp',  'specialist', 'Specialist SP'),
  (:'inst',  :'m',   'member',     'Member M'),
  (:'inst2', :'sp2', 'specialist', 'Specialist SP2');

-- ── Helpers ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION pg_temp.grant_as(_who uuid, _inst uuid, _grantee uuid, _rtype text, _rid uuid, _reason text)
RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE v uuid;
BEGIN
  PERFORM set_config('role','authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role','authenticated')::text, true);
  BEGIN
    v := public.grant_support_access(_inst, _grantee, _rtype, _rid, _reason, 60);
  EXCEPTION WHEN others THEN
    PERFORM set_config('role','postgres', true); RETURN NULL;
  END;
  PERFORM set_config('role','postgres', true);
  RETURN v;
END $$;

CREATE OR REPLACE FUNCTION pg_temp.read_as(_who uuid, _grant uuid)
RETURNS text LANGUAGE plpgsql AS $$
DECLARE r jsonb;
BEGIN
  PERFORM set_config('role','authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role','authenticated')::text, true);
  BEGIN
    r := public.support_read(_grant);
  EXCEPTION WHEN others THEN
    PERFORM set_config('role','postgres', true); RETURN 'RAISED';
  END;
  PERFORM set_config('role','postgres', true);
  RETURN r->>'status';
END $$;

CREATE OR REPLACE FUNCTION pg_temp.cap(_who uuid, _inst uuid, _cap text)
RETURNS boolean LANGUAGE plpgsql AS $$
DECLARE b boolean;
BEGIN
  PERFORM set_config('role','authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role','authenticated')::text, true);
  SELECT public.member_has_capability(_inst, _cap) INTO b;
  PERFORM set_config('role','postgres', true);
  RETURN b;
END $$;

DO $$
DECLARE
  o    uuid := '00000000-0000-4000-a000-0000000a0114';
  a    uuid := '00000000-0000-4000-a000-0000000b0114';
  sp   uuid := '00000000-0000-4000-a000-0000000c0114';
  m    uuid := '00000000-0000-4000-a000-0000000d0114';
  inst uuid := '00000000-0000-4000-b000-000000010114';
  v_member_row uuid;
  v_grant uuid;
  v_logs_before int;
  v_logs_after int;
  st text;
BEGIN
  SELECT id INTO v_member_row FROM instance_members WHERE instance_id = inst AND user_id = m;

  -- Capability checks.
  IF NOT pg_temp.cap(sp, inst, 'support.breakglass') THEN
    RAISE EXCEPTION 'SUPPORT DOOR SMOKE FAIL: specialist lacks support.breakglass capability';
  END IF;
  IF pg_temp.cap(m, inst, 'support.breakglass') THEN
    RAISE EXCEPTION 'SUPPORT DOOR SMOKE FAIL: a plain member HAS support.breakglass capability';
  END IF;

  -- PHI/unknown type is never grantable.
  IF pg_temp.grant_as(o, inst, sp, 'confession', v_member_row, 'fix') IS NOT NULL THEN
    RAISE EXCEPTION 'SUPPORT DOOR SMOKE FAIL: a PHI/unknown resource type was grantable';
  END IF;

  -- A member cannot grant.
  IF pg_temp.grant_as(m, inst, sp, 'instance_member', v_member_row, 'fix') IS NOT NULL THEN
    RAISE EXCEPTION 'SUPPORT DOOR SMOKE FAIL: a member was able to grant support access';
  END IF;

  -- Grant to a non-capable grantee (M) is refused.
  IF pg_temp.grant_as(o, inst, m, 'instance_member', v_member_row, 'fix') IS NOT NULL THEN
    RAISE EXCEPTION 'SUPPORT DOOR SMOKE FAIL: granted break-glass to a non-capable member';
  END IF;

  -- Owner grants the specialist access to M's member row.
  v_grant := pg_temp.grant_as(o, inst, sp, 'instance_member', v_member_row, 'M reported a wrong name');
  IF v_grant IS NULL THEN
    RAISE EXCEPTION 'SUPPORT DOOR SMOKE FAIL: owner could not grant support access to a capable specialist';
  END IF;

  -- A non-grantee cannot read it.
  IF pg_temp.read_as(a, v_grant) <> 'RAISED' THEN
    RAISE EXCEPTION 'SUPPORT DOOR SMOKE FAIL: a non-grantee read a support grant';
  END IF;

  -- The specialist reads it, and it LOGS the read.
  SELECT count(*) INTO v_logs_before FROM audit_log WHERE action = 'export' AND entity_id = v_member_row;
  st := pg_temp.read_as(sp, v_grant);
  IF st <> 'ok' THEN
    RAISE EXCEPTION 'SUPPORT DOOR SMOKE FAIL: the specialist could not read a live grant (got %)', st;
  END IF;
  SELECT count(*) INTO v_logs_after FROM audit_log WHERE action = 'export' AND entity_id = v_member_row;
  IF v_logs_after <> v_logs_before + 1 THEN
    RAISE EXCEPTION 'SUPPORT DOOR SMOKE FAIL: the read was NOT logged to audit_log';
  END IF;

  -- Expiry: force it past and re-read -> expired.
  UPDATE support_access_grants SET expires_at = now() - interval '1 minute' WHERE id = v_grant;
  IF pg_temp.read_as(sp, v_grant) <> 'expired' THEN
    RAISE EXCEPTION 'SUPPORT DOOR SMOKE FAIL: an expired grant still read';
  END IF;

  -- Revoke: restore expiry, revoke, re-read -> expired (revoked).
  UPDATE support_access_grants SET expires_at = now() + interval '60 minutes' WHERE id = v_grant;
  PERFORM set_config('role','authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', o, 'role','authenticated')::text, true);
  PERFORM public.revoke_support_access(v_grant);
  PERFORM set_config('role','postgres', true);
  IF pg_temp.read_as(sp, v_grant) <> 'expired' THEN
    RAISE EXCEPTION 'SUPPORT DOOR SMOKE FAIL: a revoked grant still read';
  END IF;

  RAISE NOTICE 'SUPPORT DOOR SMOKE: PASS';
END $$;

ROLLBACK;
