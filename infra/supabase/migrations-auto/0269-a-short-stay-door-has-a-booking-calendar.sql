-- =============================================================================
-- 0269 — A SHORT-STAY DOOR HAS A BOOKING CALENDAR (DR-0907)
-- =============================================================================
-- Darrell, 2026-10-10: "Calendar for booking the apartment?" and "With
-- blackout dates for already booked..."
--
-- WHAT WAS TRUE: a door could be offered short-term with a nightly rate
-- (0155) and listed (0152), and nothing held a single night. No stay, no
-- blocked date, no way for a guest to ask for dates, no way to stop two
-- stays landing on the same night.
--
-- THE SHAPE.
--   * door_stays — one row per stay or per block on a door:
--       kind 'stay'  — a guest's nights (check_in .. check_out, the out day
--                      itself free for the next guest);
--       kind 'block' — the family's own blackout (a turnover, a repair, our
--                      own use), with a reason.
--     A stay is requested -> confirmed | declined; a confirmed stay or a
--     block may be cancelled. Nothing is deleted.
--   * NO DOUBLE BOOKING, by the database: a confirmed stay or a block can
--     never overlap another confirmed stay or block on the same door. The
--     check takes a lock on the door's row first, so two confirmations at the
--     same instant are made one after the other, and the second is refused.
--     (A trigger rather than an exclusion constraint: no extension to install
--     on the live database.)
--   * The PUBLIC calendar: door_booked_nights(door, from, to) returns only
--     the taken date ranges of a listed short-stay door — never a name, a
--     phone, a reason, or whether a range is a stay or a block.
--   * A guest with NO account asks: request_a_stay(...) writes a 'requested'
--     stay for a listed short-stay door, refused when the nights are taken,
--     with at most three open asks per contact per door.
--   * The family reads every row and decides; every ask, confirmation,
--     decline, cancel and block is on record_events (subject 'stay').
--
-- IDEMPOTENT + ADDITIVE.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.door_stays (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id   uuid NOT NULL REFERENCES public.instances(id) ON DELETE CASCADE,
  rental_id     uuid NOT NULL REFERENCES public.rentals(id) ON DELETE CASCADE,
  kind          text NOT NULL CHECK (kind IN ('stay', 'block')),
  status        text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'confirmed', 'declined', 'cancelled')),
  check_in      date NOT NULL,
  check_out     date NOT NULL,
  guest_name    text CHECK (guest_name IS NULL OR length(btrim(guest_name)) BETWEEN 1 AND 120),
  guest_phone   text CHECK (guest_phone IS NULL OR length(guest_phone) <= 40),
  guest_email   text CHECK (guest_email IS NULL OR length(guest_email) <= 200),
  guests        int CHECK (guests IS NULL OR guests BETWEEN 1 AND 20),
  note          text CHECK (note IS NULL OR length(note) <= 1000),
  block_reason  text CHECK (block_reason IS NULL OR length(block_reason) <= 300),
  nightly_rate  numeric CHECK (nightly_rate IS NULL OR nightly_rate >= 0),
  -- The lead guest's own word at the ask (research note: 21+ lead guest;
  -- house rules acknowledged). The ID is viewed once at check-in, never stored here.
  attests_21_plus   boolean NOT NULL DEFAULT false,
  accepts_house_rules boolean NOT NULL DEFAULT false,
  requested_by  uuid REFERENCES auth.users(id),
  requested_by_family boolean NOT NULL DEFAULT false,
  -- WHAT THE GUEST WANTS NEXT TIME (Darrell, 2026-10-10: "we like getting
  -- emails and other connections data for clarity on users preferences... may
  -- end up offering products inside the apartment for repeat stays"). Their
  -- own words, and their own YES to offers by email — unticked by default,
  -- stamped when given (CAN-SPAM: every offer email carries an unsubscribe).
  -- A text-message yes is separate and never inferred from this (TCPA).
  stay_wishes        text CHECK (stay_wishes IS NULL OR length(stay_wishes) <= 500),
  offers_by_email    boolean NOT NULL DEFAULT false,
  offers_by_email_at timestamptz,
  CONSTRAINT door_stays_offers_need_an_email CHECK (NOT offers_by_email OR guest_email IS NOT NULL),
  decided_by    uuid REFERENCES auth.users(id),
  decided_at    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT door_stays_out_after_in CHECK (check_out > check_in),
  -- A GUEST's own ask is at most 29 nights (research note 2026-10-10: the
  -- Hotel Operators' tax and Champaign's 7% cover stays under 30 consecutive
  -- days, and a 30+ night stay may start to look like a tenancy — no clear
  -- Illinois line, on the ask-counsel list). The FAMILY may enter a longer
  -- stay themselves (Darrell, 2026-10-10: "Not 29 day cap?... why?"): the
  -- default protects, the owner decides.
  CONSTRAINT door_stays_guest_asks_under_30_nights CHECK (kind <> 'stay' OR requested_by_family OR check_out - check_in <= 29),
  CONSTRAINT door_stays_at_most_a_year CHECK (check_out - check_in <= 365),
  CONSTRAINT door_stays_a_stay_names_its_guest CHECK (kind <> 'stay' OR guest_name IS NOT NULL),
  CONSTRAINT door_stays_a_stay_can_be_reached CHECK (kind <> 'stay' OR guest_phone IS NOT NULL OR guest_email IS NOT NULL),
  CONSTRAINT door_stays_a_block_is_the_familys CHECK (kind <> 'block' OR status IN ('confirmed', 'cancelled')),
  CONSTRAINT door_stays_a_guest_attests CHECK (kind <> 'stay' OR requested_by_family OR (attests_21_plus AND accepts_house_rules))
);
CREATE INDEX IF NOT EXISTS door_stays_door_idx ON public.door_stays(rental_id, check_in);
COMMENT ON TABLE public.door_stays IS
  'DR-0907: a short-stay door''s calendar — guests'' stays and the family''s blackout blocks. Confirmed stays and blocks never overlap (trigger, door row locked). The public sees taken ranges only.';

