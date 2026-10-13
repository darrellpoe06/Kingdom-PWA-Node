-- =============================================================================
-- 0235 — the migration ledger the app shows is the live database's own (DR-0622)
-- =============================================================================
-- Measured 2026-09-24 by the first system-flow-proof run (36059041587): on the
-- database the app reads, public._schema_migrations holds 151 rows and its
-- newest applied_at is 2026-08-19 — the repoint day. Every migration since
-- lands through the sovereign replay (infra/nas-supabase/replay_migrations.sh),
-- which records itself in public._sovereign_replay, never in
-- _schema_migrations. So the Quality & Throughput board's migration panel,
-- which reads schema_migrations_health() (0060), showed a ledger frozen at the
-- repoint while forty-odd migrations had since reached the live database: the
-- surface told the governor the wrong thing (COMPREHENSIVE-REVIEW-STANDARD
-- dimension 3).
--
-- Same gate, same RETURNS jsonb, same shape. When the live database carries
-- the sovereign ledger it is the one read (every row an applied migration, by
-- file name); where it does not (the retired hosted project), the original
-- ledger is read exactly as before. `ledger` names which one was read, so the
-- panel can say so.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.schema_migrations_health()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_caller     uuid := auth.uid();
  v_authorized boolean;
  v_sovereign  boolean;
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
     WHERE table_schema = 'public' AND table_name = '_sovereign_replay'
  ) INTO v_sovereign;

  IF v_sovereign THEN
    -- The live database's own ledger: one row per applied migration file.
    EXECUTE $q$
      SELECT jsonb_build_object(
        'ledger_initialized', true,
        'ledger', '_sovereign_replay',
        'summary', jsonb_build_object('applied', count(*), 'failed', 0, 'total', count(*)),
        'last_applied_at', max(applied_at),
        'failed', '[]'::jsonb,
        'migrations', COALESCE((
          SELECT jsonb_agg(jsonb_build_object('filename', m.fname, 'status', 'applied', 'applied_at', m.applied_at) ORDER BY m.applied_at DESC, m.fname DESC)
            FROM (SELECT fname, applied_at FROM public._sovereign_replay ORDER BY applied_at DESC, fname DESC LIMIT 100) m
        ), '[]'::jsonb)
      )
      FROM public._sovereign_replay
    $q$ INTO v_result;
    RETURN v_result;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = '_schema_migrations'
  ) INTO v_has_ledger;
  IF NOT v_has_ledger THEN
    RETURN jsonb_build_object(
      'ledger_initialized', false,
      'ledger', 'none',
      'summary', jsonb_build_object('applied', 0, 'failed', 0, 'total', 0),
      'last_applied_at', NULL,
      'failed', '[]'::jsonb,
      'migrations', '[]'::jsonb
    );
  END IF;

  SELECT jsonb_build_object(
    'ledger_initialized', true,
    'ledger', '_schema_migrations',
    'summary', jsonb_build_object(
      'applied', count(*) FILTER (WHERE status = 'applied'),
      'failed',  count(*) FILTER (WHERE status = 'failed'),
      'total',   count(*)
    ),
    'last_applied_at', max(applied_at) FILTER (WHERE status = 'applied'),
    'failed', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'filename', filename, 'applied_at', applied_at, 'last_error', last_error
             ) ORDER BY filename)
        FROM public._schema_migrations WHERE status = 'failed'
    ), '[]'::jsonb),
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
    'ledger', '_schema_migrations',
    'summary', jsonb_build_object('applied', 0, 'failed', 0, 'total', 0),
    'last_applied_at', NULL, 'failed', '[]'::jsonb, 'migrations', '[]'::jsonb
  ));
END;
$$;

REVOKE ALL ON FUNCTION public.schema_migrations_health() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.schema_migrations_health() TO authenticated;

NOTIFY pgrst, 'reload schema';
