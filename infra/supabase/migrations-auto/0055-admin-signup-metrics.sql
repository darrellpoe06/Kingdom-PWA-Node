-- =============================================================================
-- 0055 — admin_signup_metrics: platform-wide signup visibility (Darrell 2026-06-29)
-- =============================================================================
-- Darrell's ask: "real people are creating accounts on poetech.us and I can't
-- see who or why." The Access & Usage surface (AccessUsageMetrics.jsx, PR #393)
-- answers WHO has access INSIDE an instance the steward belongs to — but it
-- reads through RLS, so it is structurally BLIND to the self-serve `u-*`
-- instances strangers create on sign-up (the steward is not a member of those
-- instances, so RLS hides them, by design — that same blindness is the privacy
-- guarantee). This function is the one deliberate cross-instance window that
-- lets the family GOVERNORS see the platform's signups without weakening the
-- per-instance isolation that keeps every account private.
--
-- WHY SECURITY DEFINER: counting signups means reading auth.users (email,
-- created_at, last_sign_in_at — which the authenticated role cannot read) and
-- reading instance_members ACROSS instances the caller is not a member of.
-- Both require elevated privilege. Because SECURITY DEFINER bypasses RLS, the
-- function does its OWN authorization check FIRST (DR-0060 tenancy-guard
-- pattern: judgment encoded as a gate, in the function, not assumed).
--
-- AUTHORIZATION = membership in the poe-family instance (ANY role). This is the
-- governor circle. Two facts make membership the correct gate (NOT owner/admin):
--   1. join_default_instance() (0012) admits the family allowlist to poe-family
--      with role 'member', so the PRINCIPALS (darrellpoe06@, mrspoe06@,
--      christina@) are 'member', not 'owner'/'admin'. An owner/admin-only gate
--      would lock Darrell out of his own platform metrics.
--   2. A stranger self-serve signup is NEVER a member of poe-family (they only
--      ever join their own `u-<uid>` instance). So "is a poe-family member" is
--      exactly "is in the trusted family/governor circle" — strangers excluded.
--
-- PRIVACY POSTURE (DATA-AS-EMPOWERMENT / QUALITY-OF-LIFE): this returns access
-- GOVERNANCE metadata only — email, display name, when they joined, when they
-- last signed in, which category of instance they own. It returns NO content,
-- NO financial/family/church data from any instance, NO per-person behavior.
-- It is the governor seeing "who walked in the front door," not surveillance.
--
-- ORDERING NOTE (the lane is currently RED at 0055-relationship-permissions.sql
-- — PR #398's maintenance_requests collides with the pre-existing schema-v2.2
-- table, so the migrate lane halts there on ON_ERROR_STOP). This file is named
-- to sort BEFORE that failing file ('admin' < 'relationship'), so psql applies
-- it ahead of the halt and this function reaches cloud even while the lane shows
-- failure. It depends ONLY on instances / instance_members / auth.users (all
-- present since schema-v1), never on anything 0055-relationship-permissions
-- creates. When #398's collision is fixed the lane goes green and ordering no
-- longer matters. (Reported separately; not silently rewritten here.)
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
      jsonb_agg(row_to_jsonb(s) ORDER BY s.created_at DESC NULLS LAST),
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

-- Least privilege: drop the implicit PUBLIC execute, grant only to the signed-in
-- client role. The in-function poe-family gate is the real authorization; the
-- grant just lets an authenticated session attempt the call.
REVOKE ALL ON FUNCTION public.admin_signup_metrics() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_signup_metrics() TO authenticated;

NOTIFY pgrst, 'reload schema';
