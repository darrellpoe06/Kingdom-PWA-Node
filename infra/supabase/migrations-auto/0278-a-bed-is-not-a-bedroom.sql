-- ===========================================================================
-- 0278 — A BED IS NOT A BEDROOM: the shelf infers the level the way the app does
-- ===========================================================================
-- Darrell, 2026-10-11, looking at the public shelf beside his own door list:
--
--     "0.5 Bedroom or 1-Bedroom?!!!!!?????!!!!!"
--
-- His landlord board reads "805 North Prospect Avenue half 0.5 of Room -
-- Bed A · Apt 4". The public card for that same door reads "1-bed
-- multi-family in Champaign, Illinois", with no mention of housemates.
--
-- NEITHER NUMBER IS RIGHT, and that is the answer to his question. "0.5
-- bedroom" is a fraction nobody searches for. "1-bed" reads as a
-- one-bedroom apartment — the exact misreading that sends somebody to Apt 4
-- with a car full of belongings expecting their own place. What is being
-- rented is a BED IN A SHARED ROOM, and that is what the card must say.
--
-- WHAT WAS MEASURED. 0273 already composes the right label:
--
--     CASE v.rentable_level
--       WHEN 'bed'  THEN 'Bed in a shared'
--       WHEN 'room' THEN 'Private room in a shared'
--       ELSE CASE WHEN v.beds > 0 THEN v.beds || '-bed' END
--     END
--
-- and already derives `shared_home` as `rentable_level IN ('room','bed')`.
-- Both read `rentals.rentable_level` RAW — and that column is NULL on his
-- doors. Nothing in the app ever writes it: `rentals-sync.js` carries it
-- through when present and `cloud.js` selects it, but no surface sets it.
-- So the label falls through to counting BEDROOMS IN THE APARTMENT (one) and
-- prints "1-bed", while `shared_home` comes back NULL and the co-living
-- sentence DR-0952 added never renders. ONE ROOT, BOTH SYMPTOMS — including
-- why "none say co-living" was still true after 0273 shipped.
--
-- THE CLIENT SOLVED THIS IN AUGUST AND THE DATABASE NEVER LEARNED IT.
-- `app/src/lib/rentable-levels.js:71` has `levelOf()`, which reads the stored
-- level when there is one and otherwise INFERS from the labels a door already
-- carries. Its own comment says why: "twelve doors exist today with no level
-- on them, and two of those are beds." Inferring is not guessing — a door
-- whose label says "Bed" is a bed.
--
-- This migration gives the shelf that same reading, character for character,
-- so the owner's screen and the stranger's screen can never disagree again.
--
-- DELIBERATELY CONSERVATIVE ON THE WORD BOUNDARIES. `\mbed\M` does NOT match
-- "bedroom" (the 'r' is a word character), and `\mroom\M` does NOT match
-- "Bedroom" (the 'b' is). So "2 Bedroom apartment" stays a unit, which is
-- what it is. This mirrors the JavaScript `\b` behaviour exactly; a test
-- pins both sides against the same strings.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. THE LEVEL A DOOR IS, STORED OR INFERRED
-- ---------------------------------------------------------------------------
-- The SQL twin of levelOf() in app/src/lib/rentable-levels.js. Stored value
-- wins; otherwise the label speaks. Never NULL — a door with nothing to go on
-- is a whole unit, which is the same default the client takes.
CREATE OR REPLACE FUNCTION public.rentable_level_of(
  p_stored       text,
  p_unit         text,
  p_display_name text
)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN btrim(lower(coalesce(p_stored, ''))) IN ('unit', 'room', 'bed')
      THEN btrim(lower(p_stored))
    -- The same haystack the client builds: the unit label and the name.
    WHEN lower(concat_ws(' ', coalesce(p_unit, ''), coalesce(p_display_name, ''))) ~ '\mbed\M'
      THEN 'bed'
    WHEN lower(concat_ws(' ', coalesce(p_unit, ''), coalesce(p_display_name, ''))) ~ '\mroom\M'
      THEN 'room'
    ELSE 'unit'
  END;
$$;

COMMENT ON FUNCTION public.rentable_level_of(text, text, text) IS
  'What a door IS — unit, room or bed. Stored rentable_level when set, otherwise inferred from its labels, exactly as levelOf() does in app/src/lib/rentable-levels.js. Never NULL (DR-0971).';

