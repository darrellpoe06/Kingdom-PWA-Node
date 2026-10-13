-- =============================================================================
-- 0198 TLC CELLS SMOKE — a cell for every item on the intake form: the office
-- and the colleague fill any cell, later (0198, DR-0354). Run on the LIVE
-- Supabase (as postgres) AFTER 0187..0198. Runs in a transaction and ROLLS
-- BACK. PASS prints 'TLC CELLS SMOKE: PASS'; any wrong grant RAISES.
--
-- Scenario: practice instance P — owner O, therapist T (member); colleague C
-- (a prefilled invite, later a packet); stranger S.
--
-- Assertions:
--   the office list marks C's waiting invite as prefilled, with the name    ✔
--   O reads the invite's cells (never the bank numbers, only that they are there) ✔
--   T reads the invite                                        -> REFUSED ✘
--   O fills a cell on the invite                              -> merged ✔
--   O patches a signature / a password / a bank number onto it -> REFUSED ✘
--   C signs in and claims: the office's cell is in the packet ✔
--   O fills the opened invite                                  -> REFUSED (fill the packet) ✘
--   O fills a cell on the packet                               -> merged, audited as office ✔
--   C fills their own cell                                     -> merged, audited as self ✔
--   C fills after approval                                     -> still allowed ✔
--   T / S patch C's packet                                     -> REFUSED ✘
--   C patches acknowledgments                                  -> REFUSED ✘
-- =============================================================================
BEGIN;

\set o 'a0000000-0000-4000-a000-000000000198'
\set t 'b0000000-0000-4000-a000-000000000198'
\set c 'c0000000-0000-4000-a000-000000000198'
\set s 'd0000000-0000-4000-a000-000000000198'
\set instP 'f0000000-0000-4000-b000-000000000198'

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', :'o', 'authenticated','authenticated','o0198@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'t', 'authenticated','authenticated','t0198@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'c', 'authenticated','authenticated','c0198@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'s', 'authenticated','authenticated','s0198@test.local','', now(), now());

INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  (:'instP', 'prac-0198', 'TLC cells smoke', 'therapy-practice');
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

CREATE OR REPLACE FUNCTION pg_temp.json_as(_who uuid, _email text, _sql text)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE j jsonb;
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role', 'authenticated', 'email', _email)::text, true);
  EXECUTE _sql INTO j;
  PERFORM set_config('role', 'postgres', true);
  RETURN j;
END $$;

DO $$
DECLARE
  o uuid := 'a0000000-0000-4000-a000-000000000198';
  t uuid := 'b0000000-0000-4000-a000-000000000198';
  c uuid := 'c0000000-0000-4000-a000-000000000198';
  s uuid := 'd0000000-0000-4000-a000-000000000198';
  j jsonb;
  inv uuid;
  pkt uuid;
  n integer;
  v_prefill text := '{"firstName":"Cora","lastName":"Colleague","phone":"3095550198","preferredEmail":"c0198@test.local","licenseType":"LCSW","employmentStatus":"Independent Contractor"}';
  v_bank text := '{"bankName":"Test Bank","routingNumber":"071000013","accountNumber":"123456789","accountType":"checking"}';
