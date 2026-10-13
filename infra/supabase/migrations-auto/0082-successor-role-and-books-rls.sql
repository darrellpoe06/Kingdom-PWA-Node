-- =============================================================================
-- 0082 — the SUCCESSOR role + role-gated RLS on the core books (DR-0111)
-- =============================================================================
-- Declared by Darrell 2026-07-06. Two things, one migration, because a code
-- review of the succession work uncovered that they are the same gap:
--
--   1. THE SUCCESSOR ROLE. A steward-in-training being raised to take over SEES
--      the real books but cannot change them (lib/relationships.js: finance.view
--      ALLOW, finance.manage DENY). This is the DB half of that contract.
--
--   2. A CHILD-SAFETY FIX the review surfaced. The core books tables (accounts,
--      transactions, debts, entities, projects) were created in schema-v1 with
--      RLS that gates read/insert/update on user_in_tenant(tenant_id) — pure
--      MEMBERSHIP, any role — later renamed to user_in_instance(instance_id) by
--      schema-v2.1. NO migration ever re-gated them by role. But migration 0055
--      added the 'child' role as a real instance_members row, and FamilyRoster
--      promises "a minor... walled out of the family financials by row-level
--      security." That promise was NOT enforced on these tables: because a child
--      is a member, user_in_instance() returned true, so a child could READ and
--      even INSERT/UPDATE the books at the DB layer. The client never renders the
--      finance surfaces to a child, but a client gate is not a data gate
--      (DR-0074). This migration makes the data gate real.
--
-- THE CHANGE IS MINIMAL-BLAST BY DESIGN. It changes exactly two roles and leaves
-- every other role's current behavior identical:
--   • child      — was: read + insert + update (via membership). now: NONE.
--                  (Matches the promised child-safety; closes the exposure.)
--   • successor  — new role. read: YES. insert/update/delete: NO. (Read-only.)
--   • owner/admin/member/viewer/specialist — UNCHANGED: read + insert + update as
--     today; delete still owner/admin.
-- Expressed as role predicates (not an allow-list rewrite) precisely so no
-- existing role's access shifts as a side effect:
--   read   USING  role_in_instance <> 'child'                 (successor reads; child out)
--   write  CHECK  role_in_instance NOT IN ('child','successor') (child + successor cannot write)
-- user_role_in_instance() returns NULL for a non-member; NULL <> 'child' and
-- NULL NOT IN (...) are NULL -> treated as false in a policy, so a non-member is
-- still excluded (no-leak preserved).
--
-- VERIFICATION NOTE (DR-0076 / DR-0074): the policy logic here is verified
-- statically against the current policy definitions (schema-v1 DO-loop, unchanged
-- through 0081). The confirming step is an adversarial LIVE RLS test — service
-- role vs. a child's own path vs. a successor's own path, exact row counts —
-- which must be run against the real instance after this deploys. That live test
-- is the DR-0111 re-review item; this migration is the fix it verifies.
--
-- DEPENDS ON: schema-v1 (the books tables + policies), schema-v2.1-infra
--             (user_role_in_instance, instance_id rename), 0055 (child role).
-- IDEMPOTENT: DROP-then-CREATE policies; guarded constraint swap. Additive,
--             family-internal, no anon. Forward-only (DR-0011: new migration,
--             never a rewrite of a landed one).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. Add 'successor' to the instance_members role CHECK (re-replaces 0055's).
-- ---------------------------------------------------------------------------
ALTER TABLE instance_members DROP CONSTRAINT IF EXISTS instance_members_role_check;
ALTER TABLE instance_members ADD CONSTRAINT instance_members_role_check CHECK (
  role IN ('owner','admin','member','viewer','specialist','child','successor')
);

-- ---------------------------------------------------------------------------
-- 1. Re-gate the core books tables by ROLE. One DO-loop, same shape as the
--    schema-v1 loop it replaces, but role-aware: child walled out, successor
--    read-only, everyone else unchanged.
-- ---------------------------------------------------------------------------
DO $books_rls$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['entities','accounts','transactions','debts','projects'] LOOP
    -- Only touch tables that actually exist with an instance_id column (guards a
    -- fresh/partial DB so the migration never aborts the lane).
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = t AND column_name = 'instance_id'
    ) THEN
      -- READ: every member EXCEPT a child (so a successor reads; a child cannot).
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_member_read', t);
      EXECUTE format(
        'CREATE POLICY %I ON %I FOR SELECT TO authenticated USING (user_role_in_instance(instance_id) <> ''child'')',
        t || '_member_read', t);

      -- INSERT: members who may WRITE (not child, not successor); own rows only.
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_member_insert', t);
      EXECUTE format(
        'CREATE POLICY %I ON %I FOR INSERT TO authenticated WITH CHECK (user_role_in_instance(instance_id) NOT IN (''child'',''successor'') AND created_by = auth.uid())',
        t || '_member_insert', t);

      -- UPDATE: same write set (not child, not successor).
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_member_update', t);
      EXECUTE format(
        'CREATE POLICY %I ON %I FOR UPDATE TO authenticated USING (user_role_in_instance(instance_id) NOT IN (''child'',''successor''))',
        t || '_member_update', t);

      -- DELETE: unchanged — owner/admin only (was owner; admin folded in for parity
      -- with the newer relationship tables' delete gate).
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_owner_delete', t);
      EXECUTE format(
        'CREATE POLICY %I ON %I FOR DELETE TO authenticated USING (user_role_in_instance(instance_id) IN (''owner'',''admin''))',
        t || '_owner_delete', t);
    END IF;
  END LOOP;
END $books_rls$;
