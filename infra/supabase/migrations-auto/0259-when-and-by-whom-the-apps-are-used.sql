-- =============================================================================
-- 0259 — WHEN, AND BY WHOM, THE APPS ARE USED (DR-0843)
-- =============================================================================
-- Darrell, 2026-10-09: "How many times have users used the apps?... my son has
-- done 90% of the work of evaluation of apps he shows he should have more from
-- investing more on the platform... How many times a day and days
-- specifically... on a calendar for most used days Saturday or Mondays etc...
-- metrics for enhancement purposes."
--
-- usage_events (0073) already holds every tab open ('view') and every function
-- exercised ('use', DR-0819), per person, with the time. The aggregate
-- (usage_flow_metrics) answers WHICH tabs; the per-person read (0145) answers
-- which tabs for ONE member. Neither answers WHEN or HOW MUCH BY WHOM. This
-- function answers both in one read: per person, per day, per kind, a count,
-- for the governor circle only (the same poe-family gate as 0073 and 0079).
-- Counts only: no view names ride here, so the calendar says when and how
-- much and never what. Every person still owns and can delete their own trail.
--
-- IDEMPOTENT: CREATE OR REPLACE FUNCTION.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.usage_calendar_metrics(days_in int DEFAULT 90)
RETURNS TABLE (user_id uuid, day date, kind text, n bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_caller uuid := auth.uid();
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'usage_calendar_metrics: not authenticated' USING ERRCODE = '28000';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM instance_members im JOIN instances i ON i.id = im.instance_id
     WHERE im.user_id = v_caller AND i.slug = 'poe-family'
  ) THEN
    RAISE EXCEPTION 'usage_calendar_metrics: not authorized (poe-family governors only)' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
    SELECT ue.owner AS user_id, (ue.at AT TIME ZONE 'America/Chicago')::date AS day, ue.kind, count(*)::bigint AS n
      FROM usage_events ue
     WHERE ue.at > now() - make_interval(days => GREATEST(1, LEAST(days_in, 366)))
     GROUP BY ue.owner, (ue.at AT TIME ZONE 'America/Chicago')::date, ue.kind
     ORDER BY day DESC, n DESC;
END;
$$;
REVOKE ALL ON FUNCTION public.usage_calendar_metrics(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.usage_calendar_metrics(int) TO authenticated;
NOTIFY pgrst, 'reload schema';
