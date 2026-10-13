-- =============================================================================
-- 0146 — the media cue sheet rides the booking (Bro Clifton Reed's process)
-- =============================================================================
-- Darrell 2026-08-24: "Merge the process and procedures to make sure our media
-- team member Bro Clifton Reed form is added or accounted for based on his
-- experience working with the congregation." Bro Reed's congregation-tested
-- Event Media Intake ("cue sheet") form collected, per event: the media the
-- team should expect (pictures/photos, videos, slides/PowerPoints, documents),
-- a Spotify link for music, and free notes — alongside event type, contact,
-- date, venue. The venue_bookings request already carries the event + contact
-- half; this migration merges in the MEDIA half so one request tells both the
-- office AND the Media Team what is coming, and nothing is collected twice.
--
-- Two merges, one table:
--   1. Media cue-sheet columns — what the requester says the media team should
--      expect. These are the requester's OWN event info, safe for the public
--      form; the 0030 anon-shape trigger still forces status/price/instance,
--      untouched here.
--   2. Event types widened with 'concert' and 'conference' — the two types Bro
--      Reed's form carries from real congregation use that the venue catalog
--      lacked ('other' on his form maps to the existing 'community').
--
-- CONSTRAINT, stated honestly (DR-0307): the app cannot yet accept arbitrary
-- file uploads, so the cue sheet captures WHAT to expect + the music link; the
-- actual file bytes travel the media team's existing channel until the
-- storage-blobs work lands. The cue sheet is the coordination record, not the
-- file store.
--
-- DEPENDS ON: 0030 (venue_bookings). IDEMPOTENT: ADD COLUMN IF NOT EXISTS;
-- DROP CONSTRAINT IF EXISTS + re-ADD for the widened CHECK. Touches NO policy,
-- NO trigger, NO grant — the 0030 RLS shape (anon INSERT, owner/admin manage)
-- stands unchanged.
-- =============================================================================

-- { photos: true, videos: true, slides: true, documents: true } — only the
-- categories the requester expects to send; absent key = not expected.
ALTER TABLE venue_bookings ADD COLUMN IF NOT EXISTS media_expected jsonb NOT NULL DEFAULT '{}'::jsonb;
-- Music for the event. Bro Reed's form asked for a Spotify link; Darrell
-- 2026-08-24: "links from YouTube for music are most common however we have
-- Spotify as well... other options" — so the column takes ANY music link.
ALTER TABLE venue_bookings ADD COLUMN IF NOT EXISTS music_link text;
-- The cue-sheet notes for the media team specifically (distinct from the
-- general booking notes the office reads).
ALTER TABLE venue_bookings ADD COLUMN IF NOT EXISTS media_notes text;

-- Widen the event-type vocabulary with Bro Reed's two congregation-proven
-- types. The old CHECK must drop before the wider one lands.
ALTER TABLE venue_bookings DROP CONSTRAINT IF EXISTS venue_bookings_event_type_check;
ALTER TABLE venue_bookings ADD CONSTRAINT venue_bookings_event_type_check
  CHECK (event_type IN ('funeral','wedding','concert','conference','community'));

NOTIFY pgrst, 'reload schema';
