-- =============================================================================
-- 0055 — member_presence: access-governance telemetry (build-freshness + last-seen)
-- =============================================================================
-- Declared by Darrell 2026-06-29: "We need to be aware of the number of people
-- and WHO has access to the PoeTech App, and other obvious metrics for updates."
-- Backs the Access & Usage surface (app/src/components/AccessUsageMetrics.jsx).
--
-- WHAT THIS IS: a privacy-respecting presence row, ONE per (instance, user),
-- self-reported by the user's own session on sign-in. It records ONLY:
--   * which build (commit SHA + build time) that session is running, and
--   * when the session was last seen, and on what coarse platform.
-- That is exactly what a steward needs to manage a rollout ("who is on the
-- latest version when something ships") and to read aggregate engagement.
--
-- WHAT THIS IS NOT (binding — servant-king / served-not-surveilled, per
-- DATA-AS-EMPOWERMENT-NOT-EXTRACTION + QUALITY-OF-LIFE-AS-NORTH-STAR): this is
-- ACCESS GOVERNANCE, not behavioral surveillance. It carries NO page views, NO
-- per-action log, NO content, NO message or activity tracking of members. Build
-- version + a last-seen heartbeat is the whole payload. The sheep are not watched.
--
-- WRITE PATH: a SECURITY DEFINER RPC (record_presence) the caller invokes for
-- THEIR OWN user only — it loops over the instances that user already belongs to
-- and upserts that user's own row in each. There is deliberately NO INSERT/UPDATE
-- RLS policy on the table, so a session can never write another person's row.
--
-- READ PATH (steward-scoped): SELECT is gated to governors — only owner/admin of
-- an instance can read its presence rows. A plain member cannot see who-is-on-
-- what-build. The Access surface itself is family/governor-gated in the shell;
-- this RLS is the defense-in-depth that holds even on a direct query.
--
-- DEPENDS ON: schema-v2.1-infra (instances, instance_members,
--   user_role_in_instance), 0011/0023 (engagement_touch_updated_at).
-- IDEMPOTENT: CREATE ... IF NOT EXISTS, DROP-then-CREATE policies/trigger/fn,
--   guarded publication add. Additive.
-- APPLY: Darrell's hand (Supabase Studio / db-migrate). Until applied, the
--   Access surface shows real roster/role/scope (from instance_members) and an
--   honest empty state for build-freshness/last-seen.
-- =============================================================================

CREATE TABLE IF NOT EXISTS member_presence (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id   uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  text,                                  -- snapshot for the roster readout
  build_sha     text,                                  -- the commit SHA the session runs
  build_time    timestamptz,                           -- when that build was produced
  platform      text,                                  -- coarse: 'web' (no fingerprinting)
  first_seen_at timestamptz NOT NULL DEFAULT now(),    -- first heartbeat ever (returning vs new)
  last_seen_at  timestamptz NOT NULL DEFAULT now(),    -- most recent heartbeat
  updated_at    timestamptz,
  UNIQUE (instance_id, user_id)
);

CREATE INDEX IF NOT EXISTS member_presence_instance_idx  ON member_presence(instance_id);
CREATE INDEX IF NOT EXISTS member_presence_last_seen_idx ON member_presence(instance_id, last_seen_at DESC);

DROP TRIGGER IF EXISTS member_presence_touch_updated ON member_presence;
CREATE TRIGGER member_presence_touch_updated
  BEFORE UPDATE ON member_presence
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

GRANT SELECT ON member_presence TO authenticated;
ALTER TABLE member_presence ENABLE ROW LEVEL SECURITY;

-- READ — governors only (owner/admin of the instance). No member-level read:
-- presence/build of others is steward information, not peer-visible.
DROP POLICY IF EXISTS member_presence_steward_read ON member_presence;
CREATE POLICY member_presence_steward_read ON member_presence FOR SELECT
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- NO INSERT / UPDATE / DELETE policy: the table is written ONLY through
-- record_presence() (SECURITY DEFINER), which scopes every write to auth.uid().

-- ---------------------------------------------------------------------------
-- record_presence — the caller reports its OWN build + heartbeat. Loops over the
-- instances the caller already belongs to (so a church member's presence is
-- visible to the church steward, and a family member's to the family steward),
-- upserting that caller's own row in each. Returns the number of rows touched.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_presence(
  p_build_sha  text DEFAULT NULL,
  p_build_time timestamptz DEFAULT NULL,
  p_platform   text DEFAULT 'web'
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_n   integer := 0;
  r     record;
BEGIN
  IF v_uid IS NULL THEN
    RETURN 0;  -- signed out: no-op, never raises
  END IF;
  FOR r IN
    SELECT instance_id, display_name FROM instance_members WHERE user_id = v_uid
  LOOP
    INSERT INTO member_presence
      (instance_id, user_id, display_name, build_sha, build_time, platform, last_seen_at)
    VALUES
      (r.instance_id, v_uid, r.display_name, p_build_sha, p_build_time, p_platform, now())
    ON CONFLICT (instance_id, user_id) DO UPDATE SET
      display_name = COALESCE(EXCLUDED.display_name, member_presence.display_name),
      build_sha    = EXCLUDED.build_sha,
      build_time   = EXCLUDED.build_time,
      platform     = EXCLUDED.platform,
      last_seen_at = now();
    v_n := v_n + 1;
  END LOOP;
  RETURN v_n;
END;
$$;

REVOKE ALL ON FUNCTION public.record_presence(text, timestamptz, text) FROM public;
GRANT EXECUTE ON FUNCTION public.record_presence(text, timestamptz, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- REALTIME — so a steward's open Access surface updates as sessions check in.
-- ---------------------------------------------------------------------------
DO $realtime$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'member_presence') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE member_presence;
  END IF;
END $realtime$;

NOTIFY pgrst, 'reload schema';
