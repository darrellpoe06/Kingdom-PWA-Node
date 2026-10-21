-- =============================================================================
-- 0309 — a door shows its pictures to its people (DR-1199)
-- =============================================================================
-- Darrell, 2026-10-21, from the Properties tab on the TV: "We have images on
-- multiple doors, and those images should be able to be seen by the people we
-- are adding to the system, or if we decide we want them to."
--
-- WHAT STOOD. 0153's read policy gives a tenant and their household only the
-- pictures filed to THEIR tenancy (tenancy_id = theirs). Every door-level
-- picture — the apartment as advertised, its rooms — stayed the landlord's
-- alone, so a tenant opening the app saw none of the pictures of the place
-- they live in. A worker delegated on the door reads door-level pictures
-- since 0185; a tenant did not. 0153's reason for the guard stands and is
-- kept: a door-level CONDITION picture (a turn, a move-out, damage) belongs
-- to the record of whoever lived there then, not to whoever lives there now.
--
-- WHAT THIS DOES.
--   1. rentals.pictures_shared_with_door — the landlord's switch, per door,
--      ON by default ("or if we decide we want them to").
--   2. door_shares_pictures_with(rental) — true for the door's own tenant or
--      household member (door_role_of_user, 0266) while the switch is on.
--   3. property_photos_door_people_read — the door's LISTING pictures
--      (door-level, not archived) open to its people. Condition pictures of
--      other tenancies stay closed; their own tenancy's pictures were already
--      theirs (0153).
--   4. property_rooms_door_people_read — the rooms of that door, read-only,
--      so the room dropdown on their Pictures tab names this apartment's
--      rooms and nothing else.
--
-- Idempotent; applied twice in CI (door-work leg) and proven on the live
-- database (rls-isolation, poe-properties leg) by 0309-door-pictures-smoke.sql.
-- =============================================================================

ALTER TABLE public.rentals
  ADD COLUMN IF NOT EXISTS pictures_shared_with_door boolean NOT NULL DEFAULT true;

CREATE OR REPLACE FUNCTION public.door_shares_pictures_with(p_rental uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM rentals r
     WHERE r.id = p_rental
       AND r.pictures_shared_with_door
       AND public.door_role_of_user(r.id) IN ('tenant', 'household'))
$$;
REVOKE ALL ON FUNCTION public.door_shares_pictures_with(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.door_shares_pictures_with(uuid) TO authenticated;

DROP POLICY IF EXISTS property_photos_door_people_read ON public.property_photos;
CREATE POLICY property_photos_door_people_read ON public.property_photos FOR SELECT TO authenticated
  USING (rental_ref IS NOT NULL
         AND tenancy_id IS NULL
         AND kind = 'listing'
         AND archived_at IS NULL
         AND public.door_shares_pictures_with(rental_ref));

DROP POLICY IF EXISTS property_rooms_door_people_read ON public.property_rooms;
CREATE POLICY property_rooms_door_people_read ON public.property_rooms FOR SELECT TO authenticated
  USING (rental_ref IS NOT NULL
         AND archived_at IS NULL
         AND public.door_shares_pictures_with(rental_ref));

-- The overlays re-read every policy set (0153 and 0185 did the same).
SELECT public.apply_viewer_readonly_overlay();
SELECT public.apply_assistant_scope_overlay();
