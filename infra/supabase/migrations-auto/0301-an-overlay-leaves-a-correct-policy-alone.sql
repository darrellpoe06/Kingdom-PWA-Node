-- =============================================================================
-- 0301 — an overlay leaves a correct policy alone (DR-1090)
-- =============================================================================
-- MEASURED 2026-10-17: the rls-isolation poe-properties leg has died on every
-- run since 2026-10-14 with "out of shared memory / max_locks_per_transaction",
-- at 0154's call to apply_assistant_scope_overlay(), creating
-- assistant_scope_update ON public.legal_documents (runs 38991878844,
-- 38858142629, 38811929364). The overlay was not wrong; it was blind. Every
-- call dropped and re-created four RESTRICTIVE policies on EVERY instance-scoped
-- table (233 of them), and each DROP/CREATE takes an ACCESS EXCLUSIVE lock held
-- to COMMIT. 21 migrations in that leg call the overlay; every new table made
-- one call heavier, until one transaction needed more lock slots than the
-- server has. The same work runs on every db-migrate that re-runs an overlay,
-- each time locking every table the family, the businesses and the church use.
--
-- WHAT THIS DOES. Both overlays now compare first and touch only what differs.
-- A policy that already exists with the same command, the same RESTRICTIVE
-- kind, the same role and the same expressions is left alone (no lock). A
-- missing, stale or hand-edited policy is dropped and re-created exactly as
-- before. "The same expressions" is decided by Postgres, not by string
-- guessing: the wanted predicate is planted once on a session-local probe
-- table and deparsed, and the live policy is deparsed the same way, so the two
-- texts are equal only when the expressions are.
--
-- WHAT DOES NOT CHANGE. The predicates, the RESTRICTIVE kind, the role
-- (authenticated), all four (assistant) and three (viewer) verbs, the
-- assistant allowlist (0130, seven tables), the viewer participation list
-- (0125 + 0181 + 0190, seven tables), the DR-0242 capability checklist (0126)
-- and the 0227 sweep. The return type stays integer: the number of tables
-- covered, as before. Proven by tests/0301-overlay-leaves-correct-alone-smoke.sql.
-- =============================================================================

-- The deparsed form of a predicate, as Postgres stores a policy built from it.
-- Planted on a temporary probe table (session-local, dropped at commit), so
-- nothing real is locked.
CREATE OR REPLACE FUNCTION public.overlay_canonical_expr(p_expr text)
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v text;
BEGIN
  IF p_expr IS NULL THEN
    RETURN NULL;
  END IF;
  CREATE TEMP TABLE IF NOT EXISTS overlay_probe (instance_id uuid) ON COMMIT DROP;
  DROP POLICY IF EXISTS overlay_probe_expr ON pg_temp.overlay_probe;
  EXECUTE format('CREATE POLICY overlay_probe_expr ON pg_temp.overlay_probe USING (%s)', p_expr);
  SELECT pg_get_expr(pol.polqual, pol.polrelid) INTO v
    FROM pg_policy pol
   WHERE pol.polrelid = 'pg_temp.overlay_probe'::regclass
     AND pol.polname = 'overlay_probe_expr';
  DROP POLICY overlay_probe_expr ON pg_temp.overlay_probe;
  RETURN v;
END
$$;

-- True when public.<tbl> already carries policy <pol> exactly as the overlay
-- would build it: RESTRICTIVE, for <cmd>, to authenticated only, with the
-- given deparsed USING and WITH CHECK expressions (NULL = absent).
CREATE OR REPLACE FUNCTION public.overlay_policy_is(
  p_tbl text, p_pol text, p_cmd "char", p_using text, p_check text)
RETURNS boolean
LANGUAGE sql STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM pg_policy pol
      JOIN pg_class c ON c.oid = pol.polrelid
      JOIN pg_namespace ns ON ns.oid = c.relnamespace
     WHERE ns.nspname = 'public'
       AND c.relname = p_tbl
       AND pol.polname = p_pol
       AND pol.polcmd = p_cmd
       AND pol.polpermissive = false
       AND pol.polroles = ARRAY[(SELECT oid FROM pg_roles WHERE rolname = 'authenticated')]::oid[]
       AND pg_get_expr(pol.polqual, pol.polrelid) IS NOT DISTINCT FROM p_using
       AND pg_get_expr(pol.polwithcheck, pol.polrelid) IS NOT DISTINCT FROM p_check
  );
