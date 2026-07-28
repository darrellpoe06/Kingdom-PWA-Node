-- =====================================================================
-- Kingdom-PWA / SKOS / PoeTech — schema-v2.10-renter-portal-auth.sql
--
-- v2.10 RENTER PORTAL AUTH — the missing half of the tenant self-view (b3b).
--
-- Depends on: schema-v2.1-infra.sql (external_users), schema-v2.2-rentals.sql
--             (renters, leases, rent_payments), schema-v2.9-portal-rls.sql
--             (the Pattern-D read policies, ALREADY LIVE).
--
-- THE GAP THIS CLOSES (reality-trace, 2026-07-28):
--   schema-v2.9 already lets a renter read their OWN leases + rent_payments,
--   keyed on current_external_user_id() = the JWT claim `external_user_id`.
--   But NOTHING in the system ISSUES that claim — a tenant who signs in with a
--   normal magic link gets an auth.users session with NO external_user_id, so
--   the Pattern-D policies never match and they see nothing. This migration is
--   the issuer: a Supabase custom access token hook that, at token-mint time,
--   looks up the signing-in user's email against an INVITED renter external_user
--   and injects `external_user_id` into their JWT.
--
-- GOVERNANCE (Tier C — a NEW auth surface over financial + PII data):
--   · This file is HELD for Darrell's review; it does not auto-apply as part of
--     the clean rentals lane. RELEASE-TIERS / DR-0060.
--   · It grants NOTHING new by itself — the read scope is exactly the v2.9
--     Pattern-D policies (own rows only; `notes` revoked). It only lets the
--     RIGHT already-scoped person be recognized.
--   · The hook binds by a VERIFIED email: the person must complete a real
--     magic-link sign-in to that email AND an owner must have invited that exact
--     email as a renter external_user. Two independent facts, both required.
--
-- THE ONE STEP THAT IS DARRELL'S (a genuine DR-0089 carve-out — access only he
-- holds): after this migration applies, enable the hook in the Supabase
-- Dashboard → Authentication → Hooks → "Custom Access Token" → select
-- public.custom_access_token_hook. That toggle lives in the Auth settings the
-- app cannot reach. Ready-to-paste steps ship with this file's PR.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. The access-token hook — inject external_user_id for an invited renter
-- ---------------------------------------------------------------------
-- Supabase calls this as `supabase_auth_admin` while minting a token. It must
-- be STABLE, must never raise (a raising hook blocks ALL logins), and must
-- return the event unchanged when there is no match.
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

  -- Match a renter external_user by verified email who has been invited.
  -- (An owner must have created the row + invited THIS email — see the RPC
  -- below — so recognition requires two independent facts.)
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
  -- A hook must NEVER block sign-in. On any error, pass the event through
  -- unchanged (the person simply gets no portal claim). DR-0076: fail safe.
  RETURN event;
END;
$$;

-- The hook runs as supabase_auth_admin; grant exactly what it needs and nothing
-- to the front-end roles (a token-mint function is never called by clients).
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) FROM authenticated, anon, public;
GRANT SELECT ON public.external_users TO supabase_auth_admin;

-- ---------------------------------------------------------------------
-- 2. Owner RPC — invite a renter to the portal (link + mark invited)
-- ---------------------------------------------------------------------
-- The owner (a member of the instance) calls this for one of their renters.
-- It find-or-creates the renter's external_users row (type 'renter', bound to
-- the renter's email), links renters.external_user_id, and marks it invited.
-- SECURITY DEFINER so it can write external_users under the caller's instance
-- membership check. Returns the external_user id. Never grants across instances.
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

  -- The caller must belong to the renter's instance (owner/admin/member).
  IF NOT public.user_in_instance(r.instance_id) THEN
    RAISE EXCEPTION 'not a member of this instance';
  END IF;

  IF r.contact_email IS NULL OR length(trim(r.contact_email)) = 0 THEN
    RAISE EXCEPTION 'renter has no email to invite';
  END IF;

  -- Reuse an existing linked external_user, else find-or-create by (instance,email,type).
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

  -- Link the renter back to its portal identity.
  UPDATE public.renters SET external_user_id = ext_id, updated_at = now(), updated_by = caller
    WHERE id = r.id;

  RETURN ext_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.invite_renter_portal(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.invite_renter_portal(uuid) TO authenticated;

COMMIT;

-- =====================================================================
-- ENABLEMENT (Darrell's one step — Supabase Dashboard, cannot be done from
-- the app or a migration):
--
--   Authentication → Hooks → Custom Access Token → Enable →
--     Postgres function: public.custom_access_token_hook
--
-- Then a tenant whose email an owner invited (invite_renter_portal) signs in
-- with a normal magic link and the v2.9 Pattern-D policies serve them THEIR OWN
-- leases + rent_payments — nothing else. Disable the hook to turn the portal
-- off instantly; no data is exposed until it is enabled.
-- =====================================================================
-- End of schema-v2.10-renter-portal-auth.sql
-- =====================================================================
