-- =============================================================================
-- 0043 — Worship-team finalizer circle + master-program change log
-- =============================================================================
-- Darrell 2026-06-24: the MASTER Sunday worship program is finalized/edited
-- COLLABORATIVELY by a trusted worship-team set — Bishop Gwin, Christina,
-- Christian (the choir KEYBOARDIST — the worship-team SME, NOT Darrell's young
-- son), and Darrell. All four have full edit/finalize rights on the master while
-- they iterate the order together ("until we get it down"). Everyone else keeps
-- their per-sector derived VIEW (read + edit-own-part as permitted).
--
-- Modeled on the unified roles/membership layer, least-privilege:
--   - A "worship-team finalizer" SCOPE = owner/admin OR a choir_members row
--     flagged is_finalizer. This is ORTHOGONAL to choir_role (musical part): the
--     keyboardist edits the whole master without becoming an instance admin
--     (which would over-grant across the church instance). Owner/admin (Darrell,
--     Christina, BG) already pass; the keyboardist is added via the flag.
--   - Darrell, Christina, BG are already instance owner/admin (0012) -> covered
--     today. Christian-the-keyboardist gets is_finalizer = true once he is linked
--     onto the roster (member onboarding is the standing Choir follow-up); the
--     steward sets it from the app. No name/email is hardcoded here, so there is
--     zero chance of binding the wrong "Christian".
--   - WHO is a finalizer is still an owner/admin decision (the choir_members
--     UPDATE policy from 0011 is owner/admin) — a finalizer can edit the master
--     but cannot promote others. Governance stays with the stewards.
--
-- This migration also adds the COLLABORATIVE-EDIT institutional memory: an
-- append-only change log so co-editors see who changed what, when. Last-write-
-- wins on the rows themselves (Supabase realtime already streams every edit to
-- all devices); the log is the durable "who did what" trail. Layers on 0042.

-- 1. The finalizer flag on the roster (orthogonal to choir_role).
ALTER TABLE choir_members ADD COLUMN IF NOT EXISTS is_finalizer boolean NOT NULL DEFAULT false;

-- 2. The scope predicate. SECURITY DEFINER mirrors user_in_choir (0011): it reads
--    choir_members under the function owner to avoid RLS recursion in policies.
CREATE OR REPLACE FUNCTION public.user_is_worship_finalizer(instance_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    user_role_in_instance(instance_uuid) IN ('owner','admin')
    OR EXISTS (
      SELECT 1 FROM choir_members
      WHERE instance_id = instance_uuid
        AND user_id = auth.uid()
        AND is_finalizer = true
    );
$$;

-- 3. Re-scope master-program WRITE from owner/admin (0042) to the finalizer
--    circle. READ stays the whole team (user_in_choir) — unchanged.
DROP POLICY IF EXISTS church_service_programs_write  ON church_service_programs;
DROP POLICY IF EXISTS church_service_programs_update ON church_service_programs;
DROP POLICY IF EXISTS church_service_programs_delete ON church_service_programs;
CREATE POLICY church_service_programs_write  ON church_service_programs FOR INSERT
  WITH CHECK (user_is_worship_finalizer(instance_id));
CREATE POLICY church_service_programs_update ON church_service_programs FOR UPDATE
  USING (user_is_worship_finalizer(instance_id))
  WITH CHECK (user_is_worship_finalizer(instance_id));
CREATE POLICY church_service_programs_delete ON church_service_programs FOR DELETE
  USING (user_is_worship_finalizer(instance_id));

DROP POLICY IF EXISTS church_service_segments_write  ON church_service_segments;
DROP POLICY IF EXISTS church_service_segments_update ON church_service_segments;
DROP POLICY IF EXISTS church_service_segments_delete ON church_service_segments;
CREATE POLICY church_service_segments_write  ON church_service_segments FOR INSERT
  WITH CHECK (user_is_worship_finalizer(instance_id));
CREATE POLICY church_service_segments_update ON church_service_segments FOR UPDATE
  USING (user_is_worship_finalizer(instance_id))
  WITH CHECK (user_is_worship_finalizer(instance_id));
CREATE POLICY church_service_segments_delete ON church_service_segments FOR DELETE
  USING (user_is_worship_finalizer(instance_id));

-- 4. Collaborative-edit institutional memory: append-only "who changed what".
CREATE TABLE IF NOT EXISTS church_service_program_changes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  program_id  uuid REFERENCES church_service_programs(id) ON DELETE CASCADE,
  segment_id  uuid,                       -- soft ref (segment may be deleted); kept for the trail
  actor       uuid REFERENCES auth.users(id),
  actor_name  text,                       -- denormalized display name for a readable trail
  action      text NOT NULL,              -- 'create-program' | 'edit-program' | 'add-segment' | 'edit-segment' | 'delete-segment' | 'seed-order'
  summary     text,                       -- human line, e.g. "edited segment 'Sermon'"
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS church_service_program_changes_idx
  ON church_service_program_changes(instance_id, program_id, created_at DESC);

ALTER TABLE church_service_program_changes ENABLE ROW LEVEL SECURITY;
-- Read = whole team (the trail is shared institutional memory). Insert = a
-- finalizer (only the master's editors write the log). Append-only: no UPDATE;
-- DELETE owner/admin only (housekeeping).
DROP POLICY IF EXISTS church_service_program_changes_read   ON church_service_program_changes;
DROP POLICY IF EXISTS church_service_program_changes_write  ON church_service_program_changes;
DROP POLICY IF EXISTS church_service_program_changes_delete ON church_service_program_changes;
CREATE POLICY church_service_program_changes_read  ON church_service_program_changes FOR SELECT
  USING (user_in_choir(instance_id));
CREATE POLICY church_service_program_changes_write ON church_service_program_changes FOR INSERT
  WITH CHECK (user_is_worship_finalizer(instance_id) AND actor = auth.uid());
CREATE POLICY church_service_program_changes_delete ON church_service_program_changes FOR DELETE
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- Realtime so the change trail streams to every co-editor's device live.
DO $realtime$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='church_service_program_changes')
  THEN ALTER PUBLICATION supabase_realtime ADD TABLE church_service_program_changes; END IF;
END $realtime$;

NOTIFY pgrst, 'reload schema';
