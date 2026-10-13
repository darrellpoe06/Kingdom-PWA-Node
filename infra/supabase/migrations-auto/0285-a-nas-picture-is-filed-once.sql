-- =============================================================================
-- 0285 — A NAS PICTURE IS FILED ON A DOOR ONCE, AND SAYS WHERE IT CAME FROM (DR-1002)
-- =============================================================================
-- Darrell, 2026-10-13, with the Real Estate tab beside Poe Properties:
--
--   "Most of the properties have pictures already on the nas... why don't
--    they show up... they all should be in sync... End to end processes!!!"
--   "The nas has all pictures period!!! All my photos are uploaded in the
--    Synology photos app... why not just pull from there?"
--
-- WHAT WAS TRUE: a picture on the NAS could reach a door's listing only by
-- being photographed again or picked off the phone; nothing on the row said
-- it had come from the archive, so the same picture could be filed twice and
-- nothing could say "this one is already here".
--
-- THE DECISION:
--   1. property_photos.source: where a filed picture came from, when it came
--      from the family NAS -- 'nas:<archive>:<post id>' for a Synology Chat
--      archive, 'nas:library:<file name>' for the phone backup by month.
--      NULL for a picture taken or picked on the phone (every row until now).
--   2. ONE DOOR FILES ONE SOURCE ONCE (property_photos_source_once): the
--      database refuses the second copy, so "never twice" is a rule, not a
--      hope. Another door of the same apartment may file the same picture
--      (the archive is the building's, DR-0999); that is a different row on
--      a different door, and the shelf shows it once per listing.
--   3. The bytes still travel the road 0153 laid (storage_path / thumb_path);
--      the files-on-the-NAS road is DR-0955's own queued item.
--
-- Idempotent: safe to apply twice. Writes no row. The image column stays
-- frozen (0154); source joins the frozen set below so a filed picture cannot
-- be re-pointed at another origin.
-- =============================================================================

ALTER TABLE public.property_photos ADD COLUMN IF NOT EXISTS source text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'property_photos_source_shape') THEN
    ALTER TABLE public.property_photos ADD CONSTRAINT property_photos_source_shape
      CHECK (source IS NULL OR source ~ '^nas:[A-Za-z0-9._-]{1,64}:[A-Za-z0-9._ -]{1,160}$');
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS property_photos_source_once
  ON public.property_photos (rental_ref, source)
  WHERE source IS NOT NULL AND rental_ref IS NOT NULL;

COMMENT ON COLUMN public.property_photos.source IS
  'Where this picture came from when it came from the family NAS: nas:<archive>:<post id> (a Synology Chat archive) or nas:library:<file name> (the phone backup by month). NULL = taken or picked on the phone. One door files one source once (property_photos_source_once, DR-1002).';

NOTIFY pgrst, 'reload schema';
