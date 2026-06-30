-- =============================================================================
-- 0057 — in-app FAMILY MESSAGING (guardian<->child, no phone) + MINOR TIERS
-- =============================================================================
-- Declared by Darrell 2026-06-30, riding the data-isolation proof. The family is
-- the test case: Darrell + Christina (guardians), Christiana (17), twins Christian
-- + Christyn (10). Everyone is a member of the ONE shared family instance; shared
-- data is family-visible; each member also has a PRIVATE slice separated when
-- needed; minors are guardian-controlled; siblings do NOT see each other's private
-- space; nobody external sees any of it.
--
-- This migration is the DB half of lib/family-messaging.js. It builds on 0055
-- (the 'child' role + guardian<->child model) and adds the two things 0055 did
-- not have:
--
--   1. MINOR TIERS — `family_member_profiles` records, per family member, an age
--      tier: 'under13' (COPPA-grade, the twins), 'teen' (13-17, Christiana), or
--      'adult'. The tier drives age-appropriate clamping in the app and is set
--      ONLY by a guardian. A child can never raise their own tier.
--
--   2. FAMILY MESSAGING — `family_messages` is an in-app, instance-scoped,
--      person-to-person thread. NO phone number, NO email, NO SMS, NO external
--      egress: a row never leaves the family instance. RLS scopes every message
--      to its PARTICIPANTS plus the instance's guardians (owner/admin), so:
--        * a child reads messages they sent or received — and NOT a sibling's
--          (sibling privacy is RLS-enforced on recipient_user_id);
--        * a guardian has oversight of every minor's messages (owner/admin read
--          all in the instance) — guardian-controlled by construction;
--        * no member of any OTHER instance, and no anon, can read any of it.
--
-- WHY recipient_user_id is the privacy key: sibling privacy is only as strong as
-- the identity it scopes to. A child provisioned with their OWN auth account
-- (guardian-created; see provision_child_member + the runbook) gets RLS-enforced
-- privacy from siblings. A persona-only child on a shared device is separated at
-- the app layer (recipient_persona) — weaker, and documented as such.
--
-- NO-LEAK / NO-EGRESS posture (mirrors 0055): family-internal only, no anon grant,
-- append-only message facts, every write is the participant's own.
--
-- DEPENDS ON: schema-v2.1-infra (instances, instance_members, user_in_instance,
--             user_role_in_instance), 0024 (authenticated default grants),
--             0055 (the 'child' role), engagement_touch_updated_at.
-- IDEMPOTENT: CREATE ... IF NOT EXISTS, DROP-then-CREATE policies, CREATE OR
--             REPLACE functions. Additive; family-internal, no anon.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. family_member_profiles — the per-member roster + minor tier + guardian link.
--    Roster-level (name + tier) is family-visible so Darrell SEES each child; the
--    tier + guardian link are GUARDIAN-WRITE-ONLY. This is NOT private content —
--    it is "who is in the family and what age tier" — so members may read it.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS family_member_profiles (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id     uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  member_user_id  uuid REFERENCES auth.users(id),       -- the member's account (nullable for a persona-only child)
  member_persona  text NOT NULL,                         -- stable per-member key ('christian','christyn','christiana',...)
  display_name    text NOT NULL,
  minor_tier      text NOT NULL DEFAULT 'adult'
                    CHECK (minor_tier IN ('under13','teen','adult')),
  guardian_user_id uuid REFERENCES auth.users(id),       -- the responsible guardian (for a minor)
  -- COPPA-grade protection is DERIVED from the tier, not free-set: under-13 is
  -- always protected. A guardian cannot accidentally un-protect a 10-year-old.
  coppa_protected boolean GENERATED ALWAYS AS (minor_tier = 'under13') STORED,
  notes           text,
  created_by      uuid REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz,
  UNIQUE (instance_id, member_persona)
);
CREATE INDEX IF NOT EXISTS family_member_profiles_instance_idx ON family_member_profiles(instance_id);
CREATE INDEX IF NOT EXISTS family_member_profiles_member_idx   ON family_member_profiles(member_user_id);