-- ---------------------------------------------------------------------------
-- 2. THE SHELF USES IT — FOR THE LABEL AND FOR "IS THIS SHARED"
-- ---------------------------------------------------------------------------
-- DROPPED FIRST, as 0273 was. The shape here matches 0273's, but 0270 defined
-- this function with the pre-0273 column list, and a replay that reaches 0270
-- and then this file without 0273 in between would hand Postgres a CREATE OR
-- REPLACE that changes a RETURNS TABLE — which it refuses, rolling the whole
-- file back. migration-return-type-guard caught exactly that and named the
-- fix. The drop makes the file safe from any starting point.
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
         -- A BED OR A ROOM REPORTS NO BEDROOM COUNT (DR-0971). The count is
         -- of bedrooms in the APARTMENT, so on a bed-level door it described
         -- somebody else's room as well as this one. "1 bed - 1 bath" under
         -- "Bed in a shared multi-family" claimed a private bedroom and a
         -- private bathroom that are neither. NULL here, and the card says
         -- nothing rather than something untrue.
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
         -- SHARED means housemates. Derived from the inferred level now, so a
         -- door nobody ever set a level on still tells the truth.
         (v.level IN ('room', 'bed')) AS shared_home,
         v.utilities_included
    FROM v
   ORDER BY v.showcase_order NULLS LAST, v.listed_at DESC;
$$;

REVOKE ALL ON FUNCTION public.public_vacancies() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_vacancies() TO anon, authenticated;

COMMENT ON FUNCTION public.public_vacancies() IS
  'The public shelf. Says what is actually being rented — a whole unit, a private room, or a bed in a shared home — inferring the level from the door''s labels when nobody stored one (DR-0971), and reporting no bedroom/bathroom count for a bed or a room because those describe the whole apartment. Still no street: rental_address_is_public decides that and is unchanged.';

SELECT public.apply_viewer_readonly_overlay();
SELECT public.apply_assistant_scope_overlay();

-- ---------------------------------------------------------------------------
-- 3. THE PUBLIC PHOTOGRAPHS BORROW ON THE INFERRED LEVEL TOO
-- ---------------------------------------------------------------------------
-- Darrell, 2026-10-11: "Why don't we show the same photos for both
-- listings??????!!!!!!!!!"
--
-- His landlord board for Bed B reads "PICTURES (0)" above "SHARED WITH THIS
-- APARTMENT (39)" -- so the owner-side borrowing works. The PUBLIC card for
-- the same door still reads "PHOTOGRAPHS COMING".
--
-- THE SAME NULL COLUMN, A THIRD TIME. 0273's public_vacancy_photos gates the
-- borrow on `me.rentable_level IN ('room','bed')`, read RAW. On his doors
-- that column is NULL, and `NULL IN ('room','bed')` is NULL, not false -- so
-- the EXISTS never holds and no sibling photograph is ever offered. The
-- landlord road works because cloud.js does not gate on the column at all.
-- Two roads, one apartment, opposite answers.
--
-- Same shape as 0273 otherwise: own pictures first, a sibling only when this
-- door has none, same instance, same apartment number, never a whole unit,
-- and every wall of 0161 still applied to the borrowed row.
DROP FUNCTION IF EXISTS public.public_vacancy_photos(uuid);

CREATE FUNCTION public.public_vacancy_photos(p_rental uuid)
RETURNS TABLE (
  id           uuid,
  caption      text,
  storage_path text,
  taken_at     timestamptz,
  from_sibling boolean
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH showable AS (
    SELECT ph.id, ph.caption, ph.storage_path, ph.taken_at, ph.sort_order,
           ph.uploaded_at, ph.rental_ref
      FROM property_photos ph
      JOIN rentals r ON r.id = ph.rental_ref
     WHERE ph.kind = 'listing'
       AND ph.archived_at IS NULL
       AND r.listed_at IS NOT NULL
       AND NOT EXISTS (
         SELECT 1 FROM rental_tenancies t
          WHERE t.rental_ref = r.slug AND t.status = 'active'
       )
  ),
  mine AS (SELECT * FROM showable WHERE rental_ref = p_rental),
  siblings AS (
    SELECT s.* FROM showable s
     WHERE NOT EXISTS (SELECT 1 FROM mine)
       AND EXISTS (
         SELECT 1
           FROM rentals me
           JOIN rentals sib ON sib.id = s.rental_ref
          WHERE me.id = p_rental
            -- INFERRED, not raw (DR-0971). This single word is why his Bed B
            -- card said PHOTOGRAPHS COMING with 39 of the apartment's
            -- pictures one door away.
            AND public.rentable_level_of(me.rentable_level, me.unit, me.display_name) IN ('room', 'bed')
            AND sib.instance_id = me.instance_id
            AND public.same_apartment(me.address, me.unit, sib.address, sib.unit)
            AND sib.id <> me.id
       )
  )
  SELECT id, caption, storage_path, taken_at, false AS from_sibling FROM mine
  UNION ALL
  SELECT id, caption, storage_path, taken_at, true AS from_sibling FROM siblings
  ORDER BY 5, 4 DESC NULLS LAST, 1
$$;
REVOKE ALL ON FUNCTION public.public_vacancy_photos(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_vacancy_photos(uuid) TO anon, authenticated;

COMMENT ON FUNCTION public.public_vacancy_photos(uuid) IS
  'Listing photographs a stranger may see for one door. Its own first; a door with none borrows from a listing in the same apartment, with the level INFERRED when nobody stored one (DR-0971). Every wall of 0161 still applies to the borrowed row.';

SELECT public.apply_viewer_readonly_overlay();
SELECT public.apply_assistant_scope_overlay();
