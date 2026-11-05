-- =============================================================================
-- 0315 — sign-ins and failures are on the record (DR-1336, DR-1330 D6)
-- =============================================================================
-- The audit_log (schema-v2.1-infra.sql §4.3) has allowed the actions 'login'
-- and 'failed-auth' since the day it was created, and nothing ever wrote them.
-- The 2026-11-05 Ways review (DR-1330) measured it: role changes and support
-- grants are audited; a sign-in, and a wrong password, leave no row. The
-- slide's "log critical security events" had a table and no writer.
--
-- THE WRITER IS GOTRUE'S OWN HOOK. The sovereign auth server (supabase/gotrue
-- v2.177.0, infra/nas-supabase/docker-compose.yml) calls a Postgres function
-- on every password verification attempt when these two are set on the auth
-- service:
--   GOTRUE_HOOK_PASSWORD_VERIFICATION_ATTEMPT_ENABLED=true
--   GOTRUE_HOOK_PASSWORD_VERIFICATION_ATTEMPT_URI=pg-functions://postgres/public/auth_password_verification_attempt
-- with the event {"user_id": "<uuid>", "valid": true|false}. The function
-- below writes one audit_log row per attempt and returns '{}' — it never
-- rejects, so sign-in behaviour is unchanged; it only remembers.
--
-- SIGN-IN NEVER BREAKS ON THE RECORD-KEEPER. Every path in the hook ends in
-- RETURN '{}': a malformed event, a missing user, a failed insert each raise a
-- WARNING and let the attempt through. A down site is the worst outcome
-- (DR-0107); an unlogged attempt is the lesser one.
--
-- WHOSE ROW IS IT. The attempt belongs to the person. When the person belongs
-- to an instance, the row carries that instance so the instance's owners and
-- admins can read it; a person with no instance yet (a fresh profile) gets a
-- row with instance_id NULL, which the member-read policy never shows (the
-- steward reads those with psql over the tailnet, nas-health.yml). That is why
-- instance_id becomes nullable here, for this one class of row.
--
-- WHO READS. auth_events_recent(p_hours) returns the auth rows of the
-- instances the caller owns or administers, newest first, capped at 500 and
-- 30 days — the Admin surface's feed (D7's register page). Members and anon
-- cannot execute it.
--
-- IDEMPOTENT: ALTER ... DROP NOT NULL is a no-op when already nullable; every
-- function is CREATE OR REPLACE with an unchanged RETURNS shape; the grants
-- re-apply. Safe to re-run (the CI leg applies it twice).
-- Smoke: infra/supabase/tests/0315-auth-events-smoke.sql (ROLLS BACK).
-- =============================================================================

-- 1. An auth event may belong to a person with no instance yet.
ALTER TABLE public.audit_log ALTER COLUMN instance_id DROP NOT NULL;

-- 2. The hook GoTrue calls on every password verification attempt.
CREATE OR REPLACE FUNCTION public.auth_password_verification_attempt(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user     uuid;
  v_valid    boolean;
  v_instance uuid;
BEGIN
  BEGIN
    v_user := NULLIF(event->>'user_id', '')::uuid;
  EXCEPTION WHEN OTHERS THEN
    v_user := NULL;
  END;
  IF v_user IS NULL THEN
    RAISE WARNING 'auth_password_verification_attempt: no user_id in event (sign-in continues)';
    RETURN '{}'::jsonb;
  END IF;
  v_valid := COALESCE((event->>'valid')::boolean, false);

  SELECT m.instance_id INTO v_instance
    FROM public.instance_members m
   WHERE m.user_id = v_user
   ORDER BY m.instance_id
   LIMIT 1;

  INSERT INTO public.audit_log (instance_id, user_id, action, entity_type, entity_id, note)
  VALUES (v_instance, v_user,
          CASE WHEN v_valid THEN 'login' ELSE 'failed-auth' END,
          'auth', v_user, 'password verification attempt');
  RETURN '{}'::jsonb;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'auth_password_verification_attempt: % (sign-in continues)', SQLERRM;
  RETURN '{}'::jsonb;
END;
$$;

REVOKE ALL ON FUNCTION public.auth_password_verification_attempt(jsonb) FROM PUBLIC, anon, authenticated;
-- GoTrue connects as supabase_auth_admin on a Supabase stack; a bare CI
-- PostgreSQL has no such role, and the grant is skipped there, not faked.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_auth_admin') THEN
    GRANT EXECUTE ON FUNCTION public.auth_password_verification_attempt(jsonb) TO supabase_auth_admin;
  END IF;
END $$;

-- 3. The owners' and admins' read of their instances' auth events.
CREATE OR REPLACE FUNCTION public.auth_events_recent(p_hours integer DEFAULT 24)
RETURNS TABLE (at timestamptz, user_id uuid, action text, instance_id uuid)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT a.at, a.user_id, a.action, a.instance_id
    FROM public.audit_log a
   WHERE a.entity_type = 'auth'
     AND a.at > now() - make_interval(hours => GREATEST(1, LEAST(COALESCE(p_hours, 24), 24 * 30)))
     AND a.instance_id IN (
           SELECT m.instance_id FROM public.instance_members m
            WHERE m.user_id = auth.uid() AND m.role IN ('owner', 'admin'))
   ORDER BY a.at DESC
   LIMIT 500
$$;

REVOKE ALL ON FUNCTION public.auth_events_recent(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.auth_events_recent(integer) TO authenticated;