$$;

-- -----------------------------------------------------------------------------
-- The assistant overlay (0130), comparing first.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.apply_assistant_scope_overlay()
RETURNS integer
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  r record;
  n integer := 0;
  pred text := 'public.user_role_in_instance(instance_id) IS DISTINCT FROM ''assistant''';
  canon text;
  -- The assistant's granted surface + the self-scoped participation tables
  -- (each still gated by its own self-scoped policies). Unchanged from 0130.
  allowed text[] := ARRAY[
    'office_records',         -- the granted workspace (the Assistant tab)
    'direct_messages',        -- DM a leader (users_can_dm still gates)
    'group_messages',         -- speak in a group they were placed in
    'family_messages',        -- legacy DM rail (self/recipient-scoped)
    'feedback',               -- an assistant may always send feedback
    'usage_events',           -- their own telemetry
    'user_instance_settings'  -- their own per-instance settings row
  ];
BEGIN
  canon := public.overlay_canonical_expr(pred);
  FOR r IN
    SELECT c.relname AS tbl
      FROM pg_class c
      JOIN pg_namespace ns ON ns.oid = c.relnamespace
      JOIN pg_attribute a  ON a.attrelid = c.oid
                          AND a.attname = 'instance_id'
                          AND NOT a.attisdropped
     WHERE ns.nspname = 'public'
       AND c.relkind = 'r'
       AND c.relrowsecurity
       AND a.atttypid = 'uuid'::regtype
       AND NOT (c.relname = ANY (allowed))
  LOOP
    IF NOT public.overlay_policy_is(r.tbl, 'assistant_scope_select', 'r', canon, NULL) THEN
      EXECUTE format('DROP POLICY IF EXISTS assistant_scope_select ON public.%I', r.tbl);
      EXECUTE format(
        'CREATE POLICY assistant_scope_select ON public.%I AS RESTRICTIVE FOR SELECT TO authenticated '
        || 'USING (%s)', r.tbl, pred);
    END IF;
    IF NOT public.overlay_policy_is(r.tbl, 'assistant_scope_insert', 'a', NULL, canon) THEN
      EXECUTE format('DROP POLICY IF EXISTS assistant_scope_insert ON public.%I', r.tbl);
      EXECUTE format(
        'CREATE POLICY assistant_scope_insert ON public.%I AS RESTRICTIVE FOR INSERT TO authenticated '
        || 'WITH CHECK (%s)', r.tbl, pred);
    END IF;
    IF NOT public.overlay_policy_is(r.tbl, 'assistant_scope_update', 'w', canon, canon) THEN
      EXECUTE format('DROP POLICY IF EXISTS assistant_scope_update ON public.%I', r.tbl);
      EXECUTE format(
        'CREATE POLICY assistant_scope_update ON public.%I AS RESTRICTIVE FOR UPDATE TO authenticated '
        || 'USING (%s) WITH CHECK (%s)', r.tbl, pred, pred);
    END IF;
    IF NOT public.overlay_policy_is(r.tbl, 'assistant_scope_delete', 'd', canon, NULL) THEN
      EXECUTE format('DROP POLICY IF EXISTS assistant_scope_delete ON public.%I', r.tbl);
      EXECUTE format(
        'CREATE POLICY assistant_scope_delete ON public.%I AS RESTRICTIVE FOR DELETE TO authenticated '
        || 'USING (%s)', r.tbl, pred);
    END IF;
    n := n + 1;
  END LOOP;
  RETURN n;
END;
$$;

