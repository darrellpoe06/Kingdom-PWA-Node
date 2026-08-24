-- =============================================================================
-- 0147 — follow up in the app: a booking remembers its member requester
-- =============================================================================
-- Darrell 2026-08-24: "we can follow up in the app through message as well...
-- we don't need email... however it can be an option." The venue request form
-- runs both signed-out (the public ?request-space=1 door) and signed-in (the
-- in-app front door). When the REQUESTER THEMSELVES submits while signed in,
-- the booking now remembers their account — so staff can follow up in
-- Messages instead of (or beside) email/phone. Anonymous community requests
-- stay exactly as anonymous as before.
--
-- The stamp lives in the 0030 BEFORE-INSERT trigger, NOT the client, so a
-- forged client value can never claim someone else's identity: the function
-- overwrites requester_user unconditionally. Staff logging a booking on
-- BEHALF of someone (source 'staff') is NOT the requester, so no stamp —
-- otherwise the staffer's own account would masquerade as the requester's.
--
-- READ exposure unchanged: the whole table stays owner/admin-read (0030);
-- requester_user is visible only to the same staff who already see the
-- requester's name, email, and phone.
--
-- DEPENDS ON: 0030 (venue_bookings + venue_booking_force_public), 0146.
-- IDEMPOTENT: ADD COLUMN IF NOT EXISTS; CREATE OR REPLACE FUNCTION.
-- =============================================================================

ALTER TABLE venue_bookings ADD COLUMN IF NOT EXISTS requester_user uuid REFERENCES auth.users(id);

CREATE OR REPLACE FUNCTION public.venue_booking_force_public()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  NEW.instance_id := (SELECT id FROM instances WHERE slug = 'colg');
  -- The server, never the client, decides who the requester account is:
  -- the signed-in submitter when they speak for themselves, NULL otherwise.
  IF auth.uid() IS NOT NULL AND coalesce(NEW.source, '') <> 'staff' THEN
    NEW.requester_user := auth.uid();
  ELSE
    NEW.requester_user := NULL;
  END IF;
  IF auth.uid() IS NULL THEN
    NEW.status           := 'requested';
    NEW.quoted_price     := NULL;
    NEW.responsibilities := '{}'::jsonb;
    NEW.source           := 'public-request';
  END IF;
  RETURN NEW;
END;
$fn$;

NOTIFY pgrst, 'reload schema';
