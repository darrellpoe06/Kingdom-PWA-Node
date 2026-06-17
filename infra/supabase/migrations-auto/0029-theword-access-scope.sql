-- =============================================================================
-- 0029 — The Word — Migdal access scope (Darrell 2026-06-16). RLS-ENFORCED.
-- =============================================================================
-- Darrell's decision: the sermon LIBRARY is PUBLIC (congregation + unchurched —
-- Father's-Business reach); BG's PREP + add/edit/delete + drafts are PRIVATE to
-- leadership (owner/admin = BG / Darrell / Christina). Both enforced at the data
-- layer, never a UI-only lock (the parishioner-visibility lesson, DR-0074).
--
-- choir_sermons is read ONLY by The Word now (Choir's Sermons tab was removed),
-- so tightening its read policy scopes The Word without touching Choir. The Choir
-- team's own song-research (choir_resources) is a SEPARATE table with its own
-- user_in_choir policy (0011) — untouched here, distinct from BG's material.
--
-- IDEMPOTENT: DROP POLICY IF EXISTS + CREATE OR REPLACE FUNCTION; safe to re-run.

-- 1. PRIVATE: the table read drops from user_in_choir (owner/admin OR any choir
--    roster member) to OWNER/ADMIN ONLY. Now a non-leader can never read a draft
--    or any row off the table — prep + unpreached drafts are private at the DB.
--    (write/update/delete were already owner/admin — unchanged.)
DROP POLICY IF EXISTS choir_sermons_read ON choir_sermons;
CREATE POLICY choir_sermons_read ON choir_sermons FOR SELECT
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- 2. PUBLIC: the only public window is this SECURITY DEFINER function. It returns
--    ONLY published (non-draft), colg-scoped messages, newest first, and ONLY the
--    public-safe columns — no notes-as-prep beyond the published summary, no
--    instance internals, no documents (those live in choir_sermon_documents,
--    which stays admin-only per 0017). SECURITY DEFINER so anon + authenticated
--    can call it WITHOUT any direct grant on the table itself.
CREATE OR REPLACE FUNCTION public.theword_public_sermons()
RETURNS TABLE (
  id uuid,
  service_date date,
  service_type text,
  title text,
  speaker text,
  scripture_ref text,
  service_slot text,
  youtube_url text,
  video_id text,
  start_seconds integer
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id, s.service_date, s.service_type, s.title, s.speaker,
         s.scripture_ref, s.service_slot, s.youtube_url, s.video_id, s.start_seconds
  FROM choir_sermons s
  JOIN instances i ON i.id = s.instance_id
  WHERE i.slug = 'colg' AND s.status <> 'draft'
  ORDER BY s.service_date DESC NULLS LAST;
$$;

-- Least privilege: revoke the implicit PUBLIC execute, then grant explicitly to
-- the two client roles. This is the ONE deliberate public-read surface.
REVOKE ALL ON FUNCTION public.theword_public_sermons() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.theword_public_sermons() TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
