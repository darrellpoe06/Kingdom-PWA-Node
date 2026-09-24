-- =============================================================================
-- 0231 BOX-PUBLISHES-FAMILY-KEY SMOKE — the key reaches only the family's own
-- instances, and only the service role can publish it (DR-0613)
-- =============================================================================
-- Run as postgres AFTER applying 0128 and 0231, in a transaction that ROLLS
-- BACK. PROVES: the publish writes the key to the non-church instance a named
-- family account owns; it does NOT write it to an instance whose owner is not
-- named; it does NOT write it to a church instance even when a named account
-- owns it; a repeat publish of the same key writes nothing; an authenticated
-- user cannot call the publish at all; the family member then reads the key
-- through get_family_bridge_token and the outsider reads NULL.
-- PASS prints 'BOX FAMILY KEY SMOKE: PASS'; any wrong result RAISES.
-- =============================================================================
BEGIN;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-4000-a000-000000000231', 'authenticated','authenticated','owner0231@family.test','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'e0000000-0000-4000-a000-000000000231', 'authenticated','authenticated','outsider0231@other.test','', now(), now());

INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  ('f0000000-0000-4000-b000-000000000231', 'fam-0231',    'Key smoke family',  'family'),
  ('f0000000-0000-4000-b000-000000010231', 'other-0231',  'Key smoke other',   'family'),
  ('f0000000-0000-4000-b000-000000020231', 'church-0231', 'Key smoke church',  'church');
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  ('f0000000-0000-4000-b000-000000000231', 'a0000000-0000-4000-a000-000000000231', 'owner', 'Owner F'),
  ('f0000000-0000-4000-b000-000000010231', 'e0000000-0000-4000-a000-000000000231', 'owner', 'Owner G'),
  ('f0000000-0000-4000-b000-000000020231', 'a0000000-0000-4000-a000-000000000231', 'owner', 'Owner F at church');

DO $$
DECLARE
  n int;
  denied boolean := false;
  got text;
BEGIN
  n := public.box_publish_family_bridge_token('key-0231', ARRAY['OWNER0231@family.test']);
  IF n <> 1 THEN
    RAISE EXCEPTION 'FAIL: expected the key written to exactly the family instance, wrote %', n;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM family_secure_config WHERE instance_id = 'f0000000-0000-4000-b000-000000000231' AND chat_bridge_token = 'key-0231') THEN
    RAISE EXCEPTION 'FAIL: the family instance did not receive the key';
  END IF;
  IF EXISTS (SELECT 1 FROM family_secure_config WHERE instance_id = 'f0000000-0000-4000-b000-000000010231') THEN
    RAISE EXCEPTION 'LEAK: an instance whose owner is not named received the family key';
  END IF;
  IF EXISTS (SELECT 1 FROM family_secure_config WHERE instance_id = 'f0000000-0000-4000-b000-000000020231') THEN
    RAISE EXCEPTION 'LEAK: a church instance received the family key';
  END IF;

  n := public.box_publish_family_bridge_token('key-0231', ARRAY['owner0231@family.test']);
  IF n <> 0 THEN
    RAISE EXCEPTION 'FAIL: a repeat publish of the same key wrote % rows (should be a no-op)', n;
  END IF;

  -- An authenticated user cannot call the publish.
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', 'e0000000-0000-4000-a000-000000000231', 'role', 'authenticated')::text, true);
  BEGIN
    PERFORM public.box_publish_family_bridge_token('stolen', ARRAY['outsider0231@other.test']);
  EXCEPTION WHEN insufficient_privilege THEN
    denied := true;
  END;
  -- The outsider reads no key.
  got := public.get_family_bridge_token();
  PERFORM set_config('role', 'postgres', true);
  IF NOT denied THEN
    RAISE EXCEPTION 'LEAK: an authenticated user could call the box publish';
  END IF;
  IF got IS NOT NULL THEN
    RAISE EXCEPTION 'LEAK: an outsider read the family key';
  END IF;

  -- The family owner reads it.
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', 'a0000000-0000-4000-a000-000000000231', 'role', 'authenticated')::text, true);
  got := public.get_family_bridge_token();
  PERFORM set_config('role', 'postgres', true);
  IF got IS DISTINCT FROM 'key-0231' THEN
    RAISE EXCEPTION 'FAIL: the family owner did not read the published key (got %)', got;
  END IF;

  RAISE NOTICE 'BOX FAMILY KEY SMOKE: PASS';
END $$;

ROLLBACK;
