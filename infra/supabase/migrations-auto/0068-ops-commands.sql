-- =============================================================================
-- 0068 — ops_commands: the app-first operations queue (the NAS is plumbing,
--        never the front door)
-- =============================================================================
-- Declared by Darrell 2026-07-03 (recorded as DR-0088): "I want all loops and
-- responsibilities to be based on the PoeTech App as my assistant... have an
-- admin space in the app... based on my profile." Operational work (transcript
-- backfill today; every NAS job tomorrow) is TRIGGERED and OBSERVED inside the
-- app. The user never opens a NAS shell or DSM screen to operate the system.
--
-- WHY A QUEUE. The app (Vercel, cloud) cannot reach the LAN-only NAS
-- (LESSONS-LEARNED P18), and infra secrets never ship to the client. So the
-- two sides meet in the database, the place both already reach: the app INSERTs
-- a command row under the owner's authenticated role; the NAS ops-runner
-- (infra/nas-sme-pipeline/ops-runner.py, service role, outbound-only) polls,
-- executes, and streams status/log back into the row; the app watches live via
-- realtime. Command latency = the runner's poll interval (~1 min), which is
-- invisible for these jobs.
--
-- SECURITY MODEL.
--   * READ/INSERT/UPDATE/DELETE = owner/admin ONLY (user_role_in_instance).
--     This is the app's Admin space wall: profile-based, not network-based.
--     NO anon policy, NO choir-wide read — operations are the stewards' room.
--   * The runner writes with the SERVICE ROLE key (bypasses RLS), which lives
--     only on the NAS (/volume1/PoeTech/secrets/supabase.json).
--   * `job` is a free string here; the RUNNER holds the executable whitelist
--     and maps params to fixed argv arrays (never shell strings). An unknown
--     job is marked status='skipped', never executed. Adding a job = runner
--     code review, not a migration.
--
-- THREE BRAKES (the queue side): commands are single-shot rows, not schedules
-- — nothing in this table fires on a clock. The runner enforces its own budget
-- / lock / kill-switch (see ops-runner.py); the loader it invokes has its own
-- three brakes on top.
--
-- DEPENDS ON (present since 0011/0050): instances, user_role_in_instance,
--   engagement_touch_updated_at.
-- IDEMPOTENT: CREATE ... IF NOT EXISTS, DROP-then-CREATE policies, guarded
--   publication add. Additive.
-- =============================================================================

CREATE TABLE IF NOT EXISTS ops_commands (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id   uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  job           text NOT NULL,                  -- runner-side whitelist decides what runs
  params        jsonb NOT NULL DEFAULT '{}'::jsonb,
  status        text NOT NULL DEFAULT 'queued'
                  CHECK (status IN ('queued','running','done','error','skipped')),
  requested_by  uuid,                           -- auth.users id of the steward who queued it
  log           text,                           -- tail of the executed job's output (runner-written)
  result        jsonb,                          -- e.g. {"exit": 0} (runner-written)
  created_at    timestamptz NOT NULL DEFAULT now(),
  started_at    timestamptz,
  finished_at   timestamptz,
  updated_at    timestamptz
);

CREATE INDEX IF NOT EXISTS ops_commands_inst_status_idx
  ON ops_commands(instance_id, status, created_at DESC);

-- updated_at touch (shared function from 0010/0011/0050).
DROP TRIGGER IF EXISTS ops_commands_touch_updated ON ops_commands;
CREATE TRIGGER ops_commands_touch_updated
  BEFORE UPDATE ON ops_commands
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

-- ---------------------------------------------------------------------------
-- GRANTs. authenticated only; NO anon (operations are never public). The
-- runner uses the service role, which bypasses RLS entirely.
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON ops_commands TO authenticated;

ALTER TABLE ops_commands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ops_commands_read   ON ops_commands;
DROP POLICY IF EXISTS ops_commands_insert ON ops_commands;
DROP POLICY IF EXISTS ops_commands_update ON ops_commands;
DROP POLICY IF EXISTS ops_commands_delete ON ops_commands;

-- The stewards' room: owner/admin only, in every direction.
CREATE POLICY ops_commands_read ON ops_commands FOR SELECT
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY ops_commands_insert ON ops_commands FOR INSERT
  TO authenticated
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
-- UPDATE lets a steward cancel a still-queued command (status -> 'skipped').
CREATE POLICY ops_commands_update ON ops_commands FOR UPDATE
  TO authenticated
  USING      (user_role_in_instance(instance_id) IN ('owner','admin'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY ops_commands_delete ON ops_commands FOR DELETE
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- ---------------------------------------------------------------------------
-- REALTIME — the admin card watches a command move queued -> running -> done
-- live, the same machinery as video_transcripts (0058).
-- ---------------------------------------------------------------------------
DO $realtime$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
       AND tablename = 'ops_commands'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE ops_commands;
  END IF;
END $realtime$;

NOTIFY pgrst, 'reload schema';
