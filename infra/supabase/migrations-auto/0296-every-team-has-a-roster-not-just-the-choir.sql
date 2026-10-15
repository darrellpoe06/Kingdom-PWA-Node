-- =============================================================================
-- 0296 — EVERY TEAM HAS A ROSTER, NOT JUST THE CHOIR (DR-1052)
-- =============================================================================
-- Darrell, 2026-10-15, from his phone on the Choir tab at The Love Corner:
-- "Media?!!!!!!!!!! Other members of the other teams who should have access..."
--
-- TRACED, and the trace is the whole argument. The church runs many teams.
-- `ministry_ops.ministry` has named them since 0023, in its own column comment:
--
--     ministry text NOT NULL DEFAULT 'general'  -- 'bus' | 'choir' | 'ushers'
--                                               -- | 'media' | 'general' | ...
--
-- But MEMBERSHIP exists for exactly one of them. Counted across every
-- migration and every lib on main, these are the team predicates that exist:
--
--     user_in_instance   115 uses      (the whole house, not a team)
--     user_in_choir       46 uses      (the choir)
--     user_in_security     4 uses      (the security team)
--     user_in_group        3 uses      (small groups)
--
-- There is no user_in_media, no user_in_bus, no user_in_ushers, and no table
-- a member of those teams could be a row in. So a Media volunteer cannot be
-- ON a team anywhere in this database, and therefore cannot be granted
-- anything scoped to their team. Not a policy that forgot them — no seat to
-- put them in.
--
-- AND THE ONE DOOR THAT DID EXIST IS THE WRONG SHAPE. 0011 put media INSIDE
-- the choir, as a role on the choir's own roster:
--
--     choir_role text NOT NULL DEFAULT 'member'
--       CHECK (choir_role IN ('director','assistant','member','musician',
--                             'sound','media','tech'))
--
-- with the reason recorded honestly at the time (Darrell 2026-06-14: the
-- Technology Director, the soundboard engineer and the media team sync with
-- the choir, so they need the choir surface). That was right for the choir's
-- media support. It is wrong as the ONLY door: it means a Media person who
-- does not serve the choir gets in by being added to a roster they are not
-- on, and the media team's own work has nowhere to live. A team is not a role
-- inside another team.
--
-- WHAT THIS DOES: the narrowest cure, the same one 0294 used. It adds the
-- primitive the choir has had since 0011 and gives it to every team by name:
-- a roster row, and a predicate that reads it.
--
-- WHAT THIS GRANTS TODAY: NOTHING. The table ships empty, and the new
-- predicate is referenced by no policy in this migration or anywhere else on
-- main. An empty roster makes no one a member of anything. Every existing
-- choir read, write and policy is untouched — user_in_choir still answers
-- exactly as it did, off choir_members, and this migration does not alter,
-- drop or re-create a single choir object. The surfaces that will read this
-- come after, behind their own gates, so the access change and the primitive
-- are never the same merge.
--
-- WHY A GENERIC TABLE RATHER THAN media_members, bus_members, ushers_members:
-- the choir needed 16 tables because it has 16 kinds of content. Membership
-- is one shape for every team, and minting a table per team is how the house
-- ended up with one team that works and the rest with nothing. `ministry` is
-- the same free text `ministry_ops` already uses, so the two line up without
-- a new vocabulary to keep in sync. No CHECK list of team names: the church
-- names its own teams, and a CHECK here would mean a migration every time
-- they start one.
--
-- SAME CONTRACT AS user_in_choir (0011), deliberately, so a reader who knows
-- one knows the other: SQL, STABLE, SECURITY DEFINER (bypasses RLS to avoid
-- recursion), search_path pinned, owner/admin OR a roster row.
--
-- TEAM MEMBERSHIP DOES NOT LEAK ACROSS TEAMS. The predicate takes the
-- ministry and matches it; a media row answers true for 'media' and false for
-- 'bus'. The smoke asserts that wall in both directions, because a generic
-- table whose predicate ignored its own ministry column would quietly make
-- every team one team, which is a worse failure than the gap it closes.
--
-- DEPENDS ON: schema-v2.1-infra.sql (instances, instance_members,
--             user_role_in_instance).
-- IDEMPOTENT: CREATE ... IF NOT EXISTS, CREATE OR REPLACE, DROP-then-CREATE
--             policies. Safe to re-run. Nothing is deleted.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. THE ROSTER — one row per person per team, mirroring choir_members.
--    user_id NULL is a roster entry for someone with no app account yet, the
--    same way the choir carries a singer before they have signed in (0011),
--    so a director can build the team before the people arrive.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ministry_members (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id  uuid NOT NULL REFERENCES public.instances(id) ON DELETE CASCADE,
  -- The same free-text vocabulary ministry_ops uses: 'bus' | 'choir' |
  -- 'ushers' | 'media' | 'general' | whatever the church starts next.
  ministry     text NOT NULL CHECK (char_length(ministry) BETWEEN 1 AND 40),
  user_id      uuid REFERENCES auth.users(id),   -- NULL = on the roster, no app account yet
  display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 120),
  -- What they do ON this team. Free text for the same reason `ministry` is:
  -- the media team's roles are not the bus ministry's.
  team_role    text NOT NULL DEFAULT 'member' CHECK (char_length(team_role) BETWEEN 1 AND 60),
  added_by     uuid REFERENCES auth.users(id),
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ministry_members_instance_idx ON public.ministry_members (instance_id, ministry);
CREATE INDEX IF NOT EXISTS ministry_members_user_idx     ON public.ministry_members (instance_id, ministry, user_id);

-- ---------------------------------------------------------------------------
-- 2. THE PREDICATE — user_in_choir's contract, with the team named.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.user_in_ministry(instance_uuid uuid, ministry_in text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT user_role_in_instance(instance_uuid) IN ('owner','admin')
      OR EXISTS (
           SELECT 1 FROM ministry_members
            WHERE instance_id = instance_uuid
              AND ministry    = ministry_in
              AND user_id     = auth.uid()
         )
$$;

-- The client calls this one by name (supabase.rpc), the way it already calls
-- user_in_choir. PostgreSQL grants function EXECUTE to PUBLIC by default, so
-- user_in_choir has worked since 0011 with no grant of its own — but
-- user_role_in_instance is granted explicitly in schema-v2.1-infra, and being
-- explicit about a predicate the browser invokes costs nothing and survives
-- anyone later revoking PUBLIC.
GRANT EXECUTE ON FUNCTION public.user_in_ministry(uuid, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. RLS — choir_members' policies, exactly: the team reads its own roster,
--    owner/admin writes it. A member of one team cannot read another team's
--    roster, which is the read side of the same wall the predicate draws.
-- ---------------------------------------------------------------------------
ALTER TABLE public.ministry_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ministry_members_read   ON public.ministry_members;
DROP POLICY IF EXISTS ministry_members_write  ON public.ministry_members;
DROP POLICY IF EXISTS ministry_members_update ON public.ministry_members;
DROP POLICY IF EXISTS ministry_members_delete ON public.ministry_members;
CREATE POLICY ministry_members_read   ON public.ministry_members FOR SELECT
  USING (user_in_ministry(instance_id, ministry));
CREATE POLICY ministry_members_write  ON public.ministry_members FOR INSERT
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY ministry_members_update ON public.ministry_members FOR UPDATE
  USING (user_role_in_instance(instance_id) IN ('owner','admin'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY ministry_members_delete ON public.ministry_members FOR DELETE
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));