-- ---------------------------------------------------------------------------
-- No two confirmed stays or blocks on one door's nights.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.door_stays_never_overlap()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_clash record;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM rentals r WHERE r.id = NEW.rental_id AND r.instance_id = NEW.instance_id) THEN
    RAISE EXCEPTION 'the door named on this row is not in its instance' USING ERRCODE = 'check_violation';
  END IF;
  -- Who wrote it is the database's to say: the family (or its manager) on the
  -- calendar, or a guest through request_a_stay().
  IF TG_OP = 'INSERT' THEN
    NEW.requested_by_family := coalesce(door_role_of_user(NEW.rental_id), '') IN ('family', 'manager');
  END IF;
  IF NEW.status <> 'confirmed' THEN RETURN NEW; END IF;
  -- One at a time per door: the second of two simultaneous confirmations
  -- waits here, then sees the first and is refused.
  PERFORM 1 FROM rentals WHERE id = NEW.rental_id FOR UPDATE;
  SELECT s.check_in, s.check_out, s.kind INTO v_clash
    FROM door_stays s
   WHERE s.rental_id = NEW.rental_id AND s.id <> NEW.id AND s.status = 'confirmed'
     AND daterange(s.check_in, s.check_out, '[)') && daterange(NEW.check_in, NEW.check_out, '[)')
   LIMIT 1;
  IF FOUND THEN
    RAISE EXCEPTION 'those nights are already taken (% to %)', v_clash.check_in, v_clash.check_out
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.door_stays_never_overlap() FROM PUBLIC;

DROP TRIGGER IF EXISTS door_stays_overlap ON public.door_stays;
CREATE TRIGGER door_stays_overlap
  BEFORE INSERT OR UPDATE OF status, check_in, check_out, rental_id ON public.door_stays
  FOR EACH ROW EXECUTE FUNCTION public.door_stays_never_overlap();

-- Decisions: along the allowed moves, stamped with who and when; the guest,
-- the door and the ask's own time never change.
CREATE OR REPLACE FUNCTION public.door_stays_on_update()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.instance_id IS DISTINCT FROM OLD.instance_id OR NEW.rental_id IS DISTINCT FROM OLD.rental_id
     OR NEW.kind IS DISTINCT FROM OLD.kind OR NEW.created_at IS DISTINCT FROM OLD.created_at
     OR NEW.requested_by_family IS DISTINCT FROM OLD.requested_by_family THEN
    RAISE EXCEPTION 'which door, what kind, and who asked never change' USING ERRCODE = 'check_violation';
  END IF;
  -- A stay booked with no account may be ATTACHED to a guest's account by the
  -- family, once, so the guest keeps it and can book again; a stay that
  -- already belongs to someone is never re-pointed.
  IF NEW.requested_by IS DISTINCT FROM OLD.requested_by AND NOT (
       OLD.requested_by IS NULL AND NEW.requested_by IS NOT NULL
       AND coalesce(door_role_of_user(NEW.rental_id), '') IN ('family', 'manager')) THEN
    RAISE EXCEPTION 'a stay already belongs to its guest' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status AND NOT (
       (OLD.status = 'requested' AND NEW.status IN ('confirmed', 'declined', 'cancelled'))
    OR (OLD.status = 'confirmed' AND NEW.status = 'cancelled')) THEN
    RAISE EXCEPTION 'a stay cannot move from % to %', OLD.status, NEW.status USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.decided_by := auth.uid(); NEW.decided_at := clock_timestamp();
  ELSE
    NEW.decided_by := OLD.decided_by; NEW.decided_at := OLD.decided_at;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.door_stays_on_update() FROM PUBLIC;

