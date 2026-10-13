-- =============================================================================
-- 0256 — A LAN device belongs to a person (DR-0830)
-- =============================================================================
-- Darrell 2026-10-09: "Devices from this person... ein... or mac address...
-- other device details... all of these are from this user." A browser cannot
-- read a MAC address, so the app never learns one from a sign-in. The LAN can:
-- the church device register (0056) already carries the MACs a real scan read
-- (specs.mac, scan-confirmed). What was missing is the tie from a register row
-- to the PERSON whose device it is, so their record can show it.
--
-- One nullable column. The register's own walls are unchanged (0056: read and
-- write by the space's owner/admin/member; delete by owner/admin). A person's
-- record reads only the rows the viewer may already read.
-- IDEMPOTENT: ADD COLUMN IF NOT EXISTS; CREATE INDEX IF NOT EXISTS.
-- =============================================================================

ALTER TABLE public.church_devices
  ADD COLUMN IF NOT EXISTS owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS church_devices_owner_user_idx
  ON public.church_devices (owner_user_id) WHERE owner_user_id IS NOT NULL;

COMMENT ON COLUMN public.church_devices.owner_user_id IS
  'The person this device belongs to (DR-0830): a member picked by the register''s editor. '
  'Null means no person has been assigned. Never derived; always a hand''s choice.';
