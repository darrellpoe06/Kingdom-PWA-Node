-- =============================================================================
-- 0063 — sermon engagement: in-app hearts/likes + YouTube public stats, so the
--        message library can rank/sort by what resonates.
-- =============================================================================
-- Declared by Darrell 2026-07-01:
--   "Rank/sort the library by engagement — likes + hearts + views. Pull YouTube
--    public engagement stats (data-IN aggregation on the sovereign backbone) AND
--    support IN-APP hearts/likes users give; let users sort by most-hearted /
--    most-viewed so they find what resonates."
--
-- TWO sources, both deterministic (no LLM):
--   · sermon_reactions   — in-app hearts + likes a member gives (one row per
--                          person per video per kind; toggling removes the row).
--   · sermon_video_stats — YouTube public views/likes aggregated onto the
--                          sovereign backbone by a loader script (service key).
--                          Data-IN: we hold the number, we don't embed a tracker.
--
-- PRIVACY (DATA-AS-EMPOWERMENT-NOT-EXTRACTION, servant-king): the community sees
-- AGGREGATE counts, never who-hearted-what.
--   · sermon_reactions direct SELECT is scoped to the caller's OWN rows only
--     (so a member sees + toggles their own hearts, and never reads whose-else).
--   · Aggregate counts are exposed through the SECURITY DEFINER RPC
--     sermon_reaction_counts(), which returns per-video totals with NO user_id.
--   That gives the surface everything it needs (counts + my-own-toggle state)
--   with zero per-user leakage. Mirrors the member_presence RPC-write pattern.
--
-- HONESTY (DR-0076): a count is only what's really recorded; a video with no
-- reactions + no loaded stats has no row and reads as an honest "no signal yet".
--
-- DEPENDS ON (present since 0011/0050): instances, user_role_in_instance,
--   engagement_touch_updated_at. NO dependency on choir membership — the message
--   library is PUBLIC, so its engagement is community-wide (any signed-in user),
--   not choir-gated. NO anon policy (the no-anon rule; the Choir 42501 incident).
-- IDEMPOTENT: CREATE ... IF NOT EXISTS, DROP-then-CREATE policies/trigger/fn,
--   guarded publication add. Additive, church-internal.
-- APPLY: Darrell's hand (db-migrate / Supabase Studio). Until applied, the
--   library shows real videos + points and an honest empty engagement state
--   (no hearts, no view counts); nothing breaks.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- sermon_reactions — one row per (instance, video, user, kind). A heart/like is
-- a toggle: present = reacted, deleted = un-reacted. UNIQUE stops double-count.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sermon_reactions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id  uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  video_id     text NOT NULL,                 -- stable source key (YouTube id; matches choir_sermons.video_id)
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind         text NOT NULL DEFAULT 'heart' CHECK (kind IN ('heart','like')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (instance_id, video_id, user_id, kind)
);

CREATE INDEX IF NOT EXISTS sermon_reactions_video_idx ON sermon_reactions(instance_id, video_id);
CREATE INDEX IF NOT EXISTS sermon_reactions_user_idx  ON sermon_reactions(user_id);

GRANT SELECT, INSERT, DELETE ON sermon_reactions TO authenticated;
ALTER TABLE sermon_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sermon_reactions_own_read   ON sermon_reactions;
DROP POLICY IF EXISTS sermon_reactions_own_insert ON sermon_reactions;
DROP POLICY IF EXISTS sermon_reactions_own_delete ON sermon_reactions;

-- READ = own rows only. Aggregate counts come via the RPC below, so a member can
-- see their own toggle state but never who-else hearted what (privacy).
CREATE POLICY sermon_reactions_own_read ON sermon_reactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
-- INSERT / DELETE = self only. A member can only ever add/remove THEIR OWN heart.
CREATE POLICY sermon_reactions_own_insert ON sermon_reactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY sermon_reactions_own_delete ON sermon_reactions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- sermon_reaction_counts — aggregate totals per video (no user_id), the
-- community-visible engagement signal. SECURITY DEFINER so it reads across all
-- members' rows while the table's own SELECT stays own-rows-only. Scoped to one
-- instance so it never sweeps another tenant's reactions.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sermon_reaction_counts(p_instance uuid)
RETURNS TABLE (video_id text, kind text, count bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT video_id, kind, count(*)::bigint
    FROM sermon_reactions
   WHERE instance_id = p_instance
   GROUP BY video_id, kind
$$;

REVOKE ALL ON FUNCTION public.sermon_reaction_counts(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.sermon_reaction_counts(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- sermon_video_stats — YouTube public stats aggregated onto the sovereign
-- backbone. ONE row per (instance, video), upserted by the loader script with
-- the SERVICE ROLE key (RLS-exempt). Public numbers -> readable by any signed-in
-- user so the library can rank by views; written only by owner/admin (+ loader).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sermon_video_stats (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id  uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  video_id     text NOT NULL,
  yt_views     bigint NOT NULL DEFAULT 0,
  yt_likes     bigint NOT NULL DEFAULT 0,
  yt_comments  bigint NOT NULL DEFAULT 0,
  source       text NOT NULL DEFAULT 'youtube' CHECK (source IN ('youtube','manual')),
  fetched_at   timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz,
  UNIQUE (instance_id, video_id)
);

CREATE INDEX IF NOT EXISTS sermon_video_stats_video_idx ON sermon_video_stats(instance_id, video_id);

DROP TRIGGER IF EXISTS sermon_video_stats_touch_updated ON sermon_video_stats;
CREATE TRIGGER sermon_video_stats_touch_updated
  BEFORE UPDATE ON sermon_video_stats
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON sermon_video_stats TO authenticated;
ALTER TABLE sermon_video_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sermon_video_stats_read   ON sermon_video_stats;
DROP POLICY IF EXISTS sermon_video_stats_insert ON sermon_video_stats;
DROP POLICY IF EXISTS sermon_video_stats_update ON sermon_video_stats;
DROP POLICY IF EXISTS sermon_video_stats_delete ON sermon_video_stats;

-- READ = any signed-in user (public YouTube numbers; drives the ranking).
CREATE POLICY sermon_video_stats_read ON sermon_video_stats FOR SELECT
  TO authenticated
  USING (true);
-- WRITE = owner/admin stewards (the loader uses service_role, RLS-exempt).
CREATE POLICY sermon_video_stats_insert ON sermon_video_stats FOR INSERT
  TO authenticated
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY sermon_video_stats_update ON sermon_video_stats FOR UPDATE
  TO authenticated
  USING      (user_role_in_instance(instance_id) IN ('owner','admin'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY sermon_video_stats_delete ON sermon_video_stats FOR DELETE
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- ---------------------------------------------------------------------------
-- REALTIME — a heart tapped on one device updates the count live on another;
-- loaded stats light the ranking the moment the script writes them.
-- ---------------------------------------------------------------------------
DO $realtime$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'sermon_reactions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE sermon_reactions;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'sermon_video_stats') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE sermon_video_stats;
  END IF;
END $realtime$;

NOTIFY pgrst, 'reload schema';
