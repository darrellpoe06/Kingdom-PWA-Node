-- =============================================================================
-- 0104 — token-bound invites + guardian re-confirm (DR-0187)
-- =============================================================================
-- Closes the bare-email self-claim gap found this session: today
-- join_default_instance (0081, branch b) grants an invited role to ANYONE who
-- signs in with a matching email string, and the default email+password path has
-- email-confirmation OFF — so knowing an invited email is enough to claim it.
--
-- DR-0187 (Darrell 2026-07-18): NO external channel is ever required (his uncle's
-- Gmail is locked by Google's storage-extraction; requiring email excludes the
-- COLG community and rebuilds the extraction trap). Binding becomes a two-party
-- handshake that needs no paid SMS:
--   1. invite_to_instance mints a one-time CLAIM TOKEN and returns it; the
--      guardian DELIVERS the claim link however they already reach the person
--      (their own text/WhatsApp/email/in person — "DMs not SMS").
--   2. claim_invite(token) — the signed-in invitee presents the token; this only
--      records a PENDING claim (claimed_by / claimed_at). It grants NOTHING yet.
--   3. confirm_invite(invite_id) — the inviting guardian/admin re-confirms the
--      pending claim; ONLY THEN is membership granted. Two-party binding.
-- join_default_instance's bare-email branch (b) is REMOVED — membership now comes
-- only from a guardian-confirmed claim (which inserts the member directly), so
-- there is no email-only grant anywhere.
--
-- SAFE BY CONSTRUCTION: the "already a member" guard and the founder allowlist
-- (BOOTSTRAP seed; keeps scripts/tenancy-guard.mjs green) are UNCHANGED, so no
-- existing member is affected. Only the not-yet-a-member invite path changes.
-- NOTE: any invites created under the old flow have no delivered token/link — a
-- guardian simply re-invites (a fresh tokened invite) to hand out a new link.

-- ---------------------------------------------------------------------------
-- 1. Handshake columns on instance_invites (idempotent).
-- ---------------------------------------------------------------------------
ALTER TABLE public.instance_invites
  ADD COLUMN IF NOT EXISTS claim_token   text,
  ADD COLUMN IF NOT EXISTS claimed_by    uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS claimed_at    timestamptz,
  ADD COLUMN IF NOT EXISTS claimed_email text,
  ADD COLUMN IF NOT EXISTS confirmed_at  timestamptz,
  ADD COLUMN IF NOT EXISTS confirmed_by  uuid REFERENCES auth.users(id);

-- Backfill a token for any pre-existing row so none is tokenless.
UPDATE public.instance_invites
   SET claim_token = encode(gen_random_bytes(18), 'hex')
 WHERE claim_token IS NULL;

-- Fast lookup of a live claim by its token.
CREATE UNIQUE INDEX IF NOT EXISTS instance_invites_claim_token_uidx
  ON public.instance_invites (claim_token);

-- ---------------------------------------------------------------------------
-- 2. invite_to_instance — mints a claim_token and RETURNS {id, token, email,
--    role}. Return type changes uuid -> jsonb, so DROP then CREATE.
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.invite_to_instance(text, text);
CREATE FUNCTION public.invite_to_instance(email_in text, role_in text DEFAULT 'member')
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id  uuid := auth.uid();
  v_instance uuid;
  v_email    text := lower(trim(coalesce(email_in, '')));
  v_role     text := lower(trim(coalesce(role_in, 'member')));
  v_token    text := encode(gen_random_bytes(18), 'hex');
  v_id       uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'invite_to_instance: not authenticated';
  END IF;
  IF v_email = '' OR position('@' in v_email) = 0 THEN
    RAISE EXCEPTION 'invite_to_instance: a valid email is required';
  END IF;
  IF v_role NOT IN ('admin','member','viewer') THEN
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

  -- One live invite per email+instance: clear any prior unaccepted one.
  DELETE FROM instance_invites
   WHERE instance_id = v_instance AND lower(email) = v_email AND accepted_at IS NULL;

  INSERT INTO instance_invites (instance_id, email, role, invited_by, claim_token)
    VALUES (v_instance, v_email, v_role, v_user_id, v_token)
    RETURNING id INTO v_id;

  RETURN jsonb_build_object('id', v_id, 'token', v_token, 'email', v_email, 'role', v_role);
