-- =============================================================================
-- 0101 — allow the walled 'assistant' role through the invite path
-- =============================================================================
-- Declared by Darrell 2026-07-13 (live, setting up Christina's assistant): the
-- invite dropdown must offer 'assistant' — the WALLED 1099 role (RLS 0100 keeps
-- it out of the books) — so a governor can invite a helper who can NEVER read the
-- family financials. member/admin/viewer are NOT walled, so 'assistant' is the
-- only safe role for a 1099 helper.
--
-- Two gates rejected 'assistant' before this and would have SILENTLY downgraded
-- it to 'member' (a books leak that looks walled):
--   1. instance_invites.role CHECK allowed only owner/admin/member/viewer.
--   2. invite_to_instance() whitelisted only ('admin','member','viewer').
-- This adds 'assistant' to BOTH, atomically with the client dropdown + the shell
-- tab gate (one change; a half-version is never shipped).
--
-- The invite-ACCEPT side already lands the invited role into instance_members,
-- whose role CHECK accepts 'assistant' as of 0100 — so an accepted assistant
-- invite yields a real, RLS-walled assistant member. No client INSERT path to
-- instance_invites (SECURITY DEFINER RPC only), so this is the whole surface.
--
-- IDEMPOTENT: constraint drop-by-discovery + re-add; CREATE OR REPLACE fn.
-- Additive; family-internal; no anon. Forward-only (DR-0011).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. instance_invites.role CHECK — allow 'assistant'. The constraint predates the
--    tenant_invites -> instance_invites rename (schema-v2.1), so its name is
--    uncertain; drop WHATEVER check constrains the role column, then add fresh.
-- ---------------------------------------------------------------------------
DO $invites_role_check$
DECLARE c text;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='instance_invites') THEN
    FOR c IN
      SELECT con.conname
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_namespace ns ON ns.oid = rel.relnamespace
       WHERE ns.nspname = 'public' AND rel.relname = 'instance_invites'
         AND con.contype = 'c'
         AND pg_get_constraintdef(con.oid) ILIKE '%role%'
    LOOP
      EXECUTE format('ALTER TABLE instance_invites DROP CONSTRAINT %I', c);
    END LOOP;
    ALTER TABLE instance_invites ADD CONSTRAINT instance_invites_role_check
      CHECK (role IN ('owner','admin','member','viewer','assistant'));
  END IF;
END $invites_role_check$;

-- ---------------------------------------------------------------------------
-- 2. invite_to_instance — add 'assistant' to the accepted whitelist. Same body
--    as 0081; only the whitelist line changes (owner still forbidden).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.invite_to_instance(email_in text, role_in text DEFAULT 'member')
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id  uuid := auth.uid();
  v_instance uuid;
  v_email    text := lower(trim(coalesce(email_in, '')));
  v_role     text := lower(trim(coalesce(role_in, 'member')));
  v_id       uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'invite_to_instance: not authenticated';
  END IF;
  IF v_email = '' OR position('@' in v_email) = 0 THEN
    RAISE EXCEPTION 'invite_to_instance: a valid email is required';
  END IF;
  -- Accept the walled 'assistant' now too; never invite an 'owner'; unknown -> member.
  IF v_role NOT IN ('admin','member','viewer','assistant') THEN
    v_role := 'member';
  END IF;

  SELECT im.instance_id INTO v_instance
    FROM instance_members im
    JOIN instances i ON i.id = im.instance_id
   WHERE im.user_id = v_user_id AND i.instance_type <> 'church' AND im.role IN ('owner','admin')
   LIMIT 1;
  IF v_instance IS NULL THEN
    RAISE EXCEPTION 'invite_to_instance: only an instance owner/admin can invite';
  END IF;

  DELETE FROM instance_invites
   WHERE instance_id = v_instance AND lower(email) = v_email AND accepted_at IS NULL;

  INSERT INTO instance_invites (instance_id, email, role, invited_by)
    VALUES (v_instance, v_email, v_role, v_user_id)
    RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
