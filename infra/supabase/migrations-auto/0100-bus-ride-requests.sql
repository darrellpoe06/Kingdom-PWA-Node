-- =============================================================================
-- 0100 — Bus/Van Ministry: RIDE REQUESTS (a rider asks for a pickup)
-- =============================================================================
-- Declared by Darrell 2026-07-14: "Users need to be able to send messages to get
-- rides." The bus/van ministry surface (0095) is MEMBERS-ONLY -- every table is
-- gated by user_in_bus_ministry (owner/admin OR a row in bus_drivers). So a
-- church member who NEEDS a ride had no way to ask: the tab only serves the
-- drivers the coordinator added. A ride request dropped in the church-wide
-- family thread (engagement messages) would get lost and carries none of what a
-- driver actually needs (pickup spot, service date, wheelchair/walker, how many).
--
-- This adds bus_ride_requests: any INSTANCE MEMBER (a rider, not just a driver)
-- files a structured pickup request; the coordinator + drivers see it and act;
-- the rider tracks THEIR OWN and can cancel it. Mirrors the 0095 patterns
-- (instance-scoped, RLS-enforced, realtime-streamed) so the ministry's devices
-- update live.
--
-- ACCESS (RLS is the real gate; the client only mirrors it):
--   read   = a bus-ministry member (coordinator/driver) sees ALL for the
--            instance, OR the requester sees THEIR OWN.
--   insert = any instance member, filing under their own id (requested_by = me).
--   update = owner/admin (coordinator manages status + assignment) OR the
--            requester (edit/cancel their own).
--   delete = owner/admin only.
--
-- DEPENDS ON: schema-v2.1-infra (instances, user_in_instance,
--             user_role_in_instance), 0095-bus-ministry (bus_drivers,
--             user_in_bus_ministry, engagement_touch_updated_at).
-- IDEMPOTENT: CREATE ... IF NOT EXISTS, DROP-then-CREATE policies/trigger,
--             guarded publication add. Safe to re-run.
-- Word-first: "Bear ye one another's burdens, and so fulfil the law of Christ"
-- (Galatians 6:2).
-- =============================================================================

CREATE TABLE IF NOT EXISTS bus_ride_requests (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id          uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  requested_by         uuid REFERENCES auth.users(id),   -- the rider (own row per RLS)
  rider_name           text NOT NULL,
  rider_phone          text,
  pickup_area          text,                             -- e.g. "Urbana", "Champaign south"
  pickup_address       text,
  service_date         date,                             -- which Sunday they need it
  passengers           integer NOT NULL DEFAULT 1 CHECK (passengers >= 1),
  accessible_needed    boolean NOT NULL DEFAULT false,   -- wheelchair / walker
  notes                text,
  status               text NOT NULL DEFAULT 'new'
                         CHECK (status IN ('new','acknowledged','scheduled','completed','cancelled','declined')),
  assigned_driver_id   uuid REFERENCES bus_drivers(id) ON DELETE SET NULL,
  assigned_driver_name text,
  coordinator_note     text,
  created_by           uuid REFERENCES auth.users(id),
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz,
  updated_by           uuid REFERENCES auth.users(id)
);
CREATE INDEX IF NOT EXISTS bus_ride_requests_instance_idx ON bus_ride_requests(instance_id, created_at DESC);
CREATE INDEX IF NOT EXISTS bus_ride_requests_mine_idx     ON bus_ride_requests(instance_id, requested_by);

ALTER TABLE bus_ride_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bus_ride_requests_read   ON bus_ride_requests;
DROP POLICY IF EXISTS bus_ride_requests_insert ON bus_ride_requests;
DROP POLICY IF EXISTS bus_ride_requests_update ON bus_ride_requests;
DROP POLICY IF EXISTS bus_ride_requests_delete ON bus_ride_requests;

-- read: ministry members see all for the instance; a rider sees their own.
CREATE POLICY bus_ride_requests_read ON bus_ride_requests FOR SELECT
  USING (user_in_bus_ministry(instance_id) OR requested_by = auth.uid());

-- insert: any instance member, filing under their own id.
CREATE POLICY bus_ride_requests_insert ON bus_ride_requests FOR INSERT
  WITH CHECK (user_in_instance(instance_id) AND requested_by = auth.uid());

-- update: coordinator (owner/admin) manages status + assignment; the requester
-- may edit / cancel their own row.
CREATE POLICY bus_ride_requests_update ON bus_ride_requests FOR UPDATE
  USING (user_role_in_instance(instance_id) IN ('owner','admin') OR requested_by = auth.uid())
  WITH CHECK (user_in_instance(instance_id));

-- delete: owner/admin only.
CREATE POLICY bus_ride_requests_delete ON bus_ride_requests FOR DELETE
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- updated_at touch (reuses the shared trigger fn from 0095).
DROP TRIGGER IF EXISTS bus_ride_requests_touch_updated ON bus_ride_requests;
CREATE TRIGGER bus_ride_requests_touch_updated
  BEFORE UPDATE ON bus_ride_requests
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

-- realtime — stream so the ministry's devices update live.
DO $realtime$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'bus_ride_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bus_ride_requests;
  END IF;
END
$realtime$;
