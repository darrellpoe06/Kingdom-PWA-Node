-- =============================================================================
-- 0047 — voice_profiles: consent-gated voice ENROLLMENT for the sovereign voice
--        layer (read-aloud "listen to anything" in a voice you choose)
-- =============================================================================
-- Declared by Darrell 2026-06-25. The app can read any surface aloud (lib/tts.js
-- + TTSControl). This table adds WHICH voice and WHETHER we may use it. A personal
-- (cloned) voice is a SUBSCRIBER feature, and — the binding rule — a real person's
-- voice is never cloneable until that person has explicitly consented in-app.
--   * Darrell's own voice: he is the principal + building circle (already consents)
--     and enrolls himself with one tap.
--   * Bishop Gwin (Bishop Lloyd E. Gwin), Christina Poe, anyone else: they appear
--     only as "invite to enroll" and become usable solely when THEY opt in.
--   * The cloned timbre itself needs the local sovereign voice service (Voicebox /
--     XTTS on the GPU box) — a pending spike. Until then a personal voice plays a
--     LABELED stand-in (handled in lib/voice-registry.js resolveVoiceProvider).
--
-- SELF-CONSENT (the bright line): INSERT/UPDATE require created_by = auth.uid().
-- A signed-in person can only create/move their OWN voice row — nobody can grant
-- (or flip) consent on another person's behalf. The person_key <-> identity tie is
-- enforced in the app (the persona is the caller's own); the DB enforces the
-- created_by = self wall that makes that tie un-spoofable from another account.
-- Always-labeled: ai_label defaults true (every personal voice is shown as AI).
--
-- DEPENDS ON: schema-v2.1-infra (instances, user_role_in_instance), 0024
--             (restore-authenticated-grants), 0011/0023 (engagement_touch_updated_at).
-- IDEMPOTENT: CREATE ... IF NOT EXISTS, DROP-then-CREATE policies/trigger, guarded
--             publication add. Additive, family-internal — NO anon policy.
-- =============================================================================

CREATE TABLE IF NOT EXISTS voice_profiles (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id   uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by    uuid REFERENCES auth.users(id),
  person_key    text NOT NULL,                 -- persona key (darrell / christina / bishop-gwin / ...)
  display_name  text NOT NULL,
  consent_state text NOT NULL DEFAULT 'none'
                  CHECK (consent_state IN ('none','requested','granted','declined','revoked')),
  consent_scope text,                           -- e.g. 'read-aloud-narration' | 'build-test'
  consent_at    timestamptz,
  entitlement   text NOT NULL DEFAULT 'subscriber'
                  CHECK (entitlement IN ('free','subscriber')),
  provider_hint text NOT NULL DEFAULT 'sovereign-clone'
                  CHECK (provider_hint IN ('browser','sovereign-clone')),
  ai_label      boolean NOT NULL DEFAULT true,  -- personal voices are always shown as AI-generated
  meta          jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz,
  updated_by    uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS voice_profiles_instance_idx ON voice_profiles(instance_id);
CREATE INDEX IF NOT EXISTS voice_profiles_consent_idx  ON voice_profiles(consent_state);
-- One enrollment row per (instance, person) so upsert-on-enroll can't duplicate.
CREATE UNIQUE INDEX IF NOT EXISTS voice_profiles_person_uniq ON voice_profiles(instance_id, person_key);

-- updated_at touch (reuses the shared function from 0011/0023).
DROP TRIGGER IF EXISTS voice_profiles_touch_updated ON voice_profiles;
CREATE TRIGGER voice_profiles_touch_updated
  BEFORE UPDATE ON voice_profiles
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

-- ---------------------------------------------------------------------------
-- GRANTs. authenticated needs the explicit grant (this project's 0024 leaves
-- anon untouched and does NOT auto-grant authenticated). No grant to anon: voice
-- enrollment is never public. RLS gates ROWS; the grant only reaches the table.
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON voice_profiles TO authenticated;

ALTER TABLE voice_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS voice_profiles_read   ON voice_profiles;
DROP POLICY IF EXISTS voice_profiles_insert ON voice_profiles;
DROP POLICY IF EXISTS voice_profiles_update ON voice_profiles;
DROP POLICY IF EXISTS voice_profiles_delete ON voice_profiles;

-- READ: any member of the instance can SEE who is enrolled (the family/team view).
CREATE POLICY voice_profiles_read ON voice_profiles FOR SELECT
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member'));

-- INSERT: you may only enroll YOUR OWN voice — created_by must be you, and you must
-- be a member of the instance. This is the self-consent wall.
CREATE POLICY voice_profiles_insert ON voice_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND user_role_in_instance(instance_id) IN ('owner','admin','member')
  );

-- UPDATE: only the row's creator may move their own consent (grant/revoke). Nobody
-- can flip another person's consent state.
CREATE POLICY voice_profiles_update ON voice_profiles FOR UPDATE
  TO authenticated
  USING      (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- DELETE: the creator removes their own enrollment; an owner may also remove a row
-- (a withdrawal request actioned by the governor). Members cannot delete others'.
CREATE POLICY voice_profiles_delete ON voice_profiles FOR DELETE
  TO authenticated
  USING (created_by = auth.uid() OR user_role_in_instance(instance_id) = 'owner');

-- ---------------------------------------------------------------------------
-- REALTIME — an enrollment on one device shows up live on another (same path
-- projects/discussions ride).
-- ---------------------------------------------------------------------------
DO $realtime$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
       AND tablename = 'voice_profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE voice_profiles;
  END IF;
END $realtime$;

NOTIFY pgrst, 'reload schema';
