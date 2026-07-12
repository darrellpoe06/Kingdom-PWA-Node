-- =====================================================================
-- 0096-giving-records-rail.sql
--
-- The steward "Record Giving" rail (DP 2026-07-12: "easy add cash money to
-- a user's records" + "bulk add excel records"). A doc-shaped table-sync rail
-- (same shape as the 0077 live-data rails: instance_id + created_by + slug +
-- doc jsonb) so a gift logged on one steward's device is the same record every
-- steward loads. lib/giving-records.js normalizes/dedupes; RecordGiving.jsx
-- commits here through givingRecordsSync.
--
-- STRICTER RLS than the member rails: giving is STEWARD financial data, so
-- read/insert/update/delete are owner/admin ONLY (never 'member') -- the
-- financial-secretary posture from the church cash-control best practices.
-- This RECORDS gifts already received; the app never processes payments.
--
-- Carries the instance_id index tenancy-guard Check E now requires (DR-0179).
-- =====================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS giving_records (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by  uuid REFERENCES auth.users(id),
  slug        text NOT NULL,
  doc         jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz,
  updated_by  uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS giving_records_instance_idx ON giving_records (instance_id);
CREATE UNIQUE INDEX IF NOT EXISTS giving_records_slug_uniq ON giving_records (instance_id, slug);

DROP TRIGGER IF EXISTS giving_records_touch_updated ON giving_records;
CREATE TRIGGER giving_records_touch_updated BEFORE UPDATE ON giving_records
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON giving_records TO authenticated;
ALTER TABLE giving_records ENABLE ROW LEVEL SECURITY;

-- Steward-only (owner/admin). Members do NOT read the giving ledger.
DROP POLICY IF EXISTS giving_records_read ON giving_records;
CREATE POLICY giving_records_read ON giving_records FOR SELECT TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));
DROP POLICY IF EXISTS giving_records_insert ON giving_records;
CREATE POLICY giving_records_insert ON giving_records FOR INSERT TO authenticated
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
DROP POLICY IF EXISTS giving_records_update ON giving_records;
CREATE POLICY giving_records_update ON giving_records FOR UPDATE TO authenticated
  USING      (user_role_in_instance(instance_id) IN ('owner','admin'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
DROP POLICY IF EXISTS giving_records_delete ON giving_records;
CREATE POLICY giving_records_delete ON giving_records FOR DELETE TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

COMMIT;

-- =====================================================================
-- End of 0096-giving-records-rail.sql
-- =====================================================================
