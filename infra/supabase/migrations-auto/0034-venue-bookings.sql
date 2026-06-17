-- =============================================================================
-- 0030 — venue_bookings: COMMUNITY use of the church's two campuses
-- =============================================================================
-- Declared by Darrell 2026-06-17. The community asks to use the church's spaces a
-- lot — funerals, weddings, gatherings — across BOTH campuses (North, the main
-- ~44,000 sq ft church; South, the Event Center at 1109 N 4th St). This is DISTINCT
-- from the Conference (the church's OWN event, 0023/0027): this table holds the
-- bookings, responsibilities, and revenue for OUTSIDE community use of the campuses.
--
-- PATTERN: this is the PROVEN conference_public_registrations model (0027 / the
-- ?register link) applied to space requests — ANYONE may INSERT a request (the
-- public ?request-space=1 form + the in-app front door); only the church's
-- OWNER/ADMIN (Darrell / Christina / BG) may READ / manage the list. A requester
-- can NEVER read the bookings back (no anon SELECT) — no logged-out exposure
-- beyond their own submission. Pricing/contracts are never public: the whole table
-- is owner/admin-read-only, so quoted_price is staff-only by construction.
--
-- NO LEAK: instance_id is FORCED to the COLG instance by a BEFORE-INSERT trigger
-- (SECURITY DEFINER) so an anon client cannot misroute a row to another church.
-- The same trigger CONSTRAINS an anonymous insert (auth.uid() IS NULL) to a safe
-- shape — status forced to 'requested', no price, no pre-checked responsibilities,
-- source 'public-request' — so a public submitter can never self-approve or set a
-- rate. READ/UPDATE/DELETE are gated by user_role_in_instance(instance_id) IN
-- ('owner','admin'). RLS stays ENABLED; a table GRANT only lets a role REACH the
-- table, never bypass a policy.
--
-- DEPENDS ON: schema-v2.1-infra (instances, user_role_in_instance), 0012 ('colg'
--             instance), 0011/0023 (engagement_touch_updated_at).
-- IDEMPOTENT: CREATE ... IF NOT EXISTS, CREATE OR REPLACE, DROP-then-CREATE
--             policies/trigger, guarded publication add. Tier C (anon-write
--             surface, COLG-facing) — ship reviewed.
-- =============================================================================

CREATE TABLE IF NOT EXISTS venue_bookings (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id          uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  campus               text NOT NULL DEFAULT 'south'
                         CHECK (campus IN ('north','south')),
  space_id             text NOT NULL,          -- catalog key (e.g. 'north-sanctuary')
  space_name           text,                   -- denormalized label shown on the booking
  event_type           text NOT NULL DEFAULT 'community'
                         CHECK (event_type IN ('funeral','wedding','community')),
  event_title          text,
  requester_name       text NOT NULL,
  requester_email      text,
  requester_phone      text,
  organization         text,
  event_date           date,
  start_time           text,                   -- 'HH:MM' (24h); free of tz concerns
  end_time             text,
  expected_attendance  integer,
  status               text NOT NULL DEFAULT 'requested'
                         CHECK (status IN ('requested','reviewing','scheduled','declined','completed','cancelled')),
  quoted_price         numeric(10,2),          -- staff-entered REAL revenue line (never public)
  responsibilities     jsonb NOT NULL DEFAULT '{}'::jsonb,  -- { responsibilityKey: true } checklist state
  notes                text,
  source               text,                   -- 'public-request' | 'staff'
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz,
  updated_by           uuid REFERENCES auth.users(id)
);
CREATE INDEX IF NOT EXISTS venue_bookings_instance_idx ON venue_bookings(instance_id);
CREATE INDEX IF NOT EXISTS venue_bookings_date_idx     ON venue_bookings(event_date);
CREATE INDEX IF NOT EXISTS venue_bookings_created_idx   ON venue_bookings(created_at DESC);

-- ---------------------------------------------------------------------------
-- Force instance_id to COLG on insert, and constrain an ANONYMOUS insert to a
-- safe shape (a public requester cannot self-approve, set a price, or pre-check
-- responsibilities). Authenticated staff inserts pass through untouched (RLS
-- still requires owner/admin to write a row that isn't a plain request). Runs
-- BEFORE the NOT NULL / CHECK constraints. SECURITY DEFINER so its SELECT on
-- instances is not blocked by instances RLS.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.venue_booking_force_public()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  NEW.instance_id := (SELECT id FROM instances WHERE slug = 'colg');
  IF auth.uid() IS NULL THEN
    NEW.status           := 'requested';
    NEW.quoted_price     := NULL;
    NEW.responsibilities := '{}'::jsonb;
    NEW.source           := 'public-request';
  END IF;
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS venue_booking_force_public_t ON venue_bookings;
CREATE TRIGGER venue_booking_force_public_t
  BEFORE INSERT ON venue_bookings
  FOR EACH ROW EXECUTE FUNCTION public.venue_booking_force_public();

-- updated_at touch (reuses the shared function defined in 0011/0023).
DROP TRIGGER IF EXISTS venue_booking_touch_updated ON venue_bookings;
CREATE TRIGGER venue_booking_touch_updated
  BEFORE UPDATE ON venue_bookings
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

-- ---------------------------------------------------------------------------
-- GRANTs. This project lost its Supabase-default per-role grants; the 0024
-- restore deliberately leaves `anon` untouched. So anon needs an EXPLICIT INSERT
-- grant (without it the public form 403s with 42501 — the Choir incident). RLS
-- still gates ROWS; the grant only lets the role reach the table. Self-contained.
-- ---------------------------------------------------------------------------
GRANT INSERT ON venue_bookings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON venue_bookings TO authenticated;

ALTER TABLE venue_bookings ENABLE ROW LEVEL SECURITY;

-- INSERT: anyone (logged-out community member included) may submit a request. The
-- trigger forces instance + the safe public shape; the client cannot influence
-- routing, price, or status.
DROP POLICY IF EXISTS venue_bookings_insert       ON venue_bookings;
-- READ / manage: ONLY the church owner/admin (Darrell / Christina / BG). No anon
-- SELECT policy exists, so a requester can never read the bookings back, and
-- pricing/contracts are staff-only by construction.
DROP POLICY IF EXISTS venue_bookings_admin_read    ON venue_bookings;
DROP POLICY IF EXISTS venue_bookings_admin_update  ON venue_bookings;
DROP POLICY IF EXISTS venue_bookings_admin_delete  ON venue_bookings;

CREATE POLICY venue_bookings_insert ON venue_bookings FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
CREATE POLICY venue_bookings_admin_read ON venue_bookings FOR SELECT
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY venue_bookings_admin_update ON venue_bookings FOR UPDATE
  TO authenticated
  USING      (user_role_in_instance(instance_id) IN ('owner','admin'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY venue_bookings_admin_delete ON venue_bookings FOR DELETE
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- ---------------------------------------------------------------------------
-- REALTIME — stream so the organizer's booking calendar + revenue update live as
-- requests come in and staff schedule them.
-- ---------------------------------------------------------------------------
DO $realtime$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
       AND tablename = 'venue_bookings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE venue_bookings;
  END IF;
END $realtime$;

NOTIFY pgrst, 'reload schema';
