-- =============================================================================
-- 0319 ONE PERSON ONE HOUSE SMOKE — either sign-in holds the same seats
-- =============================================================================
-- (withdraw-walls, after scripts/curriculum-ci-bootstrap.sql and
-- scripts/withdraw-ci-bootstrap.sql; and the one-person-one-house leg of
-- rls-isolation.yml.) One transaction, rolled back. The declared pairs are
-- swapped for two @test.local sign-ins INSIDE that transaction only, so no real
-- account is read or written. Seeded the way the bug left Christina's second
-- sign-in: a family seat one rung low, no Poe Properties seat, a viewer seat
-- (a seat 0319 never carries; `renter` was written here first and is not an
-- instance_members role at all, which the live constraint refused, DR-1461)
-- elsewhere. A stranger holds a seat of their own.
--
-- PROVEN TO CATCH: the bug is asserted PRESENT first. Then, signed in as the
-- second sign-in, one call levels it: the same houses at the same roles; the
-- viewer seat neither carried nor touched; the stranger untouched; a repeat
-- call, the other sign-in, a stranger and nobody all change 0; anon cannot call
-- it, and the signed-in cannot call the mirror or read the pairs.
-- =============================================================================
BEGIN;

CREATE OR REPLACE FUNCTION public.sign_in_pairs()
RETURNS TABLE (a text, b text) LANGUAGE sql IMMUTABLE SET search_path = public
AS $fn$ VALUES ('first0319@test.local', 'second0319@test.local') $fn$;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-4000-a000-000000000319', 'authenticated', 'authenticated', 'first0319@test.local', '', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'b0000000-0000-4000-a000-000000000319', 'authenticated', 'authenticated', 'Second0319@Test.Local', '', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'c0000000-0000-4000-a000-000000000319', 'authenticated', 'authenticated', 'stranger0319@test.local', '', now(), now());
INSERT INTO public.instances (id, slug, display_name, instance_type) VALUES
  ('f0000000-0000-4000-b000-000000000319', 'family-0319',    'One house smoke family',   'family'),
  ('f0000000-0000-4000-b000-000000010319', 'landlord-0319',  'One house smoke landlord', 'landlord'),
  ('f0000000-0000-4000-b000-000000020319', 'practice-0319',  'One house smoke practice', 'therapy-practice'),
  ('f0000000-0000-4000-b000-000000030319', 'elsewhere-0319', 'One house smoke elsewhere', 'business');
INSERT INTO public.instance_members (instance_id, user_id, role, display_name) VALUES
  ('f0000000-0000-4000-b000-000000000319', 'a0000000-0000-4000-a000-000000000319', 'admin',  'First'),
  ('f0000000-0000-4000-b000-000000010319', 'a0000000-0000-4000-a000-000000000319', 'admin',  'First'),
  ('f0000000-0000-4000-b000-000000020319', 'a0000000-0000-4000-a000-000000000319', 'owner',  'First'),
  ('f0000000-0000-4000-b000-000000000319', 'b0000000-0000-4000-a000-000000000319', 'member', 'Second'),
  ('f0000000-0000-4000-b000-000000030319', 'b0000000-0000-4000-a000-000000000319', 'viewer', 'Second'),
  ('f0000000-0000-4000-b000-000000030319', 'c0000000-0000-4000-a000-000000000319', 'owner',  'Stranger');

CREATE FUNCTION pg_temp.seats_0319(who uuid) RETURNS text LANGUAGE sql STABLE AS $f$
  SELECT string_agg(i.slug || '=' || m.role, ',' ORDER BY i.slug)
    FROM public.instance_members m JOIN public.instances i ON i.id = m.instance_id
   WHERE m.user_id = who AND i.slug LIKE '%-0319'
$f$;

DO $$
DECLARE
  got text;
  n integer;
BEGIN
  got := pg_temp.seats_0319('b0000000-0000-4000-a000-000000000319');
  IF got <> 'elsewhere-0319=viewer,family-0319=member' THEN
    RAISE EXCEPTION 'set-up: the bug is not present (%), so this smoke could not catch it', got;
  END IF;

  PERFORM set_config('request.jwt.claims', '{"sub":"b0000000-0000-4000-a000-000000000319"}', true);
  n := public.share_my_households_across_my_sign_ins();
  IF n <> 3 THEN RAISE EXCEPTION 'the second sign-in was levelled by % changes, not 3 (2 seats added, 1 raised)', n; END IF;

  got := pg_temp.seats_0319('b0000000-0000-4000-a000-000000000319');
  IF got <> 'elsewhere-0319=viewer,family-0319=admin,landlord-0319=admin,practice-0319=owner' THEN
    RAISE EXCEPTION 'the second sign-in holds %, not the same houses as the first', got;
  END IF;
  got := pg_temp.seats_0319('a0000000-0000-4000-a000-000000000319');
  IF got <> 'family-0319=admin,landlord-0319=admin,practice-0319=owner' THEN
    RAISE EXCEPTION 'the first sign-in changed to % (a viewer seat must never be carried)', got;
  END IF;
  got := pg_temp.seats_0319('c0000000-0000-4000-a000-000000000319');
  IF got <> 'elsewhere-0319=owner' THEN RAISE EXCEPTION 'a stranger was touched: %', got; END IF;

  IF public.share_my_households_across_my_sign_ins() <> 0 THEN RAISE EXCEPTION 'a repeat call changed seats already level'; END IF;
  PERFORM set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-a000-000000000319"}', true);
  IF public.share_my_households_across_my_sign_ins() <> 0 THEN RAISE EXCEPTION 'the other sign-in changed seats already level'; END IF;
  PERFORM set_config('request.jwt.claims', '{"sub":"c0000000-0000-4000-a000-000000000319"}', true);
  IF public.share_my_households_across_my_sign_ins() <> 0 THEN RAISE EXCEPTION 'a stranger changed seats'; END IF;
  PERFORM set_config('request.jwt.claims', '{}', true);
  IF public.share_my_households_across_my_sign_ins() <> 0 THEN RAISE EXCEPTION 'nobody changed seats'; END IF;

  IF has_function_privilege('anon', 'public.share_my_households_across_my_sign_ins()', 'execute') THEN
    RAISE EXCEPTION 'anon may call share_my_households_across_my_sign_ins';
  END IF;
  IF NOT has_function_privilege('authenticated', 'public.share_my_households_across_my_sign_ins()', 'execute') THEN
    RAISE EXCEPTION 'the signed-in may not call share_my_households_across_my_sign_ins';
  END IF;
  IF has_function_privilege('authenticated', 'public.mirror_sign_in_seats(uuid, uuid)', 'execute') THEN
    RAISE EXCEPTION 'the signed-in may mirror any two accounts';
  END IF;
END $$;

\echo 'ONE PERSON ONE HOUSE SMOKE: PASS'
ROLLBACK;
