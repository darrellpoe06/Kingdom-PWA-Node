-- =============================================================================
-- v2.16 — forecast_snapshots: tracking projected-vs-actual over time (2026-06-25)
-- =============================================================================
-- The financial-engineering layer projects the future from real data. To make
-- the future picture GROUNDED (and to make the forecast better over time), each
-- recorded projection is frozen here as a snapshot: what we projected, the
-- stated assumptions it rested on, and the horizon date to score it against.
-- Once the horizon passes, the app reads the real cash at that date and reports
-- projected-vs-actual. This is the institutional memory of our forecasts —
-- one append per "record this projection", per the systems-of-record audit lane.
--
-- A snapshot is an immutable record of a prediction; the family never edits a
-- past prediction (that would erase the audit value), so there is no UPDATE in
-- normal use — but the standard four policies are kept for symmetry with the
-- other family tables and for a correction path.
--
-- Run once in the cloud Studio SQL Editor. Idempotent.

CREATE TABLE IF NOT EXISTS forecast_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz,
  slug text,                       -- stable local id (snap-<ts>)
  scope text NOT NULL DEFAULT 'consolidated',  -- 'consolidated' | <entity slug>
  label text,
  base_date date NOT NULL,         -- the "today" the projection started from
  horizon_months integer NOT NULL DEFAULT 12,
  horizon_date date NOT NULL,      -- base_date + horizon_months (score-against date)
  starting_cash numeric NOT NULL DEFAULT 0,
  projected_end_cash numeric NOT NULL DEFAULT 0,
  projected_lowest_cash numeric,
  projected_runway_months integer, -- null = no negative-cash cliff in horizon
  net_monthly numeric NOT NULL DEFAULT 0,
  assumptions jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS forecast_snapshots_instance_idx ON forecast_snapshots(instance_id);
CREATE INDEX IF NOT EXISTS forecast_snapshots_horizon_idx ON forecast_snapshots(instance_id, horizon_date);

ALTER TABLE forecast_snapshots ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'forecast_snapshots' AND policyname = 'forecast_member_read') THEN
    CREATE POLICY forecast_member_read ON forecast_snapshots FOR SELECT USING (user_in_instance(instance_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'forecast_snapshots' AND policyname = 'forecast_member_insert') THEN
    CREATE POLICY forecast_member_insert ON forecast_snapshots FOR INSERT WITH CHECK (user_in_instance(instance_id) AND created_by = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'forecast_snapshots' AND policyname = 'forecast_member_update') THEN
    CREATE POLICY forecast_member_update ON forecast_snapshots FOR UPDATE USING (user_in_instance(instance_id)) WITH CHECK (user_in_instance(instance_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'forecast_snapshots' AND policyname = 'forecast_member_delete') THEN
    CREATE POLICY forecast_member_delete ON forecast_snapshots FOR DELETE USING (user_in_instance(instance_id));
  END IF;
END $$;

-- Realtime so a snapshot recorded on one device appears on the others.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'forecast_snapshots'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.forecast_snapshots;
  END IF;
END $$;
