-- =============================================================================
-- 0190 — The viewer overlay keeps the checklist: a redefinition carries every
-- earlier exception (post-incident, DR-0347)
-- =============================================================================
-- FOUND 2026-09-10 by the rls-isolation matrix (leg viewer-readonly, smoke
-- 0126): "write:choir grant did not unlock the choir area". Red on main
-- since 0181 shipped (2026-09-06), before any of today's TLC work.
--
-- ROOT CAUSE. 0126 taught apply_viewer_readonly_overlay() the DR-0242
-- capability checklist: on an area-mapped table (capability_area) a viewer
-- passes when has_capability(instance_id, 'write:<area>') is true. 0181 then
-- redefined the SAME function to add one participation table
-- (push_subscriptions) — and did so from 0125's text, not 0126's, so the
-- capability predicate was dropped. Because every later migration re-runs
-- the overlay, production's viewer_readonly_* policies have been the pure
-- deny ever since: every "write:<area>" box an owner ticks for a guest has
-- been a lie on screen (verified live: choir_song_ideas.viewer_readonly_insert
-- = "user_role_in_instance(instance_id) IS DISTINCT FROM 'viewer'", no
-- has_capability). The tenancy guard's Check E only asks a redefinition to
-- keep RESTRICTIVE + 'viewer'; it never asked it to keep what 0126 added.
--
-- THE FIX. One definition that carries BOTH: 0126's capability predicate and
-- 0181's participation list (push_subscriptions included). Re-run, so the
-- live policies are rebuilt. The app-side gate that stops the class
-- (a redefinition must be a superset of every earlier one — participation
-- list AND the capability predicate) lives in
-- app/src/__tests__/viewer-overlay-lineage.test.js; proven-to-catch against
-- 0181's own body.
--
-- DEPENDS ON: 0125 (the overlay), 0126 (capability_area, has_capability,
-- never_unlockable_tables), 0181 (push_subscriptions). IDEMPOTENT.
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
  -- Self-scoped participation tables a read-only guest may still write to
  -- (their OWN rows, gated by each table's own self-scoped policies).
  -- EVERY entry from every earlier definition, kept (0125 + 0181).
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
  RETURN n;
END
$$;

SELECT public.apply_viewer_readonly_overlay();
SELECT public.apply_assistant_scope_overlay();

NOTIFY pgrst, 'reload schema';
