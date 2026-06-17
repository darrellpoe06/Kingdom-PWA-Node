-- =============================================================================
-- 0036 — Choir Song Workshop: collaborative song-idea pool + comments + votes
-- =============================================================================
-- Declared by Darrell 2026-06-17: the choir should be able to add and review
-- links for songs to sing, play them in-app, leave comments, and let the choir
-- director CHOOSE which of the ~10 idea songs are FINAL — the rest go back to the
-- song pool. Built IN the app (DR-0065) on real, instance-scoped, cross-device-
-- synced data (DR-0061), the same shared-sync pattern as the rest of the Choir
-- module (0011) and the Conference RSVP flow.
--
-- DISTINCT FROM choir_songs (0011): that table is the weekly worship SET-LIST
-- (songs assigned to a service_date, director-insert-only). THIS is the IDEA
-- POOL/WORKSHOP — any choir member may add a candidate, anyone may comment + vote,
-- and only the director (owner/admin) marks a song FINAL. Different lifecycle,
-- different authority model, so a new table rather than overloading choir_songs.
--
-- ACCESS:
--   choir_song_ideas    read   = any choir member (user_in_choir)
--                       insert = any choir member, as themselves (added_by = me)
--                       update = owner/admin ONLY  -> the director's "say" on FINAL
--                       delete = the member who added it, OR owner/admin
--   choir_song_comments read = member; insert = member as self; delete = author or owner/admin
--   choir_song_votes    read = member; insert = member as self; delete = own vote (toggle)
--
-- DEPENDS ON: schema-v2.1-infra.sql (instances, user_role_in_instance) and
--             0011-choir-module.sql (user_in_choir()).
-- IDEMPOTENT: CREATE ... IF NOT EXISTS, CREATE OR REPLACE, DROP-then-CREATE
--             policies/trigger, guarded publication add. Safe to re-run.
-- NO ANON: choir-only surface; nothing is granted to the anon role.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. IDEAS — choir_song_ideas (the collaborative pool of song candidates)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS choir_song_ideas (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id   uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  title         text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  url           text          CHECK (url IS NULL OR char_length(url) <= 2000),
  source_type   text NOT NULL DEFAULT 'link' CHECK (source_type IN ('youtube','link')),
  note          text          CHECK (note IS NULL OR char_length(note) <= 2000),
  key_label     text          CHECK (key_label IS NULL OR char_length(key_label) <= 40),
  arrangement   text          CHECK (arrangement IS NULL OR char_length(arrangement) <= 120),
  -- idea  = a live candidate under review (the working set of ~10)
  -- final = chosen by the director (locks into the Final Songs set)
  -- pool  = returned to the broader song list (not a current candidate)
  status        text NOT NULL DEFAULT 'idea' CHECK (status IN ('idea','final','pool')),
  added_by      uuid REFERENCES auth.users(id),
  added_by_name text,
  decided_by    uuid REFERENCES auth.users(id),   -- who last set final/pool
  decided_at    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz
);
CREATE INDEX IF NOT EXISTS choir_song_ideas_instance_idx ON choir_song_ideas(instance_id);
CREATE INDEX IF NOT EXISTS choir_song_ideas_status_idx   ON choir_song_ideas(instance_id, status);

