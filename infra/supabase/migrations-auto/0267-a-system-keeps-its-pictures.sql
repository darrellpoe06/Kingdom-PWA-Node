-- =============================================================================
-- 0267 — A SYSTEM KEEPS ITS PICTURES (DR-0909)
-- =============================================================================
-- Darrell, 2026-10-10: "Should be able to add images etc of systems... all
-- places that make sense... make sense?"
--
-- WHAT WAS TRUE: property_systems (the furnace, the water heater, the roof)
-- and property_system_events (installed, serviced, repaired, replaced) hold
-- words and dates only. The data plate, the rusted flue, the new unit in the
-- basement could only be filed as a loose door picture, cut off from the
-- system it shows.
--
-- THE SHAPE: no second picture store. property_photos — which already has
-- thumbnails (0185), captions and archive (0154), the arranged order, the
-- door and tenancy walls, and the worker's door road — gains two optional
-- anchors: system_id and system_event_id, and a 'system' kind. A system
-- picture is a door picture that ALSO says which system (and, optionally,
-- which service visit) it shows. Every existing wall applies unchanged.
--
-- The picture's system must be on the picture's door, and the event must be
-- of that system; the database refuses a picture that says otherwise.
--
-- IDEMPOTENT + ADDITIVE.
-- =============================================================================

ALTER TABLE public.property_photos ADD COLUMN IF NOT EXISTS system_id uuid REFERENCES public.property_systems(id) ON DELETE SET NULL;
ALTER TABLE public.property_photos ADD COLUMN IF NOT EXISTS system_event_id uuid REFERENCES public.property_system_events(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS property_photos_system_idx ON public.property_photos(system_id, taken_at) WHERE system_id IS NOT NULL;

ALTER TABLE public.property_photos DROP CONSTRAINT IF EXISTS property_photos_kind_check;
ALTER TABLE public.property_photos ADD CONSTRAINT property_photos_kind_check
  CHECK (kind IN (
    'move-in-condition', 'move-out-condition', 'turn', 'work-order-before',
    'work-order-after', 'damage', 'listing', 'inspection', 'document-scan', 'system'
  ));

COMMENT ON COLUMN public.property_photos.system_id IS
  'DR-0909: the system (furnace, water heater, roof...) this picture shows. Must be on the picture''s door.';
COMMENT ON COLUMN public.property_photos.system_event_id IS
  'DR-0909: the service visit, repair or replacement this picture documents. Must be an event of system_id.';

CREATE OR REPLACE FUNCTION public.property_photos_system_on_its_door()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_sys record;
BEGIN
  IF NEW.system_event_id IS NOT NULL THEN
    SELECT system_ref INTO NEW.system_id FROM property_system_events WHERE id = NEW.system_event_id;
    IF NEW.system_id IS NULL THEN
      RAISE EXCEPTION 'this picture names a service visit that does not exist' USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  IF NEW.system_id IS NULL THEN RETURN NEW; END IF;
  SELECT instance_id, rental_ref INTO v_sys FROM property_systems WHERE id = NEW.system_id;
  IF v_sys.rental_ref IS NULL
     OR v_sys.instance_id IS DISTINCT FROM NEW.instance_id
     OR (NEW.rental_ref IS NOT NULL AND v_sys.rental_ref IS DISTINCT FROM NEW.rental_ref) THEN
    RAISE EXCEPTION 'this picture names a system on another door' USING ERRCODE = 'check_violation';
  END IF;
  NEW.rental_ref := coalesce(NEW.rental_ref, v_sys.rental_ref);
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.property_photos_system_on_its_door() FROM PUBLIC;

DROP TRIGGER IF EXISTS property_photos_system_door ON public.property_photos;
CREATE TRIGGER property_photos_system_door
  BEFORE INSERT OR UPDATE OF system_id, system_event_id, rental_ref, instance_id ON public.property_photos
  FOR EACH ROW EXECUTE FUNCTION public.property_photos_system_on_its_door();

NOTIFY pgrst, 'reload schema';
