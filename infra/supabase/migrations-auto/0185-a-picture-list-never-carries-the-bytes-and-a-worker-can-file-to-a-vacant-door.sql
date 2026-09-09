-- =============================================================================
-- 0185 -- A picture list never carries the bytes, and a 1099 worker can file
--         a picture to a VACANT door
-- =============================================================================
-- Darrell, 2026-09-08, on his way to 805 North Prospect Apt 2 while Corion
-- Mallory (1099) installs a microwave and ductwork there: "take pictures of the
-- rooms... upload these into the app inside of the property section as well
-- as ... rentals ... our ten ninety nine workers are able to add pictures. And
-- we don't want them to be so big that it overruns and undermines our process
-- ... [the] issues with pictures being too big."
--
-- TWO THINGS THIS FILE CHANGES, AND WHY EACH IS A DATABASE MATTER.
--
-- 1. thumb_path. property_photos.storage_path holds the whole compressed image
--    as a data URL (0153 chose the row over a public bucket on purpose: the
--    insides of people's homes inherit RLS for free that way). The cost is that
--    every LIST of photos was carrying every image's full bytes: the Doors
--    board read every picture on every door on every boot just to pick one
--    cover per door. That is the DR-0303 class exactly -- the 2026-08-14 lockout
--    was a list that carried 6.2 MB of base64 once per sign-in -- and it would
--    have grown with every picture taken today. A small thumbnail (~320px, a
--    tenth of the bytes) is written beside the image at upload; every list
--    reads the thumbnail; the full image is fetched by id, one at a time, only
--    when somebody opens it. The rule (DR-0303, P40): the list never carries
--    the bytes.
--
--    thumb_path is deliberately NOT added to the column-level UPDATE grant from
--    0154/0161. Only caption / room_id / kind / archived_at / archived_by /
--    sort_order are updatable; the thumbnail is as frozen as the image it
--    stands for, by omission rather than by another trigger arm.
--
-- 2. A worker on a vacant door. The 0153 insert policy lets a worker file a
--    picture ONLY through a tenancy (user_is_enabled_worker(tenancy_id) or a
--    delegated docs.add resolved THROUGH rental_tenancies). Between tenants --
--    which is exactly when the turn, the microwave, the ductwork and the stairs
--    get done -- there is no tenancy row, so the worker doing the work could
--    not file a single before/after picture, and the landlord could not see
--    the door through the worker's account at all (rentals_member_read is
--    instance membership only). This adds a door-level arm: a delegated
--    capability whose scope_ref names the door's slug (or '*') now reaches the
--    door directly, tenancy or no tenancy. Same vocabulary as 0075, same
--    setting='allow' rule, same SECURITY DEFINER shape; the landlord grants it
--    from the People tab as he always has ("Add job documentation").
--
--    The new policies are ADDITIVE (separate permissive policies OR together
--    in Postgres). The 0153/0154 policies are not rewritten, so nothing that
--    was true before is loosened: management, tenants and tenancy-scoped
--    workers keep exactly the reach they had. A stranger still gets nothing;
--    a listing photo is still the only thing anon can ever see (0154/0161
--    public_vacancy_photos, unchanged).
--
-- Nothing here deletes, and nothing here widens the public surface.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. The thumbnail beside the image.
-- ---------------------------------------------------------------------------
ALTER TABLE public.property_photos ADD COLUMN IF NOT EXISTS thumb_path text;

COMMENT ON COLUMN public.property_photos.thumb_path IS
  'A small (~320px) JPEG data URL written at upload. Every LIST reads this, never storage_path (DR-0303: the list never carries the bytes). Not in the UPDATE grant, so it is frozen like the image it stands for.';

-- ---------------------------------------------------------------------------
-- 2. A delegated capability that reaches a DOOR, not only a tenancy.
--    rentals.slug is what delegated_capabilities.scope_ref holds (0075: "a
--    rental_ref value" -- the same text rental_tenancies.rental_ref carries).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.user_delegated_can_rental(p_rental uuid, p_capability text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM rentals r
    JOIN delegated_capabilities dc
      ON dc.instance_id     = r.instance_id
     AND dc.grantee_user_id = auth.uid()
     AND dc.capability      = p_capability
     AND dc.setting         = 'allow'
     AND (dc.scope_ref = r.slug OR dc.scope_ref = '*')
    WHERE r.id = p_rental
  )
$$;
REVOKE ALL ON FUNCTION public.user_delegated_can_rental(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_delegated_can_rental(uuid, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. The door itself is visible to the person delegated to it. Without this a
--    worker granted docs.add on 805 Apt 2 signs in and is told he has no place
--    here -- the rentals row is what the app resolves a door from. Read only;
--    the insert/update/delete policies on rentals are untouched.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS rentals_delegate_read ON public.rentals;
CREATE POLICY rentals_delegate_read ON public.rentals FOR SELECT TO authenticated
  USING (user_delegated_can_rental(id, 'docs.add')
         OR user_delegated_can_rental(id, 'property.history')
         OR user_delegated_can_rental(id, 'request.manage'));

-- ---------------------------------------------------------------------------
-- 4. Pictures on that door: read what is there, file new ones. No UPDATE arm
--    for a delegate at door level -- a worker files evidence, he does not
--    re-caption or archive the landlord's record.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS property_photos_delegate_read ON public.property_photos;
CREATE POLICY property_photos_delegate_read ON public.property_photos FOR SELECT TO authenticated
  USING (rental_ref IS NOT NULL
         AND (user_delegated_can_rental(rental_ref, 'docs.add')
              OR user_delegated_can_rental(rental_ref, 'property.history')
              OR user_delegated_can_rental(rental_ref, 'request.manage')));

DROP POLICY IF EXISTS property_photos_delegate_insert ON public.property_photos;
CREATE POLICY property_photos_delegate_insert ON public.property_photos FOR INSERT TO authenticated
  WITH CHECK (rental_ref IS NOT NULL
              AND uploaded_by = auth.uid()
              AND user_delegated_can_rental(rental_ref, 'docs.add'));

-- The rooms a picture is filed to must be readable by the same person, or the
-- room dropdown on the picture form is empty for him. Read only.
DROP POLICY IF EXISTS property_rooms_delegate_read ON public.property_rooms;
CREATE POLICY property_rooms_delegate_read ON public.property_rooms FOR SELECT TO authenticated
  USING (rental_ref IS NOT NULL
         AND (user_delegated_can_rental(rental_ref, 'docs.add')
              OR user_delegated_can_rental(rental_ref, 'property.history')
              OR user_delegated_can_rental(rental_ref, 'request.manage')));

-- The overlays re-read every policy set (0153 did the same after its policies).
SELECT public.apply_viewer_readonly_overlay();
SELECT public.apply_assistant_scope_overlay();
