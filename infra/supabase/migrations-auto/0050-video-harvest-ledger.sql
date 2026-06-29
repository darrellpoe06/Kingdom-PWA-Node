-- =============================================================================
-- 0050 — video harvest ledger: no video lost, every recording fully mined
-- =============================================================================
-- Declared by Darrell 2026-06-25:
--   "No video should be lost to that Sunday or Wednesday — we need each video to
--    give us new content and context to something."
--
-- Every ingested church service recording (Sunday worship, Wednesday 1pm / 6pm
-- Bible study) is ONE SOURCE that fans out into MANY harvests: the message
-- (sermon), worship songs, Learn lessons, the Scripture cited, world-issue /
-- discernment context, testimony + quotable Sermon Stories, trivia, and
-- events-as-data (institutional memory). One ingest, many outputs — and NOTHING
-- left as a dead/orphan file.
--
-- This table is the COVERAGE LEDGER: one row per source video per instance,
-- recording WHAT each video has already been mined into. It is the measurable
-- core of "no video lost" — an ingested video (a choir_sermons row) with no
-- ledger row, or with untouched harvest types, is surfaced as under-harvested
-- for processing. The app derives coverage by joining the real corpus
-- (choir_sermons + choir_songs) OVER this ledger, so the number reflects real
-- state, never a painted one (DR-0076 verification doctrine).
--
-- ONE-SOURCE-MANY-HARVESTS: the choir lane and the discernment lane CONSUME from
-- this shared harvest rather than each re-pulling the video. The source link is
-- choir_songs.source_video_id (added below) -> the video_id this song was
-- harvested from, which is the same stable YouTube id choir_sermons already keys
-- on. A future discernment table links the same way.
--
-- ROLE-SCOPED / NO LEAK: church-internal stewardship data. READ = the whole
-- choir/leadership (user_in_choir, the same wall as the sermon library);
-- WRITE = owner/admin (the stewards who run a harvest). There is NO anon policy
-- — the ledger is never public.
--
-- DEPENDS ON (all present on main as of 0011): instances, user_role_in_instance,
--   user_in_choir, choir_sermons, choir_songs, engagement_touch_updated_at.
-- IDEMPOTENT: CREATE ... IF NOT EXISTS, guarded ALTERs, DROP-then-CREATE
--   policies/trigger, guarded publication add. Additive, church-internal.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- The ledger: one row per source video. `harvests` is the per-type record map:
--   { "<type>": { "status": "none|partial|complete|na",
--                 "count": <int>, "refs": [...], "note": "...",
--                 "harvested_at": "<iso>", "harvested_by": "<uuid>" }, ... }
-- The app fills missing types as 'none' (an untouched harvest = a gap), so an
-- empty {} row honestly reads as "ingested but not yet mined".
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS video_harvests (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id  uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  video_id     text NOT NULL,                 -- stable source key (YouTube id; matches choir_sermons.video_id)
  source_kind  text NOT NULL DEFAULT 'service'
                 CHECK (source_kind IN ('service','lesson','other')),
  service_date date,
  service_type text,
  title        text,
  harvests     jsonb NOT NULL DEFAULT '{}'::jsonb,  -- per-type harvest records (see header)
  notes        text,
  created_by   uuid REFERENCES auth.users(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz,
  updated_by   uuid REFERENCES auth.users(id)
);

-- One ledger row per (instance, video) so an idempotent re-record can't duplicate.
CREATE UNIQUE INDEX IF NOT EXISTS video_harvests_uniq     ON video_harvests(instance_id, video_id);
CREATE INDEX        IF NOT EXISTS video_harvests_inst_idx ON video_harvests(instance_id);
CREATE INDEX        IF NOT EXISTS video_harvests_date_idx ON video_harvests(instance_id, service_date DESC);

-- updated_at touch (reuses the shared function from 0010/0011).
DROP TRIGGER IF EXISTS video_harvests_touch_updated ON video_harvests;
CREATE TRIGGER video_harvests_touch_updated
  BEFORE UPDATE ON video_harvests
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

-- ---------------------------------------------------------------------------
-- GRANTs. This project leaves `anon` untouched (the Choir 42501 incident): a
-- signed-in role needs the EXPLICIT grant to reach the table. NO grant to anon
-- — the ledger is never public. RLS still gates ROWS.
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON video_harvests TO authenticated;

ALTER TABLE video_harvests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS video_harvests_read   ON video_harvests;
DROP POLICY IF EXISTS video_harvests_insert ON video_harvests;
DROP POLICY IF EXISTS video_harvests_update ON video_harvests;
DROP POLICY IF EXISTS video_harvests_delete ON video_harvests;

-- READ = whole choir/leadership (same wall as the message library).
CREATE POLICY video_harvests_read ON video_harvests FOR SELECT
  TO authenticated
  USING (user_in_choir(instance_id));
-- WRITE = owner/admin (the stewards who run + record a harvest).
CREATE POLICY video_harvests_insert ON video_harvests FOR INSERT
  TO authenticated
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY video_harvests_update ON video_harvests FOR UPDATE
  TO authenticated
  USING      (user_role_in_instance(instance_id) IN ('owner','admin'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY video_harvests_delete ON video_harvests FOR DELETE
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- ---------------------------------------------------------------------------
-- SHARED-HARVEST LINK. A song harvested from a service video points back at the
-- source so the choir lane CONSUMES from the shared harvest instead of re-pulling
-- the video. choir_songs is on main (0011). choir_song_ideas (the workshop pool,
-- migration 0036) is NOT on main yet — guarded so this stays idempotent whether
-- or not that table exists.
-- ---------------------------------------------------------------------------
ALTER TABLE choir_songs ADD COLUMN IF NOT EXISTS source_video_id text;
CREATE INDEX IF NOT EXISTS choir_songs_source_video_idx ON choir_songs(instance_id, source_video_id);

DO $songideas$
BEGIN
  IF to_regclass('public.choir_song_ideas') IS NOT NULL THEN
    ALTER TABLE choir_song_ideas ADD COLUMN IF NOT EXISTS source_video_id text;
  END IF;
END $songideas$;

-- ---------------------------------------------------------------------------
-- REALTIME — stream so a harvest recorded on one device shows up live on the
-- ledger surface of another, the same way the choir tables sync.
-- ---------------------------------------------------------------------------
DO $realtime$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
       AND tablename = 'video_harvests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE video_harvests;
  END IF;
END $realtime$;

NOTIFY pgrst, 'reload schema';
