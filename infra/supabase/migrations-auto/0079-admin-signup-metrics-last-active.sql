-- =============================================================================
-- 0079 — admin_signup_metrics: report REAL last-active, not just the auth stamp
-- =============================================================================
-- LIVE BUG (Darrell's screenshots, 2026-07-05): Admin -> Users & usage -> Signups
-- showed "mrspoe06@gmail.com ... active, last sign-in 2w ago" at the SAME minute
-- she was signed in and using PoeTech TV Time on another device (Jul 5 2026,
-- 2:37 PM). The report said she had not signed in for two weeks while she was
-- demonstrably active right then. The surface promises "every reading here is a
-- live view of real system state" (DR-0076); this number was not.
--
-- ROOT CAUSE: 0055/0076 built the signup row's recency signal entirely from
-- auth.users.last_sign_in_at. That column is written by Supabase/GoTrue ONLY on a
-- fresh interactive authentication event (password / OAuth / OTP / magic-link).
-- It is NOT updated when a persistent PWA session silently refreshes its access
-- token with the refresh-token grant. mrspoe06's session was established ~2 weeks
-- ago and has auto-refreshed ever since, so last_sign_in_at is frozen at that
-- last real sign-in even while she uses the app daily. last_sign_in_at answers
-- "when did they last AUTHENTICATE", never "when were they last ACTIVE" -- but
-- the report presented it as the latter ("active, last sign-in ..."). It is a
-- real column reporting a real fact; it was the wrong fact for this surface.
--
-- THE FIX (use the activity signal the platform already keeps): member_presence
-- (0055-member-presence.sql) records a real last_seen_at heartbeat, upserted by
-- record_presence() every time a session opens the app on any device -- for
-- self-serve `u-*` users (members of their own instance) AND family/church
-- members alike. This function now LEFT JOINs each account's newest presence
-- heartbeat and reports an EFFECTIVE last-active =
--       GREATEST(last_sign_in_at, MAX(member_presence.last_seen_at))
-- (GREATEST ignores NULLs, so an account with no presence row falls back to the
-- auth stamp exactly as before -- honest degradation, never a fabricated time).
-- The active_7d and returned SUMMARY counts move onto the same effective value,
-- so the tiles and the row text agree and both reflect real activity.
--
-- WHAT IS UNCHANGED: the poe-family governor gate, the privacy posture
-- (governance metadata only -- no content, no per-action behavior; last_seen_at
-- is the same build-freshness/heartbeat datum the Access surface already reads),
-- the category CASE, the v_cap detail window, the no-silent-caps truncation flag.
-- The row now also carries last_sign_in_at, last_seen_at, and last_active_at
-- separately so the auth stamp is still available and nothing is hidden.
--
-- DEPENDS ON: member_presence + record_presence (0055-member-presence.sql), a
-- committed sibling migration that applies before this file in lane order. The
-- LATERAL join reads that table directly; it is guaranteed present at runtime.
--
-- IDEMPOTENT: CREATE OR REPLACE FUNCTION; safe to re-run every lane pass.

CREATE OR REPLACE FUNCTION public.admin_signup_metrics()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_caller     uuid := auth.uid();
  v_authorized boolean;
  v_result     jsonb;
  v_cap        int := 500;   -- newest-N detail rows; summary still counts ALL
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'admin_signup_metrics: not authenticated'
      USING ERRCODE = '28000';
  END IF;

  -- Gate FIRST (SECURITY DEFINER bypasses RLS -- this is the only thing standing
  -- between a caller and auth.users). Membership in poe-family = governor circle.
  SELECT EXISTS (
    SELECT 1
      FROM instance_members im
      JOIN instances i ON i.id = im.instance_id
     WHERE im.user_id = v_caller
       AND i.slug = 'poe-family'
  ) INTO v_authorized;

  IF NOT v_authorized THEN
    RAISE EXCEPTION 'admin_signup_metrics: not authorized (poe-family governors only)'
      USING ERRCODE = '42501';
  END IF;

  -- accounts: one row per auth user, joined to its PRIMARY (non-church-preferred)
  -- membership + that instance, PLUS its newest presence heartbeat across every
  -- instance it belongs to. A user with no membership row still appears
  -- ('unprovisioned'); a user with no presence row falls back to the auth stamp.
  WITH accounts AS (
    SELECT
      u.id                               AS user_id,
      u.email                            AS email,
      u.created_at                       AS created_at,
      u.last_sign_in_at                  AS last_sign_in_at,   -- auth stamp (last authentication)
      pres.last_seen_at                  AS last_seen_at,       -- real activity heartbeat (may be NULL)
      -- EFFECTIVE last-active: the later of "last authenticated" and "last seen
      -- in the app". GREATEST ignores NULLs, so this is last_sign_in_at when no
      -- presence row exists, and the live heartbeat once one does. THIS is the
      -- recency the surface shows -- it reflects real use, not just re-auth.
      GREATEST(u.last_sign_in_at, pres.last_seen_at) AS last_active_at,
      (u.email_confirmed_at IS NOT NULL) AS email_confirmed,
      im.display_name                    AS display_name,
      im.role                            AS role,
      im.joined_at                       AS joined_at,
      i.slug                             AS instance_slug,
      i.instance_type                    AS instance_type,
      CASE
        WHEN i.slug = 'poe-family'      THEN 'family'
        WHEN i.instance_type = 'church' THEN 'church'
        WHEN i.slug LIKE 'u-%'          THEN 'self-serve'
        WHEN i.id IS NULL               THEN 'unprovisioned'
        ELSE 'other'
      END                                AS category
    FROM auth.users u
    LEFT JOIN LATERAL (
      SELECT im2.instance_id, im2.role, im2.display_name, im2.joined_at
        FROM instance_members im2
        JOIN instances i2 ON i2.id = im2.instance_id
       WHERE im2.user_id = u.id
       ORDER BY (i2.instance_type = 'church') ASC, im2.joined_at ASC
       LIMIT 1
    ) im ON true
    LEFT JOIN instances i ON i.id = im.instance_id
    LEFT JOIN LATERAL (
      -- newest heartbeat across ALL of this user's instances (self-serve users
      -- heartbeat in their own `u-*` instance; family/church in theirs).
      SELECT max(mp.last_seen_at) AS last_seen_at
        FROM member_presence mp
       WHERE mp.user_id = u.id
    ) pres ON true
  ),
  agg AS (
    SELECT
      count(*) AS total,
      jsonb_build_object(
        'total_accounts',     count(*),
        'self_serve_signups', count(*) FILTER (WHERE category = 'self-serve'),
        'family_members',     count(*) FILTER (WHERE category = 'family'),
        'church_members',     count(*) FILTER (WHERE category = 'church'),
        'other',              count(*) FILTER (WHERE category = 'other'),
        'unprovisioned',      count(*) FILTER (WHERE category = 'unprovisioned'),
        'signups_7d',         count(*) FILTER (WHERE created_at >= now() - interval '7 days'),
        'signups_30d',        count(*) FILTER (WHERE created_at >= now() - interval '30 days'),
        -- Active + returned now ride the EFFECTIVE last-active (real use), so the
        -- tiles agree with the per-row "last active" text.
        'active_7d',          count(*) FILTER (WHERE last_active_at >= now() - interval '7 days'),
        'returned',           count(*) FILTER (WHERE last_active_at IS NOT NULL
                                                  AND last_active_at > created_at + interval '5 minutes'),
        'never_returned',     count(*) FILTER (WHERE last_active_at IS NULL
                                                  OR last_active_at <= created_at + interval '5 minutes')
      ) AS summary
    FROM accounts
  ),
  detail AS (
    SELECT coalesce(
      jsonb_agg(to_jsonb(s) ORDER BY s.created_at DESC NULLS LAST),
      '[]'::jsonb
    ) AS signups
    FROM (
      SELECT * FROM accounts ORDER BY created_at DESC NULLS LAST LIMIT v_cap
    ) s
  )
  SELECT jsonb_build_object(
    'generated_at',      now(),
    'summary',           agg.summary,
    'signups',           detail.signups,
    'signups_shown',     least(agg.total, v_cap),
    'signups_truncated', (agg.total > v_cap)   -- no silent caps (DR-0076)
  )
  INTO v_result
  FROM agg, detail;

  RETURN v_result;
END;
$$;

-- Least privilege, unchanged from 0055/0076: no PUBLIC execute; authenticated may
-- attempt the call, the in-function poe-family gate is the real authorization.
REVOKE ALL ON FUNCTION public.admin_signup_metrics() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_signup_metrics() TO authenticated;

NOTIFY pgrst, 'reload schema';
