-- =============================================================================
-- 0290 — A LISTING'S picture list never carries the bytes (DR-1016)
-- =============================================================================
-- Darrell, 2026-10-14: "The data... seems slow... period... why can't we make
-- it almost instant to see the images and information? It takes about 10 - 20
-- seconds to populate... can we fix that?"
--
-- MEASURED: public_vacancy_photos() (0154 / 0282) returns storage_path for
-- EVERY showable picture of a unit, and storage_path is the whole compressed
-- image as a data URL (0153). The bed at 805 shows 37 pictures, so one card
-- reads 37 full-size images before it can show the first; three cards on the
-- shelf read it all three times. 0185 stopped the FAMILY's lists from doing
-- this ("the list never carries the bytes", DR-0303, P40) and left the
-- stranger's road unchanged. This is the same rule on that road.
--
-- TWO FUNCTIONS, the showable set unchanged:
--   * public_vacancy_photo_list(p_rental): the same rows in the same order as
--     public_vacancy_photos, WITHOUT storage_path -- id, caption, taken_at,
--     from_sibling, and whether a thumbnail exists. Wraps the existing
--     function so the rule of what a stranger may see lives in one place.
--   * public_vacancy_picture(p_rental, p_id, p_size): ONE picture's bytes,
--     and only when that picture is in p_rental's showable set right now;
--     'thumb' answers the 640px thumbnail when the upload wrote one (0185)
--     and the full image when it did not; anything else answers the full
--     image. NULL otherwise -- never an error a stranger can read.
--
-- public_vacancy_photos stays as it is: the deploy's listing-share pages read
-- it on a runner, and the e2e journeys and smokes pin it. Nothing here widens
-- what anon may see: the same set, one picture at a time.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.public_vacancy_photo_list(p_rental uuid)
RETURNS TABLE (
  id           uuid,
  caption      text,
  taken_at     timestamptz,
  from_sibling boolean,
  has_thumb    boolean
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT v.id, v.caption, v.taken_at, v.from_sibling,
         (ph.thumb_path IS NOT NULL AND ph.thumb_path <> '') AS has_thumb
    FROM public.public_vacancy_photos(p_rental) WITH ORDINALITY AS v(id, caption, storage_path, taken_at, from_sibling, n)
    JOIN public.property_photos ph ON ph.id = v.id
   ORDER BY v.n
$$;

REVOKE ALL ON FUNCTION public.public_vacancy_photo_list(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_vacancy_photo_list(uuid) TO anon, authenticated;

COMMENT ON FUNCTION public.public_vacancy_photo_list(uuid) IS
  'The open shelf''s picture list WITHOUT the bytes (DR-1016): the same rows, in the same order, as public_vacancy_photos, plus whether a thumbnail exists. A card reads this once and asks public_vacancy_picture for one picture at a time.';

CREATE OR REPLACE FUNCTION public.public_vacancy_picture(p_rental uuid, p_id uuid, p_size text DEFAULT 'thumb')
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE WHEN p_size = 'thumb' THEN coalesce(nullif(ph.thumb_path, ''), ph.storage_path) ELSE ph.storage_path END
    FROM public.property_photos ph
   WHERE ph.id = p_id
     AND EXISTS (SELECT 1 FROM public.public_vacancy_photos(p_rental) v WHERE v.id = p_id)
   LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.public_vacancy_picture(uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_vacancy_picture(uuid, uuid, text) TO anon, authenticated;

COMMENT ON FUNCTION public.public_vacancy_picture(uuid, uuid, text) IS
  'ONE listing picture''s bytes for the open shelf (DR-1016): the thumbnail (0185) or the full image, only while that picture is in the unit''s showable set (public_vacancy_photos); NULL otherwise.';

-- A viewer reads and never writes; an assistant sees only the scope it was
-- given (DR-0241; 0130). Both overlays run over every instance-scoped table.
SELECT public.apply_viewer_readonly_overlay();
SELECT public.apply_assistant_scope_overlay();

NOTIFY pgrst, 'reload schema';
