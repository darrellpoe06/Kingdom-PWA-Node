-- =============================================================================
-- 0149 — "Sunday and Wednesday Service" joins the cue sheet; music-link heal
-- =============================================================================
-- Darrell 2026-08-24, on seeing the live event-type list: "Should say Sunday
-- and Wednesday Service too" — then "separated": Sunday Service and Wednesday
-- Service are each their OWN type. The media team's most regular work IS the
-- regular services — Bro Reed's cue sheet exists first for them — so the
-- vocabulary carries both first-class ('sunday-service', 'wednesday-service').
--
-- Also heals the rename seam from the same day: 0146 originally shipped the
-- music column as spotify_link and was applied to both databases before the
-- same-session rename to music_link (any music link works, YouTube included).
-- Any value captured under the old name in that window is carried into
-- music_link, then the orphan column drops. Idempotent: the DO block only
-- acts while spotify_link still exists.
-- =============================================================================

-- Event types now: the two regular services + Bro Reed's congregation-proven
-- list from 0146. Supersedes 0146's CHECK (replay order keeps this one last).
-- Any row captured under the short-lived combined 'service' type moves to
-- 'sunday-service' BEFORE the CHECK lands, so replay can never wedge on it.
UPDATE venue_bookings SET event_type = 'sunday-service' WHERE event_type = 'service';
ALTER TABLE venue_bookings DROP CONSTRAINT IF EXISTS venue_bookings_event_type_check;
ALTER TABLE venue_bookings ADD CONSTRAINT venue_bookings_event_type_check
  CHECK (event_type IN ('sunday-service','wednesday-service','funeral','wedding','concert','conference','community'));

-- Carry any spotify_link value into music_link, then drop the orphan column.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'venue_bookings'
       AND column_name = 'spotify_link'
  ) THEN
    UPDATE venue_bookings
       SET music_link = COALESCE(music_link, spotify_link)
     WHERE spotify_link IS NOT NULL;
    ALTER TABLE venue_bookings DROP COLUMN spotify_link;
    RAISE NOTICE '0149: spotify_link values carried into music_link; orphan column dropped';
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