-- ---------------------------------------------------------------------------
-- 2. COMMENTS — choir_song_comments (a thread per idea; any member may post)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS choir_song_comments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  song_id     uuid NOT NULL REFERENCES choir_song_ideas(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES auth.users(id),
  author      text NOT NULL,
  body        text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS choir_song_comments_instance_idx ON choir_song_comments(instance_id);
CREATE INDEX IF NOT EXISTS choir_song_comments_song_idx     ON choir_song_comments(song_id);

-- ---------------------------------------------------------------------------
-- 3. VOTES — choir_song_votes (lightweight thumbs-up; one per member per song)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS choir_song_votes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  song_id     uuid NOT NULL REFERENCES choir_song_ideas(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (song_id, user_id)
);
CREATE INDEX IF NOT EXISTS choir_song_votes_instance_idx ON choir_song_votes(instance_id);
CREATE INDEX IF NOT EXISTS choir_song_votes_song_idx     ON choir_song_votes(song_id);

-- ---------------------------------------------------------------------------
-- 4. GRANTS — explicit, because the cloud project lost its default authenticated
--    GRANT (0024 incident; new tables 403 before RLS until granted). No anon.
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON choir_song_ideas    TO authenticated;
GRANT SELECT, INSERT, DELETE         ON choir_song_comments  TO authenticated;
GRANT SELECT, INSERT, DELETE         ON choir_song_votes     TO authenticated;

-- ---------------------------------------------------------------------------
-- 5. RLS
-- ---------------------------------------------------------------------------
ALTER TABLE choir_song_ideas    ENABLE ROW LEVEL SECURITY;
ALTER TABLE choir_song_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE choir_song_votes    ENABLE ROW LEVEL SECURITY;

-- choir_song_ideas: any member reads + adds (as self); director (owner/admin)
-- has the say on status; the adder or a director may remove.
DROP POLICY IF EXISTS choir_song_ideas_read   ON choir_song_ideas;
DROP POLICY IF EXISTS choir_song_ideas_insert ON choir_song_ideas;
DROP POLICY IF EXISTS choir_song_ideas_update ON choir_song_ideas;
DROP POLICY IF EXISTS choir_song_ideas_delete ON choir_song_ideas;
CREATE POLICY choir_song_ideas_read   ON choir_song_ideas FOR SELECT
  USING (user_in_choir(instance_id));
CREATE POLICY choir_song_ideas_insert ON choir_song_ideas FOR INSERT
  WITH CHECK (user_in_choir(instance_id) AND added_by = auth.uid());
CREATE POLICY choir_song_ideas_update ON choir_song_ideas FOR UPDATE
  USING (user_role_in_instance(instance_id) IN ('owner','admin'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY choir_song_ideas_delete ON choir_song_ideas FOR DELETE
  USING (added_by = auth.uid() OR user_role_in_instance(instance_id) IN ('owner','admin'));

-- choir_song_comments: members read all + post their own; author or director deletes.
DROP POLICY IF EXISTS choir_song_comments_read   ON choir_song_comments;
DROP POLICY IF EXISTS choir_song_comments_insert ON choir_song_comments;
DROP POLICY IF EXISTS choir_song_comments_delete ON choir_song_comments;
CREATE POLICY choir_song_comments_read   ON choir_song_comments FOR SELECT
  USING (user_in_choir(instance_id));
CREATE POLICY choir_song_comments_insert ON choir_song_comments FOR INSERT
  WITH CHECK (user_in_choir(instance_id) AND user_id = auth.uid());
CREATE POLICY choir_song_comments_delete ON choir_song_comments FOR DELETE
  USING (user_id = auth.uid() OR user_role_in_instance(instance_id) IN ('owner','admin'));

-- choir_song_votes: members read all + cast/clear ONLY their own vote (toggle).
DROP POLICY IF EXISTS choir_song_votes_read   ON choir_song_votes;
DROP POLICY IF EXISTS choir_song_votes_insert ON choir_song_votes;
DROP POLICY IF EXISTS choir_song_votes_delete ON choir_song_votes;
CREATE POLICY choir_song_votes_read   ON choir_song_votes FOR SELECT
  USING (user_in_choir(instance_id));
CREATE POLICY choir_song_votes_insert ON choir_song_votes FOR INSERT
  WITH CHECK (user_in_choir(instance_id) AND user_id = auth.uid());
CREATE POLICY choir_song_votes_delete ON choir_song_votes FOR DELETE
  USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 6. updated_at touch trigger on the ideas table (status changes, edits).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.engagement_touch_updated_at()
RETURNS trigger AS $fn$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$fn$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS choir_song_ideas_touch_updated ON choir_song_ideas;
CREATE TRIGGER choir_song_ideas_touch_updated
  BEFORE UPDATE ON choir_song_ideas
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

-- ---------------------------------------------------------------------------
-- 7. REALTIME — stream all three so every choir member's device updates live.
-- ---------------------------------------------------------------------------
DO $realtime$
DECLARE
  t text;
  tables text[] := ARRAY['choir_song_ideas','choir_song_comments','choir_song_votes'];
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  FOREACH t IN ARRAY tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
    END IF;
  END LOOP;
END $realtime$;

NOTIFY pgrst, 'reload schema';
