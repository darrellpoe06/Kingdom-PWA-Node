-- =============================================================================
-- 0288 — A short-stays-only season advertises the night alone (DR-1009)
-- =============================================================================
-- Darrell, 2026-10-13: "Have a check box for if/when we offer something more
-- than short stays... so it won't have to advertise all options specifically
-- for the seasons we decided we want in their respective seasons." And: "All
-- of the above can also be an option... so we can get the first opportunity
-- to get revenue."
--
-- The door already says what it is offered as (0155: long-term, short-term,
-- both). What it did NOT do: a door offered short-term still advertised its
-- monthly rent and its weekly / every-two-weeks prices on the public shelf,
-- because public_vacancies() read the price columns whatever the offering.
-- So the family could not keep a lease price on file for the lease season
-- without advertising it in the short-stay season.
--
-- Now the shelf is the gate: while offering = 'short-term', rent, weekly_rate
-- and biweekly_rate read NULL (the card says "Short stays only" and the
-- night); 'both' advertises everything, the first revenue that comes;
-- 'long-term' advertises the lease prices. Nothing is deleted: the stored
-- prices wait for the season they come back. Same RETURNS TABLE as 0286;
-- dropped and recreated in 0286's shape so the grants are re-stated.
-- Idempotent: safe to apply twice.
-- =============================================================================

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
         -- A SHORT-STAYS-ONLY SEASON ADVERTISES THE NIGHT ALONE (DR-1009): the
         -- lease prices stay stored for the season they come back; the shelf
         -- simply does not say them while the door is offered by the night only.
         CASE WHEN coalesce(v.offering, 'long-term') = 'short-term' THEN NULL
              ELSE coalesce(v.listed_rent, v.monthly_rent) END AS rent,
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
         CASE WHEN coalesce(v.offering, 'long-term') = 'short-term' THEN NULL ELSE nullif(v.weekly_rate, 0)   END AS weekly_rate,
         CASE WHEN coalesce(v.offering, 'long-term') = 'short-term' THEN NULL ELSE nullif(v.biweekly_rate, 0) END AS biweekly_rate,
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
  'The public shelf (DR-1009): a short-stays-only door advertises the night alone (rent, weekly and every-two-weeks read NULL while offering = short-term; the stored prices wait for the season they come back). Keeps DR-1003: every cadence the family offers (monthly, weekly, every two weeks, nightly) so the card can print the true month beside each; what the building offers, lent from a sibling door; a private room before a bed among equals. Keeps 0283: a room or a bed says what it is first (0281); a whole unit keeps its own name / bedroom-count label (0280); the street only when shown (DR-0977); a held door borrows its building''s area (DR-0997). Anon may execute; no tenant, no mortgage, no exact point.';

NOTIFY pgrst, 'reload schema';
