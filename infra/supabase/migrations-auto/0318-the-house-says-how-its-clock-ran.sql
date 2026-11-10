-- =============================================================================
-- 0318 — the house says how its clock ran (DR-1399, under DR-1360)
-- =============================================================================
-- Darrell 2026-11-10: "Why can't we do it another way. Same outcome. Don't
-- need anything because we designed it." 0317 turned the migration proof
-- outward. This turns the NAS's own scheduled work outward the same way.
--
-- Every 15-minute services-sync cycle, heartbeat.py (DR-1360) writes one row
-- into agent_inbox, tagged nas-heartbeat, from the NAS's own credential. From
-- DR-1399 that row also carries the PREVIOUS cycle's outcome: whether it
-- finished, and the NAMES of the services that failed or ran degraded (matched
-- from the public registry infra/nas-loops/services.json, never split out of
-- free text). Until now the only reader outside the house was loops-health.yml,
-- over the tailnet key that died on 2026-11-04, so for six days nothing outside
-- the house could say whether its clock was running.
--
-- This function lets anyone ask, over the public road the app uses
-- (poetech.us/sb with the anon key the site ships): when did the NAS last
-- write its heartbeat, how many services ride its clock, and how did the last
-- cycle go, by service name. It gives out timestamps, a count and service
-- names that are public in the repository. Not the host name, not a reason,
-- not any row's text: the body is parsed and only those fields are rebuilt,
-- each checked for its type and shape.
--
-- Only rows the NAS writes count (tag nas-heartbeat AND source nas-loops). A
-- member can append to agent_inbox, but only rows they own; the receipt names
-- that residual in DR-1399 rather than pretending it away.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.nas_heartbeat_receipt()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  r        record;
  b        jsonb;
  lc       jsonb;
  v_at     timestamptz;
  v_cyc_at timestamptz;
  v_failed jsonb;
  v_degr   jsonb;
BEGIN
  SELECT body, created_at INTO r
    FROM public.agent_inbox
   WHERE tags @> '["nas-heartbeat"]'::jsonb
     AND source = 'nas-loops'
   ORDER BY created_at DESC
   LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('seen', false);
  END IF;

  BEGIN
    b := r.body::jsonb;
  EXCEPTION WHEN others THEN
    b := NULL;
  END;
  IF b IS NULL OR jsonb_typeof(b) <> 'object' THEN
    RETURN jsonb_build_object('seen', true, 'at', r.created_at);
  END IF;

  BEGIN
    v_at := (b ->> 'at')::timestamptz;
  EXCEPTION WHEN others THEN
    v_at := NULL;
  END;

  lc := CASE WHEN jsonb_typeof(b -> 'last_cycle') = 'object' THEN b -> 'last_cycle' END;
  IF lc IS NOT NULL THEN
    BEGIN
      v_cyc_at := (lc ->> 'at')::timestamptz;
    EXCEPTION WHEN others THEN
      v_cyc_at := NULL;
    END;
    SELECT COALESCE(jsonb_agg(x ORDER BY x), '[]'::jsonb) INTO v_failed
      FROM (SELECT x FROM jsonb_array_elements_text(
              CASE WHEN jsonb_typeof(lc -> 'failed') = 'array' THEN lc -> 'failed' ELSE '[]'::jsonb END) AS t(x)
             WHERE x ~ '^[a-z0-9][a-z0-9-]{0,59}$' LIMIT 50) s;
    SELECT COALESCE(jsonb_agg(x ORDER BY x), '[]'::jsonb) INTO v_degr
      FROM (SELECT x FROM jsonb_array_elements_text(
              CASE WHEN jsonb_typeof(lc -> 'degraded') = 'array' THEN lc -> 'degraded' ELSE '[]'::jsonb END) AS t(x)
             WHERE x ~ '^[a-z0-9][a-z0-9-]{0,59}$' LIMIT 50) s;
  END IF;

  RETURN jsonb_strip_nulls(jsonb_build_object(
    'seen', true,
    'at', COALESCE(v_at, r.created_at),
    'services', CASE WHEN jsonb_typeof(b -> 'services') = 'number'
                     THEN LEAST(1000, GREATEST(-1, (b ->> 'services')::numeric))::int END,
    'last_cycle', CASE WHEN lc IS NULL THEN NULL ELSE jsonb_strip_nulls(jsonb_build_object(
      'at', v_cyc_at,
      'ok', CASE WHEN jsonb_typeof(lc -> 'ok') = 'boolean' THEN lc -> 'ok' END,
      'failed', v_failed,
      'degraded', v_degr
    )) END
  ));
END
$fn$;

REVOKE ALL ON FUNCTION public.nas_heartbeat_receipt() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.nas_heartbeat_receipt() TO anon, authenticated;

-- Receipt for this migration itself: the function answers with its shape.
DO $chk$
DECLARE r jsonb;
BEGIN
  r := public.nas_heartbeat_receipt();
  IF r IS NULL OR NOT (r ? 'seen') THEN
    RAISE EXCEPTION '0318: the heartbeat receipt did not answer';
  END IF;
END
$chk$;

NOTIFY pgrst, 'reload schema';
