-- =============================================================================
-- 0011 — Choir module (Church): roster + songs + schedule + messages
-- =============================================================================
-- Declared by Darrell 2026-06-14: Christina (choir director, COLG) maintains the
-- weekly music for the whole choir to review — each song with a YouTube video
-- they use to learn it — plus a yearly schedule (Sunday singing + Thursday
-- rehearsal) and a choir message thread. Built in the app (DR-0065) on real,
-- instance-scoped, cross-device-synced data (DR-0061).
--
-- ACCESS (decided 2026-06-14): only choir members SEE the surface; owner/admin
-- (Christina + the assistant director, made admin) EDIT. Read is gated by
-- user_in_choir() = owner/admin OR a row in choir_members for this user. So
-- Christina sees it immediately; member onboarding (linking real user_ids into
-- the roster) is the follow-up tied to the community/instance model.
--
-- DEPENDS ON: schema-v2.1-infra.sql (instances, instance_members,
--             user_in_instance, user_role_in_instance).
-- IDEMPOTENT: CREATE ... IF NOT EXISTS, CREATE OR REPLACE, DROP-then-CREATE
--             policies/trigger, guarded publication add. Safe to re-run.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. ACCESS HELPER — a choir member is an owner/admin of the instance OR a row
--    in choir_members. SECURITY DEFINER (bypasses RLS to avoid recursion),
--    mirroring user_in_instance / user_role_in_instance.
-- ---------------------------------------------------------------------------
-- Defined AFTER choir_members exists (see below); declared here in comment for
-- reading order. The CREATE FUNCTION is placed after the table.

