-- =============================================================================
-- 0153 — the property's own chronology: pictures, and the turn between tenants
-- =============================================================================
-- Darrell, 2026-08-27: "historical events to be chronological showing the latest
-- documents and notes about each property and tenants when they leave and move
-- in... pictures between each etc..."
--
-- Two things were missing to build that.
--
-- 1. THE STREAM WAS PER-TENANCY, NOT PER-DOOR. buildHistory() reads one
--    tenancy. A door outlives its tenants: the chronology Darrell described
--    runs move-in -> occupancy -> move-out -> THE TURN -> the next move-in, and
--    the turn is where the interesting evidence lives. rental_tenancies already
--    carries lease_start / lease_end / status, so the transitions need no new
--    column — only a reader that spans tenancies on one rental_ref.
--
-- 2. THERE WERE NO PICTURES. Nothing in the database held one. "Pictures
--    between each" is precisely the move-out condition set and the move-in
--    condition set that bracket a turn — the record that settles a deposit
--    dispute. property_photos is that table.
--
-- WHO SEES A PICTURE. The same ladder as tenancy_notes (0150), with one line
-- drawn tighter: a photo may belong to the DOOR rather than to a tenancy
-- (tenancy_id NULL) — the turn between tenants is exactly that case, since it
-- belongs to neither the leaving household nor the arriving one. A door-level
-- photo is MANAGEMENT-ONLY. A tenant must never see the inside of the unit
-- before they lived there or after they left, and the outgoing household must
-- not see the incoming one's condition set.
--
-- NO SURVEILLANCE (DR-028, already refused in code by assertNoRoomSurveillance).
-- This table is for still photographs a person deliberately took and filed.
-- The CHECK on `kind` is what keeps it that way: there is no 'camera',
-- 'stream' or 'sensor' kind, and adding one is a schema change somebody has to
-- justify rather than a value somebody can pass.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Where a door IS. Darrell, 2026-08-27: "use meta data from the images on the
-- nas for location documentation and image sorting to the proper location."
-- A photo's EXIF GPS can only be matched against a door if the door has
-- coordinates. geo_source records HOW they were obtained, because a coordinate
-- somebody typed and one a survey produced are not the same evidence, and a
-- filing decision made on the first should be readable as such later.
-- ---------------------------------------------------------------------------
ALTER TABLE public.rentals ADD COLUMN IF NOT EXISTS latitude   numeric;
ALTER TABLE public.rentals ADD COLUMN IF NOT EXISTS longitude  numeric;
ALTER TABLE public.rentals ADD COLUMN IF NOT EXISTS geo_source text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rentals_geo_source_check') THEN
    ALTER TABLE public.rentals ADD CONSTRAINT rentals_geo_source_check
      CHECK (geo_source IS NULL OR geo_source IN ('geocoded','surveyed','entered','from-photo'));
  END IF;
  -- Half a coordinate is not a location. Either both or neither.
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rentals_geo_pair_check') THEN
    ALTER TABLE public.rentals ADD CONSTRAINT rentals_geo_pair_check
      CHECK ((latitude IS NULL) = (longitude IS NULL));
  END IF;
END $$;

-- NOTE: public_vacancies() is column-explicit (0152) and is NOT widened here.
-- Publishing a listing's coordinates would publish the street address the
-- vacancy RPC deliberately withholds.

-- ---------------------------------------------------------------------------
-- ROOMS ARE DATA. Darrell, 2026-08-27: "each room has the ability to add photos
-- to coincide with that room... add or delete rooms natively so each property
-- can be upgraded without needing to rewrite code."
--
-- So there is no enum of rooms and no per-property branch anywhere. A room is a
-- row. Adding a bathroom is an INSERT; finishing a basement is an INSERT;
-- knocking two bedrooms together is an INSERT and two archives. No migration,
-- no deploy.
--
-- DELETING A ROOM DOES NOT DELETE ITS PHOTOS. archived_at is a soft delete on
-- purpose: property_photos is append-only evidence, and a move-out condition
-- set for a room somebody later removed is exactly the record a deposit
-- argument needs. The room stops being offered; the history it holds stands.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.property_rooms (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id  uuid NOT NULL,
  rental_ref   uuid NOT NULL,
  name         text NOT NULL,
  kind         text NOT NULL DEFAULT 'other',
  sort_order   integer NOT NULL DEFAULT 0,
  notes        text NOT NULL DEFAULT '',
  created_at   timestamptz NOT NULL DEFAULT now(),
  created_by   uuid,
  archived_at  timestamptz,
  archived_by  uuid
);

