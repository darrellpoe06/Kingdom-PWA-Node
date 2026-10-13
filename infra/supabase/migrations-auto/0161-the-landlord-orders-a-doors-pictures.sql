-- =============================================================================
-- 0161 — the landlord orders a door's pictures, and picks the cover
-- =============================================================================
-- Darrell, 2026-08-28: "no way to reorder the images? does work..." — the doors
-- board lets him arrange the shelf (0157, showcase_order) and it works; the
-- pictures ON a door had no such control. Same need, same shape, so the same
-- answer: the ORDER is data he sets, not a fixed newest-first. The first picture
-- is the cover, and both the gallery he manages and the public listing a renter
-- sees read the same column — what he arranges is what they see.
--
-- Deliberately a plain integer with gaps (like showcase_order), not a dense
-- rank: making one picture the cover rewrites ONE row. NULL means "unplaced" and
-- sorts after everything placed, newest-first — so a gallery nobody has arranged
-- keeps showing the newest picture as the cover, exactly as before this ran.
--
-- sort_order is NOT one of the columns the 0154 evidence-freeze trigger guards
-- (storage_path, taken_at, rental_ref, tenancy_id, instance_id): where a picture
-- SITS is the landlord's arrangement, not the evidence the photograph is. So it
-- joins caption / room_id / kind / archived_at as an editable description.
-- =============================================================================

ALTER TABLE public.property_photos ADD COLUMN IF NOT EXISTS sort_order integer;

COMMENT ON COLUMN public.property_photos.sort_order IS
  'Where this picture sits in the door''s gallery and the public listing. Lower is earlier; the first is the cover; NULL sorts last (unplaced, newest-first). Set by whoever may edit the picture, from the gallery.';

CREATE INDEX IF NOT EXISTS property_photos_sort_order_idx
  ON public.property_photos(rental_ref, sort_order NULLS LAST);

-- Whoever may correct a picture's description may also arrange it. Same standing
-- as the caption/kind/room grant from 0154 — no new access is created here.
GRANT UPDATE (sort_order) ON public.property_photos TO authenticated;

-- ---------------------------------------------------------------------------
-- The public listing gallery honours the arrangement. Same RETURNS shape as
-- 0154 (id, caption, storage_path, taken_at) so CREATE OR REPLACE is safe — only
-- the ORDER BY changes: the landlord's order first, newest as the tie-break for
-- pictures he has not placed. The cover a stranger sees is the one he chose.
--
-- Everything 0154 refused, this still refuses: kind = 'listing' only, the unit
-- must be listed and free, nothing archived, and who took it and which room it
-- is filed to never leave the instance.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.public_vacancy_photos(p_rental uuid)
RETURNS TABLE (
  id           uuid,
  caption      text,
  storage_path text,
  taken_at     timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ph.id, ph.caption, ph.storage_path, ph.taken_at
    FROM property_photos ph
    JOIN rentals r ON r.id = ph.rental_ref
   WHERE ph.rental_ref = p_rental
     AND ph.kind = 'listing'
     AND ph.archived_at IS NULL
     AND r.listed_at IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM rental_tenancies t
        WHERE t.rental_ref = r.slug AND t.status = 'active'
     )
   ORDER BY ph.sort_order ASC NULLS LAST, ph.taken_at DESC NULLS LAST, ph.uploaded_at DESC
$$;

REVOKE ALL ON FUNCTION public.public_vacancy_photos(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_vacancy_photos(uuid) TO anon, authenticated;
