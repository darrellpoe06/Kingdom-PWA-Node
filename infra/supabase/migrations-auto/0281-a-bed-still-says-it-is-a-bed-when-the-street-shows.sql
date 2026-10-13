-- ===========================================================================
-- 0281 — a bed still says it is a bed when the street shows
-- ===========================================================================
-- A REGRESSION, caught by a smoke that was right (DR-0983).
--
-- 0278 exists because of one sentence Darrell typed on 2026-10-11, looking at
-- his own door on the public shelf:
--
--     "0.5 Bedroom or 1-Bedroom?!!!!!?????!!!!!"
--
-- 0278's own header measured what that card was reading from, character for
-- character: "805 North Prospect Avenue half 0.5 of Room - Bed A - Apt 4".
-- Its answer, stated plainly in that file: "What is being rented is a BED IN A
-- SHARED ROOM, and that is what the card must say." So 0278 composed the label
-- from the level -- "Bed in a shared multi-family in Champaign, Illinois" --
-- and inferred the level when the column was NULL, which it was on every one of
-- his doors.
--
-- 0280 THEN PUT THAT ARM BEHIND A BRANCH ALMOST NOTHING TAKES. It added the
-- street to the shelf and, with it, this label:
--
--     CASE WHEN v.shown
--          THEN coalesce(nullif(v.display_name, ''), nullif(v.city, ''), 'Available unit')
--          ELSE <0278's level-composed descriptor>
--     END AS label
--
-- `v.shown` is `rental_address_is_public(address_visibility)`, and 0280 set the
-- column DEFAULT to 'public' AND one-time UPDATEd every existing row to
-- 'public' -- its whole point, "the address shows unless the family holds it".
-- So `shown` is true on effectively every live door, the ELSE arm is the
-- exception rather than the rule, and the headline on a bed's card became
-- whatever the landlord typed as the door's name. On his door that is the exact
-- string 0278 was written to replace.
--
-- WHAT WAS MEASURED, on the live hosted database, 2026-10-13T00:52:28Z,
-- rls-isolation run 38329136075, leg poe-properties:
--
--   psql:infra/supabase/tests/0273-shared-home-smoke.sql:150: ERROR:
--     a bed in a shared home does not say shared: Room 1 - Bed A
--
-- The smoke seeds that bed with rentable_level 'bed' and no
-- address_visibility, so it takes the default -- which is to say, it is seeded
-- the way a real door now is. `shared_home` still came back true; it is the
-- LABEL, the one line a stranger actually reads, that stopped saying it.
--
-- NOTHING WATCHED FOR THIS. migration-replay-order-guard is the guard for a
-- later file silently reverting an earlier one, and it could not see this:
-- 0280 keeps 0278's RETURNS shape and its `rentable_level_of` call, the files
-- are in ascending order, and the revert lives in the BODY's branching. And
-- ci.yml's door-work leg runs 0273's smoke but never applies 0280, so the one
-- leg built on a fresh database was testing a composition production does not
-- have, and was green. Both gaps are closed with this change
-- (scripts/newest-definition-replay-guard.mjs).
--
-- THE FIX IS AN ORDERING, NOT NEW COPY. A room or a bed says what it is first,
-- before the street question is asked. A WHOLE UNIT is untouched: its own name
-- when the street shows, the bedroom count when the family holds it, exactly as
-- 0280 decided. Nothing about the street, the area, the photo walls or
-- `shared_home` changes, and no row is written.
--
-- The RETURNS shape is identical to 0280's -- MEASURED, 385 characters each
-- through migration-return-type-guard's own normalizer -- so this is CREATE OR
-- REPLACE with no DROP. That guard first DEMANDED a DROP here, comparing this
-- file against 0270's shape three migrations back, because its reader matched
-- only `CREATE OR REPLACE FUNCTION` and 0273/0278/0280 all write `DROP ...;
-- CREATE FUNCTION` -- the only syntax a return-type change CAN use. The guard
-- is widened in this change (DR-0983); the DROP it asked for is genuinely not
-- needed. Idempotent: safe to apply twice. Writes no row.
-- ===========================================================================

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
         CASE
              -- A ROOM OR A BED SAYS WHAT IT IS, street shown or held. This arm
              -- is FIRST on purpose: it is the one 0278 exists for, and 0280
              -- put it behind `v.shown`, which is now true by default.
              WHEN v.level IN ('room', 'bed') THEN
                trim(both ' ' from concat_ws(' ',
                  CASE v.level
                    WHEN 'bed'  THEN 'Bed in a shared'
                    WHEN 'room' THEN 'Private room in a shared'
                  END,
                  coalesce(nullif(v.property_type, ''), 'place'),
                  CASE WHEN nullif(v.city, '') IS NOT NULL
                       THEN 'in ' || concat_ws(', ', v.city, nullif(v.state, '')) END))
              -- A WHOLE UNIT keeps 0280's behaviour, unchanged: its own name
              -- when the street shows, the bedroom count when it is held.
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

COMMENT ON FUNCTION public.public_vacancies() IS
  'The public shelf (DR-0983): a room or a bed says what it is FIRST, street shown or held (0278''s rule, which 0280 put behind a branch almost nothing takes); a whole unit keeps 0280''s own name / bedroom-count label; the street when the family shows it (the default) and nothing more exact than the town when they hold it.';

NOTIFY pgrst, 'reload schema';
