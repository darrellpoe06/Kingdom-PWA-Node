-- =============================================================================
-- 0157 — the landlord orders his own shelf
-- =============================================================================
-- Darrell, 2026-08-28: "make 805 Apts the first properties because they will
-- have the most turnover" — and then, correcting the shape of that request:
-- "Users should be able move the squares to fit whatever Apt or home to
-- showcase those at the time because of the turnover of that property so people
-- can see it first."
--
-- The second sentence is the real requirement and it is a better one. Pinning
-- 805 first in code answers today and is wrong the moment turnover moves
-- somewhere else — and it makes ME the one who has to change it, which is the
-- opposite of "I want more control without needing to build again."
--
-- So the order is DATA. showcase_order is a number the landlord sets from the
-- board; the doors board and the public storefront both read it, so what he
-- arranges is what a renter sees. NULL means "unplaced" and sorts after
-- everything placed — adding a door never silently jumps the queue, and a
-- portfolio nobody has arranged keeps its old alphabetical order exactly.
--
-- Deliberately a plain integer with gaps, not a dense rank: moving one card
-- rewrites one row. A dense sequence would rewrite the whole shelf on every
-- nudge and turn a one-tap reorder into an eleven-row write.
-- =============================================================================

ALTER TABLE public.rentals ADD COLUMN IF NOT EXISTS showcase_order integer;

COMMENT ON COLUMN public.rentals.showcase_order IS
  'Where this door sits on the board and the public shelf. Lower is earlier; NULL sorts last (unplaced). Set by the landlord from the Doors board — the order a renter sees is the order he arranged.';

CREATE INDEX IF NOT EXISTS rentals_showcase_order_idx
  ON public.rentals(showcase_order NULLS LAST);

-- ---------------------------------------------------------------------------
-- The public shelf honours it. Same RETURNS shape as 0156 plus one column, so
-- the DROP is required — CREATE OR REPLACE refuses to widen a RETURNS TABLE,
-- and forgetting that is what rolled 0153 back in full (migration-return-type
-- -guard now fails the build for it, and rls-isolation's poe-properties leg
-- lists this file after 0156 so a replay cannot revert it).
--
-- Everything 0156 refused, this still refuses: no street address, no tenant, no
-- mortgage, and our own home can never appear.
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.public_vacancies();

CREATE OR REPLACE FUNCTION public.public_vacancies()
RETURNS TABLE (
  id            uuid,
  label         text,
  unit          text,
  city          text,
  state         text,
  property_type text,
  rent          numeric,
  note          text,
  listed_at     timestamptz,
  bedrooms      integer,
  bathrooms     numeric,
  offering      text,
  nightly_rate  numeric,
  min_stay_nights integer,
  showcase_order integer
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.id,
         coalesce(nullif(r.display_name, ''), nullif(r.city, ''), 'Available unit') AS label,
         r.unit,
         r.city,
         r.state,
         r.property_type,
         coalesce(r.listed_rent, r.monthly_rent) AS rent,
         r.listed_note AS note,
         r.listed_at,
         (SELECT count(*)::integer FROM property_rooms pr
           WHERE pr.rental_ref = r.id AND pr.archived_at IS NULL AND pr.kind = 'bedroom') AS bedrooms,
         (SELECT coalesce(sum(CASE WHEN pr.name ~* '(half|powder)' THEN 0.5 ELSE 1 END), 0)::numeric
            FROM property_rooms pr
           WHERE pr.rental_ref = r.id AND pr.archived_at IS NULL AND pr.kind = 'bathroom') AS bathrooms,
         coalesce(r.offering, 'long-term') AS offering,
         r.nightly_rate,
         r.min_stay_nights,
         r.showcase_order
    FROM rentals r
   WHERE r.listed_at IS NOT NULL
     AND NOT public.rental_is_own_home(r.status, r.property_type)
     AND NOT EXISTS (
       SELECT 1 FROM rental_tenancies t
        WHERE t.rental_ref = r.slug AND t.status = 'active'
     )
   -- The landlord's arrangement first; newest listing breaks a tie. An
   -- unplaced door keeps its old position rather than jumping to the front.
   ORDER BY r.showcase_order ASC NULLS LAST, r.listed_at DESC
$$;

REVOKE ALL ON FUNCTION public.public_vacancies() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_vacancies() TO anon, authenticated;
