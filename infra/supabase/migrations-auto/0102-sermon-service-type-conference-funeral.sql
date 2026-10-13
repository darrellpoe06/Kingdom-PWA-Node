-- =============================================================================
-- 0102 — allow conference/funeral (+ the full service kind set) on choir_sermons
--        service_type (2026-07-14)
-- =============================================================================
-- THE ARCHIVE BUG (Darrell 2026-07-14): "The latest livestreams are going into
-- the Church Tab however they are not archiving in the Word section yet, why not
-- and fix it." Part of the why: the off-cycle streams. classifyServiceType()
-- (app/src/lib/service-day.js) now labels a stream conference / funeral for the
-- Tue-Thu conference nights and the homegoing services that are neither Sunday
-- nor Wednesday. But choir_sermons.service_type still carried the original 0011
-- CHECK — service_type IN ('sunday','wednesday') — so ANY conference/funeral row
-- was rejected by the database. Because the in-app importer inserts the whole
-- batch at once (choir-sync.js importSermonsFromChannel), a single conference or
-- funeral video failed the ENTIRE import, and nothing archived. This expands the
-- allowed set so those streams land under the right label.
--
-- The set matches what the app + the harvest pipeline actually produce:
--   sunday / wednesday  — the weekly services (original)
--   conference / funeral — the off-cycle streams (2026-07-14)
--   rehearsal / both / special — already used by the choir + service-program
--     surfaces (0011 choir_schedule, 0042 service_program), kept in sync here so
--     a repreach/lineage or program-derived row can share this table cleanly.
-- Idempotent (drop + re-add the named CHECK), same pattern as 0020.

ALTER TABLE choir_sermons DROP CONSTRAINT IF EXISTS choir_sermons_service_type_check;
ALTER TABLE choir_sermons ADD CONSTRAINT choir_sermons_service_type_check
  CHECK (service_type IN ('sunday','wednesday','conference','funeral','rehearsal','both','special'));

NOTIFY pgrst, 'reload schema';