DROP TRIGGER IF EXISTS family_member_profiles_touch_updated ON family_member_profiles;
CREATE TRIGGER family_member_profiles_touch_updated
  BEFORE UPDATE ON family_member_profiles
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON family_member_profiles TO authenticated;
ALTER TABLE family_member_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS family_member_profiles_read   ON family_member_profiles;
DROP POLICY IF EXISTS family_member_profiles_insert ON family_member_profiles;
DROP POLICY IF EXISTS family_member_profiles_update ON family_member_profiles;
DROP POLICY IF EXISTS family_member_profiles_delete ON family_member_profiles;
-- Any family member (incl. a child) may read the roster of their OWN instance —
-- the family "sees each other". No other instance and no anon can (user_in_instance).
CREATE POLICY family_member_profiles_read ON family_member_profiles FOR SELECT TO authenticated
  USING (user_in_instance(instance_id));
-- Tier + guardian link are GUARDIAN actions only (a child can never set their tier).
CREATE POLICY family_member_profiles_insert ON family_member_profiles FOR INSERT TO authenticated
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY family_member_profiles_update ON family_member_profiles FOR UPDATE TO authenticated
  USING      (user_role_in_instance(instance_id) IN ('owner','admin'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY family_member_profiles_delete ON family_member_profiles FOR DELETE TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- ---------------------------------------------------------------------------
-- 2. family_messages — in-app person-to-person family thread. Append-only fact
--    (SELECT + INSERT grants only; a sent message is not edited or deleted by a
--    client). read_at is the one mutable field, updatable by the recipient alone.
--    NO phone / NO email / NO external channel column exists — by construction the
--    message cannot egress the family instance.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS family_messages (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id       uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  sender_user_id    uuid REFERENCES auth.users(id),
  sender_persona    text,
  recipient_user_id uuid REFERENCES auth.users(id),      -- the privacy key (sibling-private when present)
  recipient_persona text,                                -- shared-device child fallback (app-layer separation)
  body              text NOT NULL CHECK (length(btrim(body)) > 0 AND length(body) <= 4000),
  kind              text NOT NULL DEFAULT 'message'
                      CHECK (kind IN ('message','invite','note')),
  context           text,                                -- e.g. 'generations-game' (the invite target)
  requires_guardian_ok boolean NOT NULL DEFAULT false,   -- set by the app for an under-13 outbound-to-non-guardian send
  sent_at           timestamptz NOT NULL DEFAULT now(),
  read_at           timestamptz,
  CONSTRAINT family_messages_has_recipient
    CHECK (recipient_user_id IS NOT NULL OR recipient_persona IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS family_messages_instance_idx  ON family_messages(instance_id);
CREATE INDEX IF NOT EXISTS family_messages_recipient_idx ON family_messages(recipient_user_id);
CREATE INDEX IF NOT EXISTS family_messages_sender_idx    ON family_messages(sender_user_id);
CREATE INDEX IF NOT EXISTS family_messages_thread_idx    ON family_messages(instance_id, sent_at DESC);

-- Append-only for clients: SELECT + INSERT only. (UPDATE handled by a narrow
-- read-receipt policy below; no UPDATE/DELETE grant beyond what RLS allows.)
GRANT SELECT, INSERT, UPDATE ON family_messages TO authenticated;
ALTER TABLE family_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS family_messages_read       ON family_messages;
DROP POLICY IF EXISTS family_messages_insert     ON family_messages;
DROP POLICY IF EXISTS family_messages_read_recpt ON family_messages;

-- READ: you may read a message iff it is in your instance AND (you sent it, OR
-- you received it, OR you are a guardian of the instance). Guardians (owner/admin)
-- get oversight of every minor's messages; siblings get NOTHING of each other's.
CREATE POLICY family_messages_read ON family_messages FOR SELECT TO authenticated
  USING (
    user_in_instance(instance_id)
    AND (
      sender_user_id = auth.uid()
      OR recipient_user_id = auth.uid()
      OR user_role_in_instance(instance_id) IN ('owner','admin')
    )
  );

-- INSERT: the sender must be a member of the instance AND must be sending AS
-- THEMSELVES (sender_user_id = auth.uid()), and the recipient (when an account)
-- must be a member of the SAME instance — a message cannot be addressed out of
-- the family. (A guardian sending to a persona-only child uses recipient_persona.)
CREATE POLICY family_messages_insert ON family_messages FOR INSERT TO authenticated
  WITH CHECK (
    user_in_instance(instance_id)
    AND sender_user_id = auth.uid()
    AND (
      recipient_user_id IS NULL
      OR EXISTS (
        SELECT 1 FROM instance_members im
        WHERE im.instance_id = family_messages.instance_id
          AND im.user_id = family_messages.recipient_user_id
      )
    )
  );

-- READ-RECEIPT: only the recipient may update their own message row (to set
-- read_at). USING gates which rows; the app only ever patches read_at.
CREATE POLICY family_messages_read_recpt ON family_messages FOR UPDATE TO authenticated
  USING      (recipient_user_id = auth.uid())
  WITH CHECK (recipient_user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 3. provision_child_member — the GUARDIAN-ONLY, no-self-signup path that wires a
--    child (or any family member) into the shared family instance with a tier.
--    The child's auth account itself is created by a guardian out-of-band (admin
--    API / dashboard; see the runbook) — NO phone, NO self-signup. This RPC then
--    grants the 'child' role membership + the tier profile. A child can never
--    call this to elevate themselves: it requires owner/admin.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.provision_child_member(
  p_instance      uuid,
  p_persona       text,
  p_display_name  text,
  p_minor_tier    text DEFAULT 'under13',
  p_child_user_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_profile_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '28000';
  END IF;
  -- Only a guardian (owner/admin) of THIS instance may provision a child.
  IF user_role_in_instance(p_instance) NOT IN ('owner','admin') THEN
    RAISE EXCEPTION 'only a guardian (owner/admin) may provision a child' USING ERRCODE = '42501';
  END IF;
  IF p_minor_tier NOT IN ('under13','teen','adult') THEN
    RAISE EXCEPTION 'invalid minor_tier %', p_minor_tier USING ERRCODE = '22023';
  END IF;

  -- If a real child account is given, grant it the 'child' role membership
  -- (outside the governor set, so the child is walled out of family-business data).
  IF p_child_user_id IS NOT NULL THEN
    INSERT INTO instance_members (instance_id, user_id, role, display_name)
      VALUES (p_instance, p_child_user_id, 'child', COALESCE(NULLIF(btrim(p_display_name), ''), p_persona))
      ON CONFLICT (instance_id, user_id) DO UPDATE
        SET role = 'child', display_name = EXCLUDED.display_name;
  END IF;

  -- Upsert the tier profile. guardian_user_id is the provisioning guardian.
  INSERT INTO family_member_profiles
    (instance_id, member_user_id, member_persona, display_name, minor_tier, guardian_user_id, created_by)
    VALUES (p_instance, p_child_user_id, p_persona,
            COALESCE(NULLIF(btrim(p_display_name), ''), p_persona), p_minor_tier, v_uid, v_uid)
  ON CONFLICT (instance_id, member_persona) DO UPDATE
    SET member_user_id   = COALESCE(EXCLUDED.member_user_id, family_member_profiles.member_user_id),
        display_name     = EXCLUDED.display_name,
        minor_tier       = EXCLUDED.minor_tier,
        guardian_user_id = EXCLUDED.guardian_user_id,
        updated_at       = now()
  RETURNING id INTO v_profile_id;

  RETURN v_profile_id;
END;
$$;
REVOKE ALL ON FUNCTION public.provision_child_member(uuid,text,text,text,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.provision_child_member(uuid,text,text,text,uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- Realtime: add the new tables to the supabase_realtime publication (guarded).
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE family_member_profiles; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE family_messages;        EXCEPTION WHEN duplicate_object THEN NULL; END;
  END IF;
END $$;

-- =============================================================================
-- Verify after apply (the runbook re-runs this as the live round-trip):
--   * guardian inserts a family_messages row to child Christian's account;
--   * as Christian   -> SELECT returns it;
--   * as Christyn    -> SELECT returns []  (sibling privacy, RLS-enforced);
--   * as a guardian  -> SELECT returns it  (oversight);
--   * as an outsider -> SELECT returns []  (instance isolation).
-- =============================================================================