BEGIN
  j := pg_temp.json_as(o, 'o0198@test.local', format('SELECT public.tlc_onboarding_invite_prefilled(''c0198@test.local'', ''from the old form'', %L::jsonb, %L::jsonb, ''hiring form responses'')', v_prefill, v_bank));
  inv := (j->>'id')::uuid;

  -- ── The list knows; the office reads the cells; a member cannot ──────────
  j := pg_temp.json_as(o, 'o0198@test.local', 'SELECT public.tlc_onboarding_list()');
  IF (j->'invites'->0->>'prefilled')::boolean IS DISTINCT FROM true OR j->'invites'->0->>'applicant_name' <> 'Cora Colleague' THEN
    RAISE EXCEPTION 'TLC CELLS SMOKE FAIL: the list does not mark the prefilled invite with its name: %', j->'invites';
  END IF;
  j := pg_temp.json_as(o, 'o0198@test.local', format('SELECT public.tlc_onboarding_invite_read(%L)', inv));
  IF j->'packet'->>'firstName' <> 'Cora' OR (j->>'banking_on_file')::boolean IS DISTINCT FROM true OR j::text LIKE '%071000013%' THEN
    RAISE EXCEPTION 'TLC CELLS SMOKE FAIL: the invite read is wrong (cells missing, or a bank number shown): %', j;
  END IF;
  IF pg_temp.as_user(t, 't0198@test.local', format('SELECT public.tlc_onboarding_invite_read(%L)', inv)) THEN
    RAISE EXCEPTION 'TLC CELLS SMOKE FAIL: a member read an invite''s cells';
  END IF;

  -- ── The office fills a cell on the invite; the walls hold ────────────────
  j := pg_temp.json_as(o, 'o0198@test.local', format('SELECT public.tlc_onboarding_invite_patch(%L, ''{"npiNumber":"1234567890","education":"MSW, UIUC"}''::jsonb, ''added from her email'')', inv));
  IF j->'packet'->>'npiNumber' <> '1234567890' OR j->'packet'->>'firstName' <> 'Cora' THEN
    RAISE EXCEPTION 'TLC CELLS SMOKE FAIL: the invite cell was not merged: %', j;
  END IF;
  IF pg_temp.as_user(o, 'o0198@test.local', format('SELECT public.tlc_onboarding_invite_patch(%L, ''{"acknowledgments":{"policies":{"agreed":true}}}''::jsonb)', inv)) THEN
    RAISE EXCEPTION 'TLC CELLS SMOKE FAIL: a signature was patched onto an invite';
  END IF;
  IF pg_temp.as_user(o, 'o0198@test.local', format('SELECT public.tlc_onboarding_invite_patch(%L, ''{"caqhPassword":"x"}''::jsonb)', inv)) THEN
    RAISE EXCEPTION 'TLC CELLS SMOKE FAIL: a password was patched onto an invite';
  END IF;
  IF pg_temp.as_user(o, 'o0198@test.local', format('SELECT public.tlc_onboarding_invite_patch(%L, ''{"routingNumber":"1"}''::jsonb)', inv)) THEN
    RAISE EXCEPTION 'TLC CELLS SMOKE FAIL: a bank number was patched onto an invite';
  END IF;
  IF pg_temp.as_user(t, 't0198@test.local', format('SELECT public.tlc_onboarding_invite_patch(%L, ''{"education":"x"}''::jsonb)', inv)) THEN
    RAISE EXCEPTION 'TLC CELLS SMOKE FAIL: a member filled an invite''s cell';
  END IF;

  -- ── C signs in: the office's cell is in the packet ───────────────────────
  j := pg_temp.json_as(c, 'c0198@test.local', 'SELECT public.tlc_onboarding_claim()');
  pkt := (j->>'packet_id')::uuid;
  IF pkt IS NULL OR j->'packet'->>'npiNumber' <> '1234567890' THEN RAISE EXCEPTION 'TLC CELLS SMOKE FAIL: the claimed packet lacks the office''s cell: %', j; END IF;
  IF pg_temp.as_user(o, 'o0198@test.local', format('SELECT public.tlc_onboarding_invite_patch(%L, ''{"education":"x"}''::jsonb)', inv)) THEN
    RAISE EXCEPTION 'TLC CELLS SMOKE FAIL: an opened invite still took a cell';
  END IF;

  -- ── Cells on the packet: the office, the colleague, nobody else ──────────
  j := pg_temp.json_as(o, 'o0198@test.local', format('SELECT public.tlc_onboarding_patch(%L, ''{"deaNumber":"AB1234567"}''::jsonb, ''from her DEA card'')', pkt));
  IF j->'packet'->>'deaNumber' <> 'AB1234567' OR j->>'patched_by' <> 'office' THEN RAISE EXCEPTION 'TLC CELLS SMOKE FAIL: the office patch did not land: %', j; END IF;
  j := pg_temp.json_as(c, 'c0198@test.local', format('SELECT public.tlc_onboarding_patch(%L, ''{"bio":"Twenty years beside families.","populationsServed":["families"]}''::jsonb)', pkt));
  IF j->'packet'->>'bio' <> 'Twenty years beside families.' OR j->>'patched_by' <> 'self' OR j->'packet'->>'deaNumber' <> 'AB1234567' THEN
    RAISE EXCEPTION 'TLC CELLS SMOKE FAIL: the colleague''s patch did not land beside the office''s: %', j;
  END IF;
  IF pg_temp.as_user(t, 't0198@test.local', format('SELECT public.tlc_onboarding_patch(%L, ''{"bio":"no"}''::jsonb)', pkt)) THEN
    RAISE EXCEPTION 'TLC CELLS SMOKE FAIL: a member patched a colleague''s packet';
  END IF;
  IF pg_temp.as_user(s, 's0198@test.local', format('SELECT public.tlc_onboarding_patch(%L, ''{"bio":"no"}''::jsonb)', pkt)) THEN
    RAISE EXCEPTION 'TLC CELLS SMOKE FAIL: a stranger patched a colleague''s packet';
  END IF;
  IF pg_temp.as_user(c, 'c0198@test.local', format('SELECT public.tlc_onboarding_patch(%L, ''{"acknowledgments":{"policies":{"agreed":true,"signature":"Cora"}}}''::jsonb)', pkt)) THEN
    RAISE EXCEPTION 'TLC CELLS SMOKE FAIL: a signature was patched onto a packet';
  END IF;
  IF pg_temp.as_user(c, 'c0198@test.local', format('SELECT public.tlc_onboarding_patch(%L, ''{"documents":{}}''::jsonb)', pkt)) THEN
    RAISE EXCEPTION 'TLC CELLS SMOKE FAIL: the documents were patched onto a packet';
  END IF;

  -- ── After approval the colleague still keeps their own cells current ──────
  UPDATE tlc_onboarding_packets SET status = 'approved' WHERE id = pkt;
  j := pg_temp.json_as(c, 'c0198@test.local', format('SELECT public.tlc_onboarding_patch(%L, ''{"phone":"3095550199"}''::jsonb, ''new number'')', pkt));
  IF j->'packet'->>'phone' <> '3095550199' THEN RAISE EXCEPTION 'TLC CELLS SMOKE FAIL: an approved colleague could not update their own cell'; END IF;

  -- ── The record ────────────────────────────────────────────────────────────
  SELECT count(*)::int INTO n FROM audit_log WHERE entity_type = 'tlc_onboarding_packet' AND entity_id = pkt AND action = 'update' AND from_value->>'by' = 'office' AND to_value->'cells' ? 'deaNumber';
  IF n <> 1 THEN RAISE EXCEPTION 'TLC CELLS SMOKE FAIL: the office patch is not audited with its cells (% rows)', n; END IF;
  SELECT count(*)::int INTO n FROM audit_log WHERE entity_type = 'tlc_onboarding_packet' AND entity_id = pkt AND action = 'update' AND from_value->>'by' = 'self';
  IF n <> 2 THEN RAISE EXCEPTION 'TLC CELLS SMOKE FAIL: the colleague''s patches are not audited (% rows, expected 2)', n; END IF;
  SELECT count(*)::int INTO n FROM audit_log WHERE entity_type = 'tlc_onboarding_invite' AND entity_id = inv AND action = 'update' AND note = 'added from her email';
  IF n <> 1 THEN RAISE EXCEPTION 'TLC CELLS SMOKE FAIL: the invite patch is not audited with its note'; END IF;

  RAISE NOTICE 'TLC CELLS SMOKE: PASS';
END $$;

SELECT 'TLC CELLS SMOKE: PASS' AS result;

ROLLBACK;
