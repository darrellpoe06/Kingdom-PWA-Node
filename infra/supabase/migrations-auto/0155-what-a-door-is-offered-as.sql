-- =============================================================================
-- 0155 — what a door is OFFERED as: a lease, a short stay, or either
-- =============================================================================
-- Darrell, 2026-08-27: "you only need to create an account for lease or for a
-- short term lease Airbnb... options..." and, immediately after, "only for
-- Apt 2 at 805 N Prospect Ave Champaign IL".
--
-- So the offering is a property of the DOOR, not of the platform: most of these
-- units are long-term rentals, and exactly one is also offered as a short stay.
-- A per-door column is the only shape that survives the next door changing its
-- mind, and it keeps the app from branching on an address anywhere in the code.
--
-- WHICH ROW IS APT 2 IS NOT SET HERE, and that is deliberate. The four
-- 805 North Prospect rows all carry unit = NULL (measured 2026-08-27), so no
-- migration can know which of them a person calls Apt 2. That is the one thing
-- in this feature that genuinely only the landlord holds — not a step a channel
-- could drive — so the app gives him the field and one tap, and asserts nothing.
-- =============================================================================

ALTER TABLE public.rentals ADD COLUMN IF NOT EXISTS offering text;
ALTER TABLE public.rentals ADD COLUMN IF NOT EXISTS nightly_rate numeric;
ALTER TABLE public.rentals ADD COLUMN IF NOT EXISTS min_stay_nights integer;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rentals_offering_check') THEN
    ALTER TABLE public.rentals ADD CONSTRAINT rentals_offering_check
      CHECK (offering IS NULL OR offering IN ('long-term','short-term','both'));
  END IF;
  -- A short stay with no nightly rate is a listing nobody can act on, and a
  -- nightly rate on a door that is not offered short-term is a number that will
  -- one day be shown to somebody. Neither is allowed to sit in the table.
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rentals_nightly_rate_matches_offering') THEN
    ALTER TABLE public.rentals ADD CONSTRAINT rentals_nightly_rate_matches_offering
      CHECK (nightly_rate IS NULL OR offering IN ('short-term','both'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rentals_min_stay_positive') THEN
    ALTER TABLE public.rentals ADD CONSTRAINT rentals_min_stay_positive
      CHECK (min_stay_nights IS NULL OR min_stay_nights >= 1);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- The public listing carries the offering, so a person browsing sees whether a
-- door is a lease or a short stay BEFORE anything asks them to make an account
-- — "you only need to create an account for lease or for a short term lease".
-- Browsing stays open; the account is for taking the place, not for looking at
-- it.
--
-- REDEFINES public_vacancies (0153). Column-explicit still: three fields are
-- added and nothing else — no address, no coordinates, no purchase price, no
-- mortgage, no tenant name. The DROP is required because this widens a
-- RETURNS TABLE, which CREATE OR REPLACE refuses; forgetting it is what rolled
-- 0153 back in full, and migration-return-type-guard now fails the build for
-- it. Any isolation leg replaying 0153 must also list 0155 after it.
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
  min_stay_nights integer
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
         -- A door that never said reads as a long-term rental, which is what
         -- every one of these is unless somebody chose otherwise.
         coalesce(r.offering, 'long-term') AS offering,
         r.nightly_rate,
         r.min_stay_nights
    FROM rentals r
   WHERE r.listed_at IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM rental_tenancies t
        WHERE t.rental_ref = r.slug AND t.status = 'active'
     )
   ORDER BY r.listed_at DESC
$$;

REVOKE ALL ON FUNCTION public.public_vacancies() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_vacancies() TO anon, authenticated;
