-- =============================================================================
-- 0222 — device link: sign in to the TV from the phone already in your hand
-- =============================================================================
-- Darrell 2026-09-20, after a night of driving the app on a Fire TV: "I don't
-- want to have to be fighting with the Fire Stick to then try to log in... I'd
-- rather just be able to use a QR code to access the login quicker and faster."
--
-- The television never authenticates anybody. It asks for permission; the
-- phone grants it (RFC 8628 device authorization grant). The client half and
-- the full rationale live in app/src/lib/device-link.js.
--
-- TWO SECRETS, AND THE SPLIT IS THE SECURITY MODEL.
--   user_code    SHOWN on the TV. Short, readable, low entropy. A LOOKUP
--                HANDLE only -- it can address a pending request and nothing
--                else, and approving one needs a signed-in human.
--   device_code  NEVER shown. 32 random bytes, held only by the TV, and the
--                sole thing that can collect the session.
-- Photographing the screen is therefore worthless: claiming needs the secret
-- the television kept.
--
-- WHY THE TABLE IS LOCKED TO NOBODY. There is deliberately NO policy granting
-- anon or authenticated a direct SELECT on device_link. A row carries a
-- session-bearing secret; if a client could read rows, the short code on
-- screen would be enough to find the long one beside it and the whole design
-- would collapse in a single SELECT. Every path in and out is a SECURITY
-- DEFINER function that returns only what the caller has proven it may see.
--
-- IDEMPOTENT throughout (IF NOT EXISTS / CREATE OR REPLACE), so a re-run of
-- the auto-migration lane is a no-op.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.device_link (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- The long secret, hashed. Storing it in the clear would mean a database
  -- read is a session handover; the TV proves possession instead.
  device_hash  text NOT NULL UNIQUE,
  user_code    text NOT NULL UNIQUE,
  user_id      uuid REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz NOT NULL,
  approved_at  timestamptz,
  denied_at    timestamptz,
  consumed_at  timestamptz,
  -- Shown to the approver so they can tell their own living room from a
  -- stranger's request: "Fire TV, a moment ago". Never trusted, only displayed.
  device_label text
);

-- The poll is by device_hash and the approval is by user_code, so both are
-- unique-indexed above. This one is for the sweeper.
CREATE INDEX IF NOT EXISTS device_link_expires_idx ON public.device_link (expires_at);

ALTER TABLE public.device_link ENABLE ROW LEVEL SECURITY;

-- No policies, on purpose. RLS with zero policies denies everything to anon and
-- authenticated, which is exactly right: the table is reached only through the
-- definer functions below.

-- -----------------------------------------------------------------------------
-- The television opens a request. It supplies its own hash; the server never
-- sees the secret itself.
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
BEGIN
  -- Bounds, so a caller cannot mint a code that lives for a year.
  IF p_ttl_seconds IS NULL OR p_ttl_seconds < 60 OR p_ttl_seconds > 1800 THEN
    p_ttl_seconds := 600;
  END IF;
  IF p_device_hash IS NULL OR length(p_device_hash) < 32 THEN
    RAISE EXCEPTION 'device-hash-too-short';
  END IF;

  -- Opportunistic sweep: expired rows are useless and must not linger holding
  -- a short code hostage. Cheap, bounded, and it keeps the unique index honest.
  DELETE FROM public.device_link WHERE expires_at < now() - interval '1 hour';

  RETURN QUERY
  INSERT INTO public.device_link (device_hash, user_code, device_label, expires_at)
  VALUES (p_device_hash, upper(p_user_code), left(coalesce(p_label, ''), 60),
          now() + make_interval(secs => p_ttl_seconds))
  RETURNING public.device_link.user_code, public.device_link.expires_at;
END;
$$;

-- -----------------------------------------------------------------------------
-- The phone looks up what it is about to approve. Returns NO secret -- only
-- enough for a person to recognise their own television.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.device_link_describe(p_user_code text)
RETURNS TABLE (device_label text, created_at timestamptz, approvable boolean)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT d.device_label, d.created_at,
         (d.approved_at IS NULL AND d.denied_at IS NULL
          AND d.consumed_at IS NULL AND d.expires_at > now())
  FROM public.device_link d
  WHERE d.user_code = upper(p_user_code)
  LIMIT 1;
$$;

-- -----------------------------------------------------------------------------
-- The phone approves (or denies). Requires a real signed-in user -- this is the
-- step that makes the short code safe to display.
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

  IF p_approve THEN
    UPDATE public.device_link
       SET approved_at = now(), user_id = v_uid
     WHERE user_code = upper(p_user_code)
       -- Each guard is load-bearing: never re-approve a consumed row, never
       -- approve a denied one, never approve after the deadline.
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
-- The television collects. Proves possession of the secret, and the row is
-- burned in the SAME statement that reads it -- so two racing polls cannot both
-- come away with a session.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.device_link_claim(p_device_hash text)
RETURNS TABLE (user_id uuid)
LANGUAGE sql VOLATILE SECURITY DEFINER
SET search_path = public, auth
AS $$
  UPDATE public.device_link d
     SET consumed_at = now()
   WHERE d.device_hash = p_device_hash
     AND d.approved_at IS NOT NULL
     AND d.user_id IS NOT NULL
     AND d.consumed_at IS NULL
     AND d.expires_at > now()
  RETURNING d.user_id;
$$;

-- -----------------------------------------------------------------------------
-- The poll, for a television that is still waiting. Says only how things stand.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.device_link_poll(p_device_hash text)
RETURNS TABLE (state text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT CASE
           WHEN d.consumed_at IS NOT NULL THEN 'consumed'
           WHEN d.expires_at <= now()     THEN 'expired'
           WHEN d.denied_at IS NOT NULL   THEN 'denied'
           WHEN d.approved_at IS NOT NULL AND d.user_id IS NOT NULL THEN 'approved'
           ELSE 'pending'
         END
  FROM public.device_link d
  WHERE d.device_hash = p_device_hash
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.device_link_start(text, text, text, int) FROM public;
REVOKE ALL ON FUNCTION public.device_link_claim(text) FROM public;
GRANT EXECUTE ON FUNCTION public.device_link_start(text, text, text, int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.device_link_describe(text)               TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.device_link_decide(text, boolean)        TO authenticated;
GRANT EXECUTE ON FUNCTION public.device_link_poll(text)                   TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.device_link_claim(text)                  TO anon, authenticated;
