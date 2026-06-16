-- =============================================================================
-- 0023 — Conference / Event Center: the REAL multi-attendee system
-- =============================================================================
-- Makes the Conference module (ConferenceModule.jsx, local-first v0) a shared,
-- instance-scoped, realtime system so every leader and attendee sees the SAME
-- conferences / sessions / rooms / registrations. Backs the new EventCenterModule
-- surface (rooms + capacity + breakouts) and is shape-compatible with the
-- concurrent build's meals + Service<->Choir link (lib/conference.js): a
-- main_service session REFERENCES a choir sermon (sermon_ref -> choir_sermons)
-- and an ordered set of choir songs (music_set -> choir_songs ids), never
-- duplicating that data; participants carry meal_type + dietary (the reused
-- meal fields).
--
-- Four tables, per the PR #9 conference/event-center ingestion spec:
--   conferences            — the event front door
--   event_center_resources — rooms (name, capacity, features)
--   event_sessions         — schedule sessions (type/room/capacity + Service<->Choir)
--   event_participants     — registrations (name, meal_type, dietary, status)
--
-- ACCESS: read = any instance member (user_in_instance); organizing writes
-- (conferences / sessions / rooms) = owner/admin (user_role_in_instance). A
-- member registers their OWN attendance (event_participants insert where
-- created_by = auth.uid()); the registrant or owner/admin may edit/cancel it.
-- This MIRRORS the choir tables' RLS (0011) exactly — instance-scoped, no leak.
--
-- DEPENDS ON: schema-v2.1-infra.sql (instances, instance_members,
--             user_in_instance, user_role_in_instance) and
--             0011-choir-module.sql (choir_sermons, choir_songs — for the
--             Service<->Choir reference). Both apply before 0023 in the lane.
-- IDEMPOTENT: CREATE ... IF NOT EXISTS, CREATE OR REPLACE, DROP-then-CREATE
--             policies/triggers, guarded publication add. Safe to re-run.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. ROOMS — event_center_resources (the whole-building room inventory)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_center_resources (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id   uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  name          text NOT NULL,                  -- e.g. "Main Sanctuary", "Fellowship Hall"
  capacity      integer,                         -- seats; NULL = unspecified
  features      text[] NOT NULL DEFAULT '{}',    -- e.g. {projector, sound, kitchen}
  location_note text,                            -- where in the building
  sort_order    integer NOT NULL DEFAULT 0,
  status        text NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  created_by    uuid REFERENCES auth.users(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz,
  updated_by    uuid REFERENCES auth.users(id)
);
CREATE INDEX IF NOT EXISTS event_center_resources_instance_idx ON event_center_resources(instance_id);

-- ---------------------------------------------------------------------------
-- 2. CONFERENCE — conferences (the event front door; one row per conference)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conferences (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id    uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  name           text NOT NULL,
  theme          text,
  host           text,
  location       text,
  start_date     date,
  end_date       date,
  dates_label    text,                           -- free-text dates while not firm (Bishop fills in)
  livestream_url text,
  site_url       text,
  status         text NOT NULL DEFAULT 'active' CHECK (status IN ('active','draft','archived')),
  created_by     uuid REFERENCES auth.users(id),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz,
  updated_by     uuid REFERENCES auth.users(id)
);
CREATE INDEX IF NOT EXISTS conferences_instance_idx ON conferences(instance_id);

-- ---------------------------------------------------------------------------
-- 3. SESSIONS — event_sessions (schedule; type / room / capacity + Service<->Choir)
-- ---------------------------------------------------------------------------
-- session_type:
--   main_service — the whole-building gathering in the main space; may link a
--                  choir sermon (sermon_ref) + an ordered song set (music_set).
--   breakout     — runs PARALLEL to a main service (the whole-building concept:
--                  "how many breakouts while the main space is in use").
--   other        — meals / registration / fellowship blocks.
-- room_resource_id assigns the session to a room; capacity tracks seats vs the
-- live registration count (event_participants for this session).
CREATE TABLE IF NOT EXISTS event_sessions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id      uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  conference_id    uuid NOT NULL REFERENCES conferences(id) ON DELETE CASCADE,
  day              text,                          -- display day, e.g. "Tue Jul 15"
  session_date     date,                          -- structured date (NULL ok)
  time             text,                          -- display time, e.g. "7:00 PM"
  title            text NOT NULL,
  speaker          text,
  session_type     text NOT NULL DEFAULT 'breakout' CHECK (session_type IN ('main_service','breakout','other')),
  room_resource_id uuid REFERENCES event_center_resources(id) ON DELETE SET NULL,
  capacity         integer,                       -- per-session cap; NULL = use room capacity
  -- Service<->Choir (reuses the concurrent build's link; reference, never copy):
  sermon_ref       uuid REFERENCES choir_sermons(id) ON DELETE SET NULL,
  music_set        jsonb NOT NULL DEFAULT '[]'::jsonb,  -- ordered array of choir_songs ids
  sort_order       integer NOT NULL DEFAULT 0,
  status           text NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  created_by       uuid REFERENCES auth.users(id),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz,
  updated_by       uuid REFERENCES auth.users(id)
);
CREATE INDEX IF NOT EXISTS event_sessions_instance_idx   ON event_sessions(instance_id);
CREATE INDEX IF NOT EXISTS event_sessions_conference_idx ON event_sessions(instance_id, conference_id);
CREATE INDEX IF NOT EXISTS event_sessions_room_idx       ON event_sessions(room_resource_id);

-- ---------------------------------------------------------------------------
-- 4. PARTICIPANTS — event_participants (registration: name, meal_type, dietary)
-- ---------------------------------------------------------------------------
-- session_id NULL = a whole-conference RSVP; set = registration for a specific
-- breakout (so capacity-vs-registration is tracked per session). meal_type +
-- dietary are the reused meal fields (lib/conference.js MEAL_TYPES + the
-- event_participants.dietary spec column). registration_status carries the
-- lifecycle (registered / waitlist / cancelled / checked_in).
CREATE TABLE IF NOT EXISTS event_participants (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id         uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  conference_id       uuid NOT NULL REFERENCES conferences(id) ON DELETE CASCADE,
  session_id          uuid REFERENCES event_sessions(id) ON DELETE CASCADE,
  user_id             uuid REFERENCES auth.users(id),    -- NULL = leader registered someone else
  name                text NOT NULL,
  meal_type           text NOT NULL DEFAULT 'Regular',
  dietary             text,                              -- allergy / specific need
  registration_status text NOT NULL DEFAULT 'registered'
                        CHECK (registration_status IN ('registered','waitlist','cancelled','checked_in')),
  created_by          uuid REFERENCES auth.users(id),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz,
  updated_by          uuid REFERENCES auth.users(id)
);
CREATE INDEX IF NOT EXISTS event_participants_instance_idx   ON event_participants(instance_id);
CREATE INDEX IF NOT EXISTS event_participants_conference_idx ON event_participants(instance_id, conference_id);
CREATE INDEX IF NOT EXISTS event_participants_session_idx    ON event_participants(session_id);

-- ---------------------------------------------------------------------------
-- 5. RLS — instance-scoped, NO leak. Mirrors choir (0011) exactly: read = any
--    instance member; organizing writes = owner/admin; a member registers their
--    OWN attendance and may edit/cancel it.
-- ---------------------------------------------------------------------------
ALTER TABLE event_center_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE conferences            ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_sessions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants     ENABLE ROW LEVEL SECURITY;

-- conferences: members read; owner/admin manage.
DROP POLICY IF EXISTS conferences_read   ON conferences;
DROP POLICY IF EXISTS conferences_write  ON conferences;
DROP POLICY IF EXISTS conferences_update ON conferences;
DROP POLICY IF EXISTS conferences_delete ON conferences;
CREATE POLICY conferences_read   ON conferences FOR SELECT
  USING (user_in_instance(instance_id));
CREATE POLICY conferences_write  ON conferences FOR INSERT
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY conferences_update ON conferences FOR UPDATE
  USING (user_role_in_instance(instance_id) IN ('owner','admin'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY conferences_delete ON conferences FOR DELETE
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- event_center_resources (rooms): members read; owner/admin manage.
DROP POLICY IF EXISTS event_center_resources_read   ON event_center_resources;
DROP POLICY IF EXISTS event_center_resources_write  ON event_center_resources;
DROP POLICY IF EXISTS event_center_resources_update ON event_center_resources;
DROP POLICY IF EXISTS event_center_resources_delete ON event_center_resources;
CREATE POLICY event_center_resources_read   ON event_center_resources FOR SELECT
  USING (user_in_instance(instance_id));
CREATE POLICY event_center_resources_write  ON event_center_resources FOR INSERT
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY event_center_resources_update ON event_center_resources FOR UPDATE
  USING (user_role_in_instance(instance_id) IN ('owner','admin'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY event_center_resources_delete ON event_center_resources FOR DELETE
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- event_sessions: members read; owner/admin manage.
DROP POLICY IF EXISTS event_sessions_read   ON event_sessions;
DROP POLICY IF EXISTS event_sessions_write  ON event_sessions;
DROP POLICY IF EXISTS event_sessions_update ON event_sessions;
DROP POLICY IF EXISTS event_sessions_delete ON event_sessions;
CREATE POLICY event_sessions_read   ON event_sessions FOR SELECT
  USING (user_in_instance(instance_id));
CREATE POLICY event_sessions_write  ON event_sessions FOR INSERT
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY event_sessions_update ON event_sessions FOR UPDATE
  USING (user_role_in_instance(instance_id) IN ('owner','admin'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY event_sessions_delete ON event_sessions FOR DELETE
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- event_participants: members read all (the roll); a member registers their OWN
-- attendance; the registrant or owner/admin edits/cancels; same for delete.
DROP POLICY IF EXISTS event_participants_read   ON event_participants;
DROP POLICY IF EXISTS event_participants_insert ON event_participants;
DROP POLICY IF EXISTS event_participants_update ON event_participants;
DROP POLICY IF EXISTS event_participants_delete ON event_participants;
CREATE POLICY event_participants_read   ON event_participants FOR SELECT
  USING (user_in_instance(instance_id));
CREATE POLICY event_participants_insert ON event_participants FOR INSERT
  WITH CHECK (user_in_instance(instance_id) AND created_by = auth.uid());
CREATE POLICY event_participants_update ON event_participants FOR UPDATE
  USING (user_in_instance(instance_id) AND (created_by = auth.uid() OR user_role_in_instance(instance_id) IN ('owner','admin')))
  WITH CHECK (user_in_instance(instance_id));
CREATE POLICY event_participants_delete ON event_participants FOR DELETE
  USING (created_by = auth.uid() OR user_role_in_instance(instance_id) IN ('owner','admin'));

-- ---------------------------------------------------------------------------
-- 6. updated_at touch trigger (reuses engagement_touch_updated_at; define-or-
--    replace so this migration is standalone, mirroring 0011).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.engagement_touch_updated_at()
RETURNS trigger AS $fn$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$fn$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS conferences_touch_updated ON conferences;
CREATE TRIGGER conferences_touch_updated
  BEFORE UPDATE ON conferences
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

DROP TRIGGER IF EXISTS event_center_resources_touch_updated ON event_center_resources;
CREATE TRIGGER event_center_resources_touch_updated
  BEFORE UPDATE ON event_center_resources
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

DROP TRIGGER IF EXISTS event_sessions_touch_updated ON event_sessions;
CREATE TRIGGER event_sessions_touch_updated
  BEFORE UPDATE ON event_sessions
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

DROP TRIGGER IF EXISTS event_participants_touch_updated ON event_participants;
CREATE TRIGGER event_participants_touch_updated
  BEFORE UPDATE ON event_participants
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

-- ---------------------------------------------------------------------------
-- 7. REALTIME — stream all four so every device updates live (mirrors 0011).
-- ---------------------------------------------------------------------------
DO $realtime$
DECLARE
  t text;
  tables text[] := ARRAY['conferences','event_center_resources','event_sessions','event_participants'];
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
