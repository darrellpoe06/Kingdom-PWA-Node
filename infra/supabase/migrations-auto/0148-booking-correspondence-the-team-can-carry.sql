-- =============================================================================
-- 0148 — booking correspondence the team can carry (nobody-out-nobody-lost)
-- =============================================================================
-- Darrell 2026-08-24: "create an account in the Love Corner App... and we will
-- get back to you directly... also the media team should be able to see the
-- historical texts between the potential congregations we will serve... so if
-- someone is out we still have what we need and can contact the parties."
--
-- WHY NOT the Messages surface: direct messages are end-to-end encrypted
-- between exactly two accounts BY DESIGN — the team can never read them, and
-- that is a feature, not a gap. Team-visible history therefore lives ON THE
-- BOOKING: venue_booking_messages, a shared, append-only conversation per
-- request that the whole staff (and the requester, for their own request) can
-- read — so when one person is out, the next person has the whole thread.
--
-- WHO SEES WHAT (RLS, the real gate):
--   - Staff (owner/admin of the booking's instance): read + write every thread.
--   - The requester (venue_bookings.requester_user = auth.uid(), stamped by
--     the 0147 trigger — signed-in self-submissions only): read + write the
--     thread on THEIR OWN booking. This is the "create an account and we get
--     back to you directly" loop, closed in-app.
--   - Anonymous requesters have no account to read with — the thread is
--     staff-side context for them (contact stays phone/email), and the form
--     invites account creation so the direct loop exists next time.
--   - No UPDATE, no DELETE for anyone: the record survives people being out.
--     (Deleting the booking cascades its thread — the owner's existing right.)
--
-- IDENTITY IS SERVER-STAMPED: author + author_email come from auth, never the
-- client, so nobody can speak as someone else in the record.
--
-- The requester's own-bookings read comes via my_venue_requests() — a SAFE
-- COLUMN SHAPE (no quoted_price, no internal responsibilities/notes), so the
-- 0030 "pricing is never public" posture holds even for the requester row.
--
-- DEPENDS ON: 0030 (venue_bookings), 0147 (requester_user).
-- IDEMPOTENT: IF NOT EXISTS / OR REPLACE / DROP-then-CREATE policies.
-- =============================================================================

CREATE TABLE IF NOT EXISTS venue_booking_messages (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id   uuid NOT NULL REFERENCES venue_bookings(id) ON DELETE CASCADE,
  author       uuid REFERENCES auth.users(id),
  author_email text,
  from_staff   boolean NOT NULL DEFAULT false,
  body         text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 4000),
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS venue_booking_messages_booking_idx
  ON venue_booking_messages(booking_id, created_at);

-- Server stamps the speaker; the client's claim is overwritten every time.
CREATE OR REPLACE FUNCTION public.venue_booking_message_stamp()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  NEW.author       := auth.uid();
  NEW.author_email := auth.jwt() ->> 'email';
  NEW.from_staff   := EXISTS (
    SELECT 1 FROM venue_bookings b
     WHERE b.id = NEW.booking_id
       AND coalesce(user_role_in_instance(b.instance_id), '') IN ('owner','admin')
  );
  NEW.created_at   := now();
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS venue_booking_message_stamp_t ON venue_booking_messages;
CREATE TRIGGER venue_booking_message_stamp_t
  BEFORE INSERT ON venue_booking_messages
  FOR EACH ROW EXECUTE FUNCTION public.venue_booking_message_stamp();

GRANT SELECT, INSERT ON venue_booking_messages TO authenticated;

ALTER TABLE venue_booking_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS venue_booking_messages_read  ON venue_booking_messages;
DROP POLICY IF EXISTS venue_booking_messages_write ON venue_booking_messages;

-- Read: staff of the booking's instance, or the booking's own stamped requester.
CREATE POLICY venue_booking_messages_read ON venue_booking_messages FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM venue_bookings b
     WHERE b.id = booking_id
       AND (coalesce(user_role_in_instance(b.instance_id), '') IN ('owner','admin')
            OR b.requester_user = auth.uid())
  ));
-- Write: the same two classes; the trigger stamps who actually spoke.
CREATE POLICY venue_booking_messages_write ON venue_booking_messages FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM venue_bookings b
     WHERE b.id = booking_id
       AND (coalesce(user_role_in_instance(b.instance_id), '') IN ('owner','admin')
            OR b.requester_user = auth.uid())
  ));

-- ---------------------------------------------------------------------------
-- The requester's own requests, in the SAFE shape (no price, no internal
-- fields) — the in-app "we'll get back to you directly" view.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.my_venue_requests()
RETURNS TABLE (
  id uuid, campus text, space_name text, event_type text, event_title text,
  event_date date, start_time text, end_time text, status text, created_at timestamptz
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'my_venue_requests: not authenticated';
  END IF;
  RETURN QUERY
    SELECT b.id, b.campus, b.space_name, b.event_type, b.event_title,
           b.event_date, b.start_time, b.end_time, b.status, b.created_at
      FROM venue_bookings b
     WHERE b.requester_user = auth.uid()
     ORDER BY b.created_at DESC;
END;
$$;
REVOKE ALL ON FUNCTION public.my_venue_requests() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.my_venue_requests() TO authenticated;

-- Realtime for the thread (guarded, same as 0030) so replies appear live.
DO $realtime$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
       AND tablename = 'venue_booking_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE venue_booking_messages;
  END IF;
END $realtime$;

NOTIFY pgrst, 'reload schema';
