-- =============================================================================
-- 0245 REALTIME PUBLICATION SMOKE — every synced table tells open screens when
-- it changes (DR-0708)
-- =============================================================================
-- Run AFTER applying 0245, in a transaction that ROLLS BACK. PROVES: every
-- table the app syncs through lib/table-sync.js that exists on this database
-- is in the supabase_realtime publication, and the ledger (transactions) is
-- one of them. PROVEN-TO-CATCH: a table created inside this transaction and
-- left out of the publication is named by the same check, so the check can
-- see a gap (the publication itself is never altered here).
-- PASS prints 'REALTIME PUBLICATION SMOKE: PASS'; any gap RAISES.
-- =============================================================================
BEGIN;

CREATE TEMP TABLE _synced(t text) ON COMMIT DROP;
INSERT INTO _synced(t) VALUES
  ('transactions'), ('accounts'), ('debts'), ('entities'), ('projects'), ('inquiries'),
  ('rentals'), ('incidents'), ('contractors_1099'), ('feedback'),
  ('advocacy_records'), ('board_tasks'), ('budget_goals'), ('church_devices'),
  ('church_voice'), ('class_sessions'), ('class_signups'), ('concerns'),
  ('creation_workspaces'), ('crm_leads'), ('custom_orders'),
  ('data_liberation_progress'), ('discovery_items'), ('discussions'),
  ('family_subscriptions'), ('family_trust_records'), ('food_entries'),
  ('food_library'), ('forecast_snapshots'), ('game_saves'), ('health_programs'),
  ('inventory_count_lines'), ('inventory_counts'), ('inventory_items'),
  ('inventory_movements'), ('legal_documents'), ('practice_ceu_entries'),
  ('practice_leads'), ('prayer_requests'), ('purchase_order_lines'),
  ('purchase_orders'), ('recipes'), ('record_events'), ('shop_inventory'),
  ('skill_profiles'), ('water_entries'), ('weight_entries');

DO $$
DECLARE
  missing text;
BEGIN
  SELECT string_agg(s.t, ', ' ORDER BY s.t) INTO missing
    FROM _synced s
   WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = s.t)
     AND NOT EXISTS (SELECT 1 FROM pg_publication_tables p
                      WHERE p.pubname = 'supabase_realtime' AND p.schemaname = 'public' AND p.tablename = s.t);
  IF missing IS NOT NULL THEN
    RAISE EXCEPTION '0245 smoke: synced tables missing from supabase_realtime: %', missing;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
                  WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'transactions')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transactions') THEN
    RAISE EXCEPTION '0245 smoke: the ledger (transactions) is not published';
  END IF;
END $$;

-- PROVEN-TO-CATCH: a synced table that is not published must be named.
CREATE TABLE public._smoke_0245_unpublished(id int);
INSERT INTO _synced(t) VALUES ('_smoke_0245_unpublished');
DO $$
DECLARE
  missing text;
BEGIN
  SELECT string_agg(s.t, ', ') INTO missing
    FROM _synced s
   WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = s.t)
     AND NOT EXISTS (SELECT 1 FROM pg_publication_tables p
                      WHERE p.pubname = 'supabase_realtime' AND p.schemaname = 'public' AND p.tablename = s.t);
  IF missing IS DISTINCT FROM '_smoke_0245_unpublished' THEN
    RAISE EXCEPTION '0245 smoke: the check did not catch an unpublished table (saw %)', coalesce(missing, 'nothing');
  END IF;
END $$;

SELECT 'REALTIME PUBLICATION SMOKE: PASS';
ROLLBACK;
