-- =============================================================================
-- 0109 — Church dev/ops team: a roster of helpers with a VIEW-ONLY tester role
-- =============================================================================
-- Declared by Darrell 2026-07-21: "add a longtime parishioner to my dev/ops team
-- as a tester only until I understand how someone can help out … for the Love
-- Corner App," then "a dedicated church 'dev/ops team' surface with its own
-- cross-app tester role and separate RLS." Built in the app (DR-0065) on real,
-- instance-scoped, cross-device-synced data (DR-0061).
--
-- THE MODEL. A church already has instance roles (owner/admin/member/viewer via
-- invite_to_church, 0014) and per-ministry rosters (choir_members, 0011). This
-- adds the ministry roster for the people who help BUILD/RUN/TEST the app itself:
--   · team_role labels WHAT they do — lead / dev / ops / tester;
--   · a TESTER is view-only by covenant — the app grants them the instance
--     'viewer' role (view, never edit) when they're added, so "tester only" is
--     enforced by RLS everywhere, not just by a label (the app maps
--     tester→viewer, dev/ops→member, lead→admin via invite_to_church).
-- This table is the TEAM record + the audit trail (added_by); the actual app
-- access is the instance role the invite grants. Keeping them separate means the
-- team page can show "Doug — tester" while RLS independently guarantees Doug can
-- only read.
--
-- ACCESS: any team member (or owner/admin) SEES the team; only owner/admin MANAGE
-- it (add/remove/change a role) — mirrors choir_members exactly (user_in_choir →
-- user_on_church_team). No new privilege is mintable from this table: adding a row
-- does NOT grant app access by itself; the instance-role grant is the separate,
-- existing invite path, so a stray team row can never widen what someone can read.
--
-- DEPENDS ON: schema-v2.1-infra.sql (instances, instance_members,
--             user_in_instance, user_role_in_instance).
-- IDEMPOTENT: CREATE ... IF NOT EXISTS, CREATE OR REPLACE, DROP-then-CREATE
--             policies, guarded publication add. Safe to re-run.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. ROSTER — church_team_members
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS church_team_members (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id  uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  user_id      uuid REFERENCES auth.users(id),   -- NULL = added by name/email before their first sign-in
  display_name text NOT NULL,
  email        text,                             -- the invite email (for matching on sign-in / re-invite)
  -- WHAT the helper does. 'tester' is the view-only default the app pairs with the
  -- instance 'viewer' role; lead/dev/ops are trusted builders. Non-destructive:
  -- this label never itself grants access — the instance role (RLS) does.
  team_role    text NOT NULL DEFAULT 'tester' CHECK (team_role IN ('lead','dev','ops','tester')),
  notes        text,
  added_by     uuid REFERENCES auth.users(id),
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS church_team_members_instance_idx ON church_team_members(instance_id);
CREATE INDEX IF NOT EXISTS church_team_members_user_idx     ON church_team_members(instance_id, user_id);

-- ---------------------------------------------------------------------------
-- 2. ACCESS HELPERS — SECURITY DEFINER (bypass RLS to avoid recursion), mirroring
--    user_in_choir / user_role_in_instance.
-- ---------------------------------------------------------------------------
-- On the team = an owner/admin of the instance OR a row in church_team_members.
CREATE OR REPLACE FUNCTION public.user_on_church_team(instance_uuid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT user_role_in_instance(instance_uuid) IN ('owner','admin')
      OR EXISTS (
           SELECT 1 FROM church_team_members
            WHERE instance_id = instance_uuid AND user_id = auth.uid()
         )
$$;

-- The caller's OWN team role for this instance (NULL if they hold no team row).
-- The app reads this to badge "you're on the team as a tester" and to gate the
-- team UI; it is NOT the access authority (the instance role + RLS is).
CREATE OR REPLACE FUNCTION public.user_team_role_in_instance(instance_uuid uuid)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT team_role FROM church_team_members
   WHERE instance_id = instance_uuid AND user_id = auth.uid()
   ORDER BY created_at ASC
   LIMIT 1
$$;

-- ---------------------------------------------------------------------------
-- 3. RLS — read = anyone on the team; write/manage = owner/admin only.
--    A team member can ALSO always read their own row (covered by the team read).
-- ---------------------------------------------------------------------------
ALTER TABLE church_team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS church_team_members_read   ON church_team_members;
DROP POLICY IF EXISTS church_team_members_write  ON church_team_members;
DROP POLICY IF EXISTS church_team_members_update ON church_team_members;
DROP POLICY IF EXISTS church_team_members_delete ON church_team_members;
CREATE POLICY church_team_members_read   ON church_team_members FOR SELECT
  USING (user_on_church_team(instance_id));
CREATE POLICY church_team_members_write  ON church_team_members FOR INSERT
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY church_team_members_update ON church_team_members FOR UPDATE
  USING (user_role_in_instance(instance_id) IN ('owner','admin'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY church_team_members_delete ON church_team_members FOR DELETE
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- ---------------------------------------------------------------------------
-- 3b. GRANTS — `authenticated` must hold table DML or every call 403s (42501)
--     BEFORE RLS ever runs (grant-guard). The RLS above filters every row to the
--     caller's instance, so granting table access is leak-safe.
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON public.church_team_members TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_on_church_team(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_team_role_in_instance(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. REALTIME — stream the roster so every device updates live.
-- ---------------------------------------------------------------------------
DO $realtime$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'church_team_members'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE church_team_members;
  END IF;
END $realtime$;

NOTIFY pgrst, 'reload schema';
