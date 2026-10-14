-- =============================================================================
-- 0291 — Borrowing goes both ways: a door shows its own pictures AND the
--        apartment's, in every direction (DR-1021)
-- =============================================================================
-- Darrell, 2026-10-14, after adding three foyer pictures to Apt 4 B: "they got
-- rid of the ones already there... I wanted to simply add 3 images!!!!! Now it
-- wont show the 40 pictures only the 3!! WHY?" And the rule, in his words:
-- "Borrowing should be able to do both and back and forth... should be able
-- to see what we want to see."
--
-- WHAT WAS TRUE (0273 / 0278 / 0282): a room or a bed borrowed the rest of
-- its apartment's pictures ONLY WHILE IT HAD NONE OF ITS OWN
-- (`WHERE NOT EXISTS (SELECT 1 FROM mine)`), and a whole unit never borrowed.
-- So the first picture a bed got of its own took the apartment's 37 off its
-- public card, and nothing was deleted anywhere: the 37 still sit on the door
-- that holds them. The family's own gallery already reads both (DR-0963,
-- loadSiblingPhotos, no such gate); the stranger's card was the half that
-- subtracted.
--
-- NOW: within one apartment (same instance, same street key, same non-empty
-- unit key -- same_apartment, 0273, which already keeps a whole house from
-- borrowing the next house at the same address), EVERY listed door shows its
-- own showable pictures first (its own sort_order), then every sibling's
-- showable pictures in this door's own order (door_photo_order, 0282), then
-- the owning door's order. Both directions: the bed sees the unit's, the unit
-- sees the bed's foyer. Nothing is copied; from_sibling says which is which.
-- The showable rules (kind = listing, not archived, the owning door listed and
-- empty) are unchanged, so nothing a stranger could not already see appears.
--
-- Same RETURNS shape as 0282/0290 (no DROP; 0290's two wrappers read this).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.public_vacancy_photos(p_rental uuid)
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
  -- BOTH WAYS (0291): every other listed door of the same apartment lends,
  -- whatever this door is and whether or not it has pictures of its own.
  siblings AS (
    SELECT s.* FROM showable s
     WHERE s.rental_ref <> p_rental
       AND EXISTS (
         SELECT 1
           FROM rentals me
           JOIN rentals sib ON sib.id = s.rental_ref
          WHERE me.id = p_rental
            AND sib.instance_id = me.instance_id
            AND public.same_apartment(me.address, me.unit, sib.address, sib.unit)
       )
  ),
  ordered AS (
    SELECT m.id, m.caption, m.storage_path, m.taken_at, false AS from_sibling,
           m.sort_order AS k1, NULL::integer AS k2
      FROM mine m
    UNION ALL
    SELECT s.id, s.caption, s.storage_path, s.taken_at, true AS from_sibling,
           d.position AS k1, s.sort_order AS k2
      FROM siblings s
      LEFT JOIN door_photo_order d ON d.rental_id = p_rental AND d.photo_id = s.id
  )
  SELECT o.id, o.caption, o.storage_path, o.taken_at, o.from_sibling
    FROM ordered o
   ORDER BY o.from_sibling, o.k1 ASC NULLS LAST, o.k2 ASC NULLS LAST, o.taken_at DESC NULLS LAST, o.id
$$;

REVOKE ALL ON FUNCTION public.public_vacancy_photos(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_vacancy_photos(uuid) TO anon, authenticated;

COMMENT ON FUNCTION public.public_vacancy_photos(uuid) IS
  'DR-1021 (0291): a listed door''s own showable pictures first, then every sibling door''s in this door''s own order — both ways within one apartment, never across instances, never for a door without a unit. from_sibling says which is which. Showable = listing kind, not archived, owning door listed and empty.';

NOTIFY pgrst, 'reload schema';
