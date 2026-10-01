-- =============================================================================
-- 0249 — A sealed message opens on every device of both people (DR-0737)
-- =============================================================================
-- Darrell, 2026-10-01: "The encrypted message is sent however sometimes I can
-- see it and others not on the same device... my cellphone... I actually want
-- it to work on multiple devices... why not?"
--
-- WHY IT FLIPPED. dm_public_keys (0118) holds ONE public key per account
-- (PRIMARY KEY user_id). Every device that opens Messages generates its own
-- keypair and upserts it over that one row, so a message is sealed to
-- whichever of a person's devices published LAST, and which messages a given
-- phone can open flips each time another device opens Messages.
--
-- THE FIX. One public key per DEVICE. A sender seals a message once and wraps
-- its content key for every device of both people (app/src/lib/dm-encryption.js,
-- e2e:v2). The private half still never leaves the device that made it.
--
-- WALLS. Any signed-in person may read any device key (a public key reveals
-- nothing; a sender needs every device of the recipient). Only the owner
-- writes, updates or forgets their own device rows. anon reads none. 0118's
-- table is left as it is: a device still publishes its latest key there so an
-- app that has not yet updated can seal v1 to it.
-- Proven on a real PostgreSQL in CI: scripts/dm-device-keys-ci-smoke.sql.
-- IDEMPOTENT. Word-first: "a talebearer revealeth secrets: but he that is of a
-- faithful spirit concealeth the matter" (Proverbs 11:13).
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.dm_device_keys (
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id    text        NOT NULL,
  public_jwk   jsonb       NOT NULL,
  label        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, device_id),
  CONSTRAINT dm_device_keys_device_id_len CHECK (length(device_id) BETWEEN 8 AND 80),
  CONSTRAINT dm_device_keys_label_len     CHECK (label IS NULL OR length(label) <= 80)
);

ALTER TABLE public.dm_device_keys ENABLE ROW LEVEL SECURITY;

-- Read: any signed-in person (a sender needs every device of the recipient).
DROP POLICY IF EXISTS dm_device_keys_read ON public.dm_device_keys;
CREATE POLICY dm_device_keys_read ON public.dm_device_keys FOR SELECT
  USING (auth.uid() IS NOT NULL);
-- Write / update / forget: strictly my own device rows.
DROP POLICY IF EXISTS dm_device_keys_insert ON public.dm_device_keys;
CREATE POLICY dm_device_keys_insert ON public.dm_device_keys FOR INSERT
  WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS dm_device_keys_update ON public.dm_device_keys;
CREATE POLICY dm_device_keys_update ON public.dm_device_keys FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS dm_device_keys_delete ON public.dm_device_keys;
CREATE POLICY dm_device_keys_delete ON public.dm_device_keys FOR DELETE
  USING (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dm_device_keys TO authenticated;

NOTIFY pgrst, 'reload schema';
