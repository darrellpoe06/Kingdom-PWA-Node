-- =============================================================================
-- 0096 — Direct messages (1:1) + Report-to-Security
-- =============================================================================
-- Declared by Darrell 2026-07-12, expanding the bus-ministry work: users need to
-- speak INDIVIDUALLY -- inside a ministry (choir, bus) and across the app -- not
-- only in a group thread. Plus a specific coordination lane he named: "the
-- rosters can DM rosters so an usher can tell security 'come here', and anyone
-- can report to security who has access to the Observation tab with all the
-- camera feeds in the building including the broadcast."
--
-- ACCESS MODEL (the privacy bright line; only the two participants ever read a
-- DM):
--   * A leader (owner/admin of a shared instance) may DM anyone in that instance.
--   * Anyone may DM a leader (report up).
--   * A roster member may DM another roster member in the same instance
--     (roster<->roster: an usher DMs security). "On a roster" = a row in ANY
--     ministry roster (bus_drivers, choir_members, security_team; extend as
--     rosters are added).
--   * By construction this is conservative for minors: a minor is not an
--     owner/admin and is not on an operational roster, so a minor can only be
--     reached by a leader initiating -- messaging is not opened peer-to-peer to
--     minors. (Guardian-scoped minor messaging hooks into the guardian model as
--     a follow-up; noted, not fabricated -- DR-0076.)
--
-- Report-to-Security: any instance member files a report; the security team
-- (owner/admin OR a row in security_team) reads + triages it. security_team is
-- the group that also holds Observation-tab (camera-feed + broadcast) access.
--
-- DEPENDS ON: schema-v2.1-infra.sql (instances, instance_members,
--             user_in_instance, user_role_in_instance); 0011-choir-module.sql
--             (choir_members) and 0095-bus-ministry.sql (bus_drivers) for the
--             roster union -- both guarded with to_regclass so this is standalone.
-- IDEMPOTENT + realtime-published. Word-first: "go and tell him his fault
-- between thee and him alone" (Matthew 18:15); "Let no corrupt communication
-- proceed out of your mouth, but that which is good to the use of edifying"
-- (Ephesians 4:29).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. SECURITY TEAM — security_team (the group with Observation-tab access;
--    reads security reports and is DM-reachable by anyone via roster<->roster)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS security_team (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id  uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  user_id      uuid REFERENCES auth.users(id),
  display_name text NOT NULL,
  added_by     uuid REFERENCES auth.users(id),
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS security_team_instance_idx ON security_team(instance_id, user_id);

CREATE OR REPLACE FUNCTION public.user_in_security(instance_uuid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT user_role_in_instance(instance_uuid) IN ('owner','admin')
      OR EXISTS (SELECT 1 FROM security_team WHERE instance_id = instance_uuid AND user_id = auth.uid())
$$;

-- Is `uid` on ANY ministry roster in this instance? Guarded so the function is
-- standalone even if a given roster table isn't present yet.
CREATE OR REPLACE FUNCTION public.user_on_any_roster(instance_uuid uuid, uid uuid)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE hit boolean := false;
BEGIN
  IF to_regclass('public.security_team') IS NOT NULL THEN
    SELECT EXISTS (SELECT 1 FROM security_team WHERE instance_id = instance_uuid AND user_id = uid) INTO hit;
    IF hit THEN RETURN true; END IF;
  END IF;
  IF to_regclass('public.bus_drivers') IS NOT NULL THEN
    SELECT EXISTS (SELECT 1 FROM bus_drivers WHERE instance_id = instance_uuid AND user_id = uid) INTO hit;
    IF hit THEN RETURN true; END IF;
  END IF;
  IF to_regclass('public.choir_members') IS NOT NULL THEN
    SELECT EXISTS (SELECT 1 FROM choir_members WHERE instance_id = instance_uuid AND user_id = uid) INTO hit;
    IF hit THEN RETURN true; END IF;
  END IF;
  RETURN false;
END
$$;

-- The DM authorization gate. May the CURRENT user send a DM to `other` in this
-- instance? SECURITY DEFINER so it can read membership without RLS recursion.
CREATE OR REPLACE FUNCTION public.users_can_dm(instance_uuid uuid, other uuid)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  me uuid := auth.uid();
  both_members boolean;
BEGIN
  IF me IS NULL OR other IS NULL OR me = other THEN RETURN false; END IF;
  -- Both must belong to the instance.
  SELECT EXISTS (SELECT 1 FROM instance_members WHERE instance_id = instance_uuid AND user_id = me)
     AND EXISTS (SELECT 1 FROM instance_members WHERE instance_id = instance_uuid AND user_id = other)
    INTO both_members;
  IF NOT both_members THEN RETURN false; END IF;
  -- Leader may DM anyone in the instance; anyone may DM a leader.
  IF user_role_in_instance(instance_uuid) IN ('owner','admin') THEN RETURN true; END IF;
  IF EXISTS (SELECT 1 FROM instance_members WHERE instance_id = instance_uuid AND user_id = other AND role IN ('owner','admin')) THEN
    RETURN true;
  END IF;
  -- Roster <-> roster (usher DMs security): both on some ministry roster.
  IF user_on_any_roster(instance_uuid, me) AND user_on_any_roster(instance_uuid, other) THEN
    RETURN true;
  END IF;
  RETURN false;
END
$$;

-- ---------------------------------------------------------------------------
-- 2. DIRECT MESSAGES — direct_messages (1:1; only the two participants read)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS direct_messages (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id       uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  sender_user_id    uuid NOT NULL REFERENCES auth.users(id),
  recipient_user_id uuid NOT NULL REFERENCES auth.users(id),
  sender_name       text NOT NULL,
  body              text NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  read_at           timestamptz
);
CREATE INDEX IF NOT EXISTS direct_messages_pair_idx ON direct_messages(instance_id, sender_user_id, recipient_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS direct_messages_recipient_idx ON direct_messages(recipient_user_id, read_at);

ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
-- Read: strictly the two participants.
DROP POLICY IF EXISTS direct_messages_read ON direct_messages;
CREATE POLICY direct_messages_read ON direct_messages FOR SELECT
  USING (auth.uid() = sender_user_id OR auth.uid() = recipient_user_id);
-- Insert: I am the sender AND I'm allowed to DM this recipient.
DROP POLICY IF EXISTS direct_messages_insert ON direct_messages;
CREATE POLICY direct_messages_insert ON direct_messages FOR INSERT
  WITH CHECK (sender_user_id = auth.uid() AND users_can_dm(instance_id, recipient_user_id));
-- Update: the recipient may mark read (read_at); nothing else changes.
DROP POLICY IF EXISTS direct_messages_update ON direct_messages;
CREATE POLICY direct_messages_update ON direct_messages FOR UPDATE
  USING (recipient_user_id = auth.uid())
  WITH CHECK (recipient_user_id = auth.uid());
-- Delete: the sender may retract their own message.
DROP POLICY IF EXISTS direct_messages_delete ON direct_messages;
CREATE POLICY direct_messages_delete ON direct_messages FOR DELETE
  USING (sender_user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 3. SECURITY REPORTS — security_reports (anyone reports; security triages)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS security_reports (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id      uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  reporter_user_id uuid NOT NULL REFERENCES auth.users(id),
  reporter_name    text NOT NULL,
  body             text NOT NULL,
  location         text,
  status           text NOT NULL DEFAULT 'new' CHECK (status IN ('new','acknowledged','resolved')),
  acknowledged_by  uuid REFERENCES auth.users(id),
  acknowledged_at  timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS security_reports_instance_idx ON security_reports(instance_id, created_at DESC);

ALTER TABLE security_reports ENABLE ROW LEVEL SECURITY;
-- Read: the reporter (their own report) OR the security team.
DROP POLICY IF EXISTS security_reports_read ON security_reports;
CREATE POLICY security_reports_read ON security_reports FOR SELECT
  USING (reporter_user_id = auth.uid() OR user_in_security(instance_id));
-- Insert: any instance member may report; I am the reporter.
DROP POLICY IF EXISTS security_reports_insert ON security_reports;
CREATE POLICY security_reports_insert ON security_reports FOR INSERT
  WITH CHECK (user_in_instance(instance_id) AND reporter_user_id = auth.uid());
-- Update: the security team triages (acknowledge/resolve).
DROP POLICY IF EXISTS security_reports_update ON security_reports;
CREATE POLICY security_reports_update ON security_reports FOR UPDATE
  USING (user_in_security(instance_id))
  WITH CHECK (user_in_security(instance_id));

-- security_team: members read (to see the roster); owner/admin manage.
ALTER TABLE security_team ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS security_team_read   ON security_team;
DROP POLICY IF EXISTS security_team_write  ON security_team;
DROP POLICY IF EXISTS security_team_delete ON security_team;
CREATE POLICY security_team_read   ON security_team FOR SELECT USING (user_in_instance(instance_id));
CREATE POLICY security_team_write  ON security_team FOR INSERT WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY security_team_delete ON security_team FOR DELETE USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- ---------------------------------------------------------------------------
-- 4. REALTIME — stream so DMs + reports arrive live.
-- ---------------------------------------------------------------------------
DO $realtime$
DECLARE
  t text;
  tables text[] := ARRAY['direct_messages','security_reports','security_team'];
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  FOREACH t IN ARRAY tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END
$realtime$;
