-- =============================================================================
-- 0078 — usage flow SERIES: the historical layer over usage_events (DR-0102).
-- The 0073 aggregate answers "what is used"; this answers "how has use MOVED,
-- day by day" so the steward can review user behavior and system behavior
-- against the historical markers (decisions, incidents) that explain a change.
-- =============================================================================
-- SAME TRUST MODEL AS 0073 (DATA-AS-EMPOWERMENT-NOT-EXTRACTION):
--   - SOVEREIGN: rows stay on the family's own Supabase; nothing egresses.
--   - AGGREGATE-ONLY TO THE GOVERNOR: per-day COUNTS (views, distinct users)
--     via a SECURITY DEFINER function gated to poe-family — never another
--     person's individual rows. Reviewing flow to serve, never a spyglass.
--   - NO ENGAGEMENT-FARMING: history exists to pair behavior change with the
--     platform change that caused it, not to optimize time-on-app.
--
-- HONESTY: the series covers EVERY day in the window via generate_series — a
-- day with zero events returns a real measured zero (the absence of use is a
-- measurement), and the surface never has to invent gap days client-side.
--
-- DEPENDS ON: 0073 (usage_events + the poe-family gate pattern).
-- IDEMPOTENT: CREATE OR REPLACE / REVOKE+GRANT re-run clean.

CREATE OR REPLACE FUNCTION public.usage_flow_series(days_in int DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_caller     uuid := auth.uid();
  v_authorized boolean;
  v_days       int := greatest(1, least(coalesce(days_in, 30), 365));
  v_since      date;
  v_result     jsonb;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'usage_flow_series: not authenticated' USING ERRCODE = '28000';
  END IF;
  SELECT EXISTS (
    SELECT 1 FROM instance_members im
      JOIN instances i ON i.id = im.instance_id
     WHERE im.user_id = v_caller AND i.slug = 'poe-family'
  ) INTO v_authorized;
  IF NOT v_authorized THEN
    RAISE EXCEPTION 'usage_flow_series: not authorized (poe-family governors only)' USING ERRCODE = '42501';
  END IF;

  -- Window = the last v_days calendar days (UTC), today included.
  v_since := (now() AT TIME ZONE 'utc')::date - (v_days - 1);

  WITH days AS (
    SELECT d::date AS day
      FROM generate_series(v_since, (now() AT TIME ZONE 'utc')::date, interval '1 day') AS d
  ),
  ev AS (
    SELECT (at AT TIME ZONE 'utc')::date AS day, owner
      FROM usage_events
     WHERE kind = 'view' AND at >= v_since::timestamptz
  ),
  per_day AS (
    SELECT day, count(*)::int AS views, count(DISTINCT owner)::int AS users
      FROM ev GROUP BY day
  )
  SELECT jsonb_build_object(
    'generated_at', now(),
    'window_days',  v_days,
    'days', coalesce(
      (SELECT jsonb_agg(jsonb_build_object(
                'day',   to_char(days.day, 'YYYY-MM-DD'),
                'views', coalesce(per_day.views, 0),
                'users', coalesce(per_day.users, 0)
              ) ORDER BY days.day)
         FROM days LEFT JOIN per_day ON per_day.day = days.day),
      '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.usage_flow_series(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.usage_flow_series(int) TO authenticated;

NOTIFY pgrst, 'reload schema';
