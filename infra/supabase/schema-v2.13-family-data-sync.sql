-- =====================================================================
-- Kingdom-PWA / SKOS / PoeTech — schema-v2.13-family-data-sync.sql
--
-- v2.13 FAMILY DATA SYNC (2026-06-10). Run AFTER
-- schema-v2.2.2-rentals-sync-amendments.sql (same Studio sitting is fine).
-- Depends on: schema-v2.8-ops.sql (incidents), schema-v2.4-contractor.sql
-- (contractors_1099).
--
-- Purpose: the quality-control loops (work orders, dispatch trail,
-- lifecycle logs) and the 1099 worker list currently live in one device's
-- localStorage. These amendments let the PWA sync both to the family
-- instance, so the QC history pools across Darrell's and Christina's
-- devices and survives any one device. Same union-vocab discipline as
-- v2.2.2: the app's real values are stored, nothing is flattened.
--
--  1. incidents: slug column + per-instance unique index (client-side ids
--     like 'in-1718...' become the cross-device identity, DB-enforced);
--     dispatch jsonb (the assigned-worker record: who, phone, when);
--     category CHECK widened with the app's 'tenant','personal','business';
--     urgency CHECK widened with the app's 'project' band.
--
--  2. contractors_1099: slug column + unique index; notes column (the
--     app's per-worker notes had no home, and losing them on sync would
--     violate merge-keeps-local-detail); status CHECK widened with the
--     app's legacy 'paused','ended' so existing device data uploads as-is.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. incidents — work orders + QC trail
-- ---------------------------------------------------------------------
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS dispatch jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS incidents_instance_slug_uniq
  ON incidents (instance_id, slug)
  WHERE slug IS NOT NULL;

ALTER TABLE incidents DROP CONSTRAINT IF EXISTS incidents_category_check;
ALTER TABLE incidents ADD CONSTRAINT incidents_category_check
  CHECK (category IN (
    'vehicle','property','medical','renter','maintenance','technology',
    'financial','administrative','other',
    -- app vocab (union, v2.13)
    'tenant','personal','business','tenant-or-property'
  ));

ALTER TABLE incidents DROP CONSTRAINT IF EXISTS incidents_urgency_check;
ALTER TABLE incidents ADD CONSTRAINT incidents_urgency_check
  CHECK (urgency IN (
    'incident','change','request','problem','normal','urgent','low',
    -- app vocab (union, v2.13): the third ITSM band
    'project'
  ));

-- ---------------------------------------------------------------------
-- 2. contractors_1099 — the 1099 worker list both phones share
-- ---------------------------------------------------------------------
ALTER TABLE contractors_1099 ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE contractors_1099 ADD COLUMN IF NOT EXISTS notes text;

CREATE UNIQUE INDEX IF NOT EXISTS contractors_1099_instance_slug_uniq
  ON contractors_1099 (instance_id, slug)
  WHERE slug IS NOT NULL;

ALTER TABLE contractors_1099 DROP CONSTRAINT IF EXISTS contractors_1099_status_check;
ALTER TABLE contractors_1099 ADD CONSTRAINT contractors_1099_status_check
  CHECK (status IN (
    'active','pipeline','possible','inactive','terminated',
    -- app vocab (union, v2.13)
    'paused','ended'
  ));

COMMIT;

-- =====================================================================
-- End of schema-v2.13-family-data-sync.sql
-- =====================================================================
