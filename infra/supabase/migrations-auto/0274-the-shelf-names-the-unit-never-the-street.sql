-- =============================================================================
-- 0274 — the shelf names the unit, and still never the street
-- =============================================================================
-- Darrell, 2026-10-11: "also identify the Apartments in the drop down".
--
-- WHAT HE SAW. The application's "Which unit are you applying for?" picker
-- offered two choices: "1-bed multi-family in Champaign, Illinois" and
-- "multi-family in Champaign, Illinois". Neither identifies anything — the
-- public label is composed from a bedroom count, a property type and a city,
-- which describes a KIND of place. An applicant cannot choose a unit from
-- that, and choosing the wrong one files their application on the wrong door.
--
-- THE PICKER WAS ALREADY TRYING. PropertiesDoor has rendered `v.unit` beside
-- the label since the form shipped. It was always null, because
-- public_vacancies() withheld the unit TOGETHER WITH the street:
--   CASE WHEN v.shown THEN v.unit ELSE NULL END
--
-- THOSE TWO ARE NOT THE SAME SECRET. DR-0935 and rental_address_is_public
-- protect the STREET — 805 North Prospect Avenue — because a street plus a
-- city locates a person's front door. "Apt 4" beside "Champaign, Illinois"
-- locates nobody; there is no way to walk to it. Withholding it bought no
-- privacy and cost the applicant the one fact they needed.
--
-- So the unit is published on its own, and the street is governed exactly as
-- before by exactly the same function. Nothing else about address visibility
-- moves, and the smoke asserts the street still never appears.
--
-- Reversible in one line if the Governor disagrees: restore the CASE.
--
-- Idempotent: safe to apply twice. Additive: no existing row changes.
-- =============================================================================

-- The return shape is unchanged from 0273, so this could be a REPLACE; it is
-- a DROP + CREATE anyway, because every change to this function so far has
-- moved its shape and the next one probably will too. A replay that meets a
-- dropped function is always safe; one that meets a reshaped CREATE OR REPLACE
-- fails outright, which migration-replay-order-guard caught on 0273.
DROP FUNCTION IF EXISTS public.public_vacancies();

CREATE FUNCTION public.public_vacancies()
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
  utilities_included boolean
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
              ELSE trim(both ' ' from concat_ws(' ',
                     CASE v.rentable_level
                       WHEN 'bed'  THEN 'Bed in a shared'
                       WHEN 'room' THEN 'Private room in a shared'
                       ELSE CASE WHEN v.beds > 0 THEN v.beds || '-bed' END
                     END,
                     coalesce(nullif(v.property_type, ''), 'place'),
                     CASE WHEN nullif(v.city, '') IS NOT NULL
                          THEN 'in ' || concat_ws(', ', v.city, nullif(v.state, '')) END))
         END AS label,
         -- THE UNIT, ALWAYS (0274). Not gated on `shown` any more: it is a
         -- designator, not a location.
         nullif(btrim(v.unit), '') AS unit,
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
         v.area_lat,
         v.area_lng,
         v.nearby,
         v.rentable_level,
         (v.rentable_level IN ('room', 'bed')) AS shared_home,
         v.utilities_included
    FROM v
   ORDER BY v.showcase_order NULLS LAST, v.listed_at DESC;
$$;

REVOKE ALL ON FUNCTION public.public_vacancies() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_vacancies() TO anon, authenticated;

COMMENT ON FUNCTION public.public_vacancies() IS
  'The public shelf. Says what is being rented (unit / private room / bed in a shared home), whether utilities are included, and WHICH unit it is — the designator only. The street is still governed by rental_address_is_public and is published only when the family says so (DR-0935, DR-0953).';

SELECT public.apply_viewer_readonly_overlay();
SELECT public.apply_assistant_scope_overlay();
