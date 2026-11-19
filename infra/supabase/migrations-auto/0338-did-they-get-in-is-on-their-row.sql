-- =============================================================================
-- 0338 — did they get in is on their row (DR-1592)
-- =============================================================================
-- Darrell, 2026-11-19: "How do I know who signed up and if and when they got
-- in?... how do we help people when they have onboarding issues?!!!!! We should
-- be able to see these issues from our data logs etc!!!!!"
--
-- WHAT WAS THERE, AND WHY IT DID NOT ANSWER. 0315 (DR-1336) records every
-- password and phone+PIN attempt in audit_log as 'login' or 'failed-auth'. Its
-- only reader, auth_events_recent, shows rows for instances the caller owns or
-- administers. A person with no space yet writes rows with instance_id NULL,
-- and those are exactly the people most likely to be stuck, so the record that
-- would have answered "did they get in" was invisible for them. And the rows
-- were shown on Endpoints & stores as a feed, never on the person.
--
-- WHAT THIS ADDS: admin_person_sign_ins(), for the governor circle only (the
-- poe-family gate of 0055 / 0259 / 0337). Per account, from real rows:
--   · last_sign_in_at: GoTrue's own stamp on auth.users, written on every
--     successful sign-in by ANY method (password, phone+PIN, Royalty Link,
--     Google). It does not move on a silent token refresh.
--   · link_sent_at: the later of auth.users.recovery_sent_at and
--     confirmation_sent_at, the moment GoTrue last sent this account a link or
--     code by email (a Royalty Link, a confirmation).
--   · from audit_log (0315), INCLUDING rows with instance_id NULL: the last
--     password success, the last failure, failures since the last success of
--     any kind, failures in 30 days.
--   · from GoTrue's own auth.audit_log_entries, when it exists and is readable:
--     the last 'login' and the provider it names (email, phone, google). Read
--     dynamically and fenced, so a database without it, or a role that cannot
--     read it, says so in `gotrue_audit` instead of failing the whole read.
--   · spaces: every space the person is a member of, with role and join time.
--   · open_invites: Poe Properties invitations addressed to this account's
--     address that nobody has claimed and nobody revoked.
-- And, top level, invites_without_account: unclaimed Poe Properties
-- invitations whose address has no account at all, the person who was asked
-- in and never made it to the door.
--
-- WHAT IS NOT RECORDED, said here so the screen can say it: a failed Royalty
-- Link (a wrong or expired code) writes no row; an attempt with a phone or
-- email that has no account writes no row (the password hook needs a user;
-- the next decision record decides that one).
--
-- PRIVACY: metadata about getting in only. No content from any space. Email
-- addresses go to the governor exactly as admin_signup_metrics already sends
-- them; the screen's Mask emails masks every new place they appear.
--
-- IDEMPOTENT: CREATE OR REPLACE FUNCTION, grants re-applied.
-- Smoke: infra/supabase/tests/0338-person-sign-ins-smoke.sql (ROLLS BACK).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.admin_person_sign_ins()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_caller      uuid := auth.uid();
  v_people      jsonb;
  v_since       timestamptz;
  v_gotrue      jsonb := '{}'::jsonb;   -- user_id -> {at, method}
  v_gotrue_note text := 'not present';
  v_invites     jsonb := '{}'::jsonb;   -- lower(email) -> [invite]
  v_orphans     jsonb := '[]'::jsonb;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'admin_person_sign_ins: not authenticated' USING ERRCODE = '28000';
  END IF;
  -- Gate first: SECURITY DEFINER reads auth.users and every person's auth rows.
  IF NOT EXISTS (
    SELECT 1 FROM instance_members im JOIN instances i ON i.id = im.instance_id
     WHERE im.user_id = v_caller AND i.slug = 'poe-family'
  ) THEN
    RAISE EXCEPTION 'admin_person_sign_ins: not authorized (poe-family governors only)' USING ERRCODE = '42501';
  END IF;

  SELECT min(a.at) INTO v_since FROM audit_log a WHERE a.entity_type = 'auth';

  -- GoTrue's own sign-in log: optional, fenced. 180 days, 'login' only.
  IF to_regclass('auth.audit_log_entries') IS NOT NULL THEN
    BEGIN
      EXECUTE $q$
        SELECT coalesce(jsonb_object_agg(uid, jsonb_build_object('at', at, 'method', method)), '{}'::jsonb)
          FROM (
            SELECT DISTINCT ON (e.payload->>'actor_id')
                   e.payload->>'actor_id' AS uid,
                   e.created_at AS at,
                   nullif(e.payload->'traits'->>'provider', '') AS method
              FROM auth.audit_log_entries e
             WHERE e.payload->>'action' = 'login'
               AND e.created_at > now() - interval '180 days'
               AND e.payload->>'actor_id' IS NOT NULL
             ORDER BY e.payload->>'actor_id', e.created_at DESC
          ) g
      $q$ INTO v_gotrue;
      v_gotrue_note := 'read';
    EXCEPTION WHEN OTHERS THEN
      v_gotrue := '{}'::jsonb;
      v_gotrue_note := 'unreadable: ' || SQLERRM;
    END;
  END IF;

  -- Poe Properties invitations nobody has claimed or revoked: optional, fenced.
  IF to_regclass('public.property_access_invites') IS NOT NULL THEN
    BEGIN
      EXECUTE $q$
        SELECT coalesce(jsonb_object_agg(addr, list), '{}'::jsonb)
          FROM (
            SELECT lower(pi.email) AS addr,
                   jsonb_agg(jsonb_build_object(
                     'id', pi.id, 'door', 'properties', 'role_label', pi.role_label,
                     'display_name', pi.display_name, 'created_at', pi.created_at)
                     ORDER BY pi.created_at DESC) AS list
              FROM public.property_access_invites pi
             WHERE pi.claimed_at IS NULL AND NOT pi.revoked
             GROUP BY lower(pi.email)
          ) g
      $q$ INTO v_invites;
    EXCEPTION WHEN OTHERS THEN
      v_invites := '{}'::jsonb;
    END;
  END IF;

  WITH acct AS (
    SELECT u.id, u.email, u.created_at, u.last_sign_in_at,
           GREATEST(u.recovery_sent_at, u.confirmation_sent_at) AS link_sent_at
      FROM auth.users u
  ),
  auth_rows AS (
    SELECT a.user_id,
           max(a.at) FILTER (WHERE a.action = 'login')       AS last_login_at,
           max(a.at) FILTER (WHERE a.action = 'failed-auth') AS last_failed_at,
           count(*)  FILTER (WHERE a.action = 'failed-auth' AND a.at > now() - interval '30 days')::int AS failed_30d
      FROM audit_log a
     WHERE a.entity_type = 'auth' AND a.user_id IS NOT NULL
     GROUP BY a.user_id
  ),
  shaped AS (
    SELECT ac.id, ac.email, ac.last_sign_in_at, ac.link_sent_at,
           ar.last_login_at, ar.last_failed_at, coalesce(ar.failed_30d, 0) AS failed_30d,
           (v_gotrue->(ac.id::text)->>'at')::timestamptz AS gotrue_login_at,
           v_gotrue->(ac.id::text)->>'method'            AS gotrue_method,
           GREATEST(ac.last_sign_in_at, ar.last_login_at, (v_gotrue->(ac.id::text)->>'at')::timestamptz) AS success_at
      FROM acct ac
      LEFT JOIN auth_rows ar ON ar.user_id = ac.id
  )
  SELECT coalesce(jsonb_agg(jsonb_build_object(
           'user_id',            s.id,
           'last_sign_in_at',    s.last_sign_in_at,
           'link_sent_at',       s.link_sent_at,
           'last_password_login_at', s.last_login_at,
           'last_failed_at',     s.last_failed_at,
           'failed_30d',         s.failed_30d,
           'failed_since_success', (
              SELECT count(*)::int FROM audit_log a
               WHERE a.entity_type = 'auth' AND a.action = 'failed-auth' AND a.user_id = s.id
                 AND (s.success_at IS NULL OR a.at > s.success_at)),
           'gotrue_login_at',    s.gotrue_login_at,
           'gotrue_method',      s.gotrue_method,
           'spaces', coalesce((
              SELECT jsonb_agg(jsonb_build_object(
                       'slug', i.slug, 'name', i.display_name, 'type', i.instance_type,
                       'role', im.role, 'joined_at', im.joined_at) ORDER BY im.joined_at)
                FROM instance_members im JOIN instances i ON i.id = im.instance_id
               WHERE im.user_id = s.id), '[]'::jsonb),
           'open_invites', coalesce(v_invites->lower(coalesce(s.email, '')), '[]'::jsonb)
         )), '[]'::jsonb)
    INTO v_people
    FROM shaped s;

  -- Invitations to an address with no account: asked in, never arrived.
  SELECT coalesce(jsonb_agg(inv || jsonb_build_object('address', k.addr) ORDER BY (inv->>'created_at') DESC), '[]'::jsonb)
    INTO v_orphans
    FROM jsonb_each(v_invites) AS k(addr, list)
    CROSS JOIN LATERAL jsonb_array_elements(k.list) AS inv
   WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE lower(u.email) = k.addr);

  RETURN jsonb_build_object(
    'generated_at', now(),
    'password_record_since', v_since,
    'gotrue_audit', v_gotrue_note,
    'people', v_people,
    'invites_without_account', v_orphans
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_person_sign_ins() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_person_sign_ins() TO authenticated;

DO $chk$
BEGIN
  IF to_regprocedure('public.admin_person_sign_ins()') IS NULL THEN
    RAISE EXCEPTION '0338: admin_person_sign_ins() is missing';
  END IF;
END
$chk$;

NOTIFY pgrst, 'reload schema';
