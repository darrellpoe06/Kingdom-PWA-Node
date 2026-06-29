-- =============================================================================
-- 0041 — Choir Songbook cross-reference: themes + practical metadata + sermon
--        link on choir_songs, plus choir_song_loves (most-loved by song title)
-- =============================================================================
-- Declared by Darrell 2026-06-24: the choir's songs should be CROSS-REFERENCED
-- so the choir can pull the right song "the easiest way possible" — search/filter
-- a song by SCRIPTURE or THEME, see the SERMON/SERVICE it fits, the practical
-- detail (key / arrangement / soloist / last-sung), and the community's
-- most-loved songs. Built IN the app (DR-0065) on the real, instance-scoped,
-- cross-device-synced choir data (DR-0061) the rest of the Choir module already
-- uses (0011 set-list, 0036 idea workshop).
--
-- ADDITIVE, NOT A NEW SONG ENTITY: choir_songs (0011) is the weekly set-list —
-- one row per (title, service_date). The Songbook is a DERIVED VIEW over those
-- rows (grouped by title in the app; lib/choir-songbook.js), so "last-sung",
-- "times used", and the scripture/theme union are computed from the real rows,
-- never painted. This migration only adds the cross-reference FIELDS those rows
-- carry, and the loves table keyed by song TITLE (not row) so a love survives
-- the song being re-scheduled onto a new date.
--
-- FAITHFUL (Verification Doctrine / no fabrication): themes is a real, editable
-- column the director fills (or leaves blank for review). The app may SUGGEST
-- candidate themes from text already present (title/notes/scripture), but a
-- suggestion is never auto-written — the director accepts it. No scripture or
-- theme is invented.
--
-- ACCESS (matches the rest of the Choir module, decided 2026-06-14):
--   choir_songs columns  read = any choir member (existing RLS on 0011)
--                        write = owner/admin only (existing RLS on 0011)
--   choir_song_loves     read   = any choir member (user_in_choir)
--                        insert = any choir member, as themselves (one per title)
--                        delete = own love (toggle off)
--
-- DEPENDS ON: 0011-choir-module.sql (choir_songs, choir_sermons, user_in_choir,
--             user_role_in_instance) and schema-v2.1-infra.sql (instances).
-- IDEMPOTENT: ADD COLUMN IF NOT EXISTS, CREATE ... IF NOT EXISTS, DROP-then-
--             CREATE policies, guarded publication add. Safe to re-run.
-- NO ANON: choir-only surface; nothing granted to the anon role.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Cross-reference + practical metadata on the existing set-list rows.
--    All nullable / defaulted so existing rows are untouched (additive).
-- ---------------------------------------------------------------------------
ALTER TABLE choir_songs ADD COLUMN IF NOT EXISTS themes      text[] NOT NULL DEFAULT '{}';
ALTER TABLE choir_songs ADD COLUMN IF NOT EXISTS song_key    text;
ALTER TABLE choir_songs ADD COLUMN IF NOT EXISTS arrangement text;
ALTER TABLE choir_songs ADD COLUMN IF NOT EXISTS soloist     text;
-- The sermon/message this song was chosen to fit (one-tap cross-link). SET NULL
-- on sermon delete so a removed message never orphans the song.
ALTER TABLE choir_songs ADD COLUMN IF NOT EXISTS sermon_ref  uuid REFERENCES choir_sermons(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS choir_songs_sermon_idx ON choir_songs(sermon_ref) WHERE sermon_ref IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 2. LOVES — choir_song_loves (community "most-loved", keyed by song TITLE).
--    Keyed by a normalized title_key, not a song row id, so loving "Total
--    Praise" stays attached to the song across every Sunday it is sung (the
--    set-list re-creates a row per date). One love per member per song title.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS choir_song_loves (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  title_key   text NOT NULL CHECK (char_length(title_key) BETWEEN 1 AND 200),
  user_id     uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (instance_id, title_key, user_id)
);
CREATE INDEX IF NOT EXISTS choir_song_loves_instance_idx ON choir_song_loves(instance_id);
CREATE INDEX IF NOT EXISTS choir_song_loves_title_idx    ON choir_song_loves(instance_id, title_key);

-- ---------------------------------------------------------------------------
-- 3. GRANTS — explicit, because the cloud project lost its default authenticated
--    GRANT (0024 incident; new tables 403 before RLS until granted). No anon.
--    (choir_songs already carries its grant from 0011/0024; new columns inherit
--    the table grant, so only the new loves table needs one.)
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, DELETE ON choir_song_loves TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. RLS — mirror choir_song_votes (0036): members read all; cast/clear own.
-- ---------------------------------------------------------------------------
ALTER TABLE choir_song_loves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS choir_song_loves_read   ON choir_song_loves;
DROP POLICY IF EXISTS choir_song_loves_insert ON choir_song_loves;
DROP POLICY IF EXISTS choir_song_loves_delete ON choir_song_loves;
CREATE POLICY choir_song_loves_read   ON choir_song_loves FOR SELECT
  USING (user_in_choir(instance_id));
CREATE POLICY choir_song_loves_insert ON choir_song_loves FOR INSERT
  WITH CHECK (user_in_choir(instance_id) AND user_id = auth.uid());
CREATE POLICY choir_song_loves_delete ON choir_song_loves FOR DELETE
  USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 5. REALTIME — stream loves so every choir member's device updates live.
-- ---------------------------------------------------------------------------
DO $realtime$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'choir_song_loves'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE choir_song_loves;
  END IF;
END $realtime$;

NOTIFY pgrst, 'reload schema';
