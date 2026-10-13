-- =============================================================================
-- 0117 — group messages: every role's group chat lives IN the app (DR-0231 P1)
-- =============================================================================
-- Declared by Darrell 2026-07-23: "I have multiple groups of chats with
-- different roles that I want PoeTech App to support so they dont need my
-- phone number or any number."
--
-- One table carries every group thread; the GROUP is (instance_id, roster):
--   · roster 'members'  — the whole instance (family chat, client-team chat)
--   · roster 'choir' / 'bus' / 'security' — the ministry roster threads
-- Membership is the EXISTING rails, nothing new: user_in_instance for
-- 'members', the roster tables (0096's guarded pattern) for the rest; leaders
-- (owner/admin) are in every thread of their instance. No phone number exists
-- anywhere in this flow — joining a group = the in-app email invite that
-- already auto-joins on passwordless sign-in (0081/0014).
--
-- APPEND-ONLY except sender-retract (mirrors 0096): no edits — a group
-- record that cannot be rewritten is the "remembered in context" Darrell
-- asked for. Realtime-published for live delivery while the app is open
-- (web push is P3, DR-0231).
-- IDEMPOTENT: CREATE IF NOT EXISTS / DROP-then-CREATE policies; guarded
-- publication add. APPLY: db-migrate (the heal dispatches it on merge).
-- =============================================================================

-- May `uid` read/post in (instance, roster)? SECURITY DEFINER so RLS never
-- recurses; roster tables guarded like 0096 so absence never breaks.
CREATE OR REPLACE FUNCTION public.user_in_group(instance_uuid uuid, roster_key text, uid uuid)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE hit boolean := false;
BEGIN
  IF uid IS NULL THEN RETURN false; END IF;
  -- Not in the instance -> in no group of it.
  IF NOT EXISTS (SELECT 1 FROM instance_members WHERE instance_id = instance_uuid AND user_id = uid) THEN
    RETURN false;
  END IF;
  -- Leaders sit in every thread of their instance.
  IF EXISTS (SELECT 1 FROM instance_members WHERE instance_id = instance_uuid AND user_id = uid AND role IN ('owner','admin')) THEN
    RETURN true;
  END IF;
  IF roster_key = 'members' THEN RETURN true; END IF;
  IF roster_key = 'choir' AND to_regclass('public.choir_members') IS NOT NULL THEN
    SELECT EXISTS (SELECT 1 FROM choir_members WHERE instance_id = instance_uuid AND user_id = uid) INTO hit;
    RETURN hit;
  END IF;
  IF roster_key = 'bus' AND to_regclass('public.bus_drivers') IS NOT NULL THEN
    SELECT EXISTS (SELECT 1 FROM bus_drivers WHERE instance_id = instance_uuid AND user_id = uid) INTO hit;
    RETURN hit;
  END IF;
  IF roster_key = 'security' AND to_regclass('public.security_team') IS NOT NULL THEN
    SELECT EXISTS (SELECT 1 FROM security_team WHERE instance_id = instance_uuid AND user_id = uid) INTO hit;
    RETURN hit;
  END IF;
  RETURN false;
END
$$;

CREATE TABLE IF NOT EXISTS group_messages (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id    uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  roster         text NOT NULL DEFAULT 'members' CHECK (roster IN ('members','choir','bus','security')),
  sender_user_id uuid NOT NULL REFERENCES auth.users(id),
  sender_name    text NOT NULL,
  body           text NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS group_messages_thread_idx ON group_messages(instance_id, roster, created_at DESC);

ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS group_messages_read ON group_messages;
CREATE POLICY group_messages_read ON group_messages FOR SELECT
  USING (user_in_group(instance_id, roster, auth.uid()));
DROP POLICY IF EXISTS group_messages_insert ON group_messages;
CREATE POLICY group_messages_insert ON group_messages FOR INSERT
  WITH CHECK (sender_user_id = auth.uid() AND user_in_group(instance_id, roster, auth.uid()));
-- No UPDATE policy: the record is append-only, remembered as written.
DROP POLICY IF EXISTS group_messages_delete ON group_messages;
CREATE POLICY group_messages_delete ON group_messages FOR DELETE
  USING (sender_user_id = auth.uid());

GRANT SELECT, INSERT, DELETE ON group_messages TO authenticated;

-- Live delivery while the app is open (push is P3).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'group_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE group_messages;
  END IF;
END $$;
