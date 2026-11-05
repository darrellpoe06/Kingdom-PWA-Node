-- =============================================================================
-- 0315 SMOKE — sign-ins and failures are on the record (DR-1336)
-- =============================================================================
-- One transaction; ROLLS BACK. PASS prints 'AUTH EVENTS SMOKE: PASS'.
--
--   a valid attempt by an instance owner writes 'login' with her instance     ✔
--   a wrong password by the same owner writes 'failed-auth'                   ✔
--   a valid attempt by a person with no instance writes a row with no instance ✔
--   an event with no user_id writes nothing and still returns {}              ✔
--   the owner reads her instance's two rows through auth_events_recent        ✔
--   a plain member of the same instance reads none                            ✘
--   anon cannot execute the read at all                                       ✘
--   the hook itself is not executable by authenticated                        ✘
-- =============================================================================
BEGIN;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000a0315', 'authenticated','authenticated','owner315@test.local',  '', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000b0315', 'authenticated','authenticated','member315@test.local', '', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000c0315', 'authenticated','authenticated','nobody315@test.local', '', now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  ('00000000-0000-4000-b000-000000010315', 'auth-315', 'Auth Smoke', 'business')
ON CONFLICT (id) DO NOTHING;
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  ('00000000-0000-4000-b000-000000010315', '00000000-0000-4000-a000-0000000a0315', 'owner',  'Owner'),
  ('00000000-0000-4000-b000-000000010315', '00000000-0000-4000-a000-0000000b0315', 'member', 'Member')
ON CONFLICT DO NOTHING;

-- The hook, as GoTrue calls it (the smoke runs as the superuser; the grant to
-- supabase_auth_admin is proven on the Supabase stack by the isolation matrix).
DO $$
DECLARE r jsonb; n int;
BEGIN
  r := public.auth_password_verification_attempt('{"user_id":"00000000-0000-4000-a000-0000000a0315","valid":true}');
  IF r <> '{}'::jsonb THEN RAISE EXCEPTION 'a valid attempt must return {} (got %)', r; END IF;
  r := public.auth_password_verification_attempt('{"user_id":"00000000-0000-4000-a000-0000000a0315","valid":false}');
  IF r <> '{}'::jsonb THEN RAISE EXCEPTION 'a failed attempt must return {} (got %)', r; END IF;
  r := public.auth_password_verification_attempt('{"user_id":"00000000-0000-4000-a000-0000000c0315","valid":true}');
  r := public.auth_password_verification_attempt('{"valid":true}');
  IF r <> '{}'::jsonb THEN RAISE EXCEPTION 'a malformed event must still return {} (got %)', r; END IF;

  SELECT count(*) INTO n FROM audit_log WHERE user_id = '00000000-0000-4000-a000-0000000a0315' AND action = 'login' AND instance_id = '00000000-0000-4000-b000-000000010315' AND entity_type = 'auth';
  IF n <> 1 THEN RAISE EXCEPTION 'expected one login row for the owner with her instance, got %', n; END IF;
  SELECT count(*) INTO n FROM audit_log WHERE user_id = '00000000-0000-4000-a000-0000000a0315' AND action = 'failed-auth';
  IF n <> 1 THEN RAISE EXCEPTION 'expected one failed-auth row for the owner, got %', n; END IF;
  SELECT count(*) INTO n FROM audit_log WHERE user_id = '00000000-0000-4000-a000-0000000c0315' AND action = 'login' AND instance_id IS NULL;
  IF n <> 1 THEN RAISE EXCEPTION 'expected one login row with no instance for the person with no instance, got %', n; END IF;
  SELECT count(*) INTO n FROM audit_log WHERE entity_type = 'auth' AND user_id IS NULL;
  IF n <> 0 THEN RAISE EXCEPTION 'a malformed event must write nothing, got % rows', n; END IF;
END $$;

-- The owner reads her instance's two rows.
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"00000000-0000-4000-a000-0000000a0315","role":"authenticated"}';
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM public.auth_events_recent(24);
  IF n <> 2 THEN RAISE EXCEPTION 'the owner must read exactly her instance''s two auth rows, got %', n; END IF;
END $$;

-- A plain member reads none.
SET LOCAL request.jwt.claims = '{"sub":"00000000-0000-4000-a000-0000000b0315","role":"authenticated"}';
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM public.auth_events_recent(24);
  IF n <> 0 THEN RAISE EXCEPTION 'a member must read no auth rows, got %', n; END IF;
END $$;

-- The hook is not for the signed-in person.
DO $$
BEGIN
  PERFORM public.auth_password_verification_attempt('{"user_id":"00000000-0000-4000-a000-0000000b0315","valid":true}');
  RAISE EXCEPTION 'authenticated must not be able to call the hook';
EXCEPTION WHEN insufficient_privilege THEN
  NULL;
END $$;

-- Anon cannot read at all.
RESET ROLE;
SET LOCAL ROLE anon;
DO $$
BEGIN
  PERFORM count(*) FROM public.auth_events_recent(24);
  RAISE EXCEPTION 'anon must not be able to read auth events';
EXCEPTION WHEN insufficient_privilege THEN
  NULL;
END $$;
RESET ROLE;

DO $$ BEGIN RAISE NOTICE 'AUTH EVENTS SMOKE: PASS'; END $$;
ROLLBACK;
