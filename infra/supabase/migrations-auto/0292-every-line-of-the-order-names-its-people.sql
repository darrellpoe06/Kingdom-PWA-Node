-- =============================================================================
-- 0292 — Order of Service: every line names its key personnel and its auxiliary
-- =============================================================================
-- Darrell 2026-10-15, handing over his church's order (Prayer · Announcements ·
-- Choir, 1 song · Special events · Offering / Givers' Creed · Choir, 2 songs ·
-- Speaker · Benediction): "add the ability to add time to each section so any
-- church can total their time and add key personnel to each task on the order
-- of services list... or add a auxiliary."
--
-- The time was already here: church_service_segments.planned_minutes (0042) is
-- totaled by the surface. What was missing is the PEOPLE: one owner_name text
-- box held one person, and a line carried by a whole auxiliary (the Choir, the
-- Ushers, the Deacons) had nowhere to say so. Two columns, additive:
--   personnel  jsonb  -- ["Bishop Gwin", "Sis. Jones"]: the key people on the line
--   auxiliary  text   -- "Choir" / "Ushers" / "Deacons": the group carrying it
-- owner_name stays (older views and the email import still write it); a line
-- that had one owner carries them as its first key person. RLS, realtime and
-- the change trail are unchanged (DR-1024).

ALTER TABLE church_service_segments
  ADD COLUMN IF NOT EXISTS personnel jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS auxiliary text;

-- Backfill once: a line with an owner and no personnel yet names that owner.
-- Idempotent: the second run finds personnel already filled and touches nothing.
UPDATE church_service_segments
   SET personnel = jsonb_build_array(btrim(owner_name))
 WHERE personnel = '[]'::jsonb
   AND owner_name IS NOT NULL
   AND btrim(owner_name) <> '';

NOTIFY pgrst, 'reload schema';
