-- =============================================================================
-- 0042 — Order of Service: master program + per-sector segments
-- =============================================================================
-- Darrell 2026-06-24: ONE master program per Sunday worship (the conductor's
-- score / run-of-show), from which each staff sector reads a DERIVED VIEW scoped
-- to their part. The master is church_service_programs; its ordered segments are
-- church_service_segments. Every staff member reads the SAME master (read =
-- user_in_choir = the whole team); the per-sector view is a client-side LENS over
-- this one source of truth (lib/service-program.js deriveSectorView), NOT a
-- separate security boundary — the conductor's score is shared, the staff part is
-- a focus, not a wall. The steward (owner/admin) builds and edits it.
--
-- Mirrors the choir_team_documents access model (0022): team reads, leadership
-- writes. Soft refs (sermon_id, song_ids) point into the existing choir_sermons /
-- choir_songs the choir already maintains, resolved client-side — so the program
-- integrates REAL choir music + the real sermon, never painted placeholders.

CREATE TABLE IF NOT EXISTS church_service_programs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id    uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  service_date   date NOT NULL,
  service_type   text NOT NULL DEFAULT 'sunday' CHECK (service_type IN ('sunday','wednesday','rehearsal','special','both')),
  service_slot   text,                       -- '1pm'/'evening'/free text for dual services
  title          text NOT NULL DEFAULT 'Order of Worship',
  theme          text,                       -- the Sunday's theme / series
  scripture_ref  text,                       -- anchoring scripture for the whole service
  start_time     text,                       -- target service start clock 'HH:MM' (24h)
  target_minutes integer,                    -- target total run time (for proportional reflow)
  status         text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  notes          text,
  created_by     uuid REFERENCES auth.users(id),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz,
  updated_by     uuid REFERENCES auth.users(id)
);
CREATE INDEX IF NOT EXISTS church_service_programs_instance_idx
  ON church_service_programs(instance_id, service_date DESC);

CREATE TABLE IF NOT EXISTS church_service_segments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id     uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,   -- denormalized for RLS + read filter
  program_id      uuid NOT NULL REFERENCES church_service_programs(id) ON DELETE CASCADE,
  sort_order      integer NOT NULL DEFAULT 0,
  title           text NOT NULL,             -- 'Call to Worship', 'Sermon', 'Benediction'...
  sector          text NOT NULL DEFAULT 'general'
                    CHECK (sector IN ('worship','pulpit','music','media','ushers','hospitality','pastoral','general')),
  owner_name      text,                      -- person label ('Bishop Gwin', 'Christina')
  planned_minutes integer NOT NULL DEFAULT 5,
  flexible        boolean NOT NULL DEFAULT true,  -- compressible on time reflow (the sermon is usually NOT)
  scripture_ref   text,
  sermon_id       uuid,                      -- soft ref into choir_sermons (resolved client-side)
  song_ids        jsonb NOT NULL DEFAULT '[]'::jsonb,  -- soft refs into choir_songs
  cues            jsonb NOT NULL DEFAULT '{}'::jsonb,   -- { sector: 'cue text' } per-sector cues
  notes           text,                      -- shared run-of-show note (all sectors)
  created_by      uuid REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz,
  updated_by      uuid REFERENCES auth.users(id)
);
CREATE INDEX IF NOT EXISTS church_service_segments_program_idx
  ON church_service_segments(program_id, sort_order);

-- RLS: read = whole team (user_in_choir); write/edit/delete = owner/admin steward.
-- Same shape as choir_team_documents (0022).
ALTER TABLE church_service_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE church_service_segments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS church_service_programs_read   ON church_service_programs;
DROP POLICY IF EXISTS church_service_programs_write  ON church_service_programs;
DROP POLICY IF EXISTS church_service_programs_update ON church_service_programs;
DROP POLICY IF EXISTS church_service_programs_delete ON church_service_programs;
CREATE POLICY church_service_programs_read   ON church_service_programs FOR SELECT
  USING (user_in_choir(instance_id));
CREATE POLICY church_service_programs_write  ON church_service_programs FOR INSERT
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY church_service_programs_update ON church_service_programs FOR UPDATE
  USING (user_role_in_instance(instance_id) IN ('owner','admin'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY church_service_programs_delete ON church_service_programs FOR DELETE
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

DROP POLICY IF EXISTS church_service_segments_read   ON church_service_segments;
DROP POLICY IF EXISTS church_service_segments_write  ON church_service_segments;
DROP POLICY IF EXISTS church_service_segments_update ON church_service_segments;
DROP POLICY IF EXISTS church_service_segments_delete ON church_service_segments;
CREATE POLICY church_service_segments_read   ON church_service_segments FOR SELECT
  USING (user_in_choir(instance_id));
CREATE POLICY church_service_segments_write  ON church_service_segments FOR INSERT
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY church_service_segments_update ON church_service_segments FOR UPDATE
  USING (user_role_in_instance(instance_id) IN ('owner','admin'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY church_service_segments_delete ON church_service_segments FOR DELETE
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

DROP TRIGGER IF EXISTS church_service_programs_touch_updated ON church_service_programs;
CREATE TRIGGER church_service_programs_touch_updated
  BEFORE UPDATE ON church_service_programs
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();
DROP TRIGGER IF EXISTS church_service_segments_touch_updated ON church_service_segments;
CREATE TRIGGER church_service_segments_touch_updated
  BEFORE UPDATE ON church_service_segments
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

-- Realtime so every staff device updates live as the steward edits the master.
DO $realtime$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='church_service_programs')
  THEN ALTER PUBLICATION supabase_realtime ADD TABLE church_service_programs; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='church_service_segments')
  THEN ALTER PUBLICATION supabase_realtime ADD TABLE church_service_segments; END IF;
END $realtime$;

NOTIFY pgrst, 'reload schema';
