-- =============================================================================
-- 0231 — the NAS publishes the family key itself; no steward pastes it (DR-0613)
-- =============================================================================
-- Darrell 2026-09-24, on the Voice page's red row "This device holds the family
-- key the studio requires ... a steward pastes it once in Real Estate → Photos":
-- "The voice needs an engineer to make work!!!!!!!!!? Fix it so users can do it!!!"
--
-- Measured: family_secure_config held ZERO rows on the live project. The key
-- exists on the NAS (/volume1/PoeTech/secrets/chat-bridge-token.txt, minted by
-- the photo and voice installers), but reaching the family devices waited on a
-- person to copy it by hand. This function lets the NAS publish it with the
-- service key it already holds, on its own clock.
--
-- THE KEY OPENS THE FAMILY NAS, so it is published ONLY to non-church
-- instances where one of the named family accounts is owner or admin. The
-- owners are passed by the caller from a committed list
-- (infra/nas-bridge-publish/owners.txt) and matched against auth.users in SQL;
-- no other instance ever receives it. Callable by the service role only:
-- revoked from public, anon and authenticated. Writes only when the stored key
-- differs, so the every-cycle call is a no-op in steady state. Returns the
-- number of instances written.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.box_publish_family_bridge_token(p_token text, p_owner_emails text[])
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  clean text := left(btrim(COALESCE(p_token, '')), 512);
  wrote int;
BEGIN
  IF clean = '' OR p_owner_emails IS NULL OR cardinality(p_owner_emails) = 0 THEN
    RETURN 0;
  END IF;
  INSERT INTO family_secure_config (instance_id, chat_bridge_token, updated_by, updated_at)
  SELECT DISTINCT im.instance_id, clean, NULL::uuid, now()
    FROM instance_members im
    JOIN instances i ON i.id = im.instance_id
    JOIN auth.users u ON u.id = im.user_id
   WHERE im.role IN ('owner','admin')
     AND COALESCE(i.instance_type, '') <> 'church'
     AND lower(u.email) = ANY (SELECT lower(e) FROM unnest(p_owner_emails) AS e)
  ON CONFLICT (instance_id) DO UPDATE
     SET chat_bridge_token = EXCLUDED.chat_bridge_token,
         updated_by = NULL,
         updated_at = now()
   WHERE family_secure_config.chat_bridge_token IS DISTINCT FROM EXCLUDED.chat_bridge_token;
  GET DIAGNOSTICS wrote = ROW_COUNT;
  RETURN wrote;
END;
$$;

REVOKE ALL ON FUNCTION public.box_publish_family_bridge_token(text, text[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.box_publish_family_bridge_token(text, text[]) FROM anon;
REVOKE ALL ON FUNCTION public.box_publish_family_bridge_token(text, text[]) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.box_publish_family_bridge_token(text, text[]) TO service_role;

NOTIFY pgrst, 'reload schema';
