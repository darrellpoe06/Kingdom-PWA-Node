-- =============================================================================
-- 0257 — THE FAMILY OUTRANKS THE PERSON'S OWN SPACE ON THE SIGNUPS LIST
-- =============================================================================
-- Darrell, 2026-10-09, after making Christyn family from the signups row
-- (DR-0829): "Doesn't show the member has arrived based on the label after
-- switching Christyn to family... End to end!!!!!!!!!"
--
-- WHAT WAS WRONG (0079, admin_signup_metrics): each account's category came
-- from ONE membership, chosen by `ORDER BY (church) ASC, joined_at ASC` — the
-- EARLIEST space the person joined. Every self-serve signup joins their own
-- `u-*` space on day one, so a family membership granted later could never
-- win: the row kept reading PUBLIC SIGNUP and the family tile never moved,
-- however many times the list was refreshed.
--
-- WHAT CHANGES: the membership that names the account is chosen by WHAT the
-- space is, then by when it was joined: poe-family first, then a church, then
-- any other named space (a business), and the person's own `u-*` space last.
-- Nothing else moves: the governor gate, the privacy posture, the presence
-- join, the tiles, the detail cap and the truncation flag are 0079's.
--
-- IDEMPOTENT: CREATE OR REPLACE FUNCTION, same RETURNS shape (jsonb).
-- =============================================================================

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

  -- Gate FIRST (SECURITY DEFINER bypasses RLS). Membership in poe-family = governor circle.
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

  WITH accounts AS (
    SELECT
      u.id                               AS user_id,
      u.email                            AS email,
      u.created_at                       AS created_at,
      u.last_sign_in_at                  AS last_sign_in_at,
      pres.last_seen_at                  AS last_seen_at,
      GREATEST(u.last_sign_in_at, pres.last_seen_at) AS last_active_at,
      (u.email_confirmed_at IS NOT NULL) AS email_confirmed,
      im.display_name                    AS display_name,
      im.role                            AS role,
      im.joined_at                       AS joined_at,
      i.slug                             AS instance_slug,
      i.instance_type                    AS instance_type,
      im.spaces                          AS spaces,            -- how many spaces hold this account
      CASE
        WHEN i.slug = 'poe-family'      THEN 'family'
        WHEN i.instance_type = 'church' THEN 'church'
        WHEN i.slug LIKE 'u-%'          THEN 'self-serve'
        WHEN i.id IS NULL               THEN 'unprovisioned'
        ELSE 'other'
      END                                AS category
    FROM auth.users u
    LEFT JOIN LATERAL (
      -- THE MEMBERSHIP THAT NAMES THE ACCOUNT: by what the space is, then by
      -- when it was joined. The family wins over everything; a person's own
      -- self-serve space never outranks a space somebody granted them.
      SELECT im2.instance_id, im2.role, im2.display_name, im2.joined_at,
             count(*) OVER () AS spaces
        FROM instance_members im2
        JOIN instances i2 ON i2.id = im2.instance_id
       WHERE im2.user_id = u.id
       ORDER BY
         CASE
           WHEN i2.slug = 'poe-family'      THEN 0
           WHEN i2.instance_type = 'church' THEN 1
           WHEN i2.slug LIKE 'u-%'          THEN 3
           ELSE 2
         END ASC,
         im2.joined_at ASC
       LIMIT 1
    ) im ON true
    LEFT JOIN instances i ON i.id = im.instance_id
    LEFT JOIN LATERAL (
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
    'signups_truncated', (agg.total > v_cap)
  )
  INTO v_result
  FROM agg, detail;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_signup_metrics() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_signup_metrics() TO authenticated;

NOTIFY pgrst, 'reload schema';
