-- ===========================================================================
-- 0283 — a held door shows its building's area (DR-0995)
-- ===========================================================================
-- Darrell, 2026-10-13, with the live shelf on his Fold (Apt 2 beside the bed
-- in Apt 4): "Show on map is supposed to be giving the area without the
-- address... when the address is not shown... however maps when the address
-- is showing can be the direct link to the street view... make sense?"
--
-- MEASURED on that screenshot: the bed's card, whose street the family holds,
-- had NO "Show on map" at all. The area lives on the door it was set on
-- (Apt 2, 0270), and a door with no area of its own and no street to look up
-- has nothing to draw. The doors are in one building: 805 North Prospect
-- Avenue. A held door is exactly the one that most needs the area, because
-- the area is all it may show.
--
-- So the shelf gives a door with no area of its own its BUILDING's area: the
-- area (and the nearby lines that go with it) of a door in the SAME family,
-- on the SAME street once the unit is folded out of it. Only these change:
--
--   * area_lat / area_lng / nearby, when the door stored none of its own.
--     A door's own area always wins.
--   * Nothing more exact is published. The borrowed area is the same rounded
--     0.005-degree grid point (rentals_area_rounded, 0270), drawn as the same
--     ~0.7-mile circle; its nearby lines passed the same street check on a
--     door with the same street. The street of a held door is still never
--     returned, and no point is ever stored (0270).
--   * Never across families: instance_id must match. Never a guess: the
--     street is cleaned, not fuzzy-matched -- "805 N Prospect Ave" is NOT
--     "805 North Prospect Avenue" (DR-0967, re-review 2026-11-11).
--
-- building_key: street_key (0273) folds the door's own unit off the end of
-- its address; the building key then cuts at the first unit designator, so
-- "805 North Prospect Avenue Apt 4" with unit "Bed B" is still the building
-- "805 north prospect avenue". A building key shorter than 5 characters names
-- nothing and never matches.
--
-- The RETURNS shape is identical to 0281's, so this is CREATE OR REPLACE
-- with no DROP. Idempotent: safe to apply twice. Writes no row.
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.building_key(p_address text, p_unit text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT btrim(regexp_replace(
           regexp_replace(public.street_key(p_address, p_unit),
             '\m(apartment|apt|unit|suite|ste|room|rm|bed|no|number)\M.*$', ''),
           '\s+', ' ', 'g'));
$$;

COMMENT ON FUNCTION public.building_key(text, text) IS
  'The building a door is in: its street with the unit folded out (street_key, 0273) and everything from the first unit designator on cut away. Cleaned, never fuzzy (DR-0967). Used by public_vacancies to give a door with no area its building''s area (DR-0995).';

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
  street        text
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
           -- THE BUILDING'S AREA (DR-0995), for a door that stored none. Any
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
             LIMIT 1) AS bldg
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
         CASE WHEN v.shown THEN nullif(trim(both ' ' from v.address), '') END AS street
    FROM v
   ORDER BY v.showcase_order NULLS LAST, v.listed_at DESC;
$$;

REVOKE ALL ON FUNCTION public.public_vacancies() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_vacancies() TO anon, authenticated;

COMMENT ON FUNCTION public.public_vacancies() IS
  'The public shelf (DR-0995): a room or a bed says what it is first (0281); a whole unit keeps its own name / bedroom-count label (0280); the street when the family shows it and nothing more exact than the town when they hold it; the rounded area the door stored, or its building''s rounded area when it stored none (same family, same street with the unit folded out).';

NOTIFY pgrst, 'reload schema';
