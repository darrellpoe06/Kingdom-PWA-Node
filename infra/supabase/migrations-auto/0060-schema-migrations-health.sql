-- =============================================================================
-- 0060 — schema_migrations_health(): the in-app DB Health data source
-- =============================================================================
-- Surfaces the db-migrate ledger (public._schema_migrations, written by
-- scripts/db-migrate-apply.sh) to an in-app, family-gated Admin "DB Health"
-- panel so a governor can SEE what is applied / failed / when — schema state
-- verified from INSIDE the app, no shell, no Studio (DR-0084 §3, DR-0076).
--
-- WHY A SECURITY-DEFINER RPC (not a table read): the ledger table has RLS on
-- with NO policy — no client, family or not, reads it directly. This function
-- is the ONLY reader, and it gates to the poe-family governor circle FIRST,
-- exactly like admin_signup_metrics (0055-admin-signup-metrics.sql). It returns
-- migration filenames + status + timestamps ONLY — no schema contents, no data
-- from any instance. Governance metadata, not surveillance.
--
-- DEFENSIVE: if the ledger table does not exist yet (a DB that has never run the
-- resilient runner), returns an empty, well-formed result instead of erroring —
-- the panel then reads "ledger not initialized" rather than breaking.
--
-- IDEMPOTENT: CREATE OR REPLACE FUNCTION; safe to re-run every lane pass.
-- DEPENDS ON: instances / instance_members (schema-v1), _schema_migrations
--             (created by the runner; guarded here so order does not matter).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.schema_migrations_health()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_caller     uuid := auth.uid();
  v_authorized boolean;
  v_has_ledger boolean;
  v_result     jsonb;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'schema_migrations_health: not authenticated'
      USING ERRCODE = '28000';
  END IF;

  -- Gate FIRST (SECURITY DEFINER bypasses RLS). poe-family membership = governor.
  SELECT EXISTS (
    SELECT 1
      FROM instance_members im
      JOIN instances i ON i.id = im.instance_id
     WHERE im.user_id = v_caller
       AND i.slug = 'poe-family'
  ) INTO v_authorized;

  IF NOT v_authorized THEN
    RAISE EXCEPTION 'schema_migrations_health: not authorized (poe-family governors only)'
      USING ERRCODE = '42501';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = '_schema_migrations'
  ) INTO v_has_ledger;

  IF NOT v_has_ledger THEN
    RETURN jsonb_build_object(
      'ledger_initialized', false,
      'summary', jsonb_build_object('applied', 0, 'failed', 0, 'total', 0),
      'last_applied_at', NULL,
      'failed', '[]'::jsonb,
      'migrations', '[]'::jsonb
    );
  END IF;

  SELECT jsonb_build_object(
    'ledger_initialized', true,
    'summary', jsonb_build_object(
      'applied', count(*) FILTER (WHERE status = 'applied'),
      'failed',  count(*) FILTER (WHERE status = 'failed'),
      'total',   count(*)
    ),
    'last_applied_at', max(applied_at) FILTER (WHERE status = 'applied'),
    -- failed rows carry the error so the panel can show WHAT broke, honestly.
    'failed', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'filename', filename, 'applied_at', applied_at, 'last_error', last_error
             ) ORDER BY filename)
        FROM public._schema_migrations WHERE status = 'failed'
    ), '[]'::jsonb),
    -- newest applies first, capped so the payload stays small.
    'migrations', COALESCE((
      SELECT jsonb_agg(row_to_json(m) ORDER BY m.applied_at DESC)
        FROM (
          SELECT filename, status, applied_at
            FROM public._schema_migrations
           ORDER BY applied_at DESC
           LIMIT 100
        ) m
    ), '[]'::jsonb)
  )
  INTO v_result
  FROM public._schema_migrations;

  RETURN COALESCE(v_result, jsonb_build_object(
    'ledger_initialized', true,
    'summary', jsonb_build_object('applied', 0, 'failed', 0, 'total', 0),
    'last_applied_at', NULL, 'failed', '[]'::jsonb, 'migrations', '[]'::jsonb
  ));
END;
$$;

REVOKE ALL ON FUNCTION public.schema_migrations_health() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.schema_migrations_health() TO authenticated;

NOTIFY pgrst, 'reload schema';
