-- =============================================================================
-- v2.17 — data_liberation_progress: "Your Data" across a person's devices (DR-0291)
-- =============================================================================
-- Darrell 2026-08-11: "persist the progress locally and also sync across my
-- devices... of course users will want it to."
--
-- Getting your photo library out of a vendor is a flow measured in DAYS: you
-- ask on a laptop, the vendor takes hours-to-days to build it, the mail lands on
-- a phone, and the files are saved somewhere else again. Progress that lives in
-- one browser tab is lost precisely when it matters, and a person re-requests an
-- export they already had waiting.
--
-- THIS TABLE IS USER-SCOPED, WHICH IS DELIBERATE AND DIFFERENT.
-- Every other family table here is readable by the whole instance
-- (user_in_instance). advocacy_records is family-wide because parents document
-- FOR a student. This is the opposite case: one person's own Google/Apple/Amazon
-- account, their own photographs, their own decision to delete them.
-- USER-ACCOUNTS-AND-HISTORIES-STANDARD is explicit — "Each user sees only their
-- own history" — so the policies below add `created_by = auth.uid()` ON TOP OF
-- instance membership. DR-0060 still holds (instance_id present and enforced);
-- this narrows within it, it does not replace it.
--
-- The safety reason, not just the privacy one: two of these columns are
-- ATTESTATIONS — "I opened the files and they work", "I compared how many there
-- are". If they were family-wide, one member's tick would unlock a delete button
-- on another member's phone for photos that person never checked. The whole
-- feature exists to stop an irreversible delete against an incomplete copy, so
-- the attestation must stay with the person who made it. who/when are stored so
-- it remains honest even where a login is genuinely shared.
--
-- Run once in the cloud Studio SQL Editor. Idempotent.

CREATE TABLE IF NOT EXISTS data_liberation_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz,
  slug text,                                  -- stable local id (= vendor_id)
  vendor_id text NOT NULL,                    -- 'google-photos', 'amazon-photos', ...
  stage text NOT NULL DEFAULT 'not-started',  -- not-started|requested|building|ready|landed|verified|deleted

  -- The two attestations. Defaulting FALSE is load-bearing: a NULL that read as
  -- truthy anywhere downstream would authorise a delete nobody confirmed.
  bytes_verified boolean NOT NULL DEFAULT false,
  completeness_confirmed boolean NOT NULL DEFAULT false,

  -- Who vouched, and when. Kept so a shared login still shows whose judgment
  -- the delete rests on.
  bytes_verified_by text,
  bytes_verified_at timestamptz,
  completeness_confirmed_by text,
  completeness_confirmed_at timestamptz
);

-- One row per person per vendor; a second device updates rather than duplicates.
CREATE UNIQUE INDEX IF NOT EXISTS data_liberation_owner_vendor_idx
  ON data_liberation_progress(created_by, vendor_id);
CREATE INDEX IF NOT EXISTS data_liberation_instance_idx
  ON data_liberation_progress(instance_id);

ALTER TABLE data_liberation_progress ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- NOTE the `AND created_by = auth.uid()` on SELECT — this is the line that
  -- makes the table user-scoped rather than family-scoped. Removing it would
  -- silently expose one member's export progress, and their delete
  -- authorisation, to everyone else on the instance.
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'data_liberation_progress' AND policyname = 'data_liberation_owner_read') THEN
    CREATE POLICY data_liberation_owner_read ON data_liberation_progress
      FOR SELECT USING (user_in_instance(instance_id) AND created_by = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'data_liberation_progress' AND policyname = 'data_liberation_owner_insert') THEN
    CREATE POLICY data_liberation_owner_insert ON data_liberation_progress
      FOR INSERT WITH CHECK (user_in_instance(instance_id) AND created_by = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'data_liberation_progress' AND policyname = 'data_liberation_owner_update') THEN
    CREATE POLICY data_liberation_owner_update ON data_liberation_progress
      FOR UPDATE USING (user_in_instance(instance_id) AND created_by = auth.uid())
      WITH CHECK (user_in_instance(instance_id) AND created_by = auth.uid());
  END IF;
  -- Exportable always + the right to leave (DATA-AS-EMPOWERMENT commitments 3
  -- and 1): a person can delete their own record of this entirely.
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'data_liberation_progress' AND policyname = 'data_liberation_owner_delete') THEN
    CREATE POLICY data_liberation_owner_delete ON data_liberation_progress
      FOR DELETE USING (user_in_instance(instance_id) AND created_by = auth.uid());
  END IF;
END $$;

-- Realtime so progress made on the laptop shows on the phone that receives the
-- vendor's "your copy is ready" mail.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'data_liberation_progress'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.data_liberation_progress;
  END IF;
END $$;
