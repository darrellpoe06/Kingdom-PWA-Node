-- =============================================================================
-- 0321 — a PoeTech+ member holds their own subscription (DR-1432)
-- =============================================================================
-- Darrell 2026-11-12: "build the PoeTech+ checkout". DR-1428 priced the
-- rigorous levels of the PoeTech subjects at PoeTech+ ($39/mo) for a PERSON,
-- in whichever app they read. The money lane DR-0263 built records a paid
-- tier on instance_subscriptions, which is a HOUSEHOLD's row, and the webhook
-- fell back to the family instance (PAYMENTS_INSTANCE_ID) when a session named
-- none. So a stranger's purchase would have raised the Poe household's tier
-- and left the buyer where they were.
--
-- One row per person, keyed by their sign-in. Written ONLY by the Stripe
-- webhook with the service key (no insert, update or delete grant to anyone
-- signed in, so nobody can grant themselves a tier); read only by the person
-- it belongs to (RLS), which is also how the billing-portal road finds that
-- person's Stripe customer without the service key.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.member_subscriptions (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  tier text NOT NULL CHECK (tier IN ('poetech-plus', 'family', 'premium', 'business', 'landlord', 'enterprise')),
  status text NOT NULL CHECK (status IN ('active', 'past-due', 'cancelled')),
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.member_subscriptions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.member_subscriptions FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.member_subscriptions TO authenticated;
GRANT ALL ON public.member_subscriptions TO service_role;

DROP POLICY IF EXISTS member_subscriptions_read_own ON public.member_subscriptions;
CREATE POLICY member_subscriptions_read_own ON public.member_subscriptions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
