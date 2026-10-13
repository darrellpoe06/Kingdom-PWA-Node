-- =============================================================================
-- 0160 — a door says what it is: a whole unit, a room, or a bed
-- =============================================================================
-- Darrell, 2026-08-28, after building it by hand:
--   "all rooms should be able to do what I had to do... the system needs to
--    support 1 room 2 beds... or 1 room 1 bed... or whole unit... etc..."
--
-- WHAT HE HAD TO DO. 805 North Prospect Apt 4 shows as "2 DOORS" holding
-- "Room 1- Bed B" and "Room 1 - Bed A" — two rentable BEDS in ONE room in ONE
-- unit. He got there by pressing "Split into doors" and typing those names one
-- character at a time, because the split only knew how to make "Apt 1..N".
--
-- MEASURED against the live catalog before writing a line of this:
--   * rentals HAS `unit` (text) and `display_name` (text).
--   * rentals has NO building, no level, no room.
--   * rentals-sync.js writes NEITHER `unit` NOR the local `building` — its
--     toRow() maps twenty columns and neither of those is among them.
--
-- So the whole structure he built — which door is a bed, which room it sits in,
-- which building groups them — lives in ONE browser on ONE phone. Only the
-- NAMES reached the server, because `display_name` happens to be synced. Open
-- the app on a laptop and Apt 4's two beds are two unrelated doors with odd
-- names. That is the same class of loss this session has been closing all day,
-- and it is why this is a migration and not only a UI change.
--
-- THE LEVELS NEST, and every one of them is rentable:
--
--     building        →  unit    →  room     →  bed
--     805 N Prospect     Apt 4      Room 1      Bed A / Bed B
--
-- The same building runs several at once — 805 lets Apt 2 whole and Apt 4 by
-- the bed — so this is a property of each DOOR, never a mode set on the
-- building. Nothing here forces a shape on the twelve doors that already
-- exist: the column is nullable and the app infers a level from the label when
-- it is unset, so his two hand-made beds read as beds from the first load.
--
-- ADDITIVE ONLY. No RLS change, no policy change, no data rewritten.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. WHAT this door rents.
--
-- Nullable on purpose. A NULL means "nobody has said yet", which is the honest
-- state of all twelve existing rows — and is NOT the same as asserting they are
-- whole units. The app infers from the label while it is unset (DR-0076 §8:
-- unknown never reads as a value), and writes the column the moment a human
-- actually chooses.
-- ---------------------------------------------------------------------------
ALTER TABLE public.rentals ADD COLUMN IF NOT EXISTS rentable_level text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rentals_rentable_level_check') THEN
    ALTER TABLE public.rentals ADD CONSTRAINT rentals_rentable_level_check
      CHECK (rentable_level IS NULL OR rentable_level IN ('unit', 'room', 'bed'));
  END IF;
END $$;

COMMENT ON COLUMN public.rentals.rentable_level IS
  'What this door rents: unit (the whole place), room, or bed. NULL = not yet stated; the app infers from the label rather than assuming "unit". A building may hold all three at once — this is per door, never a mode on the building.';

-- ---------------------------------------------------------------------------
-- 2. WHICH ROOM a bed is in.
--
-- Two beds are only housemates if something says they share a room. The label
-- carries it for a reader ("Room 1 - Bed A") but a label is prose: it cannot be
-- grouped on, counted, or trusted after somebody renames a door. The column can.
-- ---------------------------------------------------------------------------
ALTER TABLE public.rentals ADD COLUMN IF NOT EXISTS room_label text;

COMMENT ON COLUMN public.rentals.room_label IS
  'The room this door is in, for a bed-level door. Two beds sharing a room share this value. NULL for a room or a whole unit.';

-- ---------------------------------------------------------------------------
-- 3. WHICH BUILDING groups these doors.
--
-- The app has had `building` locally since the split shipped and has never
-- synced it, so a multi-unit building looks like unrelated doors on any second
-- device. Named building_label rather than building to keep it unmistakably the
-- display grouping and not a foreign key to a building table that does not
-- exist (and should not be invented here — a real building tier is its own
-- decision, still open).
-- ---------------------------------------------------------------------------
ALTER TABLE public.rentals ADD COLUMN IF NOT EXISTS building_label text;

COMMENT ON COLUMN public.rentals.building_label IS
  'The building that groups this door with its siblings (the app''s local `building`, which never synced until now). A display grouping, not a foreign key.';

-- Reading a building's doors, and a room's beds, are the two queries the boards
-- actually run. Partial so the index only carries rows that have the value.
CREATE INDEX IF NOT EXISTS rentals_building_idx
  ON public.rentals(instance_id, building_label) WHERE building_label IS NOT NULL;
CREATE INDEX IF NOT EXISTS rentals_room_idx
  ON public.rentals(instance_id, room_label) WHERE room_label IS NOT NULL;

-- The overlays re-run so a viewer and the assistant see the amended table
-- through the same lens they already saw it through. No new table here, so this
-- is a re-assertion rather than a fix — and it is the cheap half of the pair
-- that caught 0156.
SELECT public.apply_viewer_readonly_overlay();
SELECT public.apply_assistant_scope_overlay();
