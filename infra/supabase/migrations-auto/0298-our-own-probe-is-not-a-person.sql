-- =============================================================================
-- 0298 — our own probe is not a person (DR-1075)
-- =============================================================================
-- Darrell, 2026-10-16, looking at the Admin roster: "(555) 555-0100 · signs in
-- by phone / account created 1mo ago · active, last active today ... Who or
-- what is this account? What is it doing daily?!!! Bot?!!!"
--
-- IT IS OURS. `.github/workflows/nas-health.yml` signs that account up through
-- the app's REAL signup shape and then signs it IN, every 6 hours
-- (cron '23 */6 * * *'), to prove a real person can still create an account and
-- sign in on the live site. It exists because of 2026-08-19, when "can't reach
-- our service" and "same PIN doesn't work" were true and nothing was watching.
-- 555-0100 is in the block the NANP reserves for fiction, so it can never be a
-- real person's number.
--
-- WHAT WAS WRONG. `admin_signup_metrics` (0076) counts every row of auth.users
-- with no exception, so our own robot was one of the governor's "31 accounts"
-- and one of the "7 active (7d)" — four sign-ins a day, forever. Every number
-- on that panel was inflated by an instrument of ours, and the only reason
-- anybody found out is that the roster showed a phone number nobody
-- recognized. DR-1072 named this exact failure on the visitor surface the same
-- day: "counting our own instruments as visitors is the most flattering lie
-- this surface could tell."
--
-- 0139 ALREADY TRIED TO FIX IT, AND COULD NOT. It deleted this account, calling
-- it "the signup-witness's one deletable side effect" — but the witness runs on
-- a clock, so the account comes back within six hours. A delete cannot win
-- against a cron. The probe has to be NAMED instead of removed.
--
-- WHAT THIS DOES
--   · a new category, 'our-probe', for the accounts the probe owns;
--   · every PEOPLE count excludes it — total_accounts, self_serve_signups,
--     signups_7d/30d, active_7d, returned, never_returned;
--   · a new count, 'our_probes', so the number is VISIBLE rather than
--     vanished. A surface that silently drops rows is its own kind of lie;
--   · the row STAYS in the detail list, so the roster still shows it — now
--     labelled as ours. Hiding it would mean the next person to look asks the
--     same question with no answer on the page.
--
-- NARROW ON PURPOSE. One literal address, named here with the workflow that
-- creates it. A rule like "any 555-01xx" would quietly swallow a real test
-- account somebody else makes, and a promise this file cannot keep is worse
-- than the gap. If a second probe is ever added, these become rows in a table.
--
-- BUILT ON 0257, NOT 0076 -- and that correction was the replay-order guard's,
-- not mine. The first draft of this file took 0076 as the ancestor and would
-- have SILENTLY REVERTED everything 0257 added: the member_presence join that
-- makes "active now" true, the spaces count, and the ranked membership that
-- makes the family outrank a person's own space (Darrell, 2026-10-09: "Doesn't
-- show the member has arrived based on the label after switching Christyn to
-- family... End to end!!!"). A replay would have restored the older definition
-- and nobody would have seen it happen. This file is now 0257's function with
-- a category added and the counts filtered -- nothing else moves.

CREATE OR REPLACE FUNCTION, same RETURNS shape (jsonb).
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
  -- The site-health witness's own account (.github/workflows/nas-health.yml).
  v_probe      text := '15555550100@phone.poetech.us';
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
        -- OURS, FIRST: before any other test, so a probe that somehow gains a
        -- membership row can never be counted as a member of anything.
        WHEN u.email = v_probe          THEN 'our-probe'
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
  -- PEOPLE, which is what every tile on that panel claims to be counting.
  people AS (
    SELECT * FROM accounts WHERE category <> 'our-probe'
  ),
  agg AS (
    SELECT
      (SELECT count(*) FROM accounts) AS total,   -- the detail cap compares to ALL rows
      jsonb_build_object(
        'total_accounts',     (SELECT count(*) FROM people),
        'self_serve_signups', (SELECT count(*) FROM people WHERE category = 'self-serve'),
        'family_members',     (SELECT count(*) FROM people WHERE category = 'family'),
        'church_members',     (SELECT count(*) FROM people WHERE category = 'church'),
        'other',              (SELECT count(*) FROM people WHERE category = 'other'),
        'unprovisioned',      (SELECT count(*) FROM people WHERE category = 'unprovisioned'),
        -- Visible, never vanished: how many of the rows below are ours.
        'our_probes',         (SELECT count(*) FROM accounts WHERE category = 'our-probe'),
        'signups_7d',         (SELECT count(*) FROM people WHERE created_at >= now() - interval '7 days'),
        'signups_30d',        (SELECT count(*) FROM people WHERE created_at >= now() - interval '30 days'),
        'active_7d',          (SELECT count(*) FROM people WHERE last_active_at >= now() - interval '7 days'),
        'returned',           (SELECT count(*) FROM people WHERE last_active_at IS NOT NULL
                                                  AND last_active_at > created_at + interval '5 minutes'),
        'never_returned',     (SELECT count(*) FROM people WHERE last_active_at IS NULL
                                                  OR last_active_at <= created_at + interval '5 minutes')
      ) AS summary
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
