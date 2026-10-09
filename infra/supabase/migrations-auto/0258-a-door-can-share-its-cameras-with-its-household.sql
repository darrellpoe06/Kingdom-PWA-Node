-- =============================================================================
-- 0258 — A DOOR CAN SHARE ITS CAMERAS WITH ITS HOUSEHOLD (DR-0841)
-- =============================================================================
-- Darrell, 2026-10-09: "Also want to be able to add the Wyze cameras for 805
-- Prospect Ave Champaign Illinois apartments cameras specifically... porch
-- etc... available when we want the tenants to have access to the cameras."
--
-- The cameras already have a sharing primitive: a GRANT the owner's device
-- mints on the NAS (DR-0778) — a token for a named viewer, a subset of
-- cameras, an expiry, never the family key. Until now a grant travelled as a
-- link handed to one person. This column lets the LANDLORD attach a grant to
-- a DOOR: the tenancy row carries the token and a plain note of which cameras
-- it opens, and everyone who signs into that door (the tenant, the household)
-- reads it as their Cameras tab. The forwarder on the NAS still enforces what
-- the token may see; the row only carries it.
--
-- Who writes it: rental_tenancies_update (0055) — owner/admin/member of the
-- instance; a tenant reads their own row (rental_tenancies_read, 0150) and
-- cannot write it. Taking it back clears the row AND revokes the grant on
-- the NAS (the app does both; the row alone is not the gate).
--
-- IDEMPOTENT: ADD COLUMN IF NOT EXISTS.
-- =============================================================================
ALTER TABLE public.rental_tenancies ADD COLUMN IF NOT EXISTS camera_grant text;
ALTER TABLE public.rental_tenancies ADD COLUMN IF NOT EXISTS camera_grant_note text;
COMMENT ON COLUMN public.rental_tenancies.camera_grant IS
  'DR-0841: the camera grant token (g.<id>.<secret>, minted on the NAS, DR-0778) this door''s household may use; NULL when no cameras are shared. The NAS enforces which cameras it opens; this row only carries it.';
COMMENT ON COLUMN public.rental_tenancies.camera_grant_note IS
  'DR-0841: the plain words of what the grant opens (camera names, until when), written beside the token so the door can say it without asking the NAS.';
NOTIFY pgrst, 'reload schema';
