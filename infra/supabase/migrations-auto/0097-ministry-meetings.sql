-- =============================================================================
-- 0097 — Ministry meetings (sovereign PoeTech meeting SCHEDULING + load rules)
-- =============================================================================
-- Declared by Darrell 2026-07-12: "We want our own OBS-based Zoom/Teams version
-- for PoeTech" -- a sovereign, self-hosted meeting engine on our broadcast stack,
-- NOT an external Zoom/Teams integration. The real-time OBS/WebRTC engine is a
-- Tier-C architecture target (docs/00-foundations/_root/SOVEREIGN-COMMS-AND-
-- MEETINGS.md). THIS table is the scheduling + guardrail record it plugs into,
-- which is real and usable now: a leader schedules a meeting and the app's load
-- rules (lib/ministry-meetings.js -- participant cap, duration cap, max
-- concurrent, one-per-ministry) gate it so the environment isn't overloaded.
--
-- ACCESS: instance members read; owner/admin + the host manage. The load rules
-- are enforced in the client lib (unit-tested, DR-0076) before a write; this
-- table stores the scheduled record + status.
--
-- DEPENDS ON: schema-v2.1-infra.sql. IDEMPOTENT + realtime-published.
-- Word-first: "count the cost, whether he have sufficient to finish it"
-- (Luke 14:28); "Let all things be done decently and in order" (1 Cor 14:40).
-- =============================================================================

CREATE TABLE IF NOT EXISTS ministry_meetings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id     uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  ministry        text,                              -- 'bus' | 'choir' | ... (which ministry owns the concurrency lock)
  title           text NOT NULL,
  host_name       text NOT NULL,
  host_user_id    uuid REFERENCES auth.users(id),
  provider        text NOT NULL DEFAULT 'poetech-obs' CHECK (provider IN ('poetech-obs','zoom','teams','other')),
  join_url        text,
  scheduled_at    timestamptz NOT NULL,
  duration_min    integer NOT NULL DEFAULT 60,
  participant_cap integer NOT NULL DEFAULT 12,
  status          text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','live','ended','canceled')),
  notes           text,
  created_by      uuid REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz,
  updated_by      uuid REFERENCES auth.users(id)
);
CREATE INDEX IF NOT EXISTS ministry_meetings_instance_idx ON ministry_meetings(instance_id, scheduled_at);

ALTER TABLE ministry_meetings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ministry_meetings_read   ON ministry_meetings;
DROP POLICY IF EXISTS ministry_meetings_write  ON ministry_meetings;
DROP POLICY IF EXISTS ministry_meetings_update ON ministry_meetings;
DROP POLICY IF EXISTS ministry_meetings_delete ON ministry_meetings;
CREATE POLICY ministry_meetings_read   ON ministry_meetings FOR SELECT USING (user_in_instance(instance_id));
CREATE POLICY ministry_meetings_write  ON ministry_meetings FOR INSERT WITH CHECK (user_in_instance(instance_id) AND created_by = auth.uid());
CREATE POLICY ministry_meetings_update ON ministry_meetings FOR UPDATE
  USING (user_role_in_instance(instance_id) IN ('owner','admin') OR host_user_id = auth.uid())
  WITH CHECK (user_in_instance(instance_id));
CREATE POLICY ministry_meetings_delete ON ministry_meetings FOR DELETE
  USING (user_role_in_instance(instance_id) IN ('owner','admin') OR host_user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.engagement_touch_updated_at()
RETURNS trigger AS $fn$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$fn$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ministry_meetings_touch_updated ON ministry_meetings;
CREATE TRIGGER ministry_meetings_touch_updated BEFORE UPDATE ON ministry_meetings FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

DO $realtime$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'ministry_meetings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ministry_meetings;
  END IF;
END
$realtime$;
