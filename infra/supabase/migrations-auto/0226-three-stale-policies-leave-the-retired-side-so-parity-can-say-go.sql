-- =============================================================================
-- 0226 -- three stale policies leave the retired side, so parity can say GO
-- =============================================================================
-- THE MEASUREMENT (nas-health run 35904661282, 2026-09-23 18:47Z, the first
-- parity line after 0225 replayed on the box -- ledger 231 applied):
--
--   cutover-sync: post-repoint {"go": false,
--     "schema_missing_by_name": {"rls_policies": [
--        "push_subscriptions.viewer_readonly_delete",
--        "push_subscriptions.viewer_readonly_insert",
--        "push_subscriptions.viewer_readonly_update"]}, ...}
--
-- Every table, function and trigger 0225 carried home is now present on the
-- sovereign box; these three policies are the whole remaining gap -- and they
-- are missing on the box because the box is RIGHT. 0181 added
-- push_subscriptions to apply_viewer_readonly_overlay()'s participation list
-- ("their own devices: opting IN, and always OUT"), so the overlay no longer
-- stamps viewer_readonly_* on that table. The box ran the current overlay and
-- correctly created none. The retired hosted side still carries the three
-- from an overlay run BEFORE 0181, because the overlay only creates and never
-- removes policies on a table it has since excluded.
--
-- Those three are not merely stale; on hosted they still ENFORCE the rule 0181
-- retired -- a viewer there cannot insert, update or delete their own
-- push_subscriptions row, which is exactly the opt-in/opt-out 0181 exists to
-- allow. Hosted is the retired backend (DR-0442), so no reader is hurt today;
-- the parity comparator is what notices, and it is right to.
--
-- THE FIX IS A DROP, NOT A CREATE. The source of truth is the overlay function
-- as 0181 left it; the box already matches it. This file removes the three
-- leftovers where they exist (hosted) and is a no-op where they do not (the
-- box), after which both sides agree and the post-repoint verdict can read GO
-- on the schema. The storage gap (DR-0317) is reported separately and is not
-- part of the schema verdict.
--
-- Nothing else on push_subscriptions is touched: its own four self-scoped
-- policies (push_subscriptions_read/insert/update/delete, auth.uid() =
-- user_id) and the assistant_scope_* overlay stay exactly as they are.
-- =============================================================================

DROP POLICY IF EXISTS viewer_readonly_insert ON public.push_subscriptions;
DROP POLICY IF EXISTS viewer_readonly_update ON public.push_subscriptions;
DROP POLICY IF EXISTS viewer_readonly_delete ON public.push_subscriptions;

NOTIFY pgrst, 'reload schema';
