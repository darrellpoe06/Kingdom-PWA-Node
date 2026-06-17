-- =============================================================================
-- 0024 — Conference VENUES (buildings): the event center serves MULTIPLE
--        buildings, not one
-- =============================================================================
-- Declared by Darrell 2026-06-16: COLG runs events across more than one
-- building — the Main Campus (312 E. Bradley Ave) AND the South Campus Event
-- Center across the street (1109 N 4th Street, Champaign, IL) — and the model
-- must extend to more buildings later. So a venue (building) dimension sits
-- above rooms: every room belongs to a building, and a conference / session
-- happens at a specific building, so capacity + rooms scope to that venue.
--
-- ADDITIVE on 0023 (conference / event center): a new `venues` table + nullable
-- `venue_id` foreign keys on event_center_resources / conferences /
-- event_sessions + a `use_types` tag on rooms (so the right module can pick the
-- right room: service / class / food / facility). Nothing in 0023 is changed or
-- dropped — meals, Service<->Choir, sync, rooms, breakouts all keep working;
-- existing rows just have a NULL venue_id until assigned.
--
-- ACCESS: venues are instance-scoped + RLS exactly like the rest (read =
-- user_in_instance; manage = owner/admin), so no cross-instance leak.
--
-- DEPENDS ON: schema-v2.1-infra (instances, user_in_instance,
--             user_role_in_instance), 0012 (the 'colg' church instance),
--             0023 (event_center_resources / conferences / event_sessions).
-- IDEMPOTENT: CREATE ... IF NOT EXISTS, ADD COLUMN IF NOT EXISTS, ON CONFLICT /
--             WHERE NOT EXISTS seeds, DROP-then-CREATE policies/trigger. Re-runs
--             safely.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. VENUES — buildings. UNIQUE(instance_id, name) so the seed + any future
--    add is idempotent and a building name is unambiguous within a church.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS venues (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id  uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  name         text NOT NULL,
  address      text,
  notes        text,
  sort_order   integer NOT NULL DEFAULT 0,
  status       text NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  created_by   uuid REFERENCES auth.users(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz,
  updated_by   uuid REFERENCES auth.users(id)
);
CREATE INDEX IF NOT EXISTS venues_instance_idx ON venues(instance_id);
CREATE UNIQUE INDEX IF NOT EXISTS venues_instance_name_uniq ON venues(instance_id, name);

-- ---------------------------------------------------------------------------
-- 2. Each ROOM belongs to a building; tag what each room SUPPORTS so the right
--    module picks the right room (service / class / food / facility).
-- ---------------------------------------------------------------------------
ALTER TABLE event_center_resources ADD COLUMN IF NOT EXISTS venue_id  uuid REFERENCES venues(id) ON DELETE SET NULL;
ALTER TABLE event_center_resources ADD COLUMN IF NOT EXISTS use_types text[] NOT NULL DEFAULT '{}';
CREATE INDEX IF NOT EXISTS event_center_resources_venue_idx ON event_center_resources(venue_id);

-- ---------------------------------------------------------------------------
-- 3. A CONFERENCE and each SESSION happen at a specific building.
-- ---------------------------------------------------------------------------
ALTER TABLE conferences    ADD COLUMN IF NOT EXISTS venue_id uuid REFERENCES venues(id) ON DELETE SET NULL;
ALTER TABLE event_sessions ADD COLUMN IF NOT EXISTS venue_id uuid REFERENCES venues(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS event_sessions_venue_idx ON event_sessions(venue_id);

-- ---------------------------------------------------------------------------
-- 4. RLS — instance-scoped, mirrors 0023 / choir exactly. Read = any instance
--    member; manage = owner/admin. No cross-instance leak.
-- ---------------------------------------------------------------------------
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS venues_read   ON venues;
DROP POLICY IF EXISTS venues_write  ON venues;
DROP POLICY IF EXISTS venues_update ON venues;
DROP POLICY IF EXISTS venues_delete ON venues;
CREATE POLICY venues_read   ON venues FOR SELECT
  USING (user_in_instance(instance_id));
CREATE POLICY venues_write  ON venues FOR INSERT
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY venues_update ON venues FOR UPDATE
  USING (user_role_in_instance(instance_id) IN ('owner','admin'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY venues_delete ON venues FOR DELETE
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- ---------------------------------------------------------------------------
-- 5. updated_at touch trigger (reuses the shared function from 0011/0023).
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS venues_touch_updated ON venues;
CREATE TRIGGER venues_touch_updated
  BEFORE UPDATE ON venues
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

-- ---------------------------------------------------------------------------
-- 6. REALTIME — stream venues so every device sees building changes live.
-- ---------------------------------------------------------------------------
DO $realtime$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'venues'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE venues;
  END IF;
END $realtime$;

-- ---------------------------------------------------------------------------
-- 7. SEED the two real COLG buildings (slug 'colg', from 0012). Idempotent via
--    the UNIQUE(instance_id, name) constraint. Addresses are real: Main Campus
--    312 E. Bradley Ave; South Campus Event Center 1109 N 4th Street, Champaign IL.
-- ---------------------------------------------------------------------------
INSERT INTO venues (instance_id, name, address, sort_order)
  VALUES ((SELECT id FROM instances WHERE slug = 'colg'), 'Main Campus', '312 E. Bradley Avenue, Champaign, IL 61820', 0)
  ON CONFLICT (instance_id, name) DO NOTHING;
INSERT INTO venues (instance_id, name, address, sort_order)
  VALUES ((SELECT id FROM instances WHERE slug = 'colg'), 'South Campus Event Center', '1109 N 4th Street, Champaign, IL', 1)
  ON CONFLICT (instance_id, name) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 8. SEED the South Campus Event Center's rooms, tagged by what they support so
--    Learn (classes), meals (Kitchen / food), and services (main_service) can
--    each pick the right room. Idempotent via WHERE NOT EXISTS on
--    (instance_id, venue_id, name) — no unique index added (leaders may name a
--    room the same across buildings). Capacities are intentionally left NULL:
--    leadership sets the REAL seat counts in-app (no painted numbers — the
--    capacity-vs-registration feature reads real values). Bathrooms carry no
--    capacity and are not booked — listed for completeness.
-- ---------------------------------------------------------------------------
INSERT INTO event_center_resources (instance_id, venue_id, name, capacity, use_types, location_note, sort_order)
  SELECT i.id, v.id, 'Main Sanctuary', NULL, ARRAY['service','class'], 'Services + large gatherings (high capacity)', 0
    FROM instances i JOIN venues v ON v.instance_id = i.id AND v.name = 'South Campus Event Center'
   WHERE i.slug = 'colg'
     AND NOT EXISTS (SELECT 1 FROM event_center_resources r WHERE r.instance_id = i.id AND r.venue_id = v.id AND r.name = 'Main Sanctuary');

INSERT INTO event_center_resources (instance_id, venue_id, name, capacity, use_types, location_note, sort_order)
  SELECT i.id, v.id, 'Fellowship Hall', NULL, ARRAY['class','food','service'], 'Classes / events / dining; service overflow (medium capacity)', 1
    FROM instances i JOIN venues v ON v.instance_id = i.id AND v.name = 'South Campus Event Center'
   WHERE i.slug = 'colg'
     AND NOT EXISTS (SELECT 1 FROM event_center_resources r WHERE r.instance_id = i.id AND r.venue_id = v.id AND r.name = 'Fellowship Hall');

INSERT INTO event_center_resources (instance_id, venue_id, name, capacity, use_types, location_note, sort_order)
  SELECT i.id, v.id, 'Kitchen', NULL, ARRAY['food'], 'Food prep; ties to meals / catering', 2
    FROM instances i JOIN venues v ON v.instance_id = i.id AND v.name = 'South Campus Event Center'
   WHERE i.slug = 'colg'
     AND NOT EXISTS (SELECT 1 FROM event_center_resources r WHERE r.instance_id = i.id AND r.venue_id = v.id AND r.name = 'Kitchen');

INSERT INTO event_center_resources (instance_id, venue_id, name, capacity, use_types, location_note, sort_order)
  SELECT i.id, v.id, 'Bathrooms', NULL, ARRAY['facility'], 'Facility (not booked)', 3
    FROM instances i JOIN venues v ON v.instance_id = i.id AND v.name = 'South Campus Event Center'
   WHERE i.slug = 'colg'
     AND NOT EXISTS (SELECT 1 FROM event_center_resources r WHERE r.instance_id = i.id AND r.venue_id = v.id AND r.name = 'Bathrooms');

NOTIFY pgrst, 'reload schema';
