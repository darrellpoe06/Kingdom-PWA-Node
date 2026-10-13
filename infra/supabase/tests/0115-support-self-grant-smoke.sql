-- =============================================================================
-- 0115 SELF-GRANT SMOKE TEST — the enablement gate for user-initiated support
-- =============================================================================
-- Run on the LIVE NAS Supabase (as postgres) AFTER applying 0114 + 0115. PROVES the
-- user-initiated self-grant guards hold (DR-0223 / DR-0076): a member can open a
-- specialist's access to THEIR OWN record, but NEVER to anyone else's, never PHI,
-- and only to a capable specialist. Runs in a transaction and ROLLS BACK. PASS
-- prints 'SELF GRANT SMOKE: PASS'; any wrong grant RAISES.
--
-- Scenario (instance I): owner O, specialist SP, member M, member M2.
-- =============================================================================
BEGIN;

\set o   '00000000-0000-4000-a000-0000000a0115'
\set sp  '00000000-0000-4000-a000-0000000c0115'
\set m   '00000000-0000-4000-a000-0000000d0115'
\set m2  '00000000-0000-4000-a000-0000000e0115'
\set inst '00000000-0000-4000-b000-000000010115'

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', :'o',  'authenticated','authenticated','o0115@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'sp', 'authenticated','authenticated','sp0115@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'m',  'authenticated','authenticated','m0115@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'m2', 'authenticated','authenticated','m2-0115@test.local','', now(), now());

INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  (:'inst', 'colg-0115', 'Self-grant test', 'church');
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  (:'inst', :'o',  'owner',      'Owner O'),
  (:'inst', :'sp', 'specialist', 'Specialist SP'),
  (:'inst', :'m',  'member',     'Member M'),
  (:'inst', :'m2', 'member',     'Member M2');

-- Call request_support_access AS a user; return the grant id, or NULL if it RAISED.
CREATE OR REPLACE FUNCTION pg_temp.req_as(_who uuid, _inst uuid, _grantee uuid, _rtype text, _rid uuid)
RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE v uuid;
BEGIN
  PERFORM set_config('role','authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role','authenticated')::text, true);
  BEGIN
    v := public.request_support_access(_inst, _grantee, _rtype, _rid, 'my record is wrong', 60);
  EXCEPTION WHEN others THEN
    PERFORM set_config('role','postgres', true); RETURN NULL;
  END;
  PERFORM set_config('role','postgres', true);
  RETURN v;
END $$;

DO $$
DECLARE
  o    uuid := '00000000-0000-4000-a000-0000000a0115';
  sp   uuid := '00000000-0000-4000-a000-0000000c0115';
  m    uuid := '00000000-0000-4000-a000-0000000d0115';
  m2   uuid := '00000000-0000-4000-a000-0000000e0115';
  inst uuid := '00000000-0000-4000-b000-000000010115';
  v_m_row  uuid;
  v_m2_row uuid;
  v_grant  uuid;
  v_consent text;
  v_spec_count int;
  v_rec_count int;
  st text;
BEGIN
  SELECT id INTO v_m_row  FROM instance_members WHERE instance_id = inst AND user_id = m;
  SELECT id INTO v_m2_row FROM instance_members WHERE instance_id = inst AND user_id = m2;

  -- M can self-grant SP access to M's OWN membership row.
  v_grant := pg_temp.req_as(m, inst, sp, 'instance_member', v_m_row);
  IF v_grant IS NULL THEN
    RAISE EXCEPTION 'SELF GRANT SMOKE FAIL: a member could not open support on their own record';
  END IF;
  SELECT consent_source INTO v_consent FROM support_access_grants WHERE id = v_grant;
  IF v_consent <> 'user' THEN
    RAISE EXCEPTION 'SELF GRANT SMOKE FAIL: consent_source is % (expected user)', v_consent;
  END IF;

  -- The specialist can read that self-granted record.
  PERFORM set_config('role','authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', sp, 'role','authenticated')::text, true);
  st := (public.support_read(v_grant))->>'status';
  PERFORM set_config('role','postgres', true);
  IF st <> 'ok' THEN
    RAISE EXCEPTION 'SELF GRANT SMOKE FAIL: the specialist could not read the self-granted record (got %)', st;
  END IF;

  -- M CANNOT open support on SOMEONE ELSE's record (M2's row).
  IF pg_temp.req_as(m, inst, sp, 'instance_member', v_m2_row) IS NOT NULL THEN
    RAISE EXCEPTION 'SELF GRANT SMOKE FAIL: a member opened support on someone ELSE''s record';
  END IF;

  -- Never PHI, even self-initiated.
  IF pg_temp.req_as(m, inst, sp, 'confession', v_m_row) IS NOT NULL THEN
    RAISE EXCEPTION 'SELF GRANT SMOKE FAIL: a PHI type was self-grantable';
  END IF;

  -- The grantee must be a capable specialist (M2 is a plain member).
  IF pg_temp.req_as(m, inst, m2, 'instance_member', v_m_row) IS NOT NULL THEN
    RAISE EXCEPTION 'SELF GRANT SMOKE FAIL: self-granted to a non-specialist';
  END IF;

  -- A member can SEE the support specialists to pick one, and their own records.
  PERFORM set_config('role','authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', m, 'role','authenticated')::text, true);
  SELECT count(*) INTO v_spec_count FROM public.list_support_specialists(inst);
  SELECT count(*) INTO v_rec_count  FROM public.my_supportable_records(inst);
  PERFORM set_config('role','postgres', true);
  IF v_spec_count < 2 THEN  -- O (owner) + SP (specialist) both carry support.breakglass
    RAISE EXCEPTION 'SELF GRANT SMOKE FAIL: list_support_specialists saw % (expected >= 2)', v_spec_count;
  END IF;
  IF v_rec_count < 1 THEN
    RAISE EXCEPTION 'SELF GRANT SMOKE FAIL: my_supportable_records saw % of the caller''s own records (expected >= 1)', v_rec_count;
  END IF;

  RAISE NOTICE 'SELF GRANT SMOKE: PASS';
END $$;

ROLLBACK;
