-- =============================================================================
-- 0001 — family allowlist on the default-instance auto-join (2026-06-12)
-- =============================================================================
-- SECURITY. join_default_instance() auto-enrolled ANY authenticated user as
-- a member of the poe-family instance — and membership is what every RLS
-- policy checks before showing accounts, debts, rentals, incidents, and the
-- family snapshot. The only thing gating it was an accident: Supabase's
-- built-in mailer delivered magic links only to the project owner's email.
-- Custom SMTP (Christina's sign-in fix) removes that accidental wall, so
-- the join must be allowlisted BEFORE any-email delivery goes live.
--
-- Non-family signed-in users (Bishop Gwin, future church folks): the
-- function now raises, the client's sync layer catches it ('no-tenant'
-- skip), and the app degrades gracefully to device-local persistence with
-- ZERO family data. The shared church experience is the church-instance
-- onboarding on the roadmap, not this function.
--
-- Idempotent: CREATE OR REPLACE. To add a family member (the twins, when
-- they get accounts): add their email to the allowlist below in a new
-- migration that re-replaces this function.

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
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'join_default_instance: not authenticated';
  END IF;
  SELECT instance_id INTO v_existing FROM instance_members
    WHERE user_id = v_user_id LIMIT 1;
  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;
  SELECT id INTO v_instance_id FROM instances WHERE slug = 'poe-family';
  IF v_instance_id IS NULL THEN
    RAISE EXCEPTION 'join_default_instance: poe-family instance not seeded';
  END IF;
  SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
  IF lower(coalesce(v_user_email, '')) NOT IN (
    'darrellpoe06@gmail.com',
    'mrspoe06@gmail.com',
    'christina@tlctherapysolutions.com'
  ) THEN
    RAISE EXCEPTION 'join_default_instance: this account is not a member of this family. Ask the family to invite you.';
  END IF;
  v_display_name := COALESCE(
    NULLIF(trim(display_name_in), ''),
    split_part(v_user_email, '@', 1),
    'Member'
  );
  INSERT INTO instance_members (instance_id, user_id, role, display_name)
    VALUES (v_instance_id, v_user_id, 'member', v_display_name);
  RETURN v_instance_id;
END;
$$;
