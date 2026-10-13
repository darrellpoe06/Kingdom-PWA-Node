-- =============================================================================
-- 0284 — THE WHOLE ADDRESS, AND ITS PICTURE ARCHIVE, ON THE RECORD (DR-0999)
-- =============================================================================
-- Darrell, 2026-10-13, with the Real Estate tab beside Poe Properties:
--
--   "Most of the properties have pictures already on the nas... why don't
--    they show up and why don't the addresses reflect each record... they
--    all should be in sync... correct? End to end processes!!!"
--   "Drop down with addresses... instead of letting someone else mistyped"
--   "Hold the whole address so everyone can see the correct pattern for each
--    property"
--
-- WHAT WAS TRUE: which NAS chat channel holds a property's pictures lived in
-- a hardcoded list in the app (nas-photos.js PROPERTY_CHANNELS), for 9 of 13
-- doors; the other 4 had no archive on either surface. The address was held
-- in parts on some rows and as one line on others.
--
-- THE DECISION:
--   1. rentals.photo_channel: the name of this door's picture archive on the
--      family NAS (a Synology Chat channel, e.g. '805NProspect'), picked from
--      the list the NAS itself serves, never typed. Same character rule as the
--      server's SAFE_CHANNEL; NULL means "no archive named yet".
--   2. rentals.address_held_at: when the one-time address repair (DR-0999,
--      address.js repairAddress) last ran on this row, so it runs once per
--      row and the app can say "held in its parts since ...".
--   3. Both are read on their OWN (loadDoorAreas), never added to the main
--      rentals read: deploy and db-migrate run side by side, and a column the
--      database does not yet have must not cost every family read (DR-0935).
--
-- Idempotent: safe to apply twice. Writes no row.
-- =============================================================================

ALTER TABLE public.rentals ADD COLUMN IF NOT EXISTS photo_channel text;
ALTER TABLE public.rentals ADD COLUMN IF NOT EXISTS address_held_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rentals_photo_channel_shape') THEN
    ALTER TABLE public.rentals ADD CONSTRAINT rentals_photo_channel_shape
      CHECK (photo_channel IS NULL OR photo_channel ~ '^[A-Za-z0-9._-]{1,64}$');
  END IF;
END $$;

COMMENT ON COLUMN public.rentals.photo_channel IS
  'The name of this door''s picture archive on the family NAS (a Synology Chat channel), picked from the list the NAS serves (DR-0999). NULL = no archive named yet. Same shape rule as the photo server''s SAFE_CHANNEL.';
COMMENT ON COLUMN public.rentals.address_held_at IS
  'When the one-time address repair last held this row''s address in its parts (street / unit / city / state / zip), so every surface prints the same line (DR-0999).';

NOTIFY pgrst, 'reload schema';
