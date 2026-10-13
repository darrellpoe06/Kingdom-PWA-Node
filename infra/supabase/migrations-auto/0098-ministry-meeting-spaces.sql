-- =============================================================================
-- 0098 — Ministry meeting SPACES (main vs ministry)
-- =============================================================================
-- Declared by Darrell 2026-07-12: "The main meeting space should be for the admin
-- staff and potential monthly meetings with 50-person max." So meetings now carry
-- a `space`: the `main` room (admin staff / monthly, up to 50, exclusive on the
-- sovereign stack, admin-only to book) or a `ministry` working meeting (up to 25).
-- The caps are grounded in the real on-site stack (Synology NAS today; the 5x RTX
-- 3090 rig the infra project is building) — see SOVEREIGN-COMMS-AND-MEETINGS.md.
--
-- The per-space participant cap + exclusivity are enforced by the client load
-- rules (lib/ministry-meetings.js, unit-tested). THIS migration adds the column,
-- a hard 50-person ceiling, and the RLS that makes the MAIN room admin-only.
--
-- DEPENDS ON: 0097-ministry-meetings.sql. IDEMPOTENT.
-- =============================================================================

ALTER TABLE ministry_meetings
  ADD COLUMN IF NOT EXISTS space text NOT NULL DEFAULT 'ministry';

-- Constrain the enum + a hard ceiling (the main room's 50). Drop-then-add so the
-- migration is re-runnable and the constraint reflects the current rule.
ALTER TABLE ministry_meetings DROP CONSTRAINT IF EXISTS ministry_meetings_space_chk;
ALTER TABLE ministry_meetings
  ADD CONSTRAINT ministry_meetings_space_chk CHECK (space IN ('main','ministry'));
ALTER TABLE ministry_meetings DROP CONSTRAINT IF EXISTS ministry_meetings_cap_chk;
ALTER TABLE ministry_meetings
  ADD CONSTRAINT ministry_meetings_cap_chk CHECK (participant_cap >= 1 AND participant_cap <= 50);

-- RLS: the MAIN room is admin-staff only to book/keep; ministry meetings stay
-- open to any instance member (host/admin manage). Re-create the insert/update
-- policies with the space guard.
DROP POLICY IF EXISTS ministry_meetings_write  ON ministry_meetings;
DROP POLICY IF EXISTS ministry_meetings_update ON ministry_meetings;
CREATE POLICY ministry_meetings_write ON ministry_meetings FOR INSERT
  WITH CHECK (
    user_in_instance(instance_id)
    AND created_by = auth.uid()
    AND (space <> 'main' OR user_role_in_instance(instance_id) IN ('owner','admin'))
  );
CREATE POLICY ministry_meetings_update ON ministry_meetings FOR UPDATE
  USING (user_role_in_instance(instance_id) IN ('owner','admin') OR host_user_id = auth.uid())
  WITH CHECK (
    user_in_instance(instance_id)
    AND (space <> 'main' OR user_role_in_instance(instance_id) IN ('owner','admin'))
  );
