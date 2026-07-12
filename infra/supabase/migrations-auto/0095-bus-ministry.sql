-- =============================================================================
-- 0095 — Bus/Van Ministry (Church): roster + routes + vans + schedule +
--        reminders + messages + dev/ops requests
-- =============================================================================
-- Declared by Deacon Anderson to Darrell 2026-07-12. Deacon Anderson runs COLG's
-- bus/van ministry: ~4 drivers every Sunday across the routes he covers weekly
-- (Champaign south-of-Springfield, Champaign north-of-Springfield, Urbana, and
-- an accessibility van Champaign<->Urbana for walkers/wheelchairs). Drivers
-- arrive ~9:45am ("quarter to ten") and finish ~1:30pm. The LIVE pain he named:
-- the schedule comes out but nobody reminds the drivers they're scheduled -- "no
-- one's on the phones this morning." So the ministry needs, in the app: a driver
-- roster (with phone + email), the weekly Sunday schedule, a REMINDER queue that
-- fires the Thursday before, a shared message thread everyone sees together, and
-- a dev/ops intake so the ministry hands new requirements to the build team.
--
-- Built in the app (DR-0065) on real, instance-scoped, cross-device-synced data
-- (DR-0061), mirroring the Choir module (0011-choir-module.sql).
--
-- ACCESS: read = any bus-ministry member (owner/admin OR a row in bus_drivers);
-- edit on roster/routes/vans/schedule/reminders = owner/admin (the coordinator
-- is made admin). Drivers may post messages, confirm/decline THEIR OWN schedule
-- row, acknowledge THEIR OWN reminder, and submit dev/ops requests. RLS is the
-- real enforcement; the client mirrors it only so the UI matches.
--
-- DEPENDS ON: schema-v2.1-infra.sql (instances, instance_members,
--             user_in_instance, user_role_in_instance).
-- IDEMPOTENT: CREATE ... IF NOT EXISTS, DROP-then-CREATE policies/triggers,
--             guarded publication add. Safe to re-run.
-- Word-first: "Bear ye one another's burdens" (Galatians 6:2); "Let all things
-- be done decently and in order" (1 Corinthians 14:40).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. ROSTER — bus_drivers (phone + email; the coordinator + drivers + dispatch)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bus_drivers (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id  uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  user_id      uuid REFERENCES auth.users(id),   -- NULL = roster entry for a driver without an app account yet
  display_name text NOT NULL,
  phone        text,
  email        text,
  driver_role  text NOT NULL DEFAULT 'driver' CHECK (driver_role IN ('coordinator','driver','assistant','dispatch')),
  notes        text,
  active       boolean NOT NULL DEFAULT true,
  added_by     uuid REFERENCES auth.users(id),
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bus_drivers_instance_idx ON bus_drivers(instance_id);
CREATE INDEX IF NOT EXISTS bus_drivers_user_idx     ON bus_drivers(instance_id, user_id);

