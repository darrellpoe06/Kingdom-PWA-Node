-- =============================================================================
-- 0322 — a workshop is sold by the seat, and the seat is a person's (DR-1444)
-- =============================================================================
-- Darrell 2026-11-12: an in-person paid workshop, its cost varied on location
-- and the going rate for the area or the kind of knowledge, whatever works
-- best for demand. The conference tables (0023) hold sessions with no price;
-- a workshop seat is money, so it gets its own two rows:
--
--   workshop_events         one row per offering the Governor opens: which
--                           course it walks through, where, when, how many
--                           seats, and the PRICE THAT IS CHARGED (the server
--                           reads price_cents itself; the app's figure is a
--                           recommendation, workshop-pricing.js);
--   workshop_registrations  one row per person per event, written ONLY by the
--                           Stripe webhook with the service key once the seat
--                           is paid (the same door as member_subscriptions,
--                           0321); read only by the person it belongs to.
--
-- Anyone may read an OPEN event (that is the storefront). The house's own
-- members (user_in_instance, as book_products 0051) open and edit events from
-- the store's Governor panel; only the service role writes a registration:
-- nobody can seat themselves from the client.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.workshop_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_key text NOT NULL,
  title text NOT NULL,
  location_label text NOT NULL,
  location_tier text NOT NULL DEFAULT 'city' CHECK (location_tier IN ('rural', 'city', 'metro', 'major-metro')),
  format text NOT NULL DEFAULT 'day' CHECK (format IN ('half-day', 'day', 'two-day')),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  capacity integer NOT NULL CHECK (capacity > 0),
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  currency text NOT NULL DEFAULT 'usd',
  going_rate_note text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'sold-out', 'held', 'cancelled', 'done')),
  instance_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workshop_events_open ON public.workshop_events (status, starts_at);

ALTER TABLE public.workshop_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.workshop_events FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.workshop_events TO anon, authenticated;
GRANT INSERT, UPDATE ON public.workshop_events TO authenticated;
GRANT ALL ON public.workshop_events TO service_role;

DROP POLICY IF EXISTS workshop_events_read_open ON public.workshop_events;
CREATE POLICY workshop_events_read_open ON public.workshop_events
  FOR SELECT TO anon, authenticated
  USING (status IN ('open', 'sold-out') OR user_in_instance(instance_id));

-- The house opens its own events (every status), from the store's Governor
-- panel; a row must carry the house's instance to be written.
DROP POLICY IF EXISTS workshop_events_write_owner ON public.workshop_events;
CREATE POLICY workshop_events_write_owner ON public.workshop_events
  FOR ALL TO authenticated
  USING (user_in_instance(instance_id))
  WITH CHECK (user_in_instance(instance_id));

CREATE TABLE IF NOT EXISTS public.workshop_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.workshop_events (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'waitlist', 'cancelled', 'refunded', 'attended')),
  stripe_session_id text,
  stripe_payment_id text,
  paid_cents integer NOT NULL DEFAULT 0 CHECK (paid_cents >= 0),
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_workshop_registrations_event ON public.workshop_registrations (event_id, status);

ALTER TABLE public.workshop_registrations ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.workshop_registrations FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.workshop_registrations TO authenticated;
GRANT ALL ON public.workshop_registrations TO service_role;

DROP POLICY IF EXISTS workshop_registrations_read_own ON public.workshop_registrations;
CREATE POLICY workshop_registrations_read_own ON public.workshop_registrations
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- How many seats an open event has left, for the storefront, without exposing
-- who holds them. SECURITY DEFINER so the count reads the paid rows the
-- caller may not see; returns only a number.
CREATE OR REPLACE FUNCTION public.workshop_seats_left(p_event uuid)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT GREATEST(0, e.capacity - (
    SELECT count(*)::integer FROM public.workshop_registrations r
    WHERE r.event_id = e.id AND r.status IN ('paid', 'attended')
  ))
  FROM public.workshop_events e
  WHERE e.id = p_event AND e.status IN ('open', 'sold-out');
$$;
REVOKE ALL ON FUNCTION public.workshop_seats_left(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.workshop_seats_left(uuid) TO anon, authenticated, service_role;
