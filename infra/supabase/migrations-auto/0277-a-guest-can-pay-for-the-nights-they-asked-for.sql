-- =============================================================================
-- 0277 — a guest can pay for the nights they asked for, with Square
-- =============================================================================
-- Darrell, 2026-10-11, in two messages seconds apart, right after the night
-- cap came off:
--
--   "If they pay!!!!!!!!!!!"
--   "Square payment options!!!!!!!!!"
--
-- Any number of nights, yes — and paid for. The booking card could show a
-- total and nothing else: the guest asked, and then waited for a message
-- telling them how to pay. Booking.jsx said so in as many words — "Nothing is
-- charged here. The family confirms, then sends the address, check-in steps
-- and how to pay."
--
-- THE RAIL ALREADY EXISTS AND NOTHING COULD REACH IT. 0262 added
-- rent_payee.square_link for exactly this, on Darrell's own 2026-10-10 word
-- recorded in that file: "Christina already has a square account we can use
-- that for payment options". It is the family's own Square PAYMENT LINK — a
-- link, never a key — and rent-pay.js already validates and opens it for a
-- TENANT paying rent. A short-stay guest has no account at all, and
-- rent_payee's read policy is `TO authenticated`, so the one road to the one
-- thing they need to do was closed to them.
--
-- SO THIS PUBLISHES THE LINK, AND ONLY THE LINK, FOR A DOOR THAT IS ACTUALLY
-- ON THE SHELF. Narrow on purpose:
--   * one column out of rent_payee — not the cashtag, the Zelle address, the
--     bank-deposit wording or who a cheque is payable to. Those are the
--     tenant relationship's business and a stranger has no claim on them.
--   * only for a door that is LISTED and offered for short stays. A pay link
--     for a door nobody can book is not a thing a stranger needs.
--   * only a real Square address, checked here as well as at the write, so a
--     mistyped or swapped link cannot be served to a guest from this road.
--
-- MONEY STILL DOES NOT MOVE IN THE APP. 0055 hardwires
-- rent_records.money_moved_in_app false with a CHECK, and nothing here
-- changes that: the app shows the guest what to pay and hands them to Square,
-- which is Square's business and not ours. The family confirms the stay and
-- confirms the money landed, exactly as they do for rent.
--
-- Idempotent: safe to apply twice. Adds no column and changes no row.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.public_stay_payment(p_rental uuid)
RETURNS TABLE (
  square_link  text,
  nightly_rate numeric
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    -- CHECKED HERE TOO, not only where it is written. 0262 constrains the
    -- column, but this is the road a STRANGER is sent down with money in
    -- hand; it costs one regex to make sure what we hand them is Square and
    -- not somewhere else entirely.
    CASE
      WHEN p.square_link ~ '^https://(square\.link|checkout\.square\.site|squareup\.com|[a-z0-9-]+\.square\.site)/'
      THEN p.square_link
    END,
    r.nightly_rate
  FROM rentals r
  JOIN rent_payee p ON p.instance_id = r.instance_id
 WHERE r.id = p_rental
   AND r.listed_at IS NOT NULL
   -- 'short-term', not 'short-stay'. The first version of this line used the
   -- latter, which is not a value `rentals.offering` can hold (0155 constrains
   -- it to long-term / short-term / both), so the pay link would have been
   -- withheld from EVERY door while failing nowhere. Found because a test
   -- returned no row and the seed behind it had silently violated the same
   -- CHECK.
   AND coalesce(r.offering, 'long-term') IN ('short-term', 'both')
   AND NOT public.rental_is_own_home(r.status, r.property_type);
$$;

REVOKE ALL ON FUNCTION public.public_stay_payment(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_stay_payment(uuid) TO anon, authenticated;

COMMENT ON FUNCTION public.public_stay_payment(uuid) IS
  'The family''s Square payment link for a door that is listed and bookable, and the nightly rate — nothing else from rent_payee, and nothing at all for a door that is not on the shelf (DR-0960). Money still never moves in the app (0055).';
