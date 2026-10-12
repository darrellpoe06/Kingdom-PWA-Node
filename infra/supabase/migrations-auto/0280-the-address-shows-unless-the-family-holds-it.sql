-- =============================================================================
-- 0280 — THE ADDRESS SHOWS UNLESS THE FAMILY HOLDS IT; THE MAP IS ASKED FOR
-- =============================================================================
-- Darrell, 2026-10-12, after being asked to paste a Google Maps link to put
-- Apt 2 on the map:
--
--   "Why would I ever need to add a Google maps link when you can do that as
--    a standard for any address we add?!!!!! Just make the like work based on
--    the addresses then let the user choose the map or show the address as
--    options... make sense?"
--
--   "I only want a map when I want it.. so show address unless... don't want
--    to spend time or data for the map if not required or requested...
--    however... we want to use it when we want to... make sense?"
--
-- WHAT WAS TRUE: 0268 (DR-0933, 2026-10-10) made rental_address_is_public()
-- answer false for every door, so the open shelf never carried a street, and
-- 0270 drew a map on every card that had an area. Two days later the family's
-- word is the other way round: the address is the default, the map is on
-- request.
--
-- THE DECISION (DR-0977):
--   1. rental_address_is_public() honours the door's own setting again (0158's
--      definition): 'public' shows the street, 'after-application' (and NULL)
--      holds it until someone applies or books.
--   2. The street is the DEFAULT. New doors get address_visibility = 'public'.
--      Existing doors are set to 'public' ONCE: the editor wrote
--      'after-application' as its default on every save, so no stored value
--      can be told apart from a real choice. The old value of every door is
--      kept in address_visibility_before_0280, which is also the guard that
--      makes this a one-time step: the isolation matrix and the replay apply
--      this file again and again, and a family's later "hold the street" must
--      never be undone by a re-run.
--   3. public_vacancies() gains `street` (the address and unit, only when
--      shown). The label is unchanged.
--   4. The map is not drawn by the database: the area stays as 0270 keeps it
--      (rounded, optional) and the app draws it only when someone asks.
-- =============================================================================

ALTER TABLE public.rentals ALTER COLUMN address_visibility SET DEFAULT 'public';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'rentals' AND column_name = 'address_visibility_before_0280'
  ) THEN
    ALTER TABLE public.rentals ADD COLUMN address_visibility_before_0280 text;
    UPDATE public.rentals SET address_visibility_before_0280 = coalesce(address_visibility, '(unset)');
    UPDATE public.rentals SET address_visibility = 'public' WHERE address_visibility IS DISTINCT FROM 'public';
  END IF;
END $$;

COMMENT ON COLUMN public.rentals.address_visibility IS
  'Who may see this door''s street on the open shelf (DR-0977). public (the default) = shown; after-application (also NULL) = held until someone applies or books. Set per door by the family.';
COMMENT ON COLUMN public.rentals.address_visibility_before_0280 IS
  'What address_visibility held before 0280 made the street the default (DR-0977). A record, and the guard that keeps 0280''s reset to one time.';

CREATE OR REPLACE FUNCTION public.rental_address_is_public(p_visibility text)
RETURNS boolean LANGUAGE sql IMMUTABLE
AS $$ SELECT coalesce(p_visibility, 'after-application') = 'public' $$;
COMMENT ON FUNCTION public.rental_address_is_public(text) IS
  'DR-0977: the street shows unless the family holds it (after-application, or NULL). Supersedes DR-0933''s never.';

-- The shelf: 0278's shape plus `street`. A RETURNS TABLE cannot be widened in
-- place, so the DROP is required.
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
                     CASE v.level
                       WHEN 'bed'  THEN 'Bed in a shared'
                       WHEN 'room' THEN 'Private room in a shared'
                       ELSE CASE WHEN v.beds > 0 THEN v.beds || '-bed' END
                     END,
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
         v.area_lat,
         v.area_lng,
         v.nearby,
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
  'The public shelf (DR-0977): what is being rented (0278''s levels), the street when the family shows it (the default) and nothing more exact than the town when they hold it, and the rounded area when one is stored. The app draws a map only when someone asks for it.';

NOTIFY pgrst, 'reload schema';
