-- =============================================================================
-- 0151 — a landlord can invite by PHONE, and a linked person claims either way
-- =============================================================================
-- Darrell, 2026-08-26, from his own phone: "Landlord invitation by cellphone
-- also as an option/s... opportunities and constraints." The screenshot beside
-- it shows the honest gap: the Poe Properties door told him "a landlord invites
-- you by email" while HIS OWN session read "SIGNED IN AS (563) 650-2416 · linked
-- to darrellpoe06@gmail.com — one library, both doors."
--
-- Two real failures this closes:
--
--   1. NO EMAIL, NO INVITE. Many tenants and 1099 workers have no email at all —
--      the premise of the phone+PIN door (DR-0172). A phone login IS a real
--      identity here: the app signs up `<digits>@phone.poetech.us` (a synthetic,
--      never-delivered address; lib/supabase.js phoneLoginEmail()). So a phone
--      invite needs no new matching rule — the invite simply carries that
--      address. What was missing was the landlord being able to WRITE one.
--
--   2. INVITED AT ONE DOOR, ARRIVES AT THE OTHER. person_links (DR-0311) already
--      binds a person's phone account to their email account — one library, both
--      doors. Until now the claim matched ONE address, so a tenant invited by
--      email who signs in with phone+PIN (having no email password) would be
--      told they have no door, with everything correct on both sides. The claim
--      now resolves EVERY address that identifies the caller.
--
-- SECURITY — the ceiling and the two-facts rule are UNCHANGED. Access still
-- requires (a) an owner/admin wrote the invite for that exact identity and (b)
-- Supabase authenticated the caller as it. person_links is written only by the
-- account-unification path (0141); it is not user-settable here, and a link is
-- between two accounts of the SAME person by construction. Widening the match to
-- a linked identity therefore adds no new grantee — it stops the SAME person
-- from being locked out by which door they walked through.
--
-- HONEST LIMIT, stated where it lives (DR-0100): a phone here is COLLECTED, not
-- SMS-verified (no SMS provider, no vendor spend — Darrell's governed choice
-- 2026-07-11). A phone invite is therefore a family/church-TRUST identity, the
-- same standing as the phone+PIN door itself, and it is the landlord's own
-- record of who they mean. An email invite is the stronger of the two.
--
-- IDEMPOTENT: CREATE OR REPLACE + ADD COLUMN IF NOT EXISTS. Additive only.
-- DEPENDS ON: 0150 (the invite/claim seam), 0141 (person_links).
-- =============================================================================

-- The human-readable phone the landlord typed, kept beside the synthetic address
-- so the roster shows "(563) 650-2416" and never `15636502416@phone.poetech.us`.
ALTER TABLE property_access_invites ADD COLUMN IF NOT EXISTS invited_phone text;
COMMENT ON COLUMN property_access_invites.invited_phone IS
  'The phone the landlord typed, for display. The identity match still runs on `email`, which for a phone invite holds the synthetic <digits>@phone.poetech.us login address (DR-0313).';

-- Every address that identifies the caller: their own, plus any account
-- person_links binds to theirs (either direction). SECURITY DEFINER because
-- auth.users is not readable by `authenticated`; STABLE + pinned search_path,
-- the same shape as the other predicates in 0075/0150.
CREATE OR REPLACE FUNCTION public.my_identity_emails()
RETURNS TABLE (email text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lower(u.email)
    FROM auth.users u
   WHERE u.id = auth.uid()
     AND u.email IS NOT NULL
  UNION
  SELECT lower(u.email)
    FROM person_links pl
    JOIN auth.users u
      ON u.id = CASE WHEN pl.primary_user = auth.uid() THEN pl.door_user ELSE pl.primary_user END
   WHERE (pl.primary_user = auth.uid() OR pl.door_user = auth.uid())
     AND u.email IS NOT NULL
$$;
REVOKE ALL ON FUNCTION public.my_identity_emails() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.my_identity_emails() TO authenticated;

-- The invitee may read an invitation addressed to ANY of their identities, so
-- the app can say "you have an invitation waiting" at whichever door they used.
DROP POLICY IF EXISTS property_access_invites_read ON property_access_invites;
CREATE POLICY property_access_invites_read ON property_access_invites FOR SELECT TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin')
         OR lower(email) IN (SELECT email FROM my_identity_emails()));

