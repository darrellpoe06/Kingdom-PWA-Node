-- =============================================================================
-- ROLLBACK for migration 0334 (DR-1525). NOT applied by anything automatically:
-- infra/supabase/rollback/ is not read by db-migrate.yml or replay-on-clock.sh.
-- To roll back, copy this into migrations-auto/ under the next free number in
-- its own approved PR (the same road a migration takes), per
-- docs/05-financial-os/MONEY-MIGRATIONS-RUNBOOK.md.
--
-- 0334 added two read-only functions and nothing else (no table, no row, no
-- grant on data), so dropping them returns the database exactly to 0333. The
-- db-backup-receipt rider keeps writing its row harmlessly; the app's
-- money-readiness reader then reads "not confirmed", never "ready".
-- Proven by scripts/readiness-receipt-replay.sh (applies 0334, then this).
-- =============================================================================
DROP FUNCTION IF EXISTS public.money_readiness_receipt();
DROP FUNCTION IF EXISTS public.db_backup_receipt();
NOTIFY pgrst, 'reload schema';
