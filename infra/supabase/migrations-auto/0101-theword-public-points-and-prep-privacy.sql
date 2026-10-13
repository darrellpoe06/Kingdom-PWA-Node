-- =============================================================================
-- 0101 — The Word: publish BG's key points + scriptures publicly, and TIGHTEN
--        sermon prep to leadership-only.
-- =============================================================================
-- Two corrections, both declared by Darrell 2026-07-14:
--
--   1. PREP IS LEADERSHIP-ONLY. 0067 set sermon_prep READ = user_in_choir (the
--      whole choir). Darrell, explicitly: "choir members shouldn't see that —
--      only myself, BG and Christina see sermon preps." The prep is BG's full
--      working outline; it is owner/admin only, like the write policies already
--      are. This tightens the READ policy to match. (Choir members lose nothing
--      they should have had; the PUBLIC points below is how everyone gets the
--      published teaching outline.)
--
--   2. THE PUBLIC WORD SHOWS THE POINTS. The public library (theword_public_
--      sermons, 0029) returns published messages but NOT their teaching points —
--      those live in sermon_prep, which is now leadership-only, so a signed-out
--      visitor saw a video with no outline. Darrell: "the users logged in or not
--      should be able to see the Word ... just key points and scriptures" (NOT
--      the notes). This adds a SECURITY DEFINER window that returns, for PUBLISHED
--      (non-draft), colg-scoped messages ONLY, exactly the public-safe fields:
--      the numbered `points` + rolled-up `scriptures` + `theme`. No notes exist
--      in sermon_prep to leak; drafts and unpublished prep never appear.
-- =============================================================================

-- 1. Prep read → owner/admin only (was user_in_choir). ------------------------
DROP POLICY IF EXISTS sermon_prep_read ON sermon_prep;
CREATE POLICY sermon_prep_read ON sermon_prep FOR SELECT
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- 2. Public points window — published messages' outline + scriptures, no notes.
--    Mirrors theword_public_sermons(): join prep to its message, keep only
--    non-draft colg messages, expose the public-safe columns. SECURITY DEFINER
--    so it bypasses the (now leadership-only) row policy for these safe fields.
CREATE OR REPLACE FUNCTION public.theword_public_points()
RETURNS TABLE (
  sermon_id  uuid,
  points     jsonb,
  scriptures text[],
  theme      text
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.sermon_id, p.points, p.scriptures, p.theme
  FROM sermon_prep p
  JOIN choir_sermons s ON s.id = p.sermon_id
  JOIN instances i     ON i.id = s.instance_id
  WHERE i.slug = 'colg' AND s.status <> 'draft';
$$;

-- Least privilege: the ONE deliberate public-read window for the outline.
REVOKE ALL ON FUNCTION public.theword_public_points() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.theword_public_points() TO anon, authenticated;
