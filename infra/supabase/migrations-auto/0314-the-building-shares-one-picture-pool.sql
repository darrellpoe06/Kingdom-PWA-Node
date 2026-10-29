-- =============================================================================
-- 0314 — THE BUILDING SHARES ONE PICTURE POOL (DR-1290)
-- =============================================================================
-- Darrell, 2026-10-29, on the Listing pictures of a door at 805:
--
--   "Need to be able to show images of the entry on all doors in 805!!!!! All
--    pictures for any apartment should be available from the same images
--    pool... we can add which apt... however we should be able to use
--    anything it's the same building!!!!! Fix it!!!"
--
-- WHAT WAS TRUE: a door could borrow pictures only from the other doors of
-- its own APARTMENT (same_apartment, 0273: same street key AND same unit
-- number). door_photo_order_fits (0282) refused any other picture outright,
-- and public_vacancy_photos (0291) only ever reached the apartment. So the
-- entry, the halls and the laundry, photographed once and filed on one
-- apartment's door, could not be used on Apt 2 at the same address.
--
-- THE DECISION:
--   1. A door may PLACE any picture filed on another door of the same
--      BUILDING (same instance, same building_key, 0283) -- one door_photo_
--      order row, nothing copied (0154 freezes storage_path). The apartment
--      stays automatic exactly as 0291 made it; the building is opt-in, one
--      picture at a time, because a building's pool holds other households'
--      apartments and only the family can say which pictures are the shared
--      spaces.
--   2. The open shelf shows a placed picture on THIS door while THIS door is
--      listed and empty -- the door being advertised -- whether or not the
--      door that holds the picture is let. Placing it is the family's
--      explicit choice for this listing; the screen asks for shared spaces,
--      not someone's home. Only a picture of the listing kind is ever shown
--      to a stranger; a record (move-in, work order, inspection) placed here
--      shows in the family's gallery only.
--   3. Never across instances; a building key under five characters names
--      nothing and never matches (0283's rule, unchanged).
--
-- Same RETURNS shape as 0282/0291 (no DROP; 0290's wrappers read it).
-- Idempotent: CREATE OR REPLACE throughout; writes no row.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.door_photo_order_fits()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me  record;
  sib record;
  my_building text;
BEGIN
  SELECT r.id, r.instance_id, r.address, r.unit INTO me FROM rentals r WHERE r.id = NEW.rental_id;
  SELECT r.id, r.instance_id, r.address, r.unit, ph.instance_id AS photo_instance
    INTO sib
    FROM property_photos ph JOIN rentals r ON r.id = ph.rental_ref
   WHERE ph.id = NEW.photo_id;
  IF me.id IS NULL OR sib.id IS NULL THEN
    RAISE EXCEPTION 'door_photo_order: the door or the picture does not exist' USING ERRCODE = 'check_violation';
  END IF;
  IF sib.id = me.id THEN
    RAISE EXCEPTION 'door_photo_order: a door orders its own pictures with sort_order, not here' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.instance_id IS DISTINCT FROM me.instance_id
     OR sib.instance_id IS DISTINCT FROM me.instance_id
     OR sib.photo_instance IS DISTINCT FROM me.instance_id THEN
    RAISE EXCEPTION 'door_photo_order: never across instances' USING ERRCODE = 'check_violation';
  END IF;
  my_building := public.building_key(me.address, me.unit);
  IF NOT public.same_apartment(me.address, me.unit, sib.address, sib.unit)
     AND NOT (length(coalesce(my_building, '')) >= 5
              AND public.building_key(sib.address, sib.unit) = my_building) THEN
    RAISE EXCEPTION 'door_photo_order: the picture is not in this door''s building' USING ERRCODE = 'check_violation';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;

COMMENT ON TABLE public.door_photo_order IS
  'DR-0984 / DR-1290: a door''s own placement of a picture that lives on another door. Within its apartment every picture is shared and a row only orders it; elsewhere in its building (building_key, 0283) a row is what puts the picture on this door at all. Never a copy; a door''s own pictures are ordered by property_photos.sort_order.';

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
  -- THE BUILDING'S POOL (0314): a picture elsewhere in the building that the
  -- family PLACED on this door, shown while this door is listed and empty.
  placed AS (
    SELECT ph.id, ph.caption, ph.storage_path, ph.taken_at, ph.sort_order, d.position
      FROM door_photo_order d
      JOIN property_photos ph ON ph.id = d.photo_id
      JOIN rentals me  ON me.id  = d.rental_id
      JOIN rentals own ON own.id = ph.rental_ref
     WHERE d.rental_id = p_rental
       AND ph.kind = 'listing'
       AND ph.archived_at IS NULL
       AND own.id <> me.id
       AND own.instance_id = me.instance_id
       AND ph.instance_id = me.instance_id
       AND length(public.building_key(me.address, me.unit)) >= 5
       AND public.building_key(own.address, own.unit) = public.building_key(me.address, me.unit)
       AND me.listed_at IS NOT NULL
       AND NOT EXISTS (
         SELECT 1 FROM rental_tenancies t
          WHERE t.rental_ref = me.slug AND t.status = 'active'
       )
       AND NOT EXISTS (SELECT 1 FROM siblings s WHERE s.id = ph.id)
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
    UNION ALL
    SELECT p.id, p.caption, p.storage_path, p.taken_at, true AS from_sibling,
           p.position AS k1, p.sort_order AS k2
      FROM placed p
  )
  SELECT o.id, o.caption, o.storage_path, o.taken_at, o.from_sibling
    FROM ordered o
   ORDER BY o.from_sibling, o.k1 ASC NULLS LAST, o.k2 ASC NULLS LAST, o.taken_at DESC NULLS LAST, o.id
$$;

REVOKE ALL ON FUNCTION public.public_vacancy_photos(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_vacancy_photos(uuid) TO anon, authenticated;

COMMENT ON FUNCTION public.public_vacancy_photos(uuid) IS
  'DR-1022 (0291) / DR-1290 (0314): a listed door''s own showable pictures first, then its apartment''s (automatic, both ways) and the building pictures the family placed on it, in this door''s own order. Never across instances. Showable = listing kind, not archived; an apartment picture also needs its owning door listed and empty; a placed building picture needs THIS door listed and empty.';

NOTIFY pgrst, 'reload schema';
