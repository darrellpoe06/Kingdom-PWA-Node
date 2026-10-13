-- =============================================================================
-- 0199 TLC ACKNOWLEDGE-IN-PLACE SMOKE — a check at the bottom of every
-- document: the colleague acknowledges in place, the office stamps the time
-- (0199, DR-0356). Run on the LIVE Supabase (as postgres) AFTER 0187..0199.
-- Runs in a transaction and ROLLS BACK. PASS prints
-- 'TLC ACKNOWLEDGE SMOKE: PASS'; any wrong grant RAISES.
--
-- Scenario: practice instance P — owner O, therapist T (member); colleague C
-- (a prefilled invite claimed into a packet); stranger S.
--
-- Assertions:
--   C acknowledges the handbook from the document: agreed, signature,
--     attestation, device time kept, the office's stamp written           ✔
--   the same signing again keeps the first stamp                           ✔
--   a re-signing on a new document version is stamped anew                 ✔
--   O / T / S acknowledge on C's behalf                        -> REFUSED ✘
--   an unknown key, an empty name, an unchecked sentence       -> REFUSED ✘
--   after approval C may still acknowledge (a new version)                 ✔
--   every signing is audited with the version and the stamp                ✔
-- =============================================================================
BEGIN;

\set o 'a0000000-0000-4000-a000-000000000199'
\set t 'b0000000-0000-4000-a000-000000000199'
\set c 'c0000000-0000-4000-a000-000000000199'
\set s 'd0000000-0000-4000-a000-000000000199'
\set instP 'f0000000-0000-4000-b000-000000000199'

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', :'o', 'authenticated','authenticated','o0199@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'t', 'authenticated','authenticated','t0199@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'c', 'authenticated','authenticated','c0199@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'s', 'authenticated','authenticated','s0199@test.local','', now(), now());

INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  (:'instP', 'prac-0199', 'TLC acknowledge smoke', 'therapy-practice');
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
  o uuid := 'a0000000-0000-4000-a000-000000000199';
  t uuid := 'b0000000-0000-4000-a000-000000000199';
  c uuid := 'c0000000-0000-4000-a000-000000000199';
  s uuid := 'd0000000-0000-4000-a000-000000000199';
  j jsonb;
  pkt uuid;
  v_stamp1 text;
  v_stamp2 text;
  v_att text := 'By checking this box, I acknowledge that I have read the Independent Contractor Handbook in full and I agree to be bound by it.';
  n int;