DO $$
BEGIN
  -- `kind` groups rooms for display and defaults; it is deliberately open-ended
  -- ('other' always available) so an unusual room never needs a schema change.
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'property_rooms_kind_check') THEN
    ALTER TABLE public.property_rooms ADD CONSTRAINT property_rooms_kind_check
      CHECK (kind IN ('bedroom','bathroom','kitchen','living','dining','laundry',
                      'basement','attic','garage','exterior','hallway','office',
                      'storage','utility','other'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'property_rooms_name_present') THEN
    ALTER TABLE public.property_rooms ADD CONSTRAINT property_rooms_name_present
      CHECK (length(btrim(name)) > 0);
  END IF;
END $$;

-- One name per door, among the rooms still in use. Archived names are free to
-- reuse — a rebuilt "Bathroom 2" should not be blocked by the one it replaced.
CREATE UNIQUE INDEX IF NOT EXISTS property_rooms_live_name_idx
  ON public.property_rooms(rental_ref, lower(btrim(name))) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS property_rooms_door_idx ON public.property_rooms(rental_ref, sort_order);

GRANT SELECT, INSERT, UPDATE ON public.property_rooms TO authenticated;
ALTER TABLE public.property_rooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS property_rooms_read   ON public.property_rooms;
DROP POLICY IF EXISTS property_rooms_write  ON public.property_rooms;
DROP POLICY IF EXISTS property_rooms_update ON public.property_rooms;

-- A room list describes the unit, not the household, so anyone with standing at
-- the door may read it. Only management may shape it: a tenant renaming or
-- archiving rooms would rewrite the frame their own condition photos hang on.
CREATE POLICY property_rooms_read ON public.property_rooms FOR SELECT TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member','viewer','assistant'));
CREATE POLICY property_rooms_write ON public.property_rooms FOR INSERT TO authenticated
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY property_rooms_update ON public.property_rooms FOR UPDATE TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));
-- No DELETE grant, ever: archived_at is the removal, so the evidence survives.

CREATE TABLE IF NOT EXISTS public.property_photos (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id    uuid NOT NULL,
  rental_ref     uuid,                 -- the door. Survives every tenancy on it.
  tenancy_id     uuid,                 -- NULL = belongs to the door, not a tenancy
  room_id        uuid,                 -- optional: which room this is OF
  request_id     uuid,                 -- optional: a work order's before/after
  kind           text NOT NULL,
  caption        text NOT NULL DEFAULT '',
  storage_path   text NOT NULL,
  taken_at       timestamptz,          -- when the shutter fired, if known
  uploaded_at    timestamptz NOT NULL DEFAULT now(),
  uploaded_by    uuid,
  author_label   text NOT NULL DEFAULT ''
);

-- The vocabulary IS the guard. Every kind names a moment a person chose to
-- photograph; none of them names a device left running.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'property_photos_kind_check') THEN
    ALTER TABLE public.property_photos ADD CONSTRAINT property_photos_kind_check
      CHECK (kind IN (
        'move-in-condition', 'move-out-condition', 'turn', 'work-order-before',
        'work-order-after', 'damage', 'listing', 'inspection', 'document-scan'
      ));
  END IF;
  -- A photo has to hang on something, or it can never be shown or governed.
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'property_photos_has_an_anchor') THEN
    ALTER TABLE public.property_photos ADD CONSTRAINT property_photos_has_an_anchor
      CHECK (rental_ref IS NOT NULL OR tenancy_id IS NOT NULL);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS property_photos_door_idx    ON public.property_photos(rental_ref, taken_at);
CREATE INDEX IF NOT EXISTS property_photos_tenancy_idx ON public.property_photos(tenancy_id, taken_at);
CREATE INDEX IF NOT EXISTS property_photos_request_idx ON public.property_photos(request_id);
CREATE INDEX IF NOT EXISTS property_photos_room_idx    ON public.property_photos(room_id, taken_at);

GRANT SELECT, INSERT ON public.property_photos TO authenticated;
ALTER TABLE public.property_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS property_photos_read   ON public.property_photos;
DROP POLICY IF EXISTS property_photos_insert ON public.property_photos;

