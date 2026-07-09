-- =============================================================================
-- 0073 — usage events: measure how the app is used, to make it BETTER (Darrell
-- 2026-07-04: "we have to know number of users... most used tab etc... use data
-- to get better trust"). This is DATA-TO-SERVE, not extract.
-- =============================================================================
-- THE TRUST MODEL (DATA-AS-EMPOWERMENT-NOT-EXTRACTION, read correctly):
--   - SOVEREIGN: the rows live on the family's own Supabase (the NAS), never a
--     third-party analytics cloud, never sold, never shared with an advertiser.
--   - OWNED BY THE PERSON: each event carries its owner; a person can read and
--     DELETE their own trail (RLS below). Deletion is immediate + verifiable.
--   - AGGREGATE-ONLY TO THE GOVERNOR: the steward sees COUNTS (most-used tabs,
--     active users, flow) via a SECURITY DEFINER function gated to poe-family —
--     NEVER another person's individual row. Measuring to improve, not a
--     spyglass on a person. This is the line the platform holds.
--   - NO ENGAGEMENT-FARMING: this exists to guide what we fix/build, not to
--     optimize addictive time-on-app against anyone's wellbeing.
--
-- IDEMPOTENT: IF NOT EXISTS / CREATE OR REPLACE / DROP POLICY IF EXISTS.

CREATE TABLE IF NOT EXISTS usage_events (
  id     bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  owner  uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  kind   text NOT NULL DEFAULT 'view',   -- 'view' (a tab opened); room for more later
  name   text NOT NULL,                  -- the view/tab id, e.g. 'tvtime'
  at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS usage_events_at_idx   ON usage_events (at DESC);
CREATE INDEX IF NOT EXISTS usage_events_name_idx ON usage_events (name);

ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;

-- You may record your own events, and read + delete YOUR OWN trail. There is NO
-- broad SELECT policy: no signed-in user (governor included) can read another
-- person's rows directly. The governor's view is the aggregate RPC below only.
DROP POLICY IF EXISTS usage_events_insert     ON usage_events;
CREATE POLICY usage_events_insert     ON usage_events FOR INSERT WITH CHECK (owner = auth.uid());
DROP POLICY IF EXISTS usage_events_select_own ON usage_events;
CREATE POLICY usage_events_select_own ON usage_events FOR SELECT USING (owner = auth.uid());
DROP POLICY IF EXISTS usage_events_delete_own ON usage_events;
CREATE POLICY usage_events_delete_own ON usage_events FOR DELETE USING (owner = auth.uid());

-- Aggregate flow metrics — governor-only (poe-family gate, same as
-- admin_signup_metrics 0055). Returns COUNTS ONLY (per-tab totals + distinct
-- users, active users, total views) — never an individual's rows.
CREATE OR REPLACE FUNCTION public.usage_flow_metrics(days_in int DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_caller     uuid := auth.uid();
  v_authorized boolean;
  v_days       int := greatest(1, least(coalesce(days_in, 30), 365));
  v_since      timestamptz;
  v_result     jsonb;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'usage_flow_metrics: not authenticated' USING ERRCODE = '28000';
  END IF;
  SELECT EXISTS (
    SELECT 1 FROM instance_members im
      JOIN instances i ON i.id = im.instance_id
     WHERE im.user_id = v_caller AND i.slug = 'poe-family'
  ) INTO v_authorized;
  IF NOT v_authorized THEN
    RAISE EXCEPTION 'usage_flow_metrics: not authorized (poe-family governors only)' USING ERRCODE = '42501';
  END IF;

  v_since := now() - make_interval(days => v_days);

  WITH ev AS (
    SELECT name, owner FROM usage_events WHERE kind = 'view' AND at >= v_since
  ),
  per_view AS (
    SELECT name, count(*)::int AS c, count(DISTINCT owner)::int AS u
      FROM ev GROUP BY name
  )
  SELECT jsonb_build_object(
    'generated_at', now(),
    'window_days',  v_days,
    'total_views',  (SELECT count(*)::int FROM ev),
    'active_users', (SELECT count(DISTINCT owner)::int FROM ev),
    'views', coalesce(
      (SELECT jsonb_agg(jsonb_build_object('name', name, 'count', c, 'users', u) ORDER BY c DESC) FROM per_view),
      '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.usage_flow_metrics(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.usage_flow_metrics(int) TO authenticated;

NOTIFY pgrst, 'reload schema';
