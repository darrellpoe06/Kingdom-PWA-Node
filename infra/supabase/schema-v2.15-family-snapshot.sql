-- =============================================================================
-- v2.15 — family_snapshots: the whole world follows the account (2026-06-12)
-- =============================================================================
-- The table-synced lists (accounts, debts, transactions, projects, inquiries,
-- incidents, contractors, rentals, entities) already follow the account. The
-- REST of the family's world — recurring obligations, tax calendar, church +
-- conference, events, watchlist, capex, skill profiles, settings, room
-- memory (minus photos) — lived only in one device's browser storage, so a
-- new device booted the aspirational seed instead ("Adam / 240 Cedar Ln",
-- 2026-06-12 report). One snapshot row per instance carries that remainder.
--
-- Explicitly NOT in the snapshot (by client design, see snapshot-sync.js):
--   - the table-synced lists above (their tables stay the source of truth)
--   - notes (Thinking Space is private to the person, not the instance)
--   - photo bytes (base64 stripped; the R15 sovereign photo write-path is
--     the home for those)
--
-- Run once in the cloud Studio SQL Editor. Idempotent.

CREATE TABLE IF NOT EXISTS family_snapshots (
  instance_id uuid PRIMARY KEY REFERENCES instances(id) ON DELETE CASCADE,
  updated_by uuid NOT NULL REFERENCES auth.users(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb NOT NULL
);

ALTER TABLE family_snapshots ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'family_snapshots' AND policyname = 'snapshot_member_read') THEN
    CREATE POLICY snapshot_member_read ON family_snapshots FOR SELECT USING (user_in_instance(instance_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'family_snapshots' AND policyname = 'snapshot_member_insert') THEN
    CREATE POLICY snapshot_member_insert ON family_snapshots FOR INSERT WITH CHECK (user_in_instance(instance_id) AND updated_by = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'family_snapshots' AND policyname = 'snapshot_member_update') THEN
    CREATE POLICY snapshot_member_update ON family_snapshots FOR UPDATE USING (user_in_instance(instance_id)) WITH CHECK (user_in_instance(instance_id) AND updated_by = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'family_snapshots' AND policyname = 'snapshot_member_delete') THEN
    CREATE POLICY snapshot_member_delete ON family_snapshots FOR DELETE USING (user_in_instance(instance_id));
  END IF;
END $$;

-- Realtime so other signed-in devices apply a fresher snapshot live.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'family_snapshots'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.family_snapshots;
  END IF;
END $$;