-- ---------------------------------------------------------------------------
-- 1. ROSTER — choir_members
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS choir_members (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id  uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  user_id      uuid REFERENCES auth.users(id),   -- NULL = roster entry for a member without an app account yet
  display_name text NOT NULL,
  section      text CHECK (section IN ('soprano','alto','tenor','bass','other')),
  choir_role   text NOT NULL DEFAULT 'member' CHECK (choir_role IN ('director','assistant','member')),
  added_by     uuid REFERENCES auth.users(id),
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS choir_members_instance_idx ON choir_members(instance_id);
CREATE INDEX IF NOT EXISTS choir_members_user_idx     ON choir_members(instance_id, user_id);

CREATE OR REPLACE FUNCTION public.user_in_choir(instance_uuid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT user_role_in_instance(instance_uuid) IN ('owner','admin')
      OR EXISTS (
           SELECT 1 FROM choir_members
            WHERE instance_id = instance_uuid AND user_id = auth.uid()
         )
$$;

-- ---------------------------------------------------------------------------
-- 2. MUSIC — choir_songs (the weekly music to review; YouTube link per song)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS choir_songs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id   uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  title         text NOT NULL,
  youtube_url   text,                 -- the video the choir uses to learn the song
  scripture_ref text,                 -- ESV-first per SCRIPTURE-REFERENCE-STANDARD
  notes         text,                 -- arrangement notes, who leads, etc.
  service_date  date,                 -- the Sunday / rehearsal this song is for (NULL = general library)
  service_type  text NOT NULL DEFAULT 'sunday' CHECK (service_type IN ('sunday','rehearsal','both')),
  sort_order    integer NOT NULL DEFAULT 0,
  status        text NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  created_by    uuid REFERENCES auth.users(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz,
  updated_by    uuid REFERENCES auth.users(id)
);
CREATE INDEX IF NOT EXISTS choir_songs_instance_idx ON choir_songs(instance_id);
CREATE INDEX IF NOT EXISTS choir_songs_date_idx     ON choir_songs(instance_id, service_date);

-- ---------------------------------------------------------------------------
-- 3. SCHEDULE — choir_schedule (yearly: Sunday singing + Thursday rehearsals)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS choir_schedule (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id   uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  service_date  date NOT NULL,
  service_type  text NOT NULL CHECK (service_type IN ('sunday','rehearsal')),
  title         text,                 -- e.g. "Morning Worship" / "Weekly Rehearsal"
  notes         text,
  created_by    uuid REFERENCES auth.users(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz,
  updated_by    uuid REFERENCES auth.users(id)
);
CREATE INDEX IF NOT EXISTS choir_schedule_instance_idx ON choir_schedule(instance_id);
CREATE INDEX IF NOT EXISTS choir_schedule_date_idx     ON choir_schedule(instance_id, service_date);

-- ---------------------------------------------------------------------------
-- 4. MESSAGES — choir_messages (choir-only thread; NOT the instance-wide
--    messages table, whose RLS would leak to the whole family)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS choir_messages (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id  uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users(id),
  display_name text NOT NULL,
  body         text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS choir_messages_instance_idx ON choir_messages(instance_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- 5. RLS — read = any choir member; write = owner/admin (members may post
--    messages). Append/edit on songs+schedule is reviewer-only.
-- ---------------------------------------------------------------------------
ALTER TABLE choir_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE choir_songs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE choir_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE choir_messages ENABLE ROW LEVEL SECURITY;

-- choir_members: members read the roster; owner/admin manage it.
DROP POLICY IF EXISTS choir_members_read   ON choir_members;
DROP POLICY IF EXISTS choir_members_write  ON choir_members;
DROP POLICY IF EXISTS choir_members_update ON choir_members;
DROP POLICY IF EXISTS choir_members_delete ON choir_members;
CREATE POLICY choir_members_read   ON choir_members FOR SELECT
  USING (user_in_choir(instance_id));
CREATE POLICY choir_members_write  ON choir_members FOR INSERT
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY choir_members_update ON choir_members FOR UPDATE
  USING (user_role_in_instance(instance_id) IN ('owner','admin'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY choir_members_delete ON choir_members FOR DELETE
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- choir_songs: members read; owner/admin write/edit/delete.
DROP POLICY IF EXISTS choir_songs_read   ON choir_songs;
DROP POLICY IF EXISTS choir_songs_write  ON choir_songs;
DROP POLICY IF EXISTS choir_songs_update ON choir_songs;
DROP POLICY IF EXISTS choir_songs_delete ON choir_songs;
CREATE POLICY choir_songs_read   ON choir_songs FOR SELECT
  USING (user_in_choir(instance_id));
CREATE POLICY choir_songs_write  ON choir_songs FOR INSERT
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY choir_songs_update ON choir_songs FOR UPDATE
  USING (user_role_in_instance(instance_id) IN ('owner','admin'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY choir_songs_delete ON choir_songs FOR DELETE
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- choir_schedule: members read; owner/admin write/edit/delete.
DROP POLICY IF EXISTS choir_schedule_read   ON choir_schedule;
DROP POLICY IF EXISTS choir_schedule_write  ON choir_schedule;
DROP POLICY IF EXISTS choir_schedule_update ON choir_schedule;
DROP POLICY IF EXISTS choir_schedule_delete ON choir_schedule;
CREATE POLICY choir_schedule_read   ON choir_schedule FOR SELECT
  USING (user_in_choir(instance_id));
CREATE POLICY choir_schedule_write  ON choir_schedule FOR INSERT
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY choir_schedule_update ON choir_schedule FOR UPDATE
  USING (user_role_in_instance(instance_id) IN ('owner','admin'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY choir_schedule_delete ON choir_schedule FOR DELETE
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- choir_messages: members read + post their own.
DROP POLICY IF EXISTS choir_messages_read   ON choir_messages;
DROP POLICY IF EXISTS choir_messages_insert ON choir_messages;
CREATE POLICY choir_messages_read   ON choir_messages FOR SELECT
  USING (user_in_choir(instance_id));
CREATE POLICY choir_messages_insert ON choir_messages FOR INSERT
  WITH CHECK (user_in_choir(instance_id) AND user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 6. updated_at touch trigger (reuses engagement_touch_updated_at if present;
--    define-or-replace so this migration is standalone).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.engagement_touch_updated_at()
RETURNS trigger AS $fn$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$fn$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS choir_songs_touch_updated ON choir_songs;
CREATE TRIGGER choir_songs_touch_updated
  BEFORE UPDATE ON choir_songs
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

DROP TRIGGER IF EXISTS choir_schedule_touch_updated ON choir_schedule;
CREATE TRIGGER choir_schedule_touch_updated
  BEFORE UPDATE ON choir_schedule
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

-- ---------------------------------------------------------------------------
-- 7. REALTIME — stream all four so the choir's devices update live.
-- ---------------------------------------------------------------------------
DO $realtime$
DECLARE
  t text;
  tables text[] := ARRAY['choir_members','choir_songs','choir_schedule','choir_messages'];
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
