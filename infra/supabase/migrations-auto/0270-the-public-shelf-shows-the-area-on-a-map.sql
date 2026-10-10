-- =============================================================================
-- 0270 — The public shelf shows the area on a map, and what is nearby (DR-0912)
-- =============================================================================
-- Darrell, 2026-10-10, on the no-account listing for 805 N Prospect Apt 2:
--   "Just show the location without the address... make sense... map view..."
--   "How many miles away from the UIUC campus is the apartment... less than 5
--    miles I believe... however figure it out"
--   "And highway is less than a quarter mile... etc..."   "Shops... etc..."
--
-- 0268 took the street off the open shelf for every door. This gives a
-- stranger WHERE instead: an area on a map and measured distances to the
-- places that matter, and still never the street.
--
-- THE AREA IS ROUNDED IN THE DATABASE, whatever is sent. area_lat/area_lng
-- are snapped to a 0.005-degree grid (about 550 m north-south, 425 m east-west
-- at Champaign) by a trigger, so the exact point is never stored and cannot be
-- read back by anyone, family included. The app rounds on the device too, so
-- the exact point never leaves it; the trigger is the wall if it ever does.
-- The house is anywhere in its grid cell: at most about 350 m from the stored
-- point, inside the 600 m circle the listing draws.
--
-- NEARBY LINES are the family's words with a number: [{label, miles}], at
-- most 12, a label of 1-80 characters, miles 0-100. The app works them out on
-- the device from the exact point against a cited list of places
-- (app/src/modules/properties/area.js); the family can edit, drop or add. A
-- line that contains this door's street is refused, whoever writes it.
--
-- public_vacancies() returns the rounded area and the lines. Its return shape
-- changes, so it is dropped first (migration-return-type-guard).
-- =============================================================================

ALTER TABLE public.rentals ADD COLUMN IF NOT EXISTS area_lat numeric(8,5);
ALTER TABLE public.rentals ADD COLUMN IF NOT EXISTS area_lng numeric(8,5);
ALTER TABLE public.rentals ADD COLUMN IF NOT EXISTS nearby jsonb;

-- One definition of "a nearby list the shelf may print".
CREATE OR REPLACE FUNCTION public.rental_nearby_is_valid(p jsonb)
RETURNS boolean LANGUAGE sql IMMUTABLE
AS $$
  SELECT p IS NULL OR (
    jsonb_typeof(p) = 'array'
    AND jsonb_array_length(p) <= 12
    AND NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements(p) e
       WHERE jsonb_typeof(e) <> 'object'
          OR jsonb_typeof(e->'label') IS DISTINCT FROM 'string'
          OR length(btrim(e->>'label')) NOT BETWEEN 1 AND 80
          OR jsonb_typeof(e->'miles') IS DISTINCT FROM 'number'
          OR (e->>'miles')::numeric NOT BETWEEN 0 AND 100
          OR (SELECT count(*) FROM jsonb_object_keys(e) k WHERE k NOT IN ('label', 'miles')) > 0
    )
  )
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rentals_area_both_or_neither') THEN
    ALTER TABLE public.rentals ADD CONSTRAINT rentals_area_both_or_neither
      CHECK ((area_lat IS NULL) = (area_lng IS NULL));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rentals_area_on_earth') THEN
    ALTER TABLE public.rentals ADD CONSTRAINT rentals_area_on_earth
      CHECK (area_lat IS NULL OR (area_lat BETWEEN -85 AND 85 AND area_lng BETWEEN -180 AND 180));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rentals_nearby_shape') THEN
    ALTER TABLE public.rentals ADD CONSTRAINT rentals_nearby_shape
      CHECK (public.rental_nearby_is_valid(nearby));
  END IF;
END $$;

COMMENT ON COLUMN public.rentals.area_lat IS
  'The door''s AREA, not its location: latitude snapped to a 0.005-degree grid by rentals_area_rounded (0270). Shown to strangers as a circle on a map. Never the exact point.';
COMMENT ON COLUMN public.rentals.area_lng IS
  'Longitude of the door''s area, snapped to a 0.005-degree grid (0270).';
COMMENT ON COLUMN public.rentals.nearby IS
  'What is nearby, as the family states it: [{label, miles}] straight-line, at most 12. Shown on the open shelf. Never contains the street (0270).';

