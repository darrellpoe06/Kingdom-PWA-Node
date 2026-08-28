-- =============================================================================
-- 0158 — the address is shown when the landlord says so, not by accident
-- =============================================================================
-- Darrell, 2026-08-28: "we may or may not want the addresses to show on the
-- Properties tab until they submit a request for an application to rent then
-- show... thoughts... I know I want more control without needing to build
-- again... opportunities and constraints"
--
-- THE FINDING THAT MAKES THIS URGENT, measured on all twelve live rows before a
-- line of it was written. public_vacancies() deliberately omits r.address and
-- the storefront prints "The exact address is given by a person, not published
-- here" beneath the cards. Both are false. The RPC publishes `label`, which is
-- coalesce(display_name, city, ...) — and display_name IS the street:
--
--   public label                          withheld "street"
--   1003 Koehn Dr, Danville               1003 Koehn Dr
--   805 North Prospect Avenue — unit B    805 North Prospect Avenue
--   ... 12 of 12 contained the address in the label.
--
-- So the address has been public on every listed door since 0152, behind a
-- sentence promising it was not. Withholding one COLUMN is not withholding the
-- INFORMATION, and nothing in the schema was going to notice.
--
-- THE CONTROL, per door, so he never has to ask me again:
--   'public'            — show the street on the open shelf.
--   'after-application' — show a neighbourhood label; the street is handed over
--                         when someone actually applies.
-- NULL means after-application. The safe reading is the default, and a door
-- somebody forgot to set does not leak.
--
-- WHAT A GATED CARD STILL SAYS, because a listing nobody can place is a listing
-- nobody answers: the city and state, the property type, the rent, the bed and
-- bath count, the offering. Everything a renter needs to decide they want it —
-- and nothing that puts a stranger at a door.
-- =============================================================================

ALTER TABLE public.rentals ADD COLUMN IF NOT EXISTS address_visibility text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rentals_address_visibility_check') THEN
    ALTER TABLE public.rentals ADD CONSTRAINT rentals_address_visibility_check
      CHECK (address_visibility IS NULL OR address_visibility IN ('public', 'after-application'));
  END IF;
END $$;

COMMENT ON COLUMN public.rentals.address_visibility IS
  'Who may see this door''s street address on the open shelf. public = shown; after-application (also the meaning of NULL) = a neighbourhood label until someone applies. Set per door by the landlord.';

-- One definition of "may a stranger see the street", so the RPC and any later
-- caller cannot drift the way the label and the address did.
CREATE OR REPLACE FUNCTION public.rental_address_is_public(p_visibility text)
RETURNS boolean LANGUAGE sql IMMUTABLE
AS $$ SELECT coalesce(p_visibility, 'after-application') = 'public' $$;

-- ---------------------------------------------------------------------------
-- The shelf. Same shape as 0157 plus address_visibility, so the DROP is
-- required (CREATE OR REPLACE will not widen a RETURNS TABLE — the omission
-- that rolled 0153 back in full).
--
-- `label` is now COMPUTED against the setting rather than trusting
-- display_name. A gated door reads "2-bed apartment in Champaign, IL" — true,
-- useful, and not a location. `unit` is withheld too: "Apt B" at a named
-- building is the door number.
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
  min_stay_nights integer,
  showcase_order integer,
  address_shown boolean
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
         v.shown AS address_shown
    FROM v
   ORDER BY v.showcase_order ASC NULLS LAST, v.listed_at DESC
$$;

REVOKE ALL ON FUNCTION public.public_vacancies() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_vacancies() TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- "...until they submit a request for an application to rent then show."
--
-- The applicant has no account (0152 — asking about a place must not require
-- signing up), so there is no identity to check later. What there IS, at the
-- moment they apply, is the application row they just created. Presenting its
-- id proves they are the person who asked, and the address comes back.
--
-- It is a one-way door: the id is returned to the applicant by their own
-- insert and to nobody else (0152 grants no SELECT on rental_applications, not
-- even to the applicant), so this cannot be walked to enumerate addresses. A
-- wrong or stale id returns no row rather than an error — guessing tells you
-- nothing you did not already have.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.vacancy_address_for_applicant(p_application uuid)
RETURNS TABLE (address text, unit text, city text, state text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.address, r.unit, r.city, r.state
    FROM rental_applications a
    JOIN rentals r ON r.id = a.rental_id
   WHERE a.id = p_application
     AND r.listed_at IS NOT NULL
     AND NOT public.rental_is_own_home(r.status, r.property_type)
$$;

REVOKE ALL ON FUNCTION public.vacancy_address_for_applicant(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.vacancy_address_for_applicant(uuid) TO anon, authenticated;