-- Access helper: a bus-ministry member is an owner/admin of the instance OR a
-- row in bus_drivers. SECURITY DEFINER (bypasses RLS to avoid recursion),
-- mirroring user_in_choir / user_in_instance.
CREATE OR REPLACE FUNCTION public.user_in_bus_ministry(instance_uuid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT user_role_in_instance(instance_uuid) IN ('owner','admin')
      OR EXISTS (
           SELECT 1 FROM bus_drivers
            WHERE instance_id = instance_uuid AND user_id = auth.uid()
         )
$$;

-- ---------------------------------------------------------------------------
-- 2. ROUTES — bus_routes (the lines drivers cover; accessibility flagged)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bus_routes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id  uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  name         text NOT NULL,
  area         text,
  description  text,
  accessible   boolean NOT NULL DEFAULT false,   -- wheelchair/walker route
  sort_order   integer NOT NULL DEFAULT 0,
  active       boolean NOT NULL DEFAULT true,
  created_by   uuid REFERENCES auth.users(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz,
  updated_by   uuid REFERENCES auth.users(id)
);
CREATE INDEX IF NOT EXISTS bus_routes_instance_idx ON bus_routes(instance_id, sort_order);

-- ---------------------------------------------------------------------------
-- 3. VANS — bus_vans (the vehicles; accessibility van flagged)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bus_vans (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id  uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  name         text NOT NULL,
  capacity     integer,
  accessible   boolean NOT NULL DEFAULT false,
  notes        text,
  active       boolean NOT NULL DEFAULT true,
  created_by   uuid REFERENCES auth.users(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz,
  updated_by   uuid REFERENCES auth.users(id)
);
CREATE INDEX IF NOT EXISTS bus_vans_instance_idx ON bus_vans(instance_id);

-- ---------------------------------------------------------------------------
-- 4. SCHEDULE — bus_schedule (one row per driver-assignment for a service date:
--    which route, in which van, arrive/end window; the driver confirms/declines)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bus_schedule (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id    uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  service_date   date NOT NULL,
  route_id       uuid REFERENCES bus_routes(id) ON DELETE SET NULL,
  route_name     text,                              -- snapshot for display stability
  van_id         uuid REFERENCES bus_vans(id) ON DELETE SET NULL,
  van_name       text,
  driver_id      uuid REFERENCES bus_drivers(id) ON DELETE SET NULL,
  driver_user_id uuid REFERENCES auth.users(id),    -- set when the driver has an app account (lets them confirm)
  driver_name    text,
  arrive_time    text NOT NULL DEFAULT '09:45',     -- "quarter to ten"
  end_time       text NOT NULL DEFAULT '13:30',     -- "about one thirty"
  status         text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('open','scheduled','confirmed','declined','covered')),
  notes          text,
  created_by     uuid REFERENCES auth.users(id),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz,
  updated_by     uuid REFERENCES auth.users(id)
);
CREATE INDEX IF NOT EXISTS bus_schedule_instance_idx ON bus_schedule(instance_id, service_date);

-- ---------------------------------------------------------------------------
-- 5. REMINDERS — bus_reminders (the fix for "no one called them": when the
--    schedule is out, a reminder per driver dated the Thursday before; the
--    coordinator marks sent, the driver acknowledges)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bus_reminders (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id    uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  service_date   date NOT NULL,
  schedule_id    uuid REFERENCES bus_schedule(id) ON DELETE CASCADE,
  driver_id      uuid REFERENCES bus_drivers(id) ON DELETE SET NULL,
  driver_user_id uuid REFERENCES auth.users(id),
  driver_name    text NOT NULL,
  route_name     text,
  send_on        date NOT NULL,                     -- Thursday-before by default
  channel        text NOT NULL DEFAULT 'app' CHECK (channel IN ('app','text','call','email')),
  status         text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','acknowledged','skipped')),
  sent_at        timestamptz,
  sent_by        uuid REFERENCES auth.users(id),
  note           text,
  created_by     uuid REFERENCES auth.users(id),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz,
  updated_by     uuid REFERENCES auth.users(id)
);
CREATE INDEX IF NOT EXISTS bus_reminders_instance_idx ON bus_reminders(instance_id, send_on);

-- ---------------------------------------------------------------------------
-- 6. MESSAGES — bus_messages (ministry-only thread everyone sees together;
--    NOT the instance-wide messages table, whose RLS would leak to the family)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bus_messages (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id  uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users(id),
  display_name text NOT NULL,
  body         text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bus_messages_instance_idx ON bus_messages(instance_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- 7. REQUESTS — bus_requests (the dev/ops intake: "tell me what more to add and
--    we'll do that" -- the ministry hands new requirements to the build team)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bus_requests (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id    uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  title          text NOT NULL,
  detail         text,
  submitted_by   uuid REFERENCES auth.users(id),
  submitter_name text NOT NULL,
  status         text NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewing','planned','shipped','declined')),
  priority       text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high')),
  resolution     text,
  created_by     uuid REFERENCES auth.users(id),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz,
  updated_by     uuid REFERENCES auth.users(id)
);
CREATE INDEX IF NOT EXISTS bus_requests_instance_idx ON bus_requests(instance_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- 8. RLS — read = any ministry member; write = owner/admin; drivers post
--    messages, confirm/decline their own schedule row, acknowledge their own
--    reminder, and submit requests.
-- ---------------------------------------------------------------------------
ALTER TABLE bus_drivers   ENABLE ROW LEVEL SECURITY;
ALTER TABLE bus_routes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE bus_vans      ENABLE ROW LEVEL SECURITY;
ALTER TABLE bus_schedule  ENABLE ROW LEVEL SECURITY;
ALTER TABLE bus_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE bus_messages  ENABLE ROW LEVEL SECURITY;
ALTER TABLE bus_requests  ENABLE ROW LEVEL SECURITY;

-- bus_drivers: members read; owner/admin manage.
DROP POLICY IF EXISTS bus_drivers_read   ON bus_drivers;
DROP POLICY IF EXISTS bus_drivers_write  ON bus_drivers;
DROP POLICY IF EXISTS bus_drivers_update ON bus_drivers;
DROP POLICY IF EXISTS bus_drivers_delete ON bus_drivers;
CREATE POLICY bus_drivers_read   ON bus_drivers FOR SELECT USING (user_in_bus_ministry(instance_id));
CREATE POLICY bus_drivers_write  ON bus_drivers FOR INSERT WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY bus_drivers_update ON bus_drivers FOR UPDATE USING (user_role_in_instance(instance_id) IN ('owner','admin')) WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY bus_drivers_delete ON bus_drivers FOR DELETE USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- bus_routes: members read; owner/admin manage.
DROP POLICY IF EXISTS bus_routes_read   ON bus_routes;
DROP POLICY IF EXISTS bus_routes_write  ON bus_routes;
DROP POLICY IF EXISTS bus_routes_update ON bus_routes;
DROP POLICY IF EXISTS bus_routes_delete ON bus_routes;
CREATE POLICY bus_routes_read   ON bus_routes FOR SELECT USING (user_in_bus_ministry(instance_id));
CREATE POLICY bus_routes_write  ON bus_routes FOR INSERT WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY bus_routes_update ON bus_routes FOR UPDATE USING (user_role_in_instance(instance_id) IN ('owner','admin')) WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY bus_routes_delete ON bus_routes FOR DELETE USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- bus_vans: members read; owner/admin manage.
DROP POLICY IF EXISTS bus_vans_read   ON bus_vans;
DROP POLICY IF EXISTS bus_vans_write  ON bus_vans;
DROP POLICY IF EXISTS bus_vans_update ON bus_vans;
DROP POLICY IF EXISTS bus_vans_delete ON bus_vans;
CREATE POLICY bus_vans_read   ON bus_vans FOR SELECT USING (user_in_bus_ministry(instance_id));
CREATE POLICY bus_vans_write  ON bus_vans FOR INSERT WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY bus_vans_update ON bus_vans FOR UPDATE USING (user_role_in_instance(instance_id) IN ('owner','admin')) WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY bus_vans_delete ON bus_vans FOR DELETE USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- bus_schedule: members read; owner/admin manage; a driver may UPDATE their own
-- row (confirm/decline) -- mirrors choir_absences' self-update pattern.
DROP POLICY IF EXISTS bus_schedule_read   ON bus_schedule;
DROP POLICY IF EXISTS bus_schedule_write  ON bus_schedule;
DROP POLICY IF EXISTS bus_schedule_update ON bus_schedule;
DROP POLICY IF EXISTS bus_schedule_delete ON bus_schedule;
CREATE POLICY bus_schedule_read   ON bus_schedule FOR SELECT USING (user_in_bus_ministry(instance_id));
CREATE POLICY bus_schedule_write  ON bus_schedule FOR INSERT WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY bus_schedule_update ON bus_schedule FOR UPDATE
  USING (user_role_in_instance(instance_id) IN ('owner','admin') OR driver_user_id = auth.uid())
  WITH CHECK (user_in_bus_ministry(instance_id));
CREATE POLICY bus_schedule_delete ON bus_schedule FOR DELETE USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- bus_reminders: members read; owner/admin create/send; a driver may UPDATE
-- their own reminder (acknowledge).
DROP POLICY IF EXISTS bus_reminders_read   ON bus_reminders;
DROP POLICY IF EXISTS bus_reminders_write  ON bus_reminders;
DROP POLICY IF EXISTS bus_reminders_update ON bus_reminders;
DROP POLICY IF EXISTS bus_reminders_delete ON bus_reminders;
CREATE POLICY bus_reminders_read   ON bus_reminders FOR SELECT USING (user_in_bus_ministry(instance_id));
CREATE POLICY bus_reminders_write  ON bus_reminders FOR INSERT WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY bus_reminders_update ON bus_reminders FOR UPDATE
  USING (user_role_in_instance(instance_id) IN ('owner','admin') OR driver_user_id = auth.uid())
  WITH CHECK (user_in_bus_ministry(instance_id));
CREATE POLICY bus_reminders_delete ON bus_reminders FOR DELETE USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- bus_messages: members read + post their own.
DROP POLICY IF EXISTS bus_messages_read   ON bus_messages;
DROP POLICY IF EXISTS bus_messages_insert ON bus_messages;
CREATE POLICY bus_messages_read   ON bus_messages FOR SELECT USING (user_in_bus_ministry(instance_id));
CREATE POLICY bus_messages_insert ON bus_messages FOR INSERT WITH CHECK (user_in_bus_ministry(instance_id) AND user_id = auth.uid());

-- bus_requests: members read + submit their own; owner/admin manage status.
DROP POLICY IF EXISTS bus_requests_read   ON bus_requests;
DROP POLICY IF EXISTS bus_requests_insert ON bus_requests;
DROP POLICY IF EXISTS bus_requests_update ON bus_requests;
DROP POLICY IF EXISTS bus_requests_delete ON bus_requests;
CREATE POLICY bus_requests_read   ON bus_requests FOR SELECT USING (user_in_bus_ministry(instance_id));
CREATE POLICY bus_requests_insert ON bus_requests FOR INSERT WITH CHECK (user_in_bus_ministry(instance_id) AND submitted_by = auth.uid());
CREATE POLICY bus_requests_update ON bus_requests FOR UPDATE
  USING (user_role_in_instance(instance_id) IN ('owner','admin') OR submitted_by = auth.uid())
  WITH CHECK (user_in_bus_ministry(instance_id));
CREATE POLICY bus_requests_delete ON bus_requests FOR DELETE USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- ---------------------------------------------------------------------------
-- 9. updated_at touch triggers (reuses engagement_touch_updated_at)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.engagement_touch_updated_at()
RETURNS trigger AS $fn$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$fn$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bus_routes_touch_updated ON bus_routes;
CREATE TRIGGER bus_routes_touch_updated BEFORE UPDATE ON bus_routes FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();
DROP TRIGGER IF EXISTS bus_vans_touch_updated ON bus_vans;
CREATE TRIGGER bus_vans_touch_updated BEFORE UPDATE ON bus_vans FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();
DROP TRIGGER IF EXISTS bus_schedule_touch_updated ON bus_schedule;
CREATE TRIGGER bus_schedule_touch_updated BEFORE UPDATE ON bus_schedule FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();
DROP TRIGGER IF EXISTS bus_reminders_touch_updated ON bus_reminders;
CREATE TRIGGER bus_reminders_touch_updated BEFORE UPDATE ON bus_reminders FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();
DROP TRIGGER IF EXISTS bus_requests_touch_updated ON bus_requests;
CREATE TRIGGER bus_requests_touch_updated BEFORE UPDATE ON bus_requests FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

-- ---------------------------------------------------------------------------
-- 10. REALTIME — stream all of them so the ministry's devices update live.
-- ---------------------------------------------------------------------------
DO $realtime$
DECLARE
  t text;
  tables text[] := ARRAY['bus_drivers','bus_routes','bus_vans','bus_schedule','bus_reminders','bus_messages','bus_requests'];
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  FOREACH t IN ARRAY tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END
$realtime$;
