-- =============================================================================
-- 0286 — a door is priced by any cadence, and the shelf says the true month
-- =============================================================================
-- DR-1003. Darrell, 2026-10-13: "$800 a monthly however $200 weekly... sounds
-- the same until you get a 5 week month."
--
-- Three nullable columns on rentals:
--   weekly_rate     what the door costs by the week (paid 52 times a year)
--   biweekly_rate   what it costs every two weeks (paid 26 times a year)
--   building_note   what the building itself offers, shared by every door in
--                   it ("Laundry in the entry"), lent to a sibling door that
--                   stored none the way 0283 lends the building's area
-- A rate below zero is refused; NULL means "not offered by that cadence",
-- never $0. Whether weekly x 4.33 should exceed the month is the family's
-- pricing choice, not a database rule: the shelf prints the true month beside
-- each so the choice is informed.
--
-- public_vacancies() returns the three (RETURNS TABLE widens, so the function
-- is dropped first — migration-return-type-guard), and a private room is
-- offered before a bed among doors of the same showcase order.
--
-- Idempotent: safe to apply twice.
-- =============================================================================

ALTER TABLE public.rentals ADD COLUMN IF NOT EXISTS weekly_rate   numeric;
ALTER TABLE public.rentals ADD COLUMN IF NOT EXISTS biweekly_rate numeric;
ALTER TABLE public.rentals ADD COLUMN IF NOT EXISTS building_note text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rentals_weekly_rate_nonnegative') THEN
    ALTER TABLE public.rentals ADD CONSTRAINT rentals_weekly_rate_nonnegative
      CHECK (weekly_rate IS NULL OR weekly_rate >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rentals_biweekly_rate_nonnegative') THEN
    ALTER TABLE public.rentals ADD CONSTRAINT rentals_biweekly_rate_nonnegative
      CHECK (biweekly_rate IS NULL OR biweekly_rate >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rentals_building_note_short') THEN
    ALTER TABLE public.rentals ADD CONSTRAINT rentals_building_note_short
      CHECK (building_note IS NULL OR length(building_note) <= 300);
  END IF;
END $$;

COMMENT ON COLUMN public.rentals.weekly_rate IS
  'What the door costs by the week, paid 52 times a year; NULL = not offered weekly (DR-1003).';
COMMENT ON COLUMN public.rentals.biweekly_rate IS
  'What the door costs every two weeks, paid 26 times a year; NULL = not offered that way (DR-1003).';
COMMENT ON COLUMN public.rentals.building_note IS
  'What the building itself offers, shared by every door in it ("Laundry in the entry"); lent to a sibling door that stored none (DR-1003).';

-- The RETURNS TABLE widens by three columns: drop first (0153's lesson).
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
  nearby        jsonb,
  rentable_level     text,
  shared_home        boolean,
  utilities_included boolean,
  street        text,
  weekly_rate   numeric,
  biweekly_rate numeric,
  building_note text
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH v AS (
    SELECT r.*,
           public.rental_address_is_public(r.address_visibility) AS shown,
           public.rentable_level_of(r.rentable_level, r.unit, r.display_name) AS level,
           (SELECT count(*)::integer FROM property_rooms pr
             WHERE pr.rental_ref = r.id AND pr.archived_at IS NULL AND pr.kind = 'bedroom') AS beds,
           -- THE BUILDING'S AREA (DR-0997), for a door that stored none. Any
           -- door of the same family in the same building, listed or not; the
           -- one with nearby lines first, then the oldest, so the answer does
           -- not change from one read to the next.
           (SELECT b FROM rentals b
             WHERE r.area_lat IS NULL
               AND b.id <> r.id
               AND b.instance_id = r.instance_id
               AND b.area_lat IS NOT NULL
               AND length(public.building_key(r.address, r.unit)) >= 5
               AND public.building_key(b.address, b.unit) = public.building_key(r.address, r.unit)
             ORDER BY coalesce(jsonb_typeof(b.nearby) = 'array' AND jsonb_array_length(b.nearby) > 0, false) DESC,
                      b.created_at, b.id
             LIMIT 1) AS bldg,
           -- WHAT THE BUILDING OFFERS (DR-1003), for a door that stored no
           -- note of its own: the same family, the same building, the oldest
           -- door that said something.
           (SELECT b.building_note FROM rentals b
             WHERE r.building_note IS NULL
               AND b.id <> r.id
               AND b.instance_id = r.instance_id
               AND nullif(trim(both ' ' from b.building_note), '') IS NOT NULL
               AND length(public.building_key(r.address, r.unit)) >= 5
               AND public.building_key(b.address, b.unit) = public.building_key(r.address, r.unit)
             ORDER BY b.created_at, b.id
             LIMIT 1) AS bldg_note
      FROM rentals r
     WHERE r.listed_at IS NOT NULL
       AND NOT public.rental_is_own_home(r.status, r.property_type)
       AND NOT EXISTS (
         SELECT 1 FROM rental_tenancies t
          WHERE t.rental_ref = r.slug AND t.status = 'active'
       )
  )
  SELECT v.id,
         CASE
              -- A ROOM OR A BED SAYS WHAT IT IS, street shown or held (0281).
              WHEN v.level IN ('room', 'bed') THEN
                trim(both ' ' from concat_ws(' ',
                  CASE v.level
                    WHEN 'bed'  THEN 'Bed in a shared'
                    WHEN 'room' THEN 'Private room in a shared'
                  END,
                  coalesce(nullif(v.property_type, ''), 'place'),
                  CASE WHEN nullif(v.city, '') IS NOT NULL
                       THEN 'in ' || concat_ws(', ', v.city, nullif(v.state, '')) END))
              -- A WHOLE UNIT: its own name when the street shows, the bedroom
              -- count when it is held (0280).
              WHEN v.shown
                THEN coalesce(nullif(v.display_name, ''), nullif(v.city, ''), 'Available unit')
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
         CASE WHEN v.level = 'unit' THEN v.beds ELSE NULL END AS bedrooms,
         CASE WHEN v.level = 'unit' THEN
           (SELECT coalesce(sum(CASE WHEN pr.name ~* '(half|powder)' THEN 0.5 ELSE 1 END), 0)::numeric
              FROM property_rooms pr
             WHERE pr.rental_ref = v.id AND pr.archived_at IS NULL AND pr.kind = 'bathroom')
         END AS bathrooms,
         coalesce(v.offering, 'long-term') AS offering,
         v.nightly_rate,
         v.min_stay_nights,
         v.showcase_order,
         v.shown AS address_shown,
         coalesce(v.area_lat, (v.bldg).area_lat) AS area_lat,
         coalesce(v.area_lng, (v.bldg).area_lng) AS area_lng,
         CASE WHEN v.area_lat IS NOT NULL THEN v.nearby
              ELSE coalesce((v.bldg).nearby, v.nearby) END AS nearby,
         v.level AS rentable_level,
         (v.level IN ('room', 'bed')) AS shared_home,
         v.utilities_included,
         -- THE STREET, ONLY WHEN SHOWN (DR-0977). Never the area's source point:
         -- the exact point is never stored (0270).
         CASE WHEN v.shown THEN nullif(trim(both ' ' from v.address), '') END AS street,
         -- ANY CADENCE (DR-1003): NULL is "not offered that way", never $0.
         nullif(v.weekly_rate, 0)   AS weekly_rate,
         nullif(v.biweekly_rate, 0) AS biweekly_rate,
         coalesce(nullif(trim(both ' ' from v.building_note), ''), v.bldg_note) AS building_note
    FROM v
   -- The family's own order first; among equals a private room is offered
   -- before a bed (DR-1003: rooms before beds); then the newest listing.
   ORDER BY v.showcase_order NULLS LAST,
            CASE WHEN v.level = 'bed' THEN 1 ELSE 0 END,
            v.listed_at DESC;
$$;

REVOKE ALL ON FUNCTION public.public_vacancies() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_vacancies() TO anon, authenticated;

COMMENT ON FUNCTION public.public_vacancies() IS
  'The public shelf (DR-1003): every cadence the family offers (monthly, weekly, every two weeks, nightly) so the card can print the true month beside each; what the building offers, lent from a sibling door; a private room before a bed among equals. Keeps 0283: a room or a bed says what it is first (0281); a whole unit keeps its own name / bedroom-count label (0280); the street only when shown (DR-0977); a held door borrows its building''s area (DR-0997). Anon may execute; no tenant, no mortgage, no exact point.';

NOTIFY pgrst, 'reload schema';
