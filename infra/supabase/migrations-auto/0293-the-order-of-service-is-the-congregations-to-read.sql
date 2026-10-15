-- =============================================================================
-- 0293 — The Order of Service is the congregation's to READ, not the choir's
-- =============================================================================
-- Darrell 2026-10-15: "Christina does not see the order of service!!!!!!!!!
-- Either!!!!!!!!!"
--
-- MEASURED, AND IT IS NOT A REGRESSION. Reading the order of service has
-- required CHOIR MEMBERSHIP since 0042 and 0045:
--
--   church_service_programs_read        USING (user_in_choir(instance_id))
--   church_service_segments_read        USING (user_in_choir(instance_id))
--   church_service_segment_actuals_read USING (user_in_choir(instance_id))
--
-- and user_in_choir() is owner OR admin OR a row in choir_members. So every
-- plain member of the church space — Christina among them — asked the database
-- for the order and was correctly told nothing. 0292 (DR-1029) did not cause
-- this and did not touch a policy; what it DID do is make the gap absurd, by
-- teaching each line to name the auxiliary carrying it — the Choir, the USHERS,
-- the DEACONS — while an usher or a deacon could not open the page to read it.
--
-- THE ORDER OF SERVICE IS A WHOLE-HOUSE ARTIFACT. It is what the congregation
-- is walking into on Sunday and Wednesday; it names who serves and when. There
-- is nothing in it that a member of the house should have to be rostered on the
-- choir to see. DR-1029's own purpose line says it plainly: "so any church can
-- total their time and add key personnel to each task."
--
-- SO READING WIDENS TO MEMBERSHIP, AND NOTHING ELSE MOVES. The predicate is
-- user_role_in_instance(instance_id) IS NOT NULL — that function reads
-- instance_members and returns NULL for anyone who is not in the space, so this
-- is "a member of THIS church space", never "anyone signed in", and the tenancy
-- wall is exactly where it was (DR-0060).
--
-- WRITING IS UNTOUCHED, deliberately. INSERT / UPDATE / DELETE on the programs
-- and segments stay owner/admin, and the actuals stay with the worship
-- finalizer. A member may now READ the order. Only the people who always could
-- may change it. This migration contains no write policy for that reason.
--
-- Pairs with the UI half in app/src/lib/service-program.js (deriveAccess): RLS
-- alone would have left the tab hidden, and the UI alone would have rendered a
-- page that returned zero rows. Both halves are in this change (DR-1037).

-- --- church_service_programs: the order itself ------------------------------
DROP POLICY IF EXISTS church_service_programs_read ON church_service_programs;
CREATE POLICY church_service_programs_read ON church_service_programs FOR SELECT
  USING (user_role_in_instance(instance_id) IS NOT NULL);

-- --- church_service_segments: every line of it ------------------------------
DROP POLICY IF EXISTS church_service_segments_read ON church_service_segments;
CREATE POLICY church_service_segments_read ON church_service_segments FOR SELECT
  USING (user_role_in_instance(instance_id) IS NOT NULL);

-- --- church_service_segment_actuals: what actually took place ---------------
-- The half that shipped yesterday. Without this the "Actual times" and "Track
-- record" tabs stay blank for a member even once the order above is readable,
-- which is the trap in fixing only the first two tables.
DROP POLICY IF EXISTS church_service_segment_actuals_read ON church_service_segment_actuals;
CREATE POLICY church_service_segment_actuals_read ON church_service_segment_actuals FOR SELECT
  USING (user_role_in_instance(instance_id) IS NOT NULL);
