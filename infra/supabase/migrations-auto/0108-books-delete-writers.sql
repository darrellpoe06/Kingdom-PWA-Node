-- =============================================================================
-- 0108 — a WRITER can delete their own instance's books (fix the CRUD asymmetry)
-- =============================================================================
-- THE BUG THIS FIXES (Darrell + Christina, 2026-07-19, after a multi-hour hunt).
-- The books DELETE policy (set in 0082, kept in 0100) was owner/admin ONLY:
--     FOR DELETE USING (user_role_in_instance(instance_id) IN ('owner','admin'))
-- but INSERT and UPDATE allow every WRITER — NOT IN ('child','successor','assistant').
-- So a `member` (the role the family bookkeepers actually hold) could ADD and EDIT
-- transactions but could NOT DELETE them. Every "remove duplicates" / "reset account"
-- delete was a SILENT RLS NO-OP: PostgREST returns 0 rows and NO error for an
-- RLS-blocked delete, so the app removed the row from the on-screen list but the
-- CLOUD row survived and re-hydrated on the next refresh — the "duplicates come back
-- no matter how many times I clear them" bug. It was finally proven by REV-0136's
-- honest readout: "Removed 0 of 3034 from the cloud ledger" — 0 deleted, no error,
-- against valid CURRENT cloud primary keys = the RLS-block signature.
--
-- THE FIX (minimal, security-preserving). Make DELETE consistent with UPDATE: a role
-- that may EDIT a books row may also DELETE it — the same writer set,
-- NOT IN ('child','successor','assistant'). This does NOT widen the walls:
--   • child / successor / assistant stay excluded from DELETE (as from INSERT/UPDATE);
--   • tenancy isolation is untouched — user_role_in_instance() is per-instance, so a
--     writer can only ever delete rows in an instance they belong to (a non-member
--     gets NULL -> NULL NOT IN (...) is NULL -> false, so no cross-instance leak);
--   • READ / INSERT / UPDATE policies are NOT touched.
--
-- Same DO-loop shape + the same books tables as 0082/0100. Forward-only (DR-0011:
-- a new migration, never a rewrite of a landed one). Idempotent: DROP-then-CREATE
-- the delete policy; guarded so a fresh/partial DB never aborts the lane. Additive,
-- family-internal, no anon.
--
-- DEPENDS ON: schema-v1 (books tables + policies), schema-v2.1-infra
--             (user_role_in_instance), 0082 (the role-gated delete policy this
--             re-gates), 0100 (assistant role — still excluded here).
-- =============================================================================

DO $books_delete_writers$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['entities','accounts','transactions','debts','projects'] LOOP
    -- Only touch tables that actually exist with an instance_id column (guards a
    -- fresh/partial DB so the migration never aborts the lane).
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = t AND column_name = 'instance_id'
    ) THEN
      -- DELETE: the SAME writer set as UPDATE — a writer who can edit a row can delete
      -- it. child / successor / assistant stay excluded (they cannot write either).
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_owner_delete', t);
      EXECUTE format(
        'CREATE POLICY %I ON %I FOR DELETE TO authenticated USING (user_role_in_instance(instance_id) NOT IN (''child'',''successor'',''assistant''))',
        t || '_owner_delete', t);
    END IF;
  END LOOP;
END $books_delete_writers$;
