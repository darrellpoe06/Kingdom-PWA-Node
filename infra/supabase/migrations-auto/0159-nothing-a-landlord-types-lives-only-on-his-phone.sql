-- =============================================================================
-- 0159 — nothing a landlord types lives only on his phone
-- =============================================================================
-- Darrell, 2026-08-28: "need all data to be reflected in the apps... review
-- comprehensive and complete review of the how the data must flow from one
-- location to another without dead-ends."
--
-- MEASURED AGAINST THE LIVE DATABASE, not against the repo's schema files.
-- That distinction mattered: my first draft of this migration was written from
-- the repo and was wrong twice over, and both errors would have shipped.
--
-- WHAT IS ACTUALLY TRUE (catalog queries, 2026-08-28):
--   * property_notes EXISTS (0062) and holds 4 REAL ROWS — the three 1508
--     Williamsburg notes and one on Apt 2 about Jhazmine's move-out. Those are
--     on the server. They are not stranded. UnitManagement.jsx has been
--     mirroring them to the cloud all along.
--   * Its key is rental_ref TEXT — the local slug ('r-1508williamsburg'), NOT
--     the rentals UUID that property_rooms / property_systems / property_photos
--     use. Two keys, both correct for their own table, neither convertible to
--     the other by assumption.
--   * Its kind vocabulary is the 0062 six: general, maintenance, tenant,
--     financial, inspection, follow-up. A second CHECK naming a different six
--     (which my first draft added) would have made half the app's own writes
--     illegal.
--   * property_rooms / property_systems / property_system_events /
--     property_photos are genuinely EMPTY — 0 rows each.
--
-- SO THE REAL DEAD-END IS NARROWER AND STILL REAL. Five stores in the Real
-- Estate tab write to localStorage and nowhere else:
--   conversationLog, maintenanceLog, rooms, equipment, room photos.
-- Those live in one browser on one phone. A cleared cache, a laptop, or
-- Christina's device does not have them.
--
-- This migration prepares the ground those five land on. It moves nothing by
-- itself — the upload is app-side and deliberate, because a migration must not
-- reach into a browser it cannot see.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. property_notes gains PROVENANCE and an IDEMPOTENCY KEY.
--
-- No CREATE TABLE: the table is live with rows in it. Two columns only.
--
-- `source` because a note rescued off a phone months after it was typed is not
-- the same evidence as one written into the shared record, and a year from now
-- the difference will matter to whoever reads it.
--
-- `legacy_id` because the rescue must be safe to run twice. The landlord will
-- press the button, wonder whether it worked, and press it again — that is
-- normal and correct behavior, and it must not double his records.
-- ---------------------------------------------------------------------------
ALTER TABLE public.property_notes ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'app';
ALTER TABLE public.property_notes ADD COLUMN IF NOT EXISTS legacy_id text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'property_notes_source_check') THEN
    ALTER TABLE public.property_notes ADD CONSTRAINT property_notes_source_check
      CHECK (source IN ('app', 'rescued-from-device', 'imported'));
  END IF;
END $$;

COMMENT ON COLUMN public.property_notes.source IS
  'Where this row came from. app = typed into the record. rescued-from-device = lifted out of one browser''s localStorage by the rescue path. imported = brought in from another system.';
COMMENT ON COLUMN public.property_notes.legacy_id IS
  'The device-local id (un-… / cv-…) this row was rescued from. Unique per door, so re-running the rescue updates instead of duplicating. NULL for notes typed directly.';

-- The four existing rows keep source='app', which is the truth about them.
CREATE UNIQUE INDEX IF NOT EXISTS property_notes_legacy_idx
  ON public.property_notes(rental_ref, legacy_id) WHERE legacy_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 2. A MAINTENANCE ENTRY NEED NOT NAME A SYSTEM.
--
-- property_system_events.system_ref is NOT NULL, which is right for "the
-- furnace was serviced" and wrong for the Real Estate tab's maintenance log,
-- whose own categories include general, lawn and pest — work on the property
-- that belongs to no piece of equipment. Those entries had nowhere to land, so
-- the rescue would have had to drop them or invent a machine that never
-- existed. Both are lies about the record.
--
-- Relaxed, with the door still required: an event always belongs to a PROPERTY
-- even when it belongs to no machine.
-- ---------------------------------------------------------------------------
ALTER TABLE public.property_system_events ALTER COLUMN system_ref DROP NOT NULL;

COMMENT ON COLUMN public.property_system_events.system_ref IS
  'The equipment this happened to, when it happened to a specific piece. NULL = work on the property generally (the Real Estate maintenance log has general/lawn/pest categories that name no machine). rental_ref is always required.';

-- ---------------------------------------------------------------------------
-- 3. The same idempotency key on every table the rescue writes.
--
-- Keyed by (rental_ref, legacy_id) — the door plus the device-local id. Two
-- different doors may each carry a room the browser called 'rm-1751840000000';
-- the pair is what is unique, never the local id alone.
-- ---------------------------------------------------------------------------
ALTER TABLE public.property_system_events ADD COLUMN IF NOT EXISTS legacy_id text;
ALTER TABLE public.property_rooms         ADD COLUMN IF NOT EXISTS legacy_id text;
ALTER TABLE public.property_systems       ADD COLUMN IF NOT EXISTS legacy_id text;

CREATE UNIQUE INDEX IF NOT EXISTS property_system_events_legacy_idx
  ON public.property_system_events(rental_ref, legacy_id) WHERE legacy_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS property_rooms_legacy_idx
  ON public.property_rooms(rental_ref, legacy_id) WHERE legacy_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS property_systems_legacy_idx
  ON public.property_systems(rental_ref, legacy_id) WHERE legacy_id IS NOT NULL;

-- The overlays re-run so a viewer and the assistant see the amended tables
-- through the same read-only / scoped lens they already saw them through. No
-- new table is introduced here, so this is a re-assertion rather than a fix —
-- and it is the cheap half of the pair that caught 0156.
SELECT public.apply_viewer_readonly_overlay();
SELECT public.apply_assistant_scope_overlay();
