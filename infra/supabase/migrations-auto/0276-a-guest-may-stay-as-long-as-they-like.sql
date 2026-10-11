-- =============================================================================
-- 0276 — a guest may stay as long as they like, at the nightly rate
-- =============================================================================
-- Darrell, 2026-10-11, reading his own card on his phone:
--
--   "we dont want people to do short term leases because of staying passed 29
--    days!!!!!!! They can stay for a year with $150 a day if they want
--    too!!!!!!!!!!!!!!!!!!"
--
-- WHAT THE CARD SAID, measured on the live listing in his screenshot: "Up to
-- 29 nights here; for longer, apply for a lease." A guest who wanted sixty
-- nights at $150 was turned away from the booking and pointed at a lease — the
-- exact outcome he is rejecting.
--
-- THIS IS HIS SECOND TIME ASKING. 0269 line 77 records the first, in his own
-- words — "Not 29 day cap?... why?" — and the answer then was the note below.
-- He has now reaffirmed it plainly. The decision is his; this carries it out.
--
-- WHAT THE 29 WAS FOR, stated once and not argued (DR-0100: say the established
-- thing plainly, then stop). Two real facts sat behind it, and neither is
-- changed by this migration — only who decides:
--   • the Hotel Operators' Occupancy Tax and Champaign's 7% reach stays under
--     30 CONSECUTIVE days; past that a stay generally falls outside them;
--   • a 30+ night occupancy starts to carry tenancy characteristics, and
--     Illinois draws no bright line — it was on the ask-counsel list in 0269
--     and it still is.
-- Neither of those is a reason the APP should refuse the booking. They are
-- reasons the owner should know what he is agreeing to, which he does.
--
-- SO THE CAP GOES, AND NOTHING ELSE DOES. The one-year ceiling stays (a stay
-- is still a stay), the double-booking trigger stays, every other wall of 0269
-- stays. A guest can now ask for sixty nights, or three hundred, and the
-- family confirms or declines it the same way they always did.
--
-- Idempotent: safe to apply twice. Changes no existing row.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. THE CAP ITSELF
-- ---------------------------------------------------------------------------
-- GUARDED ON THE TABLE EXISTING, and that is not belt-and-braces. A bare
-- `ALTER TABLE public.door_stays ...` ERRORS on a database that has not
-- reached 0269 — measured 2026-10-11 against a chain that stopped short, where
-- this file failed with 'relation "public.door_stays" does not exist'. Several
-- CI legs replay a partial chain on purpose, and a migration that cannot
-- survive one is a migration that breaks them.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables
                  WHERE table_schema = 'public' AND table_name = 'door_stays') THEN
    RETURN;
  END IF;

  -- DROP IF EXISTS, not a rewrite: on a database that has already lost it this
  -- is a no-op, and on one that still carries it the ask simply stops being
  -- refused. `requested_by_family` keeps its meaning everywhere else; it is
  -- only this one constraint that treated a guest's own ask as the shorter kind.
  ALTER TABLE public.door_stays
    DROP CONSTRAINT IF EXISTS door_stays_guest_asks_under_30_nights;

  -- The year remains. A booking calendar is not a lease ledger, and an ask for
  -- four hundred nights is a typo or a misunderstanding, not an offer.
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'door_stays_at_most_a_year') THEN
    ALTER TABLE public.door_stays
      ADD CONSTRAINT door_stays_at_most_a_year CHECK (check_out - check_in <= 365);
  END IF;

  EXECUTE $c$
    COMMENT ON CONSTRAINT door_stays_at_most_a_year ON public.door_stays IS
      'A stay is at most a year. The 29-night guest cap that used to sit beside this was removed by 0276 (DR-0959): a guest may book any length at the nightly rate, and the family still confirms every one.'
  $c$;
  EXECUTE $c$
    COMMENT ON TABLE public.door_stays IS
      'Nights asked for and nights held on a door. A guest may ask for any length up to a year at the nightly rate (DR-0959); the family confirms, and a confirmed stay blocks the calendar.'
  $c$;
END $$;