-- The claim, re-stated with the widened identity match. Everything else — the
-- role ceiling, the tenancy stamp, the household insert, the worker channel,
-- the single-use mark — is unchanged from 0150.
CREATE OR REPLACE FUNCTION public.claim_property_access()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid          uuid := auth.uid();
  mine         text[];
  inv          record;
  cap          text;
  allowed      text[];
  n_claimed    int := 0;
  n_tenancy    int := 0;
  n_household  int := 0;
  n_grants     int := 0;
  n_worker     int := 0;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('claimed', 0, 'reason', 'signed-out');
  END IF;
  SELECT array_agg(email) INTO mine FROM my_identity_emails();
  IF mine IS NULL OR array_length(mine, 1) IS NULL THEN
    RETURN jsonb_build_object('claimed', 0, 'reason', 'no-verified-identity');
  END IF;

  FOR inv IN
    SELECT * FROM property_access_invites
    WHERE lower(email) = ANY (mine) AND revoked = false AND claimed_at IS NULL
  LOOP
    allowed := CASE inv.role_label
      WHEN 'manager'      THEN ARRAY['request.manage','message.tenant','notice.post','rentroll.view','rent.confirm','rent.adjust','application.review']
      WHEN 'field_worker' THEN ARRAY['property.history','docs.add']
      ELSE ARRAY[]::text[]
    END;

    IF inv.role_label = 'tenant' AND inv.tenancy_id IS NOT NULL THEN
      UPDATE rental_tenancies
         SET tenant_user_id = uid, updated_at = now()
       WHERE id = inv.tenancy_id
         AND instance_id = inv.instance_id
         AND tenant_user_id IS NULL;
      IF FOUND THEN n_tenancy := n_tenancy + 1; END IF;

    ELSIF inv.role_label = 'household' AND inv.tenancy_id IS NOT NULL THEN
      INSERT INTO tenancy_household (instance_id, tenancy_id, member_user_id, display_name, relationship, added_by)
      VALUES (inv.instance_id, inv.tenancy_id, uid, inv.display_name, inv.relationship, inv.invited_by)
      ON CONFLICT (tenancy_id, member_user_id) DO UPDATE SET active = true;
      n_household := n_household + 1;

    ELSE
      FOREACH cap IN ARRAY coalesce(inv.capabilities, ARRAY[]::text[]) LOOP
        IF cap = ANY (allowed) THEN
          INSERT INTO delegated_capabilities
            (instance_id, grantee_user_id, scope_ref, capability, setting, granted_by, role_label)
          VALUES
            (inv.instance_id, uid, coalesce(inv.scope_ref, '*'), cap, 'allow', inv.invited_by, inv.role_label)
          ON CONFLICT (instance_id, grantee_user_id, scope_ref, capability)
          DO UPDATE SET setting = 'allow', updated_at = now();
          n_grants := n_grants + 1;
        END IF;
      END LOOP;
      IF inv.role_label = 'field_worker' AND inv.tenancy_id IS NOT NULL THEN
        INSERT INTO tenancy_worker_access (instance_id, tenancy_id, worker_user_id, enabled_by, active)
        VALUES (inv.instance_id, inv.tenancy_id, uid, inv.invited_by, true)
        ON CONFLICT (tenancy_id, worker_user_id) DO UPDATE SET active = true;
        n_worker := n_worker + 1;
      END IF;
    END IF;

    UPDATE property_access_invites
       SET claimed_at = now(), claimed_by = uid
     WHERE id = inv.id;
    n_claimed := n_claimed + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'claimed', n_claimed, 'tenancies', n_tenancy, 'household', n_household,
    'grants', n_grants, 'worker_channels', n_worker
  );
END;
$$;
REVOKE ALL ON FUNCTION public.claim_property_access() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_property_access() TO authenticated;

SELECT public.apply_viewer_readonly_overlay();
SELECT public.apply_assistant_scope_overlay();
