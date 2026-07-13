-- =============================================================================
-- 0100 — the ASSISTANT role + the assistant wall on the core books (DR-0060/0074)
-- =============================================================================
-- Declared by Darrell 2026-07-13: "make sure assistants can't see the owner's
-- data ... options to allow assistants [to] see what we want in our businesses.
-- Never our personal data, business data etc." An ASSISTANT (a 1099 executive /
-- marketing assistant) operates a scoped set of WORK surfaces the owner CHECKS on
-- (lib/relationships.js ASSISTANT_CAPABILITY_POLICY + use-assistant-access.js) and
-- is WALLED OFF from the owner's world. relationships.js is the model half; this
-- migration is the DB half — the load-bearing data gate (DR-0074: a client gate
-- is not a data gate), exactly as 0082 made the child wall real.
--
-- THE CHANGE IS MINIMAL-BLAST BY DESIGN — the same shape as 0082, one role added:
--   • assistant  — NEW role. On the core books (entities, accounts, transactions,
--                  debts, projects): read NO, insert/update NO. Walled off from
--                  the owner's personal + business FINANCIAL data, like a child.
--                  (What an assistant DOES reach — the scoped CRM / referral /
--                  inbound work surfaces the owner checked on — lives on other
--                  tables and is the additive next slice; THIS migration is the
--                  never-see-the-books guarantee Darrell named.)
--   • child / successor / owner / admin / member / viewer / specialist — UNCHANGED.
-- Expressed as role predicates (not an allow-list rewrite) so no existing role's
-- access shifts as a side effect:
--   read   USING  role_in_instance NOT IN ('child','assistant')             (successor still reads; child + assistant out)
--   write  CHECK  role_in_instance NOT IN ('child','successor','assistant')
-- user_role_in_instance() returns NULL for a non-member; NULL NOT IN (...) is NULL
-- -> false in a policy, so a non-member stays excluded (no-leak preserved).
--
-- VERIFICATION (DR-0076): the wall is statically proven by
-- scripts/assistant-wall-guard.mjs (run in the required `app — lint + vitest`
-- check via assistant-wall-noleak.test.js) — the build FAILS if a books read/write
-- policy stops excluding 'assistant'. The confirming step is an adversarial LIVE
-- RLS test (service role vs. an assistant's own path, exact row counts = 0 on the
-- books) run against the real instance after deploy — the DR-0111 re-review item
-- this migration is the fix for.
--
-- DEPENDS ON: schema-v1 (books tables + policies), schema-v2.1-infra
--             (user_role_in_instance), 0055 (child role), 0082 (successor role +
--             the role-gated books policies this re-gates).
-- IDEMPOTENT: DROP-then-CREATE policies; guarded constraint swap. Additive,
--             family-internal, no anon. Forward-only (DR-0011: new migration,
--             never a rewrite of a landed one).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. Add 'assistant' to the instance_members role CHECK (re-replaces 0082's).
-- ---------------------------------------------------------------------------
ALTER TABLE instance_members DROP CONSTRAINT IF EXISTS instance_members_role_check;
ALTER TABLE instance_members ADD CONSTRAINT instance_members_role_check CHECK (
  role IN ('owner','admin','member','viewer','specialist','child','successor','assistant')
);

-- ---------------------------------------------------------------------------
-- 1. Re-gate the core books tables: the assistant is walled out of read + write,
--    the same DO-loop shape as 0082 with 'assistant' added to each exclusion.
-- ---------------------------------------------------------------------------
DO $assistant_books_rls$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['entities','accounts','transactions','debts','projects'] LOOP
    -- Only touch tables that actually exist with an instance_id column (guards a
    -- fresh/partial DB so the migration never aborts the lane).
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = t AND column_name = 'instance_id'
    ) THEN
      -- READ: every member EXCEPT a child or an assistant (successor still reads).
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_member_read', t);
      EXECUTE format(
        'CREATE POLICY %I ON %I FOR SELECT TO authenticated USING (user_role_in_instance(instance_id) NOT IN (''child'',''assistant''))',
        t || '_member_read', t);

      -- INSERT: writers only (not child, successor, or assistant); own rows.
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_member_insert', t);
      EXECUTE format(
        'CREATE POLICY %I ON %I FOR INSERT TO authenticated WITH CHECK (user_role_in_instance(instance_id) NOT IN (''child'',''successor'',''assistant'') AND created_by = auth.uid())',
        t || '_member_insert', t);

      -- UPDATE: same write set (not child, successor, or assistant).
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_member_update', t);
      EXECUTE format(
        'CREATE POLICY %I ON %I FOR UPDATE TO authenticated USING (user_role_in_instance(instance_id) NOT IN (''child'',''successor'',''assistant''))',
        t || '_member_update', t);

      -- DELETE: unchanged — owner/admin only.
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_owner_delete', t);
      EXECUTE format(
        'CREATE POLICY %I ON %I FOR DELETE TO authenticated USING (user_role_in_instance(instance_id) IN (''owner'',''admin''))',
        t || '_owner_delete', t);
    END IF;
  END LOOP;
END $assistant_books_rls$;
