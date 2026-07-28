-- =====================================================================
-- 0123-renter-portal-auth.sql — APPLY-LANE copy of schema-v2.10 (b3b step 1)
--
-- Darrell 2026-07-28: "you do it." The reference doc
-- infra/supabase/schema-v2.10-renter-portal-auth.sql was held out of the
-- apply lane pending review; #1082 merged it (reviewed). This is the
-- sanctioned db-migrate copy so the FUNCTION + RPC actually reach the cloud
-- DB via the proven lane (DR-0084) — no hand-pasted SQL.
--
-- SAFE TO AUTO-APPLY, and INERT until Darrell's one dashboard step:
--   · The hook is STABLE and wrapped so it can NEVER raise — a bug yields no
--     claim, never a blocked login (DR-0076 fail-safe). It does nothing at all
--     until the Auth "Custom Access Token" hook is ENABLED in the dashboard
--     (the one step no migration/API-secret in this repo can perform).
--   · invite_renter_portal only links an already-scoped renter's external_user
--     row within the caller's own instance (user_in_instance check). It grants
--     no read scope by itself — the v2.9 Pattern-D policies (own rows only,
--     `notes` revoked) are the read gate, already live.
--   · Idempotent (CREATE OR REPLACE + idempotent GRANT/REVOKE) — the house rule.
-- =====================================================================

BEGIN;

-- 1. The access-token hook — inject external_user_id for an invited renter.
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claims  jsonb;
  uid     uuid;
  uemail  text;
  ext_id  uuid;
BEGIN
  claims := coalesce(event->'claims', '{}'::jsonb);
  uid    := NULLIF(event->>'user_id', '')::uuid;
  IF uid IS NULL THEN
    RETURN event;
  END IF;

  SELECT email INTO uemail FROM auth.users WHERE id = uid;
  IF uemail IS NULL OR length(trim(uemail)) = 0 THEN
    RETURN event;
  END IF;

  SELECT eu.id INTO ext_id
  FROM public.external_users eu
  WHERE lower(eu.email) = lower(uemail)
    AND eu.type = 'renter'
    AND eu.invite_status IN ('invited','accepted')
  ORDER BY eu.invited_at DESC NULLS LAST
  LIMIT 1;

  IF ext_id IS NOT NULL THEN
    claims := jsonb_set(claims, '{external_user_id}', to_jsonb(ext_id::text));
    event  := jsonb_set(event, '{claims}', claims);
  END IF;

  RETURN event;
EXCEPTION WHEN OTHERS THEN
  -- A hook must NEVER block sign-in. Pass the event through unchanged.
  RETURN event;
END;
$$;

GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) FROM authenticated, anon, public;
GRANT SELECT ON public.external_users TO supabase_auth_admin;

-- 2. Owner RPC — invite a renter to the portal (link + mark invited).
CREATE OR REPLACE FUNCTION public.invite_renter_portal(renter_uuid uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r          public.renters%ROWTYPE;
  ext_id     uuid;
  caller     uuid := auth.uid();
BEGIN
  IF caller IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT * INTO r FROM public.renters WHERE id = renter_uuid;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'renter not found';
  END IF;

  IF NOT public.user_in_instance(r.instance_id) THEN
    RAISE EXCEPTION 'not a member of this instance';
  END IF;

  IF r.contact_email IS NULL OR length(trim(r.contact_email)) = 0 THEN
    RAISE EXCEPTION 'renter has no email to invite';
  END IF;

  ext_id := r.external_user_id;
  IF ext_id IS NULL THEN
    SELECT id INTO ext_id FROM public.external_users
    WHERE instance_id = r.instance_id AND lower(email) = lower(r.contact_email) AND type = 'renter'
    LIMIT 1;
  END IF;

  IF ext_id IS NULL THEN
    INSERT INTO public.external_users
      (instance_id, type, display_name, email, linked_entity_type, linked_entity_id,
       invite_status, invited_at, invited_by, permissions, created_by)
    VALUES
      (r.instance_id, 'renter', r.display_name, r.contact_email, 'renter', r.id,
       'invited', now(), caller, ARRAY['view-own-rent'], caller)
    RETURNING id INTO ext_id;
  ELSE
    UPDATE public.external_users
      SET invite_status = CASE WHEN invite_status = 'accepted' THEN 'accepted' ELSE 'invited' END,
          invited_at = now(), invited_by = caller,
          linked_entity_type = 'renter', linked_entity_id = r.id,
          display_name = r.display_name, email = r.contact_email
      WHERE id = ext_id;
  END IF;

  UPDATE public.renters SET external_user_id = ext_id, updated_at = now(), updated_by = caller
    WHERE id = r.id;

  RETURN ext_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.invite_renter_portal(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.invite_renter_portal(uuid) TO authenticated;

COMMIT;

-- =====================================================================
-- After this applies, the ONE remaining step is Darrell's (Auth settings the
-- app cannot reach): Dashboard → Authentication → Hooks → Custom Access Token
-- → Enable → public.custom_access_token_hook. Until then: inert, nothing
-- exposed; the "Share statement" button carries the tenant's record.
-- =====================================================================
