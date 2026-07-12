-- =====================================================================
-- 0095-instance-id-index-coverage.sql
--
-- Scalability hardening for the pooled multi-tenant backend (the "PoeTech
-- is the backend for every business AND every church" decision, DR-0179).
--
-- Every RLS policy on a tenant-scoped table is effectively
-- `... AND instance_id = <mine>` on EVERY query (the user_in_instance(instance_id)
-- USING clause). The #1 documented multi-tenant performance killer is a MISSING
-- index on that RLS-filtered column: without an index whose LEADING column is
-- instance_id, every read is a sequential scan and the shared backend degrades
-- tenant-by-tenant as data grows -- exactly the wrong failure mode as sister/
-- brother ministries multiply the tenant count (the church-door factory).
--
-- 34 instance-scoped tables carried no instance_id-leading index. This adds one
-- for each (idempotent; IF NOT EXISTS). tenancy-guard.mjs Check E now REQUIRES
-- this coverage, so a new tenant table can never again ship un-indexed.
-- Validated by the 2025 Supabase/RLS scale guidance (index the RLS column;
-- make instance_id the leading column of the index).
-- =====================================================================

BEGIN;

CREATE INDEX IF NOT EXISTS book_products_instance_idx                  ON book_products (instance_id);
CREATE INDEX IF NOT EXISTS checkout_intents_instance_idx              ON checkout_intents (instance_id);
CREATE INDEX IF NOT EXISTS choir_sermon_documents_instance_idx        ON choir_sermon_documents (instance_id);
CREATE INDEX IF NOT EXISTS church_service_segment_actuals_instance_idx ON church_service_segment_actuals (instance_id);
CREATE INDEX IF NOT EXISTS church_service_segments_instance_idx       ON church_service_segments (instance_id);
CREATE INDEX IF NOT EXISTS clinician_assignments_instance_idx         ON clinician_assignments (instance_id);
CREATE INDEX IF NOT EXISTS conflict_checks_instance_idx               ON conflict_checks (instance_id);
CREATE INDEX IF NOT EXISTS cross_instance_signals_instance_idx        ON cross_instance_signals (instance_id);
CREATE INDEX IF NOT EXISTS cycle_items_instance_idx                   ON cycle_items (instance_id);
CREATE INDEX IF NOT EXISTS family_snapshots_instance_idx              ON family_snapshots (instance_id);
CREATE INDEX IF NOT EXISTS giving_reconciliations_instance_idx        ON giving_reconciliations (instance_id);
CREATE INDEX IF NOT EXISTS intake_handoffs_instance_idx               ON intake_handoffs (instance_id);
CREATE INDEX IF NOT EXISTS interactions_instance_idx                  ON interactions (instance_id);
CREATE INDEX IF NOT EXISTS invoices_instance_idx                      ON invoices (instance_id);
CREATE INDEX IF NOT EXISTS maintenance_requests_instance_idx          ON maintenance_requests (instance_id);
CREATE INDEX IF NOT EXISTS matter_counsel_instance_idx                ON matter_counsel (instance_id);
CREATE INDEX IF NOT EXISTS matter_documents_instance_idx              ON matter_documents (instance_id);
CREATE INDEX IF NOT EXISTS matter_financial_links_instance_idx        ON matter_financial_links (instance_id);
CREATE INDEX IF NOT EXISTS matter_journal_instance_idx                ON matter_journal (instance_id);
CREATE INDEX IF NOT EXISTS matter_key_dates_instance_idx              ON matter_key_dates (instance_id);
CREATE INDEX IF NOT EXISTS matter_parties_instance_idx                ON matter_parties (instance_id);
CREATE INDEX IF NOT EXISTS ministries_instance_idx                    ON ministries (instance_id);
CREATE INDEX IF NOT EXISTS ministry_signups_instance_idx              ON ministry_signups (instance_id);
CREATE INDEX IF NOT EXISTS notification_channels_instance_idx         ON notification_channels (instance_id);
CREATE INDEX IF NOT EXISTS notification_preferences_instance_idx      ON notification_preferences (instance_id);
CREATE INDEX IF NOT EXISTS notifications_instance_idx                 ON notifications (instance_id);
CREATE INDEX IF NOT EXISTS recurring_obligations_instance_idx         ON recurring_obligations (instance_id);
CREATE INDEX IF NOT EXISTS rent_payments_instance_idx                 ON rent_payments (instance_id);
CREATE INDEX IF NOT EXISTS renter_household_members_instance_idx      ON renter_household_members (instance_id);
CREATE INDEX IF NOT EXISTS review_cycles_instance_idx                 ON review_cycles (instance_id);
CREATE INDEX IF NOT EXISTS subscriptions_instance_idx                 ON subscriptions (instance_id);
CREATE INDEX IF NOT EXISTS time_logs_instance_idx                     ON time_logs (instance_id);
CREATE INDEX IF NOT EXISTS volunteer_hours_instance_idx               ON volunteer_hours (instance_id);
CREATE INDEX IF NOT EXISTS workflow_state_instance_idx                ON workflow_state (instance_id);

COMMIT;

-- =====================================================================
-- End of 0095-instance-id-index-coverage.sql
-- =====================================================================
