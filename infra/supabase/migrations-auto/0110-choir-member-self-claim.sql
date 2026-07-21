-- =============================================================================
-- 0110 — choir roster self-claim (DR-0187 leg 1, applied to the choir)
-- =============================================================================
-- Closes the largest choir onboarding gap (review 2026-07-21, DR-0220): a
-- choir_members roster row with user_id = NULL is INERT — user_in_choir() never
-- matches it (0011:50-60), so a rostered singer cannot see the Choir surface or
-- log their own absence until a director manually stamps a raw auth.users.id
-- (for which there is no UI). The migration header itself named this the
-- deferred follow-up: 0011:12-14.
--
-- DR-0187 (Darrell 2026-07-18): binding a person to an account is a
-- STEWARD-VOUCHED one-time claim delivered human-to-human, no external channel
-- required. This is that pattern, proportionate to the choir's LOW stakes:
--   * A linked roster row grants READ + own-absence only. It does NOT touch
--     instance_members.role, so claiming a 'director' roster row does NOT make
--     anyone an owner/admin — choir_role is descriptive and gates nothing
--     (0011:43, all edit RLS keys off user_role_in_instance owner/admin). So a
--     single-party director-issued code is proportionate (vs the two-party
--     guardian re-confirm 0104 uses for instance membership, which sees family
--     financials).
--
-- FLOW:
--   1. mint_choir_claim_code(member_id) — an owner/admin issues a short,
--      confusable-free, one-time code for an UNCLAIMED roster row and reads it
--      to the member (their own channel — "DMs not SMS", DR-0187).
--   2. claim_choir_member(code) — the signed-in member redeems the code; this
--      links choir_members.user_id = auth.uid() and consumes the code. Now
--      user_in_choir() matches and the Choir surface unlocks.
--   3. my_choir_membership(instance_id) — the app reads the caller's own linked
--      roster row(s) for "you're linked as X" + "songs you're leading".
--
-- SAFE BY CONSTRUCTION: SECURITY DEFINER bypasses RLS, so every guard lives
-- INSIDE the function — auth required, code must match an UNCLAIMED + unexpired
-- row, the caller must not already be linked to a row in that instance, the
-- code is one-time (cleared on claim). EXECUTE granted only to authenticated.
-- No table is added; choir_members already has RLS (0011:195). Adding a linked
-- user_id only GRANTS the claimant their own access; it removes nothing from
-- anyone and cannot cross instances.
--
-- DEPENDS ON: 0011-choir-module.sql (choir_members, user_in_choir,
--             user_role_in_instance). IDEMPOTENT: ADD COLUMN IF NOT EXISTS,
--             CREATE INDEX IF NOT EXISTS, CREATE OR REPLACE. Safe to re-run.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Claim columns on choir_members (idempotent).
-- ---------------------------------------------------------------------------
ALTER TABLE public.choir_members
  ADD COLUMN IF NOT EXISTS claim_code    text,
  ADD COLUMN IF NOT EXISTS claim_expires timestamptz,
  ADD COLUMN IF NOT EXISTS claimed_at    timestamptz;

-- A live code is unique across the table so redemption is unambiguous.
CREATE UNIQUE INDEX IF NOT EXISTS choir_members_claim_code_uidx
  ON public.choir_members (claim_code) WHERE claim_code IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 2. gen_choir_claim_code() — a 6-char confusable-free code (Crockford-ish
--    alphabet: no 0/O/1/I/L/U), read-aloud friendly for COMMUNITY-FIRST
--    (elderly, tech-novice). Retries on the astronomically-rare collision.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.gen_choir_claim_code()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_alphabet text := '23456789ABCDEFGHJKMNPQRSTVWXYZ';  -- 30 chars, no confusables
  v_code     text;
  v_i        int;
  v_try      int := 0;
