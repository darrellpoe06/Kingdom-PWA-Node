-- =============================================================================
-- 0051 — book commerce: products, entitlements, purchaser-gated conversations
-- =============================================================================
-- Declared by Darrell 2026-06-25. The book line is a monetized product: full
-- books from his Spiritual Module + his other writing (his voice/IP), sold; a
-- purchase unlocks an in-app conversation space around the book; ONE unified
-- subscriber spans the tiers with 90 days free app access.
--
-- BINDING: money is the owner's hand. These tables hold CATALOG + ENTITLEMENT +
-- CONVERSATION only. The payment processor (Stripe) moves money, configured by
-- Darrell; entitlements are GRANTED by the server-side webhook handler (which
-- verifies the Stripe signature with HIS secret key) via grant_book_entitlement.
-- The client never inserts entitlements directly and never holds a secret key.
--
-- The unified subscriber's tier + 90-day trial lives on the EXISTING
-- instance_subscriptions table (schema-v2.1: tier / status='trial' /
-- current_period_start / current_period_end) — this migration does not duplicate
-- it; the app's entitlements.js mirrors it device-local until cutover.
--
-- APPLY: Darrell's hand (Supabase Studio SQL editor or db-migrate), per the
-- db-migrate gap. The app's first increment runs device-local and is unaffected
-- until this is applied + the read/write paths are pointed at these tables.
-- Idempotent (IF NOT EXISTS); safe to re-run.

BEGIN;

-- ── book_products — the sellable catalog (Governor-curated) ─────────────────
CREATE TABLE IF NOT EXISTS public.book_products (
  id                  text PRIMARY KEY,                 -- e.g. 'prod-living-lessons'
  instance_id         uuid NOT NULL REFERENCES public.instances(id) ON DELETE CASCADE,
  recipe_id           text NOT NULL,                    -- book-corpus recipe that assembles the content
  title               text NOT NULL,
  author              text NOT NULL DEFAULT 'Darrell Poe',
  subtitle            text,
  blurb               text,
  cover_emoji         text DEFAULT '📖',
  price_cents         integer NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  currency            text NOT NULL DEFAULT 'usd',
  businesses          jsonb NOT NULL DEFAULT '["church"]'::jsonb,
  status              text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  conversation_enabled boolean NOT NULL DEFAULT true,
  tier_included       jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by          uuid REFERENCES auth.users(id),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.book_products ENABLE ROW LEVEL SECURITY;

-- Anyone signed in may browse PUBLISHED products (the store). Drafts + writes are
-- owner/admin of the selling instance only.
DROP POLICY IF EXISTS book_products_read_published ON public.book_products;
CREATE POLICY book_products_read_published ON public.book_products
  FOR SELECT TO authenticated
  USING (status = 'published' OR user_in_instance(instance_id));

DROP POLICY IF EXISTS book_products_write_owner ON public.book_products;
CREATE POLICY book_products_write_owner ON public.book_products
  FOR ALL TO authenticated
  USING (user_in_instance(instance_id))
  WITH CHECK (user_in_instance(instance_id));

-- ── book_entitlements — who owns which book (one row per user+product) ───────
CREATE TABLE IF NOT EXISTS public.book_entitlements (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id    text NOT NULL,
  source        text NOT NULL DEFAULT 'purchase' CHECK (source IN ('purchase','tier','grant')),
  stripe_ref    text,                                   -- the processor's payment id (audit)
  granted_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);
ALTER TABLE public.book_entitlements ENABLE ROW LEVEL SECURITY;

-- A user sees ONLY their own entitlements. There is NO direct INSERT policy —
-- entitlements are granted by the server-side webhook via the SECURITY DEFINER
-- function below (the client cannot grant itself a paid book).
DROP POLICY IF EXISTS book_entitlements_read_own ON public.book_entitlements;
CREATE POLICY book_entitlements_read_own ON public.book_entitlements
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Granting function — called by Darrell's processor webhook handler (service
-- role) AFTER it has verified the Stripe signature + that the money cleared.
CREATE OR REPLACE FUNCTION public.grant_book_entitlement(p_user uuid, p_product text, p_source text DEFAULT 'purchase', p_stripe_ref text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO public.book_entitlements (user_id, product_id, source, stripe_ref)
  VALUES (p_user, p_product, COALESCE(p_source, 'purchase'), p_stripe_ref)
  ON CONFLICT (user_id, product_id) DO UPDATE SET source = EXCLUDED.source, stripe_ref = COALESCE(EXCLUDED.stripe_ref, public.book_entitlements.stripe_ref)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
REVOKE ALL ON FUNCTION public.grant_book_entitlement(uuid, text, text, text) FROM PUBLIC;
-- service_role (the webhook) executes it; authenticated clients cannot.
GRANT EXECUTE ON FUNCTION public.grant_book_entitlement(uuid, text, text, text) TO service_role;

-- Helper: does the caller own this product? (purchase/grant row OR tier-included
-- is resolved in-app; this checks the explicit entitlement rows.)
CREATE OR REPLACE FUNCTION public.user_owns_book(p_product text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.book_entitlements e WHERE e.product_id = p_product AND e.user_id = auth.uid());
$$;
GRANT EXECUTE ON FUNCTION public.user_owns_book(text) TO authenticated;

-- ── book_conversations — purchaser-gated discussion per book ────────────────
CREATE TABLE IF NOT EXISTS public.book_conversations (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   text NOT NULL,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name  text NOT NULL DEFAULT 'Reader',
  role         text NOT NULL DEFAULT 'reader' CHECK (role IN ('reader','author')),
  kind         text NOT NULL DEFAULT 'comment' CHECK (kind IN ('question','comment','answer')),
  body         text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 4000),
  created_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.book_conversations ENABLE ROW LEVEL SECURITY;

-- The gate is enforced at the DATABASE: you can read + post in a book's
-- conversation ONLY if you own that book. No entitlement, no conversation.
DROP POLICY IF EXISTS book_conversations_read_entitled ON public.book_conversations;
CREATE POLICY book_conversations_read_entitled ON public.book_conversations
  FOR SELECT TO authenticated
  USING (public.user_owns_book(product_id));

DROP POLICY IF EXISTS book_conversations_write_entitled ON public.book_conversations;
CREATE POLICY book_conversations_write_entitled ON public.book_conversations
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.user_owns_book(product_id));

CREATE INDEX IF NOT EXISTS idx_book_conversations_product ON public.book_conversations (product_id, created_at);
CREATE INDEX IF NOT EXISTS idx_book_entitlements_user ON public.book_entitlements (user_id);

COMMIT;
