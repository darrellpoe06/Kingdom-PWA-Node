-- =============================================================================
-- 0107 — contractor tax-identity: the NON-SECRET tracking fields only
-- =============================================================================
-- Darrell 2026-07-18: "Only saves to the cellphone or the backup NAS devices...
-- we store no [sensitive] data." The 1099 advisories tell the family to collect a
-- W-9 (legal name + taxpayer ID), but there was nowhere to record any of it.
--
-- SOVEREIGN SPLIT — the full taxpayer ID (SSN/EIN) is NEVER stored in the cloud.
-- It lives ONLY on the family's own devices (phone localStorage) + the backup NAS
-- (see the device tax-id vault, app/src/lib/tax-id-vault.js). What the cloud holds
-- is the NON-SECRET tracking data the roster needs: legal name, mailing address,
-- the ID TYPE (ein/ssn), the LAST 4 (to identify the payee), and whether the W-9
-- is on file. What isn't stored can't leak — the strongest possible lock.
--
-- Additive + idempotent (IF NOT EXISTS), so every existing row keeps working.
-- contractors_1099 already has full RLS (schema-v2.13) — these columns inherit it.
ALTER TABLE contractors_1099
  ADD COLUMN IF NOT EXISTS legal_name    text,
  ADD COLUMN IF NOT EXISTS mailing_address text,
  ADD COLUMN IF NOT EXISTS tax_id_type   text,      -- 'ein' | 'ssn' | null
  ADD COLUMN IF NOT EXISTS tax_id_last4  text,       -- last 4 digits ONLY (never the full id)
  ADD COLUMN IF NOT EXISTS w9_on_file    boolean NOT NULL DEFAULT false;

-- Belt-and-suspenders: the last-4 column must never hold more than 4 characters,
-- so a coding mistake can't smuggle a full SSN into the cloud through this column.
ALTER TABLE contractors_1099 DROP CONSTRAINT IF EXISTS contractors_tax_id_last4_len;
ALTER TABLE contractors_1099 ADD CONSTRAINT contractors_tax_id_last4_len
  CHECK (tax_id_last4 IS NULL OR char_length(tax_id_last4) <= 4);
