-- =============================================================================
-- 0056 — fix infinite-recursion in the `instances` RLS policy (2026-06-30)
-- =============================================================================
-- LIVE-DB INCIDENT, found by adversarial RLS probe during the data-isolation
-- audit (2026-06-30). A SELECT on `instances` returns, on the live cloud DB:
--
--   { "code": "42P17", "message":
--     "infinite recursion detected in policy for relation \"instances\"" }  HTTP 500
--
-- Reproduced as BOTH the anon role and a freshly-provisioned authenticated
-- stranger. It is FAIL-CLOSED (the query errors; it returns ZERO rows, so no
-- data leaks), and the React app never does `.from('instances')` directly, so
-- no shipped surface is broken today. But it is a real defect: any future read
-- of `instances` 500s, and a green static guard (DR-0060) cannot see it because
-- that guard only checks that RLS is ENABLED, never that a policy EXECUTES.
--
-- ROOT CAUSE — schema-v2.1-infra.sql defines, on `instances`:
--   CREATE POLICY instances_parent_chain_read ON instances FOR SELECT
--     USING ( user_in_instance(id)
--             OR user_in_instance(parent_instance_id)
--             OR id IN (SELECT parent_instance_id FROM instances   -- <-- self-ref
--                        WHERE user_in_instance(id)) );
-- A policy ON `instances` whose USING subquery SELECTs FROM `instances`
-- re-evaluates the same policy set → Postgres aborts with 42P17.
-- (`user_in_instance()` is SECURITY DEFINER over instance_members, so IT is not
-- the cause — only the `SELECT ... FROM instances` subquery is.)
--
-- FIX — express the same three read intents WITHOUT a self-referential subquery:
--   1. read your own instance                         -> user_in_instance(id)
--   2. trust member reads a child/operating instance  -> user_in_instance(parent_instance_id)
--   3. child member reads the parent (trust) row      -> user_in_child_instance(id)
-- Intent (3) moves into a SECURITY DEFINER helper. Because the helper runs as
-- the table owner, its inner read of `instances` BYPASSES RLS (owner is exempt
-- unless FORCE RLS), so there is no policy recursion — the same mechanism that
-- already makes user_in_instance() safe.
--
-- LEAK-SAFE (verified by reasoning, mirrors the live probe that will re-run
-- after apply): a stranger in their own instance reads ONLY their own row —
--   * user_in_instance(own.id)            = true   -> own row visible
--   * user_in_instance(poe-family.id)     = false  -> family row INVISIBLE
--   * parent_instance_id IS NULL          -> user_in_instance(NULL) = false
--   * user_in_child_instance(poe-family)  = false  (stranger owns no child of it)
-- No clause widens visibility beyond membership in the instance, its parent, or
-- its children — exactly the original intent, minus the recursion.
--
-- Idempotent: DROP POLICY IF EXISTS + CREATE OR REPLACE. Per DR-0011 this is a
-- NEW migration that supersedes the v2.1 policy, never a rewrite of the landed
-- base schema.
-- =============================================================================

BEGIN;

-- Non-recursive helper for read-intent (3): "am I a member of an instance whose
-- parent is p_parent?" SECURITY DEFINER -> the inner SELECT on instances runs as
-- owner and does not re-trigger the instances RLS policy.
CREATE OR REPLACE FUNCTION public.user_in_child_instance(p_parent uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM instances c
      JOIN instance_members m ON m.instance_id = c.id
     WHERE c.parent_instance_id = p_parent
       AND m.user_id = auth.uid()
  )
$$;

GRANT EXECUTE ON FUNCTION public.user_in_child_instance(uuid) TO authenticated;

-- Replace BOTH historical SELECT policies on instances with ONE non-recursive
-- policy carrying all three read intents. (Dropping instances_member_read too
-- avoids leaving two overlapping policies; the single policy is a strict OR of
-- the same conditions.)
DROP POLICY IF EXISTS instances_parent_chain_read ON instances;
DROP POLICY IF EXISTS instances_member_read       ON instances;

CREATE POLICY instances_member_read ON instances FOR SELECT
  USING (
    user_in_instance(id)
    OR user_in_instance(parent_instance_id)
    OR user_in_child_instance(id)
  );

COMMIT;

-- =============================================================================
-- Verify after apply (the audit re-runs exactly this):
--   As anon OR any authenticated user:
--     GET /rest/v1/instances?select=slug  -> HTTP 200 (no longer 42P17/500)
--   As a non-family stranger: the result contains ONLY their own u-<uid> row,
--     never 'poe-family' / 'colg'.
-- =============================================================================
