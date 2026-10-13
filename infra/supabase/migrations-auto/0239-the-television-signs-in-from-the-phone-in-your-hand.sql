-- =============================================================================
-- 0239 — the television signs in from the phone in your hand (DR-0658)
-- =============================================================================
-- Darrell on the Fire TV, 2026-09-25 02:30 UTC: "Hard to sign in on a
-- Firestick... what happened to the qr code ways?"
--
-- 0222 built the table and the five functions and nothing in the app called
-- them. Wiring them (AuthModal on the TV, the /link approval on the phone, and
-- /api/device-link, the Pages Function that mints the session) exposed four
-- things 0222 left open. This closes them. Idempotent throughout.
--
-- 1. CLAIM BELONGS TO THE SERVICE ROLE ALONE. 0222 granted device_link_claim
--    to anon and authenticated. A claim hands back only a user_id, which is
--    not a session, so a browser claiming directly would burn its own one-time
--    link and get nothing usable. The session is minted by /api/device-link,
--    which hashes the raw device_code itself and claims with the service key.
--    Supabase's default privileges grant new public functions to anon and
--    authenticated directly, so REVOKE FROM PUBLIC alone never removed them.
--
-- 2. DESCRIBE NEEDS A SIGNED-IN HUMAN. The phone signs in before it is shown
--    anything, so anon has no reason to walk the short-code space asking
--    which codes exist. It is now counted against the caller, like decide.
--
-- 3. RATE LIMITS. The short code is low-entropy by design (it is read off a
--    TV across a room). What keeps it safe is that approving needs a
--    signed-in human AND that nobody can try many: 20 look-ups or decisions
--    per signed-in person per 10 minutes. Starting a link is anonymous (the TV
--    is not signed in), so starts are bounded globally: 30 per minute and 500
--    live links at once, far above one family's use, low enough that a flood
--    cannot fill the table.
--
-- 0. START NEVER WORKED. device_link_start raised "column reference
--    expires_at is ambiguous" on every call (its OUT column shares the name
--    of the table column it sweeps by). Nothing called it, so nothing saw it.
--    Fixed below by qualifying every column.
--
-- 4. SHAPES ARE CHECKED. A user_code is exactly eight characters of the TV
--    alphabet; a device hash is exactly 64 lowercase hex characters (SHA-256).
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.device_link_rate (
  id     bigserial PRIMARY KEY,
  bucket text NOT NULL,
  at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS device_link_rate_bucket_at_idx ON public.device_link_rate (bucket, at);
ALTER TABLE public.device_link_rate ENABLE ROW LEVEL SECURITY;
-- No policies, on purpose, exactly as device_link: reached only through the
-- definer functions below.
REVOKE ALL ON public.device_link_rate FROM anon, authenticated;
REVOKE ALL ON public.device_link FROM anon, authenticated;

-- -----------------------------------------------------------------------------
-- The per-person meter. Raises 'rate-limited' past the ceiling; otherwise
-- records the attempt. Old rows are swept on the way through.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.device_link_meter(p_bucket text, p_limit int, p_window interval)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_n int;
BEGIN
  DELETE FROM public.device_link_rate WHERE at < now() - interval '1 hour';
  SELECT count(*) INTO v_n FROM public.device_link_rate
   WHERE bucket = p_bucket AND at > now() - p_window;
  IF v_n >= p_limit THEN
    RAISE EXCEPTION 'rate-limited';
  END IF;
  INSERT INTO public.device_link_rate (bucket) VALUES (p_bucket);
END;
$$;
REVOKE ALL ON FUNCTION public.device_link_meter(text, int, interval) FROM PUBLIC, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Start: same shape as 0222, now with shape checks and a global ceiling.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.device_link_start(
  p_device_hash text,
  p_user_code   text,
  p_label       text DEFAULT NULL,
  p_ttl_seconds int  DEFAULT 600
) RETURNS TABLE (user_code text, expires_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_recent int;
  v_live   int;
BEGIN
  IF p_ttl_seconds IS NULL OR p_ttl_seconds < 60 OR p_ttl_seconds > 1800 THEN
    p_ttl_seconds := 600;
  END IF;
  IF p_device_hash IS NULL OR length(p_device_hash) < 32 THEN
    RAISE EXCEPTION 'device-hash-too-short';
  END IF;
  IF p_device_hash !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'device-hash-malformed';
  END IF;
  IF upper(coalesce(p_user_code, '')) !~ '^[ACDEFGHJKMNPQRTUVWXY34679]{8}$' THEN
    RAISE EXCEPTION 'user-code-malformed';
  END IF;

  -- EVERY column is qualified. The function RETURNS TABLE (user_code,
  -- expires_at), which makes both names plpgsql variables too; 0222's bare
  -- `WHERE expires_at < ...` raised "column reference expires_at is
  -- ambiguous" on EVERY call, so no television could ever start a link.
  -- Measured on supabase/postgres 15.8.1.060, the NAS's own image.
  DELETE FROM public.device_link dl WHERE dl.expires_at < now() - interval '1 hour';

  SELECT count(*) INTO v_recent FROM public.device_link dl WHERE dl.created_at > now() - interval '1 minute';
  SELECT count(*) INTO v_live FROM public.device_link dl
   WHERE dl.expires_at > now() AND dl.consumed_at IS NULL AND dl.denied_at IS NULL;
  IF v_recent >= 30 OR v_live >= 500 THEN
    RAISE EXCEPTION 'rate-limited';
  END IF;

  RETURN QUERY
  INSERT INTO public.device_link (device_hash, user_code, device_label, expires_at)
  VALUES (p_device_hash, upper(p_user_code), left(coalesce(p_label, ''), 60),
          now() + make_interval(secs => p_ttl_seconds))
  RETURNING public.device_link.user_code, public.device_link.expires_at;
END;
$$;

-- -----------------------------------------------------------------------------
-- Describe: signed-in only, metered. Same return shape as 0222 (no secret).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.device_link_describe(p_user_code text)
RETURNS TABLE (device_label text, created_at timestamptz, approvable boolean)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'sign-in-required';
  END IF;
  PERFORM public.device_link_meter('person:' || v_uid::text, 20, interval '10 minutes');
  RETURN QUERY
  SELECT d.device_label, d.created_at,
         (d.approved_at IS NULL AND d.denied_at IS NULL
          AND d.consumed_at IS NULL AND d.expires_at > now())
  FROM public.device_link d
  WHERE d.user_code = upper(p_user_code)
  LIMIT 1;
END;
$$;

-- -----------------------------------------------------------------------------
-- Decide: 0222's guards unchanged, now metered on the same per-person bucket.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.device_link_decide(p_user_code text, p_approve boolean)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_hit int;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'sign-in-required';
  END IF;
  PERFORM public.device_link_meter('person:' || v_uid::text, 20, interval '10 minutes');

  IF p_approve THEN
    UPDATE public.device_link
       SET approved_at = now(), user_id = v_uid
     WHERE user_code = upper(p_user_code)
       AND approved_at IS NULL AND denied_at IS NULL
       AND consumed_at IS NULL AND expires_at > now();
  ELSE
    UPDATE public.device_link
       SET denied_at = now()
     WHERE user_code = upper(p_user_code)
       AND approved_at IS NULL AND denied_at IS NULL AND consumed_at IS NULL;
  END IF;

  GET DIAGNOSTICS v_hit = ROW_COUNT;
  RETURN v_hit = 1;
END;
$$;

-- -----------------------------------------------------------------------------
-- Who may call what, stated whole (the Supabase default grants are undone).
-- -----------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.device_link_start(text, text, text, int) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.device_link_describe(text)               FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.device_link_decide(text, boolean)        FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.device_link_poll(text)                   FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.device_link_claim(text)                  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.device_link_start(text, text, text, int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.device_link_poll(text)                   TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.device_link_describe(text)               TO authenticated;
GRANT EXECUTE ON FUNCTION public.device_link_decide(text, boolean)        TO authenticated;
GRANT EXECUTE ON FUNCTION public.device_link_claim(text)                  TO service_role;
GRANT EXECUTE ON FUNCTION public.device_link_poll(text)                   TO service_role;
