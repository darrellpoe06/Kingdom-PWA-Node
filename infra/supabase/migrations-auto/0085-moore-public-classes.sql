-- =============================================================================
-- 0085 — Moore Divahs public class listings (the /moore customer door)
-- =============================================================================
-- The branded customer door (Shay demos it in the Quad Cities 2026-07-08) must
-- show upcoming classes + REAL seats-left to a signed-out visitor. class_sessions
-- / class_signups are instance-RLS'd with NO anon policy (0084) — correct, and
-- unchanged here. This adds ONE narrow SECURITY DEFINER read: upcoming sessions
-- for a named instance with a DERIVED paid-seat count. No student names, no
-- contact values, no signup rows — zero PII crosses the anon boundary. Mirrors
-- the crm_capture_lead posture: the public door talks to forced-safe RPCs only,
-- never tables.
--
-- DEPENDS ON: 0084 (class_sessions/class_signups), schema-v2.1 (instances).
-- IDEMPOTENT: CREATE OR REPLACE + re-runnable GRANTs.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.moore_public_classes(p_instance_slug text)
RETURNS TABLE (
  slug        text,
  format      text,
  project     text,
  date_iso    timestamptz,
  location    text,
  price_cents integer,
  seat_cap    integer,
  seats_left  integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.slug,
    s.format,
    s.project,
    s.date_iso,
    s.location,
    s.price_cents,
    s.seat_cap,
    GREATEST(
      0,
      s.seat_cap - (
        SELECT count(*)::integer FROM class_signups g
         WHERE g.instance_id = s.instance_id
           AND g.session_slug = s.slug
           AND g.paid_at IS NOT NULL          -- paid seats only, same rule as the engine
      )
    ) AS seats_left
  FROM class_sessions s
  JOIN instances i ON i.id = s.instance_id
  WHERE i.slug = p_instance_slug
    AND s.seed IS NOT TRUE                    -- demo rows never reach the public door
    AND s.date_iso IS NOT NULL
    AND s.date_iso >= now() - interval '1 day'
  ORDER BY s.date_iso ASC
  LIMIT 50;
$$;

-- The public door runs signed-out: anon may EXECUTE this one narrow read.
GRANT EXECUTE ON FUNCTION public.moore_public_classes(text) TO anon;
GRANT EXECUTE ON FUNCTION public.moore_public_classes(text) TO authenticated;

NOTIFY pgrst, 'reload schema';

-- Verify after apply:
--   As anon: POST /rest/v1/rpc/moore_public_classes {"p_instance_slug":"poe-family"}
--     -> upcoming sessions with seats_left; NEVER a student name or contact.
--   As anon: GET /rest/v1/class_signups?select=slug -> [] or 401 (unchanged).
