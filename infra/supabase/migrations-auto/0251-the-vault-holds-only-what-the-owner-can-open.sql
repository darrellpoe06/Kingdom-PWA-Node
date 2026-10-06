-- =============================================================================
-- 0251 — The vault holds only what the owner can open (DR-0762)
-- =============================================================================
-- Darrell, 2026-10-06: "I also want to be able to pull my passwords into the
-- PoeTech App as a sort of password management manager for the users..."
--
-- ZERO KNOWLEDGE, BY CONSTRUCTION. The server never holds a password, a site
-- name, a username or a note in the clear. Each item is one AES-256-GCM
-- ciphertext made in the browser under a key derived from the person's own
-- passphrase (PBKDF2-SHA256, app/src/lib/vault-crypto.js). What this database
-- holds per person is: the KDF parameters and salt, a verifier (a known
-- sentence encrypted under the key, so the app can tell a wrong passphrase
-- from a corrupt row without ever holding the key here), and ciphertext rows.
-- The operator of this database, root on the NAS, a subpoena of the vendor:
-- none of them can read a single password. Neither can we, and that is the
-- point — "a talebearer revealeth secrets: but he that is of a faithful
-- spirit concealeth the matter" (Proverbs 11:13).
--
-- WALLS. Owner only, every verb, every row; anon reads none. Deletes are soft
-- (deleted_at) so a second device syncing late never resurrects a removed row
-- and the owner can empty the bin later; a hard delete is still the owner's.
-- IDEMPOTENT. Proven on a real PostgreSQL in CI: scripts/vault-ci-smoke.sql.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.vault_header (
  user_id      uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  kdf          text        NOT NULL DEFAULT 'PBKDF2-SHA256',
  iterations   integer     NOT NULL,
  salt         text        NOT NULL,
  verifier_iv  text        NOT NULL,
  verifier_ct  text        NOT NULL,
  version      integer     NOT NULL DEFAULT 1,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT vault_header_iterations_floor CHECK (iterations >= 100000),
  CONSTRAINT vault_header_salt_len         CHECK (length(salt) BETWEEN 16 AND 128),
  CONSTRAINT vault_header_kdf_known        CHECK (kdf IN ('PBKDF2-SHA256'))
);

CREATE TABLE IF NOT EXISTS public.vault_items (
  id           uuid        NOT NULL,
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  iv           text        NOT NULL,
  ct           text        NOT NULL,
  version      integer     NOT NULL DEFAULT 1,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  deleted_at   timestamptz,
  PRIMARY KEY (user_id, id),
  -- A ciphertext of a whole password record is small; 64 KiB keeps a mistaken
  -- attachment from riding this road.
  CONSTRAINT vault_items_ct_cap CHECK (length(ct) <= 65536),
  CONSTRAINT vault_items_iv_len CHECK (length(iv) BETWEEN 12 AND 32)
);

-- The RLS predicate column is the leading PK column, so no extra index is
-- needed for user_id; this one serves the "what changed since" sync read.
CREATE INDEX IF NOT EXISTS vault_items_user_updated_idx ON public.vault_items (user_id, updated_at);

ALTER TABLE public.vault_header ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_items  ENABLE ROW LEVEL SECURITY;

-- Owner only, every verb. (select auth.uid()) so the function runs once per
-- statement, not once per row.
DROP POLICY IF EXISTS vault_header_owner ON public.vault_header;
CREATE POLICY vault_header_owner ON public.vault_header FOR ALL TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS vault_items_owner ON public.vault_items;
CREATE POLICY vault_items_owner ON public.vault_items FOR ALL TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

REVOKE ALL ON public.vault_header FROM anon;
REVOKE ALL ON public.vault_items  FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vault_header TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vault_items  TO authenticated;

-- updated_at moves on every write, so last-writer-wins sync reads the truth.
CREATE OR REPLACE FUNCTION public.vault_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS vault_items_touch ON public.vault_items;
CREATE TRIGGER vault_items_touch BEFORE UPDATE ON public.vault_items
  FOR EACH ROW EXECUTE FUNCTION public.vault_touch_updated_at();
DROP TRIGGER IF EXISTS vault_header_touch ON public.vault_header;
CREATE TRIGGER vault_header_touch BEFORE UPDATE ON public.vault_header
  FOR EACH ROW EXECUTE FUNCTION public.vault_touch_updated_at();

NOTIFY pgrst, 'reload schema';
