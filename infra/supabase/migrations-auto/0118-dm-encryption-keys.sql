-- =============================================================================
-- 0118 — DM end-to-end encryption keys + the app-wide Messages contact list
-- =============================================================================
-- Declared by Darrell 2026-07-25 ("encryption"): 1:1 direct messages ride an
-- end-to-end-encrypted body — the server stores ciphertext it cannot read
-- (DATA-AS-EMPOWERMENT). The client work lives in app/src/lib/dm-encryption.js
-- (ECDH P-256 device-held keys -> AES-256-GCM per pair). This migration adds
-- the two server pieces the client needs:
--
--   1. dm_public_keys — each user's PUBLIC key (a public key is public; the
--      private key never leaves the device). Any signed-in user may read any
--      public key; only the owner writes their own row.
--   2. list_dm_contacts() — the roster the app-wide Messages surface offers.
--      It mirrors users_can_dm (0096) exactly, adding no reach: the leaders of
--      my instances (anyone may DM a leader — the brother sees Darrell), every
--      member of instances I lead (a leader may DM anyone — Darrell sees the
--      brother), and my roster-mates (usher <-> security).
--
-- The direct_messages table is unchanged: an encrypted body is stored in the
-- same `body` column carrying the `e2e:v1:` envelope; RLS (0096) still gates
-- who holds the row at all. IDEMPOTENT; no realtime needed (keys are fetched
-- on demand). Word-first: "a talebearer revealeth secrets: but he that is of a
-- faithful spirit concealeth the matter" (Proverbs 11:13).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. PUBLIC KEYS — one row per user; the device holds the private half.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dm_public_keys (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  public_jwk jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE dm_public_keys ENABLE ROW LEVEL SECURITY;

-- Read: any signed-in user (a public key reveals nothing; senders need the
-- recipient's key to encrypt TO them).
DROP POLICY IF EXISTS dm_public_keys_read ON dm_public_keys;
CREATE POLICY dm_public_keys_read ON dm_public_keys FOR SELECT
  USING (auth.uid() IS NOT NULL);
-- Write: strictly my own key row.
DROP POLICY IF EXISTS dm_public_keys_insert ON dm_public_keys;
CREATE POLICY dm_public_keys_insert ON dm_public_keys FOR INSERT
  WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS dm_public_keys_update ON dm_public_keys;
CREATE POLICY dm_public_keys_update ON dm_public_keys FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS dm_public_keys_delete ON dm_public_keys;
CREATE POLICY dm_public_keys_delete ON dm_public_keys FOR DELETE
  USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 2. CONTACTS — whom may I start a 1:1 with? Mirrors users_can_dm (0096); the
--    SELECTs below are that function's three grants, materialized as a list.
--    SECURITY DEFINER so membership reads never recurse through RLS.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.list_dm_contacts()
RETURNS TABLE (user_id uuid, display_name text, instance_id uuid, role text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  -- Leaders of instances I belong to (anyone may DM a leader).
  SELECT im.user_id, im.display_name, im.instance_id, im.role
    FROM instance_members im
   WHERE im.role IN ('owner','admin')
     AND im.user_id IS NOT NULL
     AND im.user_id <> auth.uid()
     AND EXISTS (SELECT 1 FROM instance_members me
                  WHERE me.instance_id = im.instance_id AND me.user_id = auth.uid())
  UNION
  -- Every member of instances I lead (a leader may DM anyone there).
  SELECT im.user_id, im.display_name, im.instance_id, im.role
    FROM instance_members im
   WHERE im.user_id IS NOT NULL
     AND im.user_id <> auth.uid()
     AND EXISTS (SELECT 1 FROM instance_members me
                  WHERE me.instance_id = im.instance_id AND me.user_id = auth.uid()
                    AND me.role IN ('owner','admin'))
  UNION
  -- Roster-mates: both of us on some ministry roster of the same instance.
  SELECT im.user_id, im.display_name, im.instance_id, im.role
    FROM instance_members im
   WHERE im.user_id IS NOT NULL
     AND im.user_id <> auth.uid()
     AND EXISTS (SELECT 1 FROM instance_members me
                  WHERE me.instance_id = im.instance_id AND me.user_id = auth.uid())
     AND user_on_any_roster(im.instance_id, auth.uid())
     AND user_on_any_roster(im.instance_id, im.user_id);
$$;
GRANT EXECUTE ON FUNCTION public.list_dm_contacts() TO authenticated;

NOTIFY pgrst, 'reload schema';
