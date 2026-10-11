-- =============================================================================
-- 0273 — a shared home says so on the shelf, and utilities are a listed fact
-- =============================================================================
-- Darrell, 2026-10-11: "It should be noted this is a co-living situation!!!!!"
-- and "All utilities paid..."
--
-- WHAT THE PUBLIC CARD SAYS TODAY, measured on his own listing: "1-bed
-- multi-family in Champaign, Illinois", for a door that is 805 North Prospect
-- Avenue ROOM 1 - BED A. public_vacancies() composes that label from
-- `<bedrooms>-bed <property_type> in <city>` (0270) and never reads
-- rentable_level, which 0160 added for exactly this and which says 'bed'.
--
-- THAT IS NOT A MARKETING GAP, IT IS THE CARD SAYING SOMETHING UNTRUE. A
-- stranger reads "1-bed apartment" and books expecting their own place; what
-- they have rented is a bed in an apartment with housemates. The cost is not
-- a lost click, it is somebody arriving at a door with their things in a car.
-- A surface that states a claim the database contradicts is the same defect
-- as the gallery announcing a door was empty when the read had merely failed
-- (DR-0946) — an invented fact, presented as true, on the one surface where
-- being trusted is the whole product.
--
-- 0160 already holds the truth and nothing read it: rentable_level ('unit',
-- 'room', 'bed') and room_label, which two beds in one room SHARE. The fix is
-- to publish what the column already knows.
--
-- UTILITIES. No column held it, so the listing could not say it. At $150 a
-- night and $750 a month it is a real part of the offer and a renter compares
-- on it, so it becomes a listed fact rather than something said in a message
-- after someone asks.
--
-- NOTHING NEW IS EXPOSED. These are facts about the OFFER, never about the
-- people: no street (DR-0935 and rental_address_is_public stay exactly as
-- they are), no tenant, no housemate's name. A renter learns the shape of
-- what they would be renting, which is the one thing they most need and the
-- least private thing on the row.
--
-- Idempotent: safe to apply twice. Additive: no existing row changes.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. UTILITIES, AS A LISTED FACT
-- ---------------------------------------------------------------------------
-- Three states and they are not the same: included, not included, and NOT YET
-- SAID. A boolean with a default would make every door that has never been
-- asked claim an answer, which is how a listing starts lying by omission.
-- NULL means nobody has said, and the card then says nothing at all.
ALTER TABLE public.rentals ADD COLUMN IF NOT EXISTS utilities_included boolean;

COMMENT ON COLUMN public.rentals.utilities_included IS
  'Whether the rent covers utilities, as advertised. NULL = not yet stated, and the public card says nothing rather than guessing (DR-0952).';

-- ---------------------------------------------------------------------------
-- 2. THE SHELF TELLS THE TRUTH ABOUT WHAT IS BEING RENTED
-- ---------------------------------------------------------------------------
-- DROPPED first, deliberately. The return shape changes, and CREATE OR REPLACE
-- cannot change a RETURNS TABLE — migration-replay-order-guard watches for a
-- function replayed under two shapes without a drop, which is precisely how a
-- replay ends up failing halfway on the live database.
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
  -- NEW (0273)
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
              -- Placeable, not locatable. Never display_name: that is the street.
              --
              -- A ROOM OR A BED IS NAMED AS WHAT IT IS (0273). The old
              -- composition said "1-bed multi-family" for a bed in a shared
              -- apartment, because it counted BEDROOMS and never asked what
              -- was being rented. A bedroom count describes the place; it
              -- does not describe the offer.
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
         v.area_lat,
         v.area_lng,
         v.nearby,
         v.rentable_level,
         -- SHARED means housemates, whatever the label ended up reading. A
         -- room or a bed is shared by definition; a whole unit is not.
         (v.rentable_level IN ('room', 'bed')) AS shared_home,
         v.utilities_included
    FROM v
   ORDER BY v.showcase_order NULLS LAST, v.listed_at DESC;
$$;

REVOKE ALL ON FUNCTION public.public_vacancies() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_vacancies() TO anon, authenticated;

COMMENT ON FUNCTION public.public_vacancies() IS
  'The public shelf. Says what is actually being rented — a whole unit, a private room, or a bed in a shared home (DR-0952) — and whether utilities are included. Still no street: rental_address_is_public decides that and is unchanged.';

SELECT public.apply_viewer_readonly_overlay();
SELECT public.apply_assistant_scope_overlay();

-- ---------------------------------------------------------------------------
-- 3. THE SEPARATED LISTINGS OF ONE APARTMENT CAN SHOW ITS PICTURES
-- ---------------------------------------------------------------------------
-- Darrell, 2026-10-11: "Make sure that these photos in apartment 4 goes to
-- both locations for apt 4 A and B... so we can advertise without having to
-- re-upload again", "Separated listing however it is the same apartment",
-- and "Make sure the apartment 4 and others we separated are able to
-- advertise the other listing... if and when necessary".
--
-- MEASURED on his board: Room 1 - Bed A carries 39 photographs; Room 1 - Bed B
-- carries none and shows NO PHOTO. They are two listings of ONE apartment —
-- the kitchen, the bath and the room itself are the same physical places, and
-- photographing them twice would be photographing the same wall twice.
--
-- OWN FIRST, SIBLING ONLY AS A FALLBACK. A door that has its own listing
-- pictures shows exactly those and nothing else — this can never dilute a
-- door somebody has curated. Only a door with NONE borrows, and only from a
-- door it genuinely shares a room with (room_label, which 0160 says "two beds
-- sharing a room share this value", within the same instance). That is the
-- narrowest rule that solves NO PHOTO without ever surprising him, and it
-- needs no new switch to forget to turn on.
--
-- EVERY OTHER WALL IS UNTOUCHED. The borrowed row still has to be kind
-- 'listing', unarchived, on a door that is itself listed and has nobody
-- living in it — the same four conditions, applied to the sibling. A record
-- photograph cannot reach a stranger through this any more than through the
-- original (DR-0906), and no street is published either way.
DROP FUNCTION IF EXISTS public.public_vacancy_photos(uuid);

CREATE FUNCTION public.public_vacancy_photos(p_rental uuid)
RETURNS TABLE (
  id           uuid,
  caption      text,
  storage_path text,
  taken_at     timestamptz,
  -- Says whether these came from a sibling listing, so the card can be honest
  -- about it rather than passing them off as this exact door's own.
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
  -- Only consulted when `mine` is empty. A bed or a room only; a whole unit
  -- has no siblings to borrow from and must never pick up another unit's.
  siblings AS (
    SELECT s.* FROM showable s
     WHERE NOT EXISTS (SELECT 1 FROM mine)
       AND EXISTS (
         SELECT 1
           FROM rentals me
           JOIN rentals sib ON sib.id = s.rental_ref
          WHERE me.id = p_rental
            AND me.rentable_level IN ('room', 'bed')
            AND sib.instance_id = me.instance_id
            AND nullif(btrim(me.room_label), '') IS NOT NULL
            AND btrim(lower(sib.room_label)) = btrim(lower(me.room_label))
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
  'Listing photographs a stranger may see for one door. Its own first; a door with none borrows from a listing it shares a room with, so the separated listings of one apartment need not be photographed twice (DR-0952). Every wall of 0161 still applies to the borrowed row.';