BEGIN
  -- ── C's packet: a prefilled invite, claimed by email ─────────────────────
  PERFORM pg_temp.json_as(o, 'o0199@test.local', format('SELECT public.tlc_onboarding_invite_prefilled(%L, NULL, ''{"firstName":"Cora","lastName":"Lane"}''::jsonb, NULL, ''smoke'')', 'c0199@test.local'));
  j := pg_temp.json_as(c, 'c0199@test.local', 'SELECT public.tlc_onboarding_claim()');
  pkt := (j->>'packet_id')::uuid;
  IF pkt IS NULL THEN RAISE EXCEPTION 'TLC ACKNOWLEDGE SMOKE FAIL: no packet for C: %', j; END IF;

  -- ── C acknowledges the handbook from the document itself ────────────────
  j := pg_temp.json_as(c, 'c0199@test.local', format('SELECT public.tlc_onboarding_acknowledge(%L, ''policies'', ''Cora Lane'', ''v1a2b3c4'', %L, ''2026-09-10T20:30:00.000Z'')', pkt, v_att));
  IF j->>'acknowledged' <> 'policies'
     OR (j->'packet'->'acknowledgments'->'policies'->>'agreed') <> 'true'
     OR (j->'packet'->'acknowledgments'->'policies'->>'signature') <> 'Cora Lane'
     OR (j->'packet'->'acknowledgments'->'policies'->>'attestation') <> v_att
     OR (j->'packet'->'acknowledgments'->'policies'->>'agreedAt') <> '2026-09-10T20:30:00.000Z'
     OR (j->'packet'->'acknowledgments'->'policies'->>'docVersion') <> 'v1a2b3c4'
     OR coalesce(j->'packet'->'acknowledgments'->'policies'->>'signedAtServer', '') = '' THEN
    RAISE EXCEPTION 'TLC ACKNOWLEDGE SMOKE FAIL: the acknowledgment record is not whole: %', j->'packet'->'acknowledgments';
  END IF;
  v_stamp1 := j->'packet'->'acknowledgments'->'policies'->>'signedAtServer';

  -- ── The same signing again keeps the first stamp ─────────────────────────
  PERFORM pg_sleep(0.01);
  j := pg_temp.json_as(c, 'c0199@test.local', format('SELECT public.tlc_onboarding_acknowledge(%L, ''policies'', ''Cora Lane'', ''v1a2b3c4'', %L, NULL)', pkt, v_att));
  IF (j->'packet'->'acknowledgments'->'policies'->>'signedAtServer') <> v_stamp1 THEN
    RAISE EXCEPTION 'TLC ACKNOWLEDGE SMOKE FAIL: the same signing was re-stamped';
  END IF;

  -- ── A new document version is a new signing: stamped anew ────────────────
  PERFORM pg_sleep(0.01);
  j := pg_temp.json_as(c, 'c0199@test.local', format('SELECT public.tlc_onboarding_acknowledge(%L, ''policies'', ''Cora Lane'', ''v9f9f9f9'', %L, NULL)', pkt, v_att));
  v_stamp2 := j->'packet'->'acknowledgments'->'policies'->>'signedAtServer';
  IF v_stamp2 = v_stamp1 OR (j->'packet'->'acknowledgments'->'policies'->>'docVersion') <> 'v9f9f9f9' THEN
    RAISE EXCEPTION 'TLC ACKNOWLEDGE SMOKE FAIL: a re-signing on a new version kept the old stamp';
  END IF;

  -- ── Nobody signs for C ───────────────────────────────────────────────────
  IF pg_temp.as_user(o, 'o0199@test.local', format('SELECT public.tlc_onboarding_acknowledge(%L, ''confidentiality'', ''Cora Lane'', ''v1'', %L, NULL)', pkt, v_att)) THEN
    RAISE EXCEPTION 'TLC ACKNOWLEDGE SMOKE FAIL: the owner signed for a colleague';
  END IF;
  IF pg_temp.as_user(t, 't0199@test.local', format('SELECT public.tlc_onboarding_acknowledge(%L, ''confidentiality'', ''Cora Lane'', ''v1'', %L, NULL)', pkt, v_att)) THEN
    RAISE EXCEPTION 'TLC ACKNOWLEDGE SMOKE FAIL: a member signed for a colleague';
  END IF;
  IF pg_temp.as_user(s, 's0199@test.local', format('SELECT public.tlc_onboarding_acknowledge(%L, ''confidentiality'', ''Cora Lane'', ''v1'', %L, NULL)', pkt, v_att)) THEN
    RAISE EXCEPTION 'TLC ACKNOWLEDGE SMOKE FAIL: a stranger signed for a colleague';
  END IF;

  -- ── The walls of the record itself ───────────────────────────────────────
  IF pg_temp.as_user(c, 'c0199@test.local', format('SELECT public.tlc_onboarding_acknowledge(%L, ''handbook'', ''Cora Lane'', ''v1'', %L, NULL)', pkt, v_att)) THEN
    RAISE EXCEPTION 'TLC ACKNOWLEDGE SMOKE FAIL: an unknown key was accepted';
  END IF;
  IF pg_temp.as_user(c, 'c0199@test.local', format('SELECT public.tlc_onboarding_acknowledge(%L, ''confidentiality'', ''   '', ''v1'', %L, NULL)', pkt, v_att)) THEN
    RAISE EXCEPTION 'TLC ACKNOWLEDGE SMOKE FAIL: an empty signature was accepted';
  END IF;
  IF pg_temp.as_user(c, 'c0199@test.local', format('SELECT public.tlc_onboarding_acknowledge(%L, ''confidentiality'', ''Cora Lane'', ''v1'', '''', NULL)', pkt)) THEN
    RAISE EXCEPTION 'TLC ACKNOWLEDGE SMOKE FAIL: an unchecked sentence was accepted';
  END IF;

  -- ── After approval, a colleague still acknowledges a revised document ────
  UPDATE tlc_onboarding_packets SET status = 'approved' WHERE id = pkt;
  j := pg_temp.json_as(c, 'c0199@test.local', format('SELECT public.tlc_onboarding_acknowledge(%L, ''confidentiality'', ''Cora Lane'', ''v2'', %L, NULL)', pkt, replace(v_att, 'Independent Contractor Handbook', 'Confidentiality Agreement (NDA)')));
  IF (j->'packet'->'acknowledgments'->'confidentiality'->>'agreed') <> 'true' THEN
    RAISE EXCEPTION 'TLC ACKNOWLEDGE SMOKE FAIL: an approved colleague could not acknowledge';
  END IF;
  -- The earlier signing of the handbook is untouched by signing another document.
  IF (j->'packet'->'acknowledgments'->'policies'->>'signedAtServer') <> v_stamp2 THEN
    RAISE EXCEPTION 'TLC ACKNOWLEDGE SMOKE FAIL: signing one document changed another';
  END IF;

  -- ── The record ────────────────────────────────────────────────────────────
  SELECT count(*)::int INTO n FROM audit_log
   WHERE entity_type = 'tlc_onboarding_packet' AND entity_id = pkt AND action = 'update'
     AND note = 'tlc_onboarding_acknowledge' AND from_value->>'acknowledged' IS NOT NULL AND to_value->>'signedAtServer' IS NOT NULL;
  IF n <> 4 THEN RAISE EXCEPTION 'TLC ACKNOWLEDGE SMOKE FAIL: expected 4 audited signings, found %', n; END IF;

  RAISE NOTICE 'TLC ACKNOWLEDGE SMOKE: PASS';
END $$;

SELECT 'TLC ACKNOWLEDGE SMOKE: PASS' AS result;

ROLLBACK;
