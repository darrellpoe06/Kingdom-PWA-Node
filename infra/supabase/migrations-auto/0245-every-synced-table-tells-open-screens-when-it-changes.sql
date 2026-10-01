-- =============================================================================
-- 0245 — every synced table tells open screens when it changes (DR-0708)
-- =============================================================================
-- INCIDENT (Darrell and Christina, 2026-09-30, both on build aae49f9): Books ->
-- Imported showed 258 September rows of 3,405 on her phone and 183 of 3,330 on
-- his desktop. Measured on the live NAS database (family-books-probe run
-- 36787773243): the poe-family ledger holds 3,405 rows, 258 in September. Her
-- screen was right. The 75 rows his screen lacked were September rows she
-- wrote on 2026-09-30, after his page had loaded.
--
-- WHY HIS SCREEN NEVER HEARD ABOUT THEM: every open screen refreshes a synced
-- table when Supabase Realtime tells it a row changed (lib/table-sync.js
-- subscribe()). Realtime only speaks for tables in the supabase_realtime
-- publication. schema-v2.14-realtime-publication.sql added the core books
-- tables to that publication on the hosted project, by hand; it was never a
-- file in migrations-auto, so the NAS database the app has read since
-- REPOINT-ARMED (2026-08-19) never received it. Measured: `transactions` is not
-- in the NAS publication (0 rows in pg_publication_tables). So a screen showed
-- the ledger as of the moment it loaded, for as long as it stayed open, and two
-- family members saw two different ledgers.
--
-- THE FIX HERE: add every table the app syncs through lib/table-sync.js to the
-- publication, on whichever database this runs. Additive and idempotent: a
-- table already published, or absent on this database, is skipped. Nothing
-- about who may READ a row changes. Realtime delivers a change only to a
-- subscriber whose RLS lets them read that row (DR-0060: RLS stays the wall),
-- and the client filters its channel to its own instance.
--
-- The app side of the same fix (the same PR): the ledger re-reads when the
-- screen comes back to the front, and Books -> Imported says when it last
-- heard the database, with unknown shown as unknown, never as fresh.
-- =============================================================================

DO $realtime$
DECLARE
  t text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  FOREACH t IN ARRAY ARRAY[
    -- the books (schema-v2.14's list, which never reached the NAS)
    'transactions', 'accounts', 'debts', 'entities', 'projects', 'inquiries',
    'rentals', 'incidents', 'contractors_1099', 'feedback',
    -- every other table lib/*-sync.js reads through createTableSync
    'advocacy_records', 'board_tasks', 'budget_goals', 'church_devices',
    'church_voice', 'class_sessions', 'class_signups', 'concerns',
    'creation_workspaces', 'crm_leads', 'custom_orders',
    'data_liberation_progress', 'discovery_items', 'discussions',
    'family_subscriptions', 'family_trust_records', 'food_entries',
    'food_library', 'forecast_snapshots', 'game_saves', 'health_programs',
    'inventory_count_lines', 'inventory_counts', 'inventory_items',
    'inventory_movements', 'legal_documents', 'practice_ceu_entries',
    'practice_leads', 'prayer_requests', 'purchase_order_lines',
    'purchase_orders', 'recipes', 'record_events', 'shop_inventory',
    'skill_profiles', 'water_entries', 'weight_entries'
  ]
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t)
       AND NOT EXISTS (
         SELECT 1 FROM pg_publication_tables
          WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
       )
    THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
      RAISE NOTICE '0245: added % to supabase_realtime', t;
    END IF;
  END LOOP;

  -- Receipt: the ledger itself must now be published, or this migration failed.
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transactions')
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'transactions'
     )
  THEN
    RAISE EXCEPTION '0245: transactions is still not in supabase_realtime';
  END IF;
END $realtime$;
