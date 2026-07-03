-- =============================================================================
-- 0070 — Study sync: the circle's private notes follow their sign-in (Darrell
-- 2026-07-03: "we need sync for BG he will use multiple devices and so do we").
-- =============================================================================
-- The Study (Darrell + Christina + Bishop Gwin) was device-local localStorage by
-- design — sovereign, never a third-party cloud. That design hit its limit: all
-- three circle members use multiple devices. This rail keeps the sovereignty
-- promise because Supabase here IS the family's own server (self-hosted on the
-- Synology — infra/supabase/README.md): the notes move between the owner's
-- devices THROUGH the family NAS, never a third-party cloud, never mined.
--
-- PRIVACY MODEL (stronger than the rest of the church schema): every row is
-- OWNER-ONLY. Not instance-scoped, not role-based — auth.uid() = owner on every
-- operation. BG's reflections are readable by BG's sign-in alone; Darrell's by
-- Darrell's; Christina's by Christina's. "His notes are his space" (Darrell
-- 2026-07-03) holds at the database layer, never a UI-only lock (DR-0074).
--
-- Rows are TOMBSTONED, not hard-deleted, so a delete on one device propagates
-- instead of resurrecting from another device's merge. The tombstone keeps no
-- content: doc is emptied when deleted flips true (nothing lingers).
--
-- IDEMPOTENT: IF NOT EXISTS / DROP POLICY IF EXISTS; safe to re-run.

-- 1. The entries: one row per Study entry, whole normalized entry as jsonb.
CREATE TABLE IF NOT EXISTS study_entries (
  owner       uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  id          text NOT NULL,             -- client-generated entry id (study-space makeId)
  doc         jsonb NOT NULL DEFAULT '{}'::jsonb,
  deleted     boolean NOT NULL DEFAULT false,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner, id)
);

-- 2. The space meta: the owner's label for their Study ("Father of Lights").
CREATE TABLE IF NOT EXISTS study_spaces (
  owner       uuid PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  label       text NOT NULL DEFAULT '',
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- 3. RLS — owner-only on every operation, both tables. No admin carve-out, no
--    instance role, no public window. The smallest possible policy surface.
ALTER TABLE study_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_spaces  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS study_entries_select ON study_entries;
CREATE POLICY study_entries_select ON study_entries FOR SELECT
  USING (owner = auth.uid());
DROP POLICY IF EXISTS study_entries_insert ON study_entries;
CREATE POLICY study_entries_insert ON study_entries FOR INSERT
  WITH CHECK (owner = auth.uid());
DROP POLICY IF EXISTS study_entries_update ON study_entries;
CREATE POLICY study_entries_update ON study_entries FOR UPDATE
  USING (owner = auth.uid()) WITH CHECK (owner = auth.uid());
DROP POLICY IF EXISTS study_entries_delete ON study_entries;
CREATE POLICY study_entries_delete ON study_entries FOR DELETE
  USING (owner = auth.uid());

DROP POLICY IF EXISTS study_spaces_select ON study_spaces;
CREATE POLICY study_spaces_select ON study_spaces FOR SELECT
  USING (owner = auth.uid());
DROP POLICY IF EXISTS study_spaces_insert ON study_spaces;
CREATE POLICY study_spaces_insert ON study_spaces FOR INSERT
  WITH CHECK (owner = auth.uid());
DROP POLICY IF EXISTS study_spaces_update ON study_spaces;
CREATE POLICY study_spaces_update ON study_spaces FOR UPDATE
  USING (owner = auth.uid()) WITH CHECK (owner = auth.uid());
DROP POLICY IF EXISTS study_spaces_delete ON study_spaces;
CREATE POLICY study_spaces_delete ON study_spaces FOR DELETE
  USING (owner = auth.uid());

-- 4. Realtime — a save on one of the owner's devices reaches their other open
--    devices live. RLS applies to the realtime stream too (WAL-RLS): an owner
--    only ever receives their own rows.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
       AND tablename = 'study_entries'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE study_entries;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
       AND tablename = 'study_spaces'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE study_spaces;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