DROP TRIGGER IF EXISTS door_stays_update ON public.door_stays;
CREATE TRIGGER door_stays_update
  BEFORE UPDATE ON public.door_stays
  FOR EACH ROW EXECUTE FUNCTION public.door_stays_on_update();

-- The family alone reads and writes the calendar directly (guests use the RPC).
REVOKE ALL ON public.door_stays FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.door_stays TO authenticated;
ALTER TABLE public.door_stays ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS door_stays_family_read ON public.door_stays;
CREATE POLICY door_stays_family_read ON public.door_stays FOR SELECT TO authenticated
  USING (door_role_of_user(rental_id) IN ('family', 'manager'));
DROP POLICY IF EXISTS door_stays_family_insert ON public.door_stays;
CREATE POLICY door_stays_family_insert ON public.door_stays FOR INSERT TO authenticated
  WITH CHECK (door_role_of_user(rental_id) IN ('family', 'manager'));
DROP POLICY IF EXISTS door_stays_family_update ON public.door_stays;
CREATE POLICY door_stays_family_update ON public.door_stays FOR UPDATE TO authenticated
  USING (door_role_of_user(rental_id) IN ('family', 'manager'))
  WITH CHECK (door_role_of_user(rental_id) IN ('family', 'manager'));
-- A GUEST WITH AN ACCOUNT keeps their stays (Darrell, 2026-10-10: "users keep
-- their accounts and historical information so they can rebook the place
-- asap"): they read their own rows — the ones they asked for signed in, or
-- that the family attached to them — and nobody else's.
DROP POLICY IF EXISTS door_stays_my_own ON public.door_stays;
CREATE POLICY door_stays_my_own ON public.door_stays FOR SELECT TO authenticated
  USING (requested_by IS NOT NULL AND requested_by = auth.uid());
-- No DELETE: a cancelled stay stays on the record.

-- ---------------------------------------------------------------------------
-- The public calendar: taken ranges only, for a listed short-stay door.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.door_booked_nights(p_rental uuid, p_from date, p_to date)
RETURNS TABLE (taken_from date, taken_to date)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.check_in, s.check_out
    FROM door_stays s JOIN rentals r ON r.id = s.rental_id
   WHERE s.rental_id = p_rental
     AND s.status = 'confirmed'
     AND r.listed_at IS NOT NULL AND r.offering IN ('short-term', 'both')
     AND p_to > p_from AND p_to - p_from <= 400
     AND daterange(s.check_in, s.check_out, '[)') && daterange(p_from, p_to, '[)')
   ORDER BY s.check_in
$$;
REVOKE ALL ON FUNCTION public.door_booked_nights(uuid, date, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.door_booked_nights(uuid, date, date) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- A guest asks for nights, with or without an account.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.request_a_stay(
  p_rental uuid, p_in date, p_out date, p_name text, p_phone text, p_email text, p_guests int, p_note text,
  p_21_plus boolean, p_house_rules boolean, p_wishes text DEFAULT NULL, p_offers_by_email boolean DEFAULT false)
RETURNS uuid
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE r record; v_id uuid; v_contact text; v_open int;
BEGIN
  SELECT id, instance_id, nightly_rate, listed_at, offering INTO r FROM rentals WHERE id = p_rental;
  IF r.id IS NULL OR r.listed_at IS NULL OR coalesce(r.offering, '') NOT IN ('short-term', 'both') THEN
    RAISE EXCEPTION 'this place is not taking stays' USING ERRCODE = 'check_violation';
  END IF;
  IF p_in < (now() AT TIME ZONE 'utc')::date THEN
    RAISE EXCEPTION 'the first night has already passed' USING ERRCODE = 'check_violation';
  END IF;
  IF EXISTS (SELECT 1 FROM door_stays s WHERE s.rental_id = p_rental AND s.status = 'confirmed'
              AND daterange(s.check_in, s.check_out, '[)') && daterange(p_in, p_out, '[)')) THEN
    RAISE EXCEPTION 'those nights are already taken' USING ERRCODE = 'check_violation';
  END IF;
  v_contact := lower(btrim(coalesce(nullif(btrim(p_phone), ''), p_email, '')));
  SELECT count(*) INTO v_open FROM door_stays s
   WHERE s.rental_id = p_rental AND s.status = 'requested'
     AND lower(btrim(coalesce(nullif(btrim(s.guest_phone), ''), s.guest_email, ''))) = v_contact;
  IF v_contact <> '' AND v_open >= 3 THEN
    RAISE EXCEPTION 'you already have asks waiting on this place' USING ERRCODE = 'check_violation';
  END IF;
  IF NOT coalesce(p_21_plus, false) OR NOT coalesce(p_house_rules, false) THEN
    RAISE EXCEPTION 'the lead guest must be 21 or older and accept the house rules' USING ERRCODE = 'check_violation';
  END IF;
  INSERT INTO door_stays (instance_id, rental_id, kind, status, check_in, check_out, guest_name, guest_phone, guest_email, guests, note, nightly_rate, requested_by, attests_21_plus, accepts_house_rules,
                          stay_wishes, offers_by_email, offers_by_email_at)
  VALUES (r.instance_id, p_rental, 'stay', 'requested', p_in, p_out, nullif(btrim(p_name), ''), nullif(btrim(p_phone), ''),
          nullif(btrim(p_email), ''), p_guests, nullif(btrim(p_note), ''), r.nightly_rate, auth.uid(), true, true,
          nullif(btrim(p_wishes), ''), coalesce(p_offers_by_email, false) AND nullif(btrim(p_email), '') IS NOT NULL,
          CASE WHEN coalesce(p_offers_by_email, false) AND nullif(btrim(p_email), '') IS NOT NULL THEN clock_timestamp() END)
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION public.request_a_stay(uuid, date, date, text, text, text, int, text, boolean, boolean, text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_a_stay(uuid, date, date, text, text, text, int, text, boolean, boolean, text, boolean) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- The clock covers the calendar.
-- ---------------------------------------------------------------------------
ALTER TABLE public.record_events DROP CONSTRAINT IF EXISTS record_events_subject_check;
ALTER TABLE public.record_events ADD CONSTRAINT record_events_subject_check
  CHECK (subject IN ('rent', 'work', 'document', 'camera', 'stay'));
DROP POLICY IF EXISTS record_events_read ON public.record_events;
CREATE POLICY record_events_read ON public.record_events FOR SELECT TO authenticated
  USING (CASE subject
           WHEN 'rent' THEN EXISTS (SELECT 1 FROM rent_records r WHERE r.id = subject_id)
           WHEN 'work' THEN EXISTS (SELECT 1 FROM tenant_maintenance_requests w WHERE w.id = subject_id)
           WHEN 'document' THEN EXISTS (SELECT 1 FROM property_documents d WHERE d.id = subject_id)
           WHEN 'camera' THEN EXISTS (SELECT 1 FROM door_camera_access a WHERE a.id = subject_id)
           WHEN 'stay' THEN EXISTS (SELECT 1 FROM door_stays s WHERE s.id = subject_id)
           ELSE false END);

CREATE OR REPLACE FUNCTION public.record_events_from_stay()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO record_events (instance_id, subject, subject_id, event, to_value, detail, by_user)
    VALUES (NEW.instance_id, 'stay', NEW.id, CASE NEW.kind WHEN 'block' THEN 'blocked' ELSE 'asked' END, NEW.status,
            jsonb_strip_nulls(jsonb_build_object('check_in', NEW.check_in, 'check_out', NEW.check_out, 'guest', NEW.guest_name,
              'guests', NEW.guests, 'reason', NEW.block_reason, 'rental_id', NEW.rental_id)),
            auth.uid());
  ELSIF NEW.status IS DISTINCT FROM OLD.status OR NEW.check_in IS DISTINCT FROM OLD.check_in OR NEW.check_out IS DISTINCT FROM OLD.check_out THEN
    INSERT INTO record_events (instance_id, subject, subject_id, event, from_value, to_value, detail, by_user)
    VALUES (NEW.instance_id, 'stay', NEW.id, CASE WHEN NEW.status IS DISTINCT FROM OLD.status THEN NEW.status ELSE 'moved' END,
            OLD.status, NEW.status,
            jsonb_build_object('check_in', jsonb_build_array(OLD.check_in, NEW.check_in), 'check_out', jsonb_build_array(OLD.check_out, NEW.check_out)),
            auth.uid());
  END IF;
  RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION public.record_events_from_stay() FROM PUBLIC;

DROP TRIGGER IF EXISTS door_stays_events ON public.door_stays;
CREATE TRIGGER door_stays_events
  AFTER INSERT OR UPDATE ON public.door_stays
  FOR EACH ROW EXECUTE FUNCTION public.record_events_from_stay();

SELECT public.apply_viewer_readonly_overlay();
SELECT public.apply_assistant_scope_overlay();

NOTIFY pgrst, 'reload schema';
