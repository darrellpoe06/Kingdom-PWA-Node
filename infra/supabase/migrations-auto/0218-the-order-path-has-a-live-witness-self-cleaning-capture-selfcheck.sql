-- =============================================================================
-- 0218 — The order path has a live witness: a self-cleaning capture self-check
-- =============================================================================
-- DR-0374: Sterling's Moore Divahs order was refused by the database for the
-- whole life of the door and NOBODY KNEW — crm_leads held zero rows and the only
-- reason it surfaced is that a customer told Shay. crm-pipeline-parity.test.js
-- now catches the JS<->SQL allowlist drift that caused it, at BUILD time. But a
-- build-time test cannot see a LIVE/deploy regression: the sovereign backend
-- missing a migration, an RLS/grant change, the RPC unreachable. That class is
-- exactly what stayed invisible for months. This is the outside-in witness
-- (DR-0125): site-health calls it against the REAL backend on its cadence and
-- knows the moment a real order would be refused again.
--
-- FAITHFUL AND SELF-CLEANING BY CONSTRUCTION.
--   * It does NOT re-implement the allowlist. A second copy of that registry is
--     the precise thing that cost Sterling (DR-0374). It calls the REAL
--     crm_capture_lead through the same path a customer's order takes.
--   * It leaves nothing behind. A PostgREST RPC is one transaction, so there is
--     no state in which a probe row survives: crm_capture_lead succeeds -> the
--     row is captured and DELETED in the same tx; crm_capture_lead RAISES (the
--     Sterling refusal) -> the EXCEPTION block catches it, the savepoint rolls
--     the insert back, and it returns ok:false with the reason. Nothing to
--     sweep, and never a seed row polluting Shay's numbers.
--   * It only ever touches the one row it just made (by the uuid crm_capture_lead
--     returns), never any real lead.
--
-- anon-callable, because the runner walks the app's own public path with the
-- anon key. Inert to abuse: every call is one insert + its own delete, no
-- persistent effect and no other row read or written.
--
-- DEPENDS ON: 0215 (crm_capture_lead carrying the moore-orders branch).
-- IDEMPOTENT: CREATE OR REPLACE.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.door_capture_selfcheck(p_instance_slug text, p_pipeline text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  v_id      uuid;
  v_deleted integer;
BEGIN
  -- Route through the REAL capture path (allowlist, instance pin, forced-safe
  -- insert) — never a copy of it. A refusal here is a refusal a customer gets.
  BEGIN
    v_id := crm_capture_lead(
      p_pipeline,
      p_instance_slug,
      jsonb_build_object(
        'name',              'site-health selfcheck',
        'source',            'site-health-selfcheck',
        'sourceDetail',      'automated order-path witness (DR-0398)',
        'consentOutreachOk', 'false'
      )
    );
  EXCEPTION WHEN OTHERS THEN
    -- crm_capture_lead raised (unknown pipeline / unknown instance). The
    -- block's savepoint rolls its insert back, so nothing was committed. This is
    -- the Sterling class: a real order would be refused, right now.
    RETURN jsonb_build_object('ok', false, 'stage', 'capture', 'detail', left(SQLERRM, 300));
  END;

  IF v_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'stage', 'capture', 'detail', 'crm_capture_lead returned null');
  END IF;

  -- Remove the row we just created. Same transaction, so the probe leaves
  -- nothing whether this commit lands or not.
  DELETE FROM crm_leads WHERE id = v_id;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  IF v_deleted <> 1 THEN
    RETURN jsonb_build_object('ok', false, 'stage', 'cleanup', 'detail', 'probe row not removed');
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$function$;

REVOKE ALL ON FUNCTION public.door_capture_selfcheck(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.door_capture_selfcheck(text, text) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
