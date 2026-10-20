-- =============================================================================
-- 0303 — home accounts: every family member's logins on the home servers are
--        made for them and shown to them, never set up by hand
-- =============================================================================
-- Darrell 2026-10-19, on the photo-backup panel's "set up a phone, once":
-- "Your do everything so users can just use them... End to end workflows".
-- The record is DR-1121. Pairs with 0128 (the family bridge token provisions
-- itself on family devices): the same posture, applied to the accounts a
-- person needs on Immich, Jellyfin and Audiobookshelf.
--
-- REALITY-TRACE (DR-0061). The real data: a row per (person, service) written
-- by the NAS loop infra/nas-home-accounts/home_accounts_sync.py AFTER it has
-- made the account on the server itself (Immich's /api/admin/users, Jellyfin's
-- /Users/New, Audiobookshelf's /api/users). The app's HomeAccounts panel reads
-- the signed-in person's own rows and nothing else. No row, no login shown:
-- "being made on the NAS" is the honest empty state.
--
-- WHO READS WHAT. A person reads ONLY their own rows (user_id = auth.uid()).
-- Nobody writes through the app: the service role writes, from the NAS. The
-- initial password is shown until the person says they have it
-- (home_account_seen), then cleared; Immich also forces a change on first
-- login. RLS is the wall (DR-0060); no client check stands in for it.
--
-- THE ROSTER IS ONE HOUSEHOLD'S. Darrell 2026-10-19: "No my family does....
-- other users can do it on their server". A NAS serves the household it
-- belongs to, never every app user. home_accounts_roster(p_bridge_token) lists
-- owner, admin and member of the instance(s) whose family bridge token
-- (family_secure_config, 0128) EQUALS the token the NAS holds in its own
-- secrets file: the same key that already binds this box to this family. A
-- second household running PoeTech on their own server, with their own key,
-- gets their own roster from the same function. SECURITY DEFINER because it
-- reads auth.users; granted to service_role ONLY, so no app user can list a
-- family through it, and a wrong token lists nobody.
-- =============================================================================

CREATE TABLE IF NOT EXISTS home_accounts (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instance_id      uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  service          text NOT NULL CHECK (service IN ('immich', 'jellyfin', 'audiobookshelf')),
  login            text NOT NULL CHECK (char_length(login) BETWEEN 1 AND 200),
  initial_password text,
  server_url       text NOT NULL CHECK (char_length(server_url) BETWEEN 1 AND 300),
  header_name      text,
  ready_at         timestamptz NOT NULL DEFAULT now(),
  seen_at          timestamptz,
  UNIQUE (user_id, service)
);

ALTER TABLE home_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS home_accounts_read_own ON home_accounts;
CREATE POLICY home_accounts_read_own ON home_accounts FOR SELECT
  USING (user_id = auth.uid());
-- No INSERT / UPDATE / DELETE policy: only the service role (which bypasses
-- RLS) writes, from the NAS loop, after the account exists on the server.

GRANT SELECT ON home_accounts TO authenticated;

-- "I have it": clears the initial password from the row the person just read.
CREATE OR REPLACE FUNCTION public.home_account_seen(p_service text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  n int;
BEGIN
  UPDATE home_accounts
     SET seen_at = now(), initial_password = NULL
   WHERE user_id = auth.uid()
     AND service = p_service;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n > 0;
END;
$$;
GRANT EXECUTE ON FUNCTION public.home_account_seen(text) TO authenticated;

-- The roster the NAS loop makes accounts for: ONE household, the one whose
-- family bridge token is the token this NAS holds. Service role only.
CREATE OR REPLACE FUNCTION public.home_accounts_roster(p_bridge_token text)
RETURNS TABLE (user_id uuid, instance_id uuid, email text, display_name text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT DISTINCT ON (im.user_id)
         im.user_id,
         im.instance_id,
         u.email::text,
         COALESCE(p.display_name, split_part(u.email::text, '@', 1)) AS display_name
    FROM family_secure_config fsc
    JOIN instances i ON i.id = fsc.instance_id
    JOIN instance_members im ON im.instance_id = fsc.instance_id
    JOIN auth.users u ON u.id = im.user_id
    LEFT JOIN profiles p ON p.user_id = im.user_id
   WHERE btrim(COALESCE(p_bridge_token, '')) <> ''
     AND fsc.chat_bridge_token = btrim(p_bridge_token)
     AND im.role IN ('owner', 'admin', 'member')
     AND COALESCE(i.instance_type, '') <> 'church'
     AND u.email IS NOT NULL
   ORDER BY im.user_id, im.instance_id;
$$;
REVOKE ALL ON FUNCTION public.home_accounts_roster(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.home_accounts_roster(text) FROM anon;
REVOKE ALL ON FUNCTION public.home_accounts_roster(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.home_accounts_roster(text) TO service_role;
