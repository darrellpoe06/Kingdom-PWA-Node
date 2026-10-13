-- =============================================================================
-- 0268 — THE PUBLIC SHELF SHOWS WHERE, NEVER THE STREET (DR-0933)
-- =============================================================================
-- Darrell, 2026-10-10, on the no-account listing for 805 N Prospect Apt 2:
-- "Also the address shows while it says it will not show.... fix it... too"
-- and then: "Just show the location without the address... make sense... map
-- view..."
--
-- WHAT WAS TRUE: 0158 made the street a per-door choice ('public' or
-- 'after-application'), and Apt 2 was set 'public', so its card printed
-- "805 North Prospect Avenue · Apt 2" — under a page sentence (outside the
-- card) that still promised the address was not published.
--
-- THE DECISION: a stranger sees WHERE a place is (the town, and the area on a
-- map), never the street. The one definition every caller reads —
-- rental_address_is_public() — now answers false for every door, so
-- public_vacancies() gives every listed door its placeable-not-locatable label
-- and no unit number. The street is handed over when someone applies or books
-- (vacancy_address_for_applicant, 0158, unchanged).
--
-- The address_visibility column stays (its history, and the editor reads it);
-- it no longer opens the street to strangers.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.rental_address_is_public(p_visibility text)
RETURNS boolean LANGUAGE sql IMMUTABLE
AS $$ SELECT false $$;

COMMENT ON FUNCTION public.rental_address_is_public(text) IS
  'DR-0933: the street is never on the public shelf; a stranger sees the town and the area. It is handed over when someone applies or books.';

NOTIFY pgrst, 'reload schema';
