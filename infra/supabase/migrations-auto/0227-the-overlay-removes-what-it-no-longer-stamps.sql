-- =============================================================================
-- 0227 -- the overlay removes what it no longer stamps
-- =============================================================================
-- THE MEASUREMENT (2026-09-23). 0226 dropped viewer_readonly_insert / update /
-- delete from push_subscriptions on the retired hosted side at 19:40:37Z
-- (db-migrate run 35910766350: "DROP POLICY" x3, ledger row written). At
-- 20:00Z the parity line STILL named the same three policies as hosted-only,
-- and a direct read of hosted's pg_policies at 20:05Z listed all three.
--
-- WHY. db-migrate dispatches the rls-isolation matrix after every apply, and
-- its viewer-readonly leg replays 0125 -> 0126 -> ... -> 0181 -> 0190 against
-- the SAME database, "idempotent". 0125's text defines the overlay WITHOUT
-- push_subscriptions in its participation list (the table did not exist yet)
-- and runs it -- so it stamps the three policies onto push_subscriptions.
-- 0181 and 0190 then redefine the overlay with push_subscriptions excluded
-- and run it again, but the overlay only ever CREATES on the tables it loops
-- over; it never removes from a table it has since excluded. The leg ran at
-- 19:41Z, sixty seconds after 0226, and put the three back. It will do the
-- same after every future apply. A DROP in a migration cannot win against a
-- proof that re-runs the old CREATE a minute later.
--
-- THE FIX, at the source of truth. The overlay itself now finishes by
-- removing viewer_readonly_* from every participation table it excludes, so
-- the LAST definition to run in any replay leaves the excluded tables clean --
-- whatever an earlier text stamped on them a moment before. The sweep is
-- generic (every participation table, not just push_subscriptions) so the
-- class cannot recur when the list grows. The body is otherwise 0190's,
-- verbatim: the same seven participation tables (the lineage test pins the
-- list as a superset of every earlier definition) and 0126's capability
-- predicate. The rls-isolation viewer-readonly leg lists this file last, so
-- the leg's own replay ends on the sweeping definition.
--
-- The sovereign box already lacks the three (it ran the current overlay from
-- the start); there this is a no-op. On hosted it is the removal that stays
-- removed, after which the post-repoint schema verdict can read GO.
--
-- DEPENDS ON: 0125, 0126, 0181, 0190. IDEMPOTENT.
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
    EXECUTE format('DROP POLICY IF EXISTS viewer_readonly_insert ON public.%I', r.tbl);
    EXECUTE format(
      'CREATE POLICY viewer_readonly_insert ON public.%I AS RESTRICTIVE FOR INSERT TO authenticated '
      || 'WITH CHECK (%s)', r.tbl, v_pred);
    EXECUTE format('DROP POLICY IF EXISTS viewer_readonly_update ON public.%I', r.tbl);
    EXECUTE format(
      'CREATE POLICY viewer_readonly_update ON public.%I AS RESTRICTIVE FOR UPDATE TO authenticated '
      || 'USING (%s) WITH CHECK (%s)', r.tbl, v_pred, v_pred);
    EXECUTE format('DROP POLICY IF EXISTS viewer_readonly_delete ON public.%I', r.tbl);
    EXECUTE format(
      'CREATE POLICY viewer_readonly_delete ON public.%I AS RESTRICTIVE FOR DELETE TO authenticated '
      || 'USING (%s)', r.tbl, v_pred);
    n := n + 1;
  END LOOP;

  -- THE SWEEP (0227): an excluded table carries none of these policies, no
  -- matter which earlier definition stamped them a moment ago. Only tables
  -- that exist are touched; DROP ... IF EXISTS makes the rest a no-op.
  FOREACH p IN ARRAY participation LOOP
    IF to_regclass('public.' || p) IS NOT NULL THEN
      EXECUTE format('DROP POLICY IF EXISTS viewer_readonly_insert ON public.%I', p);
      EXECUTE format('DROP POLICY IF EXISTS viewer_readonly_update ON public.%I', p);
      EXECUTE format('DROP POLICY IF EXISTS viewer_readonly_delete ON public.%I', p);
    END IF;
  END LOOP;
  RETURN n;
END
$$;

SELECT public.apply_viewer_readonly_overlay();

NOTIFY pgrst, 'reload schema';
