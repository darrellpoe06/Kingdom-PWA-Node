-- =============================================================================
-- 0076 — fix admin_signup_metrics: row_to_jsonb() does not exist (42883)
-- =============================================================================
-- LIVE BUG (Darrell's screenshot, 2026-07-05): Admin → Users & usage shows
-- "Couldn't load platform signups: function row_to_jsonb(record) does not exist
-- (code 42883)". 0055-admin-signup-metrics.sql line 135 called row_to_jsonb(s) —
-- a function Postgres has never had (the real one is to_jsonb; row_to_json is the
-- json-typed sibling). The detail CTE therefore blew up at runtime for EVERY
-- caller, so the signups panel has been erroring since 0055 landed. The summary
-- half never ran either — same function, one body.
--
-- THE FIX: re-ship the function with jsonb_agg(to_jsonb(s) ...). Everything else
-- — the poe-family governor gate, the privacy posture (governance metadata only),
-- the category CASE, the v_cap detail window, the no-silent-caps truncation flag
-- (DR-0076) — is byte-for-byte the 0055 design. See 0055-admin-signup-metrics.sql
-- for the full rationale; this file exists only to correct the one bad call.
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

  -- Gate FIRST (SECURITY DEFINER bypasses RLS — this is the only thing standing
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
  -- membership + that instance. A user with no membership row (signed up but
  -- never provisioned an instance) still appears, category 'unprovisioned'.
  WITH accounts AS (
    SELECT
      u.id                               AS user_id,
      u.email                            AS email,
      u.created_at                       AS created_at,
      u.last_sign_in_at                  AS last_sign_in_at,
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
        'active_7d',          count(*) FILTER (WHERE last_sign_in_at >= now() - interval '7 days'),
        'returned',           count(*) FILTER (WHERE last_sign_in_at IS NOT NULL
                                                  AND last_sign_in_at > created_at + interval '5 minutes'),
        'never_returned',     count(*) FILTER (WHERE last_sign_in_at IS NULL
                                                  OR last_sign_in_at <= created_at + interval '5 minutes')
      ) AS summary
    FROM accounts
  ),
  detail AS (
    SELECT coalesce(
      -- THE FIX: to_jsonb(s), not row_to_jsonb(s) (42883 — no such function).
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

-- Least privilege, unchanged from 0055: no PUBLIC execute; authenticated may
-- attempt the call, the in-function poe-family gate is the real authorization.
REVOKE ALL ON FUNCTION public.admin_signup_metrics() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_signup_metrics() TO authenticated;

NOTIFY pgrst, 'reload schema';