END;
$$;
GRANT EXECUTE ON FUNCTION public.invite_to_instance(text, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. claim_invite(token) — the invitee presents the delivered token. Records a
--    PENDING claim only (grants nothing). Returns {status, instance_name, role}.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_invite(token_in text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id  uuid := auth.uid();
  v_email    text;
  v_inv      record;
  v_iname    text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'claim_invite: not authenticated';
  END IF;
  IF coalesce(trim(token_in), '') = '' THEN
    RAISE EXCEPTION 'claim_invite: a token is required';
  END IF;

  SELECT lower(coalesce(email, '')) INTO v_email FROM auth.users WHERE id = v_user_id;

  SELECT * INTO v_inv
    FROM instance_invites
   WHERE claim_token = trim(token_in)
     AND accepted_at IS NULL
     AND expires_at > now()
   LIMIT 1;
  IF v_inv.id IS NULL THEN
    RETURN jsonb_build_object('status', 'invalid');
  END IF;

  UPDATE instance_invites
     SET claimed_by = v_user_id, claimed_at = now(), claimed_email = v_email
   WHERE id = v_inv.id;

  SELECT display_name INTO v_iname FROM instances WHERE id = v_inv.instance_id;
  RETURN jsonb_build_object('status', 'pending-confirm', 'instance_name', v_iname, 'role', v_inv.role);
END;
$$;
GRANT EXECUTE ON FUNCTION public.claim_invite(text) TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. list_pending_claims() — for the inviting guardian/admin: claims awaiting
--    their re-confirmation (claimed but not yet accepted) in THEIR instance.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.list_pending_claims()
RETURNS TABLE (invite_id uuid, email text, claimed_email text, role text, claimed_at timestamptz)
LANGUAGE sql SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT inv.id, inv.email, inv.claimed_email, inv.role, inv.claimed_at
    FROM instance_invites inv
    JOIN instance_members im ON im.instance_id = inv.instance_id
   WHERE im.user_id = auth.uid() AND im.role IN ('owner','admin')
     AND inv.claimed_by IS NOT NULL
     AND inv.accepted_at IS NULL
   ORDER BY inv.claimed_at DESC;
$$;
GRANT EXECUTE ON FUNCTION public.list_pending_claims() TO authenticated;

-- ---------------------------------------------------------------------------
-- 5. confirm_invite(invite_id) — the guardian/admin re-confirms a pending claim.
--    ONLY THEN is membership granted (to the user who claimed). Two-party bind.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.confirm_invite(invite_id_in uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_inv     record;
  v_ok      boolean;
  v_dname   text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'confirm_invite: not authenticated';
  END IF;

  SELECT * INTO v_inv FROM instance_invites WHERE id = invite_id_in;
  IF v_inv.id IS NULL THEN
    RAISE EXCEPTION 'confirm_invite: no such invite';
  END IF;
  IF v_inv.claimed_by IS NULL THEN
    RAISE EXCEPTION 'confirm_invite: nothing has claimed this invite yet';
  END IF;
  IF v_inv.accepted_at IS NOT NULL THEN
    RETURN v_inv.instance_id; -- already confirmed/joined; idempotent
  END IF;

  -- Caller must be owner/admin of the invite's instance.
  SELECT true INTO v_ok
    FROM instance_members
   WHERE instance_id = v_inv.instance_id AND user_id = v_user_id AND role IN ('owner','admin')
   LIMIT 1;
  IF NOT coalesce(v_ok, false) THEN
    RAISE EXCEPTION 'confirm_invite: only an instance owner/admin can confirm';
  END IF;

  SELECT COALESCE(NULLIF(split_part(v_inv.claimed_email, '@', 1), ''), 'Member') INTO v_dname;

  INSERT INTO instance_members (instance_id, user_id, role, display_name)
    VALUES (v_inv.instance_id, v_inv.claimed_by, v_inv.role, v_dname)
    ON CONFLICT (instance_id, user_id) DO NOTHING;

  UPDATE instance_invites
     SET accepted_at = now(), confirmed_at = now(), confirmed_by = v_user_id
   WHERE id = v_inv.id;

  RETURN v_inv.instance_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.confirm_invite(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 6. join_default_instance — REMOVE the bare-email invite branch (b). Membership
--    now comes only from confirm_invite (which inserts the member), surfaced by
--    the "already a member" guard. Founder allowlist + solo-space are unchanged.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.join_default_instance(display_name_in text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id      uuid := auth.uid();
  v_user_email   text;
  v_instance_id  uuid;
  v_display_name text;
  v_existing     uuid;
  v_slug         text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'join_default_instance: not authenticated';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));

  -- Already a member of a NON-church instance -> return it (includes anyone a
  -- guardian has confirmed via confirm_invite).
  SELECT im.instance_id INTO v_existing
    FROM instance_members im
    JOIN instances i ON i.id = im.instance_id
   WHERE im.user_id = v_user_id AND i.instance_type <> 'church'
   LIMIT 1;
  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  SELECT lower(coalesce(email, '')) INTO v_user_email FROM auth.users WHERE id = v_user_id;
  v_display_name := COALESCE(
    NULLIF(trim(display_name_in), ''),
    NULLIF(split_part(v_user_email, '@', 1), ''),
    'Member'
  );

  -- (a) Founder allowlist -> the shared poe-family instance (BOOTSTRAP seed).
  IF v_user_email IN (
    'darrellpoe06@gmail.com',
    'mrspoe06@gmail.com',
    'christina@tlctherapysolutions.com',
    'darrellpoejr@gmail.com'
  ) THEN
    SELECT id INTO v_instance_id FROM instances WHERE slug = 'poe-family';
    IF v_instance_id IS NULL THEN
      RAISE EXCEPTION 'join_default_instance: poe-family instance not seeded';
    END IF;
    INSERT INTO instance_members (instance_id, user_id, role, display_name)
      VALUES (v_instance_id, v_user_id, 'member', v_display_name)
      ON CONFLICT (instance_id, user_id) DO NOTHING;
    RETURN v_instance_id;
  END IF;

  -- (b) [REMOVED — DR-0187] the old bare-email invite auto-grant lived here.
  -- Membership from an invite now requires claim_invite + confirm_invite.

  -- (c) Everyone else -> their OWN isolated instance, owned by them.
  v_slug := 'u-' || replace(v_user_id::text, '-', '');
  INSERT INTO instances (slug, display_name, instance_type)
    VALUES (v_slug, v_display_name, 'family')
    ON CONFLICT (slug) DO NOTHING;
  SELECT id INTO v_instance_id FROM instances WHERE slug = v_slug;
  INSERT INTO instance_members (instance_id, user_id, role, display_name)
    VALUES (v_instance_id, v_user_id, 'owner', v_display_name)
    ON CONFLICT (instance_id, user_id) DO NOTHING;
  RETURN v_instance_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.join_default_instance(text) TO authenticated;
