-- =============================================================================
-- 0045 — Order of Service: the ACTUAL (what occurred) + the learning loop
-- =============================================================================
-- Darrell 2026-06-25: "Order of service can also be updated based on what
-- occurred and becomes a blueprint for the next service." The master program
-- (0042) is the PLANNED side — what we INTEND. This migration adds the ACTUAL
-- side — what really HAPPENED — and the loop that connects them:
--
--   PLAN (0042 program+segments)  ->  execute the service
--     ->  HARVEST what occurred (the service video; the NAS SME pipeline /
--         choir_songs + choir_sermons the choir already keeps)
--     ->  RECONCILE planned-vs-actual here (church_service_segment_actuals)
--     ->  the reconciled actual becomes the BLUEPRINT that seeds the NEXT
--         service of the same type (Sunday -> next Sunday, Wednesday -> next
--         Wednesday), pre-populated from what worked.
--
-- DESCRIPTIVE, NOT PRESCRIPTIVE (mirrors the choir Song->Renditions model,
-- 0043-choir-song-renditions): this is a FAITHFUL RECORD of "how we actually did
-- it," available to reproduce OR depart from — it INFORMS the next plan, it never
-- DICTATES it. The finalizer circle (0043) still finalizes the next program.
--
-- HONEST PROVENANCE (Verification Doctrine, DR-0076): an actual item carries its
-- source. A 'harvest' item mined from the service video starts needs_review =
-- true (low confidence) until a finalizer confirms it — exactly the renditions
-- archive honesty. Nothing about what occurred is painted; absence of an actual
-- for a planned segment = it was skipped (derived, not invented).

-- 1. Program-level actual / recap fields + the blueprint link. ----------------
ALTER TABLE church_service_programs
  ADD COLUMN IF NOT EXISTS actual_start_time    text,        -- real clock the service started 'HH:MM' (24h)
  ADD COLUMN IF NOT EXISTS actual_total_minutes integer,     -- real total runtime
  ADD COLUMN IF NOT EXISTS actual_notes         text,        -- recap: what worked / what to change next time
  ADD COLUMN IF NOT EXISTS harvest_source       text,        -- provenance: service video URL / SME spec ref the actual was reconciled from
  ADD COLUMN IF NOT EXISTS reconciled_at        timestamptz, -- when the actual was reconciled (null = plan only, not yet executed/reconciled)
  ADD COLUMN IF NOT EXISTS reconciled_by        uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS blueprint_source_id  uuid REFERENCES church_service_programs(id) ON DELETE SET NULL; -- which past actual seeded THIS plan

-- 2. The ACTUAL run: one row per thing that actually occurred, in actual order.
--    planned_segment_id links it back to the plan (null = unplanned / added live).
--    A planned segment with NO matching row = skipped (derived in reconcileService).
CREATE TABLE IF NOT EXISTS church_service_segment_actuals (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id        uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  program_id         uuid NOT NULL REFERENCES church_service_programs(id) ON DELETE CASCADE,
  planned_segment_id uuid REFERENCES church_service_segments(id) ON DELETE SET NULL, -- null = unplanned/added
  disposition        text NOT NULL DEFAULT 'as-planned'
                       CHECK (disposition IN ('as-planned','ran-long','ran-short','reordered','added')),
  title              text NOT NULL,                 -- what it actually was (defaults from the planned title)
  sector             text NOT NULL DEFAULT 'general'
                       CHECK (sector IN ('worship','pulpit','music','media','ushers','hospitality','pastoral','general')),
  actual_order       integer NOT NULL DEFAULT 0,    -- the order it REALLY happened in
  actual_minutes     integer,                       -- real duration
  actual_songs       jsonb NOT NULL DEFAULT '[]'::jsonb, -- real choir_songs ids actually sung here
  actual_sermon_id   uuid,                          -- real choir_sermons id actually preached
  note               text,                          -- "BG extended the altar call", "added I Need You To Survive"
  -- Provenance (mirrors 0043 renditions archive honesty):
  source             text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','harvest')),
  confidence         text CHECK (confidence IN ('low','high')),
  video_id           text,                          -- the service video this was mined from
  at_seconds         integer,                       -- timestamp into the video
  needs_review       boolean NOT NULL DEFAULT false,
  created_by         uuid REFERENCES auth.users(id),
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz,
  updated_by         uuid REFERENCES auth.users(id)
);
CREATE INDEX IF NOT EXISTS church_service_segment_actuals_program_idx
  ON church_service_segment_actuals(program_id, actual_order);

-- 3. RLS: read = whole team (the actual is shared institutional memory); write =
--    the finalizer circle (0043), the same set that edits the master. Mirrors
--    church_service_segments exactly.
ALTER TABLE church_service_segment_actuals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS church_service_segment_actuals_read   ON church_service_segment_actuals;
DROP POLICY IF EXISTS church_service_segment_actuals_write  ON church_service_segment_actuals;
DROP POLICY IF EXISTS church_service_segment_actuals_update ON church_service_segment_actuals;
DROP POLICY IF EXISTS church_service_segment_actuals_delete ON church_service_segment_actuals;
CREATE POLICY church_service_segment_actuals_read   ON church_service_segment_actuals FOR SELECT
  USING (user_in_choir(instance_id));
CREATE POLICY church_service_segment_actuals_write  ON church_service_segment_actuals FOR INSERT
  WITH CHECK (user_is_worship_finalizer(instance_id));
CREATE POLICY church_service_segment_actuals_update ON church_service_segment_actuals FOR UPDATE
  USING (user_is_worship_finalizer(instance_id))
  WITH CHECK (user_is_worship_finalizer(instance_id));
CREATE POLICY church_service_segment_actuals_delete ON church_service_segment_actuals FOR DELETE
  USING (user_is_worship_finalizer(instance_id));

DROP TRIGGER IF EXISTS church_service_segment_actuals_touch_updated ON church_service_segment_actuals;
CREATE TRIGGER church_service_segment_actuals_touch_updated
  BEFORE UPDATE ON church_service_segment_actuals
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

-- Realtime so every finalizer's device sees the reconcile build live.
DO $realtime$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='church_service_segment_actuals')
  THEN ALTER PUBLICATION supabase_realtime ADD TABLE church_service_segment_actuals; END IF;
END $realtime$;

NOTIFY pgrst, 'reload schema';
