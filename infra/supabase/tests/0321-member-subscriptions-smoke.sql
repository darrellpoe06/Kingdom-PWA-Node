-- =============================================================================
-- 0321 SMOKE — a PoeTech+ member holds their own subscription (DR-1432)
-- =============================================================================
-- One transaction; ROLLS BACK. PASS prints 'MEMBER SUBSCRIPTIONS SMOKE: PASS'.
--
--   a member reads their own row                                          ✔
--   a member reads nobody else's row                                      ✘
--   a member cannot insert, update or delete any row (no self-granting)   ✘
--   anon reads nothing                                                    ✘
--   the free tier is never a purchase (CHECK)                             ✘
--   the service role writes (the webhook's road)                          ✔
-- =============================================================================
BEGIN;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-4000-a000-000000000321', 'authenticated', 'authenticated', 'buyer321@test.local', '', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'b0000000-0000-4000-a000-000000000321', 'authenticated', 'authenticated', 'other321@test.local', '', now(), now())
ON CONFLICT (id) DO NOTHING;

SET LOCAL ROLE service_role;
INSERT INTO public.member_subscriptions (user_id, tier, status, stripe_customer_id, stripe_subscription_id)
VALUES ('a0000000-0000-4000-a000-000000000321', 'poetech-plus', 'active', 'cus_a', 'sub_a'),
       ('b0000000-0000-4000-a000-000000000321', 'family', 'cancelled', 'cus_b', 'sub_b');
RESET ROLE;

DO $$
DECLARE n integer; t text;
BEGIN
  PERFORM set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-a000-000000000321"}', true);
  SET LOCAL ROLE authenticated;

  SELECT count(*) INTO n FROM public.member_subscriptions;
  IF n <> 1 THEN RAISE EXCEPTION 'a member sees % rows, not only their own', n; END IF;
  SELECT tier INTO t FROM public.member_subscriptions;
  IF t <> 'poetech-plus' THEN RAISE EXCEPTION 'a member read % instead of their own tier', t; END IF;

  BEGIN
    INSERT INTO public.member_subscriptions (user_id, tier, status) VALUES ('a0000000-0000-4000-a000-000000000321', 'business', 'active');
    RAISE EXCEPTION 'SELF-GRANT: a member inserted a tier';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    UPDATE public.member_subscriptions SET tier = 'enterprise';
    RAISE EXCEPTION 'SELF-GRANT: a member raised their tier';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    DELETE FROM public.member_subscriptions;
    RAISE EXCEPTION 'a member deleted a subscription row';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  RESET ROLE;

  PERFORM set_config('request.jwt.claims', '{}', true);
  SET LOCAL ROLE anon;
  BEGIN
    SELECT count(*) INTO n FROM public.member_subscriptions;
    RAISE EXCEPTION 'anon read the subscriptions table (% rows)', n;
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  RESET ROLE;

  BEGIN
    INSERT INTO public.member_subscriptions (user_id, tier, status) VALUES ('b0000000-0000-4000-a000-000000000321', 'foundation', 'active')
      ON CONFLICT (user_id) DO UPDATE SET tier = excluded.tier;
    RAISE EXCEPTION 'the free tier was stored as a purchase';
  EXCEPTION WHEN check_violation THEN NULL;
  END;

  RAISE NOTICE 'MEMBER SUBSCRIPTIONS SMOKE: PASS';
END $$;

ROLLBACK;
