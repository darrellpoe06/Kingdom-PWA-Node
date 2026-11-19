-- =============================================================================
-- 0341 — a try with no account is counted, not kept (DR-1593)
-- =============================================================================
-- Darrell, 2026-11-19: "how do we help people when they have onboarding
-- issues?!!!!! We should be able to see these issues from our data logs!!!"
--
-- THE GAP. GoTrue answers "Invalid login credentials" both for a wrong
-- password and for an address that has no account. The password hook (0315)
-- only fires for an account that exists, so a person who signed up with one
-- phone number and keeps trying another, or who mistypes their email, leaves
-- no row anywhere. That person is stuck and invisible.
--
-- WHAT THIS RECORDS, AND WHAT IT DOES NOT. After a failed password or
-- phone+PIN sign-in, the app calls note_sign_in_miss(login) with the address
-- it tried (a phone sign-in tries `<digits>@phone.poetech.us`). If an account
-- has that address, nothing is written: the hook already recorded the try. If
-- not, one row per address per day is counted:
--   · the address itself is NEVER stored. It is hashed with sha256 over a
--     random server-side salt that no API role can read (the salt table has
--     RLS on and every privilege revoked);
--   · the only readable trace is a hint: "phone ending 0142" for a phone
--     address, or the first character and the domain of an email
--     ("c…@example.org"). That is the same masking the Signups list uses;
--   · rows older than 30 days are deleted on every write.
--
-- ANON-CALLABLE, SO IT CARRIES BRAKES (CLAUDE.md, three brakes).
--   1. Budget: at most `hourly_cap` (default 200) counted tries per clock hour
--      across everyone; past it, the try is only tallied as dropped. One
--      address counts at most 50 tries a day. The input is bounded to 254
--      characters and must look like an address, or nothing is written.
--   2. Lock: there is no loop and no timer. Each call is one atomic upsert, so
--      two calls cannot stack work on each other.
--   3. Kill-switch: sign_in_miss_settings.enabled. The governor's read reports
--      whether it is on; a deterministic UPDATE turns it off, and any dropped try
--      of dropped tries is shown on the screen as the cap having tripped.
-- The function always returns nothing, whether it counted, refused or found an
-- account, so it is not an oracle for which addresses have accounts.
--
-- WHO READS. admin_sign_in_misses(), the poe-family circle only (the gate of
-- 0055 / 0259 / 0337 / 0338): each hint with its tries, first and last time,
-- the days seen, and whether the same address is an unclaimed Poe Properties
-- invitation (matched by the same salted hash, so "the invited tenant is
-- trying to get in and has no account yet" is said plainly).
--
-- IDEMPOTENT: IF NOT EXISTS, ON CONFLICT DO NOTHING for the settings and the
-- salt, CREATE OR REPLACE FUNCTION, grants re-applied.
-- Smoke: infra/supabase/tests/0341-sign-in-misses-smoke.sql (ROLLS BACK).
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.sign_in_miss_settings (
  id          boolean PRIMARY KEY DEFAULT true CHECK (id),
  enabled     boolean NOT NULL DEFAULT true,
  hourly_cap  int NOT NULL DEFAULT 200 CHECK (hourly_cap BETWEEN 0 AND 10000),
  salt        text NOT NULL
);
INSERT INTO public.sign_in_miss_settings (id, salt)
VALUES (true, encode(sha256(convert_to(gen_random_uuid()::text || clock_timestamp()::text || gen_random_uuid()::text, 'UTF8')), 'hex'))
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.sign_in_misses (
  hash      text NOT NULL CHECK (length(hash) = 64),
  day       date NOT NULL,
  hint      text NOT NULL CHECK (length(hint) <= 80),
  tries     int  NOT NULL DEFAULT 1 CHECK (tries BETWEEN 1 AND 50),
  first_at  timestamptz NOT NULL DEFAULT now(),
  last_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (hash, day)
);
CREATE INDEX IF NOT EXISTS sign_in_misses_last_idx ON public.sign_in_misses (last_at DESC);

CREATE TABLE IF NOT EXISTS public.sign_in_miss_meter (
  hour     timestamptz PRIMARY KEY,
  counted  int NOT NULL DEFAULT 0,
  dropped  int NOT NULL DEFAULT 0
);

-- No API role reads or writes these tables; only the two functions below do.
ALTER TABLE public.sign_in_miss_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sign_in_misses       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sign_in_miss_meter   ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.sign_in_miss_settings FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.sign_in_misses       FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.sign_in_miss_meter   FROM PUBLIC, anon, authenticated;

-- The display hint for an address: never the address.
CREATE OR REPLACE FUNCTION public.sign_in_miss_hint(p_login text)
RETURNS text
LANGUAGE sql IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_login ~ '^[0-9]{7,15}@phone\.poetech\.us$'
      THEN 'phone ending ' || right(split_part(p_login, '@', 1), 4)
    ELSE left(p_login, 1) || '…@' || left(split_part(p_login, '@', 2), 60)
  END
$$;

CREATE OR REPLACE FUNCTION public.note_sign_in_miss(p_login text)
RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_login text := lower(btrim(coalesce(p_login, '')));
  v_set   public.sign_in_miss_settings%ROWTYPE;
  v_hour  timestamptz := date_trunc('hour', now());
  v_count int;
BEGIN
  -- Bounded input: an address shape, at most 254 characters, or nothing.
  IF length(v_login) = 0 OR length(v_login) > 254 OR v_login !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RETURN;
  END IF;
  SELECT * INTO v_set FROM public.sign_in_miss_settings WHERE id;
  IF NOT FOUND OR NOT v_set.enabled THEN
    RETURN;
  END IF;
  -- An account with this address: the password hook already recorded the try.
  IF EXISTS (SELECT 1 FROM auth.users u WHERE lower(u.email) = v_login) THEN
    RETURN;
  END IF;

  -- The budget, across everyone, per clock hour.
  INSERT INTO public.sign_in_miss_meter AS m (hour, counted, dropped) VALUES (v_hour, 0, 0)
  ON CONFLICT (hour) DO NOTHING;
  SELECT counted INTO v_count FROM public.sign_in_miss_meter WHERE hour = v_hour FOR UPDATE;
  IF v_count >= v_set.hourly_cap THEN
    UPDATE public.sign_in_miss_meter SET dropped = dropped + 1 WHERE hour = v_hour;
    RETURN;
  END IF;
  UPDATE public.sign_in_miss_meter SET counted = counted + 1 WHERE hour = v_hour;

  INSERT INTO public.sign_in_misses AS s (hash, day, hint)
  VALUES (encode(sha256(convert_to(v_set.salt || v_login, 'UTF8')), 'hex'), current_date, public.sign_in_miss_hint(v_login))
  ON CONFLICT (hash, day) DO UPDATE
    SET tries = LEAST(50, s.tries + 1), last_at = now();

  -- Retention: nothing older than 30 days, no meter older than 2.
  DELETE FROM public.sign_in_misses WHERE day < current_date - 30;
  DELETE FROM public.sign_in_miss_meter WHERE hour < now() - interval '2 days';
EXCEPTION WHEN OTHERS THEN
  -- A sign-in screen never breaks on the record-keeper (DR-0107).
  RAISE WARNING 'note_sign_in_miss: %', SQLERRM;
END;
$$;

REVOKE ALL ON FUNCTION public.note_sign_in_miss(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.note_sign_in_miss(text) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.sign_in_miss_hint(text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_sign_in_misses()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_caller  uuid := auth.uid();
  v_set     public.sign_in_miss_settings%ROWTYPE;
  v_invites jsonb := '{}'::jsonb;  -- hash -> {display_name, role_label}
  v_rows    jsonb;
  v_meter   jsonb;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'admin_sign_in_misses: not authenticated' USING ERRCODE = '28000';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM instance_members im JOIN instances i ON i.id = im.instance_id
     WHERE im.user_id = v_caller AND i.slug = 'poe-family'
  ) THEN
    RAISE EXCEPTION 'admin_sign_in_misses: not authorized (poe-family governors only)' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_set FROM public.sign_in_miss_settings WHERE id;

  IF to_regclass('public.property_access_invites') IS NOT NULL AND v_set.salt IS NOT NULL THEN
    BEGIN
      EXECUTE $q$
        SELECT coalesce(jsonb_object_agg(h, jsonb_build_object('display_name', display_name, 'role_label', role_label)), '{}'::jsonb)
          FROM (
            SELECT DISTINCT ON (h) encode(sha256(convert_to($1 || lower(btrim(pi.email)), 'UTF8')), 'hex') AS h,
                   pi.display_name, pi.role_label
              FROM public.property_access_invites pi
             WHERE pi.claimed_at IS NULL AND NOT pi.revoked
             ORDER BY h, pi.created_at DESC
          ) g
      $q$ INTO v_invites USING v_set.salt;
    EXCEPTION WHEN OTHERS THEN
      v_invites := '{}'::jsonb;
    END;
  END IF;

  SELECT coalesce(jsonb_agg(jsonb_build_object(
           'hint', g.hint, 'tries', g.tries, 'days', g.days,
           'first_at', g.first_at, 'last_at', g.last_at,
           'invite', v_invites->g.hash) ORDER BY g.last_at DESC), '[]'::jsonb)
    INTO v_rows
    FROM (
      SELECT s.hash, max(s.hint) AS hint, sum(s.tries)::int AS tries, count(*)::int AS days,
             min(s.first_at) AS first_at, max(s.last_at) AS last_at
        FROM public.sign_in_misses s
       GROUP BY s.hash
       ORDER BY max(s.last_at) DESC
       LIMIT 200
    ) g;

  SELECT jsonb_build_object(
           'counted_24h', coalesce(sum(counted), 0),
           'dropped_24h', coalesce(sum(dropped), 0),
           'cap_tripped_24h', coalesce(bool_or(dropped > 0), false))
    INTO v_meter
    FROM public.sign_in_miss_meter
   WHERE hour > now() - interval '24 hours';

  RETURN jsonb_build_object(
    'generated_at', now(),
    'enabled', coalesce(v_set.enabled, false),
    'hourly_cap', v_set.hourly_cap,
    'meter', v_meter,
    'misses', v_rows
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_sign_in_misses() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_sign_in_misses() TO authenticated;

DO $chk$
BEGIN
  IF to_regprocedure('public.note_sign_in_miss(text)') IS NULL THEN RAISE EXCEPTION '0341: note_sign_in_miss is missing'; END IF;
  IF to_regprocedure('public.admin_sign_in_misses()') IS NULL THEN RAISE EXCEPTION '0341: admin_sign_in_misses is missing'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.sign_in_miss_settings WHERE id AND length(salt) = 64) THEN
    RAISE EXCEPTION '0341: the salt is missing';
  END IF;
END
$chk$;

NOTIFY pgrst, 'reload schema';