BEGIN
  LOOP
    v_code := '';
    FOR v_i IN 1..6 LOOP
      v_code := v_code || substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1);
    END LOOP;
    -- Unique against any live code; if taken, retry (bounded).
    IF NOT EXISTS (SELECT 1 FROM choir_members WHERE claim_code = v_code) THEN
      RETURN v_code;
    END IF;
    v_try := v_try + 1;
    IF v_try > 20 THEN
      RAISE EXCEPTION 'gen_choir_claim_code: could not find a free code';
    END IF;
  END LOOP;
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. mint_choir_claim_code(member_id) — owner/admin issues a one-time code for
--    an UNCLAIMED roster row. Returns {code, expires_at, display_name}.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.mint_choir_claim_code(member_id_in uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id  uuid := auth.uid();
  v_member   record;
  v_code     text;
  v_expires  timestamptz := now() + interval '30 days';
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'mint_choir_claim_code: not authenticated';
  END IF;

  SELECT * INTO v_member FROM choir_members WHERE id = member_id_in;
  IF v_member.id IS NULL THEN
    RAISE EXCEPTION 'mint_choir_claim_code: no such roster member';
  END IF;

  -- Only an owner/admin of the roster's instance may issue a code.
  IF user_role_in_instance(v_member.instance_id) NOT IN ('owner','admin') THEN
    RAISE EXCEPTION 'mint_choir_claim_code: only a choir director (owner/admin) can issue a claim code';
  END IF;

  -- A code is for linking an as-yet-unlinked person; never for an already-claimed row.
  IF v_member.user_id IS NOT NULL THEN
    RAISE EXCEPTION 'mint_choir_claim_code: this roster member is already linked to an account';
  END IF;

  v_code := gen_choir_claim_code();
  UPDATE choir_members
     SET claim_code = v_code, claim_expires = v_expires
   WHERE id = member_id_in;

  RETURN jsonb_build_object('code', v_code, 'expires_at', v_expires, 'display_name', v_member.display_name);
END;
$$;
GRANT EXECUTE ON FUNCTION public.mint_choir_claim_code(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. claim_choir_member(code) — the signed-in member redeems the code. Links
--    choir_members.user_id = auth.uid() and consumes the code. Returns
--    {status, member_id, display_name, section, choir_role, instance_id}.
--    status: 'linked' | 'invalid' | 'already-linked'.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_choir_member(code_in text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_code    text := upper(trim(coalesce(code_in, '')));
  v_member  record;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'claim_choir_member: not authenticated';
  END IF;
  IF v_code = '' THEN
    RAISE EXCEPTION 'claim_choir_member: a code is required';
  END IF;

  SELECT * INTO v_member
    FROM choir_members
   WHERE claim_code = v_code
     AND user_id IS NULL
     AND (claim_expires IS NULL OR claim_expires > now())
   LIMIT 1;
  IF v_member.id IS NULL THEN
    RETURN jsonb_build_object('status', 'invalid');
  END IF;

  -- One account links to at most one roster row per choir instance.
  IF EXISTS (
    SELECT 1 FROM choir_members
     WHERE instance_id = v_member.instance_id AND user_id = v_user_id
  ) THEN
    RETURN jsonb_build_object('status', 'already-linked');
  END IF;

  UPDATE choir_members
     SET user_id = v_user_id, claimed_at = now(), claim_code = NULL, claim_expires = NULL
   WHERE id = v_member.id;

  RETURN jsonb_build_object(
    'status', 'linked',
    'member_id', v_member.id,
    'display_name', v_member.display_name,
    'section', v_member.section,
    'choir_role', v_member.choir_role,
    'instance_id', v_member.instance_id
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.claim_choir_member(text) TO authenticated;

-- ---------------------------------------------------------------------------
-- 5. my_choir_membership(instance_id) — the caller's own linked roster row(s),
--    so the app can show "you're linked as X (section)" + personalize "songs
--    you're leading". SECURITY DEFINER so it works before/independent of the
--    choir_members_read RLS chicken-and-egg (which needs user_in_choir first).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.my_choir_membership(instance_uuid uuid)
RETURNS TABLE (member_id uuid, display_name text, section text, choir_role text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT id, display_name, section, choir_role
    FROM choir_members
   WHERE instance_id = instance_uuid AND user_id = auth.uid();
$$;
GRANT EXECUTE ON FUNCTION public.my_choir_membership(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