-- Read: management always; the household only for THEIR OWN tenancy's photos.
-- The tenancy_id IS NOT NULL guard is the whole point — without it, a
-- door-level turn photo would be readable by whoever happens to live there now.
CREATE POLICY property_photos_read ON public.property_photos FOR SELECT TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member')
         OR (tenancy_id IS NOT NULL
             AND (user_is_tenant(tenancy_id)
                  OR user_is_tenancy_household(tenancy_id)
                  OR user_is_enabled_worker(tenancy_id)
                  OR user_delegated_can(tenancy_id,'request.manage')
                  OR user_delegated_can(tenancy_id,'property.history')
                  OR user_delegated_can(tenancy_id,'docs.add'))));

-- Write: management, or a person tied to that tenancy filing their own
-- evidence (a tenant photographing a leak; a worker filing before/after).
-- Nobody outside management may file a DOOR-level photo — the turn is the
-- landlord's record, and a tenant cannot write into the gap around their term.
CREATE POLICY property_photos_insert ON public.property_photos FOR INSERT TO authenticated
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member')
              OR (tenancy_id IS NOT NULL
                  AND (user_is_tenant(tenancy_id)
                       OR user_is_tenancy_household(tenancy_id)
                       OR user_is_enabled_worker(tenancy_id)
                       OR user_delegated_can(tenancy_id,'request.manage')
                       OR user_delegated_can(tenancy_id,'docs.add'))));

-- Append-only, like tenancy_notes: a condition photo whose caption can be
-- rewritten later is not evidence. No UPDATE or DELETE grant is issued.

-- The overlays must know about the new table, or a viewer/assistant would fall
-- through it (caught by the tenancy guard on 0150 — the same miss, prevented).
SELECT public.apply_viewer_readonly_overlay();
SELECT public.apply_assistant_scope_overlay();

-- ---------------------------------------------------------------------------
-- The size a renter filters on, counted from the rooms — never stored beside
-- them. Darrell, 2026-08-27: "if we add a room etc... we want users to be able
-- to change a 2 bedroom to a 3 etc..."
--
-- Adding a bedroom row makes the door a 3-bedroom everywhere at once, listing
-- included. There is no bedrooms column to update and forget, so a listing that
-- says 2 while the rooms say 3 is a state this schema cannot reach.
--
-- REDEFINES public_vacancies() from 0152. Column-explicit still: two derived
-- counts are added and NOTHING else. No address, no coordinates, no
-- purchase_price, no mortgage_balance, no tenant_name — the reasons 0152 was
-- written column-explicit are unchanged, and latitude/longitude added above are
-- deliberately not among them. Any isolation leg that replays 0152 must now
-- also list 0153 after it (migration-replay-order-guard enforces this).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.public_vacancies()
RETURNS TABLE (
  id           uuid,
  label        text,
  unit         text,
  city         text,
  state        text,
  property_type text,
  rent         numeric,
  note         text,
  listed_at    timestamptz,
  bedrooms     integer,
  bathrooms    numeric
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.id,
         coalesce(nullif(r.display_name, ''), nullif(r.city, ''), 'Available unit') AS label,
         r.unit,
         r.city,
         r.state,
         r.property_type,
         coalesce(r.listed_rent, r.monthly_rent) AS rent,
         r.listed_note AS note,
         r.listed_at,
         (SELECT count(*)::integer FROM property_rooms pr
           WHERE pr.rental_ref = r.id AND pr.archived_at IS NULL AND pr.kind = 'bedroom') AS bedrooms,
         -- A half bath counts as a half, the way every listing counts it.
         (SELECT coalesce(sum(CASE WHEN pr.name ~* '(half|powder)' THEN 0.5 ELSE 1 END), 0)::numeric
            FROM property_rooms pr
           WHERE pr.rental_ref = r.id AND pr.archived_at IS NULL AND pr.kind = 'bathroom') AS bathrooms
    FROM rentals r
   WHERE r.listed_at IS NOT NULL
     -- Listed AND actually free: a door with an active tenancy is never offered.
     AND NOT EXISTS (
       SELECT 1 FROM rental_tenancies t
        WHERE t.rental_ref = r.slug AND t.status = 'active'
     )
   ORDER BY r.listed_at DESC
$$;

REVOKE ALL ON FUNCTION public.public_vacancies() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_vacancies() TO anon, authenticated;
