-- =============================================================================
-- 0142 — the Governor grants access from inside the app (Family doors)
-- =============================================================================
-- Darrell 2026-08-21, locked out of helping Christina without a terminal:
-- "I'm inside the app... why can't I do solution inside the PoeTech App?
-- instead of this dumb process" and "I should be able to give access
-- instantly to her or anyone.... especially my family...."
--
-- The app is the primary artifact (DR-0065): an admin standing INSIDE the
-- Admin tab can set a family member's password directly — the same cure the
-- SSH rescue performs, as a guarded RPC. SMTP being unwired can then never
-- lock the family out again: the admin mints the key in-app and hands it over.
--
-- Guardrails (DR-0060 class):
--   • Caller gate — only the family admin identities (the 0140/0025 trio) may
--     execute; everyone else gets an exception, not a silent no-op.
--   • Target gate — the target must be a family-allowlist identity OR share
--     an instance with the caller. No reach into strangers' accounts, ever.
--   • The password itself is never logged, never selected back, never stored
--     anywhere but bcrypt-hashed in auth.users — the same path GoTrue verifies.
--   • PUBLIC execute is revoked (Postgres grants functions to PUBLIC by
--     default); only authenticated may call, and the caller gate re-checks.
CREATE OR REPLACE FUNCTION public.admin_set_family_password(target_email text, new_password text)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_caller_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_caller_id    uuid := auth.uid();
  v_target       text := lower(trim(coalesce(target_email, '')));
  v_target_id    uuid;
BEGIN
  IF v_caller_email NOT IN ('darrellpoe06@gmail.com', 'mrspoe06@gmail.com', '15636502416@phone.poetech.us') THEN
    RAISE EXCEPTION 'Only a family admin can set a door.';
  END IF;
  IF length(coalesce(new_password, '')) < 8 THEN
    RAISE EXCEPTION 'The password must be at least 8 characters.';
  END IF;
  SELECT id INTO v_target_id FROM auth.users WHERE lower(email) = v_target;
  IF v_target_id IS NULL THEN
    RAISE EXCEPTION 'No account exists with that email.';
  END IF;
  IF v_target NOT IN (
       'darrellpoe06@gmail.com',
       'mrspoe06@gmail.com',
       'christina@tlctherapysolutions.com',
       'darrellpoejr@gmail.com',
       '15636502416@phone.poetech.us'
     )
     AND NOT EXISTS (
       SELECT 1
         FROM instance_members a
         JOIN instance_members b ON a.instance_id = b.instance_id
        WHERE a.user_id = v_caller_id
          AND b.user_id = v_target_id
     )
  THEN
    RAISE EXCEPTION 'That account is not in any of your spaces.';
  END IF;

  UPDATE auth.users
     SET encrypted_password = crypt(new_password, gen_salt('bf')),
         email_confirmed_at = coalesce(email_confirmed_at, now()),
         updated_at         = now()
   WHERE id = v_target_id;

  RETURN 'ok';
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_family_password(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_family_password(text, text) TO authenticated;

NOTIFY pgrst, 'reload schema';
