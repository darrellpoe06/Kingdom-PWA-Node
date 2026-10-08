-- =============================================================================
-- 0253 — which shipped FUNCTIONS have actually been tried
-- =============================================================================
-- Darrell 2026-10-08: "Are there metrics for my family for their use of the
-- PoeTech App and other builds to see if they are testing and using evaluating
-- the functions based on the use so we can streamline our process for testing
-- these applications."
--
-- WHAT WAS MISSING, MEASURED. 0073 records usage as kind='view' with the tab's
-- id, and usage_flow_metrics filters `kind = 'view'`. So the question the app
-- could answer was "which TABS were opened", and the question it could not
-- answer at all was "has anyone ever exercised the camera window, the reader's
-- pitch, the remote pointer, the recorder". A tab count cannot tell a steward
-- whether a shipped function was ever tried, which is exactly the testing
-- question. 0073 left the door open for it in its own comment: "kind text NOT
-- NULL DEFAULT 'view' -- 'view' (a tab opened); room for more later".
--
-- SO: no new table, no new column. The app records kind='use' with the
-- function's name, and this function rolls those up. Because the 0073 RPC
-- filters kind='view', every existing tab number is untouched by this.
--
-- THE TRUST MODEL IS 0073's, UNCHANGED AND RE-STATED:
--   - sovereign: the rows live on the family's own Supabase, never a third
--     party, never sold;
--   - owned by the person: the 0073 insert/select/delete policies still apply,
--     so each person reads and DELETES their own trail and a deleted trail is
--     honestly gone;
--   - this function returns COUNTS and DISTINCT-PEOPLE counts only. It never
--     returns a name, an id or a person's row. Per-person usage already has
--     its own decided road (0145 user_usage_metrics, steward-gated); this one
--     deliberately does not duplicate it, because the question here is about
--     the FUNCTION, not about the person.
--   - governor gate: poe-family, the same gate as 0073 and 0055.
--
-- IDEMPOTENT: CREATE OR REPLACE only.

CREATE INDEX IF NOT EXISTS usage_events_kind_name_idx ON usage_events (kind, name);

CREATE OR REPLACE FUNCTION public.feature_use_metrics(days_in int DEFAULT 90)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_caller     uuid := auth.uid();
  v_authorized boolean;
  v_days       int := greatest(1, least(coalesce(days_in, 90), 730));
  v_since      timestamptz;
  v_result     jsonb;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'feature_use_metrics: not authenticated' USING ERRCODE = '28000';
  END IF;
  SELECT EXISTS (
    SELECT 1 FROM instance_members im
      JOIN instances i ON i.id = im.instance_id
     WHERE im.user_id = v_caller AND i.slug = 'poe-family'
  ) INTO v_authorized;
  IF NOT v_authorized THEN
    RAISE EXCEPTION 'feature_use_metrics: not authorized (poe-family governors only)' USING ERRCODE = '42501';
  END IF;

  v_since := now() - make_interval(days => v_days);

  WITH ev AS (
    SELECT name, owner, at FROM usage_events WHERE kind = 'use' AND at >= v_since
  ),
  per_feature AS (
    SELECT name,
           count(*)::int             AS c,
           count(DISTINCT owner)::int AS u,
           max(at)                    AS last_at
      FROM ev GROUP BY name
  )
  SELECT jsonb_build_object(
    'generated_at', now(),
    'window_days',  v_days,
    'total_uses',   (SELECT count(*)::int FROM ev),
    'people',       (SELECT count(DISTINCT owner)::int FROM ev),
    'features', coalesce(
      (SELECT jsonb_agg(jsonb_build_object(
                 'name', name, 'count', c, 'people', u, 'last_at', last_at
               ) ORDER BY c DESC) FROM per_feature),
      '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.feature_use_metrics(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.feature_use_metrics(int) TO authenticated;

NOTIFY pgrst, 'reload schema';