-- -----------------------------------------------------------------------------
-- The viewer overlay (0125 -> 0126 -> 0181 -> 0190 -> 0227), comparing first.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.apply_viewer_readonly_overlay()
RETURNS integer
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  r record;
  n integer := 0;
  v_area text;
  v_pred text;
  canon text;
  canon_by_pred jsonb := '{}'::jsonb;
  p text;
  -- Self-scoped participation tables a read-only guest may still write to
  -- (their OWN rows, gated by each table's own self-scoped policies).
  -- EVERY entry from every earlier definition, kept (0125 + 0181 + 0190).
  participation text[] := ARRAY[
    'direct_messages',        -- send a DM to a leader (users_can_dm still gates)
    'group_messages',         -- speak in a group they were placed in
    'family_messages',        -- legacy family DM rail (self/recipient-scoped)
    'feedback',               -- a guest may always send feedback
    'usage_events',           -- their own telemetry
    'user_instance_settings', -- their own per-instance settings row
    'push_subscriptions'      -- their own devices: opting IN, and always OUT (0181)
  ];
BEGIN
  FOR r IN
    SELECT c.relname AS tbl
      FROM pg_class c
      JOIN pg_namespace ns ON ns.oid = c.relnamespace
      JOIN pg_attribute a  ON a.attrelid = c.oid
                          AND a.attname = 'instance_id'
                          AND NOT a.attisdropped
     WHERE ns.nspname = 'public'
       AND c.relkind = 'r'
       AND c.relrowsecurity
       AND a.atttypid = 'uuid'::regtype
       AND NOT (c.relname = ANY (participation))
  LOOP
    -- The DR-0242 checklist (0126): an area-mapped table opens to a viewer
    -- who holds write:<area>; an unmapped table keeps the pure deny.
    v_area := public.capability_area(r.tbl);
    IF v_area IS NULL THEN
      v_pred := 'public.user_role_in_instance(instance_id) IS DISTINCT FROM ''viewer''';
    ELSE
      v_pred := format(
        '(public.user_role_in_instance(instance_id) IS DISTINCT FROM ''viewer'''
        || ' OR public.has_capability(instance_id, %L))', 'write:' || v_area);
    END IF;
    -- One probe per distinct predicate (one per area), not one per table.
    IF canon_by_pred ? v_pred THEN
      canon := canon_by_pred ->> v_pred;
    ELSE
      canon := public.overlay_canonical_expr(v_pred);
      canon_by_pred := canon_by_pred || jsonb_build_object(v_pred, canon);
    END IF;
    IF NOT public.overlay_policy_is(r.tbl, 'viewer_readonly_insert', 'a', NULL, canon) THEN
      EXECUTE format('DROP POLICY IF EXISTS viewer_readonly_insert ON public.%I', r.tbl);
      EXECUTE format(
        'CREATE POLICY viewer_readonly_insert ON public.%I AS RESTRICTIVE FOR INSERT TO authenticated '
        || 'WITH CHECK (%s)', r.tbl, v_pred);
    END IF;
    IF NOT public.overlay_policy_is(r.tbl, 'viewer_readonly_update', 'w', canon, canon) THEN
      EXECUTE format('DROP POLICY IF EXISTS viewer_readonly_update ON public.%I', r.tbl);
      EXECUTE format(
        'CREATE POLICY viewer_readonly_update ON public.%I AS RESTRICTIVE FOR UPDATE TO authenticated '
        || 'USING (%s) WITH CHECK (%s)', r.tbl, v_pred, v_pred);
    END IF;
    IF NOT public.overlay_policy_is(r.tbl, 'viewer_readonly_delete', 'd', canon, NULL) THEN
      EXECUTE format('DROP POLICY IF EXISTS viewer_readonly_delete ON public.%I', r.tbl);
      EXECUTE format(
        'CREATE POLICY viewer_readonly_delete ON public.%I AS RESTRICTIVE FOR DELETE TO authenticated '
        || 'USING (%s)', r.tbl, v_pred);
    END IF;
    n := n + 1;
  END LOOP;

  -- THE SWEEP (0227): an excluded table carries none of these policies, no
  -- matter which earlier definition stamped them a moment ago. A table is only
  -- touched when one of the three is actually there.
  FOREACH p IN ARRAY participation LOOP
    IF to_regclass('public.' || p) IS NOT NULL AND EXISTS (
         SELECT 1 FROM pg_policy pol
          WHERE pol.polrelid = to_regclass('public.' || p)
            AND pol.polname IN ('viewer_readonly_insert', 'viewer_readonly_update', 'viewer_readonly_delete')) THEN
      EXECUTE format('DROP POLICY IF EXISTS viewer_readonly_insert ON public.%I', p);
      EXECUTE format('DROP POLICY IF EXISTS viewer_readonly_update ON public.%I', p);
      EXECUTE format('DROP POLICY IF EXISTS viewer_readonly_delete ON public.%I', p);
    END IF;
  END LOOP;
  RETURN n;
END
$$;

-- Run both: on a database already in shape this changes nothing and locks no
-- table; anything stale is put right.
SELECT public.apply_assistant_scope_overlay();
SELECT public.apply_viewer_readonly_overlay();
