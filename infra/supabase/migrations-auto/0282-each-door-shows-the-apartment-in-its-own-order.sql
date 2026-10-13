-- =============================================================================
-- 0282 — EACH DOOR SHOWS THE APARTMENT IN ITS OWN ORDER (DR-0984)
-- =============================================================================
-- Darrell, 2026-10-12, on the two listings for Apt 4 (Bed A and Bed B):
--
--   "I may want to have a different order of pictures for apartment B"
--   "One showing LivingRoom Kitchen as a cover the other showing the Bedroom
--    as a cover... either way... just advertising... make sense?"
--   and, reading the gallery note that said shared pictures are "never a way
--   to give this door its own": "This is the opposite of the required
--   specifications... I want to be able to show two different rooms in the
--   same apartment so the people know what two of the rooms look like right
--   away without clicking a picture."
--
-- WHAT WAS TRUE: a bed with no pictures of its own borrows the apartment's
-- (DR-0963 for the family, 0273/0278 for the open shelf), but only in the
-- order of the door that OWNS them. Two listings of one apartment therefore
-- always led with the same picture. And the shelf had stopped honouring the
-- family's own arranged order at all: 0161 sorted by sort_order, 0273 and
-- 0278 sort by taken_at only (ORDER BY 5, 4).
--
-- THE DECISION:
--   1. public.door_photo_order: one row per (door, borrowed picture) holding
--      THIS door's position for a picture that lives on another door of the
--      same apartment. Nothing is copied: the picture stays on its own door
--      (0154 freezes storage_path). Only a door of the same instance and the
--      same apartment (same_apartment, 0273) may place a picture; a door
--      never places its own (its own order is property_photos.sort_order).
--   2. RLS: the family reads and arranges (owner/admin/member), as for rooms.
--   3. public_vacancy_photos: own pictures by sort_order again, then taken_at;
--      borrowed pictures by THIS door's order, then the owning door's
--      sort_order, then taken_at. Same shape, so CREATE OR REPLACE.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.door_photo_order (
  rental_id   uuid NOT NULL REFERENCES public.rentals(id) ON DELETE CASCADE,
  photo_id    uuid NOT NULL REFERENCES public.property_photos(id) ON DELETE CASCADE,
  instance_id uuid NOT NULL,
  position    integer NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  uuid DEFAULT auth.uid(),
  PRIMARY KEY (rental_id, photo_id)
);
CREATE INDEX IF NOT EXISTS door_photo_order_instance_idx ON public.door_photo_order(instance_id);
CREATE INDEX IF NOT EXISTS door_photo_order_photo_idx ON public.door_photo_order(photo_id);

COMMENT ON TABLE public.door_photo_order IS
  'DR-0984: a door''s own order of the pictures it borrows from another door in the same apartment, so two listings of one apartment can lead with different rooms. Never a copy; a door''s own pictures are ordered by property_photos.sort_order.';

-- A row must describe a picture this door can actually borrow.
CREATE OR REPLACE FUNCTION public.door_photo_order_fits()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me  record;
  sib record;
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
  IF NOT public.same_apartment(me.address, me.unit, sib.address, sib.unit) THEN
    RAISE EXCEPTION 'door_photo_order: the picture is not in this door''s apartment' USING ERRCODE = 'check_violation';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS door_photo_order_fits ON public.door_photo_order;
CREATE TRIGGER door_photo_order_fits BEFORE INSERT OR UPDATE ON public.door_photo_order
  FOR EACH ROW EXECUTE FUNCTION public.door_photo_order_fits();

ALTER TABLE public.door_photo_order ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.door_photo_order FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.door_photo_order TO authenticated;

DROP POLICY IF EXISTS door_photo_order_read ON public.door_photo_order;
CREATE POLICY door_photo_order_read ON public.door_photo_order FOR SELECT TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member','viewer','assistant'));
DROP POLICY IF EXISTS door_photo_order_insert ON public.door_photo_order;
CREATE POLICY door_photo_order_insert ON public.door_photo_order FOR INSERT TO authenticated
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));
DROP POLICY IF EXISTS door_photo_order_update ON public.door_photo_order;
CREATE POLICY door_photo_order_update ON public.door_photo_order FOR UPDATE TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));
DROP POLICY IF EXISTS door_photo_order_delete ON public.door_photo_order;
CREATE POLICY door_photo_order_delete ON public.door_photo_order FOR DELETE TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member'));

-- The open shelf's pictures: 0278's rules, the family's order honoured again,
-- and a borrowing door's own order first.
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
  siblings AS (
    SELECT s.* FROM showable s
     WHERE NOT EXISTS (SELECT 1 FROM mine)
       AND EXISTS (
         SELECT 1
           FROM rentals me
           JOIN rentals sib ON sib.id = s.rental_ref
          WHERE me.id = p_rental
            AND public.rentable_level_of(me.rentable_level, me.unit, me.display_name) IN ('room', 'bed')
            AND sib.instance_id = me.instance_id
            AND public.same_apartment(me.address, me.unit, sib.address, sib.unit)
            AND sib.id <> me.id
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

-- A viewer reads and never writes; an assistant sees only the scope it was
-- given (DR-0241; 0130). Both overlays run over every instance-scoped table.
SELECT public.apply_viewer_readonly_overlay();
SELECT public.apply_assistant_scope_overlay();

NOTIFY pgrst, 'reload schema';
