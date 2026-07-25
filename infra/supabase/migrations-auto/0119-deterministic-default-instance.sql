-- =============================================================================
-- 0119 — deterministic default-instance resolution (the "my Books are gone" fix)
-- =============================================================================
-- INCIDENT (Darrell 2026-07-25, live screenshots): the Governor's admin account
-- opened Books -> Imported and the verified ledger rendered EMPTY — "I don't
-- have our data that was in our books anymore." Reality-trace of the real
-- resolver (DR-0061/DR-0076):
--
--   * Every tenant-scoped table sync (transactions, accounts, debts, entities,
--     ...) resolves its instance via join_default_instance()'s first branch:
--     "already a member of a NON-church instance -> LIMIT 1" — with NO ORDER
--     BY. One membership row made that unambiguous.
--   * 0089 (DR-0114, Moore Divahs) gave the Governor a SECOND non-church
--     membership: an admin oversight seat in the 'moore-divahs' BUSINESS
--     instance. The hidden premise "one non-church instance per user" broke.
--   * 0113 then UPDATED his poe-family membership row (member -> owner), which
--     physically relocates the tuple — exactly the kind of change that flips
--     an unordered LIMIT 1. The app began scoping the family's Books to the
--     moore-divahs instance: an EMPTY ledger, data intact but unread.
--
-- THE DATA WAS NEVER LOST. The rows sit in the poe-family instance; the
-- resolver was looking at the wrong tenant. This migration makes resolution
-- DETERMINISTIC — the same instance every call, on every plan, forever:
--
--   1. A FAMILY-type instance outranks business/trust/holding seats — the
--      family space is the data home; a business seat is an oversight context,
--      never the default.
--   2. Within the same type, the EARLIEST-joined membership wins (the
--      poe-family founder row predates every later seat).
--   3. instance id as the final total-order tiebreak.
--
-- Same ordering applied to invite_to_instance's target pick (0104), which had
-- the identical unordered LIMIT 1 — without this, the Governor's invites could
-- land people in moore-divahs instead of poe-family nondeterministically.
--
-- IDEMPOTENT: CREATE OR REPLACE both functions, bodies otherwise byte-faithful
-- to 0104. Re-runnable. DEPENDS ON: 0104 (current bodies), 0089 (the second
-- seat), schema-v2.1 (instances, instance_members.joined_at).
-- =============================================================================

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

  -- Already a member of a NON-church instance -> return it, DETERMINISTICALLY:
  -- family-type home first, then earliest-joined, then id (total order). A
  -- later business/oversight seat can never displace the family data home.
  SELECT im.instance_id INTO v_existing
    FROM instance_members im
    JOIN instances i ON i.id = im.instance_id
   WHERE im.user_id = v_user_id AND i.instance_type <> 'church'
   ORDER BY CASE WHEN i.instance_type = 'family' THEN 0 ELSE 1 END,
            im.joined_at ASC,
            i.id ASC
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

-- ---------------------------------------------------------------------------
-- invite_to_instance — the SAME deterministic ordering on the target pick, so
-- an owner/admin of several instances always invites into the family home
-- first (byte-faithful to 0104 otherwise).
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
   ORDER BY CASE WHEN i.instance_type = 'family' THEN 0 ELSE 1 END,
            im.joined_at ASC,
            i.id ASC
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

NOTIFY pgrst, 'reload schema';
