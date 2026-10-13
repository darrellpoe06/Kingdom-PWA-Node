-- =============================================================================
-- 0145 — per-person usage for the stewards: what does my son use the most?
-- =============================================================================
-- Darrell 2026-08-23: "what does my son like to use the most so we can make it
-- better... where are my usage reports for which users to ask to help with
-- whatever." The 0073/usage_flow_metrics design was deliberately AGGREGATE-
-- ONLY ("never any one person's activity") — a posture the platform chose,
-- not one the Governor decided. DR-0094's correction governs here too: the
-- platform does not make the family's governance decisions for it. The
-- Governor has now decided: the stewards of a space may see a member's
-- most-used views, to serve them better and to know whom to ask for help.
--
-- Kept from 0073, unchanged: each person still owns their trail and may
-- delete it (their delete policy stands — a deleted trail is honestly gone);
-- the surface states plainly that stewards can see per-person usage (the old
-- "never any one person's activity" copy is corrected — DR-0100).
CREATE OR REPLACE FUNCTION public.user_usage_metrics(target_user uuid, days_in int DEFAULT 30)
RETURNS TABLE (name text, views bigint, last_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'user_usage_metrics: not authenticated';
  END IF;
  -- The steward rule (0142's shared-space family): the caller must be an
  -- owner/admin of SOME space the target belongs to. NULL-safe by EXISTS.
  IF NOT EXISTS (
    SELECT 1
      FROM instance_members a
      JOIN instance_members b ON a.instance_id = b.instance_id
     WHERE a.user_id = auth.uid() AND a.role IN ('owner','admin')
       AND b.user_id = target_user
  ) THEN
    RAISE EXCEPTION 'user_usage_metrics: only a steward of one of their spaces can see a member''s usage';
  END IF;
  RETURN QUERY
    SELECT ue.name, count(*)::bigint AS views, max(ue.at) AS last_at
      FROM usage_events ue
     WHERE ue.owner = target_user
       AND ue.kind = 'view'
       AND ue.at > now() - make_interval(days => GREATEST(1, LEAST(days_in, 365)))
     GROUP BY ue.name
     ORDER BY views DESC, last_at DESC
     LIMIT 20;
END;
$$;
REVOKE ALL ON FUNCTION public.user_usage_metrics(uuid, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_usage_metrics(uuid, int) TO authenticated;

NOTIFY pgrst, 'reload schema';