CREATE OR REPLACE FUNCTION public.rentals_area_rounded()
RETURNS trigger LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_street text := nullif(btrim(coalesce(NEW.address, '')), '');
BEGIN
  IF NEW.area_lat IS NOT NULL THEN
    NEW.area_lat := round(NEW.area_lat / 0.005) * 0.005;
  END IF;
  IF NEW.area_lng IS NOT NULL THEN
    NEW.area_lng := round(NEW.area_lng / 0.005) * 0.005;
  END IF;
  -- The street never rides in on a nearby line. The house number alone is a
  -- short digit run that appears in distances, so the test is the street NAME:
  -- the address with its leading number removed, when anything is left.
  IF jsonb_typeof(NEW.nearby) = 'array' AND v_street IS NOT NULL THEN
    v_street := nullif(btrim(regexp_replace(v_street, '^\s*\d+[A-Za-z]?\s+', '')), '');
    IF v_street IS NOT NULL AND length(v_street) >= 4 AND EXISTS (
      SELECT 1 FROM jsonb_array_elements(NEW.nearby) e
       WHERE position(lower(v_street) IN lower(e->>'label')) > 0
    ) THEN
      RAISE EXCEPTION 'a nearby line names this door''s street; the open shelf never shows the street (0270)'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS rentals_area_rounded ON public.rentals;
CREATE TRIGGER rentals_area_rounded
  BEFORE INSERT OR UPDATE OF area_lat, area_lng, nearby, address ON public.rentals
  FOR EACH ROW EXECUTE FUNCTION public.rentals_area_rounded();

-- The shelf, with the area and the lines. Same rows and rules as 0158 / 0268.
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
  showcase_order integer,
  address_shown boolean,
  area_lat      numeric,
  area_lng      numeric,
  nearby        jsonb
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH v AS (
    SELECT r.*,
           public.rental_address_is_public(r.address_visibility) AS shown,
           (SELECT count(*)::integer FROM property_rooms pr
             WHERE pr.rental_ref = r.id AND pr.archived_at IS NULL AND pr.kind = 'bedroom') AS beds
      FROM rentals r
     WHERE r.listed_at IS NOT NULL
       AND NOT public.rental_is_own_home(r.status, r.property_type)
       AND NOT EXISTS (
         SELECT 1 FROM rental_tenancies t
          WHERE t.rental_ref = r.slug AND t.status = 'active'
       )
  )
  SELECT v.id,
         CASE WHEN v.shown
              THEN coalesce(nullif(v.display_name, ''), nullif(v.city, ''), 'Available unit')
              -- Placeable, not locatable. Never display_name: that is the street.
              ELSE trim(both ' ' from concat_ws(' ',
                     CASE WHEN v.beds > 0 THEN v.beds || '-bed' END,
                     coalesce(nullif(v.property_type, ''), 'place'),
                     CASE WHEN nullif(v.city, '') IS NOT NULL
                          THEN 'in ' || concat_ws(', ', v.city, nullif(v.state, '')) END))
         END AS label,
         CASE WHEN v.shown THEN v.unit ELSE NULL END AS unit,
         v.city,
         v.state,
         v.property_type,
         coalesce(v.listed_rent, v.monthly_rent) AS rent,
         v.listed_note AS note,
         v.listed_at,
         v.beds AS bedrooms,
         (SELECT coalesce(sum(CASE WHEN pr.name ~* '(half|powder)' THEN 0.5 ELSE 1 END), 0)::numeric
            FROM property_rooms pr
           WHERE pr.rental_ref = v.id AND pr.archived_at IS NULL AND pr.kind = 'bathroom') AS bathrooms,
         coalesce(v.offering, 'long-term') AS offering,
         v.nightly_rate,
         v.min_stay_nights,
         v.showcase_order,
         v.shown AS address_shown,
         -- Rounded again on the way out: a row written before the trigger
         -- existed still leaves only its area.
         round(v.area_lat / 0.005) * 0.005 AS area_lat,
         round(v.area_lng / 0.005) * 0.005 AS area_lng,
         v.nearby
    FROM v
   ORDER BY v.showcase_order ASC NULLS LAST, v.listed_at DESC
$$;

REVOKE ALL ON FUNCTION public.public_vacancies() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_vacancies() TO anon, authenticated;
