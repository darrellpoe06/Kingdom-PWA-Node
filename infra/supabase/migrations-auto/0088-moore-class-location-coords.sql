-- =============================================================================
-- 0088 — class locations carry map coordinates (the AddressField pick)
-- =============================================================================
-- Darrell 2026-07-07: class Location is a type-ahead address (the Rentals
-- Nominatim pattern, now the shared AddressField). The picked lat/lon rides
-- the session so any surface — the steward tab, the /moore public door — can
-- link or pin the class on a map. Additive; location text unchanged.
-- DEPENDS ON: 0084, 0085. IDEMPOTENT.
-- =============================================================================

ALTER TABLE class_sessions ADD COLUMN IF NOT EXISTS location_lat double precision;
ALTER TABLE class_sessions ADD COLUMN IF NOT EXISTS location_lon double precision;

-- Public listings now include the coordinates (place data only — still no
-- student names, no contact values across the anon boundary).
-- DROP first: Postgres cannot change an existing function's RETURN TYPE via
-- CREATE OR REPLACE ("Row type defined by OUT parameters is different" — the
-- exact 2026-07-07 db-migrate failure on this file). GRANTs are re-issued
-- below, so the anon read is restored in the same migration.
DROP FUNCTION IF EXISTS public.moore_public_classes(text);
CREATE FUNCTION public.moore_public_classes(p_instance_slug text)
RETURNS TABLE (
  slug         text,
  format       text,
  project      text,
  date_iso     timestamptz,
  location     text,
  location_lat double precision,
  location_lon double precision,
  price_cents  integer,
  seat_cap     integer,
  seats_left   integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.slug, s.format, s.project, s.date_iso, s.location,
    s.location_lat, s.location_lon,
    s.price_cents, s.seat_cap,
    GREATEST(
      0,
      s.seat_cap - (
        SELECT count(*)::integer FROM class_signups g
         WHERE g.instance_id = s.instance_id
           AND g.session_slug = s.slug
           AND g.paid_at IS NOT NULL
      )
    ) AS seats_left
  FROM class_sessions s
  JOIN instances i ON i.id = s.instance_id
  WHERE i.slug = p_instance_slug
    AND s.seed IS NOT TRUE
    AND s.date_iso IS NOT NULL
    AND s.date_iso >= now() - interval '1 day'
  ORDER BY s.date_iso ASC
  LIMIT 50;
$$;

GRANT EXECUTE ON FUNCTION public.moore_public_classes(text) TO anon;
GRANT EXECUTE ON FUNCTION public.moore_public_classes(text) TO authenticated;

NOTIFY pgrst, 'reload schema';
