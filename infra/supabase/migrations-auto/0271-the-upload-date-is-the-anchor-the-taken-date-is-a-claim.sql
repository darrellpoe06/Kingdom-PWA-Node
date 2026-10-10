-- =============================================================================
-- 0271 — the UPLOAD date is the anchor; the TAKEN date is a claim
-- =============================================================================
-- Darrell, 2026-10-10, resolving a conflict this session had just surfaced to
-- him:
--
--   "Or have all options... always put the uploaded dates... and the other
--    option is default however editable... however the upload dat never
--    is... make sense?"
--
-- IT MAKES SENSE, AND IT IS BETTER THAN WHAT 0154 DID. Two timestamps, two
-- different kinds of fact, and 0154 protected the wrong one of them:
--
--   uploaded_at  — what the SYSTEM observed. Nobody asserts it; it is
--                  `NOT NULL DEFAULT now()` and it is true by construction.
--                  0154 left it WRITABLE. It should never move.
--
--   taken_at     — what a PERSON says about the world. 0154 froze it with
--                  "it is what the camera recorded", which is exactly right
--                  for a photograph captured in the app — and wrong for every
--                  other one, because the app only ever WROTE it for an in-app
--                  capture. A set chosen from the phone had none, could never
--                  be given one, and sorted as though taken the moment it was
--                  uploaded (photo-order.js and the door timeline both order
--                  by taken_at).
--
-- WHY THIS DOES NOT WEAKEN THE EVIDENCE, which was the whole worry. 0154 froze
-- taken_at to stop "re-pointing a move-out condition photo at another date".
-- The protection does not come from freezing the human's claim; it comes from
-- having an immutable record of WHEN THE PICTURE ACTUALLY ARRIVED, which the
-- claimant does not control. With uploaded_at frozen, a photograph that says
-- "taken 28 September" and arrived on 10 October says BOTH, permanently, to
-- anyone reading the record. A corrected date is visible as a correction
-- (edited_at already moves on every update, 0154) rather than being
-- indistinguishable from the original.
--
-- Freezing a field the app almost never populated did not protect anything.
-- It only guaranteed that an honest mistake was permanent and an unrecorded
-- date could never be supplied.
--
-- WHAT STAYS FROZEN, unchanged: the IMAGE (storage_path) and the DOOR
-- (rental_ref / tenancy_id / instance_id). The photograph is the evidence and
-- the place it belongs to is not a matter of opinion.
--
-- Idempotent: safe to apply twice.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.property_photos_freeze_evidence()
RETURNS trigger
LANGUAGE plpgsql
AS $$
begin
  if NEW.storage_path is distinct from OLD.storage_path then
    raise exception 'a photo''s image cannot be changed — add a new photo instead';
  end if;
  -- THE ANCHOR (0271). Nobody asserts this and nobody may move it: it is what
  -- the system observed, and it is what makes a corrected taken_at safe.
  if NEW.uploaded_at is distinct from OLD.uploaded_at then
    raise exception 'when a photo was uploaded cannot be changed — it is the record of when it arrived';
  end if;
  if NEW.uploaded_by is distinct from OLD.uploaded_by then
    raise exception 'who uploaded a photo cannot be changed';
  end if;
  -- taken_at is NO LONGER FROZEN (0271). It is a person's claim about the
  -- world, it is routinely absent on a photo chosen from a phone, and the
  -- immutable uploaded_at above is what keeps it honest.
  if NEW.rental_ref is distinct from OLD.rental_ref
     or NEW.tenancy_id is distinct from OLD.tenancy_id
     or NEW.instance_id is distinct from OLD.instance_id then
    raise exception 'a photo cannot be moved to another door, tenancy or instance';
  end if;
  NEW.edited_at := now();
  return NEW;
end;
$$;

DROP TRIGGER IF EXISTS property_photos_freeze ON public.property_photos;
CREATE TRIGGER property_photos_freeze
  BEFORE UPDATE ON public.property_photos
  FOR EACH ROW EXECUTE FUNCTION public.property_photos_freeze_evidence();

-- The column grant has to widen too: a trigger that allows a change is not
-- enough if UPDATE was never granted on the column (0154 granted four).
-- Whoever may correct a caption may correct a date; the row policy is
-- unchanged, so no new standing is created here.
GRANT UPDATE (caption, room_id, kind, archived_at, archived_by, taken_at)
  ON public.property_photos TO authenticated;

-- A date that is not a date is not a correction. A photograph cannot have been
-- taken after it was uploaded, and a timestamp before photography existed is a
-- typo, not a claim.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'property_photos_taken_at_sane') THEN
    ALTER TABLE public.property_photos ADD CONSTRAINT property_photos_taken_at_sane
      CHECK (
        taken_at IS NULL
        OR (taken_at > timestamptz '1900-01-01'
            AND taken_at <= uploaded_at + interval '1 day')
      );
  END IF;
END $$;
